const API_BASE = 'https://api.alquran.cloud/v1';
const AUDIO_BASE = 'https://raw.githubusercontent.com/Treposting/Surah-API/main/Surah';
const STORAGE = {
  progress: 'maqra.progress',
  bookmarks: 'maqra.bookmarks',
  notes: 'maqra.notes',
  settings: 'maqra.settings',
  cache: 'maqra.cache.v1'
};

const state = {
  surahs: [],
  currentSurah: 1,
  currentEdition: 'en.sahih',
  viewMode: 'parallel',
  fontScale: 1,
  arabic: null,
  translation: null,
  cache: readJson(STORAGE.cache, {})
};

const el = {
  sessionSurah: document.getElementById('session-surah'),
  sessionMeta: document.getElementById('session-meta'),
  status: document.getElementById('status-text'),
  surahList: document.getElementById('surah-list'),
  translationList: document.getElementById('translation-list'),
  viewMode: document.getElementById('view-mode'),
  themeToggle: document.getElementById('theme-toggle'),
  bookmarkSurah: document.getElementById('bookmark-surah'),
  saveProgress: document.getElementById('save-progress'),
  continueReading: document.getElementById('continue-reading'),
  fontMinus: document.getElementById('font-minus'),
  fontPlus: document.getElementById('font-plus'),
  loading: document.getElementById('loading'),
  ayahList: document.getElementById('ayah-list'),
  surahTitle: document.getElementById('surah-title'),
  surahSubtitle: document.getElementById('surah-subtitle'),
  revelationType: document.getElementById('revelation-type'),
  audio: document.getElementById('audio-player'),
  audioTitle: document.getElementById('audio-title'),
  audioMeta: document.getElementById('audio-meta'),
  searchInput: document.getElementById('search-input'),
  searchButton: document.getElementById('search-button'),
  searchResults: document.getElementById('search-results'),
  bookmarksList: document.getElementById('bookmarks-list'),
  clearBookmarks: document.getElementById('clear-bookmarks'),
  reflectionNote: document.getElementById('reflection-note'),
  saveNote: document.getElementById('save-note'),
  ayahTemplate: document.getElementById('ayah-template')
};

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
  catch { return fallback; }
}

function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function setStatus(message) { el.status.textContent = message; }
function escapeHtml(text) {
  return String(text ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}
function cacheKey(path) { return path.replace(/[^a-z0-9._:-]/gi, '_'); }

async function fetchJson(path, maxAgeMs = 1000 * 60 * 60 * 24) {
  const key = cacheKey(path);
  const cached = state.cache[key];
  if (cached && Date.now() - cached.savedAt < maxAgeMs) return cached.payload;
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) throw new Error(`Failed to load data: ${response.status}`);
  const payload = await response.json();
  if (payload.code && payload.code >= 400) throw new Error(payload.status || 'Quran API error');
  state.cache[key] = { payload, savedAt: Date.now() };
  writeJson(STORAGE.cache, state.cache);
  return payload;
}

function saveSettings() {
  writeJson(STORAGE.settings, {
    edition: state.currentEdition,
    viewMode: state.viewMode,
    fontScale: state.fontScale,
    theme: document.documentElement.dataset.theme || 'dark'
  });
}

function applySettings() {
  const settings = readJson(STORAGE.settings, {});
  state.currentEdition = settings.edition || state.currentEdition;
  state.viewMode = settings.viewMode || state.viewMode;
  state.fontScale = settings.fontScale || state.fontScale;
  document.documentElement.dataset.theme = settings.theme || 'dark';
  document.documentElement.style.setProperty('--font-scale', state.fontScale);
  document.body.dataset.view = state.viewMode;
  el.translationList.value = state.currentEdition;
  el.viewMode.value = state.viewMode;
}

async function loadSurahs() {
  setStatus('Loading Surah library...');
  const payload = await fetchJson('/surah', 1000 * 60 * 60 * 24 * 7);
  state.surahs = payload.data;
  el.surahList.innerHTML = state.surahs.map((surah) => `<option value="${surah.number}">${surah.number}. ${escapeHtml(surah.englishName)} — ${escapeHtml(surah.englishNameTranslation)}</option>`).join('');
}

async function loadCurrentSurah(scrollToAyah = null) {
  const surahNumber = Number(state.currentSurah);
  const selected = state.surahs.find((surah) => surah.number === surahNumber);
  el.loading.hidden = false;
  el.ayahList.innerHTML = '';
  setStatus('Loading Quran text and translation...');
  const [arabicPayload, translationPayload] = await Promise.all([
    fetchJson(`/surah/${surahNumber}/quran-simple`),
    fetchJson(`/surah/${surahNumber}/${state.currentEdition}`)
  ]);
  state.arabic = arabicPayload.data;
  state.translation = translationPayload.data;
  renderSurah(selected || state.arabic, scrollToAyah);
  loadNote();
  updateChrome(selected || state.arabic);
  el.loading.hidden = true;
  setStatus('Ready. Your progress, bookmarks, notes, and settings stay on this device.');
}

