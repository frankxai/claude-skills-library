#!/usr/bin/env node
// studio-eye: the browser layer of a studio audit. studio-scan reads what a crawler reads; this
// opens the page in Chromium and measures what only a rendered page can show, then writes the
// screenshots the eye rubric is scored from.
//
//   node bin/studio-eye.mjs <url> [--out dir] [--json] [--allow-private] [--no-throttle]
//
// Five measured dimensions, 5 points each (/25), scored like studio-scan (P0 -3, P1 -1, P2 -0.5):
//   speed        LCP, CLS and TBT under a mobile lab profile; bytes and requests
//   access       contrast on solid backgrounds, accessible names, one h1, landmarks, lang,
//                visible keyboard focus, image alt
//   mobile       horizontal overflow, viewport meta, tap targets (WCAG 2.5.8 floor 24 px, 44 px aim)
//   type         measure (characters per line), number of distinct sizes, scale consistency
//   composition  first screen (h1 and one primary action above the fold), alignment edges,
//                spacing-grid adherence, content hidden at opacity 0, reduced-motion behaviour
//
// This layer never replaces the eye rubric (/50). It is evidence for it: numbers a person
// would otherwise eyeball, and the screenshots they must open. Text over images or gradients
// is listed as unverified, never passed. Lab timings are lab timings, not field data.
//
// Exit codes: 0 no P0 · 1 a P0 exists · 3 not run (no browser, page did not load, refused target).

import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { isPublicAddress } from './studio-scan.mjs';

export const DIMENSIONS = ['speed', 'access', 'mobile', 'type', 'composition'];
export const VIEWPORTS = [
  { name: 'phone', width: 375, height: 812, mobile: true },
  { name: 'tablet', width: 768, height: 1024, mobile: true },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
];
// Roughly Lighthouse's mobile profile: slow 4G and a 4x slower CPU.
export const LAB = { cpu: 4, latencyMs: 150, downKbps: 1600, upKbps: 750 };
const COST = { P0: 3, P1: 1, P2: 0.5, info: 0 };

// ---------------------------------------------------------------- pure measures (unit tested)

export function parseColor(str) {
  const m = String(str || '').match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/i);
  if (!m) return null;
  let a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
  return { r: +m[1], g: +m[2], b: +m[3], a };
}

// Source-over: a translucent colour painted on an opaque one.
export function composite(top, bottom) {
  const a = top.a;
  return { r: top.r * a + bottom.r * (1 - a), g: top.g * a + bottom.g * (1 - a), b: top.b * a + bottom.b * (1 - a), a: 1 };
}

