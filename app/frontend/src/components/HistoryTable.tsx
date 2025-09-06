"use client"

import { motion } from "framer-motion"
import { Calendar, Clock, User, Activity } from "lucide-react"

interface HistoryEntry {
  id: string
  action: string
  timestamp: string
  user?: string
  details?: string
}

interface HistoryTableProps {
  entries: HistoryEntry[]
}

export default function HistoryTable({ entries }: HistoryTableProps) {
  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case "login":
      case "logout":
        return User
      case "update":
      case "create":
      case "delete":
        return Activity
      default:
        return Clock
    }
  }

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "create":
        return "text-primary bg-primary/10"
      case "update":
        return "text-chart-2 bg-chart-2/10"
      case "delete":
        return "text-destructive bg-destructive/10"
      case "login":
        return "text-accent bg-accent/10"
      default:
        return "text-muted-foreground bg-muted"
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-xl">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Activity History</h2>
          <p className="text-sm text-muted-foreground">Track all system activities and changes</p>
        </div>
      </div>

      {/* History Timeline */}
      <div className="space-y-4">
        {entries.map((entry, index) => {
          const Icon = getActionIcon(entry.action)

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-xl ${getActionColor(entry.action)}`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-foreground capitalize">{entry.action}</h3>
                    <time className="text-sm text-muted-foreground">{formatDate(entry.timestamp)}</time>
                  </div>

                  {entry.details && <p className="text-sm text-muted-foreground mb-2">{entry.details}</p>}

                  {entry.user && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">by {entry.user}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Empty State */}
      {entries.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No history found</h3>
          <p className="text-muted-foreground">Activity history will appear here as actions are performed.</p>
        </div>
      )}
    </div>
  )
}