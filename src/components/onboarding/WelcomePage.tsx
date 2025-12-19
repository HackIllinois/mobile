import { useEffect, useRef } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Animated, Easing, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Hackastra from "../../../assets/onboarding/welcome/hackastra.svg";
import HalfRocket from "../../../assets/onboarding/welcome/half-rocket.svg";
import Clouds from "../../../assets/onboarding/loading/clouds.svg";
import TinyStars from "../../../assets/onboarding/loading/tiny stars.svg";
import StartButton from "../../../assets/onboarding/welcome/start-button.svg";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const ROCKET_WIDTH = Math.min(SCREEN_WIDTH, 500); 
const ROCKET_HEIGHT = (ROCKET_WIDTH / 250) * 310; 

const CLOUDS_TOP = SCREEN_HEIGHT * 0.07; 
const CLOUDS_LEFT = -SCREEN_WIDTH * 0.39; 
const STARS_TOP = SCREEN_HEIGHT * 0.04; 
const STARS_LEFT = -SCREEN_WIDTH * 0.12; 
const HACKASTRA_TOP = SCREEN_HEIGHT * 0.13; 
const HEADER_TOP = SCREEN_HEIGHT * 0.36; 
const SUBTITLE_TOP = SCREEN_HEIGHT * 0.40; 
const BUTTON_TOP = SCREEN_HEIGHT * 0.49; 

type OnSkipProps = {
  onFinish: () => void;
  onStart: () => void; 
};

export default function WelcomePage({ onFinish, onStart }: OnSkipProps) {
    const router = useRouter();
    const cloudX1 = useRef(new Animated.Value(0)).current;
    const cloudX2 = useRef(new Animated.Value(0)).current;
    const starOpacity = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        // Cloud animation
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

        // Star twinkling animation
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

    const onSkip = () => {
        onFinish();
        router.replace("(tabs)/Home");
    }

    return (
        <LinearGradient
            colors={['#11104A', '#721984']}
            style={styles.background}
        >
            {/* Background clouds */}
            <Animated.View
                style={[
                    styles.cloudsContainer,
                    { transform: [{ translateX: cloudX1 }] },
                ]}
            >
                <Clouds width={669.17} height={720.11} />
            </Animated.View>

            {/* Second cloud layer */}
            <Animated.View
                style={[
                    styles.cloudsContainer,
                    { opacity: 0.5, transform: [{ translateX: cloudX2 }] },
                ]}
            >
                <Clouds width={669.17} height={720.11} />
            </Animated.View>

            {/* Stars */}
            <Animated.View
                style={[styles.starsContainer, { opacity: starOpacity }]}
            >
                <TinyStars width={499.59} height={614} />
            </Animated.View>

            {/* Half-rocket aligned to bottom */}
            <HalfRocket style={styles.halfRocket} width={ROCKET_WIDTH} height={ROCKET_HEIGHT} />

            <Hackastra style={styles.hackastra} width={289} height={125.84} />
            <Text style={styles.headerText}>WELCOME ABOARD!</Text>
            <Text style={styles.subtitleText}>Start your journey by exploring the features of our app</Text>
            <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={onStart}>
                    <StartButton width={120} height={50.68} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                    <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
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
    halfRocket: {
        position: "absolute",
        bottom: -100,
        left: (SCREEN_WIDTH - ROCKET_WIDTH) / 2,
        width: ROCKET_WIDTH,
        height: ROCKET_HEIGHT,
        opacity: 1,
    },
    hackastra: {
        position: "absolute",
        top: HACKASTRA_TOP,
        alignSelf: "center",
        width: 289,
        height: 125.84,
    },
    headerText: {
        position: "absolute",
        top: HEADER_TOP,
        width: "84%",
        alignSelf: "center",
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
        width: "60%",
        alignSelf: "center",
        fontFamily: "Montserrat",
        fontWeight: "500",
        fontSize: 16,
        lineHeight: 22,
        letterSpacing: 0.28,
        textAlign: "center",
        color: "#FFFFFF",
    },
    buttonContainer: {
        position: "absolute",
        top: BUTTON_TOP,
        alignSelf: "center",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
    },
    skipButton: {
    },
    skipButtonText: {
        fontFamily: "Tsukimi-Rounded-Bold",
        fontSize: 18,
        fontWeight: "700",
        color: "#FFFFFF",
    },
});