export function luminance({ r, g, b }) {
  const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(fg, bg) {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// WCAG large text: 24 px, or 18.66 px (14 pt) at weight 700 and above.
export function isLargeText(px, weight) { return px >= 24 || (px >= 18.66 && Number(weight) >= 700); }

// Groups x positions that sit within `tol` px of each other. Returns [{x, count}] by size.
export function clusterEdges(xs, tol = 2) {
  const sorted = [...xs].sort((a, b) => a - b);
  const groups = [];
  for (const x of sorted) {
    const g = groups[groups.length - 1];
    if (g && x - g.last <= tol) { g.sum += x; g.count += 1; g.last = x; }
    else groups.push({ sum: x, count: 1, last: x });
  }
  return groups.map(g => ({ x: Math.round(g.sum / g.count), count: g.count })).sort((a, b) => b.count - a.count);
}

// How regular a type scale is: the spread of ratios between neighbouring sizes. 0 is a perfect
// modular scale; above ~0.25 the sizes were picked one at a time.
export function scaleIrregularity(sizes) {
  const u = [...new Set(sizes.map(s => Math.round(s)))].filter(s => s > 0).sort((a, b) => a - b);
  if (u.length < 3) return { distinct: u.length, ratios: [], cv: 0 };
  const ratios = u.slice(1).map((s, i) => s / u[i]);
  const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  const sd = Math.sqrt(ratios.reduce((a, r) => a + (r - mean) ** 2, 0) / ratios.length);
  return { distinct: u.length, ratios: ratios.map(r => +r.toFixed(3)), cv: +(sd / (mean - 1 || 1)).toFixed(3) };
}

// Share of non-zero spacing values that land on a 4 px grid (±0.5 px for subpixel rounding).
export function gridAdherence(values, base = 4) {
  const v = values.filter(x => x > 0.5);
  if (!v.length) return 1;
  const on = v.filter(x => Math.abs(x / base - Math.round(x / base)) * base <= 0.5).length;
  return +(on / v.length).toFixed(3);
}

export function median(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// Collapses one finding per element into one finding per rule, keeping a few examples.
function finding(dim, severity, id, msg, evidence) { return { dim, severity, id, msg, ...(evidence ? { evidence } : {}) }; }

// Turns raw page measurements into findings. `m` is { views: {phone, tablet, desktop}, reduced,
// dark, perf, focus } as produced by the collector. Pure, so every rule is unit tested.
export function judge(m) {
  const f = [];
  const phone = m.views.phone, desk = m.views.desktop;

  // speed (phone, lab profile)
  const p = m.perf || {};
  if (p.lcp == null) f.push(finding('speed', 'P2', 'lcp-missing', 'No largest-contentful-paint entry was recorded; LCP not measured.'));
  else if (p.lcp > 4000) f.push(finding('speed', 'P0', 'lcp-poor', `LCP ${Math.round(p.lcp)} ms in the lab profile (poor is above 4000).`, p.lcpElement));
  else if (p.lcp > 2500) f.push(finding('speed', 'P1', 'lcp-slow', `LCP ${Math.round(p.lcp)} ms in the lab profile (good is 2500 or less).`, p.lcpElement));
  if (p.cls > 0.25) f.push(finding('speed', 'P0', 'cls-poor', `CLS ${p.cls.toFixed(3)} (poor is above 0.25).`, p.shifted));
  else if (p.cls > 0.1) f.push(finding('speed', 'P1', 'cls-high', `CLS ${p.cls.toFixed(3)} (good is 0.1 or less).`, p.shifted));
  if (p.tbt > 600) f.push(finding('speed', 'P1', 'tbt-high', `Total blocking time ${Math.round(p.tbt)} ms under 4x CPU (good is 200 or less).`));
  else if (p.tbt > 200) f.push(finding('speed', 'P2', 'tbt-raised', `Total blocking time ${Math.round(p.tbt)} ms under 4x CPU.`));
  if (p.preFcpBlock > 250) f.push(finding('speed', 'P2', 'blocked-before-paint', `Script held the main thread ${Math.round(p.preFcpBlock)} ms before first paint.`));
  if (p.bytes > 3_000_000) f.push(finding('speed', 'P1', 'heavy', `${(p.bytes / 1e6).toFixed(1)} MB transferred on first load.`));
  else if (p.bytes > 1_500_000) f.push(finding('speed', 'P2', 'heavy', `${(p.bytes / 1e6).toFixed(1)} MB transferred on first load.`));

  // access (desktop DOM, phone for focus)
  const lowC = desk.text.filter(t => t.contrast != null && t.contrast < (t.large ? 3 : 4.5));
  if (lowC.length) f.push(finding('access', 'P1', 'contrast', `${lowC.length} text block(s) below WCAG AA contrast on a solid background.`,
    lowC.slice(0, 5).map(t => `${t.sel} "${t.sample}" ${t.contrast.toFixed(2)}:1 (needs ${t.large ? 3 : 4.5})`)));
  const overImg = desk.text.filter(t => t.contrast == null);
  if (overImg.length) f.push(finding('access', 'info', 'contrast-unverified', `${overImg.length} text block(s) sit on an image or gradient; contrast unverified, check by eye.`,
    overImg.slice(0, 5).map(t => `${t.sel} "${t.sample}"`)));
  // Dark scheme is a second design: its contrast is measured, never assumed from the light pass.
  const lowDark = (m.dark?.text || []).filter(t => t.contrast != null && t.contrast < (t.large ? 3 : 4.5));
  if (lowDark.length) f.push(finding('access', 'P1', 'contrast-dark', `${lowDark.length} text block(s) below WCAG AA contrast in dark scheme.`,
    lowDark.slice(0, 5).map(t => `${t.sel} "${t.sample}" ${t.contrast.toFixed(2)}:1 (needs ${t.large ? 3 : 4.5})`)));
  const nameless = desk.controls.filter(c => !c.name);
  if (nameless.length) f.push(finding('access', 'P1', 'no-name', `${nameless.length} link(s) or button(s) without an accessible name.`, nameless.slice(0, 5).map(c => c.sel)));
  if (desk.h1 !== 1) f.push(finding('access', desk.h1 === 0 ? 'P1' : 'P2', 'h1-count', `${desk.h1} h1 element(s) rendered; one is expected.`));
  const missingLm = ['main', 'nav'].filter(l => !desk.landmarks.includes(l));
  if (missingLm.length) f.push(finding('access', 'P2', 'landmarks', `Missing landmark(s): ${missingLm.join(', ')}.`));
  if (!desk.lang) f.push(finding('access', 'P1', 'lang', 'The html element has no lang.'));
  if (desk.imgNoAlt.length) f.push(finding('access', 'P1', 'img-alt', `${desk.imgNoAlt.length} image(s) without an alt attribute.`, desk.imgNoAlt.slice(0, 5)));
  const fo = m.focus || { tried: 0, invisible: [] };
  if (fo.tried === 0) f.push(finding('access', 'P2', 'focus-untested', 'No focusable element received keyboard focus; focus visibility not measured.'));
  else if (fo.invisible.length) f.push(finding('access', fo.invisible.length === fo.tried ? 'P1' : 'P2', 'focus-invisible',
    `${fo.invisible.length} of ${fo.tried} keyboard stops show no visible focus change.`, fo.invisible.slice(0, 5)));

  // mobile (phone)
  if (phone.overflowX > 1) f.push(finding('mobile', 'P0', 'overflow-x', `The page is ${phone.overflowX}px wider than a 375px screen; it scrolls sideways.`, phone.overflowers));
  if (!phone.viewportMeta) f.push(finding('mobile', 'P0', 'viewport', 'No viewport meta; phones render the desktop layout zoomed out.'));
  const tiny = phone.controls.filter(c => c.visible && (c.w < 24 || c.h < 24) && !c.inline);
  const small = phone.controls.filter(c => c.visible && (c.w < 44 || c.h < 44) && !c.inline);
  if (tiny.length) f.push(finding('mobile', 'P1', 'target-tiny', `${tiny.length} tap target(s) under 24px at 375 wide (WCAG 2.5.8).`, tiny.slice(0, 5).map(c => `${c.sel} ${c.w}x${c.h}`)));
  else if (small.length) f.push(finding('mobile', 'P2', 'target-small', `${small.length} tap target(s) under 44px at 375 wide.`, small.slice(0, 5).map(c => `${c.sel} ${c.w}x${c.h}`)));

  // type (desktop for measure, both for scale)
  const cpl = desk.paragraphs.map(x => x.cpl);
  const med = median(cpl);
  const wide = desk.paragraphs.filter(x => x.cpl > 90);
  if (wide.length) f.push(finding('type', 'P1', 'measure-wide', `${wide.length} paragraph(s) run past 90 characters per line at 1440.`, wide.slice(0, 3).map(x => `${x.sel} ~${x.cpl} cpl`)));
  else if (med != null && (med > 80 || med < 40)) f.push(finding('type', 'P2', 'measure', `Median measure is ${med} characters per line (aim for 45 to 75).`));
  const sc = scaleIrregularity(desk.text.map(t => t.size));
  if (sc.distinct > 9) f.push(finding('type', 'P2', 'too-many-sizes', `${sc.distinct} distinct font sizes at 1440; a scale needs six to eight.`));
  if (sc.cv > 0.6) f.push(finding('type', 'P2', 'irregular-scale', `Type sizes follow no consistent ratio (spread ${sc.cv}).`, sc.ratios.map(String)));
  const tinyText = phone.text.filter(t => t.size < 12 && t.chars > 20);
  if (tinyText.length) f.push(finding('type', 'P1', 'text-tiny', `${tinyText.length} text block(s) under 12px on a phone.`, tinyText.slice(0, 3).map(t => `${t.sel} ${t.size}px`)));

  // composition (first screen at both ends; layout at desktop)
  for (const [name, v] of [['375', phone], ['1440', desk]]) {
    if (!v.fold.h1Above) f.push(finding('composition', 'P1', `h1-below-fold-${name}`, `The h1 is not on the first screen at ${name} wide.`));
    if (v.fold.actions === 0) f.push(finding('composition', 'P2', `no-action-${name}`, `No button-styled action on the first screen at ${name} wide.`));
    if (v.fold.actions > 2) f.push(finding('composition', 'P2', `competing-actions-${name}`, `${v.fold.actions} button-styled actions compete on the first screen at ${name} wide.`, v.fold.actionLabels));
  }
  const edges = clusterEdges(desk.edges, 2);
  const lone = edges.filter(e => e.count === 1).length;
  if (edges.length && lone / edges.length > 0.5 && lone > 6) f.push(finding('composition', 'P2', 'ragged-edges',
    `${lone} of ${edges.length} left edges are used once; blocks do not share a grid.`, edges.slice(0, 6).map(e => `x=${e.x} (${e.count})`)));
  const grid = gridAdherence(desk.spacing);
  if (grid < 0.75) f.push(finding('composition', 'P2', 'off-grid', `${Math.round(grid * 100)}% of margins, paddings and gaps sit on a 4px grid.`));
  if (phone.hiddenText.length) f.push(finding('composition', 'P1', 'hidden-at-rest', `${phone.hiddenText.length} text block(s) still at opacity 0 after load; content waits on script or scroll.`, phone.hiddenText.slice(0, 5)));
  const r = m.reduced || {};
  if (r.running > 0) f.push(finding('composition', 'P1', 'reduced-motion-ignored', `${r.running} animation(s) keep running with prefers-reduced-motion: reduce.`, r.examples));
  if (r.hiddenText > 0) f.push(finding('composition', 'P1', 'reduced-motion-hidden', `${r.hiddenText} text block(s) stay invisible with reduced motion on.`));
  if (m.dark && !m.dark.responds) f.push(finding('composition', 'info', 'single-scheme', 'The page does not respond to prefers-color-scheme: dark. Fine if declared; confirm intent.'));
  return f;
}

export function score(findings) {
  const out = {};
  for (const d of DIMENSIONS) {
    const cost = findings.filter(x => x.dim === d).reduce((a, x) => a + COST[x.severity], 0);
    out[d] = Math.max(0, +(5 - cost).toFixed(1));
  }
  out.total = +DIMENSIONS.reduce((a, d) => a + out[d], 0).toFixed(1);
  return out;
}

// ---------------------------------------------------------------- browser collection

// Runs inside the page. Must stay self-contained: Playwright serialises it as source.
/* c8 ignore start */
// `device` is the emulated screen. Mobile Chromium widens the layout viewport to fit overflowing
// content, so innerWidth would hide the very overflow being measured.
function collect(device) {
  const vw = device ? device.width : innerWidth, vh = device ? device.height : innerHeight;
  const sel = el => {
    const tag = el.tagName.toLowerCase();
    if (el.id) return `${tag}#${el.id}`;
    const cls = [...el.classList].slice(0, 2).join('.');
    return cls ? `${tag}.${cls}` : tag;
  };
  const visible = el => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const parse = s => {
    const m = String(s).match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?/);
    if (!m) return null;
    const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r: +m[1], g: +m[2], b: +m[3], a };
  };
  const over = (t, b) => ({ r: t.r * t.a + b.r * (1 - t.a), g: t.g * t.a + b.g * (1 - t.a), b: t.b * t.a + b.b * (1 - t.a), a: 1 });
  const lum = ({ r, g, b }) => { const l = c => (c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; return 0.2126 * l(r) + 0.7152 * l(g) + 0.0722 * l(b); };
  const ratio = (a, b) => { const [h, l] = [lum(a), lum(b)].sort((x, y) => y - x); return (h + 0.05) / (l + 0.05); };
  // Walks up to the first opaque background. Any image or gradient on the way means the
  // backdrop is not a single colour, so contrast is reported as unverified (null).
  const backdrop = el => {
    const layers = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      // A positioned media child under the text (a hero photo, a canvas) is a backdrop too.
      if (n !== el && [...n.children].some(c => ['IMG', 'VIDEO', 'CANVAS', 'PICTURE'].includes(c.tagName) && /absolute|fixed/.test(getComputedStyle(c).position))) return null;
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
    return base;
  };
  const ownText = el => [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').replace(/\s+/g, ' ').trim();

  const text = [], paragraphs = [], edges = [], spacing = [], hiddenText = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(el.tagName)) continue;
    // SVG keeps lowercase tag names in an HTML document; labels inside a drawing are artwork,
    // not layout, so they neither set edges nor count as type.
    if (el.closest('svg')) continue;
    const t = ownText(el);
    const cs = getComputedStyle(el);
    if (t.length >= 2) {
      let op = 1;
      for (let n = el; n && n.nodeType === 1; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity);
      const r = el.getBoundingClientRect();
      if (!visible(el)) continue;
      // Text waiting at opacity 0 for a scroll or script reveal is reported, then measured in its
      // revealed state: its layout and colour are still the design being judged.
      const hidden = op < 0.05;
      if (hidden) hiddenText.push(`${sel(el)} "${t.slice(0, 40)}"`);
      const size = parseFloat(cs.fontSize), weight = cs.fontWeight;
      const fg = parse(cs.color);
      const bg = backdrop(el);
      const fgc = fg && bg ? over({ ...fg, a: fg.a * (hidden ? 1 : Math.min(1, op)) }, bg) : null;
      text.push({ sel: sel(el), sample: t.slice(0, 40), size, weight, chars: t.length,
        large: size >= 24 || (size >= 18.66 && +weight >= 700),
        contrast: fgc && bg ? +ratio(fgc, bg).toFixed(2) : null, top: r.top + scrollY });
      // Measure from the real line boxes: the widest line's share of the total set width, times the
      // character count. Dividing characters by lines would count a short last line as a short measure.
      const full = el.textContent.replace(/\s+/g, ' ').trim();
      if (['P', 'LI', 'DD', 'BLOCKQUOTE'].includes(el.tagName) && full.length > 80) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const rows = new Map();
        for (const b of range.getClientRects()) {
          if (b.width < 1) continue;
          const key = Math.round(b.top);
          rows.set(key, (rows.get(key) || 0) + b.width);
        }
        const widths = [...rows.values()];
        const total = widths.reduce((a, w) => a + w, 0);
        if (widths.length >= 2 && total > 0) paragraphs.push({ sel: sel(el), cpl: Math.round(Math.max(...widths) * full.length / total) });
      }
      // An element parked off-screen (a skip link before focus) is not part of the composition.
      if (r.bottom + scrollY > 0 && r.right > 0) edges.push(Math.round(r.left));
    }
    if (visible(el) && cs.display !== 'inline') {
      for (const p of ['marginTop', 'marginBottom', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'rowGap', 'columnGap']) {
        const v = parseFloat(cs[p]);
        if (v > 0) spacing.push(v);
      }
    }
  }
  for (const el of document.querySelectorAll('img, video, canvas, svg')) {
    if (visible(el) && el.getBoundingClientRect().width > 64) edges.push(Math.round(el.getBoundingClientRect().left));
  }

  const nameOf = el => {
    const lab = el.getAttribute('aria-label');
    if (lab && lab.trim()) return lab.trim();
    const by = el.getAttribute('aria-labelledby');
    if (by) { const t = by.split(/\s+/).map(id => document.getElementById(id)?.textContent || '').join(' ').trim(); if (t) return t; }
    const txt = el.innerText?.trim();
    if (txt) return txt;
    const img = el.querySelector('img[alt]');
    if (img && img.alt.trim()) return img.alt.trim();
    const svgT = el.querySelector('svg title');
    if (svgT && svgT.textContent.trim()) return svgT.textContent.trim();
    if (el.id) { const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (l && l.textContent.trim()) return l.textContent.trim(); }
    return (el.getAttribute('title') || el.getAttribute('placeholder') || el.value || '').trim();
  };
  const controls = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=link]')].map(el => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    // A link inside a sentence is exempt from target size (WCAG 2.5.8 inline exception).
    const inline = el.tagName === 'A' && cs.display === 'inline' && el.parentElement && ownText(el.parentElement).length > 30;
    return { sel: sel(el), name: nameOf(el), w: Math.round(r.width), h: Math.round(r.height), visible: visible(el), inline };
  });

  // Button-styled actions on the first screen: a filled or outlined control with padding.
  const isButtonish = el => {
    const cs = getComputedStyle(el);
    const bg = parse(cs.backgroundColor);
    const filled = bg && bg.a > 0.2;
    const outlined = parseFloat(cs.borderTopWidth) >= 1 && cs.borderTopStyle !== 'none';
    return (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' || filled || outlined) && parseFloat(cs.paddingLeft) >= 8;
  };
  const navs = [...document.querySelectorAll('nav, header nav, [role=navigation]')];
  const above = el => { const r = el.getBoundingClientRect(); return r.top < vh && r.bottom > 0 && visible(el); };
  const actions = [...document.querySelectorAll('a[href], button')].filter(el => above(el) && isButtonish(el) && !navs.some(n => n.contains(el)));
  const h1s = [...document.querySelectorAll('h1')].filter(visible);

  const lm = [];
  if (document.querySelector('main, [role=main]')) lm.push('main');
  if (document.querySelector('nav, [role=navigation]')) lm.push('nav');
  if (document.querySelector('header, [role=banner]')) lm.push('header');
  if (document.querySelector('footer, [role=contentinfo]')) lm.push('footer');

  const docW = document.documentElement.scrollWidth;
  const overflowers = docW > vw + 1 ? [...document.body.querySelectorAll('*')].filter(el => el.getBoundingClientRect().right > vw + 1 && visible(el)).slice(0, 5).map(sel) : [];
  return {
    width: vw, text, paragraphs, edges, spacing, hiddenText: hiddenText.slice(0, 20), controls, landmarks: lm,
    h1: h1s.length, lang: document.documentElement.lang || '',
    imgNoAlt: [...document.querySelectorAll('img:not([alt])')].map(sel).slice(0, 20),
    viewportMeta: !!document.querySelector('meta[name=viewport]'),
    overflowX: Math.max(0, docW - vw), overflowers,
    fold: { h1Above: h1s.some(above), actions: actions.length, actionLabels: actions.map(a => (a.innerText || '').trim().slice(0, 30)) },
    bodyBg: getComputedStyle(document.body).backgroundColor, rootBg: getComputedStyle(document.documentElement).backgroundColor,
  };
}

