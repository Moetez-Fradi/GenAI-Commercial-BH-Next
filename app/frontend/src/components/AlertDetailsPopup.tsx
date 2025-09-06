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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-green-600">Alert Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
            <input
              type="text"
              value={editedAlert.ref_personne}
              disabled
              className="w-full p-2 border border-gray-300 rounded bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alert Type</label>
            <input
              type="text"
              value={editedAlert.alert_type}
              onChange={(e) => setEditedAlert({ ...editedAlert, alert_type: e.target.value })}
              disabled={!isEditing}
              className="w-full p-2 border border-gray-300 rounded focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={editedAlert.alert_message}
              onChange={(e) => setEditedAlert({ ...editedAlert, alert_message: e.target.value })}
              disabled={!isEditing}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <select
              value={editedAlert.alert_severity}
              onChange={(e) => setEditedAlert({ ...editedAlert, alert_severity: e.target.value })}
              disabled={!isEditing}
              className="w-full p-2 border border-gray-300 rounded focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
            >
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <input
              type="text"
              value={editedAlert.product || ""}
              onChange={(e) => setEditedAlert({ ...editedAlert, product: e.target.value })}
              disabled={!isEditing}
              className="w-full p-2 border border-gray-300 rounded focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Days Until Expiry</label>
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
              className="w-full p-2 border border-gray-300 rounded focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Save
                </button>
              </>
            ) : (
              /* Updated edit button from red to green */
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}