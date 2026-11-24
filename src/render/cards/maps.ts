import { geoMercator, geoPath } from 'd3-geo';
import type { MultiPolygon, Position } from 'geojson';
import { ease, prog } from '../anim';
import { fadeUp, headline, heroNumber, kicker, paragraph } from '../blocks';
import type { Card, DeckEnv, Frame } from '../card';
import { COLORS, CW, H, M, W, capRatio, cumulative, drawTracked, fitRoute, fitSize, projectRoutes, roundRect, setFont, tracePartial, traceFull, type Box, type Ctx } from '../kit';
import { cleanName, splitLines } from './common';
import type { CountryFeature } from '../../geo/countries';
import type { Place } from '../../stats/types';

const KICK = 330;

// ------------------------------------------------------------------ MAPA DE CALOR (territorio)
export function heatmapCard(env: DeckEnv): Card {
  const { fmt, stats: s } = env;
  const home = s.home!;
  const n = home.tracks.length;
  const box: Box = { x: 40, y: 760, w: W - 80, h: 1000 };
  // Programa de dibujo: cada ruta entra escalonada por orden.
  const T0 = 700, SPAN = 3600;
  return {
    id: 'heatmap',
    theme: 'dark',
    duration: 8500,
    render(f) {
      const { ctx, theme } = f;
      kicker(f, fmt.t('Tu territorio', 'Your turf'), M, KICK);
      const name = (home.name ?? fmt.t('Tu ciudad', 'Your city')).toUpperCase();
      const hs = fitSize(ctx, name, 'display', 170, CW);
      const y = KICK + 64 + capRatio(ctx) * hs;
      headline(f, [name], M, y, hs, { start: 120, color: COLORS.orange });
      paragraph(
        f,
        fmt.t(
          `**${fmt.num(home.runs)} carreras** y **${fmt.distWithUnit(home.distance, 0)}** por sus calles.`,
          `**${fmt.num(home.runs)} runs** and **${fmt.distWithUnit(home.distance, 0)}** through its streets.`,
        ),
        M,
        y + 82,
        CW,
        38,
        { start: 450 },
      );
      const proj = f.memo('proj', () => {
        // Encuadre en el núcleo: las tiradas largas hacia otros pueblos no encogen la ciudad.
        const tight = n >= 15;
        const pr = projectRoutes(home.tracks, box, { lo: tight ? 0.05 : 0.02, hi: tight ? 0.95 : 0.98, pad: 0.05 });
        return { paths: pr.paths, cums: pr.paths.map((p) => cumulative(p)), k: pr.k };
      });
      // Dibujo progresivo con capa acumulada (las rutas terminadas se "hornean").
      const lw = Math.max(2, Math.min(4.2, 5.2 - Math.log10(Math.max(1, n)) * 1.35));
      const alpha = Math.max(0.2, Math.min(0.7, 2.2 / Math.sqrt(Math.max(1, n)) + 0.12));
      const style = (g: Ctx, glow = false) => {
        g.globalCompositeOperation = 'lighter';
        g.strokeStyle = `rgba(252,90,24,${(glow ? alpha * 0.16 : alpha).toFixed(3)})`;
        g.lineWidth = glow ? lw * 3.4 : lw;
        g.lineCap = 'round';
        g.lineJoin = 'round';
      };
      const doneAt = (i: number) => T0 + (i / Math.max(1, n)) * SPAN + 650;
      const startAt = (i: number) => T0 + (i / Math.max(1, n)) * SPAN;
      const baked = f.memo(`baked:${f.scale.toFixed(4)}`, () => ({ upTo: 0, canvas: null as HTMLCanvasElement | null, lastT: -1 }));
      if (!baked.canvas || f.t < baked.lastT || f.still) {
        baked.canvas = document.createElement('canvas');
        baked.canvas.width = Math.round(W * f.scale);
        baked.canvas.height = Math.round(H * f.scale);
        baked.upTo = 0;
      }
      const g = baked.canvas.getContext('2d')!;
      g.setTransform(f.scale, 0, 0, f.scale, 0, 0);
      g.save();
      while (baked.upTo < n && doneAt(baked.upTo) <= f.t) {
        traceFull(g, proj.paths[baked.upTo]);
        style(g, true);
        g.stroke();
        style(g);
        g.stroke();
        baked.upTo++;
      }
      g.restore();
      baked.lastT = f.t;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(baked.canvas, 0, 0, W, H);
      for (let i = baked.upTo; i < n; i++) {
        const st = startAt(i);
        if (st > f.t) break;
        const p = ease.inOutSine(prog(f.t, st, 650));
        const cum = proj.cums[i];
        tracePartial(ctx, proj.paths[i], cum, cum[cum.length - 1] * p);
        style(ctx, true);
        ctx.stroke();
        style(ctx);
        ctx.stroke();
      }
      ctx.restore();
      // Escala 1 km
      fadeUp(f, 1200, () => {
        const meters = fmt.imperial ? 1609.344 : 1000;
        const lat0 = home.lat * (Math.PI / 180);
        const pxPerDeg = proj.k;
        const px = (meters / (111320 * Math.cos(lat0))) * pxPerDeg;
        if (px > 30 && px < 600) {
          ctx.fillStyle = theme.sub;
          ctx.fillRect(M, 1762, px, 4);
          ctx.fillRect(M, 1752, 4, 24);
          ctx.fillRect(M + px - 4, 1752, 4, 24);
          setFont(ctx, 'text', 22, 800);
          drawTracked(ctx, fmt.imperial ? '1 MI' : '1 KM', M + px + 18, 1772, 3);
        }
      });
    },
  };
}

