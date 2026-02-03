import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { ShopItem } from "../../types";
import * as Haptics from "expo-haptics";

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await onIncrement();
  };

  const handleDecrement = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await onDecrement();
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: item.imageURL }} style={styles.image} />
      <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
        {item.name}
      </Text>
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleDecrement}
          activeOpacity={0.6}
        >
          <Image
            source={require("../../assets/point-shop/point-shop-minus.png")}
            style={styles.buttonIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.quantity}>{quantity}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={handleIncrement}
          activeOpacity={0.6}
        >
          <Image
            source={require("../../assets/point-shop/point-shop-plus.png")}
            style={styles.buttonIcon}
            resizeMode="contain"
          />
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
    backgroundColor: "#4d3f62",
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: "#5a4570",
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
