import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
// THIS PAGE EXISTS FOR ANDROID AUTH
export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    (async () => {
      const token = (params.token as string) || (params.jwt as string);

      if (token) {
        await SecureStore.setItemAsync("jwt", token);
        router.replace("/(tabs)/Home");
      } else {
        
        router.replace("/AuthScreen"); 
      }
    })();
  }, [params, router]);

  return null;
}
