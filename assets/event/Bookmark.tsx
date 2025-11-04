import * as React from "react";
import Svg, { G, Path } from "react-native-svg";

const Bookmark = ({ fill = "#ff0000", width = 24, height = 24 }) => (
  <Svg
    width={width}
    height={height}
    viewBox="-15 -15 60 60"
    fill="none"
  >
    <G transform="translate(-417.000000, -151.000000)">
      <Path
        d="M437,177 C437,178.104 436.104,179 435,179 L428,172 L421,179 C419.896,179 419,178.104 419,177 L419,155 C419,153.896 419.896,153 421,153 L435,153 C436.104,153 437,153.896 437,155 L437,177 L437,177 Z M435,151 L421,151 C418.791,151 417,152.791 417,155 L417,177 C417,179.209 418.791,181 421,181 L428,174 L435,181 C437.209,181 439,179.209 439,177 L439,155 C439,152.791 437.209,151 435,151 L435,151 Z"
        fill={fill}
      />
    </G>
  </Svg>
);

export default Bookmark;