import { StyleSheet, View, Image, Text, TouchableOpacity, Animated, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Clouds from "../../assets/onboarding/loading/clouds.svg";
import TinyStars from "../../assets/onboarding/loading/tiny stars.svg";
import NextButton from "../../assets/onboarding/next-button.svg";
import InteractiveNavbar from "./InteractiveNavbar";

type OnSkipProps = {
  onFinish: () => void;
  onStart: () => void;
  cloudX1: Animated.Value;
  cloudX2: Animated.Value;
  starOpacity: Animated.Value;
  currentScreen: number;
  goToScreen: (index: number) => void;
};

import { MAX_APP_WIDTH } from "../../lib/layout";

export default function ScreenThree({ onFinish, onStart, cloudX1, cloudX2, starOpacity, currentScreen, goToScreen }: OnSkipProps) {
    const { width: windowWidth, height } = useWindowDimensions();
    const width = Math.min(windowWidth, MAX_APP_WIDTH);

    const figmaWidth = 393;
    const figmaHeight = 852;
    const scaleWidth = (size: number) => (width / figmaWidth) * size;
    const scaleHeight = (size: number) => (height / figmaHeight) * size;
    const scaleFontSize = (size: number) => Math.min(scaleWidth(size), scaleHeight(size));

    const CLOUDS_WIDTH = scaleWidth(669.17);
    const CLOUDS_HEIGHT = scaleHeight(720.11);
    const STARS_WIDTH = scaleWidth(499.59);
    const STARS_HEIGHT = scaleHeight(614);
    const IPHONE_WIDTH = scaleWidth(206);
    const IPHONE_HEIGHT = scaleHeight(419.03875732421875);
    const IPHONE_TOP = scaleHeight(175);
    const IPHONE_LEFT = scaleWidth(94);
    const HEADER_WIDTH = width - scaleWidth(40);
    const HEADER_TOP = scaleHeight(632);
    const HEADER_LEFT = scaleWidth(20);
    const NEXT_BUTTON_WIDTH = scaleWidth(135);
    const NEXT_BUTTON_HEIGHT = scaleHeight(44);
    const NAVBAR_HEIGHT = scaleHeight(35);

    return (
        <LinearGradient
            colors={['#11104A', '#721984']}
            style={styles.background}
        >
            <Animated.View
                style={[
                    styles.cloudsContainer,
                    {
                        top: height * 0.07,
                        left: -width * 0.39,
                        transform: [{ translateX: cloudX1 }]
                    },
                ]}
            >
                <Clouds width={CLOUDS_WIDTH} height={CLOUDS_HEIGHT} />
            </Animated.View>

            <Animated.View
                style={[
                    styles.cloudsContainer,
                    {
                        top: height * 0.07,
                        left: -width * 0.39,
                        opacity: 0.5,
                        transform: [{ translateX: cloudX2 }]
                    },
                ]}
            >
                <Clouds width={CLOUDS_WIDTH} height={CLOUDS_HEIGHT} />
            </Animated.View>

            <Animated.View
                style={[
                    styles.starsContainer,
                    {
                        top: height * 0.04,
                        left: -width * 0.12,
                        opacity: starOpacity
                    }
                ]}
            >
                <TinyStars width={STARS_WIDTH} height={STARS_HEIGHT} />
            </Animated.View>

            {/* Navbar */}
            <View style={{
                position: 'absolute',
                top: scaleHeight(82),
                width: '100%',
                alignItems: 'center',
            }}>
                <InteractiveNavbar currentScreen={currentScreen} onPlanetPress={goToScreen} />
            </View>

            {/* Screenshot inside iPhone */}
            <Image
                source={require("../../assets/onboarding/Points-Shop.png")}
                style={{
                    position: 'absolute',
                    top: IPHONE_TOP + scaleHeight(8),
                    left: IPHONE_LEFT + scaleWidth(7),
                    width: IPHONE_WIDTH - scaleWidth(14),
                    height: IPHONE_HEIGHT - scaleHeight(16),
                    borderRadius: scaleWidth(20),
                }}
                resizeMode="cover"
            />

            {/* iPhone */}
            <Image
                source={require("../../assets/onboarding/iphone.png")}
                style={{
                    position: 'absolute',
                    top: IPHONE_TOP,
                    left: IPHONE_LEFT,
                    width: IPHONE_WIDTH,
                    height: IPHONE_HEIGHT,
                }}
                resizeMode="contain"
            />

            {/* Header */}
            <View style={{
                position: 'absolute',
                top: HEADER_TOP,
                left: HEADER_LEFT,
                width: HEADER_WIDTH,
            }}>
                <Text style={[styles.headerText, {
                    fontSize: scaleFontSize(28),
                    lineHeight: scaleHeight(32),
                    letterSpacing: scaleWidth(0.14),
                }]}>POINT SHOP</Text>
                <Text
                    adjustsFontSizeToFit
                    numberOfLines={2}
                    style={[styles.subtitleText, {
                    fontSize: scaleFontSize(16),
                    lineHeight: scaleHeight(22),
                    letterSpacing: scaleWidth(1.0),
                    marginTop: scaleHeight(10),
                    alignSelf: 'center',
                    width: '90%',
                }]}>
                    View the available prizes you can redeem using your earned points!
                </Text>
            </View>

            {/* Skip button */}
            <TouchableOpacity
                style={{
                    position: 'absolute',
                    bottom: scaleHeight(70),
                    left: width * 0.5 - scaleWidth(125),
                    height: scaleHeight(44),
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
                onPress={onFinish}
            >
                <Text style={[styles.skipButtonText, { fontSize: scaleFontSize(18) }]}>SKIP</Text>
            </TouchableOpacity>

            {/* Next button */}
            <TouchableOpacity
                onPress={onStart}
                style={{
                    position: 'absolute',
                    bottom: scaleHeight(70),
                    left: width * 0.5 + scaleWidth(27.5),
                }}
            >
                <NextButton
                    width={NEXT_BUTTON_WIDTH}
                    height={NEXT_BUTTON_HEIGHT}
                />
            </TouchableOpacity>
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    cloudsContainer: {
        position: "absolute",
    },
    starsContainer: {
        position: "absolute",
    },
    contentContainer: {
        flex: 1,
        justifyContent: "space-between",
        paddingTop: "10%",
        paddingBottom: "10%",
    },
    topSection: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    bottomSection: {
        alignItems: "center",
    },
    navbar: {},
    iphone: {
        aspectRatio: 1,
    },
    headerText: {
        width: "100%",
        fontFamily: "Tsukimi-Rounded-Bold",
        fontWeight: "700",
        color: "#FFFFFF",
        textAlign: "center",
    },
    subtitleText: {
        fontFamily: "Montserrat",
        fontWeight: "500",
        textAlign: "center",
        color: "#FFFFFF",
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "70%",
    },
    skipButton: {
        justifyContent: "center",
        alignItems: "center",
    },
    skipButtonText: {
        fontFamily: "Tsukimi-Rounded-Bold",
        fontWeight: "700",
        color: "#FFFFFF",
    }
});
