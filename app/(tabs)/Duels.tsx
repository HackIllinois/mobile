import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, Pressable, StyleSheet, Dimensions, PermissionsAndroid, Platform, Image, ImageBackground, GestureResponderEvent, Modal, Animated } from 'react-native';

// Asset imports
const backgroundImage = require('../../assets/duels/duels-background.png');
const userShipImage = require('../../assets/duels/duels-ship-user.png');
const enemyShipImage = require('../../assets/duels/duels-ship-enemy.png');
const buttonImage = require('../../assets/duels/duels-button.png');
const bulletImage = require('../../assets/duels/duels-bullet.png');
const tutorialImage1 = require('../../assets/duels/duels-controls-1.png');
const tutorialImage2 = require('../../assets/duels/duels-controls-2.png');
const tutorialImage3 = require('../../assets/duels/duels-controls-3.png');
const sawbladeImage = require('../../assets/duels/duels-sawblade.png');
import LogoutButtonSvg from '../../assets/profile/profile-screen/logout-button.svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api';

// ======================
// LOBBY BUTTON COMPONENT
// ======================
function LobbyButton({ label, onPress, disabled, accentColor }: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accentColor: string;
}) {
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.8, duration: 1000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[lobbyButtonStyles.glow, { shadowOpacity: glowAnim }, disabled && { opacity: 0.5 }]}>
      <Pressable
        style={[lobbyButtonStyles.button, { backgroundColor: accentColor }]}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={lobbyButtonStyles.text}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const lobbyButtonStyles = StyleSheet.create({
  glow: {
    width: '80%',
    borderRadius: 999,
    shadowColor: '#b464ff',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 14,
    elevation: 10,
  },
  button: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(180, 100, 255, 0.9)',
    overflow: 'hidden',
  },
  text: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Tsukimi Rounded',
    fontWeight: '700',
    letterSpacing: 3,
    zIndex: 2,
  },
});

// Lazy import to prevent blocking route discovery
let LocalConnectionModule: any;
try {
  LocalConnectionModule = require('../../modules/local-connection').default;
} catch (e) {
  console.warn('LocalConnectionModule not available:', e);
  // Create a mock module for development
  LocalConnectionModule = {
    InitPeerName: () => {},
    getOpponentName: () => null,
    setConnectionMedium: () => {},
    startAdvertising: () => {},
    startScanning: () => {},
    stopAdvertising: () => {},
    stopScanning: () => {},
    joinRoom: () => {},
    acceptInvitation: () => {},
    EndConnection: () => {},
    sendData: async () => {},
    addListener: () => ({ remove: () => {} }),
  };
}

// ======================
// TYPES
// ======================
type Screen = 'home' | 'hosting' | 'browsing' | 'connected';
type Lobby = { endpointId: string; endpointName: string };
type Role = 'host' | 'guest';
type GamePhase = 'waiting' | 'tutorial' | 'playing' | 'win' | 'lose' | 'tie' | 'waiting_result' | 'game_over';

type Ship = {
  x: number;        // 0-1 normalized
  y: number;        // 0-1 normalized
  angle: number;    // radians
  id: 'player' | 'opponent';
};

type Bullet = {
  id: string;
  x: number;        // current position
  y: number;        // current position
  angle: number;    // direction of travel
  spawnTime: number; // timestamp when bullet was created (for local simulation)
  startX: number;   // initial spawn X
  startY: number;   // initial spawn Y
  ownerId: 'player' | 'opponent';
};

type Powerup = {
  x: number;        // 0-1 normalized
  y: number;        // 0-1 normalized
  active: boolean;  // whether the powerup is visible/collectible
};

