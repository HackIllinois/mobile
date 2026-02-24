import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import EventOrbit from "../../components/home/EventOrbit";
import OrbitItem from "../../components/home/OrbitItem";
import RocketOrbit from "../../components/home/RocketOrbit";
import EventInfoModal, { EventModalData } from "../../components/home/EventInfoModal";
import { getTimeRemaining } from "../../components/home/countdown";
import HomeBackground from "../../assets/home/home_bg.svg";
import TimerOutline from "../../assets/home/timer_outline.svg";
import CheckInPng from "../../assets/home/check_in-png.png";
import ScavengerPng from "../../assets/home/scavenger_hunt-png.png";
import OpeningPng from "../../assets/home/opening-png.png";
import HackingPng from "../../assets/home/hacking-png.png";
import ShowcasePng from "../../assets/home/project-png.png";
import ClosingPng from "../../assets/home/closing_ceremony_png.png";

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

const NAVBAR_HEIGHT = 85;

const CLOSING_PLANET_GAP = 16;
const CLOSING_PLANET_SIZE = 180;

const BOTTOM_CLEARANCE = 20;

export default function HomeScreen() {
  const router = useRouter();
  const targetDate = new Date("2026-02-27T18:00:00");
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(targetDate));
  const insets = useSafeAreaInsets();
  
  // Track where the timer header ends
  const [timerBottom, setTimerBottom] = useState(height * 0.03);
  const [selectedEvent, setSelectedEvent] = useState<EventModalData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const onTimerLayout = (e: any) => {
    const { y, height: h } = e.nativeEvent.layout;
    setTimerBottom(y + h);
  };

  // anchorY = center of closing planet = timerBottom + gap + half planet height
  const anchorY = timerBottom + CLOSING_PLANET_GAP + CLOSING_PLANET_SIZE / 2;


  const bottomBoundary = height - NAVBAR_HEIGHT - insets.bottom - BOTTOM_CLEARANCE;
  const maxOuterRadius = (bottomBoundary - anchorY - 40) / 0.985;

  const derivedOrbitGap = maxOuterRadius / 6.9;

  // Clamp so it never looks weird on huge screens or tiny ones
  const orbitGap = Math.min(Math.max(derivedOrbitGap, width * 0.11), width * 0.18);

  const SCHEDULE = useMemo(() => {
    const checkinStart  = new Date("2026-02-27T14:00:00-06:00");
    const checkinEnd    = new Date("2026-02-27T17:00:00-06:00");
    const scavStart     = new Date("2026-02-27T14:30:00-06:00");
    const scavEnd       = new Date("2026-02-27T16:30:00-06:00");
    const openingStart  = new Date("2026-02-27T17:00:00-06:00");
    const openingEnd    = new Date("2026-02-27T18:00:00-06:00");
    const showcaseStart = new Date("2026-03-01T09:00:00-06:00");
    const showcaseEnd   = new Date("2026-03-01T11:30:00-06:00");
    const closingStart  = new Date("2026-03-01T14:00:00-06:00");
    const closingEnd    = new Date("2026-03-01T15:00:00-06:00");
    const hackingStart  = openingEnd;
    const hackingEnd    = new Date("2026-03-01T06:00:00-06:00");

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

  const JIGGLE_PERIODS = useRef([5200, 6100, 6900, 7600, 8400, 9100]).current;

  const jiggleAnims = useRef(JIGGLE_PERIODS.map(() => new Animated.Value(0))).current;


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
  }, []); 

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

  const eventModalMap = useMemo(() => {
    const planetImage = {
      checkin: CheckInPng,
      scavenger: ScavengerPng,
      opening: OpeningPng,
      hacking: HackingPng,
      showcase: ShowcasePng,
      closing: ClosingPng,
    } as const;

    const base = {
      checkin: {
        title: "Check-In",
        description: "Check in, receive your merch, and get settled.",
        location: "Siebel Center for Computer Science",
        format: "In-person" as const,
        tags: ["Mandatory", "Free Stuff"],
      },
      scavenger: {
        title: "Scavenger Hunt",
        description: "Explore the venue, meet other attendees, and complete quick challenges to earn points.",
        location: "Siebel Center for Computer Science",
        format: "In-person" as const,
        tags: ["Mini Event", "Team Activity"],
      },
      opening: {
        title: "Opening Ceremony",
        description: "Kickoff announcements, theme overview, sponsor intros, and important event logistics.",
        location: "Siebel Center for Computer Science (Room 1404)",
        format: "In-person" as const,
        tags: ["Important", "Announcements"],
      },
      hacking: {
        title: "Hacking",
        description: "Build your project, collaborate with teammates, and bring your ideas to life. Mentors are available throughout the venue.",
        location: "Siebel Center for CS & Siebel Center for Design",
        format: "In-person" as const,
        tags: ["Mentors Available", "Food Provided"],
      },
      showcase: {
        title: "Project Showcase",
        description: "Demo your project to judges and attendees, gather feedback, and celebrate what you built.",
        location: "Siebel Center for Computer Science",
        format: "In-person" as const,
        tags: ["Judging", "Demos"],
      },
      closing: {
        title: "Closing Ceremony",
        description: "Final results, awards, and wrap-up announcements for the weekend.",
        location: "Siebel Center for Computer Science (Room 1404)",
        format: "In-person" as const,
        tags: ["Awards", "Announcements"],
      },
    } as const;

    const t = new Date();
    return STAGE_ORDER.reduce((acc, key) => {
      const schedule = SCHEDULE[key];
      const status: EventModalData["status"] =
        t > schedule.end ? "ended" : t >= schedule.start ? (t >= new Date(schedule.end.getTime() - 30 * 60 * 1000) ? "closing" : "live") : "upcoming";

      acc[key] = {
        id: key,
        title: base[key].title,
        description: base[key].description || "Details coming soon",
        startTime: schedule.start,
        endTime: schedule.end,
        location: base[key].location,
        format: base[key].format,
        status,
        tags: [...base[key].tags],
        image: planetImage[key],
      };
      return acc;
    }, {} as Record<StageKey, EventModalData>);
  }, [SCHEDULE, currentStage]);

  const handlePlanetPress = (key: StageKey) => {
    setSelectedEvent(eventModalMap[key] ?? null);
    setModalVisible(true);
  };

  const pushScheduleFocus = (focusEvent: string) => {
    router.push({
      pathname: "/Event",
      params: {
        focusEvent,
        focusRequestId: String(Date.now()),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <HomeBackground
        width={width}
        height={height}
        style={StyleSheet.absoluteFill}
        preserveAspectRatio="xMidYMid slice"
      />

      {/* Timer */}
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
              onPress={handlePlanetPress}
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
            onPress={handlePlanetPress}
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

      <EventInfoModal
        visible={modalVisible}
        event={selectedEvent}
        onViewDetails={
          selectedEvent?.id === "checkin"
            ? () => {
                setModalVisible(false);
                setSelectedEvent(null);
                pushScheduleFocus("Attendee Check-In");
              }
            : selectedEvent?.id === "opening"
            ? () => {
                setModalVisible(false);
                setSelectedEvent(null);
                pushScheduleFocus("Opening Ceremony");
              }
            : selectedEvent?.id === "showcase"
            ? () => {
                setModalVisible(false);
                setSelectedEvent(null);
                pushScheduleFocus("[ALL ATTENDEES] Project Showcase");
              }
            : selectedEvent?.id === "scavenger"
            ? () => {
                setModalVisible(false);
                setSelectedEvent(null);
                pushScheduleFocus("Solar Search");
              }
            : selectedEvent?.id === "closing"
            ? () => {
                setModalVisible(false);
                setSelectedEvent(null);
                pushScheduleFocus("Closing Ceremonies");
              }
            : undefined
        }
        onClose={() => {
          setModalVisible(false);
          setSelectedEvent(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  headerOverlay: {
    alignSelf: "center",
    alignItems: "center",
    position: 'absolute',
    top: (height * 0.04) + 26, 
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
