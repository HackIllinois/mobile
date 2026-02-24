import { router } from "expo-router";

export function resetToAuth() {
  if (router.canDismiss()) {
    router.dismissAll();
  }

  router.replace("/AuthScreen"); 
}