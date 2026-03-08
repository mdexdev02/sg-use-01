import { useState, useEffect } from 'react'
import { weatherTypes } from '../../data/weatherTypes'

const STORAGE_KEY = 'pot_presets'

function loadPresetsFromStorage() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function savePresetsToStorage(presets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
}

const POT_COLORS = {
  1: {
    bg: 'bg-rose-500/20',
    border: 'border-rose-400',
    text: 'text-rose-300',
    dot: 'bg-rose-400',
    btnActive: 'bg-rose-500/30 border-rose-400 text-rose-300',
    jarBorder: 'border-rose-400/60',
    jarBg: 'bg-rose-500/10',
    jarGlow: 'shadow-rose-500/20',
  },
  2: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-400',
    text: 'text-blue-300',
    dot: 'bg-blue-400',
    btnActive: 'bg-blue-500/30 border-blue-400 text-blue-300',
    jarBorder: 'border-blue-400/60',
    jarBg: 'bg-blue-500/10',
    jarGlow: 'shadow-blue-500/20',
  },
  3: {
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-400',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
    btnActive: 'bg-emerald-500/30 border-emerald-400 text-emerald-300',
    jarBorder: 'border-emerald-400/60',
    jarBg: 'bg-emerald-500/10',
    jarGlow: 'shadow-emerald-500/20',
  },
  4: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-400',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
    btnActive: 'bg-amber-500/30 border-amber-400 text-amber-300',
    jarBorder: 'border-amber-400/60',
    jarBg: 'bg-amber-500/10',
    jarGlow: 'shadow-amber-500/20',
  },
}

