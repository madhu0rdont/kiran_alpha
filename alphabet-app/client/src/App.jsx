import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Home from './pages/Home';
import Session from './pages/Session';
import SessionComplete from './pages/SessionComplete';
import Progress from './pages/Progress';

export default function App() {
  const [muted, setMuted] = useState(true);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/session/:mode" element={<Session muted={muted} setMuted={setMuted} />} />
      <Route path="/complete/:mode" element={<SessionComplete muted={muted} />} />
      <Route path="/progress" element={<Navigate to="/progress/upper" replace />} />
      <Route path="/progress/:mode" element={<Progress />} />
    </Routes>
  );
}
