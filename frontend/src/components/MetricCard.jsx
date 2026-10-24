import React from 'react';

export default function MetricCard({
  title,
  value,
  subvalue,
  icon: Icon,
  accentColor = 'teal',
  statusBadge,
}) {
  const colorMap = {
    teal: {
      border: 'border-teal-500/20',
      iconBg: 'bg-teal-500/10 text-teal-400',
      glow: 'shadow-teal-500/5',
    },
    blue: {
      border: 'border-sky-500/20',
      iconBg: 'bg-sky-500/10 text-sky-400',
      glow: 'shadow-sky-500/5',
    },
    amber: {
      border: 'border-amber-500/20',
      iconBg: 'bg-amber-500/10 text-amber-400',
      glow: 'shadow-amber-500/5',
    },
    emerald: {
      border: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      glow: 'shadow-emerald-500/5',
    },
  };

  const currentTheme = colorMap[accentColor] || colorMap.teal;

  return (
    <div
      className={`glass-panel rounded-2xl p-5 border ${currentTheme.border} ${currentTheme.glow} transition-all hover:translate-y-[-2px] hover:border-slate-700`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2 rounded-xl ${currentTheme.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white tracking-tight">
          {value}
        </span>
        {statusBadge && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {statusBadge}
          </span>
        )}
      </div>

      {subvalue && (
        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
          {subvalue}
        </p>
      )}
    </div>
  );
}

