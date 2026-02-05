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
  teamStatus?: string;
  ranking?: number;
}

async function fetchProfile(): Promise<UserProfile> {
  const response: any = await api.get<UserProfile>("profile");
  return response.data;
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
