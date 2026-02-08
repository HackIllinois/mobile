import React, { useRef, useEffect } from "react";
import { TouchableOpacity, View, ScrollView, useWindowDimensions } from "react-native";
import Navbar1 from "../../assets/onboarding/navbar1-full.svg";
import Navbar2 from "../../assets/onboarding/navbar2-full.svg";
import Navbar3 from "../../assets/onboarding/navbar3-full.svg";
import Navbar4 from "../../assets/onboarding/navbar4-full.svg";
import Navbar5 from "../../assets/onboarding/navbar5-full.svg";
import Navbar6 from "../../assets/onboarding/navbar6-full.svg";
import Navbar7 from "../../assets/onboarding/navbar7-full.svg";

type InteractiveNavbarProps = {
    currentScreen: number;
    onPlanetPress: (index: number) => void;
};

const navbarComponents = [Navbar1, Navbar2, Navbar3, Navbar4, Navbar5, Navbar6, Navbar7];

const TOTAL_PLANETS = 7;
const VISIBLE_PLANETS = 4; // Show 4 planets at a time
const FULL_SVG_WIDTH = 859;
const FULL_SVG_HEIGHT = 56; // All navbar SVGs now use 859x56

import { MAX_APP_WIDTH } from "../../lib/layout";

export default function InteractiveNavbar({ currentScreen, onPlanetPress }: InteractiveNavbarProps) {
    const { width: windowWidth } = useWindowDimensions();
    const width = Math.min(windowWidth, MAX_APP_WIDTH);
    const scrollViewRef = useRef<ScrollView>(null);
    const prevScreenRef = useRef<number>(currentScreen);

    // Viewport width (spans entire screen, shows 3 planets at a time)
    const viewportWidth = width;

    // Full navbar width scaled proportionally
    const fullNavbarWidth = viewportWidth * (TOTAL_PLANETS / VISIBLE_PLANETS);
    const navbarHeight = fullNavbarWidth * (FULL_SVG_HEIGHT / FULL_SVG_WIDTH);

    // Width of each planet section
    const planetWidth = fullNavbarWidth / TOTAL_PLANETS;

    // Edge padding to push first planet right and last planet left
    const edgePadding = planetWidth * 0.8;

    // Calculate scroll position to center the current screen's planet
    const getScrollOffset = (screen: number): number => {
        // Account for edge padding in planet center calculation
        const planetCenter = edgePadding + planetWidth * screen + planetWidth / 2;
        const scrollOffset = planetCenter - viewportWidth / 2;

        // Clamp to valid scroll range
        const totalContentWidth = fullNavbarWidth + edgePadding * 2;
        const maxScroll = totalContentWidth - viewportWidth;
        return Math.max(0, Math.min(scrollOffset, maxScroll));
    };

    // Auto-scroll when currentScreen changes
    useEffect(() => {
        const prevOffset = getScrollOffset(prevScreenRef.current);
        const newOffset = getScrollOffset(currentScreen);

        // First, jump to previous position (in case ScrollView reset due to navbar change)
        scrollViewRef.current?.scrollTo({ x: prevOffset, animated: false });

        // Then animate to new position
        setTimeout(() => {
            scrollViewRef.current?.scrollTo({ x: newOffset, animated: true });
        }, 10);

        prevScreenRef.current = currentScreen;
    }, [currentScreen]);

    // Total content width including edge padding
    const totalContentWidth = fullNavbarWidth + edgePadding * 2;

    // Create touch targets for all 7 planets (offset by edge padding)
    const planets = Array.from({ length: TOTAL_PLANETS }, (_, i) => ({
        screenIndex: i,
        x: edgePadding + planetWidth * i,
    }));

    return (
        <View style={{ width: viewportWidth, height: navbarHeight }}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ width: totalContentWidth, height: navbarHeight }}
            >
                {/* Navbar SVG - offset by edge padding */}
                <View style={{ position: 'absolute', left: edgePadding }}>
                    {React.createElement(navbarComponents[currentScreen] || navbarComponents[0], {
                        width: fullNavbarWidth,
                        height: navbarHeight,
                    })}
                </View>

                {/* Touchable planet overlays */}
                {planets.map((planet) => (
                    <TouchableOpacity
                        key={planet.screenIndex}
                        onPress={() => onPlanetPress(planet.screenIndex)}
                        style={{
                            position: 'absolute',
                            left: planet.x,
                            top: 0,
                            width: planetWidth,
                            height: navbarHeight,
                        }}
                        activeOpacity={0.7}
                    />
                ))}
            </ScrollView>
        </View>
    );
}
