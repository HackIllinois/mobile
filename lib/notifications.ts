import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

const PROJECT_ID = "a4fc2e31-68df-44c8-aca8-0b64e256e974";

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Failed to get push token: permission not granted");
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: PROJECT_ID,
  });
  const token = tokenData.data;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}

export function setupNotificationListeners() {
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("Notification received:", notification.request.content);
    }
  );

  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log(
        "Notification tapped:",
        response.notification.request.content
      );
    });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}
