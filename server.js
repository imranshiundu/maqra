import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);
const AL_QURAN_BASE_URL = 'https://api.alquran.cloud/v1';
const AUDIO_BASE_URL = 'https://raw.githubusercontent.com/Treposting/Surah-API/main/Surah';
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 1000 * 60 * 60 * 12);

const editions = {
  arabic: 'quran-simple',
  english: 'en.sahih',
  swahili: 'sw.ahmedali'
};

const cache = new Map();

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(compression());
app.use(express.json({ limit: '128kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.static(__dirname, {
  extensions: ['html'],
  maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0
}));

function ok(data, meta = {}) {
  return { ok: true, data, meta };
}

function fail(message, status = 500, details = undefined) {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
}

function validateSurahNumber(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 114) {
    throw fail('Surah number must be an integer between 1 and 114.', 400);
  }
  return number;
}

function validateEdition(language = 'arabic') {
  const edition = editions[String(language).toLowerCase()];
  if (!edition) {
    throw fail(`Unsupported language. Use one of: ${Object.keys(editions).join(', ')}.`, 400);
  }
  return edition;
}

async function cachedJson(key, fetcher, ttlMs = CACHE_TTL_MS) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.createdAt < ttlMs) {
    return { value: hit.value, source: 'memory-cache' };
  }

  const value = await fetcher();
  cache.set(key, { value, createdAt: Date.now() });
  return { value, source: 'upstream' };
}

async function fetchAlQuran(pathname) {
  const response = await fetch(`${AL_QURAN_BASE_URL}${pathname}`);
  if (!response.ok) {
    throw fail('Quran upstream service failed.', 502, { status: response.status });
  }

  const payload = await response.json();
  if (payload.code && payload.code >= 400) {
    throw fail(payload.status || 'Quran upstream returned an error.', 502, payload);
  }

  return payload.data;
}

app.get('/api/health', (_req, res) => {
  res.json(ok({
    service: 'maqra-api',
    status: 'healthy',
    uptimeSeconds: Math.round(process.uptime()),
    cacheEntries: cache.size
  }));
});

app.get('/api/editions', (_req, res) => {
  res.json(ok(Object.entries(editions).map(([language, edition]) => ({ language, edition }))));
});

app.get('/api/surahs', async (_req, res, next) => {
  try {
    const { value, source } = await cachedJson('surahs', () => fetchAlQuran('/surah'));
    const surahs = value.map((surah) => ({
      number: surah.number,
      name: surah.name,
      englishName: surah.englishName,
      englishNameTranslation: surah.englishNameTranslation,
      numberOfAyahs: surah.numberOfAyahs,
      revelationType: surah.revelationType
    }));

    res.json(ok(surahs, { source, count: surahs.length }));
  } catch (error) {
    next(error);
  }
});

app.get('/api/surahs/:surahNumber', async (req, res, next) => {
  try {
    const surahNumber = validateSurahNumber(req.params.surahNumber);
    const language = String(req.query.language || 'arabic').toLowerCase();
    const edition = validateEdition(language);
    const key = `surah:${surahNumber}:${edition}`;

    const { value, source } = await cachedJson(key, () => fetchAlQuran(`/surah/${surahNumber}/editions/${edition}`));
    const surah = Array.isArray(value) ? value[0] : value;

    res.json(ok({
      number: surah.number,
      name: surah.name,
      englishName: surah.englishName,
      englishNameTranslation: surah.englishNameTranslation,
      revelationType: surah.revelationType,
      numberOfAyahs: surah.numberOfAyahs,
      language,
      edition,
      audioUrl: `${AUDIO_BASE_URL}/${surahNumber}.mp3`,
      ayahs: surah.ayahs.map((ayah) => ({
        number: ayah.number,
        numberInSurah: ayah.numberInSurah,
        juz: ayah.juz,
        page: ayah.page,
        manzil: ayah.manzil,
        ruku: ayah.ruku,
        hizbQuarter: ayah.hizbQuarter,
        sajda: Boolean(ayah.sajda),
        text: ayah.text
      }))
    }, { source }));
  } catch (error) {
    next(error);
  }
});

app.get('/api/search', async (req, res, next) => {
  try {
    const query = String(req.query.q || '').trim();
    const language = String(req.query.language || 'english').toLowerCase();
    const edition = validateEdition(language);

    if (query.length < 2) {
      throw fail('Search query must be at least 2 characters long.', 400);
    }

    const key = `quran:${edition}`;
    const { value, source } = await cachedJson(key, () => fetchAlQuran(`/quran/${edition}`));
    const normalized = query.toLowerCase();
    const matches = [];

    for (const surah of value.surahs) {
      for (const ayah of surah.ayahs) {
        if (ayah.text.toLowerCase().includes(normalized)) {
          matches.push({
            surahNumber: surah.number,
            surahName: surah.englishName,
            ayahNumber: ayah.numberInSurah,
            text: ayah.text
          });
        }
        if (matches.length >= 50) break;
      }
      if (matches.length >= 50) break;
    }

    res.json(ok(matches, { query, language, edition, source, count: matches.length, cappedAt: 50 }));
  } catch (error) {
    next(error);
  }
});

app.post('/api/progress', (req, res, next) => {
  try {
    const surahNumber = validateSurahNumber(req.body?.surahNumber);
    const ayahNumber = Number(req.body?.ayahNumber || 1);
    const language = String(req.body?.language || 'arabic').toLowerCase();
    validateEdition(language);

    if (!Number.isInteger(ayahNumber) || ayahNumber < 1) {
      throw fail('Ayah number must be a positive integer.', 400);
    }

    res.status(201).json(ok({
      surahNumber,
      ayahNumber,
      language,
      savedAt: new Date().toISOString(),
      storage: 'client-owned'
    }, {
      note: 'This endpoint validates reading progress. Persist it in localStorage now; connect a database when accounts are added.'
    }));
  } catch (error) {
    next(error);
  }
});

app.use('/api', (_req, _res, next) => {
  next(fail('API route not found.', 404));
});

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  res.status(status).json({
    ok: false,
    error: {
      message: error.message || 'Internal server error.',
      status,
      details: process.env.NODE_ENV === 'production' ? undefined : error.details
    }
  });
});

app.listen(PORT, () => {
  console.log(`Maqra API running on http://localhost:${PORT}`);
});
