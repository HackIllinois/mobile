import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOX_WIDTH_PERCENT = 0.82;

interface CutCornerCardProps {
  children: React.ReactNode;
  style?: any;
}

export const CutCornerCard: React.FC<CutCornerCardProps> = ({ children, style }) => {
  return (
    <View style={[styles.statsCard, style]}>
      <Svg
        height="100%"
        width="100%"
        style={{ position: 'absolute', top: 0, left: 0 }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <Path
          d="M 10.5 10 L 38.5 10 L 48.5 18.5 L 95 18.5 L 95 97.5 L 19 97.5 L 10.5 89 L 10.5 18.5 Z"
          fill="#B2B2B2"
        />
        <Path
          d="M 0 0 L 28 0 L 38 8.5 L 84.5 8.5 L 84.5 88.5 L 8.5 88.5 L 0 80 L 0 8.5 Z"
          fill="#D9D9D9"
        />
      </Svg>
      <View style={styles.statsCardContent}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsCard: {
    backgroundColor: 'transparent',
    borderRadius: 2,
    marginTop: 100,
    marginLeft: '11%',
    overflow: 'hidden',
    height: SCREEN_WIDTH * BOX_WIDTH_PERCENT * (253 / 309),
    width: SCREEN_WIDTH * BOX_WIDTH_PERCENT,
    alignSelf: 'flex-start',
    position: 'relative',
  },
  statsCardContent: {
    position: 'relative',
    zIndex: 1,
    paddingTop: SCREEN_WIDTH * 0.04,
    paddingBottom: SCREEN_WIDTH * 0.04,
    paddingLeft: SCREEN_WIDTH * 0.06,
    paddingRight: SCREEN_WIDTH * 0.04,
    maxWidth: '84.5%',
    maxHeight: '88.5%',
  },
});
