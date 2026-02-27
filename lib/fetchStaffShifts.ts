import { useQuery } from "@tanstack/react-query";
import api from "../api";
import { Event, Shifts } from "../types";

async function fetchStaffShifts(): Promise<Event[]> {
  const response: any = await api.get<Shifts>("/staff/shift/");
  const data = response?.data;
  if (data && Array.isArray(data.shifts)) {
    return data.shifts as Event[];
  }
  return [];
}

export function useStaffShifts(enabled: boolean) {
  const { data, isLoading, error, refetch } = useQuery<Event[]>({
    queryKey: ["staffShifts"],
    queryFn: fetchStaffShifts,
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    shifts: data ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
