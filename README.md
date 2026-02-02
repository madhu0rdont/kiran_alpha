# Kiran Learns ABCs

A Progressive Web App for teaching a toddler the alphabet using spaced repetition (SM-2 algorithm). Designed for iPad/iPhone with large, touch-friendly elements.

## Tech Stack

- **Frontend:** React 19 + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** SQLite (better-sqlite3)
- **Image Processing:** Sharp (auto-resize to 400x400)
- **PWA:** Service worker + manifest for home screen install

## Project Structure

```
alphabet-app/
├── client/          React frontend (port 5173)
│   ├── src/
│   │   ├── pages/       Home, Session, SessionComplete, Progress, Admin
│   │   ├── services/    API client
│   │   └── lib/         Emoji mappings, image helpers, sound effects
│   └── public/
│       ├── images/letters/   Uploaded letter images
│       └── ...               PWA manifest, service worker, icons
├── server/          Express backend (port 3001)
│   ├── services/        Session & spaced repetition logic
│   └── routes/          API routes (session, progress, admin)
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
2. **Learn letters** — cards show the letter with a character image or emoji and word
3. **Grade yourself** — tap the green check or red X
4. **Spaced repetition** — the SM-2 algorithm schedules reviews:
   - New letters start at 1-day intervals
   - Correct answers increase the interval (1 → 3 → 7+ days)
   - Wrong answers reset to immediate review
   - Letters graduate to "mastered" after 3+ correct reviews at 7+ day intervals
5. **Retry queue** — wrong answers reappear at the end of the session
6. **Progress tracking** — color-coded letter grid shows mastered/learning/problem status

## Letter Characters

Each letter is paired with a kid-friendly character:

A=Anna, B=Bam, C=Chase, D=Daniel, E=Elmo, F=Fuli, G=Goofy, H=House, I=Ice Cream, J=JJ, K=Kion, L=Lightning, M=Marshall, N=Nemo, O=Olaf, P=Peppa, Q=Queen Elsa, R=Rubble, S=Skye, T=Thomas, U=Umbrella, V=Violin, W=Watermelon, X=Xylophone, Y=Yoyo, Z=Zuma

## Image System

By default, letters display an emoji for their character. You can upload real photos via the **Admin page** (`/admin`):

- Upload JPG, PNG, or WebP images per letter
- Images are auto-resized to 400x400 pixels
- Uploaded images appear in sessions and the admin grid
- Remove an image to fall back to the default emoji

## Session Logic

- Each session serves a minimum of 10 cards
- Priority order: problem letters → due reviews → new introductions → mastered backfill
- New letters are introduced if fewer than 7 are in "learning" state and last session scored >= 70%
- If fewer than 10 cards are available from reviews, extra new letters are introduced to fill the deck
- Sessions end when all cards (including retries) are exhausted

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/session/start?mode=upper&count=10` | Get cards for a new session |
| POST | `/api/session/grade` | Grade a card (correct/wrong) |
| POST | `/api/session/complete` | Mark session as finished |
| GET | `/api/progress?mode=upper` | Get summary stats |
| GET | `/api/progress/letters?mode=upper` | Get per-letter progress |
| GET | `/api/admin/letters` | List all letters with image status |
| POST | `/api/admin/upload/:letter` | Upload image for a letter |
| DELETE | `/api/admin/image/:letter` | Remove image for a letter |
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
