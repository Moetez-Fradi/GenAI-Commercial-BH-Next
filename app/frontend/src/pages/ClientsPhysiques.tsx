// src/pages/Clients.tsx
import { useState, useEffect } from "react";
import ClientTable from "../components/ClientTable";
import { useAuth } from "../context/AuthContext";
import type { ClientPhysique } from "../types/client";

export default function Clients() {
  const [physiques, setPhysiques] = useState<ClientPhysique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // pagination state
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 10;

  const { token } = useAuth();

  // case-insensitive helper to pick the first present property
  const getVal = (obj: any, keys: string[]) => {
    if (!obj) return undefined;
    const map = Object.keys(obj).reduce<Record<string, any>>((acc, k) => {
      acc[k.toLowerCase()] = obj[k];
      return acc;
    }, {});
    for (const k of keys) {
      const v = map[k.toLowerCase()];
      if (v !== undefined && v !== null) return v;
    }
    return undefined;
  };

  const fetchClients = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL(`${import.meta.env.VITE_BACKEND_LINK}/clients/physique`);
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("offset", String(offset));
      url.searchParams.set("include_total", "false");

      const res = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Failed to fetch clients");
      }

      const json = await res.json();
      const items: any[] = json.items ?? [];

      // Map backend objects to ClientPhysique more robustly
      const mapped: ClientPhysique[] = items.map((it: any) => {
        const ref = getVal(it, ["REF_PERSONNE", "ref_personne", "ref", "id"]) ?? "";
        const name = getVal(it, ["NOM_PRENOM", "name", "nom_prenom", "full_name"]) ?? "";

        const rawRecs = getVal(it, ["recommended_products", "recommendedProducts", "recommended", "recommendations"]) ?? [];
        const recommended_products =
          Array.isArray(rawRecs) && rawRecs.length
            ? rawRecs.map((rp: any) => ({
                product: rp?.product ?? rp?.label ?? rp?.product_id ?? null,
                label: rp?.label ?? rp?.product ?? null,
                score: rp?.score !== undefined && rp?.score !== null ? Number(rp.score) : null,
                raw: rp,
              }))
            : [];

        const rank = getVal(it, ["rank", "RANK"]);
        const clientScore = getVal(it, ["client_score", "score", "SCORE", "clientScore"]);
        const clientSegment = getVal(it, ["client_segment", "segment", "CLIENT_SEGMENT"]);
        const riskProfile = getVal(it, ["risk_profile", "riskProfile", "RISK_PROFILE"]);
        const estimatedBudget = getVal(it, ["estimated_budget", "estimatedBudget", "budget_estime"]);

        const age = getVal(it, ["AGE", "age"]);
        const profession_group = getVal(it, ["PROFESSION_GROUP", "profession_group", "professionGroup"]);
        const situation_familiale = getVal(it, ["SITUATION_FAMILIALE", "situation_familiale", "situationFamiliale"]);
        const secteur_activite = getVal(it, ["SECTEUR_ACTIVITE_GROUP", "secteur_activite", "secteur_activite_group"]);

        const city = getVal(it, ["city", "ville", "adresse_ville"]);
        const phone = getVal(it, ["phone", "telephone", "tele", "mobile"]);
        const email = getVal(it, ["email", "courriel", "mail"]);
        const lastContact = getVal(it, ["lastContact", "last_contact", "lastcontact"]);
        const messages = getVal(it, ["messages", "Messages"]) ?? [];

        return {
          ref_personne: String(ref),
          type: "physique",
          name: String(name || `Ref ${ref}`),

          // ranking / scoring
          rank: rank !== undefined && rank !== null ? Number(rank) : undefined,
          score: clientScore !== undefined && clientScore !== null ? Number(clientScore) : undefined,
          segment: clientSegment ?? undefined,
          risk_profile: riskProfile ?? undefined,
          estimated_budget:
            estimatedBudget !== undefined && estimatedBudget !== null ? Number(estimatedBudget) : undefined,

          // demographics
          age: age !== undefined && age !== null ? Number(age) : undefined,
          profession_group: profession_group ?? undefined,
          situation_familiale: situation_familiale ?? undefined,
          secteur_activite: secteur_activite ?? undefined,

          // contact
          city: city ?? undefined,
          phone: phone ?? undefined,
          email: email ?? undefined,

          // relations
          recommended_products,
          lastContact: lastContact ?? undefined,
          messages: Array.isArray(messages) ? messages : [],
        };
      });

      setPhysiques(mapped);
      console.log("Fetched physiques:", mapped);
      setHasMore(Boolean(json.has_more) || false);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, token]);

  const updateClient = (u: ClientPhysique) =>
    setPhysiques((prev) => prev.map((c) => (c.ref_personne === u.ref_personne ? u : c)));

  const markMessaged = (ref: string) =>
    setPhysiques((prev) =>
      prev.map((c) => (c.ref_personne === ref ? { ...c, lastContact: "whatsapp" } : c))
    );

  if (loading) return <p>Loading clients...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-red-600">Clients Physiques</h1>
      <ClientTable
        title="Clients Physiques"
        clients={physiques}
        onUpdateClient={updateClient}
        onMessageSent={markMessaged}
      />

      {/* Pagination controls */}
      <div className="flex justify-between items-center mt-4">
        <button
          disabled={offset === 0}
          onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
          className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
        >
          ← Previous
        </button>
        <button
          disabled={!hasMore}
          onClick={() => setOffset((prev) => prev + limit)}
          className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
