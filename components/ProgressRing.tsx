/** حلقة نسبة الإنجاز */
export function ProgressRing({ value, label, size = 132 }: { value: number; label: string; size?: number }) {
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${v}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={12} />
        <circle
          className="ring-value"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
        />
      </svg>
      <div className="ring-label">
        <b className="ltr">{v}%</b>
        <span>{label}</span>
      </div>
    </div>
  );
}

/** فرق النسبة عن الشهر السابق */
export function Trend({ now, before }: { now: number; before: number | null }) {
  if (before === null) return null;
  const d = Math.round((now - before) * 10) / 10;
  const cls = d > 0 ? "trend-up" : d < 0 ? "trend-down" : "trend-flat";
  return (
    <span className={`trend ${cls}`} title="مقارنة بالشهر السابق">
      <span className="ltr">
        {d > 0 ? "+" : ""}
        {d}%
      </span>
    </span>
  );
}
