interface Props {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label: string;
  unit?: string;
}

export default function ProgressRing({ value, max, size = 120, strokeWidth = 10, color = '#22c55e', label, unit = 'cal' }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / Math.max(max, 1), 1);
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke="#f1f5f9" strokeWidth={strokeWidth} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={pct > 1 ? '#ef4444' : color} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" className="transition-all duration-700" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-800">{value}</span>
          <span className="text-[10px] text-gray-400">{unit}</span>
        </div>
      </div>
      <span className="mt-2 text-xs font-medium text-gray-500">{label}</span>
    </div>
  );
}
