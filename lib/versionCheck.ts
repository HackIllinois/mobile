import { Platform } from "react-native";
import Constants from "expo-constants";
import VersionCheck from "react-native-version-check";
import api from "../api";

export type VersionCheckResult = {
  updateRequired: boolean;
};

/**
 * Returns the current app version (Expo/React Native).
 */
function getCurrentVersion(): string {
  try {
    const fromVersionCheck = VersionCheck.getCurrentVersion?.();
    if (fromVersionCheck && typeof fromVersionCheck === "string") {
      return fromVersionCheck;
    }
  } catch {
    // ignore
  }
  const fromExpo = Constants.expoConfig?.version ?? Constants.manifest?.version;
  if (fromExpo && typeof fromExpo === "string") {
    return fromExpo;
  }
  return "0.0.0";
}

/**
 * Fetches the required minimum version from the API for the current platform.
 */
async function fetchRequiredVersion(): Promise<string | null> {
  const path = Platform.OS === "ios" ? "/version/ios" : "/version/android";
  try {
    const { data } = await api.axiosInstance.get<{ version?: string; requiredVersion?: string }>(path, {
      timeout: 8000,
    });
    const version =
      (data && (typeof data === "object" && ("version" in data) ? data.version : data?.requiredVersion)) ??
      (typeof data === "string" ? data : null);
    return version && typeof version === "string" ? version : null;
  } catch {
    return null;
  }
}

/**
 * Simple semver-like comparison: returns true if a < b.
 * Handles "2026.0.3" style versions.
 */
function isVersionLessThan(a: string, b: string): boolean {
  const parse = (v: string) =>
    v
      .split(".")
      .map((n) => parseInt(n, 10) || 0)
      .slice(0, 3);

  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na < nb) return true;
    if (na > nb) return false;
  }
  return false;
}

/** Store URLs for the app */
const STORE_URLS = {
  android: "https://play.google.com/store/apps/details?id=org.hackillinois.android.release",
  ios: "https://apps.apple.com/app/id1451755268", // HackIllinois app/id[HACKILLINOIS_APP_ID]
} as const;

/**
 * Returns the store URL for the current platform (App Store or Google Play).
 */
export function getStoreUrl(): string {
  return Platform.OS === "android" ? STORE_URLS.android : STORE_URLS.ios;
}

/**
 * Runs the full version check: fetches required version, compares with current,
 * and returns whether an update is required.
 */
export async function checkVersion(): Promise<VersionCheckResult> {
  const current = getCurrentVersion();
  const required = await fetchRequiredVersion();

  if (required == null) {
    return { updateRequired: false };
  }

  const updateRequired = isVersionLessThan(current, required);

  return { updateRequired };
}
