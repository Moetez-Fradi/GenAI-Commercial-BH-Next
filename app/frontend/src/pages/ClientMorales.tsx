import { useState, useEffect } from "react"
import ClientTable from "../components/ClientTable"
import { useAuth } from "../context/AuthContext"
import type { ClientMoral } from "../types/client"
import { motion } from "framer-motion"
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"

export default function Clients() {
  const [morales, setMorales] = useState<ClientMoral[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // pagination state
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 10

  const { token } = useAuth()

  const fetchClients = async () => {
    setLoading(true)
    setError(null)

    try {
      const url = new URL(`${import.meta.env.VITE_BACKEND_LINK}/clients/morale`)
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

      // Map backend objects to ClientMoral
      const mapped: ClientMoral[] = items.map((it: any) => {
        const ref = it.REF_PERSONNE ?? it.ref_personne ?? ""
        const raison = it.RAISON_SOCIALE ?? it.raison_sociale ?? ""

        // normalize recommended_products: keep strings, convert objects to { product, label, score, raw }
        const recommended_products: (
          | string
          | {
              product?: string | null
              label?: string | null
              score?: number | null
              raw?: any
            }
        )[] = Array.isArray(it.recommended_products)
          ? it.recommended_products.map((rp: any) => {
              if (typeof rp === "string") return rp

              return {
                product: rp.product ?? rp.product_id ?? rp.label ?? rp.product_name ?? undefined,
                label: rp.label ?? undefined,
                score: rp.score !== undefined && rp.score !== null ? Number(rp.score) : undefined,
                raw: rp,
              }
            })
          : []

        // optional messages mapping (light normalization)
        const messages =
          Array.isArray(it.messages) && it.messages.length
            ? it.messages.map((m: any) => ({
                id: String(m.id ?? m.message_id ?? Math.random()),
                clientRef: String(ref),
                channel: (m.channel ?? m.channel_type ?? undefined) as any,
                content: m.content ?? m.body ?? "",
                sentAt: m.sentAt ?? m.sent_at ?? new Date().toISOString(),
              }))
            : undefined

        return {
          ref_personne: String(ref),
          type: "moral",
          raison_sociale: raison,
          recommended_products,
          recommendation_count: it.recommendation_count ?? 0,
          client_score: it.client_score !== undefined && it.client_score !== null ? Number(it.client_score) : undefined,
          client_segment: it.client_segment ?? undefined,
          risk_profile: it.risk_profile ?? undefined,
          estimated_budget:
            it.estimated_budget !== undefined && it.estimated_budget !== null ? Number(it.estimated_budget) : undefined,
          total_capital_assured:
            it.total_capital_assured !== undefined && it.total_capital_assured !== null
              ? Number(it.total_capital_assured)
              : undefined,
          total_premiums_paid:
            it.total_premiums_paid !== undefined && it.total_premiums_paid !== null
              ? Number(it.total_premiums_paid)
              : undefined,
          lastContact: it.lastContact ?? it.last_contact ?? undefined,
          messages,
        }
      })

      setMorales(mapped)
      console.log("Fetched morales:", mapped)
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

  const updateClient = (u: ClientMoral) =>
    setMorales((prev) => prev.map((c) => (c.ref_personne === u.ref_personne ? u : c)))

  const markMessaged = (ref: string) =>
    setMorales((prev) => prev.map((c) => (c.ref_personne === ref ? { ...c, lastContact: "whatsapp" } : c)))

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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <ClientTable
        title="Corporate Clients"
        clients={morales}
        onUpdateClient={updateClient}
        onMessageSent={markMessaged}
      />

      {/* Pagination controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing {morales.length} clients</p>
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