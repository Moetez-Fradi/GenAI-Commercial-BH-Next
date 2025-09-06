"use client"

import { useState, useEffect } from "react"
import ClientTable from "../components/ClientTable"
import { useAuth } from "../context/AuthContext"
import type { ClientPhysique } from "../types/client"
import { motion } from "framer-motion"
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"

export default function Clients() {
  const [physiques, setPhysiques] = useState<ClientPhysique[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // pagination state
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 10

  const { token } = useAuth()

  // case-insensitive helper to pick the first present property
  const getVal = (obj: any, keys: string[]) => {
    if (!obj) return undefined
    const map = Object.keys(obj).reduce<Record<string, any>>((acc, k) => {
      acc[k.toLowerCase()] = obj[k]
      return acc
    }, {})
    for (const k of keys) {
      const v = map[k.toLowerCase()]
      if (v !== undefined && v !== null) return v
    }
    return undefined
  }

  const fetchClients = async () => {
    setLoading(true)
    setError(null)

    try {
      const url = new URL(`${import.meta.env.VITE_BACKEND_LINK}/clients/physique`)
      url.searchParams.set("limit", String(limit))
      url.searchParams.set("offset", String(offset))
      url.searchParams.set("include_total", "false")

      const res = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.detail || "Failed to fetch clients")
      }

      const json = await res.json()
      const items: any[] = json.items ?? []

      // Map backend objects to ClientPhysique more robustly
      const mapped: ClientPhysique[] = items.map((it: any) => {
        const ref = getVal(it, ["REF_PERSONNE", "ref_personne", "ref", "id"]) ?? ""
        const name = getVal(it, ["NOM_PRENOM", "name", "nom_prenom", "full_name"]) ?? ""

        const rawRecs =
          getVal(it, ["recommended_products", "recommendedProducts", "recommended", "recommendations"]) ?? []
        const recommended_products =
          Array.isArray(rawRecs) && rawRecs.length
            ? rawRecs.map((rp: any) => ({
                product: rp?.product ?? rp?.label ?? rp?.product_id ?? null,
                label: rp?.label ?? rp?.product ?? null,
                score: rp?.score !== undefined && rp?.score !== null ? Number(rp.score) : null,
                raw: rp,
              }))
            : []

        const rank = getVal(it, ["rank", "RANK"])
        const clientScore = getVal(it, ["client_score", "score", "SCORE", "clientScore"])
        const clientSegment = getVal(it, ["client_segment", "segment", "CLIENT_SEGMENT"])
        const riskProfile = getVal(it, ["risk_profile", "riskProfile", "RISK_PROFILE"])
        const estimatedBudget = getVal(it, ["estimated_budget", "estimatedBudget", "budget_estime"])

        const age = getVal(it, ["AGE", "age"])
        const profession_group = getVal(it, ["PROFESSION_GROUP", "profession_group", "professionGroup"])
        const situation_familiale = getVal(it, ["SITUATION_FAMILIALE", "situation_familiale", "situationFamiliale"])
        const secteur_activite = getVal(it, ["SECTEUR_ACTIVITE_GROUP", "secteur_activite", "secteur_activite_group"])

        const city = getVal(it, ["city", "ville", "adresse_ville"])
        const phone = getVal(it, ["phone", "telephone", "tele", "mobile"])
        const email = getVal(it, ["email", "courriel", "mail"])
        const lastContact = getVal(it, ["lastContact", "last_contact", "lastcontact"])
        const messages = getVal(it, ["messages", "Messages"]) ?? []

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
        }
      })

      setPhysiques(mapped)
      console.log("Fetched physiques:", mapped)
      setHasMore(Boolean(json.has_more) || false)
    } catch (err: any) {
      setError(err?.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, token])

  const updateClient = (u: ClientPhysique) =>
    setPhysiques((prev) => prev.map((c) => (c.ref_personne === u.ref_personne ? u : c)))

  const markMessaged = (ref: string) =>
    setPhysiques((prev) => prev.map((c) => (c.ref_personne === ref ? { ...c, lastContact: "whatsapp" } : c)))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading clients...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-destructive/10 border border-destructive/20 rounded-xl p-6"
      >
        <p className="text-destructive font-medium">Error loading clients</p>
        <p className="text-destructive/80 text-sm mt-1">{error}</p>
        <button
          onClick={fetchClients}
          className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors text-sm font-medium"
        >
          Try Again
        </button>
      </motion.div>
    )
  }

  if (!loading && physiques.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">No Individual Clients</h3>
          <p className="text-green-700 text-sm">
            No individual clients found. They will appear here once added to the system.
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <ClientTable
        title="Individual Clients"
        clients={physiques}
        onUpdateClient={updateClient}
        onMessageSent={markMessaged}
      />

      {/* Pagination controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing {physiques.length} clients</p>
        <div className="flex items-center gap-2">
          <button
            disabled={offset === 0}
            onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
            className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/10 transition-colors text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <button
            disabled={!hasMore}
            onClick={() => setOffset((prev) => prev + limit)}
            className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/10 transition-colors text-sm font-medium"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}