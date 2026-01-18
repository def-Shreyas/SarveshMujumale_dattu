export default function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div
        className="h-2 rounded-full transition-all"
        style={{
          width: `${value}%`,
          background:
            value > 80 ? "#16a34a" : value > 60 ? "#f59e0b" : "#dc2626",
        }}
      />
    </div>
  );
}
