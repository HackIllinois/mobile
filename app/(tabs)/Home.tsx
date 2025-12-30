import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EventOrbit from "../../components/home/EventOrbit";
import OrbitItem from "../../components/home/OrbitItem";
import { getTimeRemaining } from "../../components/home/countdown";

const { width, height } = Dimensions.get("window");

interface Orbit {
  radius: number;
  centerX: number;
  centerY: number;
}

interface OrbitEvent {
  label: string;
  angle: number;
  orbit: Orbit;
  size: number;
  textAngle?: number;
  fixed?: false;
}

interface FixedEvent {
  label: string;
  x: number;
  y: number;
  size: number;
  fixed: true;
}

type EventItem = OrbitEvent | FixedEvent;

export default function HomeScreen() {
  const targetDate = new Date("2026-02-20T09:00:00");
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(targetDate));
  // const rotation = React.useRef(new Animated.Value(0)).current;

  const anchorX = width / 2;
  const anchorY = height * 0.25; // vertical position for Closing Ceremony
  const orbitGap = width * 0.17; // spacing between orbits
  const orbitScale = 1.2; // scale all orbits

  const orbitMultipliers = [1.3, 1.1, 1.1, 1.1, 1.1]; // distance between orbits

  
  const orbits: Orbit[] = Array.from({ length: 6 }, (_, i) => ({
    radius: orbitScale * (i + 1) * orbitGap * orbitMultipliers[i], // increase scale for larger rings
    centerX: anchorX,
    centerY: anchorY,
  }));

  const items: EventItem[] = [
    { label: "closing   ceremony", x: anchorX, y: anchorY, size: 80, fixed: true },
    { label: "hacking!", orbit: orbits[0], angle: 110, size: 50, textAngle: 140 },
    { label: "project showcase", orbit: orbits[1], angle: 80, size: 50, textAngle: 100 },
    { label: "opening ceremony", orbit: orbits[2], angle: 100, size: 50, textAngle: 110 },
    { label: "scavenger hunt", orbit: orbits[3], angle: 80, size: 50, textAngle: 100 },
    { label: "check-in", orbit: orbits[4], angle: 90, size: 50, textAngle: 140 },
  ];

  const orbitAnimations = React.useRef(
    items.map(() => new Animated.Value(0))
  ).current;
  
  useEffect(() => {
    orbitAnimations.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 6000 + i * 900,      // each orbit has different speed
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 6000 + i * 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (num: number) => String(num).padStart(2, "0");

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Countdown */}
      <View style={styles.header}>
        <Text style={styles.timerLabel}>T-minus Liftoff</Text>
        <Text style={styles.timerText}>
          {formatTime(timeLeft.days)}:{formatTime(timeLeft.hours)}:
          {formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
        </Text>
      </View>

      {/* Dashed rings */}
      {orbits.map((orbit, i) => (
        <EventOrbit
          key={i}
          radius={orbit.radius}
          centerY={orbit.centerY}
          color="#444"
          strokeWidth={1}
        />
      ))}

      {/* Planets */}
      {items.map((item, i) =>
        item.fixed ? (
          <OrbitItem
            key={i}
            label={item.label}
            radius={0}               
            centerY={item.y}         
            angle={0}                
            size={item.size}
            textAngle={122}
            showFlag={true}        
            flagScale={1.2}   
            flagOffsetY={2}   
            flagOffsetX={4}   
            textDistance={4}
          />
        ) : (
          <OrbitItem
            key={i}
            label={item.label}
            radius={item.orbit.radius}
            centerY={item.orbit.centerY}
            angle={item.angle}
            animatedRotation={orbitAnimations[i]}
            speed={2.5 - i * 0.2}
            amplitude={0.3 + i * 0.3}
            size={item.size}
            textAngle={item.textAngle ?? 0}
          />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    alignItems: "center",
    marginTop: height * 0.02,
  },
  timerLabel: {
    color: "#000",
    fontSize: 18,
    marginBottom: 6,
  },
  timerText: {
    color: "#000",
    fontSize: 24,
    fontWeight: "bold",
  },
  fixedItem: {
    position: "absolute",
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  itemText: {
    fontSize: 10,
    color: "#000",
    textAlign: "center",
  },
});