// ------------------------------------------------------------------ TODAS LAS RUTAS
export function allRunsCard(env: DeckEnv): Card {
  const { fmt, stats: s } = env;
  const routes = s.routes.slice(0, 400);
  const n = routes.length;
  const area: Box = { x: M - 10, y: 720, w: CW + 20, h: 1010 };
  let cols = Math.max(4, Math.ceil(Math.sqrt((n * area.w) / area.h)));
  let rows = Math.ceil(n / cols);
  while (rows * (area.w / cols) > area.h) {
    cols++;
    rows = Math.ceil(n / cols);
  }
  const cell = area.w / cols;
  return {
    id: 'allruns',
    theme: 'orange',
    duration: 7500,
    render(f) {
      const { ctx } = f;
      kicker(f, fmt.t(`${fmt.num(s.runs)} carreras`, `${fmt.num(s.runs)} runs`), M, KICK);
      const hs = 128;
      const y = KICK + 64 + capRatio(ctx) * hs;
      headline(f, [fmt.t('Cada carrera,', 'Every run,'), fmt.t('una forma', 'a shape')], M, y, hs, { start: 120, colors: [COLORS.ink, COLORS.white] });
      const shapes = f.memo('shapes', () =>
        routes.map((r, i) => {
          const c = i % cols, rr = Math.floor(i / cols);
          const pad = cell * 0.14;
          const pts = fitRoute(r.track, { x: area.x + c * cell + pad, y: area.y + rr * cell + pad, w: cell - 2 * pad, h: cell - 2 * pad }, 0);
          return { pts, cum: cumulative(pts) };
        }),
      );
      ctx.save();
      ctx.strokeStyle = COLORS.white;
      ctx.lineWidth = Math.max(1.6, Math.min(3.4, cell / 30));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const span = 2600;
      shapes.forEach((sh, i) => {
        const st = 650 + (i / Math.max(1, n)) * span;
        const p = ease.outCubic(prog(f.t, st, 700));
        if (p <= 0) return;
        const total = sh.cum[sh.cum.length - 1];
        tracePartial(ctx, sh.pts, sh.cum, total * p);
        ctx.stroke();
      });
      ctx.restore();
    },
  };
}

