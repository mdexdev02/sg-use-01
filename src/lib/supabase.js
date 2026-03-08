import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Tournaments ─────────────────────────────────────────────────────────────

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

// 토너먼트 + 조 편성 + 매치 한 번에 생성
export async function initializeTournament(name) {
  const tournament = await createTournament(name)

  // DB에서 날씨팀 목록 가져오기
  const { data: teams, error: teamsError } = await supabase
    .from('weather_teams')
    .select('*')
    .order('id')
  if (teamsError) throw teamsError

  // 팀 셔플
  const shuffled = [...teams].sort(() => Math.random() - 0.5)
  const groupCount = 12
  const teamsPerGroup = 4

  for (let i = 0; i < groupCount; i++) {
    const groupTeams = shuffled.slice(i * teamsPerGroup, (i + 1) * teamsPerGroup)
    const groupName = `${String.fromCharCode(65 + i)}조`

    // 그룹 생성
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({ tournament_id: tournament.id, name: groupName })
      .select()
      .single()
    if (groupError) throw groupError

    // 그룹 멤버 생성
    const { error: membersError } = await supabase
      .from('group_members')
      .insert(groupTeams.map((t) => ({ group_id: group.id, team_id: t.id })))
    if (membersError) throw membersError

    // 매치 생성 (4팀 → 6경기)
    const matchInserts = []
    let matchOrder = i * 6
    for (let a = 0; a < groupTeams.length; a++) {
      for (let b = a + 1; b < groupTeams.length; b++) {
        matchInserts.push({
          tournament_id: tournament.id,
          group_id: group.id,
          round: 'group',
          match_order: matchOrder++,
          team1_id: groupTeams[a].id,
          team2_id: groupTeams[b].id,
        })
      }
    }
    const { error: matchesError } = await supabase.from('matches').insert(matchInserts)
    if (matchesError) throw matchesError
  }

  return tournament
}

// ─── Matches ──────────────────────────────────────────────────────────────────

export async function getMatches(tournamentId) {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      team1:weather_teams!team1_id(*),
      team2:weather_teams!team2_id(*),
      group:groups!group_id(id, name)
    `)
    .eq('tournament_id', tournamentId)
    .order('match_order', { ascending: true })
  if (error) throw error
  return data
}

export async function vote(matchId, teamSide) {
  const { data, error } = await supabase.rpc('cast_vote', {
    p_match_id: matchId,
    p_side: teamSide,
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
