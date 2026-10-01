import type { Field } from '../../lib/editor-spec';
import { getIn, h, pathKey, uid, type Path } from './dom';
import { openPicker } from './picker';

/** Wat een veld nodig heeft van de editor. */
export interface Context {
  get(path: Path): unknown;
  set(path: Path, value: unknown): void;
  /** Na een structuurwijziging (toevoegen, verplaatsen, verwijderen) het formulier opnieuw opbouwen. */
  rebuild(focusKey?: string): void;
  isOpen(key: string): boolean;
  setOpen(key: string, open: boolean): void;
  /** Na het vervangen van één veld de "gewijzigd"-labels opnieuw zetten. */
  refreshMarks(): void;
}

/** De lijst zoals ze nu is. Niet de kopie van bij het tekenen: die mist wat je sindsdien typte. */
const latest = <T>(ctx: Context, path: Path) => ((ctx.get(path) as T[] | undefined) ?? []);

const str = (value: unknown) => (typeof value === 'string' ? value : '');

function wrapper(path: Path, className: string, ...children: (Node | null)[]): HTMLElement {
  return h('div', { class: `field ${className}`, 'data-field': pathKey(path) }, ...children);
}

function helpText(id: string, help?: string): HTMLElement | null {
  return help ? h('p', { class: 'help', id }, help) : null;
}

function textField(field: Extract<Field, { kind: 'text' | 'date' }>, path: Path, ctx: Context): HTMLElement {
  const id = uid();
  const input = h('input', {
    id,
    type: field.kind === 'date' ? 'date' : 'text',
    value: str(ctx.get(path)),
    maxlength: field.kind === 'text' ? field.max : undefined,
    placeholder: field.kind === 'text' ? field.placeholder : undefined,
    'data-path': pathKey(path),
    'aria-describedby': field.help ? `${id}-help` : undefined,
    spellcheck: field.kind === 'text' && /url|email|slug|phone|iban|bic/i.test(field.name) ? 'false' : undefined,
    oninput: (event) => ctx.set(path, (event.target as HTMLInputElement).value),
  });
  const wide = field.kind === 'text' && field.wide ? ' wide' : '';
  return wrapper(path, `field-text${wide}`, h('label', { for: id }, field.label), helpText(`${id}-help`, field.help), input);
}

function textareaField(field: Extract<Field, { kind: 'textarea' }>, path: Path, ctx: Context): HTMLElement {
  const id = uid();
  const counter = h('span', { class: 'counter', 'aria-hidden': 'true' });
  const update = (value: string) => {
    counter.textContent = field.max ? `${value.length}/${field.max}` : '';
    counter.dataset.full = String(Boolean(field.max && value.length > field.max * 0.9));
  };
  const area = h('textarea', {
    id,
    rows: field.rows ?? 4,
    maxlength: field.max,
    'data-path': pathKey(path),
    'aria-describedby': field.help ? `${id}-help` : undefined,
    oninput: (event) => {
      const value = (event.target as HTMLTextAreaElement).value;
      ctx.set(path, value);
      update(value);
    },
  });
  area.value = str(ctx.get(path));
  update(area.value);
  return wrapper(path, 'field-textarea wide', h('div', { class: 'label-row' }, h('label', { for: id }, field.label), counter), helpText(`${id}-help`, field.help), area);
}

function toggleField(field: Extract<Field, { kind: 'toggle' }>, path: Path, ctx: Context): HTMLElement {
  const id = uid();
  const input = h('input', {
    id,
    type: 'checkbox',
    role: 'switch',
    'data-path': pathKey(path),
    'aria-describedby': field.help ? `${id}-help` : undefined,
    onchange: (event) => ctx.set(path, (event.target as HTMLInputElement).checked),
  });
  input.checked = ctx.get(path) === true;
  return wrapper(path, 'field-toggle wide', h('label', { class: 'switch', for: id }, input, h('span', { class: 'switch-track', 'aria-hidden': 'true' }), h('span', {}, field.label)), helpText(`${id}-help`, field.help));
}