// ------------------------------------------------------------------ CARRERA MÁS LARGA
export function longestCard(env: DeckEnv): Card {
  const { fmt, stats: s } = env;
  const r = s.longestRun!;
  const title = cleanName(r.name) || fmt.t('Tu tirada más larga', 'Your longest run');
  return {
    id: 'longest',
    theme: 'light',
    duration: 7500,
    render(f) {
      const { ctx, theme } = f;
      kicker(f, fmt.t('Tu carrera más larga', 'Your longest run'), M, KICK);
      const size = 300;
      const base = KICK + 64 + capRatio(ctx) * size;
      heroNumber(f, fmt.dist(r.distance), fmt.distUnit.toUpperCase(), M, base, size, { start: 100, unitScale: 0.32 });
      const lines = splitLines(title.toUpperCase(), 2, 18);
      const hs = Math.min(96, ...lines.map((l) => fitSize(ctx, l, 'display', 96, CW)));
      let y = base + 130;
      headline(f, lines, M, y, hs, { start: 400 });
      y += hs * 0.98 * (lines.length - 1) + 74;
      // Fila de datos
      const items: [string, string][] = [
        [fmt.dur(r.moving), fmt.t('TIEMPO', 'TIME')],
        [`${fmt.pace(r.pace)}${fmt.paceUnit}`, fmt.t('RITMO', 'PACE')],
        [fmt.dateShort(r.local).toUpperCase(), fmt.t('FECHA', 'DATE')],
      ];
      items.forEach(([v, l], i) => {
        fadeUp(f, 700 + i * 120, () => {
          const x = M + i * (CW / 3);
          setFont(ctx, 'display', 64);
          ctx.fillStyle = theme.fg;
          drawTracked(ctx, v, x, y + 30, 0);
          setFont(ctx, 'text', 22, 800);
          ctx.fillStyle = theme.sub;
          drawTracked(ctx, l, x, y + 72, 4);
        });
      });
      const box: Box = { x: M, y: y + 130, w: CW, h: Math.max(200, 1740 - (y + 130)) };
      if (r.track) {
        const route = f.memo('route', () => {
          const pts = fitRoute(r.track!, box, 0.03);
          return { pts, cum: cumulative(pts) };
        });
        const p = ease.inOutCubic(prog(f.t, 1100, 3000));
        ctx.save();
        ctx.strokeStyle = 'rgba(18,18,18,0.08)';
        ctx.lineWidth = 22;
        ctx.lineCap = ctx.lineJoin = 'round';
        traceFull(ctx, route.pts);
        ctx.globalAlpha = prog(f.t, 900, 500);
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = COLORS.orange;
        ctx.lineWidth = 7;
        ctx.lineCap = ctx.lineJoin = 'round';
        const total = route.cum[route.cum.length - 1];
        const [ex, ey] = tracePartial(ctx, route.pts, route.cum, total * p);
        if (p > 0) ctx.stroke();
        ctx.fillStyle = theme.fg;
        ctx.beginPath();
        ctx.arc(route.pts[0], route.pts[1], 13 * prog(f.t, 1000, 300), 0, Math.PI * 2);
        ctx.fill();
        if (p > 0 && p < 1) {
          ctx.fillStyle = COLORS.orange;
          ctx.beginPath();
          ctx.arc(ex, ey, 12, 0, Math.PI * 2);
          ctx.fill();
        }
        if (p >= 1) {
          const k = ease.outBack(prog(f.t, 4100, 500));
          ctx.strokeStyle = theme.fg;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(ex, ey, 18 * k, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      } else {
        // Sin GPS (cinta, reloj sin mapa): una regla con cada kilómetro (o milla) recorrido.
        const total = fmt.distValue(r.distance);
        const step = total <= 30 ? 1 : total <= 120 ? 5 : total <= 400 ? 10 : 50;
        const lineY = box.y + Math.min(box.h * 0.45, 330);
        const x0 = M, x1 = W - M;
        const p = ease.inOutCubic(prog(f.t, 1100, 2800));
        const xAt = (v: number) => x0 + (v / total) * (x1 - x0);
        ctx.save();
        ctx.fillStyle = 'rgba(18,18,18,0.10)';
        roundRect(ctx, x0, lineY - 9, x1 - x0, 18, 9);
        ctx.fill();
        ctx.fillStyle = COLORS.orange;
        if (p > 0) {
          roundRect(ctx, x0, lineY - 9, Math.max(18, (x1 - x0) * p), 18, 9);
          ctx.fill();
        }
        for (let v = step; v < total; v += step) {
          const x = xAt(v);
          const major = (v / step) % 5 === 0;
          const shown = (v / total) <= p;
          ctx.fillStyle = shown ? theme.fg : 'rgba(18,18,18,0.18)';
          ctx.fillRect(x - 1.5, lineY - (major ? 46 : 30), 3, major ? 26 : 14);
        }
        ctx.restore();
        fadeUp(f, 1100, () => {
          setFont(ctx, 'text', 24, 800);
          ctx.fillStyle = theme.sub;
          drawTracked(ctx, `0 ${fmt.distUnit.toUpperCase()}`, x0, lineY + 62, 3, 'left');
          drawTracked(ctx, `${fmt.dist(r.distance)} ${fmt.distUnit.toUpperCase()}`, x1, lineY + 62, 3, 'right');
        });
        const pEnd = ease.outBack(prog(f.t, 3900, 500));
        if (pEnd > 0) {
          ctx.save();
          ctx.fillStyle = theme.fg;
          ctx.beginPath();
          ctx.arc(x1 - 9, lineY, 22 * pEnd, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    },
  };
}

// ------------------------------------------------------------------ PAÍSES
interface MapPanel {
  box: Box;
  places: Place[];
  codes: string[];
}

function polygonsOf(f: CountryFeature): Position[][][] {
  if (!f.geometry) return [];
  return f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : (f.geometry as MultiPolygon).coordinates;
}

function inRing(ring: Position[], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Longitud de referencia del panel (la del lugar con más carreras). */
function panelLon(panel: MapPanel): number {
  return [...panel.places].sort((a, b) => b.runs - a.runs)[0]?.lon ?? 0;
}

/** Caja de las partes de los países que contienen lugares (para no encuadrar la Guayana Francesa…). */
function extentFor(panel: MapPanel, byCode: Map<string, CountryFeature>): [[number, number], [number, number]] {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  // Longitudes relativas a la del panel: así el antimeridiano no estira el mapa a todo el mundo.
  const lon0 = panelLon(panel);
  const add = (xAbs: number, y: number) => {
    const x = lon0 + ((((xAbs - lon0 + 540) % 360) - 180));
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  };
  for (const p of panel.places) add(p.lon, p.lat);
  for (const code of panel.codes) {
    const feat = byCode.get(code);
    if (!feat) continue;
    const mine = panel.places.filter((p) => p.country === code);
    for (const poly of polygonsOf(feat)) {
      if (mine.some((p) => inRing(poly[0], p.lon, p.lat))) for (const [x, y] of poly[0]) add(x, y);
    }
  }
  const spanX = Math.max(6, x1 - x0), spanY = Math.max(4, y1 - y0);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return [
    [cx - spanX * 0.62, cy - spanY * 0.62],
    [cx + spanX * 0.62, cy + spanY * 0.62],
  ];
}

function clusterPlaces(places: Place[]): Place[][] {
  const sorted = [...places].sort((a, b) => b.runs - a.runs);
  const clusters: { c: [number, number]; items: Place[] }[] = [];
  for (const p of sorted) {
    let best: (typeof clusters)[number] | null = null;
    for (const c of clusters) {
      const dx = ((((p.lon - c.c[1] + 540) % 360) - 180) * Math.cos((p.lat * Math.PI) / 180));
      const d = Math.sqrt(dx * dx + (p.lat - c.c[0]) ** 2) * 111;
      if (d < 2600) {
        best = c;
        break;
      }
    }
    if (best) best.items.push(p);
    else clusters.push({ c: [p.lat, p.lon], items: [p] });
  }
  return clusters.map((c) => c.items).sort((a, b) => b.reduce((s, p) => s + p.runs, 0) - a.reduce((s, p) => s + p.runs, 0));
}

export function countriesCard(env: DeckEnv): Card {
  const { fmt, stats: s, countries } = env;
  const nC = s.countries.length;
  const oneCountry = nC <= 1;
  const byCode = new Map<string, CountryFeature>();
  for (const feat of countries?.features ?? []) if (feat.id) byCode.set(feat.id as string, feat);
  const clusters = clusterPlaces(s.places);
  const panels: MapPanel[] = [];
  const codes = (cl: Place[]) => [...new Set(cl.map((p) => p.country).filter((c): c is string => !!c))];
  const extra = clusters.slice(1).filter((cl) => cl.some((p) => p.country)).slice(0, 3);
  // Con lugares lejanos (otro continente), el mapa principal se acorta y van recuadros debajo.
  const mainBox: Box = { x: M, y: 640, w: CW, h: extra.length ? 560 : 780 };
  if (clusters.length) {
    panels.push({ box: mainBox, places: clusters[0], codes: codes(clusters[0]) });
    const gap = 20;
    const iw = (CW - gap * (extra.length - 1)) / Math.max(1, extra.length);
    extra.forEach((cl, i) => {
      panels.push({ box: { x: M + i * (iw + gap), y: mainBox.y + mainBox.h + gap, w: iw, h: 220 }, places: cl, codes: codes(cl) });
    });
  }
  const mapBottom = mainBox.y + mainBox.h + (extra.length ? 20 + 220 : 0);
  const visited = new Set(s.countries.map((c) => c.code));
  return {
    id: 'countries',
    theme: 'light',
    duration: 8000,
    render(f) {
      const { ctx, theme } = f;
      kicker(f, fmt.t('Dónde corriste', 'Where you ran'), M, KICK);
      const size = 220;
      const base = KICK + 64 + capRatio(ctx) * size;
      if (oneCountry) {
        const nCities = s.cities.length;
        heroNumber(f, fmt.num(nCities), fmt.t(nCities === 1 ? 'CIUDAD' : 'CIUDADES', nCities === 1 ? 'CITY' : 'CITIES'), M, base, size, { start: 100, unitScale: 0.42 });
      } else {
        heroNumber(f, fmt.num(nC), fmt.t('PAÍSES', 'COUNTRIES'), M, base, size, { start: 100, unitScale: 0.42 });
      }
      const geo = f.memo('geo', () =>
        panels.map((pn) => {
          const ext = extentFor(pn, byCode);
          const feature = { type: 'MultiPoint' as const, coordinates: [[ext[0][0], ext[0][1]], [ext[1][0], ext[1][1]]] };
          const proj = geoMercator()
            .rotate([-panelLon(pn), 0])
            .fitExtent([[pn.box.x + 14, pn.box.y + 14], [pn.box.x + pn.box.w - 14, pn.box.y + pn.box.h - 14]], feature);
          return { proj };
        }),
      );
      // Capa base: tierra gris y países visitados (se iluminan en animación aparte).
      const base0 = f.layer('base', (g) => {
        panels.forEach((pn, i) => {
          const { proj } = geo[i];
          g.save();
          roundRect(g, pn.box.x, pn.box.y, pn.box.w, pn.box.h, i === 0 ? 30 : 20);
          g.fillStyle = i === 0 ? 'rgba(18,18,18,0.03)' : COLORS.paper;
          g.fill();
          if (i > 0) {
            g.strokeStyle = 'rgba(18,18,18,0.18)';
            g.lineWidth = 3;
            g.stroke();
          }
          g.clip();
          const path = geoPath(proj, g);
          g.beginPath();
          for (const c of countries?.features ?? []) if (!visited.has(c.id as string)) path(c);
          g.fillStyle = 'rgba(18,18,18,0.11)';
          g.fill();
          g.strokeStyle = COLORS.paper;
          g.lineWidth = 1.5;
          g.stroke();
          g.restore();
        });
      });
      const hot = f.layer('hot', (g) => {
        panels.forEach((pn, i) => {
          const { proj } = geo[i];
          g.save();
          roundRect(g, pn.box.x, pn.box.y, pn.box.w, pn.box.h, i === 0 ? 30 : 20);
          g.clip();
          const path = geoPath(proj, g);
          g.beginPath();
          for (const code of visited) {
            const feat = byCode.get(code);
            if (feat) path(feat);
          }
          g.fillStyle = COLORS.orange;
          g.fill();
          g.strokeStyle = COLORS.paper;
          g.lineWidth = 1.5;
          g.stroke();
          g.restore();
        });
      });
      const pBase = ease.outCubic(prog(f.t, 500, 700));
      ctx.save();
      ctx.globalAlpha = pBase;
      ctx.drawImage(base0, 0, 0, W, H);
      ctx.globalAlpha = ease.outCubic(prog(f.t, 1100, 800));
      ctx.drawImage(hot, 0, 0, W, H);
      ctx.restore();
      // Puntos y etiquetas (una por país y sin pisarse entre ellas).
      const labeled = new Set<string>();
      const placed: { x0: number; x1: number; y0: number; y1: number }[] = [];
      panels.forEach((pn, i) => {
        const { proj } = geo[i];
        const sorted = [...pn.places].sort((a, b) => b.runs - a.runs);
        sorted.forEach((p, k) => {
          const xy = proj([p.lon, p.lat]);
          if (!xy) return;
          const a = ease.outBack(prog(f.t, 1500 + k * 40 + i * 200, 500));
          if (a <= 0) return;
          const r = Math.min(16, 5 + Math.sqrt(p.runs) * 1.6) * (i === 0 ? 1 : 0.8);
          ctx.save();
          ctx.fillStyle = COLORS.ink;
          ctx.beginPath();
          ctx.arc(xy[0], xy[1], r * a, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = COLORS.paper;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();
          const key = p.country ?? '';
          const label = oneCountry ? null : p.country ? fmt.country(p.country) : null;
          if (label && !labeled.has(key)) {
            setFont(ctx, 'text', i === 0 ? 26 : 22, 800);
            const tw = ctx.measureText(label).width;
            const fs = i === 0 ? 26 : 22;
            const fits = (right: boolean) => {
              const tx = right ? xy[0] - r - 10 : xy[0] + r + 10;
              const box = { x0: right ? tx - tw : tx, x1: right ? tx : tx + tw, y0: xy[1] + 9 - fs * 0.8, y1: xy[1] + 9 + fs * 0.25 };
              const inside = box.x0 >= pn.box.x + 6 && box.x1 <= pn.box.x + pn.box.w - 6 && box.y0 >= pn.box.y + 4 && box.y1 <= pn.box.y + pn.box.h - 4;
              const free = !placed.some((q) => box.x0 < q.x1 + 6 && box.x1 > q.x0 - 6 && box.y0 < q.y1 + 2 && box.y1 > q.y0 - 2);
              return inside && free ? box : null;
            };
            const prefRight = xy[0] > pn.box.x + pn.box.w * 0.7;
            const spot = fits(prefRight) ?? fits(!prefRight);
            if (!spot) return;
            placed.push(spot);
            labeled.add(key);
            const right = spot.x0 < xy[0];
            const la = prog(f.t, 1900 + i * 200, 500);
            ctx.save();
            ctx.globalAlpha = la;
            const tx = right ? xy[0] - r - 10 : xy[0] + r + 10;
            ctx.lineWidth = 6;
            ctx.strokeStyle = COLORS.paper;
            ctx.lineJoin = 'round';
            ctx.textAlign = right ? 'right' : 'left';
            ctx.strokeText(label, tx, xy[1] + 9);
            ctx.fillStyle = COLORS.ink;
            ctx.fillText(label, tx, xy[1] + 9);
            ctx.restore();
          }
        });
      });
      // Lista
      const listY = mapBottom + 80;
      const maxRows = 6;
      const rows = oneCountry ? s.cities.slice(0, maxRows).map((c) => ({ n: c.runs, label: c.name })) : s.countries.slice(0, maxRows).map((c) => ({ n: c.runs, label: fmt.country(c.code) }));
      rows.forEach((row, i) => {
        fadeUp(f, 1700 + i * 110, () => {
          const col = i % 2, line = Math.floor(i / 2);
          const x = M + col * (CW / 2);
          const yy = listY + line * 78;
          setFont(ctx, 'display', 58);
          ctx.fillStyle = COLORS.orange;
          const w = drawTracked(ctx, fmt.num(row.n), x, yy, 0);
          setFont(ctx, 'text', 32, 700);
          ctx.fillStyle = theme.fg;
          const maxW = CW / 2 - w - 40;
          let label = row.label;
          while (ctx.measureText(label).width > maxW && label.length > 4) label = label.slice(0, -2) + '…';
          ctx.fillText(label, x + w + 16, yy - 4);
        });
      });
      if (s.indoorRuns > 0) {
        fadeUp(f, 2300, () => {
          setFont(ctx, 'text', 28, 600);
          ctx.fillStyle = theme.sub;
          const t = fmt.t(
            `Y ${fmt.num(s.indoorRuns)} ${fmt.plural(s.indoorRuns, 'carrera', 'carreras')} sin GPS (cinta o interior).`,
            `Plus ${fmt.num(s.indoorRuns)} ${fmt.plural(s.indoorRuns, 'run', 'runs')} without GPS (treadmill or indoors).`,
          );
          const noteY = listY + Math.ceil(rows.length / 2) * 78 + 20;
          if (noteY < 1790) ctx.fillText(t, M, noteY);
        });
      }
    },
  };
}

export function hasMapData(env: DeckEnv): boolean {
  return !!env.countries && env.stats.places.length > 0;
}

export type { Frame };
