export default function ScreenshotCarousel({ screenshots }: any) {
  if (!screenshots.length) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {screenshots.map((shot: any, idx: number) => (
        <div
          key={idx}
          className="min-w-[260px] border rounded-lg overflow-hidden shadow"
        >
          <img src={shot.image_url} alt="Law proof" className="w-full h-auto" />
          <div className="p-2 text-[11px] text-gray-600">
            {shot.pdf_name} • Page {shot.page_number}
          </div>
        </div>
      ))}
    </div>
  );
}
