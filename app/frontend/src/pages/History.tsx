"use client"

import { useEffect, useState } from "react"
import HistoryTable from "../components/HistoryTable"
import type { HistoryEntry } from "../types/history"
import { motion } from "framer-motion"
import { RefreshCw } from "lucide-react"

export default function History() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_LINK}/history/`)
      if (!res.ok) throw new Error("Failed to fetch history")
      const data = await res.json()
      setHistory(data)
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading history...</span>
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
        <p className="text-destructive font-medium">Error loading history</p>
        <p className="text-destructive/80 text-sm mt-1">{error}</p>
        <button
          onClick={fetchHistory}
          className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors text-sm font-medium"
        >
          Try Again
        </button>
      </motion.div>
    )
  }

  if (!loading && history.length === 0) {
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">No History</h3>
          <p className="text-green-700 text-sm">
            No history entries found. Activity will appear here once actions are performed.
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <HistoryTable entries={history} />
    </motion.div>
  )
}