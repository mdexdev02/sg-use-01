import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Tournaments ─────────────────────────────────────────────────────────────

export async function getTournament(id) {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createTournament(name) {
  const { data, error } = await supabase
    .from('tournaments')
    .insert({ name, phase: 'group', status: 'active' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getActiveTournament() {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

// ─── Matches ──────────────────────────────────────────────────────────────────

export async function getMatches(tournamentId) {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('match_order', { ascending: true })
  if (error) throw error
  return data
}

export async function vote(matchId, teamSide) {
  const { data, error } = await supabase.rpc('cast_vote', {
    p_match_id: matchId,
    p_side: teamSide, // 'team1' | 'team2'
  })
  if (error) throw error
  return data
}

export function subscribeToMatch(matchId, callback) {
  return supabase
    .channel(`match:${matchId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
      (payload) => callback(payload.new)
    )
    .subscribe()
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export async function getChatMessages(tournamentId, limit = 50) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data
}

export async function sendChatMessage(tournamentId, username, message) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ tournament_id: tournamentId, username, message })
    .select()
    .single()
  if (error) throw error
  return data
}

export function subscribeToChat(tournamentId, callback) {
  return supabase
    .channel(`chat:${tournamentId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `tournament_id=eq.${tournamentId}`,
      },
      (payload) => callback(payload.new)
    )
    .subscribe()
}
