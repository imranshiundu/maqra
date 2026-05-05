# Maqra

**Maqra** is a quiet persistent Quran reader built for GitHub Pages.

Live site:

```txt
https://imranshiundu.github.io/maqra/
```

It uses a static frontend, public Quran APIs, local downloads, a service worker and browser storage. No Vercel, no Netlify, no Node server, no paid backend.

## App sections

Maqra uses one HTML app shell. Navigation changes sections without reloading the page, so the audio player stays alive.

```txt
Reader       Focused ayah + translation stage
Listen       Surah list for direct audio playback
Read Along   Silent human-speed reading mode with optional soft rhythm
Search       Translation search
Library      Bookmarks and saved progress
Storage      Offline data, backups and cache controls
Notes        Private local notes
```

## Features

- Persistent global player across Maqra sections.
- Listen page with all Surahs selectable for playback.
- Playback speed control.
- Repeat Surah and auto-next Surah controls.
- One-screen Quran reader on desktop.
- Focus Mode that hides navigation and controls.
- Moving ayah view while audio plays.
- Previous, Next and range controls for ayah movement.
- Read Along page for recitation practice without recitation audio.
- Optional generated soft rhythm for read-along focus.
- Adjustable read-along speed.
- Arabic with selected translation.
- Arabic-only and translation-only modes.
- Translation selector loaded from available API editions.
- Swahili fallback handling when a translation source fails.
- Download selected Surah as JSON, TXT or Markdown.
- Download whole Quran text as JSON, TXT or Markdown.
- Save selected Surah locally for about 45 days.
- Best-effort browser cache for Quran audio.
- Storage manager for offline/cache controls.
- Export/import user data: progress, bookmarks, settings and notes.
- Bookmarks.
- Saved reading position.
- Local private notes.
- Adjustable reading font size.
- Lightweight black-and-white interface.
- Browser-local cache to reduce repeat API calls.
- Service worker app-shell cache for faster repeat loads.

## Why the player used to stop

The old version used real page navigation. Moving from Reader to Library loaded a new HTML document, so the browser destroyed the audio element.

The fix is an app-shell model:

```txt
index.html stays mounted
    ↓
hash navigation changes visible section
    ↓
global audio player remains mounted
    ↓
playback continues
```

## Important static hosting note

Maqra is hosted on GitHub Pages. Public frontend apps cannot safely hide API keys. Any API key placed in this repository would be visible to users and could be abused.

The safe architecture is:

```txt
GitHub Pages frontend
    ↓
Public no-key Quran APIs
    ↓
Service worker + browser cache + localStorage + downloads
```

If private API keys are needed later, Maqra needs a backend proxy or serverless worker. That is intentionally not used in this free GitHub Pages version.

## Offline and download behavior

Text downloads are reliable because JSON, TXT and Markdown are normal browser downloads.

Audio is different. Full Quran MP3 caching may be blocked by browser storage limits, mobile storage limits, CORS behavior or network failures. Maqra treats full audio caching as best-effort browser cache behavior.

The Storage section lets users:

- view approximate local Maqra data size
- see saved offline Surah count
- export/import user data
- clear offline Quran data
- clear audio cache

## Data sources

- Quran text and translations: Al-Quran Cloud API.
- Audio: public Surah MP3 files from the Surah API GitHub repository.
- Read-along rhythm: generated locally with the Web Audio API. No external sound file is required.

## Local development

```bash
git clone https://github.com/imranshiundu/maqra.git
cd maqra
python3 -m http.server 8000
```

Open:

```txt
http://localhost:8000
```

## GitHub Pages deployment

```txt
Settings → Pages → Deploy from branch → main → /root
```

After merging to `main`, GitHub Pages updates the live site.

## Future static-friendly upgrades

- Real timestamped ayah-by-ayah audio sync.
- Per-reciter selection with verified public audio endpoints.
- Juz navigation.
- Recently read list.
- Tafsir links.
- Better offline audio size reporting where browser APIs allow it.

## License

MIT License.
