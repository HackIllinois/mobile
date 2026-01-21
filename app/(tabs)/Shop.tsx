import { useEffect, useState, useRef } from "react";
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TypeWriter from "react-native-typewriter";
import ShopItemCard from "../../components/point shop/ShopItemCard";
import CartButton from "../../components/point shop/CartButton";
import Points from "../../components/point shop/Points";
import CartModal from "../../components/point shop/CartModal";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CHUNK_SIZE = 2;
const TUTORIAL_KEY = "@shop_tutorial_completed";

const tutorialTexts = [
  "Welcome to the Point Shop traveller!",
  "Use your earned points to buy items.\nSwipe to see more on each row.",
  "Spend em' wisely. Good luck with your journey...",
];

const getSpacing = (screenHeight: number) => {
  if (screenHeight < 700) return { cartMargin: 0, rowSpacer: 0, bottomPadding: 0, rowHeight: 175 };
  if (screenHeight < 850) return { cartMargin: 35, rowSpacer: 40, bottomPadding: 0, rowHeight: 180 };
  return { cartMargin: 20, rowSpacer: 30, bottomPadding: 10, rowHeight: 190 };
};

const chunkItems = (items: ShopItem[]): ShopItem[][] => {
  const chunks: ShopItem[][] = [];
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    chunks.push(items.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
};

export default function PointShop() {
  const spacing = getSpacing(SCREEN_HEIGHT);

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

  const midpoint = Math.ceil(shopItemData.length / 2);
  const topPages = chunkItems(shopItemData.slice(0, midpoint));
  const bottomPages = chunkItems(shopItemData.slice(midpoint));

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
    if (!isTutorialActive) setCartIds((ids) => [...ids, itemId]);
  };

  const removeFromCart = (itemId: string) => {
    setCartIds((ids) => {
      const index = ids.indexOf(itemId);
      return index === -1 ? ids : [...ids.slice(0, index), ...ids.slice(index + 1)];
    });
  };

  const handlePurchase = () => {
    Alert.alert("Purchase completed", "", [{
      text: "OK",
      onPress: () => {
        setCartIds([]);
        setShowCartModal(false);
      },
    }]);
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
      <View key={pageIndex} style={[styles.page, { width: SCREEN_WIDTH }]}>
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
        <View style={styles.contentContainer}>
          <View style={[styles.pointsContainer, { marginBottom: spacing.cartMargin }]}>
            <Points />
          </View>

          <View style={[styles.scrollContainer, { height: spacing.rowHeight }]}>
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

          <View style={[styles.scrollContainer, { height: spacing.rowHeight }]}>
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
    overflow: "visible",
  },
  page: {
    position: "relative",
    height: "100%",
  },
  row: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
    gap: 24,
  },
  gridItem: {
    width: (SCREEN_WIDTH - 40 - 24) / 2,
    aspectRatio: 0.9,
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
