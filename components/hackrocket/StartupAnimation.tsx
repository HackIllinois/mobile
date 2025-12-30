import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import LottieView from 'lottie-react-native';

export default function StartupAnimation() {
  const animation = useRef<LottieView>(null);
  const [showHome, setShowHome] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current; // controls fade-out

  useEffect(() => {
    // always reset and play from start
    animation.current?.reset();
    animation.current?.play();

    // fade out animation then show home
    const timeout = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => setShowHome(true));
    }, 2500); // match to animation length

    return () => clearTimeout(timeout);
  }, []);

  if (showHome) {
    // --- mock home screen for now ---
    return (
      <Animated.View
        style={[styles.homeContainer, { opacity: fadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        }) }]}
      >
        <Text style={styles.homeText}>Home</Text>
      </Animated.View>
    );
  }

  // --- animation screen ---
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LottieView
        ref={animation}
        source={require('../../assets/animations/HackRocket.json')}
        autoPlay
        loop={false}
        style={styles.animation}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  animation: {
    width: 250,
    height: 250,
  },
  homeContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
});
