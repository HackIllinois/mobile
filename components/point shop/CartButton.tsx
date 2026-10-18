import { Pressable, Text, StyleSheet, View } from "react-native";

interface CartButtonProps {
  onPress?: () => void;
  itemCount: number;
}

export default function CartButton({ onPress, itemCount }: CartButtonProps) {


  return (
    <View style={ styles.container }>
      <Pressable
        style={styles.button}
        onPress={() => { onPress?.() }}
      >
        <Text style={styles.text}>Cart</Text>
        {itemCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{itemCount}</Text>
          </View>
        )}
      </Pressable>
    </View>
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
    backgroundColor: "#110114ff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
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
