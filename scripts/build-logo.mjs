/**
 * Genereert het lotuslogo (src/components/Logo.astro en public/favicon.svg) uit één definitie,
 * blaadje per blaadje nagetekend van het originele logo van De Rode Lotus: een volle rode lotus
 * met een groot middenblaadje, puntige blaadjes erachter, brede blaadjes die opzij uitwaaieren,
 * twee liggende blaadjes vooraan en een kelkblaadje eronder.
 *
 * Elk blaadje is een met de hand geplaatst pad in de pixelcoördinaten van het referentiebeeld
 * (972×648, spiegelas op x=490); bij het schrijven wordt alles door 10 gedeeld. Linkerblaadjes
 * worden gespiegeld voor de rechterkant. Volgorde in PETALS = tekenvolgorde (achter naar voor).
 *
 * Gebruik: node scripts/build-logo.mjs
 */
import { writeFile } from 'node:fs/promises';

const AXIS = 490; // spiegelas in referentiepixels
const S = 10; // referentiepixels per svg-eenheid

/**
 * d: omtrek (start op de punt), tip/base: punt en voet (voor verloop en nerven),
 * tone: kleurstelling, mirror: ook gespiegeld tekenen.
 */
const PETALS = [
  // Achterste rij
  {
    id: 'A', tone: 'back', mirror: false, tip: [490, 38], base: [490, 340],
    d: 'M490,38 C470,62 432,112 412,165 C396,215 398,290 435,340 L545,340 C582,290 584,215 568,165 C548,112 510,62 490,38 Z',
  },
  {
    id: 'B', tone: 'back', tip: [318, 86], base: [470, 400],
    d: 'M318,86 C350,104 390,135 412,168 C440,220 458,300 470,400 C420,395 350,340 318,270 C295,220 298,140 318,86 Z',
  },
  {
    id: 'C', tone: 'back', tip: [236, 128], base: [468, 430],
    d: 'M236,128 C270,140 306,168 330,205 C380,270 440,360 468,430 C400,400 300,320 262,260 C240,220 232,170 236,128 Z',
  },
  {
    id: 'D', tone: 'mid', tip: [366, 164], base: [478, 430],
    d: 'M366,164 C395,190 425,240 445,300 C462,345 472,390 478,430 C440,400 380,340 345,290 C325,250 335,200 366,164 Z',
  },
  // Zijblaadjes
  {
    id: 'F', tone: 'side', tip: [45, 290], base: [440, 500],
    d: 'M45,290 C110,300 190,330 260,370 C340,415 410,460 440,500 C370,505 260,485 170,455 C110,435 60,380 45,290 Z',
  },
  {
    id: 'E', tone: 'mid', tip: [137, 157], base: [440, 470],
    d: 'M137,157 C190,180 250,220 300,275 C360,340 410,410 440,470 C370,470 270,430 205,385 C160,350 135,270 137,157 Z',
  },
  {
    id: 'G', tone: 'low', tip: [30, 462], base: [420, 522],
    d: 'M30,462 C100,452 200,455 300,480 C350,495 400,510 420,522 C340,536 240,536 150,522 C90,512 45,490 30,462 Z',
  },
  // Voorste rij
  {
    id: 'H', tone: 'front', tip: [266, 184], base: [455, 520],
    d: 'M266,184 C315,225 370,290 410,360 C440,415 455,470 455,520 C390,520 320,485 285,430 C245,370 240,270 266,184 Z',
  },
  {
    id: 'I', tone: 'heart', mirror: false, tip: [490, 155], base: [490, 538],
    d: 'M490,155 C530,190 578,255 592,330 C606,405 602,485 570,525 C550,540 430,540 410,525 C378,485 374,405 388,330 C402,255 450,190 490,155 Z',
  },
  // Kelkblaadje onder de bloem (zit onder de liggende blaadjes)
  {
    id: 'K', tone: 'sepal', mirror: false, tip: [490, 604], base: [490, 520],
    d: 'M490,604 C466,586 452,560 452,520 L528,520 C528,560 514,586 490,604 Z',
  },
  {
    id: 'J', tone: 'lying', tip: [165, 470], base: [475, 525],
    d: 'M165,470 C230,448 330,438 410,458 C445,468 468,495 475,525 C450,560 380,568 310,560 C240,548 195,515 165,470 Z',
  },
];

/** Verloopstops [positie van voet (0) naar punt (1), kleur] per toon, gesampled uit het origineel. */
const TONES = {
  back: [[0, '#120103'], [0.2, '#3a0608'], [0.4, '#c01a18'], [0.6, '#e8261e'], [1, '#ee2c22']],
  mid: [[0, '#120103'], [0.12, '#2a0406'], [0.22, '#4c0709'], [0.32, '#b31716'], [0.45, '#ef251f'], [1, '#f02a20']],
  side: [[0, '#120103'], [0.35, '#2a0406'], [0.5, '#8f120d'], [0.62, '#f32b23'], [1, '#d81c1a']],
  low: [[0, '#120103'], [0.5, '#2a0406'], [0.7, '#4a0808'], [0.85, '#9a1512'], [1, '#c41c18']],
  front: [[0, '#120103'], [0.28, '#2a0205'], [0.4, '#7b0d0f'], [0.52, '#e9241d'], [1, '#f42a1d']],
  heart: [[0, '#140506'], [0.2, '#23090c'], [0.35, '#6e1213'], [0.5, '#ac1a19'], [0.62, '#e2231c'], [1, '#f7301f']],
  lying: [[0, '#3a0608'], [0.15, '#8e1210'], [0.3, '#b61712'], [0.42, '#e9271e'], [1, '#f22d26']],
  sepal: [[0, '#120103'], [0.3, '#4a0808'], [0.7, '#c02426'], [1, '#d02a2a']],
};

