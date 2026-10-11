import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import api from "../api";
import { MentorOfficeHours } from "../types";

async function fetchMentorOfficeHours(): Promise<MentorOfficeHours[] | null> {
  const token = await SecureStore.getItemAsync("jwt");

  if (!token) {
    console.log("[mentor] Guest (no jwt) — returning null");
    return null;
  }

  try {
    const response: any = await api.get<MentorOfficeHours[]>("/mentor/");
    const data = response?.data;

    if (Array.isArray(data)) return data as MentorOfficeHours[];
    if (data && Array.isArray(data.data)) return data.data as MentorOfficeHours[];
    if (data && Array.isArray(data.mentors)) return data.mentors as MentorOfficeHours[];

    console.log("[mentor] unexpected response shape", data);
    return [];
  } catch (err: any) {
    const status = err?.response?.status;
    const body = err?.response?.data;
    console.log("[mentor] api.get failed", { status, body, message: err?.message });

    throw new Error(
      status
        ? `HTTP ${status}: ${typeof body === "string" ? body : JSON.stringify(body)}`
        : String(err?.message ?? err),
    );
  }
}

export function useMentorOfficeHours(enabled: boolean) {
  const { data, isLoading, error, refetch } = useQuery<MentorOfficeHours[] | null>({
    queryKey: ["mentorOfficeHours", enabled],
    queryFn: fetchMentorOfficeHours,
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });

  const guest = data === null;

  return {
    mentorOfficeHours: guest ? [] : (data ?? []),
    guest, 
    loading: isLoading,
    error: guest ? null : (error ? (error as Error).message : null),
    refetch,
  };
}