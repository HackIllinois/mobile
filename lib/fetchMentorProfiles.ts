import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import api from "../api";
import { MentorProfile } from "../types";

async function fetchMentorProfiles(): Promise<MentorProfile[] | null> {
  const token = await SecureStore.getItemAsync("jwt");

  if (!token) {
    return null;
  }

  try {
    const response: any = await api.get<MentorProfile[]>("/mentor/info/");
    const data = response?.data;

    if (Array.isArray(data)) return data as MentorProfile[];
    if (data && Array.isArray(data.data)) return data.data as MentorProfile[];
    if (data && Array.isArray(data.mentors)) return data.mentors as MentorProfile[];

    return [];
  } catch (err: any) {
    const status = err?.response?.status;
    const body = err?.response?.data;
    throw new Error(
      status
        ? `HTTP ${status}: ${typeof body === "string" ? body : JSON.stringify(body)}`
        : String(err?.message ?? err),
    );
  }
}

export function useMentorProfiles(enabled: boolean) {
  const { data, isLoading, error, refetch } = useQuery<MentorProfile[] | null>({
    queryKey: ["mentorProfiles", enabled],
    queryFn: fetchMentorProfiles,
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });

  const guest = data === null;

  return {
    mentorProfiles: guest ? [] : (data ?? []),
    guest,
    loading: isLoading,
    error: guest ? null : (error ? (error as Error).message : null),
    refetch,
  };
}
