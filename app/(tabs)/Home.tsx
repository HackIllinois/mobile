import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import EventOrbit from "../../components/home/EventOrbit";
import OrbitItem from "../../components/home/OrbitItem";
import RocketOrbit from "../../components/home/RocketOrbit";
import { getTimeRemaining } from "../../components/home/countdown";
import HomeBackground from "../../assets/home/home_bg.svg";
import TimerOutline from "../../assets/home/timer_outline.svg";

import { getConstrainedWidth } from "../../lib/layout";

const window = Dimensions.get("window");
const width = getConstrainedWidth();
const height = window.height;

export type StageKey =
  | "checkin"
  | "scavenger"
  | "opening"
  | "showcase"
  | "hacking"
  | "closing";

const STAGE_ORDER: StageKey[] = ["checkin", "scavenger", "opening", "hacking", "showcase", "closing"];
const stageIndex = (s: StageKey) => STAGE_ORDER.indexOf(s);

interface Orbit {
  radius: number;
  centerX: number;
  centerY: number;
}

interface OrbitEvent {
  eventKey: Exclude<StageKey, "closing">;
  angle: number;
  orbit: Orbit;
  size: number;
  fixed?: false;
  offsetX?: number;
  offsetY?: number;
  jigglePx?: number;
  jigglePeriodMs?: number;
}

interface FixedEvent {
  eventKey: "closing";
  x: number;
  y: number;
  size: number;
  fixed: true;
  offsetX?: number;
  offsetY?: number;
  jigglePx?: number;
  jigglePeriodMs?: number;
}

type EventItem = OrbitEvent | FixedEvent;

const ROCKET_CFG: Partial<Record<StageKey, {
  radiusMul?: number;
  centerXMul?: number;
  centerYMul?: number;
  size?: number;
}>> = {
  checkin:   { radiusMul: 0.85, centerYMul: 0.1,  size: 40 },
  scavenger: { radiusMul: 0.8,  centerYMul: 0.05, size: 40 },
  opening:   { radiusMul: 0.95, centerYMul: 0,    size: 40 },
  hacking:   { radiusMul: 0.85, centerYMul: 0.08, size: 40 },
  showcase:  { radiusMul: 0.85, centerYMul: 0.05, size: 42 },
  closing:   { radiusMul: 0.75, centerYMul: 0.00, size: 40 },
};

const DEBUG_NOW: Date | null =
  __DEV__ ? new Date("2026-03-01T15:30:00-06:00") : null;

const now = () => DEBUG_NOW ?? new Date();

// Must match CurvedTabBar's BAR_HEIGHT
const NAVBAR_HEIGHT = 85;

// Space between timer bottom and top of closing planet
const CLOSING_PLANET_GAP = 16;
const CLOSING_PLANET_SIZE = 180;

// Bottom padding so the outermost planet/rocket clears the navbar
const BOTTOM_CLEARANCE = 20;

