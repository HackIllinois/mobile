import { ShopItem } from "../../types";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { memo } from "react";
interface ShopItemCardProps {
  item: ShopItem;
  onPress: () => Promise<{ success: boolean; errorMessage?: string }>;
}

const ShopItemCard = memo(({ item, onPress }: ShopItemCardProps) => {

  const displayQuantity = item.quantity < 0 ? 0 : item.quantity;
  const quantityLabel = displayQuantity > 100 ? "100+" : String(displayQuantity);

  return (
    <View style={styles.outerContainer}>
      <Pressable
        style={styles.outerContainer}
        onPress={() => void onPress()}
      >
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{quantityLabel} left | </Text>
          <Text style={styles.price}>{item.price}</Text>
        </View>
      </Pressable>
    </View>
  );
});

export default ShopItemCard;

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: 40,
    marginTop: -40,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000000ff",
    textAlign: "center",
    marginBottom: 6,
    maxWidth: 70,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  price: {
    fontSize: 12,
    fontWeight: "400",
    color: "#000000ff",
    textAlign: "center",
  },
});
