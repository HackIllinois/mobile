import { useQuery } from "@tanstack/react-query";
import { Image } from "react-native";
import * as SecureStore from "expo-secure-store";
import api from "../api";

let cachedRoles: string[] | null = null;

export function setCachedRoles(roles: string[]) {
  cachedRoles = roles;
}

export function clearCachedRoles() {
  cachedRoles = null;
}

export async function loadCachedRoles(): Promise<string[] | null> {
  if (cachedRoles) return cachedRoles;
  const rolesString = await SecureStore.getItemAsync("userRoles");
  if (rolesString) {
    cachedRoles = JSON.parse(rolesString);
  }
  return cachedRoles;
}

export function hasNonProfileRole(): boolean {
  if (!cachedRoles) return false;
  return cachedRoles.includes("STAFF") || cachedRoles.includes("GUEST");
}

export function getNonProfileRoleLabel(): string | null {
  if (!cachedRoles) return null;
  if (cachedRoles.includes("GUEST")) return "GUEST";
  if (cachedRoles.includes("STAFF")) return "STAFF";
  return null;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  discordTag: string;
  avatarUrl: string | null;
  avatarId?: string | null;
  points: number;
  pointsAccumulated: number;
  foodWave: number;
  track?: string;
  ranking?: number;
}

interface RankingResponse {
  ranking: number;
}

interface AdmissionRsvpResponse {
  userId: string;
  status: string;
  admittedPro: boolean;
  response: string;
  emailSent: boolean;
  reimbursementValue: number;
}

export async function fetchProfile(): Promise<UserProfile> {
  const [profileRes, rankingRes, rsvpRes] = await Promise.allSettled([
    api.get<UserProfile>("profile"),
    api.get<RankingResponse>("profile/ranking"),
    api.get<AdmissionRsvpResponse>("admission/rsvp"),
  ]);

  if (profileRes.status === "rejected") {
    throw profileRes.reason;
  }

  const profile = (profileRes.value as any).data as UserProfile;

  if (rankingRes.status === "fulfilled") {
    profile.ranking = (rankingRes.value as any).data.ranking;
  }

  if (rsvpRes.status === "fulfilled") {
    const rsvp = (rsvpRes.value as any).data as AdmissionRsvpResponse;
    profile.track = rsvp.admittedPro ? "PRO" : "GENERAL";
  }

  return profile;
}

export function prefetchAvatarImage(avatarUrl: string | null) {
  if (avatarUrl) {
    Image.prefetch(avatarUrl);
  }
}

export function useProfile(enabled = true) {
  const { data, isLoading, error, refetch } = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled,
  });

  return {
    profile: data ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
