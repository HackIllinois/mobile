import { useState, useRef, useCallback } from "react";
import api from "../../api";
import { ShopItem } from "../../types";
import type { components } from "../../types/generated-types";


type Order = components["schemas"]["Order"];

function orderToCartIds(order: Order): string[] {
  const ids: string[] = [];
  Object.entries(order.items).forEach(([itemId, quantity]) => {
    for (let i = 0; i < quantity; i++) ids.push(itemId);
  });
  return ids;
}
import { useShopItems } from "../../lib/fetchShopItems";
import { useProfile } from "../../lib/fetchProfile";
import {
  StyleSheet,
  View,
  Animated,
  Text,
  ActivityIndicator,
  FlatList
} from "react-native";
import ShopItemCard from "../../components/point shop/ShopItemCard";
import CartButton from "../../components/point shop/CartButton";
import Points from "../../components/point shop/Points";
import CartModal from "../../components/point shop/CartModal";
import { useFocusEffect } from "@react-navigation/native";
const CART_UI_TEST_MODE = true;

export default function PointShop() {
  const { shopItems: shopItemData, loading: shopLoading } = useShopItems();
  const { profile, refetch: refetchProfile } = useProfile();
  const userPoints = profile?.points ?? 0;

  const isLoading = shopLoading && shopItemData.length === 0;

  const [cartIds, setCartIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCartModal, setShowCartModal] = useState(false);

  const errorOpacity = useRef(new Animated.Value(0)).current;

  const nonRaffleItems = shopItemData.filter((item) => !item.isRaffle).sort((a, b) => a.price - b.price);
  const raffleItems = shopItemData.filter((item) => item.isRaffle).sort((a, b) => a.price - b.price);
  useFocusEffect(
    useCallback(() => {
      if (!CART_UI_TEST_MODE) {
        fetchCartItems();
        refetchProfile();
      }
    }, [refetchProfile])
  );

  // Helper function to set cartIds from an Order
  const setCartFromOrder = (order: Order) => {
    setCartIds(orderToCartIds(order));
  };

  const addToCart = async (itemId: string): Promise<{ success: boolean; errorMessage?: string }> => {
    if (CART_UI_TEST_MODE){
      setCartIds((currentIds)=>[...currentIds, itemId]);
      return {success: true};

    }
    try {
      const res = await api.post(`/shop/cart/${itemId}`) as { data: Order };
      setCartFromOrder(res.data);
      return { success: true };
    } catch (error: any) {
      console.error("Failed to add item to cart:", error);
      if (error.response?.status === 401) {
        return { success: false, errorMessage: "You must login to purchase items" };
      }
      const data = error.response?.data;
      const errorMessage = data?.message || data?.error || "Failed to add item to cart";
      return { success: false, errorMessage };
    }
  };

  const removeFromCart = async (itemId: string): Promise<{ success: boolean; errorMessage?: string }> => {
    if(CART_UI_TEST_MODE){
      setCartIds((currentIds) => {
        const removeItem = currentIds.indexOf(itemId);
        if(removeItem == -1){
          return currentIds;
        }
        return currentIds.filter((_, index) => index !=removeItem);
      });

      return {success: true};
    }
    try {
      const res = await api.delete(`/shop/cart/${itemId}`) as { data: Order };
      setCartFromOrder(res.data);
      return { success: true };
    } catch (error: any) {
      console.error("Failed to remove item from cart:", error);
      fetchCartItems();
      const data = error.response?.data;
      const errorMessage = data?.message || data?.error || "Failed to remove item from cart";
      return { success: false, errorMessage };
    }
  };

  const fetchCartItems = async () => {
    try {
      const response = await api.get("/shop/cart") as { data: Order };
      setCartFromOrder(response.data);
    } catch (error) {
      console.error("Failed to fetch cart items:", error);
    }
  };

  const openCartModal = async () => {
    setShowCartModal(true);
  };

  const showError = useCallback((message: string) => {
    errorOpacity.stopAnimation();
    setErrorMessage(message);
    errorOpacity.setValue(1);
    Animated.timing(errorOpacity, {
      toValue: 0,
      duration: 2500,
      useNativeDriver: true,
    }).start(() => setErrorMessage(null));
  }, [errorOpacity]);

  const renderShopItem = (item: ShopItem) =>
      <View style={styles.container}>
        <ShopItemCard
          item={item}
          onPress={async () => {
            const result = await addToCart(item.itemId);
            if (!result.success && result.errorMessage) {
              showError(result.errorMessage);
            }
            return result;
          }}
        />
      </View>

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#12df8dff" style={styles.container} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Temporary, arbitrary placements while we strip it */}
      <View style={{marginTop: 100}}>
        <Points points={userPoints} />
      </View>

      {/* Top Row - Merch */}
      <View style={styles.itemList}>
       <FlatList
          data={nonRaffleItems}
          keyExtractor={(shopItem)=>shopItem.itemId}
          renderItem={(currItemInfo) => renderShopItem(currItemInfo.item)}
          horizontal={true}
       />
      </View>

      {/* Bottom Row - Raffle */}
      <View style={ styles.itemList }>
        <FlatList
          data = {raffleItems}
          keyExtractor = {(shopItem)=> shopItem.itemId}
          renderItem = {(currItemInfo)=> renderShopItem(currItemInfo.item)}
          horizontal={true}
        />
      </View>


      <CartButton
        itemCount={cartIds.length}
        onPress={openCartModal}
      />

      <CartModal
        visible={showCartModal}
        onClose={() => {
          setShowCartModal(false);
          if(!CART_UI_TEST_MODE){
          refetchProfile();
          fetchCartItems();
          }
        }}
        cartIds={cartIds}
        shopItemData={shopItemData}
        onAddItem={addToCart}
        onRemoveItem={removeFromCart}
        onError={showError}
        onRefresh={() => {
          if(!CART_UI_TEST_MODE){
            refetchProfile();
            fetchCartItems();
          }
        }}
        testMode= {CART_UI_TEST_MODE}
      />
          <Text style={styles.text}>{errorMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemList: {
    height : 100,
    justifyContent: 'center',
  },

  text: {
    color: "#000000ff"
  }
});
