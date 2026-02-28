import { ShopItem } from "../../types";
import { StyleSheet, View, Text, Image, TouchableOpacity, Animated, Easing } from "react-native";
import { memo, useRef } from "react";
import * as Haptics from "expo-haptics";
interface ShopItemCardProps {
  item: ShopItem;
  onPress: () => Promise<{ success: boolean; errorMessage?: string }>;
  scale?: number;
}

const ShopItemCard = memo(({ item, onPress, scale = 1 }: ShopItemCardProps) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handlePress = async () => {
    Haptics.selectionAsync();
    
    // Call the onPress handler first
    const result = await onPress();

    // Only animate if the API call succeeded
    if (result.success) {
      floatAnim.setValue(0);
      opacityAnim.setValue(1);

      // Start animations
      Animated.parallel([
        Animated.timing(floatAnim, {
          toValue: -15,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const displayQuantity = item.quantity < 0 ? 0 : item.quantity;
  const quantityLabel = displayQuantity > 100 ? "100+" : String(displayQuantity);

  return (
    <View style={styles.outerContainer}>
      {/* Animated +1 popup */}
      <Animated.View
        style={[
          styles.floatingContainer,
          {
            transform: [{ translateY: floatAnim }],
            opacity: opacityAnim,
          },
        ]}
        pointerEvents="none"
      >
        <Image source={{ uri: item.imageURL }} style={styles.floatingImage} />
        <Text style={styles.floatingText}>+1</Text>
      </Animated.View>

      <TouchableOpacity
        onPress={handlePress}
        style={[styles.container, { transform: [{ scale }] }]}
        activeOpacity={0.7}
      >
        <View style={styles.backgroundContainer}>
          <Image 
            source={require("../../assets/point-shop/point-shop-case.png")} 
            style={styles.backgroundImage}
            resizeMode="stretch"
          />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{quantityLabel} left | </Text>
            <Image
              source={require("../../assets/point-shop/point-shop-diamonds.png")}
              style={styles.icon}
              resizeMode="contain"
            />
            <Text style={styles.price}>{item.price}</Text>
          </View>
          <Image source={{ uri: item.imageURL }} style={styles.image} />
        </View>
      </TouchableOpacity>
    </View>
  );
});

export default ShopItemCard;

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    position: "relative",
    overflow: "visible",
    paddingTop: 40,
    marginTop: -40,
  },
  floatingContainer: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    zIndex: 10,
  },
  floatingImage: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  floatingText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
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
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 12,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
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
    color: "#ccc",
    textAlign: "center",
  },
  icon: {
    width: 14,
    height: 14,
    marginHorizontal: 2,
  },
  image: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
});
