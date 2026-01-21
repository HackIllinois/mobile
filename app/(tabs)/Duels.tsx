import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, Pressable, StyleSheet, Dimensions, PermissionsAndroid, Platform, Image, ImageBackground, GestureResponderEvent } from 'react-native';

// Asset imports
const backgroundImage = require('../../assets/duels/duels-background.png');
const userShipImage = require('../../assets/duels/duels-ship-user.png');
const enemyShipImage = require('../../assets/duels/duels-ship-enemy.png');
const buttonImage = require('../../assets/duels/duels-button.png');
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LocalConnectionModule from '../../modules/local-connection';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ======================
// TYPES
// ======================
type Screen = 'home' | 'hosting' | 'browsing' | 'connected';
type Lobby = { endpointId: string; endpointName: string };
type Role = 'host' | 'guest';
type GamePhase = 'waiting' | 'playing' | 'win' | 'lose' | 'game_over';

type Ship = {
  x: number;        // 0-1 normalized
  y: number;        // 0-1 normalized
  angle: number;    // radians
  id: 'player' | 'opponent';
};

type Bullet = {
  id: string;
  x: number;
  y: number;
  angle: number;
  ownerId: 'player' | 'opponent';
};

type GameMessage = 
  | { type: 'ready'; screenRatio: number }
  | { type: 'start_game'; worldRatio: number }
  | { type: 'state'; x: number; y: number; angle: number; bullets: { id: string; x: number; y: number; angle: number }[] }
  | { type: 'hit'; victimId: string }
  | { type: 'restart' };

// ======================
// CONSTANTS
// ======================
const SHIP_SPEED = 0.25;        // units per second (normalized)
const ROTATION_SPEED = Math.PI; // radians per second
const BULLET_SPEED = 0.6;       // units per second
const SHIP_SIZE = 0.05;         // normalized
const BULLET_SIZE = 0.015;      // normalized
const SYNC_INTERVAL = 50;       // ms between state syncs
const SHIP_DISPLAY_SIZE = 40;   // pixels
const BULLET_DISPLAY_SIZE = 10; // pixels
const INTERPOLATION_SPEED = 12; // Higher = faster catch-up to target position
const MAX_AMMO = 3;             // Maximum bullets player can have
const RELOAD_TIME = 700;        // ms to reload one bullet

