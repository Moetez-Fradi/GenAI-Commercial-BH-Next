// src/components/ClientTable.jsx
import { useEffect, useMemo, useState } from "react";
import PhysicalClientDetailsPopup from "./PhysicalClientDetailsPopup";
import ClientDetailsMoralPopup from "./MoralClientDetailsPopup";
import MessageComposer from "./MessageComposer";
import StatusBadge from "./StatusBadge";
import { Eye, MessageSquare, SlidersHorizontal, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Helper: checks physique vs morale
const isPhysique = (c) => c.type === "physique";

// Normalize recommendation chips
const normalizeRecs = (c) => {
  const raw = (c && c.recommended_products) || [];
  return raw.map((r, i) =>
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

export default function ClientTable({ title, clients, onUpdateClient, onMessageSent }) {
  const [selected, setSelected] = useState(null);
  const [msgClient, setMsgClient] = useState(null);
  const [initialMessage, setInitialMessage] = useState(undefined);
  const [genBusy, setGenBusy] = useState(null);

  const { token } = useAuth();

  const SYSTEM_PROMPT = import.meta.env.VITE_SYSTEM_PROMPT;
  const BACKEND = (import.meta.env.VITE_BACKEND_LINK?.replace(/\/$/, "") ?? ""); // used for /generate and list endpoints

  // -----------------------
  // Filters state
  // -----------------------
  const [showFilters, setShowFilters] = useState(false);
  const [loadingFilter, setLoadingFilter] = useState(false);
  const [filtered, setFiltered] = useState(null);

  // Determine mode from the incoming list (default to morale if unknown)
  const mode = useMemo(() => {
    const first = clients?.[0];
    return first && first.type === "physique" ? "physique" : "morale";
  }, [clients]);

  // Filter fields per mode
  const [physSegment, setPhysSegment] = useState("");
  const [physRisk, setPhysRisk] = useState("");
  const [moraleRisk, setMoraleRisk] = useState("");
  const [moraleSegment, setMoraleSegment] = useState("");
  const [sortBy, setSortBy] = useState("score"); // "score" | "ref"
  const [sortDir, setSortDir] = useState("desc"); // "asc" | "desc"

  const clearFilters = () => {
    setPhysSegment("");
    setPhysRisk("");
    setMoraleRisk("");
    setMoraleSegment("");
    setSortBy("score");
    setSortDir("desc");
    setFiltered(null);
  };

  const applyFilters = async () => {
    try {
      setLoadingFilter(true);

      const params = new URLSearchParams();
      params.set("limit", "10");
      params.set("offset", "0");
      params.set("sort_by", sortBy);
      params.set("sort_dir", sortDir);

      let url = "";
      if (mode === "physique") {
        url = `${BACKEND}/physique`;
        if (physSegment) params.append("client_segment", physSegment);
        if (physRisk) params.append("risk_profile", physRisk);
      } else {
        url = `${BACKEND}/morale`;
        if (moraleRisk) params.append("business_risk", moraleRisk);
        if (moraleSegment) params.append("segment", moraleSegment);
      }

      const res = await fetch(`${url}?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Filter request failed: ${res.status} ${res.statusText} ${t}`);
      }
      const json = await res.json();
      const items = (json?.items ?? []).map((it) => ({ ...it, type: mode })); // inject type for UI
      setFiltered(items);
      setShowFilters(false);
    } catch (err) {
      console.error(err);
      alert(err?.message ?? "Failed to apply filters");
    } finally {
      setLoadingFilter(false);
    }
  };

  const rows = filtered ?? clients ?? [];

  // Helper to pick product string for the generator
  const pickProduct = (recommended) => {
    if (!recommended) return "the recommended product";
    if (typeof recommended === "string") return recommended;
    return (
      recommended.product ??
      recommended.label ??
      recommended.product_id ??
      String(recommended.raw ?? "the recommended product")
    );
  };

  // Generate a short pitch and open composer
  const handleGenerate = async (c) => {
    const ref = c?.ref_personne;
    try {
      setGenBusy(ref);
      setInitialMessage(undefined);

      const firstRec =
        Array.isArray(c?.recommended_products) && c.recommended_products.length
          ? c.recommended_products[0]
          : undefined;
      const product = pickProduct(firstRec);

      const messages = [];
      if (Array.isArray(c?.messages) && c.messages.length) {
        c.messages.forEach((m) => {
          const text = typeof m === "string" ? m : m.content ?? m.body ?? "";
          if (text) messages.push({ role: "assistant", content: text });
        });
      }

      const who = c?.type === "physique" ? `customer ${c?.name ?? ref}` : `company ${c?.raison_sociale ?? ref}`;

      const details = [];
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
          "Make the tone professional and helpful, include one short call-to-action (CTA), and keep it suitable for WhatsApp or email. " +
          "Return only the pitch text (no extra commentary).",
      });

      const payload = {
        system_prompt: SYSTEM_PROMPT,
        messages,
        temperature: 1.0,
        max_tokens: 300,
      };

      if (!BACKEND) throw new Error("VITE_BACKEND_LINK is not configured");
      const res = await fetch(`${BACKEND}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
    } catch (err) {
      console.error("Generate failed", err);
      alert("Failed to generate message: " + (err?.message ?? "unknown error"));
    } finally {
      setGenBusy(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <h3 className="font-semibold text-lg">{title}</h3>

        <div className="flex items-center gap-2">
          {filtered && (
            <button
              onClick={clearFilters}
              className="text-xs px-3 py-1 rounded bg-white/20 hover:bg-white/30 transition"
              title="Clear filters"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="text-xs px-3 py-1 rounded bg-white/20 hover:bg-white/30 transition flex items-center gap-1"
          >
            <SlidersHorizontal size={14} /> Filters
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}
      {showFilters && (
        <div className="px-5 py-4 border-b bg-gray-50">
          <div className="flex flex-wrap items-end gap-3">
            {/* common sort */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-600 mb-1">Sort By</label>
              <select
                className="text-sm border rounded px-2 py-1"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="score">Score</option>
                <option value="ref">Ref</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-gray-600 mb-1">Direction</label>
              <select
                className="text-sm border rounded px-2 py-1"
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value)}
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>

            {mode === "physique" ? (
              <>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1">Client Segment</label>
                  <select
                    className="text-sm border rounded px-2 py-1"
                    value={physSegment}
                    onChange={(e) => setPhysSegment(e.target.value)}
                  >
                    <option value="">Any</option>
                    <option>Bronze</option>
                    <option>Prospect</option>
                    <option>Gold</option>
                    <option>Premium</option>
                    <option>Silver</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1">Risk Profile</label>
                  <select
                    className="text-sm border rounded px-2 py-1"
                    value={physRisk}
                    onChange={(e) => setPhysRisk(e.target.value)}
                  >
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
                  <label className="text-xs text-gray-600 mb-1">Business Risk</label>
                  <select
                    className="text-sm border rounded px-2 py-1"
                    value={moraleRisk}
                    onChange={(e) => setMoraleRisk(e.target.value)}
                  >
                    <option value="">Any</option>
                    <option>HIGH_RISK</option>
                    <option>MEDIUM_RISK</option>
                    <option>LOW_RISK</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1">Segment Threshold</label>
                  <select
                    className="text-sm border rounded px-2 py-1"
                    value={moraleSegment}
                    onChange={(e) => setMoraleSegment(e.target.value)}
                  >
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
              <button
                onClick={() => setShowFilters(false)}
                className="px-3 py-1 text-sm rounded border bg-white hover:bg-gray-100 flex items-center gap-1"
              >
                <X size={14} /> Close
              </button>
              <button
                onClick={applyFilters}
                disabled={loadingFilter}
                className="px-3 py-1 text-sm rounded bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60"
              >
                {loadingFilter ? "Applying..." : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-x-hidden">
        <table className="w-full table-fixed text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
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
              const displayName = isPhysique(c) ? c.name : c.raison_sociale ?? `Ref ${c.ref_personne}`;
              const recs = normalizeRecs(c);

              const moralScore = !isPhysique(c)
                ? (recs.find((r) => r.score !== undefined && r.score !== null)?.score ?? c.client_score)
                : undefined;

              const physScore = isPhysique(c) ? (c.score ?? c.rank) : undefined;

              const statusForBadge = isPhysique(c)
                ? (c.segment ?? c.risk_profile ?? c.status)
                : (c.client_segment ?? c.risk_profile);

              return (
                <tr key={c.ref_personne} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3 align-top">{c.ref_personne}</td>
                  <td className="p-3 font-medium align-top">{displayName}</td>

                  <td className="p-3 align-top">
                    {recs.length ? (
                      <div className="flex flex-wrap gap-1">
                        {recs.map((r) => (
                          <span
                            key={r.__key}
                            className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 max-w-[22rem] break-words whitespace-normal"
                          >
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
                        <span className="font-medium">{Math.round(Number(physScore))}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )
                    ) : moralScore !== undefined ? (
                      <span className="font-medium">{Math.round(Number(moralScore))}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  <td className="p-3 align-top">
                    {statusForBadge ? (
                      <StatusBadge status={statusForBadge} />
                    ) : (
                      <span className="inline-block text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">—</span>
                    )}
                  </td>

                  <td className="p-3 align-top">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelected(c)}
                        className="flex items-center gap-1 px-3 py-1 text-xs rounded bg-gray-800 text-white hover:bg-gray-700 transition"
                      >
                        <Eye size={14} /> Details
                      </button>

                      <button
                        onClick={() => handleGenerate(c)}
                        disabled={genBusy === c.ref_personne}
                        className="flex items-center gap-1 px-3 py-1 text-xs rounded bg-orange-500 text-white hover:bg-orange-600 transition disabled:opacity-60"
                      >
                        <MessageSquare size={14} />
                        {genBusy === c.ref_personne ? "Generating..." : "Generate"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!rows.length && (
              <tr>
                <td className="p-6 text-center text-gray-400" colSpan={6}>No clients</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Popups */}
      {selected && (
        isPhysique(selected) ? (
          <PhysicalClientDetailsPopup
            client={selected}
            onClose={() => setSelected(null)}
            onUpdate={(u) => {
              onUpdateClient(u);
              setSelected(u);
            }}
          />
        ) : (
          <ClientDetailsMoralPopup
            client={selected}
            onClose={() => setSelected(null)}
            onUpdate={(u) => {
              onUpdateClient(u);
              setSelected(u);
            }}
          />
        )
      )}

      {msgClient && (
        <MessageComposer
          client={msgClient}
          onClose={() => { setMsgClient(null); setInitialMessage(undefined); }}
          initialMessage={initialMessage}
          onSent={(_channel, _content) => {
            onMessageSent(msgClient.ref_personne);
            setMsgClient(null);
            setInitialMessage(undefined);
          }}
        />
      )}
    </div>
  );
}
