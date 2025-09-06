"use client"

import { useState, useEffect } from "react"
import AlertTable from "../components/AlertTable"
import { useAuth } from "../context/AuthContext"
import type { Alert } from "../types/client"
import { motion } from "framer-motion"
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // pagination state
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 10

  const { token } = useAuth()

  const fetchAlerts = async () => {
    setLoading(true)
    setError(null)

    try {
      const url = new URL(`${import.meta.env.VITE_BACKEND_LINK}/alerts`)
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
        throw new Error(data?.detail || "Failed to fetch alerts")
      }

      const json = await res.json()
      const items: any[] = json.items ?? []

      // Map backend objects to Alert
      const mapped: Alert[] = items.map((it: any) => {
        const ref = it.REF_PERSONNE ?? it.ref_personne ?? ""

        return {
          ref_personne: String(ref),
          type: "alert",
          alert_type: it.alert_type ?? "",
          alert_message: it.alert_message ?? "",
          alert_severity: it.alert_severity ?? "High",
          product: it.product ?? undefined,
          expiration_date: it.expiration_date ?? undefined,
          days_until_expiry: it.days_until_expiry ?? undefined,
        }
      })

      setAlerts(mapped)
      setHasMore(Boolean(json.has_more) || false)
    } catch (err: any) {
      setError(err?.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, token])

  const updateAlert = (u: Alert) => setAlerts((prev) => prev.map((a) => (a.ref_personne === u.ref_personne ? u : a)))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading alerts...</span>
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
        <p className="text-destructive font-medium">Error loading alerts</p>
        <p className="text-destructive/80 text-sm mt-1">{error}</p>
        <button
          onClick={fetchAlerts}
          className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors text-sm font-medium"
        >
          Try Again
        </button>
      </motion.div>
    )
  }

  if (!loading && alerts.length === 0) {
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">No Alerts</h3>
          <p className="text-green-700 text-sm">
            No alerts found. Important notifications will appear here when available.
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <AlertTable title="Alerts" alerts={alerts} onUpdateAlert={updateAlert} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing {alerts.length} alerts</p>
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