import { useState, useEffect } from "react";
import AlertTable from "../components/AlertTable";
import { useAuth } from "../context/AuthContext";
import type { Alert } from "../types/client";

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // pagination state
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 10;

  const { token } = useAuth();

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL(`${import.meta.env.VITE_BACKEND_LINK}/alerts`);
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
        throw new Error(data?.detail || "Failed to fetch alerts");
      }

      const json = await res.json();
      const items: any[] = json.items ?? [];

      // Map backend objects to Alert
      const mapped: Alert[] = items.map((it: any) => {
        const ref = it.REF_PERSONNE ?? it.ref_personne ?? "";
        
        return {
          ref_personne: String(ref),
          type: "alert",
          alert_type: it.alert_type ?? "",
          alert_message: it.alert_message ?? "",
          alert_severity: it.alert_severity ?? "High",
          product: it.product ?? undefined,
          expiration_date: it.expiration_date ?? undefined,
          days_until_expiry: it.days_until_expiry ?? undefined,
        };
      });

      setAlerts(mapped);
      setHasMore(Boolean(json.has_more) || false);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, token]);

  const updateAlert = (u: Alert) =>
    setAlerts((prev) => prev.map((a) => (a.ref_personne === u.ref_personne ? u : a)));

  if (loading) return <p>Loading alerts...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-red-600">Alerts</h1>
      <AlertTable
        title="Alerts"
        alerts={alerts}
        onUpdateAlert={updateAlert}
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