// Installed before any page script: records LCP, layout shifts and long tasks.
function perfObserver() {
  window.__eye = { lcp: null, lcpEl: null, cls: 0, shifted: [], longTasks: [], fcp: null };
  const s = e => { const n = e && e.nodeType === 1 ? e : e?.parentElement; if (!n) return null; return n.tagName.toLowerCase() + (n.id ? '#' + n.id : n.classList[0] ? '.' + n.classList[0] : ''); };
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) { window.__eye.lcp = e.startTime; window.__eye.lcpEl = s(e.element); } }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch {}
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) { if (e.hadRecentInput) continue; window.__eye.cls += e.value; for (const src of e.sources || []) { const x = s(src.node); if (x && window.__eye.shifted.length < 5) window.__eye.shifted.push(x); } } }).observe({ type: 'layout-shift', buffered: true }); } catch {}
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__eye.longTasks.push({ start: e.startTime, dur: e.duration }); }).observe({ type: 'longtask', buffered: true }); } catch {}
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__eye.fcp = e.startTime; }).observe({ type: 'paint', buffered: true }); } catch {}
}
/* c8 ignore stop */

function loadPlaywright() {
  for (const base of [join(process.cwd(), 'package.json'), import.meta.url]) {
    try { return createRequire(base)('playwright'); } catch {}
  }
  return null;
}

