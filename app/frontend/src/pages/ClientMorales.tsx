// src/app/clients/morales/page.tsx  (or your existing path; keep filename consistent)
"use client";

import { useState, useEffect, useCallback } from "react";
import ClientTable from "../components/ClientTable";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

export default function ClientsMorales() {
  const [morales, setMorales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 10;

  const { token } = useAuth();

  // Filters state (lifted to parent)
  const [filters, setFilters] = useState({
    sortBy: "score" as "score" | "ref",
    sortDir: "desc" as "asc" | "desc",
    moraleSegment: "",
    moraleRisk: "",
  });

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${import.meta.env.VITE_BACKEND_LINK}/clients/morale`);
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("offset", String(offset));
      url.searchParams.set("include_total", "false");
      url.searchParams.set("sort_by", filters.sortBy);
      url.searchParams.set("sort_dir", filters.sortDir);
      if (filters.moraleSegment) url.searchParams.set("segment", filters.moraleSegment);
      if (filters.moraleRisk) url.searchParams.set("business_risk", filters.moraleRisk);

      const res = await fetch(url.toString(), {
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || `Failed to fetch clients: ${res.status}`);
      }
      const json = await res.json();
      const items: any[] = json.items ?? [];
      // Map to shape expected by ClientTable
      const mapped = items.map((it) => ({ ...it, type: "moral" }));
      setMorales(mapped);
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

  const updateClient = (u: any) => setMorales((prev) => prev.map((c) => (c.ref_personne === u.ref_personne ? u : c)));

  const markMessaged = (ref: string) => setMorales((prev) => prev.map((c) => (c.ref_personne === ref ? { ...c, lastContact: "whatsapp" } : c)));

  // Called by ClientTable when user applies filters
  const onApplyFilters = async (payload: any) => {
    // update filters and reset offset to 0 then fetch
    setFilters({
      sortBy: payload.sortBy,
      sortDir: payload.sortDir,
      moraleSegment: payload.moraleSegment ?? "",
      moraleRisk: payload.moraleRisk ?? "",
    });
    setOffset(0);
    // fetch will run due to dependency on filters and offset
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20">
          <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
          <span className="text-white/70 font-medium">Loading clients...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-xl p-8 shadow-xl"
      >
        <p className="text-red-400 font-medium text-lg mb-2">Error loading clients</p>
        <p className="text-white/70 text-sm">{error}</p>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={fetchClients} 
          className="mt-6 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 text-sm font-medium shadow-lg flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-6"
    >
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl overflow-hidden">
        <ClientTable
          title="Corporate Clients"
          clients={morales}
          onUpdateClient={updateClient}
          onMessageSent={markMessaged}
          onApplyFilters={onApplyFilters}
          currentFilters={filters}
        />
      </div>

      <div className="flex items-center justify-between px-4">
        <p className="text-sm text-white/60">
          Showing {morales.length} clients
        </p>
        <div className="flex items-center gap-3">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={offset === 0} 
            onClick={() => setOffset((prev) => Math.max(0, prev - limit))} 
            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:bg-white/20"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={!hasMore} 
            onClick={() => setOffset((prev) => prev + limit)} 
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
          >
            Next <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}