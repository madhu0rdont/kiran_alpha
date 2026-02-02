import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminLetters, uploadLetterImage, deleteLetterImage, updateLetterWord } from '../services/api';
import { EMOJI_MAP, WORD_MAP, getImageUrl } from '../lib/emojis';

export default function Admin() {
  const navigate = useNavigate();
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);

  const load = () => {
    getAdminLetters()
      .then(setLetters)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleUpload = async (letter, file) => {
    setUploading(letter);
    try {
      await uploadLetterImage(letter, file);
      load();
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    }
    setUploading(null);
  };

  const handleWordUpdate = async (letter, word) => {
    try {
      await updateLetterWord(letter, word);
      load();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleDelete = async (letter) => {
    if (!confirm(`Remove image for "${letter}"?`)) return;
    try {
      await deleteLetterImage(letter);
      load();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block w-10 h-10 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Letter Images</h1>
          <button onClick={() => navigate('/')} className="text-indigo-500 text-sm font-semibold">&larr; Home</button>
        </div>

        <p className="text-gray-500 text-sm mb-6">
          Upload photos for each letter. JPG, PNG, or WebP accepted. Images are auto-resized to 400x400.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {letters.map(l => (
            <LetterCard
              key={l.id}
              letter={l}
              uploading={uploading === l.character}
              onUpload={handleUpload}
              onDelete={handleDelete}
              onWordUpdate={handleWordUpdate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function LetterCard({ letter, uploading, onUpload, onDelete, onWordUpdate }) {
  const fileRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const char = letter.character;
  const emoji = EMOJI_MAP[letter.image_name] || '?';
  const defaultWord = WORD_MAP[letter.image_name] || letter.image_name;
  const word = letter.display_word || defaultWord;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(char, file);
    e.target.value = '';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center">
      <span className="text-3xl font-bold text-indigo-600 mb-2">{char}</span>

      {letter.has_image ? (
        <img
          src={`${getImageUrl(char)}?t=${Date.now()}`}
          alt={char}
          className="w-24 h-24 object-cover rounded-xl mb-2"
        />
      ) : (
        <span className="text-5xl mb-2">{emoji}</span>
      )}

      {editing ? (
        <input
          autoFocus
          className="text-xs text-gray-700 mb-3 border-b border-indigo-400 text-center outline-none w-24 py-0.5"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={() => { onWordUpdate(char, editValue); setEditing(false); }}
          onKeyDown={e => { if (e.key === 'Enter') { onWordUpdate(char, editValue); setEditing(false); } }}
        />
      ) : (
        <p
          className="text-xs text-gray-400 mb-3 cursor-pointer hover:text-indigo-500"
          onClick={() => { setEditValue(word); setEditing(true); }}
          title="Click to edit name"
        >
          {word} ✎
        </p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex gap-2 w-full">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex-1 bg-indigo-500 text-white text-xs font-semibold rounded-lg py-2 active:bg-indigo-600 disabled:opacity-50"
        >
          {uploading ? '...' : letter.has_image ? 'Replace' : 'Upload'}
        </button>
        {letter.has_image && (
          <button
            onClick={() => onDelete(char)}
            className="bg-red-100 text-red-600 text-xs font-semibold rounded-lg px-3 py-2 active:bg-red-200"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
