import { geoInterpolate, geoMercator, geoNaturalEarth1, geoPath } from 'd3-geo';
import { ease, prog, rng } from '../anim';
import { belowHero, counting, fadeUp, headline, heroNumber, kicker, paragraph, ribbon } from '../blocks';
import type { Card, DeckEnv, Frame } from '../card';
import { COLORS, CW, H, M, W, capRatio, cumulative, drawTracked, fitRoute, fitSize, layoutRich, roundRect, setFont, tracePartial, trackedWidth, type Box } from '../kit';
import { EARTH_KM, MARATHON_M, pickDestination, pickLandmark } from '../../stats/equivalences';
import { localFromDoy, daysInYear } from '../../stats/time';
import { marathonsLabel, yearDelta } from './common';
import type { CardKey } from '../../i18n/cards/es';

const KICK = 330;

/** Base de la cifra protagonista: su borde superior queda a `gap` px de la etiqueta. */
function heroBaseline(f: Frame, size: number, top = KICK + 64): number {
  return top + capRatio(f.ctx) * size;
}

// ------------------------------------------------------------------ INTRO
export function introCard(env: DeckEnv): Card {
  const { fmt, stats: s } = env;
  return {
    id: 'intro',
    theme: 'orange',
    duration: 6500,
    render(f) {
      const { ctx } = f;
      const name = fmt.upper(s.name || fmt.m('runner'));
      const size = fitSize(ctx, name, 'display', 290, CW);
      // Nombres con tilde (ÁLVARO, ÀLEX, ÍÑIGO): la tilde no puede rozar el antetítulo de encima.
      const accentTop = f.memo(`introTop:${name}:${size}`, () => {
        setFont(ctx, 'display', size);
        // headline() lo dibuja en mayúsculas también en chino, japonés y coreano ("MARÍA").
        return KICK + 30 + ctx.measureText(name.toUpperCase()).actualBoundingBoxAscent;
      });
      const nameY = Math.max(heroBaseline(f, size, KICK + 70), accentTop);
      const yearY = nameY + 290 * 0.98 + 10;
      const vars = { runs: s.runs, year: String(s.year), date: fmt.date(s.periodEnd), dateArt: fmt.dateArt(s.periodEnd) };
      const text = !s.isPartialYear ? fmt.m('intro.full', vars) : s.daysInPeriod <= 1 ? fmt.m('intro.jan1', vars) : fmt.m('intro.partial', vars);
      const PARA = 42, PARA_W = 800, textY = yearY + 110;
      // La ruta ocupa el hueco que queda DEBAJO del texto (dos, tres o cuatro líneas según el idioma
      // y la fecha): con la caja fija, el trazo pisaba la última línea.
      const route = f.memo(`route:${text}:${Math.round(textY)}`, () => {
        const lay = layoutRich(ctx, text, PARA_W, PARA, 500, 800, 1.34);
        const top = textY + (lay.lines.length - 1) * lay.lineHeight + PARA * 0.3 + 62;
        const box = { x: 70, y: top, w: 940, h: Math.max(240, 1745 - top) };
        const t = s.longestRun?.track ?? s.routes[0]?.track;
        // Sin GPS: una pista de atletismo (dos rectas y dos curvas) que se dibuja igual que una ruta.
        const pts = t ? fitRoute(t, box, 0.02) : stadium(W / 2, box.y + box.h / 2, 860, Math.min(400, box.h - 30));
        return { pts, cum: cumulative(pts) };
      });
      ribbon(f, route.pts, route.cum, ease.inOutCubic(prog(f.t, 900, 2800)), 'rgba(255,255,255,0.18)', 22, false);
      ribbon(f, route.pts, route.cum, ease.inOutCubic(prog(f.t, 900, 2800)), COLORS.white, 6);
      kicker(f, fmt.m('intro.kicker'), M, KICK, 80);
      headline(f, [name], M, nameY, size, { color: COLORS.ink, start: 200 });
      headline(f, [String(s.year)], M, yearY, 290, { color: COLORS.white, start: 380 });
      paragraph(f, text, M, textY, PARA_W, PARA, { start: 800, color: COLORS.ink, hl: COLORS.white });
    },
  };
}

/** Óvalo de pista de atletismo centrado en (cx, cy), empezando al final de la recta de abajo. */
function stadium(cx: number, cy: number, w: number, h: number): Float64Array {
  const r = h / 2, straight = w - h;
  const pts: number[] = [];
  const steps = 48;
  // Recta de abajo (de derecha a izquierda), curva izquierda, recta de arriba, curva derecha.
  for (let i = 0; i <= steps; i++) pts.push(cx + straight / 2 - (straight * i) / steps, cy + r);
  for (let i = 1; i <= steps; i++) {
    const a = Math.PI / 2 + (Math.PI * i) / steps;
    pts.push(cx - straight / 2 + r * Math.cos(a), cy + r * Math.sin(a));
  }
  for (let i = 1; i <= steps; i++) pts.push(cx - straight / 2 + (straight * i) / steps, cy - r);
  for (let i = 1; i <= steps; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / steps;
    pts.push(cx + straight / 2 + r * Math.cos(a), cy + r * Math.sin(a));
  }
  return new Float64Array(pts);
}

