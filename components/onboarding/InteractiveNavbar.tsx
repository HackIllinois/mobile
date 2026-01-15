import React from "react";
import { TouchableOpacity, View, useWindowDimensions } from "react-native";
import Navbar from "../../assets/onboarding/navbar.svg";
import RocketOrbit from "../home/RocketOrbit";
import SmallRocket from "../../assets/onboarding/small-rocket.svg";

type InteractiveNavbarProps = {
    currentScreen: number;
    onPlanetPress: (index: number) => void;
};

const SidewaysRocket = (props: any) => (
    <View style={{ transform: [{ rotate: '270deg' }] }}>
        <SmallRocket {...props} />
    </View>
);

export default function InteractiveNavbar({ currentScreen, onPlanetPress }: InteractiveNavbarProps) {
    const { width } = useWindowDimensions();

    const navbarWidth = width * 0.85;
    const navbarHeight = navbarWidth * 0.0885;

    const planetWidth = navbarWidth / 6;

    const planets = [
        { index: 0, x: planetWidth * 0.5 },
        { index: 1, x: planetWidth * 1.5 },
        { index: 2, x: planetWidth * 2.5 },
        { index: 3, x: planetWidth * 3.5 },
        { index: 4, x: planetWidth * 4.5 },
        { index: 5, x: planetWidth * 5.5 },
    ];

    const currentPlanet = planets[currentScreen];
    const planetSize = planetWidth * 0.8; 

    return (
        <View style={{
            width: navbarWidth,
            height: navbarHeight,
        }}>
            {/* Navbar */}
            <Navbar
                width={navbarWidth}
                height={navbarHeight}
            />

            {/* Touchable planet overlays */}
            {planets.map((planet) => (
                <TouchableOpacity
                    key={planet.index}
                    onPress={() => onPlanetPress(planet.index)}
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

            {/* Rocket orbiting the current planet */}
            {currentPlanet && (
                <RocketOrbit
                    centerX={currentPlanet.x - planetWidth * 0.30}
                    centerY={navbarHeight / 2}
                    orbitRadius={planetSize * 0.4}
                    size={planetWidth * 0.35}
                    periodMs={5000}
                    startAngleDeg={0}
                    clockwise={false}
                    RocketComponent={SidewaysRocket}
                />
            )}
        </View>
    );
}