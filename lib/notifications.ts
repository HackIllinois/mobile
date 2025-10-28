import { AxiosResponse } from "axios";
import api from "./api";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

// configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// registers the device for push notifications and returns the expo push token
export async function registerForPushNotificationsAsync(): Promise<
  string | undefined
> {
  // Set up Android notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }
  if (!Device.isDevice) {
    console.error("Must use physical device for push notifications");
    return;
  }
  // getting notifications permissions from user
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    console.error(
      "Permission not granted to get push token for push notification!"
    );
    return;
  }
  // get project id from config
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;
  if (!projectId) {
    console.error("Project ID not found");
    return;
  }

  // getting the token
  try {
    const pushTokenString = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
    console.log("Expo Push Token:", pushTokenString);
    return pushTokenString;
  } catch (e: unknown) {
    console.error("Error getting push token:", e);
    throw new Error(`${e}`);
  }
}

/**
 * sends the expo push token to adonix
 */
export const getAndSendExpoPushToken = async (): Promise<string | null> => {
  const token = await registerForPushNotificationsAsync();
  if (token) {
    const response: AxiosResponse = await api.post("/notification", {
      deviceToken: token,
    });

    if (response.data["success"] === false) {
      console.error(
        "There was a server-side error with sending the Expo push token"
      );
    }

    return token;
  }
  return null;
};

/**
 * sets up notification listeners for when notifications are received and interacted with
 * returns cleanup function to remove listeners
 */
export function setupNotificationListeners(
  onNotificationReceived: (notification: Notifications.Notification) => void,
  onNotificationResponse: (response: Notifications.NotificationResponse) => void
): () => void {
  // for when a notification is received while the app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      onNotificationReceived(notification);
    }
  );

  // for when a user taps on or interacts with a notification
  const responseListener =
    Notifications.addNotificationResponseReceivedListener((response) => {
      onNotificationResponse(response);
    });

  // cleanup functions
  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}
