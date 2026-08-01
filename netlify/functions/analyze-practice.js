'use strict';

// Netlify Function counterpart of handleAnalyzePractice in server.js.
// Self-contained (no shared import) since Netlify bundles each function
// independently. Reads ANTHROPIC_API_KEY from the Netlify site's
// Environment Variables — never from a checked-in .env file.

const Anthropic = require('@anthropic-ai/sdk');

const MODEL = 'claude-opus-5';
const MAX_FRAMES_PER_PRACTICE_VIDEO = 4;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY || 'missing-key' });

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

// Parses a "data:image/jpeg;base64,...." URL into the {media_type, data}
// shape Claude's vision content blocks expect.
function sanitizeFrames(rawFrames) {
  if (!Array.isArray(rawFrames)) return [];
  const out = [];
  for (const f of rawFrames) {
    if (typeof f !== 'string') continue;
    const match = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(f);
    if (!match) continue;
    const mediaType = match[1] === 'image/jpg' ? 'image/jpeg' : match[1];
    out.push({ media_type: mediaType, data: match[2] });
  }
  return out;
}

function sanitizeLang(rawLang) {
  return rawLang === 'zh' ? 'zh' : 'en';
}

function languageInstruction(lang) {
  if (lang === 'zh') {
    return '\n\nRespond entirely in Simplified Chinese (简体中文). Every "name", "explanation", "drill", and each string in "youtube_queries" must be written in natural Simplified Chinese that a Chinese-speaking dancer could read and use as a real search query.';
  }
  return '\n\nRespond entirely in English.';
}

function classifyAnthropicError(e) {
  if (e instanceof Anthropic.AuthenticationError) {
    return { status: 500, message: 'Anthropic rejected the API key. Check ANTHROPIC_API_KEY in the Netlify site environment variables.' };
  }
  if (e instanceof Anthropic.RateLimitError) {
    return { status: 429, message: 'Rate limited by the Claude API. Please wait a moment and try again.' };
  }
  if (e instanceof Anthropic.APIError) {
    return { status: 502, message: e.message || `Claude API error (${e.status}).` };
  }
  return { status: 502, message: 'Could not reach the Claude API. Check your network connection and try again.' };
}

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(obj),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  if (!ANTHROPIC_API_KEY) {
    return json(500, {
      error: 'Server is missing ANTHROPIC_API_KEY. Add it in Netlify site settings → Environment variables and redeploy.',
    });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { error: 'Invalid JSON body' });
  }

  const referenceFrames = sanitizeFrames(body.referenceFrames).slice(0, MAX_FRAMES_PER_PRACTICE_VIDEO);
  const practiceFrames = sanitizeFrames(body.practiceFrames).slice(0, MAX_FRAMES_PER_PRACTICE_VIDEO);
  if (referenceFrames.length === 0 || practiceFrames.length === 0) {
    return json(400, { error: 'Both the reference and practice video frames are required.' });
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
    return json(status, { error: message });
  }

  if (response.stop_reason === 'refusal') {
    return json(502, { error: "Claude couldn't analyze these videos. Try a different clip." });
  }

  try {
    const textBlock = response.content.find((b) => b.type === 'text');
    const parsed = JSON.parse(textBlock.text);
    const feedback = sanitizeFeedback(parsed);
    if (feedback.issues.length === 0) {
      throw new Error('No feedback issues were identified.');
    }
    return json(200, feedback);
  } catch (e) {
    return json(502, { error: 'Could not parse a valid response from the model. Please try again.' });
  }
};
