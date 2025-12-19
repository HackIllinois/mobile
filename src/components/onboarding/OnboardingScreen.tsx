import { useState } from "react";
import { StyleSheet } from "react-native";
import ScreenThree from "./Overview";
import ScreenFour from "./Schedule";
import ScreenFive from "./Scanner";
import ScreenSix from "./PointsShop";
import ScreenSeven from "./Profile";

type OnboardingProps = {
  onFinish: () => void; 
};

export default function OnboardingScreens({ onFinish }: OnboardingProps) {
    const [currentScreen, setCurrentScreen] = useState(0);

    const onSkip = () => {
        onFinish();
    }

    const onNext = () => {
        setCurrentScreen((prev) => prev + 1);
    }

    switch (currentScreen) {
        case 0:
            return <ScreenThree onFinish={onSkip} onStart={onNext} />;
        case 1:
            return <ScreenFour onFinish={onSkip} onStart={onNext} />;
        case 2:
            return <ScreenFive onFinish={onSkip} onStart={onNext} />;
        case 3:
            return <ScreenSix onFinish={onSkip} onStart={onNext} />;
        case 4:
            return <ScreenSeven onFinish={onSkip} onStart={onSkip} />;
        default:
            return <ScreenThree onFinish={onSkip} onStart={onNext} />;
    }
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
        borderRadius: 37.08,
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