export async function assertTarget(url, { allowPrivate = false } = {}) {
  let u;
  try { u = new URL(url); } catch { throw new Error(`not a URL: ${url}`); }
  if (u.protocol === 'file:') { if (!allowPrivate) throw new Error('file: targets need --allow-private'); return u; }
  if (!/^https?:$/.test(u.protocol)) throw new Error(`refused protocol ${u.protocol}`);
  if (allowPrivate) return u;
  const host = u.hostname.replace(/^\[|\]$/g, '');
  const addrs = isIP(host) ? [host] : (await lookup(host, { all: true })).map(a => a.address);
  if (!addrs.length || !addrs.every(isPublicAddress)) throw new Error(`${host} resolves to a private or reserved address; pass --allow-private for local targets`);
  return u;
}

// Every navigation goes through here, so none can score a page that did not load: an HTTP error
// or a timeout on any of the five loads (three widths, reduced motion, dark scheme) means the
// layer was not run. A preference load that fails is never measured as the page at rest.
async function load(page, url, where, timeoutMs) {
  let resp;
  try { resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs }); }
  catch (e) { throw Object.assign(new Error(`${where} load did not complete: ${e.message.split('\n')[0]}`), { notRun: true }); }
  if (!resp) throw Object.assign(new Error(`${where} load returned no response`), { notRun: true });
  if (resp.status() >= 400) throw Object.assign(new Error(`${where} load answered HTTP ${resp.status()}`), { notRun: true });
  return resp;
}

