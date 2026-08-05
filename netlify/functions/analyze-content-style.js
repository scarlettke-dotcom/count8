'use strict';

// Netlify Function counterpart of handleAnalyzeContentStyle in server.js.
// Self-contained (no shared import) since Netlify bundles each function
// independently. Reads ANTHROPIC_API_KEY from the Netlify site's
// Environment Variables — never from a checked-in .env file.

const Anthropic = require('@anthropic-ai/sdk');

const MODEL = 'claude-opus-5';
const MAX_FRAMES = 6;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY || 'missing-key' });

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
    return '\n\nRespond entirely in Simplified Chinese (简体中文). Every category value must be written in natural Simplified Chinese that a Chinese-speaking dancer could read and act on.';
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
    return json(status, { error: message });
  }

  if (response.stop_reason === 'refusal') {
    return json(502, { error: "Claude couldn't analyze these frames. Try a different clip." });
  }

  try {
    const textBlock = response.content.find((b) => b.type === 'text');
    const parsed = JSON.parse(textBlock.text);
    const advice = sanitizeStyleAdvice(parsed);
    return json(200, advice);
  } catch (e) {
    return json(502, { error: 'Could not parse a valid response from the model. Please try again.' });
  }
};
