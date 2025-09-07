// src/app/clients/physiques/page.tsx (adjust path to your structure)
"use client";

import { useState, useEffect, useCallback } from "react";
import ClientTable from "../components/ClientTable";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

export default function ClientsPhysiques() {
  const [physiques, setPhysiques] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 10;

  const { token } = useAuth();

  const [filters, setFilters] = useState({
    sortBy: "score" as "score" | "ref",
    sortDir: "desc" as "asc" | "desc",
    physSegment: "",
    physRisk: "",
  });

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${import.meta.env.VITE_BACKEND_LINK}/clients/physique`);
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("offset", String(offset));
      url.searchParams.set("include_total", "false");
      url.searchParams.set("sort_by", filters.sortBy);
      url.searchParams.set("sort_dir", filters.sortDir);
      if (filters.physSegment) url.searchParams.set("client_segment", filters.physSegment);
      if (filters.physRisk) url.searchParams.set("risk_profile", filters.physRisk);

      const res = await fetch(url.toString(), {
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || `Failed to fetch clients: ${res.status}`);
      }
      const json = await res.json();
      const items: any[] = json.items ?? [];
      const mapped = items.map((it) => ({ ...it, type: "physique" }));
      setPhysiques(mapped);
      setHasMore(Boolean(json.has_more) || items.length === limit);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [offset, filters, token]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const updateClient = (u: any) => setPhysiques((prev) => prev.map((c) => (c.ref_personne === u.ref_personne ? u : c)));

  const markMessaged = (ref: string) => setPhysiques((prev) => prev.map((c) => (c.ref_personne === ref ? { ...c, lastContact: "whatsapp" } : c)));

  const onApplyFilters = async (payload: any) => {
    setFilters({
      sortBy: payload.sortBy,
      sortDir: payload.sortDir,
      physSegment: payload.physSegment ?? "",
      physRisk: payload.physRisk ?? "",
    });
    setOffset(0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading clients...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
        <p className="text-destructive font-medium">Error loading clients</p>
        <p className="text-destructive/80 text-sm mt-1">{error}</p>
        <button onClick={fetchClients} className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors text-sm font-medium">
          Try Again
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <ClientTable
        title="Individual Clients"
        clients={physiques}
        onUpdateClient={updateClient}
        onMessageSent={markMessaged}
        onApplyFilters={onApplyFilters}
        currentFilters={filters}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing {physiques.length} clients</p>
        <div className="flex items-center gap-2">
          <button disabled={offset === 0} onClick={() => setOffset((prev) => Math.max(0, prev - limit))} className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg disabled:opacity-50">
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <button disabled={!hasMore} onClick={() => setOffset((prev) => prev + limit)} className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg disabled:opacity-50">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}