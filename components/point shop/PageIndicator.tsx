import { View, StyleSheet } from "react-native";

interface PageIndicatorProps {
  currentPage: number;
  totalPages: number;
}

export default function PageIndicator({
  currentPage,
  totalPages,
}: PageIndicatorProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalPages }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === currentPage ? styles.activeDot : styles.inactiveDot,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "rgba(203, 203, 203, 0.9)",
    width: 8,
    height: 8,
    borderRadius: 5,
  },
  inactiveDot: {
    backgroundColor: "rgba(196, 196, 196, 0.3)",
  },
});
