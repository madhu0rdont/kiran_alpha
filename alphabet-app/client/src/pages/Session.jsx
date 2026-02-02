import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { startSession, gradeCard } from '../services/api';
import { EMOJI_MAP, WORD_MAP } from '../lib/emojis';
import { playCorrect, playWrong } from '../lib/sounds';

export default function Session({ muted, setMuted }) {
  const { mode } = useParams();
  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalShown, setTotalShown] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [grading, setGrading] = useState(false);
  const [cardAnim, setCardAnim] = useState('animate-slide-in');
  const [feedbackAnim, setFeedbackAnim] = useState('');
  const animKey = useRef(0);

  useEffect(() => {
    startSession(mode)
      .then(data => {
        setSessionId(data.session_id);
        setQueue(data.cards);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not connect to server. Is the backend running?');
        setLoading(false);
      });
  }, [mode]);

  // Block browser back button with confirmation
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      if (window.confirm('Quit this session? Progress on ungraded cards will be lost.')) {
        navigate('/');
      } else {
        window.history.pushState(null, '', window.location.href);
      }
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [navigate]);

  const card = queue[currentIndex];
  const retryCount = queue.length - currentIndex - 1;

  const finishSession = useCallback((newTotalShown, newCorrectCount, newResults) => {
    navigate(`/complete/${mode}`, {
      state: {
        sessionId,
        totalShown: newTotalShown,
        correctCount: newCorrectCount,
        results: newResults,
        cards: queue.filter(c => c.is_new),
      },
    });
  }, [mode, sessionId, queue, navigate]);

  const handleGrade = useCallback(async (correct) => {
    if (grading || !card) return;
    setGrading(true);

    // Sound
    if (!muted) {
      correct ? playCorrect() : playWrong();
    }

    // Feedback animation
    setFeedbackAnim(correct ? 'animate-flash-green' : 'animate-shake');

    try {
      await gradeCard(card.letter_id, mode, correct);
    } catch {
      // Will sync next time
    }

    const newResults = [...results, { ...card, correct }];
    const newTotalShown = totalShown + 1;
    const newCorrectCount = correctCount + (correct ? 1 : 0);

    setResults(newResults);
    setTotalShown(newTotalShown);
    setCorrectCount(newCorrectCount);

    let newQueue = queue;
    if (!correct) {
      newQueue = [...queue, { ...card, is_new: false, is_problem: true }];
      setQueue(newQueue);
    }

    const nextIndex = currentIndex + 1;
    const remaining = newQueue.length - nextIndex;

    // End: all cards done, AND either 10+ shown or no more cards at all
    if (remaining === 0 && (newTotalShown >= 10 || newQueue.length <= nextIndex)) {
      // Small delay for animation to play
      setTimeout(() => finishSession(newTotalShown, newCorrectCount, newResults), 400);
      return;
    }

    // Advance card after animation
    setTimeout(() => {
      animKey.current += 1;
      setCardAnim('animate-slide-in');
      setFeedbackAnim('');
      setCurrentIndex(nextIndex);
      setGrading(false);
    }, 350);
  }, [card, currentIndex, queue, mode, muted, grading, results, totalShown, correctCount, finishSession]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-2xl text-indigo-400">Loading cards...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 to-indigo-100 flex flex-col items-center justify-center px-6">
        <p className="text-5xl mb-4">😕</p>
        <p className="text-xl text-red-500 text-center mb-6">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-indigo-500 text-white rounded-2xl px-8 py-4 text-lg font-bold active:scale-95"
        >
          Go Home
        </button>
      </div>
    );
  }

  // No cards due
  if (!card && currentIndex === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 to-indigo-100 flex flex-col items-center justify-center px-6">
        <p className="text-6xl mb-4">🎉</p>
        <h2 className="text-3xl font-bold text-indigo-700 mb-2 text-center">All caught up!</h2>
        <p className="text-lg text-indigo-400 mb-8 text-center">Come back tomorrow for more practice.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-indigo-500 text-white rounded-2xl px-8 py-4 text-lg font-bold active:scale-95"
        >
          Go Home
        </button>
      </div>
    );
  }

  // Shouldn't happen, but safety
  if (!card) return null;

  const emoji = EMOJI_MAP[card.image_name] || '?';
  const word = WORD_MAP[card.image_name] || card.image_name;
  const progressPct = queue.length > 0 ? Math.min(100, (currentIndex / queue.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-indigo-100 flex flex-col px-6 py-6 select-none">
      {/* Top bar: mute toggle */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setMuted(m => !m)}
          className="text-2xl opacity-60 active:opacity-100 p-2"
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md mx-auto mb-4">
        <div className="flex justify-between text-sm text-indigo-400 mb-1">
          <span>Card {currentIndex + 1} of {queue.length}</span>
          {retryCount > 0 && (
            <span className="text-orange-500 font-semibold">{retryCount} to retry</span>
          )}
        </div>
        <div className="w-full h-3 bg-indigo-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Card area */}
      <div className={`flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full ${feedbackAnim}`}>
        {/* Badges */}
        <div className="h-8 mb-2">
          {card.is_new && (
            <span className="inline-block bg-yellow-300 text-yellow-800 text-sm font-bold px-4 py-1 rounded-full animate-pop-in">
              ✨ New Letter!
            </span>
          )}
          {card.is_problem && !card.is_new && (
            <span className="inline-block w-3 h-3 bg-orange-400 rounded-full" />
          )}
        </div>

        {/* Letter card */}
        <div key={animKey.current} className={`bg-white rounded-3xl shadow-xl w-full py-8 flex flex-col items-center ${cardAnim}`}>
          <span
            className="font-bold text-indigo-600 leading-none"
            style={{ fontSize: 'clamp(120px, 30vw, 200px)' }}
          >
            {card.character}
          </span>

          <span className="text-7xl mt-4">{emoji}</span>

          <p className="text-2xl text-gray-500 mt-3 font-medium">{word}</p>
        </div>
      </div>

      {/* Grade buttons */}
      <div className="w-full max-w-md mx-auto flex gap-4 mt-6 pb-6">
        <button
          onClick={() => handleGrade(true)}
          disabled={grading}
          className="flex-1 bg-green-500 active:bg-green-600 text-white rounded-2xl py-5 text-4xl font-bold shadow-lg transition-transform active:scale-95 disabled:opacity-50"
        >
          ✓
        </button>
        <button
          onClick={() => handleGrade(false)}
          disabled={grading}
          className="flex-1 bg-red-500 active:bg-red-600 text-white rounded-2xl py-5 text-4xl font-bold shadow-lg transition-transform active:scale-95 disabled:opacity-50"
        >
          ✗
        </button>
      </div>
    </div>
  );
}
