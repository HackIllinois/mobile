import React, { useMemo, useRef } from "react";
import { Dimensions, Animated, View, Image, Pressable } from "react-native";
import * as Haptics from "expo-haptics";

import CheckInPng from "../../assets/home/check_in-png.png";
import ScavengerPng from "../../assets/home/scavenger_hunt-png.png";
import OpeningPng from "../../assets/home/opening-png.png";
import HackingPng from "../../assets/home/hacking-png.png";
import ShowcasePng from "../../assets/home/project-png.png";
import ClosingPng from "../../assets/home/closing_ceremony_png.png";

import CheckInFinishedPng from "../../assets/home/check_in_finished-png.png";
import ScavengerFinishedPng from "../../assets/home/scavenger_finished-png.png";
import OpeningFinishedPng from "../../assets/home/opening_finished-png.png";
import HackingFinishedPng from "../../assets/home/hacking_finished-png.png";
import ShowcaseFinishedPng from "../../assets/home/project_finished-png.png";
import ClosingFinishedPng from "../../assets/home/closing_finished-png.png";

interface OrbitItemProps {
  radius: number;
  angle: number; // degrees
  centerY: number;
  size?: number;
  eventKey?: "checkin" | "scavenger" | "opening" | "showcase" | "hacking" | "closing";
  dimmed?: boolean;

  offsetX?: number;
  offsetY?: number;

  variant?: "normal" | "finished";

  // jiggle
  jiggle?: Animated.Value; // 0..1 loop
  jigglePx?: number; // how far to slide along the orbit

  onPress?: (eventKey: NonNullable<OrbitItemProps["eventKey"]>) => void;
}

import { getConstrainedWidth } from "../../lib/layout";

const width = getConstrainedWidth();
const CENTER_X = width / 2;

export default function OrbitItem({
  radius,
  angle,
  centerY,
  size = 60,
  eventKey = "closing",
  dimmed = false,
  offsetX = 0,
  offsetY = 0,
  variant = "normal",
  jiggle,
  jigglePx = 10,
  onPress,
}: OrbitItemProps) {
  const rad = (angle * Math.PI) / 180;

  // Base orbit position
  const baseX = useMemo(() => radius * Math.cos(rad), [radius, rad]);
  const baseY = useMemo(() => radius * Math.sin(rad), [radius, rad]);

  // Tangent unit vector at angle
  const tanX = useMemo(() => -Math.sin(rad), [rad]);
  const tanY = useMemo(() => Math.cos(rad), [rad]);

  const jiggleScalar: any = jiggle
    ? jiggle.interpolate({
        inputRange: [0, 1],
        outputRange: [-jigglePx, jigglePx],
      })
    : 0;

  const jiggleX: any = jiggle ? Animated.multiply(jiggleScalar, tanX) : 0;
  const jiggleY: any = jiggle ? Animated.multiply(jiggleScalar, tanY) : 0;

  const translateX: any = jiggle
    ? Animated.add(Animated.add(baseX + offsetX, jiggleX), 0)
    : baseX + offsetX;

  const translateY: any = jiggle
    ? Animated.add(Animated.add(baseY + offsetY, jiggleY), 0)
    : baseY + offsetY;

  const containerSize = size * 1.6;

  const planetSrc =
    variant === "finished"
      ? eventKey === "checkin"
        ? CheckInFinishedPng
        : eventKey === "scavenger"
        ? ScavengerFinishedPng
        : eventKey === "opening"
        ? OpeningFinishedPng
        : eventKey === "showcase"
        ? ShowcaseFinishedPng
        : eventKey === "hacking"
        ? HackingFinishedPng
        : ClosingFinishedPng
      : eventKey === "checkin"
      ? CheckInPng
      : eventKey === "scavenger"
      ? ScavengerPng
      : eventKey === "opening"
      ? OpeningPng
      : eventKey === "showcase"
      ? ShowcasePng
      : eventKey === "hacking"
      ? HackingPng
      : ClosingPng;

  
  const pressAnim = useRef(new Animated.Value(0)).current;

  const pressScale = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  const pressRotate = pressAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["0deg", "6deg", "-6deg"], 
  });

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    pressAnim.stopAnimation();
    pressAnim.setValue(0);

    Animated.sequence([
      Animated.timing(pressAnim, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(pressAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();

    onPress?.(eventKey);
  };

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: centerY - containerSize / 2,
        left: CENTER_X - containerSize / 2,
        width: containerSize,
        height: containerSize,
        opacity: dimmed ? 0.55 : 1,
        overflow: "visible",
        transform: [
          { translateX },
          { translateY },
          { scale: pressScale },
          { rotate: pressRotate },   
        ],
      }}
    >
      <Pressable
        onPress={handlePress}
        hitSlop={12}
        style={{ width: containerSize, height: containerSize }}
      >
        <View
          style={{
            width: containerSize,
            height: containerSize,
            justifyContent: "center",
            alignItems: "center",
            overflow: "visible",
          }}
        >
          <Image
            source={planetSrc}
            style={{
              width: containerSize,
              height: containerSize,
              opacity: 1,
            }}
            resizeMode="contain"
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}
