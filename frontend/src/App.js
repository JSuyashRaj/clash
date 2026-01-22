import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import HomePage from './pages/HomePage';
import TeamsPage from './pages/TeamsPage';
import ClashesPage from './pages/ClashesPage';
import LeaderboardPage from './pages/LeaderboardPage';
import KnockoutsPage from './pages/KnockoutsPage';
import ClashDetailPage from './pages/ClashDetailPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminTeamsPage from './pages/AdminTeamsPage';
import AdminClashesPage from './pages/AdminClashesPage';
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <div className="App">
      <div className="noise-texture" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="teams" element={<TeamsPage />} />
            <Route path="clashes" element={<ClashesPage />} />
            <Route path="clashes/:id" element={<ClashDetailPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="knockouts" element={<KnockoutsPage />} />
            <Route path="admin/login" element={<AdminLoginPage />} />
            <Route path="admin/dashboard" element={<AdminDashboard />} />
            <Route path="admin/teams" element={<AdminTeamsPage />} />
            <Route path="admin/clashes" element={<AdminClashesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" theme="dark" />
    </div>
  );
}

export default App;
