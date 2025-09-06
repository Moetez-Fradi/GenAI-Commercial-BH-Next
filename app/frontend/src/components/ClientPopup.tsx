import type { Client, ClientPhysique, ClientMoral } from "../types/client";

interface Props {
  client: Client;
  clientPhysique?: ClientPhysique;
  clientMoral?: ClientMoral;
  onClose: () => void;
}

export default function ClientPopup({ client, clientPhysique, clientMoral, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-6 w-1/3">
        <h2 className="text-xl font-bold mb-4">Client Details</h2>
        <p><strong>Ref:</strong> {client.ref_personne}</p>
        <p><strong>Name:</strong> {clientPhysique?.name || clientMoral?.raison_sociale || "N/A"}</p>
        <p><strong>Type:</strong> {client.type}</p>
        <p><strong>Rank:</strong> {client.rank}</p>
        <p><strong>Status:</strong> {client.status}</p>
        <button
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}