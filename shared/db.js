// Shared IndexedDB-backed project store for Count8.
//
// A "project" is one choreography a user is learning: it bundles the
// original reference video, the auto-identified foundational techniques,
// every practice attempt (video + AI feedback + scores) over time, and an
// optional Content Advisor result. Videos are stored as Blobs directly
// (IndexedDB handles this natively and efficiently) rather than base64 —
// localStorage's ~5-10MB string-only quota can't hold video files.
(() => {
  'use strict';

  const DB_NAME = 'dancelens';
  const DB_VERSION = 2;
  const STORE = 'projects';
  // Independent library of every video the Content Advisor has analyzed —
  // separate from `projects` because a Content Advisor video isn't always
  // tied to a Learning Mode project (users can analyze a standalone
  // reference video too). Each entry remembers its own video Blob and
  // suggestions so revisiting Content Advisor never requires re-uploading
  // or re-analyzing something already seen.
  const CA_STORE = 'contentAdvisorEntries';

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(CA_STORE)) {
          db.createObjectStore(CA_STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  function tx(mode, storeName) {
    return openDB().then((db) => db.transaction(storeName || STORE, mode).objectStore(storeName || STORE));
  }

  function reqToPromise(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function genId() {
    return 'proj_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function genCaId() {
    return 'ca_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function emptyProject(id, name) {
    const now = Date.now();
    return {
      id,
      name,
      createdAt: now,
      updatedAt: now,
      originalVideo: null,     // { blob, name, type }
      foundations: null,       // [{ name, explanation, drill, youtube_queries }]
      practiceEntries: [],     // [{ id, timestamp, video: {blob,name,type}, feedback: {...} }]
      contentAdvisor: null,    // { timestamp, suggestions: {...8 fields} }
      bookmarks: [],           // [{ id, time }] — user-set points on the original video's timeline
    };
  }

  async function getFullProject(id) {
    const store = await tx('readonly');
    return reqToPromise(store.get(id));
  }

  async function putProject(project) {
    const store = await tx('readwrite');
    await reqToPromise(store.put(project));
    return project;
  }

  async function createProject(name) {
    const project = emptyProject(genId(), (name || '').trim() || 'Untitled Project');
    await putProject(project);
    return project;
  }

  async function getProject(id) {
    return getFullProject(id);
  }

  // Lightweight listing (no blobs pulled into result) for project pickers and
  // the Growth Journal overview — avoids materializing every stored video.
  async function listProjectsSummary() {
    const store = await tx('readonly');
    const all = await reqToPromise(store.getAll());
    return all
      .map((p) => {
        const lastEntry = p.practiceEntries && p.practiceEntries.length
          ? p.practiceEntries[p.practiceEntries.length - 1]
          : null;
        return {
          id: p.id,
          name: p.name,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          hasOriginalVideo: !!p.originalVideo,
          foundationsCount: Array.isArray(p.foundations) ? p.foundations.length : 0,
          practiceEntryCount: Array.isArray(p.practiceEntries) ? p.practiceEntries.length : 0,
          hasContentAdvisor: !!p.contentAdvisor,
          latestScores: lastEntry && lastEntry.feedback ? {
            accuracy_score: lastEntry.feedback.accuracy_score,
            timing_score: lastEntry.feedback.timing_score,
            movement_stability_score: lastEntry.feedback.movement_stability_score,
          } : null,
        };
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  // Full records (with blobs) across all projects — used by the Growth
  // Journal's aggregate stats/trend charts and "mastered foundations" list.
  async function getAllProjectsFull() {
    const store = await tx('readonly');
    const all = await reqToPromise(store.getAll());
    return all.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async function updateProject(id, patch) {
    const project = await getFullProject(id);
    if (!project) throw new Error('Project not found: ' + id);
    Object.assign(project, patch, { updatedAt: Date.now() });
    await putProject(project);
    return project;
  }

  async function addPracticeEntry(id, entry) {
    const project = await getFullProject(id);
    if (!project) throw new Error('Project not found: ' + id);
    const fullEntry = Object.assign({
      id: 'entry_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      timestamp: Date.now(),
    }, entry);
    project.practiceEntries = project.practiceEntries || [];
    project.practiceEntries.push(fullEntry);
    project.updatedAt = Date.now();
    await putProject(project);
    return project;
  }

  async function deleteProject(id) {
    const store = await tx('readwrite');
    await reqToPromise(store.delete(id));
  }

  // ---------- Content Advisor video library ----------
  // `projectId` is set when the video came from a Learning Mode project's
  // saved original video (so re-selecting that project reuses this entry
  // instead of re-analyzing); it's null for videos uploaded standalone
  // directly into Content Advisor. `size` is kept alongside the video Blob
  // so a standalone re-upload of the same file can be recognized without
  // pulling the (potentially large) Blob out of storage just to compare.
  function emptyContentAdvisorEntry(id, { name, projectId, video, size }) {
    const now = Date.now();
    return {
      id,
      name,
      projectId: projectId || null,
      size: size || (video && video.blob ? video.blob.size : 0),
      video,                 // { blob, name, type }
      suggestions: null,     // {...8 fields}, set once analysis completes
      createdAt: now,
      updatedAt: now,
    };
  }

  async function addContentAdvisorEntry({ name, projectId, video }) {
    const entry = emptyContentAdvisorEntry(genCaId(), { name, projectId, video });
    const store = await tx('readwrite', CA_STORE);
    await reqToPromise(store.put(entry));
    return entry;
  }

  async function getContentAdvisorEntry(id) {
    const store = await tx('readonly', CA_STORE);
    return reqToPromise(store.get(id));
  }

  async function updateContentAdvisorEntry(id, patch) {
    const store = await tx('readonly', CA_STORE);
    const entry = await reqToPromise(store.get(id));
    if (!entry) throw new Error('Content Advisor entry not found: ' + id);
    Object.assign(entry, patch, { updatedAt: Date.now() });
    const writeStore = await tx('readwrite', CA_STORE);
    await reqToPromise(writeStore.put(entry));
    return entry;
  }

  async function deleteContentAdvisorEntry(id) {
    const store = await tx('readwrite', CA_STORE);
    await reqToPromise(store.delete(id));
  }

  // Lightweight listing (no blobs) for the "previously analyzed videos"
  // picker — most-recently-used first, so the video someone is actively
  // iterating on stays at the top.
  async function listContentAdvisorEntriesSummary() {
    const store = await tx('readonly', CA_STORE);
    const all = await reqToPromise(store.getAll());
    return all
      .map((e) => ({
        id: e.id,
        name: e.name,
        projectId: e.projectId,
        size: e.size,
        hasSuggestions: !!e.suggestions,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  window.DanceLensDB = {
    createProject,
    getProject,
    listProjectsSummary,
    getAllProjectsFull,
    updateProject,
    addPracticeEntry,
    deleteProject,
    addContentAdvisorEntry,
    getContentAdvisorEntry,
    updateContentAdvisorEntry,
    deleteContentAdvisorEntry,
    listContentAdvisorEntriesSummary,
  };
})();
