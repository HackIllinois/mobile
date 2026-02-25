import { useEffect, useRef } from "react";
import { TouchableOpacity, Text, StyleSheet, View, Animated } from "react-native";
import * as Haptics from "expo-haptics";

interface CartButtonProps {
  onPress?: () => void;
  itemCount: number;
}

export default function CartButton({ onPress, itemCount }: CartButtonProps) {
  const slideAnim = useRef(new Animated.Value(150)).current; // Start off-screen to the right

  useEffect(() => {
    if (itemCount > 0) {
      // Slide in from right
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide out to right
      Animated.spring(slideAnim, {
        toValue: 150,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [itemCount]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.button}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress?.(); }}
        activeOpacity={0.7}
      >
        <Text style={styles.text}>Cart</Text>
        {itemCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{itemCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  button: {
    backgroundColor: "#5a4570",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  text: {
    fontFamily: "Tsukimi Rounded",
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
