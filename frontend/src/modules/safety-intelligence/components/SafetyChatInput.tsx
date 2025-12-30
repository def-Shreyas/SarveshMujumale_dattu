import { useState } from "react";

interface Props {
  onSubmit: (query: string) => void;
}

export default function SafetyChatInput({ onSubmit }: Props) {
  const [query, setQuery] = useState("");

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <textarea
        rows={3}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask about real-world safety incidents, hazards, or failures…"
        className="w-full resize-none border rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-secondary"
      />

      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={() => setQuery("")}
          className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50"
        >
          Clear
        </button>

        <button
          onClick={() => onSubmit(query)}
          disabled={!query.trim()}
          className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-secondary disabled:opacity-50"
        >
          Ask
        </button>
      </div>
    </div>
  );
}