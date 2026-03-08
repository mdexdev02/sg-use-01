import { useState, useEffect, useCallback } from 'react'
import MatchVote from '../components/worldcup/MatchVote'
import GroupStandings from '../components/worldcup/GroupStandings'
import ChatRoom from '../components/chat/ChatRoom'
import { weatherTypes, createGroupStage, createGroupMatches } from '../data/weatherTypes'
import { getActiveTournament, getMatches } from '../lib/supabase'

const GUEST_NAME = `날씨인#${Math.floor(Math.random() * 9000) + 1000}`

export default function WorldCup() {
  const [tournament, setTournament] = useState(null)
  const [groups, setGroups] = useState([])
  const [allMatches, setAllMatches] = useState([])
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0)
  const [phase, setPhase] = useState('group') // 'group' | 'knockout'
  const [username] = useState(GUEST_NAME)
  const [loading, setLoading] = useState(true)
  const [chatOpen, setChatOpen] = useState(true)

  // 로컬 데모 모드 (Supabase 미연결 시)
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    initTournament()
  }, [])

  async function initTournament() {
    setLoading(true)
    try {
      const active = await getActiveTournament()
      if (active) {
        setTournament(active)
        const matches = await getMatches(active.id)
        setAllMatches(matches)
        setPhase(active.phase)
      } else {
        // 데모 모드: 로컬에서 조 편성
        setDemoMode(true)
        const g = createGroupStage(weatherTypes)
        const groupsWithMatches = g.map((group) => ({
          ...group,
          matches: createGroupMatches(group),
          standings: group.teams.map((t) => ({
            ...t,
            teamId: t.id,
            played: 0,
            wins: 0,
            losses: 0,
            totalVotes: 0,
          })),
        }))
        setGroups(groupsWithMatches)
        const flat = groupsWithMatches.flatMap((g) =>
          g.matches.map((m) => ({
            ...m,
            groupName: g.name,
            roundLabel: '조별리그',
          }))
        )
        setAllMatches(flat)
      }
    } catch {
      setDemoMode(true)
      const g = createGroupStage(weatherTypes)
      const groupsWithMatches = g.map((group) => ({
        ...group,
        matches: createGroupMatches(group),
        standings: group.teams.map((t) => ({
          ...t,
          teamId: t.id,
          played: 0,
          wins: 0,
          losses: 0,
          totalVotes: 0,
        })),
      }))
      setGroups(groupsWithMatches)
      const flat = groupsWithMatches.flatMap((g) =>
        g.matches.map((m) => ({
          ...m,
          groupName: g.name,
          roundLabel: '조별리그',
        }))
      )
      setAllMatches(flat)
    } finally {
      setLoading(false)
    }
  }

  const handleVoted = useCallback(
    (side) => {
      if (!demoMode) return
      setGroups((prev) => {
        const match = allMatches[currentMatchIdx]
        return prev.map((g) => {
          if (g.id !== match.groupId) return g
          const winner = side === 'team1' ? match.team1 : match.team2
          const loser = side === 'team1' ? match.team2 : match.team1
          return {
            ...g,
            standings: g.standings.map((s) => {
              if (s.teamId === winner.id)
                return { ...s, played: s.played + 1, wins: s.wins + 1 }
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
    [allMatches, currentMatchIdx, demoMode]
  )

  const progress = allMatches.length > 0 ? (currentMatchIdx / allMatches.length) * 100 : 0

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {demoMode && (
        <div className="mb-4 px-4 py-2 bg-yellow-900/40 border border-yellow-700 rounded-lg text-yellow-300 text-sm">
          ⚠️ 데모 모드 — Supabase 연결 후 실시간 투표가 활성화됩니다.
        </div>
      )}

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
          <span>
            {phase === 'group' ? '조별리그' : '토너먼트'} · 경기 {currentMatchIdx + 1} /{' '}
            {allMatches.length}
          </span>
          <span>{Math.round(progress)}% 완료</span>
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
