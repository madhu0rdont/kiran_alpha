import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { completeSession } from '../services/api';
import { EMOJI_MAP } from '../lib/emojis';
import { playCelebration } from '../lib/sounds';
import { speakWord } from '../lib/speech';

const CELEBRATION_EMOJIS = ['⭐', '🌟', '✨', '🎉', '🥳', '💫', '🎊'];

function FloatingEmoji({ emoji, style }) {
  return (
    <span className="absolute text-4xl animate-float-up pointer-events-none" style={style}>
      {emoji}
    </span>
  );
}

export default function SessionComplete({ muted }) {
  const { mode, childId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { sessionId, totalShown = 0, correctCount = 0, results = [], cards = [] } = state || {};

  const [particles] = useState(() => {
    const items = [];
    for (let i = 0; i < 12; i++) {
      const leftBase = (i * 7 + 10) % 80 + 10;
      const topBase = (i * 5 + 30) % 40 + 30;
      items.push({
        id: i,
        emoji: CELEBRATION_EMOJIS[i % CELEBRATION_EMOJIS.length],
        style: {
          left: `${leftBase}%`,
          top: `${topBase}%`,
          animationDelay: `${i * 0.15}s`,
        },
      });
    }
    return items;
  });
  const pct = totalShown > 0 ? Math.round((correctCount / totalShown) * 100) : 0;

  const newLetters = cards.filter(c => c.is_new);
  const wrongLetters = [...new Map(
    results.filter(r => !r.correct).map(r => [r.letter_id, r])
  ).values()];

  useEffect(() => {
    if (sessionId) {
      completeSession(sessionId, totalShown, correctCount).catch(() => {});
    }
    if (!muted) {
      playCelebration();
      setTimeout(() => speakWord('Great job!'), 600);
    }
  }, [sessionId, totalShown, correctCount, muted]);

  if (!state) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 to-indigo-100 bg-pattern flex flex-col items-center justify-center p-6">
        <p className="text-xl text-gray-500 mb-4">No session data found.</p>
        <button onClick={() => navigate('/')} className="text-indigo-500 underline text-lg">Go Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-indigo-100 bg-pattern flex flex-col items-center px-6 py-10 relative overflow-hidden">
      {/* Floating celebration */}
      {particles.map(p => (
        <FloatingEmoji key={p.id} emoji={p.emoji} style={p.style} />
      ))}

      <h1 className="text-5xl font-extrabold text-indigo-700 mb-2 animate-pop-in">Great Job!</h1>
      <span className="text-6xl mb-6 animate-pop-in" style={{ animationDelay: '0.2s' }}>🎉</span>

      {/* Score */}
      <div className="bg-white rounded-3xl shadow-lg px-8 py-6 w-full max-w-sm text-center mb-6 animate-pop-in" style={{ animationDelay: '0.3s' }}>
        <p className="text-4xl font-bold text-indigo-600">{correctCount} / {totalShown}</p>
        <p className="text-lg text-gray-400 mt-1">{pct}% correct</p>
      </div>

      {/* New letters */}
      {newLetters.length > 0 && (
        <div className="bg-white rounded-3xl shadow-lg px-6 py-5 w-full max-w-sm mb-4">
          <h2 className="text-lg font-bold text-indigo-600 mb-3">New letters learned today</h2>
          <div className="flex flex-wrap gap-3">
            {newLetters.map(l => (
              <div key={l.letter_id} className="flex items-center gap-2 bg-yellow-50 rounded-xl px-3 py-2">
                <span className="text-2xl font-bold text-indigo-700">{l.character}</span>
                <span className="text-xl">{EMOJI_MAP[l.image_name] || '?'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Problem letters */}
      {wrongLetters.length > 0 && (
        <div className="bg-white rounded-3xl shadow-lg px-6 py-5 w-full max-w-sm mb-6">
          <h2 className="text-lg font-bold text-orange-500 mb-3">Keep practicing</h2>
          <div className="flex flex-wrap gap-3">
            {wrongLetters.map(l => (
              <div key={l.letter_id} className="flex items-center gap-2 bg-orange-50 rounded-xl px-3 py-2">
                <span className="text-2xl font-bold text-orange-600">{l.character}</span>
                <span className="text-xl">{EMOJI_MAP[l.image_name] || '?'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="w-full max-w-sm flex flex-col gap-4 mt-auto">
        <button
          onClick={() => navigate(`/child/${childId}/session/${mode}`)}
          className="bg-indigo-500 text-white rounded-2xl py-5 text-xl font-bold btn-tactile transition-all"
        >
          Play Again
        </button>
        <button
          onClick={() => navigate(`/child/${childId}`)}
          className="bg-white text-indigo-500 border-2 border-indigo-300 rounded-2xl py-4 text-xl font-bold active:bg-indigo-50 transition-transform active:scale-95"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
