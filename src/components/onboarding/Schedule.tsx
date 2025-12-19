import { useEffect, useRef } from "react";
import { StyleSheet, View, Image, Text, TouchableOpacity, Animated, Easing, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Clouds from "../../../assets/onboarding/loading/clouds.svg";
import TinyStars from "../../../assets/onboarding/loading/tiny stars.svg";
import Navbar from "../../../assets/onboarding/navbar.svg";
import NextButton from "../../../assets/onboarding/next-button.svg";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const CLOUDS_TOP = SCREEN_HEIGHT * 0.07;
const CLOUDS_LEFT = -SCREEN_WIDTH * 0.39;
const STARS_TOP = SCREEN_HEIGHT * 0.04;
const STARS_LEFT = -SCREEN_WIDTH * 0.12;
const NAVBAR_TOP = SCREEN_HEIGHT * 0.10;
const IPHONE_TOP = SCREEN_HEIGHT * 0.21;
const HEADER_TOP = SCREEN_HEIGHT * 0.75;
const SUBTITLE_TOP = SCREEN_HEIGHT * 0.79;
const BUTTON_TOP = SCREEN_HEIGHT * 0.85;

type OnSkipProps = {
  onFinish: () => void;
  onStart: () => void;
};

export default function ScreenThree({ onFinish, onStart }: OnSkipProps) {
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
                    { transform: [{ translateX: cloudX1 }] },
                ]}
            >
                <Clouds width={669.17} height={720.11} />
            </Animated.View>

            <Animated.View
                style={[
                    styles.cloudsContainer,
                    { opacity: 0.5, transform: [{ translateX: cloudX2 }] },
                ]}
            >
                <Clouds width={669.17} height={720.11} />
            </Animated.View>

            <Animated.View
                style={[styles.starsContainer, { opacity: starOpacity }]}
            >
                <TinyStars width={499.59} height={614} />
            </Animated.View>

            <Navbar style={styles.navbar} width={339} height={30} />
            <Image 
                source={require("../../../assets/onboarding/iphone.png")}
                style={styles.iphone}
            />
            <Text style={styles.headerText}>
                SCHEDULE
            </Text>
            <Text style={styles.subtitleText}>
                See the times and details of all of our events
            </Text>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.skipButton} onPress={onFinish}>
                    <Text style={styles.skipButtonText}>SKIP</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onStart}>
                    <NextButton width={120} height={50.68} />
                </TouchableOpacity>
            </View>
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-start",
        paddingHorizontal: 24,
    },
    cloudsContainer: {
        position: "absolute",
        top: CLOUDS_TOP,
        left: CLOUDS_LEFT,
    },
    starsContainer: {
        position: "absolute",
        top: STARS_TOP,
        left: STARS_LEFT,
    },
    navbar: {
        position: "absolute",
        top: NAVBAR_TOP,
        alignSelf: 'center',
    },
    iphone: {
        position: "absolute",
        top: IPHONE_TOP,
        alignSelf: 'center',
    },
    headerText: {
        position: "absolute",
        top: HEADER_TOP,
        width: "100%",
        fontFamily: "Tsukimi-Rounded-Bold",
        fontWeight: "700",
        fontSize: 28,
        lineHeight: 32,
        letterSpacing: 0.14,
        color: "#FFFFFF",
        textAlign: "center",
    },
    subtitleText: {
        position: "absolute",
        top: SUBTITLE_TOP,
        width: "75%",
        alignSelf: "center",
        fontFamily: "Montserrat",
        fontWeight: "500",
        fontSize: 16,
        lineHeight: 22,
        letterSpacing: 1.0,
        textAlign: "center",
        color: "#FFFFFF",
    },
    buttonContainer: {
        position: "absolute",
        top: BUTTON_TOP,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "70%",
        alignSelf: "center",
    },
    skipButton: {
        justifyContent: "center",
        alignItems: "center",
    },
    skipButtonText: {
        fontFamily: "Tsukimi-Rounded-Bold",
        fontSize: 18,
        fontWeight: "700",
        color: "#FFFFFF",
    }
});

