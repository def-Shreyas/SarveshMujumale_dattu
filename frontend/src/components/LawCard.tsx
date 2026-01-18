import ConfidenceBar from "./ConfidenceBar";

export default function LawCard({ law }: any) {
  const confidence = parseFloat(law.confidence);

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-sm text-gray-800">{law.law_name}</h3>
        <span className="text-xs font-medium text-gray-600">
          {law.confidence}
        </span>
      </div>

      <ConfidenceBar value={confidence} />

      <p className="text-xs text-gray-600 leading-relaxed">{law.excerpt}</p>

      <p className="text-[11px] text-gray-400">
        Source: {law.pdf_name} • Page {law.page_number}
      </p>
    </div>
  );
}
