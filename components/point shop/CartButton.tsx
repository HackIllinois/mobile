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
      >
        <Text style={styles.text}>Cart</Text>
      </TouchableOpacity>
      {itemCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{itemCount}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#2e2440",
    borderRadius: 24,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    borderWidth: 1,
    borderColor: "#5a4a6e",
  },
  text: {
    color: "#e8dff0",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#9b6dcc",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
