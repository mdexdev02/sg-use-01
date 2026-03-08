import { useState, useEffect, useCallback } from 'react'
import MatchVote from '../components/worldcup/MatchVote'
import GroupStandings from '../components/worldcup/GroupStandings'
import ChatRoom from '../components/chat/ChatRoom'
import PotSetup from '../components/worldcup/PotSetup'
import { getActiveTournament, getMatches, initializeTournament, completeTournament } from '../lib/supabase'

const GUEST_NAME = `날씨인#${Math.floor(Math.random() * 9000) + 1000}`

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
  const [tournament, setTournament] = useState(null)
  const [groups, setGroups] = useState([])
  const [allMatches, setAllMatches] = useState([])
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0)
  const [phase, setPhase] = useState('group')
  const [username] = useState(GUEST_NAME)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chatOpen, setChatOpen] = useState(true)
  const [showPotSetup, setShowPotSetup] = useState(false)

  useEffect(() => {
    initTournament()
  }, [])

  async function initTournament() {
    setLoading(true)
    setError(null)
    try {
      const active = await getActiveTournament()

      // 활성 토너먼트가 없으면 포트 배정 화면 표시
      if (!active) {
        setShowPotSetup(true)
        setLoading(false)
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
    setGroups(buildGroups(matches))
  }

  async function handlePotSetupComplete(potAssignments) {
    setShowPotSetup(false)
    setLoading(true)
    setError(null)
    try {
      const active = await initializeTournament('날씨 월드컵 시즌 1', potAssignments)
      await loadTournamentData(active)
    } catch (e) {
      console.error(e)
      setError('토너먼트 생성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  async function handleNewTournament() {
    if (!confirm('현재 대회를 종료하고 새 대회를 시작할까요?')) return
    if (tournament) {
      try {
        await completeTournament(tournament.id)
      } catch (e) {
        console.error(e)
      }
    }
    setTournament(null)
    setAllMatches([])
    setGroups([])
    setCurrentMatchIdx(0)
    setShowPotSetup(true)
  }

  const handleVoted = useCallback(
    (side) => {
      setGroups((prev) => {
        const match = allMatches[currentMatchIdx]
        if (!match) return prev
        const winner = side === 'team1' ? match.team1 : match.team2
        const loser = side === 'team1' ? match.team2 : match.team1
        return prev.map((g) => {
          if (g.id !== match.group_id) return g
          return {
            ...g,
            standings: g.standings.map((s) => {
              if (s.teamId === winner.id)
                return { ...s, played: s.played + 1, wins: s.wins + 1, totalVotes: s.totalVotes + 1 }
              if (s.teamId === loser.id)
                return { ...s, played: s.played + 1, losses: s.losses + 1 }
              return s
            }),
          }
        })
      })
      setTimeout(() => {
        setCurrentMatchIdx((i) => Math.min(i + 1, allMatches.length - 1))
      }, 1500)
    },
    [allMatches, currentMatchIdx]
  )

  const progress = allMatches.length > 0 ? (currentMatchIdx / allMatches.length) * 100 : 0

  if (showPotSetup) {
    return <PotSetup onComplete={handlePotSetupComplete} />
  }

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
            {phase === 'group' ? '조별리그' : '토너먼트'} · 경기 {currentMatchIdx + 1} /{' '}
            {allMatches.length}
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
