import React, { useMemo } from "react";
import { Dimensions, Animated, View } from "react-native";

import CheckInTextPlanet from "../../assets/home/check-in_text.svg";
import ScavengerTextPlanet from "../../assets/home/scavenger_text.svg";
import CeremonyTextPlanet from "../../assets/home/ceremony_text.svg";
import ShowcaseTextPlanet from "../../assets/home/showcase_text.svg";
import HackingTextPlanet from "../../assets/home/hacking_text.svg";
import ClosingTextPlanet from "../../assets/home/closing_text.svg";

import CheckInFinished from "../../assets/home/check-in_finished.svg";
import ScavengerFinished from "../../assets/home/scavenger_finished.svg";
import CeremonyFinished from "../../assets/home/ceremony_finished.svg";
import ShowcaseFinished from "../../assets/home/showcase_finished.svg";
import HackingFinished from "../../assets/home/hacking_finished.svg";
import ClosingFinished from "../../assets/home/closing_finished.svg";

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

  //  jiggle 
  jiggle?: Animated.Value; // 0..1 loop
  jigglePx?: number; // how far to slide along the orbit
}

const { width } = Dimensions.get("window");
const CENTER_X = width / 2;

export default function OrbitItem({
  radius,
  angle,
  centerY,
  size = 60,
  eventKey,
  dimmed = false,
  offsetX = 0,
  offsetY = 0,
  variant = "normal",

  jiggle,
  jigglePx = 10,
}: OrbitItemProps) {
  const rad = (angle * Math.PI) / 180;

  // Base orbit position 
  const baseX = useMemo(() => radius * Math.cos(rad), [radius, rad]);
  const baseY = useMemo(() => radius * Math.sin(rad), [radius, rad]);

  // Tangent unit vector at angle
  // tangent = (-sin(rad), cos(rad))
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

  // Final translate = base + jiggle + manual offsets
  const translateX: any = jiggle
    ? Animated.add(Animated.add(baseX + offsetX, jiggleX), 0)
    : baseX + offsetX;

  const translateY: any = jiggle
    ? Animated.add(Animated.add(baseY + offsetY, jiggleY), 0)
    : baseY + offsetY;

  const containerSize = size * 1.6;

  const PlanetIcon =
    variant === "finished"
      ? eventKey === "checkin"
        ? CheckInFinished
        : eventKey === "scavenger"
        ? ScavengerFinished
        : eventKey === "opening"
        ? CeremonyFinished
        : eventKey === "showcase"
        ? ShowcaseFinished
        : eventKey === "hacking"
        ? HackingFinished
        : ClosingFinished
      : eventKey === "checkin"
      ? CheckInTextPlanet
      : eventKey === "scavenger"
      ? ScavengerTextPlanet
      : eventKey === "opening"
      ? CeremonyTextPlanet
      : eventKey === "showcase"
      ? ShowcaseTextPlanet
      : eventKey === "hacking"
      ? HackingTextPlanet
      : ClosingTextPlanet;

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
        transform: [{ translateX }, { translateY }],
      }}
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
        <PlanetIcon
          width={containerSize}
          height={containerSize}
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: "visible" }}
        />
      </View>
    </Animated.View>
  );
}
