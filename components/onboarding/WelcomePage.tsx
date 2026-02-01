import { StyleSheet, View, Text, TouchableOpacity, Animated, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Hackastra from "../../assets/onboarding/welcome/hackastra.svg";
import HalfRocket from "../../assets/onboarding/welcome/half-rocket.svg";
import Clouds from "../../assets/onboarding/loading/clouds.svg";
import TinyStars from "../../assets/onboarding/loading/tiny stars.svg";
import StartButton from "../../assets/onboarding/welcome/start-button.svg";

type OnSkipProps = {
  onFinish: () => void;
  onStart: () => void;
  cloudX1: Animated.Value;
  cloudX2: Animated.Value;
  starOpacity: Animated.Value;
};

export default function WelcomePage({ onFinish, onStart, cloudX1, cloudX2, starOpacity }: OnSkipProps) {
    const { width, height } = useWindowDimensions();
    const figmaWidth = 393;
    const figmaHeight = 852;

    const scaleWidth = (size: number) => (width / figmaWidth) * size;
    const scaleHeight = (size: number) => (height / figmaHeight) * size;
    const scaleFontSize = (size: number) => Math.min(scaleWidth(size), scaleHeight(size));

    return (
        <LinearGradient
            colors={['#11104A', '#721984']}
            style={styles.background}
        >
            {/* Background clouds */}
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
                <Clouds width={scaleWidth(669.17)} height={scaleHeight(720.11)} />
            </Animated.View>

            {/* Second cloud layer */}
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
                <Clouds width={scaleWidth(669.17)} height={scaleHeight(720.11)} />
            </Animated.View>

            {/* Stars */}
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
                <TinyStars width={scaleWidth(499.59)} height={scaleHeight(614)} />
            </Animated.View>

            {/* Hackastra logo */}
            <View style={{
                position: 'absolute',
                top: scaleHeight(80),
                left: scaleWidth(54),
            }}>
                <Hackastra
                    width={scaleWidth(289)}
                    height={scaleHeight(125.84)}
                />
            </View>

            {/* Heading text */}
            <View style={{
                position: 'absolute',
                top: scaleHeight(260),
                left: scaleWidth(33),
                width: scaleWidth(327),
            }}>
                <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[
                    styles.headerText,
                    {
                        fontSize: scaleFontSize(28),
                        lineHeight: scaleHeight(32),
                        letterSpacing: scaleWidth(0.14)
                    }
                ]}>
                    WELCOME ABOARD!
                </Text>
                <Text style={[
                    styles.subtitleText,
                    {
                        fontSize: scaleFontSize(16),
                        lineHeight: scaleHeight(22),
                        letterSpacing: scaleWidth(0.28),
                        marginTop: scaleHeight(10),
                        width: scaleWidth(327 * 0.8),
                        alignSelf: 'center'
                    }
                ]}>
                    Start your journey by exploring the features of our app
                </Text>
            </View>

            {/* Buttons */}
            <View style={[
                styles.buttonContainer,
                {
                    position: 'absolute',
                    top: scaleHeight(365),
                    left: scaleWidth(125),
                    gap: height * 0.002
                }
            ]}>
                <TouchableOpacity onPress={onStart}>
                    <StartButton
                        width={scaleWidth(143)}
                        height={scaleHeight(98)}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.skipButton, { paddingVertical: height * 0.01 }]} onPress={onFinish}>
                    <Text style={[styles.skipButtonText, { fontSize: scaleFontSize(18) }]}>Skip</Text>
                </TouchableOpacity>
            </View>

            {/* Half-rocket */}
            <HalfRocket
                style={{
                    position: 'absolute',
                    top: scaleHeight(300),
                    left: scaleWidth(0),
                }}
                width={scaleWidth(figmaWidth)}
                height={scaleHeight(800)}
            />
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
        paddingVertical: "5%",
    },
    topSection: {
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-start",
        paddingHorizontal: "8%",
        marginTop: "20%",
    },
    bottomSection: {
        alignItems: "center",
        justifyContent: "flex-start",
    },
    hackastra: {
        marginBottom: "10%",
    },
    headerText: {
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
        alignItems: "center",
        zIndex: 10,
    },
    skipButton: {},
    skipButtonText: {
        fontFamily: "Tsukimi-Rounded-Bold",
        fontWeight: "700",
        color: "#FFFFFF",
    },
    halfRocket: {
        position: "absolute",
        alignSelf: "center",
    },
});