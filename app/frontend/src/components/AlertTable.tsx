"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { SlidersHorizontal, X, User, Building } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import AlertDetailsPopup from "./AlertDetailsPopup"

interface AlertTableProps {
  title: string
  alerts: any[]
  onUpdateAlert: (alert: any) => void
}

interface ClientDetails {
  type: "moral" | "physical" | null
  name: string
  segment?: string
  riskProfile?: string
  isLoading: boolean
  score?: number
  age?: number
  profession?: string
  familySituation?: string
  activitySector?: string
  estimatedBudget?: number
}

export default function AlertTable({ title, alerts, onUpdateAlert }: AlertTableProps) {
  const [selected, setSelected] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [loadingFilter, setLoadingFilter] = useState(false)
  const [filtered, setFiltered] = useState(null)
  const [clientDetailsMap, setClientDetailsMap] = useState<{ [key: string]: ClientDetails }>({})

  const [alertType, setAlertType] = useState("")
  const [product, setProduct] = useState("")
  const [sortBy, setSortBy] = useState("expiry")
  const [sortDir, setSortDir] = useState("asc")

  const { token } = useAuth()
  const BACKEND = import.meta.env.VITE_BACKEND_LINK?.replace(/\/$/, "") ?? ""

  const fetchClientDetails = async (refPersonne: string) => {
    if (clientDetailsMap[refPersonne]) return

    setClientDetailsMap((prev) => ({
      ...prev,
      [refPersonne]: { type: null, name: "Loading...", isLoading: true },
    }))

    try {
      const res = await fetch(`${BACKEND}/clients/${refPersonne}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (res.ok) {
        const data = await res.json()

        if (data.type === "moral") {
          setClientDetailsMap((prev) => ({
            ...prev,
            [refPersonne]: {
              type: "moral",
              name: data.data.RAISON_SOCIALE || `Client ${refPersonne}`,
              segment: data.data.client_segment,
              riskProfile: data.data.risk_profile,
              score: data.data.client_score,
              isLoading: false,
            },
          }))
        } else if (data.type === "physical") {
          setClientDetailsMap((prev) => ({
            ...prev,
            [refPersonne]: {
              type: "physical",
              name: data.data.name || data.data.NOM_PRENOM || `Client ${refPersonne}`,
              segment: data.data.client_segment,
              riskProfile: data.data.risk_profile,
              score: data.data.client_score,
              age: data.data.AGE,
              profession: data.data.PROFESSION_GROUP,
              familySituation: data.data.SITUATION_FAMILIALE,
              activitySector: data.data.SECTEUR_ACTIVITE_GROUP,
              isLoading: false,
            },
          }))
        }
      } else {
        setClientDetailsMap((prev) => ({
          ...prev,
          [refPersonne]: {
            type: null,
            name: "Client not found",
            isLoading: false,
          },
        }))
      }
    } catch (error) {
      console.error("Error fetching client details:", error)
      setClientDetailsMap((prev) => ({
        ...prev,
        [refPersonne]: {
          type: null,
          name: "Error loading",
          isLoading: false,
        },
      }))
    }
  }

  // Fetch client details for all alerts
  useEffect(() => {
    const rows = filtered ?? alerts ?? []
    rows.forEach((alert) => {
      if (alert.ref_personne && !clientDetailsMap[alert.ref_personne]) {
        fetchClientDetails(alert.ref_personne)
      }
    })
  }, [alerts, filtered])

  const clearFilters = () => {
    setAlertType("")
    setProduct("")
    setSortBy("expiry")
    setSortDir("asc")
    setFiltered(null)
  }

  const applyFilters = async () => {
    try {
      setLoadingFilter(true)
      const params = new URLSearchParams()
      params.set("limit", "10")
      params.set("offset", "0")
      params.set("sort_by", sortBy)
      params.set("sort_dir", sortDir)

      if (alertType) params.append("alert_type", alertType)
      if (product) params.append("product", product)

      const res = await fetch(`${BACKEND}/alerts?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!res.ok) throw new Error(`Filter request failed: ${res.status}`)

      const json = await res.json()
      const items = (json?.items ?? []).map((it: any) => ({ ...it, type: "alert" }))
      setFiltered(items)
      setShowFilters(false)
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : "Failed to apply filters")
    } finally {
      setLoadingFilter(false)
    }
  }

  const rows = filtered ?? alerts ?? []

  const alertTypes = useMemo(() => {
    const types = new Set(alerts.map((a) => a.alert_type).filter(Boolean))
    return Array.from(types).sort()
  }, [alerts])

  const products = useMemo(() => {
    const prods = new Set(alerts.map((a) => a.product).filter(Boolean))
    return Array.from(prods).sort()
  }, [alerts])

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-purple-600 to-cyan-600">
        <h3 className="font-semibold text-lg text-white">{title}</h3>
        <div className="flex items-center gap-3">
          {filtered && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={clearFilters}
              className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 text-white text-sm"
            >
              Clear
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilters((s) => !s)}
            className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 text-white text-sm flex items-center gap-2"
          >
            <SlidersHorizontal size={16} /> Filters
          </motion.button>
        </div>
      </div>

      {showFilters && (
        <div className="px-6 py-5 border-b border-white/10 bg-white/5 backdrop-blur-lg">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-white/70">Sort By</label>
              <select
                className="text-sm bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="expiry">Days Until Expiry</option>
                <option value="ref">Reference</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-white/70">Direction</label>
              <select
                className="text-sm bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300"
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value)}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-white/70">Alert Type</label>
              <select
                className="text-sm bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300"
                value={alertType}
                onChange={(e) => setAlertType(e.target.value)}
              >
                <option value="">All Types</option>
                {alertTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-white/70">Product</label>
              <select
                className="text-sm bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
              >
                <option value="">All Products</option>
                {products.map((prod) => (
                  <option key={prod} value={prod}>
                    {prod}
                  </option>
                ))}
              </select>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 text-white text-sm flex items-center gap-2"
              >
                <X size={16} /> Close
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={applyFilters}
                disabled={loadingFilter}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-700 hover:to-cyan-700 disabled:opacity-50 transition-all duration-300 text-sm shadow-lg"
              >
                {loadingFilter ? "Applying..." : "Apply"}
              </motion.button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-hidden">
        <table className="w-full table-fixed text-left">
          <thead className="bg-white/5 text-white/70 text-sm uppercase font-medium border-b border-white/10">
            <tr>
              <th className="p-4 w-20">Ref</th>
              <th className="p-4 w-48">Alert Type</th>
              <th className="p-4">Message</th>
              <th className="p-4 w-48">Client Details</th>
              <th className="p-4 w-24">Severity</th>
              <th className="p-4 w-36">Product</th>
              <th className="p-4 w-24">Days Left</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((alert) => {
              const clientDetails = clientDetailsMap[alert.ref_personne] || {
                type: null,
                name: "Loading...",
                isLoading: true,
              }

              return (
                <motion.tr
                  key={alert.ref_personne}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                  className="border-b border-white/10 cursor-pointer transition-all duration-300"
                  onClick={() => setSelected(alert)}
                >
                  <td className="p-4 align-top font-medium text-purple-400">{alert.ref_personne}</td>
                  <td className="p-4 font-medium align-top text-white">{alert.alert_type}</td>
                  <td className="p-4 align-top text-sm text-white/70">{alert.alert_message}</td>
                  <td className="p-4 align-top">
                    <div className="flex items-start gap-3">
                      {clientDetails.type === "moral" ? (
                        <Building size={18} className="text-cyan-400 flex-shrink-0 mt-1" />
                      ) : clientDetails.type === "physical" ? (
                        <User size={18} className="text-purple-400 flex-shrink-0 mt-1" />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm text-white truncate">{clientDetails.name}</div>

                        {clientDetails.segment && (
                          <div className="text-xs text-white/50">Segment: {clientDetails.segment}</div>
                        )}

                        {clientDetails.riskProfile && (
                          <div className="text-xs text-white/50">Risk: {clientDetails.riskProfile}</div>
                        )}

                        {clientDetails.score !== undefined && clientDetails.score !== null && (
                          <div className="text-xs text-white/50">Score: {Math.round(Number(clientDetails.score))}</div>
                        )}

                        {/* Additional details for physical clients */}
                        {clientDetails.type === "physical" && clientDetails.age && (
                          <div className="text-xs text-white/50">Age: {clientDetails.age}</div>
                        )}

                        {clientDetails.type === "physical" && clientDetails.profession && (
                          <div className="text-xs text-white/50">Profession: {clientDetails.profession}</div>
                        )}

                        {clientDetails.type === "physical" && clientDetails.familySituation && (
                          <div className="text-xs text-white/50">Family: {clientDetails.familySituation}</div>
                        )}

                        {clientDetails.type === "physical" && clientDetails.activitySector && (
                          <div className="text-xs text-white/50">Sector: {clientDetails.activitySector}</div>
                        )}

                        {/* Additional details for moral clients if needed */}
                        {clientDetails.type === "moral" && clientDetails.estimatedBudget && (
                          <div className="text-xs text-white/50">
                            Budget: {Math.round(Number(clientDetails.estimatedBudget))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium bg-white/10 border border-white/20 text-white/90 backdrop-blur-sm">
                      {alert.alert_severity}
                    </span>
                  </td>
                  <td className="p-4 align-top text-white/70">{alert.product || "—"}</td>
                  <td className="p-4 align-top">
                    {alert.days_until_expiry !== undefined ? (
                      <span
                        className={`font-medium ${
                          alert.days_until_expiry <= 7
                            ? "text-red-400"
                            : alert.days_until_expiry <= 30
                              ? "text-orange-400"
                              : "text-emerald-400"
                        }`}
                      >
                        {alert.days_until_expiry}
                      </span>
                    ) : (
                      <span className="text-white/40">—</span>
                    )}
                  </td>
                </motion.tr>
              )
            })}

            {!rows.length && (
              <tr>
                <td className="p-8 text-center text-white/40" colSpan={7}>
                  No alerts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <AlertDetailsPopup
          alert={selected}
          onClose={() => setSelected(null)}
          onUpdate={(u) => {
            onUpdateAlert(u)
            setSelected(u)
          }}
        />
      )}
    </div>
  )
}