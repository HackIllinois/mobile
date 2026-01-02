import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { ShopItem } from "../../types";

interface CartItemProps {
  item: ShopItem;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export default function CartItem({
  item,
  quantity,
  onIncrement,
  onDecrement,
}: CartItemProps) {
  return (
    <View style={styles.container}>
      <Image source={{ uri: item.imageURL }} style={styles.image} />
      <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
        {item.name}
      </Text>
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={onDecrement}
          activeOpacity={0.6}
        >
          <Text style={styles.buttonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.quantity}>{quantity}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={onIncrement}
          activeOpacity={0.6}
        >
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: "#c4b4d4",
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: "#a893be",
  },
  image: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#2e2440",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  button: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2e2440",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e8dff0",
  },
  quantity: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2e2440",
    minWidth: 20,
    textAlign: "center",
  },
});
