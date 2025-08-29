import type { Client } from "../types/client";
import { imputeClientData } from "../api/clients";
import { useState } from "react";

interface Props {
  client: Client;
  onClose: () => void;
  onUpdate: (updated: Client) => void;
}

export default function ClientDetailsPopup({ client, onClose, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const [local, setLocal] = useState<Client>({ ...client });

  const handleImpute = async () => {
    setLoading(true);
    try {
      const filled = await imputeClientData(local);
      setLocal(filled);
      onUpdate(filled);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl p-6 w-[min(680px,92vw)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Client Details</h2>
          <button onClick={onClose} className="px-2 py-1 rounded hover:bg-gray-100">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Info label="Ref" value={local.ref_personne} />
          <Info label="Type" value={local.type} />
          <Info label="Name" value={local.name} />
          <Info label="Rank" value={String(local.rank)} />
          <Info label="Status" value={local.status} />
          <Info label="CIN" value={local.cin ?? "—"} />
          <Info label="Age" value={local.age?.toString() ?? "—"} />
          <Info label="City" value={local.city ?? "—"} />
          <Info label="Phone" value={local.phone ?? "—"} />
          <Info label="Email" value={local.email ?? "—"} />
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={handleImpute}
            disabled={loading}
            className="bg-neutral-800 text-white px-4 py-2 rounded hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Imputing..." : "Impute"}
          </button>
          <button
            onClick={onClose}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-lg px-3 py-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}