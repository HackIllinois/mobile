import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";

export default function Index() {
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    const checkToken = async () => {
      const jwt = await SecureStore.getItemAsync("jwt");
      setHasToken(!!jwt);
    };
    checkToken();
  }, []);

  if (hasToken === null) return null;

  return hasToken ? <Redirect href="(tabs)/Home" /> : <Redirect href="AuthScreen" />;
}