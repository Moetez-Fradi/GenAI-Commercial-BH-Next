import HistoryTable from "../components/HistoryTable";
import type { Client } from "../types/client";

export default function History() {
  const history: Client[] = [
    {
      ref_personne: "C001",
      name: "Yassine B.",
      type: "physique",
      rank: 1,
      status: "accepted",
      lastContact: "whatsapp",
      recommendationHistory: ["Auto", "Santé", "Retraite"],
      messages: [
        {
          id: "m1",
          clientRef: "C001",
          channel: "whatsapp",
          content: "Salam Yassine, vous êtes éligible à Auto & Santé...",
          sentAt: new Date().toISOString(),
        },
      ],
    },
    {
      ref_personne: "C002",
      name: "Acme Corp",
      type: "moral",
      rank: 2,
      status: "refused",
      lastContact: "email",
      recommendationHistory: ["RC Pro", "Multirisque"],
      messages: [
        {
          id: "m2",
          clientRef: "C002",
          channel: "email",
          content: "Bonjour, proposition Multirisque Entreprise...",
          sentAt: new Date().toISOString(),
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-red-600">History</h1>
      <HistoryTable history={history} />
    </div>
  );
}