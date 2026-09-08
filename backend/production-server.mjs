import http from 'node:http';
import { createServer } from './server.mjs';

export const PRODUCTION_ALIASES = Object.freeze({
  dei01: 'b1141-w2-who-dopes-dei',
  dei02: 'b1141-w8-disclosure-sequence-dei'
});

export function resolveProductionRoute(pathname) {
  const clean = String(pathname || '');
  const surfaceMatch = clean.match(/^\/(control|display)\/(dei\d{2})\/?$/i);
  if (surfaceMatch) {
    const alias = surfaceMatch[2].toLowerCase();
    const activityId = PRODUCTION_ALIASES[alias];
    return activityId ? { kind: 'surface', surface: surfaceMatch[1].toLowerCase(), alias, activityId } : null;
  }

  const apiMatch = clean.match(/^\/api\/dei\/activities\/(dei\d{2})(\/.*)?$/i);
  if (apiMatch) {
    const alias = apiMatch[1].toLowerCase();
    const activityId = PRODUCTION_ALIASES[alias];
    return activityId ? { kind: 'api', alias, activityId, suffix: apiMatch[2] || '' } : null;
  }

  return null;
}

export async function createProductionServer(options = {}) {
  const { server: engine, store } = await createServer(options);
  const gateway = http.createServer((req, res) => {
    const parsed = new URL(req.url, 'http://localhost');
    const route = resolveProductionRoute(parsed.pathname);

    if (req.method === 'GET' && route?.kind === 'surface') {
      const query = parsed.search || '';
      res.writeHead(302, {
        location: `/#/${route.surface}/${encodeURIComponent(route.activityId)}${query}`,
        'cache-control': 'no-store'
      });
      res.end();
      return;
    }

    if (route?.kind === 'api') {
      req.url = `/api/dei/activities/${encodeURIComponent(route.activityId)}${route.suffix}${parsed.search || ''}`;
    }

    engine.emit('request', req, res);
  });

  return { server: gateway, store, engine };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { server } = await createProductionServer();
  const port = Number(process.env.PORT || 3000);
  server.listen(port, '0.0.0.0', () => {
    console.log(`DEI production gateway listening on ${port} with ${Object.keys(PRODUCTION_ALIASES).length} public alias(es)`);
  });
}
