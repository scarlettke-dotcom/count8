(() => {
  'use strict';

  const { t } = window.DanceLensI18n;

  // ---------- DOM ----------
  const chooseFileBtn        = document.getElementById('chooseFileBtn');
  const fileInput            = document.getElementById('fileInput');
  const uploadError           = document.getElementById('uploadError');
  const projectVideoPicker    = document.getElementById('projectVideoPicker');

  const videoPreviewSection   = document.getElementById('videoPreviewSection');
  const referenceVideo        = document.getElementById('referenceVideo');
  const advisorCachedNote     = document.getElementById('advisorCachedNote');

  const advisorStatus         = document.getElementById('advisorStatus');
  const advisorStatusText     = document.getElementById('advisorStatusText');

  const advisorResults        = document.getElementById('advisorResults');
  const advisorCards          = document.getElementById('advisorCards');
  const advisorSavedNote      = document.getElementById('advisorSavedNote');
  const projectPicker         = document.getElementById('projectPicker');

  const savedVideosSection    = document.getElementById('savedVideosSection');
  const savedVideosList       = document.getElementById('savedVideosList');

  // ---------- State ----------
  let referenceURL = null;
  let lastResult = null;
  let lastSavedProjectName = null;
  let currentEntryId = null;      // active contentAdvisorEntries record, if any
  let knownProjects = [];         // last-fetched listProjectsSummary(), reused for name lookups

  // ---------- Project pickers ----------
  // Two separate dropdowns, two separate purposes: `projectVideoPicker` picks
  // an existing project's video as the thing to analyze; `projectPicker`
  // (legacy) picks which project to attach the resulting suggestions to.
  // Kept independent since you might analyze project A's video but only want
  // to save notes onto project B — but selecting one pre-fills the other for
  // the common case where they're the same project.
  async function refreshProjects() {
    try {
      knownProjects = await window.DanceLensDB.listProjectsSummary();
    } catch (e) {
      console.warn('Could not load projects.', e);
      knownProjects = [];
    }
    return knownProjects;
  }

  async function populateProjectPicker() {
    const selected = projectPicker.value;
    while (projectPicker.options.length > 1) projectPicker.remove(1);
    knownProjects.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      projectPicker.appendChild(opt);
    });
    if (selected && knownProjects.some((p) => p.id === selected)) {
      projectPicker.value = selected;
    }
  }

  async function populateProjectVideoPicker() {
    const selected = projectVideoPicker.value;
    while (projectVideoPicker.options.length > 1) projectVideoPicker.remove(1);
    knownProjects.filter((p) => p.hasOriginalVideo).forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      projectVideoPicker.appendChild(opt);
    });
    if (selected && knownProjects.some((p) => p.id === selected && p.hasOriginalVideo)) {
      projectVideoPicker.value = selected;
    }
  }

  async function refreshAllProjectUI() {
    await refreshProjects();
    await populateProjectPicker();
    await populateProjectVideoPicker();
  }
  window.DanceLensI18n.onChange(refreshAllProjectUI);

  function projectNameFor(projectId) {
    const p = knownProjects.find((p) => p.id === projectId);
    return p ? p.name : null;
  }

  // ---------- Categories (fixed set, always present in the response) ----------
  const CATEGORIES = [
    { key: 'outfit_styling',          icon: '👕', labelKey: 'advisor_cat_outfit' },
    { key: 'camera_angle',            icon: '📐', labelKey: 'advisor_cat_camera_angle' },
    { key: 'camera_distance',         icon: '📏', labelKey: 'advisor_cat_camera_distance' },
    { key: 'filming_location',        icon: '📍', labelKey: 'advisor_cat_location' },
    { key: 'lighting',                icon: '💡', labelKey: 'advisor_cat_lighting' },
    { key: 'background',              icon: '🌆', labelKey: 'advisor_cat_background' },
    { key: 'filters_color_grading',   icon: '🎨', labelKey: 'advisor_cat_filters' },
    { key: 'video_framing',           icon: '🎬', labelKey: 'advisor_cat_framing' },
  ];

  // ---------- Upload ----------
  function isValidVideoFile(file) {
    if (!file) return false;
    const name = file.name.toLowerCase();
    const okExt = name.endsWith('.mp4') || name.endsWith('.mov');
    const okType = file.type === 'video/mp4' || file.type === 'video/quicktime' || file.type === '';
    return okExt || okType;
  }

  function showUploadError(msg) {
    uploadError.textContent = msg;
    uploadError.classList.remove('hidden');
  }

  function clearUploadError() {
    uploadError.classList.add('hidden');
    uploadError.textContent = '';
  }

  chooseFileBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) handleUploadedFile(file);
    fileInput.value = '';
  });

  // A standalone file upload — check the library for an identical
  // already-analyzed video (matched by name+size, since comparing Blob
  // bytes would mean loading every stored video) before creating a new
  // entry, so re-picking the same file twice doesn't waste an API call or
  // clutter the remembered-videos list with duplicates.
  async function handleUploadedFile(file) {
    clearUploadError();
    if (!isValidVideoFile(file)) {
      showUploadError(t('upload_error_invalid'));
      return;
    }

    let entries = [];
    try {
      entries = await window.DanceLensDB.listContentAdvisorEntriesSummary();
    } catch (e) { /* ignore, fall through to creating a new entry */ }
    const dup = entries.find((e) => !e.projectId && e.name === file.name && e.size === file.size);
    if (dup) {
      await activateEntry(dup.id);
      return;
    }

    let entry;
    try {
      entry = await window.DanceLensDB.addContentAdvisorEntry({
        name: file.name,
        projectId: null,
        video: { blob: file, name: file.name, type: file.type },
      });
    } catch (e) {
      console.warn('Could not save this video to the Content Advisor library.', e);
      showUploadError("Couldn't save this video. Try again.");
      return;
    }

    projectVideoPicker.value = '';
    await loadEntryVideo(entry);
    await runAnalysisForEntry(entry.id);
    await refreshSavedVideosList();
  }

  // ---------- Choose from My Projects ----------
  projectVideoPicker.addEventListener('change', async () => {
    const projectId = projectVideoPicker.value;
    if (!projectId) return;
    clearUploadError();

    let project;
    try {
      project = await window.DanceLensDB.getProject(projectId);
    } catch (e) {
      console.warn('Could not load project.', e);
      return;
    }
    if (!project || !project.originalVideo) {
      showUploadError("This project doesn't have a saved video.");
      return;
    }

    // Reuse an existing entry for this project's video if one exists —
    // this is the "don't re-upload, don't re-analyze" path.
    let entries = [];
    try {
      entries = await window.DanceLensDB.listContentAdvisorEntriesSummary();
    } catch (e) { /* ignore */ }
    const existing = entries.find((e) => e.projectId === projectId);

    if (existing) {
      await activateEntry(existing.id, { alsoSelectProject: true });
      return;
    }

    let entry;
    try {
      entry = await window.DanceLensDB.addContentAdvisorEntry({
        name: project.name,
        projectId: project.id,
        video: project.originalVideo,
      });
    } catch (e) {
      console.warn('Could not save this video to the Content Advisor library.', e);
      return;
    }

    projectPicker.value = projectId;
    await loadEntryVideo(entry);
    await runAnalysisForEntry(entry.id);
    await refreshSavedVideosList();
  });

  // ---------- Loading a video (from any source) into the preview pane ----------
  async function loadEntryVideo(entry) {
    currentEntryId = entry.id;
    if (referenceURL) URL.revokeObjectURL(referenceURL);
    referenceURL = URL.createObjectURL(entry.video.blob);
    referenceVideo.src = referenceURL;
    videoPreviewSection.classList.remove('hidden');

    advisorResults.classList.add('hidden');
    advisorCards.innerHTML = '';
    advisorSavedNote.classList.add('hidden');
    advisorCachedNote.classList.add('hidden');
    lastResult = null;
    lastSavedProjectName = null;
  }

  // Load a remembered entry by id — instantly shows its cached suggestions
  // if it has any, otherwise runs analysis once (and caches the result for
  // next time).
  async function activateEntry(id, { alsoSelectProject } = {}) {
    let entry;
    try {
      entry = await window.DanceLensDB.getContentAdvisorEntry(id);
    } catch (e) {
      console.warn('Could not load saved video.', e);
      return;
    }
    if (!entry) return;

    await loadEntryVideo(entry);
    projectVideoPicker.value = entry.projectId || '';
    if (alsoSelectProject && entry.projectId) projectPicker.value = entry.projectId;

    if (entry.suggestions) {
      lastResult = entry.suggestions;
      renderResults(entry.suggestions);
      advisorCachedNote.classList.remove('hidden');
      highlightActiveSavedVideo();
    } else {
      await runAnalysisForEntry(entry.id);
    }
    await refreshSavedVideosList();
  }

  // ---------- Frame extraction (still frames are a natural fit for styling analysis) ----------
  function extractFrames(sourceURL, count) {
    return new Promise((resolve, reject) => {
      const offVideo = document.createElement('video');
      offVideo.src = sourceURL;
      offVideo.muted = true;
      offVideo.playsInline = true;
      offVideo.style.position = 'fixed';
      offVideo.style.left = '-99999px';
      document.body.appendChild(offVideo);

      const cleanup = () => {
        if (offVideo.parentNode) offVideo.parentNode.removeChild(offVideo);
      };

      offVideo.addEventListener('loadedmetadata', () => {
        const duration = offVideo.duration;
        if (!isFinite(duration) || duration <= 0) {
          cleanup();
          reject(new Error('Could not read video duration for analysis'));
          return;
        }

        const maxWidth = 480;
        const srcWidth = offVideo.videoWidth || maxWidth;
        const srcHeight = offVideo.videoHeight || Math.round(maxWidth * 1.5);
        const scale = Math.min(1, maxWidth / srcWidth);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(srcWidth * scale));
        canvas.height = Math.max(1, Math.round(srcHeight * scale));
        const ctx = canvas.getContext('2d');

        const fractions = [0.08, 0.26, 0.44, 0.62, 0.8, 0.92].slice(0, count);
        const frames = [];

        function captureNext(i) {
          if (i >= fractions.length) {
            cleanup();
            resolve(frames);
            return;
          }
          const target = Math.min(duration - 0.05, Math.max(0, duration * fractions[i]));
          const onSeeked = () => {
            offVideo.removeEventListener('seeked', onSeeked);
            ctx.drawImage(offVideo, 0, 0, canvas.width, canvas.height);
            frames.push(canvas.toDataURL('image/jpeg', 0.6));
            captureNext(i + 1);
          };
          offVideo.addEventListener('seeked', onSeeked);
          offVideo.currentTime = target;
        }

        captureNext(0);
      }, { once: true });

      offVideo.addEventListener('error', () => {
        cleanup();
        reject(new Error('Failed to load video for analysis'));
      }, { once: true });
    });
  }

  // ---------- Analysis ----------
  async function runAnalysisForEntry(entryId) {
    advisorResults.classList.add('hidden');
    advisorCards.innerHTML = '';
    advisorCachedNote.classList.add('hidden');
    advisorStatus.classList.remove('hidden');
    advisorStatusText.textContent = t('advisor_status_analyzing');

    let frames;
    try {
      frames = await extractFrames(referenceURL, 6);
      if (!frames.length) throw new Error('No frames captured');
    } catch (err) {
      console.warn('Frame extraction failed.', err);
      advisorStatusText.textContent = t('advisor_status_no_frames');
      return;
    }

    try {
      const res = await fetch('/api/analyze-content-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frames, lang: window.DanceLensI18n.getLang() }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status}).`);
      }

      lastResult = data;
      renderResults(data);
      advisorStatus.classList.add('hidden');

      // Cache the result on the library entry so this exact video never
      // needs to be re-analyzed again.
      if (entryId) {
        try {
          await window.DanceLensDB.updateContentAdvisorEntry(entryId, { suggestions: data });
        } catch (e) {
          console.warn('Could not cache this analysis.', e);
        }
        highlightActiveSavedVideo();
        refreshSavedVideosList();
      }

      const projectId = projectPicker.value;
      if (projectId) {
        try {
          const project = await window.DanceLensDB.updateProject(projectId, {
            contentAdvisor: { timestamp: Date.now(), suggestions: data },
          });
          lastSavedProjectName = project.name;
          advisorSavedNote.textContent = t('advisor_saved_note', { projectName: project.name });
          advisorSavedNote.classList.remove('hidden');
        } catch (e) {
          console.warn('Could not save this analysis to the project.', e);
        }
      }
    } catch (err) {
      console.warn('Content style analysis failed.', err);
      advisorStatusText.textContent = err.message || "Couldn't analyze this video.";
    }
  }

  function buildAdvisorCard(category) {
    const card = document.createElement('div');
    card.className = 'advisor-card';

    const header = document.createElement('div');
    header.className = 'advisor-card-header';

    const icon = document.createElement('span');
    icon.className = 'advisor-card-icon';
    icon.textContent = category.icon;

    const title = document.createElement('span');
    title.className = 'advisor-card-title';
    title.textContent = t(category.labelKey);

    header.appendChild(icon);
    header.appendChild(title);

    const text = document.createElement('p');
    text.className = 'advisor-card-text';
    text.textContent = lastResult ? (lastResult[category.key] || '') : '';

    card.appendChild(header);
    card.appendChild(text);
    return card;
  }

  function renderResults(data) {
    advisorCards.innerHTML = '';
    CATEGORIES.forEach((category) => {
      advisorCards.appendChild(buildAdvisorCard(category));
    });
    advisorResults.classList.remove('hidden');
  }

  // ---------- Previously analyzed videos list ----------
  function formatRelativeDate(ts) {
    const days = Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
    if (days <= 0) return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return '1d';
    if (days < 30) return days + 'd';
    return new Date(ts).toLocaleDateString();
  }

  function highlightActiveSavedVideo() {
    Array.from(savedVideosList.children).forEach((el) => {
      el.classList.toggle('active', el.dataset.entryId === currentEntryId);
    });
  }

  async function refreshSavedVideosList() {
    let entries = [];
    try {
      entries = await window.DanceLensDB.listContentAdvisorEntriesSummary();
    } catch (e) {
      console.warn('Could not load saved videos.', e);
    }

    savedVideosSection.classList.toggle('hidden', entries.length === 0);
    savedVideosList.innerHTML = '';

    entries.forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'saved-video-item';
      item.dataset.entryId = entry.id;
      if (entry.id === currentEntryId) item.classList.add('active');

      const info = document.createElement('div');
      info.className = 'saved-video-info';
      const name = document.createElement('div');
      name.className = 'saved-video-name';
      name.textContent = entry.name;
      const meta = document.createElement('div');
      meta.className = 'saved-video-meta';
      const projectName = entry.projectId ? projectNameFor(entry.projectId) : null;
      meta.textContent = projectName
        ? t('advisor_video_project_tag', { projectName }) + ' · ' + formatRelativeDate(entry.updatedAt)
        : formatRelativeDate(entry.updatedAt);
      info.appendChild(name);
      info.appendChild(meta);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'saved-video-remove';
      removeBtn.textContent = '×';
      removeBtn.title = t('advisor_remove_video');
      removeBtn.setAttribute('aria-label', t('advisor_remove_video'));
      removeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await window.DanceLensDB.deleteContentAdvisorEntry(entry.id);
        } catch (err) { /* ignore */ }
        if (entry.id === currentEntryId) currentEntryId = null;
        refreshSavedVideosList();
      });

      item.appendChild(info);
      item.appendChild(removeBtn);
      item.addEventListener('click', () => activateEntry(entry.id));
      savedVideosList.appendChild(item);
    });
  }

  // ---------- Init: restore the most recently used video, if any ----------
  async function restoreLastEntry() {
    let entries = [];
    try {
      entries = await window.DanceLensDB.listContentAdvisorEntriesSummary();
    } catch (e) {
      console.warn('Could not load saved videos.', e);
    }
    await refreshSavedVideosList();
    if (entries.length > 0) {
      await activateEntry(entries[0].id);
    }
  }

  // refreshAllProjectUI must resolve first so project-name lookups (used by
  // both the saved-videos list and entry restoration) have data to read.
  (async () => {
    await refreshAllProjectUI();
    await restoreLastEntry();
  })();

  // Re-render on language switch since category labels and (if present) the
  // AI-generated suggestion text are both language-dependent.
  window.DanceLensI18n.onChange(() => {
    if (lastResult) renderResults(lastResult);
  });

  window.DanceLensI18n.onChange(() => {
    if (!advisorSavedNote.classList.contains('hidden') && lastSavedProjectName) {
      advisorSavedNote.textContent = t('advisor_saved_note', { projectName: lastSavedProjectName });
    }
    refreshSavedVideosList();
  });
})();
