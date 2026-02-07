import React from 'react';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';

export default function Sun(props: any) {
  const center = 38.246;

  return (
    <Svg width="77" height="77" viewBox="0 0 77 77" fill="none" {...props}>
      <Defs>
        {/* 1. Gradient to mimic the glowing core */}
        <RadialGradient
          id="sun_glow"
          cx={center} cy={center}
          r={center}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0.5" stopColor="#FFB368" />
          <Stop offset="0.85" stopColor="#FF7543" />
          <Stop offset="1" stopColor="#FF7543" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* 2. The "Flares" Path */}
      <Path
        d="M38.2 9.2c-2.5 0-4.5 3-6.8 3.5-2.8.6-6-1.5-8.5-.2-2.5 1.3-3.2 5-5.5 6.8-2.2 1.8-5.8 1.5-7.5 3.8-1.8 2.3-.5 5.8-1.5 8.5-1 2.8-5 4-5 6.8 0 2.8 4 4 5 6.8 1 2.7-.3 6.2 1.5 8.5 1.7 2.3 5.3 2 7.5 3.8 2.3 1.8 3 5.5 5.5 6.8 2.5 1.3 5.7-.8 8.5-.2 2.3.5 4.3 3.5 6.8 3.5 2.5 0 4.5-3 6.8-3.5 2.8-.6 6 1.5 8.5.2 2.5-1.3 3.2-5 5.5-6.8 2.2-1.8 5.8-1.5 7.5-3.8 1.8-2.3.5-5.8 1.5-8.5 1-2.8 5-4 5-6.8 0-2.8-4-4-5-6.8-1-2.7.3-6.2-1.5-8.5-1.7-2.3-5.3-2-7.5-3.8-2.3-1.8-3-5.5-5.5-6.8-2.5-1.3-5.7.8-8.5.2-2.3-.5-4.3-3.5-6.8-3.5z"
        fill="#FF7543"
        opacity="0.9"
        // FIXED: Added transform to squeeze horizontally (0.9 scale on X axis) relative to the center
        transform={`translate(${center}, ${center}) scale(0.9, 1) translate(-${center}, -${center})`}
      />

      {/* 3. Outer Glow (Soft Halo) */}
      <Circle cx={center} cy={center} r="28" fill="url(#sun_glow)" opacity="0.6" />

      {/* 4. The Inner Circles */}
      <Circle cx={center} cy={center} r="24.246" fill="#FFB368"/>
      <Circle cx={center} cy={center} r="20.4674" fill="#FFD78D"/>
      <Circle cx={center} cy={center} r="14.7995" fill="#FFE7A6"/>
      <Circle cx={center} cy={center} r="9.13162" fill="#FFF0C7"/>
      <Circle cx={center} cy={center} r="4.72325" fill="#FFF4D4"/>

      {/* 5. The squiggly line */}
      <Path 
        d="M49.016 17.0003C49.1044 16.8864 49.4271 16.5768 49.7171 16.3547C49.8807 16.2388 50.0186 16.0929 50.1409 15.8663C50.2133 15.724 50.3066 15.5264 50.4027 15.3228" 
        stroke="#FF895E" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
    </Svg>
  );
}