type GameMessage = 
  | { type: 'ready'; screenRatio: number; userId: string }
  | { type: 'start_game'; worldRatio: number }
  | { type: 'state'; x: number; y: number; angle: number; hostScore?: number; guestScore?: number; obstaclePhase?: number }
  | { type: 'bullet'; id: string; x: number; y: number; angle: number; spawnTime: number }
  | { type: 'hit'; victimId: string }
  | { type: 'round_result'; winner: 'host' | 'guest' | 'tie' }
  | { type: 'round_ack' }
  | { type: 'game_over'; winner: 'host' | 'guest' }
  | { type: 'restart' }
  | { type: 'start_tutorial'; duelId: string }
  | { type: 'tutorial_complete' };

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
const BULLET_DISPLAY_SIZE = 25; // pixels (increased for image)
const INTERPOLATION_SPEED = 12; // Higher = faster catch-up to target position
const MAX_AMMO = 3;             // Maximum bullets player can have
const RELOAD_TIME = 1500;       // ms to reload one bullet
const TIE_WINDOW = 50;         // ms window to consider simultaneous hits as a tie
const BORDER_MARGIN_PX = 5;    // Keep ships away from screen edges (in pixels)
const OBSTACLE_SIZE = 0.05;        // normalized (same as SHIP_SIZE)
const OBSTACLE_SPEED = 0.3;        // normalized units per second
const OBSTACLE_DISPLAY_SIZE = 40;  // pixels

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
  const [guestUserId, setGuestUserId] = useState<string | null>(null);
  const [duelId, setDuelId] = useState<string | null>(null);
  const [worldRatio, setWorldRatio] = useState<number>(1);
  
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [finalWinner, setFinalWinner] = useState<'player' | 'opponent' | null>(null);

  // Render tick - increment at ~30fps to trigger renders for ref-based game state
  const [, setRenderTick] = useState(0);

  const [isRotating, setIsRotating] = useState(false);
  const [ammo, setAmmo] = useState(MAX_AMMO);
  const [reloading, setReloading] = useState(0); // Number of bullets currently reloading
  
  // Tutorial State
  const [tutorialStep, setTutorialStep] = useState(0); // 0, 1, 2 = showing images, 3 = finished
  const [opponentFinishedTutorial, setOpponentFinishedTutorial] = useState(false);
  
  // Handshake state for reliable restarts
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [guestReadyToRestart, setGuestReadyToRestart] = useState(false);



  // Refs for game loop (these are the source of truth for per-frame game state)
  const myShipRef = useRef<Ship>({ x: 0.5, y: 0.5, angle: 0, id: 'player' });
  const myBulletsRef = useRef<Bullet[]>([]);
  const opponentShipRef = useRef<Ship>({ x: 0.5, y: 0.5, angle: 0, id: 'opponent' });
  const opponentTargetRef = useRef<Ship>({ x: 0.5, y: 0.5, angle: 0, id: 'opponent' });
  const opponentBulletsRef = useRef<Bullet[]>([]);
  const obstacleRef = useRef({ x: 0.5, y: 0.0, phase: 0, rotation: 0 });
  const isRotatingRef = useRef(isRotating);
  const gamePhaseRef = useRef(gamePhase);
  const myScoreRef = useRef(myScore);
  const opponentScoreRef = useRef(opponentScore);
  const duelIdRef = useRef(duelId);
  const ammoRef = useRef(ammo);

  
  // Refs for tie detection timing
  // We track a pending result to allow for tie detection window
  type PendingResult = {
    winner: 'host' | 'guest';
    timestamp: number;
    processed: boolean; // to avoid re-triggering logic
  };
  const pendingResultRef = useRef<PendingResult | null>(null);

  // Refs for ammo reload cleanup
  const reloadTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  
  // Keep non-game refs in sync with their state
  useEffect(() => {
    isRotatingRef.current = isRotating;
    gamePhaseRef.current = gamePhase;
    myScoreRef.current = myScore;
    opponentScoreRef.current = opponentScore;
    duelIdRef.current = duelId;
    ammoRef.current = ammo;
  });
  
  // Screen dimensions
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Calculate tab bar height (same formula as CurvedTabBar.tsx)
  const tabBarHeight = Math.max(screenHeight * 0.125, 55);
  
  // Game area dimensions - account for top safe area and tab bar
  const gameWidth = screenWidth;
  const gameHeight = screenHeight - insets.top - tabBarHeight;
  const screenRatio = screenWidth / gameHeight;
  
  // Calculate border margins as normalized values (pixels / dimension)
  const borderMarginX = BORDER_MARGIN_PX / gameWidth;
  const borderMarginY = BORDER_MARGIN_PX / gameHeight;

  // Profile state - fetch displayName and userId from API
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response: any = await api.get('/profile/');
        if (response?.data?.displayName) {
          setDisplayName(response.data.displayName);
        }
        if (response?.data?.userId) {
          setUserId(response.data.userId);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // ======================
  // GAME HELPERS
  // ======================
  const disconnect = () => {
    LocalConnectionModule.EndConnection();
    setRole(null);
    setGamePhase('waiting');
    setGuestRatio(null);
    setGuestUserId(null);
    setDuelId(null);
    setTutorialStep(0);
    setOpponentFinishedTutorial(false);
    setMyScore(0);
    setOpponentScore(0);
    setFinalWinner(null);
    setScreen('home');
  }

  const roundLost = () => setOpponentScore(prev => prev + 1);
  const roundWon = () => setMyScore(prev => prev + 1);

  const goBackToLobby = () => {
    setMyScore(0);
    setOpponentScore(0);
    setFinalWinner(null);
    setGamePhase('waiting');
    setTutorialStep(0);
    setOpponentFinishedTutorial(false);
    // Re-send ready message if guest
    if (role === 'guest' && userId) {
      const msg: GameMessage = { type: 'ready', screenRatio, userId };
      LocalConnectionModule.sendData(JSON.stringify(msg));
    }
  }

  const finishGame = (winner: 'player' | 'opponent') => {
    setFinalWinner(winner);
    setGamePhase('game_over');
  }

  const resetGameState = useCallback(() => {
    // Clear any pending reload timeouts
    reloadTimeoutsRef.current.forEach(clearTimeout);
    reloadTimeoutsRef.current = [];
    
    // Clear pending results
    pendingResultRef.current = null;
    
    // Reset handshake state
    setMinTimeElapsed(false);
    setGuestReadyToRestart(false);

    // Host starts top-left, Guest starts bottom-right
    const startPos = role === 'host' 
      ? { x: 0.2, y: 0.2, angle: Math.PI / 4 }
      : { x: 0.8, y: 0.8, angle: -3 * Math.PI / 4 };
    
    const opponentStartPos = role === 'host'
      ? { x: 0.8, y: 0.8, angle: -3 * Math.PI / 4 }
      : { x: 0.2, y: 0.2, angle: Math.PI / 4 };
    
    myShipRef.current = { ...startPos, id: 'player' };
    opponentShipRef.current = { ...opponentStartPos, id: 'opponent' };
    opponentTargetRef.current = { ...opponentStartPos, id: 'opponent' };
    myBulletsRef.current = [];
    opponentBulletsRef.current = [];
    setAmmo(MAX_AMMO);
    setReloading(0);
    setIsRotating(false);
    obstacleRef.current = { x: 0.5, y: 0.0, phase: 0, rotation: 0 };


  }, [role]);

  const shoot = useCallback(() => {
    if (ammoRef.current <= 0) return; // No ammo available

    const ship = myShipRef.current;
    const now = Date.now();

    const bullet: Bullet = {
      id: `${now}-${Math.random()}`,
      x: ship.x,
      y: ship.y,
      angle: ship.angle,
      spawnTime: now,
      startX: ship.x,
      startY: ship.y,
      ownerId: 'player'
    };
    myBulletsRef.current = [...myBulletsRef.current, bullet];
    setAmmo(prev => prev - 1);
    setReloading(prev => prev + 1);

    // Send bullet spawn to opponent (only initial data, they simulate locally)
    const bulletMsg: GameMessage = {
      type: 'bullet',
      id: bullet.id,
      x: bullet.startX,
      y: bullet.startY,
      angle: bullet.angle,
      spawnTime: bullet.spawnTime
    };
    LocalConnectionModule.sendData(JSON.stringify(bulletMsg));

    // Start reload timer for this bullet
    const timeoutId = setTimeout(() => {
      setReloading(prev => prev - 1);
      setAmmo(prev => Math.min(prev + 1, MAX_AMMO));

      // Remove this timeout from the ref list
      reloadTimeoutsRef.current = reloadTimeoutsRef.current.filter(id => id !== timeoutId);
    }, RELOAD_TIME);

    reloadTimeoutsRef.current.push(timeoutId);
  }, []);

  const reportRoundToBackend = useCallback((winner: 'host' | 'guest' | 'tie') => {
    const currentDuelId = duelIdRef.current;
    if (!currentDuelId) return;
    const hostScore = winner === 'host' ? myScoreRef.current + 1 : myScoreRef.current;
    const guestScore = winner === 'guest' ? opponentScoreRef.current + 1 : opponentScoreRef.current;
    console.log(`HOST MADE PUT CALL TO DUEL WITH ID: ${currentDuelId}`);
    api.put(`/duel/${currentDuelId}`, {
      hostScore,
      guestScore,
      hostHasDisconnected: false,
      guestHasDisconnected: false,
      hasFinished: hostScore >= 3 || guestScore >= 3,
    }).catch(error => { console.error('Failed to update duel:', error); });
  }, []); // only uses refs, no deps needed

  const reportRoundToBackendRef = useRef(reportRoundToBackend);
  useEffect(() => { reportRoundToBackendRef.current = reportRoundToBackend; }, [reportRoundToBackend]);

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
              // Host receives guest's screen ratio and userId
              setGuestRatio(msg.screenRatio);
              setGuestUserId(msg.userId);
              break;
            case 'start_game':
              // Guest receives world ratio and starts
              setWorldRatio(msg.worldRatio);
              setMyScore(0);
              setOpponentScore(0);
              resetGameState();
              setGamePhase('playing');
              break;
            case 'state':
              // NaN guard — reject corrupt state messages
              if (isNaN(msg.x) || isNaN(msg.y) || isNaN(msg.angle)) break;

              // Implicit Restart: If we are stuck in a post-game screen but receiving live game state,
              // it means we missed the 'restart' message. Sync up immediately.
              // (waiting_result is NOT included here — the 5s timeout handles that recovery)
              if (role === 'guest' && (gamePhaseRef.current === 'win' || gamePhaseRef.current === 'lose' || gamePhaseRef.current === 'tie')) {
                 resetGameState();
                 setGamePhase('playing');
              }

              // Update opponent target position (will be interpolated in game loop)
              opponentTargetRef.current = { ...opponentTargetRef.current, x: msg.x, y: msg.y, angle: msg.angle };

              if (role === 'guest') {
                if (msg.hostScore !== undefined) setOpponentScore(msg.hostScore);
                if (msg.guestScore !== undefined) setMyScore(msg.guestScore);
                // Sync obstacle phase from host
                if (msg.obstaclePhase !== undefined) {
                  const obs = obstacleRef.current;
                  obstacleRef.current = { ...obs, phase: msg.obstaclePhase, y: (1 - Math.cos(msg.obstaclePhase)) / 2 };
                }
              }
              break;
            case 'bullet':
              // Implicit Restart check for bullet messages too
              if (role === 'guest' && (gamePhaseRef.current === 'win' || gamePhaseRef.current === 'lose' || gamePhaseRef.current === 'tie')) {
                 resetGameState();
                 setGamePhase('playing');
              }

              // Opponent fired a bullet - add it with initial data for local simulation
              if (!opponentBulletsRef.current.some(b => b.id === msg.id)) {
                opponentBulletsRef.current = [...opponentBulletsRef.current, {
                  id: msg.id,
                  x: msg.x,
                  y: msg.y,
                  angle: msg.angle,
                  spawnTime: msg.spawnTime,
                  startX: msg.x,
                  startY: msg.y,
                  ownerId: 'opponent' as const
                }];
              }


              break;
            case 'hit':
              // Host receives hit confirmation from Guest
               if (role === 'host' && msg.victimId === 'guest') {
                  roundWon();
                  setGamePhase('win');
                  const resultMsg: GameMessage = { type: 'round_result', winner: 'host' };
                  LocalConnectionModule.sendData(JSON.stringify(resultMsg));
                  reportRoundToBackend('host');
               }
              break;
            case 'round_result':
              // Guest receives authoritative result from host
              if (role === 'guest') {
                // Prevent duplicate score increments if we already processed this result
                const currentPhase = gamePhaseRef.current;
                if (currentPhase === 'win' || currentPhase === 'lose' || currentPhase === 'tie') {
                   // Just acknowledge again, don't change state or score
                } else {
                    if (msg.winner === 'tie') {
                        setGamePhase('tie');
                    } else if (msg.winner === 'guest') {
                        // Guest won
                        roundWon();
                        setGamePhase('win');
                    } else {
                        // Host won, so guest lost
                        roundLost();
                        setGamePhase('lose');
                    }

                    // Guest reports round result to backend
                    const currentDuelId = duelIdRef.current;
                    if (currentDuelId) {
                        const hostScore = msg.winner === 'host' ? opponentScoreRef.current + 1 : opponentScoreRef.current;
                        const guestScore = msg.winner === 'guest' ? myScoreRef.current + 1 : myScoreRef.current;
                        console.log(`GUEST MADE PUT CALL TO DUEL WITH ID: ${currentDuelId}`);
                        api.put(`/duel/${currentDuelId}`, {
                            hostScore,
                            guestScore,
                            hostHasDisconnected: false,
                            guestHasDisconnected: false,
                            hasFinished: hostScore >= 3 || guestScore >= 3,
                        }).catch(error => {
                            console.error('Failed to update duel:', error);
                        });
                    }
                }
                
                // Acknowledge receipt so host knows we are ready for next round
                const ackMsg: GameMessage = { type: 'round_ack' };
                setTimeout(() => {
                    LocalConnectionModule.sendData(JSON.stringify(ackMsg));
                }, 50); // Small delay to ensure state update processes
              }
              break;
            case 'round_ack':
              // Host receives acknowledgement from guest
              if (role === 'host') {
                setGuestReadyToRestart(true);
              }
              break;
            case 'game_over':
              // Guest receives game over message
              if (role === 'guest') {
                finishGame(msg.winner === 'host' ? 'opponent' : 'player');
              }
              break;
            case 'restart':
              resetGameState();
              setGamePhase('playing');
              break;
            case 'start_tutorial':
              setDuelId(msg.duelId);
              resetGameState();
              setTutorialStep(0);
              setGamePhase('tutorial');
              break;
            case 'tutorial_complete':
              setOpponentFinishedTutorial(true);
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
  }, [resetGameState, role]); // Added role to dependencies

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
    if (screen === 'connected' && role === 'guest' && gamePhase === 'waiting' && userId) {
      const msg: GameMessage = { type: 'ready', screenRatio, userId };
      LocalConnectionModule.sendData(JSON.stringify(msg));
    }
  }, [screen, role, gamePhase, screenRatio, userId]);

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

      // 1. Update rotation + position in one step
      const ship = myShipRef.current;
      let newAngle = ship.angle;
      if (isRotatingRef.current) {
        newAngle = ship.angle + ROTATION_SPEED * dt;
      }

      let newX = ship.x + Math.cos(newAngle) * SHIP_SPEED * dt;
      let newY = ship.y + Math.sin(newAngle) * SHIP_SPEED * dt;

      // Border collision (stop at walls, don't bounce)
      newX = Math.max(borderMarginX, Math.min(1 - borderMarginX, newX));
      newY = Math.max(borderMarginY, Math.min(1 - borderMarginY, newY));

      // NaN guard
      if (isNaN(newX)) newX = 0.5;
      if (isNaN(newY)) newY = 0.5;

      myShipRef.current = { ...ship, x: newX, y: newY, angle: newAngle };

      // 2. Helper to update and filter bullets (despawn when fully off-screen)
      const updateBullets = (bullets: Bullet[]) =>
        bullets
          .map(b => ({
            ...b,
            x: b.x + Math.cos(b.angle) * BULLET_SPEED * dt,
            y: b.y + Math.sin(b.angle) * BULLET_SPEED * dt,
          }))
          .filter(b => b.x >= -0.05 && b.x <= 1.05 && b.y >= -0.05 && b.y <= 1.05);

      // 3. Update my bullets
      myBulletsRef.current = updateBullets(myBulletsRef.current);

      // 4. Update opponent bullets (simulate locally based on initial angle)
      opponentBulletsRef.current = updateBullets(opponentBulletsRef.current);

      // 4.5. Update obstacle position — only host computes, guest syncs via state messages
      if (role === 'host') {
        const obs = obstacleRef.current;
        const newPhase = obs.phase + OBSTACLE_SPEED * Math.PI * dt;
        const y = (1 - Math.cos(newPhase)) / 2;
        const rotation = obs.rotation + Math.PI * 2 * dt;
        obstacleRef.current = { x: 0.5, y, phase: newPhase, rotation };
      } else {
        // Guest: just update rotation for visual spin, position comes from synced phase
        const obs = obstacleRef.current;
        const rotation = obs.rotation + Math.PI * 2 * dt;
        obstacleRef.current = { ...obs, rotation };
      }

      // 5. Interpolate opponent ship towards target position (smoothing)
      const target = opponentTargetRef.current;
      const prev = opponentShipRef.current;
      const lerpFactor = 1 - Math.exp(-INTERPOLATION_SPEED * dt);

      const interpX = prev.x + (target.x - prev.x) * lerpFactor;
      const interpY = prev.y + (target.y - prev.y) * lerpFactor;

      let angleDiff = target.angle - prev.angle;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      const interpAngle = prev.angle + angleDiff * lerpFactor;

      opponentShipRef.current = { ...prev, x: interpX, y: interpY, angle: interpAngle };

      // 6. Check collisions - detect both hit directions
      const opponent = opponentShipRef.current;
      const myShipCurrent = myShipRef.current;

      let iHitOpponent = false;
      let opponentHitMe = false;

      // Check if my bullets hit opponent
      for (const bullet of myBulletsRef.current) {
        if (checkBulletHit(bullet, opponent)) {
          iHitOpponent = true;
          break;
        }
      }

      // Check if opponent bullets hit me
      for (const bullet of opponentBulletsRef.current) {
        if (checkBulletHit(bullet, myShipCurrent)) {
          opponentHitMe = true;
          break;
        }
      }

      // Check if ships hit the obstacle (hitting it = you lose)
      const obs = obstacleRef.current;
      const checkObstacleHit = (s: Ship): boolean => {
        const dx = Math.abs(obs.x - s.x);
        const dy = Math.abs(obs.y - s.y);
        return dx < (OBSTACLE_SIZE + SHIP_SIZE) / 2 && dy < (OBSTACLE_SIZE + SHIP_SIZE) / 2;
      };
      if (checkObstacleHit(myShipCurrent)) opponentHitMe = true;
      if (checkObstacleHit(opponent)) iHitOpponent = true;

      // Only host determines collision outcomes (authoritative)
      if (role === 'host') {
        const pending = pendingResultRef.current;

        // Check for immediate tie (simultaneous hits in same frame)
        if (iHitOpponent && opponentHitMe) {
          if (!pending || !pending.processed) {
            const resultMsg: GameMessage = { type: 'round_result', winner: 'tie' };
            LocalConnectionModule.sendData(JSON.stringify(resultMsg));
            reportRoundToBackendRef.current('tie');
            setGamePhase('tie');
            pendingResultRef.current = { winner: 'tie' as any, timestamp: now, processed: true };
          }
          return;
        }

        // Check if we need to resolve a pending result
        if (pending && !pending.processed) {
           if (pending.winner === 'host' && opponentHitMe) {
             const resultMsg: GameMessage = { type: 'round_result', winner: 'tie' };
             LocalConnectionModule.sendData(JSON.stringify(resultMsg));
             reportRoundToBackendRef.current('tie');
             setGamePhase('tie');
             pending.processed = true;
             return;
           }
           if (pending.winner === 'guest' && iHitOpponent) {
             const resultMsg: GameMessage = { type: 'round_result', winner: 'tie' };
             LocalConnectionModule.sendData(JSON.stringify(resultMsg));
             reportRoundToBackendRef.current('tie');
             setGamePhase('tie');
             pending.processed = true;
             return;
           }

           // Check if time window expired
           if (now - pending.timestamp > TIE_WINDOW) {
             if (pending.winner === 'host') {
               const resultMsg: GameMessage = { type: 'round_result', winner: 'host' };
               LocalConnectionModule.sendData(JSON.stringify(resultMsg));
               reportRoundToBackendRef.current('host');
               roundWon();
               setGamePhase('win');
             } else {
               const resultMsg: GameMessage = { type: 'round_result', winner: 'guest' };
               LocalConnectionModule.sendData(JSON.stringify(resultMsg));
               reportRoundToBackendRef.current('guest');
               roundLost();
               setGamePhase('lose');
             }
             pending.processed = true;
             return;
           }
        } else if (!pending) {
            if (iHitOpponent) {
               pendingResultRef.current = { winner: 'host', timestamp: now, processed: false };
            } else if (opponentHitMe) {
               pendingResultRef.current = { winner: 'guest', timestamp: now, processed: false };
            }
        }
      } else {
        // Guest: if any collision detected, pause and wait for host's authoritative result
        if (iHitOpponent || opponentHitMe) {
          setGamePhase('waiting_result');
          return;
        }
      }

      // Trigger a single re-render per frame so JSX reads fresh ref values
      setRenderTick(t => t + 1);
      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [gamePhase]);

  // Cleanup reload timeouts on unmount (Step 8: memory leak fix)
  useEffect(() => {
    return () => {
      reloadTimeoutsRef.current.forEach(clearTimeout);
      reloadTimeoutsRef.current = [];
    };
  }, []);

  // Guest waiting_result freeze recovery (Step 9)
  useEffect(() => {
    if (gamePhase !== 'waiting_result' || role !== 'guest') return;
    const timeout = setTimeout(() => {
      // No result received — resume game loop to re-detect collision
      setGamePhase('playing');
    }, 5000);
    return () => clearTimeout(timeout);
  }, [gamePhase, role]);

  // ======================
  // STATE SYNC
  // ======================
  useEffect(() => {
    if (gamePhase !== 'playing') return;
    
    const interval = setInterval(() => {
      const ship = myShipRef.current;
      // Only sync ship position/angle, bullets are sent when fired
      const msg: GameMessage = {
        type: 'state',
        x: ship.x,
        y: ship.y,
        angle: ship.angle,
        hostScore: role === 'host' ? myScoreRef.current : undefined,
        guestScore: role === 'host' ? opponentScoreRef.current : undefined,
        obstaclePhase: role === 'host' ? obstacleRef.current.phase : undefined
      };
      LocalConnectionModule.sendData(JSON.stringify(msg));
    }, SYNC_INTERVAL);
    
    return () => clearInterval(interval);
  }, [gamePhase]);

  // ======================
  // WIN/LOSE & AUTO-RESTART
  // ======================
  // Removed automatic score checker - we check explicitly in handshake logic
  /*
  useEffect(() => {
    if(myScore >= 3) {
      finishGame('player');
    } else if (opponentScore >= 3) {
      finishGame('opponent');
    }
  }, 
  [opponentScore, myScore]);
  */

  useEffect(() => {
    if (gamePhase !== 'win' && gamePhase !== 'lose' && gamePhase !== 'tie') return;
    
    // Only host triggers the restart - guest waits for restart message
    if (role === 'host') {
      // 1. Start Minimum Duration Timer
      const timeout = setTimeout(() => {
        setMinTimeElapsed(true);
      }, 1500);
      
      // 2. Restart when BOTH conditions met:
      //    - Minimum time elapsed
      //    - Guest sent acknowledgement
      if (minTimeElapsed && guestReadyToRestart) {
         if (myScore >= 3 || opponentScore >= 3) {
             const winner = myScore >= 3 ? 'host' : 'guest';
             const msg: GameMessage = { type: 'game_over', winner };
             LocalConnectionModule.sendData(JSON.stringify(msg));
             finishGame(myScore >= 3 ? 'player' : 'opponent');
         } else {
             const msg: GameMessage = { type: 'restart' };
             LocalConnectionModule.sendData(JSON.stringify(msg));
             resetGameState();
             setGamePhase('playing');
         }
      }

      // 3. RETRY LOGIC: Resend result every 1s until guest acknowledges
      // This handles dropped packets so the guest eventually gets the result
      let retryInterval: NodeJS.Timeout | null = null;
      if (!guestReadyToRestart) {
        retryInterval = setInterval(() => {
           let winner: 'host' | 'guest' | 'tie' | null = null;
           if (gamePhase === 'win') winner = 'host';
           else if (gamePhase === 'lose') winner = 'guest';
           else if (gamePhase === 'tie') winner = 'tie';

           if (winner) {
              const msg: GameMessage = { type: 'round_result', winner };
              LocalConnectionModule.sendData(JSON.stringify(msg));
           }
        }, 1000);
      }

      return () => {
        clearTimeout(timeout);
        if (retryInterval) clearInterval(retryInterval);
      };
    }
  }, [gamePhase, role, resetGameState, minTimeElapsed, guestReadyToRestart, myScore, opponentScore]);

  // Add a broadcast for game_over state too, to ensure reliability
  useEffect(() => {
    if (gamePhase === 'game_over' && role === 'host') {
         const winner = finalWinner === 'player' ? 'host' : 'guest';
         const interval = setInterval(() => {
             const msg: GameMessage = { type: 'game_over', winner };
             // Broadcast this every 1s for a few seconds to ensure delivery
             // (Component might unmount on disconnect, but user stays on Game Over screen)
             LocalConnectionModule.sendData(JSON.stringify(msg));
         }, 1000); 
         return () => clearInterval(interval);
    }
  }, [gamePhase, role, finalWinner]);

  // ======================
  // START GAME (HOST)
  // ======================
  
  const initiateTutorial = useCallback(async () => {
    if (role !== 'host') return;

    // Register the duel with the backend
    let newDuelId: string | null = null;
    if (userId && guestUserId) {
      try {
        const response: any = await api.post('/duel', { hostId: userId, guestId: guestUserId });
        newDuelId = response?.data?._id ?? null;
        console.log('Created duel with id:', newDuelId);
        setDuelId(newDuelId);
      } catch (error) {
        console.error('Failed to register duel:', error);
      }
    }

    // Send tutorial start to guest (include duelId so guest can report results)
    const msg: GameMessage = { type: 'start_tutorial', duelId: newDuelId ?? '' };
    LocalConnectionModule.sendData(JSON.stringify(msg));

    resetGameState();
    setTutorialStep(0);
    setOpponentFinishedTutorial(false);
    setGamePhase('tutorial');
  }, [role, resetGameState, userId, guestUserId]);

  const startGame = useCallback(() => {
    if (role !== 'host' || !guestRatio) return;
    
    const computedWorldRatio = Math.min(screenRatio, guestRatio);
    setWorldRatio(computedWorldRatio);
    
    const msg: GameMessage = { type: 'start_game', worldRatio: computedWorldRatio };
    LocalConnectionModule.sendData(JSON.stringify(msg));
    
    resetGameState();
    setGamePhase('playing');
  }, [role, guestRatio, screenRatio, resetGameState]);

  // Host auto-start when both finished tutorial
  useEffect(() => {
    if (role === 'host' && gamePhase === 'tutorial' && tutorialStep === 3 && opponentFinishedTutorial) {
      startGame();
    }
  }, [role, gamePhase, tutorialStep, opponentFinishedTutorial, startGame]);

  // ======================
  // RENDER SCREENS
  // ======================
  
  // Home screen
  if (screen === 'home') {
    const buttonsDisabled = profileLoading || !displayName;
    
    return (
      <ImageBackground source={backgroundImage} style={styles.container} resizeMode="cover">
        <View>
          <Text style={[styles.title, styles.glowWide]}>DUELS</Text>
          <Text style={[styles.title, styles.glowMid]}>DUELS</Text>
          <Text style={[styles.title, styles.titleFront]}>DUELS</Text>
        </View>
        <Text style={styles.subtitle}>
          {profileLoading ? 'Loading profile...' : displayName ? `Playing as: ${displayName}` : 'You must login to play duels'}
        </Text>
        <LobbyButton
          label="HOST LOBBY"
          accentColor="rgba(74, 26, 107, 0.6)"
          disabled={buttonsDisabled}
          onPress={() => {
            if (!displayName) return;
            LocalConnectionModule.InitPeerName(displayName);
            LocalConnectionModule.startAdvertising();
            setRole('host');
            setScreen('hosting');
          }}
        />
        <View style={{ height: 15 }} />
        <LobbyButton
          label="JOIN LOBBY"
          accentColor="rgba(107, 26, 74, 0.6)"
          disabled={buttonsDisabled}
          onPress={() => {
            if (!displayName) return;
            LocalConnectionModule.InitPeerName(displayName);
            LocalConnectionModule.startScanning();
            setRole('guest');
            setScreen('browsing');
          }}
        />
      </ImageBackground>
    );
  }

  // Hosting screen
  if (screen === 'hosting') {
    return (
      <ImageBackground source={backgroundImage} style={styles.container} resizeMode="cover">
        <Text style={styles.title}>HOSTING</Text>
        <Text style={styles.subtitle}>Lobby: {displayName}</Text>
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
              <Pressable style={styles.startButton} onPress={initiateTutorial}>
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
      <Modal visible={true} animationType="slide" statusBarTranslucent>
      <ImageBackground source={backgroundImage} style={[styles.gameContainer, { paddingTop: insets.top }]} resizeMode="cover">
        {/* Win/Lose/Tie overlay */}
        {(gamePhase === 'win' || gamePhase === 'lose' || gamePhase === 'tie') && (
          <View style={styles.overlay}>
            <Text style={[
              styles.overlayText, 
              gamePhase === 'win' ? styles.winText : gamePhase === 'lose' ? styles.loseText : styles.tieText
            ]}>
              {gamePhase === 'win' ? 'YOU WIN!' : gamePhase === 'lose' ? 'YOU LOSE!' : 'TIE!'}
            </Text>
            <Text style={styles.scoreText}>
              {myScore} - {opponentScore}
            </Text>
          </View>
        )}

        {/* Tutorial Overlay */}
        {gamePhase === 'tutorial' && (
          <Pressable 
            style={styles.tutorialOverlay} 
            onPress={() => {
              if (tutorialStep < 3) {
                const nextStep = tutorialStep + 1;
                setTutorialStep(nextStep);
                if (nextStep === 3) {
                  const msg: GameMessage = { type: 'tutorial_complete' };
                  LocalConnectionModule.sendData(JSON.stringify(msg));
                }
              }
            }}
          >
            <View style={styles.tutorialContent}>
              {tutorialStep < 3 ? (
                <Image 
                  source={tutorialStep === 0 ? tutorialImage1 : tutorialStep === 1 ? tutorialImage2 : tutorialImage3} 
                  style={styles.tutorialImage} 
                  resizeMode="contain" 
                />
              ) : (
                <Text style={styles.waitingText}>Waiting for other player...</Text>
              )}
            </View>
          </Pressable>
        )}
        
        {/* Game area */}
        <View style={styles.gameArea}>
          {/* My ship */}
          <Image
            source={userShipImage}
            style={[
              styles.ship,
              {
                left: myShipRef.current.x * gameWidth - SHIP_DISPLAY_SIZE / 2,
                top: myShipRef.current.y * gameHeight - SHIP_DISPLAY_SIZE / 2,
                transform: [{ rotate: `${myShipRef.current.angle + Math.PI / 2}rad` }]
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
                left: opponentShipRef.current.x * gameWidth - SHIP_DISPLAY_SIZE / 2,
                top: opponentShipRef.current.y * gameHeight - SHIP_DISPLAY_SIZE / 2,
                transform: [{ rotate: `${opponentShipRef.current.angle + Math.PI / 2}rad` }]
              }
            ]}
            resizeMode="contain"
          />

          {/* Sawblade obstacle */}
          <Image
            source={sawbladeImage}
            style={{
              position: 'absolute',
              width: OBSTACLE_DISPLAY_SIZE,
              height: OBSTACLE_DISPLAY_SIZE,
              left: obstacleRef.current.x * gameWidth - OBSTACLE_DISPLAY_SIZE / 2,
              top: obstacleRef.current.y * gameHeight - OBSTACLE_DISPLAY_SIZE / 2,
              transform: [{ rotate: `${obstacleRef.current.rotation}rad` }],
            }}
            resizeMode="contain"
          />

          {/* My bullets */}
          {myBulletsRef.current.map(b => (
            <Image
              key={b.id}
              source={bulletImage}
              style={[
                styles.bullet,
                {
                  left: b.x * gameWidth - BULLET_DISPLAY_SIZE / 2,
                  top: b.y * gameHeight - BULLET_DISPLAY_SIZE / 2,
                  transform: [{ rotate: `${b.angle + Math.PI / 2}rad` }]
                }
              ]}
              resizeMode="contain"
            />
          ))}

          {/* Opponent bullets */}
          {opponentBulletsRef.current.map(b => (
            <Image
              key={b.id}
              source={bulletImage}
              style={[
                styles.bullet,
                {
                  left: b.x * gameWidth - BULLET_DISPLAY_SIZE / 2,
                  top: b.y * gameHeight - BULLET_DISPLAY_SIZE / 2,
                  transform: [{ rotate: `${b.angle + Math.PI / 2}rad` }]
                }
              ]}
              resizeMode="contain"
            />
          ))}
        </View>
        
        {/* Multitouch Controls Container */}
        <View 
          style={styles.controlsContainer}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e: GestureResponderEvent) => {
            const touches = Array.from(e.nativeEvent.touches || []);
            const hasLeft = touches.some(t => t.pageX < screenWidth / 2);
            const hasRight = touches.some(t => t.pageX >= screenWidth / 2);
            if (hasLeft) shoot();
            if (hasRight) setIsRotating(true);
          }}
          onResponderMove={(e: GestureResponderEvent) => {
            const touches = Array.from(e.nativeEvent.touches || []);
            setIsRotating(touches.some(t => t.pageX >= screenWidth / 2));
          }}
          onResponderRelease={(e: GestureResponderEvent) => {
            const touches = Array.from(e.nativeEvent.touches || []);
            setIsRotating(touches.some(t => t.pageX >= screenWidth / 2));
          }}
          onResponderTerminate={() => setIsRotating(false)}
          hitSlop={{ top: 60, bottom: 20 }}
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

        {/* Dismiss button */}
        <Pressable
          style={[styles.dismissButton, { top: insets.top + 10 }]}
          onPress={disconnect}
        >
          <LogoutButtonSvg width={22} height={26} />
        </Pressable>
      </ImageBackground>
      </Modal>
    );
  }

  return null;
}

