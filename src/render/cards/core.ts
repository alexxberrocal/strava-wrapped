import { geoInterpolate, geoMercator, geoNaturalEarth1, geoPath } from 'd3-geo';
import { ease, prog, rng } from '../anim';
import { counting, fadeUp, headline, heroNumber, kicker, paragraph, ribbon } from '../blocks';
import type { Card, DeckEnv, Frame } from '../card';
import { COLORS, CW, H, M, W, capRatio, cumulative, drawTracked, fitRoute, fitSize, roundRect, setFont, tracePartial, trackedWidth, type Box } from '../kit';
import { EARTH_KM, MARATHON_M, pickDestination, pickLandmark } from '../../stats/equivalences';
import { localFromDoy, daysInYear } from '../../stats/time';
import { marathonsLabel, yearDelta } from './common';

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
      const route = f.memo('route', () => {
        const t = s.longestRun?.track ?? s.routes[0]?.track;
        // Sin GPS: una pista de atletismo (dos rectas y dos curvas) que se dibuja igual que una ruta.
        const pts = t ? fitRoute(t, { x: 70, y: 1180, w: 940, h: 560 }, 0.02) : stadium(W / 2, 1470, 860, 400);
        return { pts, cum: cumulative(pts) };
      });
      if (route) {
        ribbon(f, route.pts, route.cum, ease.inOutCubic(prog(f.t, 900, 2800)), 'rgba(255,255,255,0.18)', 22, false);
        ribbon(f, route.pts, route.cum, ease.inOutCubic(prog(f.t, 900, 2800)), COLORS.white, 6);
      }
      kicker(f, fmt.t('Tu año corriendo', 'Your year in running'), M, KICK, 80);
      const name = (s.name || fmt.t('Runner', 'Runner')).toUpperCase();
      const size = fitSize(ctx, name, 'display', 290, CW);
      let y = heroBaseline(f, size, KICK + 70);
      headline(f, [name], M, y, size, { color: COLORS.ink, start: 200 });
      y += 290 * 0.98 + 10;
      headline(f, [String(s.year)], M, y, 290, { color: COLORS.white, start: 380 });
      const runs = `**${fmt.num(s.runs)} ${fmt.plural(s.runs, fmt.t('carrera', 'run'), fmt.t('carreras', 'runs'))}**`;
      const text = !s.isPartialYear
        ? fmt.t(`${runs} en todo ${s.year}. Esto es lo que cuentan tus datos.`, `${runs} across ${s.year}. Here's what your data says.`)
        : s.daysInPeriod <= 1
          ? fmt.t(`${runs} el 1 de enero. Esto es lo que cuentan tus datos.`, `${runs} on January 1. Here's what your data says.`)
          : fmt.t(`${runs} entre el 1 de enero y el ${fmt.date(s.periodEnd)}. Esto es lo que cuentan tus datos.`, `${runs} between January 1 and ${fmt.date(s.periodEnd)}. Here's what your data says.`);
      paragraph(f, text, M, y + 110, 800, 42, { start: 800, color: COLORS.ink, hl: COLORS.white });
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
      kicker(f, fmt.t('Distancia total', 'Total distance'), M, KICK);
      const size = 330;
      const base = heroBaseline(f, size);
      heroNumber(f, fmt.dist(counting(f, s.distance, 150, 1800)), fmt.distUnit.toUpperCase(), M, base, size, { start: 100, unitScale: 0.32, fit: fmt.dist(s.distance) });
      let y = base + 150;
      let lines: string[];
      let colors: (string | undefined)[] = [];
      if (dest && homeName) {
        lines = [fmt.t(`De ${homeName} a`, `From ${homeName} to`), dest.name];
        colors = [theme.fg, COLORS.orange];
      } else if (marathons >= 1) {
        const one = fmt.smart(marathons, marathons < 10 ? 1 : 0) === '1';
        lines = [marathonsLabel(fmt, marathons), one ? fmt.t('completo', 'done') : fmt.t('seguidos', 'back to back')];
      } else {
        lines = [fmt.t(`${fmt.num(s.distance / 400)} vueltas`, `${fmt.num(s.distance / 400)} laps`), fmt.t('a la pista', 'of a track')];
      }
      const hs = Math.min(112, ...lines.map((l) => fitSize(ctx, l.toUpperCase(), 'display', 112, CW)));
      headline(f, lines, M, y, hs, { start: 500, colors });
      y += hs * 0.98 * (lines.length - 1) + 92;
      const mar = `**${marathonsLabel(fmt, marathons)}**`;
      const text = dest && homeName
        ? fmt.t(
            `Saliendo de ${homeName}, habrías llegado corriendo hasta **${dest.name}**: ${fmt.distWithUnit(dest.km * 1000, 0)} en línea recta. Son ${mar}.`,
            `Starting in ${homeName}, you could have run all the way to **${dest.name}**: ${fmt.distWithUnit(dest.km * 1000, 0)} as the crow flies. That's ${mar}.`,
          )
        : marathons >= 1
          ? fmt.t(
              km >= EARTH_KM
                ? `Equivale a ${mar} y a **${fmt.smart(km / EARTH_KM, 1)} vueltas** al mundo.`
                : `Equivale a ${mar} y al **${fmt.smart((km / EARTH_KM) * 100, 1)}%** de la vuelta al mundo.`,
              km >= EARTH_KM
                ? `That's ${mar} and **${fmt.smart(km / EARTH_KM, 1)} laps** around the world.`
                : `That's ${mar} and **${fmt.smart((km / EARTH_KM) * 100, 1)}%** of the way around the world.`,
            )
          : fmt.t(
              `Como dar **${fmt.num(s.distance / 400)} vueltas** a una pista de atletismo. Y esto acaba de empezar.`,
              `Like running **${fmt.num(s.distance / 400)} laps** of an athletics track. And this is just the start.`,
            );
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
          labelAt(f, homeName!.toUpperCase(), geo.pts[0], geo.pts[1], COLORS.paper, pMap, box);
          labelAt(f, dest.name.toUpperCase(), ex, ey, COLORS.orange, pEnd, box);
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
          drawTracked(ctx, fmt.t('VUELTA AL MUNDO', 'AROUND THE WORLD'), M, y0, 4);
          drawTracked(ctx, `${fmt.dist(EARTH_KM * 1000, 0)} ${fmt.distUnit.toUpperCase()}`, W - M, y0, 4, 'right');
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
          drawTracked(ctx, fmt.t('VUELTA AL MUNDO', 'AROUND THE WORLD'), M, 1580, 4);
          drawTracked(ctx, `${fmt.dist(EARTH_KM * 1000, 0)} ${fmt.distUnit.toUpperCase()}`, W - M, 1580, 4, 'right');
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
      kicker(f, fmt.t('Tiempo en movimiento', 'Moving time'), M, KICK);
      const size = 330;
      const base = heroBaseline(f, size);
      heroNumber(f, fmt.num(counting(f, hours, 150, 1600), 0), fmt.t('H', 'H'), M, base, size, { start: 100, unitScale: 0.32, fit: fmt.num(hours, 0) });
      const y = base + 150;
      const daysTxt = `${fmt.smart(days, 1)} ${fmt.plural(Math.round(days * 10) / 10, fmt.t('día', 'day'), fmt.t('días', 'days'))}`;
      const tLines = days >= 1
        ? [daysTxt, fmt.t('sin parar', 'non-stop')]
        : [fmt.t(`${fmt.num(s.moving / 60)} minutos`, `${fmt.num(s.moving / 60)} minutes`), fmt.t('de puro running', 'of pure running')];
      headline(f, tLines, M, y, 112, { start: 450, color: COLORS.ink });
      // Si empezaste a correr a mitad de año, lo justo es contar desde tu primera carrera.
      const since = s.firstRunDoy >= 45 && s.activeDays >= 3 ? s.firstRunDoy : 0;
      const dayspan = s.daysInPeriod - since;
      const pct = s.activeDays / Math.max(1, dayspan);
      const text = since
        ? fmt.t(
            `Desde tu primera carrera, el ${fmt.date(localFromDoy(s.year, since))}, saliste a correr **${s.activeDays} de ${dayspan} días**: el **${fmt.pct(pct)}**.`,
            `Since your first run on ${fmt.date(localFromDoy(s.year, since))}, you ran on **${s.activeDays} of ${dayspan} days**: **${fmt.pct(pct)}**.`,
          )
        : s.isPartialYear
        ? fmt.t(
            `Saliste a correr **${s.activeDays} de los ${s.daysInPeriod} días** que llevamos de año: el **${fmt.pct(pct)}**.`,
            `You ran on **${s.activeDays} of the ${s.daysInPeriod} days** so far this year: **${fmt.pct(pct)}**.`,
          )
        : fmt.t(
            `Saliste a correr **${s.activeDays} de los ${s.daysInPeriod} días** del año: el **${fmt.pct(pct)}**.`,
            `You ran on **${s.activeDays} of the ${s.daysInPeriod} days** of the year: **${fmt.pct(pct)}**.`,
          );
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
        drawTracked(ctx, fmt.t('DE LOS DÍAS', 'OF DAYS'), cx, cy + 74, 4, 'center');
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
      kicker(f, fmt.t('Mes a mes', 'Month by month'), M, KICK);
      const hs = 150;
      const y = heroBaseline(f, hs, KICK + 70);
      headline(f, [fmt.month(best), fmt.t('fue tu mes', 'was your month')], M, y, hs, { start: 150, colors: [COLORS.orange, theme.fg], lineHeight: 0.95 });
      const bw = s.bestWeek;
      const weekTxt = bw
        ? fmt.t(
            ` Tu semana más fuerte: **${fmt.distWithUnit(bw.distance, 0)}**, del ${weekStartEs(s.year, bw.startDoy, bw.endDoy, fmt)} al ${fmt.date(localFromDoy(s.year, bw.endDoy))}.`,
            ` Your biggest week: **${fmt.distWithUnit(bw.distance, 0)}**, ${fmt.dateShort(localFromDoy(s.year, bw.startDoy))}–${fmt.dateShort(localFromDoy(s.year, bw.endDoy))}.`,
          )
        : '';
      const text = fmt.t(
        `**${fmt.distWithUnit(bm.distance, 0)}** en **${bm.runs} ${fmt.plural(bm.runs, 'carrera', 'carreras')}**.${weekTxt}`,
        `**${fmt.distWithUnit(bm.distance, 0)}** over **${bm.runs} ${fmt.plural(bm.runs, 'run', 'runs')}**.${weekTxt}`,
      );
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
        drawTracked(ctx, fmt.monthShort(i).charAt(0).toUpperCase(), x + bw2 / 2, bottom + 52, 0, 'center');
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

