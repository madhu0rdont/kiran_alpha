import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProfiles, createProfile, updateProfile, deleteProfile } from '../services/api';

const AVATARS = ['🧒', '👧', '👦', '🧒🏽', '👧🏽', '👦🏽', '🐻', '🦁', '🐱', '🌟'];

export default function ProfileSelect() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState(null); // profile id being edited
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchProfiles()
      .then(setProfiles)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const profile = await createProfile(newName.trim());
    setProfiles(p => [...p, profile]);
    setNewName('');
    setAdding(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this profile? All progress will be lost.')) return;
    await deleteProfile(id);
    setProfiles(p => p.filter(pr => pr.id !== id));
  };

  const handleEdit = async (id) => {
    if (!editName.trim()) return;
    const updated = await updateProfile(id, editName.trim());
    setProfiles(p => p.map(pr => pr.id === id ? updated : pr));
    setEditing(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 to-indigo-100 bg-pattern flex items-center justify-center">
        <div className="inline-block w-12 h-12 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-indigo-100 bg-pattern flex flex-col items-center px-6 py-10">
      <h1 className="text-5xl sm:text-6xl font-extrabold text-indigo-700 mb-2 tracking-tight">
        ABC Learning
      </h1>
      <p className="text-xl text-indigo-400 mb-10">Who's learning today?</p>

      <div className="w-full max-w-sm flex flex-col gap-4">
        {profiles.map(profile => (
          <div key={profile.id} className="relative">
            {editing === profile.id ? (
              <div className="bg-white rounded-3xl shadow-lg p-4 flex items-center gap-3">
                <span className="text-4xl">{profile.avatar}</span>
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEdit(profile.id)}
                  className="flex-1 text-xl font-bold text-indigo-700 border-b-2 border-indigo-300 outline-none bg-transparent"
                />
                <button
                  onClick={() => handleEdit(profile.id)}
                  className="text-green-500 font-bold text-lg"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="text-gray-400 font-bold text-lg"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate(`/child/${profile.id}`)}
                className="w-full bg-white rounded-3xl shadow-lg py-5 px-6 flex items-center gap-4 transition-transform active:scale-95"
              >
                <span className="text-5xl">{profile.avatar}</span>
                <span className="text-2xl font-bold text-indigo-700">{profile.name}</span>
              </button>
            )}

            {/* Edit/delete icons */}
            {editing !== profile.id && (
              <div className="absolute top-2 right-3 flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditing(profile.id); setEditName(profile.name); }}
                  className="text-gray-300 hover:text-indigo-500 text-sm"
                  title="Edit"
                >
                  ✎
                </button>
                {profiles.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(profile.id); }}
                    className="text-gray-300 hover:text-red-500 text-sm"
                    title="Delete"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Add new child */}
        {adding ? (
          <div className="bg-white rounded-3xl shadow-lg p-5 flex flex-col gap-3">
            <input
              autoFocus
              placeholder="Child's name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="text-xl font-bold text-indigo-700 border-b-2 border-indigo-300 outline-none bg-transparent px-2 py-1"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!newName.trim()}
                className="flex-1 bg-indigo-500 text-white rounded-2xl py-3 font-bold active:bg-indigo-600 disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={() => { setAdding(false); setNewName(''); }}
                className="flex-1 bg-gray-200 text-gray-600 rounded-2xl py-3 font-bold active:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full border-2 border-dashed border-indigo-300 rounded-3xl py-5 text-indigo-400 text-xl font-bold active:bg-indigo-50 transition-colors"
          >
            + Add Child
          </button>
        )}
      </div>
    </div>
  );
}
