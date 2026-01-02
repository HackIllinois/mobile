import { ShopItem } from "../../types";
import { StyleSheet, View, Text, Image, TouchableOpacity } from "react-native";
import { memo } from "react";
import ShopCardBackground from "../../assets/point shop/point-shop-case.svg";

interface ShopItemCardProps {
  item: ShopItem;
  onPress: () => void;
}

const ShopItemCard = memo(({ item, onPress }: ShopItemCardProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      activeOpacity={0.7}
    >
      <View style={styles.backgroundContainer}>
        <ShopCardBackground width="100%" height="100%" preserveAspectRatio="none" />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.price}>🪙 {item.price}</Text>
        <Image source={{ uri: item.imageURL }} style={styles.image} />
      </View>
    </TouchableOpacity>
  );
});

export default ShopItemCard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  backgroundContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "80%",
  },
  contentContainer: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 10
  },
  name: {
    fontSize: 9,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 4,
    maxWidth: 60
  },
  price: {
    fontSize: 8,
    fontWeight: "400",
    color: "#ccc",
    textAlign: "center",
    marginBottom: 4,
  },
  image: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
});
