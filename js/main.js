const state = {
  currentSurah: 1,
  currentLanguage: 'arabic',
  ayahs: []
};

const els = {
  status: document.getElementById('status'),
  surahList: document.getElementById('surah-list'),
  language: document.getElementById('language'),
  quran: document.getElementById('quran'),
  audio: document.getElementById('audio-player'),
  audioLoading: document.getElementById('audio-loading'),
  surahTitle: document.getElementById('surah-title'),
  surahMeta: document.getElementById('surah-meta'),
  searchInput: document.getElementById('search-input'),
  searchButton: document.getElementById('search-button'),
  searchWrap: document.getElementById('search-results-wrap'),
  searchResults: document.getElementById('search-results'),
  clearSearch: document.getElementById('clear-search'),
  saveProgress: document.getElementById('save-progress'),
  bookmarkSurah: document.getElementById('bookmark-surah')
};

function setStatus(message) {
  els.status.textContent = message;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(payload?.error?.message || 'Maqra request failed.');
  }

  return payload;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getProgress() {
  try {
    return JSON.parse(localStorage.getItem('maqra:progress') || 'null');
  } catch {
    return null;
  }
}

function setProgress(progress) {
  localStorage.setItem('maqra:progress', JSON.stringify(progress));
}

function getBookmarks() {
  try {
    return JSON.parse(localStorage.getItem('maqra:bookmarks') || '[]');
  } catch {
    return [];
  }
}

function setBookmarks(bookmarks) {
  localStorage.setItem('maqra:bookmarks', JSON.stringify(bookmarks));
}

async function loadSurahList() {
  const payload = await api('/api/surahs');
  els.surahList.innerHTML = payload.data.map((surah) => (
    `<option value="${surah.number}">${surah.number}. ${escapeHtml(surah.englishName)} (${escapeHtml(surah.englishNameTranslation)})</option>`
  )).join('');
}

function renderSurah(surah) {
  state.ayahs = surah.ayahs;
  els.surahTitle.textContent = `${surah.number}. ${surah.englishName}`;
  els.surahMeta.textContent = `${surah.englishNameTranslation || surah.name} • ${surah.numberOfAyahs} ayahs • ${surah.revelationType} • ${surah.language}`;
  els.quran.innerHTML = surah.ayahs.map((ayah) => `
    <article class="ayah border-b border-gray-800 py-4" data-ayah="${ayah.numberInSurah}">
      <div class="flex items-center justify-between gap-4 mb-2">
        <h3 class="text-sm uppercase tracking-wide text-gray-400">Ayah ${ayah.numberInSurah}${ayah.sajda ? ' • Sajda' : ''}</h3>
        <button class="copy-ayah text-xs text-gray-400 hover:text-white" data-text="${escapeHtml(ayah.text)}">Copy</button>
      </div>
      <p class="text-center font-semibold text-xl leading-loose">${escapeHtml(ayah.text)}</p>
    </article>
  `).join('');
}

async function loadSurah(surahNumber = 1, language = 'arabic', autoplay = false) {
  state.currentSurah = Number(surahNumber);
  state.currentLanguage = language;
  els.audioLoading.classList.remove('hidden');
  els.quran.innerHTML = '<p class="text-gray-400">Loading...</p>';
  setStatus('Loading Quran text through Maqra backend...');

  const payload = await api(`/api/surahs/${state.currentSurah}?language=${encodeURIComponent(language)}`);
  renderSurah(payload.data);
  els.audio.src = payload.data.audioUrl;
  els.audioLoading.classList.add('hidden');
  setStatus(`Ready. Source: ${payload.meta.source}.`);

  if (autoplay) {
    els.audio.play().catch(() => setStatus('Audio is ready. Press play when you are ready.'));
  }
}

