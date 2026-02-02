import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { startSession, gradeCard } from '../services/api';
import { EMOJI_MAP, WORD_MAP } from '../lib/emojis';

export default function Session() {
  const { mode } = useParams();
  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalShown, setTotalShown] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    startSession(mode)
      .then(data => {
        setSessionId(data.session_id);
        setQueue(data.cards);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [mode]);

  const card = queue[currentIndex];
  const retryCount = queue.length - currentIndex - 1;

  const handleGrade = useCallback(async (correct) => {
    if (grading || !card) return;
    setGrading(true);

    try {
      await gradeCard(card.letter_id, mode, correct);
    } catch {
      // grade saved next time
    }

    const newResults = [...results, { ...card, correct }];
    setResults(newResults);
    setTotalShown(prev => prev + 1);
    if (correct) setCorrectCount(prev => prev + 1);

    const nextIndex = currentIndex + 1;

    if (!correct) {
      // Add to end of queue for retry
      setQueue(prev => [...prev, { ...card, is_new: false, is_problem: true }]);
    }

    // Session ends when 10+ shown AND we've gone through all cards
    const remaining = queue.length - nextIndex + (!correct ? 1 : 0);
    if (totalShown + 1 >= 10 && remaining === 0) {
      navigate(`/complete/${mode}`, {
        state: {
          sessionId,
          totalShown: totalShown + 1,
          correctCount: correctCount + (correct ? 1 : 0),
          results: newResults,
          cards: queue,
        },
      });
      return;
    }

    // If we've gone through all cards but shown < 10, also end
    if (nextIndex >= queue.length + (!correct ? 1 : 0) - (!correct ? 0 : 0)) {
      if (nextIndex >= queue.length) {
        navigate(`/complete/${mode}`, {
          state: {
            sessionId,
            totalShown: totalShown + 1,
            correctCount: correctCount + (correct ? 1 : 0),
            results: newResults,
            cards: queue,
          },
        });
        return;
      }
    }

    setCurrentIndex(nextIndex);
    setGrading(false);
  }, [card, currentIndex, queue, mode, grading, results, totalShown, correctCount, sessionId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 to-indigo-100 flex items-center justify-center">
        <p className="text-2xl text-indigo-400 animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 to-indigo-100 flex items-center justify-center">
        <p className="text-2xl text-gray-500">No cards available right now. Come back later!</p>
      </div>
    );
  }

  const emoji = EMOJI_MAP[card.image_name] || '?';
  const word = WORD_MAP[card.image_name] || card.image_name;
  const progressPct = queue.length > 0 ? Math.min(100, ((currentIndex) / queue.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-indigo-100 flex flex-col px-6 py-6 select-none">
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
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {/* Badges */}
        <div className="h-8 mb-2">
          {card.is_new && (
            <span className="inline-block bg-yellow-300 text-yellow-800 text-sm font-bold px-4 py-1 rounded-full">
              New Letter!
            </span>
          )}
          {card.is_problem && !card.is_new && (
            <span className="inline-block w-3 h-3 bg-orange-400 rounded-full" />
          )}
        </div>

        {/* Letter */}
        <div className="bg-white rounded-3xl shadow-xl w-full py-8 flex flex-col items-center">
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
          &#10003;
        </button>
        <button
          onClick={() => handleGrade(false)}
          disabled={grading}
          className="flex-1 bg-red-500 active:bg-red-600 text-white rounded-2xl py-5 text-4xl font-bold shadow-lg transition-transform active:scale-95 disabled:opacity-50"
        >
          &#10007;
        </button>
      </div>
    </div>
  );
}
