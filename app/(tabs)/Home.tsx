import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import EventOrbit from "../../components/home/EventOrbit";
import OrbitItem from "../../components/home/OrbitItem";
import RocketOrbit from "../../components/home/RocketOrbit";
import { getTimeRemaining } from "../../components/home/countdown";
import HomeBackground from "../../assets/home/home_bg.svg";
import TimerOutline from "../../assets/home/timer_outline.svg";

const { width, height } = Dimensions.get("window");

export type StageKey =
  | "checkin"
  | "scavenger"
  | "opening"
  | "showcase"
  | "hacking"
  | "closing";

const STAGE_ORDER: StageKey[] = ["checkin", "scavenger", "opening", "showcase", "hacking", "closing"];
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

  
  jigglePx?: number; // sway amount
  jigglePeriodMs?: number; // sway period
}

interface FixedEvent {
  eventKey: "closing";
  x: number;
  y: number;
  size: number;
  fixed: true;
  offsetX?: number;
  offsetY?: number;

  // closing jiggle, none for now ofc
  jigglePx?: number;
  jigglePeriodMs?: number;
}

type EventItem = OrbitEvent | FixedEvent;

export default function HomeScreen() {
  const targetDate = new Date("2026-02-27T18:00:00");
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(targetDate));

  // replace later with actual stage logic based on timings
  const [currentStage, setCurrentStage] = useState<StageKey>("opening");

  const anchorX = width / 2;
  const anchorY = height * 0.25;
  const orbitGap = width * 0.17;
  const orbitScale = 1.2;
  const orbitMultipliers = [1.5, 1.2, 1.2, 1.2, 1.15];

  const orbits: Orbit[] = Array.from({ length: 6 }, (_, i) => ({
    radius: orbitScale * (i + 1) * orbitGap * orbitMultipliers[i],
    centerX: anchorX,
    centerY: anchorY,
  }));

  const items: EventItem[] = [
    { eventKey: "closing", x: anchorX, y: anchorY, size: 150, fixed: true },

    { eventKey: "hacking", orbit: orbits[0], angle: 140, size: 90, offsetY: -6, jigglePx: 14, jigglePeriodMs: 5200 },
    { eventKey: "showcase", orbit: orbits[1], angle: 60, size: 90, jigglePx: 12, jigglePeriodMs: 6100 },
    { eventKey: "opening", orbit: orbits[2], angle: 105, size: 90, jigglePx: 10, jigglePeriodMs: 6900 },
    { eventKey: "scavenger", orbit: orbits[3], angle: 70, size: 90, jigglePx: 12, jigglePeriodMs: 7600 },
    { eventKey: "checkin", orbit: orbits[4], angle: 100, size: 90, offsetY: -8, jigglePx: 9, jigglePeriodMs: 8400 },
  ];

  
  const jiggleAnims = useRef(items.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    jiggleAnims.forEach((anim, i) => {
      const period =
        ("jigglePeriodMs" in items[i] && items[i].jigglePeriodMs != null)
          ? items[i].jigglePeriodMs!
          : 6500 + i * 700;

      anim.setValue(0);

      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: period / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: period / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  const currentIdx = stageIndex(currentStage);

  // finished planet variants
  const getVariantFor = (eventKey: StageKey): "normal" | "finished" => {
    const idx = stageIndex(eventKey);
    if (idx < currentIdx) return "finished";
    if (currentStage === "closing" && eventKey === "closing") return "finished";
    return "normal";
  };

  // rocket orbit
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

      {/* timer */}
      <View style={styles.headerOverlay} pointerEvents="none">
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
      {rocketTarget && (
        <RocketOrbit
          centerX={rocketTarget.x}
          centerY={rocketTarget.y + rocketTarget.planetSize * 0.15}
          orbitRadius={
            currentStage === "hacking"
              ? rocketTarget.planetSize * 0.55
              : rocketTarget.planetSize * 0.75
          }
          size={60}
          periodMs={7800}
          startAngleDeg={0}
          clockwise={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  headerOverlay: {
    position: "absolute",
    top: height * 0.08,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 50,
    elevation: 50,
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
