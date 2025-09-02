// src/services/api.ts
const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://127.0.0.1:8000";

export async function fetchHistoryList(token?: string) {
  const res = await fetch(`${API_BASE}/history`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to fetch history: ${res.status} ${txt}`);
  }
  return res.json();
}

export async function fetchHistoryByClient(ref_personne: string, token?: string) {
  const res = await fetch(`${API_BASE}/history/${encodeURIComponent(ref_personne)}`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) throw new Error("Failed to fetch client history");
  return res.json();
}

export async function generateAndSend(ref_personne: string, product: string, channel: string, token?: string) {
  const url = new URL(`${API_BASE}/generate/send`);
  // Use POST with JSON body for clarity
  const body = { ref_personne, product, channel };
  const res = await fetch(`${API_BASE}/generate/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to generate/send: ${res.status} ${txt}`);
  }
  return res.json();
}