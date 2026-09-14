import { resolvePublicAlias } from './public-aliases.js';

const app = document.querySelector('#app');
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[char]));

const PORTALS = {
  b1141: 'http://ai3pbfgh23bz6pqvml37qngu.167.233.132.208.sslip.io'
};

async function api(url, opts = {}) {
  const { headers = {}, ...rest } = opts;
  const response = await fetch(url, {
    ...rest,
    headers: {
      'content-type': 'application/json',
      ...headers
    }
  });
  let body = {};
  try {
    body = await response.json();
  } catch {
    body = {};
  }
  if (!response.ok) {
    const error = new Error(body.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return body;
}

function page(html, mode = 'student') {
  document.body.className = mode;
  app.innerHTML = `<div class="shell">${html}</div>`;
}

function route() {
  const [pathPart, query = ''] = location.hash.slice(2).split('?');
  return {
    parts: pathPart.split('/').filter(Boolean),
    params: new URLSearchParams(query)
  };
}

function portalKey(params) {
  const fromRoute = params?.get('gdl_portal');
  if (fromRoute) return fromRoute;
  return new URLSearchParams(window.location.search).get('gdl_portal');
}

function portalReturnUrl(params) {
  return PORTALS[portalKey(params)] || null;
}

const memoryTokens = new Map();

function makeToken() {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  if (cryptoApi?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function token(activityId, sessionId) {
  const key = `gedl:dei:${activityId}:${sessionId}:participant`;
  try {
    let value = sessionStorage.getItem(key);
    if (!value) {
      value = makeToken();
      sessionStorage.setItem(key, value);
    }
    return value;
  } catch {
    if (!memoryTokens.has(key)) memoryTokens.set(key, makeToken());
    return memoryTokens.get(key);
  }
}

function scale(labels, selected) {
  return `<div class="scale">${labels.map((label, index) => `
    <button
      type="button"
      data-v="${index + 1}"
      class="${selected === index + 1 ? 'selected' : ''}"
      aria-pressed="${selected === index + 1 ? 'true' : 'false'}"
    >${esc(label)}</button>
  `).join('')}</div>`;
}

async function resolveSession(activityId, suppliedId) {
  if (suppliedId) return suppliedId;
  const data = await api(`/api/dei/activities/${encodeURIComponent(activityId)}/open-session`);
  if (!data.session_id) throw new Error('This activity is not open yet.');
  return data.session_id;
}

function flow(matrix, labels, focus = null) {
  const rows = matrix.map((row, index) => focus && focus !== index + 1 ? row.map(() => 0) : row);
  const pairs = [];
  rows.forEach((row, startIndex) => row.forEach((count, endIndex) => {
    if (count) {
      pairs.push(`
        <li>
          <span>${esc(labels[startIndex])}</span>
          <b aria-hidden="true">→</b>
          <span>${esc(labels[endIndex])}</span>
          <strong>${count}</strong>
        </li>
      `);
    }
  }));
  return `
    <div class="panel movement-list">
      <strong>Response movement</strong>
      <ul>${pairs.length ? pairs.join('') : '<li class="empty-movement">No completed responses yet</li>'}</ul>
    </div>
  `;
}

function movementMap(matrix, labels) {
  const totalsStart = matrix.map((row) => row.reduce((sum, count) => sum + Number(count || 0), 0));
  const totalsEnd = labels.map((_, column) => matrix.reduce((sum, row) => sum + Number(row[column] || 0), 0));
  const maxCount = Math.max(1, ...matrix.flat().map((count) => Number(count || 0)));
  const y = labels.map((_, index) => 92 + (index * 104));
  const paths = [];
  matrix.forEach((row, startIndex) => {
    row.forEach((rawCount, endIndex) => {
      const count = Number(rawCount || 0);
      if (!count) return;
      const direction = endIndex < startIndex ? 'lower' : endIndex > startIndex ? 'higher' : 'same';
      const width = 2.5 + (count / maxCount) * 12;
      const opacity = 0.34 + (count / maxCount) * 0.5;
      paths.push(`
        <path
          class="movement-ribbon movement-${direction}"
          d="M 268 ${y[startIndex]} C 470 ${y[startIndex]}, 730 ${y[endIndex]}, 932 ${y[endIndex]}"
          style="--movement-width:${width.toFixed(2)};--movement-opacity:${opacity.toFixed(2)}"
        />
      `);
    });
  }));

  const startNodes = labels.map((label, index) => `
    <g class="movement-node movement-node-start">
      <circle cx="210" cy="${y[index]}" r="34"></circle>
      <text x="210" y="${y[index] + 6}" text-anchor="middle">${totalsStart[index]}</text>
      <text class="movement-node-label" x="160" y="${y[index] + 5}" text-anchor="end">${esc(label)}</text>
    </g>
  `).join('');

  const endNodes = labels.map((label, index) => `
    <g class="movement-node movement-node-end">
      <circle cx="990" cy="${y[index]}" r="34"></circle>
      <text x="990" y="${y[index] + 6}" text-anchor="middle">${totalsEnd[index]}</text>
      <text class="movement-node-label" x="1040" y="${y[index] + 5}" text-anchor="start">${esc(label)}</text>
    </g>
  `).join('');

  return `
    <section class="movement-stage" aria-label="Class response movement from initial to revised position">
      <div class="movement-stage-head">
        <div><span>BEFORE</span><strong>Initial judgement</strong></div>
        <div class="movement-stage-arrow" aria-hidden="true">→</div>
        <div><span>AFTER</span><strong>Revised judgement</strong></div>
      </div>
      <svg class="movement-map" viewBox="0 0 1200 620" role="img" aria-label="Movement between the five response positions">
        <g class="movement-ribbons">${paths.join('')}</g>
        ${startNodes}
        ${endNodes}
      </svg>
      <div class="movement-legend" aria-hidden="true">
        <span class="legend-lower">Moved lower</span>
        <span class="legend-same">Unchanged</span>
        <span class="legend-higher">Moved higher</span>
      </div>
    </section>
  `;
}

async function student(activityId, params) {
  const activity = await api(`/api/dei/activities/${encodeURIComponent(activityId)}`);
  const sessionId = await resolveSession(activityId, params.get('session'));
  const participantToken = token(activityId, sessionId);
  const portalUrl = portalReturnUrl(params);
  const state = {
    step: 1,
    initial: null,
    revised: null,
    release: null,
    result: null
  };

  const render = () => {
    if (state.step === 1) {
      page(`
        <div class="eyebrow">Your view</div>
        <h1>What do you think?</h1>
        <p class="muted">${esc(activity.response.instruction_initial)}</p>
        <div class="prompt">${esc(activity.response.prompt)}</div>
        ${scale(activity.response.scale_labels, state.initial)}
        <div class="actions">
          <button id="next" class="button primary" ${state.initial ? '' : 'disabled'}>Continue</button>
        </div>
      `, 'student');

      document.querySelectorAll('[data-v]').forEach((button) => {
        button.onclick = () => {
          state.initial = Number(button.dataset.v);
          render();
        };
      });
      document.querySelector('#next').onclick = async () => {
        state.release = await api(`/api/dei/sessions/${sessionId}/initial`, {
          method: 'POST',
          body: JSON.stringify({ participant_token: participantToken, response: state.initial })
        });
        state.step = 2;
        render();
      };
      return;
    }

    if (state.step === 2) {
      page(`
        <div class="eyebrow">Something else to consider</div>
        <h1>${esc(state.release.review.heading || 'Review the following information')}</h1>
        <p class="muted">${esc(state.release.review.instruction)}</p>
        <div class="information-stack">
          ${state.release.information.map((item, index) => `
            <article class="info">
              <div class="info-number">${index + 1}</div>
              <div>
                ${item.title ? `<h3>${esc(item.title)}</h3>` : ''}
                <p>${esc(item.body)}</p>
                ${item.source_note ? `<div class="source">${esc(item.source_note)}</div>` : ''}
              </div>
            </article>
          `).join('')}
        </div>
        <div class="actions">
          <button id="reviewed" class="button primary">${esc(state.release.review.continue_label)}</button>
        </div>
      `, 'student');

      document.querySelector('#reviewed').onclick = async () => {
        await api(`/api/dei/sessions/${sessionId}/reviewed`, {
          method: 'POST',
          body: JSON.stringify({ participant_token: participantToken })
        });
        state.step = 3;
        render();
      };
      return;
    }

    if (state.step === 3) {
      page(`
        <div class="eyebrow">Your view now</div>
        <h1>What do you think now?</h1>
        <p class="muted">${esc(activity.response.instruction_revised)}</p>
        <div class="prompt">${esc(activity.response.prompt)}</div>
        ${scale(activity.response.scale_labels, state.revised)}
        <div class="actions">
          <button id="results" class="button primary" ${state.revised ? '' : 'disabled'}>See class overview</button>
        </div>
      `, 'student');

      document.querySelectorAll('[data-v]').forEach((button) => {
        button.onclick = () => {
          state.revised = Number(button.dataset.v);
          render();
        };
      });
      document.querySelector('#results').onclick = async () => {
        state.result = await api(`/api/dei/sessions/${sessionId}/revised`, {
          method: 'POST',
          body: JSON.stringify({ participant_token: participantToken, response: state.revised })
        });
        state.step = 4;
        render();
      };
      return;
    }

    resultsView(
      state.result,
      activity,
      sessionId,
      participantToken,
      state.initial,
      state.revised,
      portalUrl
    );
  };

  render();
}

function resultsView(payload, activity, sessionId, participantToken, initial, revised, portalUrl) {
  let focus = null;

  const draw = () => {
    const percentages = focus && payload.focus
      ? payload.focus.movement_percentages
      : payload.results.percentages;

    page(`
      <div class="eyebrow">Class overview</div>
      <h1>${esc(activity.results.heading)}</h1>
      ${activity.results.intro ? `<p class="muted">${esc(activity.results.intro)}</p>` : ''}
      <div class="own">
        <div><span>At the start</span><strong>${esc(activity.response.scale_labels[initial - 1])}</strong></div>
        <div class="own-arrow" aria-hidden="true">→</div>
        <div><span>Now</span><strong>${esc(activity.response.scale_labels[revised - 1])}</strong></div>
      </div>
      ${flow(payload.results.matrix, activity.response.scale_labels, focus)}
      <div class="filters">
        ${activity.response.scale_labels.map((label, index) => `
          <button class="filter ${focus === index + 1 ? 'active' : ''}" data-f="${index + 1}">
            Started: ${esc(label)}
          </button>
        `).join('')}
        <button class="filter ${focus === null ? 'active' : ''}" data-f="0">Whole class</button>
      </div>
      <div class="stats">
        <div class="stat"><strong>${percentages.lower}%</strong><span>Moved lower</span></div>
        <div class="stat"><strong>${percentages.unchanged}%</strong><span>Unchanged</span></div>
        <div class="stat"><strong>${percentages.higher}%</strong><span>Moved higher</span></div>
      </div>
      ${activity.results.discussion_prompts?.length ? `
        <div class="questions">
          <h3>Questions to consider</h3>
          <ul>${activity.results.discussion_prompts.map((question) => `<li>${esc(question)}</li>`).join('')}</ul>
        </div>
      ` : ''}
      ${portalUrl ? `
        <div class="actions completion-actions">
          <a class="button primary portal-return" href="${esc(portalUrl)}">Return to B1141 activities</a>
        </div>
      ` : ''}
    `, 'student');

    document.querySelectorAll('[data-f]').forEach((button) => {
      button.onclick = async () => {
        focus = Number(button.dataset.f) || null;
        payload = await api(
          `/api/dei/sessions/${sessionId}/results?participant_token=${encodeURIComponent(participantToken)}${focus ? `&focus=${focus}` : ''}`
        );
        draw();
      };
    });
  };

  draw();
}

let surfaceTimer = null;

function setSurfaceTimer(callback, interval) {
  clearSurfaceTimer();
  surfaceTimer = window.setInterval(callback, interval);
}

function clearSurfaceTimer() {
  if (surfaceTimer) {
    window.clearInterval(surfaceTimer);
    surfaceTimer = null;
  }
}

async function lecturer(activityId, params) {
  let key = sessionStorage.getItem('dei-lecturer-key') || '';
  let pinnedSessionId = params.get('session');
  let currentSessionId = pinnedSessionId || null;

  if (!key) {
    page(`
      <div class="eyebrow">Lecturer</div>
      <h1>Lecturer control</h1>
      <p class="muted">Enter the facilitator key for this browser session.</p>
      <label class="key-field">
        <span>Facilitator key</span>
        <input id="key" type="password" autocomplete="current-password">
      </label>
      <div class="actions">
        <button id="go" class="button primary">Continue</button>
      </div>
    `, 'lecturer');

    document.querySelector('#go').onclick = () => {
      const value = document.querySelector('#key').value;
      if (!value) return;
      sessionStorage.setItem('dei-lecturer-key', value);
      key = value;
      void lecturer(activityId, params);
    };
    return;
  }

  const resolveCurrent = async () => {
    if (pinnedSessionId) return pinnedSessionId;
    const open = await api(`/api/dei/activities/${encodeURIComponent(activityId)}/open-session`);
    return open.session_id || null;
  };

  const renderWaiting = () => {
    page(`
      <div class="lecturer-head">
        <div>
          <div class="eyebrow">Lecturer</div>
          <h1>Waiting for the scheduled activity</h1>
        </div>
        <span class="status-chip waiting">Waiting</span>
      </div>
      <div class="control-empty">
        <div class="waiting-orb" aria-hidden="true"></div>
        <h2>No current classroom run</h2>
        <p>This view will attach automatically when the CRUD availability window opens and the schedule coordinator creates the run.</p>
      </div>
    `, 'lecturer');
  };

  const refresh = async () => {
    const resolved = await resolveCurrent();
    if (!resolved) {
      currentSessionId = null;
      renderWaiting();
      return;
    }

    currentSessionId = resolved;
    const [data, meta] = await Promise.all([
      api(`/api/dei/sessions/${currentSessionId}/lecturer`, {
        headers: { 'x-dei-lecturer-key': key }
      }),
      api(`/api/dei/sessions/${currentSessionId}/presentation`)
    ]);

    const closed = data.status === 'closed';
    page(`
      <div class="lecturer-head">
        <div>
          <div class="eyebrow">Lecturer</div>
          <h1>${esc(meta.title || activityId)}</h1>
        </div>
        <span class="status-chip ${closed ? 'closed' : 'open'}">${closed ? 'Session ended' : 'Session open'}</span>
      </div>
      <div class="lecturer-grid">
        <div class="stat"><span class="big">${data.counts.initial}</span><span>Initial responses</span></div>
        <div class="stat"><span class="big">${data.counts.reviewed}</span><span>Reviewed information</span></div>
        <div class="stat"><span class="big">${data.counts.revised}</span><span>Revised responses</span></div>
      </div>
      <div class="control-note">
        <strong>Current run</strong>
        <span>${esc(String(currentSessionId).slice(0, 8))}…</span>
      </div>
      <div class="actions lecturer-actions">
        <button id="display" class="button">Open presentation</button>
        <button id="refresh" class="button">Refresh</button>
        ${closed ? '' : '<button id="restart" class="button">Restart with fresh run</button>'}
        ${closed ? '' : '<button id="close" class="button danger">End session</button>'}
      </div>
    `, 'lecturer');

    document.querySelector('#display').onclick = () => {
      window.open(`/#/display/${activityId}`, '_blank');
    };
    document.querySelector('#refresh').onclick = refresh;

    const restart = document.querySelector('#restart');
    if (restart) {
      restart.onclick = async () => {
        const confirmed = window.confirm(
          'Abandon this run and start a completely fresh one?\n\n' +
          'The current run and its responses will remain stored, but nothing will carry into the new run. ' +
          'Students will need to return to the B1141 portal and open the activity again.'
        );
        if (!confirmed) return;

        restart.disabled = true;
        restart.textContent = 'Starting fresh run…';

        await api(`/api/dei/sessions/${currentSessionId}/close`, {
          method: 'POST',
          headers: { 'x-dei-lecturer-key': key },
          body: '{}'
        });

        const fresh = await api(`/api/dei/activities/${encodeURIComponent(activityId)}/sessions`, {
          method: 'POST',
          headers: { 'x-dei-lecturer-key': key },
          body: '{}'
        });

        pinnedSessionId = null;
        currentSessionId = fresh.session_id;
        await refresh();
        window.alert('Fresh run started. Ask students to return to the B1141 portal and reopen the activity.');
      };
    }

    const close = document.querySelector('#close');
    if(close)close.onclick = async () => {
      const confirmed = window.confirm('End this session? Students will no longer be able to submit responses.');
      if(!confirmed)return;
      await api(`/api/dei/sessions/${currentSessionId}/close`, {
        method: 'POST',
        headers: { 'x-dei-lecturer-key': key },
        body: '{}'
      });
      pinnedSessionId = null;
      currentSessionId = null;
      renderWaiting();
    };
  };

  await refresh();
  if (!pinnedSessionId) setSurfaceTimer(() => void refresh(), 1500);
}

async function presentation(activityId, params) {
  let currentSessionId = params.get('session') || null;
  let lastPayload = null;

  const renderWaiting = () => {
    page(`
      <div class="presentation-kicker">Class activity</div>
      <h1>Waiting for the scheduled activity</h1>
      <p class="presentation-lead">This display will connect automatically when the current run is available.</p>
      <div class="presentation-pulse" aria-hidden="true"></div>
    `, 'presentation');
  };

  const refresh = async () => {
    try {
      const open = await api(`/api/dei/activities/${encodeURIComponent(activityId)}/open-session`);
      if (open.session_id) currentSessionId = open.session_id;

      if (!currentSessionId) {
        renderWaiting();
        return;
      }

      const data = await api(`/api/dei/sessions/${currentSessionId}/presentation`);
      lastPayload = data;

      const hasResults = Number(data.results?.total || 0) > 0;
      page(`
        <div class="presentation-kicker">Class activity · Dynamic Evidence</div>
        <div class="presentation-prompt">${esc(data.prompt)}</div>
        ${hasResults ? `
          <div class="presentation-reveal">
            <h1>${esc(data.results_copy.heading)}</h1>
            ${movementMap(data.results.matrix, data.scale_labels)}
            <div class="presentation-stats">
              <div><strong>${data.results.percentages.lower}%</strong><span>Moved lower</span></div>
              <div><strong>${data.results.percentages.unchanged}%</strong><span>Unchanged</span></div>
              <div><strong>${data.results.percentages.higher}%</strong><span>Moved higher</span></div>
            </div>
          </div>
        ` : `
          <div class="presentation-progress">
            <div class="presentation-count"><strong>${data.counts.initial}</strong><span>started</span></div>
            <div class="presentation-thread" aria-hidden="true"></div>
            <div class="presentation-count"><strong>${data.counts.reviewed}</strong><span>reviewed</span></div>
            <div class="presentation-thread" aria-hidden="true"></div>
            <div class="presentation-count emphasis"><strong>${data.counts.revised}</strong><span>reconsidered</span></div>
          </div>
          <p class="presentation-lead">The room display will transform when revised responses arrive.</p>
        `}
      `, 'presentation');
    } catch (error) {
      if (lastPayload) return;
      renderWaiting();
    }
  };

  await refresh();
  setSurfaceTimer(() => void refresh(), 2500);
}

async function main() {
  clearSurfaceTimer();

  try {
    const publicRoute = resolvePublicAlias(location.pathname);
    if (publicRoute) {
      await student(publicRoute.activityId, new URLSearchParams(location.search));
      return;
    }

    const { parts, params } = route();
    if (parts[0] === 'respond' && parts[1]) {
      await student(parts[1], params);
      return;
    }
    if (parts[0] === 'control' && parts[1]) {
      await lecturer(parts[1], params);
      return;
    }
    if (parts[0] === 'display' && parts[1]) {
      await presentation(parts[1], params);
      return;
    }

    page(`
      <div class="eyebrow">DEI Engine</div>
      <h1>Choose a configured activity surface</h1>
    `, 'student');
  } catch (error) {
    page(`
      <div class="eyebrow">Unable to continue</div>
      <h1>Something went wrong</h1>
      <p class="muted">${esc(error?.message || 'This activity could not be opened on this browser.')}</p>
    `, 'student');
  }
}

window.addEventListener('hashchange', () => { void main(); });
void main();
