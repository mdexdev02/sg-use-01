import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import MatchVote from '../components/worldcup/MatchVote'
import GroupStandings from '../components/worldcup/GroupStandings'
import ChatRoom from '../components/chat/ChatRoom'
import {
  getActiveTournament,
  getMatches,
  completeTournament,
  createKnockoutMatches,
  updateTournamentPhase,
} from '../lib/supabase'
import { useTournament } from '../context/TournamentContext'

const GUEST_NAME = `날씨인#${Math.floor(Math.random() * 9000) + 1000}`

// ─── Constants ────────────────────────────────────────────────────────────────

const ROUND_LABELS = { group: '조별리그', R16: '16강', R8: '8강', R4: '4강', final: '결승' }
const ROUND_ORDER_BASE = { R16: 10000, R8: 20000, R4: 30000, final: 40000 }
const ROUND_NEXT = { R16: 'R8', R8: 'R4', R4: 'final' }

// ─── Session persistence ──────────────────────────────────────────────────────

function sessionKey(tournamentId) {
  return `wc_session_${tournamentId}`
}

function saveSession(tournamentId, matchIdx, groups, knockout = null) {
  try {
    localStorage.setItem(sessionKey(tournamentId), JSON.stringify({ matchIdx, groups, knockout }))
  } catch (e) {}
}

