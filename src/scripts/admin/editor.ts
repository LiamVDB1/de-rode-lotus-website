import type { DocumentEditor } from '../../lib/editor-spec';
import { api, toast, type Issue } from './api';
import { getIn, h, pathKey, setIn, type Path } from './dom';
import { renderField, type Context } from './fields';

interface Boot {
  editor: DocumentEditor;
  value: unknown;
  hasDraft: boolean;
}

function readBoot(): Boot | null {
  const script = document.getElementById('editor-data');
  if (!script?.textContent) return null;
  try {
    return JSON.parse(script.textContent) as Boot;
  } catch {
    return null;
  }
}

/** Activiteiten en vragen zijn lijsten; in het formulier bewerken we ze als { items }. */
const wrap = (editor: DocumentEditor, value: unknown) => (editor.rootList ? { items: value } : value);
const unwrap = (editor: DocumentEditor, value: unknown) => (editor.rootList ? (value as { items: unknown }).items : value);
const issuePath = (editor: DocumentEditor, path: string) => (editor.rootList ? (path ? `items.${path}` : 'items') : path);

function start(boot: Boot): void {
  const { editor } = boot;
  const form = document.querySelector<HTMLFormElement>('[data-editor]');
  const status = document.querySelector<HTMLElement>('[data-save-status]');
  const saveButton = document.querySelector<HTMLButtonElement>('[data-save]');
  const revertButton = document.querySelector<HTMLButtonElement>('[data-revert]');
  const errorBox = document.querySelector<HTMLElement>('[data-errors]');
  if (!form || !status || !saveButton || !errorBox) return;

  let value = wrap(editor, boot.value);
  let saved = JSON.stringify(value);
  let hasDraft = boot.hasDraft;
  let saving = false;
  const open = new Set<string>();

  const setStatus = (text: string, tone: 'idle' | 'dirty' | 'busy' | 'ok' | 'error') => {
    status.textContent = text;
    status.dataset.tone = tone;
  };
  const refreshDirty = () => {
    const dirty = JSON.stringify(value) !== saved;
    document.body.dataset.dirty = String(dirty);
    saveButton.disabled = !dirty || saving;
    if (revertButton) revertButton.hidden = !hasDraft || dirty;
    if (!saving) setStatus(dirty ? 'Niet opgeslagen wijzigingen' : hasDraft ? 'Opgeslagen als ontwerp, nog niet gepubliceerd' : 'Alles is gepubliceerd', dirty ? 'dirty' : hasDraft ? 'ok' : 'idle');
  };

  const clearErrors = () => {
    form.querySelectorAll('.has-error').forEach((element) => element.classList.remove('has-error'));
    form.querySelectorAll('.field-message').forEach((element) => element.remove());
    form.querySelectorAll('[aria-invalid]').forEach((element) => element.removeAttribute('aria-invalid'));
    errorBox.hidden = true;
    errorBox.replaceChildren();
  };

  const showErrors = (issues: Issue[]) => {
    clearErrors();
    let first: HTMLElement | null = null;
    const loose: Issue[] = [];
    for (const issue of issues) {
      const path = issuePath(editor, issue.path);
      // Open de lijstitems waarin de fout zit, anders zie je ze niet.
      const parts = path.split('.');
      parts.forEach((_, index) => open.add(parts.slice(0, index + 1).join('.')));
      const target = form.querySelector<HTMLElement>(`[data-path="${CSS.escape(path)}"]`) ?? form.querySelector<HTMLElement>(`[data-field="${CSS.escape(path)}"]`);
      if (!target) loose.push(issue);
    }
    rebuild();
    for (const issue of issues) {
      const path = issuePath(editor, issue.path);
      const input = form.querySelector<HTMLElement>(`[data-path="${CSS.escape(path)}"]`);
      const holder = input?.closest<HTMLElement>('[data-field]') ?? form.querySelector<HTMLElement>(`[data-field="${CSS.escape(path)}"]`);
      if (!holder) continue;
      holder.classList.add('has-error');
      input?.setAttribute('aria-invalid', 'true');
      holder.append(h('p', { class: 'field-message' }, issue.message));
      first ??= input && !input.hidden ? input : holder;
    }
    const count = issues.length;
    errorBox.append(h('strong', {}, count === 1 ? 'Eén ding klopt nog niet.' : `${count} dingen kloppen nog niet.`), ' Ze zijn in het rood aangeduid.');
    if (loose.length) errorBox.append(h('ul', {}, ...loose.map((issue) => h('li', {}, issue.message))));
    errorBox.hidden = false;
    first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (first instanceof HTMLInputElement || first instanceof HTMLTextAreaElement) first.focus({ preventScroll: true });
  };

  const ctx: Context = {
    get: (path: Path) => getIn(value, path),
    set: (path: Path, next: unknown) => {
      value = setIn(value, path, next);
      // Houd de titel van een ingeklapt lijstitem in sync met wat je typt.
      const title = form.querySelector<HTMLElement>(`[data-title="${CSS.escape(pathKey(path))}"]`);
      if (title && typeof next === 'string') title.textContent = next || title.textContent;
      refreshDirty();
    },
    rebuild: (focusKey?: string) => rebuild(focusKey),
    isOpen: (key: string) => open.has(key),
    setOpen: (key: string, isOpen: boolean) => (isOpen ? open.add(key) : open.delete(key)),
  };

  function rebuild(focusKey?: string): void {
    const scroll = window.scrollY;
    form!.replaceChildren(...editor.fields.map((field) => renderField(field, [], ctx)));
    window.scrollTo({ top: scroll });
    if (!focusKey) return;
    const [kind, key] = focusKey.split(/:(.*)/s);
    if (kind === 'first') {
      const holder = form!.querySelector<HTMLElement>(`[data-field="${CSS.escape(key)}"]`);
      holder?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      holder?.querySelector<HTMLElement>('input, textarea')?.focus({ preventScroll: true });
    } else {
      const button = form!.querySelector<HTMLButtonElement>(`[data-focus="${CSS.escape(focusKey)}"]`);
      (button && !button.disabled ? button : form!.querySelector<HTMLButtonElement>(`[data-focus$="${CSS.escape(`:${key}`)}"]:not(:disabled)`))?.focus();
    }
  }

  const save = async () => {
    if (saving || JSON.stringify(value) === saved) return;
    saving = true;
    saveButton.disabled = true;
    setStatus('Opslaan…', 'busy');
    const snapshot = value;
    const result = await api('PUT', `/beheer/api/inhoud/${editor.key}`, unwrap(editor, snapshot), { quiet: true });
    saving = false;
    if (result.ok) {
      saved = JSON.stringify(snapshot);
      hasDraft = true;
      clearErrors();
      refreshDirty();
      toast('Opgeslagen. Bekijk het voorbeeld of publiceer wanneer je klaar bent.', 'success');
      document.dispatchEvent(new CustomEvent('lotus:saved', { detail: { key: editor.key } }));
      return;
    }
    refreshDirty();
    setStatus('Niet opgeslagen', 'error');
    if (result.issues?.length) showErrors(result.issues);
    else toast(result.message, 'error');
  };

  const revert = async () => {
    if (!window.confirm('Alle wijzigingen die nog niet gepubliceerd zijn weggooien? Je krijgt terug wat nu op de website staat.')) return;
    const result = await api('DELETE', `/beheer/api/inhoud/${editor.key}`);
    if (!result.ok) return;
    document.body.dataset.dirty = 'false';
    sessionStorage.setItem('lotus-toast', 'Teruggezet naar de gepubliceerde versie.');
    location.reload();
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void save();
  });
  saveButton.addEventListener('click', () => void save());
  revertButton?.addEventListener('click', () => void revert());
  window.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      void save();
    }
  });
  window.addEventListener('beforeunload', (event) => {
    if (document.body.dataset.dirty === 'true') event.preventDefault();
  });

  rebuild();
  refreshDirty();
  addFromLink();

  /** `?nieuw=<lijst>` (bv. vanaf het overzicht) voegt meteen een leeg item toe en opent het. */
  function addFromLink(): void {
    const name = new URLSearchParams(location.search).get('nieuw');
    const field = editor.fields.find((candidate) => candidate.kind === 'list' && candidate.name === name);
    if (!field || field.kind !== 'list') return;
    history.replaceState(null, '', location.pathname);
    const list = (getIn(value, [field.name]) as unknown[] | undefined) ?? [];
    const key = pathKey([field.name, list.length]);
    ctx.set([field.name], [...list, structuredClone(field.newItem)]);
    ctx.setOpen(key, true);
    rebuild(`first:${key}`);
  }
}

const boot = readBoot();
if (boot) start(boot);
