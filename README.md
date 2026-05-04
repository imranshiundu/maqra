# Maqra

**Maqra** is a modern Quran reading and listening web app designed to run for free on GitHub Pages.

Live site:

```txt
https://imranshiundu.github.io/maqra/
```

Maqra does not require Vercel, Netlify, a paid server, or a database. It is a static frontend that uses public Quran APIs and stores personal user data privately in the browser.

## Features

- Read all 114 Surahs.
- Arabic text with translation side by side.
- Arabic-only and translation-only reading modes.
- Surah audio playback.
- Search inside the current Surah translation.
- Copy ayahs.
- Bookmark Surahs.
- Save and restore reading progress.
- Private reflection notes per Surah and translation.
- Light and dark theme.
- Adjustable reading font size.
- Browser-local cache to reduce repeat API calls.
- Responsive desktop and mobile layout.

## Why it is static

The project is hosted on GitHub Pages, so it cannot run a Node.js backend.

```txt
GitHub Pages static frontend
    ↓
Public Quran API
    ↓
Browser localStorage for personal data
```

This keeps hosting free and simple.

## Data sources

- Quran text and translations: Al-Quran Cloud API.
- Audio: public Surah MP3 files from the Surah API GitHub repository.

## Local development

No build step is required.

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

Use GitHub repository settings:

```txt
Settings → Pages → Deploy from branch → main → /root
```

After merging changes to `main`, the site updates at:

```txt
https://imranshiundu.github.io/maqra/
```

## Project structure

```txt
index.html             Main static app shell
styles.css             Modern responsive interface
js/main.js             Quran loading, search, bookmarks, notes, progress
manifest.webmanifest   Static app manifest
assist/                Icons and image assets
```

## Current limitations

Because Maqra is intentionally free-hosted and static:

- User progress is saved per browser/device only.
- Bookmarks and notes do not sync across devices.
- Search focuses on the active Surah to keep the free static version fast.
- If the public Quran API is unavailable, fresh uncached data may not load.

## Future upgrades that still fit GitHub Pages

- Offline-first service worker.
- Reciter selection.
- Juz and page navigation.
- Recently read Surahs.
- Export/import notes as JSON.
- Better mobile bottom navigation.
- Tafsir links using public static sources.

## License

MIT License.
