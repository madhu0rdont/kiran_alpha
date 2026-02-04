import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProgress, getProgressLetters, resetProgress, deleteSession } from '../services/api';
import { EMOJI_MAP, WORD_MAP } from '../lib/emojis';

const LETTERS_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function LetterGrid({ title, letters, progressMap, onTap }) {
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
            <button
              key={letter}
              onClick={() => p && onTap(letter, p)}
              className={`${bg} ${border} rounded-xl aspect-square flex items-center justify-center text-2xl font-bold transition-transform active:scale-90`}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LetterDetail({ letter, info, onClose }) {
  if (!info) return null;
  const emoji = EMOJI_MAP[info.image_name] || '?';
  const word = WORD_MAP[info.image_name] || info.image_name;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-xs animate-pop-in" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-4">
          <span className="text-6xl font-bold text-indigo-600">{letter}</span>
          <p className="text-3xl mt-2">{emoji} {word}</p>
        </div>
        <div className="space-y-2 text-sm">
          <Row label="Status" value={info.status} />
          <Row label="Times reviewed" value={info.repetitions} />
          <Row label="Times failed" value={info.times_failed} />
          <Row label="Current interval" value={`${info.interval_days} day${info.interval_days !== 1 ? 's' : ''}`} />
          <Row label="Ease factor" value={info.ease_factor?.toFixed(1)} />
          {info.next_review_date && <Row label="Next review" value={info.next_review_date} />}
          {info.introduced_date && <Row label="Introduced" value={new Date(info.introduced_date).toLocaleDateString()} />}
        </div>
        <button
          onClick={onClose}
          className="mt-5 w-full bg-indigo-500 text-white rounded-xl py-3 font-bold active:bg-indigo-600"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-700">{value}</span>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="bg-white rounded-3xl px-4 py-3 shadow-lg">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function Progress() {
  const { mode: paramMode, childId } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState(paramMode || 'upper');
  const [data, setData] = useState(null);
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // { letter, info }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getProgress(mode, childId),
      getProgressLetters(mode, childId),
    ])
      .then(([summary, allProgress]) => {
        if (cancelled) return;
        setData(summary);
        setProgressData(allProgress);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [mode, childId]);

  const handleTap = (letter, info) => {
    setSelected({ letter, info });
  };

  const reload = () => {
    setLoading(true);
    Promise.all([getProgress(mode, childId), getProgressLetters(mode, childId)])
      .then(([summary, allProgress]) => { setData(summary); setProgressData(allProgress); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleReset = async () => {
    if (!confirm('Reset all progress for this mode? This will erase all session history and set every letter back to new.')) return;
    await resetProgress(mode, childId);
    reload();
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Delete this session from history?')) return;
    await deleteSession(sessionId, childId);
    reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 to-indigo-100 bg-pattern flex items-center justify-center">
        <div className="inline-block w-12 h-12 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const counts = data?.counts || { mastered: 0, learning: 0, new: 0, problem: 0 };
  const problemLetters = data?.problemLetters || [];
  const sessions = data?.recentSessions || [];

  // Build lookup maps
  const upperMap = {};
  const lowerMap = {};
  for (const p of progressData) {
    if (p.case_type === 'upper') upperMap[p.character] = p;
    else lowerMap[p.character] = p;
  }

  const showUpper = mode === 'upper' || mode === 'both';
  const showLower = mode === 'lower' || mode === 'both';
  const totalLetters = mode === 'both' ? 52 : 26;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-indigo-100 bg-pattern px-6 py-8">
      <button onClick={() => navigate(`/child/${childId}`)} className="text-indigo-500 text-lg mb-6 inline-block">&larr; Home</button>

      <h1 className="text-3xl font-extrabold text-indigo-700 mb-6">Progress</h1>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-6">
        {['upper', 'lower', 'both'].map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); navigate(`/child/${childId}/progress/${m}`, { replace: true }); }}
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
        <Stat label="Mastered" value={`${counts.mastered}/${totalLetters}`} color="text-green-600" />
        <Stat label="Learning" value={counts.learning} color="text-yellow-600" />
        <Stat label="New" value={counts.new} color="text-gray-400" />
        <Stat label="Problem" value={counts.problem} color="text-red-500" />
      </div>

      {/* Reset button */}
      <div className="max-w-md mb-6">
        <button
          onClick={handleReset}
          className="text-sm text-red-500 font-semibold bg-red-50 rounded-xl px-4 py-2 active:bg-red-100"
        >
          Reset Progress
        </button>
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

      {/* Letter grids */}
      {showUpper && (
        <LetterGrid
          title={mode === 'both' ? 'Uppercase' : undefined}
          letters={LETTERS_UPPER}
          progressMap={upperMap}
          onTap={handleTap}
        />
      )}
      {showLower && (
        <LetterGrid
          title={mode === 'both' ? 'Lowercase' : undefined}
          letters={LETTERS_UPPER.map(l => l.toLowerCase())}
          progressMap={lowerMap}
          onTap={handleTap}
        />
      )}

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
                  <button
                    onClick={() => handleDeleteSession(s.id)}
                    className="text-red-400 text-sm font-bold ml-2 active:text-red-600"
                    title="Delete session"
                  >✕</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Letter detail modal */}
      {selected && (
        <LetterDetail
          letter={selected.letter}
          info={selected.info}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
