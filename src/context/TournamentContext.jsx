import { createContext, useContext, useEffect, useState } from 'react'
import { getActiveTournament } from '../lib/supabase'

const TournamentContext = createContext(null)

export function TournamentProvider({ children }) {
  const [hasActiveTournament, setHasActiveTournament] = useState(false)

  useEffect(() => {
    getActiveTournament().then((t) => setHasActiveTournament(!!t)).catch(() => {})
  }, [])

  return (
    <TournamentContext.Provider value={{ hasActiveTournament, setHasActiveTournament }}>
      {children}
    </TournamentContext.Provider>
  )
}

export function useTournament() {
  return useContext(TournamentContext)
}
