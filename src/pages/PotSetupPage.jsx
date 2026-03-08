import { useNavigate } from 'react-router-dom'
import PotSetup, { clearPotDraft } from '../components/worldcup/PotSetup'
import { initializeTournament } from '../lib/supabase'
import { useTournament } from '../context/TournamentContext'
import { useState } from 'react'

export default function PotSetupPage() {
  const navigate = useNavigate()
  const { setHasActiveTournament } = useTournament()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleComplete(potAssignments) {
    setLoading(true)
    setError(null)
    try {
      await initializeTournament('날씨 월드컵 시즌 1', potAssignments)
      clearPotDraft()
      setHasActiveTournament(true)
      navigate('/worldcup')
    } catch (e) {
      console.error(e)
      setError('토너먼트 생성에 실패했습니다. 다시 시도해주세요.')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-5xl animate-bounce mb-4">⛈️</div>
          <p className="text-slate-400">대회 생성 중...</p>
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
            onClick={() => setError(null)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return <PotSetup onComplete={handleComplete} />
}