export default function HomeScreen() {
  const targetDate = new Date("2026-02-27T18:00:00");
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(targetDate));
  const insets = useSafeAreaInsets();

  // Track where the timer header ends
  const [timerBottom, setTimerBottom] = useState(height * 0.18);

  const onTimerLayout = (e: any) => {
    const { y, height: h } = e.nativeEvent.layout;
    setTimerBottom(y + h);
  };

  // anchorY = center of closing planet = timerBottom + gap + half planet height
  const anchorY = timerBottom + CLOSING_PLANET_GAP + CLOSING_PLANET_SIZE / 2;

  // The hard bottom boundary planets/rocket must not cross:
  // screen height minus the navbar, minus bottom safe area inset, minus clearance
  const bottomBoundary = height - NAVBAR_HEIGHT - insets.bottom - BOTTOM_CLEARANCE;

  // Available vertical space from anchorY to the bottom boundary.
  // The outermost orbit center is anchorY; at angle ~100° (checkin),
  // the planet Y = anchorY + outerRadius * sin(100°) + planetHalfSize.
  // sin(100°) ≈ 0.985. We solve for maxOuterRadius:
  //   anchorY + maxOuterRadius * 0.985 + 40 <= bottomBoundary
  //   maxOuterRadius <= (bottomBoundary - anchorY - 40) / 0.985
  const maxOuterRadius = (bottomBoundary - anchorY - 40) / 0.985;

  // The outermost orbit (index 4, checkin) has radius:
  //   orbitScale * 5 * orbitGap * orbitMultipliers[4]  =  1.2 * 5 * orbitGap * 1.15  =  6.9 * orbitGap
  // Solve for orbitGap:
  const derivedOrbitGap = maxOuterRadius / 6.9;

  // Clamp so it never looks weird on huge screens or tiny ones
  const orbitGap = Math.min(Math.max(derivedOrbitGap, width * 0.11), width * 0.18);

  const SCHEDULE = useMemo(() => {
    const checkinStart  = new Date("2026-02-27T14:00:00-06:00");
    const checkinEnd    = new Date("2026-02-27T17:00:00-06:00");
    const scavStart     = new Date("2026-02-27T15:00:00-06:00");
    const scavEnd       = new Date("2026-02-27T17:00:00-06:00");
    const openingStart  = new Date("2026-02-27T17:00:00-06:00");
    const openingEnd    = new Date("2026-02-27T18:00:00-06:00");
    const showcaseStart = new Date("2026-02-28T17:00:00-06:00");
    const showcaseEnd   = new Date("2026-02-28T19:00:00-06:00");
    const closingStart  = new Date("2026-03-01T15:00:00-06:00");
    const closingEnd    = new Date("2026-03-01T16:00:00-06:00");
    const hackingStart  = openingEnd;
    const hackingEnd    = showcaseStart;

    return {
      checkin:   { start: checkinStart,  end: checkinEnd },
      scavenger: { start: scavStart,     end: scavEnd },
      opening:   { start: openingStart,  end: openingEnd },
      hacking:   { start: hackingStart,  end: hackingEnd },
      showcase:  { start: showcaseStart, end: showcaseEnd },
      closing:   { start: closingStart,  end: closingEnd },
    } satisfies Record<StageKey, { start: Date; end: Date }>;
  }, []);

  const computeStage = (t: Date): StageKey => {
    let best: StageKey = "checkin";
    for (const key of STAGE_ORDER) {
      if (t >= SCHEDULE[key].start) best = key;
    }
    if (t > SCHEDULE.closing.end) return "closing";
    return best;
  };

  const [currentStage, setCurrentStage] = useState<StageKey>(() => computeStage(new Date()));
  // const [currentStage, setCurrentStage] = useState<StageKey>(() => computeStage(now()));

  useEffect(() => {
    const id = setInterval(() => setCurrentStage(computeStage(new Date())), 1000);
    return () => clearInterval(id);
  }, [SCHEDULE]);

  // useEffect(() => {
  //   const id = setInterval(() => setCurrentStage(computeStage(now())), 1000);
  //   return () => clearInterval(id);
  // }, [SCHEDULE]);

  const anchorX = width / 2;
  const orbitScale = 1.2;
  const orbitMultipliers = [1.7, 1.2, 1.2, 1.2, 1.15];

  // Memoize orbits so they only recompute when anchorY/orbitGap actually change,
  // not on every render (e.g. timer tick)
  const orbits: Orbit[] = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    radius: orbitScale * (i + 1) * orbitGap * orbitMultipliers[Math.min(i, orbitMultipliers.length - 1)],
    centerX: anchorX,
    centerY: anchorY,
  })), [anchorY, orbitGap]);

  const items: EventItem[] = useMemo(() => [
    { eventKey: "closing",   x: anchorX, y: anchorY, size: CLOSING_PLANET_SIZE, fixed: true } as FixedEvent,
    { eventKey: "showcase",  orbit: orbits[0], angle: 140, size: 80,  offsetY: -6,  jigglePx: 14, jigglePeriodMs: 5200 } as OrbitEvent,
    { eventKey: "hacking",   orbit: orbits[1], angle: 60,  size: 80,               jigglePx: 12, jigglePeriodMs: 6100 } as OrbitEvent,
    { eventKey: "opening",   orbit: orbits[2], angle: 105, size: 70,               jigglePx: 10, jigglePeriodMs: 6900 } as OrbitEvent,
    { eventKey: "scavenger", orbit: orbits[3], angle: 70,  size: 100,              jigglePx: 12, jigglePeriodMs: 7600 } as OrbitEvent,
    { eventKey: "checkin",   orbit: orbits[4], angle: 100, size: 80,  offsetY: -8, jigglePx: 9,  jigglePeriodMs: 8400 } as OrbitEvent,
  ], [anchorY, orbits]);

  // Periods are static — pull them out so jiggle animations never need to restart
  const JIGGLE_PERIODS = useRef([5200, 6100, 6900, 7600, 8400, 9100]).current;

  // One Animated.Value per planet, created once
  const jiggleAnims = useRef(JIGGLE_PERIODS.map(() => new Animated.Value(0))).current;

  // Empty dep array: start once on mount, never restart.
  // anchorY/orbitGap changes move the planet's *position* (via items/orbits above)
  // but the animation value itself keeps running smoothly without interruption.
  useEffect(() => {
    const animations = jiggleAnims.map((anim, i) => {
      anim.setValue(0);
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: JIGGLE_PERIODS[i] / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: JIGGLE_PERIODS[i] / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
    });
    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentIdx = stageIndex(currentStage);

  const getVariantFor = (eventKey: StageKey): "normal" | "finished" => {
    const idx = stageIndex(eventKey);
    if (idx < currentIdx) return "finished";
    if (currentStage === "closing" && eventKey === "closing") return "finished";
    return "normal";
  };

  const rocketTarget = useMemo(() => {
    if (currentStage === "closing") return null;
    const target = items.find((it) => it.eventKey === currentStage);
    if (!target) return null;

    const ox = target.offsetX ?? 0;
    const oy = target.offsetY ?? 0;

    if ("fixed" in target && target.fixed) {
      return { x: target.x + ox, y: target.y + oy, planetSize: target.size };
    }

    const rad = (target.angle * Math.PI) / 180;
    return {
      x: target.orbit.centerX + target.orbit.radius * Math.cos(rad) + ox,
      y: target.orbit.centerY + target.orbit.radius * Math.sin(rad) + oy,
      planetSize: target.size,
    };
  }, [items, currentStage]);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeRemaining(targetDate)), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (num: number) => String(num).padStart(2, "0");

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <HomeBackground
        width={width}
        height={height}
        style={StyleSheet.absoluteFill}
        preserveAspectRatio="xMidYMid slice"
      />

      {/* Timer header — NOT absolute, lives in normal flow.
          onLayout fires with its actual y + height so we know exactly
          where it ends and can place the closing planet flush below it. */}
      <View style={styles.headerOverlay} onLayout={onTimerLayout} pointerEvents="none">
        <Text style={styles.timerLabel}>T-minus Liftoff</Text>
        <View style={styles.timerPill}>
          <TimerOutline width="100%" height="100%" style={StyleSheet.absoluteFill} />
          <Text style={styles.timerText}>
            {formatTime(timeLeft.days)}:{formatTime(timeLeft.hours)}:
            {formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
          </Text>
        </View>
      </View>

      {/* Rings */}
      {orbits.map((orbit, i) => (
        <EventOrbit key={i} radius={orbit.radius} centerY={orbit.centerY} color="#687983ff" strokeWidth={1} />
      ))}

      {/* Planets */}
      {items.map((item, i) => {
        const jigglePx =
          ("jigglePx" in item && item.jigglePx != null) ? item.jigglePx! : 10;

        if ("fixed" in item && item.fixed) {
          return (
            <OrbitItem
              key={i}
              eventKey={item.eventKey}
              radius={0}
              centerY={item.y}
              angle={0}
              size={item.size}
              offsetX={item.offsetX}
              offsetY={item.offsetY}
              variant={getVariantFor(item.eventKey)}
              onPress={(key) => console.log("pressed", key)}
            />
          );
        }

        return (
          <OrbitItem
            key={i}
            eventKey={item.eventKey}
            radius={item.orbit.radius}
            centerY={item.orbit.centerY}
            angle={item.angle}
            size={item.size}
            offsetX={item.offsetX}
            offsetY={item.offsetY}
            variant={getVariantFor(item.eventKey)}
            jiggle={jiggleAnims[i]}
            jigglePx={jigglePx}
          />
        );
      })}

      {/* Rocket */}
      {rocketTarget && (() => {
        const cfg = ROCKET_CFG[currentStage] ?? {};
        const radiusMul = cfg.radiusMul ?? 0.75;
        const cx = rocketTarget.x + (cfg.centerXMul ?? 0) * rocketTarget.planetSize;
        const cy = rocketTarget.y + (cfg.centerYMul ?? 0.08) * rocketTarget.planetSize;
        const rocketSize = cfg.size ?? 40;

        return (
          <RocketOrbit
            centerX={cx}
            centerY={cy}
            orbitRadius={rocketTarget.planetSize * radiusMul}
            size={rocketSize}
            periodMs={7800}
            startAngleDeg={0}
            clockwise={false}
          />
        );
      })()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  headerOverlay: {
    // In normal document flow — NOT absolute position.
    // This lets onLayout report the true bottom coordinate.
    alignSelf: "center",
    alignItems: "center",
    marginTop: 12,
    zIndex: 50,
  },
  timerLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  timerPill: {
    width: 190,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  timerText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700", letterSpacing: 0.5 },
});