async function searchAyahs() {
  const query = els.searchInput.value.trim();
  if (query.length < 2) {
    setStatus('Type at least 2 characters to search.');
    return;
  }

  setStatus('Searching ayahs...');
  const payload = await api(`/api/search?q=${encodeURIComponent(query)}&language=${encodeURIComponent(state.currentLanguage)}`);
  els.searchWrap.classList.remove('hidden');
  els.searchResults.innerHTML = payload.data.length
    ? payload.data.map((item) => `
      <button class="block w-full text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-4 search-result" data-surah="${item.surahNumber}">
        <strong>${item.surahNumber}:${item.ayahNumber} — ${escapeHtml(item.surahName)}</strong>
        <p class="mt-2 text-gray-300">${escapeHtml(item.text)}</p>
      </button>
    `).join('')
    : '<p class="text-gray-400">No matching ayahs found.</p>';
  setStatus(`Search complete. ${payload.meta.count} result(s).`);
}

function saveCurrentProgress() {
  const firstVisible = [...document.querySelectorAll('.ayah')].find((ayah) => ayah.getBoundingClientRect().top >= 120);
  const ayahNumber = Number(firstVisible?.dataset?.ayah || 1);
  const progress = {
    surahNumber: state.currentSurah,
    ayahNumber,
    language: state.currentLanguage,
    savedAt: new Date().toISOString()
  };
  setProgress(progress);
  api('/api/progress', { method: 'POST', body: JSON.stringify(progress) }).catch(() => null);
  setStatus(`Progress saved at Surah ${progress.surahNumber}, Ayah ${progress.ayahNumber}.`);
}

function bookmarkCurrentSurah() {
  const bookmarks = getBookmarks();
  const bookmark = {
    surahNumber: state.currentSurah,
    language: state.currentLanguage,
    savedAt: new Date().toISOString()
  };
  const next = [bookmark, ...bookmarks.filter((item) => item.surahNumber !== bookmark.surahNumber || item.language !== bookmark.language)].slice(0, 20);
  setBookmarks(next);
  setStatus(`Bookmarked Surah ${state.currentSurah}.`);
}

els.audio.addEventListener('timeupdate', () => {
  if (!els.audio.duration || Number.isNaN(els.audio.duration)) return;
  const scrollPosition = (els.audio.currentTime / els.audio.duration) * els.quran.scrollHeight;
  els.quran.scrollTop = scrollPosition;
});

els.surahList.addEventListener('change', () => loadSurah(els.surahList.value, els.language.value, false));
els.language.addEventListener('change', () => loadSurah(els.surahList.value, els.language.value, false));
els.searchButton.addEventListener('click', searchAyahs);
els.searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') searchAyahs();
});
els.clearSearch.addEventListener('click', () => {
  els.searchWrap.classList.add('hidden');
  els.searchResults.innerHTML = '';
  els.searchInput.value = '';
});
els.saveProgress.addEventListener('click', saveCurrentProgress);
els.bookmarkSurah.addEventListener('click', bookmarkCurrentSurah);

document.addEventListener('click', (event) => {
  const copyButton = event.target.closest('.copy-ayah');
  if (copyButton) {
    navigator.clipboard.writeText(copyButton.dataset.text || '').then(() => setStatus('Ayah copied.'));
  }

  const result = event.target.closest('.search-result');
  if (result) {
    els.surahList.value = result.dataset.surah;
    loadSurah(result.dataset.surah, state.currentLanguage, false);
    els.searchWrap.classList.add('hidden');
  }
});

window.addEventListener('load', async () => {
  try {
    await api('/api/health');
    await loadSurahList();
    const progress = getProgress();
    const startSurah = progress?.surahNumber || 1;
    const startLanguage = progress?.language || 'arabic';
    els.surahList.value = String(startSurah);
    els.language.value = startLanguage;
    await loadSurah(startSurah, startLanguage, false);
    if (progress?.ayahNumber) {
      document.querySelector(`[data-ayah="${progress.ayahNumber}"]`)?.scrollIntoView({ block: 'center' });
      setStatus(`Restored progress: Surah ${progress.surahNumber}, Ayah ${progress.ayahNumber}.`);
    }
  } catch (error) {
    console.error(error);
    setStatus(error.message);
    els.quran.innerHTML = `<p class="text-red-300">${escapeHtml(error.message)}</p>`;
  }
});
