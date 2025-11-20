import { useEffect, useRef } from "react";
import { View, Animated, Easing, StyleSheet } from "react-native";

type RocketLoadProps = {
    onFinish: () => void;
}

export default function RocketLoad({onFinish}: RocketLoadProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const shade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(shade, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false, 
    }).start();

    // Native-driven shake animation
    const shake = Animated.loop(
        Animated.sequence([
        Animated.timing(rotate, { toValue: 0.25, duration: 50, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -0.25, duration: 50, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 0, duration: 50, useNativeDriver: true }),
        ])
    );

    shake.start(); // start shaking

    // Fly up animation
    Animated.timing(translateY, {
        toValue: -800,
        duration: 1300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
    }).start(() => {
        shake.stop();       
        onFinish();         
    });
  }, []);


  const rotateInterpolate = rotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-10deg", "0deg", "10deg"],
  });

  const colorInterpolate = shade.interpolate({
    inputRange: [0, 1],
    outputRange: ["#cccccc", "#333333"],
  });

  return (
    <View style={styles.background}>
      <Animated.Image
        source={require("../../assets/onboarding/large_rocket.png")}
        style={{
          width: 600,
          height: 600,
          transform: [{ translateY }, { rotate: rotateInterpolate }],
          tintColor: colorInterpolate,
        }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center", 
    paddingHorizontal: 24,
  },
});
