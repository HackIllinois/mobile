import { ShopItem } from "../../../types";
import { StyleSheet, View, Text, Image, TouchableOpacity } from "react-native";

interface ShopItemCardProps {
  item: ShopItem;
  onPress: () => void;
}

export default function ShopItemCard({ item, onPress }: ShopItemCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      activeOpacity={0.7}
    >
      <Text style={styles.plusIcon}>+</Text>
      <Text style={styles.name} numberOfLines={2}>
        {item.name}
      </Text>
      <Image source={{ uri: item.imageURL }} style={styles.image} />
      <Text style={styles.price}>🪙 {item.price}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    minHeight: 100,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    textAlign: "center",
    marginBottom: 8,
  },
  image: {
    width: 60,
    height: 60,
    marginBottom: 8,
    resizeMode: "contain",
  },
  price: {
    fontSize: 14,
    fontWeight: "400",
    color: "#666",
    textAlign: "center",
  },
  plusIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
  },
});
