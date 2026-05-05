# Maqra

**Maqra** is a quiet, minimal Quran reader built for GitHub Pages.

Live site:

```txt
https://imranshiundu.github.io/maqra/
```

It uses a static frontend, public Quran APIs, and browser storage. No Vercel, no Netlify, no Node server, no paid backend.

## Pages

```txt
index.html      Reader
search.html     Search
library.html    Bookmarks and saved progress
notes.html      Private local notes
```

## Features

- Read all 114 Surahs.
- Arabic with translation.
- Arabic-only and translation-only modes.
- Inline Surah audio.
- Quran search page.
- Bookmarks.
- Saved reading position.
- Local private notes.
- Adjustable reading font size.
- Lightweight black-and-white interface.
- Browser-local cache to reduce repeat API calls.

## Design direction

Maqra should feel like a reading tool, not a dashboard.

The interface uses:

- black and white only
- small, light typography
- thin separators instead of heavy cards
- no fixed audio overlay
- separate pages instead of one crowded screen
- quiet spacing around the Quran text

## Data sources

- Quran text and translations: Al-Quran Cloud API.
- Audio: public Surah MP3 files from the Surah API GitHub repository.

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

## Limitations

Because this is intentionally static and free-hosted:

- Notes, bookmarks, and progress stay on one browser/device.
- No cross-device sync yet.
- Search depends on public API availability.
- Full offline mode is not implemented yet.

## Future static-friendly upgrades

- Offline service worker.
- Reciter selection.
- Juz navigation.
- Recently read list.
- Export/import notes as JSON.
- Tafsir links.

## License

MIT License.
