const BASE = '/api';

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// ─── Profiles ─────────────────────────────────────────────────────

export function fetchProfiles() {
  return request('GET', '/profiles');
}

export function createProfile(name, avatar) {
  return request('POST', '/profiles', { name, avatar });
}

export function updateProfile(id, name, avatar) {
  return request('PUT', `/profiles/${id}`, { name, avatar });
}

export function deleteProfile(id) {
  return request('DELETE', `/profiles/${id}`);
}

// ─── Sessions ─────────────────────────────────────────────────────

export function startSession(mode, childId, count = 10) {
  return request('GET', `/session/start?mode=${mode}&child_id=${childId}&count=${count}`);
}

export function gradeCard(letterId, mode, childId, correct) {
  return request('POST', '/session/grade', {
    letter_id: letterId,
    mode,
    child_id: childId,
    correct,
  });
}

export function completeSession(sessionId, totalCards, correctCount) {
  return request('POST', '/session/complete', {
    session_id: sessionId,
    total_cards: totalCards,
    correct_count: correctCount,
  });
}

// ─── Progress ─────────────────────────────────────────────────────

export function getProgress(mode, childId) {
  return request('GET', `/progress?mode=${mode}&child_id=${childId}`);
}

export function getProgressLetters(mode, childId) {
  return request('GET', `/progress/letters?mode=${mode}&child_id=${childId}`);
}

// ─── Admin ────────────────────────────────────────────────────────

export function getAdminLetters() {
  return request('GET', '/admin/letters');
}

export async function uploadLetterImage(letter, file) {
  const form = new FormData();
  form.append('image', file);
  const res = await fetch(`${BASE}/admin/upload/${letter}`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Upload failed');
  }
  return res.json();
}

export function updateLetterWord(letter, word) {
  return request('PUT', `/admin/word/${letter}`, { word });
}

export function deleteLetterImage(letter) {
  return request('DELETE', `/admin/image/${letter}`);
}
