import { useState, useEffect } from 'react'
import WeatherCard from './WeatherCard'
import { vote, subscribeToMatch } from '../../lib/supabase'

export default function MatchVote({ match, onVoted }) {
  const [voted, setVoted] = useState(null) // 'team1' | 'team2' | 'draw'
  const [liveMatch, setLiveMatch] = useState(match)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLiveMatch(match)
    setVoted(null)
  }, [match])

  useEffect(() => {
    if (!match?.id) return
    const channel = subscribeToMatch(match.id, (updated) => {
      setLiveMatch(updated)
    })
    return () => channel.unsubscribe()
  }, [match?.id])

  const totalVotes = (liveMatch?.votes1 ?? 0) + (liveMatch?.votes2 ?? 0)

  async function handleVote(side) {
    if (voted || loading) return
    setLoading(true)
    try {
      await vote(liveMatch.id, side)
      setVoted(side)
      onVoted?.(side)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function handleDraw() {
    if (voted || loading) return
    setVoted('draw')
    onVoted?.('draw')
  }

  if (!match) return null

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
      <div className="text-center">
        <span className="text-sm font-medium text-slate-400 uppercase tracking-widest">
          {match.groupName} · {match.roundLabel}
        </span>
        <h2 className="text-2xl font-bold text-white mt-1">어떤 날씨가 더 좋으세요?</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        <WeatherCard
          weather={match.team1}
          onClick={() => handleVote('team1')}
          selected={voted === 'team1'}
          votes={liveMatch?.votes1 ?? 0}
          totalVotes={totalVotes}
          disabled={!!voted || loading}
        />

        <div className="flex items-center justify-center">
          <span className="text-3xl font-black text-slate-500">VS</span>
        </div>

        <WeatherCard
          weather={match.team2}
          onClick={() => handleVote('team2')}
          selected={voted === 'team2'}
          votes={liveMatch?.votes2 ?? 0}
          totalVotes={totalVotes}
          disabled={!!voted || loading}
        />
      </div>

      {!voted && (
        <button
          onClick={handleDraw}
          disabled={loading}
          className="px-8 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-slate-300 rounded-xl font-medium transition-colors text-sm"
        >
          🤝 무승부
        </button>
      )}

      {voted && (
        <p className="text-green-400 font-semibold animate-pulse">
          ✅ 투표 완료! 실시간 결과를 확인하세요.
        </p>
      )}

      {!voted && (
        <p className="text-slate-500 text-sm">카드를 클릭해서 투표하거나 무승부를 선택하세요</p>
      )}
    </div>
  )
}
