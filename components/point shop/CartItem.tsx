import { View, Text, Image, StyleSheet, TouchableOpacity, Animated, Easing } from "react-native";
import { ShopItem } from "../../types";
import { useRef } from "react";
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
  const floatAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handleIncrement = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await onIncrement();

    // Only animate if the API call succeeded
    if (success) {
      // Reset animations
      floatAnim.setValue(0);
      opacityAnim.setValue(1);

      // Start animations
      Animated.parallel([
        Animated.timing(floatAnim, {
          toValue: -50,
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
            <Image
              source={require("../../assets/point shop/point-shop-minus.png")}
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
              source={require("../../assets/point shop/point-shop-plus.png")}
              style={styles.buttonIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: "relative",
    overflow: "visible",
    zIndex: 1,
  },
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
  floatingContainer: {
    position: "absolute",
    top: -10,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
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
    color: "#e8dff0",
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
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e8dff0",
  },
  quantity: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e8dff0",
    minWidth: 20,
    textAlign: "center",
  },
});