export default function Duels() {
  // ======================
  // CONNECTION STATE
  // ======================
  const [screen, setScreen] = useState<Screen>('home');
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [pendingInvite, setPendingInvite] = useState<Lobby | null>(null);
  const [connectedPeer, setConnectedPeer] = useState<string | null>(null);
  const [joiningLobby, setJoiningLobby] = useState<string | null>(null); // endpointId of lobby being joined
  const joinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // ======================
  // GAME STATE
  // ======================
  const [role, setRole] = useState<Role | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('waiting');
  const [guestRatio, setGuestRatio] = useState<number | null>(null);
  const [worldRatio, setWorldRatio] = useState<number>(1);
  
  const [myShip, setMyShip] = useState<Ship>({ x: 0.5, y: 0.5, angle: 0, id: 'player' });
  const [opponentShip, setOpponentShip] = useState<Ship>({ x: 0.5, y: 0.5, angle: 0, id: 'opponent' });
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [finalWinner, setFinalWinner] = useState<'player' | 'opponent' | null>(null);
  const [opponentTarget, setOpponentTarget] = useState<Ship>({ x: 0.5, y: 0.5, angle: 0, id: 'opponent' }); // Target for interpolation
  const [myBullets, setMyBullets] = useState<Bullet[]>([]);
  const [opponentBullets, setOpponentBullets] = useState<Bullet[]>([]);
  
  const [isRotating, setIsRotating] = useState(false);
  const [ammo, setAmmo] = useState(MAX_AMMO);
  const [reloading, setReloading] = useState(0); // Number of bullets currently reloading
  
  // Refs for game loop
  const myShipRef = useRef(myShip);
  const myBulletsRef = useRef(myBullets);
  const opponentShipRef = useRef(opponentShip);
  const opponentTargetRef = useRef(opponentTarget);
  const isRotatingRef = useRef(isRotating);
  const gamePhaseRef = useRef(gamePhase);
  
  // Keep refs in sync
  useEffect(() => { myShipRef.current = myShip; }, [myShip]);
  useEffect(() => { myBulletsRef.current = myBullets; }, [myBullets]);
  useEffect(() => { opponentShipRef.current = opponentShip; }, [opponentShip]);
  useEffect(() => { opponentTargetRef.current = opponentTarget; }, [opponentTarget]);
  useEffect(() => { isRotatingRef.current = isRotating; }, [isRotating]);
  useEffect(() => { gamePhaseRef.current = gamePhase; }, [gamePhase]);
  
  // Screen dimensions
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Calculate tab bar height (same formula as CurvedTabBar.tsx)
  const tabBarHeight = Math.max(screenHeight * 0.125, 55);
  
  // Game area dimensions - account for top safe area and tab bar
  const gameWidth = screenWidth;
  const gameHeight = screenHeight - insets.top - tabBarHeight;
  const screenRatio = screenWidth / gameHeight;

  // Generate random guest username
  const guestName = useMemo(() => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `guest-${randomNum}`;
  }, []);

  // ======================
  // GAME HELPERS
  // ======================
  const disconnect = () => {
    LocalConnectionModule.EndConnection();
    setRole(null);
    setGamePhase('waiting');
    setGuestRatio(null);
    setScreen('home');
  }

  // Dummy function that logs round results
  const onRoundEnd = (winner: 'player' | 'opponent', playerScore: number, opponentScoreVal: number) => {
    console.log('=== ROUND END ===');
    console.log(`Winner: ${winner}`);
    console.log(`Current Score - Player: ${playerScore}, Opponent: ${opponentScoreVal}`);
    console.log('=================');
  };

  const roundLost = () => {
    setOpponentScore(prev => {
      const newScore = prev + 1;
      onRoundEnd('opponent', myScore, newScore);
      return newScore;
    });
  }

  const roundWon = () => {
    setMyScore(prev => {
      const newScore = prev + 1;
      onRoundEnd('player', newScore, opponentScore);
      return newScore;
    });
  }

  const goBackToLobby = () => {
    setMyScore(0);
    setOpponentScore(0);
    setFinalWinner(null);
    setGamePhase('waiting');
    // Re-send ready message if guest
    if (role === 'guest') {
      const msg: GameMessage = { type: 'ready', screenRatio };
      LocalConnectionModule.sendData(JSON.stringify(msg));
    }
  }

  const finishGame = (winner: 'player' | 'opponent') => {
    setFinalWinner(winner);
    setGamePhase('game_over');
  }

  const resetGameState = useCallback(() => {
    // Host starts top-left, Guest starts bottom-right
    const startPos = role === 'host' 
      ? { x: 0.2, y: 0.2, angle: Math.PI / 4 }
      : { x: 0.8, y: 0.8, angle: -3 * Math.PI / 4 };
    
    const opponentStartPos = role === 'host'
      ? { x: 0.8, y: 0.8, angle: -3 * Math.PI / 4 }
      : { x: 0.2, y: 0.2, angle: Math.PI / 4 };
    
    setMyShip({ ...startPos, id: 'player' });
    setOpponentShip({ ...opponentStartPos, id: 'opponent' });
    setOpponentTarget({ ...opponentStartPos, id: 'opponent' });
    setMyBullets([]);
    setOpponentBullets([]);
    setAmmo(MAX_AMMO);
    setReloading(0);
  }, [role]);

  const shoot = useCallback(() => {
    if (ammo <= 0) return; // No ammo available
    
    const ship = myShipRef.current;
    const bullet: Bullet = {
      id: `${Date.now()}-${Math.random()}`,
      x: ship.x,
      y: ship.y,
      angle: ship.angle,
      ownerId: 'player'
    };
    setMyBullets(prev => [...prev, bullet]);
    setAmmo(prev => prev - 1);
    setReloading(prev => prev + 1);
    
    // Start reload timer for this bullet
    setTimeout(() => {
      setReloading(prev => prev - 1);
      setAmmo(prev => Math.min(prev + 1, MAX_AMMO));
    }, RELOAD_TIME);
  }, [ammo]);

  const checkBulletHit = (bullet: Bullet, ship: Ship): boolean => {
    const dx = Math.abs(bullet.x - ship.x);
    const dy = Math.abs(bullet.y - ship.y);
    return dx < (BULLET_SIZE + SHIP_SIZE) / 2 && dy < (BULLET_SIZE + SHIP_SIZE) / 2;
  };

  // ======================
  // CONNECTION PERMISSIONS
  // ======================
  useEffect(() => {
    const checkPermissions = async () => {
      if (Platform.OS === 'android') {
        const permissions = [];

        // Android 12+ (API 31+) requires these specific Bluetooth permissions
        if (Platform.Version >= 31) {
          permissions.push(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
          );
        }

        // Android 13+ (API 33+) requires NEARBY_WIFI_DEVICES
        if (Platform.Version >= 33) {
          permissions.push(PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES);
        }

        // Android 11 and below (and 12+ for legacy reasons) needs Location
        // AND specifically ACCESS_FINE_LOCATION (Coarse is not enough for Nearby)
        permissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);

        const result = await PermissionsAndroid.requestMultiple(permissions);
        
        // Log results to debug
        console.log("Permissions result:", result);
      }

      // Cleanup any zombie sessions
      LocalConnectionModule.EndConnection();
    };
    checkPermissions();
  }, []);

  // ======================
  // CONNECTION EVENTS
  // ======================
  useEffect(() => {
    const subscription = LocalConnectionModule.addListener('onChange', (event: any) => {
      // Try parsing as game message first
      if (event.type === 'data' && event.data) {
        try {
          const msg: GameMessage = JSON.parse(event.data);
          switch (msg.type) {
            case 'ready':
              // Host receives guest's screen ratio
              setGuestRatio(msg.screenRatio);
              break;
            case 'start_game':
              // Guest receives world ratio and starts
              setWorldRatio(msg.worldRatio);
              resetGameState();
              setGamePhase('playing');
              break;
            case 'state':
              // Update opponent target position (will be interpolated in game loop)
              setOpponentTarget(prev => ({ ...prev, x: msg.x, y: msg.y, angle: msg.angle }));
              setOpponentBullets(msg.bullets.map(b => ({ ...b, ownerId: 'opponent' as const })));
              break;
            case 'hit':
              roundLost();
              setGamePhase('lose');
              break;
            case 'restart':
              resetGameState();
              setGamePhase('playing');
              break;
          }
          return;
        } catch {
          // Not a game message, continue with connection events
        }
      }

      // Handle connection events
      switch (event.type) {
        case 'found':
          // Only add if not already in the list (prevent duplicates/ghost lobbies)
          setLobbies(prev => {
            const exists = prev.some(l => l.endpointId === event.endpointId);
            if (exists) return prev;
            return [...prev, { endpointId: event.endpointId, endpointName: event.endpointName }];
          });
          break;
        case 'lost':
          setLobbies(prev => prev.filter(l => l.endpointId !== event.endpointId));
          break;
        case 'invite':
          setPendingInvite({ endpointId: event.endpointId, endpointName: event.endpointName });
          break;
        case 'connected':
          // Clear join timeout and loading state on successful connection
          if (joinTimeoutRef.current) {
            clearTimeout(joinTimeoutRef.current);
            joinTimeoutRef.current = null;
          }
          setJoiningLobby(null);
          // Use endpointName (guest name) instead of peer (device name)
          setConnectedPeer(event.endpointName || event.peer);
          setScreen('connected');
          break;
        case 'rejected':
        case 'failed':
          // Clear join timeout and loading state on rejection/failure
          if (joinTimeoutRef.current) {
            clearTimeout(joinTimeoutRef.current);
            joinTimeoutRef.current = null;
          }
          setJoiningLobby(null);
          break;
        case 'disconnected':
          setConnectedPeer(null);
          setScreen('home');
          setGamePhase('waiting');
          setRole(null);
          setJoiningLobby(null);
          break;
      }
    });

    return () => subscription.remove();
  }, [resetGameState]);

  // Handle pending invite alerts (hosting screen)
  useEffect(() => {
    if (pendingInvite && screen === 'hosting') {
      Alert.alert(
        'Join Request',
        `${pendingInvite.endpointName} would like to join your lobby`,
        [
          { text: 'Decline', onPress: () => setPendingInvite(null) },
          {
            text: 'Accept',
            onPress: () => {
              LocalConnectionModule.acceptInvitation(pendingInvite.endpointId);
              setPendingInvite(null);
            }
          }
        ]
      );
    }
  }, [pendingInvite, screen]);

  // Guest sends ready message when connected
  useEffect(() => {
    if (screen === 'connected' && role === 'guest' && gamePhase === 'waiting') {
      const msg: GameMessage = { type: 'ready', screenRatio };
      LocalConnectionModule.sendData(JSON.stringify(msg));
    }
  }, [screen, role, gamePhase, screenRatio]);

  // ======================
  // GAME LOOP
  // ======================
  useEffect(() => {
    if (gamePhase !== 'playing') return;
    
    let lastTime = Date.now();
    let animationId: number;
    
    const loop = () => {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      
      if (gamePhaseRef.current !== 'playing') return;
      
      // 1. Update rotation if rotating
      if (isRotatingRef.current) {
        setMyShip(prev => ({
          ...prev,
          angle: prev.angle + ROTATION_SPEED * dt
        }));
      }
      
      // 2. Update my ship position (constant forward movement)
      setMyShip(prev => {
        let newX = prev.x + Math.cos(prev.angle) * SHIP_SPEED * dt;
        let newY = prev.y + Math.sin(prev.angle) * SHIP_SPEED * dt;
        
        // Border collision (stop at walls, don't bounce)
        newX = Math.max(0, Math.min(1, newX));
        newY = Math.max(0, Math.min(1, newY));
        
        return { ...prev, x: newX, y: newY };
      });
      
      // 3. Update my bullets
      setMyBullets(prev => {
        return prev
          .map(b => ({
            ...b,
            x: b.x + Math.cos(b.angle) * BULLET_SPEED * dt,
            y: b.y + Math.sin(b.angle) * BULLET_SPEED * dt,
          }))
          .filter(b => b.x >= 0 && b.x <= 1 && b.y >= 0 && b.y <= 1);
      });
      
      // 4. Interpolate opponent ship towards target position (smoothing)
      const target = opponentTargetRef.current;
      setOpponentShip(prev => {
        const lerpFactor = 1 - Math.exp(-INTERPOLATION_SPEED * dt);
        
        // Interpolate position
        const newX = prev.x + (target.x - prev.x) * lerpFactor;
        const newY = prev.y + (target.y - prev.y) * lerpFactor;
        
        // Interpolate angle (handle wraparound)
        let angleDiff = target.angle - prev.angle;
        // Normalize angle difference to [-PI, PI]
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        const newAngle = prev.angle + angleDiff * lerpFactor;
        
        return { ...prev, x: newX, y: newY, angle: newAngle };
      });
      
      // 5. Check collisions (my bullets vs opponent ship)
      const opponent = opponentShipRef.current;
      for (const bullet of myBulletsRef.current) {
        if (checkBulletHit(bullet, opponent)) {
          // I win!
          const hitMsg: GameMessage = { type: 'hit', victimId: 'opponent' };
          LocalConnectionModule.sendData(JSON.stringify(hitMsg));
          roundWon();
          setGamePhase('win');
          return;
        }
      }
      
      animationId = requestAnimationFrame(loop);
    };
    
    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [gamePhase]);

  // ======================
  // STATE SYNC
  // ======================
  useEffect(() => {
    if (gamePhase !== 'playing') return;
    
    const interval = setInterval(() => {
      const ship = myShipRef.current;
      const bullets = myBulletsRef.current;
      const msg: GameMessage = {
        type: 'state',
        x: ship.x,
        y: ship.y,
        angle: ship.angle,
        bullets: bullets.map(b => ({ id: b.id, x: b.x, y: b.y, angle: b.angle }))
      };
      LocalConnectionModule.sendData(JSON.stringify(msg));
    }, SYNC_INTERVAL);
    
    return () => clearInterval(interval);
  }, [gamePhase]);

  // ======================
  // WIN/LOSE & AUTO-RESTART
  // ======================
  useEffect(() => {
    if(myScore >= 3) {
      finishGame('player');
    } else if (opponentScore >= 3) {
      finishGame('opponent');
    }
  }, 
  [opponentScore, myScore]);

  useEffect(() => {
    if (gamePhase !== 'win' && gamePhase !== 'lose') return;
    
    const timeout = setTimeout(() => {
      if (role === 'host') {
        const msg: GameMessage = { type: 'restart' };
        LocalConnectionModule.sendData(JSON.stringify(msg));
      }
      resetGameState();
      setGamePhase('playing');
    }, 1500);
    
    return () => clearTimeout(timeout);
  }, [gamePhase, role, resetGameState]);

  // ======================
  // START GAME (HOST)
  // ======================
  const startGame = useCallback(() => {
    if (role !== 'host' || !guestRatio) return;
    
    const computedWorldRatio = Math.min(screenRatio, guestRatio);
    setWorldRatio(computedWorldRatio);
    
    const msg: GameMessage = { type: 'start_game', worldRatio: computedWorldRatio };
    LocalConnectionModule.sendData(JSON.stringify(msg));
    
    resetGameState();
    setGamePhase('playing');
  }, [role, guestRatio, screenRatio, resetGameState]);

  // ======================
  // RENDER SCREENS
  // ======================
  
  // Home screen
  if (screen === 'home') {
    return (
      <ImageBackground source={backgroundImage} style={styles.container} resizeMode="cover">
        <Text style={styles.title}>DUELS</Text>
        <Text style={styles.subtitle}>Playing as: {guestName}</Text>
        <Pressable
          style={styles.menuButton}
          onPress={() => {
            LocalConnectionModule.InitPeerName(guestName);
            LocalConnectionModule.startAdvertising();
            setRole('host');
            setScreen('hosting');
          }}
        >
          <Text style={styles.menuButtonText}>HOST LOBBY</Text>
        </Pressable>
        <View style={{ height: 15 }} />
        <Pressable
          style={styles.menuButton}
          onPress={() => {
            LocalConnectionModule.InitPeerName(guestName);
            LocalConnectionModule.startScanning();
            setRole('guest');
            setScreen('browsing');
          }}
        >
          <Text style={styles.menuButtonText}>JOIN LOBBY</Text>
        </Pressable>
      </ImageBackground>
    );
  }

  // Hosting screen
  if (screen === 'hosting') {
    return (
      <ImageBackground source={backgroundImage} style={styles.container} resizeMode="cover">
        <Text style={styles.title}>HOSTING</Text>
        <Text style={styles.subtitle}>Lobby: {guestName}</Text>
        <Text style={styles.waitingText}>Waiting for players...</Text>
        <View style={{ height: 20 }} />
        <Pressable
          style={styles.cancelButton}
          onPress={() => {
            LocalConnectionModule.stopAdvertising();
            setRole(null);
            setScreen('home');
          }}
        >
          <Text style={styles.cancelButtonText}>STOP HOSTING</Text>
        </Pressable>
      </ImageBackground>
    );
  }

  // Browsing screen
  if (screen === 'browsing') {
    const handleJoinLobby = (endpointId: string) => {
      if (joiningLobby) return; // Already joining a lobby
      
      setJoiningLobby(endpointId);
      LocalConnectionModule.joinRoom(endpointId);
      
      // Set 15 second timeout
      joinTimeoutRef.current = setTimeout(() => {
        setJoiningLobby(null);
        joinTimeoutRef.current = null;
      }, 15000);
    };

    return (
      <ImageBackground source={backgroundImage} style={[styles.container, { justifyContent: 'flex-start', paddingTop: insets.top + 40 }]} resizeMode="cover">
        <Text style={styles.title}>LOBBIES</Text>
        {joiningLobby && (
          <Text style={styles.waitingText}>Joining lobby...</Text>
        )}
        <FlatList
          data={lobbies}
          keyExtractor={(item) => item.endpointId}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.lobbyItem,
                joiningLobby && styles.lobbyItemDisabled,
                joiningLobby === item.endpointId && styles.lobbyItemJoining
              ]}
              onPress={() => handleJoinLobby(item.endpointId)}
              disabled={!!joiningLobby}
            >
              <Text style={styles.lobbyItemText}>
                {item.endpointName}
                {joiningLobby === item.endpointId && ' (joining...)'}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.waitingText}>Searching...</Text>}
          style={{ flex: 1, width: '100%' }}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        />
        <Pressable
          style={styles.cancelButton}
          onPress={() => {
            // Clear any pending join timeout
            if (joinTimeoutRef.current) {
              clearTimeout(joinTimeoutRef.current);
              joinTimeoutRef.current = null;
            }
            setJoiningLobby(null);
            LocalConnectionModule.stopScanning();
            setLobbies([]);
            setRole(null);
            setScreen('home');
          }}
        >
          <Text style={styles.cancelButtonText}>BACK</Text>
        </Pressable>
        <View style={{ height: insets.bottom + 20 }} />
      </ImageBackground>
    );
  }

  // Connected screen - Waiting or Playing
  if (screen === 'connected') {
    // Waiting phase - show start button for host, waiting message for guest
    if (gamePhase === 'waiting') {
      return (
        <ImageBackground source={backgroundImage} style={styles.container} resizeMode="cover">
          <Text style={styles.title}>CONNECTED</Text>
          <Text style={styles.subtitle}>Opponent: {connectedPeer}</Text>
          <View style={{ height: 30 }} />
          {role === 'host' ? (
            guestRatio ? (
              <Pressable style={styles.startButton} onPress={startGame}>
                <Text style={styles.startButtonText}>START GAME</Text>
              </Pressable>
            ) : (
              <Text style={styles.waitingText}>Waiting for opponent to be ready...</Text>
            )
          ) : (
            <Text style={styles.waitingText}>Waiting for host to start...</Text>
          )}
          <View style={{ height: 30 }} />
          <Pressable
            style={styles.cancelButton}
            onPress={disconnect}
          >
            <Text style={styles.cancelButtonText}>DISCONNECT</Text>
          </Pressable>
        </ImageBackground>
      );
    }

    // Game Over phase - show final result with back to lobby button
    if (gamePhase === 'game_over') {
      const isWinner = finalWinner === 'player';
      return (
        <ImageBackground source={backgroundImage} style={styles.container} resizeMode="cover">
          <Text style={[styles.gameOverTitle, isWinner ? styles.winText : styles.loseText]}>
            {isWinner ? 'VICTORY!' : 'DEFEAT!'}
          </Text>
          <Text style={styles.finalScoreText}>
            Final Score: {myScore} - {opponentScore}
          </Text>
          <View style={{ height: 30 }} />
          <Pressable style={styles.startButton} onPress={goBackToLobby}>
            <Text style={styles.startButtonText}>BACK TO LOBBY</Text>
          </Pressable>
          <View style={{ height: 20 }} />
          <Pressable style={styles.cancelButton} onPress={disconnect}>
            <Text style={styles.cancelButtonText}>DISCONNECT</Text>
          </Pressable>
        </ImageBackground>
      );
    }

    // Playing phase (or win/lose)
    return (
      <ImageBackground source={backgroundImage} style={[styles.gameContainer, { paddingTop: insets.top }]} resizeMode="cover">
        {/* Win/Lose overlay */}
        {(gamePhase === 'win' || gamePhase === 'lose') && (
          <View style={styles.overlay}>
            <Text style={[styles.overlayText, gamePhase === 'win' ? styles.winText : styles.loseText]}>
              {gamePhase === 'win' ? 'YOU WIN!' : 'YOU LOSE!'}
            </Text>
            <Text style={styles.scoreText}>
              {myScore} - {opponentScore}
            </Text>
          </View>
        )}
        
        {/* Game area */}
        <View style={styles.gameArea}>
          {/* My ship */}
          <Image
            source={userShipImage}
            style={[
              styles.ship,
              {
                left: myShip.x * gameWidth - SHIP_DISPLAY_SIZE / 2,
                top: myShip.y * gameHeight - SHIP_DISPLAY_SIZE / 2,
                transform: [{ rotate: `${myShip.angle + Math.PI / 2}rad` }]
              }
            ]}
            resizeMode="contain"
          />
          
          {/* Opponent ship */}
          <Image
            source={enemyShipImage}
            style={[
              styles.ship,
              {
                left: opponentShip.x * gameWidth - SHIP_DISPLAY_SIZE / 2,
                top: opponentShip.y * gameHeight - SHIP_DISPLAY_SIZE / 2,
                transform: [{ rotate: `${opponentShip.angle + Math.PI / 2}rad` }]
              }
            ]}
            resizeMode="contain"
          />
          
          {/* My bullets */}
          {myBullets.map(b => (
            <View
              key={b.id}
              style={[
                styles.bullet,
                styles.myBullet,
                {
                  left: b.x * gameWidth - BULLET_DISPLAY_SIZE / 2,
                  top: b.y * gameHeight - BULLET_DISPLAY_SIZE / 2,
                }
              ]}
            />
          ))}
          
          {/* Opponent bullets */}
          {opponentBullets.map(b => (
            <View
              key={b.id}
              style={[
                styles.bullet,
                styles.opponentBullet,
                {
                  left: b.x * gameWidth - BULLET_DISPLAY_SIZE / 2,
                  top: b.y * gameHeight - BULLET_DISPLAY_SIZE / 2,
                }
              ]}
            />
          ))}
        </View>
        
        {/* Multitouch Controls Container */}
        <View 
          style={styles.controlsContainer}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e: GestureResponderEvent) => {
            const touches = e.nativeEvent.touches;
            let shootPressed = false;
            let rotatePressed = false;
            
            for (let i = 0; i < touches.length; i++) {
              const touch = touches[i];
              if (touch.pageX < screenWidth / 2) {
                shootPressed = true;
              } else {
                rotatePressed = true;
              }
            }
            
            if (shootPressed) shoot();
            if (rotatePressed) setIsRotating(true);
          }}
          onResponderMove={(e: GestureResponderEvent) => {
            const touches = e.nativeEvent.touches;
            let rotatePressed = false;
            
            for (let i = 0; i < touches.length; i++) {
              const touch = touches[i];
              if (touch.pageX >= screenWidth / 2) {
                rotatePressed = true;
              }
            }
            
            setIsRotating(rotatePressed);
          }}
          onResponderRelease={(e: GestureResponderEvent) => {
            // Check remaining touches
            const touches = e.nativeEvent.touches;
            let rotatePressed = false;
            
            for (let i = 0; i < touches.length; i++) {
              const touch = touches[i];
              if (touch.pageX >= screenWidth / 2) {
                rotatePressed = true;
              }
            }
            
            setIsRotating(rotatePressed);
          }}
          onResponderTerminate={() => {
            setIsRotating(false);
          }}
        >
          {/* Shoot Button (Left) */}
          <View style={styles.shootButtonContainer}>
            <Image source={buttonImage} style={styles.buttonImage} resizeMode="stretch" />
          </View>
          
          {/* Ammo indicator */}
          <View style={styles.ammoContainerCenter}>
            <Text style={styles.ammoText}>{ammo}/{MAX_AMMO}</Text>
            {reloading > 0 && (
              <Text style={styles.reloadingText}>reloading...</Text>
            )}
          </View>
          
          {/* Rotate Button (Right) */}
          <View style={styles.rotateButtonContainer}>
            <Image source={buttonImage} style={[styles.buttonImage, styles.buttonImageFlipped]} resizeMode="stretch" />
          </View>
        </View>
      </ImageBackground>
    );
  }

  return null;
}

