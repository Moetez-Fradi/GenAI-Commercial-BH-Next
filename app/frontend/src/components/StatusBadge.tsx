export default function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    accepted: "bg-green-100 text-green-800",
    refused: "bg-red-100 text-red-800",
    not_contacted: "bg-gray-100 text-gray-800",
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full font-medium ${colors[status] ?? ""}`}>
      {status}
    </span>
  );
}
