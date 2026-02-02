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

export function startSession(mode, count = 10) {
  return request('GET', `/session/start?mode=${mode}&count=${count}`);
}

export function gradeCard(letterId, mode, correct) {
  return request('POST', '/session/grade', {
    letter_id: letterId,
    mode,
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

export function getProgress(mode) {
  return request('GET', `/progress?mode=${mode}`);
}

export function getProgressLetters(mode) {
  return request('GET', `/progress/letters?mode=${mode}`);
}

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
