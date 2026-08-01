(() => {
  'use strict';

  const { t } = window.DanceLensI18n;

  const STORAGE_KEY = 'dancelens.practiceJournal.sessions.v1';
  const RECENT_WINDOW = 3;

  const AFFIRMATION_KEYS = [
    'journal_affirmation_1',
    'journal_affirmation_2',
    'journal_affirmation_3',
    'journal_affirmation_4',
    'journal_affirmation_5',
  ];

  // ---------- DOM ----------
  const logForm = document.getElementById('logForm');
  const sessionDateInput = document.getElementById('sessionDate');
  const techniqueInput = document.getElementById('technique');
  const techniqueList = document.getElementById('techniqueList');
  const videoRefInput = document.getElementById('videoRef');
  const notesInput = document.getElementById('notes');
  const starPicker = document.getElementById('starPicker');
  const ratingError = document.getElementById('ratingError');

  const nextUpContent = document.getElementById('nextUpContent');
  const chartsContainer = document.getElementById('chartsContainer');
  const timelineContainer = document.getElementById('timelineContainer');
  const affirmationEl = document.getElementById('affirmation');

  // ---------- Growth Journal (Feature 5) DOM ----------
  const growthEmptyState    = document.getElementById('growthEmptyState');
  const growthStatsGrid     = document.getElementById('growthStatsGrid');
  const statFrequency       = document.getElementById('statFrequency');
  const statChoreographies  = document.getElementById('statChoreographies');
  const statFoundations     = document.getElementById('statFoundations');
  const statAccuracy        = document.getElementById('statAccuracy');
  const statTiming          = document.getElementById('statTiming');
  const statStability       = document.getElementById('statStability');
  const growthTrendWrap      = document.getElementById('growthTrendWrap');
  const growthTrendCanvas    = document.getElementById('growthTrendChart');
  const trendRangeSelect     = document.getElementById('trendRangeSelect');
  const growthFoundationsWrap = document.getElementById('growthFoundationsWrap');
  const growthFoundationsList = document.getElementById('growthFoundationsList');
  const projectsEmptyState  = document.getElementById('projectsEmptyState');
  const growthProjectsList   = document.getElementById('growthProjectsList');

  const projectDetailModal   = document.getElementById('projectDetailModal');
  const projectDetailName    = document.getElementById('projectDetailName');
  const projectDetailContent = document.getElementById('projectDetailContent');
  const closeProjectDetailBtn = document.getElementById('closeProjectDetailBtn');

  const ADVISOR_CATEGORIES = [
    { key: 'outfit_styling',        labelKey: 'advisor_cat_outfit' },
    { key: 'camera_angle',          labelKey: 'advisor_cat_camera_angle' },
    { key: 'camera_distance',       labelKey: 'advisor_cat_camera_distance' },
    { key: 'filming_location',      labelKey: 'advisor_cat_location' },
    { key: 'lighting',              labelKey: 'advisor_cat_lighting' },
    { key: 'background',            labelKey: 'advisor_cat_background' },
    { key: 'filters_color_grading', labelKey: 'advisor_cat_filters' },
    { key: 'video_framing',         labelKey: 'advisor_cat_framing' },
  ];

  let growthTrendChartInstance = null;
  let detailObjectURLs = [];
  let lastLoadedProjects = [];

  let formRating = 0;
  let chartInstances = [];

  // ---------- Storage ----------
  function loadSessions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Could not read practice journal data, starting fresh.', e);
      return [];
    }
  }

  function saveSessions(sessions) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ---------- Helpers ----------
  function todayLocalISODate() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function parseLocalDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function formatDateLong(dateStr) {
    return parseLocalDate(dateStr).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  function formatDateShort(dateStr) {
    return parseLocalDate(dateStr).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric',
    });
  }

  function isUrl(str) {
    return /^https?:\/\//i.test(str.trim());
  }

  function sortByDateAsc(a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.createdAt - b.createdAt;
  }

  function sortByDateDesc(a, b) {
    if (a.date !== b.date) return a.date > b.date ? -1 : 1;
    return b.createdAt - a.createdAt;
  }

  function groupByTechnique(sessions) {
    const map = new Map();
    sessions.forEach((s) => {
      if (!map.has(s.technique)) map.set(s.technique, []);
      map.get(s.technique).push(s);
    });
    // Order groups by most recent session date, most recent first.
    return [...map.entries()].sort((a, b) => {
      const aLatest = a[1].reduce((max, s) => (sortByDateDesc(s, max) < 0 ? s : max));
      const bLatest = b[1].reduce((max, s) => (sortByDateDesc(s, max) < 0 ? s : max));
      return sortByDateDesc(aLatest, bLatest);
    });
  }

  // ---------- Star picker (form) ----------
  function buildStarPicker() {
    starPicker.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'star-btn';
      btn.dataset.value = String(i);
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', 'false');
      btn.setAttribute('aria-label', `${i} star${i > 1 ? 's' : ''}`);
      btn.textContent = '★';
      btn.addEventListener('click', () => setFormRating(i));
      starPicker.appendChild(btn);
    }
  }

  function setFormRating(value) {
    formRating = value;
    [...starPicker.children].forEach((btn) => {
      const filled = Number(btn.dataset.value) <= value;
      btn.classList.toggle('filled', filled);
      btn.setAttribute('aria-checked', filled ? 'true' : 'false');
    });
    ratingError.classList.add('hidden');
  }

  function resetFormRating() {
    formRating = 0;
    [...starPicker.children].forEach((btn) => {
      btn.classList.remove('filled');
      btn.setAttribute('aria-checked', 'false');
    });
  }

  // ---------- Static star display (timeline) ----------
  function buildStaticStars(rating) {
    const span = document.createElement('span');
    span.className = 'timeline-stars';
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('span');
      star.textContent = '★';
      if (i > rating) star.classList.add('empty');
      span.appendChild(star);
    }
    return span;
  }

  // ---------- Datalist ----------
  function refreshTechniqueDatalist(sessions) {
    const names = [...new Set(sessions.map((s) => s.technique))].sort((a, b) => a.localeCompare(b));
    techniqueList.innerHTML = '';
    names.forEach((name) => {
      const opt = document.createElement('option');
      opt.value = name;
      techniqueList.appendChild(opt);
    });
  }

  // ---------- Timeline ----------
  function renderTimeline(sessions) {
    timelineContainer.innerHTML = '';

    if (sessions.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = t('journal_timeline_empty');
      timelineContainer.appendChild(empty);
      return;
    }

    const groups = groupByTechnique(sessions);

    groups.forEach(([technique, groupSessions]) => {
      const groupEl = document.createElement('div');
      groupEl.className = 'timeline-group';

      const header = document.createElement('div');
      header.className = 'timeline-group-header';
      const h3 = document.createElement('h3');
      h3.textContent = technique;
      const count = document.createElement('span');
      count.className = 'timeline-group-count';
      count.textContent = t('journal_session_count', {
        count: groupSessions.length,
        plural: groupSessions.length > 1 ? 's' : '',
      });
      header.appendChild(h3);
      header.appendChild(count);
      groupEl.appendChild(header);

      const sorted = [...groupSessions].sort(sortByDateDesc);
      sorted.forEach((session) => {
        groupEl.appendChild(buildTimelineEntry(session));
      });

      timelineContainer.appendChild(groupEl);
    });
  }

  function buildTimelineEntry(session) {
    const entry = document.createElement('div');
    entry.className = 'timeline-entry';
    entry.dataset.id = session.id;

    const mainEl = document.createElement('div');
    mainEl.className = 'timeline-entry-main';

    const top = document.createElement('div');
    top.className = 'timeline-entry-top';
    const dateEl = document.createElement('span');
    dateEl.className = 'timeline-date';
    dateEl.textContent = formatDateLong(session.date);
    top.appendChild(dateEl);
    top.appendChild(buildStaticStars(session.rating));
    mainEl.appendChild(top);

    if (session.videoRef) {
      const videoEl = document.createElement('div');
      videoEl.className = 'timeline-video';
      if (isUrl(session.videoRef)) {
        const link = document.createElement('a');
        link.href = session.videoRef;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = session.videoRef;
        videoEl.appendChild(link);
      } else {
        videoEl.textContent = '🎬 ' + session.videoRef;
      }
      mainEl.appendChild(videoEl);
    }

    if (session.notes) {
      const notesEl = document.createElement('div');
      notesEl.className = 'timeline-notes';
      notesEl.textContent = session.notes;
      mainEl.appendChild(notesEl);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.setAttribute('aria-label', t('journal_delete_aria'));
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', () => deleteSession(session.id));

    entry.appendChild(mainEl);
    entry.appendChild(deleteBtn);
    return entry;
  }

  function deleteSession(id) {
    if (!confirm(t('journal_delete_confirm'))) return;
    const sessions = loadSessions().filter((s) => s.id !== id);
    saveSessions(sessions);
    renderAll(sessions);
  }

  // ---------- Charts ----------
  function renderCharts(sessions) {
    chartInstances.forEach((c) => c.destroy());
    chartInstances = [];
    chartsContainer.innerHTML = '';

    if (sessions.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = t('journal_charts_empty');
      chartsContainer.appendChild(empty);
      return;
    }

    const groups = groupByTechnique(sessions);

    groups.forEach(([technique, groupSessions], index) => {
      const block = document.createElement('div');
      block.className = 'chart-block';

      const h3 = document.createElement('h3');
      h3.textContent = technique;
      block.appendChild(h3);

      const wrap = document.createElement('div');
      wrap.className = 'chart-canvas-wrap';
      const canvas = document.createElement('canvas');
      canvas.id = `chart-${index}`;
      wrap.appendChild(canvas);
      block.appendChild(wrap);

      chartsContainer.appendChild(block);

      const sorted = [...groupSessions].sort(sortByDateAsc);
      const labels = sorted.map((s) => formatDateShort(s.date));
      const data = sorted.map((s) => s.rating);

      const chart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: technique,
            data,
            borderColor: '#C084FC',
            backgroundColor: 'rgba(192,132,252,0.15)',
            pointBackgroundColor: '#C084FC',
            pointBorderColor: '#C084FC',
            borderWidth: 2,
            tension: 0.3,
            fill: true,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              min: 1,
              max: 5,
              ticks: { stepSize: 1, color: '#9a97a3' },
              grid: { color: '#2a2a31' },
            },
            x: {
              ticks: { color: '#9a97a3' },
              grid: { color: '#2a2a31' },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1f1f25',
              borderColor: '#2a2a31',
              borderWidth: 1,
              titleColor: '#f2f0f5',
              bodyColor: '#f2f0f5',
            },
          },
        },
      });

      chartInstances.push(chart);
    });
  }

  // ---------- What to work on next ----------
  function renderNextUp(sessions) {
    nextUpContent.innerHTML = '';

    if (sessions.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'next-up-empty';
      empty.textContent = t('journal_next_up_empty');
      nextUpContent.appendChild(empty);
      return;
    }

    const groups = groupByTechnique(sessions);
    let best = null;

    groups.forEach(([technique, groupSessions]) => {
      const recent = [...groupSessions].sort(sortByDateDesc).slice(0, RECENT_WINDOW);
      const avg = recent.reduce((sum, s) => sum + s.rating, 0) / recent.length;
      if (!best || avg < best.avg) {
        best = { technique, avg, count: recent.length };
      }
    });

    const badge = document.createElement('div');
    badge.className = 'next-up-badge';
    badge.textContent = '🎯';

    const textWrap = document.createElement('div');
    textWrap.className = 'next-up-text';

    const techniqueEl = document.createElement('div');
    techniqueEl.className = 'next-up-technique';
    techniqueEl.textContent = best.technique;

    const detailEl = document.createElement('div');
    detailEl.className = 'next-up-detail';
    detailEl.textContent = t('journal_next_up_detail', {
      avg: best.avg.toFixed(1),
      count: best.count,
      plural: best.count > 1 ? 's' : '',
    });

    textWrap.appendChild(techniqueEl);
    textWrap.appendChild(detailEl);

    nextUpContent.appendChild(badge);
    nextUpContent.appendChild(textWrap);
  }

  // ---------- Growth Journal (Feature 5) ----------
  // Reads every project saved from Learning Mode / Content Advisor (shared/db.js)
  // and turns it into aggregate progress stats, a score trend chart, a
  // mastered-foundations list, and a browsable project detail view.
  async function loadGrowthJournal() {
    let projects = [];
    try {
      projects = await window.DanceLensDB.getAllProjectsFull();
    } catch (e) {
      console.warn('Could not load projects for the Growth Journal.', e);
    }
    lastLoadedProjects = projects;
    renderGrowthJournal(projects);
  }

  function average(nums) {
    if (!nums.length) return null;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }

  let lastAllEntries = [];

  function renderGrowthJournal(projects) {
    // My Projects tab
    projectsEmptyState.classList.toggle('hidden', projects.length > 0);
    renderGrowthProjectsList(projects);

    // My Growth tab
    if (!projects.length) {
      growthEmptyState.classList.remove('hidden');
      growthStatsGrid.classList.add('hidden');
      growthTrendWrap.classList.add('hidden');
      growthFoundationsWrap.classList.add('hidden');
      lastAllEntries = [];
      return;
    }
    growthEmptyState.classList.add('hidden');
    growthStatsGrid.classList.remove('hidden');

    const allEntries = [];
    const foundationNames = new Set();
    projects.forEach((p) => {
      (p.practiceEntries || []).forEach((entry) => allEntries.push(entry));
      (p.foundations || []).forEach((f) => { if (f && f.name) foundationNames.add(f.name); });
    });
    allEntries.sort((a, b) => a.timestamp - b.timestamp);
    lastAllEntries = allEntries;

    statFrequency.textContent = String(allEntries.length);
    statChoreographies.textContent = String(projects.length);
    statFoundations.textContent = String(foundationNames.size);

    const accuracyVals = allEntries.map((e) => e.feedback && e.feedback.accuracy_score).filter((v) => typeof v === 'number');
    const timingVals = allEntries.map((e) => e.feedback && e.feedback.timing_score).filter((v) => typeof v === 'number');
    const stabilityVals = allEntries.map((e) => e.feedback && e.feedback.movement_stability_score).filter((v) => typeof v === 'number');

    const setScoreStat = (el, vals) => {
      const avg = average(vals);
      el.textContent = avg == null ? '—' : Math.round(avg) + '%';
    };
    setScoreStat(statAccuracy, accuracyVals);
    setScoreStat(statTiming, timingVals);
    setScoreStat(statStability, stabilityVals);

    if (allEntries.length > 0) {
      growthTrendWrap.classList.remove('hidden');
      renderTrendChartForRange();
    } else {
      growthTrendWrap.classList.add('hidden');
    }

    if (foundationNames.size > 0) {
      growthFoundationsWrap.classList.remove('hidden');
      renderFoundationsChips(foundationNames);
    } else {
      growthFoundationsWrap.classList.add('hidden');
    }
  }

  // Filters lastAllEntries down to the selected time window (1w/2w/1m/6m/1y)
  // before handing them to the chart — the range selector only affects this
  // trend chart, not the lifetime stat tiles above it.
  function renderTrendChartForRange() {
    const days = Number(trendRangeSelect.value) || 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const filtered = lastAllEntries.filter((e) => e.timestamp >= cutoff);
    renderTrendChart(filtered.length ? filtered : lastAllEntries);
  }

  function renderTrendChart(sortedEntries) {
    if (growthTrendChartInstance) { growthTrendChartInstance.destroy(); growthTrendChartInstance = null; }

    const labels = sortedEntries.map((e) => new Date(e.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    const toSeries = (field) => sortedEntries.map((e) => (e.feedback && typeof e.feedback[field] === 'number') ? e.feedback[field] : null);

    growthTrendChartInstance = new Chart(growthTrendCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: t('score_accuracy'), data: toSeries('accuracy_score'), borderColor: '#C084FC', backgroundColor: 'rgba(192,132,252,0.12)', borderWidth: 2, tension: 0.3, spanGaps: true },
          { label: t('score_timing'), data: toSeries('timing_score'), borderColor: '#5fd4c8', backgroundColor: 'rgba(95,212,200,0.12)', borderWidth: 2, tension: 0.3, spanGaps: true },
          { label: t('score_stability'), data: toSeries('movement_stability_score'), borderColor: '#ffb86b', backgroundColor: 'rgba(255,184,107,0.12)', borderWidth: 2, tension: 0.3, spanGaps: true },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { min: 0, max: 100, ticks: { color: '#9a97a3' }, grid: { color: '#2a2a31' } },
          x: { ticks: { color: '#9a97a3' }, grid: { color: '#2a2a31' } },
        },
        plugins: {
          legend: { labels: { color: '#f2f0f5' } },
          tooltip: { backgroundColor: '#1f1f25', borderColor: '#2a2a31', borderWidth: 1, titleColor: '#f2f0f5', bodyColor: '#f2f0f5' },
        },
      },
    });
  }

  function renderFoundationsChips(namesSet) {
    growthFoundationsList.innerHTML = '';
    [...namesSet].sort((a, b) => a.localeCompare(b)).forEach((name) => {
      const chip = document.createElement('span');
      chip.className = 'foundation-chip';
      chip.textContent = name;
      growthFoundationsList.appendChild(chip);
    });
  }

  function renderGrowthProjectsList(projects) {
    growthProjectsList.innerHTML = '';
    [...projects].sort((a, b) => b.updatedAt - a.updatedAt).forEach((p) => {
      const item = document.createElement('div');
      item.className = 'project-item';

      const info = document.createElement('div');
      const name = document.createElement('div');
      name.className = 'project-item-name';
      name.textContent = p.name;
      const meta = document.createElement('div');
      meta.className = 'project-item-meta';
      meta.textContent = t('project_item_meta', {
        practiceCount: (p.practiceEntries || []).length,
        foundationsCount: (p.foundations || []).length,
      });
      info.appendChild(name);
      info.appendChild(meta);

      const arrow = document.createElement('span');
      arrow.className = 'project-item-arrow';
      arrow.textContent = '→';

      item.appendChild(info);
      item.appendChild(arrow);
      item.addEventListener('click', () => openProjectDetail(p));
      growthProjectsList.appendChild(item);
    });
  }

  function revokeDetailObjectURLs() {
    detailObjectURLs.forEach((url) => URL.revokeObjectURL(url));
    detailObjectURLs = [];
  }

  function makeDetailVideo(labelText, blob) {
    const pane = document.createElement('div');
    pane.className = 'detail-video-pane';
    const label = document.createElement('span');
    label.textContent = labelText;
    const video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    const url = URL.createObjectURL(blob);
    detailObjectURLs.push(url);
    video.src = url;
    pane.appendChild(label);
    pane.appendChild(video);
    return pane;
  }

  function openProjectDetail(project) {
    revokeDetailObjectURLs();
    projectDetailName.textContent = project.name;
    projectDetailContent.innerHTML = '';

    // Original video
    const videoBlock = document.createElement('div');
    videoBlock.className = 'detail-block';
    const videoRow = document.createElement('div');
    videoRow.className = 'detail-video-row';
    if (project.originalVideo && project.originalVideo.blob) {
      videoRow.appendChild(makeDetailVideo(t('detail_original_video'), project.originalVideo.blob));
    } else {
      const p = document.createElement('p');
      p.className = 'empty-state';
      p.textContent = t('detail_no_video');
      videoRow.appendChild(p);
    }
    videoBlock.appendChild(videoRow);
    projectDetailContent.appendChild(videoBlock);

    // Foundational techniques
    if (Array.isArray(project.foundations) && project.foundations.length) {
      const block = document.createElement('div');
      block.className = 'detail-block';
      const h3 = document.createElement('h3');
      h3.textContent = t('detail_foundations_title');
      block.appendChild(h3);
      project.foundations.forEach((f) => {
        const item = document.createElement('div');
        item.className = 'detail-foundation-item';
        const strong = document.createElement('strong');
        strong.textContent = f.name;
        item.appendChild(strong);
        if (f.explanation) {
          const p = document.createElement('p');
          p.textContent = f.explanation;
          p.style.margin = '4px 0 0';
          p.style.color = 'var(--text-dim)';
          p.style.fontSize = '0.85rem';
          item.appendChild(p);
        }
        block.appendChild(item);
      });
      projectDetailContent.appendChild(block);
    }

    // Practice sessions (each with its own video + AI feedback + scores)
    if (Array.isArray(project.practiceEntries) && project.practiceEntries.length) {
      const block = document.createElement('div');
      block.className = 'detail-block';
      const h3 = document.createElement('h3');
      h3.textContent = t('detail_practice_sessions_title', { count: project.practiceEntries.length });
      block.appendChild(h3);

      [...project.practiceEntries].sort((a, b) => b.timestamp - a.timestamp).forEach((entry) => {
        const item = document.createElement('div');
        item.className = 'detail-entry';

        const top = document.createElement('div');
        top.className = 'detail-entry-top';
        top.textContent = new Date(entry.timestamp).toLocaleString();
        item.appendChild(top);

        if (entry.feedback) {
          const scoresRow = document.createElement('div');
          scoresRow.className = 'detail-scores-row';
          [
            [t('score_accuracy'), entry.feedback.accuracy_score],
            [t('score_timing'), entry.feedback.timing_score],
            [t('score_stability'), entry.feedback.movement_stability_score],
          ].forEach(([label, val]) => {
            const pill = document.createElement('div');
            pill.className = 'detail-score-pill';
            const b = document.createElement('b');
            b.textContent = typeof val === 'number' ? Math.round(val) + '%' : '—';
            pill.appendChild(b);
            pill.appendChild(document.createTextNode(label));
            scoresRow.appendChild(pill);
          });
          item.appendChild(scoresRow);

          if (entry.feedback.summary) {
            const p = document.createElement('p');
            p.textContent = entry.feedback.summary;
            p.style.margin = '0 0 8px';
            p.style.fontSize = '0.85rem';
            item.appendChild(p);
          }
        }

        if (entry.video && entry.video.blob) {
          const videoRow2 = document.createElement('div');
          videoRow2.className = 'detail-video-row';
          videoRow2.appendChild(makeDetailVideo(t('detail_practice_video_label'), entry.video.blob));
          item.appendChild(videoRow2);
        }

        block.appendChild(item);
      });
      projectDetailContent.appendChild(block);
    }

    // Content Advisor suggestions
    if (project.contentAdvisor && project.contentAdvisor.suggestions) {
      const block = document.createElement('div');
      block.className = 'detail-block';
      const h3 = document.createElement('h3');
      h3.textContent = t('detail_advisor_title');
      block.appendChild(h3);
      const grid = document.createElement('div');
      grid.className = 'detail-advisor-grid';
      ADVISOR_CATEGORIES.forEach((cat) => {
        const val = project.contentAdvisor.suggestions[cat.key];
        if (!val) return;
        const cell = document.createElement('div');
        cell.className = 'detail-advisor-item';
        const b = document.createElement('b');
        b.textContent = t(cat.labelKey);
        const p = document.createElement('p');
        p.style.margin = '0';
        p.textContent = val;
        cell.appendChild(b);
        cell.appendChild(p);
        grid.appendChild(cell);
      });
      block.appendChild(grid);
      projectDetailContent.appendChild(block);
    }

    projectDetailModal.classList.remove('hidden');
  }

  function closeProjectDetail() {
    projectDetailModal.classList.add('hidden');
    revokeDetailObjectURLs();
  }
  closeProjectDetailBtn.addEventListener('click', closeProjectDetail);
  projectDetailModal.addEventListener('click', (e) => { if (e.target === projectDetailModal) closeProjectDetail(); });

  trendRangeSelect.addEventListener('change', renderTrendChartForRange);

  // ---------- Sub-navigation (My Projects / My Plan / My Growth) ----------
  const JOURNAL_TAB_KEY = 'dancelens.journalTab';
  const journalSubnav = document.getElementById('journalSubnav');
  const tabPanels = {
    projects: document.getElementById('panelProjects'),
    plan: document.getElementById('panelPlan'),
    growth: document.getElementById('panelGrowth'),
  };

  function activateJournalTab(tabKey) {
    if (!tabPanels[tabKey]) tabKey = 'projects';
    Object.entries(tabPanels).forEach(([key, panel]) => {
      panel.classList.toggle('hidden', key !== tabKey);
    });
    [...journalSubnav.children].forEach((btn) => {
      const isActive = btn.dataset.tab === tabKey;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });
    try { localStorage.setItem(JOURNAL_TAB_KEY, tabKey); } catch (e) { /* ignore */ }
  }

  journalSubnav.addEventListener('click', (e) => {
    const btn = e.target.closest('.subnav-btn');
    if (btn) activateJournalTab(btn.dataset.tab);
  });

  // ---------- My Plan (next-7-days planner) ----------
  const PLAN_STORAGE_KEY = 'dancelens.plan.v1';
  const planForm = document.getElementById('planForm');
  const planDateInput = document.getElementById('planDate');
  const planTimeInput = document.getElementById('planTime');
  const planTextInput = document.getElementById('planText');
  const planWeekContainer = document.getElementById('planWeekContainer');

  function loadPlanEntries() {
    try {
      const raw = localStorage.getItem(PLAN_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Could not read plan data, starting fresh.', e);
      return [];
    }
  }

  function savePlanEntries(entries) {
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(entries));
  }

  function nextSevenDayKeys() {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      days.push({ key: `${y}-${m}-${day}`, date: d });
    }
    return days;
  }

  function renderPlan() {
    const entries = loadPlanEntries();
    const days = nextSevenDayKeys();
    const todayKey = days[0].key;

    planWeekContainer.innerHTML = '';
    days.forEach(({ key, date }) => {
      const card = document.createElement('div');
      card.className = 'plan-day-card' + (key === todayKey ? ' is-today' : '');

      const header = document.createElement('div');
      header.className = 'plan-day-header';
      header.textContent = date.toLocaleDateString(undefined, { weekday: 'short' });
      const sub = document.createElement('span');
      sub.className = 'plan-day-sub';
      sub.textContent = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      header.appendChild(sub);
      card.appendChild(header);

      const dayEntries = entries.filter((e) => e.date === key).sort((a, b) => a.time.localeCompare(b.time));
      if (dayEntries.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'plan-day-empty';
        empty.textContent = t('plan_day_empty');
        card.appendChild(empty);
      } else {
        dayEntries.forEach((entry) => {
          const row = document.createElement('div');
          row.className = 'plan-entry';

          const textWrap = document.createElement('div');
          const timeEl = document.createElement('span');
          timeEl.className = 'plan-entry-time';
          timeEl.textContent = entry.time;
          const textEl = document.createElement('span');
          textEl.textContent = entry.text;
          textWrap.appendChild(timeEl);
          textWrap.appendChild(textEl);

          const deleteBtn = document.createElement('button');
          deleteBtn.type = 'button';
          deleteBtn.className = 'plan-entry-delete';
          deleteBtn.textContent = '✕';
          deleteBtn.setAttribute('aria-label', t('plan_delete_aria'));
          deleteBtn.addEventListener('click', () => {
            savePlanEntries(loadPlanEntries().filter((e) => e.id !== entry.id));
            renderPlan();
          });

          row.appendChild(textWrap);
          row.appendChild(deleteBtn);
          card.appendChild(row);
        });
      }

      planWeekContainer.appendChild(card);
    });
  }

  planForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = planDateInput.value;
    const time = planTimeInput.value;
    const text = planTextInput.value.trim();
    if (!date || !time || !text) {
      planForm.reportValidity();
      return;
    }
    const entries = loadPlanEntries();
    entries.push({ id: generateId(), date, time, text, createdAt: Date.now() });
    savePlanEntries(entries);
    planForm.reset();
    planDateInput.value = todayLocalISODate();
    renderPlan();
  });

  // ---------- Orchestration ----------
  function renderAll(sessions) {
    refreshTechniqueDatalist(sessions);
    renderTimeline(sessions);
    renderCharts(sessions);
    renderNextUp(sessions);
  }

  function resetForm() {
    logForm.reset();
    sessionDateInput.value = todayLocalISODate();
    resetFormRating();
    ratingError.classList.add('hidden');
  }

  logForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const date = sessionDateInput.value;
    const technique = techniqueInput.value.trim();
    const videoRef = videoRefInput.value.trim();
    const notes = notesInput.value.trim();

    if (!date || !technique) {
      logForm.reportValidity();
      return;
    }
    if (formRating < 1) {
      ratingError.classList.remove('hidden');
      return;
    }

    const session = {
      id: generateId(),
      date,
      technique,
      videoRef,
      notes,
      rating: formRating,
      createdAt: Date.now(),
    };

    const sessions = loadSessions();
    sessions.push(session);
    saveSessions(sessions);

    resetForm();
    renderAll(sessions);
  });

  function pickAffirmation() {
    const key = AFFIRMATION_KEYS[Math.floor(Math.random() * AFFIRMATION_KEYS.length)];
    affirmationEl.textContent = t(key);
  }

  // ---------- Init ----------
  buildStarPicker();
  sessionDateInput.value = todayLocalISODate();
  pickAffirmation();
  renderAll(loadSessions());
  loadGrowthJournal();

  {
    const weekDays = nextSevenDayKeys();
    planDateInput.min = weekDays[0].key;
    planDateInput.max = weekDays[6].key;
    planDateInput.value = weekDays[0].key;
  }
  renderPlan();

  let initialTab = 'projects';
  try {
    const saved = localStorage.getItem(JOURNAL_TAB_KEY);
    if (saved && tabPanels[saved]) initialTab = saved;
  } catch (e) { /* ignore */ }
  activateJournalTab(initialTab);

  // Timeline/charts/next-up are rendered from stored data, so re-running them
  // on a language switch is cheap and keeps every label in the chosen language.
  window.DanceLensI18n.onChange(() => {
    pickAffirmation();
    renderAll(loadSessions());
    renderGrowthJournal(lastLoadedProjects);
    renderPlan();
  });
})();
