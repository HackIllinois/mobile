import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, Pressable, StyleSheet, Dimensions, PermissionsAndroid, Platform, Image, ImageBackground, GestureResponderEvent } from 'react-native';

// Asset imports
const backgroundImage = require('../../assets/duels/duels-background.png');
const userShipImage = require('../../assets/duels/duels-ship-user.png');
const enemyShipImage = require('../../assets/duels/duels-ship-enemy.png');
const buttonImage = require('../../assets/duels/duels-button.png');
const bulletImage = require('../../assets/duels/duels-bullet.png');
const tutorialImage1 = require('../../assets/duels/duels-controls-1.png');
const tutorialImage2 = require('../../assets/duels/duels-controls-2.png');
const tutorialImage3 = require('../../assets/duels/duels-controls-3.png');
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api';

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
  isLaser?: boolean; // true if this is a laser shot
};

type Powerup = {
  x: number;        // 0-1 normalized
  y: number;        // 0-1 normalized
  active: boolean;  // whether the powerup is visible/collectible
};

type GameMessage = 
  | { type: 'ready'; screenRatio: number }
  | { type: 'start_game'; worldRatio: number }
  | { type: 'state'; x: number; y: number; angle: number; hostScore?: number; guestScore?: number }
  | { type: 'bullet'; id: string; x: number; y: number; angle: number; spawnTime: number; isLaser?: boolean }
  | { type: 'hit'; victimId: string }
  | { type: 'round_result'; winner: 'host' | 'guest' | 'tie' }
  | { type: 'round_ack' }
  | { type: 'game_over'; winner: 'host' | 'guest' }
  | { type: 'restart' }
  | { type: 'start_tutorial' }
  | { type: 'tutorial_complete' }
  | { type: 'powerup_collected'; collectorId: 'player' | 'opponent' };

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
const POWERUP_SIZE = 0.02;     // normalized size for powerup collision (smaller)
const LASER_WIDTH = 8;          // pixels width of laser beam
const LASER_LENGTH = 2000;      // pixels length of laser beam (very long)
const LASER_DURATION = 500;     // ms - how long laser is visible and can hit

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
  
  // Tutorial State
  const [tutorialStep, setTutorialStep] = useState(0); // 0, 1, 2 = showing images, 3 = finished
  const [opponentFinishedTutorial, setOpponentFinishedTutorial] = useState(false);
  
  // Handshake state for reliable restarts
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [guestReadyToRestart, setGuestReadyToRestart] = useState(false);

  // Powerup and Laser state
  const [powerup, setPowerup] = useState<Powerup>({ x: 0.5, y: 0.5, active: true });
  const [hasLaser, setHasLaser] = useState(false); // Player has collected powerup
  const [opponentHasLaser, setOpponentHasLaser] = useState(false); // Opponent has collected powerup

  // Refs for game loop
  const myShipRef = useRef(myShip);
  const myBulletsRef = useRef(myBullets);
  const opponentShipRef = useRef(opponentShip);
  const opponentTargetRef = useRef(opponentTarget);
  const opponentBulletsRef = useRef(opponentBullets);
  const isRotatingRef = useRef(isRotating);
  const gamePhaseRef = useRef(gamePhase);
  const powerupRef = useRef(powerup);
  const hasLaserRef = useRef(hasLaser);
  
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
  
  // Keep refs in sync
  useEffect(() => {
    myShipRef.current = myShip;
    myBulletsRef.current = myBullets;
    opponentShipRef.current = opponentShip;
    opponentTargetRef.current = opponentTarget;
    opponentBulletsRef.current = opponentBullets;
    isRotatingRef.current = isRotating;
    gamePhaseRef.current = gamePhase;
    powerupRef.current = powerup;
    hasLaserRef.current = hasLaser;
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

  // Profile state - fetch displayName from API
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response: any = await api.get('/profile/');
        if (response?.data?.displayName) {
          setDisplayName(response.data.displayName);
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
    
    setMyShip({ ...startPos, id: 'player' });
    setOpponentShip({ ...opponentStartPos, id: 'opponent' });
    setOpponentTarget({ ...opponentStartPos, id: 'opponent' });
    setMyBullets([]);
    setOpponentBullets([]);
    setAmmo(MAX_AMMO);
    setReloading(0);
    
    // Reset powerup and laser state - spawn powerup at center
    setPowerup({ x: 0.5, y: 0.5, active: true });
    setHasLaser(false);
    setOpponentHasLaser(false);
  }, [role]);

  const shoot = useCallback(() => {
    if (ammo <= 0) return; // No ammo available
    
    const ship = myShipRef.current;
    const now = Date.now();
    const isLaserShot = hasLaserRef.current;
    
    const bullet: Bullet = {
      id: `${now}-${Math.random()}`,
      x: ship.x,
      y: ship.y,
      angle: ship.angle,
      spawnTime: now,
      startX: ship.x,
      startY: ship.y,
      ownerId: 'player',
      isLaser: isLaserShot
    };
    setMyBullets(prev => [...prev, bullet]);
    setAmmo(prev => prev - 1);
    setReloading(prev => prev + 1);
    
    // Consume laser if used
    if (isLaserShot) {
      setHasLaser(false);
    }
    
    // Send bullet spawn to opponent (only initial data, they simulate locally)
    const bulletMsg: GameMessage = {
      type: 'bullet',
      id: bullet.id,
      x: bullet.startX,
      y: bullet.startY,
      angle: bullet.angle,
      spawnTime: bullet.spawnTime,
      isLaser: isLaserShot
    };
    LocalConnectionModule.sendData(JSON.stringify(bulletMsg));
    
    // If Host shoots laser, check collision instantly (Shooter calculation)
    if (role === 'host' && isLaserShot) {
        const hit = checkLaserHit(bullet, opponentShipRef.current);
        if (hit) {
            roundWon();
            setGamePhase('win');
            const resultMsg: GameMessage = { type: 'round_result', winner: 'host' };
            LocalConnectionModule.sendData(JSON.stringify(resultMsg));
        }
    }
    
    // Start reload timer for this bullet
    const timeoutId = setTimeout(() => {
      setReloading(prev => prev - 1);
      setAmmo(prev => Math.min(prev + 1, MAX_AMMO));
      
      // Remove this timeout from the ref list
      reloadTimeoutsRef.current = reloadTimeoutsRef.current.filter(id => id !== timeoutId);
    }, RELOAD_TIME);
    
    reloadTimeoutsRef.current.push(timeoutId);
  }, [ammo]);

  const checkLaserHit = (laser: {x: number, y: number, angle: number}, ship: Ship): boolean => {
      // For lasers, check if ship is anywhere along the laser beam line
      // The laser extends from the bullet spawn point in the direction of the angle
      const laserStartX = laser.x;
      const laserStartY = laser.y;
      const laserDirX = Math.cos(laser.angle);
      const laserDirY = Math.sin(laser.angle);
      
      // Project ship position onto the laser line
      const toShipX = ship.x - laserStartX;
      const toShipY = ship.y - laserStartY;
      
      // Dot product to find projection distance along laser
      const projection = toShipX * laserDirX + toShipY * laserDirY;
      
      // Only check if ship is in front of the laser (positive projection)
      if (projection < 0) return false;
      
      // Find the closest point on the laser line to the ship
      const closestX = laserStartX + laserDirX * projection;
      const closestY = laserStartY + laserDirY * projection;
      
      // Distance from ship to the closest point on laser
      const distX = ship.x - closestX;
      const distY = ship.y - closestY;
      const distance = Math.sqrt(distX * distX + distY * distY);
      
      // Hit if within ship size
      return distance < SHIP_SIZE / 2;
  };

  const checkBulletHit = (bullet: Bullet, ship: Ship): boolean => {
    // Only regular bullets check collision in the loop now
    if (bullet.isLaser) return false;
    
    // Regular bullet collision
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
              setMyScore(0);
              setOpponentScore(0);
              resetGameState();
              setGamePhase('playing');
              break;
            case 'state':
              // Implicit Restart: If we are stuck in a post-game screen but receiving live game state,
              // it means we missed the 'restart' message. Sync up immediately.
              // Also check 'waiting_result' to fix frozen duel screen deadlock.
              if (role === 'guest' && (gamePhaseRef.current === 'win' || gamePhaseRef.current === 'lose' || gamePhaseRef.current === 'tie' || gamePhaseRef.current === 'waiting_result')) {
                 resetGameState();
                 setGamePhase('playing');
              }

              // Update opponent target position (will be interpolated in game loop)
              setOpponentTarget(prev => ({ ...prev, x: msg.x, y: msg.y, angle: msg.angle }));
              
              if (role === 'guest') {
                if (msg.hostScore !== undefined) setOpponentScore(msg.hostScore);
                if (msg.guestScore !== undefined) setMyScore(msg.guestScore);
              }
              break;
            case 'bullet':
              // Implicit Restart check for bullet messages too
              // Also check 'waiting_result' to fix frozen duel screen deadlock.
              if (role === 'guest' && (gamePhaseRef.current === 'win' || gamePhaseRef.current === 'lose' || gamePhaseRef.current === 'tie' || gamePhaseRef.current === 'waiting_result')) {
                 resetGameState();
                 setGamePhase('playing');
              }

              // Opponent fired a bullet - add it with initial data for local simulation
              setOpponentBullets(prev => {
                // Avoid duplicate bullets
                if (prev.some(b => b.id === msg.id)) return prev;
                return [...prev, {
                  id: msg.id,
                  x: msg.x,
                  y: msg.y,
                  angle: msg.angle,
                  spawnTime: msg.spawnTime,
                  startX: msg.x,
                  startY: msg.y,
                  ownerId: 'opponent' as const,
                  isLaser: msg.isLaser
                }];
              });

              // Check for Instant Laser Hit (Victim calculation)
              if (msg.isLaser) {
                  const amIHit = checkLaserHit(msg, myShipRef.current);
                  if (amIHit) {
                      if (role === 'host') {
                          // Host hit by Guest laser -> Host Lose
                          roundLost();
                          setGamePhase('lose');
                          const resultMsg: GameMessage = { type: 'round_result', winner: 'guest' };
                          LocalConnectionModule.sendData(JSON.stringify(resultMsg));
                      } else if (role === 'guest') {
                          // Guest hit by Host laser -> Tell Host "I'm Hit"
                           // Guest pauses, waits for host confirmation
                          setGamePhase('waiting_result');
                          const hitMsg: GameMessage = { type: 'hit', victimId: 'guest' };
                          LocalConnectionModule.sendData(JSON.stringify(hitMsg));
                      }
                  }
              }
              break;
            case 'hit':
              // Host receives hit confirmation from Guest
               if (role === 'host' && msg.victimId === 'guest') {
                  roundWon();
                  setGamePhase('win');
                  const resultMsg: GameMessage = { type: 'round_result', winner: 'host' };
                  LocalConnectionModule.sendData(JSON.stringify(resultMsg));
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
              resetGameState();
              setTutorialStep(0);
              setGamePhase('tutorial');
              break;
            case 'tutorial_complete':
              setOpponentFinishedTutorial(true);
              break;
            case 'powerup_collected':
              // Opponent collected the powerup
              setPowerup(prev => ({ ...prev, active: false }));
              setOpponentHasLaser(true);
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
        
        // Border collision (stop at walls, don't bounce) - use margin to keep ships visible
        newX = Math.max(borderMarginX, Math.min(1 - borderMarginX, newX));
        newY = Math.max(borderMarginY, Math.min(1 - borderMarginY, newY));
        
        // Check for edge case where ships could go out of bounds if they were already out
        if(isNaN(newX)) newX = 0.5;
        if(isNaN(newY)) newY = 0.5;
        
        return { ...prev, x: newX, y: newY };
      });
      
      // Helper to update and filter bullets
      // Lasers stay in place and expire after LASER_DURATION
      // Regular bullets move and are removed when hitting borders
      const updateBullets = (bullets: Bullet[]) =>
        bullets
          .map(b => {
            if (b.isLaser) {
              // Lasers don't move, they stay at spawn position
              return b;
            }
            return {
              ...b,
              x: b.x + Math.cos(b.angle) * BULLET_SPEED * dt,
              y: b.y + Math.sin(b.angle) * BULLET_SPEED * dt,
            };
          })
          .filter(b => {
            if (b.isLaser) {
              // Lasers expire after LASER_DURATION
              return (now - b.spawnTime) < LASER_DURATION;
            }
            // Regular bullets are removed when hitting borders
            return b.x >= borderMarginX && b.x <= 1 - borderMarginX && b.y >= borderMarginY && b.y <= 1 - borderMarginY;
          });
      
      // 3. Update my bullets
      setMyBullets(updateBullets);
      
      // 4. Update opponent bullets (simulate locally based on initial angle)
      setOpponentBullets(updateBullets);
      
      // 5. Interpolate opponent ship towards target position (smoothing)
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
      
      // 5.5 Check powerup collection
      const currentPowerup = powerupRef.current;
      const myShipPos = myShipRef.current;
      if (currentPowerup.active) {
        const dx = Math.abs(myShipPos.x - currentPowerup.x);
        const dy = Math.abs(myShipPos.y - currentPowerup.y);
        if (dx < (SHIP_SIZE + POWERUP_SIZE) / 2 && dy < (SHIP_SIZE + POWERUP_SIZE) / 2) {
          // Player collected the powerup
          setPowerup(prev => ({ ...prev, active: false }));
          setHasLaser(true);
          
          // Notify opponent
          const powerupMsg: GameMessage = { type: 'powerup_collected', collectorId: 'player' };
          LocalConnectionModule.sendData(JSON.stringify(powerupMsg));
        }
      }
      
      // 6. Check collisions - detect both hit directions
      const opponent = opponentShipRef.current;
      const myShipCurrent = myShipRef.current;
      // Note: 'now' is already defined at the top of the loop
      
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
      
      // Only host determines collision outcomes (authoritative)
      if (role === 'host') {
        const pending = pendingResultRef.current;

        // Check for immediate tie (simultaneous hits in same frame)
        if (iHitOpponent && opponentHitMe) {
          if (!pending || !pending.processed) {
            const resultMsg: GameMessage = { type: 'round_result', winner: 'tie' };
            LocalConnectionModule.sendData(JSON.stringify(resultMsg));
            setGamePhase('tie');
            pendingResultRef.current = { winner: 'tie' as any, timestamp: now, processed: true }; // Mark as processed
          }
           // Loop ends naturally or gamePhase change stops it
          return;
        }

        // Check if we need to resolve a pending result
        if (pending && !pending.processed) {
           // If we have a pending win but now the other player also hit, it's a tie
           if (pending.winner === 'host' && opponentHitMe) {
             // Tie!
             const resultMsg: GameMessage = { type: 'round_result', winner: 'tie' };
             LocalConnectionModule.sendData(JSON.stringify(resultMsg));
             setGamePhase('tie');
             pending.processed = true;
             return;
           }
           if (pending.winner === 'guest' && iHitOpponent) {
              // Tie!
             const resultMsg: GameMessage = { type: 'round_result', winner: 'tie' };
             LocalConnectionModule.sendData(JSON.stringify(resultMsg));
             setGamePhase('tie');
             pending.processed = true;
             return;
           }

           // Check if time window expired
           if (now - pending.timestamp > TIE_WINDOW) {
             // Commit the pending result
             if (pending.winner === 'host') {
               const resultMsg: GameMessage = { type: 'round_result', winner: 'host' };
               LocalConnectionModule.sendData(JSON.stringify(resultMsg));
               roundWon();
               setGamePhase('win');
             } else {
               const resultMsg: GameMessage = { type: 'round_result', winner: 'guest' };
               LocalConnectionModule.sendData(JSON.stringify(resultMsg));
               roundLost();
               setGamePhase('lose');
             }
             pending.processed = true;
             return;
           }
        } else if (!pending) {
            // New hit detected, start pending result window
            if (iHitOpponent) {
               // Host hit guest
               pendingResultRef.current = { winner: 'host', timestamp: now, processed: false };
            } else if (opponentHitMe) {
               // Guest hit host
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
      // Only sync ship position/angle, bullets are sent when fired
      const msg: GameMessage = {
        type: 'state',
        x: ship.x,
        y: ship.y,
        angle: ship.angle,
        hostScore: role === 'host' ? myScore : undefined,
        guestScore: role === 'host' ? opponentScore : undefined
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
  
  const initiateTutorial = useCallback(() => {
    if (role !== 'host') return;
    
    // Send tutorial start to guest
    const msg: GameMessage = { type: 'start_tutorial' };
    LocalConnectionModule.sendData(JSON.stringify(msg));
    
    resetGameState();
    setTutorialStep(0);
    setOpponentFinishedTutorial(false);
    setGamePhase('tutorial');
  }, [role, resetGameState]);

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
        <Text style={styles.title}>DUELS</Text>
        <Text style={styles.subtitle}>
          {profileLoading ? 'Loading profile...' : displayName ? `Playing as: ${displayName}` : 'Failed to load profile'}
        </Text>
        <Pressable
          style={[styles.menuButton, buttonsDisabled && styles.menuButtonDisabled]}
          onPress={() => {
            if (!displayName) return;
            LocalConnectionModule.InitPeerName(displayName);
            LocalConnectionModule.startAdvertising();
            setRole('host');
            setScreen('hosting');
          }}
          disabled={buttonsDisabled}
        >
          <Text style={[styles.menuButtonText, buttonsDisabled && styles.menuButtonTextDisabled]}>HOST LOBBY</Text>
        </Pressable>
        <View style={{ height: 15 }} />
        <Pressable
          style={[styles.menuButton, buttonsDisabled && styles.menuButtonDisabled]}
          onPress={() => {
            if (!displayName) return;
            LocalConnectionModule.InitPeerName(displayName);
            LocalConnectionModule.startScanning();
            setRole('guest');
            setScreen('browsing');
          }}
          disabled={buttonsDisabled}
        >
          <Text style={[styles.menuButtonText, buttonsDisabled && styles.menuButtonTextDisabled]}>JOIN LOBBY</Text>
        </Pressable>
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
          
          {/* Powerup - two parallel glowing white lines in center */}
          {powerup.active && (
            <View
              style={[
                styles.powerup,
                {
                  left: powerup.x * gameWidth - 10,
                  top: powerup.y * gameHeight - 7.5,
                }
              ]}
            >
              <View style={styles.powerupLine} />
              <View style={styles.powerupLine} />
            </View>
          )}
          
          {/* My bullets */}
          {myBullets.map(b => {
            if (b.isLaser) {
              const elapsed = Date.now() - b.spawnTime;
              const opacity = Math.max(0, 1 - elapsed / LASER_DURATION);
              return (
                <View
                  key={b.id}
                  style={[
                    styles.laser,
                    styles.myLaser,
                    {
                      left: b.x * gameWidth,
                      top: b.y * gameHeight,
                      opacity: opacity,
                      transform: [
                        { translateX: -LASER_WIDTH / 2 },
                        { translateY: -LASER_LENGTH },
                        { rotate: `${b.angle + Math.PI / 2}rad` }
                      ],
                      transformOrigin: 'bottom center'
                    }
                  ]}
                />
              );
            }
            return (
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
            );
          })}
          
          {/* Opponent bullets */}
          {opponentBullets.map(b => {
            if (b.isLaser) {
              const elapsed = Date.now() - b.spawnTime;
              const opacity = Math.max(0, 1 - elapsed / LASER_DURATION);
              return (
                <View
                  key={b.id}
                  style={[
                    styles.laser,
                    styles.opponentLaser,
                    {
                      left: b.x * gameWidth,
                      top: b.y * gameHeight,
                      opacity: opacity,
                      transform: [
                        { translateX: -LASER_WIDTH / 2 },
                        { translateY: -LASER_LENGTH },
                        { rotate: `${b.angle + Math.PI / 2}rad` }
                      ],
                      transformOrigin: 'bottom center'
                    }
                  ]}
                />
              );
            }
            return (
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
            );
          })}
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
            {hasLaser && (
              <Text style={styles.laserReadyText}>LASER READY!</Text>
            )}
            {reloading > 0 && !hasLaser && (
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
  menuButtonDisabled: {
    opacity: 0.5,
  },
  menuButtonTextDisabled: {
    color: '#888888',
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
  laser: {
    position: 'absolute',
    width: LASER_WIDTH,
    height: LASER_LENGTH,
    backgroundColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  myLaser: {
    shadowColor: '#00ffff',
    backgroundColor: '#ffffff',
  },
  opponentLaser: {
    shadowColor: '#ff3366',
    backgroundColor: '#ffffff',
  },
  powerup: {
    position: 'absolute',
    width: 20,
    height: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  powerupLine: {
    width: 3,
    height: 15,
    backgroundColor: '#ffffff',
    borderRadius: 1.5,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
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
  laserReadyText: {
    color: '#00ffff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 1,
    textShadowColor: '#00ffff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
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
});
