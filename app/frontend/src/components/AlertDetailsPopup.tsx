"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface AlertDetailsPopupProps {
  alert: any
  onClose: () => void
  onUpdate: (alert: any) => void
}

export default function AlertDetailsPopup({ alert, onClose, onUpdate }: AlertDetailsPopupProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedAlert, setEditedAlert] = useState(alert)

  const handleSave = () => {
    onUpdate(editedAlert)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedAlert(alert)
    setIsEditing(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Alert Details</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-all duration-300 text-white">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/50 mb-2">Reference</label>
            <input
              type="text"
              value={editedAlert.ref_personne}
              disabled
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-purple-400 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/50 mb-2">Alert Type</label>
            <input
              type="text"
              value={editedAlert.alert_type}
              onChange={(e) => setEditedAlert({ ...editedAlert, alert_type: e.target.value })}
              disabled={!isEditing}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white
                focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:text-white/70 transition-all duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/50 mb-2">Message</label>
            <textarea
              value={editedAlert.alert_message}
              onChange={(e) => setEditedAlert({ ...editedAlert, alert_message: e.target.value })}
              disabled={!isEditing}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white
                focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:text-white/70 transition-all duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/50 mb-2">Severity</label>
            <select
              value={editedAlert.alert_severity}
              onChange={(e) => setEditedAlert({ ...editedAlert, alert_severity: e.target.value })}
              disabled={!isEditing}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white
                focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:text-white/70 transition-all duration-300"
            >
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/50 mb-2">Product</label>
            <input
              type="text"
              value={editedAlert.product || ""}
              onChange={(e) => setEditedAlert({ ...editedAlert, product: e.target.value })}
              disabled={!isEditing}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white
                focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:text-white/70 transition-all duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/50 mb-2">Days Until Expiry</label>
            <input
              type="number"
              value={editedAlert.days_until_expiry || ""}
              onChange={(e) =>
                setEditedAlert({
                  ...editedAlert,
                  days_until_expiry: e.target.value ? Number.parseInt(e.target.value) : undefined,
                })
              }
              disabled={!isEditing}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white
                focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:text-white/70 transition-all duration-300"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2.5 text-sm rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white 
                    hover:bg-white/10 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2.5 text-sm rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white 
                    hover:from-purple-700 hover:to-cyan-700 transition-all duration-300 shadow-lg"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2.5 text-sm rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white 
                  hover:from-purple-700 hover:to-cyan-700 transition-all duration-300 shadow-lg"
              >
                Edit Alert
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}