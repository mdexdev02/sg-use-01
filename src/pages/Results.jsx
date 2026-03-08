import { weatherTypes } from '../data/weatherTypes'

export default function Results() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 text-center">
      <div className="text-7xl mb-4">🏆</div>
      <h1 className="text-3xl font-black text-white mb-3">결과 집계 중</h1>
      <p className="text-slate-400 mb-8">
        조별리그와 토너먼트가 완료되면 최종 순위가 공개됩니다.
      </p>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h2 className="text-lg font-bold text-white mb-4">🗓 진행 일정</h2>
        <div className="space-y-3 text-sm text-left">
          {[
            { step: '1단계', label: '48강 조별리그', desc: '12개 조, 각 4팀 · 조별 6경기', status: 'active' },
            { step: '2단계', label: '32강 토너먼트', desc: '조 상위 2팀 + 와일드카드 8팀', status: 'pending' },
            { step: '3단계', label: '16강 → 결승', desc: '단판 승부', status: 'pending' },
            { step: '완료', label: '최종 우승 날씨 공개', desc: '결과 페이지에서 확인', status: 'pending' },
          ].map(({ step, label, desc, status }) => (
            <div key={step} className="flex items-start gap-4">
              <span
                className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  status === 'active'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {status === 'active' ? '▶' : '○'}
              </span>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider">{step}</span>
                <p className="font-semibold text-white">{label}</p>
                <p className="text-slate-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