function amountsField(field: Extract<Field, { kind: 'amounts' }>, path: Path, ctx: Context): HTMLElement {
  const id = uid();
  const current = ctx.get(path);
  const hint = h('p', { class: 'field-error', hidden: true });
  const input = h('input', {
    id,
    type: 'text',
    inputmode: 'numeric',
    value: Array.isArray(current) ? current.join(', ') : '',
    'data-path': pathKey(path),
    'aria-describedby': `${id}-help`,
    oninput: (event) => {
      const parts = (event.target as HTMLInputElement).value.split(/[,;\s]+/).filter(Boolean);
      const numbers = parts.map((part) => Number(part.replace(/[€]/g, '')));
      const valid = numbers.filter((number) => Number.isInteger(number) && number >= 1 && number <= 10000);
      hint.hidden = valid.length === numbers.length;
      hint.textContent = 'Gebruik hele bedragen tussen 1 en 10 000, gescheiden door komma’s.';
      ctx.set(path, valid);
    },
  });
  return wrapper(path, 'field-text', h('label', { for: id }, field.label), helpText(`${id}-help`, field.help), input, hint);
}

function photoField(field: Extract<Field, { kind: 'photo' }>, path: Path, ctx: Context): HTMLElement {
  const altPath = [...path.slice(0, -1), field.altName];
  const id = uid();
  const src = str(ctx.get(path));
  const rerender = (element: HTMLElement) => {
    element.replaceWith(photoField(field, path, ctx));
    ctx.refreshMarks();
  };

  const choose = async () => {
    const [item] = await openPicker({ multiple: false });
    if (!item) return;
    ctx.set(path, item.path);
    if (!str(ctx.get(altPath))) ctx.set(altPath, item.alt);
    rerender(element);
  };
  const preview = src
    ? h('button', { type: 'button', class: 'photo-preview', onclick: choose, 'aria-label': `${field.label}: andere foto kiezen` }, h('img', { src, alt: '', loading: 'lazy' }))
    : h('button', { type: 'button', class: 'photo-preview empty', onclick: choose }, h('span', {}, '+'), h('small', {}, 'Foto kiezen'));
  const alt = h('input', {
    id,
    type: 'text',
    maxlength: 200,
    value: str(ctx.get(altPath)),
    placeholder: 'Bv. Vrijwilligers sorteren kledij',
    'data-path': pathKey(altPath),
    oninput: (event) => ctx.set(altPath, (event.target as HTMLInputElement).value),
  });

  const element = wrapper(
    path,
    'field-photo wide',
    h('span', { class: 'label' }, field.label),
    helpText(`${id}-help`, field.help),
    h(
      'div',
      { class: 'photo-row' },
      preview,
      h(
        'div',
        { class: 'photo-side' },
        h(
          'div',
          { class: 'photo-buttons' },
          h('button', { type: 'button', class: 'btn btn-ghost btn-small', onclick: choose }, src ? 'Andere foto' : 'Foto kiezen'),
          src
            ? h('button', { type: 'button', class: 'btn btn-quiet btn-small', onclick: () => { ctx.set(path, ''); ctx.set(altPath, ''); rerender(element); } }, 'Weghalen')
            : null,
        ),
        src ? h('label', { for: id }, 'Wat staat er op de foto?') : null,
        src ? alt : null,
      ),
    ),
    h('span', { 'data-path': pathKey(path), hidden: true }),
  );
  return element;
}

function moveButtons(list: unknown[], index: number, path: Path, ctx: Context, noun: string): HTMLElement {
  const move = (to: number) => {
    const next = [...latest(ctx, path)];
    const [item] = next.splice(index, 1);
    next.splice(to, 0, item);
    const moved = [...path, to];
    ctx.set(path, next);
    ctx.setOpen(pathKey(moved), ctx.isOpen(pathKey([...path, index])));
    ctx.rebuild(`${to < index ? 'up' : 'down'}:${pathKey(moved)}`);
  };
  const remove = () => {
    if (!window.confirm(`${noun} verwijderen? Dit kan je ongedaan maken zolang je niet opslaat, door de pagina te herladen.`)) return;
    ctx.set(path, latest(ctx, path).filter((_, position) => position !== index));
    ctx.rebuild();
  };
  const key = pathKey([...path, index]);
  return h(
    'div',
    { class: 'item-actions' },
    h('button', { type: 'button', class: 'icon-button', 'aria-label': `${noun} omhoog`, 'data-focus': `up:${key}`, disabled: index === 0, onclick: () => move(index - 1) }, '↑'),
    h('button', { type: 'button', class: 'icon-button', 'aria-label': `${noun} omlaag`, 'data-focus': `down:${key}`, disabled: index === list.length - 1, onclick: () => move(index + 1) }, '↓'),
    h('button', { type: 'button', class: 'icon-button danger', 'aria-label': `${noun} verwijderen`, onclick: remove }, '×'),
  );
}

