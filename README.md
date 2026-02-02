# Kiran Learns ABCs

A Progressive Web App for teaching a toddler the alphabet using spaced repetition (SM-2 algorithm). Designed for iPad/iPhone with large, touch-friendly elements.

## Tech Stack

- **Frontend:** React 19 + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** SQLite (better-sqlite3)
- **PWA:** Service worker + manifest for home screen install

## Project Structure

```
alphabet-app/
├── client/          React frontend (port 5173)
│   ├── src/
│   │   ├── pages/       Home, Session, SessionComplete, Progress
│   │   ├── services/    API client
│   │   └── lib/         Emoji mappings, sound effects
│   └── public/          PWA manifest, service worker, icons
├── server/          Express backend (port 3001)
│   ├── services/        Session & spaced repetition logic
│   └── routes/          API routes
└── database/        SQLite migrations & seed data
```

## Getting Started

```bash
cd alphabet-app

# Install all dependencies
npm run install:all

# Create and seed the database
npm run db:reset

# Start both frontend and backend
npm run dev
```

Open http://localhost:5173 in a browser.

## How It Works

1. **Pick a mode** — uppercase (ABC), lowercase (abc), or both
2. **Learn letters** — cards show the letter, an emoji, and the word
3. **Grade yourself** — tap the green check or red X
4. **Spaced repetition** — the SM-2 algorithm schedules reviews:
   - New letters start at 1-day intervals
   - Correct answers increase the interval (1 → 3 → 7+ days)
   - Wrong answers reset to immediate review
   - Letters graduate to "mastered" after 3+ correct reviews at 7+ day intervals
5. **Retry queue** — wrong answers reappear at the end of the session
6. **Progress tracking** — color-coded letter grid shows mastered/learning/problem status

## Session Logic

- First session introduces 3-4 new letters
- Subsequent sessions introduce 1-2 new letters if the last session score was >= 70%
- Maximum of 7 letters in "learning" state at once
- Sessions end when all cards (including retries) are exhausted

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/session/start?mode=upper` | Get cards for a new session |
| POST | `/api/session/grade` | Grade a card (correct/wrong) |
| POST | `/api/session/complete` | Mark session as finished |
| GET | `/api/progress?mode=upper` | Get summary stats |
| GET | `/api/progress/letters?mode=upper` | Get per-letter progress |
| GET | `/api/health` | Server health check |

## Install as PWA

On iPhone/iPad: open in Safari → tap Share → "Add to Home Screen"

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend + backend |
| `npm run dev:client` | Frontend only |
| `npm run dev:server` | Backend only |
| `npm run db:reset` | Wipe and reseed database |
| `npm run db:migrate` | Run migrations only |
| `npm run db:seed` | Seed data only |
| `npm run install:all` | Install all dependencies |
