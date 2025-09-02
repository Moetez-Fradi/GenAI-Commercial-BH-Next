// src/pages/History.tsx
import { useEffect, useState } from "react";
import HistoryTable from "../components/HistoryTable";
import type { Client, Recommendation, SentMessage } from "../types/client";
import { fetchHistoryList } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function History() {
  const [history, setHistory] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchHistoryList(token);
        // backend returns array of history objects — map to Client shape expected by components
        const mapped: Client[] = data.map((h: any) => {
          // map recommendations JSON -> recommended_products (Client type)
          const recs = Array.isArray(h.recommendations)
            ? h.recommendations.map((r: any) => ({
                product: r.product,
                label: r.label,
                status: r.status ?? "pending",
                contacts: r.contacts ?? [],
                messages: Array.isArray(r.messages)
                  ? r.messages.map((m: any) => ({
                      id: String(m.id ?? Math.random()),
                      clientRef: h.ref_personne,
                      channel: m.channel,
                      content: m.content,
                      sentAt: m.sentAt,
                    }))
                  : [],
              }))
            : [];

          // Build a Client-like object; set type to "physique" as fallback
          return {
            ref_personne: String(h.ref_personne),
            name: h.name ?? h.ref_personne,
            type: "physique",
            rank: h.rank ?? undefined,
            status: "pending",
            recommended_products: recs,
            recommendation_count: Array.isArray(recs) ? recs.length : 0,
            lastContact:
              recs.flatMap((r: any) => (r.contacts ? r.contacts : [])).length > 0
                ? recs.flatMap((r: any) => (r.contacts ? r.contacts : []))[0]
                : null,
            messages: recs.flatMap((r: any) => r.messages ?? []),
          } as Client;
        });
        setHistory(mapped);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load history");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  if (loading) return <p>Loading history...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-red-600">History</h1>
      <HistoryTable history={history} />
    </div>
  );
}