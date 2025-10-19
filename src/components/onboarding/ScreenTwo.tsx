import { StyleSheet, View, Image, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

type OnSkipProps = {
  onFinish: () => void;
  onStart: () => void; 
};

export default function ScreenTwo({ onFinish, onStart }: OnSkipProps) {
    const router = useRouter();

    const onSkip = () => {
        onFinish();
        router.replace("(tabs)/Home");
    }

    return (
        <View style={styles.background}>
            <Text style={styles.headerText}>Welcome Aboard</Text>
            <Text style={styles.subtitleText}>Start your journey by exploring the features of our app</Text>
            <Image source={require('../../../assets/onboarding/large_rocket_main.png')} style={styles.rocket} />
            <TouchableOpacity style={styles.startButton} onPress={onStart}>
                <Text style={styles.startButtonText}>Start</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center", 
        paddingHorizontal: 24,
    },
    headerText: {
        fontFamily: "Montserrat",
        fontSize: 40,
        textAlign: "center",
        fontWeight: "600",
        color: "#313332",
        letterSpacing: 0.1,
        marginBottom: 12,
    },
    subtitleText: {
        textAlign: "center",
        fontSize: 18,
        fontFamily: "Montserrat",
        letterSpacing: 1.2,
        marginBottom: 30,
        lineHeight: 24,
    },
    rocket: {
        width: 270,
        height: 270,
    },
    startButton: {
        marginTop: 25,
        width: 120,
        height: 50.68,
        borderRadius:37.08,
        backgroundColor: "#7A807D",
    },
    startButtonText: {
        marginTop: 6,
        fontFamily: "Montserrat",
        textAlign: "center",
        fontSize: 25,
        color: "#FFFFFF",
        fontWeight: "100"
    },
    skipButton: {
        marginTop: 10,
    },
    skipButtonText: {
        marginTop: 6,
        fontFamily: "Montserrat",
        fontSize: 18
    }
});