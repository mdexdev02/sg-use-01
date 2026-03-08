import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/layout/Header'
import Home from './pages/Home'
import WorldCup from './pages/WorldCup'
import PotSetupPage from './pages/PotSetupPage'
import Bracket from './pages/Bracket'
import Results from './pages/Results'
import { TournamentProvider } from './context/TournamentContext'

export default function App() {
  return (
    <BrowserRouter>
      <TournamentProvider>
        <div className="min-h-screen bg-slate-950">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/potsetup" element={<PotSetupPage />} />
            <Route path="/worldcup" element={<WorldCup />} />
            <Route path="/bracket" element={<Bracket />} />
            <Route path="/results" element={<Results />} />
          </Routes>
        </div>
      </TournamentProvider>
    </BrowserRouter>
  )
}
