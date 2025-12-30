import { apiClient } from "@/lib/api";
import type { Incident } from "../types";

export async function fetchSafetyIncidents(
  query: string
): Promise<Incident[]> {
  const response = await apiClient.post("/safety/query", {
    query,
  });

  return response.data.incidents;
}
