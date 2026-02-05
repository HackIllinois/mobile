import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

async function fetchSavedEvents(): Promise<string[]> {
  const stored = await AsyncStorage.getItem("savedEvents");
  if (stored) {
    return JSON.parse(stored) as string[];
  }
  return [];
}

export function useSavedEvents() {
  const { data, isLoading, error, refetch } = useQuery<string[]>({
    queryKey: ["savedEvents"],
    queryFn: fetchSavedEvents,
    staleTime: Infinity,
    retry: 0,
  });

  return {
    savedEventIds: data ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
