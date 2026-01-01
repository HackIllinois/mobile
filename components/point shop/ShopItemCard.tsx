import { ShopItem } from "../../types";
import { StyleSheet, View, Text, Image, TouchableOpacity } from "react-native";
import { memo } from "react";
import Svg, { Path, Rect } from "react-native-svg";

interface ShopItemCardProps {
  item: ShopItem;
  onPress: () => void;
}

const ShopCardBackground = memo(() => (
  <Svg width="100%" height="100%" viewBox="0 0 182 158" fill="none" preserveAspectRatio="none">
    <Path
      d="M182 132.733C182 155.639 132.397 158 87.0615 158C41.7263 158 0 150.588 0 130.173C0 109.759 41.7263 55 87.0615 55C132.397 55 182 89.8871 182 132.733Z"
      fill="#664D66"
      fillOpacity="0.5"
    />
    <Path d="M37.711 74.4502H145.477L165.445 126.565H14.89L37.711 74.4502Z" fill="#1E1D2B" />
    <Rect x="14.89" y="126.565" width="150.555" height="14.8901" fill="#3D3C51" />
    <Rect x="38.5524" y="0.5" width="106.539" height="74.2775" fill="#1E1D2B" stroke="black" />
    <Rect x="41.3613" y="81.0681" width="100.094" height="11.5812" fill="#595776" />
    <Path
      d="M26.0576 120.361L41.3613 81.4817V93.0628L33.9162 120.361H26.0576Z"
      fill="#424158"
    />
    <Path
      d="M156.759 120.361L141.455 81.4817V93.0628L148.901 120.361H156.759Z"
      fill="#424158"
    />
    <Path d="M41.3613 92.6492H141.455L148.901 120.361H33.9162L41.3613 92.6492Z" fill="#4B4A62" />
  </Svg>
));

const ShopItemCard = memo(({ item, onPress }: ShopItemCardProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      activeOpacity={0.7}
    >
      <View style={styles.backgroundContainer}>
        <ShopCardBackground />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.price}>🪙 {item.price}</Text>
        <Image source={{ uri: item.imageURL }} style={styles.image} />
      </View>
    </TouchableOpacity>
  );
});

export default ShopItemCard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  backgroundContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "80%",
  },
  contentContainer: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 10
  },
  name: {
    fontSize: 9,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 4,
    maxWidth: 60
  },
  price: {
    fontSize: 8,
    fontWeight: "400",
    color: "#ccc",
    textAlign: "center",
    marginBottom: 4,
  },
  image: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
});
