import { StyleSheet } from "react-native";

export const MAX_APP_WIDTH = 500;

export const tabBackgrounds = {
  Home: "#f5f5f5",
  Event: "#6c6c6c",
  Shop: "#f2f2f2",
  Scan: "#000",
  Profile: "#1a0040",
  Duels: "#2d0429",
};

export const layoutStyles = StyleSheet.create({
  fill: { flex: 1 },
  column: {
    width: "100%",
    maxWidth: MAX_APP_WIDTH,
    alignSelf: "center",
    paddingHorizontal: 16,
  },
});
