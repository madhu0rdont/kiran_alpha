import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Session from './pages/Session';
import SessionComplete from './pages/SessionComplete';
import Progress from './pages/Progress';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/session/:mode" element={<Session />} />
      <Route path="/complete/:mode" element={<SessionComplete />} />
      <Route path="/progress/:mode" element={<Progress />} />
    </Routes>
  );
}
