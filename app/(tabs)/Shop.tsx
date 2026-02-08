import { useEffect, useState, useRef, useCallback } from "react";
import api from "../../api";
import { ShopItem } from "../../types";
import { useShopItems } from "../../lib/fetchShopItems";
import { useProfile } from "../../lib/fetchProfile";
import {
  StyleSheet,
  View,
  ScrollView,
  Dimensions,
  Alert,
  ImageBackground,
  Pressable,
  Image,
  Modal,
  Animated,
  Text,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TypeWriter from "react-native-typewriter";
import ShopItemCard from "../../components/point shop/ShopItemCard";
import CartButton from "../../components/point shop/CartButton";
import Points from "../../components/point shop/Points";
import CartModal from "../../components/point shop/CartModal";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import { getConstrainedWidth } from "../../lib/layout";

const { width: windowWidth } = Dimensions.get("window");
const SCREEN_WIDTH = getConstrainedWidth();
const CHUNK_SIZE = 2;
const TUTORIAL_KEY = "@shop_tutorial_completed";

const tutorialTexts = [
  "Welcome to the Point Shop traveller!",
  "Use your earned points to buy items.\nSwipe to see more on each row.",
  "Spend em' wisely. Good luck with your journey...",
];

const IMAGE_WIDTH = 1728;
const IMAGE_HEIGHT = 3273;

const TITLE_IMAGE_Y = 350;     // Where title image should appear
const POINTS_IMAGE_Y = 1080;   // Where points display should appear
const MERCH_ROW_IMAGE_Y = 1250;  // Where merch cards should appear (below "merch" label)
const RAFFLE_ROW_IMAGE_Y = 2150; // Where raffle cards should appear (below "raffle" label)



const imageYToScreenY = (
  imageY: number,
  containerWidth: number,
  containerHeight: number
): number => {
  const scaleX = containerWidth / IMAGE_WIDTH;
  const scaleY = containerHeight / IMAGE_HEIGHT;
  const coverScale = Math.max(scaleX, scaleY);
  const offsetY = (IMAGE_HEIGHT * coverScale - containerHeight) / 2;
  return (imageY * coverScale) - offsetY;
};

// Get the cover scale factor for sizing elements proportionally
const getCoverScale = (containerWidth: number, containerHeight: number): number => {
  const scaleX = containerWidth / IMAGE_WIDTH;
  const scaleY = containerHeight / IMAGE_HEIGHT;
  return Math.max(scaleX, scaleY);
};


const chunkItems = (items: ShopItem[]): ShopItem[][] => {
  const chunks: ShopItem[][] = [];
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    chunks.push(items.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
};

export default function PointShop() {
  const insets = useSafeAreaInsets();

  const HEADER_Y = insets.top + 8;   // SAME value used by profile button
  const HEADER_HEIGHT = 90;

  const { height: screenHeight } = Dimensions.get("window");
  const screenWidth = getConstrainedWidth();
  
  const containerWidth = screenWidth;
  const containerHeight = screenHeight;
  
  const safeAreaAdjustment = insets.top - 57; // baseline of ~57 (average)
  const coverScale = getCoverScale(containerWidth, containerHeight);
  
  // Title size in the original image (approximate) - scales with background
  const TITLE_BASE_WIDTH = 600;  // Base width in image pixels
  const TITLE_BASE_HEIGHT = 300; // Base height in image pixels
  const titleWidth = TITLE_BASE_WIDTH * coverScale;
  const titleHeight = TITLE_BASE_HEIGHT * coverScale;
  
  const TITLE_Y = imageYToScreenY(TITLE_IMAGE_Y, containerWidth, containerHeight) + safeAreaAdjustment;
  const POINTS_Y = imageYToScreenY(POINTS_IMAGE_Y, containerWidth, containerHeight) + safeAreaAdjustment;
  
  // Calculate base row positions from image mapping
  const baseTopRowY = imageYToScreenY(MERCH_ROW_IMAGE_Y, containerWidth, containerHeight) + safeAreaAdjustment;
  const baseBottomRowY = imageYToScreenY(RAFFLE_ROW_IMAGE_Y, containerWidth, containerHeight) + safeAreaAdjustment;
  
  // On abnormally tall screens (height > 900), push rows down by the extra height
  const NORMAL_HEIGHT = 900;
  const extraHeight = Math.max(0, containerHeight - NORMAL_HEIGHT);
  const tallScreenOffset = extraHeight * 0.2; // Push down by half the extra height
  
  const TOP_ROW_Y = baseTopRowY + tallScreenOffset;
  const BOTTOM_ROW_Y = baseBottomRowY + tallScreenOffset;


  const { shopItems: shopItemData, loading: shopLoading } = useShopItems();
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile();
  const userPoints = profile?.points ?? 0;

  const isLoading = shopLoading || profileLoading;

  const [cartIds, setCartIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCartModal, setShowCartModal] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [typewriterKey, setTypewriterKey] = useState(0);

  const tutorialAnim = useRef(new Animated.Value(0)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isTutorialActive && tutorialStep !== null) {
      tutorialAnim.setValue(0);
      Animated.spring(tutorialAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [tutorialStep]);

  // Check if tutorial has been completed
  useEffect(() => {
    const checkTutorial = async () => {
      try {
        const completed = await AsyncStorage.getItem(TUTORIAL_KEY);
        if (!completed) {
          setTutorialStep(0);
          setIsTutorialActive(true);
        }
      } catch (error) {
        console.error("Failed to check tutorial status:", error);
      }
    };
    checkTutorial();
  }, []);

  const nonRaffleItems = shopItemData.filter((item) => !item.isRaffle);
  const raffleItems = shopItemData.filter((item) => item.isRaffle);
  const topPages = chunkItems(nonRaffleItems);
  const bottomPages = chunkItems(raffleItems);

  const handleTutorialTap = async () => {
    if (tutorialStep === null) return;

    if (tutorialStep < tutorialTexts.length - 1) {
      setTutorialStep(tutorialStep + 1);
      setTypewriterKey((prev) => prev + 1);
    } else {
      setTutorialStep(null);
      setIsTutorialActive(false);
      try {
        await AsyncStorage.setItem(TUTORIAL_KEY, "true");
      } catch (error) {
        console.error("Failed to save tutorial completion:", error);
      }
    }
  };

  const addToCart = async (itemId: string): Promise<{ success: boolean; errorMessage?: string }> => {
    if (!isTutorialActive) {
      try {
        await api.post(`/shop/cart/${itemId}`);
        setCartIds((ids) => [...ids, itemId]);
        return { success: true };
      } catch (error: any) {
        console.error("Failed to add item to cart:", error);
        const data = error.response?.data;
        const errorMessage = data?.message || data?.error || "Failed to add item to cart";
        return { success: false, errorMessage };
      }
    }
    return { success: false, errorMessage: "Tutorial is active" };
  };

  const removeFromCart = async (itemId: string): Promise<{ success: boolean; errorMessage?: string }> => {
    try {
      await api.delete(`/shop/cart/${itemId}`);
      setCartIds((ids) => {
        const index = ids.indexOf(itemId);
        return index === -1 ? ids : [...ids.slice(0, index), ...ids.slice(index + 1)];
      });
      return { success: true };
    } catch (error: any) {
      console.error("Failed to remove item from cart:", error);
      const data = error.response?.data;
      const errorMessage = data?.message || data?.error || "Failed to remove item from cart";
      return { success: false, errorMessage };
    }
  };

  const fetchCartItems = async () => {
    try {
      const response = await api.get<any>("/shop/cart");
      if (response.data && response.data.items) {
        // Convert items object { itemId: quantity } to array of itemIds
        const itemsObj = response.data.items as Record<string, number>;
        const ids: string[] = [];
        Object.entries(itemsObj).forEach(([itemId, quantity]) => {
          for (let i = 0; i < quantity; i++) {
            ids.push(itemId);
          }
        });
        setCartIds(ids);
      }
    } catch (error) {
      console.error("Failed to fetch cart items:", error);
    }
  };

  const openCartModal = async () => {
    if (!isTutorialActive) {
      setShowCartModal(true);
    }
  };

  const showError = useCallback((message: string) => {
    setErrorMessage(message);
    errorOpacity.setValue(1);
    Animated.timing(errorOpacity, {
      toValue: 0,
      duration: 2500,
      useNativeDriver: true,
    }).start(() => setErrorMessage(null));
  }, [errorOpacity]);

  const [topPageIndex, setTopPageIndex] = useState(0);
  const [bottomPageIndex, setBottomPageIndex] = useState(0);

  const handleTopScroll = (event: any) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setTopPageIndex(page);
  };

  const handleBottomScroll = (event: any) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setBottomPageIndex(page);
  };

  const renderShopRow = (pages: ShopItem[][], scale: number = 1) =>
    pages.map((page, pageIndex) => (
      <View key={pageIndex} style={styles.page}>
        <View style={styles.row}>
          {page.map((item) => (
            <View key={item.itemId} style={styles.gridItem}>
              <ShopItemCard
                item={item}
                onPress={async () => {
                  const result = await addToCart(item.itemId);
                  if (!result.success && result.errorMessage) {
                    showError(result.errorMessage);
                  }
                  return result;
                }}
                scale={scale}
              />
            </View>
          ))}
        </View>
      </View>
    ));

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ImageBackground source={require("../../assets/point-shop/point-shop-background.png")} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <ActivityIndicator size="large" color="#fff" style={styles.loadingSpinner} />
      </View>
    );
  }

  return (
    <ImageBackground source={require("../../assets/point-shop/point-shop-background.png")} style={styles.container} resizeMode="cover">
      {/* Points */}
      <View style={{ position: "absolute", top: POINTS_Y, width: "100%", alignItems: "center", zIndex: 10 }}>
        <Points points={userPoints} />
      </View>

      {/* Top Row - Merch */}
      <View style={{ position: "absolute", top: TOP_ROW_Y, width: "100%" }}>
        <View style={styles.scrollContainer}>
          {topPageIndex > 0 && (
            <View style={styles.chevronLeft}>
              <Animated.Text style={styles.chevronText}>‹</Animated.Text>
            </View>
          )}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={!isTutorialActive}
            onScroll={handleTopScroll}
            scrollEventThrottle={16}
          >
            {renderShopRow(topPages, 1)}
          </ScrollView>
          {topPageIndex < topPages.length - 1 && (
            <View style={styles.chevronRight}>
              <Animated.Text style={styles.chevronText}>›</Animated.Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom Row - Raffle */}
      <View style={{ position: "absolute", top: BOTTOM_ROW_Y, width: "100%" }}>
        <View style={styles.scrollContainer}>
          {bottomPageIndex > 0 && (
            <View style={styles.chevronLeft}>
              <Animated.Text style={styles.chevronText}>‹</Animated.Text>
            </View>
          )}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={!isTutorialActive}
            onScroll={handleBottomScroll}
            scrollEventThrottle={16}
          >
            {renderShopRow(bottomPages, 1)}
          </ScrollView>
          {bottomPageIndex < bottomPages.length - 1 && (
            <View style={styles.chevronRight}>
              <Animated.Text style={styles.chevronText}>›</Animated.Text>
            </View>
          )}
        </View>
      </View>

      <Modal
        visible={isTutorialActive && tutorialStep !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <Pressable style={styles.tutorialOverlay} onPress={handleTutorialTap}>
          <Animated.View
            style={[
              styles.tutorialContainer,
              {
                opacity: tutorialAnim,
                transform: [
                  {
                    translateY: tutorialAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Animated.Image
              source={require("../../assets/point-shop/point-shop-shopkeeper-2.png")}
              style={[
                styles.shopkeeperImage,
                {
                  opacity: tutorialAnim,
                  transform: [
                    {
                      translateY: tutorialAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    },
                  ],
                },
              ]}
              resizeMode="contain"
            />
            <View style={styles.tutorialTextBox}>
              <TypeWriter
                key={typewriterKey}
                typing={1}
                initialDelay={10}
                minDelay={5}
                maxDelay={10}
                style={styles.tutorialText}
              >
                {tutorialTexts[tutorialStep ?? 0]}
              </TypeWriter>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>

      <CartButton
        itemCount={cartIds.length}
        onPress={openCartModal}
      />

      <CartModal
        visible={showCartModal}
        onClose={() => {
          setShowCartModal(false);
          refetchProfile();
          fetchCartItems();
        }}
        cartIds={cartIds}
        shopItemData={shopItemData}
        onAddItem={addToCart}
        onRemoveItem={removeFromCart}
        onError={showError}
        onRefresh={() => {
          refetchProfile();
          fetchCartItems();
        }}
      />

      {/* Fading error message */}
      {errorMessage && (
        <Animated.View
          style={[
            styles.errorContainer,
            { opacity: errorOpacity },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.errorText}>{errorMessage}</Text>
        </Animated.View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingSpinner: {
    zIndex: 10,
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  pointsContainer: {
    alignSelf: "center",
  },
  scrollContainer: {
    width: "100%",
    overflow: "visible",
  },
  page: {
    width: SCREEN_WIDTH,
  },
  row: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    width: "100%",
    paddingHorizontal: 20,
    gap: 24,
  },
  gridItem: {
    width: (SCREEN_WIDTH - 40 - 24) / 2,
    height: ((SCREEN_WIDTH - 40 - 24) / 2) / 0.9, // height = width / aspectRatio
  },
  chevronLeft: {
    position: "absolute",
    left: 10,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    opacity: .4
  },
  chevronRight: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    opacity: .4
  },
  chevronText: {
    fontSize: 28,
    color: "#ffffffff",
    fontWeight: "bold",
  },
  tutorialOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 120,
  },
  tutorialContainer: {
    position: "relative",
    marginHorizontal: 20,
    width: SCREEN_WIDTH - 40,
  },
  shopkeeperImage: {
    position: "absolute",
    width: 150,
    height: 150,
    right: -35,
    top: -70,
    zIndex: 1,
  },
  tutorialTextBox: {
    backgroundColor: "#354938",
    borderWidth: 2,
    borderColor: "rgba(180, 220, 180, 0.8)",
    paddingVertical: 24,
    paddingLeft: 24,
    paddingRight: 100,
    borderTopLeftRadius: 50,
  },
  tutorialText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 18,
    textAlign: "left",
    fontWeight: "500",
  },
  errorContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
    zIndex: 1000,
  },
  errorText: {
    color: "#ff4444",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
});
