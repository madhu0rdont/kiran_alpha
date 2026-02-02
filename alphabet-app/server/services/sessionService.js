import db from '../db.js';

const today = () => new Date().toISOString().split('T')[0];
const now = () => new Date().toISOString().replace('T', ' ').split('.')[0];

// ─── Prepared statements ────────────────────────────────────────────

const stmts = {
  problemLetters: db.prepare(`
    SELECT p.*, l.character, l.case_type, l.image_name, l.display_order
    FROM progress p
    JOIN letters l ON l.id = p.letter_id
    WHERE p.mode = ? AND p.recent_fails >= 2
      AND (p.next_review_date IS NULL OR p.next_review_date <= ?)
    ORDER BY p.recent_fails DESC, p.next_review_date ASC
  `),

  dueLetters: db.prepare(`
    SELECT p.*, l.character, l.case_type, l.image_name, l.display_order
    FROM progress p
    JOIN letters l ON l.id = p.letter_id
    WHERE p.mode = ? AND p.status = 'learning' AND p.recent_fails < 2
      AND p.next_review_date <= ?
    ORDER BY p.next_review_date ASC
  `),

  learningCount: db.prepare(`
    SELECT COUNT(*) as c FROM progress
    WHERE mode = ? AND status = 'learning'
  `),

  newLetters: db.prepare(`
    SELECT p.*, l.character, l.case_type, l.image_name, l.display_order
    FROM progress p
    JOIN letters l ON l.id = p.letter_id
    WHERE p.mode = ? AND p.status = 'new'
    ORDER BY l.display_order ASC
    LIMIT ?
  `),

  masteredLetters: db.prepare(`
    SELECT p.*, l.character, l.case_type, l.image_name, l.display_order
    FROM progress p
    JOIN letters l ON l.id = p.letter_id
    WHERE p.mode = ? AND p.status = 'mastered'
    ORDER BY p.last_reviewed ASC
    LIMIT ?
  `),

  lastSession: db.prepare(`
    SELECT * FROM sessions
    WHERE mode = ? AND completed_at IS NOT NULL
    ORDER BY completed_at DESC
    LIMIT 1
  `),

  sessionCount: db.prepare(`
    SELECT COUNT(*) as c FROM sessions
    WHERE mode = ? AND completed_at IS NOT NULL
  `),

  getProgress: db.prepare(`
    SELECT p.*, l.character, l.case_type, l.image_name, l.display_order
    FROM progress p
    JOIN letters l ON l.id = p.letter_id
    WHERE p.letter_id = ? AND p.mode = ?
  `),

  updateProgress: db.prepare(`
    UPDATE progress
    SET status = ?, ease_factor = ?, interval_days = ?, repetitions = ?,
        next_review_date = ?, last_reviewed = ?, times_failed = ?,
        recent_fails = ?, introduced_date = COALESCE(introduced_date, ?)
    WHERE letter_id = ? AND mode = ?
  `),

  createSession: db.prepare(`
    INSERT INTO sessions (mode, total_cards, correct_count, new_letters_introduced)
    VALUES (?, ?, 0, ?)
  `),

  completeSession: db.prepare(`
    UPDATE sessions SET completed_at = datetime('now'), total_cards = ?, correct_count = ?
    WHERE id = ?
  `),

  getSession: db.prepare(`SELECT * FROM sessions WHERE id = ?`),

  recentSessions: db.prepare(`
    SELECT * FROM sessions
    WHERE mode = ? AND completed_at IS NOT NULL
    ORDER BY completed_at DESC
    LIMIT 5
  `),

  statusCounts: db.prepare(`
    SELECT status, COUNT(*) as c FROM progress
    WHERE mode = ?
    GROUP BY status
  `),

  problemList: db.prepare(`
    SELECT p.*, l.character, l.case_type, l.image_name, l.display_order
    FROM progress p
    JOIN letters l ON l.id = p.letter_id
    WHERE p.mode = ? AND p.recent_fails >= 2
    ORDER BY p.recent_fails DESC
  `),
};

// ─── getSessionCards ────────────────────────────────────────────────

