import { toast } from './api';
import { h } from './dom';
import { imageFiles, loadMedia, uploadFiles, type MediaItem } from './media';

const UPLOAD_ICON =
  '<svg viewBox="0 0 24 24"><path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/** Een dropzone die foto's uploadt. Gebruikt in de kiezer en op de fotopagina. */
export function dropzone(onUploaded: (items: MediaItem[]) => void): HTMLElement {
  const input = h('input', { type: 'file', accept: 'image/*', multiple: true, class: 'sr-only', tabindex: '-1' });
  const status = h('p', { class: 'dropzone-status', role: 'status' });
  const bar = h('span', { class: 'dropzone-bar' });
  const button = h('button', { type: 'button', class: 'btn btn-ghost btn-small', onclick: () => input.click() }, 'Kies foto’s');
  const icon = h('span', { class: 'dropzone-icon', 'aria-hidden': 'true' });
  icon.innerHTML = UPLOAD_ICON;
  const zone = h(
    'div',
    { class: 'dropzone' },
    icon,
    h('p', {}, h('strong', {}, 'Sleep foto’s hierheen'), ' of ', button),
    h('p', { class: 'dropzone-hint' }, 'Zoveel als je wil. We verkleinen ze automatisch.'),
    h('span', { class: 'dropzone-progress' }, bar),
    status,
    input,
  );

  const handle = async (files: File[]) => {
    if (!files.length) {
      toast('Dat zijn geen foto’s.', 'error');
      return;
    }
    zone.dataset.busy = 'true';
    const { items, failed } = await uploadFiles(files, ({ done, total }) => {
      status.textContent = done < total ? `Bezig: ${done + 1} van ${total}…` : `${total} verwerkt.`;
      bar.style.width = `${Math.round((done / total) * 100)}%`;
    });
    zone.dataset.busy = 'false';
    bar.style.width = '0';
    status.textContent = items.length ? `${items.length} ${items.length === 1 ? 'foto' : 'foto’s'} toegevoegd.` : '';
    failed.forEach((message) => toast(message, 'error'));
    if (items.length) onUploaded(items);
  };

  input.addEventListener('change', () => {
    void handle(imageFiles(input.files));
    input.value = '';
  });
  zone.addEventListener('dragover', (event) => {
    event.preventDefault();
    zone.dataset.over = 'true';
  });
  zone.addEventListener('dragleave', () => (zone.dataset.over = 'false'));
  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    zone.dataset.over = 'false';
    void handle(imageFiles(event.dataTransfer?.files));
  });
  return zone;
}

export function thumb(item: MediaItem, className = 'thumb'): HTMLImageElement {
  return h('img', { class: className, src: item.path, alt: item.alt, loading: 'lazy', decoding: 'async', width: item.width, height: item.height });
}

/** Opent de fotokiezer. Geeft de gekozen foto’s terug (leeg bij annuleren). */
export function openPicker(options: { multiple: boolean }): Promise<MediaItem[]> {
  return new Promise((resolve) => {
    const selected = new Map<string, MediaItem>();
    const grid = h('div', { class: 'picker-grid', role: 'list' });
    const count = h('span', { class: 'picker-count' });
    const confirm = h('button', { type: 'button', class: 'btn btn-primary', disabled: true }, 'Toevoegen');
    const selectAll = h('button', { type: 'button', class: 'btn btn-quiet' }, 'Alles selecteren');
    let loaded: MediaItem[] = [];
    const dialog = h('dialog', { class: 'picker', 'aria-labelledby': 'picker-title' });

    const finish = (items: MediaItem[]) => {
      dialog.close();
      dialog.remove();
      resolve(items);
    };
    const refresh = () => {
      count.textContent = options.multiple ? `${selected.size} geselecteerd` : '';
      confirm.disabled = selected.size === 0;
      const all = loaded.length > 0 && loaded.every((item) => selected.has(item.id));
      selectAll.textContent = all ? 'Niets selecteren' : 'Alles selecteren';
      selectAll.hidden = loaded.length === 0;
      grid.querySelectorAll<HTMLButtonElement>('[data-id]').forEach((button) => button.setAttribute('aria-pressed', String(selected.has(button.dataset.id ?? ''))));
    };
    const tile = (item: MediaItem) =>
      h(
        'button',
        {
          type: 'button',
          class: 'picker-item',
          role: 'listitem',
          'data-id': item.id,
          'aria-pressed': 'false',
          'aria-label': item.alt || 'Foto zonder beschrijving',
          onclick: () => {
            if (!options.multiple) return finish([item]);
            if (selected.has(item.id)) selected.delete(item.id);
            else selected.set(item.id, item);
            refresh();
          },
        },
        thumb(item),
        h('span', { class: 'picker-check', 'aria-hidden': 'true' }, '✓'),
      );
    const render = (items: MediaItem[]) => {
      loaded = items;
      grid.replaceChildren(...(items.length ? items.map(tile) : [h('p', { class: 'empty' }, 'Nog geen foto’s. Sleep er hierboven een paar in.')]));
      refresh();
    };

    const upload = dropzone(async (items) => {
      if (!options.multiple && items.length === 1) return finish(items);
      items.forEach((item) => selected.set(item.id, item));
      render(await loadMedia());
    });

    confirm.addEventListener('click', () => finish([...selected.values()]));
    selectAll.addEventListener('click', () => {
      const all = loaded.every((item) => selected.has(item.id));
      if (all) selected.clear();
      else loaded.forEach((item) => selected.set(item.id, item));
      refresh();
    });
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      finish([]);
    });
    dialog.append(
      h(
        'div',
        { class: 'picker-head' },
        h('h2', { id: 'picker-title' }, options.multiple ? 'Foto’s kiezen' : 'Foto kiezen'),
        h('button', { type: 'button', class: 'icon-button', 'aria-label': 'Sluiten', onclick: () => finish([]) }, '×'),
      ),
      upload,
      grid,
      h('div', { class: 'picker-foot' }, count, options.multiple ? selectAll : null, h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => finish([]) }, 'Annuleren'), options.multiple ? confirm : null),
    );
    document.body.append(dialog);
    dialog.showModal();
    grid.append(h('p', { class: 'empty' }, 'Foto’s laden…'));
    void loadMedia().then(render);
  });
}
