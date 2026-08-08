(() => {
  'use strict';

  const { t } = window.DanceLensI18n;

  // ---------- DOM ----------
  const heroScreen     = document.getElementById('heroScreen');
  const heroStartBtn   = document.getElementById('heroStartBtn');
  const projectsScreen   = document.getElementById('projectsScreen');
  const projectsList     = document.getElementById('projectsList');
  const projectsEmpty    = document.getElementById('projectsEmpty');
  const newProjectBtn    = document.getElementById('newProjectBtn');
  const newProjectModal  = document.getElementById('newProjectModal');
  const newProjectNameInput = document.getElementById('newProjectNameInput');
  const cancelNewProjectBtn = document.getElementById('cancelNewProjectBtn');
  const createProjectBtn   = document.getElementById('createProjectBtn');
  const backToProjectsBtn  = document.getElementById('backToProjectsBtn');
  const myProjectsBtn      = document.getElementById('myProjectsBtn');

  const uploadScreen   = document.getElementById('uploadScreen');
  const workspace      = document.getElementById('workspace');
  const dropZone       = document.getElementById('dropZone');
  const chooseFileBtn  = document.getElementById('chooseFileBtn');
  const fileInput      = document.getElementById('fileInput');
  const uploadError    = document.getElementById('uploadError');

  const genIdle         = document.getElementById('genIdle');
  const generateMirroredBtn = document.getElementById('generateMirroredBtn');
  const genStatus      = document.getElementById('genStatus');
  const genStatusText  = document.getElementById('genStatusText');
  const genProgressBar = document.getElementById('genProgressBar');

  const foundationsStatus     = document.getElementById('foundationsStatus');
  const foundationsStatusText = document.getElementById('foundationsStatusText');
  const foundationsSection    = document.getElementById('foundationsSection');
  const foundationsCards      = document.getElementById('foundationsCards');
  const foundationsLangNotice     = document.getElementById('foundationsLangNotice');
  const foundationsLangNoticeText = document.getElementById('foundationsLangNoticeText');
  const foundationsRegenerateBtn  = document.getElementById('foundationsRegenerateBtn');

  const choosePracticeFileBtn = document.getElementById('choosePracticeFileBtn');
  const practiceFileInput     = document.getElementById('practiceFileInput');
  const practiceUploadError   = document.getElementById('practiceUploadError');
  const practiceCompareStage  = document.getElementById('practiceCompareStage');
  const referenceCompareVideo = document.getElementById('referenceCompareVideo');
  const practiceVideo         = document.getElementById('practiceVideo');
  const alignReferenceBtn     = document.getElementById('alignReferenceBtn');
  const alignPracticeBtn      = document.getElementById('alignPracticeBtn');
  const clearAlignBtn         = document.getElementById('clearAlignBtn');
  const mirrorReferenceBtn    = document.getElementById('mirrorReferenceBtn');
  const mirrorPracticeBtn     = document.getElementById('mirrorPracticeBtn');
  const timingAnnotation      = document.getElementById('timingAnnotation');
  const practiceCompareTransport = document.getElementById('practiceCompareTransport');
  const comparePlayPauseBtn   = document.getElementById('comparePlayPauseBtn');
  const compareSeekBar        = document.getElementById('compareSeekBar');
  const compareTimeLabel      = document.getElementById('compareTimeLabel');
  const practiceFeedbackStatus     = document.getElementById('practiceFeedbackStatus');
  const practiceFeedbackStatusText = document.getElementById('practiceFeedbackStatusText');
  const practiceFeedbackResults    = document.getElementById('practiceFeedbackResults');
  const practiceFeedbackSummary    = document.getElementById('practiceFeedbackSummary');
  const practiceFeedbackCards      = document.getElementById('practiceFeedbackCards');
  const practiceFeedbackLangNotice     = document.getElementById('practiceFeedbackLangNotice');
  const practiceFeedbackLangNoticeText = document.getElementById('practiceFeedbackLangNoticeText');
  const practiceFeedbackRegenerateBtn  = document.getElementById('practiceFeedbackRegenerateBtn');
  const scoreAccuracy  = document.getElementById('scoreAccuracy');
  const scoreTiming    = document.getElementById('scoreTiming');
  const scoreStability = document.getElementById('scoreStability');

  const viewModeToggle = document.getElementById('viewModeToggle');
  const mirrorToggle    = document.getElementById('mirrorToggle');
  const setBpmBtn       = document.getElementById('setBpmBtn');
  const bpmDotSmall     = document.getElementById('bpmDotSmall');

  const playerPanel   = document.getElementById('playerPanel');
  const videoStage    = document.getElementById('videoStage');
  const paneOriginal  = document.getElementById('paneOriginal');
  const paneMirrored  = document.getElementById('paneMirrored');
  const videoOriginal = document.getElementById('videoOriginal');
  const videoMirrored = document.getElementById('videoMirrored');

  const beatOverlay   = document.getElementById('beatOverlay');
  const beatCountEl   = document.getElementById('beatCount');
  const beatBpmLabel  = document.getElementById('beatBpmLabel');

  const playPauseBtn  = document.getElementById('playPauseBtn');
  const seekBarWrap   = document.getElementById('seekBarWrap');
  const seekBar       = document.getElementById('seekBar');
  const seekBookmarksEl = document.getElementById('seekBookmarks');
  const timeLabel     = document.getElementById('timeLabel');
  const loopBtn       = document.getElementById('loopBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const speedButtons  = document.getElementById('speedButtons');

  const bpmModal        = document.getElementById('bpmModal');
  const bpmInput         = document.getElementById('bpmInput');
  const applyBpmBtn      = document.getElementById('applyBpmBtn');
  const tapTempoBtn      = document.getElementById('tapTempoBtn');
  const tapBpmReadout    = document.getElementById('tapBpmReadout');
  const useTapBpmBtn     = document.getElementById('useTapBpmBtn');
  const alignBeatBtn     = document.getElementById('alignBeatBtn');
  const closeBpmModalBtn = document.getElementById('closeBpmModalBtn');
  const clearBpmBtn      = document.getElementById('clearBpmBtn');
  const voiceCountToggle = document.getElementById('voiceCountToggle');
  const autoDetectBpmBtn = document.getElementById('autoDetectBpmBtn');
  const autoBpmReadout   = document.getElementById('autoBpmReadout');
  const useAutoBpmBtn    = document.getElementById('useAutoBpmBtn');

  const SPEEDS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  const BEATS_PER_COUNT = 8;

  // ---------- State ----------
  let currentProjectId = null;
  let currentProject = null;   // full record loaded from IndexedDB (has blobs)
  let currentPracticeFile = null;

  let originalURL = null;
  let practiceURL = null;
  let mirroredDownloadURL = null;
  let pendingMirrorSourceFile = null;   // set once metadata loads; generation only starts on demand
  let currentRate = 1.0;
  let viewMode = 'single';     // 'single' | 'sidebyside'
  let variant = 'original';    // 'original' | 'mirrored' (single mode only)
  let isSeeking = false;
  let rafId = null;
  let bookmarks = [];   // [{ id, time }] for the currently open project
  let loopActive = false;
  let loopBookmarkId = null;  // which bookmark is the current loop's start point

  // ---------- Practice compare-stage sync state ----------
  let referenceAlignTime = 0;   // seconds, paused position marked in the reference video
  let practiceAlignTime = 0;    // seconds, paused position marked in the practice video
  let compareRafId = null;
  let lastPracticeIssues = [];  // most recent practice feedback issues, for the timing overlay

  // Dynamically-built cards (foundations/practice-feedback) only render their
  // t()-driven labels once, at creation time — switching the UI language
  // live doesn't touch them the way data-i18n elements do. These track what's
  // currently on screen so a language change can re-render them, and what
  // language the underlying AI content itself was generated in (which a
  // re-render can't fix — that needs a real regenerate).
  let lastFoundationsData = null;
  let lastFoundationsLang = null;
  let lastPracticeFeedbackData = null;
  let lastPracticeFeedbackLang = null;

  let bpmSet = false;
  let bpmValue = 120;
  let beatOffset = 0;
  let lastCountInEight = null;
  let tapTimes = [];
  // Voice count-out preference persists across sessions like the language
  // choice, since it's a personal setting rather than per-project state.
  let voiceCountEnabled = false;
  try { voiceCountEnabled = window.localStorage.getItem('count8_voice_count') === '1'; } catch (e) { /* ignore */ }
  let detectedTapBpm = null;
  let detectedAutoBpm = null;

  videoMirrored.classList.add('css-mirrored');

  // ---------- Projects (Feature 5: Personal Dance Growth Journal storage) ----------
  // Every choreography a user works on is a "project" persisted in IndexedDB
  // (shared/db.js) — the original video, auto-identified foundations, and
  // every practice attempt (video + AI feedback + scores) are saved to it so
  // the Practice Journal's Growth Journal can read them back later.
  function showProjectsScreen() {
    currentProjectId = null;
    currentProject = null;
    projectsScreen.classList.remove('hidden');
    uploadScreen.classList.add('hidden');
    workspace.classList.add('hidden');
    myProjectsBtn.classList.add('hidden');
    renderProjectsList();
  }

  function showUploadScreenForProject() {
    projectsScreen.classList.add('hidden');
    uploadScreen.classList.remove('hidden');
    workspace.classList.add('hidden');
    myProjectsBtn.classList.remove('hidden');
    clearUploadError();
  }

  function showWorkspaceScreen() {
    projectsScreen.classList.add('hidden');
    uploadScreen.classList.add('hidden');
    workspace.classList.remove('hidden');
    myProjectsBtn.classList.remove('hidden');
  }

  async function renderProjectsList() {
    projectsList.innerHTML = '';
    let projects = [];
    try {
      projects = await window.DanceLensDB.listProjectsSummary();
    } catch (e) {
      console.warn('Could not load projects.', e);
    }
    projectsEmpty.classList.toggle('hidden', projects.length > 0);
    projects.forEach((p) => {
      const item = document.createElement('div');
      item.className = 'project-item';
      item.dataset.projectId = p.id;

      const info = document.createElement('div');
      const name = document.createElement('div');
      name.className = 'project-item-name';
      name.textContent = p.name;
      const meta = document.createElement('div');
      meta.className = 'project-item-meta';
      meta.textContent = t('project_item_meta', {
        practiceCount: p.practiceEntryCount,
        foundationsCount: p.foundationsCount,
      });
      info.appendChild(name);
      info.appendChild(meta);

      const arrow = document.createElement('span');
      arrow.className = 'project-item-arrow';
      arrow.textContent = '→';

      item.appendChild(info);
      item.appendChild(arrow);
      projectsList.appendChild(item);
    });
  }

  projectsList.addEventListener('click', (e) => {
    const item = e.target.closest('.project-item');
    if (item) openProject(item.dataset.projectId);
  });

  function openNewProjectModal() {
    newProjectNameInput.value = '';
    newProjectModal.classList.remove('hidden');
    newProjectNameInput.focus();
  }
  newProjectBtn.addEventListener('click', openNewProjectModal);

  // Hero/cover screen — Start Now drops straight into project creation,
  // which is what "the create-project interface" means here. The projects
  // screen (with any existing projects) sits right behind it, reachable via
  // the modal's Close button, so returning users aren't blocked from it.
  heroStartBtn.addEventListener('click', () => {
    heroScreen.classList.add('hidden');
    openNewProjectModal();
  });

  function closeNewProjectModal() {
    newProjectModal.classList.add('hidden');
  }
  cancelNewProjectBtn.addEventListener('click', closeNewProjectModal);
  newProjectModal.addEventListener('click', (e) => { if (e.target === newProjectModal) closeNewProjectModal(); });

  createProjectBtn.addEventListener('click', async () => {
    const name = newProjectNameInput.value.trim();
    if (!name) { newProjectNameInput.focus(); return; }
    const project = await window.DanceLensDB.createProject(name);
    currentProjectId = project.id;
    currentProject = project;
    closeNewProjectModal();
    showUploadScreenForProject();
  });

  backToProjectsBtn.addEventListener('click', () => showProjectsScreen());
  myProjectsBtn.addEventListener('click', () => {
    resetWorkspaceUI();
    showProjectsScreen();
  });

  function resetWorkspaceUI() {
    stopRAF();
    videoOriginal.pause();
    videoMirrored.pause();
    videoOriginal.removeAttribute('src');
    videoMirrored.removeAttribute('src');
    videoOriginal.load();
    videoMirrored.load();

    if (originalURL) { URL.revokeObjectURL(originalURL); originalURL = null; }
    if (mirroredDownloadURL) { URL.revokeObjectURL(mirroredDownloadURL); mirroredDownloadURL = null; }
    pendingMirrorSourceFile = null;
    genIdle.classList.add('hidden');
    genStatus.classList.add('hidden');
    genStatus.querySelectorAll('.gen-download-link').forEach(el => el.remove());

    foundationsStatus.classList.add('hidden');
    foundationsSection.classList.add('hidden');
    foundationsCards.innerHTML = '';
    foundationsLangNotice.classList.add('hidden');
    lastFoundationsData = null;
    lastFoundationsLang = null;

    if (practiceURL) { URL.revokeObjectURL(practiceURL); practiceURL = null; }
    currentPracticeFile = null;
    resetCompareSync();
    practiceVideo.removeAttribute('src');
    referenceCompareVideo.removeAttribute('src');
    practiceCompareStage.classList.add('hidden');
    practiceFeedbackStatus.classList.add('hidden');
    practiceFeedbackResults.classList.add('hidden');
    practiceFeedbackCards.innerHTML = '';
    practiceFeedbackLangNotice.classList.add('hidden');
    lastPracticeFeedbackData = null;
    lastPracticeFeedbackLang = null;
    practiceUploadError.classList.add('hidden');
    practiceFileInput.value = '';

    bookmarks = [];
    loopActive = false;
    loopBookmarkId = null;
    renderBookmarks();

    fileInput.value = '';
  }

  async function openProject(id) {
    let project;
    try {
      project = await window.DanceLensDB.getProject(id);
    } catch (e) {
      console.warn('Could not open project.', e);
      return;
    }
    if (!project) return;

    currentProjectId = project.id;
    currentProject = project;

    if (!project.originalVideo) {
      showUploadScreenForProject();
      return;
    }

    resetWorkspaceUI();
    showWorkspaceScreen();

    const videoFile = project.originalVideo.blob;
    originalURL = URL.createObjectURL(videoFile);
    videoOriginal.src = originalURL;
    videoMirrored.src = originalURL;
    resetPlaybackUI();

    videoOriginal.addEventListener('loadedmetadata', async () => {
      await ensureFiniteDuration(videoOriginal);
      updateSeekBarMax();
      updateTimeLabel();
      offerMirroredGeneration(videoFile);

      bookmarks = Array.isArray(project.bookmarks) ? project.bookmarks : [];
      renderBookmarks();

      if (Array.isArray(project.foundations) && project.foundations.length) {
        lastFoundationsData = project.foundations;
        lastFoundationsLang = project.foundationsLang || null;
        renderFoundations(project.foundations);
        updateFoundationsLangNotice();
      } else {
        attemptIdentifyFoundations();
      }

      if (Array.isArray(project.practiceEntries) && project.practiceEntries.length) {
        const latest = project.practiceEntries[project.practiceEntries.length - 1];
        currentPracticeFile = latest.video.blob;
        if (practiceURL) URL.revokeObjectURL(practiceURL);
        practiceURL = URL.createObjectURL(latest.video.blob);
        referenceCompareVideo.src = originalURL;
        practiceVideo.src = practiceURL;
        practiceCompareStage.classList.remove('hidden');
        referenceCompareVideo.addEventListener('loadedmetadata', () => ensureFiniteDuration(referenceCompareVideo), { once: true });
        practiceVideo.addEventListener('loadedmetadata', () => ensureFiniteDuration(practiceVideo), { once: true });
        lastPracticeFeedbackData = latest.feedback;
        lastPracticeFeedbackLang = latest.feedback && latest.feedback.lang || null;
        renderPracticeFeedback(latest.feedback);
        updatePracticeFeedbackLangNotice();
      }
    }, { once: true });

    videoOriginal.addEventListener('durationchange', updateSeekBarMax);
  }

  // ---------- Network helpers ----------
  // Without this, a stalled request to the Claude API (common without a
  // working route to it — e.g. mainland China without a proxy) just left
  // the "Analyzing…" spinner running forever with no way out except
  // reloading the whole page. Aborts after ANALYSIS_TIMEOUT_MS with a
  // clear, distinct message instead.
  const ANALYSIS_TIMEOUT_MS = 75000;

  async function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs || ANALYSIS_TIMEOUT_MS);
    try {
      return await fetch(url, Object.assign({}, options, { signal: controller.signal }));
    } catch (e) {
      if (e.name === 'AbortError') throw new Error(t('analysis_timeout_error'));
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  // Appends a small inline "Retry" button after an error message inside a
  // status element, so a failed analysis can be retried in place instead of
  // forcing the user to re-pick the file (which sometimes doesn't even
  // re-fire the file input's change event for an unchanged selection).
  function renderRetryableError(statusTextEl, message, retryFn) {
    statusTextEl.textContent = message;
    const existing = statusTextEl.parentNode.querySelector('.retry-btn');
    if (existing) existing.remove();
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-ghost btn-small retry-btn';
    btn.textContent = t('retry_btn');
    btn.addEventListener('click', retryFn);
    statusTextEl.parentNode.appendChild(btn);
  }

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

  ['dragenter', 'dragover'].forEach(evt => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
  });
  ['dragleave', 'drop'].forEach(evt => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
    });
  });
  dropZone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  async function handleFile(file) {
    clearUploadError();
    if (!isValidVideoFile(file)) {
      showUploadError(t('upload_error_invalid'));
      return;
    }
    if (!currentProjectId) return;

    if (originalURL) URL.revokeObjectURL(originalURL);
    originalURL = URL.createObjectURL(file);

    videoOriginal.src = originalURL;
    videoMirrored.src = originalURL;

    try {
      currentProject = await window.DanceLensDB.updateProject(currentProjectId, {
        originalVideo: { blob: file, name: file.name, type: file.type },
      });
    } catch (e) {
      console.warn('Could not save the original video to this project.', e);
    }

    showWorkspaceScreen();

    resetPlaybackUI();

    videoOriginal.addEventListener('loadedmetadata', async () => {
      await ensureFiniteDuration(videoOriginal);
      updateSeekBarMax();
      updateTimeLabel();
      offerMirroredGeneration(file);
      attemptIdentifyFoundations();
      bookmarks = [];
      renderBookmarks();
    }, { once: true });

    videoOriginal.addEventListener('durationchange', updateSeekBarMax);
  }

  function updateSeekBarMax() {
    const dur = videoOriginal.duration;
    if (isFinite(dur) && dur > 0) {
      seekBar.max = String(Math.floor(dur * 1000));
    }
    // If duration isn't known yet (some sources report it late), the 'durationchange'
    // listener will call this again once the browser resolves it.
  }

  // Some real video files (certain MP4/MOV containers, particularly ones
  // whose duration atom isn't at the front) report duration as Infinity
  // until the browser is forced to seek near the end. Left unfixed, every
  // seek-bar calculation divides by Infinity and silently comes out ~0 —
  // the bar never advances during playback and dragging it barely moves
  // the video, since seekBar.max was never updated off its tiny default.
  // Only kicks in when actually needed, so normal videos are unaffected.
  function ensureFiniteDuration(videoEl) {
    return new Promise((resolve) => {
      if (isFinite(videoEl.duration) && videoEl.duration > 0) {
        resolve(videoEl.duration);
        return;
      }
      const onTimeUpdate = () => {
        videoEl.removeEventListener('timeupdate', onTimeUpdate);
        videoEl.currentTime = 0;
      };
      const onSeeked = () => {
        videoEl.removeEventListener('seeked', onSeeked);
        resolve(videoEl.duration);
      };
      videoEl.addEventListener('timeupdate', onTimeUpdate);
      videoEl.addEventListener('seeked', onSeeked);
      videoEl.currentTime = 1e10;
      // Belt-and-suspenders: if neither event fires (some browsers/formats
      // never recover), don't hang the rest of setup forever.
      setTimeout(() => {
        videoEl.removeEventListener('timeupdate', onTimeUpdate);
        videoEl.removeEventListener('seeked', onSeeked);
        resolve(videoEl.duration);
      }, 2000);
    });
  }

  // ---------- Mirrored video generation (canvas + MediaRecorder) ----------
  // Generating the downloadable mirrored file plays a whole extra hidden copy
  // of the video in real time (to draw/record it) — running that automatically
  // on load competed with the actual playback for CPU and was the cause of
  // choppy video and a seek bar that lagged behind. Live mirrored viewing
  // (the Original/Mirrored toggle above) is unaffected — that's just CSS.
  function canGenerateMirroredFile() {
    return typeof HTMLCanvasElement.prototype.captureStream === 'function' &&
           typeof window.MediaRecorder !== 'undefined';
  }

  function offerMirroredGeneration(file) {
    pendingMirrorSourceFile = file;
    if (canGenerateMirroredFile()) {
      genIdle.classList.remove('hidden');
    }
  }

  generateMirroredBtn.addEventListener('click', () => {
    genIdle.classList.add('hidden');
    if (pendingMirrorSourceFile) attemptMirroredGeneration(pendingMirrorSourceFile);
  });

  function attemptMirroredGeneration(file) {
    if (!canGenerateMirroredFile()) {
      genStatus.classList.remove('hidden');
      genStatusText.textContent = t('gen_status_live_no_export');
      genProgressBar.style.width = '100%';
      return;
    }

    genStatus.classList.remove('hidden');
    genStatusText.textContent = t('gen_status_generating');
    genProgressBar.style.width = '0%';

    generateMirroredBlob(originalURL)
      .then((blobUrl) => {
        mirroredDownloadURL = blobUrl;
        genStatusText.textContent = t('gen_status_ready');
        genProgressBar.style.width = '100%';

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'mirrored-' + (file.name.replace(/\.[^.]+$/, '') || 'video') + '.webm';
        link.textContent = t('gen_download_link');
        link.className = 'gen-download-link';
        link.style.color = 'var(--accent)';
        link.style.marginLeft = '8px';
        link.style.whiteSpace = 'nowrap';
        genStatus.appendChild(link);
      })
      .catch((err) => {
        console.warn('Mirrored generation failed, falling back to live preview only.', err);
        genStatusText.textContent = t('gen_status_live_export_failed');
        genProgressBar.style.width = '100%';
      });
  }

  function generateMirroredBlob(sourceURL) {
    return new Promise((resolve, reject) => {
      const offVideo = document.createElement('video');
      offVideo.src = sourceURL;
      offVideo.muted = false;
      offVideo.playsInline = true;
      offVideo.style.position = 'fixed';
      offVideo.style.left = '-99999px';
      document.body.appendChild(offVideo);

      const cleanup = () => {
        if (offVideo.parentNode) offVideo.parentNode.removeChild(offVideo);
      };

      offVideo.addEventListener('loadedmetadata', () => {
        const canvas = document.createElement('canvas');
        canvas.width = offVideo.videoWidth || 480;
        canvas.height = offVideo.videoHeight || 854;
        const ctx = canvas.getContext('2d');

        const canvasStream = canvas.captureStream(30);
        let audioTracks = [];
        try {
          const av = offVideo.captureStream ? offVideo.captureStream() : (offVideo.mozCaptureStream ? offVideo.mozCaptureStream() : null);
          if (av) audioTracks = av.getAudioTracks();
        } catch (e) { /* audio capture unsupported, continue video-only */ }

        const combined = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);

        let mimeType = 'video/webm';
        if (window.MediaRecorder.isTypeSupported && window.MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
          mimeType = 'video/webm;codecs=vp9,opus';
        } else if (window.MediaRecorder.isTypeSupported && window.MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
          mimeType = 'video/webm;codecs=vp8,opus';
        }

        let recorder;
        try {
          recorder = new MediaRecorder(combined, { mimeType });
        } catch (e) {
          cleanup();
          reject(e);
          return;
        }

        const chunks = [];
        recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
        recorder.onerror = (e) => { cleanup(); reject(e.error || e); };
        recorder.onstop = () => {
          cleanup();
          if (!chunks.length) { reject(new Error('No data recorded')); return; }
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(URL.createObjectURL(blob));
        };

        let drawing = false;
        function drawFrame() {
          if (!drawing) return;
          ctx.save();
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(offVideo, 0, 0, canvas.width, canvas.height);
          ctx.restore();
          if (offVideo.duration) {
            genProgressBar.style.width = Math.min(100, (offVideo.currentTime / offVideo.duration) * 100) + '%';
          }
          requestAnimationFrame(drawFrame);
        }

        offVideo.addEventListener('play', () => {
          drawing = true;
          recorder.start();
          drawFrame();
        }, { once: true });

        offVideo.addEventListener('ended', () => {
          drawing = false;
          if (recorder.state !== 'inactive') recorder.stop();
        }, { once: true });

        offVideo.play().catch((e) => { cleanup(); reject(e); });
      }, { once: true });

      offVideo.addEventListener('error', () => { cleanup(); reject(new Error('Failed to load video for mirroring')); }, { once: true });
    });
  }

  // ---------- Foundational technique identification (auto, on upload) ----------
  // No real motion/pose analysis is available client-side, so this samples a
  // handful of still frames spread across the clip and asks GPT-4o's vision
  // input to infer techniques from body positioning/styling in those frames.
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
        // Each frame carries the exact timestamp it was captured at, so
        // callers that need it (practice feedback issue timestamps) can use
        // it — callers that just want images can map to .dataUrl.
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
            frames.push({ dataUrl: canvas.toDataURL('image/jpeg', 0.6), time: target });
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

  async function attemptIdentifyFoundations() {
    foundationsSection.classList.add('hidden');
    foundationsCards.innerHTML = '';
    foundationsLangNotice.classList.add('hidden');
    foundationsStatus.classList.remove('hidden');
    foundationsStatusText.textContent = t('foundations_status_identifying');
    const oldRetryBtn = foundationsStatus.querySelector('.retry-btn');
    if (oldRetryBtn) oldRetryBtn.remove();

    let frames;
    try {
      frames = await extractFrames(originalURL, 5);
      if (!frames.length) throw new Error('No frames captured');
    } catch (err) {
      console.warn('Frame extraction failed.', err);
      renderRetryableError(foundationsStatusText, t('foundations_status_no_frames'), attemptIdentifyFoundations);
      return;
    }

    const lang = window.DanceLensI18n.getLang();
    try {
      const res = await fetchWithTimeout('/api/identify-foundations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frames: frames.map((f) => f.dataUrl), lang }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status}).`);
      }
      if (!data.techniques || !data.techniques.length) {
        throw new Error('No techniques were identified in this video.');
      }

      lastFoundationsData = data.techniques;
      lastFoundationsLang = lang;
      renderFoundations(data.techniques);
      updateFoundationsLangNotice();
      foundationsStatus.classList.add('hidden');

      if (currentProjectId) {
        try {
          currentProject = await window.DanceLensDB.updateProject(currentProjectId, {
            foundations: data.techniques,
            foundationsLang: lang,
          });
        } catch (e) {
          console.warn('Could not save foundations to this project.', e);
        }
      }
    } catch (err) {
      // Surface the real reason (e.g. a missing/invalid OpenAI API key) instead
      // of a generic message — this is the actionable info the user needs.
      console.warn('Foundational technique identification failed.', err);
      renderRetryableError(
        foundationsStatusText,
        err.message || "Couldn't identify techniques for this video.",
        attemptIdentifyFoundations
      );
    }
  }

  // ---------- Language-mismatch notices ----------
  // Two supported languages only — a tiny lookup beats round-tripping
  // through the i18n system just to name "the other language".
  function langDisplayName(code, uiLang) {
    if (uiLang === 'zh') return code === 'zh' ? '中文' : '英文';
    return code === 'zh' ? 'Chinese' : 'English';
  }

  function updateFoundationsLangNotice() {
    const uiLang = window.DanceLensI18n.getLang();
    const mismatched = lastFoundationsLang && lastFoundationsData && lastFoundationsLang !== uiLang;
    foundationsLangNotice.classList.toggle('hidden', !mismatched);
    if (!mismatched) return;
    foundationsLangNoticeText.textContent = t('lang_mismatch_note', { lang: langDisplayName(lastFoundationsLang, uiLang) });
    foundationsRegenerateBtn.textContent = t('lang_mismatch_regenerate_btn', { lang: langDisplayName(uiLang, uiLang) });
  }

  foundationsRegenerateBtn.addEventListener('click', () => {
    if (originalURL) attemptIdentifyFoundations();
  });

  const SEARCH_PLATFORMS = [
    { id: 'youtube', label: 'YouTube', urlFor: (q) => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q) },
    { id: 'bilibili', label: 'B站', urlFor: (q) => 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(q) },
    { id: 'douyin', label: '抖音', urlFor: (q) => 'https://www.douyin.com/search/' + encodeURIComponent(q) },
    // Xiaohongshu's own web search puts a login wall in front of results
    // for anonymous visitors — confirmed directly, it's not a broken link
    // on our end, just their platform's restriction. Flagging it so the
    // link itself explains the (real, occasionally confusing) behavior.
    { id: 'xiaohongshu', label: '小红书', requiresLogin: true, urlFor: (q) => 'https://www.xiaohongshu.com/search_result?keyword=' + encodeURIComponent(q) },
  ];

  function buildQueryRow(query) {
    const row = document.createElement('div');
    row.className = 'yt-query-row';

    const text = document.createElement('span');
    text.className = 'yt-query-text';
    text.textContent = '"' + query + '"';
    row.appendChild(text);

    const linksWrap = document.createElement('div');
    linksWrap.className = 'yt-platform-links';

    SEARCH_PLATFORMS.forEach((platform) => {
      const link = document.createElement('a');
      link.className = 'yt-platform-link';
      link.dataset.platform = platform.id;
      link.href = platform.urlFor(query);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      if (platform.requiresLogin) link.title = t('search_login_required_hint');

      const dot = document.createElement('span');
      dot.className = 'platform-dot';

      const label = document.createElement('span');
      label.textContent = platform.label;

      link.appendChild(dot);
      link.appendChild(label);
      linksWrap.appendChild(link);
    });

    row.appendChild(linksWrap);
    return row;
  }

  function buildFoundationCard(technique, index) {
    const card = document.createElement('div');
    card.className = 'tech-card' + (index === 0 ? ' expanded' : '');

    const header = document.createElement('button');
    header.type = 'button';
    header.className = 'tech-card-header';
    header.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');

    const nameWrap = document.createElement('span');
    nameWrap.className = 'tech-name';

    const badge = document.createElement('span');
    badge.className = 'tech-index';
    badge.textContent = String(index + 1);

    const nameText = document.createElement('span');
    nameText.textContent = technique.name;

    nameWrap.appendChild(badge);
    nameWrap.appendChild(nameText);

    // Practice-feedback issues carry a timestamp in the practice video and
    // (for timing issues) whether the student was early or late — foundation
    // techniques don't have these fields, so this simply doesn't render there.
    if (typeof technique.timestamp_seconds === 'number') {
      const tsBadge = document.createElement('span');
      tsBadge.className = 'tech-timestamp';
      tsBadge.textContent = formatTime(technique.timestamp_seconds);
      tsBadge.title = t('issue_jump_to_time');
      tsBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        seekPracticeCompareTo(technique.timestamp_seconds);
      });
      nameWrap.appendChild(tsBadge);

      if (technique.timing_direction === 'late' || technique.timing_direction === 'early') {
        const dirBadge = document.createElement('span');
        dirBadge.className = 'tech-timing-direction ' + technique.timing_direction;
        dirBadge.textContent = technique.timing_direction === 'late' ? t('timing_label_late') : t('timing_label_early');
        nameWrap.appendChild(dirBadge);
      }
    }

    const chevron = document.createElement('span');
    chevron.className = 'chevron';
    chevron.textContent = '▾';

    header.appendChild(nameWrap);
    header.appendChild(chevron);

    const body = document.createElement('div');
    body.className = 'tech-card-body' + (index === 0 ? '' : ' hidden');

    if (technique.explanation) {
      const explanation = document.createElement('p');
      explanation.className = 'tech-explanation';
      explanation.textContent = technique.explanation;
      body.appendChild(explanation);
    }

    if (technique.drill) {
      const drillSection = document.createElement('div');
      drillSection.className = 'tech-section';
      const h4 = document.createElement('h4');
      h4.textContent = t('tech_drill_title');
      const p = document.createElement('p');
      p.textContent = technique.drill;
      drillSection.appendChild(h4);
      drillSection.appendChild(p);
      body.appendChild(drillSection);
    }

    if (Array.isArray(technique.youtube_queries) && technique.youtube_queries.length) {
      const ytSection = document.createElement('div');
      ytSection.className = 'tech-section';
      const h4 = document.createElement('h4');
      h4.textContent = t('tech_tutorials_title');
      const linksWrap = document.createElement('div');
      linksWrap.className = 'yt-links';

      technique.youtube_queries.forEach((query) => {
        linksWrap.appendChild(buildQueryRow(query));
      });

      ytSection.appendChild(h4);
      ytSection.appendChild(linksWrap);
      body.appendChild(ytSection);
    }

    header.addEventListener('click', () => {
      const isExpanded = !body.classList.contains('hidden');
      body.classList.toggle('hidden', isExpanded);
      card.classList.toggle('expanded', !isExpanded);
      header.setAttribute('aria-expanded', String(!isExpanded));
    });

    card.appendChild(header);
    card.appendChild(body);
    return card;
  }

  function renderFoundations(techniques) {
    foundationsCards.innerHTML = '';
    techniques.forEach((technique, index) => {
      foundationsCards.appendChild(buildFoundationCard(technique, index));
    });
    foundationsSection.classList.remove('hidden');
  }

  // ---------- Practice feedback (compare a self-recorded attempt) ----------
  choosePracticeFileBtn.addEventListener('click', () => practiceFileInput.click());

  practiceFileInput.addEventListener('change', () => {
    const file = practiceFileInput.files[0];
    if (file) handlePracticeFile(file);
  });

  function handlePracticeFile(file) {
    practiceUploadError.classList.add('hidden');
    if (!isValidVideoFile(file)) {
      practiceUploadError.textContent = t('upload_error_invalid');
      practiceUploadError.classList.remove('hidden');
      return;
    }

    if (practiceURL) URL.revokeObjectURL(practiceURL);
    practiceURL = URL.createObjectURL(file);
    currentPracticeFile = file;

    referenceCompareVideo.src = originalURL;
    practiceVideo.src = practiceURL;
    practiceCompareStage.classList.remove('hidden');
    resetCompareSync();
    referenceCompareVideo.addEventListener('loadedmetadata', () => ensureFiniteDuration(referenceCompareVideo), { once: true });
    practiceVideo.addEventListener('loadedmetadata', () => ensureFiniteDuration(practiceVideo), { once: true });

    practiceFeedbackResults.classList.add('hidden');
    practiceFeedbackCards.innerHTML = '';

    attemptAnalyzePractice();
  }

  async function attemptAnalyzePractice() {
    practiceFeedbackResults.classList.add('hidden');
    practiceFeedbackCards.innerHTML = '';
    practiceFeedbackLangNotice.classList.add('hidden');
    practiceFeedbackStatus.classList.remove('hidden');
    practiceFeedbackStatusText.textContent = t('practice_status_analyzing');
    const oldRetryBtn = practiceFeedbackStatus.querySelector('.retry-btn');
    if (oldRetryBtn) oldRetryBtn.remove();

    let referenceFrames;
    let practiceFrames;
    try {
      [referenceFrames, practiceFrames] = await Promise.all([
        extractFrames(originalURL, 4),
        extractFrames(practiceURL, 4),
      ]);
      if (!referenceFrames.length || !practiceFrames.length) throw new Error('No frames captured');
    } catch (err) {
      console.warn('Frame extraction failed.', err);
      renderRetryableError(practiceFeedbackStatusText, t('practice_status_no_frames'), attemptAnalyzePractice);
      return;
    }

    const lang = window.DanceLensI18n.getLang();
    try {
      const res = await fetchWithTimeout('/api/analyze-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceFrames: referenceFrames.map((f) => f.dataUrl),
          practiceFrames: practiceFrames.map((f) => f.dataUrl),
          practiceFrameTimestamps: practiceFrames.map((f) => f.time),
          lang,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status}).`);
      }
      if (!data.issues || !data.issues.length) {
        throw new Error('No feedback was identified for this practice video.');
      }
      data.lang = lang;

      lastPracticeFeedbackData = data;
      lastPracticeFeedbackLang = lang;
      renderPracticeFeedback(data);
      updatePracticeFeedbackLangNotice();
      practiceFeedbackStatus.classList.add('hidden');

      if (currentProjectId && currentPracticeFile) {
        try {
          currentProject = await window.DanceLensDB.addPracticeEntry(currentProjectId, {
            video: { blob: currentPracticeFile, name: currentPracticeFile.name, type: currentPracticeFile.type },
            feedback: data,
          });
        } catch (e) {
          console.warn('Could not save this practice attempt to the project.', e);
        }
      }
    } catch (err) {
      // Same principle as the foundations feature: surface the real reason
      // (e.g. a missing API key or low credit balance) instead of a vague message.
      console.warn('Practice feedback analysis failed.', err);
      renderRetryableError(
        practiceFeedbackStatusText,
        err.message || "Couldn't analyze this practice video.",
        attemptAnalyzePractice
      );
    }
  }

  function updatePracticeFeedbackLangNotice() {
    const uiLang = window.DanceLensI18n.getLang();
    const mismatched = lastPracticeFeedbackLang && lastPracticeFeedbackData && lastPracticeFeedbackLang !== uiLang;
    practiceFeedbackLangNotice.classList.toggle('hidden', !mismatched);
    if (!mismatched) return;
    practiceFeedbackLangNoticeText.textContent = t('lang_mismatch_note', { lang: langDisplayName(lastPracticeFeedbackLang, uiLang) });
    practiceFeedbackRegenerateBtn.textContent = t('lang_mismatch_regenerate_btn', { lang: langDisplayName(uiLang, uiLang) });
  }

  practiceFeedbackRegenerateBtn.addEventListener('click', () => {
    if (originalURL && practiceURL) attemptAnalyzePractice();
  });

  function renderScoreBadge(el, value) {
    el.textContent = (typeof value === 'number' && isFinite(value)) ? Math.round(value) + '%' : '—';
  }

  function renderPracticeFeedback(data) {
    renderScoreBadge(scoreAccuracy, data.accuracy_score);
    renderScoreBadge(scoreTiming, data.timing_score);
    renderScoreBadge(scoreStability, data.movement_stability_score);
    practiceFeedbackSummary.textContent = data.summary || '';
    practiceFeedbackSummary.classList.toggle('hidden', !data.summary);
    practiceFeedbackCards.innerHTML = '';
    data.issues.forEach((issue, index) => {
      practiceFeedbackCards.appendChild(buildFoundationCard(issue, index));
    });
    practiceFeedbackResults.classList.remove('hidden');

    lastPracticeIssues = data.issues || [];
    practiceCompareTransport.classList.remove('hidden');
  }

  // ---------- Synced side-by-side compare playback ----------
  // The reference video is the "clock"; the practice video is kept aligned
  // to it via a constant offset (practiceAlignTime - referenceAlignTime),
  // which defaults to 0 (both start together) and can be refined with the
  // align buttons for practice videos that don't start at the same moment.
  function getCompareOffset() {
    return practiceAlignTime - referenceAlignTime;
  }

  function clampPracticeTime(refTime) {
    const dur = practiceVideo.duration || 0;
    return Math.max(0, Math.min(dur, refTime + getCompareOffset()));
  }

  function resetCompareSync() {
    stopCompareRAF();
    referenceAlignTime = 0;
    practiceAlignTime = 0;
    lastPracticeIssues = [];
    referenceCompareVideo.pause();
    practiceVideo.pause();
    comparePlayPauseBtn.textContent = '▶';
    practiceCompareTransport.classList.add('hidden');
    timingAnnotation.classList.add('hidden');
    compareSeekBar.value = 0;
    referenceCompareVideo.classList.remove('css-mirrored');
    practiceVideo.classList.remove('css-mirrored');
    mirrorReferenceBtn.classList.remove('active');
    mirrorPracticeBtn.classList.remove('active');
  }

  // Practice videos can come from a front camera (naturally mirrored, like
  // looking in a mirror) or a back camera (not mirrored) — either video here
  // might need flipping to visually line up with the other, so both get a
  // toggle rather than assuming which one is "correct".
  mirrorReferenceBtn.addEventListener('click', () => {
    const on = referenceCompareVideo.classList.toggle('css-mirrored');
    mirrorReferenceBtn.classList.toggle('active', on);
  });
  mirrorPracticeBtn.addEventListener('click', () => {
    const on = practiceVideo.classList.toggle('css-mirrored');
    mirrorPracticeBtn.classList.toggle('active', on);
  });

  comparePlayPauseBtn.addEventListener('click', () => {
    if (referenceCompareVideo.paused) {
      // If playback previously ran to the end, currentTime is still sitting
      // at (or right next to) duration. Calling .play() on a video that's
      // already at its end makes the browser silently restart it from 0 —
      // but if we first sync practiceVideo to that stale end-of-video
      // position (its normal job mid-playback), practiceVideo gets seeked
      // to ~its own end and then immediately re-seeked to 0 by that same
      // browser auto-restart. Two conflicting seeks back-to-back is what
      // was causing the bad stutter on every second playthrough. Detect
      // "finished" explicitly and restart both from their aligned start
      // instead of syncing to the stale end position.
      const refFinished = referenceCompareVideo.ended ||
        (referenceCompareVideo.duration && referenceCompareVideo.currentTime >= referenceCompareVideo.duration - 0.05);
      if (refFinished) {
        referenceCompareVideo.currentTime = 0;
        practiceVideo.currentTime = clampPracticeTime(0);
      } else {
        practiceVideo.currentTime = clampPracticeTime(referenceCompareVideo.currentTime);
      }
      referenceCompareVideo.muted = false;
      practiceVideo.muted = true;
      const p1 = referenceCompareVideo.play();
      practiceVideo.play().catch(() => {});
      if (p1 && p1.catch) p1.catch(() => {});
      comparePlayPauseBtn.textContent = '⏸';
      startCompareRAF();
    } else {
      referenceCompareVideo.pause();
      practiceVideo.pause();
      comparePlayPauseBtn.textContent = '▶';
      stopCompareRAF();
    }
  });

  ['ended'].forEach((evt) => {
    referenceCompareVideo.addEventListener(evt, () => {
      comparePlayPauseBtn.textContent = '▶';
      stopCompareRAF();
    });
    // practiceVideo can finish before or after referenceCompareVideo
    // depending on align offset/duration mismatch — pause it too so it
    // doesn't keep playing un-synced once the reference has stopped, or
    // sit un-paused if it finishes first.
    practiceVideo.addEventListener(evt, () => {
      practiceVideo.pause();
    });
  });

  function updateCompareSeekMax() {
    const dur = referenceCompareVideo.duration;
    if (isFinite(dur) && dur > 0) {
      compareSeekBar.max = String(Math.floor(dur * 1000));
    }
  }
  referenceCompareVideo.addEventListener('loadedmetadata', updateCompareSeekMax);
  referenceCompareVideo.addEventListener('durationchange', updateCompareSeekMax);

  let isCompareSeeking = false;
  compareSeekBar.addEventListener('pointerdown', () => { isCompareSeeking = true; });
  compareSeekBar.addEventListener('pointerup', () => { isCompareSeeking = false; });
  compareSeekBar.addEventListener('change', () => { isCompareSeeking = false; });
  compareSeekBar.addEventListener('input', () => {
    const target = parseFloat(compareSeekBar.value) / 1000;
    if (!referenceCompareVideo.duration) return;
    referenceCompareVideo.currentTime = target;
    practiceVideo.currentTime = clampPracticeTime(target);
    updateCompareTimeLabel();
  });

  function updateCompareTimeLabel() {
    const cur = referenceCompareVideo.currentTime || 0;
    const dur = referenceCompareVideo.duration || 0;
    compareTimeLabel.textContent = formatTime(cur) + ' / ' + formatTime(dur);
    if (!isCompareSeeking && dur) {
      compareSeekBar.value = String(Math.floor(cur * 1000));
    }
  }

  function updateTimingAnnotation() {
    const cur = practiceVideo.currentTime;
    const match = lastPracticeIssues.find((issue) =>
      (issue.timing_direction === 'late' || issue.timing_direction === 'early') &&
      typeof issue.timestamp_seconds === 'number' &&
      Math.abs(cur - issue.timestamp_seconds) <= 0.75
    );
    if (match) {
      timingAnnotation.textContent = match.timing_direction === 'late' ? t('timing_label_late') : t('timing_label_early');
      timingAnnotation.className = 'timing-annotation ' + match.timing_direction;
    } else {
      timingAnnotation.classList.add('hidden');
    }
  }

  function startCompareRAF() {
    stopCompareRAF();
    let frame = 0;
    function loop() {
      updateCompareTimeLabel();
      updateTimingAnnotation();
      frame++;
      if (frame % 45 === 0) {
        const drift = Math.abs(practiceVideo.currentTime - clampPracticeTime(referenceCompareVideo.currentTime));
        if (drift > 0.15) practiceVideo.currentTime = clampPracticeTime(referenceCompareVideo.currentTime);
      }
      compareRafId = requestAnimationFrame(loop);
    }
    compareRafId = requestAnimationFrame(loop);
  }

  function stopCompareRAF() {
    if (compareRafId) cancelAnimationFrame(compareRafId);
    compareRafId = null;
  }

  alignReferenceBtn.addEventListener('click', () => {
    referenceCompareVideo.pause();
    referenceAlignTime = referenceCompareVideo.currentTime;
    comparePlayPauseBtn.textContent = '▶';
    stopCompareRAF();
  });

  alignPracticeBtn.addEventListener('click', () => {
    practiceVideo.pause();
    practiceAlignTime = practiceVideo.currentTime;
    comparePlayPauseBtn.textContent = '▶';
    stopCompareRAF();
  });

  clearAlignBtn.addEventListener('click', () => {
    referenceAlignTime = 0;
    practiceAlignTime = 0;
  });

  // Jump to a specific moment in the practice video — used by the timestamp
  // badge on practice-feedback issue cards.
  function seekPracticeCompareTo(time) {
    if (!practiceCompareStage || practiceCompareStage.classList.contains('hidden')) return;
    practiceVideo.currentTime = time;
    referenceCompareVideo.currentTime = Math.max(0, time - getCompareOffset());
    updateCompareTimeLabel();
    updateTimingAnnotation();
    practiceCompareStage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ---------- View mode / variant toggles ----------
  viewModeToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    viewMode = btn.dataset.view;
    [...viewModeToggle.children].forEach(c => c.classList.toggle('active', c === btn));

    videoStage.classList.toggle('single-mode', viewMode === 'single');
    videoStage.classList.toggle('side-mode', viewMode === 'sidebyside');
    mirrorToggle.classList.toggle('hidden', viewMode === 'sidebyside');
    applyVariantVisibility();
    syncVideosForModeChange();
  });

  mirrorToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    variant = btn.dataset.variant;
    [...mirrorToggle.children].forEach(c => c.classList.toggle('active', c === btn));
    applyVariantVisibility();
    syncVideosForModeChange();
  });

  function applyVariantVisibility() {
    if (viewMode === 'single') {
      paneOriginal.classList.toggle('active', variant === 'original');
      paneMirrored.classList.toggle('active', variant === 'mirrored');
    } else {
      paneOriginal.classList.add('active');
      paneMirrored.classList.add('active');
    }
  }
  applyVariantVisibility();

  // In single-view mode only one pane is visible — both videos load the same
  // source (mirroring is a CSS flip), so keeping the hidden one decoding too
  // was pure waste and the cause of stutter after changing speed. This picks
  // out whichever element is actually on screen right now.
  function getActiveVideoEl() {
    if (viewMode === 'single' && variant === 'mirrored') return videoMirrored;
    return videoOriginal;
  }

  // Called whenever viewMode/variant changes so the video that's about to
  // become hidden gets paused (stops decoding) and the newly-visible one
  // picks up playback from the same position, preserving play/pause state.
  function syncVideosForModeChange() {
    const wasPlaying = !videoOriginal.paused || !videoMirrored.paused;
    if (viewMode === 'sidebyside') {
      videoMirrored.currentTime = videoOriginal.currentTime;
      if (wasPlaying) {
        videoOriginal.muted = false;
        videoMirrored.muted = true;
        videoOriginal.play().catch(() => {});
        videoMirrored.play().catch(() => {});
      }
    } else {
      const active = getActiveVideoEl();
      const hidden = active === videoOriginal ? videoMirrored : videoOriginal;
      hidden.currentTime = active.currentTime;
      hidden.pause();
      if (wasPlaying) {
        active.muted = false;
        active.play().catch(() => {});
      }
    }
  }

  // ---------- Playback sync ----------
  function resetPlaybackUI() {
    currentRate = 1.0;
    seekBar.value = 0;
    playPauseBtn.textContent = '▶';
    renderSpeedButtons();
  }

  function renderSpeedButtons() {
    speedButtons.innerHTML = '';
    SPEEDS.forEach((s) => {
      const b = document.createElement('button');
      b.className = 'speed-btn' + (s === currentRate ? ' active' : '');
      b.textContent = s.toFixed(1) + '×';
      b.addEventListener('click', () => setSpeed(s));
      speedButtons.appendChild(b);
    });
  }

  function setSpeed(rate) {
    currentRate = rate;
    videoOriginal.playbackRate = rate;
    videoMirrored.playbackRate = rate;
    [...speedButtons.children].forEach((b, i) => b.classList.toggle('active', SPEEDS[i] === rate));
  }

  playPauseBtn.addEventListener('click', () => {
    const active = getActiveVideoEl();
    if (active.paused) {
      if (viewMode === 'sidebyside') {
        videoMirrored.currentTime = videoOriginal.currentTime;
        videoOriginal.muted = false;
        videoMirrored.muted = true;
        const p1 = videoOriginal.play();
        videoMirrored.play().catch(() => {});
        if (p1 && p1.catch) p1.catch(() => {});
      } else {
        // Single-view mode: only decode/play the pane that's actually on
        // screen — playing the hidden twin too was wasted decode work and
        // caused stutter, especially after changing playback speed.
        const hidden = active === videoOriginal ? videoMirrored : videoOriginal;
        hidden.pause();
        active.muted = false;
        const p = active.play();
        if (p && p.catch) p.catch(() => {});
      }
      playPauseBtn.textContent = '⏸';
      startRAF();
    } else {
      videoOriginal.pause();
      videoMirrored.pause();
      playPauseBtn.textContent = '▶';
      stopRAF();
      if (canSpeak) window.speechSynthesis.cancel();
    }
  });

  ['ended'].forEach((evt) => {
    videoOriginal.addEventListener(evt, () => {
      playPauseBtn.textContent = '▶';
      stopRAF();
      if (canSpeak) window.speechSynthesis.cancel();
    });
    videoMirrored.addEventListener(evt, () => {
      playPauseBtn.textContent = '▶';
      stopRAF();
    });
  });

  let seekDebounce = null;
  seekBar.addEventListener('pointerdown', () => { isSeeking = true; });
  seekBar.addEventListener('input', () => {
    const t = (parseFloat(seekBar.value) / 1000);
    if (videoOriginal.duration) {
      const target = t;
      videoOriginal.currentTime = target;
      videoMirrored.currentTime = target;
      updateTimeLabel();
      updateBeatOverlay();
    }
  });
  seekBar.addEventListener('pointerup', () => { isSeeking = false; });
  seekBar.addEventListener('change', () => { isSeeking = false; });

  // ---------- Theater mode (custom overlay, not the native Fullscreen API) ----------
  // iOS Safari doesn't reliably support requestFullscreen() on plain
  // elements (only on <video> itself), so that route left the panel stuck
  // at its normal inline size. A fixed-position CSS overlay works the same
  // way on every device. Tapping the video toggles the overlaid controls,
  // matching how YouTube/Bilibili's players behave.
  function isTheaterMode() {
    return playerPanel.classList.contains('theater-mode');
  }

  function setTheaterMode(on) {
    playerPanel.classList.toggle('theater-mode', on);
    playerPanel.classList.remove('controls-hidden');
    document.body.classList.toggle('theater-lock', on);
    fullscreenBtn.textContent = on ? '⤢' : '⛶';
  }

  fullscreenBtn.addEventListener('click', () => setTheaterMode(!isTheaterMode()));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isTheaterMode()) setTheaterMode(false);
  });

  // Tap/click the video itself to show/hide the overlaid controls — only
  // meaningful in theater mode; a normal inline click on the video does
  // nothing special.
  videoStage.addEventListener('click', (e) => {
    if (!isTheaterMode()) return;
    if (e.target.closest('.toolbar, .bottom-controls')) return;
    playerPanel.classList.toggle('controls-hidden');
  });

  // ---------- Bookmarks (jump back to a tricky section without hunting on the seek bar) ----------
  // Desktop: double-click empty bar to add a marker, double-click a marker to remove it, single-click to jump.
  // Touch: long-press empty bar to add, long-press a marker to remove, tap to jump.
  const LONG_PRESS_MS = 550;
  const LONG_PRESS_MOVE_TOLERANCE = 10;

  function seekToTime(time) {
    videoOriginal.currentTime = time;
    videoMirrored.currentTime = time;
    updateTimeLabel();
    updateBeatOverlay();
  }

  // ---------- Loop playback (repeat a bookmarked section) ----------
  // Jumping to a bookmark also marks it as the loop anchor, so 🔁 has an
  // obvious, immediate target — "the section starting at wherever I just
  // jumped to" — rather than requiring a separate selection step.
  function jumpToBookmark(bookmark) {
    seekToTime(bookmark.time);
    loopBookmarkId = bookmark.id;
    updateLoopBtnState();
    renderBookmarks(); // refresh which marker shows the loop-anchor ring
  }

  // A "section" is the span from this bookmark to the next one chronologically
  // (matches how people actually use two bookmarks to mark a hard part), or a
  // fixed 4s window if there's no next bookmark to bound it.
  function getLoopWindow() {
    const idx = bookmarks.findIndex((b) => b.id === loopBookmarkId);
    if (idx === -1) return null;
    const start = bookmarks[idx].time;
    const next = bookmarks[idx + 1];
    const dur = videoOriginal.duration || start + 4;
    const end = next ? Math.min(next.time, dur) : Math.min(start + 4, dur);
    if (end <= start) return null;
    return { start, end };
  }

  function updateLoopBtnState() {
    loopBtn.disabled = bookmarks.length === 0;
    loopBtn.classList.toggle('active', loopActive);
    loopBtn.title = loopActive ? t('loop_btn_on') : t('loop_btn_label');
    loopBtn.setAttribute('aria-label', loopBtn.title);
  }

  loopBtn.addEventListener('click', () => {
    if (bookmarks.length === 0) return;
    if (!loopActive) {
      // No bookmark explicitly jumped to yet this session — default to
      // whichever bookmark the playhead has most recently passed, so
      // pressing 🔁 "just works" from wherever playback currently is.
      if (!bookmarks.some((b) => b.id === loopBookmarkId)) {
        const cur = videoOriginal.currentTime || 0;
        const passed = bookmarks.filter((b) => b.time <= cur);
        loopBookmarkId = (passed.length ? passed[passed.length - 1] : bookmarks[0]).id;
      }
      loopActive = true;
      seekToTime(bookmarks.find((b) => b.id === loopBookmarkId).time);
    } else {
      loopActive = false;
    }
    updateLoopBtnState();
  });

  // Called every RAF tick while the main player is playing — see startRAF().
  function checkLoopBoundary() {
    if (!loopActive) return;
    const win = getLoopWindow();
    if (!win) { loopActive = false; updateLoopBtnState(); return; }
    if (getActiveVideoEl().currentTime >= win.end) {
      seekToTime(win.start);
    }
  }

  // Also check on the video element's own 'timeupdate' (fires a few times a
  // second, driven by actual media playback) rather than relying solely on
  // requestAnimationFrame — RAF is heavily throttled or paused for
  // backgrounded/hidden tabs while media playback keeps running at normal
  // speed, so RAF-only would miss the loop boundary if the tab isn't in the
  // foreground the whole time.
  videoOriginal.addEventListener('timeupdate', checkLoopBoundary);

  function timeFromClientX(clientX) {
    const rect = seekBar.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return fraction * (videoOriginal.duration || 0);
  }

  async function persistBookmarks() {
    if (!currentProjectId) return;
    try {
      currentProject = await window.DanceLensDB.updateProject(currentProjectId, { bookmarks });
    } catch (e) {
      console.warn('Could not save bookmarks to this project.', e);
    }
  }

  function addBookmark(time) {
    if (!isFinite(time) || !videoOriginal.duration) return;
    bookmarks.push({ id: 'bm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), time });
    bookmarks.sort((a, b) => a.time - b.time);
    renderBookmarks();
    persistBookmarks();
  }

  function removeBookmark(id) {
    bookmarks = bookmarks.filter((b) => b.id !== id);
    if (loopBookmarkId === id) {
      loopActive = false;
      loopBookmarkId = null;
    }
    renderBookmarks();
    persistBookmarks();
  }

  function buildBookmarkMarker(bookmark) {
    const el = document.createElement('div');
    el.className = 'bookmark-marker';
    if (bookmark.id === loopBookmarkId) el.classList.add('loop-anchor');
    const dur = videoOriginal.duration || 1;
    el.style.left = Math.min(100, Math.max(0, (bookmark.time / dur) * 100)) + '%';
    el.title = formatTime(bookmark.time);

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      jumpToBookmark(bookmark);
    });
    el.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      e.preventDefault();
      removeBookmark(bookmark.id);
    });

    let markerPressTimer = null;
    el.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      markerPressTimer = setTimeout(() => {
        markerPressTimer = null;
        removeBookmark(bookmark.id);
      }, LONG_PRESS_MS);
    }, { passive: true });
    el.addEventListener('touchend', (e) => {
      e.stopPropagation();
      if (markerPressTimer) {
        clearTimeout(markerPressTimer);
        markerPressTimer = null;
        // Suppress the synthetic ~300ms-later click event touch browsers
        // fire after touchend — without this, a tap on a marker triggered
        // jumpToBookmark twice back-to-back (harmless in effect, but it
        // meant every touch interaction here silently double-fired).
        e.preventDefault();
        jumpToBookmark(bookmark);
      }
    });
    el.addEventListener('touchmove', (e) => { e.stopPropagation(); });

    return el;
  }

  function renderBookmarks() {
    seekBookmarksEl.innerHTML = '';
    bookmarks.forEach((b) => seekBookmarksEl.appendChild(buildBookmarkMarker(b)));
    updateLoopBtnState();
  }

  seekBar.addEventListener('dblclick', (e) => {
    addBookmark(timeFromClientX(e.clientX));
  });

  let barPressTimer = null;
  let barPressStart = null;
  seekBar.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    barPressStart = { x: touch.clientX, y: touch.clientY };
    barPressTimer = setTimeout(() => {
      barPressTimer = null;
      addBookmark(timeFromClientX(barPressStart.x));
    }, LONG_PRESS_MS);
  }, { passive: true });
  seekBar.addEventListener('touchmove', (e) => {
    if (!barPressTimer || !barPressStart) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - barPressStart.x);
    const dy = Math.abs(touch.clientY - barPressStart.y);
    if (dx > LONG_PRESS_MOVE_TOLERANCE || dy > LONG_PRESS_MOVE_TOLERANCE) {
      clearTimeout(barPressTimer);
      barPressTimer = null;
    }
  }, { passive: true });
  seekBar.addEventListener('touchend', () => {
    if (barPressTimer) { clearTimeout(barPressTimer); barPressTimer = null; }
  });

  function updateTimeLabel() {
    const active = getActiveVideoEl();
    const cur = active.currentTime || 0;
    const dur = videoOriginal.duration || 0;
    timeLabel.textContent = formatTime(cur) + ' / ' + formatTime(dur);
    if (!isSeeking && dur) {
      // seekBar.max is duration expressed in milliseconds (see
      // updateSeekBarMax), so value must be on that same scale — not a
      // 0-1000 fraction, which only coincidentally matched for ~1s clips.
      seekBar.value = String(Math.floor(cur * 1000));
    }
  }

  function formatTime(sec) {
    if (!isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function startRAF() {
    stopRAF();
    let frame = 0;
    function loop() {
      updateTimeLabel();
      updateBeatOverlay();
      checkLoopBoundary();
      frame++;
      if (frame % 45 === 0) correctDrift();
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);
  }

  function stopRAF() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function correctDrift() {
    // Only side-by-side mode has two videos actually decoding/playing at
    // once — in single mode the hidden twin is paused, so there's nothing
    // to drift-correct (and nudging its currentTime every frame was doing
    // needless work).
    if (viewMode !== 'sidebyside') return;
    if (videoMirrored.readyState < 2) return;
    const drift = Math.abs(videoMirrored.currentTime - videoOriginal.currentTime);
    if (drift > 0.15) {
      videoMirrored.currentTime = videoOriginal.currentTime;
    }
  }

  // ---------- Beat counter overlay ----------
  // No recorded voice-count audio files exist (and hosting/recording a full
  // 1-8 counting track wasn't practical here), so voice count-out is done
  // via the browser's built-in text-to-speech instead of an <audio> file.
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
  function speakCount(n) {
    if (!canSpeak) return;
    // Cancel whatever's still queued/speaking first — at faster tempos a
    // previous utterance can easily still be running when the next beat
    // hits, and overlapping/queued speech quickly falls behind the video.
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(String(n));
    utter.lang = window.DanceLensI18n.getLang() === 'zh' ? 'zh-CN' : 'en-US';
    utter.rate = 1.3;
    utter.volume = 1;
    window.speechSynthesis.speak(utter);
  }

  function updateBeatOverlay() {
    if (!bpmSet) return;
    const secPerBeat = 60 / bpmValue;
    let elapsed = getActiveVideoEl().currentTime - beatOffset;
    if (elapsed < 0) elapsed = 0;
    const beatFloat = elapsed / secPerBeat;
    const beatIndex = Math.floor(beatFloat);
    const countInEight = (beatIndex % BEATS_PER_COUNT) + 1;

    if (countInEight !== lastCountInEight) {
      lastCountInEight = countInEight;
      beatCountEl.textContent = String(countInEight);
      beatCountEl.classList.remove('pulse');
      void beatCountEl.offsetWidth;
      beatCountEl.classList.add('pulse');
      setTimeout(() => beatCountEl.classList.remove('pulse'), 150);
      if (voiceCountEnabled && !getActiveVideoEl().paused) {
        speakCount(countInEight);
      }
    }
  }

  // ---------- BPM modal ----------
  function openBpmModal() {
    bpmModal.classList.remove('hidden');
    bpmInput.value = bpmSet ? String(bpmValue) : '';
    tapTimes = [];
    detectedTapBpm = null;
    tapBpmReadout.textContent = '—';
    useTapBpmBtn.disabled = true;
    detectedAutoBpm = null;
    autoBpmReadout.textContent = '—';
    useAutoBpmBtn.disabled = true;
    autoDetectBpmBtn.disabled = !originalURL;
    voiceCountToggle.checked = voiceCountEnabled;
    voiceCountToggle.disabled = !canSpeak;
  }
  function closeBpmModal() {
    bpmModal.classList.add('hidden');
  }

  setBpmBtn.addEventListener('click', openBpmModal);
  closeBpmModalBtn.addEventListener('click', closeBpmModal);
  bpmModal.addEventListener('click', (e) => { if (e.target === bpmModal) closeBpmModal(); });

  applyBpmBtn.addEventListener('click', () => {
    const val = parseFloat(bpmInput.value);
    if (!val || val < 20 || val > 300) {
      bpmInput.focus();
      return;
    }
    activateBpm(val);
    closeBpmModal();
  });

  tapTempoBtn.addEventListener('click', () => {
    const now = performance.now();
    if (tapTimes.length && (now - tapTimes[tapTimes.length - 1]) > 2200) {
      tapTimes = [];
    }
    tapTimes.push(now);
    if (tapTimes.length > 8) tapTimes.shift();

    if (tapTimes.length >= 2) {
      const intervals = [];
      for (let i = 1; i < tapTimes.length; i++) intervals.push(tapTimes[i] - tapTimes[i - 1]);
      const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      detectedTapBpm = Math.round(60000 / avgMs);
      tapBpmReadout.textContent = String(detectedTapBpm);
      useTapBpmBtn.disabled = false;
    }
  });

  useTapBpmBtn.addEventListener('click', () => {
    if (detectedTapBpm) {
      activateBpm(detectedTapBpm);
      closeBpmModal();
    }
  });

  // ---------- Auto-detect BPM from the video's audio ----------
  // Not an LLM/Claude call — Claude's API doesn't analyze raw audio for
  // tempo. This is real client-side signal processing via the Web Audio
  // API: decode the audio track, build an energy-based onset-strength
  // envelope, and autocorrelate it to find the dominant beat period. Like
  // any beat detector (including professional ones), it can occasionally
  // lock onto a half/double-tempo octave error, so the result is offered
  // for confirmation rather than applied automatically.
  const AUTO_BPM_MIN = 60;
  const AUTO_BPM_MAX = 200;
  const AUTO_BPM_MAX_ANALYZE_SECONDS = 60;

  async function detectBpmFromVideo(sourceURL) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) throw new Error(t('bpm_auto_unsupported'));

    const res = await fetch(sourceURL);
    const arrayBuffer = await res.arrayBuffer();

    const audioCtx = new AudioCtx();
    let audioBuffer;
    try {
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    } catch (e) {
      throw new Error(t('bpm_auto_no_audio'));
    } finally {
      audioCtx.close();
    }

    const sampleRate = audioBuffer.sampleRate;
    const channelData = audioBuffer.getChannelData(0);
    const sampleCount = Math.min(channelData.length, sampleRate * AUTO_BPM_MAX_ANALYZE_SECONDS);
    if (sampleCount < sampleRate * 2) throw new Error(t('bpm_auto_no_audio'));

    // 10ms energy blocks — fine enough to resolve tempos up to 200 BPM,
    // coarse enough that autocorrelation over it is effectively instant.
    const hopSize = Math.round(sampleRate * 0.01);
    const numHops = Math.floor(sampleCount / hopSize);
    const energy = new Float32Array(numHops);
    for (let i = 0; i < numHops; i++) {
      const start = i * hopSize;
      const end = Math.min(start + hopSize, sampleCount);
      let sum = 0;
      for (let j = start; j < end; j++) sum += channelData[j] * channelData[j];
      energy[i] = Math.sqrt(sum / (end - start));
    }

    // Onset-strength envelope: positive half-wave-rectified energy
    // increases. Beats/kicks show up as sharp jumps in energy; sustained
    // or fading sound doesn't, so this emphasizes the rhythmic attacks.
    const onset = new Float32Array(numHops);
    let onsetTotal = 0;
    for (let i = 1; i < numHops; i++) {
      const diff = energy[i] - energy[i - 1];
      onset[i] = diff > 0 ? diff : 0;
      onsetTotal += onset[i];
    }
    if (onsetTotal < 1e-6) throw new Error(t('bpm_auto_no_beat'));

    const hopTime = hopSize / sampleRate;
    const minLag = Math.max(1, Math.round((60 / AUTO_BPM_MAX) / hopTime));
    const maxLag = Math.min(numHops - 1, Math.round((60 / AUTO_BPM_MIN) / hopTime));

    let bestLag = -1;
    let bestScore = 0;
    for (let lag = minLag; lag <= maxLag; lag++) {
      let sum = 0;
      for (let i = 0; i + lag < numHops; i++) sum += onset[i] * onset[i + lag];
      if (sum > bestScore) { bestScore = sum; bestLag = lag; }
    }
    if (bestLag <= 0) throw new Error(t('bpm_auto_no_beat'));

    const bpm = 60 / (bestLag * hopTime);
    return Math.round(bpm);
  }

  autoDetectBpmBtn.addEventListener('click', async () => {
    if (!originalURL) return;
    autoDetectBpmBtn.disabled = true;
    useAutoBpmBtn.disabled = true;
    autoBpmReadout.textContent = t('bpm_auto_detecting');
    try {
      detectedAutoBpm = await detectBpmFromVideo(originalURL);
      autoBpmReadout.textContent = String(detectedAutoBpm);
      useAutoBpmBtn.disabled = false;
    } catch (err) {
      console.warn('BPM auto-detect failed.', err);
      detectedAutoBpm = null;
      autoBpmReadout.textContent = err.message || t('bpm_auto_failed');
    } finally {
      autoDetectBpmBtn.disabled = false;
    }
  });

  useAutoBpmBtn.addEventListener('click', () => {
    if (detectedAutoBpm) {
      activateBpm(detectedAutoBpm);
      closeBpmModal();
    }
  });

  alignBeatBtn.addEventListener('click', () => {
    beatOffset = videoOriginal.currentTime || 0;
    lastCountInEight = null;
    const original = alignBeatBtn.textContent;
    alignBeatBtn.textContent = t('bpm_aligned');
    setTimeout(() => { alignBeatBtn.textContent = original; }, 1200);
  });

  clearBpmBtn.addEventListener('click', () => {
    bpmSet = false;
    beatOverlay.classList.add('hidden');
    bpmDotSmall.classList.remove('live');
    if (canSpeak) window.speechSynthesis.cancel();
    closeBpmModal();
  });

  voiceCountToggle.addEventListener('change', () => {
    voiceCountEnabled = voiceCountToggle.checked;
    try { window.localStorage.setItem('count8_voice_count', voiceCountEnabled ? '1' : '0'); } catch (e) { /* ignore */ }
    if (!voiceCountEnabled && canSpeak) window.speechSynthesis.cancel();
  });

  function activateBpm(val) {
    bpmValue = val;
    bpmSet = true;
    lastCountInEight = null;
    beatBpmLabel.textContent = Math.round(bpmValue) + ' ' + t('bpm_unit');
    beatOverlay.classList.remove('hidden');
    bpmDotSmall.classList.add('live');
    updateBeatOverlay();
  }

  // ---------- Init ----------
  renderSpeedButtons();
  renderProjectsList();

  window.DanceLensI18n.onChange(() => {
    if (!projectsScreen.classList.contains('hidden')) renderProjectsList();

    // Static [data-i18n] elements update themselves automatically, but
    // dynamically-built cards only set their t()-driven labels once, at
    // creation time — re-render whatever's currently on screen so section
    // headings inside them ("Drill to Practice", etc.) catch up too.
    if (lastFoundationsData) {
      renderFoundations(lastFoundationsData);
      updateFoundationsLangNotice();
    }
    if (lastPracticeFeedbackData) {
      renderPracticeFeedback(lastPracticeFeedbackData);
      updatePracticeFeedbackLangNotice();
    }
  });
})();
