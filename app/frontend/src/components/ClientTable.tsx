"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Star,
  TrendingUp,
  MessageCircle,
  MoreHorizontal,
  Eye,
  Users,
} from "lucide-react"

interface ClientTableProps {
  title: string
  clients: any[]
  onUpdateClient: (client: any) => void
  onMessageSent: (ref: string) => void
}

export default function ClientTable({ title, clients, onUpdateClient, onMessageSent }: ClientTableProps) {
  const [selectedClient, setSelectedClient] = useState<any>(null)

  const getClientIcon = (client: any) => {
    return client.type === "physique" ? User : Building2
  }

  const getClientName = (client: any) => {
    return client.type === "physique" ? client.name : client.raison_sociale
  }

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case "low":
        return "text-primary bg-primary/10"
      case "medium":
        return "text-chart-2 bg-chart-2/10"
      case "high":
        return "text-destructive bg-destructive/10"
      default:
        return "text-muted-foreground bg-muted"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-primary"
    if (score >= 60) return "text-chart-2"
    return "text-destructive"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground">Manage and track your client relationships</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{clients.length} clients</span>
        </div>
      </div>

      {/* Client Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client, index) => {
          const Icon = getClientIcon(client)
          const name = getClientName(client)

          return (
            <motion.div
              key={client.ref_personne}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-200 group"
            >
              {/* Client Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{name}</h3>
                    <p className="text-sm text-muted-foreground">#{client.ref_personne}</p>
                  </div>
                </div>
                <button className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-all">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              {/* Client Stats */}
              <div className="space-y-3 mb-4">
                {client.score && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Score</span>
                    <div className="flex items-center gap-2">
                      <Star className={`w-4 h-4 ${getScoreColor(client.score)}`} />
                      <span className={`font-medium ${getScoreColor(client.score)}`}>{client.score}%</span>
                    </div>
                  </div>
                )}

                {client.risk_profile && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Risk</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(client.risk_profile)}`}>
                      {client.risk_profile}
                    </span>
                  </div>
                )}

                {client.estimated_budget && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Budget</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-chart-2" />
                      <span className="font-medium text-foreground">${client.estimated_budget.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.city && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{client.city}</span>
                  </div>
                )}
              </div>

              {/* Recommended Products */}
              {client.recommended_products && client.recommended_products.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Recommended Products</p>
                  <div className="flex flex-wrap gap-1">
                    {client.recommended_products.slice(0, 2).map((product: any, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                        {typeof product === "string" ? product : product.product || product.label}
                      </span>
                    ))}
                    {client.recommended_products.length > 2 && (
                      <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                        +{client.recommended_products.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <button
                  onClick={() => setSelectedClient(client)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={() => onMessageSent(client.ref_personne)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Empty State */}
      {clients.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No clients found</h3>
          <p className="text-muted-foreground">Start by adding your first client to the system.</p>
        </div>
      )}

      {/* Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground">{getClientName(selectedClient)}</h3>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <pre className="text-sm text-muted-foreground bg-muted p-4 rounded-lg overflow-auto">
                {JSON.stringify(selectedClient, null, 2)}
              </pre>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}