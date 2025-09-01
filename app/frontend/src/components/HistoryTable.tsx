import { useState } from "react";
import type { Client, Recommendation } from "../types/client";
import MessagesModal from "./MessagesModal";

interface Props {
  history: Client[];
}

export default function HistoryTable({ history }: Props) {
  const [selected, setSelected] = useState<{
    client: Client;
    recommendation: Recommendation;
  } | null>(null);

  return (
    <div className="bg-white shadow rounded-2xl overflow-hidden">
      <table className="w-full text-sm text-left text-gray-600">
        <thead className="bg-gradient-to-r from-red-600 to-orange-500 text-white">
          <tr>
            <th className="px-4 py-3">REF</th>
            <th className="px-4 py-3">NAME</th>
            <th className="px-4 py-3">RANK</th>
            <th className="px-4 py-3">RECOMMENDATIONS</th>
            <th className="px-4 py-3">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {history.map((client) => (
            <tr key={client.ref_personne} className="border-t">
              <td className="px-4 py-3 font-mono">{client.ref_personne}</td>
              <td className="px-4 py-3 font-semibold">
                {"name" in client ? client.name : client.raison_sociale}
              </td>
              <td className="px-4 py-3">{client.rank ?? "-"}</td>
              <td className="px-4 py-3 space-y-2">
                {Array.isArray(client.recommended_products) &&
                  client.recommended_products.map((rec, idx) => {
                    if (typeof rec === "string") return null; // legacy
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-gray-50 rounded p-2"
                      >
                        <div>
                          <span className="font-medium">{rec.product}</span>{" "}
                          <span
                            className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                              rec.status === "accepted"
                                ? "bg-green-100 text-green-700"
                                : rec.status === "refused"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {rec.status}
                          </span>
                          {rec.contacts && (
                            <span className="ml-2 text-xs text-gray-500">
                              via {rec.contacts.join(" & ")}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            setSelected({ client, recommendation: rec })
                          }
                          className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700"
                        >
                          View Messages
                        </button>
                      </div>
                    );
                  })}
              </td>
              <td className="px-4 py-3 text-right text-gray-400">—</td>
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