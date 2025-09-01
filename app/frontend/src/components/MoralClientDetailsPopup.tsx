// src/components/ClientDetailsMoralPopup.tsx
import React, { useMemo, useState } from "react";
import type { ClientMoral } from "../types/client";
import Modal from "./Modal";

interface Props {
  client: ClientMoral;
  onClose: () => void;
  onUpdate: (updated: ClientMoral) => void;
}

export default function ClientDetailsMoralPopup({ client, onClose, onUpdate }: Props) {
  const [local, setLocal] = useState<ClientMoral>({ ...client });
  const [saving, setSaving] = useState(false);
  const setField = <K extends keyof ClientMoral>(k: K, v: ClientMoral[K]) => setLocal((s) => ({ ...s, [k]: v }));

  const recsString = useMemo(
    () =>
      Array.isArray(local.recommended_products) && local.recommended_products.length
        ? local.recommended_products.map((r) => r.label ?? r.product ?? String(r.raw ?? "")).join(", ")
        : "",
    [local.recommended_products]
  );

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
    }));

  const validateNumbers = (): boolean => {
    const nums = [
      ["client_score", local.client_score],
      ["estimated_budget", local.estimated_budget],
      ["total_capital_assured", (local as any).total_capital_assured],
      ["total_premiums_paid", (local as any).total_premiums_paid],
      ["recommendation_count", (local as any).recommendation_count],
    ] as const;
    for (const [k, v] of nums) {
      if (v !== undefined && v !== null && v !== "" && Number.isNaN(Number(v))) return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validateNumbers()) return alert("Numeric fields must be valid numbers");
    setSaving(true);
    try {
      const normalized: ClientMoral = {
        ...local,
        client_score: local.client_score === "" || local.client_score === null || local.client_score === undefined ? undefined : Number(local.client_score),
        estimated_budget:
          local.estimated_budget === "" || local.estimated_budget === null || local.estimated_budget === undefined ? undefined : Number(local.estimated_budget),
        total_capital_assured:
          (local as any).total_capital_assured === "" || (local as any).total_capital_assured == null ? undefined : Number((local as any).total_capital_assured),
        total_premiums_paid:
          (local as any).total_premiums_paid === "" || (local as any).total_premiums_paid == null ? undefined : Number((local as any).total_premiums_paid),
        recommendation_count:
          (local as any).recommendation_count === "" || (local as any).recommendation_count == null ? undefined : Number((local as any).recommendation_count),
        recommended_products: Array.isArray(local.recommended_products) ? local.recommended_products : [],
      };
      onUpdate(normalized);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose}>
      <div className="flex flex-col h-[80vh] w-full max-w-2xl">
        {/* header */}
        <div className="flex items-center justify-between mb-2 border-b pb-2 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-red-600">Client Moral</h2>
          <button onClick={onClose} className="px-2 py-1 rounded hover:bg-gray-100">✕</button>
        </div>

        {/* scrollable body */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ref" value={local.ref_personne ?? "—"} />
            <Field label="Type" value={local.type ?? "moral"} />
            <Input label="Raison sociale" value={local.raison_sociale ?? ""} onChange={(v) => setField("raison_sociale", v)} />
            <Input label="Client score" value={String(local.client_score ?? "")} onChange={(v) => setField("client_score" as any, v === "" ? undefined : Number(v))} type="number" />
            <Input label="Segment" value={local.client_segment ?? ""} onChange={(v) => setField("client_segment" as any, v)} />
            <Input label="Risk profile" value={local.risk_profile ?? ""} onChange={(v) => setField("risk_profile" as any, v)} />
            <Input label="Estimated budget" value={String(local.estimated_budget ?? "")} onChange={(v) => setField("estimated_budget" as any, v === "" ? undefined : Number(v))} type="number" />
            <Input label="Recommendation count" value={String((local as any).recommendation_count ?? "")} onChange={(v) => setField("recommendation_count" as any, v === "" ? undefined : Number(v))} type="number" />
            <Input label="Total capital assured" value={String((local as any).total_capital_assured ?? "")} onChange={(v) => setField("total_capital_assured" as any, v === "" ? undefined : Number(v))} type="number" />
            <Input label="Total premiums paid" value={String((local as any).total_premiums_paid ?? "")} onChange={(v) => setField("total_premiums_paid" as any, v === "" ? undefined : Number(v))} type="number" />
            <Field label="Last contact" value={String(local.lastContact ?? "—")} />
            <div className="col-span-2">
              <label className="text-xs text-gray-500">Recommended products</label>
              <input
                className="mt-1 w-full border rounded px-2 py-1 text-sm"
                value={recsString}
                onChange={(e) => setRecsFromString(e.target.value)}
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-gray-500">Messages (readonly)</label>
              <textarea className="mt-1 w-full border rounded px-2 py-1 text-sm h-24" readOnly value={Array.isArray(local.messages) ? local.messages.join("\n") : String(local.messages ?? "")} />
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="flex justify-end gap-2 mt-3 border-t pt-2 sticky bottom-0 bg-white z-10">
          <button onClick={handleSave} disabled={saving} className="bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700 disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
          <button onClick={onClose} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Cancel</button>
        </div>
      </div>
    </Modal>
  );
}

/* small helpers */
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border rounded px-2 py-1">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm">{value ?? "—"}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <input className="mt-1 w-full border rounded px-2 py-1 text-sm" value={value} onChange={(e) => onChange(e.target.value)} type={type} />
    </div>
  );
}
