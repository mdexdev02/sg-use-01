import { Link } from 'react-router-dom'
import { weatherTypes, WEATHER_CATEGORIES } from '../data/weatherTypes'

const categoryColors = {
  [WEATHER_CATEGORIES.RAIN]: 'from-blue-600 to-cyan-500',
  [WEATHER_CATEGORIES.CLEAR]: 'from-yellow-500 to-orange-400',
  [WEATHER_CATEGORIES.CLOUDY]: 'from-slate-500 to-gray-400',
  [WEATHER_CATEGORIES.WIND]: 'from-teal-500 to-emerald-400',
  [WEATHER_CATEGORIES.DISASTER]: 'from-red-600 to-rose-500',
}

export default function Home() {
  const categoryCounts = Object.fromEntries(
    Object.values(WEATHER_CATEGORIES).map((cat) => [
      cat,
      weatherTypes.filter((w) => w.category === cat).length,
    ])
  )

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      {/* Hero */}
      <section className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
          ⛈️ 날씨 월드컵
        </h1>
        <p className="text-xl text-slate-400 mb-2 font-medium">소나기 &amp; 소낙눈 &amp; 돌풍</p>
        <p className="text-slate-500 mb-8">
          48가지 날씨 중 가장 좋아하는 날씨는? 48강 조별리그 + 32강 토너먼트로 결판내자!
        </p>
        <Link
          to="/worldcup"
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-blue-500/30"
        >
          🏆 투표 시작하기
        </Link>
      </section>

      {/* Format */}
      <section className="mb-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: '참가 날씨', value: '48', unit: '팀' },
          { label: '조별리그', value: '12', unit: '조 × 4팀' },
          { label: '토너먼트', value: '32강', unit: '→ 결승' },
          { label: '총 경기', value: '72+', unit: '경기' },
        ].map(({ label, value, unit }) => (
          <div key={label} className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
            <p className="text-2xl font-black text-blue-400">{value}</p>
            <p className="text-xs text-slate-400">{unit}</p>
            <p className="text-sm text-slate-300 mt-1">{label}</p>
          </div>
        ))}
      </section>

      {/* Category breakdown */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">날씨 계열별 참가팀</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <div
              key={cat}
              className={`bg-gradient-to-r ${categoryColors[cat]} p-px rounded-xl`}
            >
              <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-between">
                <span className="font-semibold text-white">{cat}</span>
                <span className="text-2xl font-black text-white">{count}팀</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Weather list preview */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-white mb-4">참가 날씨 목록</h2>
        <div className="flex flex-wrap gap-2">
          {weatherTypes.map((w) => (
            <span
              key={w.id}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-sm text-slate-300"
            >
              {w.emoji} {w.name}
            </span>
          ))}
        </div>
      </section>
      <footer className="mt-10 text-center text-white text-sm">v.0.1.0.7</footer>
    </main>
  )
}
