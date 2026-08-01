'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const PORT = process.env.PORT || 5050;
const ROOT = __dirname;
const MODEL = 'claude-opus-5';
const MAX_FRAMES = 6;
const MAX_FRAMES_PER_PRACTICE_VIDEO = 4;
// Base64 JPEG frames inflate request size well beyond plain text, so this
// needs headroom for several images, not just a small JSON payload.
const MAX_BODY_BYTES = 15 * 1024 * 1024;

function loadEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const fileEnv = loadEnvFile(path.join(ROOT, '.env'));
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || fileEnv.ANTHROPIC_API_KEY || '';

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY || 'missing-key' });

const SYSTEM_PROMPT = `You are a dance technique coach for Count8, an app that helps self-taught dancers learn choreography from short-form videos.

You will be shown several still frames sampled across a single dance practice video, in chronological order. Based on the body positioning, posture, and styling visible across these frames, identify the core dance foundations/techniques likely being demonstrated (for example: waacking, waving, happy feet, isolations, popping, locking, house footwork, breaking, tutting, voguing, hip-hop grooves, musicality). These are still frames, not full motion, so use your best reasonable visual judgment — don't wildly invent techniques with no supporting evidence in the frames. Identify between 2 and 5 techniques.

For EACH technique, provide:
- "name": a short technique name (e.g. "Chest Isolations")
- "explanation": 1-2 plain-English sentences a total beginner would understand, avoiding unexplained jargon
- "youtube_queries": an array of exactly 2 specific, realistic YouTube search query strings a dancer could type to find tutorials for that exact technique
- "drill": one concrete, targeted practice drill or exercise (1-3 sentences) that isolates and builds that specific foundation`;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    techniques: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          explanation: { type: 'string' },
          youtube_queries: { type: 'array', items: { type: 'string' } },
          drill: { type: 'string' },
        },
        required: ['name', 'explanation', 'youtube_queries', 'drill'],
        additionalProperties: false,
      },
    },
  },
  required: ['techniques'],
  additionalProperties: false,
};

const SYSTEM_PROMPT_FEEDBACK = `You are a dance coach for Count8, reviewing a student's practice attempt against the reference choreography video they are learning.

You will be shown two sets of still frames, each sampled in chronological order and at roughly matching points through the routine: first a set from the REFERENCE choreography video, then a set from the STUDENT'S PRACTICE video. These are still frames, not full motion, so treat any timing observation as an approximation based on body position at each sampled moment, not frame-accurate tracking.

Compare posture, body alignment, arm/leg extension, balance, and apparent timing between the reference and the student's practice. Identify concrete, specific issues in the student's practice — only ones you have reasonable visual evidence for across the frames. Where relevant, feedback categories include things like: weak core engagement, unstable balance, lack of arm extension, insufficient body control, and inconsistent rhythm/timing — but only report what you actually observe, don't force-fit every category.

First, provide a short overall "summary" (2-3 sentences) of how the practice attempt compares to the reference overall — encouraging but honest.

Then score the practice attempt on three 0-100 scales, based only on what the frames actually support:
- "accuracy_score": how closely the practice attempt's poses/positions match the reference choreography
- "timing_score": how well the practice attempt's movements appear synced to the same points in the routine as the reference
- "movement_stability_score": how stable, controlled, and balanced the practice attempt's movements appear (versus wobbly, off-balance, or tentative)

Then, for each specific issue found, provide:
- "name": a short label for the issue (e.g. "Unstable Balance on Turns")
- "explanation": 1-2 plain-English sentences describing what you observed and why it matters
- "youtube_queries": an array of exactly 2 specific, realistic YouTube search query strings a dancer could use to find tutorials that help fix this exact issue
- "drill": one concrete, targeted practice drill or exercise (1-3 sentences) that isolates and improves that specific weakness

Identify between 1 and 5 issues depending on how much the frames actually support.`;

const OUTPUT_SCHEMA_FEEDBACK = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    accuracy_score: { type: 'integer', minimum: 0, maximum: 100 },
    timing_score: { type: 'integer', minimum: 0, maximum: 100 },
    movement_stability_score: { type: 'integer', minimum: 0, maximum: 100 },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          explanation: { type: 'string' },
          youtube_queries: { type: 'array', items: { type: 'string' } },
          drill: { type: 'string' },
        },
        required: ['name', 'explanation', 'youtube_queries', 'drill'],
        additionalProperties: false,
      },
    },
  },
  required: ['summary', 'accuracy_score', 'timing_score', 'movement_stability_score', 'issues'],
  additionalProperties: false,
};

