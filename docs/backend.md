# Maqra Backend Architecture

Maqra started as a static Quran reader. This upgrade adds a real backend layer so the web client does not need to talk directly to every external service.

## What the backend does

The backend is a small Node.js and Express API in `server.js`.

It handles:

- Quran Surah list loading.
- Quran Surah text by language.
- Search across ayahs.
- Audio URL generation.
- Health checks.
- Input validation.
- Memory caching.
- Clean JSON error responses.
- Static frontend hosting.

## Why this matters

Before this upgrade, the browser called Al-Quran Cloud directly. That works for a quick demo, but it is weak for a serious app because:

- Every user causes fresh third-party API calls.
- There is no cache layer.
- Errors go straight to the user.
- The frontend owns too much logic.
- Future mobile apps would need to duplicate the same API logic.

Now the frontend talks to Maqra's own API first.

```txt
Browser / App
    ↓
Maqra Backend API
    ↓
Al-Quran Cloud API + Surah audio source
```

## API routes

### `GET /api/health`

Checks if the backend is running.

Returns:

```json
{
  "ok": true,
  "data": {
    "service": "maqra-api",
    "status": "healthy",
    "uptimeSeconds": 10,
    "cacheEntries": 2
  }
}
```

### `GET /api/editions`

Lists supported Maqra languages and their upstream Quran editions.

Current languages:

- `arabic` → `quran-simple`
- `english` → `en.sahih`
- `swahili` → `sw.ahmedali`

### `GET /api/surahs`

Returns all 114 Surahs with clean metadata.

### `GET /api/surahs/:surahNumber?language=arabic`

Returns one Surah with ayahs and audio URL.

Rules:

- `surahNumber` must be from 1 to 114.
- `language` must be `arabic`, `english`, or `swahili`.

### `GET /api/search?q=mercy&language=english`

Searches Quran text in the selected language.

Rules:

- Query must be at least 2 characters.
- Returns up to 50 matches to keep the response light.

### `POST /api/progress`

Validates reading progress payloads.

Current version does not save progress to a database. The frontend keeps progress in `localStorage`. This endpoint exists so the app already has a backend contract for future account-based sync.

Example body:

```json
{
  "surahNumber": 2,
  "ayahNumber": 255,
  "language": "arabic"
}
```

## Caching

The backend uses an in-memory cache.

Default cache TTL:

```txt
12 hours
```

You can change it with:

```bash
CACHE_TTL_MS=43200000
```

This is intentionally simple. The next serious production step is Redis or a small database-backed cache.

## Local setup

```bash
npm install
npm run dev
```

Then open:

```txt
http://localhost:3000
```

## Production setup

```bash
npm install --omit=dev
npm start
```

Recommended environment:

```bash
PORT=3000
NODE_ENV=production
CACHE_TTL_MS=43200000
CORS_ORIGIN=https://your-domain.com
```

## Next backend upgrades

These are the next strong features Maqra should get:

1. User accounts for synced progress across devices.
2. Database-backed bookmarks and reading streaks.
3. Reciter selection instead of one audio source.
4. Tafsir endpoint.
5. Memorization mode with repeat ayah/audio loop.
6. Offline cache manifest for installed/mobile usage.
7. Admin-safe source monitoring so broken upstream audio/API links are detected early.
