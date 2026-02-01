import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, StatusBar, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// CONFIGURATION
const NUM_STARS = 400;
const PARALLAX_SPEED = 0.15; // Speed of the stars (15% of scroll speed)
const STORAGE_KEY = 'HACKILLINOIS_STAR_LAYOUT_V1';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

export default function StarryBackground({ children, scrollY }: { children?: React.ReactNode, scrollY?: Animated.Value }) {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const loadStars = async () => {
      try {
        const savedStars = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedStars) {
          setStars(JSON.parse(savedStars));
        } else {
          const newStars = [...Array(NUM_STARS)].map((_, i) => ({
            id: i,
            x: Math.random() * width,
            y: Math.random() * height, 
            size: Math.random() * 2 + 1,
            opacity: Math.random() * 0.7 + 0.3,
          }));
          setStars(newStars);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newStars));
        }
      } catch (e) {
        console.error("Failed to load stars", e);
      }
    };
    loadStars();
  }, []);
  
  const loopDistance = height / PARALLAX_SPEED;

  const loopedScrollY = scrollY ? Animated.modulo(scrollY, loopDistance) : new Animated.Value(0);

  const translateY = Animated.multiply(loopedScrollY, -PARALLAX_SPEED);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      <LinearGradient
        colors={['#2d0429', '#180d2d', '#281242']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View 
        style={[
          styles.starsContainer, 
          { transform: [{ translateY }] } 
        ]}
      >
        <View style={{ height: height, width: width }}>
          {stars.map((star) => (
            <View
              key={`b1-${star.id}`} 
              style={[
                styles.star,
                { left: star.x, top: star.y, width: star.size, height: star.size, opacity: star.opacity },
              ]}
            />
          ))}
        </View>

        <View style={{ height: height, width: width }}>
          {stars.map((star) => (
            <View
              key={`b2-${star.id}`} 
              style={[
                styles.star,
                { left: star.x, top: star.y, width: star.size, height: star.size, opacity: star.opacity },
              ]}
            />
          ))}
        </View>
      </Animated.View>

      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2f043f',
  },
  starsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  star: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 999,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5, 
    elevation: 5,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});