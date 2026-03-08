function points(s) {
  return s.wins * 3 + (s.draws ?? 0) * 1
}

export default function GroupStandings({ groups }) {
  if (!groups?.length) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {groups.map((group) => {
        const sorted = [...(group.standings ?? [])].sort((a, b) => points(b) - points(a))
        return (
          <div key={group.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
                {group.name[0]}
              </span>
              {group.name}
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left pb-2">팀</th>
                  <th className="text-center pb-2">경기</th>
                  <th className="text-center pb-2">승</th>
                  <th className="text-center pb-2">무</th>
                  <th className="text-center pb-2">패</th>
                  <th className="text-center pb-2">득표</th>
                  <th className="text-center pb-2 text-yellow-400">승점</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => (
                  <tr
                    key={s.teamId}
                    className={`border-b border-slate-700/50 ${i < 2 ? 'text-green-300' : 'text-slate-300'}`}
                  >
                    <td className="py-2 flex items-center gap-2">
                      <span>{s.emoji}</span>
                      <span className="truncate">{s.name}</span>
                      {i < 2 && <span className="text-xs text-green-400">↑</span>}
                    </td>
                    <td className="text-center py-2">{s.played}</td>
                    <td className="text-center py-2">{s.wins}</td>
                    <td className="text-center py-2">{s.draws ?? 0}</td>
                    <td className="text-center py-2">{s.losses}</td>
                    <td className="text-center py-2">{s.totalVotes}</td>
                    <td className="text-center py-2 font-bold text-yellow-400">{points(s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-slate-500 mt-2">↑ 토너먼트 진출 후보 (상위 2팀) · 승3 무1 패0</p>
          </div>
        )
      })}
    </div>
  )
}
