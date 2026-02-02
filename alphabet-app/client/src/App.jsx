import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import ProfileSelect from './pages/ProfileSelect';
import Home from './pages/Home';
import Session from './pages/Session';
import SessionComplete from './pages/SessionComplete';
import Progress from './pages/Progress';
import Admin from './pages/Admin';

export default function App() {
  const [muted, setMuted] = useState(true);

  return (
    <Routes>
      <Route path="/" element={<ProfileSelect />} />
      <Route path="/child/:childId" element={<Home />} />
      <Route path="/child/:childId/session/:mode" element={<Session muted={muted} setMuted={setMuted} />} />
      <Route path="/child/:childId/complete/:mode" element={<SessionComplete muted={muted} />} />
      <Route path="/child/:childId/progress" element={<Navigate to="upper" replace />} />
      <Route path="/child/:childId/progress/:mode" element={<Progress />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}
