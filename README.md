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
- Ayah-by-ayah audio playlist using Quran API audio editions.
- Reciter selector: Mishary Alafasy, Husary, Sudais and Shatri.
- Explicit Play Surah button so browsers do not silently block autoplay.
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
- Storage manager for offline/cache controls.
- Export/import user data: progress, bookmarks, settings and notes.
- Bookmarks.
- Saved reading position.
- Local private notes.
- Adjustable reading font size.
- Lightweight black-and-white interface.
- Browser-local cache to reduce repeat API calls.
- Fresh-first service worker so old JS does not trap broken navigation.

## Runtime fix notes

Earlier audio used a full-Surah MP3 path from a raw GitHub repository. That source was fragile and could fail silently. Maqra now loads audio from Quran API audio editions, one ayah at a time, then advances through the Surah as a playlist.

Earlier service worker behavior could also keep stale JavaScript alive after a deployment. The service worker now prefers fresh app-shell files and only falls back to cache when offline.

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

Audio is different. Full Quran audio caching may be blocked by browser storage limits, mobile storage limits, CORS behavior or network failures. Maqra currently treats audio caching as a careful future upgrade rather than pretending it is guaranteed.

## Data sources

- Quran text and translations: Al-Quran Cloud API.
- Audio: Al-Quran Cloud audio editions.
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
- Juz navigation.
- Recently read list.
- Tafsir links.
- Better offline audio size reporting where browser APIs allow it.

## License

MIT License.
