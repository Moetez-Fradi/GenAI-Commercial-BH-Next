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
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 px-6 py-4 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20"
        >
          <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
          <span className="text-white/70 font-medium">Loading alerts...</span>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-xl p-8 shadow-xl"
      >
        <p className="text-red-400 font-medium text-lg mb-2">Error loading alerts</p>
        <p className="text-white/70 text-sm">{error}</p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={fetchAlerts}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 text-sm font-medium shadow-lg flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </motion.button>
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
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8 max-w-md shadow-xl">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 10, stiffness: 100 }}
            className="w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 relative"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-500 to-red-500 opacity-20 blur-xl animate-pulse" />
            <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </motion.div>
          <h3 className="text-xl font-semibold text-white mb-3 bg-gradient-to-r from-yellow-400 to-red-400 bg-clip-text text-transparent">
            No Alerts
          </h3>
          <p className="text-white/70">
            No alerts found. Important notifications will appear here when available.
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-6"
    >
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl overflow-hidden">
        <AlertTable title="Alerts" alerts={alerts} onUpdateAlert={updateAlert} />
      </div>

      <div className="flex items-center justify-between px-4">
        <p className="text-sm text-white/60">Showing {alerts.length} alerts</p>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={offset === 0}
            onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:bg-white/20"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={!hasMore}
            onClick={() => setOffset((prev) => prev + limit)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 rounded-xl shadow-lg"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}