const SYSTEM_PROMPT_STYLE = `You are a social media content strategist for Count8, advising dancers who want to film their own version of a reference dance video for platforms like TikTok, Instagram Reels, or Xiaohongshu.

You will be shown several still frames sampled across a single reference dance video, in chronological order. Based on what is visible in these frames, give the dancer concrete, actionable suggestions for recreating a similarly engaging video, covering exactly these 8 categories:

- "outfit_styling": what kind of outfit/styling would suit this video (colors, fit, accessories)
- "camera_angle": what camera angle(s) are used or would work well (e.g. low angle, eye-level, overhead)
- "camera_distance": what camera distance/shot size suits this content (e.g. full body wide shot, medium shot)
- "filming_location": what kind of location/setting would suit this style of video
- "lighting": what lighting setup or conditions would work best
- "background": what kind of background works well and what to avoid
- "filters_color_grading": what filter style or color grading would suit the mood
- "video_framing": how to frame/compose the shot (orientation, headroom, rule of thirds, etc.)

For each category, write 1-3 concise, practical sentences a dancer could act on immediately. Base your suggestions on what you actually observe in the frames where possible, supplemented with general social-media dance content best practices where the frames don't show enough detail.`;

const OUTPUT_SCHEMA_STYLE = {
  type: 'object',
  properties: {
    outfit_styling: { type: 'string' },
    camera_angle: { type: 'string' },
    camera_distance: { type: 'string' },
    filming_location: { type: 'string' },
    lighting: { type: 'string' },
    background: { type: 'string' },
    filters_color_grading: { type: 'string' },
    video_framing: { type: 'string' },
  },
  required: [
    'outfit_styling', 'camera_angle', 'camera_distance', 'filming_location',
    'lighting', 'background', 'filters_color_grading', 'video_framing',
  ],
  additionalProperties: false,
};

// Explicit allowlist of the site's real pages/assets — this one server hosts
// every section of Count8 (Learning Mode, Practice Journal) as a single
// site. Deliberately not a generic "serve any file under ROOT" handler: that
// would also expose server.js, package.json, and other non-public files to
// any GET request.
const STATIC_FILES = {
  '/': { file: 'index.html', type: 'text/html; charset=utf-8' },
  '/index.html': { file: 'index.html', type: 'text/html; charset=utf-8' },
  '/style.css': { file: 'style.css', type: 'text/css; charset=utf-8' },
  '/app.js': { file: 'app.js', type: 'application/javascript; charset=utf-8' },

  '/shared/nav.css': { file: 'shared/nav.css', type: 'text/css; charset=utf-8' },
  '/shared/i18n.js': { file: 'shared/i18n.js', type: 'application/javascript; charset=utf-8' },
  '/shared/db.js': { file: 'shared/db.js', type: 'application/javascript; charset=utf-8' },

  '/practice-journal/': { file: 'practice-journal/index.html', type: 'text/html; charset=utf-8' },
  '/practice-journal/index.html': { file: 'practice-journal/index.html', type: 'text/html; charset=utf-8' },
  '/practice-journal/style.css': { file: 'practice-journal/style.css', type: 'text/css; charset=utf-8' },
  '/practice-journal/app.js': { file: 'practice-journal/app.js', type: 'application/javascript; charset=utf-8' },

  '/content-advisor/': { file: 'content-advisor/index.html', type: 'text/html; charset=utf-8' },
  '/content-advisor/index.html': { file: 'content-advisor/index.html', type: 'text/html; charset=utf-8' },
  '/content-advisor/style.css': { file: 'content-advisor/style.css', type: 'text/css; charset=utf-8' },
  '/content-advisor/app.js': { file: 'content-advisor/app.js', type: 'application/javascript; charset=utf-8' },
};

function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function serveStatic(req, res, urlPath) {
  const entry = STATIC_FILES[decodeURIComponent(urlPath)];
  if (!entry) {
    sendJSON(res, 404, { error: 'Not found' });
    return;
  }

  const filePath = path.join(ROOT, entry.file);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendJSON(res, 404, { error: 'Not found' });
      return;
    }
    res.writeHead(200, { 'Content-Type': entry.type });
    res.end(data);
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Request body too large'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
      } catch (e) {
        reject(Object.assign(new Error('Invalid JSON body'), { statusCode: 400 }));
      }
    });
    req.on('error', reject);
  });
}

// Shared by both the foundations list and the practice-feedback issues list —
// both are the same {name, explanation, drill, youtube_queries} card shape.
function sanitizeCardItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];
  return rawItems
    .filter((t) => t && typeof t.name === 'string' && t.name.trim())
    .slice(0, 8)
    .map((t) => ({
      name: String(t.name).slice(0, 120),
      explanation: typeof t.explanation === 'string' ? t.explanation.slice(0, 600) : '',
      drill: typeof t.drill === 'string' ? t.drill.slice(0, 600) : '',
      youtube_queries: Array.isArray(t.youtube_queries)
        ? t.youtube_queries.filter((q) => typeof q === 'string').slice(0, 2).map((q) => q.slice(0, 150))
        : [],
    }));
}

