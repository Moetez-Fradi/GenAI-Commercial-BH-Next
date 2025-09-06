"use client"

import { useState, useEffect } from "react"
import { X, MessageSquare, Calendar, Send } from "lucide-react"
import Modal from "./Modal"

interface SentMessage {
  id: string
  content: string
  channel: "email" | "whatsapp"
  sent_at: string
  recipient?: string
  status?: "sent" | "delivered" | "read" | "failed"
}

interface Props {
  clientRef: string
  clientName: string
  onClose: () => void
}

export default function SentMessagesModal({ clientRef, clientName, onClose }: Props) {
  const [messages, setMessages] = useState<SentMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // Mock data for now - replace with actual API call
        const mockMessages: SentMessage[] = [
          {
            id: "1",
            content:
              "Hello! We have a great insurance offer for you. Our premium health insurance plan offers comprehensive coverage at competitive rates. Would you like to learn more?",
            channel: "whatsapp",
            sent_at: "2024-01-15T10:30:00Z",
            recipient: "+216 XX XXX XXX",
            status: "read",
          },
          {
            id: "2",
            content:
              "Thank you for your interest in our services. We've prepared a personalized quote for your auto insurance needs. Please find the details in the attachment.",
            channel: "email",
            sent_at: "2024-01-14T14:20:00Z",
            recipient: "client@example.com",
            status: "delivered",
          },
        ]

        setTimeout(() => {
          setMessages(mockMessages)
          setLoading(false)
        }, 500)
      } catch (error) {
        console.error("Failed to fetch messages:", error)
        setLoading(false)
      }
    }

    fetchMessages()
  }, [clientRef])

  const getChannelIcon = (channel: string) => {
    return channel === "whatsapp" ? "📱" : "📧"
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "read":
        return "text-emerald-600 bg-emerald-50"
      case "delivered":
        return "text-blue-600 bg-blue-50"
      case "sent":
        return "text-amber-600 bg-amber-50"
      case "failed":
        return "text-red-600 bg-red-50"
      default:
        return "text-slate-600 bg-slate-50"
    }
  }

  return (
    <Modal open={true} onClose={onClose} className="w-full max-w-4xl mx-4">
      <div className="flex flex-col h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Sent Messages</h2>
              <p className="text-sm text-slate-600">
                {clientName} (Ref: {clientRef})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getChannelIcon(message.channel)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 capitalize">{message.channel}</span>
                          {message.status && (
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(message.status)}`}
                            >
                              {message.status}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(message.sent_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Send className="w-4 h-4 text-slate-400" />
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 border-l-4 border-emerald-500">
                    <p className="text-slate-700 leading-relaxed">{message.content}</p>
                  </div>

                  {message.recipient && <div className="mt-2 text-xs text-slate-500">Sent to: {message.recipient}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No messages sent</h3>
              <p className="text-slate-500">No messages have been sent to this client yet.</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}