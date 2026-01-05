# Duels Game Implementation Plan

## Overview
A real-time multiplayer ship battle game where two connected players control ships that constantly move forward. Players can rotate clockwise and shoot bullets. Game syncs via the local connection module.

---

## Phase 1: Game State & Message Protocol

### 1.1 Define Game State Types
```typescript
type Role = 'host' | 'guest';

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

type GamePhase = 'waiting' | 'playing' | 'win' | 'lose';

type GameState = {
  phase: GamePhase;
  myShip: Ship;
  opponentShip: Ship;
  myBullets: Bullet[];
  opponentBullets: Bullet[];
  worldRatio: number; // width/height of shared play area
};
```

### 1.2 Message Protocol
All messages sent via `LocalConnectionModule.sendData()` as JSON strings:

| Message Type | Payload | Direction |
|--------------|---------|-----------|
| `start_game` | `{ worldRatio: number }` | Host → Guest |
| `ready` | `{ screenRatio: number }` | Guest → Host |
| `state` | `{ x, y, angle, bullets[] }` | Both (every frame) |
| `hit` | `{ victimId: string }` | Shooter → Opponent |
| `restart` | `{}` | Host → Guest |

---

## Phase 2: Screen Flow Changes

### 2.1 Modify Connected Screen
Current flow ends at `connected`. Extend to:

```
connected (phase: waiting)
    ↓ [host presses "Start Game"]
    ↓ [exchange screen ratios, compute shared worldRatio]
playing (phase: playing)
    ↓ [hit detected]
win/lose (phase: win | lose) — 1 second
    ↓ [auto restart]
playing ...
```

### 2.2 Screen States in `Duels.tsx`
Replace simple `screen` state with:
```typescript
const [screen, setScreen] = useState<'home' | 'hosting' | 'browsing' | 'connected'>('home');
const [gamePhase, setGamePhase] = useState<'waiting' | 'playing' | 'win' | 'lose'>('waiting');
const [role, setRole] = useState<Role | null>(null);
```

---

## Phase 3: Safe Area & World Ratio Sync

### 3.1 Get Safe Area Dimensions
Use `react-native-safe-area-context`:
```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dimensions } from 'react-native';

const insets = useSafeAreaInsets();
const { width, height } = Dimensions.get('window');
const playableWidth = width;
const playableHeight = height - insets.top - insets.bottom - BUTTON_AREA_HEIGHT;
const screenRatio = playableWidth / playableHeight;
```

### 3.2 Ratio Sync Protocol
1. When connected, guest sends `ready` with their `screenRatio`
2. Host waits for `ready`, then shows "Start Game" button
3. Host presses start → sends `start_game` with `worldRatio = min(hostRatio, guestRatio)`
4. Both phones use `worldRatio` to compute their game viewport

---

## Phase 4: Game Loop Implementation

### 4.1 Game Constants
```typescript
const SHIP_SPEED = 0.15;        // units per second (normalized)
const ROTATION_SPEED = Math.PI; // radians per second
const BULLET_SPEED = 0.4;       // units per second
const SHIP_SIZE = 0.05;         // normalized
const BULLET_SIZE = 0.015;      // normalized
const SYNC_INTERVAL = 50;       // ms between state syncs
```

### 4.2 Game Loop (useEffect with requestAnimationFrame)
```typescript
useEffect(() => {
  if (gamePhase !== 'playing') return;
  
  let lastTime = Date.now();
  let animationId: number;
  
  const loop = () => {
    const now = Date.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    
    // 1. Update my ship position
    updateShipPosition(dt);
    
    // 2. Update my bullets
    updateBullets(dt);
    
    // 3. Check collisions (my bullets vs opponent, my ship vs border)
    checkCollisions();
    
    // 4. Render (setState triggers re-render)
    
    animationId = requestAnimationFrame(loop);
  };
  
  animationId = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(animationId);
}, [gamePhase]);
```

