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

export async function completeTournament(id) {
  const { error } = await supabase
    .from('tournaments')
    .update({ status: 'completed' })
    .eq('id', id)
  if (error) throw error
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
// potAssignments: { [frontendTeamId]: 1|2|3|4 }
// frontendTeams: weatherTypes + customTeams 전체 목록
export async function initializeTournament(name, potAssignments = null, frontendTeams = []) {
  const tournament = await createTournament(name)

  // 배정된 프론트엔드 팀 목록 추출
  const assignedFrontendTeams = frontendTeams.filter(
    (t) => potAssignments && (potAssignments[t.id] !== undefined || potAssignments[String(t.id)] !== undefined)
  )

  // DB에 없는 팀은 upsert (이름 기반 — 중복 방지)
  if (assignedFrontendTeams.length > 0) {
    await supabase.from('weather_teams').upsert(
      assignedFrontendTeams.map((t) => ({ name: t.name, emoji: t.emoji, category: t.category })),
      { onConflict: 'name', ignoreDuplicates: true }
    )
  }

  // DB에서 이름 → id 매핑 (이름 기반 매칭으로 serial ID 불일치 버그 수정)
  const { data: dbTeams, error: teamsError } = await supabase
    .from('weather_teams')
    .select('*')
    .order('id')
  if (teamsError) throw teamsError

  const nameToDbTeam = new Map(dbTeams.map((t) => [t.name, t]))

  const groupCount = 12

  const RAIN_CATEGORY = '강수 계열'
  const MAX_RAIN = 2
  const MAX_OTHER_CATEGORY = 1

  function groupSatisfiesConstraints(groupTeams) {
    const rainCount = groupTeams.filter((t) => t.category === RAIN_CATEGORY).length
    if (rainCount > MAX_RAIN) return false
    const nonRainCats = groupTeams.filter((t) => t.category !== RAIN_CATEGORY).map((t) => t.category)
    return new Set(nonRainCats).size === nonRainCats.length
  }

  function buildGroupTeamsArray(pots) {
    for (let attempt = 0; attempt < 300; attempt++) {
      const shuffledPots = pots.map((pot) => [...pot].sort(() => Math.random() - 0.5))
      const candidate = Array.from({ length: groupCount }, (_, i) =>
        shuffledPots.map((pot) => pot[i]).filter(Boolean)
      )
      if (candidate.every(groupSatisfiesConstraints)) {
        return candidate.map((g) => g.sort(() => Math.random() - 0.5))
      }
    }
    const shuffledPots = pots.map((pot) => [...pot].sort(() => Math.random() - 0.5))
    return Array.from({ length: groupCount }, (_, i) =>
      shuffledPots.map((pot) => pot[i]).filter(Boolean).sort(() => Math.random() - 0.5)
    )
  }

  let groupTeamsArray
  if (potAssignments && assignedFrontendTeams.length > 0) {
    // 프론트엔드 팀 → DB 팀 매핑 (이름 기반)
    const pots = [1, 2, 3, 4].map((p) =>
      assignedFrontendTeams
        .filter((ft) => potAssignments[ft.id] === p || potAssignments[String(ft.id)] === p)
        .map((ft) => nameToDbTeam.get(ft.name))
        .filter(Boolean)
    )
    groupTeamsArray = buildGroupTeamsArray(pots)
  } else {
    // potAssignments 없으면 DB 전체 랜덤 (48팀 기준)
    const shuffled = [...dbTeams].sort(() => Math.random() - 0.5).slice(0, 48)
    groupTeamsArray = Array.from({ length: groupCount }, (_, i) =>
      shuffled.slice(i * 4, (i + 1) * 4)
    )
  }

  for (let i = 0; i < groupCount; i++) {
    const groupTeams = groupTeamsArray[i]
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

// ─── Pot Presets ──────────────────────────────────────────────────────────────

export async function getPotPresets() {
  const { data, error } = await supabase
    .from('pot_presets')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function savePotPreset(name, assignments) {
  const { data, error } = await supabase
    .from('pot_presets')
    .insert({ name, assignments })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePotPreset(id) {
  const { error } = await supabase.from('pot_presets').delete().eq('id', id)
  if (error) throw error
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
