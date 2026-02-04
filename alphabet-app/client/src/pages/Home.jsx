import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchProfiles } from '../services/api';

const modes = [
  { mode: 'both', label: 'ABC + abc', desc: 'Upper & lowercase', color: 'bg-blue-500 active:bg-blue-600' },
  { mode: 'upper', label: 'ABC', desc: 'Uppercase only', color: 'bg-green-500 active:bg-green-600' },
  { mode: 'lower', label: 'abc', desc: 'Lowercase only', color: 'bg-purple-500 active:bg-purple-600' },
];

export default function Home() {
  const navigate = useNavigate();
  const { childId } = useParams();
  const [profiles, setProfiles] = useState([]);
  const [showSwitcher, setShowSwitcher] = useState(false);

  useEffect(() => {
    fetchProfiles().then(setProfiles).catch(() => {});
  }, [childId]);

  const currentProfile = profiles.find(p => p.id === parseInt(childId, 10));
  const childName = currentProfile?.name || '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-indigo-100 bg-pattern flex flex-col items-center justify-center px-6 py-10 relative">
      {childName && (
        <div className="absolute top-6 left-6 z-10">
          <button
            onClick={() => setShowSwitcher(!showSwitcher)}
            className="text-indigo-500 font-bold text-lg active:text-indigo-700"
          >
            {childName} ▾
          </button>
          {showSwitcher && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-2xl shadow-lg py-2 min-w-[140px] z-50">
              {profiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setShowSwitcher(false); navigate(`/child/${p.id}`); }}
                  className={`block w-full text-left px-4 py-2 text-sm font-medium ${
                    p.id === parseInt(childId, 10) ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 active:bg-gray-100'
                  }`}
                >
                  {p.avatar} {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <h1 className="text-5xl sm:text-6xl font-extrabold text-indigo-700 mb-2 tracking-tight relative z-10">
        ABC Learning
      </h1>
      <p className="text-xl text-indigo-400 mb-10 relative z-10">Tap to start learning!</p>

      <div className="w-full max-w-sm flex flex-col gap-5 relative z-10">
        {modes.map(({ mode, label, desc, color }) => (
          <button
            key={mode}
            onClick={() => navigate(`/child/${childId}/session/${mode}`)}
            className={`${color} text-white rounded-3xl py-6 px-8 text-center btn-tactile transition-all`}
          >
            <span className="block text-3xl font-bold">{label}</span>
            <span className="block text-base opacity-90 mt-1">{desc}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => navigate(`/child/${childId}/progress/upper`)}
        className="mt-10 text-indigo-500 text-lg font-semibold underline underline-offset-4 active:text-indigo-700 relative z-10"
      >
        View Progress
      </button>

      <div className="mt-4 flex gap-4 relative z-10">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 text-sm font-medium active:text-gray-600"
        >
          Switch Child
        </button>
        <button
          onClick={() => navigate('/admin')}
          className="text-gray-400 text-sm font-medium active:text-gray-600"
        >
          Admin
        </button>
      </div>
    </div>
  );
}
