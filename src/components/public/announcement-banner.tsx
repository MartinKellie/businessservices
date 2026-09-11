export function AnnouncementBanner({ text }: { text: string }) {
  if (!text.trim()) return null;

  return (
    <div className="bg-signal px-4 py-2 text-center text-sm font-semibold text-signal-ink sm:px-6" role="status">
      {text}
    </div>
  );
}
