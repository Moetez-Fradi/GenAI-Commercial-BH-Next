// src/components/HistoryTable.tsx
import { useState } from "react";
import type { Client, Recommendation, SentMessage } from "../types/client";
import MessagesModal from "./MessagesModal";

interface Props {
  history: Client[];
}

export default function HistoryTable({ history }: Props) {
  const [selected, setSelected] = useState<{
    client: Client;
    recommendation: Recommendation;
  } | null>(null);

  const latestDateForClient = (c: Client) => {
    const allMsgs: SentMessage[] = (c.recommended_products ?? [])
      .flatMap((r: any) => (typeof r === "string" ? [] : (r.messages ?? [])));
    if (!allMsgs.length) return "-";
    const latest = allMsgs.reduce((a, b) => (new Date(a.sentAt) > new Date(b.sentAt) ? a : b));
    return new Date(latest.sentAt).toLocaleString();
  };

  return (
    <div className="overflow-x-auto bg-white shadow rounded-lg">
      <table className="w-full text-left">
        <thead className="bg-red-600 text-white">
          <tr>
            <th className="p-2">Ref</th>
            <th className="p-2">Name</th>
            <th className="p-2">Rank</th>
            <th className="p-2">Recommendations</th>
            <th className="p-2">Date</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {history.map((c) => (
            <tr key={c.ref_personne} className="border-t hover:bg-gray-50">
              <td className="p-2 font-mono">{c.ref_personne}</td>
              <td className="p-2 font-semibold">{("name" in c ? c.name : (c as any).raison_sociale)}</td>
              <td className="p-2">{c.rank ?? "-"}</td>

              <td className="p-2">
                {(c.recommended_products ?? []).map((r: any, i: number) => {
                  if (typeof r === "string") {
                    return <div key={i} className="mb-1">{r}</div>;
                  }
                  return (
                    <div key={i} className="mb-2 flex justify-between items-center">
                      <div>
                        <span className="font-medium">{r.product}</span>{" "}
                        <span className="ml-2 px-2 py-0.5 rounded text-xs bg-gray-100">{r.status}</span>
                        <span className="ml-2 text-sm text-gray-500">{(r.contacts ?? []).join(" & ")}</span>
                      </div>
                    </div>
                  );
                })}
              </td>

              <td className="p-2">{latestDateForClient(c)}</td>

              <td className="p-2">
                {(c.recommended_products ?? []).map((r: any, idx: number) => {
                  if (typeof r === "string") return null;
                  return (
                    <button
                      key={idx}
                      className="px-3 py-1 bg-gray-900 text-white rounded mr-2 mb-2 hover:bg-gray-700 text-sm"
                      onClick={() => setSelected({ client: c, recommendation: r })}
                    >
                      View Messages ({r.product})
                    </button>
                  );
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <MessagesModal
          client={selected.client}
          recommendation={selected.recommendation}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}