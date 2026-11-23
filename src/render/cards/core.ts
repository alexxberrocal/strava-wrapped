import { geoInterpolate, geoMercator, geoPath } from 'd3-geo';
import { ease, prog } from '../anim';
import { counting, fadeUp, headline, heroNumber, kicker, paragraph, pill, ribbon } from '../blocks';
import type { Card, DeckEnv, Frame } from '../card';
import { COLORS, CW, H, M, W, capRatio, cumulative, drawTracked, fitRoute, fitSize, roundRect, setFont, type Box } from '../kit';
import { EARTH_KM, MARATHON_M, pickDestination, pickLandmark } from '../../stats/equivalences';
import { localFromDoy, daysInYear } from '../../stats/time';

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
        if (!t) return null;
        const pts = fitRoute(t, { x: 70, y: 1180, w: 940, h: 560 }, 0.02);
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
      const text = s.isPartialYear
        ? fmt.t(`${runs} entre el 1 de enero y el ${fmt.date(s.periodEnd)}. Esto es lo que cuentan tus datos.`, `${runs} between January 1 and ${fmt.date(s.periodEnd)}. Here's what your data says.`)
        : fmt.t(`${runs} en todo ${s.year}. Esto es lo que cuentan tus datos.`, `${runs} across ${s.year}. Here's what your data says.`);
      paragraph(f, text, M, y + 110, 800, 42, { start: 800, color: COLORS.ink, hl: COLORS.white });
    },
  };
}

// ------------------------------------------------------------------ DISTANCIA
export function distanceCard(env: DeckEnv): Card {
  const { fmt, stats: s, countries } = env;
  const km = s.distance / 1000;
  const home = s.home;
  const dest = home ? pickDestination(home, km, fmt.lang) : null;
  const marathons = s.distance / MARATHON_M;
  const homeName = home?.name ?? null;
  return {
    id: 'distance',
    theme: 'dark',
    duration: 7500,
    render(f) {
      const { ctx, theme } = f;
      kicker(f, fmt.t('Distancia total', 'Total distance'), M, KICK);
      const size = 330;
      const base = heroBaseline(f, size);
      heroNumber(f, fmt.dist(counting(f, s.distance, 150, 1800)), fmt.distUnit.toUpperCase(), M, base, size, { start: 100, unitScale: 0.32 });
      let y = base + 150;
      let lines: string[];
      let colors: (string | undefined)[] = [];
      if (dest && homeName) {
        lines = [fmt.t(`De ${homeName} a`, `From ${homeName} to`), dest.name];
        colors = [theme.fg, COLORS.orange];
      } else {
        lines = [`${fmt.smart(marathons, marathons < 10 ? 1 : 0)} ${fmt.t('maratones', 'marathons')}`, fmt.t('seguidos', 'back to back')];
      }
      const hs = Math.min(112, ...lines.map((l) => fitSize(ctx, l.toUpperCase(), 'display', 112, CW)));
      headline(f, lines, M, y, hs, { start: 500, colors });
      y += hs * 0.98 * (lines.length - 1) + 92;
      const mar = `**${fmt.smart(marathons, marathons < 10 ? 1 : 0)} ${fmt.t('maratones', 'marathons')}**`;
      const text = dest && homeName
        ? fmt.t(
            `Saliendo de ${homeName}, habrías llegado corriendo hasta **${dest.name}**: ${fmt.distWithUnit(dest.km * 1000, 0)} en línea recta. Son ${mar}.`,
            `Starting in ${homeName}, you could have run all the way to **${dest.name}**: ${fmt.distWithUnit(dest.km * 1000, 0)} as the crow flies. That's ${mar}.`,
          )
        : fmt.t(
            `Equivale a ${mar} y al **${fmt.smart((km / EARTH_KM) * 100, 1)}%** de la vuelta al mundo.`,
            `That's ${mar} and **${fmt.smart((km / EARTH_KM) * 100, 1)}%** of the way around the world.`,
          );
      paragraph(f, text, M, y, CW, 38, { start: 800 });

      // Mapa con el arco de casa al destino.
      const box: Box = { x: M, y: 1255, w: CW, h: 470 };
      if (dest && home && countries) {
        const geo = f.memo('arc', () => {
          const pad = Math.max(3, Math.abs(dest.lat - home.lat) * 0.35, Math.abs(dest.lon - home.lon) * 0.2);
          // MultiPoint (no polígono): d3-geo interpreta el sentido de giro de los anillos.
          const extent = {
            type: 'MultiPoint' as const,
            coordinates: [
              [Math.min(home.lon, dest.lon) - pad * 1.6, Math.min(home.lat, dest.lat) - pad],
              [Math.max(home.lon, dest.lon) + pad * 1.6, Math.max(home.lat, dest.lat) + pad],
            ],
          };
          const proj = geoMercator().fitExtent([[box.x, box.y], [box.x + box.w, box.y + box.h]], extent);
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
          labelAt(f, homeName!.toUpperCase(), geo.pts[0], geo.pts[1], COLORS.paper, pMap);
          labelAt(f, dest.name.toUpperCase(), ex, ey, COLORS.orange, pEnd);
        }
      } else {
        // Sin mapa: barra de progreso de la vuelta al mundo.
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
          drawTracked(ctx, '40.075 KM', W - M, 1580, 4, 'right');
        });
      }
      if (s.prev && s.prev.distance > 0) {
        const delta = s.distance / s.prev.distance - 1;
        const label = `${delta >= 0 ? '+' : '−'}${fmt.num(Math.abs(delta) * 100, 0)}% VS ${s.prev.year}`;
        pill(f, label, W - M, KICK - 44, { bg: COLORS.orange, fg: COLORS.ink, size: 26, start: 2000, align: 'right' });
      }
    },
  };
}

