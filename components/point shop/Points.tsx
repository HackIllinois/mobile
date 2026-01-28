import { View, Text, StyleSheet, Image } from "react-native";

interface PointsProps {
  points?: number;
}

export default function Points({ points = 1000 }: PointsProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/point-shop/point-shop-diamonds.png")}
        style={styles.icon}
        resizeMode="contain"
      />
      <Text style={styles.text}>{points} pts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5B415B",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 4,
    // Bottom inner shadow effect
    borderBottomWidth: 3,
    borderBottomColor: "rgba(0, 0, 0, 0.3)",
    borderRightWidth: 3,
    borderRightColor: "rgba(0, 0, 0, 0.3)",
    borderLeftWidth: 3,
    borderLeftColor: "rgba(0, 0, 0, 0.3)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  icon: {
    width: 20,
    height: 20,
  },
  text: {
    fontFamily: "Tsukimi Rounded",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
