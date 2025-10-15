import { useEffect, useState } from "react";
import api from "../api";
import { ShopItem } from "../types";
import { AxiosResponse } from "axios";
import {
  StyleSheet,
  View,
  ScrollView,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  Alert,
} from "react-native";
import ShopItemCard from "../src/components/point shop/ShopItemCard";
import PageIndicator from "../src/components/point shop/PageIndicator";
import CartButton from "../src/components/point shop/CartButton";
import CartModal from "../src/components/point shop/CartModal";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PointShop() {
  const screenWidth = Dimensions.get("window").width;
  // data state
  const [shopItemData, setShopItemData] = useState<ShopItem[]>([]);
  // cart state
  const [cartIds, setCartIds] = useState<string[]>([]);
  const [showCartModal, setShowCartModal] = useState<boolean>(false);
  // shop item display state
  const [currentPage, setCurrentPage] = useState(0);

  // get data
  useEffect(() => {
    const fetch = async () => {
      const response: AxiosResponse = await api.get(
        "https://adonix.hackillinois.org/shop/"
      );
      const data: ShopItem[] = response.data;
      setShopItemData(data);
    };
    fetch();
  }, []);

  // store item display
  const chunkItems = (items: ShopItem[]): ShopItem[][] => {
    // groups items into list[n][4]
    const chunks: ShopItem[][] = [];
    const chunkSize: number = 4;
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
  };
  const pages = chunkItems(shopItemData);
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / screenWidth);
    setCurrentPage(page);
  };

  // cart handling
  const addShopItemToCart = (newId: string) => {
    // this can add duplicate ids to cart
    setCartIds((ids) => [...ids, newId]);
  };
  const removeShopItemFromCart = (removeId: string) => {
    // this removes only one instance of that shopitem from cart
    setCartIds((ids) => {
      const remove_index = ids.indexOf(removeId);
      if (remove_index === -1) return ids;
      return [...ids.slice(0, remove_index), ...ids.slice(remove_index + 1)];
    });
  };
  const bulkRemoveShopItemFromCart = (removeId: string) => {
    setCartIds((ids) => ids.filter((id) => id !== removeId));
  };
  const clearCart = () => {
    setCartIds([]);
  };
  const openCartModal = () => {
    setShowCartModal(true);
  };
  const closeCartModal = () => {
    setShowCartModal(false);
  };
  const handlePurchase = () => {
    Alert.alert("Purchase completed", "", [
      {
        text: "OK",
        onPress: () => {
          clearCart();
          closeCartModal();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHalf}></View>
      <SafeAreaView>
        <View style={styles.cartButtonContainer}>
          <CartButton itemCount={cartIds.length} onPress={openCartModal} />
        </View>
        <ScrollView
          horizontal
          pagingEnabled // sticky scroll effect
          showsHorizontalScrollIndicator={false}
          style={styles.bottomHalf}
          onScroll={handleScroll}
          scrollEventThrottle={30}
        >
          {pages.map((page, pageIndex) => (
            <View key={pageIndex} style={[styles.page, { width: screenWidth }]}>
              <View style={styles.row}>
                {page[0] && (
                  <View style={styles.gridItem}>
                    <ShopItemCard
                      item={page[0]}
                      onPress={() => addShopItemToCart(page[0].itemId)}
                    />
                  </View>
                )}
                {page[1] && (
                  <View style={styles.gridItem}>
                    <ShopItemCard
                      item={page[1]}
                      onPress={() => addShopItemToCart(page[1].itemId)}
                    />
                  </View>
                )}
              </View>
              <View style={styles.row}>
                {page[2] && (
                  <View style={styles.gridItem}>
                    <ShopItemCard
                      item={page[2]}
                      onPress={() => addShopItemToCart(page[2].itemId)}
                    />
                  </View>
                )}
                {page[3] && (
                  <View style={styles.gridItem}>
                    <ShopItemCard
                      item={page[3]}
                      onPress={() => addShopItemToCart(page[3].itemId)}
                    />
                  </View>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
        <PageIndicator currentPage={currentPage} totalPages={pages.length} />
      </SafeAreaView>
      <CartModal
        visible={showCartModal}
        onClose={closeCartModal}
        cartIds={cartIds}
        shopItemData={shopItemData}
        onAddItem={addShopItemToCart}
        onRemoveItem={removeShopItemFromCart}
        onPurchase={handlePurchase}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  topHalf: {
    width: "100%",
  },
  bottomHalf: {
    flexGrow: 0,
  },
  cartButtonContainer: {
    width: "100%",
    marginHorizontal: "auto",
  },
  page: {
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 10,
    padding: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    gap: 10,
  },
  gridItem: {
    flex: 1,
    aspectRatio: 1,
  },
});
