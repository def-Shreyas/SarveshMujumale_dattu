import type { SafetyQueryResponse } from "./types";

const API_BASE = import.meta.env.VITE_API_URL;

export async function querySafetyAI(
  query: string,
  token: string
): Promise<SafetyQueryResponse> {
  const res = await fetch(`${API_BASE}/safety/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Safety query failed");
  }

  return res.json();
}

export async function downloadSafetyPDF(
  query: string,
  token: string
) {
  const res = await fetch(`${API_BASE}/safety/pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "PDF generation failed");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "DATTU_Safety_Case_Studies.pdf";
  a.click();

  window.URL.revokeObjectURL(url);
}
