import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";

export default function Index() {
  // Go straight to Duel screen for testing
  return <Redirect href="(tabs)/Duel" />;
}