// ------------------------------------------------------------------ DISTANCIA
export function distanceCard(env: DeckEnv): Card {
  const { fmt, stats: s, countries } = env;
  const km = s.distance / 1000;
  const home = s.home;
  // Sin nombre de ciudad no hay frase "De X a Y" ni mapa (islas pequeñas, mitad del océano…).
  const dest = home?.name ? pickDestination(home, km, fmt.lang) : null;
  const marathons = s.distance / MARATHON_M;
  const homeName = home?.name ?? null;
  const delta = s.prev ? yearDelta(fmt, s.distance, s.prev) : null;
  return {
    id: 'distance',
    theme: 'dark',
    duration: 7500,
    render(f) {
      const { ctx, theme } = f;
      kicker(f, fmt.m('distance.kicker'), M, KICK);
      const size = 330;
      const base = heroBaseline(f, size);
      heroNumber(f, fmt.dist(counting(f, s.distance, 150, 1800)), fmt.upper(fmt.distUnit), M, base, size, { start: 100, unitScale: 0.32, fit: fmt.dist(s.distance) });
      let y = base + 150;
      let lines: string[];
      let colors: (string | undefined)[] = [];
      if (dest && homeName) {
        lines = fmt.lines('distance.fromTo', { home: homeName, dest: dest.name });
        colors = lines.map((_l, i) => (i === lines.length - 1 ? COLORS.orange : theme.fg));
      } else if (marathons >= 1) {
        lines = fmt.lines('distance.marathons', { n: fmt.round(marathons, marathons < 10 ? 1 : 0) });
      } else {
        lines = fmt.lines('distance.laps', { n: Math.round(s.distance / 400) });
      }
      const hs = Math.min(112, ...lines.map((l) => fitSize(ctx, fmt.upper(l), 'display', 112, CW)));
      y = belowHero(f, fmt.dist(s.distance), size, base, lines[0], hs);
      headline(f, lines, M, y, hs, { start: 500, colors });
      y += hs * 0.98 * (lines.length - 1) + 92;
      const marathonsTxt = marathonsLabel(fmt, marathons);
      const worldPct = (km / EARTH_KM) * 100;
      const text = dest && homeName
        ? fmt.m('distance.textDest', { home: homeName, dest: dest.name, dist: fmt.distWithUnit(dest.km * 1000, 0), marathons: marathonsTxt })
        : marathons >= 1
          ? km >= EARTH_KM
            ? fmt.m('distance.textWorldLaps', { marathons: marathonsTxt, n: fmt.round(km / EARTH_KM, 1) })
            : fmt.m('distance.textWorld', { marathons: marathonsTxt, pct: fmt.pct(worldPct / 100, 1) })
          : fmt.m('distance.textTrack', { n: Math.round(s.distance / 400) });
      paragraph(f, text, M, y, CW, 38, { start: 800 });

      // Mapa con el arco de casa al destino.
      const box: Box = { x: M, y: 1255, w: CW, h: 470 };
      if (dest && home && countries) {
        const geo = f.memo('arc', () => {
          // Longitud del destino relativa a casa (Sídney → Auckland no da la vuelta al mundo).
          const rel = (((dest.lon - home.lon + 540) % 360) - 180);
          const pad = Math.max(3, Math.abs(dest.lat - home.lat) * 0.35, Math.abs(rel) * 0.2);
          // MultiPoint (no polígono): d3-geo interpreta el sentido de giro de los anillos.
          const extent = {
            type: 'MultiPoint' as const,
            coordinates: [
              [home.lon + Math.min(0, rel) - pad * 1.6, Math.min(home.lat, dest.lat) - pad],
              [home.lon + Math.max(0, rel) + pad * 1.6, Math.max(home.lat, dest.lat) + pad],
            ],
          };
          const proj = geoMercator()
            .rotate([-(home.lon + rel / 2), 0])
            .fitExtent([[box.x, box.y], [box.x + box.w, box.y + box.h]], extent);
          const interp = geoInterpolate([home.lon, home.lat], [dest.lon, dest.lat]);
          const arc: number[] = [];
          for (let i = 0; i <= 120; i++) {
            const p = proj(interp(i / 120));
            if (p) arc.push(p[0], p[1]);
          }
          const pts = new Float64Array(arc);
          return { proj, pts, cum: cumulative(pts) };
        });
        const land = f.layer('land', (g) => {
          g.save();
          roundRect(g, box.x, box.y, box.w, box.h, 28);
          g.clip();
          g.fillStyle = 'rgba(243,238,230,0.035)';
          g.fillRect(box.x, box.y, box.w, box.h);
          const path = geoPath(geo.proj, g);
          g.beginPath();
          for (const c of countries.features) path(c);
          g.fillStyle = 'rgba(243,238,230,0.13)';
          g.fill();
          g.strokeStyle = COLORS.ink;
          g.lineWidth = 1.2;
          g.stroke();
          g.restore();
        });
        const pMap = ease.outCubic(prog(f.t, 1000, 900));
        ctx.save();
        ctx.globalAlpha = pMap;
        ctx.drawImage(land, 0, 0, W, H);
        ctx.restore();
        const pArc = ease.inOutCubic(prog(f.t, 1500, 2200));
        if (pMap > 0) {
          ctx.save();
          ctx.globalAlpha = pMap;
          ctx.fillStyle = COLORS.paper;
          ctx.beginPath();
          ctx.arc(geo.pts[0], geo.pts[1], 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.save();
        ctx.setLineDash([2, 16]);
        ribbon(f, geo.pts, geo.cum, pArc, COLORS.orange, 7, false);
        ctx.restore();
        ribbon(f, geo.pts, geo.cum, pArc, COLORS.orange, 7, true);
        const n = geo.pts.length;
        const pEnd = ease.outBack(prog(f.t, 3600, 600));
        if (pEnd > 0) {
          const ex = geo.pts[n - 2], ey = geo.pts[n - 1];
          ctx.save();
          ctx.strokeStyle = COLORS.orange;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(ex, ey, 26 * pEnd, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          labelAt(f, fmt.upper(homeName!), geo.pts[0], geo.pts[1], COLORS.paper, pMap, box);
          labelAt(f, fmt.upper(dest.name), ex, ey, COLORS.orange, pEnd, box);
        }
      } else if (countries) {
        // Sin destino: el mundo entero y tus kilómetros dándole la vuelta por el ecuador.
        const world = f.memo('world', () => {
          const wb: Box = { x: M - 20, y: 1245, w: CW + 40, h: 440 };
          const proj = geoNaturalEarth1().fitExtent([[wb.x, wb.y], [wb.x + wb.w, wb.y + wb.h]], { type: 'Sphere' });
          const laps = Math.min(km / EARTH_KM, 3);
          const L0 = home ? home.lon : 0;
          const segs: Float64Array[] = [];
          let cur: number[] = [];
          for (let a = 0; a <= laps * 360 + 1e-9; a += 1) {
            const lon = ((L0 + a + 540) % 360) - 180;
            const p = proj([lon, 0]);
            if (!p) continue;
            if (cur.length >= 2 && Math.abs(p[0] - cur[cur.length - 2]) > wb.w / 2) {
              segs.push(new Float64Array(cur));
              cur = [];
            }
            cur.push(p[0], p[1]);
          }
          if (cur.length >= 2) segs.push(new Float64Array(cur));
          const lens = segs.map((sg) => cumulative(sg));
          const total = lens.reduce((acc, c) => acc + c[c.length - 1], 0);
          return { proj, segs, lens, total, wb };
        });
        const land = f.layer('world', (g) => {
          const path = geoPath(world.proj, g);
          g.beginPath();
          path({ type: 'Sphere' });
          g.fillStyle = 'rgba(243,238,230,0.035)';
          g.fill();
          g.beginPath();
          for (const c of countries.features) path(c);
          g.fillStyle = 'rgba(243,238,230,0.13)';
          g.fill();
          g.beginPath();
          path({ type: 'LineString', coordinates: Array.from({ length: 73 }, (_, i) => [-180 + i * 5, 0]) });
          g.setLineDash([3, 10]);
          g.strokeStyle = 'rgba(243,238,230,0.35)';
          g.lineWidth = 2;
          g.stroke();
        });
        const pMap = ease.outCubic(prog(f.t, 1000, 900));
        ctx.save();
        ctx.globalAlpha = pMap;
        ctx.drawImage(land, 0, 0, W, H);
        ctx.restore();
        const pLine = ease.inOutCubic(prog(f.t, 1500, 2400));
        let left = world.total * pLine;
        let end: [number, number] | null = null;
        ctx.save();
        ctx.strokeStyle = COLORS.orange;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let i = 0; i < world.segs.length && left > 0; i++) {
          const sg = world.segs[i], c = world.lens[i];
          const len = c[c.length - 1];
          end = tracePartial(ctx, sg, c, Math.min(len, left));
          ctx.stroke();
          left -= len;
        }
        if (pMap > 0 && world.segs.length) {
          ctx.fillStyle = COLORS.paper;
          ctx.beginPath();
          ctx.arc(world.segs[0][0], world.segs[0][1], 10, 0, Math.PI * 2);
          ctx.fill();
        }
        if (end && pLine > 0) {
          ctx.fillStyle = COLORS.orange;
          ctx.beginPath();
          ctx.arc(end[0], end[1], 12, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        fadeUp(f, 1300, () => {
          setFont(ctx, 'text', 24, 800);
          ctx.fillStyle = theme.sub;
          const y0 = world.wb.y + world.wb.h + 46;
          drawTracked(ctx, fmt.upper(fmt.m('distance.world')), M, y0, 4);
          drawTracked(ctx, fmt.upper(fmt.distWithUnit(EARTH_KM * 1000, 0)), W - M, y0, 4, 'right');
        });
      } else {
        // Sin mapa (no cargó): barra de progreso de la vuelta al mundo.
        fadeUp(f, 1000, () => {
          const pct = Math.min(1, km / EARTH_KM);
          const p = ease.inOutCubic(prog(f.t, 1300, 1800));
          ctx.fillStyle = theme.faint;
          roundRect(ctx, M, 1500, CW, 28, 14);
          ctx.fill();
          ctx.fillStyle = COLORS.orange;
          roundRect(ctx, M, 1500, Math.max(28, CW * pct * p), 28, 14);
          ctx.fill();
          setFont(ctx, 'text', 24, 800);
          ctx.fillStyle = theme.sub;
          drawTracked(ctx, fmt.upper(fmt.m('distance.world')), M, 1580, 4);
          drawTracked(ctx, fmt.upper(fmt.distWithUnit(EARTH_KM * 1000, 0)), W - M, 1580, 4, 'right');
        });
      }
      // Comparación con el año anterior (mismas fechas si el año sigue en curso), suba o baje.
      if (delta) {
        fadeUp(f, 2000, () => {
          setFont(ctx, 'text', 21, 800);
          ctx.fillStyle = theme.sub;
          drawTracked(ctx, delta.caption, W - M, KICK, 3, 'right');
          setFont(ctx, 'display', 64);
          ctx.fillStyle = delta.up ? COLORS.orange : theme.fg;
          drawTracked(ctx, delta.value, W - M, KICK - 44, 0, 'right');
        });
      }
    },
  };
}

function labelAt(f: Frame, text: string, x: number, y: number, color: string, alpha: number, box?: Box) {
  if (alpha <= 0) return;
  const { ctx } = f;
  ctx.save();
  ctx.globalAlpha *= alpha;
  setFont(ctx, 'text', 24, 800);
  ctx.fillStyle = color;
  const w = trackedWidth(ctx, text, 3);
  const minX = (box?.x ?? M) + 18, maxX = (box ? box.x + box.w : W - M) - 18;
  // A la derecha del punto si cabe; si no, a la izquierda; y siempre dentro del mapa.
  let left = x + 36;
  if (left + w > maxX) left = x - 36 - w;
  left = Math.max(minX, Math.min(maxX - w, left));
  const ty = y + 8 + (left < x && left + w > x - 20 ? 40 : 0);
  drawTracked(ctx, text, left, ty, 3, 'left');
  ctx.restore();
}

// ------------------------------------------------------------------ TIEMPO
export function timeCard(env: DeckEnv): Card {
  const { fmt, stats: s } = env;
  const hours = s.moving / 3600;
  const days = s.moving / 86400;
  const totalDays = daysInYear(s.year);
  return {
    id: 'time',
    theme: 'orange',
    duration: 7500,
    render(f) {
      const { ctx } = f;
      kicker(f, fmt.m('time.kicker'), M, KICK);
      const size = 330;
      const base = heroBaseline(f, size);
      heroNumber(f, fmt.num(counting(f, hours, 150, 1600), 0), fmt.upper(fmt.m('unit.h')), M, base, size, { start: 100, unitScale: 0.32, fit: fmt.num(hours, 0) });
      const tLines = days >= 1 ? fmt.lines('time.days', { n: fmt.round(days, 1) }) : fmt.lines('time.minutes', { n: Math.round(s.moving / 60) });
      const y = belowHero(f, fmt.num(hours, 0), size, base, tLines[0], 112);
      headline(f, tLines, M, y, 112, { start: 450, color: COLORS.ink });
      // Si empezaste a correr a mitad de año, lo justo es contar desde tu primera carrera.
      const since = s.firstRunDoy >= 45 && s.activeDays >= 3 ? s.firstRunDoy : 0;
      const dayspan = s.daysInPeriod - since;
      const pct = s.activeDays / Math.max(1, dayspan);
      const firstDay = localFromDoy(s.year, since);
      const tv = { active: s.activeDays, span: dayspan, days: s.daysInPeriod, pct: fmt.pct(pct), date: fmt.date(firstDay), dateArt: fmt.dateArt(firstDay) };
      const text = since ? fmt.m('time.since', tv) : s.isPartialYear ? fmt.m('time.partial', tv) : fmt.m('time.full', tv);
      paragraph(f, text, M, y + 112 * 0.98 + 92, CW, 38, { start: 750, color: COLORS.ink, hl: COLORS.white });

      // Anillo de 365 días.
      const cx = W / 2, cy = 1470, R = 255;
      const sweep = ease.inOutCubic(prog(f.t, 1100, 2000));
      ctx.save();
      ctx.lineCap = 'round';
      for (let d = 0; d < totalDays; d++) {
        const frac = d / totalDays;
        if (frac > sweep) break;
        const a = -Math.PI / 2 + frac * Math.PI * 2;
        const active = s.activeDayFlags[d] === 1;
        const future = d >= s.daysInPeriod || d < since;
        const r0 = active ? R - 64 : R - 18;
        const r1 = active ? R + 14 : R;
        ctx.strokeStyle = active ? COLORS.white : future ? 'rgba(18,18,18,0.07)' : 'rgba(18,18,18,0.22)';
        ctx.lineWidth = active ? 3.6 : 2.4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.stroke();
      }
      ctx.restore();
      fadeUp(f, 1800, () => {
        setFont(ctx, 'display', 118);
        ctx.fillStyle = COLORS.white;
        ctx.textAlign = 'center';
        ctx.fillText(fmt.pct(pct), cx, cy + 28);
        ctx.textAlign = 'left';
        setFont(ctx, 'text', 22, 800);
        ctx.fillStyle = COLORS.ink;
        drawTracked(ctx, fmt.upper(fmt.m('time.ofDays')), cx, cy + 74, fmt.cased ? 4 : 0, 'center');
      });
    },
  };
}

// ------------------------------------------------------------------ MESES
export function monthsCard(env: DeckEnv): Card {
  const { fmt, stats: s } = env;
  const best = s.bestMonth;
  const bm = s.months[best];
  const lastMonth = s.isPartialYear ? s.periodEnd.mo - 1 : 11;
  return {
    id: 'months',
    theme: 'dark',
    duration: 7000,
    render(f) {
      const { ctx, theme } = f;
      kicker(f, fmt.m('months.kicker'), M, KICK);
      const hs = 150;
      const y = heroBaseline(f, hs, KICK + 70);
      const mLines = fmt.lines('months.title', { month: fmt.month(best) });
      headline(f, mLines, M, y, hs, { start: 150, colors: mLines.map((l) => (l.toLowerCase().includes(fmt.month(best).toLowerCase()) ? COLORS.orange : theme.fg)), lineHeight: 0.95 });
      const bw = s.bestWeek;
      const weekTxt = bw
        ? ` ${fmt.m('months.week', { dist: fmt.distWithUnit(bw.distance, 0), range: fmt.dateRange(localFromDoy(s.year, bw.startDoy), localFromDoy(s.year, bw.endDoy), true) })}`
        : '';
      const text = `${fmt.m('months.text', { dist: fmt.distWithUnit(bm.distance, 0), runs: bm.runs })}${weekTxt}`;
      paragraph(f, text, M, y + hs * 0.95 + 92, CW, 38, { start: 600 });

      // Barras
      const top = 1060, bottom = 1640;
      const max = Math.max(...s.months.map((m) => m.distance), 1);
      const gap = 16;
      const bw2 = (CW - gap * 11) / 12;
      for (let i = 0; i < 12; i++) {
        const x = M + i * (bw2 + gap);
        const p = ease.outQuart(prog(f.t, 900 + i * 70, 900));
        const h = Math.max(6, ((bottom - top) * s.months[i].distance) / max) * p;
        const future = i > lastMonth;
        if (future) {
          ctx.save();
          ctx.strokeStyle = theme.faint;
          ctx.setLineDash([6, 8]);
          ctx.lineWidth = 2;
          roundRect(ctx, x + 1, bottom - 60, bw2 - 2, 60, 8);
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.fillStyle = i === best ? COLORS.orange : 'rgba(243,238,230,0.22)';
          roundRect(ctx, x, bottom - h, bw2, h, 8);
          ctx.fill();
        }
        ctx.save();
        ctx.globalAlpha = prog(f.t, 900 + i * 70, 500);
        setFont(ctx, 'text', 26, 800);
        ctx.fillStyle = i === best ? COLORS.orange : theme.sub;
        drawTracked(ctx, fmt.monthLetter(i), x + bw2 / 2, bottom + 52, 0, 'center');
        ctx.restore();
      }
      const pv = ease.outBack(prog(f.t, 2000, 600));
      if (pv > 0) {
        const x = M + best * (bw2 + gap) + bw2 / 2;
        const h = ((bottom - top) * bm.distance) / max;
        ctx.save();
        ctx.globalAlpha = Math.min(1, pv);
        setFont(ctx, 'display', 56);
        ctx.fillStyle = theme.fg;
        const label = fmt.dist(bm.distance, 0);
        const align = best < 2 ? 'left' : best > 9 ? 'right' : 'center';
        drawTracked(ctx, label, align === 'left' ? x - bw2 / 2 : align === 'right' ? x + bw2 / 2 : x, bottom - h - 22, 0, align);
        ctx.restore();
      }
    },
  };
}

// ------------------------------------------------------------------ DESNIVEL
export function elevationCard(env: DeckEnv): Card {
  const { fmt, stats: s } = env;
  const lm = pickLandmark(s.elevation)!;
  const lmName = fmt.m(`lm.${lm.landmark.key}` as CardKey);
  const lmShort = fmt.m(`lmShort.${lm.landmark.key}` as CardKey);
  let lines: string[];
  if (lm.times >= 1.95) lines = fmt.lines('elev.times', { n: fmt.round(lm.times, 1), lm: lmName });
  else if (lm.times >= 1.08) lines = fmt.lines('elev.more', { lm: lmName });
  else if (lm.times >= 0.98) lines = fmt.lines('elev.climbed', { lm: lmName });
  else lines = fmt.lines('elev.pct', { pct: fmt.pct(lm.times), lm: lmName });
  return {
    id: 'elevation',
    theme: 'light',
    duration: 7500,
    render(f) {
      const { ctx, theme } = f;
      kicker(f, fmt.m('elev.kicker'), M, KICK);
      const size = 330;
      const base = heroBaseline(f, size);
      heroNumber(f, fmt.elev(counting(f, s.elevation, 150, 1700)), fmt.upper(fmt.elevUnit), M, base, size, { start: 100, unitScale: 0.32, fit: fmt.elev(s.elevation) });
      const hs = Math.min(112, ...lines.map((l) => fitSize(ctx, fmt.upper(l), 'display', 112, CW)));
      const y = belowHero(f, fmt.elev(s.elevation), size, base, lines[0], hs);
      headline(f, lines, M, y, hs, { start: 450, colors: lines.map((_l, i) => (i === lines.length - 1 ? COLORS.orange : theme.fg)) });
      const parts: string[] = [];
      if (s.biggestClimb && s.biggestClimb.elevGain > 0)
        parts.push(fmt.m('elev.toughest', { elev: fmt.elevWithUnit(s.biggestClimb.elevGain), dist: fmt.distWithUnit(s.biggestClimb.distance), date: fmt.date(s.biggestClimb.local), dateArt: fmt.dateArt(s.biggestClimb.local) }));
      if (s.highestPoint && s.highestPoint.elevation >= 300) {
        const where = s.highestPoint.run.country ? fmt.country(s.highestPoint.run.country) : null;
        const elev = fmt.elevWithUnit(s.highestPoint.elevation);
        parts.push(where ? fmt.m('elev.highest', { elev, country: where }) : fmt.m('elev.highestNoCountry', { elev }));
      }
      paragraph(f, parts.join(' '), M, y + hs * 0.98 + 92, CW, 38, { start: 750 });

      // Montañas: N picos completos + uno parcial, se "llenan" de naranja.
      const full = Math.floor(lm.times);
      const partial = lm.times - full;
      const count = Math.min(6, full + (partial > 0.04 ? 1 : 0));
      const peaks = Math.max(1, count);
      const baseY = 1735;
      const maxH = 430;
      const pw = Math.min(330, (CW + (peaks - 1) * 90) / peaks);
      const totalW = peaks * pw - (peaks - 1) * 90;
      const x0 = W / 2 - totalW / 2;
      const fill = ease.inOutCubic(prog(f.t, 1300, 2200));
      for (let i = 0; i < peaks; i++) {
        const frac = i < full ? 1 : partial || 1;
        const px = x0 + i * (pw - 90);
        const h = maxH;
        const appear = ease.outCubic(prog(f.t, 900 + i * 120, 700));
        if (appear <= 0) continue;
        ctx.save();
        ctx.globalAlpha = appear;
        const path = landmarkPath(lm.landmark.key, px, pw, baseY, h);
        ctx.fillStyle = 'rgba(18,18,18,0.06)';
        ctx.fill(path, 'evenodd');
        ctx.save();
        ctx.clip(path, 'evenodd');
        const level = baseY - h * frac * fill;
        ctx.fillStyle = i < full ? COLORS.orange : COLORS.orangeSoft;
        ctx.fillRect(px - 10, level, pw + 20, baseY - level + 10);
        ctx.restore();
        ctx.strokeStyle = theme.fg;
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.stroke(path);
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = prog(f.t, 900, 600);
      ctx.fillStyle = theme.fg;
      ctx.fillRect(M - 30, baseY, CW + 60, 4);
      ctx.restore();
      // Referencia de cumbre
      const pl = prog(f.t, 2600, 600);
      if (pl > 0) {
        const sy = baseY - maxH;
        ctx.save();
        ctx.globalAlpha = pl;
        ctx.strokeStyle = theme.sub;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 10]);
        ctx.beginPath();
        ctx.moveTo(M - 30, sy);
        ctx.lineTo(W - M + 30, sy);
        ctx.stroke();
        ctx.setLineDash([]);
        setFont(ctx, 'text', 22, 800);
        ctx.fillStyle = theme.sub;
        const label = fmt.upper(`${lmShort} · ${fmt.elevWithUnit(lm.landmark.height)}`);
        drawTracked(ctx, label, W - M, sy - 16, fmt.cased ? 3 : 0, 'right');
        ctx.restore();
      }
    },
  };
}

// ------------------------------------------------------------------ RITMO
export function paceCard(env: DeckEnv): Card {
  const { fmt, stats: s } = env;
  const trend = s.paceTrend;
  const deltaS = trend ? fmt.paceDeltaSeconds(trend.first - trend.last) : 0;
  const improved = !!trend && deltaS >= 5;
  const slower = !!trend && deltaS <= -5;
  const monthsPace = s.months.map((m) => (m.runs >= 2 && m.distance > 3000 ? m.moving / m.distance : NaN));
  const validMonths = monthsPace.filter((v) => Number.isFinite(v)).length;
  // Sin evolución por meses: tira con el ritmo de cada carrera.
  const strip = validMonths < 3 && s.paceSamples.length >= 3 ? paceStrip(s.paceSamples, s.avgPace) : null;
  return {
    id: 'pace',
    theme: 'orange',
    duration: 7000,
    render(f) {
      const { ctx } = f;
      kicker(f, fmt.m('pace.kicker'), M, KICK);
      const size = 330;
      const base = heroBaseline(f, size);
      heroNumber(f, fmt.pace(s.avgPace), fmt.upper(fmt.paceUnit), M, base, size, { start: 100, unitScale: 0.26 });
      const y = base + 150;
      const lines = improved
        ? fmt.lines('pace.improved', { n: deltaS })
        : slower
          ? fmt.lines(fmt.imperial ? 'pace.slowerMi' : 'pace.slowerKm')
          : trend
            ? fmt.lines('pace.steady')
            : fmt.lines('pace.cruise');
      headline(f, lines, M, y, 112, { start: 450, color: COLORS.ink });
      const parts: string[] = [];
      if (trend && (improved || slower))
        parts.push(fmt.m('pace.trend', { first: `${fmt.pace(trend.first)}${fmt.paceUnit}`, last: `${fmt.pace(trend.last)}${fmt.paceUnit}` }));
      if (s.fastestRun)
        parts.push(fmt.m('pace.fastest', { pace: `${fmt.pace(s.fastestRun.pace)}${fmt.paceUnit}`, dist: fmt.distWithUnit(s.fastestRun.distance), date: fmt.date(s.fastestRun.local), dateArt: fmt.dateArt(s.fastestRun.local) }));
      paragraph(f, parts.join(' '), M, y + 112 * 0.98 + 92, CW, 38, { start: 750, color: COLORS.ink, hl: COLORS.white });

      // Gráfica de ritmo por mes (más rápido = más arriba).
      const valid = monthsPace.map((v, i) => ({ v, i })).filter((p) => Number.isFinite(p.v));
      if (valid.length >= 3) {
        const box = { x: M + 10, y: 1330, w: CW - 20, h: 330 };
        const lo = Math.min(...valid.map((p) => p.v)), hi = Math.max(...valid.map((p) => p.v));
        const span = Math.max(hi - lo, 0.012);
        const X = (i: number) => box.x + (i / 11) * box.w;
        const Y = (v: number) => box.y + ((v - lo) / span) * box.h;
        const pts = new Float64Array(valid.flatMap((p) => [X(p.i), Y(p.v)]));
        const cum = cumulative(pts);
        const p = ease.inOutCubic(prog(f.t, 1200, 1800));
        // Área
        ctx.save();
        ctx.globalAlpha = 0.12 * p;
        ctx.fillStyle = COLORS.ink;
        ctx.beginPath();
        ctx.moveTo(pts[0], box.y + box.h + 40);
        for (let k = 0; k < pts.length; k += 2) ctx.lineTo(pts[k], pts[k + 1]);
        ctx.lineTo(pts[pts.length - 2], box.y + box.h + 40);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ribbon(f, pts, cum, p, COLORS.ink, 6, false);
        valid.forEach((_q, k) => {
          const a = ease.outBack(prog(f.t, 1200 + (k / valid.length) * 1800, 400));
          if (a <= 0) return;
          ctx.fillStyle = COLORS.white;
          ctx.beginPath();
          ctx.arc(pts[k * 2], pts[k * 2 + 1], 11 * a, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = COLORS.ink;
          ctx.lineWidth = 4;
          ctx.stroke();
        });
        ctx.save();
        ctx.globalAlpha = prog(f.t, 1200, 600);
        for (let i = 0; i < 12; i++) {
          setFont(ctx, 'text', 24, 800);
          ctx.fillStyle = 'rgba(18,18,18,0.55)';
          // Centrada en su mes, pero sin salirse del margen ("GN" en catalán es de dos letras).
          const ml = fmt.monthLetter(i);
          const half = ctx.measureText(ml).width / 2;
          drawTracked(ctx, ml, Math.min(W - M - half, Math.max(M + half, X(i))), box.y + box.h + 92, 0, 'center');
        }
        setFont(ctx, 'text', 22, 800);
        ctx.fillStyle = 'rgba(18,18,18,0.55)';
        drawTracked(ctx, fmt.upper(fmt.m('pace.faster')), M, box.y - 44, fmt.cased ? 3 : 0);
        ctx.restore();
      } else if (strip) {
        const box = { x: M + 20, y: 1360, w: CW - 40, h: 250 };
        const X = (pace: number) => box.x + ((strip.slow - pace) / (strip.slow - strip.fast)) * box.w;
        // Eje
        ctx.save();
        ctx.globalAlpha = prog(f.t, 1000, 500);
        ctx.fillStyle = 'rgba(18,18,18,0.22)';
        ctx.fillRect(box.x, box.y + box.h / 2 - 1.5, box.w, 3);
        ctx.restore();
        strip.dots.forEach((d, k) => {
          const a = ease.outBack(prog(f.t, 1100 + (k / strip.dots.length) * 1400, 420));
          if (a <= 0) return;
          ctx.save();
          ctx.globalAlpha = d.best ? 1 : 0.42;
          ctx.fillStyle = d.best ? COLORS.white : COLORS.ink;
          ctx.beginPath();
          ctx.arc(X(d.pace), box.y + box.h / 2 + d.dy * (box.h / 2 - 18), d.r * a, 0, Math.PI * 2);
          ctx.fill();
          if (d.best) {
            ctx.strokeStyle = COLORS.ink;
            ctx.lineWidth = 4;
            ctx.stroke();
          }
          ctx.restore();
        });
        // Media
        const pa = ease.inOutCubic(prog(f.t, 2600, 600));
        if (pa > 0 && Number.isFinite(s.avgPace)) {
          const ax = X(Math.min(strip.slow, Math.max(strip.fast, s.avgPace)));
          ctx.save();
          ctx.fillStyle = COLORS.ink;
          ctx.fillRect(ax - 2, box.y + box.h / 2 - (box.h / 2 + 10) * pa, 4, (box.h + 20) * pa);
          ctx.restore();
        }
        fadeUp(f, 1300, () => {
          setFont(ctx, 'text', 22, 800);
          ctx.fillStyle = 'rgba(18,18,18,0.6)';
          drawTracked(ctx, fmt.upper(fmt.m('pace.slowerAxis')), box.x, box.y + box.h + 70, fmt.cased ? 3 : 0, 'left');
          drawTracked(ctx, fmt.upper(fmt.m('pace.fasterAxis')), box.x + box.w, box.y + box.h + 70, fmt.cased ? 3 : 0, 'right');
          setFont(ctx, 'display', 44);
          ctx.fillStyle = COLORS.ink;
          drawTracked(ctx, fmt.pace(strip.slow), box.x, box.y - 30, 0, 'left');
          drawTracked(ctx, fmt.pace(strip.fast), box.x + box.w, box.y - 30, 0, 'right');
        });
      }
    },
  };
}

/** Puntos de la tira de ritmos: un punto por carrera (tamaño según distancia), la más rápida destacada. */
function paceStrip(samples: { pace: number; distance: number }[], avg: number) {
  const sorted = [...samples].sort((a, b) => a.pace - b.pace);
  const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))))].pace;
  let fast = q(0), slow = q(1);
  if (sorted.length > 20) {
    fast = q(0.02);
    slow = q(0.98);
  }
  if (Number.isFinite(avg)) {
    fast = Math.min(fast, avg);
    slow = Math.max(slow, avg);
  }
  const span = Math.max(slow - fast, 0.03);
  fast -= span * 0.04;
  slow = fast + span * 1.08;
  const r = rng(samples.length * 7919 + Math.round(avg * 1e5));
  const step = Math.max(1, Math.ceil(samples.length / 260));
  const maxD = Math.max(...samples.map((x) => x.distance));
  const bestPace = sorted[0].pace;
  const dots = samples
    .filter((x, i) => i % step === 0 || x.pace === bestPace)
    .map((x) => ({
      pace: Math.min(slow, Math.max(fast, x.pace)),
      r: 7 + 13 * Math.sqrt(x.distance / maxD),
      dy: (r() - 0.5) * 1.6,
      best: x.pace === bestPace,
    }));
  // La más rápida se dibuja la última (encima) y centrada.
  dots.sort((a, b) => Number(a.best) - Number(b.best));
  for (const d of dots) if (d.best) d.dy = 0;
  return { fast, slow, dots };
}

