export const PUBLIC_ALIASES = Object.freeze({
  dei01: 'b1141-w2-who-dopes-dei',
  dei02: 'b1141-w9-disclosure-sequence-dei'
});

export function resolvePublicAlias(pathname) {
  const match = String(pathname || '').match(/^\/(dei\d{2})\/?$/i);
  if (!match) return null;
  const alias = match[1].toLowerCase();
  return PUBLIC_ALIASES[alias] ? { alias, activityId: PUBLIC_ALIASES[alias] } : null;
}
