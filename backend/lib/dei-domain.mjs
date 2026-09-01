import crypto from 'node:crypto';

export const INFORMATION_TYPES = new Set([
  'fact', 'context', 'later_event', 'theory', 'method', 'constraint', 'diagnostic', 'comparison'
]);

export const SCALE_SIZE = 5;

export function assertResponse(value, field = 'response') {
  if (!Number.isInteger(value) || value < 1 || value > SCALE_SIZE) {
    throw new Error(`${field} must be an integer from 1 to 5`);
  }
  return value;
}

function requireText(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function optionalText(value, field) {
  if (value == null || value === '') return null;
  return requireText(value, field);
}

export function validateConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('config must be an object');
  }

  const response = config.response ?? {};
  const review = config.review ?? {};
  const information = config.information;
  const results = config.results ?? {};

  const prompt = requireText(response.prompt, 'response.prompt');
  const instructionInitial = requireText(response.instruction_initial, 'response.instruction_initial');
  const instructionRevised = requireText(response.instruction_revised, 'response.instruction_revised');

  if (!Array.isArray(response.scale_labels) || response.scale_labels.length !== SCALE_SIZE) {
    throw new Error('response.scale_labels must contain exactly five labels');
  }
  const scaleLabels = response.scale_labels.map((x, i) => requireText(x, `response.scale_labels[${i}]`));

  const reviewInstruction = requireText(review.instruction, 'review.instruction');
  const continueLabel = requireText(review.continue_label, 'review.continue_label');

  if (!Array.isArray(information) || information.length < 1 || information.length > 3) {
    throw new Error('information must contain between 1 and 3 objects');
  }

  const ids = new Set();
  const normalisedInformation = information.map((item, i) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`information[${i}] must be an object`);
    }
    const id = requireText(item.id, `information[${i}].id`);
    if (ids.has(id)) throw new Error(`information id '${id}' is duplicated`);
    ids.add(id);
    const type = requireText(item.type, `information[${i}].type`);
    if (!INFORMATION_TYPES.has(type)) throw new Error(`unsupported information type '${type}'`);
    return {
      id,
      type,
      title: optionalText(item.title, `information[${i}].title`),
      body: requireText(item.body, `information[${i}].body`),
      highlight: optionalText(item.highlight, `information[${i}].highlight`),
      source_note: optionalText(item.source_note, `information[${i}].source_note`)
    };
  });

  const discussionPrompts = results.discussion_prompts ?? [];
  if (!Array.isArray(discussionPrompts) || discussionPrompts.length > 3) {
    throw new Error('results.discussion_prompts must contain 0 to 3 prompts');
  }

  return {
    response: {
      prompt,
      instruction_initial: instructionInitial,
      instruction_revised: instructionRevised,
      scale_labels: scaleLabels
    },
    review: {
      instruction: reviewInstruction,
      continue_label: continueLabel
    },
    information: normalisedInformation,
    results: {
      heading: requireText(results.heading, 'results.heading'),
      intro: optionalText(results.intro, 'results.intro'),
      discussion_prompts: discussionPrompts.map((x, i) => requireText(x, `results.discussion_prompts[${i}]`))
    }
  };
}

export function publicActivityView(activity) {
  const config = validateConfig(activity.config);
  return {
    id: activity.id,
    title: activity.title,
    response: {
      prompt: config.response.prompt,
      instruction_initial: config.response.instruction_initial,
      instruction_revised: config.response.instruction_revised,
      scale_labels: config.response.scale_labels
    },
    results: config.results
  };
}

export function informationReleaseView(config) {
  const valid = validateConfig(config);
  return { review: valid.review, information: valid.information };
}

export function hashParticipant(sessionId, participantToken, salt = '') {
  requireText(sessionId, 'sessionId');
  requireText(participantToken, 'participantToken');
  return crypto.createHash('sha256').update(`${salt}\0${sessionId}\0${participantToken}`).digest('hex');
}

export function movement(initial, revised) {
  assertResponse(initial, 'initial');
  assertResponse(revised, 'revised');
  const delta = revised - initial;
  return { initial, revised, delta, direction: delta < 0 ? 'lower' : delta > 0 ? 'higher' : 'unchanged', magnitude: Math.abs(delta), transition: `${initial}->${revised}` };
}

export function transitionMatrix(pairs) {
  const matrix = Array.from({ length: SCALE_SIZE }, () => Array(SCALE_SIZE).fill(0));
  let lower = 0, unchanged = 0, higher = 0;
  for (const pair of pairs) {
    const initial = assertResponse(Number(pair.initial_response ?? pair.initial), 'initial');
    const revised = assertResponse(Number(pair.revised_response ?? pair.revised), 'revised');
    matrix[initial - 1][revised - 1] += 1;
    if (revised < initial) lower += 1; else if (revised > initial) higher += 1; else unchanged += 1;
  }
  const total = lower + unchanged + higher;
  return { matrix, total, movement: { lower, unchanged, higher }, percentages: total === 0 ? { lower: 0, unchanged: 0, higher: 0 } : { lower: Math.round((lower / total) * 1000) / 10, unchanged: Math.round((unchanged / total) * 1000) / 10, higher: Math.round((higher / total) * 1000) / 10 } };
}

export function focusStartingGroup(matrixResult, initialResponse) {
  const initial = assertResponse(initialResponse, 'initialResponse');
  const row = matrixResult.matrix[initial - 1].slice();
  const total = row.reduce((a, b) => a + b, 0);
  const lower = row.slice(0, initial - 1).reduce((a, b) => a + b, 0);
  const unchanged = row[initial - 1];
  const higher = row.slice(initial).reduce((a, b) => a + b, 0);
  const pct = (n) => total === 0 ? 0 : Math.round((n / total) * 1000) / 10;
  return { initial, counts: row, total, percentages: row.map(pct), movement: { lower, unchanged, higher }, movement_percentages: { lower: pct(lower), unchanged: pct(unchanged), higher: pct(higher) } };
}
