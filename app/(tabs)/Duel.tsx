import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { requireNativeModule } from "expo-modules-core";
import { DeviceMotion } from "expo-sensors";

// --- CONFIGURATION ---
const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const PLAYER_SIZE = 50;
const BULLET_WIDTH = 10;
const BULLET_HEIGHT = 20;
const BULLET_SPEED = 15;
const PLAYER_SPEED_MULTIPLIER = 15; // How fast tilt moves player
const NETWORK_UPDATE_RATE = 50; // ms between position updates

const LocalConnection = requireNativeModule("LocalConnection");

export default function DuelScreen() {
  // Game State
  const [connectionStatus, setConnectionStatus] = useState("Searching...");
  const [gameState, setGameState] = useState("LOBBY");

  // Game Objects (Refs for performance)
  const bullets = useRef([]);

  // My Position (Starts bottom center)
  const myPos = useRef({
    x: SCREEN_WIDTH / 2 - PLAYER_SIZE / 2,
    y: SCREEN_HEIGHT - 150,
  });

  // Enemy Position (Starts top center)
  const enemyPos = useRef({
    x: SCREEN_WIDTH / 2 - PLAYER_SIZE / 2,
    y: 50,
  });

  // Sensor Data
  const currentTilt = useRef({ alpha: 0, beta: 0, gamma: 0 });

  // Timers
  const reqRef = useRef();
  const lastSentTime = useRef(0);

  // Force Render
  const [tick, setTick] = useState(0);
  const forceUpdate = () => setTick((t) => t + 1);

  // --- SENSORS SETUP ---
  useEffect(() => {
    // Request permissions just in case
    DeviceMotion.requestPermissionsAsync();

    // Subscribe to motion updates
    const subscription = DeviceMotion.addListener((data) => {
      // Rotation data (alpha, beta, gamma)
      if (data.rotation) {
        currentTilt.current = data.rotation;
      }
    });

    // Set update interval (faster is smoother)
    DeviceMotion.setUpdateInterval(16);

    return () => {
      subscription.remove();
    };
  }, []);

  // --- NETWORK SETUP ---
  useEffect(() => {
    LocalConnection.startSession();

    const subscription = LocalConnection.addListener("onChange", (event) => {
      switch (event.type) {
        case "connected":
          setConnectionStatus("Connected");
          setGameState("PLAYING");
          break;

        case "disconnected":
          setConnectionStatus("Disconnected");
          setGameState("LOBBY");
          bullets.current = [];
          break;

        case "data":
          handleNetworkData(event.data);
          break;
      }
    });

    return () => {
      subscription.remove();
      LocalConnection.stopSession();
      cancelAnimationFrame(reqRef.current);
    };
  }, []);

  // --- GAME LOOP ---
  const updateGame = () => {
    if (gameState !== "PLAYING") return;

    // 1. Update My Position based on Tilt
    // Gamma (y-axis rotation) = Left/Right
    // Beta (x-axis rotation) = Forward/Back
    const { beta, gamma } = currentTilt.current;

    // Move X (Gamma)
    myPos.current.x += gamma * PLAYER_SPEED_MULTIPLIER;

    // Move Y (Beta) - adjustments for device orientation logic
    // Usually positive beta is tilting towards user (screen up)
    // We want tilting forward (screen away) to decrease Y (move up)
    myPos.current.y += (beta - 0.7) * PLAYER_SPEED_MULTIPLIER; // 0.7 offset for comfortable holding angle

    // 2. Constrain to My Half
    // X Boundaries
    if (myPos.current.x < 0) myPos.current.x = 0;
    if (myPos.current.x > SCREEN_WIDTH - PLAYER_SIZE)
      myPos.current.x = SCREEN_WIDTH - PLAYER_SIZE;

    // Y Boundaries (Bottom half only)
    const midScreen = SCREEN_HEIGHT / 2;
    if (myPos.current.y < midScreen) myPos.current.y = midScreen;
    if (myPos.current.y > SCREEN_HEIGHT - PLAYER_SIZE)
      myPos.current.y = SCREEN_HEIGHT - PLAYER_SIZE;

    // 3. Network Sync (Throttled)
    const now = Date.now();
    if (now - lastSentTime.current > NETWORK_UPDATE_RATE) {
      // Send normalized coordinates (0-1) to handle different screen sizes
      const payload = {
        type: "MOVE",
        x: myPos.current.x / SCREEN_WIDTH,
        y: myPos.current.y / SCREEN_HEIGHT,
      };
      LocalConnection.sendData(JSON.stringify(payload));
      lastSentTime.current = now;
    }

    // 4. Move Bullets
    bullets.current.forEach((b) => {
      b.y += b.dy;
    });

    // 5. Remove off-screen bullets
    bullets.current = bullets.current.filter(
      (b) => b.y > -50 && b.y < SCREEN_HEIGHT + 50
    );

    // 6. Collision Detection
    const myRect = { ...myPos.current, w: PLAYER_SIZE, h: PLAYER_SIZE };

    const hit = bullets.current.find(
      (b) =>
        b.owner === "enemy" &&
        b.x < myRect.x + myRect.w &&
        b.x + BULLET_WIDTH > myRect.x &&
        b.y < myRect.y + myRect.h &&
        b.y + BULLET_HEIGHT > myRect.y
    );

    if (hit) {
      handleGameOver(false);
    }

    forceUpdate();
    reqRef.current = requestAnimationFrame(updateGame);
  };

  useEffect(() => {
    if (gameState === "PLAYING") {
      reqRef.current = requestAnimationFrame(updateGame);
    } else {
      cancelAnimationFrame(reqRef.current);
    }
  }, [gameState]);

  // --- LOGIC ---

  const handleNetworkData = (jsonString) => {
    try {
      const msg = JSON.parse(jsonString);

      if (msg.type === "FIRE") {
        bullets.current.push({
          id: Math.random(),
          x: enemyPos.current.x + PLAYER_SIZE / 2 - BULLET_WIDTH / 2,
          y: enemyPos.current.y + PLAYER_SIZE,
          dy: BULLET_SPEED,
          owner: "enemy",
        });
      } else if (msg.type === "MOVE") {
        // Invert coordinates for opponent view
        // Their "Left" is my "Right" if we face each other?
        // Actually, let's assume mirrored X: (Width - x - size)
        // And inverted Y: (Height - y - size)
        enemyPos.current.x = (1 - msg.x) * SCREEN_WIDTH - PLAYER_SIZE;
        enemyPos.current.y = (1 - msg.y) * SCREEN_HEIGHT - PLAYER_SIZE;
      } else if (msg.type === "GAME_OVER") {
        setGameState("WON");
      }
    } catch (e) {
      console.log("Parse error", e);
    }
  };

  const fire = () => {
    if (gameState !== "PLAYING") return;

    bullets.current.push({
      id: Math.random(),
      x: myPos.current.x + PLAYER_SIZE / 2 - BULLET_WIDTH / 2,
      y: myPos.current.y,
      dy: -BULLET_SPEED,
      owner: "me",
    });

    LocalConnection.sendData(JSON.stringify({ type: "FIRE" }));
  };

  const handleGameOver = (iWon) => {
    setGameState(iWon ? "WON" : "LOST");
    if (!iWon) {
      LocalConnection.sendData(JSON.stringify({ type: "GAME_OVER" }));
    }
  };

  const resetGame = () => {
    bullets.current = [];
    // Reset positions
    myPos.current = {
      x: SCREEN_WIDTH / 2 - PLAYER_SIZE / 2,
      y: SCREEN_HEIGHT - 150,
    };
    setGameState("PLAYING");
  };

  // --- RENDER ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.statusText}>
          {connectionStatus} | State: {gameState}
        </Text>
        <Text style={{ fontSize: 10, color: "#ccc" }}>Tilt to move!</Text>
      </View>

      <TouchableOpacity
        activeOpacity={1}
        style={styles.gameArea}
        onPress={fire}
        disabled={gameState !== "PLAYING"}
      >
        {/* ENEMY PLANE */}
        <View
          style={[
            styles.plane,
            styles.enemyPlane,
            {
              left: enemyPos.current.x,
              top: enemyPos.current.y,
            },
          ]}
        />

        {/* MY PLANE */}
        <View
          style={[
            styles.plane,
            styles.myPlane,
            {
              left: myPos.current.x,
              top: myPos.current.y,
            },
          ]}
        />

        {/* BULLETS */}
        {bullets.current.map((b) => (
          <View
            key={b.id}
            style={{
              position: "absolute",
              left: b.x,
              top: b.y,
              width: BULLET_WIDTH,
              height: BULLET_HEIGHT,
              backgroundColor: "black",
            }}
          />
        ))}

        {(gameState === "WON" || gameState === "LOST") && (
          <View style={styles.overlay}>
            <Text
              style={[
                styles.resultText,
                { color: gameState === "WON" ? "green" : "red" },
              ]}
            >
              {gameState === "WON" ? "VICTORY" : "DEFEAT"}
            </Text>
            <TouchableOpacity style={styles.resetBtn} onPress={resetGame}>
              <Text style={styles.btnText}>Rematch</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 10,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  statusText: {
    fontSize: 14,
    color: "#888",
  },
  gameArea: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  plane: {
    position: "absolute",
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
  },
  myPlane: {
    backgroundColor: "blue",
  },
  enemyPlane: {
    backgroundColor: "red",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  resultText: {
    fontSize: 40,
    fontWeight: "bold",
    marginBottom: 20,
  },
  resetBtn: {
    backgroundColor: "black",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  btnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
});
