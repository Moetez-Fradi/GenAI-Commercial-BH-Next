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
        <div className="flex items-center justify-between mb-2 border-b border-green-200 pb-2 sticky top-0 bg-white z-10">
          {" "}
          {/* Updated border color to green */}
          <h2 className="text-lg font-semibold text-green-600">Individual Clients</h2>{" "}
          {/* Updated text color from red to green */}
          <button onClick={onClose} className="px-2 py-1 rounded hover:bg-green-100 transition">
            ✕
          </button>{" "}
          {/* Updated hover color to green */}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
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
              <label className="text-xs text-gray-500">Recommended products</label>
              <input
                className="mt-1 w-full border border-green-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" // Updated border and focus colors to green
                value={recsString}
                onChange={(e) => setRecsFromString(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-3 border-t border-green-200 pt-2 sticky bottom-0 bg-white z-10">
          {" "}
          {/* Updated border color to green */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50 transition shadow-sm" // Updated button colors from gray to green
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition shadow-sm"
          >
            Cancel
          </button>{" "}
          {/* Updated cancel button from red to gray for better contrast */}
        </div>
      </div>
    </Modal>
  )
}

function Field({ label, value, readOnly }: { label: string; value: React.ReactNode; readOnly?: boolean }) {
  return (
    <div className="border border-green-200 rounded px-2 py-1 bg-green-50/30">
      {" "}
      {/* Updated border color and added subtle green background */}
      <div className="text-xs text-green-700">{label}</div> {/* Updated label color to green */}
      <div className={`text-sm ${readOnly ? "text-gray-700" : ""}`}>{value ?? "—"}</div>
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
      <label className="text-xs text-green-700">{label}</label> {/* Updated label color to green */}
      <input
        className="mt-1 w-full border border-green-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" // Updated border and focus colors to green
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
      />
    </div>
  )
}