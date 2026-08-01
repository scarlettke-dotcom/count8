'use strict';

// Netlify Function counterpart of handleIdentifyFoundations in server.js.
// Self-contained (no shared import) since Netlify bundles each function
// independently. Reads ANTHROPIC_API_KEY from the Netlify site's
// Environment Variables — never from a checked-in .env file.

const Anthropic = require('@anthropic-ai/sdk');

const MODEL = 'claude-opus-5';
const MAX_FRAMES = 6;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
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
    if (out.length >= MAX_FRAMES) break;
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

  const frames = sanitizeFrames(body.frames);
  if (frames.length === 0) {
    return json(400, { error: 'No valid video frames were provided.' });
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
    return json(status, { error: message });
  }

  if (response.stop_reason === 'refusal') {
    return json(502, { error: "Claude couldn't analyze these frames. Try a different clip." });
  }

  try {
    const textBlock = response.content.find((b) => b.type === 'text');
    const parsed = JSON.parse(textBlock.text);
    const techniques = sanitizeTechniques(parsed);
    if (techniques.length === 0) {
      throw new Error('No techniques were identified in this video.');
    }
    return json(200, { techniques });
  } catch (e) {
    return json(502, { error: 'Could not parse a valid response from the model. Please try again.' });
  }
};