function listField(field: Extract<Field, { kind: 'list' }>, path: Path, ctx: Context): HTMLElement {
  const list = (ctx.get(path) as Record<string, unknown>[] | undefined) ?? [];
  const items = list.map((item, index) => {
    const itemPath = [...path, index];
    const key = pathKey(itemPath);
    const open = ctx.isOpen(key);
    const bodyId = uid('item');
    const name = str(item[field.titleField]);
    const title = h('span', { class: 'item-title', 'data-title': pathKey([...itemPath, field.titleField]) }, name || `Nieuwe ${field.itemLabel.toLowerCase()}`);
    const subtitle = field.subtitleField ? str(item[field.subtitleField]) : '';
    const photo = field.photoField ? str(item[field.photoField]) : '';
    const avatar = field.photoField
      ? photo
        ? h('img', { class: 'item-avatar', src: photo, alt: '', loading: 'lazy' })
        : h('span', { class: 'item-avatar', 'aria-hidden': 'true' }, (name.trim()[0] ?? '?').toUpperCase())
      : h('span', { class: 'item-number' }, String(index + 1));
    const body = h('div', { class: 'item-body', id: bodyId, hidden: !open }, ...field.fields.map((child) => renderField(child, itemPath, ctx)));
    const toggle = h(
      'button',
      {
        type: 'button',
        class: 'item-toggle',
        'aria-expanded': String(open),
        'aria-controls': bodyId,
        onclick: () => {
          const next = body.hidden;
          body.hidden = !next;
          toggle.setAttribute('aria-expanded', String(next));
          ctx.setOpen(key, next);
        },
      },
      h('span', { class: 'chevron', 'aria-hidden': 'true' }),
      avatar,
      h('span', { class: 'item-label' }, title, subtitle ? h('small', { class: 'item-subtitle' }, subtitle) : null),
    );
    return h('li', { class: 'list-item', 'data-field': key }, h('div', { class: 'item-head' }, toggle, moveButtons(list, index, path, ctx, field.itemLabel)), body);
  });

  const add = () => {
    const current = latest(ctx, path);
    const nextPath = [...path, current.length];
    ctx.set(path, [...current, structuredClone(field.newItem)]);
    ctx.setOpen(pathKey(nextPath), true);
    ctx.rebuild(`first:${pathKey(nextPath)}`);
  };
  // Bij lange lijsten ook bovenaan een knop, zodat je niet eerst helemaal moet scrollen.
  const topAdd = items.length >= 4 ? h('button', { type: 'button', class: 'btn btn-primary btn-small', onclick: add }, `+ ${field.addLabel}`) : null;
  return h(
    'section',
    { class: 'list-field', 'data-field': pathKey(path) },
    h('div', { class: 'list-head' }, h('div', {}, h('h3', {}, `${field.label}${items.length ? ` (${items.length})` : ''}`), field.help ? h('p', { class: 'help' }, field.help) : null), topAdd),
    items.length ? h('ol', { class: 'list-items' }, ...items) : h('p', { class: 'empty' }, 'Nog niets toegevoegd.'),
    h('button', { type: 'button', class: 'btn btn-ghost add-button', onclick: add }, `+ ${field.addLabel}`),
  );
}

const MAX_GALLERY_PHOTOS = 200;

function galleryField(path: Path, ctx: Context): HTMLElement {
  const photos = (ctx.get(path) as { src: string; alt: string }[] | undefined) ?? [];
  const add = async () => {
    const picked = await openPicker({ multiple: true });
    const current = latest<{ src: string; alt: string }>(ctx, path);
    const present = new Set(current.map((photo) => photo.src));
    const fresh = picked.filter((item) => !present.has(item.path));
    if (!fresh.length) return;
    const room = Math.max(0, MAX_GALLERY_PHOTOS - current.length);
    ctx.set(path, [...current, ...fresh.slice(0, room).map((item) => ({ src: item.path, alt: item.alt }))]);
    ctx.rebuild();
  };
  const tiles = photos.map((photo, index) => {
    const id = uid();
    return h(
      'li',
      { class: 'gallery-tile', 'data-field': pathKey([...path, index]) },
      h('img', { src: photo.src, alt: '', loading: 'lazy' }),
      h('label', { class: 'sr-only', for: id }, `Beschrijving foto ${index + 1}`),
      h('input', { id, type: 'text', maxlength: 200, value: photo.alt, placeholder: 'Beschrijving', 'data-path': pathKey([...path, index, 'alt']), oninput: (event) => ctx.set([...path, index, 'alt'], (event.target as HTMLInputElement).value) }),
      moveButtons(photos, index, path, ctx, 'Foto'),
    );
  });
  return h(
    'div',
    { class: 'gallery-field', 'data-field': pathKey(path) },
    tiles.length ? h('ul', { class: 'gallery-grid' }, ...tiles) : null,
    h('button', { type: 'button', class: 'btn btn-ghost btn-small', onclick: add }, tiles.length ? '+ Meer foto’s' : '+ Foto’s toevoegen'),
  );
}

