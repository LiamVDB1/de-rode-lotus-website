type Child = Node | string | number | null | undefined | false;
type AttrValue = string | number | boolean | null | undefined | ((event: Event) => void);

/** Kleine helper om DOM op te bouwen. `onclick` e.d. worden event listeners; tekst wordt nooit als HTML gelezen. */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, AttrValue> = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (typeof value === 'function') element.addEventListener(name.replace(/^on/, ''), value);
    else if (value === true) element.setAttribute(name, '');
    else if (value !== false && value !== null && value !== undefined) element.setAttribute(name, String(value));
  }
  element.append(...children.filter((child): child is Node | string | number => child !== null && child !== undefined && child !== false).map((child) => (typeof child === 'number' ? String(child) : child)));
  return element;
}

export type Path = (string | number)[];

export function getIn(value: unknown, path: Path): unknown {
  return path.reduce<unknown>((current, key) => (current == null ? undefined : (current as Record<string | number, unknown>)[key]), value);
}

/** Geeft een nieuwe structuur terug met de waarde op `path` vervangen; de oude blijft ongewijzigd. */
export function setIn<T>(value: T, path: Path, next: unknown): T {
  if (path.length === 0) return next as T;
  const [head, ...rest] = path;
  const current = (value as Record<string | number, unknown>)?.[head];
  if (Array.isArray(value)) return value.map((item, index) => (index === head ? setIn(item, rest, next) : item)) as T;
  return { ...(value as object), [head]: setIn(current, rest, next) } as T;
}

export function pathKey(path: Path): string {
  return path.join('.');
}

let counter = 0;
export function uid(prefix = 'veld'): string {
  counter += 1;
  return `${prefix}-${counter}`;
}
