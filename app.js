(() => {
  'use strict';

  const { t } = window.DanceLensI18n;

  // ---------- DOM ----------
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

  const choosePracticeFileBtn = document.getElementById('choosePracticeFileBtn');
  const practiceFileInput     = document.getElementById('practiceFileInput');
  const practiceUploadError   = document.getElementById('practiceUploadError');
  const practiceCompareStage  = document.getElementById('practiceCompareStage');
  const referenceCompareVideo = document.getElementById('referenceCompareVideo');
  const practiceVideo         = document.getElementById('practiceVideo');
  const alignReferenceBtn     = document.getElementById('alignReferenceBtn');
  const alignPracticeBtn      = document.getElementById('alignPracticeBtn');
  const clearAlignBtn         = document.getElementById('clearAlignBtn');
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

  // ---------- Practice compare-stage sync state ----------
  let referenceAlignTime = 0;   // seconds, paused position marked in the reference video
  let practiceAlignTime = 0;    // seconds, paused position marked in the practice video
  let compareRafId = null;
  let lastPracticeIssues = [];  // most recent practice feedback issues, for the timing overlay

  let bpmSet = false;
  let bpmValue = 120;
  let beatOffset = 0;
  let lastCountInEight = null;
  let tapTimes = [];
  let detectedTapBpm = null;

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

  newProjectBtn.addEventListener('click', () => {
    newProjectNameInput.value = '';
    newProjectModal.classList.remove('hidden');
    newProjectNameInput.focus();
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

    if (practiceURL) { URL.revokeObjectURL(practiceURL); practiceURL = null; }
    currentPracticeFile = null;
    resetCompareSync();
    practiceVideo.removeAttribute('src');
    referenceCompareVideo.removeAttribute('src');
    practiceCompareStage.classList.add('hidden');
    practiceFeedbackStatus.classList.add('hidden');
    practiceFeedbackResults.classList.add('hidden');
    practiceFeedbackCards.innerHTML = '';
    practiceUploadError.classList.add('hidden');
    practiceFileInput.value = '';

    bookmarks = [];
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
        renderFoundations(project.foundations);
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
        renderPracticeFeedback(latest.feedback);
      }
    }, { once: true });

    videoOriginal.addEventListener('durationchange', updateSeekBarMax);
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
    foundationsStatus.classList.remove('hidden');
    foundationsStatusText.textContent = t('foundations_status_identifying');

    let frames;
    try {
      frames = await extractFrames(originalURL, 5);
      if (!frames.length) throw new Error('No frames captured');
    } catch (err) {
      console.warn('Frame extraction failed.', err);
      foundationsStatusText.textContent = t('foundations_status_no_frames');
      return;
    }

    try {
      const res = await fetch('/api/identify-foundations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frames: frames.map((f) => f.dataUrl), lang: window.DanceLensI18n.getLang() }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status}).`);
      }
      if (!data.techniques || !data.techniques.length) {
        throw new Error('No techniques were identified in this video.');
      }

      renderFoundations(data.techniques);
      foundationsStatus.classList.add('hidden');

      if (currentProjectId) {
        try {
          currentProject = await window.DanceLensDB.updateProject(currentProjectId, { foundations: data.techniques });
        } catch (e) {
          console.warn('Could not save foundations to this project.', e);
        }
      }
    } catch (err) {
      // Surface the real reason (e.g. a missing/invalid OpenAI API key) instead
      // of a generic message — this is the actionable info the user needs.
      console.warn('Foundational technique identification failed.', err);
      foundationsStatusText.textContent = err.message || "Couldn't identify techniques for this video.";
    }
  }

  const SEARCH_PLATFORMS = [
    { id: 'youtube', label: 'YouTube', urlFor: (q) => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q) },
    { id: 'bilibili', label: 'B站', urlFor: (q) => 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(q) },
    { id: 'douyin', label: '抖音', urlFor: (q) => 'https://www.douyin.com/search/' + encodeURIComponent(q) },
    { id: 'xiaohongshu', label: '小红书', urlFor: (q) => 'https://www.xiaohongshu.com/search_result?keyword=' + encodeURIComponent(q) },
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
    practiceFeedbackStatus.classList.remove('hidden');
    practiceFeedbackStatusText.textContent = t('practice_status_analyzing');

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
      practiceFeedbackStatusText.textContent = t('practice_status_no_frames');
      return;
    }

    try {
      const res = await fetch('/api/analyze-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceFrames: referenceFrames.map((f) => f.dataUrl),
          practiceFrames: practiceFrames.map((f) => f.dataUrl),
          practiceFrameTimestamps: practiceFrames.map((f) => f.time),
          lang: window.DanceLensI18n.getLang(),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status}).`);
      }
      if (!data.issues || !data.issues.length) {
        throw new Error('No feedback was identified for this practice video.');
      }

      renderPracticeFeedback(data);
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
      practiceFeedbackStatusText.textContent = err.message || "Couldn't analyze this practice video.";
    }
  }

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
  }

  comparePlayPauseBtn.addEventListener('click', () => {
    if (referenceCompareVideo.paused) {
      practiceVideo.currentTime = clampPracticeTime(referenceCompareVideo.currentTime);
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
    }
  });

  ['ended'].forEach((evt) => {
    videoOriginal.addEventListener(evt, () => {
      playPauseBtn.textContent = '▶';
      stopRAF();
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
    renderBookmarks();
    persistBookmarks();
  }

  function buildBookmarkMarker(bookmark) {
    const el = document.createElement('div');
    el.className = 'bookmark-marker';
    const dur = videoOriginal.duration || 1;
    el.style.left = Math.min(100, Math.max(0, (bookmark.time / dur) * 100)) + '%';
    el.title = formatTime(bookmark.time);

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      seekToTime(bookmark.time);
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
        seekToTime(bookmark.time);
      }
    });
    el.addEventListener('touchmove', (e) => { e.stopPropagation(); });

    return el;
  }

  function renderBookmarks() {
    seekBookmarksEl.innerHTML = '';
    bookmarks.forEach((b) => seekBookmarksEl.appendChild(buildBookmarkMarker(b)));
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
    closeBpmModal();
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
  });
})();