// ======================
// STYLES
// ======================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 25,
    fontWeight: '900',
    color: '#ffffffff',
    marginBottom: 10,
    fontFamily: "Tsukimi-Rounded-Bold"
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 20,
  },
  waitingText: {
    fontSize: 14,
    color: '#ffffff',
    fontStyle: 'italic',
  },
  menuButton: {
    width: '80%',
    backgroundColor: '#4a1a6b',
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#6b2d9e',
    shadowColor: '#8b3dc7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  menuButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderWidth: 2,
    borderColor: '#6b2d9e',
    backgroundColor: '#4a1a6b',
    borderRadius: 4,
    shadowColor: '#8b3dc7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  startButton: {
    backgroundColor: '#4a1a6b',
    paddingVertical: 20,
    paddingHorizontal: 50,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#6b2d9e',
    shadowColor: '#8b3dc7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 3,
  },
  lobbyItem: {
    backgroundColor: '#4a1a6b',
    padding: 18,
    marginVertical: 6,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#8b3dc7',
    borderWidth: 2,
    borderColor: '#6b2d9e',
  },
  lobbyItemText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  lobbyItemDisabled: {
    opacity: 0.5,
  },
  lobbyItemJoining: {
    opacity: 1,
    borderColor: '#8b3dc7',
    borderWidth: 3,
  },
  gameOverTitle: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 5,
    marginBottom: 20,
    fontFamily: "Tsukimi-Rounded-Bold"
  },
  gameOverSubtitle: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  finalScoreText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 2,
  },
  gameContainer: {
    flex: 1,
  },
  gameArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  ship: {
    position: 'absolute',
    width: SHIP_DISPLAY_SIZE,
    height: SHIP_DISPLAY_SIZE,
  },
  bullet: {
    position: 'absolute',
    width: BULLET_DISPLAY_SIZE,
    height: BULLET_DISPLAY_SIZE,
    borderRadius: BULLET_DISPLAY_SIZE / 2,
  },
  myBullet: {
    backgroundColor: '#0077ffff',
    shadowColor: '#0051ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  opponentBullet: {
    backgroundColor: '#ff3366',
    shadowColor: '#ff3366',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shootButtonContainer: {
    width: 140,
    height: 120,
    opacity: 0.7,
    overflow: 'hidden',
  },
  rotateButtonContainer: {
    width: 140,
    height: 120,
    opacity: 0.7,
    overflow: 'hidden',
  },
  ammoContainerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  buttonImageFlipped: {
    transform: [{ scaleX: -1 }],
  },
  shootButton: {
    left: 0,
  },
  rotateButton: {
    right: 0,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  controlButtonTextActive: {
    color: '#00f5ff',
  },
  controlButtonTextDisabled: {
    color: '#888',
  },
  ammoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ammoText: {
    color: '#ffffffff',
    fontSize: 24,
    fontWeight: '700',
    textShadowColor: '#ffffffff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  reloadingText: {
    color: '#888',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  overlayText: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 5,
  },
  winText: {
    color: '#39ff14',
  },
  loseText: {
    color: '#ff3366',
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20, 
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