function loadSession(tournamentId) {
  try {
    const raw = localStorage.getItem(sessionKey(tournamentId))
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

function clearSession(tournamentId) {
  try {
    localStorage.removeItem(sessionKey(tournamentId))
  } catch (e) {}
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function pts(s) {
  return s.wins * 3 + (s.draws ?? 0)
}

function buildGroups(matches) {
  const groupMap = new Map()
  for (const m of matches) {
    const gId = m.group_id
    if (!groupMap.has(gId)) {
      groupMap.set(gId, { id: gId, name: m.group?.name || '', standingsMap: new Map() })
    }
    const g = groupMap.get(gId)
    for (const team of [m.team1, m.team2]) {
      if (!g.standingsMap.has(team.id)) {
        g.standingsMap.set(team.id, {
          teamId: team.id,
          name: team.name,
          emoji: team.emoji,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          totalVotes: 0,
        })
      }
    }
  }
  return Array.from(groupMap.values()).map((g) => ({
    id: g.id,
    name: g.name,
    standings: Array.from(g.standingsMap.values()),
  }))
}

function normalizeMatch(m) {
  return {
    ...m,
    groupName: m.group?.name || '',
    roundLabel: ROUND_LABELS[m.round] ?? m.round,
  }
}

// 그룹 순위표에 한 경기 결과 적용 (순수 함수)
function applyVote(groups, match, side) {
  return groups.map((g) => {
    if (g.id !== match.group_id) return g
    return {
      ...g,
      standings: g.standings.map((s) => {
        if (side === 'draw') {
          if (s.teamId === match.team1.id || s.teamId === match.team2.id)
            return { ...s, played: s.played + 1, draws: s.draws + 1 }
        } else {
          const winner = side === 'team1' ? match.team1 : match.team2
          const loser = side === 'team1' ? match.team2 : match.team1
          if (s.teamId === winner.id)
            return { ...s, played: s.played + 1, wins: s.wins + 1, totalVotes: s.totalVotes + 1 }
          if (s.teamId === loser.id)
            return { ...s, played: s.played + 1, losses: s.losses + 1 }
        }
        return s
      }),
    }
  })
}

// 조별 순위에서 16강 시드 계산
// - 12조 1위 전원 + 2위 중 승점 상위 4팀 = 16팀
// - 최종 16팀을 승점 내림차순 정렬 후 1v16, 2v15... 페어링
function computeKnockoutSeeds(groups) {
  const winners = []
  const runnersUp = []

  for (const group of groups) {
    const sorted = [...group.standings].sort((a, b) => {
      const d = pts(b) - pts(a)
      return d !== 0 ? d : b.totalVotes - a.totalVotes
    })
    if (sorted[0]) {
      winners.push({
        teamId: sorted[0].teamId,
        name: sorted[0].name,
        emoji: sorted[0].emoji,
        groupPts: pts(sorted[0]),
        totalVotes: sorted[0].totalVotes,
      })
    }
    if (sorted[1]) {
      runnersUp.push({
        teamId: sorted[1].teamId,
        name: sorted[1].name,
        emoji: sorted[1].emoji,
        groupPts: pts(sorted[1]),
        totalVotes: sorted[1].totalVotes,
      })
    }
  }

  runnersUp.sort((a, b) => {
    const d = b.groupPts - a.groupPts
    return d !== 0 ? d : b.totalVotes - a.totalVotes
  })
  const top4RunnersUp = runnersUp.slice(0, 4)

  const seeds = [...winners, ...top4RunnersUp].sort((a, b) => {
    const d = b.groupPts - a.groupPts
    return d !== 0 ? d : b.totalVotes - a.totalVotes
  })

  return seeds // 16팀
}

// 시드 목록(내림차순 정렬 완료)에서 1v마지막, 2v마지막-1... 페어링
function seedAndPair(seeds) {
  const n = seeds.length
  return Array.from({ length: Math.floor(n / 2) }, (_, i) => [seeds[i], seeds[n - 1 - i]])
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorldCup() {
  const navigate = useNavigate()
  const { setHasActiveTournament } = useTournament()

  // 조별리그 상태
  const [tournament, setTournament] = useState(null)
  const [groups, setGroups] = useState([])
  const [allMatches, setAllMatches] = useState([]) // 조별리그 경기만
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0)
  const [phase, setPhase] = useState('group')

  // 토너먼트(녹아웃) 상태
  const [knockoutMatches, setKnockoutMatches] = useState([])
  const [knockoutMatchIdx, setKnockoutMatchIdx] = useState(0)
  const [knockoutWinners, setKnockoutWinners] = useState([]) // 현재 라운드 승자 누적
  const [knockoutSeeds, setKnockoutSeeds] = useState([])    // 최초 16 시드 (재시딩용)
  const [currentRound, setCurrentRound] = useState(null)
  const [champion, setChampion] = useState(null)
  const [knockoutLoading, setKnockoutLoading] = useState(false)

  // UI
  const [username] = useState(GUEST_NAME)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chatOpen, setChatOpen] = useState(true)

  useEffect(() => {
    initTournament()
  }, [])

  // ─── Init ──────────────────────────────────────────────────────────────────

  async function initTournament() {
    setLoading(true)
    setError(null)
    try {
      const active = await getActiveTournament()
      if (!active) {
        navigate('/potsetup', { replace: true })
        return
      }
      await loadTournamentData(active)
    } catch (e) {
      console.error(e)
      setError('Supabase 연결에 실패했습니다. 환경변수를 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  async function loadTournamentData(active) {
    setTournament(active)
    setPhase(active.phase)

    const raw = await getMatches(active.id)
    const allNormalized = raw.map(normalizeMatch)
    const groupMatches = allNormalized.filter((m) => m.round === 'group')
    setAllMatches(groupMatches)

    const saved = loadSession(active.id)
    if (saved) {
      setCurrentMatchIdx(saved.matchIdx)
      setGroups(saved.groups)
      if (saved.knockout && active.phase !== 'group') {
        const ko = saved.knockout
        setKnockoutSeeds(ko.seeds ?? [])
        setKnockoutWinners(ko.winners ?? [])
        setCurrentRound(ko.round)
        setKnockoutMatchIdx(ko.matchIdx)
        setChampion(ko.champion ?? null)
        const roundMatches = allNormalized.filter((m) => m.round === ko.round)
        setKnockoutMatches(roundMatches)
      }
    } else {
      setGroups(buildGroups(groupMatches))
    }
  }

  // ─── Group stage handlers ──────────────────────────────────────────────────

  async function handleNewTournament() {
    if (!confirm('현재 대회를 종료하고 새 대회를 시작할까요?')) return
    if (tournament) {
      try {
        await completeTournament(tournament.id)
        clearSession(tournament.id)
      } catch (e) {
        console.error(e)
      }
    }
    setTournament(null)
    setAllMatches([])
    setGroups([])
    setCurrentMatchIdx(0)
    setKnockoutMatches([])
    setKnockoutMatchIdx(0)
    setKnockoutWinners([])
    setKnockoutSeeds([])
    setCurrentRound(null)
    setChampion(null)
    setHasActiveTournament(false)
    navigate('/potsetup')
  }

  const handleVoted = useCallback(
    (side) => {
      const match = allMatches[currentMatchIdx]
      if (!match) return

      const updatedGroups = applyVote(groups, match, side)
      const nextIdx = currentMatchIdx + 1
      setGroups(updatedGroups)
      if (tournament) saveSession(tournament.id, nextIdx, updatedGroups)
      setTimeout(() => setCurrentMatchIdx(nextIdx), 1500)
    },
    [allMatches, currentMatchIdx, groups, tournament]
  )

  // 조별리그 자동 완성 (fromIdx부터 끝까지 무작위 결과로 처리)
  function autoCompleteFrom(fromIdx) {
    const sides = ['team1', 'team2', 'draw']
    let g = groups
    for (let i = fromIdx; i < allMatches.length; i++) {
      const side = sides[Math.floor(Math.random() * sides.length)]
      g = applyVote(g, allMatches[i], side)
    }
    const nextIdx = allMatches.length
    setGroups(g)
    setCurrentMatchIdx(nextIdx)
    if (tournament) saveSession(tournament.id, nextIdx, g)
  }

  // ─── Knockout handlers ─────────────────────────────────────────────────────

  async function startKnockout() {
    setKnockoutLoading(true)
    try {
      const seeds = computeKnockoutSeeds(groups)
      const pairs = seedAndPair(seeds)
      const round = 'R16'
      const rawMatches = await createKnockoutMatches(
        tournament.id,
        pairs,
        round,
        ROUND_ORDER_BASE[round]
      )
      await updateTournamentPhase(tournament.id, round)
      const normalized = rawMatches.map(normalizeMatch)
      setKnockoutSeeds(seeds)
      setKnockoutMatches(normalized)
      setKnockoutMatchIdx(0)
      setKnockoutWinners([])
      setCurrentRound(round)
      setPhase('knockout')
      if (tournament) {
        saveSession(tournament.id, currentMatchIdx, groups, {
          round,
          matchIdx: 0,
          winners: [],
          seeds,
          champion: null,
        })
      }
    } catch (e) {
      console.error(e)
      alert('토너먼트 생성 중 오류가 발생했습니다.')
    } finally {
      setKnockoutLoading(false)
    }
  }

  async function advanceKnockoutRound(winners) {
    setKnockoutLoading(true)
    try {
      if (currentRound === 'final') {
        // 결승 종료 → 우승자 확정
        setChampion(winners[0])
        if (tournament) {
          saveSession(tournament.id, currentMatchIdx, groups, {
            round: currentRound,
            matchIdx: knockoutMatches.length,
            winners,
            seeds: knockoutSeeds,
            champion: winners[0],
          })
        }
        return
      }

      const nextRound = ROUND_NEXT[currentRound]

      // 다음 라운드 시드: 승자들을 원래 groupPts로 재정렬 후 페어링
      const sortedWinners = [...winners].sort((a, b) => {
        const d = b.groupPts - a.groupPts
        return d !== 0 ? d : b.totalVotes - a.totalVotes
      })
      const pairs = seedAndPair(sortedWinners)
      const rawMatches = await createKnockoutMatches(
        tournament.id,
        pairs,
        nextRound,
        ROUND_ORDER_BASE[nextRound]
      )
      await updateTournamentPhase(tournament.id, nextRound)
      const normalized = rawMatches.map(normalizeMatch)

      setKnockoutMatches(normalized)
      setKnockoutMatchIdx(0)
      setKnockoutWinners([])
      setCurrentRound(nextRound)

      if (tournament) {
        saveSession(tournament.id, currentMatchIdx, groups, {
          round: nextRound,
          matchIdx: 0,
          winners: [],
          seeds: knockoutSeeds,
          champion: null,
        })
      }
    } catch (e) {
      console.error(e)
      alert('다음 라운드 생성 중 오류가 발생했습니다.')
    } finally {
      setKnockoutLoading(false)
    }
  }

  const handleKnockoutVoted = useCallback(
    (side) => {
      const match = knockoutMatches[knockoutMatchIdx]
      if (!match || side === 'draw') return // 녹아웃은 무승부 없음

      const winnerTeam = side === 'team1' ? match.team1 : match.team2
      const seed = knockoutSeeds.find((s) => s.teamId === winnerTeam.id)
      const winner = {
        teamId: winnerTeam.id,
        name: winnerTeam.name,
        emoji: winnerTeam.emoji,
        groupPts: seed?.groupPts ?? 0,
        totalVotes: seed?.totalVotes ?? 0,
      }

      const newWinners = [...knockoutWinners, winner]
      const nextIdx = knockoutMatchIdx + 1

      setTimeout(() => {
        setKnockoutMatchIdx(nextIdx)
        setKnockoutWinners(newWinners)

        if (nextIdx >= knockoutMatches.length) {
          // 이 라운드 모든 경기 완료 → 다음 라운드로
          advanceKnockoutRound(newWinners)
        } else {
          // 세션 저장
          if (tournament) {
            saveSession(tournament.id, currentMatchIdx, groups, {
              round: currentRound,
              matchIdx: nextIdx,
              winners: newWinners,
              seeds: knockoutSeeds,
              champion: null,
            })
          }
        }
      }, 1500)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [knockoutMatches, knockoutMatchIdx, knockoutWinners, knockoutSeeds, tournament, currentRound, currentMatchIdx, groups]
  )

  // ─── Derived state ─────────────────────────────────────────────────────────

  const isGroupComplete = allMatches.length > 0 && currentMatchIdx >= allMatches.length
  const groupProgress =
    allMatches.length > 0
      ? (Math.min(currentMatchIdx, allMatches.length) / allMatches.length) * 100
      : 0
  const isKnockoutRoundComplete =
    knockoutMatches.length > 0 && knockoutMatchIdx >= knockoutMatches.length
  const knockoutProgress =
    knockoutMatches.length > 0
      ? (Math.min(knockoutMatchIdx, knockoutMatches.length) / knockoutMatches.length) * 100
      : 0

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-5xl animate-bounce mb-4">⛈️</div>
          <p className="text-slate-400">날씨 월드컵 준비 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={initTournament}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  // 우승자 확정 화면
  if (champion) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-8xl mb-6">{champion.emoji}</div>
        <h1 className="text-3xl font-black text-yellow-400 mb-2">🏆 우승!</h1>
        <p className="text-2xl font-bold text-white mb-6">{champion.name}</p>
        <p className="text-slate-400 mb-10">날씨 월드컵 최종 우승 날씨가 결정됐어요!</p>
        <button
          onClick={handleNewTournament}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition-colors"
        >
          🔄 새 대회 시작
        </button>
      </div>
    )
  }

  // ─── 녹아웃 단계 ────────────────────────────────────────────────────────────

  if (phase !== 'group') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
            <span>
              {ROUND_LABELS[currentRound] ?? currentRound} · 경기{' '}
              {isKnockoutRoundComplete ? knockoutMatches.length : knockoutMatchIdx + 1} /{' '}
              {knockoutMatches.length}
            </span>
            <div className="flex items-center gap-3">
              <span>{Math.round(knockoutProgress)}% 완료</span>
              <button
                onClick={handleNewTournament}
                className="text-sm px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl font-medium transition-colors"
              >
                🔄 새 대회
              </button>
            </div>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 rounded-full transition-all duration-300"
              style={{ width: `${knockoutProgress}%` }}
            />
          </div>
        </div>

        <div className="flex gap-6">
          <div className="flex-1">
            {knockoutLoading || isKnockoutRoundComplete ? (
              <div className="flex items-center justify-center min-h-[300px]">
                <div className="text-center">
                  <div className="text-5xl animate-bounce mb-4">⚡</div>
                  <p className="text-slate-400">다음 라운드 준비 중...</p>
                </div>
              </div>
            ) : (
              <MatchVote
                match={knockoutMatches[knockoutMatchIdx]}
                onVoted={handleKnockoutVoted}
                allowDraw={false}
              />
            )}
          </div>

          {/* Chat sidebar */}
          <div className={`flex-shrink-0 transition-all duration-300 ${chatOpen ? 'w-72' : 'w-10'}`}>
            <button
              onClick={() => setChatOpen((o) => !o)}
              className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs mb-2 transition-colors"
            >
              💬 {chatOpen ? '채팅 닫기' : '채팅 열기'}
            </button>
            {chatOpen && (
              <div className="h-[500px]">
                <ChatRoom tournamentId={tournament?.id ?? 'demo'} username={username} />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── 조별리그 단계 ───────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
          <span>
            조별리그 · 경기 {isGroupComplete ? allMatches.length : currentMatchIdx + 1} /{' '}
            {allMatches.length}
          </span>
          <div className="flex items-center gap-3">
            <span>{Math.round(groupProgress)}% 완료</span>
            <button
              onClick={handleNewTournament}
              className="text-sm px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl font-medium transition-colors"
            >
              🔄 새 대회
            </button>
          </div>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${groupProgress}%` }}
          />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main vote area */}
        <div className="flex-1">
          {isGroupComplete ? (
            /* 조별리그 완료 → 토너먼트 시작 */
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-2xl font-bold text-white mb-2">조별리그 완료!</h2>
              <p className="text-slate-400 mb-2">
                72경기 모두 완료했어요.
              </p>
              <p className="text-slate-500 text-sm mb-8">
                12조 1위 전원 + 2위 중 승점 상위 4팀 = <span className="text-blue-400 font-bold">16팀</span>이 토너먼트에 진출합니다.
              </p>
              <button
                onClick={startKnockout}
                disabled={knockoutLoading}
                className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black rounded-xl font-bold text-lg transition-colors"
              >
                {knockoutLoading ? '⏳ 준비 중...' : '⚡ 16강 토너먼트 시작!'}
              </button>
            </div>
          ) : (
            <>
              <MatchVote match={allMatches[currentMatchIdx]} onVoted={handleVoted} />

              {/* Navigation */}
              <div className="flex justify-center gap-4 mt-8">
                <button
                  onClick={() => setCurrentMatchIdx((i) => Math.max(i - 1, 0))}
                  disabled={currentMatchIdx === 0}
                  className="px-5 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white rounded-xl font-medium transition-colors"
                >
                  ← 이전 경기
                </button>
                <button
                  onClick={() => setCurrentMatchIdx((i) => Math.min(i + 1, allMatches.length - 1))}
                  disabled={currentMatchIdx >= allMatches.length - 1}
                  className="px-5 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white rounded-xl font-medium transition-colors"
                >
                  다음 경기 →
                </button>
              </div>

              {/* 자동 완성 버튼 */}
              <div className="flex justify-center gap-3 mt-4">
                <button
                  onClick={() => autoCompleteFrom(0)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-medium transition-colors border border-slate-700"
                >
                  ⚡ 72경기 자동 완성
                </button>
                <button
                  onClick={() => autoCompleteFrom(currentMatchIdx)}
                  disabled={currentMatchIdx >= allMatches.length}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-400 hover:text-white rounded-lg text-xs font-medium transition-colors border border-slate-700"
                >
                  ⚡ 나머지 자동 완성
                </button>
              </div>
            </>
          )}

          {/* Standings */}
          {groups.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold text-white mb-4">📋 조별 순위</h2>
              <GroupStandings groups={groups} />
            </section>
          )}
        </div>

        {/* Chat sidebar */}
        <div className={`flex-shrink-0 transition-all duration-300 ${chatOpen ? 'w-72' : 'w-10'}`}>
          <button
            onClick={() => setChatOpen((o) => !o)}
            className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs mb-2 transition-colors"
          >
            💬 {chatOpen ? '채팅 닫기' : '채팅 열기'}
          </button>
          {chatOpen && (
            <div className="h-[500px]">
              <ChatRoom tournamentId={tournament?.id ?? 'demo'} username={username} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
