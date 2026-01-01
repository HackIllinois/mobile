import { useEffect, useState } from "react";
import api from "../../api";
import { ShopItem } from "../../types";
import { AxiosResponse } from "axios";
import {
  StyleSheet,
  View,
  ScrollView,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Alert,
  ImageBackground,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TypeWriter from "react-native-typewriter";
import ShopItemCard from "../../components/point shop/ShopItemCard";
import CartButton from "../../components/point shop/CartButton";
import CartModal from "../../components/point shop/CartModal";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CHUNK_SIZE = 3;
const TUTORIAL_KEY = "@shop_tutorial_completed";

const tutorialTexts = [
  "Welcome to the Point Shop traveller!",
  "Use your earned points to purchase items. \nSwipe left or right to see more on each row.",
  "Spend them wisely. Good luck with your travels.",
];

const getSpacing = (screenHeight: number) => {
  if (screenHeight < 700) {
    return { cartMargin: 15, rowSpacer: 45, bottomPadding: 0 };
  } else if (screenHeight < 850) {
    return { cartMargin: 20, rowSpacer: 70, bottomPadding: 20 };
  }
  return { cartMargin: 40, rowSpacer: 80, bottomPadding: 20 };
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
  const [currentPageTop, setCurrentPageTop] = useState(0);
  const [currentPageBottom, setCurrentPageBottom] = useState(0);
  const [backgroundImage, setBackgroundImage] = useState<"bg1" | "bg2">("bg1");
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [typewriterKey, setTypewriterKey] = useState(0);

  const backgroundSource =
    backgroundImage === "bg1"
      ? require("../../assets/point shop/point-shop-bg-1.png")
      : require("../../assets/point shop/point-shop-bg-2.png");

  useEffect(() => {
    const checkTutorial = async () => {
      try {
        // const completed = await AsyncStorage.getItem(TUTORIAL_KEY);
        const completed = false

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
    const fetchShopData = async () => {
      const response: AxiosResponse = await api.get(
        "https://adonix.hackillinois.org/shop/"
      );
      setShopItemData(response.data);
    };
    fetchShopData();
  }, []);

  const midpoint = Math.ceil(shopItemData.length / 2);
  const topPages = chunkItems(shopItemData.slice(0, midpoint));
  const bottomPages = chunkItems(shopItemData.slice(midpoint));

  const handleScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
    setPage: (page: number) => void
  ) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setPage(page);
  };

  const handleTutorialTap = async () => {
    if (tutorialStep === null) return;

    if (tutorialStep === 0) {
      setTutorialStep(1);
      setBackgroundImage("bg2");
      setTypewriterKey((prev) => prev + 1);
    } else if (tutorialStep === 1) {
      setTutorialStep(2);
      setBackgroundImage("bg1");
      setTypewriterKey((prev) => prev + 1);
    } else if (tutorialStep === 2) {
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
    if (isTutorialActive) return;
    setCartIds((ids) => [...ids, itemId]);
  };

  const removeFromCart = (itemId: string) => {
    setCartIds((ids) => {
      const index = ids.indexOf(itemId);
      if (index === -1) return ids;
      return [...ids.slice(0, index), ...ids.slice(index + 1)];
    });
  };

  const handlePurchase = () => {
    Alert.alert("Purchase completed", "", [
      {
        text: "OK",
        onPress: () => {
          setCartIds([]);
          setShowCartModal(false);
        },
      },
    ]);
  };

  const renderShopRow = (pages: ShopItem[][]) =>
    pages.map((page, pageIndex) => (
      <View key={pageIndex} style={[styles.page, { width: SCREEN_WIDTH }]}>
        <View style={styles.row}>
          {page.map((item) => (
            <View key={item.itemId} style={styles.gridItem}>
              <ShopItemCard item={item} onPress={() => addToCart(item.itemId)} />
            </View>
          ))}
        </View>
      </View>
    ));

  return (
    <ImageBackground source={backgroundSource} style={styles.container} resizeMode="cover">
      <SafeAreaView style={[styles.safeArea, { paddingBottom: spacing.bottomPadding }]}>
        <View style={styles.contentContainer}>
          <View style={[styles.cartButtonContainer, { marginBottom: spacing.cartMargin }]}>
            <CartButton
              itemCount={cartIds.length}
              onPress={() => {
                if (!isTutorialActive) {
                  setShowCartModal(true);
                }
              }}
            />
          </View>

          <View style={styles.scrollContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => handleScroll(e, setCurrentPageTop)}
              scrollEventThrottle={30}
              scrollEnabled={!isTutorialActive}
            >
              {renderShopRow(topPages)}
            </ScrollView>
          </View>

          <View style={{ height: spacing.rowSpacer }} />

          <View style={styles.scrollContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => handleScroll(e, setCurrentPageBottom)}
              scrollEventThrottle={30}
              scrollEnabled={!isTutorialActive}
            >
              {renderShopRow(bottomPages)}
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>

      {isTutorialActive && tutorialStep !== null && (
        <Pressable style={styles.tutorialOverlay} onPress={handleTutorialTap}>
          <View style={styles.tutorialTextBox}>
            <TypeWriter
              key={typewriterKey}
              typing={1}
              initialDelay={100}
              minDelay={10}
              maxDelay={20}
              style={styles.tutorialText}
            >
              {tutorialTexts[tutorialStep]}
            </TypeWriter>
          </View>
        </Pressable>
      )}

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
    justifyContent: "flex-end",
  },
  contentContainer: {
    alignItems: "center",
  },
  cartButtonContainer: {
    alignSelf: "center",
  },
  scrollContainer: {
    height: 130,
  },
  page: {
    gap: 0,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    gap: 5,
  },
  gridItem: {
    flex: 1,
    aspectRatio: 1,
  },
  tutorialOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 40,
  },
  tutorialTextBox: {
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    maxWidth: SCREEN_WIDTH - 10,
  },
  tutorialText: {
    color: "white",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
});
