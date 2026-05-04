# Maqra

**Maqra** is a Quran reading and listening platform for reading, reciting, searching, bookmarking, and continuing Quran study with a clean web experience.

The project now includes a real backend API instead of relying only on direct browser calls to external Quran services.

---

## What Maqra does

- Read Quran Surahs.
- Switch between Arabic, English, and Swahili text.
- Listen to Surah audio.
- Search ayahs by text.
- Copy ayahs.
- Bookmark a Surah.
- Save and restore reading progress.
- Load Quran data through a backend cache layer.

---

## How the system works

```txt
Frontend browser page
    ↓
Maqra Express backend
    ↓
Al-Quran Cloud API + Surah audio source
```

The frontend does not need to know the full upstream API structure anymore. It asks Maqra's own backend for clean data.

This gives the project:

- Better error handling.
- Input validation.
- Memory caching.
- Cleaner frontend code.
- A future-ready API for mobile apps or desktop apps.

Read the backend explanation here:

```txt
docs/backend.md
```

---

## Backend routes

| Route | Purpose |
| --- | --- |
| `GET /api/health` | Check backend health |
| `GET /api/editions` | List supported language editions |
| `GET /api/surahs` | List all Surahs |
| `GET /api/surahs/:surahNumber?language=arabic` | Load one Surah |
| `GET /api/search?q=mercy&language=english` | Search ayahs |
| `POST /api/progress` | Validate progress payloads for future sync |

---

## Tech stack

- **Frontend:** HTML, Tailwind CSS, JavaScript.
- **Backend:** Node.js, Express.
- **Security and performance:** Helmet, CORS, compression, request logging, memory cache.
- **Quran data:** Al-Quran Cloud API.
- **Audio:** Surah MP3 source from the Surah API GitHub repository.

---

## Local installation

### 1. Clone the repository

```bash
git clone https://github.com/imranshiundu/maqra.git
cd maqra
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run development server

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

---

## Production run

```bash
npm install --omit=dev
npm start
```

Optional environment values:

```bash
PORT=3000
NODE_ENV=production
CACHE_TTL_MS=43200000
CORS_ORIGIN=https://your-domain.com
```

---

## Important implementation notes

- Reading progress is currently saved in the browser with `localStorage`.
- Bookmarks are currently saved in the browser with `localStorage`.
- `/api/progress` validates progress now so a real database can be added later without changing the frontend contract too much.
- Cache is in memory, which is good enough for the first backend version. Redis or a database cache should come later for production scale.

---

## Next serious upgrades

- Add user accounts for synced progress.
- Add reciter selection.
- Add tafsir mode.
- Add memorization mode with ayah repeat.
- Add reading streaks.
- Add offline support.
- Add database persistence for bookmarks, notes, and progress.
- Add tests for backend routes.

---

## License

Maqra is released under the MIT License.