function updateChrome(surah) {
  el.surahTitle.textContent = `${surah.number}. ${surah.englishName}`;
  el.surahSubtitle.textContent = `${surah.name} • ${surah.englishNameTranslation} • ${surah.numberOfAyahs} ayahs`;
  el.revelationType.textContent = surah.revelationType || 'Surah';
  el.sessionSurah.textContent = surah.englishName || `Surah ${surah.number}`;
  el.sessionMeta.textContent = `${surah.numberOfAyahs} ayahs • ${state.currentEdition}`;
  el.audioTitle.textContent = `${surah.number}. ${surah.englishName}`;
  el.audioMeta.textContent = 'Recitation audio';
  el.audio.src = `${AUDIO_BASE}/${surah.number}.mp3`;
  el.surahList.value = String(surah.number);
}

function renderSurah(surah, scrollToAyah = null) {
  const fragment = document.createDocumentFragment();
  state.arabic.ayahs.forEach((ayah, index) => {
    const node = el.ayahTemplate.content.cloneNode(true);
    const card = node.querySelector('.ayah-card');
    const ayahNumber = ayah.numberInSurah;
    const translation = state.translation.ayahs[index]?.text || '';
    card.dataset.ayah = ayahNumber;
    node.querySelector('.ayah-number').textContent = `${surah.number}:${ayahNumber}${ayah.sajda ? ' • Sajda' : ''}`;
    node.querySelector('.arabic-text').textContent = ayah.text;
    node.querySelector('.translation-text').textContent = translation;
    node.querySelector('.copy-ayah').dataset.copy = `${surah.number}:${ayahNumber}\n${ayah.text}\n${translation}`;
    node.querySelector('.jump-progress').dataset.ayah = ayahNumber;
    fragment.appendChild(node);
  });
  el.ayahList.appendChild(fragment);
  if (scrollToAyah) requestAnimationFrame(() => document.querySelector(`[data-ayah="${scrollToAyah}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
}

function saveProgress(ayahNumber = null) {
  const visible = [...document.querySelectorAll('.ayah-card')].find((card) => card.getBoundingClientRect().top > 80);
  const progress = { surah: Number(state.currentSurah), ayah: Number(ayahNumber || visible?.dataset.ayah || 1), edition: state.currentEdition, viewMode: state.viewMode, savedAt: new Date().toISOString() };
  writeJson(STORAGE.progress, progress);
  setStatus(`Progress saved at ${progress.surah}:${progress.ayah}.`);
}

async function continueProgress() {
  const progress = readJson(STORAGE.progress, null);
  if (!progress) return setStatus('No saved progress yet. Start reading, then save progress.');
  state.currentSurah = progress.surah || 1;
  state.currentEdition = progress.edition || state.currentEdition;
  state.viewMode = progress.viewMode || state.viewMode;
  el.translationList.value = state.currentEdition;
  el.viewMode.value = state.viewMode;
  document.body.dataset.view = state.viewMode;
  await loadCurrentSurah(progress.ayah || 1);
}

function bookmarkCurrentSurah() {
  const surah = state.surahs.find((item) => item.number === Number(state.currentSurah));
  const bookmarks = readJson(STORAGE.bookmarks, []);
  const bookmark = { surah: Number(state.currentSurah), title: surah?.englishName || `Surah ${state.currentSurah}`, subtitle: surah?.englishNameTranslation || '', edition: state.currentEdition, savedAt: new Date().toISOString() };
  const next = [bookmark, ...bookmarks.filter((item) => item.surah !== bookmark.surah)].slice(0, 30);
  writeJson(STORAGE.bookmarks, next);
  renderBookmarks();
  setStatus(`${bookmark.title} bookmarked.`);
}

function renderBookmarks() {
  const bookmarks = readJson(STORAGE.bookmarks, []);
  if (!bookmarks.length) {
    el.bookmarksList.className = 'result-list empty';
    el.bookmarksList.textContent = 'No bookmarks yet.';
    return;
  }
  el.bookmarksList.className = 'result-list';
  el.bookmarksList.innerHTML = bookmarks.map((item) => `<button class="result-item bookmark-item" data-surah="${item.surah}" data-edition="${escapeHtml(item.edition)}">${item.surah}. ${escapeHtml(item.title)}<small>${escapeHtml(item.subtitle)} • ${escapeHtml(item.edition)}</small></button>`).join('');
}

function noteKey() { return `${STORAGE.notes}.${state.currentSurah}.${state.currentEdition}`; }
function loadNote() { el.reflectionNote.value = localStorage.getItem(noteKey()) || ''; }
function saveNote() { localStorage.setItem(noteKey(), el.reflectionNote.value.trim()); setStatus('Reflection note saved on this browser.'); }

function searchTranslation() {
  const query = el.searchInput.value.trim().toLowerCase();
  if (query.length < 2) return setStatus('Type at least 2 characters to search.');
  const results = state.translation.ayahs.filter((ayah) => ayah.text.toLowerCase().includes(query)).slice(0, 25);
  if (!results.length) {
    el.searchResults.className = 'result-list empty';
    el.searchResults.textContent = 'No matches in the current Surah.';
    return setStatus('No matches found in the current Surah.');
  }
  el.searchResults.className = 'result-list';
  el.searchResults.innerHTML = results.map((ayah) => `<button class="result-item search-item" data-ayah="${ayah.numberInSurah}">Ayah ${ayah.numberInSurah}<small>${escapeHtml(ayah.text)}</small></button>`).join('');
  setStatus(`${results.length} match(es) found in the current Surah.`);
}

function updateFontScale(delta) {
  state.fontScale = Math.min(1.35, Math.max(0.82, Number((state.fontScale + delta).toFixed(2))));
  document.documentElement.style.setProperty('--font-scale', state.fontScale);
  saveSettings();
}
function toggleTheme() {
  document.documentElement.dataset.theme = (document.documentElement.dataset.theme || 'dark') === 'dark' ? 'light' : 'dark';
  saveSettings();
}

function bindEvents() {
  el.surahList.addEventListener('change', async () => { state.currentSurah = Number(el.surahList.value); await loadCurrentSurah(); });
  el.translationList.addEventListener('change', async () => { state.currentEdition = el.translationList.value; saveSettings(); await loadCurrentSurah(); });
  el.viewMode.addEventListener('change', () => { state.viewMode = el.viewMode.value; document.body.dataset.view = state.viewMode; saveSettings(); });
  el.themeToggle.addEventListener('click', toggleTheme);
  el.bookmarkSurah.addEventListener('click', bookmarkCurrentSurah);
  el.saveProgress.addEventListener('click', () => saveProgress());
  el.continueReading.addEventListener('click', continueProgress);
  el.fontMinus.addEventListener('click', () => updateFontScale(-0.06));
  el.fontPlus.addEventListener('click', () => updateFontScale(0.06));
  el.searchButton.addEventListener('click', searchTranslation);
  el.searchInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') searchTranslation(); });
  el.clearBookmarks.addEventListener('click', () => { writeJson(STORAGE.bookmarks, []); renderBookmarks(); setStatus('Bookmarks cleared.'); });
  el.saveNote.addEventListener('click', saveNote);
  document.addEventListener('click', async (event) => {
    const copy = event.target.closest('.copy-ayah');
    if (copy) { await navigator.clipboard.writeText(copy.dataset.copy || ''); setStatus('Ayah copied.'); }
    const mark = event.target.closest('.jump-progress');
    if (mark) saveProgress(mark.dataset.ayah);
    const searchItem = event.target.closest('.search-item');
    if (searchItem) document.querySelector(`[data-ayah="${searchItem.dataset.ayah}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const bookmarkItem = event.target.closest('.bookmark-item');
    if (bookmarkItem) { state.currentSurah = Number(bookmarkItem.dataset.surah); state.currentEdition = bookmarkItem.dataset.edition || state.currentEdition; el.translationList.value = state.currentEdition; await loadCurrentSurah(); }
  });
}

async function init() {
  try {
    applySettings();
    bindEvents();
    renderBookmarks();
    await loadSurahs();
    const progress = readJson(STORAGE.progress, null);
    if (progress?.surah) {
      state.currentSurah = progress.surah;
      state.currentEdition = progress.edition || state.currentEdition;
      state.viewMode = progress.viewMode || state.viewMode;
      el.translationList.value = state.currentEdition;
      el.viewMode.value = state.viewMode;
      document.body.dataset.view = state.viewMode;
      await loadCurrentSurah(progress.ayah);
    } else {
      await loadCurrentSurah();
    }
  } catch (error) {
    console.error(error);
    el.loading.hidden = true;
    setStatus(error.message || 'Maqra failed to start.');
    el.ayahList.innerHTML = `<div class="loading-card">${escapeHtml(error.message || 'Failed to load Maqra.')}</div>`;
  }
}

init();
