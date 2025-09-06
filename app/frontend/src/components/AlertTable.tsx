"use client"

import { useEffect, useMemo, useState } from "react"
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
      alert(err?.message ?? "Failed to apply filters")
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
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="flex items-center gap-2">
          {filtered && (
            <button
              onClick={clearFilters}
              className="text-xs px-3 py-1 rounded bg-white/20 hover:bg-white/30 transition"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="text-xs px-3 py-1 rounded bg-white/20 hover:bg-white/30 transition flex items-center gap-1"
          >
            <SlidersHorizontal size={14} /> Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="px-5 py-4 border-b bg-gray-50">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-gray-600 mb-1">Sort By</label>
              <select
                className="text-sm border rounded px-2 py-1"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="expiry">Days Until Expiry</option>
                <option value="ref">Reference</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-600 mb-1">Direction</label>
              <select
                className="text-sm border rounded px-2 py-1"
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value)}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-600 mb-1">Alert Type</label>
              <select
                className="text-sm border rounded px-2 py-1"
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
            <div className="flex flex-col">
              <label className="text-xs text-gray-600 mb-1">Product</label>
              <select
                className="text-sm border rounded px-2 py-1"
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
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setShowFilters(false)}
                className="px-3 py-1 text-sm rounded border bg-white hover:bg-gray-100 flex items-center gap-1"
              >
                <X size={14} /> Close
              </button>
              <button
                onClick={applyFilters}
                disabled={loadingFilter}
                className="px-3 py-1 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
              >
                {loadingFilter ? "Applying..." : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-hidden">
        <table className="w-full table-fixed text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
            <tr>
              <th className="p-3 w-20">Ref</th>
              <th className="p-3 w-48">Alert Type</th>
              <th className="p-3">Message</th>
              <th className="p-3 w-48">Client Details</th>
              <th className="p-3 w-24">Severity</th>
              <th className="p-3 w-36">Product</th>
              <th className="p-3 w-24">Days Left</th>
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
                <tr
                  key={alert.ref_personne}
                  className="border-b hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => setSelected(alert)}
                >
                  <td className="p-3 align-top">{alert.ref_personne}</td>
                  <td className="p-3 font-medium align-top">{alert.alert_type}</td>
                  <td className="p-3 align-top text-sm">{alert.alert_message}</td>
                  <td className="p-3 align-top">
                    <div className="flex items-center gap-2">
                      {clientDetails.type === "moral" ? (
                        <Building size={16} className="text-blue-600 flex-shrink-0" />
                      ) : clientDetails.type === "physical" ? (
                        <User size={16} className="text-green-600 flex-shrink-0" />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{clientDetails.name}</div>

                        {clientDetails.segment && (
                          <div className="text-xs text-gray-500">Segment: {clientDetails.segment}</div>
                        )}

                        {clientDetails.riskProfile && (
                          <div className="text-xs text-gray-500">Risk: {clientDetails.riskProfile}</div>
                        )}

                        {clientDetails.score !== undefined && clientDetails.score !== null && (
                          <div className="text-xs text-gray-500">Score: {Math.round(Number(clientDetails.score))}</div>
                        )}

                        {/* Additional details for physical clients */}
                        {clientDetails.type === "physical" && clientDetails.age && (
                          <div className="text-xs text-gray-500">Age: {clientDetails.age}</div>
                        )}

                        {clientDetails.type === "physical" && clientDetails.profession && (
                          <div className="text-xs text-gray-500">Profession: {clientDetails.profession}</div>
                        )}

                        {clientDetails.type === "physical" && clientDetails.familySituation && (
                          <div className="text-xs text-gray-500">Family: {clientDetails.familySituation}</div>
                        )}

                        {clientDetails.type === "physical" && clientDetails.activitySector && (
                          <div className="text-xs text-gray-500">Sector: {clientDetails.activitySector}</div>
                        )}

                        {/* Additional details for moral clients if needed */}
                        {clientDetails.type === "moral" && clientDetails.estimatedBudget && (
                          <div className="text-xs text-gray-500">
                            Budget: {Math.round(Number(clientDetails.estimatedBudget))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 align-top">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {alert.alert_severity}
                    </span>
                  </td>
                  <td className="p-3 align-top">{alert.product || "—"}</td>
                  <td className="p-3 align-top">
                    {alert.days_until_expiry !== undefined ? (
                      <span
                        className={`font-medium ${
                          alert.days_until_expiry <= 7
                            ? "text-red-600"
                            : alert.days_until_expiry <= 30
                              ? "text-orange-600"
                              : "text-green-600"
                        }`}
                      >
                        {alert.days_until_expiry}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              )
            })}

            {!rows.length && (
              <tr>
                <td className="p-6 text-center text-gray-400" colSpan={7}>
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