### 4.3 State Sync (separate interval)
```typescript
useEffect(() => {
  if (gamePhase !== 'playing') return;
  
  const interval = setInterval(() => {
    const msg = JSON.stringify({
      type: 'state',
      x: myShip.x,
      y: myShip.y,
      angle: myShip.angle,
      bullets: myBullets.map(b => ({ id: b.id, x: b.x, y: b.y, angle: b.angle }))
    });
    LocalConnectionModule.sendData(msg);
  }, SYNC_INTERVAL);
  
  return () => clearInterval(interval);
}, [gamePhase, myShip, myBullets]);
```

---

## Phase 5: Ship Movement & Controls

### 5.1 Ship Update
```typescript
const updateShipPosition = (dt: number) => {
  setMyShip(prev => {
    let newX = prev.x + Math.cos(prev.angle) * SHIP_SPEED * dt;
    let newY = prev.y + Math.sin(prev.angle) * SHIP_SPEED * dt;
    
    // Border collision (bounce)
    if (newX < 0 || newX > 1) {
      newX = Math.max(0, Math.min(1, newX));
      // Reflect angle horizontally
    }
    if (newY < 0 || newY > 1) {
      newY = Math.max(0, Math.min(1, newY));
      // Reflect angle vertically
    }
    
    return { ...prev, x: newX, y: newY };
  });
};
```

### 5.2 Rotation (while button held)
```typescript
const [isRotating, setIsRotating] = useState(false);

// In game loop:
if (isRotating) {
  setMyShip(prev => ({
    ...prev,
    angle: prev.angle + ROTATION_SPEED * dt
  }));
}
```

### 5.3 Shooting
```typescript
const shoot = () => {
  const bullet: Bullet = {
    id: `${Date.now()}-${Math.random()}`,
    x: myShip.x,
    y: myShip.y,
    angle: myShip.angle,
    ownerId: 'player'
  };
  setMyBullets(prev => [...prev, bullet]);
};
```

---

## Phase 6: Collision Detection

### 6.1 Bullet vs Ship (AABB)
```typescript
const checkBulletHit = (bullet: Bullet, ship: Ship): boolean => {
  const dx = Math.abs(bullet.x - ship.x);
  const dy = Math.abs(bullet.y - ship.y);
  return dx < (BULLET_SIZE + SHIP_SIZE) / 2 && dy < (BULLET_SIZE + SHIP_SIZE) / 2;
};
```

### 6.2 Collision Check Loop
```typescript
const checkCollisions = () => {
  // My bullets vs opponent ship
  for (const bullet of myBullets) {
    if (checkBulletHit(bullet, opponentShip)) {
      // I win
      LocalConnectionModule.sendData(JSON.stringify({ type: 'hit', victimId: 'opponent' }));
      setGamePhase('win');
      return;
    }
  }
  
  // Opponent bullets vs my ship (handled via 'hit' message from opponent)
};
```

---

## Phase 7: Win/Lose & Restart

### 7.1 Handle Hit Message
```typescript
// In onChange listener:
case 'hit':
  setGamePhase('lose');
  break;
```

### 7.2 Auto-Restart After 1 Second
```typescript
useEffect(() => {
  if (gamePhase !== 'win' && gamePhase !== 'lose') return;
  
  const timeout = setTimeout(() => {
    if (role === 'host') {
      LocalConnectionModule.sendData(JSON.stringify({ type: 'restart' }));
    }
    resetGameState();
    setGamePhase('playing');
  }, 1000);
  
  return () => clearTimeout(timeout);
}, [gamePhase, role]);
```

### 7.3 Reset Game State
```typescript
const resetGameState = () => {
  // Host starts top-left, Guest starts bottom-right
  const startPos = role === 'host' 
    ? { x: 0.2, y: 0.2, angle: Math.PI / 4 }
    : { x: 0.8, y: 0.8, angle: -3 * Math.PI / 4 };
  
  setMyShip({ ...startPos, id: 'player' });
  setMyBullets([]);
  setOpponentBullets([]);
};
```

---

## Phase 8: UI Layout