// ======================
// STYLES
// ======================
const styles = StyleSheet.create({
  dismissButton: {
    position: 'absolute',
    left: 16,
    zIndex: 300,
    padding: 8,
    opacity: 0.8,
  },
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
  menuButtonDisabled: {
    opacity: 0.5,
  },
  menuButtonTextDisabled: {
    color: '#888888',
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(180, 100, 255, 0.9)',
    backgroundColor: 'rgba(74, 26, 107, 0.5)',
    borderRadius: 999,
    shadowColor: '#b464ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Tsukimi Rounded',
    fontWeight: '700',
    letterSpacing: 2,
  },
  startButton: {
    backgroundColor: 'rgba(74, 26, 107, 0.6)',
    paddingVertical: 20,
    paddingHorizontal: 50,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(180, 100, 255, 0.9)',
    shadowColor: '#b464ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Tsukimi Rounded',
    fontWeight: '700',
    letterSpacing: 3,
  },
  lobbyItem: {
    backgroundColor: 'rgba(74, 26, 107, 0.5)',
    padding: 18,
    marginVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(180, 100, 255, 0.9)',
  },
  lobbyItemText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Tsukimi Rounded',
    fontWeight: '600',
    letterSpacing: 1,
  },
  lobbyItemDisabled: {
    opacity: 0.5,
  },
  lobbyItemJoining: {
    opacity: 1,
    borderColor: 'rgba(180, 100, 255, 1)',
    borderWidth: 2,
  },
  gameOverTitle: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 5,
    marginBottom: 20,
    fontFamily: "Tsukimi-Rounded-Bold"
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
  },

  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shootButtonContainer: {
    width: 140,
    height: 140,
    opacity: 0.7,
    overflow: 'hidden',
  },
  rotateButtonContainer: {
    width: 140,
    height: 140,
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
  tieText: {
    color: '#ffaa00',
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
  tutorialOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  tutorialContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tutorialImage: {
    width: '90%',
    height: '80%',
  },
  glowWide: {
    position: 'absolute',
    color: 'transparent',
    textShadowColor: 'rgba(243, 77, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  glowMid: {
    position: 'absolute',
    color: 'transparent',
    textShadowColor: 'rgba(243, 77, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  titleFront: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(243, 77, 255, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
});