const SHADOW = '#1a0204';
const RIM = '#ffd8cc';
const VEIN = '#6d070c';

const r = (v) => Number(v.toFixed(1));

/** Zet een referentiepad om naar svg-eenheden, optioneel gespiegeld. */
function convertPath(d, flip) {
  return d
    .replace(/\s+/g, ' ')
    .replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => {
      const px = flip ? 2 * AXIS - Number(x) : Number(x);
      return `${r(px / S)} ${r(Number(y) / S)}`;
    })
    .replace(/ ([MCLZ])/g, '$1');
}

const pt = ([x, y], flip) => [r((flip ? 2 * AXIS - x : x) / S), r(y / S)];

/** Nerven: waaier van fijne lijnen van de voet naar de punt. */
function veins(tip, base, flip, halfWidth, count) {
  const [tx, ty] = pt(tip, flip);
  const [bx, by] = pt(base, flip);
  const len = Math.hypot(tx - bx, ty - by);
  const ux = (tx - bx) / len;
  const uy = (ty - by) / len;
  const nx = -uy;
  const ny = ux;
  const parts = [];
  for (let i = 0; i < count; i += 1) {
    const f = (i / (count - 1)) * 2 - 1;
    const s = [bx + ux * len * 0.08 + nx * f * halfWidth * 0.1, by + uy * len * 0.08 + ny * f * halfWidth * 0.1];
    const m = [bx + ux * len * 0.5 + nx * f * halfWidth * 0.62, by + uy * len * 0.5 + ny * f * halfWidth * 0.62];
    const e = [bx + ux * len * 0.9 + nx * f * halfWidth * 0.36, by + uy * len * 0.9 + ny * f * halfWidth * 0.36];
    parts.push(`M${r(s[0])} ${r(s[1])}Q${r(m[0])} ${r(m[1])} ${r(e[0])} ${r(e[1])}`);
  }
  return parts.join('');
}

/** Ruwe halve breedte van een blaadje (grootste afstand van de omtrekpunten tot de as). */
function halfWidth(p) {
  const [tx, ty] = p.tip;
  const [bx, by] = p.base;
  const len = Math.hypot(tx - bx, ty - by);
  const nx = -(ty - by) / len;
  const ny = (tx - bx) / len;
  let max = 0;
  for (const [, x, y] of p.d.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)) {
    max = Math.max(max, Math.abs((Number(x) - bx) * nx + (Number(y) - by) * ny));
  }
  return (max * 0.8) / S;
}

function petal(p, prefix, flip) {
  const pid = `${prefix}${p.id}${flip ? 'r' : ''}`;
  const [tx, ty] = pt(p.tip, flip);
  const [bx, by] = pt(p.base, flip);
  const stops = TONES[p.tone]
    .map(([offset, color]) => `<stop offset="${offset}" stop-color="${color}"/>`)
    .join('');
  const hw = halfWidth(p);
  const veinCount = Math.max(3, Math.min(7, Math.round(hw * 0.8)));
  const use = (attrs) => `<use href="#${pid}" ${attrs}/>`;
  return {
    def: `<path id="${pid}" d="${convertPath(p.d, flip)}"/>`,
    gradient:
      `<linearGradient id="${pid}g" gradientUnits="userSpaceOnUse" x1="${bx}" y1="${by}" x2="${tx}" y2="${ty}">${stops}</linearGradient>`,
    clip: use(''),
    body:
      use(`fill="none" stroke="${SHADOW}" stroke-width="4" stroke-opacity=".45"`) +
      use(`fill="none" stroke="${SHADOW}" stroke-width="1.6" stroke-opacity=".8"`) +
      use(`fill="url(#${pid}g)"`) +
      `<path d="${veins(p.tip, p.base, flip, hw, veinCount)}" fill="none" stroke="${VEIN}" stroke-opacity=".5" stroke-width=".45"/>` +
      use(`fill="none" stroke="${RIM}" stroke-opacity=".4" stroke-width="1.6"`) +
      use(`fill="none" stroke="${RIM}" stroke-opacity=".95" stroke-width=".6"`),
  };
}

function markup(prefix) {
  const parts = PETALS.flatMap((p) =>
    p.mirror === false ? [petal(p, prefix, false)] : [petal(p, prefix, false), petal(p, prefix, true)],
  );
  const join = (key) => parts.map((part) => part[key]).join('');
  return (
    `<defs>${join('def')}${join('gradient')}<clipPath id="${prefix}clip">${join('clip')}</clipPath></defs>` +
    `<g clip-path="url(#${prefix}clip)" stroke-linejoin="round">${join('body')}</g>`
  );
}

const VIEWBOX = '1 2 96 60';

const component = `---
/**
 * Volle, gelaagde rode lotus (logo), naar het originele logo van De Rode Lotus.
 * Gegenereerd door scripts/build-logo.mjs, pas daar aan.
 * \`id\` maakt de verloop-ID's uniek als het logo meermaals op een pagina staat.
 */
interface Props { id?: string; class?: string; title?: string }
const { id = 'lotus', class: className, title } = Astro.props;
const p = \`\${id}-\`;
const markup = \`${markup('${p}')}\`;
---
<svg class={className} xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}" role={title ? 'img' : undefined} aria-hidden={title ? undefined : 'true'} aria-label={title} set:html={markup} />
`;

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}">${markup('')}</svg>\n`;

await writeFile(new URL('../src/components/Logo.astro', import.meta.url), component);
await writeFile(new URL('../public/favicon.svg', import.meta.url), favicon);
console.log('Logo.astro en favicon.svg bijgewerkt.');
