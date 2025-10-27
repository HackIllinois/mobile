import { useQuery } from "@tanstack/react-query";
import { Event } from "../components/eventScreen/EventCard";

async function fetchEvents(): Promise<Event[]> {
  const res = await fetch("https://adonix.hackillinois.org/event/");
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  console.log("HackIllinois API raw response:", data);

  if (data && Array.isArray(data.events)) {
    return data.events as Event[];
  }

  if (Array.isArray(data)) {
    return data as Event[];
  }
  if (data && data.data && Array.isArray(data.data.events)) {
    return data.data.events as Event[];
  }

  console.warn("Unexpected API response shape, returning empty array.", data);
  return [];
}

export function useEvents() {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: fetchEvents,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  return {
    events: data ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}