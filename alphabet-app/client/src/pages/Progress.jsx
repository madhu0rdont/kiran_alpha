import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProgress } from '../services/api';
import { EMOJI_MAP } from '../lib/emojis';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function LetterGrid({ title, letters, progressMap }) {
  return (
    <div className="w-full max-w-md mx-auto mb-6">
      {title && <h3 className="text-lg font-bold text-indigo-600 mb-2">{title}</h3>}
      <div className="grid grid-cols-6 sm:grid-cols-7 gap-2">
        {letters.map(letter => {
          const p = progressMap[letter];
          let bg = 'bg-gray-200 text-gray-400';
          let border = '';
          if (p) {
            if (p.status === 'mastered') bg = 'bg-green-400 text-white';
            else if (p.status === 'learning') bg = 'bg-yellow-300 text-yellow-800';
            if (p.recent_fails >= 2) border = 'ring-2 ring-red-500';
          }
          return (
            <div
              key={letter}
              className={`${bg} ${border} rounded-xl aspect-square flex items-center justify-center text-2xl font-bold`}
            >
              {letter}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Progress() {
  const { mode: paramMode } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState(paramMode || 'upper');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getProgress(mode)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [mode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 to-indigo-100 flex items-center justify-center">
        <p className="text-2xl text-indigo-400 animate-pulse">Loading...</p>
      </div>
    );
  }

  const counts = data?.counts || { mastered: 0, learning: 0, new: 0, problem: 0 };
  const problemLetters = data?.problemLetters || [];
  const sessions = data?.recentSessions || [];

  // Build lookup from progress data
  const upperMap = {};
  const lowerMap = {};
  if (data?.problemLetters !== undefined) {
    // We need the full progress list — re-fetch from the problemLetters + counts
    // The progress endpoint gives us problemLetters with character info
  }

  // For the grid, we need per-letter status. Fetch from the progress endpoint's problem list
  // plus infer from counts. Since our API returns problemLetters with full data,
  // we'll use a separate call for the grid.
  // Actually let's enhance: the progress data from problemLetters gives us the problem ones,
  // but we need ALL letters. Let's fetch /api/letters and /api/progress together.

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-indigo-100 px-6 py-8">
      <button onClick={() => navigate('/')} className="text-indigo-500 text-lg mb-6 inline-block">&larr; Home</button>

      <h1 className="text-3xl font-extrabold text-indigo-700 mb-6">Progress</h1>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-6">
        {['upper', 'lower', 'both'].map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
              mode === m ? 'bg-indigo-500 text-white' : 'bg-white text-indigo-500 border border-indigo-300'
            }`}
          >
            {m === 'both' ? 'ABC+abc' : m === 'upper' ? 'ABC' : 'abc'}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 max-w-md mb-6">
        <Stat label="Mastered" value={`${counts.mastered}/26`} color="text-green-600" />
        <Stat label="Learning" value={counts.learning} color="text-yellow-600" />
        <Stat label="New" value={counts.new} color="text-gray-400" />
        <Stat label="Problem" value={counts.problem} color="text-red-500" />
      </div>

      {/* Problem letters callout */}
      {problemLetters.length > 0 && (
        <div className="bg-orange-50 rounded-2xl px-4 py-3 mb-6 max-w-md">
          <p className="text-orange-600 font-bold text-sm mb-1">Problem letters:</p>
          <p className="text-lg">
            {problemLetters.map(l => (
              <span key={l.letter_id} className="inline-flex items-center gap-1 mr-3">
                <span className="font-bold text-orange-700">{l.character}</span>
                <span>{EMOJI_MAP[l.image_name]}</span>
              </span>
            ))}
          </p>
        </div>
      )}

      {/* Letter grid — fetched separately */}
      <ProgressGrid mode={mode} />

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <div className="max-w-md mt-6">
          <h2 className="text-lg font-bold text-indigo-600 mb-3">Recent Sessions</h2>
          <div className="flex flex-col gap-2">
            {sessions.map(s => {
              const pct = s.total_cards > 0 ? Math.round((s.correct_count / s.total_cards) * 100) : 0;
              const date = new Date(s.completed_at).toLocaleDateString();
              return (
                <div key={s.id} className="bg-white rounded-xl px-4 py-3 flex justify-between items-center shadow-sm">
                  <span className="text-gray-600 text-sm">{date}</span>
                  <span className="font-bold text-indigo-600">{pct}%</span>
                  <span className="text-xs text-gray-400">{s.correct_count}/{s.total_cards}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function ProgressGrid({ mode }) {
  const [progressData, setProgressData] = useState([]);

  useEffect(() => {
    fetch(`/api/progress?mode=${mode}`)
      .then(r => r.json())
      .then(setProgressData)
      .catch(() => {});
  }, [mode]);

  const upperMap = {};
  const lowerMap = {};
  for (const p of progressData) {
    if (p.case_type === 'upper') upperMap[p.character] = p;
    else lowerMap[p.character.toUpperCase()] = p;
  }

  const showUpper = mode === 'upper' || mode === 'both';
  const showLower = mode === 'lower' || mode === 'both';

  return (
    <>
      {showUpper && (
        <LetterGrid
          title={mode === 'both' ? 'Uppercase' : undefined}
          letters={LETTERS}
          progressMap={upperMap}
        />
      )}
      {showLower && (
        <LetterGrid
          title={mode === 'both' ? 'Lowercase' : undefined}
          letters={LETTERS.map(l => l.toLowerCase())}
          progressMap={Object.fromEntries(
            Object.entries(lowerMap).map(([k, v]) => [k.toLowerCase(), v])
          )}
        />
      )}
    </>
  );
}
