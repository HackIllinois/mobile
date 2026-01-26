import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { useEffect, useState } from "react";
import { ShopItem } from "../../types";
import CartItem from "./CartItem";
import api from "../../api";

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
  cartIds: string[];
  shopItemData: ShopItem[];
  onAddItem: (itemId: string) => Promise<boolean>;
  onRemoveItem: (itemId: string) => Promise<boolean>;
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
  const [qrCodeData, setQrCodeData] = useState<string | null>();

  useEffect(() => {
    if (visible) {
      // setQrCodeData(null);
    }
  }, [visible]);

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

  const handlePurchasePress = async () => {
    try {
      const response = await api.get<any>("/shop/cart/qr");
      if (response.data && response.data.QRCode) {
        setQrCodeData(response.data.QRCode);
        onPurchase();
      }
    } catch (error: any) {
      const data = error.response?.data;
      if (data) {
        if (
          data.error === "InsufficientQuantity" ||
          data.error === "InsufficientFunds" ||
          data.error === "NotFound"
        ) {
          Alert.alert(data.error, data.message);
        } else {
          Alert.alert("Error", "An unexpected error occurred.");
        }
      } else {
        Alert.alert("Error", "Failed to connect to server.");
      }
    }
  };

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

          {qrCodeData ? (
            <View style={styles.qrContainer}>
              <Text style={styles.title}>SCAN QR CODE</Text>
              <View style={styles.qrCodeWrapper}>
                <QRCode value={qrCodeData} size={200} />
              </View>
              <Text style={styles.qrInstruction}>
                Show this to a shopkeeper to collect your items.
              </Text>
            </View>
          ) : (
            <>
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
                  <View style={styles.totalValueContainer}>
                    <Image
                      source={require("../../assets/point shop/point-shop-diamonds.png")}
                      style={styles.diamondIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.totalValue}>{totalPoints}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.purchaseButton,
                    isEmpty && styles.purchaseButtonDisabled,
                  ]}
                  disabled={isEmpty}
                  onPress={handlePurchasePress}
                >
                  <Text style={styles.purchaseButtonText}>
                    COMPLETE PURCHASE
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
    backgroundColor: "#3d2f52",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "60%",
    padding: 20,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#5a4570",
    borderBottomWidth: 0,
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
    color: "#c4b4d4",
    fontWeight: "300",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#e8dff0",
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
    color: "#a893be",
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
    borderTopColor: "#5a4570",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e8dff0",
  },
  totalValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  diamondIcon: {
    width: 24,
    height: 24,
  },
  totalValue: {
    fontFamily: "Tsukimi Rounded",
    fontSize: 18,
    fontWeight: "700",
    color: "#e8dff0",
  },
  purchaseButton: {
    backgroundColor: "#6B4E8C",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  purchaseButtonDisabled: {
    backgroundColor: "#8a7a9c",
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: "#e8dff0",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  qrContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  qrCodeWrapper: {
    padding: 20,
    backgroundColor: "white",
    borderRadius: 20,
  },
  qrInstruction: {
    fontSize: 16,
    color: "#e8dff0",
    textAlign: "center",
    maxWidth: "80%",
    lineHeight: 24,
  },
});
