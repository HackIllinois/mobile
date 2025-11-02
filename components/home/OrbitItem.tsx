import React from "react";
import Svg, { Circle, Defs, Path, Text as SvgText, TextPath, G } from "react-native-svg";
import { Dimensions } from "react-native";
import Flag from "../../assets/home/closing-ceremony-flag.svg";

interface OrbitItemProps {
  label?: string;
  radius: number;
  angle: number; // angle among orbit in degrees - 0 is to right
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
  const cx = CENTER_X + radius * Math.cos(rad);
  const cy = centerY + radius * Math.sin(rad);

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
    <Svg
      width={svgSize}
      height={svgSize}
      viewBox={`0 0 ${svgSize} ${svgSize}`}
      style={{
        position: "absolute",
        top: cy - svgSize / 2,
        left: cx - svgSize / 2,
        overflow: "visible",
      }}
    >
      {/* Planet */}
      <Circle cx={center} cy={center} r={planetRadius} fill="#ccc" />

      {/* Flag */}
      {showFlag && (
        <G x={flagX} y={flagY}>
          <Flag width={flagWidth} height={flagHeight} />
        </G>
      )}

      {/* Text path */}
      <Defs>
        <Path id={pathId} d={pathD} />
      </Defs>

      {/* keeps text orientation upright */}
      <G origin={`${center}, ${center}`} rotation={textAngle}>
        <SvgText fill="#000" fontSize="10" letterSpacing="0.5">
          <TextPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
            {safeLabel}
          </TextPath>
        </SvgText>
      </G>
    </Svg>
  );
}