export function getSessionCards(mode, count = 10) {
  const d = today();
  const cards = [];
  const seen = new Set();

  const addCards = (rows, flags) => {
    for (const row of rows) {
      if (cards.length >= count) break;
      if (seen.has(row.letter_id)) continue;
      seen.add(row.letter_id);
      cards.push({
        letter_id: row.letter_id,
        character: row.character,
        case_type: row.case_type,
        image_name: row.image_name,
        is_new: flags.is_new || false,
        is_problem: flags.is_problem || false,
      });
    }
  };

  // a. Problem letters (recent_fails >= 2, due)
  addCards(stmts.problemLetters.all(mode, d), { is_problem: true });

  // b. Learning letters due for review
  addCards(stmts.dueLetters.all(mode, d), {});

  // c. Check if we can introduce new letters
  const learningCount = stmts.learningCount.get(mode).c;

  if (cards.length < count && learningCount < 7) {
    const completedSessions = stmts.sessionCount.get(mode).c;
    let canIntroduce = false;
    let introCount = 0;

    if (completedSessions === 0) {
      // Very first session: introduce 3-4 letters
      canIntroduce = true;
      introCount = Math.min(4, count - cards.length);
    } else {
      // Check last session success rate >= 70%
      const last = stmts.lastSession.get(mode);
      if (last && last.total_cards > 0) {
        const rate = last.correct_count / last.total_cards;
        if (rate >= 0.7) {
          canIntroduce = true;
          introCount = Math.min(2, count - cards.length, 7 - learningCount);
        }
      }
    }

    if (canIntroduce && introCount > 0) {
      addCards(stmts.newLetters.all(mode, introCount), { is_new: true });
    }
  }

  // e. Fill remaining with mastered letters (oldest reviewed first)
  if (cards.length < count) {
    const remaining = count - cards.length;
    addCards(stmts.masteredLetters.all(mode, remaining), {});
  }

  // Create a session record
  const newLetterIds = cards.filter(c => c.is_new).map(c => c.letter_id).join(',');
  const info = stmts.createSession.run(mode, cards.length, newLetterIds);

  return {
    session_id: info.lastInsertRowid,
    cards,
  };
}

// ─── gradeCard ──────────────────────────────────────────────────────

export const gradeCard = db.transaction((letterId, mode, correct) => {
  const row = stmts.getProgress.get(letterId, mode);
  if (!row) throw new Error(`No progress for letter_id=${letterId}, mode=${mode}`);

  const isNew = row.introduced_date === null;
  let {
    status, ease_factor, interval_days, repetitions,
    times_failed, recent_fails, introduced_date,
  } = row;

  if (isNew) {
    introduced_date = now();
    status = 'learning';
  }

  if (correct) {
    repetitions += 1;
    if (repetitions === 1) {
      interval_days = 1;
    } else if (repetitions === 2) {
      interval_days = 3;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    ease_factor = Math.min(2.5, ease_factor + 0.1);
    recent_fails = 0;

    if (repetitions >= 3 && interval_days >= 7) {
      status = 'mastered';
    }
  } else {
    repetitions = 0;
    interval_days = 1;
    ease_factor = Math.max(1.3, ease_factor - 0.2);
    times_failed += 1;
    recent_fails += 1;
    status = 'learning';
  }

  // Reset recent_fails counter after 5 attempts
  if (recent_fails >= 5) {
    recent_fails = 0;
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + (correct ? interval_days : 0));
  const next_review_date = nextDate.toISOString().split('T')[0];

  stmts.updateProgress.run(
    status, ease_factor, interval_days, repetitions,
    next_review_date, now(), times_failed, recent_fails,
    introduced_date,
    letterId, mode,
  );

  return {
    letter_id: letterId,
    correct,
    status,
    ease_factor,
    interval_days,
    repetitions,
    next_review_date,
    is_new: isNew,
  };
});

// ─── completeSession ────────────────────────────────────────────────

export function completeSession(sessionId, totalCards, correctCount) {
  stmts.completeSession.run(totalCards, correctCount, sessionId);
  return stmts.getSession.get(sessionId);
}

// ─── getProgress ────────────────────────────────────────────────────

export function getProgress(mode) {
  const countsRaw = stmts.statusCounts.all(mode);
  const counts = { mastered: 0, learning: 0, new: 0, problem: 0 };
  for (const row of countsRaw) {
    counts[row.status] = row.c;
  }

  const problemLetters = stmts.problemList.all(mode);
  counts.problem = problemLetters.length;

  const recentSessions = stmts.recentSessions.all(mode);

  return { counts, problemLetters, recentSessions };
}
