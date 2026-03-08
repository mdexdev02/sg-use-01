// 날씨 월드컵 - 소나기 & 소낙눈 & 돌풍
// 48강 조별리그 + 32강 토너먼트

export const WEATHER_CATEGORIES = {
  RAIN: '강수 계열',
  CLEAR: '맑음 계열',
  CLOUDY: '흐림 계열',
  WIND: '바람 계열',
  DISASTER: '재해 계열',
}

export const weatherTypes = [
  // 강수 계열 (16팀)
  { id: 1, name: '비', emoji: '🌧️', category: WEATHER_CATEGORIES.RAIN },
  { id: 2, name: '소나기', emoji: '🌦️', category: WEATHER_CATEGORIES.RAIN },
  { id: 3, name: '폭우', emoji: '⛈️', category: WEATHER_CATEGORIES.RAIN },
  { id: 4, name: '비와눈', emoji: '🌨️', category: WEATHER_CATEGORIES.RAIN },
  { id: 5, name: '진눈깨비', emoji: '🌨️', category: WEATHER_CATEGORIES.RAIN },
  { id: 6, name: '소낙눈', emoji: '❄️', category: WEATHER_CATEGORIES.RAIN },
  { id: 7, name: '눈꽃', emoji: '🌸', category: WEATHER_CATEGORIES.RAIN },
  { id: 8, name: '함박눈', emoji: '🌨️', category: WEATHER_CATEGORIES.RAIN },
  { id: 9, name: '가랑비', emoji: '🌦️', category: WEATHER_CATEGORIES.RAIN },
  { id: 10, name: '찬비', emoji: '🌧️', category: WEATHER_CATEGORIES.RAIN },
  { id: 11, name: '안개비', emoji: '🌫️', category: WEATHER_CATEGORIES.RAIN },
  { id: 12, name: '우박', emoji: '🌨️', category: WEATHER_CATEGORIES.RAIN },
  { id: 13, name: '인공뇌우', emoji: '⚡', category: WEATHER_CATEGORIES.RAIN },
  { id: 14, name: '산성비', emoji: '☣️', category: WEATHER_CATEGORIES.RAIN },
  { id: 15, name: '홍수', emoji: '🌊', category: WEATHER_CATEGORIES.RAIN },
  { id: 16, name: '폭설', emoji: '❄️', category: WEATHER_CATEGORIES.RAIN },

  // 맑음 계열 (10팀)
  { id: 17, name: '맑음', emoji: '☀️', category: WEATHER_CATEGORIES.CLEAR },
  { id: 18, name: '폭염', emoji: '🔥', category: WEATHER_CATEGORIES.CLEAR },
  { id: 19, name: '열대야', emoji: '🌙', category: WEATHER_CATEGORIES.CLEAR },
  { id: 20, name: '혹서', emoji: '🥵', category: WEATHER_CATEGORIES.CLEAR },
  { id: 21, name: '오로라', emoji: '🌌', category: WEATHER_CATEGORIES.CLEAR },
  { id: 22, name: '엘니뇨', emoji: '🌡️', category: WEATHER_CATEGORIES.CLEAR },
  { id: 23, name: '맑으나때때로구름', emoji: '⛅', category: WEATHER_CATEGORIES.CLEAR },
  { id: 24, name: '구름조금', emoji: '🌤️', category: WEATHER_CATEGORIES.CLEAR },
  { id: 25, name: '맑고비', emoji: '🌈', category: WEATHER_CATEGORIES.CLEAR },
  { id: 26, name: '맑으면서눈', emoji: '🌨️', category: WEATHER_CATEGORIES.CLEAR },

  // 흐림 계열 (8팀)
  { id: 27, name: '흐림', emoji: '☁️', category: WEATHER_CATEGORIES.CLOUDY },
  { id: 28, name: '스모그', emoji: '🏭', category: WEATHER_CATEGORIES.CLOUDY },
  { id: 29, name: '안개', emoji: '🌫️', category: WEATHER_CATEGORIES.CLOUDY },
  { id: 30, name: '미세먼지', emoji: '😷', category: WEATHER_CATEGORIES.CLOUDY },
  { id: 31, name: '초미세먼지', emoji: '🫁', category: WEATHER_CATEGORIES.CLOUDY },
  { id: 32, name: '황사', emoji: '🏜️', category: WEATHER_CATEGORIES.CLOUDY },
  { id: 33, name: '연기', emoji: '💨', category: WEATHER_CATEGORIES.CLOUDY },
  { id: 34, name: '엷은안개', emoji: '🌁', category: WEATHER_CATEGORIES.CLOUDY },

  // 바람 계열 (8팀)
  { id: 35, name: '태풍', emoji: '🌀', category: WEATHER_CATEGORIES.WIND },
  { id: 36, name: '토네이도', emoji: '🌪️', category: WEATHER_CATEGORIES.WIND },
  { id: 37, name: '돌풍', emoji: '💨', category: WEATHER_CATEGORIES.WIND },
  { id: 38, name: '비바람', emoji: '🌬️', category: WEATHER_CATEGORIES.WIND },
  { id: 39, name: '열대저기압', emoji: '🌀', category: WEATHER_CATEGORIES.WIND },
  { id: 40, name: '사이클론', emoji: '🌀', category: WEATHER_CATEGORIES.WIND },
  { id: 41, name: '라니냐', emoji: '🌊', category: WEATHER_CATEGORIES.WIND },
  { id: 42, name: '대기', emoji: '🌬️', category: WEATHER_CATEGORIES.WIND },

  // 재해 계열 (12팀, 총 54팀)
  { id: 43, name: '마그마', emoji: '🌋', category: WEATHER_CATEGORIES.DISASTER },
  { id: 44, name: '운석', emoji: '☄️', category: WEATHER_CATEGORIES.DISASTER },
  { id: 45, name: '화산재', emoji: '🌋', category: WEATHER_CATEGORIES.DISASTER },
  { id: 46, name: '해일', emoji: '🌊', category: WEATHER_CATEGORIES.DISASTER },
  { id: 47, name: '가뭄', emoji: '🏜️', category: WEATHER_CATEGORIES.DISASTER },
  { id: 48, name: '쓰나미', emoji: '🌊', category: WEATHER_CATEGORIES.DISASTER },
  { id: 49, name: '방사능', emoji: '☢️', category: WEATHER_CATEGORIES.DISASTER },
  { id: 50, name: '산사태', emoji: '⛰️', category: WEATHER_CATEGORIES.DISASTER },
  { id: 51, name: '싱크홀', emoji: '🕳️', category: WEATHER_CATEGORIES.DISASTER },
  { id: 52, name: '빙하', emoji: '🧊', category: WEATHER_CATEGORIES.DISASTER },

  // 강수 계열 추가
  { id: 53, name: '천둥번개', emoji: '⚡', category: WEATHER_CATEGORIES.RAIN },
  { id: 54, name: '광역성비', emoji: '🌧️', category: WEATHER_CATEGORIES.RAIN },
]

// 48강: 12개 조, 각 4팀
export function createGroupStage(teams) {
  const shuffled = [...teams].sort(() => Math.random() - 0.5)
  const groups = []
  const groupCount = 12
  const teamsPerGroup = 4
  for (let i = 0; i < groupCount; i++) {
    groups.push({
      id: i,
      name: `${String.fromCharCode(65 + i)}조`,
      teams: shuffled.slice(i * teamsPerGroup, (i + 1) * teamsPerGroup),
      matches: [],
      standings: [],
    })
  }
  return groups
}

// 그룹 내 경기 생성 (4팀 → 6경기)
export function createGroupMatches(group) {
  const matches = []
  const { teams } = group
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        id: `${group.id}-${i}-${j}`,
        groupId: group.id,
        team1: teams[i],
        team2: teams[j],
        votes1: 0,
        votes2: 0,
        status: 'pending', // pending | voting | done
      })
    }
  }
  return matches
}
