"use client"

// src/components/ClientDetailsMoralPopup.tsx
import type React from "react"
import { useMemo, useState } from "react"
import type { ClientMoral } from "../types/client"
import Modal from "./Modal"

interface Props {
  client: ClientMoral
  onClose: () => void
  onUpdate: (updated: ClientMoral) => void
}

export default function ClientDetailsMoralPopup({ client, onClose, onUpdate }: Props) {
  const [local, setLocal] = useState<ClientMoral>({ ...client })
  const [saving, setSaving] = useState(false)
  const setField = <K extends keyof ClientMoral>(k: K, v: ClientMoral[K]) => setLocal((s) => ({ ...s, [k]: v }))

  const recsString = useMemo(
    () =>
      Array.isArray(local.recommended_products) && local.recommended_products.length
        ? local.recommended_products.map((r) => r.label ?? r.product ?? String(r.raw ?? "")).join(", ")
        : "",
    [local.recommended_products],
  )

  const setRecsFromString = (s: string) =>
    setLocal((l) => ({
      ...l,
      recommended_products: s
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => ({ product: p, label: p, score: null, raw: p })),
      recommendation_count: s
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean).length,
    }))

  const validateNumbers = (): boolean => {
    const nums = [
      ["client_score", local.client_score],
      ["estimated_budget", local.estimated_budget],
      ["total_capital_assured", (local as any).total_capital_assured],
      ["total_premiums_paid", (local as any).total_premiums_paid],
      ["recommendation_count", (local as any).recommendation_count],
    ] as const
    for (const [k, v] of nums) {
      if (v !== undefined && v !== null && v !== "" && Number.isNaN(Number(v))) return false
    }
    return true
  }

  const handleSave = () => {
    if (!validateNumbers()) return alert("Numeric fields must be valid numbers")
    setSaving(true)
    try {
      const normalized: ClientMoral = {
        ...local,
        client_score:
          local.client_score === "" || local.client_score === null || local.client_score === undefined
            ? undefined
            : Number(local.client_score),
        estimated_budget:
          local.estimated_budget === "" || local.estimated_budget === null || local.estimated_budget === undefined
            ? undefined
            : Number(local.estimated_budget),
        total_capital_assured:
          (local as any).total_capital_assured === "" || (local as any).total_capital_assured == null
            ? undefined
            : Number((local as any).total_capital_assured),
        total_premiums_paid:
          (local as any).total_premiums_paid === "" || (local as any).total_premiums_paid == null
            ? undefined
            : Number((local as any).total_premiums_paid),
        recommendation_count:
          (local as any).recommendation_count === "" || (local as any).recommendation_count == null
            ? undefined
            : Number((local as any).recommendation_count),
        recommended_products: Array.isArray(local.recommended_products) ? local.recommended_products : [],
      }
      onUpdate(normalized)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={true} onClose={onClose}>
      <div className="flex flex-col h-[80vh] w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4 sticky top-0 bg-black/20 backdrop-blur-xl z-10">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Corporate Client Details
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-all duration-300 text-white">
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ref" value={local.ref_personne ?? "—"} />
            <Field label="Type" value={local.type ?? "moral"} />
            <Input
              label="Raison sociale"
              value={local.raison_sociale ?? ""}
              onChange={(v) => setField("raison_sociale", v)}
            />
            <Input
              label="Client score"
              value={String(local.client_score ?? "")}
              onChange={(v) => setField("client_score" as any, v === "" ? undefined : Number(v))}
              type="number"
            />
            <Input
              label="Segment"
              value={local.client_segment ?? ""}
              onChange={(v) => setField("client_segment" as any, v)}
            />
            <Input
              label="Risk profile"
              value={local.risk_profile ?? ""}
              onChange={(v) => setField("risk_profile" as any, v)}
            />
            <Input
              label="Estimated budget"
              value={String(local.estimated_budget ?? "")}
              onChange={(v) => setField("estimated_budget" as any, v === "" ? undefined : Number(v))}
              type="number"
            />
            <Input
              label="Recommendation count"
              value={String((local as any).recommendation_count ?? "")}
              onChange={(v) => setField("recommendation_count" as any, v === "" ? undefined : Number(v))}
              type="number"
            />
            <Input
              label="Total capital assured"
              value={String((local as any).total_capital_assured ?? "")}
              onChange={(v) => setField("total_capital_assured" as any, v === "" ? undefined : Number(v))}
              type="number"
            />
            <Input
              label="Total premiums paid"
              value={String((local as any).total_premiums_paid ?? "")}
              onChange={(v) => setField("total_premiums_paid" as any, v === "" ? undefined : Number(v))}
              type="number"
            />
            <Field label="Last contact" value={String(local.lastContact ?? "—")} />
            <div className="col-span-2">
              <label className="text-sm text-white/50 font-medium">Recommended products</label>
              <input
                className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30
                focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                value={recsString}
                onChange={(e) => setRecsFromString(e.target.value)}
              />
            </div>

            <div className="col-span-2">
              <label className="text-sm text-white/50 font-medium">Messages (readonly)</label>
              <textarea
                className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30
                focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 h-24"
                readOnly
                value={Array.isArray(local.messages) ? local.messages.join("\n") : String(local.messages ?? "")}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-4 border-t border-white/10 pt-4 sticky bottom-0 bg-black/20 backdrop-blur-xl z-10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white hover:bg-white/10 transition-all duration-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white 
            hover:from-purple-700 hover:to-cyan-700 disabled:opacity-50 transition-all duration-300 shadow-lg"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* small helpers */
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3">
      <div className="text-sm text-white/50 font-medium">{label}</div>
      <div className="text-sm mt-1 text-purple-400 font-medium">{value ?? "—"}</div>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-sm text-white/50 font-medium">{label}</label>
      <input
        className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30
        focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
      />
    </div>
  )
}