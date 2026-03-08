export default function TournamentBracket({ rounds }) {
  if (!rounds?.length) return null

  const roundNames = {
    32: '32강',
    16: '16강',
    8: '8강',
    4: '4강',
    2: '결승',
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max">
        {rounds.map((round) => (
          <div key={round.size} className="flex flex-col gap-3">
            <h3 className="text-center text-sm font-bold text-blue-400 uppercase tracking-wider">
              {roundNames[round.size] ?? `${round.size}강`}
            </h3>
            <div className="flex flex-col gap-4">
              {round.matches.map((match) => (
                <MatchSlot key={match.id} match={match} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MatchSlot({ match }) {
  const total = (match.votes1 ?? 0) + (match.votes2 ?? 0)
  return (
    <div className="w-44 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden text-sm">
      <TeamRow
        team={match.team1}
        votes={match.votes1}
        total={total}
        won={match.winner === 'team1'}
        pending={match.status === 'pending'}
      />
      <div className="h-px bg-slate-700" />
      <TeamRow
        team={match.team2}
        votes={match.votes2}
        total={total}
        won={match.winner === 'team2'}
        pending={match.status === 'pending'}
      />
    </div>
  )
}

function TeamRow({ team, votes, total, won, pending }) {
  const pct = total > 0 ? Math.round(((votes ?? 0) / total) * 100) : 0
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 relative overflow-hidden ${
        won ? 'bg-blue-900/40' : ''
      }`}
    >
      {!pending && total > 0 && (
        <div
          className="absolute inset-0 bg-blue-500/10"
          style={{ width: `${pct}%` }}
        />
      )}
      <span className="text-lg z-10">{team?.emoji ?? '?'}</span>
      <span className={`z-10 flex-1 truncate ${won ? 'text-white font-bold' : 'text-slate-400'}`}>
        {team?.name ?? 'TBD'}
      </span>
      {!pending && (
        <span className="z-10 text-xs text-slate-400">{pct}%</span>
      )}
    </div>
  )
}
