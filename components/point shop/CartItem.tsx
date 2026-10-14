import { View, Text, StyleSheet, Pressable } from "react-native";
import { ShopItem } from "../../types";

interface CartItemProps {
  item: ShopItem;
  quantity: number;
  onIncrement: () => Promise<boolean>;
  onDecrement: () => Promise<boolean>;
}

export default function CartItem({
  item,
  quantity,
  onIncrement,
  onDecrement,
}: CartItemProps) {
  const handleIncrement = async () => {
    await onIncrement();
  };

  const handleDecrement = async () => {
    await onDecrement();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
        {item.name}
      </Text>
      <View style={styles.quantityContainer}>
        <Pressable
          style={styles.button}
          onPress={handleDecrement}
        >
          <Text style ={styles.buttonText}>-</Text>
        </Pressable>
        <Text style={styles.quantity}>{quantity}</Text>

        <Pressable
          style={styles.button}
          onPress={handleIncrement}
        >
          <Text style={styles.buttonText}>+</Text>
        </Pressable>
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
    backgroundColor: "#000000ff",
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
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
    color: "#e8dff0",
  },
  buttonText :{
    flex: 1,
    alignItems: "center",
    fontSize: 20,
    color: "#e8dff0",
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
    backgroundColor: "#6B4E8C",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    width: 8,
    height: 8,
  },
  quantity: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e8dff0",
    minWidth: 20,
    textAlign: "center",
  },
});
