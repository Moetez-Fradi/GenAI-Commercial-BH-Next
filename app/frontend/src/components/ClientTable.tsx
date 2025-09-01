// src/components/ClientTable.tsx (replace table wrapper / rows)
import { useState } from "react";
import PhysicalClientDetailsPopup from "./PhysicalClientDetailsPopup";
import ClientDetailsMoralPopup from "./MoralClientDetailsPopup";
import MessageComposer from "./MessageComposer";
import StatusBadge from "./StatusBadge";
import { Eye, MessageSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { Client, ClientMoral, ClientPhysique, ContactMethod } from "../types/client";

type Props = {
  title: string;
  clients: Client[];
  onUpdateClient: (u: Client) => void;
  onMessageSent: (ref_personne: string) => void;
};

const isPhysique = (c: Client): c is ClientPhysique => c.type === "physique";

type NormRec = {
  product?: string | null;
  label?: string | null;
  score?: number | null;
  raw?: any;
  __key: string;
};

const normalizeRecs = (c: Client): NormRec[] => {
  const raw = (c as any).recommended_products ?? [];
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

export default function ClientTable({ title, clients, onUpdateClient, onMessageSent }: Props) {
  const [selected, setSelected] = useState<Client | null>(null);
  const [msgClient, setMsgClient] = useState<Client | null>(null);

  // NEW: for prefilled generated text and per-row busy state
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);
  const [genBusy, setGenBusy] = useState<string | null>(null); // ref_personne when busy

  const { token } = useAuth(); // use auth context (optional)

  const SYSTEM_PROMPT = import.meta.env.VITE_SYSTEM_PROMPT

  // helper to pick product string from recommendation
  const pickProduct = (recommended?: any) => {
    if (!recommended) return "the recommended product";
    if (typeof recommended === "string") return recommended;
    return recommended.product ?? recommended.label ?? recommended.product_id ?? String(recommended.raw ?? "the recommended product");
  };

  // Build messages array and call backend /llm directly
  const handleGenerate = async (c: Client) => {
    const ref = (c as any).ref_personne;
    try {
      setGenBusy(ref);
      setInitialMessage(undefined);

      // pick first recommended product (if present)
      const firstRec = Array.isArray((c as any).recommended_products) && (c as any).recommended_products.length
        ? (c as any).recommended_products[0]
        : undefined;
      const product = pickProduct(firstRec);

      // include previous messages as assistant context where possible
      const messages: { role: string; content: string }[] = [];
      if (Array.isArray((c as any).messages) && (c as any).messages.length) {
        (c as any).messages.forEach((m: any) => {
          const text = typeof m === "string" ? m : m.content ?? m.body ?? "";
          messages.push({ role: "assistant", content: text });
        });
      }

      // build user instruction
      const who =
        (c as any).type === "physique"
          ? `customer ${(c as any).name ?? ref}`
          : `company ${((c as any).raison_sociale ?? ref)}`;

      const details: string[] = [];

      if (isPhysique(c)) {
        if (c.age) details.push(`age: ${c.age}`);
        if (c.city) details.push(`city: ${c.city}`);
        // use segment / risk_profile as "status" in details
        const status = c.segment ?? c.risk_profile ?? (c as any).status;
        if (status) details.push(`status: ${status}`);
      } else {
        const cm = c as ClientMoral;
        if (cm.client_segment) details.push(`segment: ${cm.client_segment}`);
        if (cm.risk_profile) details.push(`risk: ${cm.risk_profile}`);
      }

      messages.push({
        role: "user",
        content:
          `You are a concise sales assistant. Write a short, friendly commercial pitch (2-3 sentences) proposing "${product}" to ${who}. ` +
          (details.length ? `Customer details: ${details.join(", ")}. ` : "") +
          "Make the tone professional and helpful, include one short call-to-action (CTA), and keep it suitable for WhatsApp or email. " +
          "Return only the pitch text (no extra commentary).",
      });

      const BACKEND = import.meta.env.VITE_BACKEND_LINK?.replace(/\/$/, "") ?? "";
      if (!BACKEND) throw new Error("VITE_BACKEND_LINK is not configured");

      const payload = {
        system_prompt: SYSTEM_PROMPT,
        messages,
        temperature: 1.0,
        max_tokens: 300,
      };

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
      setMsgClient(c); // open composer with prefilled message
    } catch (err: any) {
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
        <button className="text-xs px-3 py-1 rounded bg-white/20 hover:bg-white/30 transition">Filters</button>
      </div>

      {/* prevent horizontal scroll */}
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
            {clients.map((c) => {
              const displayName = isPhysique(c) ? c.name : (c as ClientMoral).raison_sociale ?? `Ref ${c.ref_personne}`;
              const recs = normalizeRecs(c);

              const moralScore =
                !isPhysique(c)
                  ? recs.find((r) => r.score !== undefined && r.score !== null)?.score ??
                    (c as ClientMoral).client_score
                  : undefined;

              // For physique show 'score' primarily (falls back to rank)
              const physScore = isPhysique(c) ? (c as ClientPhysique).score ?? (c as ClientPhysique).rank : undefined;

              const statusForBadge =
                (isPhysique(c) ? ((c as ClientPhysique).segment ?? (c as ClientPhysique).risk_profile ?? (c as ClientPhysique).status) : undefined) ??
                (!isPhysique(c) ? ((c as ClientMoral).client_segment ?? (c as ClientMoral).risk_profile) : undefined);

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
                      <StatusBadge status={statusForBadge as string} />
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

            {!clients.length && (
              <tr>
                <td className="p-6 text-center text-gray-400" colSpan={6}>No clients</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        isPhysique(selected) ? (
          <PhysicalClientDetailsPopup
            client={selected as ClientPhysique}
            onClose={() => setSelected(null)}
            onUpdate={(u: ClientPhysique) => {
              onUpdateClient(u);
              setSelected(u);
            }}
          />
        ) : (
          <ClientDetailsMoralPopup
            client={selected as ClientMoral}
            onClose={() => setSelected(null)}
            onUpdate={(u: ClientMoral) => {
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
          onSent={(_channel: ContactMethod, _content: string) => {
            // preserve parent API: notify that the client was messaged (by ref)
            onMessageSent((msgClient as any).ref_personne);
            setMsgClient(null);
            setInitialMessage(undefined);
          }}
        />
      )}
    </div>
  );
}
