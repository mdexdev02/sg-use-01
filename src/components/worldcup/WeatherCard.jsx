export default function WeatherCard({ weather, onClick, selected, votes, totalVotes, disabled }) {
  const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 w-full
        ${selected
          ? 'border-blue-400 bg-blue-900/50 scale-105 shadow-lg shadow-blue-500/30'
          : 'border-slate-600 bg-slate-800/60 hover:border-slate-400 hover:bg-slate-700/60'}
        ${disabled && !selected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span className="text-5xl">{weather.emoji}</span>
      <span className="text-xl font-bold text-white">{weather.name}</span>
      <span className="text-xs text-slate-400 px-2 py-1 bg-slate-700 rounded-full">
        {weather.category}
      </span>

      {selected && (
        <div className="w-full mt-2">
          <div className="flex justify-between text-sm text-blue-300 mb-1">
            <span>{votes} 표</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </button>
  )
}
