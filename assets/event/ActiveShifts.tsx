import React from 'react';
import Svg, { Text, Defs, LinearGradient, Stop } from 'react-native-svg';

export default function ActiveShifts() {
  return (
    <Svg width="78" height="24" viewBox="0 0 78 24">
      <Defs>
        <LinearGradient id="shiftsGlow" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#A315D6" />
          <Stop offset="0.5" stopColor="#FDAB60" />
          <Stop offset="1" stopColor="#A315D6" />
        </LinearGradient>
      </Defs>

      {/* Glow layer — blurred gradient to match the blur filter in the other SVGs */}
      <Text
        x="1"
        y="17"
        fill="url(#shiftsGlow)"
        stroke="url(#shiftsGlow)"
        strokeWidth="5"
        fontSize="14"
        fontWeight="800"
        fontFamily="Tsukimi-Rounded-Bold"
        opacity={0.55}
      >
        SHIFTS
      </Text>

      {/* Crisp white text on top */}
      <Text
        x="1"
        y="17"
        fill="white"
        fontSize="14"
        fontWeight="800"
        fontFamily="Tsukimi-Rounded-Bold"
      >
        SHIFTS
      </Text>
    </Svg>
  );
}
