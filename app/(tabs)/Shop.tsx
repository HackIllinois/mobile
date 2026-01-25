import { useEffect, useState, useRef, useCallback } from "react";
import { AxiosResponse } from "axios";
import api from "../../api";
import { ShopItem } from "../../types";
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
  LayoutChangeEvent,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TypeWriter from "react-native-typewriter";
import ShopItemCard from "../../components/point shop/ShopItemCard";
import CartButton from "../../components/point shop/CartButton";
import Points from "../../components/point shop/Points";
import CartModal from "../../components/point shop/CartModal";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHUNK_SIZE = 2;
const TUTORIAL_KEY = "@shop_tutorial_completed";

const tutorialTexts = [
  "Welcome to the Point Shop traveller!",
  "Use your earned points to buy items.\nSwipe to see more on each row.",
  "Spend em' wisely. Good luck with your journey...",
];
// Background image dimensions: 1728 x 3273
const IMAGE_WIDTH = 1728;
const IMAGE_HEIGHT = 3273;
const IMAGE_ASPECT_RATIO = IMAGE_HEIGHT / IMAGE_WIDTH; // ~1.894

const getSpacing = (containerWidth: number, containerHeight: number) => {
  // Calculate how resizeMode="cover" affects the background
  const containerRatio = containerHeight / containerWidth;
  
  // With "cover", the image scales to fill the container while maintaining aspect ratio
  // Scale factor is the larger of the two possible scales
  const scaleX = containerWidth / IMAGE_WIDTH;
  const scaleY = containerHeight / IMAGE_HEIGHT;
  const coverScale = Math.max(scaleX, scaleY);
  
  // Calculate the visible portion of the image (0 to 1)
  // This tells us how much of the image is being cropped
  const visibleWidth = containerWidth / (coverScale * IMAGE_WIDTH);
  const visibleHeight = containerHeight / (coverScale * IMAGE_HEIGHT);
  
  // Use the ratio of visible height as the primary factor
  // When container is wider: visibleHeight < 1 (top/bottom cropped) -> compact
  // When container is taller: visibleHeight = 1, visibleWidth < 1 (sides cropped) -> more space
  
  // Normalize based on visible height (0.7 to 1.0 range maps to 0 to 1)
  const t = Math.min(Math.max((visibleHeight - 0.7) / 0.3, 0), 1);
  
  // Define spacing values that scale with the visible portion
  // Now that rows hug their content, we distribute remaining space via margins/padding
  const pointsMargin = 15 + t * 25;  // 15 to 40 - space below points display
  const rowSpacer = 20 + t * 30;     // 20 to 50 - space between shop rows
  const bottomPadding = 20 + t * 30; // 60 to 90 - space at bottom to avoid cart overlap
  const topPadding = t * 20;         // 0 to 20 - optional space at top of content
  
  return { pointsMargin, rowSpacer, bottomPadding, topPadding };
};

const chunkItems = (items: ShopItem[]): ShopItem[][] => {
  const chunks: ShopItem[][] = [];
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    chunks.push(items.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
};

export default function PointShop() {
  const [containerDimensions, setContainerDimensions] = useState({ width: 1, height: 1 });
  const spacing = getSpacing(containerDimensions.width, containerDimensions.height);

  const onContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerDimensions({ width, height });
  }, []);

  const [shopItemData, setShopItemData] = useState<ShopItem[]>([]);
  const [cartIds, setCartIds] = useState<string[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [typewriterKey, setTypewriterKey] = useState(0);

  const tutorialAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    api.get<AxiosResponse<ShopItem[]>>("https://adonix.hackillinois.org/shop/")
      .then((response) => setShopItemData(response.data));
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

  const addToCart = (itemId: string) => {
    if (!isTutorialActive) {
      setCartIds((ids) => [...ids, itemId]);
      api.post(`/shop/cart/${itemId}`).catch((error) => {
        console.error("Failed to add item to cart:", error);
      });
    }
  };

  const removeFromCart = (itemId: string) => {
    setCartIds((ids) => {
      const index = ids.indexOf(itemId);
      return index === -1 ? ids : [...ids.slice(0, index), ...ids.slice(index + 1)];
    });
  };

  const handlePurchase = () => {
    setCartIds([]);
  };

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
              <ShopItemCard item={item} onPress={() => addToCart(item.itemId)} scale={scale} />
            </View>
          ))}
        </View>
      </View>
    ));

  return (
    <ImageBackground source={require("../../assets/point shop/point-shop-background.png")} style={styles.container} resizeMode="cover">
      <SafeAreaView style={[styles.safeArea, { paddingBottom: spacing.bottomPadding }]} edges={["top"]}>
        <Image
          source={require("../../assets/point shop/point-shop-title.png")}
          style={styles.titleImage}
          resizeMode="contain"
        />
        <View style={[styles.contentContainer, { paddingTop: spacing.topPadding }]} onLayout={onContainerLayout}>
          <View style={[styles.pointsContainer, { marginBottom: spacing.pointsMargin }]}>
            <Points />
          </View>

          <View style={styles.scrollContainer}>
            {/* Fixed left chevron for top row */}
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
            {/* Fixed right chevron for top row */}
            {topPageIndex < topPages.length - 1 && (
              <View style={styles.chevronRight}>
                <Animated.Text style={styles.chevronText}>›</Animated.Text>
              </View>
            )}
          </View>

          <View style={{ height: spacing.rowSpacer }} />

          <View style={styles.scrollContainer}>
            {/* Fixed left chevron for bottom row */}
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
            {/* Fixed right chevron for bottom row */}
            {bottomPageIndex < bottomPages.length - 1 && (
              <View style={styles.chevronRight}>
                <Animated.Text style={styles.chevronText}>›</Animated.Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>

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
              source={require("../../assets/point shop/point-shop-shopkeeper-2.png")}
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
        onPress={() => !isTutorialActive && setShowCartModal(true)}
      />

      <CartModal
        visible={showCartModal}
        onClose={() => setShowCartModal(false)}
        cartIds={cartIds}
        shopItemData={shopItemData}
        onAddItem={addToCart}
        onRemoveItem={removeFromCart}
        onPurchase={handlePurchase}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  titleImage: {
    width: 200,
    height: 60,
    marginLeft: 20,
    marginTop: 10,
    alignSelf: "flex-start",
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
});
