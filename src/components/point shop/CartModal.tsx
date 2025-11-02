import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShopItem } from "../../../types";
import CartItem from "./CartItem";

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
  cartIds: string[];
  shopItemData: ShopItem[];
  onAddItem: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onPurchase: () => void;
}

export default function CartModal({
  visible,
  onClose,
  cartIds,
  shopItemData,
  onAddItem,
  onRemoveItem,
  onPurchase,
}: CartModalProps) {
  const calculateTotal = (): number => {
    return cartIds.reduce((total, itemId) => {
      const item = shopItemData.find((shopItem) => shopItem.itemId === itemId);
      return total + (item?.price || 0);
    }, 0);
  };

  // Group cart items by ID and calculate quantities
  const getCartItemsWithQuantities = (): Array<{
    item: ShopItem;
    quantity: number;
  }> => {
    const itemMap = new Map<string, number>();
    cartIds.forEach((id) => {
      itemMap.set(id, (itemMap.get(id) || 0) + 1);
    });

    const result: Array<{ item: ShopItem; quantity: number }> = [];
    itemMap.forEach((quantity, itemId) => {
      const item = shopItemData.find((shopItem) => shopItem.itemId === itemId);
      if (item) {
        result.push({ item, quantity });
      }
    });
    return result;
  };

  const isEmpty = cartIds.length === 0;
  const totalPoints = calculateTotal();
  const cartItems = getCartItemsWithQuantities();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <SafeAreaView style={styles.modalContainer} edges={["bottom"]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.title}>IN YOUR CART</Text>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {isEmpty ? (
              <Text style={styles.emptyMessage}>
                YOUR CART IS CURRENTLY EMPTY
              </Text>
            ) : (
              cartItems.map(({ item, quantity }) => (
                <CartItem
                  key={item.itemId}
                  item={item}
                  quantity={quantity}
                  onIncrement={() => onAddItem(item.itemId)}
                  onDecrement={() => onRemoveItem(item.itemId)}
                />
              ))
            )}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>total</Text>
              <Text style={styles.totalValue}>🪙 {totalPoints}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.purchaseButton,
                isEmpty && styles.purchaseButtonDisabled,
              ]}
              disabled={isEmpty}
              onPress={onPurchase}
            >
              <Text style={styles.purchaseButtonText}>COMPLETE PURCHASE</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "60%",
    padding: 20,
    justifyContent: "space-between",
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#666",
    fontWeight: "300",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginBottom: 20,
    letterSpacing: 1,
  },
  body: {
    flex: 1,
    height: "100%",
  },
  bodyContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
  },
  emptyMessage: {
    fontSize: 16,
    color: "#999",
    fontWeight: "500",
    letterSpacing: 0.5,
    textAlign: "center",
    marginVertical: "auto",
  },
  footer: {
    gap: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },
  purchaseButton: {
    backgroundColor: "#000",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  purchaseButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
