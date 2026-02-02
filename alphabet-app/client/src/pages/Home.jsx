import { useNavigate, useParams } from 'react-router-dom';

const modes = [
  { mode: 'both', label: 'ABC + abc', desc: 'Upper & lowercase', color: 'bg-blue-500 active:bg-blue-600' },
  { mode: 'upper', label: 'ABC', desc: 'Uppercase only', color: 'bg-green-500 active:bg-green-600' },
  { mode: 'lower', label: 'abc', desc: 'Lowercase only', color: 'bg-purple-500 active:bg-purple-600' },
];

export default function Home() {
  const navigate = useNavigate();
  const { childId } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-indigo-100 flex flex-col items-center justify-center px-6 py-10">
      <h1 className="text-5xl sm:text-6xl font-extrabold text-indigo-700 mb-2 tracking-tight">
        ABC Learning
      </h1>
      <p className="text-xl text-indigo-400 mb-10">Tap to start learning!</p>

      <div className="w-full max-w-sm flex flex-col gap-5">
        {modes.map(({ mode, label, desc, color }) => (
          <button
            key={mode}
            onClick={() => navigate(`/child/${childId}/session/${mode}`)}
            className={`${color} text-white rounded-3xl py-6 px-8 text-center shadow-lg transition-transform active:scale-95`}
          >
            <span className="block text-3xl font-bold">{label}</span>
            <span className="block text-base opacity-90 mt-1">{desc}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => navigate(`/child/${childId}/progress/upper`)}
        className="mt-10 text-indigo-500 text-lg font-semibold underline underline-offset-4 active:text-indigo-700"
      >
        View Progress
      </button>

      <button
        onClick={() => navigate('/')}
        className="mt-4 text-gray-400 text-sm font-medium active:text-gray-600"
      >
        Switch Child
      </button>
    </div>
  );
}
