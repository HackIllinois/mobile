import { StyleSheet, Button, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { layoutStyles } from "../../lib/layout";

type OnboardingProps = {
  onFinish: () => void;
};

export default function OnboardingScreens({ onFinish }: OnboardingProps) {
  return (
    <SafeAreaView style={[layoutStyles.fill, styles.screen]}>
      <ScrollView contentContainerStyle={[layoutStyles.column, styles.content]}>
        <Button title="Finish Onboarding" onPress={onFinish} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#FFFFFF" },
  content: { flexGrow: 1, justifyContent: "center" },
});
