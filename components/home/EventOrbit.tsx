import React from "react";
import { StyleSheet, Dimensions, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface EventOrbitProps {
  radius: number;
  strokeWidth?: number;
  color?: string;
  centerY: number;
}

import { getConstrainedWidth } from "../../lib/layout";

const width = getConstrainedWidth();
const CENTER_X = width / 2;

export default function EventOrbit({
  radius,
  strokeWidth = 1,
  color = "#ffffffff",
  centerY,
}: EventOrbitProps) {
  const size = radius * 2 + strokeWidth * 2;
  const offsetX = CENTER_X - size / 2;
  const offsetY = centerY - radius - strokeWidth;

  return (
    <View style={[StyleSheet.absoluteFill, { left: offsetX, top: offsetY }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray="6 6"
          fill="none"
        />
      </Svg>
    </View>
  );
}
