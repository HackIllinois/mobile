export const MAX_APP_WIDTH = 500;

import { Dimensions } from "react-native";

export const getConstrainedWidth = () => {
  const { width } = Dimensions.get("window");
  return Math.min(width, MAX_APP_WIDTH);
}
