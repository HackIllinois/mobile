import React from "react";
import { TouchableOpacity, View, useWindowDimensions } from "react-native";
import Navbar1 from "../../assets/onboarding/navbar1.svg";
import Navbar2 from "../../assets/onboarding/navbar2.svg";
import Navbar3 from "../../assets/onboarding/navbar3.svg";
import Navbar4 from "../../assets/onboarding/navbar4.svg";
import Navbar5 from "../../assets/onboarding/navbar5.svg";
import Navbar6 from "../../assets/onboarding/navbar6.svg";
import Navbar7 from "../../assets/onboarding/navbar7.svg";

type InteractiveNavbarProps = {
    currentScreen: number;
    onPlanetPress: (index: number) => void;
};

const navbarConfigs = [
    { component: Navbar1, heightRatio: 0.15 },
    { component: Navbar2, heightRatio: 0.15 },
    { component: Navbar3, heightRatio: 0.15 },
    { component: Navbar4, heightRatio: 0.15 },
    { component: Navbar5, heightRatio: 0.15 },
    { component: Navbar6, heightRatio: 0.15 },
    { component: Navbar7, heightRatio: 0.15 },
];

const getScreenOffset = (currentScreen: number): number => {
    if (currentScreen <= 1) return 0;
    if (currentScreen >= 5) return 4;
    return currentScreen - 1;
};

export default function InteractiveNavbar({ currentScreen, onPlanetPress }: InteractiveNavbarProps) {
    const { width } = useWindowDimensions();

    const navbarWidth = width * 0.85;
    const currentConfig = navbarConfigs[currentScreen] || navbarConfigs[0];
    const navbarHeight = navbarWidth * currentConfig.heightRatio;

    const planetWidth = navbarWidth / 3;

    const screenOffset = getScreenOffset(currentScreen);

    const planets = [
        { position: 0, screenIndex: screenOffset, x: planetWidth * 0.5 },
        { position: 1, screenIndex: screenOffset + 1, x: planetWidth * 1.5 },
        { position: 2, screenIndex: screenOffset + 2, x: planetWidth * 2.5 },
    ];

    const NavbarComponent = currentConfig.component;

    return (
        <View style={{
            width: navbarWidth,
            height: navbarHeight,
        }}>
            {/* Navbar */}
            <NavbarComponent
                width={navbarWidth}
                height={navbarHeight}
            />

            {/* Touchable planet overlays */}
            {planets.map((planet) => (
                <TouchableOpacity
                    key={planet.position}
                    onPress={() => onPlanetPress(planet.screenIndex)}
                    style={{
                        position: 'absolute',
                        left: planet.x - planetWidth / 2,
                        top: 0,
                        width: planetWidth,
                        height: navbarHeight,
                    }}
                    activeOpacity={0.7}
                />
            ))}
        </View>
    );
}
