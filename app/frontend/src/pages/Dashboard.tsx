import { useState } from "react";
import ClientTable from "../components/ClientTable";
import type { Client } from "../types/client";

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([
    {
      ref_personne: "C001",
      name: "Yassine B.",
      type: "physique",
      rank: 1,
      status: "pending",
      city: "Tunis",
      recommendation: ["Auto", "Santé", "Retraite"],
      messages: [],
    },
    {
      ref_personne: "C002",
      name: "Acme Corp",
      type: "moral",
      rank: 2,
      status: "accepted",
      recommendation: ["RC Pro", "Multirisque"],
      messages: [],
    },
  ]);

  const updateClient = (u: Client) =>
    setClients(prev => prev.map(c => (c.ref_personne === u.ref_personne ? u : c)));

  const markMessaged = (ref: string) =>
    setClients(prev => prev.map(c => c.ref_personne === ref ? { ...c, lastContact: "whatsapp" } : c));

  const physiques = clients.filter(c => c.type === "physique");
  const morals = clients.filter(c => c.type === "moral");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-red-600">Clients</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClientTable
          title="Client Physique"
          clients={physiques}
          onUpdateClient={updateClient}
          onMessageSent={markMessaged}
        />
        <ClientTable
          title="Client Moral"
          clients={morals}
          onUpdateClient={updateClient}
          onMessageSent={markMessaged}
        />
      </div>
    </div>
  );
}