export default function LatencyBadge({ latencyMs }) {
  if (latencyMs === null) return null;

  let colorClass = 'text-emerald-600 bg-emerald-50 border-emerald-100';
  let dotClass = 'bg-emerald-500';
  if (latencyMs > 300) {
    colorClass = 'text-red-600 bg-red-50 border-red-100';
    dotClass = 'bg-red-500';
  } else if (latencyMs > 100) {
    colorClass = 'text-amber-600 bg-amber-50 border-amber-100';
    dotClass = 'bg-amber-500';
  }

  return (
    <div className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
      ~{latencyMs}ms
    </div>
  );
}
