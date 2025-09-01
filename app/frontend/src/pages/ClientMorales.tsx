// src/pages/Clients.tsx
import { useState, useEffect } from "react";
import ClientTable from "../components/ClientTable";
import { useAuth } from "../context/AuthContext";
import type { ClientMoral } from "../types/client";

export default function Clients() {
  const [morales, setMorales] = useState<ClientMoral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // pagination state
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 10;

  const { token } = useAuth();

  const fetchClients = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL(`${import.meta.env.VITE_BACKEND_LINK}/clients/morale`);
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("offset", String(offset));
      url.searchParams.set("include_total", "false");

      const res = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Failed to fetch clients");
      }

      const json = await res.json();
      const items: any[] = json.items ?? [];

      // Map backend objects to ClientMoral
      const mapped: ClientMoral[] = items.map((it: any) => {
        const ref = it.REF_PERSONNE ?? it.ref_personne ?? "";
        const raison = it.RAISON_SOCIALE ?? it.raison_sociale ?? "";

        // normalize recommended_products: keep strings, convert objects to { product, label, score, raw }
        const recommended_products: (string | {
          product?: string | null;
          label?: string | null;
          score?: number | null;
          raw?: any;
        })[] = Array.isArray(it.recommended_products)
          ? it.recommended_products.map((rp: any) => {
              if (typeof rp === "string") return rp;

              return {
                product:
                  rp.product ??
                  rp.product_id ??
                  rp.label ??
                  rp.product_name ??
                  undefined,
                label: rp.label ?? undefined,
                score:
                  rp.score !== undefined && rp.score !== null
                    ? Number(rp.score)
                    : undefined,
                raw: rp,
              };
            })
          : [];

        // optional messages mapping (light normalization)
        const messages =
          Array.isArray(it.messages) && it.messages.length
            ? it.messages.map((m: any) => ({
                id: String(m.id ?? m.message_id ?? Math.random()),
                clientRef: String(ref),
                channel: (m.channel ?? m.channel_type ?? undefined) as any,
                content: m.content ?? m.body ?? "",
                sentAt: m.sentAt ?? m.sent_at ?? new Date().toISOString(),
              }))
            : undefined;

        return {
          ref_personne: String(ref),
          type: "moral",
          raison_sociale: raison,
          recommended_products,
          recommendation_count: it.recommendation_count ?? 0,
          client_score:
            it.client_score !== undefined && it.client_score !== null
              ? Number(it.client_score)
              : undefined,
          client_segment: it.client_segment ?? undefined,
          risk_profile: it.risk_profile ?? undefined,
          estimated_budget:
            it.estimated_budget !== undefined && it.estimated_budget !== null
              ? Number(it.estimated_budget)
              : undefined,
          total_capital_assured:
            it.total_capital_assured !== undefined && it.total_capital_assured !== null
              ? Number(it.total_capital_assured)
              : undefined,
          total_premiums_paid:
            it.total_premiums_paid !== undefined && it.total_premiums_paid !== null
              ? Number(it.total_premiums_paid)
              : undefined,
          lastContact: it.lastContact ?? it.last_contact ?? undefined,
          messages,
        };
      });

      setMorales(mapped);
      console.log("Fetched morales:", mapped);
      setHasMore(Boolean(json.has_more) || false);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, token]);

  const updateClient = (u: ClientMoral) =>
    setMorales((prev) => prev.map((c) => (c.ref_personne === u.ref_personne ? u : c)));

  const markMessaged = (ref: string) =>
    setMorales((prev) =>
      prev.map((c) => (c.ref_personne === ref ? { ...c, lastContact: "whatsapp" } : c))
    );

  if (loading) return <p>Loading clients...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-red-600">Clients Morales</h1>
      <ClientTable
        title="Clients Morales"
        clients={morales}
        onUpdateClient={updateClient}
        onMessageSent={markMessaged}
      />

      {/* Pagination controls */}
      <div className="flex justify-between items-center mt-4">
        <button
          disabled={offset === 0}
          onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
          className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
        >
          ← Previous
        </button>
        <button
          disabled={!hasMore}
          onClick={() => setOffset((prev) => prev + limit)}
          className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
