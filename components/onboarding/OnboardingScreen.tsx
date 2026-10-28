import { StyleSheet, Button, View } from "react-native";

type OnboardingProps = {
  onFinish: () => void;
};

export default function OnboardingScreens({onFinish}: OnboardingProps) {
    return(
        <View style={styles.container}>
            <Button
            title={"Finish Onboarding"}
            onPress={onFinish}
        />
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingVertical: 100,
        backgroundColor: "#FFFFFF"
    }
});
