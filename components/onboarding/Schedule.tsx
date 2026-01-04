import { useEffect, useRef } from "react";
import { StyleSheet, View, Image, Text, TouchableOpacity, Animated, Easing, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Clouds from "../../assets/onboarding/loading/clouds.svg";
import TinyStars from "../../assets/onboarding/loading/tiny stars.svg";
import Navbar from "../../assets/onboarding/navbar.svg";
import NextButton from "../../assets/onboarding/next-button.svg";

type OnSkipProps = {
  onFinish: () => void;
  onStart: () => void;
};

export default function ScreenThree({ onFinish, onStart }: OnSkipProps) {
    const { width, height } = useWindowDimensions();

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
    const HEADER_WIDTH = scaleWidth(335);
    const HEADER_TOP = scaleHeight(632);
    const HEADER_LEFT = scaleWidth(29);
    const SKIP_BUTTON_TOP = scaleHeight(762);
    const SKIP_BUTTON_LEFT = scaleWidth(94);
    const NEXT_BUTTON_WIDTH = scaleWidth(95);
    const NEXT_BUTTON_HEIGHT = scaleHeight(31.22377586364746);
    const NEXT_BUTTON_TOP = scaleHeight(758);
    const NEXT_BUTTON_LEFT = scaleWidth(250);

    const cloudX1 = useRef(new Animated.Value(0)).current;
    const cloudX2 = useRef(new Animated.Value(0)).current;
    const starOpacity = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(cloudX1, {
                    toValue: 30,
                    duration: 8000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(cloudX1, {
                    toValue: 0,
                    duration: 8000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(cloudX2, {
                    toValue: 40,
                    duration: 10000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(cloudX2, {
                    toValue: 0,
                    duration: 10000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(starOpacity, {
                    toValue: 0.4,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(starOpacity, {
                    toValue: 0.8,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

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
                top: scaleHeight(80),
                left: width * 0.075,
            }}>
                <Navbar
                    width={width * 0.85}
                    height={(width * 0.85) * 0.0885}
                />
            </View>

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

            {/* Header text */}
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
                }]}>SCHEDULE</Text>
                <Text style={[styles.subtitleText, {
                    fontSize: scaleFontSize(16),
                    lineHeight: scaleHeight(22),
                    letterSpacing: scaleWidth(1.0),
                    marginTop: scaleHeight(10),
                    alignSelf: 'center',
                }]}>
                    See the times and details of all of our events
                </Text>
            </View>

            {/* Skip button */}
            <TouchableOpacity
                style={{
                    position: 'absolute',
                    top: SKIP_BUTTON_TOP,
                    left: SKIP_BUTTON_LEFT,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
                onPress={onFinish}
            >
                <Text style={[styles.skipButtonText, { fontSize: scaleFontSize(18) }]}>SKIP</Text>
            </TouchableOpacity>

            {/* Next button */}
            <TouchableOpacity
                style={{
                    position: 'absolute',
                    top: NEXT_BUTTON_TOP,
                    left: NEXT_BUTTON_LEFT,
                }}
                onPress={onStart}
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
        width: "75%",
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