const BLOCK_TYPES = {
  text: { label: 'Tekst', create: () => ({ type: 'text', heading: '', text: '' }) },
  photos: { label: 'Foto’s', create: () => ({ type: 'photos', heading: '', photos: [] }) },
} as const;

function blocksField(field: Extract<Field, { kind: 'blocks' }>, path: Path, ctx: Context): HTMLElement {
  const blocks = (ctx.get(path) as { type: keyof typeof BLOCK_TYPES }[] | undefined) ?? [];
  const items = blocks.map((block, index) => {
    const blockPath = [...path, index];
    const body =
      block.type === 'text'
        ? [
            renderField({ kind: 'text', name: 'heading', label: 'Tussentitel (mag leeg)', max: 120, wide: true }, blockPath, ctx),
            renderField({ kind: 'textarea', name: 'text', label: 'Tekst', rows: 6, max: 4000, help: 'Laat een lege regel tussen twee alinea’s.' }, blockPath, ctx),
          ]
        : [renderField({ kind: 'text', name: 'heading', label: 'Tussentitel (mag leeg)', max: 120, wide: true }, blockPath, ctx), galleryField([...blockPath, 'photos'], ctx)];
    return h(
      'li',
      { class: `block block-${block.type}`, 'data-field': pathKey(blockPath) },
      h('div', { class: 'block-head' }, h('span', { class: 'block-type' }, BLOCK_TYPES[block.type]?.label ?? block.type), moveButtons(blocks, index, path, ctx, 'Blok')),
      h('div', { class: 'block-body' }, ...body),
    );
  });
  const add = (type: keyof typeof BLOCK_TYPES) => {
    const current = latest(ctx, path);
    ctx.set(path, [...current, BLOCK_TYPES[type].create()]);
    ctx.rebuild(`first:${pathKey([...path, current.length])}`);
  };
  return h(
    'section',
    { class: 'blocks-field wide', 'data-field': pathKey(path) },
    h('div', { class: 'list-head' }, h('h4', {}, field.label), field.help ? h('p', { class: 'help' }, field.help) : null),
    items.length ? h('ol', { class: 'blocks' }, ...items) : h('p', { class: 'empty' }, 'Nog geen inhoud voor de detailpagina.'),
    h('div', { class: 'block-add' }, h('button', { type: 'button', class: 'btn btn-ghost btn-small', onclick: () => add('text') }, '+ Tekst met tussentitel'), h('button', { type: 'button', class: 'btn btn-ghost btn-small', onclick: () => add('photos') }, '+ Foto’s')),
  );
}

export function renderField(field: Field, parent: Path, ctx: Context): HTMLElement {
  if (field.kind === 'group') {
    return h(
      'section',
      { class: 'card group' },
      h('div', { class: 'group-head' }, h('h2', {}, field.label), field.help ? h('p', { class: 'help' }, field.help) : null),
      h('div', { class: 'group-fields' }, ...field.fields.map((child) => renderField(child, parent, ctx))),
    );
  }
  const path = [...parent, field.name];
  switch (field.kind) {
    case 'text':
    case 'date':
      return textField(field, path, ctx);
    case 'textarea':
      return textareaField(field, path, ctx);
    case 'toggle':
      return toggleField(field, path, ctx);
    case 'amounts':
      return amountsField(field, path, ctx);
    case 'photo':
      return photoField(field, path, ctx);
    case 'list':
      return listField(field, path, ctx);
    case 'blocks':
      return blocksField(field, path, ctx);
  }
}

export { getIn };