/** "3" si la semana no cambia de mes ("del 3 al 9 de marzo"); si no, "28 de febrero". */
function weekStartEs(year: number, startDoy: number, endDoy: number, fmt: DeckEnv['fmt']): string {
  const a = localFromDoy(year, startDoy), b = localFromDoy(year, endDoy);
  return a.mo === b.mo ? String(a.d) : fmt.date(a);
}

// ------------------------------------------------------------------ DESNIVEL
export function elevationCard(env: DeckEnv): Card {
  const { fmt, stats: s } = env;
  const lm = pickLandmark(s.elevation)!;
  const names: Record<string, [string, string]> = {
    everest: ['el Everest', 'Everest'],
    kilimanjaro: ['el Kilimanjaro', 'Kilimanjaro'],
    montblanc: ['el Mont Blanc', 'Mont Blanc'],
    teide: ['el Teide', 'Mount Teide'],
    burj: ['el Burj Khalifa', 'the Burj Khalifa'],
    eiffel: ['la Torre Eiffel', 'the Eiffel Tower'],
  };
  const [nEs, nEn] = names[lm.landmark.key];
  let lines: string[];
  if (lm.times >= 1.95) lines = [fmt.t(`${fmt.smart(lm.times, 1)} veces`, `${fmt.smart(lm.times, 1)} times`), fmt.t(nEs, nEn)];
  else if (lm.times >= 1.08) lines = [fmt.t('Más que', 'Higher than'), fmt.t(nEs, nEn)];
  else if (lm.times >= 0.98) lines = [fmt.t('Subiste', 'You climbed'), fmt.t(nEs, nEn)];
  else lines = [fmt.t(`El ${fmt.num(lm.times * 100)}% de`, `${fmt.num(lm.times * 100)}% of`), fmt.t(nEs, nEn)];
  return {
    id: 'elevation',
    theme: 'light',
    duration: 7500,
    render(f) {
      const { ctx, theme } = f;
      kicker(f, fmt.t('Desnivel positivo', 'Elevation gain'), M, KICK);
      const size = 330;
      const base = heroBaseline(f, size);
      heroNumber(f, fmt.elev(counting(f, s.elevation, 150, 1700)), fmt.elevUnit.toUpperCase(), M, base, size, { start: 100, unitScale: 0.32, fit: fmt.elev(s.elevation) });
      const y = base + 150;
      const hs = Math.min(112, ...lines.map((l) => fitSize(ctx, l.toUpperCase(), 'display', 112, CW)));
      headline(f, lines, M, y, hs, { start: 450, colors: [theme.fg, COLORS.orange] });
      const parts: string[] = [];
      if (s.biggestClimb && s.biggestClimb.elevGain > 0)
        parts.push(fmt.t(
          `Tu día más duro: **${fmt.elev(s.biggestClimb.elevGain)} ${fmt.elevUnit}** en ${fmt.distWithUnit(s.biggestClimb.distance)} el ${fmt.date(s.biggestClimb.local)}.`,
          `Your toughest day: **${fmt.elev(s.biggestClimb.elevGain)} ${fmt.elevUnit}** over ${fmt.distWithUnit(s.biggestClimb.distance)} on ${fmt.date(s.biggestClimb.local)}.`,
        ));
      if (s.highestPoint && s.highestPoint.elevation >= 300) {
        const where = s.highestPoint.run.country ? fmt.country(s.highestPoint.run.country) : null;
        parts.push(fmt.t(
          `Tu punto más alto: **${fmt.elev(s.highestPoint.elevation)} ${fmt.elevUnit}**${where ? `, en ${where}` : ''}.`,
          `Your highest point: **${fmt.elev(s.highestPoint.elevation)} ${fmt.elevUnit}**${where ? `, in ${where}` : ''}.`,
        ));
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
        const label = `${fmt.t(nEs, nEn).replace(/^(el|la|the) /i, '').toUpperCase()} · ${fmt.elev(lm.landmark.height)} ${fmt.elevUnit.toUpperCase()}`;
        drawTracked(ctx, label, W - M, sy - 16, 3, 'right');
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
      kicker(f, fmt.t('Ritmo medio', 'Average pace'), M, KICK);
      const size = 330;
      const base = heroBaseline(f, size);
      heroNumber(f, fmt.pace(s.avgPace), fmt.paceUnit.toUpperCase(), M, base, size, { start: 100, unitScale: 0.26 });
      const y = base + 150;
      const lines = improved
        ? [fmt.t(`${deltaS} segundos`, `${deltaS} seconds`), fmt.t(`más rápido`, `faster`)]
        : slower
          ? [fmt.t('Disfrutando', 'Enjoying'), fmt.t(fmt.imperial ? 'cada milla' : 'cada kilómetro', fmt.imperial ? 'every mile' : 'every kilometre')]
          : trend
            ? [fmt.t('Constante', 'Steady'), fmt.t('como un reloj', 'as a clock')]
            : [fmt.t('Tu ritmo', 'Your'), fmt.t('de crucero', 'cruising pace')];
      headline(f, lines, M, y, 112, { start: 450, color: COLORS.ink });
      const parts: string[] = [];
      if (trend && (improved || slower))
        parts.push(fmt.t(
          `De **${fmt.pace(trend.first)}${fmt.paceUnit}** en tus primeros meses a **${fmt.pace(trend.last)}${fmt.paceUnit}** en los últimos.`,
          `From **${fmt.pace(trend.first)}${fmt.paceUnit}** in your first months to **${fmt.pace(trend.last)}${fmt.paceUnit}** lately.`,
        ));
      if (s.fastestRun)
        parts.push(fmt.t(
          `Tu carrera más rápida: **${fmt.pace(s.fastestRun.pace)}${fmt.paceUnit}** en ${fmt.distWithUnit(s.fastestRun.distance)}, el ${fmt.date(s.fastestRun.local)}.`,
          `Your fastest run: **${fmt.pace(s.fastestRun.pace)}${fmt.paceUnit}** over ${fmt.distWithUnit(s.fastestRun.distance)} on ${fmt.date(s.fastestRun.local)}.`,
        ));
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
          drawTracked(ctx, fmt.monthShort(i).charAt(0).toUpperCase(), X(i), box.y + box.h + 92, 0, 'center');
        }
        setFont(ctx, 'text', 22, 800);
        ctx.fillStyle = 'rgba(18,18,18,0.55)';
        drawTracked(ctx, fmt.t('↑ MÁS RÁPIDO', '↑ FASTER'), M, box.y - 44, 3);
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
          drawTracked(ctx, fmt.t('← MÁS LENTO', '← SLOWER'), box.x, box.y + box.h + 70, 3, 'left');
          drawTracked(ctx, fmt.t('MÁS RÁPIDO →', 'FASTER →'), box.x + box.w, box.y + box.h + 70, 3, 'right');
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
  const bpm = fmt.t('ppm', 'bpm');
  return {
    id: 'heart',
    theme: 'dark',
    duration: 7500,
    render(f) {
      const { ctx, theme } = f;
      kicker(f, fmt.t('Frecuencia cardiaca', 'Heart rate'), M, KICK);
      const size = 330;
      const base = heroBaseline(f, size);
      const counted = fmt.big(counting(f, hr.beats, 150, 1700));
      heroNumber(f, counted.unit === big.unit ? counted.value : big.value, big.unit, M, base, size, { start: 100, unitScale: 0.32, fit: big.value });
      const y = base + 150;
      headline(f, [fmt.t('latidos', 'heartbeats'), fmt.t('corriendo', 'while running')], M, y, 112, { start: 450 });
      const avg = `**${fmt.num(hr.avg)} ${bpm}**`;
      const parts = [
        maxOk
          ? fmt.t(`Pulso medio de ${avg} y máximo de **${fmt.num(hr.max)} ${bpm}**.`, `Average heart rate ${avg}, max **${fmt.num(hr.max)} ${bpm}**.`)
          : fmt.t(`Pulso medio de ${avg} en tus carreras.`, `Average heart rate of ${avg} on your runs.`),
      ];
      if (zonesOk) parts.push(fmt.t(`Donde más tiempo pasaste: **zona ${dominant + 1}**.`, `Most of your time: **zone ${dominant + 1}**.`));
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
        const range =
          i === 0
            ? fmt.t(`menos de ${z.hi + 1} ppm`, `under ${z.hi + 1} bpm`)
            : i === 4
              ? fmt.t(`${z.lo}+ ppm`, `${z.lo}+ bpm`)
              : fmt.t(`${z.lo}–${z.hi} ppm`, `${z.lo}–${z.hi} bpm`);
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
