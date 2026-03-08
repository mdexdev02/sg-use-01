import TournamentBracket from '../components/worldcup/TournamentBracket'

// 더미 대진표 (Supabase 연결 후 실제 데이터로 교체)
const dummyRounds = [
  {
    size: 32,
    matches: Array.from({ length: 16 }, (_, i) => ({
      id: `r32-${i}`,
      team1: { name: 'TBD', emoji: '❓' },
      team2: { name: 'TBD', emoji: '❓' },
      votes1: 0,
      votes2: 0,
      status: 'pending',
      winner: null,
    })),
  },
  {
    size: 16,
    matches: Array.from({ length: 8 }, (_, i) => ({
      id: `r16-${i}`,
      team1: { name: 'TBD', emoji: '❓' },
      team2: { name: 'TBD', emoji: '❓' },
      votes1: 0,
      votes2: 0,
      status: 'pending',
      winner: null,
    })),
  },
  {
    size: 8,
    matches: Array.from({ length: 4 }, (_, i) => ({
      id: `r8-${i}`,
      team1: { name: 'TBD', emoji: '❓' },
      team2: { name: 'TBD', emoji: '❓' },
      votes1: 0,
      votes2: 0,
      status: 'pending',
      winner: null,
    })),
  },
  {
    size: 4,
    matches: Array.from({ length: 2 }, (_, i) => ({
      id: `r4-${i}`,
      team1: { name: 'TBD', emoji: '❓' },
      team2: { name: 'TBD', emoji: '❓' },
      votes1: 0,
      votes2: 0,
      status: 'pending',
      winner: null,
    })),
  },
  {
    size: 2,
    matches: [
      {
        id: 'final',
        team1: { name: 'TBD', emoji: '❓' },
        team2: { name: 'TBD', emoji: '❓' },
        votes1: 0,
        votes2: 0,
        status: 'pending',
        winner: null,
      },
    ],
  },
]

export default function Bracket() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white mb-2">📊 32강 토너먼트 대진표</h1>
      <p className="text-slate-400 text-sm mb-8">
        조별리그 완료 후 각 조 상위 2팀 (24팀) + 와일드카드 (8팀) = 32팀이 진출합니다.
      </p>
      <TournamentBracket rounds={dummyRounds} />
      <p className="text-center text-slate-600 text-sm mt-6">
        조별리그가 완료되면 대진표가 자동으로 채워집니다.
      </p>
    </main>
  )
}