function sanitizeTechniques(parsed) {
  if (!parsed || !Array.isArray(parsed.techniques)) {
    throw new Error('Model response did not include a techniques array');
  }
  return sanitizeCardItems(parsed.techniques);
}

function sanitizeScore(rawScore) {
  const n = Math.round(Number(rawScore));
  if (!isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function sanitizeFeedback(parsed) {
  if (!parsed || !Array.isArray(parsed.issues)) {
    throw new Error('Model response did not include an issues array');
  }
  return {
    summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 800) : '',
    accuracy_score: sanitizeScore(parsed.accuracy_score),
    timing_score: sanitizeScore(parsed.timing_score),
    movement_stability_score: sanitizeScore(parsed.movement_stability_score),
    issues: sanitizeCardItems(parsed.issues),
  };
}

const STYLE_CATEGORIES = [
  'outfit_styling', 'camera_angle', 'camera_distance', 'filming_location',
  'lighting', 'background', 'filters_color_grading', 'video_framing',
];

function sanitizeStyleAdvice(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Model response was not an object');
  }
  const out = {};
  for (const key of STYLE_CATEGORIES) {
    out[key] = typeof parsed[key] === 'string' ? parsed[key].slice(0, 600) : '';
  }
  return out;
}

// Parses a "data:image/jpeg;base64,...." URL into the {media_type, data}
// shape Claude's vision content blocks expect (Claude doesn't take a bare
// data: URL the way OpenAI's image_url does).
function sanitizeFrames(rawFrames) {
  if (!Array.isArray(rawFrames)) return [];
  const out = [];
  for (const f of rawFrames) {
    if (typeof f !== 'string') continue;
    const match = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(f);
    if (!match) continue;
    const mediaType = match[1] === 'image/jpg' ? 'image/jpeg' : match[1];
    out.push({ media_type: mediaType, data: match[2] });
    if (out.length >= MAX_FRAMES) break;
  }
  return out;
}

function sanitizeLang(rawLang) {
  return rawLang === 'zh' ? 'zh' : 'en';
}

// Appended to whichever system prompt is in play so the model's actual output
// (names, explanations, drills, search queries) matches the site's selected
// language — not just the surrounding UI chrome, which is translated client-side.
function languageInstruction(lang) {
  if (lang === 'zh') {
    return '\n\nRespond entirely in Simplified Chinese (简体中文). Every "name", "explanation", "drill", and each string in "youtube_queries" must be written in natural Simplified Chinese that a Chinese-speaking dancer could read and use as a real search query.';
  }
  return '\n\nRespond entirely in English.';
}

function classifyAnthropicError(e) {
  if (e instanceof Anthropic.AuthenticationError) {
    return { status: 500, message: 'Anthropic rejected the API key. Check the .env file in the Count8 root.' };
  }
  if (e instanceof Anthropic.RateLimitError) {
    return { status: 429, message: 'Rate limited by the Claude API. Please wait a moment and try again.' };
  }
  if (e instanceof Anthropic.APIError) {
    return { status: 502, message: e.message || `Claude API error (${e.status}).` };
  }
  return { status: 502, message: 'Could not reach the Claude API. Check your network connection and try again.' };
}

async function handleIdentifyFoundations(req, res) {
  if (!ANTHROPIC_API_KEY) {
    sendJSON(res, 500, {
      error: 'Server is missing ANTHROPIC_API_KEY. Add it to .env (in the Count8 root) and restart the server.',
    });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (e) {
    sendJSON(res, e.statusCode || 400, { error: e.message });
    return;
  }

  const frames = sanitizeFrames(body.frames);
  if (frames.length === 0) {
    sendJSON(res, 400, { error: 'No valid video frames were provided.' });
    return;
  }
  const lang = sanitizeLang(body.lang);

  let response;
  try {
    response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT + languageInstruction(lang),
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: OUTPUT_SCHEMA },
      },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'These images are frames sampled in chronological order from a single dance practice video. Identify the core dance foundational techniques being demonstrated.',
            },
            ...frames.map((frame) => ({
              type: 'image',
              source: { type: 'base64', media_type: frame.media_type, data: frame.data },
            })),
          ],
        },
      ],
    });
  } catch (e) {
    const { status, message } = classifyAnthropicError(e);
    sendJSON(res, status, { error: message });
    return;
  }

  if (response.stop_reason === 'refusal') {
    sendJSON(res, 502, { error: "Claude couldn't analyze these frames. Try a different clip." });
    return;
  }

  try {
    const textBlock = response.content.find((b) => b.type === 'text');
    const parsed = JSON.parse(textBlock.text);
    const techniques = sanitizeTechniques(parsed);
    if (techniques.length === 0) {
      throw new Error('No techniques were identified in this video.');
    }
    sendJSON(res, 200, { techniques });
  } catch (e) {
    sendJSON(res, 502, { error: 'Could not parse a valid response from the model. Please try again.' });
  }
}

