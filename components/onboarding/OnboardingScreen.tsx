import { useState } from "react";
import { Animated } from "react-native";
import ScreenThree from "./Overview";
import ScreenFour from "./Schedule";
import ScreenFive from "./Scanner";
import ScreenSix from "./PointsShop";
import ScreenSeven from "./Profile";
import ScreenEight from "./Mentorship";
import ScreenNine from "./Duels";

type OnboardingProps = {
  onFinish: () => void;
  cloudX1: Animated.Value;
  cloudX2: Animated.Value;
  starOpacity: Animated.Value;
};

export default function OnboardingScreens({ onFinish, cloudX1, cloudX2, starOpacity }: OnboardingProps) {
    const [currentScreen, setCurrentScreen] = useState(0);

    const onSkip = () => {
        onFinish();
    }

    const onNext = () => {
        setCurrentScreen((prev) => prev + 1);
    }

    const goToScreen = (index: number) => {
        setCurrentScreen(index);
    }

    switch (currentScreen) {
        case 0:
            return <ScreenThree onFinish={onSkip} onStart={onNext} cloudX1={cloudX1} cloudX2={cloudX2} starOpacity={starOpacity} currentScreen={currentScreen} goToScreen={goToScreen} />;
        case 1:
            return <ScreenFour onFinish={onSkip} onStart={onNext} cloudX1={cloudX1} cloudX2={cloudX2} starOpacity={starOpacity} currentScreen={currentScreen} goToScreen={goToScreen} />;
        case 2:
            return <ScreenFive onFinish={onSkip} onStart={onNext} cloudX1={cloudX1} cloudX2={cloudX2} starOpacity={starOpacity} currentScreen={currentScreen} goToScreen={goToScreen} />;
        case 3:
            return <ScreenSix onFinish={onSkip} onStart={onNext} cloudX1={cloudX1} cloudX2={cloudX2} starOpacity={starOpacity} currentScreen={currentScreen} goToScreen={goToScreen} />;
        case 4:
            return <ScreenSeven onFinish={onSkip} onStart={onNext} cloudX1={cloudX1} cloudX2={cloudX2} starOpacity={starOpacity} currentScreen={currentScreen} goToScreen={goToScreen} />;
        case 5:
            return <ScreenEight onFinish={onSkip} onStart={onNext} cloudX1={cloudX1} cloudX2={cloudX2} starOpacity={starOpacity} currentScreen={currentScreen} goToScreen={goToScreen} />;
        case 6:
            return <ScreenNine onFinish={onSkip} onStart={onSkip} cloudX1={cloudX1} cloudX2={cloudX2} starOpacity={starOpacity} currentScreen={currentScreen} goToScreen={goToScreen} />;
        default:
            return <ScreenThree onFinish={onSkip} onStart={onNext} cloudX1={cloudX1} cloudX2={cloudX2} starOpacity={starOpacity} currentScreen={currentScreen} goToScreen={goToScreen} />;
    }
}