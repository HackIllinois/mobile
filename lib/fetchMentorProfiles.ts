import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import api from "../api";

export type MentorProfileDto = {
  mentorId: string;
  name: string;
  description: string;
};

async function fetchMentorProfiles(): Promise<MentorProfileDto[] | null> {
  const token = await SecureStore.getItemAsync("jwt");

  if (!token) {
    return null;
  }

  try {
    const response: any = await api.get<MentorProfileDto[]>("/mentor/info/");
    const data = response?.data;

    if (Array.isArray(data)) return data as MentorProfileDto[];
    if (data && Array.isArray(data.data)) return data.data as MentorProfileDto[];
    if (data && Array.isArray(data.mentors)) return data.mentors as MentorProfileDto[];

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
  const { data, isLoading, error, refetch } = useQuery<MentorProfileDto[] | null>({
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