async function handleAnalyzePractice(req, res) {
  if (!ANTHROPIC_API_KEY) {
    sendJSON(res, 500, {
      error: 'Server is missing ANTHROPIC_API_KEY. Add it to .env (in the Count8 root) and restart the server.',
    });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (e) {
    sendJSON(res, e.statusCode || 400, { error: e.message });
    return;
  }

  const referenceFrames = sanitizeFrames(body.referenceFrames).slice(0, MAX_FRAMES_PER_PRACTICE_VIDEO);
  const practiceFrames = sanitizeFrames(body.practiceFrames).slice(0, MAX_FRAMES_PER_PRACTICE_VIDEO);
  if (referenceFrames.length === 0 || practiceFrames.length === 0) {
    sendJSON(res, 400, { error: 'Both the reference and practice video frames are required.' });
    return;
  }
  const lang = sanitizeLang(body.lang);

  let response;
  try {
    response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT_FEEDBACK + languageInstruction(lang),
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: OUTPUT_SCHEMA_FEEDBACK },
      },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Reference choreography frames, in chronological order:' },
            ...referenceFrames.map((frame) => ({
              type: 'image',
              source: { type: 'base64', media_type: frame.media_type, data: frame.data },
            })),
            { type: 'text', text: "Student's practice attempt frames, in chronological order:" },
            ...practiceFrames.map((frame) => ({
              type: 'image',
              source: { type: 'base64', media_type: frame.media_type, data: frame.data },
            })),
          ],
        },
      ],
    });
  } catch (e) {
    const { status, message } = classifyAnthropicError(e);
    sendJSON(res, status, { error: message });
    return;
  }

  if (response.stop_reason === 'refusal') {
    sendJSON(res, 502, { error: "Claude couldn't analyze these videos. Try a different clip." });
    return;
  }

  try {
    const textBlock = response.content.find((b) => b.type === 'text');
    const parsed = JSON.parse(textBlock.text);
    const feedback = sanitizeFeedback(parsed);
    if (feedback.issues.length === 0) {
      throw new Error('No feedback issues were identified.');
    }
    sendJSON(res, 200, feedback);
  } catch (e) {
    sendJSON(res, 502, { error: 'Could not parse a valid response from the model. Please try again.' });
  }
}

async function handleAnalyzeContentStyle(req, res) {
  if (!ANTHROPIC_API_KEY) {
    sendJSON(res, 500, {
      error: 'Server is missing ANTHROPIC_API_KEY. Add it to .env (in the Count8 root) and restart the server.',
    });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (e) {
    sendJSON(res, e.statusCode || 400, { error: e.message });
    return;
  }

  const frames = sanitizeFrames(body.frames);
  if (frames.length === 0) {
    sendJSON(res, 400, { error: 'No valid video frames were provided.' });
    return;
  }
  const lang = sanitizeLang(body.lang);

  let response;
  try {
    response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT_STYLE + languageInstruction(lang),
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: OUTPUT_SCHEMA_STYLE },
      },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'These images are frames sampled in chronological order from a reference dance video. Suggest how to film a similar video for social media.',
            },
            ...frames.map((frame) => ({
              type: 'image',
              source: { type: 'base64', media_type: frame.media_type, data: frame.data },
            })),
          ],
        },
      ],
    });
  } catch (e) {
    const { status, message } = classifyAnthropicError(e);
    sendJSON(res, status, { error: message });
    return;
  }

  if (response.stop_reason === 'refusal') {
    sendJSON(res, 502, { error: "Claude couldn't analyze these frames. Try a different clip." });
    return;
  }

  try {
    const textBlock = response.content.find((b) => b.type === 'text');
    const parsed = JSON.parse(textBlock.text);
    const advice = sanitizeStyleAdvice(parsed);
    sendJSON(res, 200, advice);
  } catch (e) {
    sendJSON(res, 502, { error: 'Could not parse a valid response from the model. Please try again.' });
  }
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  if (req.method === 'POST' && url === '/api/identify-foundations') {
    handleIdentifyFoundations(req, res);
    return;
  }

  if (req.method === 'POST' && url === '/api/analyze-practice') {
    handleAnalyzePractice(req, res);
    return;
  }

  if (req.method === 'POST' && url === '/api/analyze-content-style') {
    handleAnalyzeContentStyle(req, res);
    return;
  }

  if (req.method === 'GET') {
    serveStatic(req, res, url);
    return;
  }

  sendJSON(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Count8 running at http://localhost:${PORT}`);
  if (!ANTHROPIC_API_KEY) {
    console.warn('Warning: ANTHROPIC_API_KEY is not set. Add it to .env before uploading a video to identify.');
  }
});