async function settle(page) {
  await page.waitForLoadState('load', { timeout: 30000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1200);
}

export async function eyeUrl(url, { out = null, allowPrivate = false, throttle = true, navTimeoutMs = 45000 } = {}) {
  await assertTarget(url, { allowPrivate });
  const pw = loadPlaywright();
  if (!pw) { const e = new Error('playwright is not installed; the browser layer was not run'); e.notRun = true; throw e; }
  const browser = await pw.chromium.launch();
  const shots = [];
  const views = {};
  let perf = null, focus = null, reduced = null, dark = null;
  try {
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      const measurePerf = vp.name === 'phone';
      let bytes = 0, requests = 0;
      if (measurePerf) {
        await page.addInitScript(perfObserver);
        page.on('requestfinished', async req => { requests += 1; try { const s = await req.sizes(); bytes += s.responseBodySize + s.responseHeadersSize; } catch {} });
        if (throttle) {
          const cdp = await ctx.newCDPSession(page);
          await cdp.send('Network.enable');
          await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: LAB.latencyMs, downloadThroughput: LAB.downKbps * 128, uploadThroughput: LAB.upKbps * 128 });
          await cdp.send('Emulation.setCPUThrottlingRate', { rate: LAB.cpu });
        }
      }
      await load(page, url, `${vp.width}px`, navTimeoutMs);
      await settle(page);
      if (measurePerf) {
        const e = await page.evaluate(() => window.__eye);
        const fcp = e.fcp ?? 0;
        const tbt = e.longTasks.filter(t => t.start >= fcp).reduce((a, t) => a + Math.max(0, t.dur - 50), 0);
        // Long tasks before first paint are not TBT by definition, but they hold the first paint back.
        const preFcp = e.longTasks.filter(t => t.start < fcp).reduce((a, t) => a + t.dur, 0);
        perf = { lcp: e.lcp, lcpElement: e.lcpEl ? [e.lcpEl] : undefined, cls: +e.cls.toFixed(4), shifted: e.shifted, tbt: Math.round(tbt), preFcpBlock: Math.round(preFcp), fcp: e.fcp, bytes, requests, profile: throttle ? LAB : 'unthrottled' };
      }
      views[vp.name] = await page.evaluate(collect, { width: vp.width, height: vp.height });
      if (vp.name === 'phone') {
        // Keyboard pass: Tab through the first stops and compare each one's focused look to its rest look.
        const tried = [], invisible = [];
        await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
        for (let i = 0; i < 8; i++) {
          await page.keyboard.press('Tab');
          const r = await page.evaluate(() => {
            const el = document.activeElement;
            if (!el || el === document.body) return null;
            const look = () => { const c = getComputedStyle(el); return [c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0 ? c.outlineStyle + c.outlineWidth + c.outlineColor : '', c.boxShadow, c.backgroundColor, c.color, c.textDecorationLine, c.borderColor].join('|'); };
            const focused = look();
            const id = el.tagName.toLowerCase() + (el.id ? '#' + el.id : el.classList[0] ? '.' + el.classList[0] : '');
            el.blur();
            const rest = look();
            el.focus({ preventScroll: true });
            return { id, changed: focused !== rest };
          });
          if (!r) continue;
          tried.push(r.id);
          if (!r.changed) invisible.push(r.id);
        }
        focus = { tried: tried.length, invisible };
      }
      if (out) {
        // The keyboard pass leaves a focus ring behind; a capture must show the page at rest.
        await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
        for (const full of [false, true]) {
          const file = join(out, `${vp.width}${full ? '-full' : ''}.png`);
          await page.screenshot({ path: file, fullPage: full });
          shots.push(file);
        }
      }
      await ctx.close();
    }
    // Reduced motion at phone width: animations still running and text still hidden.
    {
      const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      await load(page, url, 'reduced motion', navTimeoutMs);
      await settle(page);
      reduced = await page.evaluate(() => {
        const running = document.getAnimations().filter(a => a.playState === 'running' && (a.effect?.getTiming().iterations === Infinity || (a.effect?.getTiming().duration || 0) > 200));
        const hidden = [...document.body.querySelectorAll('h1,h2,h3,p,li,a,button')].filter(el => {
          let op = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity);
          return op < 0.05 && el.textContent.trim().length > 1 && getComputedStyle(el).display !== 'none';
        });
        return { running: running.length, examples: running.slice(0, 3).map(a => a.animationName || a.constructor.name), hiddenText: hidden.length };
      });
      if (out) { const file = join(out, '375-reduced-motion.png'); await page.screenshot({ path: file }); shots.push(file); }
      await ctx.close();
    }
    // Dark scheme at desktop: does the page answer prefers-color-scheme at all?
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
      const page = await ctx.newPage();
      await load(page, url, 'dark scheme', navTimeoutMs);
      await settle(page);
      const bg = await page.evaluate(() => [getComputedStyle(document.body).backgroundColor, getComputedStyle(document.documentElement).backgroundColor]);
      dark = { responds: bg[0] !== views.desktop.bodyBg || bg[1] !== views.desktop.rootBg };
      if (dark.responds) dark.text = (await page.evaluate(collect, { width: 1440, height: 900 })).text;
      if (out && dark.responds) { const file = join(out, '1440-dark.png'); await page.screenshot({ path: file }); shots.push(file); }
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  const measured = { views, perf, focus, reduced, dark };
  const findings = judge(measured);
  return {
    // File names only: the report sits next to its screenshots, and a machine path is not portable evidence.
    url, layer: 'browser', scores: score(findings), findings, shots: shots.map(s => basename(s)),
    metrics: {
      perf,
      measure: { medianCpl: median(views.desktop.paragraphs.map(p => p.cpl)), paragraphs: views.desktop.paragraphs.length },
      typeScale: scaleIrregularity(views.desktop.text.map(t => t.size)),
      edges: clusterEdges(views.desktop.edges, 2).slice(0, 8),
      gridAdherence: gridAdherence(views.desktop.spacing),
      fold: { phone: views.phone.fold, desktop: views.desktop.fold },
      focus, reduced, dark: dark && { responds: dark.responds, measuredText: dark.text?.length ?? 0 },
    },
  };
}

