// src/components/ClientTable.tsx
"use client";

import { useMemo, useState } from "react";
import PhysicalClientDetailsPopup from "./PhysicalClientDetailsPopup";
import ClientDetailsMoralPopup from "./MoralClientDetailsPopup";
import MessageComposer from "./MessageComposer";
import StatusBadge from "./StatusBadge";
import { Eye, MessageSquare, SlidersHorizontal, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { User, Building2 } from "lucide-react";

interface FiltersPayload {
  sortBy: "score" | "ref";
  sortDir: "asc" | "desc";
  physSegment?: string;
  physRisk?: string;
  moraleSegment?: string;
  moraleRisk?: string;
}

interface ClientTableProps {
  title: string;
  clients: any[];
  onUpdateClient: (client: any) => void;
  onMessageSent: (ref: string) => void;
  // parent-managed filtering: callback and currentFilters are optional
  onApplyFilters?: (f: FiltersPayload) => Promise<void> | void;
  currentFilters?: Partial<FiltersPayload>;
}

export default function ClientTable({
  title,
  clients,
  onUpdateClient,
  onMessageSent,
  onApplyFilters,
  currentFilters,
}: ClientTableProps) {
  const [selected, setSelected] = useState<any | null>(null);
  const [msgClient, setMsgClient] = useState<any | null>(null);
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);
  const [genBusy, setGenBusy] = useState<string | null>(null);

  const { token } = useAuth();

  const SYSTEM_PROMPT = import.meta.env.VITE_SYSTEM_PROMPT;
  const BACKEND = import.meta.env.VITE_BACKEND_LINK?.replace(/\/$/, "") ?? "";

  // Filters UI state (default to parent currentFilters if provided)
  const [showFilters, setShowFilters] = useState(false);
  const [loadingFilter, setLoadingFilter] = useState(false);
  const [filtered, setFiltered] = useState<any[] | null>(null);

  const mode = useMemo(() => {
    const first = clients?.[0];
    return first && first.type === "physique" ? "physique" : "morale";
  }, [clients]);

  const [physSegment, setPhysSegment] = useState(currentFilters?.physSegment ?? "");
  const [physRisk, setPhysRisk] = useState(currentFilters?.physRisk ?? "");
  const [moraleRisk, setMoraleRisk] = useState(currentFilters?.moraleRisk ?? "");
  const [moraleSegment, setMoraleSegment] = useState(currentFilters?.moraleSegment ?? "");
  const [sortBy, setSortBy] = useState<"score" | "ref">(currentFilters?.sortBy ?? "score");
  const [sortDir, setSortDir] = useState<"desc" | "asc">(currentFilters?.sortDir ?? "desc");

  const clearFilters = () => {
    setPhysSegment("");
    setPhysRisk("");
    setMoraleRisk("");
    setMoraleSegment("");
    setSortBy("score");
    setSortDir("desc");
    setFiltered(null);
    // also notify parent with empty filters if they have onApplyFilters
    if (onApplyFilters) {
      onApplyFilters({
        sortBy: "score",
        sortDir: "desc",
        physSegment: "",
        physRisk: "",
        moraleSegment: "",
        moraleRisk: "",
      });
    }
  };

  // applyFilters will call parent onApplyFilters (preferred). If not provided it will do an internal fetch (fallback)
  const applyFilters = async () => {
    const payload: FiltersPayload = {
      sortBy,
      sortDir,
      physSegment,
      physRisk,
      moraleSegment,
      moraleRisk,
    };

    if (onApplyFilters) {
      try {
        setLoadingFilter(true);
        await onApplyFilters(payload);
        setShowFilters(false);
      } catch (err: any) {
        console.error("Parent applyFilters failed", err);
        alert("Failed to apply filters: " + (err?.message ?? "unknown"));
      } finally {
        setLoadingFilter(false);
      }
      return;
    }

    // fallback: local fetch using same logic as parent pages (not preferred)
    try {
      setLoadingFilter(true);
      const params = new URLSearchParams();
      params.set("limit", "10");
      params.set("offset", "0");
      params.set("sort_by", payload.sortBy);
      params.set("sort_dir", payload.sortDir);

      let url = "";
      if (mode === "physique") {
        url = `${BACKEND}/clients/physique`;
        if (payload.physSegment) params.append("client_segment", payload.physSegment);
        if (payload.physRisk) params.append("risk_profile", payload.physRisk);
      } else {
        url = `${BACKEND}/clients/morale`;
        if (payload.moraleRisk) params.append("business_risk", payload.moraleRisk);
        if (payload.moraleSegment) params.append("segment", payload.moraleSegment);
      }

      const res = await fetch(`${url}?${params.toString()}`, {
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Filter request failed: ${res.status} ${res.statusText} ${t}`);
      }
      const json = await res.json();
      const items = (json?.items ?? []).map((it: any) => ({ ...it, type: mode }));
      setFiltered(items);
      setShowFilters(false);
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "Failed to apply filters");
    } finally {
      setLoadingFilter(false);
    }
  };

  const rows = filtered ?? clients ?? [];

  const pickProduct = (recommended: any) => {
    if (!recommended) return "the recommended product";
    if (typeof recommended === "string") return recommended;
    return recommended.product ?? recommended.label ?? recommended.product_id ?? String(recommended.raw ?? "the recommended product");
  };

  const handleGenerate = async (c: any) => {
    const ref = c?.ref_personne ?? c?.REF_PERSONNE;
    try {
      setGenBusy(String(ref));
      setInitialMessage(undefined);

      const firstRec = Array.isArray(c?.recommended_products) && c.recommended_products.length ? c.recommended_products[0] : undefined;
      const product = pickProduct(firstRec);

      const messages: any[] = [];
      if (Array.isArray(c?.messages) && c.messages.length) {
        c.messages.forEach((m: any) => {
          const text = typeof m === "string" ? m : m.content ?? m.body ?? "";
          if (text) messages.push({ role: "assistant", content: text });
        });
      }

      const who = c?.type === "physique" ? `customer ${c?.name ?? ref}` : `company ${c?.raison_sociale ?? ref}`;
      const details: string[] = [];
      if (c?.type === "physique") {
        if (c.age) details.push(`age: ${c.age}`);
        if (c.city) details.push(`city: ${c.city}`);
        const status = c.segment ?? c.risk_profile ?? c.status;
        if (status) details.push(`status: ${status}`);
      } else {
        if (c.client_segment) details.push(`segment: ${c.client_segment}`);
        if (c.risk_profile) details.push(`risk: ${c.risk_profile}`);
      }

      messages.push({
        role: "user",
        content:
          `You are a concise sales assistant. Write a short, friendly commercial pitch (2-3 sentences) proposing "${product}" to ${who}. ` +
          (details.length ? `Customer details: ${details.join(", ")}. ` : "") +
          "Make the tone professional and helpful, include one short CTA, and keep it suitable for WhatsApp or email. Return only the pitch text (no extra commentary).",
      });

      const payload = { system_prompt: SYSTEM_PROMPT, messages, temperature: 1.0, max_tokens: 300 };

      if (!BACKEND) throw new Error("VITE_BACKEND_LINK is not configured");
      const res = await fetch(`${BACKEND}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`LLM request failed: ${res.status} ${res.statusText} ${text}`);
      }

      const json = await res.json();
      const reply = (json?.reply ?? "").trim();
      setInitialMessage(reply);
      setMsgClient(c);
    } catch (err: any) {
      console.error("Generate failed", err);
      alert("Failed to generate message: " + (err?.message ?? "unknown error"));
    } finally {
      setGenBusy(null);
    }
  };

  const isPhysique = (c: any) => c.type === "physique";

  const normalizeRecs = (c: any) => {
    const raw = (c && c.recommended_products) || [];
    return raw.map((r: any, i: number) =>
      typeof r === "string"
        ? { product: r, label: r, score: undefined, raw: r, __key: `s-${i}` }
        : {
            product: r.product ?? r.label ?? String(r),
            label: r.label ?? undefined,
            score: r.score !== undefined && r.score !== null ? Number(r.score) : undefined,
            raw: r,
            __key: `o-${i}`,
          }
    );
  };

  const getScoreColor = (score: number | undefined) => {
    if (score === undefined || score === null) return "text-destructive";
    if (score >= 80) return "text-primary";
    if (score >= 60) return "text-chart-2";
    return "text-destructive";
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <h3 className="font-semibold text-lg">{title}</h3>

        <div className="flex items-center gap-2">
          {filtered && (
            <button onClick={clearFilters} className="text-xs px-3 py-1 rounded bg-white/20 hover:bg-white/30 transition" title="Clear filters">
              Clear
            </button>
          )}
          <button onClick={() => setShowFilters((s) => !s)} className="text-xs px-3 py-1 rounded bg-white/20 hover:bg-white/30 transition flex items-center gap-1">
            <SlidersHorizontal size={14} /> Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="px-5 py-4 border-b bg-green-50">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-green-700 mb-1">Sort By</label>
              <select className="text-sm border border-green-200 rounded px-2 py-1" value={sortBy} onChange={(e) => setSortBy(e.target.value as "score" | "ref")}>
                <option value="score">Score</option>
                <option value="ref">Ref</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-green-700 mb-1">Direction</label>
              <select className="text-sm border border-green-200 rounded px-2 py-1" value={sortDir} onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}>
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>

            {mode === "physique" ? (
              <>
                <div className="flex flex-col">
                  <label className="text-xs text-green-700 mb-1">Client Segment</label>
                  <select className="text-sm border border-green-200 rounded px-2 py-1" value={physSegment} onChange={(e) => setPhysSegment(e.target.value)}>
                    <option value="">Any</option>
                    <option>Bronze</option>
                    <option>Prospect</option>
                    <option>Gold</option>
                    <option>Premium</option>
                    <option>Silver</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-green-700 mb-1">Risk Profile</label>
                  <select className="text-sm border border-green-200 rounded px-2 py-1" value={physRisk} onChange={(e) => setPhysRisk(e.target.value)}>
                    <option value="">Any</option>
                    <option>High Risk</option>
                    <option>Medium Risk</option>
                    <option>Low Risk</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col">
                  <label className="text-xs text-green-700 mb-1">Business Risk</label>
                  <select className="text-sm border border-green-200 rounded px-2 py-1" value={moraleRisk} onChange={(e) => setMoraleRisk(e.target.value)}>
                    <option value="">Any</option>
                    <option>HIGH_RISK</option>
                    <option>MEDIUM_RISK</option>
                    <option>LOW_RISK</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-green-700 mb-1">Segment Threshold</label>
                  <select className="text-sm border border-green-200 rounded px-2 py-1" value={moraleSegment} onChange={(e) => setMoraleSegment(e.target.value)}>
                    <option value="">Any</option>
                    <option>Entreprise</option>
                    <option>Business</option>
                    <option>SME</option>
                    <option>Small Business</option>
                    <option>Startup</option>
                  </select>
                </div>
              </>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => setShowFilters(false)} className="px-3 py-1 text-sm rounded border border-green-200 bg-white hover:bg-green-50 flex items-center gap-1 text-green-700">
                <X size={14} /> Close
              </button>
              <button onClick={applyFilters} disabled={loadingFilter} className="px-3 py-1 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 shadow-sm">
                {loadingFilter ? "Applying..." : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-left">
          <thead className="bg-green-50 text-green-800 text-sm uppercase font-medium">
            <tr>
              <th className="p-3 w-20">Ref</th>
              <th className="p-3 w-48">Name</th>
              <th className="p-3">Recommendation</th>
              <th className="p-3 w-24 text-left">Score</th>
              <th className="p-3 w-36">Status</th>
              <th className="p-3 text-right w-36">Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((c) => {
              const displayName = isPhysique(c) ? c.name : (c.raison_sociale ?? `Ref ${c.ref_personne ?? c.REF_PERSONNE}`);
              const recs = normalizeRecs(c);

              const moralScore = !isPhysique(c)
                ? (recs.find((r) => r.score !== undefined && r.score !== null)?.score ?? c.client_score)
                : undefined;

              const physScore = isPhysique(c) ? (c.score ?? c.rank ?? c.client_score) : undefined;

              const statusForBadge = isPhysique(c)
                ? (c.segment ?? c.risk_profile ?? c.status)
                : (c.client_segment ?? c.risk_profile);

              return (
                <tr key={String(c.ref_personne ?? c.REF_PERSONNE)} className="border-b border-green-100 hover:bg-green-50/50 transition">
                  <td className="p-3 align-top font-medium text-green-700">{c.ref_personne ?? c.REF_PERSONNE}</td>
                  <td className="p-3 font-medium align-top text-gray-900">{displayName}</td>

                  <td className="p-3 align-top">
                    {recs.length ? (
                      <div className="flex flex-wrap gap-1">
                        {recs.map((r) => (
                          <span key={r.__key} className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 max-w-[22rem] break-words whitespace-normal border border-green-200">
                            {r.product ?? r.label ?? "—"}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>

                  <td className="p-3 align-top">
                    {isPhysique(c) ? (
                      physScore !== undefined && physScore !== null ? (
                        <span className={`font-semibold ${getScoreColor(Number(physScore))}`}>{Math.round(Number(physScore))}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )
                    ) : moralScore !== undefined && moralScore !== null ? (
                      <span className={`font-semibold ${getScoreColor(Number(moralScore))}`}>{Math.round(Number(moralScore))}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  <td className="p-3 align-top">
                    {statusForBadge ? <StatusBadge status={String(statusForBadge)} /> : <span className="inline-block text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">—</span>}
                  </td>

                  <td className="p-3 align-top">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setSelected(c)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-green-600 text-white hover:bg-green-700 transition shadow-sm font-medium">
                        <Eye size={14} /> View
                      </button>

                      <button onClick={() => handleGenerate(c)} disabled={genBusy === String(c.ref_personne ?? c.REF_PERSONNE)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-60 shadow-sm font-medium">
                        <MessageSquare size={14} />
                        {genBusy === String(c.ref_personne ?? c.REF_PERSONNE) ? "Generating..." : "Generate"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!rows.length && (
              <tr>
                <td className="p-8 text-center text-gray-500" colSpan={6}>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="font-medium">No clients found</p>
                    <p className="text-sm">Try adjusting your filters or add new clients</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (isPhysique(selected) ? (
        <PhysicalClientDetailsPopup client={selected} onClose={() => setSelected(null)} onUpdate={(u) => { onUpdateClient(u); setSelected(u); }} />
      ) : (
        <ClientDetailsMoralPopup client={selected} onClose={() => setSelected(null)} onUpdate={(u) => { onUpdateClient(u); setSelected(u); }} />
      ))}

      {msgClient && (
        <MessageComposer
          client={msgClient}
          onClose={() => {
            setMsgClient(null);
            setInitialMessage(undefined);
          }}
          initialMessage={initialMessage}
          onSent={(_channel, _content) => {
            onMessageSent(msgClient.ref_personne ?? msgClient.REF_PERSONNE);
            setMsgClient(null);
            setInitialMessage(undefined);
          }}
        />
      )}
    </div>
  );
}