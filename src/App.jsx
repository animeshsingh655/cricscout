import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import PlayerExplorer from './pages/PlayerExplorer'
import TournamentHub from './pages/TournamentHub'
import PlayerCard from './pages/PlayerCard'
import Watchlist from './pages/Watchlist'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"               element={<Navigate to="/players" replace />} />
        <Route path="/players"        element={<PlayerExplorer />} />
        <Route path="/players/:id"    element={<PlayerCard />} />
        <Route path="/tournaments"    element={<TournamentHub />} />
        <Route path="/watchlist"      element={<Watchlist />} />
        <Route path="/rising"         element={<Navigate to="/players" replace />} />
        <Route path="*"               element={<Navigate to="/players" replace />} />
      </Routes>
    </Layout>
  )
}
