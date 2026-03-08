import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/layout/Header'
import Home from './pages/Home'
import WorldCup from './pages/WorldCup'
import Bracket from './pages/Bracket'
import Results from './pages/Results'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/worldcup" element={<WorldCup />} />
          <Route path="/bracket" element={<Bracket />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
