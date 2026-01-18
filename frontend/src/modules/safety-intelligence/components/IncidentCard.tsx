import type { Incident } from "../types";

export default function IncidentCard({ incident }: { incident: Incident }) {
  return (
    <div className="bg-white rounded-xl shadow p-5 border-l-4 border-secondary">
      <h3 className="font-semibold text-lg">
        {incident.year} – {incident.industry}
      </h3>

      <p className="text-sm text-gray-600 mt-1">
        {incident.country} • Severity: {incident.severity}
      </p>

      <p className="mt-3 text-sm leading-relaxed">{incident.summary}</p>

      <button className="mt-4 text-secondary font-medium hover:underline">
        View Details
      </button>
    </div>
  );
}