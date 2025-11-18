import React from "react";
import Svg, { Circle, Defs, Path, Text as SvgText, TextPath, G } from "react-native-svg";
import { Dimensions, Animated, Easing } from "react-native";
import Flag from "../../assets/home/closing-ceremony-flag.svg";

interface OrbitItemProps {
  label?: string;
  radius: number;
  angle: number; // angle among orbit in degrees - 0 is to right
  animatedRotation?: Animated.Value;
  speed?: number; // speed of orbit rotation
  amplitude?: number; // amplitude of orbit rotation - for further orbits to move more
  centerY: number;
  size?: number;
  textAngle?: number; // text angle around planet - its kind of messed up so fiddle with it
  showFlag?: boolean;
  flagOffsetY?: number;
  flagOffsetX?: number;
  flagScale?: number;
  textDistance?: number; // distance from planet surface (pixels)
}

const { width } = Dimensions.get("window");
const CENTER_X = width / 2;

export default function OrbitItem({
  label = "Unnamed",
  radius,
  angle,
  animatedRotation,
  speed = 1,
  amplitude = 1,
  centerY,
  size = 60,
  textAngle = 0,
  showFlag = false,
  flagOffsetY = 0,
  flagOffsetX = 0,
  flagScale = 1,
  textDistance = 10,
}: OrbitItemProps) {
  const rad = (angle * Math.PI) / 180;
  // const cx = CENTER_X + radius * Math.cos(rad);
  // const cy = centerY + radius * Math.sin(rad);
  

  const planetRadius = size / 2;
  const textRadius = planetRadius + textDistance;

  
  const padding = textRadius + 20;
  const svgSize = padding * 2;
  const center = svgSize / 2;

  const safeLabel = label || "Unnamed";
  const pathId = `planet-path-${safeLabel.replace(/\s/g, "")}`;

  // text path is a semicircle above the planet
  const pathD = `
    M ${center}, ${center - textRadius}
    A ${textRadius} ${textRadius} 0 1 1 ${center - 0.001}, ${center - textRadius}
  `;

  
  const flagWidth = 24 * flagScale;
  const flagHeight = 24 * flagScale;
  const flagX = center - flagWidth / 2 + flagOffsetX;
  const flagY = center - planetRadius - flagHeight + flagOffsetY;

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: centerY - svgSize / 2,
        left: CENTER_X - svgSize / 2,
        transform: [
          // rotate orbit
          animatedRotation
            ? {
                rotate: animatedRotation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [
                    `${(-8 * speed * amplitude)}deg`, // -8 deg to 8 deg for now
                    `${(8 * speed * amplitude)}deg`,
                  ], // sway instead of full spin
                }),
              }
            : { rotate: "0deg" },

          // move outward along the orbit
          { translateX: radius * Math.cos(rad) },
          { translateY: radius * Math.sin(rad) },
        ],
      }}
    >
      <Svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        <Circle cx={center} cy={center} r={planetRadius} fill="#ccc" />

        {showFlag && (
          <G x={flagX} y={flagY}>
            <Flag width={flagWidth} height={flagHeight} />
          </G>
        )}

        <Defs>
          <Path id={pathId} d={pathD} />
        </Defs>

        <G origin={`${center}, ${center}`} rotation={textAngle}>
          <SvgText fill="#000" fontSize="10" letterSpacing="0.5">
            <TextPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
              {safeLabel}
            </TextPath>
          </SvgText>
        </G>
      </Svg>
    </Animated.View>
  );
}
