import { TouchableOpacity, Text, StyleSheet, View } from "react-native";

interface CartButtonProps {
  onPress?: () => void;
  itemCount: number;
}

export default function CartButton({ onPress, itemCount }: CartButtonProps) {
  return (
    <View>
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        activeOpacity={0.4}
        hitSlop={120}
      >
        <Text style={styles.text}>Cart</Text>
      </TouchableOpacity>
      {itemCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>+{itemCount}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "transparent",
    paddingVertical: 4,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontFamily: "Tsukimi Rounded",
    color: "#ffffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    color: "#ffffffff",
    fontSize: 12,
    fontWeight: "700",
  },
});