// ------------------------------------------------------------------ PULSO
export function heartCard(env: DeckEnv): Card {
  const { fmt, stats: s } = env;
  const hr = s.hr!;
  const big = fmt.big(hr.beats);
  // Las zonas solo tienen sentido con datos segundo a segundo (no con las medias del CSV).
  const zonesOk = hr.zones.length === 5 && hr.zoneSeconds >= 1800;
  const totalZ = hr.zoneSeconds || 1;
  const dominant = zonesOk ? hr.zones.reduce((bi, z, i, arr) => (z.seconds > arr[bi].seconds ? i : bi), 0) : -1;
  const maxOk = Number.isFinite(hr.max) && hr.max > hr.avg;
  const bpm = fmt.m('unit.bpm');
  return {
    id: 'heart',
    theme: 'dark',
    duration: 7500,
    render(f) {
      const { ctx, theme } = f;
      kicker(f, fmt.m('heart.kicker'), M, KICK);
      const size = 330;
      const base = heroBaseline(f, size);
      const counted = fmt.big(counting(f, hr.beats, 150, 1700));
      heroNumber(f, counted.unit === big.unit ? counted.value : big.value, big.unit, M, base, size, { start: 100, unitScale: 0.32, fit: big.value });
      const y = belowHero(f, big.value, size, base, fmt.lines('heart.title')[0], 112);
      headline(f, fmt.lines('heart.title'), M, y, 112, { start: 450 });
      const avg = `${fmt.num(hr.avg)}\u00a0${bpm}`;
      const parts = [maxOk ? fmt.m('heart.avgMax', { avg, max: `${fmt.num(hr.max)}\u00a0${bpm}` }) : fmt.m('heart.avg', { avg })];
      if (zonesOk) parts.push(fmt.m('heart.zone', { zone: String(dominant + 1) }));
      paragraph(f, parts.join(' '), M, y + 112 * 0.98 + 92, CW, 38, { start: 750 });

      if (!zonesOk) {
        // Sin zonas: electrocardiograma que entra en la tarjeta.
        const ecg = f.memo('ecg', () => {
          const beat: [number, number][] = [[0, 0], [0.16, 0], [0.22, -22], [0.28, 0], [0.36, 0], [0.4, 34], [0.46, -270], [0.52, 96], [0.57, 0], [0.68, 0], [0.77, -46], [0.86, 0], [1, 0]];
          const x0 = M - 60, x1 = W - M + 60, beats = 4, bw = (x1 - x0) / beats, base0 = 1500;
          const pts: number[] = [];
          for (let b = 0; b < beats; b++) for (const [k, dy] of beat) if (!(b > 0 && k === 0)) pts.push(x0 + (b + k) * bw, base0 + dy);
          const arr = new Float64Array(pts);
          return { pts: arr, cum: cumulative(arr) };
        });
        ribbon(f, ecg.pts, ecg.cum, 1, 'rgba(243,238,230,0.08)', 7, false);
        ribbon(f, ecg.pts, ecg.cum, ease.inOutSine(prog(f.t, 1000, 2600)), COLORS.orange, 7, true);
        return;
      }
      // Zonas
      const top = 1290;
      const rowH = 88;
      hr.zones.forEach((z, i) => {
        const yy = top + i * rowH;
        const p = ease.outCubic(prog(f.t, 1100 + i * 140, 900));
        if (p <= 0) return;
        const frac = z.seconds / totalZ;
        ctx.save();
        ctx.globalAlpha = Math.min(1, p * 1.5);
        setFont(ctx, 'text', 26, 800);
        ctx.fillStyle = i === dominant ? COLORS.orange : theme.sub;
        const range = i === 0 ? `${fmt.m('heart.below', { n: String(z.hi + 1) })} ${bpm}` : i === 4 ? `${z.lo}+ ${bpm}` : `${z.lo}–${z.hi} ${bpm}`;
        drawTracked(ctx, `Z${i + 1} · ${range}`, M, yy, 1);
        drawTracked(ctx, fmt.pct(frac), W - M, yy, 1, 'right');
        ctx.fillStyle = theme.faint;
        roundRect(ctx, M, yy + 18, CW, 18, 9);
        ctx.fill();
        ctx.fillStyle = i === dominant ? COLORS.orange : 'rgba(243,238,230,0.5)';
        roundRect(ctx, M, yy + 18, Math.max(18, CW * frac * p), 18, 9);
        ctx.fill();
        ctx.restore();
      });
    },
  };
}

