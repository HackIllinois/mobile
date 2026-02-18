import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import api from "../api";

export type MentorOfficeHourDto = {
  mentorName: string;
  location: string;
  startTime: number; // ms
  endTime: number;   // ms
  mentorId: string;
};

async function fetchMentorOfficeHours(): Promise<MentorOfficeHourDto[]> {
  const token = await SecureStore.getItemAsync("jwt");

  if (!token) {
    console.log("[mentor] No jwt found in SecureStore (key: 'jwt')");
    throw new Error("Not logged in (missing token)");
  }

  try {
    const response: any = await api.get<MentorOfficeHourDto[]>("/mentor/", {
      headers: {
        Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
      },
    });

    const data = response?.data;
    
    if (Array.isArray(data)) return data as MentorOfficeHourDto[];
    if (data && Array.isArray(data.data)) return data.data as MentorOfficeHourDto[];
    if (data && Array.isArray(data.mentors)) return data.mentors as MentorOfficeHourDto[];

    console.log("[mentor] unexpected response shape", data);
    return [];
  } catch (err: any) {
    const status = err?.response?.status;
    const body = err?.response?.data;
    console.log("[mentor] api.get failed", { status, body, message: err?.message });

    throw new Error(
      status ? `HTTP ${status}: ${typeof body === "string" ? body : JSON.stringify(body)}` : String(err?.message ?? err)
    );
  }
}

export function useMentorOfficeHours(enabled: boolean) {
  const { data, isLoading, error, refetch } = useQuery<MentorOfficeHourDto[]>({
    queryKey: ["mentorOfficeHours", enabled],
    queryFn: fetchMentorOfficeHours,
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });

  return {
    mentorOfficeHours: data ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}