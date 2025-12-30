interface Props {
  open: boolean;
  onClose: () => void;
}

export default function PDFModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          Generate Safety Case Study PDF
        </h2>

        <ul className="space-y-2 text-sm text-gray-700">
          <li>✔ Executive summary</li>
          <li>✔ Root cause & lessons learned</li>
          <li>✔ Preventive measures checklist</li>
          <li>✔ Source links & references</li>
          <li>✔ DATTU watermark</li>
        </ul>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">
            Cancel
          </button>

          <button className="px-5 py-2 bg-primary text-white rounded-lg">
            Generate PDF
          </button>
        </div>
      </div>
    </div>
  );
}