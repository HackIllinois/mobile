import { useQuery } from "@tanstack/react-query";
import { ShopItem } from "../types";

async function fetchShopItems(): Promise<ShopItem[]> {
  const res = await fetch("https://adonix.hackillinois.org/shop/");
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

export function useShopItems() {
  const { data, isLoading, error, refetch } = useQuery<ShopItem[]>({
    queryKey: ["shopItems"],
    queryFn: fetchShopItems,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  return {
    shopItems: data ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
