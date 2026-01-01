import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  FlatList,
  ActivityIndicator
} from "react-native";
import { PermissionsAndroid } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { requireNativeModule } from "expo-modules-core";
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- CONFIGURATION ---
const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const PLAYER_SIZE = 50;
const BULLET_WIDTH = 10;
const BULLET_HEIGHT = 20;
const BULLET_SPEED = 15;
const PLAYER_SPEED = 4; // Constant forward velocity
const ROTATION_SPEED = 0.08; // Radians per frame when button held
const NETWORK_UPDATE_RATE = 33; // ~30 updates/sec
const WINNING_SCORE = 2;
const CONNECTION_TIMEOUT_MS = 4000;
const LERP_FACTOR = 0.25;
const ANGLE_LERP_FACTOR = 0.2; // For smooth enemy rotation interpolation 

const LocalConnection = requireNativeModule("LocalConnection");

export default function DuelScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const isHost = params.isHost === "true"; 
  const myUsername = params.username || "Unknown Player";

  // --- STATE ---
  const [gameState, setGameState] = useState<"LOBBY" | "PLAYING" | "ROUND_OVER" | "MATCH_WON" | "MATCH_LOST" | "DISCONNECT">("LOBBY");
  const gameStateRef = useRef(gameState);

  const [statusMsg, setStatusMsg] = useState(isHost ? "Waiting for players..." : "Scanning for games...");
  const [scores, setScores] = useState({ me: 0, enemy: 0 });
  const [roundWinner, setRoundWinner] = useState<"me" | "enemy" | null>(null);

  const [foundRooms, setFoundRooms] = useState<{id: string, name: string}[]>([]);
  
  // --- GAME REFS ---
  const bullets = useRef<any[]>([]);
  const myPos = useRef({ x: SCREEN_WIDTH / 2 - PLAYER_SIZE / 2, y: SCREEN_HEIGHT - 150 });
  const myAngle = useRef(-Math.PI / 2); // Start facing up (negative Y direction)
  const enemyPos = useRef({ x: SCREEN_WIDTH / 2 - PLAYER_SIZE / 2, y: 50 });
  const enemyAngle = useRef(Math.PI / 2); // Enemy starts facing down
  // Target position/angle for interpolation
  const enemyTargetPos = useRef({ x: SCREEN_WIDTH / 2 - PLAYER_SIZE / 2, y: 50 });
  const enemyTargetAngle = useRef(Math.PI / 2);
  // Rotation input: -1 = left, 0 = none, 1 = right
  const rotationInput = useRef(0);
  const reqRef = useRef<number | undefined>(undefined);
  const lastSentTime = useRef(0);
  // Track last sent state to avoid redundant sends
  const lastSentState = useRef({ x: 0, y: 0, a: 0 });
  
  const lastReceivedTime = useRef<number>(Date.now());
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  // Force Render
  const [tick, setTick] = useState(0);
  const forceUpdate = () => setTick((t) => t + 1);

  useEffect(() => {
    gameStateRef.current = gameState;
    if (gameState === "LOBBY") {
        setFoundRooms([]);
        if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
    } else {
        startHeartbeatMonitor();
    }
  }, [gameState]);

  // --- 1. INITIALIZATION & CLEANUP ---
  useEffect(() => {
    const checkPermissions = async () => {
      if (Platform.OS === 'android') {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ];
        if (Platform.Version >= 33) {
          permissions.push(PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES);
        }
        await PermissionsAndroid.requestMultiple(permissions);
      }

      // --- ZOMBIE FIX START ---
      // Force kill any previous session before starting a new one
      LocalConnection.EndConnection();
      
      // Short delay to ensure cleanup processes, then start
      setTimeout(() => {
          if (isHost) LocalConnection.startAdvertising();
          else LocalConnection.startScanning();
      }, 500);
      // --- ZOMBIE FIX END ---
    };
    checkPermissions();
    checkBadExit();

    return () => {
      // Safety net: Ensures connection is killed even if user swipes back gesture
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      LocalConnection.EndConnection(); 
    };
  }, []);

  // --- 2. NETWORK LISTENERS ---
  useEffect(() => {
    const subscription = LocalConnection.addListener("onChange", (event: any) => {
      const currentGameState = gameStateRef.current;

      switch (event.type) {
        case "found":
          setFoundRooms(prev => {
            if (prev.find(r => r.id === event.endpointId)) return prev;
            return [...prev, { id: event.endpointId, name: event.endpointName }];
          });
          break;

        case "lost":
          setFoundRooms(prev => prev.filter(r => r.id !== event.endpointId));
          break;

        case "invite":
          Alert.alert(
            "Connection Request",
            `${event.endpointName} wants to join!`,
            [
              { text: "Deny", style: "cancel" },
              { text: "Accept", onPress: () => LocalConnection.acceptInvitation(event.endpointId) }
            ]
          );
          break;

        case "connected":
          setStatusMsg(`Connected to ${event.peer}`);
          lastReceivedTime.current = Date.now();
          startGameSequence(); 
          break;

        case "disconnected":
          handleOpponentDisconnect(currentGameState);
          break;

        case "data":
          handleNetworkData(event.data);
          break;
      }
    });

    return () => subscription.remove();
  }, []);

  // --- LOGIC HELPERS ---

  const startHeartbeatMonitor = () => {
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      
      heartbeatInterval.current = setInterval(() => {
          const now = Date.now();
          const timeSinceLastMsg = now - lastReceivedTime.current;
          
          const state = gameStateRef.current;
          if (state !== "LOBBY" && state !== "DISCONNECT") {
             if (timeSinceLastMsg > CONNECTION_TIMEOUT_MS) {
                 console.log("Heartbeat timeout! Force disconnecting.");
                 handleOpponentDisconnect(state);
             }
          }
      }, 1000);
  };

  const checkBadExit = async () => {
    const wasInMatch = await AsyncStorage.getItem("MATCH_IN_PROGRESS");
    if (wasInMatch === "true") {
      incrementBanCount();
      Alert.alert("Penalty", "You disconnected unexpectedly. Ban count incremented.");
      await AsyncStorage.setItem("MATCH_IN_PROGRESS", "false");
    }
  };

  const setMatchActive = async (active: boolean) => {
    await AsyncStorage.setItem("MATCH_IN_PROGRESS", active ? "true" : "false");
  };

  const incrementBanCount = async () => {
    const current = await AsyncStorage.getItem("BAN_COUNT");
    const newCount = (parseInt(current || "0") + 1).toString();
    await AsyncStorage.setItem("BAN_COUNT", newCount);
  };

  const handleOpponentDisconnect = (currentState: string) => {
    if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);

    // If game was active, show the "Opponent Left" screen
    if (currentState === "PLAYING" || currentState === "ROUND_OVER") {
      setGameState("DISCONNECT");
      setMatchActive(false);
    } else {
      // If we were just in lobby, reset completely
      setStatusMsg("Opponent Disconnected");
      setGameState("LOBBY");
      bullets.current = [];
      setFoundRooms([]); 
      setScores({ me: 0, enemy: 0 });
      
      // Force restart scanning/advertising
      LocalConnection.EndConnection();
      setTimeout(() => {
          if (!isHost) LocalConnection.startScanning();
          else LocalConnection.startAdvertising();     
      }, 500);
    }
  };

  // --- ZOMBIE FIX: Manual Refresh Function ---
  const refreshLobby = () => {
      setFoundRooms([]); // Clear UI immediately
      LocalConnection.EndConnection(); // Kill native scan
      
      // Wait for kill to finish, then restart scan
      setTimeout(() => {
          if(!isHost) LocalConnection.startScanning();
      }, 500);
  };
  // ------------------------------------------

  const startGameSequence = async () => {
    await setMatchActive(true);
    setScores({ me: 0, enemy: 0 });
    startNewRound();
  };

  const startNewRound = () => {
    bullets.current = [];
    myPos.current = { x: SCREEN_WIDTH / 2 - PLAYER_SIZE / 2, y: SCREEN_HEIGHT - 150 };
    myAngle.current = -Math.PI / 2; // Face up
    enemyPos.current = { x: SCREEN_WIDTH / 2 - PLAYER_SIZE / 2, y: 50 };
    enemyAngle.current = Math.PI / 2; // Face down
    enemyTargetPos.current = { x: SCREEN_WIDTH / 2 - PLAYER_SIZE / 2, y: 50 };
    enemyTargetAngle.current = Math.PI / 2;
    lastSentState.current = { x: 0, y: 0, a: 0 };
    rotationInput.current = 0;
    setGameState("PLAYING");
    lastReceivedTime.current = Date.now();
  };

  // --- GAME LOOP ---
  const updateGame = () => {
    if (gameStateRef.current !== "PLAYING") return;

    // Apply rotation based on button input
    myAngle.current += rotationInput.current * ROTATION_SPEED;

    // Move forward in facing direction
    myPos.current.x += Math.cos(myAngle.current) * PLAYER_SPEED;
    myPos.current.y += Math.sin(myAngle.current) * PLAYER_SPEED;

    // Wrap around screen edges (full map movement)
    if (myPos.current.x < -PLAYER_SIZE) myPos.current.x = SCREEN_WIDTH;
    if (myPos.current.x > SCREEN_WIDTH) myPos.current.x = -PLAYER_SIZE;
    if (myPos.current.y < -PLAYER_SIZE) myPos.current.y = SCREEN_HEIGHT;
    if (myPos.current.y > SCREEN_HEIGHT) myPos.current.y = -PLAYER_SIZE;

    // --- ENEMY INTERPOLATION: Smoothly lerp towards target position & angle ---
    enemyPos.current.x += (enemyTargetPos.current.x - enemyPos.current.x) * LERP_FACTOR;
    enemyPos.current.y += (enemyTargetPos.current.y - enemyPos.current.y) * LERP_FACTOR;
    // Lerp angle with wrap-around handling
    let angleDiff = enemyTargetAngle.current - enemyAngle.current;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    enemyAngle.current += angleDiff * ANGLE_LERP_FACTOR;

    // --- NETWORK SEND ---
    const now = Date.now();
    if (now - lastSentTime.current > NETWORK_UPDATE_RATE) {
      const normX = myPos.current.x / SCREEN_WIDTH;
      const normY = myPos.current.y / SCREEN_HEIGHT;
      const normA = myAngle.current;
      
      const dx = Math.abs(normX - lastSentState.current.x);
      const dy = Math.abs(normY - lastSentState.current.y);
      const da = Math.abs(normA - lastSentState.current.a);
      
      if (dx > 0.005 || dy > 0.005 || da > 0.02) {
        LocalConnection.sendData(JSON.stringify({ t: "M", x: normX, y: normY, a: normA }));
        lastSentState.current = { x: normX, y: normY, a: normA };
        lastSentTime.current = now;
      }
    }

    // Update bullets (move in their direction)
    bullets.current.forEach((b) => {
      b.x += b.dx;
      b.y += b.dy;
    });
    // Remove off-screen bullets
    bullets.current = bullets.current.filter(
      (b) => b.x > -50 && b.x < SCREEN_WIDTH + 50 && b.y > -50 && b.y < SCREEN_HEIGHT + 50
    );

    // Collision detection
    const myRect = { ...myPos.current, w: PLAYER_SIZE, h: PLAYER_SIZE };
    
    const hitIndex = bullets.current.findIndex(
      (b) =>
        b.owner === "enemy" &&
        b.x < myRect.x + myRect.w &&
        b.x + BULLET_WIDTH > myRect.x &&
        b.y < myRect.y + myRect.h &&
        b.y + BULLET_HEIGHT > myRect.y
    );

    if (hitIndex !== -1) {
        if (gameStateRef.current === "PLAYING") {
            bullets.current.splice(hitIndex, 1);
            handleRoundResult(false);
        }
    }

    forceUpdate();
    reqRef.current = requestAnimationFrame(updateGame);
  };

  useEffect(() => {
    if (gameState === "PLAYING") reqRef.current = requestAnimationFrame(updateGame);
    else if (reqRef.current) cancelAnimationFrame(reqRef.current);
  }, [gameState]);

  // --- SCORE LOGIC ---
  const handleRoundResult = (iWonRound: boolean) => {
    setGameState("ROUND_OVER");
    setRoundWinner(iWonRound ? "me" : "enemy");

    if (!iWonRound) {
       LocalConnection.sendData(JSON.stringify({ type: "ROUND_LOST" }));
    }

    setScores(prevScores => {
      const newScores = { ...prevScores };
      if (iWonRound) newScores.me += 1;
      else newScores.enemy += 1;

      checkMatchStatus(newScores);
      return newScores;
    });
  };

  const checkMatchStatus = async (currentScores: {me: number, enemy: number}) => {
    if (currentScores.me >= WINNING_SCORE) {
      setTimeout(async () => {
        setGameState("MATCH_WON");
        await setMatchActive(false);
      }, 1000);
    } else if (currentScores.enemy >= WINNING_SCORE) {
      setTimeout(async () => {
        setGameState("MATCH_LOST");
        await setMatchActive(false);
      }, 1000);
    } else {
      setTimeout(() => startNewRound(), 3000);
    }
  };

  // --- NETWORK DATA HANDLER ---
  const handleNetworkData = (jsonString: string) => {
    lastReceivedTime.current = Date.now();

    try {
      const msg = JSON.parse(jsonString);
      const msgType = msg.t || msg.type;

      if (msgType === "F" || msgType === "FIRE") {
        // Enemy fires in their facing direction (mirrored)
        const fireAngle = msg.a !== undefined ? (msg.a + Math.PI) : Math.PI / 2;
        bullets.current.push({
          id: Math.random(),
          x: enemyPos.current.x + PLAYER_SIZE / 2 - BULLET_WIDTH / 2,
          y: enemyPos.current.y + PLAYER_SIZE / 2 - BULLET_HEIGHT / 2,
          dx: Math.cos(fireAngle) * BULLET_SPEED,
          dy: Math.sin(fireAngle) * BULLET_SPEED,
          owner: "enemy",
        });
      } else if (msgType === "M" || msgType === "MOVE") {
        // Mirror enemy position and angle
        enemyTargetPos.current.x = (1 - msg.x) * SCREEN_WIDTH - PLAYER_SIZE;
        enemyTargetPos.current.y = (1 - msg.y) * SCREEN_HEIGHT - PLAYER_SIZE;
        if (msg.a !== undefined) {
          enemyTargetAngle.current = msg.a + Math.PI; // Flip angle for mirrored view
        }
      } 
      else if (msgType === "ROUND_LOST") {
        handleRoundResult(true); 
      }
      else if (msgType === "OPPONENT_QUIT") {
        handleOpponentDisconnect(gameStateRef.current);
      }
    } catch (e) { console.log("Parse error", e); }
  };

  // --- ACTIONS ---
  const fire = () => {
    if (gameState !== "PLAYING") return;
    // Shoot in facing direction
    bullets.current.push({
      id: Math.random(),
      x: myPos.current.x + PLAYER_SIZE / 2 - BULLET_WIDTH / 2,
      y: myPos.current.y + PLAYER_SIZE / 2 - BULLET_HEIGHT / 2,
      dx: Math.cos(myAngle.current) * BULLET_SPEED,
      dy: Math.sin(myAngle.current) * BULLET_SPEED,
      owner: "me",
    });
    // Send fire with angle for enemy to spawn bullet correctly
    LocalConnection.sendData(JSON.stringify({ t: "F", a: myAngle.current }));
  };

  const handleExit = async () => {
      // 1. If currently playing, it's a "Rage Quit" -> Send message & Penalize
      if (gameState === "PLAYING" || gameState === "ROUND_OVER") {
          await incrementBanCount();
          await setMatchActive(false);
          LocalConnection.sendData(JSON.stringify({ type: "OPPONENT_QUIT" }));
          
          // Wait briefly for message to send, then kill
          setTimeout(() => {
              LocalConnection.EndConnection();
              router.back();
          }, 100);
      } 
      // 2. If Game Over or Already Disconnected -> Just Clean up
      else {
          await setMatchActive(false); // Ensure flag is cleared
          LocalConnection.EndConnection(); // Explicitly kill native connection
          router.back();
      }
  };

  const joinRoom = (room: {id: string, name: string}) => {
    setStatusMsg(`Joining ${room.name}...`);
    LocalConnection.joinRoom(room.id);
  };


  // --- RENDER ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
            <Text style={styles.headerTitle}>{statusMsg}</Text>
            {(gameState === "PLAYING" || gameState === "ROUND_OVER") && (
                <Text style={styles.scoreText}>
                    Me: {scores.me}  -  Enemy: {scores.enemy}
                </Text>
            )}
        </View>
        <TouchableOpacity onPress={handleExit}>
          <Text style={{color: 'red', fontWeight: 'bold'}}>QUIT</Text>
        </TouchableOpacity>
      </View>

      {gameState === "LOBBY" && (
        <View style={styles.lobbyContainer}>
          {isHost ? (
            <View style={{alignItems: 'center'}}>
              <ActivityIndicator size="large" color="blue" />
              <Text style={{marginTop: 20}}>Advertising as "{myUsername}"</Text>
            </View>
          ) : (
            <>
                <FlatList
                data={foundRooms}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={<Text>Scanning for games...</Text>}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.roomItem} onPress={() => joinRoom(item)}>
                    <Text style={styles.roomText}>{item.name}</Text>
                    <Text style={styles.joinText}>JOIN</Text>
                    </TouchableOpacity>
                )}
                />
                
                {/* --- ZOMBIE FIX: ADDED REFRESH BUTTON --- */}
                <TouchableOpacity style={styles.refreshBtn} onPress={refreshLobby}>
                    <Text style={{color: 'white'}}>Refresh List</Text>
                </TouchableOpacity>
                {/* --------------------------------------- */}
            </>
          )}
        </View>
      )}

      {gameState !== "LOBBY" && (
        <View style={{flex: 1}}>
            <TouchableOpacity activeOpacity={1} style={styles.gameArea} onPress={fire}>
                {/* Enemy player with rotation */}
                <View style={[
                  styles.plane, 
                  styles.enemyPlane, 
                  { 
                    left: enemyPos.current.x, 
                    top: enemyPos.current.y,
                    transform: [{ rotate: `${enemyAngle.current + Math.PI/2}rad` }]
                  }
                ]}>
                  <View style={styles.playerArrow} />
                </View>
                
                {/* My player with rotation */}
                <View style={[
                  styles.plane, 
                  styles.myPlane, 
                  { 
                    left: myPos.current.x, 
                    top: myPos.current.y,
                    transform: [{ rotate: `${myAngle.current + Math.PI/2}rad` }]
                  }
                ]}>
                  <View style={styles.playerArrow} />
                </View>
                
                {bullets.current.map((b) => (
                    <View key={b.id} style={{position: "absolute", left: b.x, top: b.y, width: BULLET_WIDTH, height: BULLET_HEIGHT, backgroundColor: "black", borderRadius: 2}} />
                ))}
            </TouchableOpacity>
            
            {/* Rotation Controls */}
            {gameState === "PLAYING" && (
              <View style={styles.controlsContainer}>
                <TouchableOpacity
                  style={styles.rotateBtn}
                  onPressIn={() => { rotationInput.current = -1; }}
                  onPressOut={() => { rotationInput.current = 0; }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.triangle, styles.triangleLeft]} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.rotateBtn}
                  onPressIn={() => { rotationInput.current = 1; }}
                  onPressOut={() => { rotationInput.current = 0; }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.triangle, styles.triangleRight]} />
                </TouchableOpacity>
              </View>
            )}

            {gameState === "ROUND_OVER" && (
                <View style={styles.overlay} pointerEvents="none"> 
                    <Text style={[styles.resultText, { color: roundWinner === "me" ? "green" : "red" }]}>
                        {roundWinner === "me" ? "ROUND WON" : "ROUND LOST"}
                    </Text>
                    <Text style={{fontSize: 20}}>Next round starting...</Text>
                </View>
            )}

            {(gameState === "MATCH_WON" || gameState === "MATCH_LOST" || gameState === "DISCONNECT") && (
                <View style={styles.overlay}>
                    <Text style={[styles.resultText, { color: gameState === "MATCH_WON" || gameState === "DISCONNECT" ? "green" : "red" }]}>
                        {gameState === "DISCONNECT" ? "OPPONENT LEFT" : (gameState === "MATCH_WON" ? "VICTORY" : "DEFEAT")}
                    </Text>
                    <Text style={{fontSize: 20, marginBottom: 20}}>
                        Final Score: {scores.me} - {scores.enemy}
                    </Text>
                    
                    <TouchableOpacity style={styles.resetBtn} onPress={handleExit}>
                        <Text style={styles.btnText}>Exit to Menu</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: "center", borderBottomWidth: 1, borderColor: "#eee" },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  scoreText: { fontSize: 18, fontWeight: 'bold', color: 'blue', marginTop: 5 },
  lobbyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 20 },
  roomItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#f5f5f5', marginBottom: 10, borderRadius: 8, width: SCREEN_WIDTH * 0.9 },
  roomText: { fontSize: 16, fontWeight: 'bold' },
  joinText: { color: 'blue', fontWeight: 'bold' },
  gameArea: { flex: 1, backgroundColor: "#1a1a2e" },
  plane: { 
    position: "absolute", 
    width: PLAYER_SIZE, 
    height: PLAYER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myPlane: { backgroundColor: "#3498db" },
  enemyPlane: { backgroundColor: "#e74c3c" },
  playerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'white',
    marginTop: -5,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  rotateBtn: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(52, 152, 219, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  triangle: {
    width: 0,
    height: 0,
    borderTopWidth: 20,
    borderBottomWidth: 20,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  triangleLeft: {
    borderRightWidth: 30,
    borderRightColor: 'white',
  },
  triangleRight: {
    borderLeftWidth: 30,
    borderLeftColor: 'white',
  },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.95)", justifyContent: "center", alignItems: "center", zIndex: 100 },
  resultText: { fontSize: 40, fontWeight: "bold", marginBottom: 20 },
  resetBtn: { backgroundColor: "black", paddingHorizontal: 30, paddingVertical: 15, borderRadius: 8 },
  btnText: { color: "white", fontWeight: "bold", fontSize: 18 },
  refreshBtn: { marginTop: 10, backgroundColor: 'gray', padding: 10, borderRadius: 5 }
});