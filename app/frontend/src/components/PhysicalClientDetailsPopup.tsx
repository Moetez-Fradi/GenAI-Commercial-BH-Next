"use client"

import type React from "react"
import { useState, useMemo } from "react"
import type { ClientPhysique } from "../types/client"
import Modal from "./Modal"

interface Props {
  client: ClientPhysique
  onClose: () => void
  onUpdate: (updated: ClientPhysique) => void
}

export default function ClientDetailsPhysiquePopup({ client, onClose, onUpdate }: Props) {
  const [local, setLocal] = useState<ClientPhysique>({ ...client })
  const [saving, setSaving] = useState(false)

  const setField = <K extends keyof ClientPhysique>(key: K, value: ClientPhysique[K]) =>
    setLocal((s) => ({ ...s, [key]: value }))

  const recsString = useMemo(
    () =>
      Array.isArray(local.recommended_products)
        ? local.recommended_products.map((r) => r.label ?? r.product ?? "").join(", ")
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
        .map((p) => ({ product: p, label: p })),
    }))

  const handleSave = () => {
    onUpdate({
      ...local,
      age: local.age ? Number(local.age) : undefined,
      estimated_budget: local.estimated_budget ? Number(local.estimated_budget) : undefined,
      score: local.score ? Number(local.score) : undefined,
      rank: local.rank ? Number(local.rank) : undefined,
    })
    onClose()
  }

  return (
    <Modal open={true} onClose={onClose}>
      <div className="flex flex-col h-[80vh] w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4 sticky top-0 bg-black/20 backdrop-blur-xl z-10">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Individual Client Details
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-all duration-300 text-white">
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ref" value={local.ref_personne ?? "—"} readOnly />
            <Field label="Type" value="physique" readOnly />
            <Input label="Name" value={local.name ?? ""} onChange={(v) => setField("name", v)} />
            <Input label="Age" value={String(local.age ?? "")} onChange={(v) => setField("age", v)} type="number" />
            <Input label="City" value={local.city ?? ""} onChange={(v) => setField("city", v)} />
            <Input label="Phone" value={local.phone ?? ""} onChange={(v) => setField("phone", v)} />
            <Input label="Email" value={local.email ?? ""} onChange={(v) => setField("email", v)} />
            <Input
              label="Profession"
              value={local.profession_group ?? ""}
              onChange={(v) => setField("profession_group", v)}
            />
            <Input
              label="Family"
              value={local.situation_familiale ?? ""}
              onChange={(v) => setField("situation_familiale", v)}
            />
            <Input
              label="Sector"
              value={local.secteur_activite ?? ""}
              onChange={(v) => setField("secteur_activite", v)}
            />
            <Input label="Segment" value={local.segment ?? ""} onChange={(v) => setField("segment", v)} />
            <Input label="Risk" value={local.risk_profile ?? ""} onChange={(v) => setField("risk_profile", v)} />
            <Input label="Rank" value={String(local.rank ?? "")} onChange={(v) => setField("rank", v)} type="number" />
            <Input
              label="Score"
              value={String(local.score ?? "")}
              onChange={(v) => setField("score", v)}
              type="number"
            />
            <Input
              label="Budget"
              value={String(local.estimated_budget ?? "")}
              onChange={(v) => setField("estimated_budget", v)}
              type="number"
            />

            <div className="col-span-2">
              <label className="text-sm text-white/50 font-medium">Recommended products</label>
              <input
                className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30
                focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                value={recsString}
                onChange={(e) => setRecsFromString(e.target.value)}
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

function Field({ label, value, readOnly }: { label: string; value: React.ReactNode; readOnly?: boolean }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3">
      <div className="text-sm text-white/50 font-medium">{label}</div>
      <div className={`text-sm mt-1 ${readOnly ? "text-purple-400 font-medium" : "text-white"}`}>{value ?? "—"}</div>
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