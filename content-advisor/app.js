(() => {
  'use strict';

  const { t } = window.DanceLensI18n;

  // ---------- DOM ----------
  const chooseFileBtn        = document.getElementById('chooseFileBtn');
  const fileInput            = document.getElementById('fileInput');
  const uploadError           = document.getElementById('uploadError');

  const videoPreviewSection   = document.getElementById('videoPreviewSection');
  const referenceVideo        = document.getElementById('referenceVideo');

  const advisorStatus         = document.getElementById('advisorStatus');
  const advisorStatusText     = document.getElementById('advisorStatusText');

  const advisorResults        = document.getElementById('advisorResults');
  const advisorCards          = document.getElementById('advisorCards');
  const advisorSavedNote      = document.getElementById('advisorSavedNote');
  const projectPicker         = document.getElementById('projectPicker');

  // ---------- State ----------
  let referenceURL = null;
  let lastResult = null;
  let lastSavedProjectName = null;

  // ---------- Project picker (Feature 5: attach this analysis to a saved project) ----------
  async function populateProjectPicker() {
    const selected = projectPicker.value;
    while (projectPicker.options.length > 1) projectPicker.remove(1);
    let projects = [];
    try {
      projects = await window.DanceLensDB.listProjectsSummary();
    } catch (e) {
      console.warn('Could not load projects.', e);
    }
    projects.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      projectPicker.appendChild(opt);
    });
    if (selected && projects.some((p) => p.id === selected)) {
      projectPicker.value = selected;
    }
  }
  populateProjectPicker();
  window.DanceLensI18n.onChange(populateProjectPicker);

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
    if (file) handleFile(file);
  });

  function handleFile(file) {
    clearUploadError();
    if (!isValidVideoFile(file)) {
      showUploadError(t('upload_error_invalid'));
      return;
    }

    if (referenceURL) URL.revokeObjectURL(referenceURL);
    referenceURL = URL.createObjectURL(file);
    referenceVideo.src = referenceURL;
    videoPreviewSection.classList.remove('hidden');

    advisorResults.classList.add('hidden');
    advisorCards.innerHTML = '';
    advisorSavedNote.classList.add('hidden');
    lastResult = null;
    lastSavedProjectName = null;

    attemptAnalyzeContentStyle();
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
  async function attemptAnalyzeContentStyle() {
    advisorResults.classList.add('hidden');
    advisorCards.innerHTML = '';
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

  // Re-render on language switch since category labels and (if present) the
  // AI-generated suggestion text are both language-dependent.
  window.DanceLensI18n.onChange(() => {
    if (lastResult) renderResults(lastResult);
  });

  window.DanceLensI18n.onChange(() => {
    if (!advisorSavedNote.classList.contains('hidden') && lastSavedProjectName) {
      advisorSavedNote.textContent = t('advisor_saved_note', { projectName: lastSavedProjectName });
    }
  });
})();
