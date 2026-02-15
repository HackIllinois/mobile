import { useQuery } from "@tanstack/react-query";
import api from "../api";

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

async function fetchProfile(): Promise<UserProfile> {
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

export function useProfile() {
  const { data, isLoading, error, refetch } = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  return {
    profile: data ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