function labelAt(f: Frame, text: string, x: number, y: number, color: string, alpha: number) {
  if (alpha <= 0) return;
  const { ctx } = f;
  ctx.save();
  ctx.globalAlpha *= alpha;
  setFont(ctx, 'text', 24, 800);
  ctx.fillStyle = color;
  const right = x > W * 0.62;
  drawTracked(ctx, text, right ? x - 36 : x + 36, y + 8, 3, right ? 'right' : 'left');
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
      heroNumber(f, fmt.num(counting(f, hours, 150, 1600), 0), fmt.t('H', 'H'), M, base, size, { start: 100, unitScale: 0.32 });
      const y = base + 150;
      const daysTxt = `${fmt.smart(days, 1)} ${fmt.plural(Math.round(days * 10) / 10, fmt.t('día', 'day'), fmt.t('días', 'days'))}`;
      headline(f, [daysTxt, fmt.t('sin parar', 'non-stop')], M, y, 112, { start: 450, color: COLORS.ink });
      const pct = s.activeDays / s.daysInPeriod;
      const text = s.isPartialYear
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
        const future = d >= s.daysInPeriod;
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
            ` Tu semana más fuerte: **${fmt.distWithUnit(bw.distance, 0)}**, del ${localFromDoy(s.year, bw.startDoy).d} al ${fmt.date(localFromDoy(s.year, bw.endDoy))}.`,
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
      heroNumber(f, fmt.elev(counting(f, s.elevation, 150, 1700)), fmt.elevUnit.toUpperCase(), M, base, size, { start: 100, unitScale: 0.32 });
      const y = base + 150;
      const hs = Math.min(112, ...lines.map((l) => fitSize(ctx, l.toUpperCase(), 'display', 112, CW)));
      headline(f, lines, M, y, hs, { start: 450, colors: [theme.fg, COLORS.orange] });
      const parts: string[] = [];
      if (s.biggestClimb && s.biggestClimb.elevGain > 0)
        parts.push(fmt.t(
          `Tu día más duro: **${fmt.elev(s.biggestClimb.elevGain)} ${fmt.elevUnit}** en ${fmt.distWithUnit(s.biggestClimb.distance)} el ${fmt.date(s.biggestClimb.local)}.`,
          `Your toughest day: **${fmt.elev(s.biggestClimb.elevGain)} ${fmt.elevUnit}** over ${fmt.distWithUnit(s.biggestClimb.distance)} on ${fmt.date(s.biggestClimb.local)}.`,
        ));
      if (s.highestPoint) {
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
        const path = new Path2D();
        path.moveTo(px, baseY);
        path.lineTo(px + pw * 0.38, baseY - h * 0.62);
        path.lineTo(px + pw * 0.46, baseY - h * 0.55);
        path.lineTo(px + pw * 0.58, baseY - h);
        path.lineTo(px + pw * 0.74, baseY - h * 0.7);
        path.lineTo(px + pw * 0.82, baseY - h * 0.76);
        path.lineTo(px + pw, baseY);
        path.closePath();
        ctx.fillStyle = 'rgba(18,18,18,0.06)';
        ctx.fill(path);
        ctx.save();
        ctx.clip(path);
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
        drawTracked(ctx, label, W - M + 30, sy - 16, 3, 'right');
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
  const improved = deltaS >= 5;
  const slower = deltaS <= -5;
  const monthsPace = s.months.map((m) => (m.runs >= 2 && m.distance > 3000 ? m.moving / m.distance : NaN));
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
          ? [fmt.t('Más kilómetros,', 'More miles,'), fmt.t('más calma', 'more calm')]
          : [fmt.t('Constante', 'Steady'), fmt.t('como un reloj', 'as a clock')];
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
      }
    },
  };
}

// ------------------------------------------------------------------ PULSO
export function heartCard(env: DeckEnv): Card {
  const { fmt, stats: s } = env;
  const hr = s.hr!;
  const big = fmt.big(hr.beats);
  const totalZ = hr.zoneSeconds || 1;
  const dominant = hr.zones.reduce((bi, z, i, arr) => (z.seconds > arr[bi].seconds ? i : bi), 0);
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
      heroNumber(f, counted.unit === big.unit ? counted.value : big.value, big.unit, M, base, size, { start: 100, unitScale: 0.32 });
      const y = base + 150;
      headline(f, [fmt.t('latidos', 'heartbeats'), fmt.t('corriendo', 'while running')], M, y, 112, { start: 450 });
      paragraph(
        f,
        fmt.t(
          `Pulso medio de **${fmt.num(hr.avg)} ppm** y máximo de **${fmt.num(hr.max)} ppm**. Donde más tiempo pasaste: **zona ${dominant + 1}**.`,
          `Average heart rate **${fmt.num(hr.avg)} bpm**, max **${fmt.num(hr.max)} bpm**. Most of your time: **zone ${dominant + 1}**.`,
        ),
        M,
        y + 112 * 0.98 + 92,
        CW,
        38,
        { start: 750 },
      );
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