### 8.1 Game Screen Structure
```
┌─────────────────────────────┐
│      Safe Area (game)       │
│                             │
│   [opponent ship]           │
│                             │
│         [bullets]           │
│                             │
│           [my ship]         │
│                             │
├─────────────────────────────┤
│  [SHOOT]         [ROTATE]   │  ← Button Area (fixed height)
└─────────────────────────────┘
```

### 8.2 Render Components
```tsx
// Game view (simple boxes)
<View style={styles.gameArea}>
  {/* My ship */}
  <View style={[styles.ship, styles.myShip, {
    left: myShip.x * gameWidth - SHIP_SIZE/2,
    top: myShip.y * gameHeight - SHIP_SIZE/2,
    transform: [{ rotate: `${myShip.angle}rad` }]
  }]} />
  
  {/* Opponent ship */}
  <View style={[styles.ship, styles.opponentShip, {
    left: opponentShip.x * gameWidth - SHIP_SIZE/2,
    top: opponentShip.y * gameHeight - SHIP_SIZE/2,
    transform: [{ rotate: `${opponentShip.angle}rad` }]
  }]} />
  
  {/* Bullets */}
  {[...myBullets, ...opponentBullets].map(b => (
    <View key={b.id} style={[styles.bullet, {
      left: b.x * gameWidth,
      top: b.y * gameHeight,
    }]} />
  ))}
</View>

// Controls
<View style={styles.controls}>
  <Pressable onPress={shoot} style={styles.button}>
    <Text>SHOOT</Text>
  </Pressable>
  <Pressable 
    onPressIn={() => setIsRotating(true)}
    onPressOut={() => setIsRotating(false)}
    style={styles.button}
  >
    <Text>ROTATE</Text>
  </Pressable>
</View>
```

### 8.3 Basic Styles
```typescript
const styles = StyleSheet.create({
  gameArea: {
    flex: 1,
    backgroundColor: '#111',
  },
  ship: {
    position: 'absolute',
    width: 40,
    height: 40,
  },
  myShip: {
    backgroundColor: '#4CAF50',
  },
  opponentShip: {
    backgroundColor: '#F44336',
  },
  bullet: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: '#FFF',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    height: 100,
  },
  button: {
    width: 100,
    height: 60,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

---

## Phase 9: Message Handling Update

### 9.1 Enhanced onChange Listener
```typescript
const subscription = LocalConnectionModule.addListener('onChange', (event: any) => {
  // Parse JSON for game messages
  try {
    const msg = JSON.parse(event.data);
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
        // Update opponent position and bullets
        setOpponentShip(prev => ({ ...prev, x: msg.x, y: msg.y, angle: msg.angle }));
        setOpponentBullets(msg.bullets.map((b: any) => ({ ...b, ownerId: 'opponent' })));
        break;
      case 'hit':
        setGamePhase('lose');
        break;
      case 'restart':
        resetGameState();
        setGamePhase('playing');
        break;
    }
  } catch {
    // Handle existing event types (found, lost, connected, etc.)
    switch (event.type) {
      // ... existing cases
    }
  }
});
```

---

## Implementation Checklist

- [ ] Add game state types and constants
- [ ] Implement role tracking (host/guest)
- [ ] Add screen ratio exchange on connect
- [ ] Add "Start Game" button for host in waiting phase
- [ ] Implement game loop with requestAnimationFrame
- [ ] Implement ship movement with constant velocity
- [ ] Implement rotation (hold to rotate clockwise)
- [ ] Implement shooting
- [ ] Implement bullet updates
- [ ] Implement state sync between devices
- [ ] Implement collision detection (bullet vs ship)
- [ ] Implement border collision/bounce
- [ ] Implement win/lose screens
- [ ] Implement auto-restart after 1 second
- [ ] Add simple UI (boxes for ships, squares for buttons)
- [ ] Test with two devices

---

## Notes

- All positions normalized (0-1) for cross-device compatibility
- Ship moves forward automatically, player only controls rotation and shooting
- State syncs every 50ms for smooth gameplay
- Collision detection runs locally, winner sends "hit" message
- Connection persists through game restarts
- Host controls game start and restart timing

