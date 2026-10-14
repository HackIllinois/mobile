import { View, Text, StyleSheet } from "react-native";

interface PointsProps {
  points?: number;
}

export default function Points({ points = 1000 }: PointsProps) {
  return (
    <View style={styles.container}>
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
