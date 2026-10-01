import { getIn, h, type Path } from './dom';

/** Lege tekst en ontbrekende waarden tellen als hetzelfde; sleutelvolgorde speelt geen rol. */
function normalize(value: unknown): unknown {
  if (value === '' || value === null || value === undefined) return undefined;
  if (Array.isArray(value)) return value.map(normalize);
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, child]) => [key, normalize(child)] as const)
      .filter(([, child]) => child !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    return Object.fromEntries(entries);
  }
  return value;
}

export function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}

const toPath = (key: string): Path => key.split('.').map((part) => (/^\d+$/.test(part) ? Number(part) : part));

/** Lijsten als geheel: enkel gemarkeerd als er items bij of af zijn. De items zelf krijgen hun eigen label. */
const CONTAINERS = '.list-field, .blocks-field, .gallery-field';
/** Waar het label komt, per soort veld. */
const ANCHORS = ':scope > label, :scope > .label, :scope > .label-row > label, :scope > .switch, :scope > .item-head .item-label, :scope > .block-head .block-type, :scope > .list-head h3, :scope > .list-head h4';

function isChanged(holder: HTMLElement, current: unknown, published: unknown): boolean {
  const path = toPath(holder.dataset.field ?? '');
  const now = getIn(current, path);
  const before = getIn(published, path);
  if (holder.matches(CONTAINERS)) return (Array.isArray(now) ? now.length : 0) !== (Array.isArray(before) ? before.length : 0);
  return !sameValue(now, before);
}

/** Zet "gewijzigd" bij elk veld dat verschilt van wat nu op de website staat. */
export function markChanges(form: HTMLElement, current: unknown, published: unknown): void {
  form.querySelectorAll<HTMLElement>('[data-field]').forEach((holder) => {
    const changed = isChanged(holder, current, published);
    if (changed === (holder.dataset.changed === 'true')) return;
    holder.dataset.changed = String(changed);
    const anchor = holder.querySelector<HTMLElement>(ANCHORS);
    const badge = anchor?.querySelector(':scope > .field-changed');
    if (!changed) badge?.remove();
    else if (anchor && !badge) anchor.append(h('span', { class: 'field-changed', title: 'Anders dan wat nu op de website staat' }, 'gewijzigd'));
  });
}
