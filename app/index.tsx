import { Redirect } from "expo-router";

export default function Index() {
  // When the app starts, go straight into the tab navigator
  return <Redirect href="(tabs)/Home" />;
}