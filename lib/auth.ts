import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { queryClient } from "../lib/queryClient";

let isLoggingOut = false;

export async function logoutAndRedirect() {
  if (isLoggingOut) return;
  isLoggingOut = true;

  try {
    await SecureStore.deleteItemAsync("jwt");
    await SecureStore.deleteItemAsync("isGuest");
    await SecureStore.deleteItemAsync("userRoles");

    queryClient.clear();
  } finally {
    console.log("[auth] logoutAndRedirect triggered");

    router.replace("/AuthScreen");
    isLoggingOut = false;
  }
}