export function toMarkdown(r) {
  const L = [];
  L.push(`# Browser layer: \`${r.url}\``, '', `**${r.scores.total} / 25** · measured in Chromium; lab profile ${r.metrics.perf?.profile === 'unthrottled' ? 'unthrottled' : `${LAB.cpu}x CPU, ${LAB.latencyMs} ms RTT, ${LAB.downKbps} kbps`}`, '');
  L.push('| Dimension | Score |', '|---|---|');
  for (const d of DIMENSIONS) L.push(`| ${d} | ${r.scores[d]} / 5 |`);
  const p = r.metrics.perf || {};
  L.push('', '## Measures', '',
    `- LCP ${p.lcp == null ? 'not recorded' : Math.round(p.lcp) + ' ms'}${p.lcpElement ? ` (${p.lcpElement[0]})` : ''} · CLS ${p.cls ?? '?'} · TBT ${p.tbt ?? '?'} ms · blocked before first paint ${p.preFcpBlock ?? '?'} ms · ${p.requests ?? '?'} requests, ${p.bytes != null ? (p.bytes / 1024).toFixed(0) + ' KB' : '?'}`,
    `- Median measure ${r.metrics.measure.medianCpl ?? 'n/a'} cpl over ${r.metrics.measure.paragraphs} paragraph(s)`,
    `- Type scale: ${r.metrics.typeScale.distinct} sizes, ratio spread ${r.metrics.typeScale.cv}`,
    `- Spacing on a 4 px grid: ${Math.round(r.metrics.gridAdherence * 100)}%`,
    `- Strongest left edges at 1440: ${r.metrics.edges.map(e => `${e.x}px×${e.count}`).join(', ')}`,
    `- First screen: phone h1 ${r.metrics.fold.phone.h1Above ? 'yes' : 'no'}, ${r.metrics.fold.phone.actions} action(s); desktop h1 ${r.metrics.fold.desktop.h1Above ? 'yes' : 'no'}, ${r.metrics.fold.desktop.actions} action(s)`,
    `- Keyboard: ${r.metrics.focus?.tried ?? 0} stops, ${r.metrics.focus?.invisible.length ?? 0} without visible focus · reduced motion: ${r.metrics.reduced?.running ?? '?'} running animation(s) · dark scheme: ${r.metrics.dark?.responds ? 'designed' : 'not answered'}`);
  L.push('', '## Findings', '');
  if (!r.findings.length) L.push('None.');
  for (const f of [...r.findings].sort((a, b) => COST[b.severity] - COST[a.severity])) {
    L.push(`- **${f.severity}** \`${f.dim}/${f.id}\` ${f.msg}`);
    for (const e of f.evidence || []) L.push(`  - ${e}`);
  }
  if (r.shots.length) L.push('', '## Screenshots (open every one before scoring the eye rubric)', '', ...r.shots.map(s => `- ${s}`));
  return L.join('\n') + '\n';
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = process.argv.slice(2);
  const url = args.find(a => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--out');
  const outIdx = args.indexOf('--out');
  const out = outIdx >= 0 ? resolve(args[outIdx + 1]) : null;
  if (!url) { console.error('usage: studio-eye <url> [--out dir] [--json] [--allow-private] [--no-throttle]'); process.exit(2); }
  if (out) mkdirSync(out, { recursive: true });
  try {
    const r = await eyeUrl(url, { out, allowPrivate: args.includes('--allow-private'), throttle: !args.includes('--no-throttle') });
    const md = toMarkdown(r);
    if (out) { writeFileSync(join(out, 'eye.json'), JSON.stringify(r, null, 2) + '\n'); writeFileSync(join(out, 'eye.md'), md); }
    process.stdout.write(args.includes('--json') ? JSON.stringify(r, null, 2) + '\n' : md);
    process.exitCode = r.findings.some(f => f.severity === 'P0') ? 1 : 0;
  } catch (e) {
    console.error(`studio-eye: not run: ${e.message}`);
    process.exitCode = 3;
  }
}