/** Silueta del monumento: montaña, rascacielos (Burj Khalifa) o torre (Eiffel). */
function landmarkPath(key: string, px: number, pw: number, baseY: number, h: number): Path2D {
  const p = new Path2D();
  const cx = px + pw / 2;
  if (key === 'burj') {
    const w = pw * 0.36;
    const steps: [number, number][] = [[0.5, 0], [0.5, 0.32], [0.36, 0.32], [0.36, 0.56], [0.23, 0.56], [0.23, 0.74], [0.11, 0.74], [0.11, 0.88], [0.02, 0.88], [0, 1]];
    p.moveTo(cx - w * steps[0][0], baseY);
    for (const [k, y] of steps) p.lineTo(cx - w * k, baseY - h * y);
    for (const [k, y] of [...steps].reverse()) p.lineTo(cx + w * k, baseY - h * y);
    p.closePath();
    return p;
  }
  if (key === 'eiffel') {
    const w = pw * 0.62;
    p.moveTo(cx - w / 2, baseY);
    p.quadraticCurveTo(cx - w * 0.12, baseY - h * 0.35, cx - w * 0.06, baseY - h * 0.72);
    p.lineTo(cx - w * 0.015, baseY - h * 0.94);
    p.lineTo(cx, baseY - h);
    p.lineTo(cx + w * 0.015, baseY - h * 0.94);
    p.lineTo(cx + w * 0.06, baseY - h * 0.72);
    p.quadraticCurveTo(cx + w * 0.12, baseY - h * 0.35, cx + w / 2, baseY);
    p.closePath();
    // Arco entre las patas (se recorta con la regla par-impar).
    p.moveTo(cx - w * 0.3, baseY);
    p.quadraticCurveTo(cx, baseY - h * 0.3, cx + w * 0.3, baseY);
    p.closePath();
    return p;
  }
  p.moveTo(px, baseY);
  p.lineTo(px + pw * 0.38, baseY - h * 0.62);
  p.lineTo(px + pw * 0.46, baseY - h * 0.55);
  p.lineTo(px + pw * 0.58, baseY - h);
  p.lineTo(px + pw * 0.74, baseY - h * 0.7);
  p.lineTo(px + pw * 0.82, baseY - h * 0.76);
  p.lineTo(px + pw, baseY);
  p.closePath();
  return p;
}