export default function PotSetup({ onComplete }) {
  const [assignments, setAssignments] = useState({})
  const [selectedTeamId, setSelectedTeamId] = useState(null)
  const [filterPot, setFilterPot] = useState(0)
  const [presets, setPresets] = useState([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [savedToast, setSavedToast] = useState('')
  const [checkedIds, setCheckedIds] = useState(new Set())

  useEffect(() => {
    loadPresets()
  }, [])

  function loadPresets() {
    setPresets(loadPresetsFromStorage())
  }

  function autoAssign() {
    const shuffled = [...weatherTypes].sort(() => Math.random() - 0.5)
    const newAssignments = {}
    shuffled.forEach((team, idx) => {
      newAssignments[team.id] = Math.floor(idx / 12) + 1
    })
    setAssignments(newAssignments)
    setSelectedTeamId(null)
  }

  function autoAssignRemaining() {
    const unassigned = weatherTypes.filter((t) => !assignments[t.id])
    if (unassigned.length === 0) return
    const shuffled = [...unassigned].sort(() => Math.random() - 0.5)
    const potCounts = [1, 2, 3, 4].map(
      (p) => Object.values(assignments).filter((v) => v === p).length
    )
    const newAssignments = { ...assignments }
    for (const team of shuffled) {
      let targetPot = 0
      let minCount = 13
      for (let p = 0; p < 4; p++) {
        if (potCounts[p] < 12 && potCounts[p] < minCount) {
          minCount = potCounts[p]
          targetPot = p + 1
        }
      }
      if (targetPot === 0) break
      newAssignments[team.id] = targetPot
      potCounts[targetPot - 1]++
    }
    setAssignments(newAssignments)
    setSelectedTeamId(null)
  }

  function assignTeamToPot(teamId, pot) {
    setAssignments((prev) => {
      const newA = { ...prev }
      if (newA[teamId] === pot) {
        delete newA[teamId]
      } else {
        newA[teamId] = pot
      }
      return newA
    })
    setSelectedTeamId(null)
  }

  function removeAssignment(teamId) {
    setAssignments((prev) => {
      const newA = { ...prev }
      delete newA[teamId]
      return newA
    })
    setSelectedTeamId(null)
  }

  function handleSave() {
    if (!presetName.trim()) return
    const newPreset = {
      id: crypto.randomUUID(),
      name: presetName.trim(),
      assignments,
      created_at: new Date().toISOString(),
    }
    const updated = [...loadPresetsFromStorage(), newPreset]
    savePresetsToStorage(updated)
    setPresets(updated)
    setShowSaveModal(false)
    setPresetName('')
    setSavedToast(`"${newPreset.name}" 저장됨`)
    setTimeout(() => setSavedToast(''), 2500)
  }

  function handleLoadPreset(preset) {
    setAssignments(preset.assignments)
    setShowLoadModal(false)
    setSelectedTeamId(null)
  }

  function handleDeletePreset(id) {
    const updated = loadPresetsFromStorage().filter((p) => p.id !== id)
    savePresetsToStorage(updated)
    setPresets(updated)
    setCheckedIds((prev) => { const s = new Set(prev); s.delete(id); return s })
  }

  function handleBulkDelete() {
    if (!checkedIds.size) return
    if (!confirm(`선택한 ${checkedIds.size}개 프리셋을 삭제할까요?`)) return
    const updated = loadPresetsFromStorage().filter((p) => !checkedIds.has(p.id))
    savePresetsToStorage(updated)
    setPresets(updated)
    setCheckedIds(new Set())
  }

  async function handleBulkShare() {
    const selected = presets.filter((p) => checkedIds.has(p.id))
    const json = JSON.stringify(selected, null, 2)
    const fileName = `pot_presets_${new Date().toISOString().slice(0,10)}.json`
    const file = new File([json], fileName, { type: 'application/json' })
    let shared = false
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: '포트 배정 프리셋' })
        shared = true
      } catch (e) {
        if (e.name === 'AbortError') return // 사용자가 취소
      }
    }
    if (!shared) {
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url; a.download = fileName; a.click()
      URL.revokeObjectURL(url)
      setSavedToast('파일 다운로드됨')
      setTimeout(() => setSavedToast(''), 2500)
    }
  }

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result)
        if (!Array.isArray(imported)) throw new Error()
        const existing = loadPresetsFromStorage()
        const existingIds = new Set(existing.map((p) => p.id))
        const newOnes = imported.filter((p) => !existingIds.has(p.id))
        const updated = [...existing, ...newOnes]
        savePresetsToStorage(updated)
        setPresets(updated)
        setSavedToast(`${newOnes.length}개 프리셋 가져옴`)
        setTimeout(() => setSavedToast(''), 2500)
      } catch {
        alert('올바른 프리셋 파일이 아닙니다.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function toggleCheck(id) {
    setCheckedIds((prev) => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function toggleAll() {
    setCheckedIds(checkedIds.size === presets.length ? new Set() : new Set(presets.map((p) => p.id)))
  }

  const potCounts = [1, 2, 3, 4].map(
    (p) => Object.values(assignments).filter((v) => v === p).length
  )
  const assignedCount = Object.keys(assignments).length
  const allAssigned = assignedCount === 48 && potCounts.every((c) => c === 12)

  const filteredTeams =
    filterPot === 0
      ? weatherTypes
      : filterPot === -1
      ? weatherTypes.filter((t) => !assignments[t.id])
      : weatherTypes.filter((t) => assignments[t.id] === filterPot)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {savedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-emerald-600 text-white rounded-2xl shadow-xl font-medium text-sm">
          ✅ {savedToast}
        </div>
      )}
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">🏆 포트 배정</h1>
          <p className="text-slate-400 mt-1">48개 팀을 4개 포트에 각 12팀씩 배정하세요</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setAssignments({}); setSelectedTeamId(null) }}
            disabled={assignedCount === 0}
            className="px-3 py-2 bg-red-900/50 hover:bg-red-800/70 disabled:opacity-40 text-red-300 rounded-xl text-sm transition-colors"
          >
            🗑️ 모두 지우기
          </button>
          <button
            onClick={autoAssign}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm transition-colors"
          >
            🎲 자동 배정
          </button>
          <button
            onClick={autoAssignRemaining}
            disabled={assignedCount === 48}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white rounded-xl text-sm transition-colors"
          >
            ✨ 나머지 자동
          </button>
          <button
            onClick={() => setShowSaveModal(true)}
            disabled={assignedCount === 0}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-sm transition-colors"
          >
            💾 저장
          </button>
          <button
            onClick={() => { loadPresets(); setShowLoadModal(true) }}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm transition-colors"
          >
            📂 불러오기
          </button>
        </div>
      </div>

      {/* 4 Glass Jars */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((pot) => {
          const color = POT_COLORS[pot]
          const teams = weatherTypes.filter((t) => assignments[t.id] === pot)
          const count = teams.length
          const isFull = count === 12

          return (
            <div
              key={pot}
              className={`relative rounded-2xl border-2 transition-all duration-300
                ${isFull ? `${color.jarBorder} ${color.jarBg} shadow-lg ${color.jarGlow}` : 'border-slate-700 bg-slate-800/40'}
              `}
            >
              {/* Jar top rim */}
              <div
                className={`px-4 py-2 flex items-center justify-between border-b ${isFull ? color.jarBorder : 'border-slate-700'}`}
              >
                <span className={`font-bold text-sm ${isFull ? color.text : 'text-slate-400'}`}>
                  포트 {pot}
                </span>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                    isFull
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-700 text-slate-500'
                  }`}
                >
                  {count}/12
                </span>
              </div>

              {/* Jar body */}
              <div className="p-2 min-h-[180px] flex flex-wrap gap-1 content-start">
                {teams.length === 0 && (
                  <div className="w-full h-32 flex items-center justify-center">
                    <span className="text-slate-600 text-xs text-center">
                      팀을 선택해서<br />포트에 넣으세요
                    </span>
                  </div>
                )}
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() =>
                      setSelectedTeamId(selectedTeamId === team.id ? null : team.id)
                    }
                    className={`text-xs px-1.5 py-0.5 rounded-full border transition-all hover:brightness-125
                      ${selectedTeamId === team.id ? 'ring-2 ring-white scale-105' : ''}
                      ${color.border} ${color.bg} ${color.text}
                    `}
                    title={team.name}
                  >
                    {team.emoji} {team.name}
                  </button>
                ))}
              </div>

              {/* Progress bar at the bottom */}
              <div className="px-3 pb-3">
                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull ? 'bg-emerald-400' : color.dot
                    }`}
                    style={{ width: `${(count / 12) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { label: '전체', value: 0, count: 48 },
          { label: '미배정', value: -1, count: 48 - assignedCount },
          { label: '포트 1', value: 1, count: potCounts[0] },
          { label: '포트 2', value: 2, count: potCounts[1] },
          { label: '포트 3', value: 3, count: potCounts[2] },
          { label: '포트 4', value: 4, count: potCounts[3] },
        ].map((f) => {
          const color = f.value > 0 ? POT_COLORS[f.value] : null
          const isActive = filterPot === f.value
          return (
            <button
              key={f.value}
              onClick={() => { setFilterPot(f.value); setSelectedTeamId(null) }}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all
                ${
                  isActive
                    ? color
                      ? `${color.bg} border border-${color.border} ${color.text}`
                      : 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600'
                }
              `}
            >
              {f.label}
              <span className="ml-1.5 opacity-70 text-xs">({f.count})</span>
            </button>
          )
        })}
      </div>

      {/* Team Ball Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 mb-8">
        {filteredTeams.map((team) => {
          const pot = assignments[team.id]
          const color = pot ? POT_COLORS[pot] : null
          const isSelected = selectedTeamId === team.id

          return (
            <div key={team.id} className="relative">
              <button
                onClick={() => setSelectedTeamId(isSelected ? null : team.id)}
                className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150
                  ${pot ? `${color.bg} border-2 ${color.border}` : 'bg-slate-800 border-2 border-slate-700'}
                  ${isSelected ? 'ring-2 ring-white scale-110 z-10' : 'hover:scale-105'}
                `}
                title={`${team.emoji} ${team.name}${pot ? ` — 포트 ${pot}` : ' — 미배정'}`}
              >
                <span className="text-xl leading-none">{team.emoji}</span>
                <span className="text-[9px] text-slate-300 leading-tight px-0.5 truncate w-full text-center">
                  {team.name}
                </span>
                {pot && (
                  <span className={`text-[8px] font-bold ${color.text}`}>P{pot}</span>
                )}
              </button>

              {/* Pot selector popup */}
              {isSelected && (
                <div
                  className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 border border-slate-600 rounded-2xl px-2 py-2 shadow-2xl flex gap-1.5 items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {[1, 2, 3, 4].map((p) => {
                    const c = POT_COLORS[p]
                    const isAssigned = assignments[team.id] === p
                    return (
                      <button
                        key={p}
                        onClick={() => assignTeamToPot(team.id, p)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold border-2 transition-all hover:scale-110
                          ${isAssigned ? c.btnActive : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400'}
                        `}
                      >
                        {p}
                      </button>
                    )
                  })}
                  {assignments[team.id] && (
                    <button
                      onClick={() => removeAssignment(team.id)}
                      className="w-8 h-8 rounded-xl text-xs font-bold border-2 bg-red-900/40 border-red-600/60 text-red-400 hover:scale-110 transition-all"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Start Button */}
      <div className="text-center pb-8">
        {!allAssigned && (
          <p className="text-slate-500 text-sm mb-3">
            {48 - assignedCount > 0 && `${48 - assignedCount}개 팀이 아직 배정되지 않았습니다. `}
            {potCounts.some((c) => c !== 12) &&
              '각 포트에 정확히 12팀이 필요합니다.'}
          </p>
        )}
        <button
          onClick={() => onComplete(assignments)}
          disabled={!allAssigned}
          className="px-10 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-xl transition-all hover:scale-105 disabled:hover:scale-100 shadow-lg"
        >
          🏆 대회 시작하기
        </button>
      </div>

      {/* Backdrop click to close popover */}
      {selectedTeamId && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setSelectedTeamId(null)}
        />
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-80 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-1">💾 프리셋 저장</h3>
            <p className="text-slate-400 text-xs mb-4">
              현재 배정({assignedCount}/48팀)을 저장합니다
            </p>
            <input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="프리셋 이름 입력..."
              className="w-full px-3 py-2 bg-slate-700 border border-slate-500 text-white rounded-xl mb-4 outline-none focus:border-blue-400 transition-colors"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowSaveModal(false); setPresetName('') }}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={!presetName.trim()}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-[26rem] max-h-[80vh] flex flex-col shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-lg">📂 프리셋 불러오기</h3>
              <label className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs cursor-pointer transition-colors">
                📥 가져오기
                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
            </div>

            {/* Bulk action bar */}
            {presets.length > 0 && (
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-700">
                <input
                  type="checkbox"
                  checked={checkedIds.size === presets.length && presets.length > 0}
                  onChange={toggleAll}
                  className="w-4 h-4 accent-blue-500 cursor-pointer"
                />
                <span className="text-slate-400 text-xs flex-1">
                  {checkedIds.size > 0 ? `${checkedIds.size}개 선택됨` : '전체 선택'}
                </span>
                {checkedIds.size > 0 && (
                  <>
                    <button
                      onClick={handleBulkShare}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      📤 공유
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="px-3 py-1 bg-red-900/50 hover:bg-red-800/70 text-red-300 rounded-lg text-xs font-medium transition-colors"
                    >
                      🗑️ 삭제
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {presets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <span className="text-3xl">📭</span>
                  <p className="text-slate-400 text-sm">저장된 프리셋이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2 mb-2">
                  {presets.map((preset) => {
                    const presetPotCounts = [1, 2, 3, 4].map(
                      (p) => Object.values(preset.assignments || {}).filter((v) => v === p).length
                    )
                    const isChecked = checkedIds.has(preset.id)
                    return (
                      <div
                        key={preset.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer
                          ${isChecked ? 'bg-slate-700 border-slate-500' : 'bg-slate-700/50 border-slate-600/50 hover:border-slate-500/50'}`}
                        onClick={() => toggleCheck(preset.id)}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCheck(preset.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 accent-blue-500 cursor-pointer flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-medium truncate">🏷️ {preset.name}</div>
                          <div className="text-slate-500 text-xs mt-0.5">
                            {new Date(preset.created_at).toLocaleDateString('ko-KR')} · {Object.keys(preset.assignments || {}).length}팀
                          </div>
                          <div className="flex gap-1 mt-1">
                            {presetPotCounts.map((c, i) => (
                              <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${POT_COLORS[i+1].bg} ${POT_COLORS[i+1].text} border ${POT_COLORS[i+1].border}`}>
                                P{i+1}:{c}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleLoadPreset(preset) }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors flex-shrink-0"
                        >
                          불러오기
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <button
              onClick={() => { setShowLoadModal(false); setCheckedIds(new Set()) }}
              className="mt-4 w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
