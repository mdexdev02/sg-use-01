import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import MatchVote from '../components/worldcup/MatchVote'
import GroupStandings from '../components/worldcup/GroupStandings'
import ChatRoom from '../components/chat/ChatRoom'
import { getActiveTournament, getMatches, completeTournament } from '../lib/supabase'
import { useTournament } from '../context/TournamentContext'

const GUEST_NAME = `날씨인#${Math.floor(Math.random() * 9000) + 1000}`

// ─── Session persistence ──────────────────────────────────────────────────────
function sessionKey(tournamentId) {
  return `wc_session_${tournamentId}`
}

function saveSession(tournamentId, matchIdx, groups) {
  try {
    localStorage.setItem(sessionKey(tournamentId), JSON.stringify({ matchIdx, groups }))
  } catch (e) {
    // localStorage 용량 초과 등 무시
  }
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

// 매치 목록에서 조별 순위표 계산
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

// DB 매치를 컴포넌트 형식으로 변환
function normalizeMatch(m) {
  return {
    ...m,
    groupName: m.group?.name || '',
    roundLabel: m.round === 'group' ? '조별리그' : `${m.round}강`,
  }
}

export default function WorldCup() {
  const navigate = useNavigate()
  const { setHasActiveTournament } = useTournament()
  const [tournament, setTournament] = useState(null)
  const [groups, setGroups] = useState([])
  const [allMatches, setAllMatches] = useState([])
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0)
  const [phase, setPhase] = useState('group')
  const [username] = useState(GUEST_NAME)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chatOpen, setChatOpen] = useState(true)

  useEffect(() => {
    initTournament()
  }, [])

  async function initTournament() {
    setLoading(true)
    setError(null)
    try {
      const active = await getActiveTournament()

      // 활성 토너먼트가 없으면 포트 배정 페이지로 이동
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
    const matches = raw.map(normalizeMatch)
    setAllMatches(matches)

    const saved = loadSession(active.id)
    if (saved) {
      setCurrentMatchIdx(saved.matchIdx)
      setGroups(saved.groups)
    } else {
      setGroups(buildGroups(matches))
    }
  }

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
    setHasActiveTournament(false)
    navigate('/potsetup')
  }

  const handleVoted = useCallback(
    (side) => {
      const match = allMatches[currentMatchIdx]
      if (!match) return

      setGroups((prev) => {
        const updated = prev.map((g) => {
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
        const nextIdx = currentMatchIdx + 1
        if (tournament) saveSession(tournament.id, nextIdx, updated)
        return updated
      })
      setTimeout(() => {
        setCurrentMatchIdx((i) => i + 1)
      }, 1500)
    },
    [allMatches, currentMatchIdx, tournament]
  )

  const isGroupComplete = allMatches.length > 0 && currentMatchIdx >= allMatches.length
  const progress = allMatches.length > 0 ? (Math.min(currentMatchIdx, allMatches.length) / allMatches.length) * 100 : 0

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
          <span>
            {phase === 'group' ? '조별리그' : '토너먼트'} · 경기{' '}
            {isGroupComplete ? allMatches.length : currentMatchIdx + 1} / {allMatches.length}
          </span>
          <div className="flex items-center gap-3">
            <span>{Math.round(progress)}% 완료</span>
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
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main vote area */}
        <div className="flex-1">
          {isGroupComplete ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-2xl font-bold text-white mb-2">조별리그 완료!</h2>
              <p className="text-slate-400 mb-8">72경기 모두 완료했어요. 아래에서 최종 순위를 확인하세요.</p>
              <button
                onClick={handleNewTournament}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition-colors"
              >
                🔄 새 대회 시작
              </button>
            </div>
          ) : (
            <>
              <MatchVote
                match={allMatches[currentMatchIdx]}
                onVoted={handleVoted}
              />

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
            </>
          )}

          {/* Standings */}
          {phase === 'group' && groups.length > 0 && (
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
