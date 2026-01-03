import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import OrbitingRocket from "../../assets/home/orbiting_rocket.svg";

type Props = {
  centerX: number;
  centerY: number;
  orbitRadius: number;
  size?: number;
  periodMs?: number;
  startAngleDeg?: number;
  clockwise?: boolean;
  offsetX?: number;
  offsetY?: number;
};

export default function RocketOrbit({
  centerX,
  centerY,
  orbitRadius,
  size = 40,
  periodMs = 3200,
  startAngleDeg = 0,
  clockwise = false,
  offsetX = 0,
  offsetY = 0,
}: Props) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    spin.setValue(0);
    const anim = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: periodMs,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [periodMs, spin]);

  const dir = clockwise ? -1 : 1;

  const orbitRotate = useMemo(() => {
    return spin.interpolate({
      inputRange: [0, 1],
      outputRange: [`${startAngleDeg}deg`, `${startAngleDeg + dir * 360}deg`],
    });
  }, [spin, startAngleDeg, dir]);

  // Rotate the rocket 90° to face direction of travel
  // if ccw, flip direction
  const rocketRotate = `${(clockwise ? 180 : 0) + 180}deg`;

  const diameter = orbitRadius * 2;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: centerX - orbitRadius + offsetX,
        top: centerY - orbitRadius + offsetY,
        width: diameter,
        height: diameter,
        overflow: "visible",
      }}
    >
      <Animated.View
        style={{
          width: diameter,
          height: diameter,
          transform: [{ rotate: orbitRotate }],
        }}
      >
        <View
          style={{
            position: "absolute",
            left: orbitRadius - size / 2,
            top: orbitRadius - size / 2,
            transform: [{ translateX: orbitRadius }],
          }}
        >
          <Animated.View style={{ transform: [{ rotate: rocketRotate }] }}>
            <OrbitingRocket width={size} height={size} />
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}
