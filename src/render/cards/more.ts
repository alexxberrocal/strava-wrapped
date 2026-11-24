import { ease, prog, rng } from '../anim';
import { fadeUp, headline, heroNumber, kicker, paragraph, pill } from '../blocks';
import type { Card, DeckEnv, Frame } from '../card';
import { COLORS, CW, H, M, W, capRatio, drawTracked, fitSize, layoutRich, projectRoutes, roundRect, setFont, traceFull, type Box } from '../kit';
import { localFromDoy, daysInYear } from '../../stats/time';
import { PIZZA_KCAL, MARATHON_M } from '../../stats/equivalences';
import { archetypeText, cleanName, effortLabel, habitSentence, habitTitle, hoursLabel, marathonsLabel, sportLabel, splitLines } from './common';

const KICK = 330;

function topBaseline(f: Frame, size: number, gap = 64) {
  return KICK + gap + capRatio(f.ctx) * size;
}

// ------------------------------------------------------------------ CALENDARIO
export function calendarCard(env: DeckEnv): Card {
  const { fmt, stats: s } = env;
  const year = s.year;
  const total = daysInYear(year);
  const dists = Array.from(s.daily.slice(0, total)).filter((d) => d > 0).sort((a, b) => a - b);
  const p90 = dists.length ? dists[Math.floor(dists.length * 0.9)] : 1;
  const streak = s.longestStreak;
  return {
    id: 'calendar',
    theme: 'light',
    duration: 7500,
    render(f) {
      const { ctx, theme } = f;
      kicker(f, fmt.t('Tu calendario', 'Your calendar'), M, KICK);
      const hs = 150;
      const y = topBaseline(f, hs);
      headline(f, [fmt.t(`${s.activeDays} días`, `${s.activeDays} days`), fmt.t('corriendo', 'of running')], M, y, hs, { start: 120, colors: [COLORS.orange, theme.fg], lineHeight: 0.95 });
      const parts: string[] = [];
      if (streak.days >= 2) {
        const a = localFromDoy(year, streak.startDoy), b = localFromDoy(year, streak.endDoy);
        parts.push(fmt.t(
          `Tu racha más larga: **${streak.days} días seguidos**, del ${a.mo === b.mo ? a.d : fmt.date(a)} al ${fmt.date(b)}.`,
          `Longest streak: **${streak.days} days in a row**, ${fmt.dateShort(a)}–${fmt.dateShort(b)}.`,
        ));
      }
      const idle = s.weeksInPeriod - s.activeWeeks;
      const g = s.goal;
      if (g) {
        const target = fmt.distWithUnit(g.target, g.target % 1000 === 0 || g.target >= 100000 ? 0 : 1);
        if (g.period === 'week')
          parts.push(fmt.t(
            `Tu objetivo de **${target} por semana**: cumplido **${g.hit} de ${g.total} semanas**.`,
            `Your goal of **${target} a week**: hit in **${g.hit} of ${g.total} weeks**.`,
          ));
        else if (g.period === 'month')
          parts.push(fmt.t(
            `Tu objetivo de **${target} al mes**: cumplido **${g.hit} de ${g.total} meses**.`,
            `Your goal of **${target} a month**: hit in **${g.hit} of ${g.total} months**.`,
          ));
        else {
          const pct = g.hit / g.total;
          parts.push(pct >= 1
            ? fmt.t(`Tu objetivo anual de **${target}**: ¡**cumplido**!`, `Your yearly goal of **${target}**: **done**!`)
            : fmt.t(`Tu objetivo anual de **${target}**: vas por el **${fmt.pct(pct)}**.`, `Your yearly goal of **${target}**: **${fmt.pct(pct)}** there.`));
        }
      } else parts.push(
        idle <= 0
          ? fmt.t('Y **ni una sola semana** sin correr.', 'And **not a single week** without a run.')
          : idle <= 8
            ? fmt.t(`Solo **${idle} ${idle === 1 ? 'semana' : 'semanas'}** sin correr.`, `Only **${idle} ${idle === 1 ? 'week' : 'weeks'}** without a run.`)
            : fmt.t(`Corriste en **${s.activeWeeks} de ${s.weeksInPeriod} semanas**.`, `You ran in **${s.activeWeeks} of ${s.weeksInPeriod} weeks**.`),
      );
      paragraph(f, parts.join(' '), M, y + hs * 0.95 + 88, CW, 37, { start: 550 });

      // 12 mini calendarios (4 × 3)
      const cell = 28, gapX = (CW - 28 * cell) / 3, top = 1000;
      const monthH = 36 + 6 * cell + 34;
      const j1 = (new Date(Date.UTC(year, 0, 1)).getUTCDay() + 6) % 7;
      void j1;
      for (let m = 0; m < 12; m++) {
        const col = m % 4, row = Math.floor(m / 4);
        const x0 = M + col * (7 * cell + gapX);
        const y0 = top + row * monthH;
        const first = Date.UTC(year, m, 1);
        const startDoy = Math.round((first - Date.UTC(year, 0, 1)) / 864e5);
        const nDays = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
        const firstDow = (new Date(first).getUTCDay() + 6) % 7;
        ctx.save();
        ctx.globalAlpha = prog(f.t, 450 + m * 60, 400);
        setFont(ctx, 'text', 21, 800);
        ctx.fillStyle = theme.sub;
        drawTracked(ctx, fmt.monthShort(m).toUpperCase().replace('.', ''), x0, y0 + 20, 3);
        ctx.restore();
        for (let d = 0; d < nDays; d++) {
          const doy = startDoy + d;
          const pos = firstDow + d;
          const cx = x0 + (pos % 7) * cell;
          const cy = y0 + 36 + Math.floor(pos / 7) * cell;
          const a = ease.outBack(prog(f.t, 500 + doy * 5.2, 380));
          if (a <= 0) continue;
          const size = (cell - 5) * Math.min(1.1, a);
          const off = (cell - 5 - size) / 2;
          const dist = s.daily[doy];
          const future = doy >= s.daysInPeriod;
          ctx.save();
          if (s.activeDayFlags[doy]) {
            const k = Math.min(1, dist / (p90 || 1));
            ctx.fillStyle = COLORS.orange;
            ctx.globalAlpha = 0.38 + 0.62 * k;
          } else ctx.fillStyle = future ? 'rgba(18,18,18,0.035)' : 'rgba(18,18,18,0.09)';
          roundRect(ctx, cx + off, cy + off, size, size, 5);
          ctx.fill();
          ctx.restore();
          if (streak.days >= 3 && doy >= streak.startDoy && doy <= streak.endDoy) {
            const ps = prog(f.t, 2700, 500);
            if (ps > 0) {
              ctx.save();
              ctx.globalAlpha = ps;
              ctx.strokeStyle = COLORS.ink;
              ctx.lineWidth = 3;
              roundRect(ctx, cx - 1.5, cy - 1.5, cell - 2, cell - 2, 6);
              ctx.stroke();
              ctx.restore();
            }
          }
        }
      }
      // Leyenda
      fadeUp(f, 2400, () => {
        const y2 = top + 3 * monthH + 10;
        setFont(ctx, 'text', 21, 800);
        ctx.fillStyle = theme.sub;
        const wLess = drawTracked(ctx, fmt.t('MENOS', 'LESS'), M, y2, 3);
        [0.38, 0.6, 0.8, 1].forEach((al, i) => {
          ctx.save();
          ctx.globalAlpha = al;
          ctx.fillStyle = COLORS.orange;
          roundRect(ctx, M + wLess + 16 + i * 30, y2 - 21, 23, 23, 5);
          ctx.fill();
          ctx.restore();
        });
        drawTracked(ctx, fmt.t(`MÁS ${fmt.distUnit.toUpperCase()}`, 'MORE'), M + wLess + 16 + 4 * 30 + 10, y2, 3);
      });
    },
  };
}

// ------------------------------------------------------------------ MEJORES MARCAS
/** Marcas que se enseñan (1 km o 1 milla según unidades, 5K, 10K, media y maratón). */
export function recordRows(env: DeckEnv) {
  const wanted = env.fmt.imperial ? [1609.344, 5000, 10000, 21097.5, 42195] : [1000, 5000, 10000, 21097.5, 42195];
  return env.stats.efforts.filter((e) => wanted.includes(e.target));
}

export function recordsCard(env: DeckEnv): Card {
  const { fmt, stats: s } = env;
  const rows = recordRows(env);
  return {
    id: 'records',
    theme: 'dark',
    duration: 7500,
    render(f) {
      const { ctx, theme } = f;
      kicker(f, fmt.t('Mejores marcas', 'Best efforts'), M, KICK);
      const hs = 140;
      const y = topBaseline(f, hs);
      headline(f, [fmt.t('Tus marcas', 'Your bests'), fmt.t(`de ${s.year}`, `of ${s.year}`)], M, y, hs, { start: 120, colors: [theme.fg, COLORS.orange], lineHeight: 0.95 });
      const top0 = y + hs * 0.95 + 70;
      // Pocas marcas: filas más altas y el bloque algo centrado (sin hueco enorme abajo).
      const avail = 1760 - top0;
      const rowH = Math.min(rows.length <= 3 ? 250 : 196, avail / Math.max(1, rows.length));
      const top = top0 + Math.max(0, avail - rowH * rows.length) * 0.35;
      rows.forEach((e, i) => {
        const yy = top + i * rowH;
        const pl = ease.inOutCubic(prog(f.t, 700 + i * 160, 700));
        ctx.save();
        ctx.fillStyle = theme.faint;
        ctx.fillRect(M, yy, CW * pl, 3);
        ctx.restore();
        fadeUp(f, 850 + i * 160, () => {
          const base = yy + rowH * 0.58;
          setFont(ctx, 'display', 74);
          ctx.fillStyle = theme.fg;
          drawTracked(ctx, effortLabel(fmt, e.target), M, base, 0);
          setFont(ctx, 'display', 104);
          ctx.fillStyle = COLORS.orange;
          drawTracked(ctx, fmt.dur(e.time), W - M, base + 6, 0, 'right');
          setFont(ctx, 'text', 24, 600);
          ctx.fillStyle = theme.sub;
          let label = `${fmt.dateShort(e.run.local)} · ${cleanName(e.run.name)}`;
          while (ctx.measureText(label).width > CW * 0.5 && label.length > 8) label = label.slice(0, -2) + '…';
          ctx.fillText(label, M, base + 44);
        });
      });
    },
  };
}

// ------------------------------------------------------------------ HÁBITOS
export function habitsCard(env: DeckEnv): Card {
  const { fmt, stats: s } = env;
  const key = s.habit.key;
  // Si el perfil runner ya dice "Alma madrugadora" / "Criatura nocturna", aquí otra forma de decirlo.
  const alt = (key === 'dawn' && s.archetype.key === 'earlybird') || (key === 'night' && s.archetype.key === 'nightowl');
  const [l1, l2] = habitTitle(fmt, key, alt);
  const maxH = Math.max(1, ...s.hours);
  const maxW = Math.max(1, ...s.weekdays);
  return {
    id: 'habits',
    theme: 'light',
    duration: 7500,
    render(f) {
      const { ctx, theme } = f;
      kicker(f, fmt.t('Tu hora', 'Your hour'), M, KICK);
      const hs = Math.min(150, fitSize(ctx, l2, 'display', 150, CW), fitSize(ctx, l1, 'display', 150, CW));
      const y = topBaseline(f, hs);
      headline(f, [l1, l2], M, y, hs, { start: 120, colors: [theme.fg, COLORS.orange], lineHeight: 0.95 });
      paragraph(
        f,
        `${habitSentence(fmt, key, s.habit.share)} ${fmt.t(`Tu día favorito: el **${fmt.weekday(s.favoriteWeekday)}**.`, `Favourite day: **${fmt.weekday(s.favoriteWeekday)}**.`)}`,
        M,
        y + hs * 0.95 + 88,
        CW,
        38,
        { start: 550 },
      );
      // Reloj de 24 h
      const cx = W / 2, cy = 1255, r0 = 84, rMax = 205;
      const grow = ease.outCubic(prog(f.t, 1000, 1400));
      ctx.save();
      ctx.strokeStyle = theme.faint;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r0 + rMax + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, r0 - 10, 0, Math.PI * 2);
      ctx.stroke();
      for (let h = 0; h < 24; h++) {
        const v = s.hours[h] / maxH;
        if (v <= 0) continue;
        const a0 = -Math.PI / 2 + (h / 24) * Math.PI * 2 + 0.03;
        const a1 = a0 + (Math.PI * 2) / 24 - 0.06;
        const rr = r0 + rMax * v * grow;
        ctx.fillStyle = v > 0.6 ? COLORS.orange : v > 0.25 ? 'rgba(252,76,2,0.55)' : 'rgba(252,76,2,0.28)';
        ctx.beginPath();
        ctx.arc(cx, cy, rr, a0, a1);
        ctx.arc(cx, cy, r0, a1, a0, true);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      fadeUp(f, 1100, () => {
        setFont(ctx, 'text', 22, 800);
        ctx.fillStyle = theme.sub;
        const labels: [number, string][] = [[0, '0H'], [6, '6H'], [12, '12H'], [18, '18H']];
        for (const [h, t] of labels) {
          const a = -Math.PI / 2 + (h / 24) * Math.PI * 2;
          const rr = r0 + rMax + 42;
          drawTracked(ctx, t, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr + 8, 2, 'center');
        }
        setFont(ctx, 'display', 54);
        ctx.fillStyle = theme.fg;
        const peak = s.hours.indexOf(Math.max(...s.hours));
        drawTracked(ctx, fmt.lang === 'es' ? `${String(peak).padStart(2, '0')}:00` : fmt.clock(peak * 60).replace(':00', ''), cx, cy + 18, 0, 'center');
      });
      // Días de la semana
      const wy = 1748;
      for (let d = 0; d < 7; d++) {
        const x = M + 40 + d * ((CW - 80) / 6);
        const p = ease.outBack(prog(f.t, 1700 + d * 70, 450));
        if (p <= 0) continue;
        const v = s.weekdays[d] / maxW;
        ctx.save();
        ctx.fillStyle = d === s.favoriteWeekday ? COLORS.orange : 'rgba(18,18,18,0.16)';
        ctx.beginPath();
        ctx.arc(x, wy - 36, (8 + 22 * v) * p, 0, Math.PI * 2);
        ctx.fill();
        setFont(ctx, 'text', 24, 800);
        ctx.fillStyle = d === s.favoriteWeekday ? COLORS.orange : theme.sub;
        drawTracked(ctx, fmt.weekdayLetter(d), x, wy + 26, 0, 'center');
        ctx.restore();
      }
    },
  };
}

// ------------------------------------------------------------------ ZAPATILLAS
export function shoesCard(env: DeckEnv): Card {
  const { fmt, stats: s } = env;
  const top = s.shoes[0];
  const rest = s.shoes.slice(1, 4);
  const name = cleanName(top.name).toUpperCase() || fmt.t('TUS ZAPATILLAS', 'YOUR SHOES');
  const maxDist = top.distance;
  // Kilómetros de toda su vida (también de años anteriores) frente a la vida útil habitual.
  const life = Math.max(top.lifetime, top.distance);
  const LIFESPAN = fmt.imperial ? 500 * 1609.344 : 800000;
  const older = life - top.distance > 30000;
  const retire = life >= LIFESPAN * 0.9;
  return {
    id: 'shoes',
    theme: 'light',
    duration: 7000,
    render(f) {
      const { ctx, theme } = f;
      kicker(f, fmt.t('Tus zapatillas', 'Your shoes'), M, KICK);
      const lines = f.memo('lines', () => (fitSize(ctx, name, 'display', 120, CW) >= 92 ? [name] : splitLines(name, 2, 16)));
      const hs = Math.min(120, ...lines.map((l) => fitSize(ctx, l, 'display', 120, CW)));
      const y = topBaseline(f, hs);
      headline(f, lines, M, y, hs, { start: 120 });
      const size = 230;
      const base = y + hs * 0.98 * (lines.length - 1) + 50 + capRatio(ctx) * size;
      heroNumber(f, fmt.dist(top.distance, 0), fmt.distUnit.toUpperCase(), M, base, size, { start: 350, unitScale: 0.34 });
      const mar = top.distance / MARATHON_M;
      const nRuns = `**${fmt.num(top.runs)} ${fmt.plural(top.runs, fmt.t('carrera', 'run'), fmt.t('carreras', 'runs'))}**`;
      const parts = [
        fmt.t(
          `${nRuns} ${top.runs === 1 ? 'con ellas' : 'juntas'} en ${s.year}: dan para **${marathonsLabel(fmt, mar)}**.`,
          `${nRuns} together in ${s.year}: that's **${marathonsLabel(fmt, mar)}**.`,
        ),
      ];
      if (older) parts.push(fmt.t(`En total ya lleváis **${fmt.distWithUnit(life, 0)}** juntos.`, `**${fmt.distWithUnit(life, 0)}** together in total.`));
      if (retire) parts.push(fmt.t('Quizá va siendo hora de jubilarlas.', 'Maybe it’s time to retire them.'));
      const lay = paragraph(f, parts.join(' '), M, base + 100, CW, 38, { start: 650 });

      // Vida útil: barra hasta los ~800 km habituales de unas zapatillas.
      const my = base + 100 + lay.height + 120;
      const pm = ease.inOutCubic(prog(f.t, 1000, 1600));
      fadeUp(f, 900, () => {
        setFont(ctx, 'text', 22, 800);
        ctx.fillStyle = theme.sub;
        drawTracked(ctx, fmt.t('VIDA ÚTIL HABITUAL', 'TYPICAL LIFESPAN'), M, my - 26, 3);
        drawTracked(ctx, `${fmt.dist(LIFESPAN, 0)} ${fmt.distUnit.toUpperCase()}`, W - M, my - 26, 3, 'right');
      });
      const frac = Math.min(1, life / LIFESPAN);
      ctx.save();
      ctx.fillStyle = theme.faint;
      roundRect(ctx, M, my, CW, 26, 13);
      ctx.fill();
      ctx.fillStyle = life > LIFESPAN ? COLORS.orangeDeep : COLORS.orange;
      if (pm > 0) {
        roundRect(ctx, M, my, Math.max(26, CW * frac * pm), 26, 13);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(243,238,230,0.9)';
      for (const q of [0.25, 0.5, 0.75]) ctx.fillRect(M + CW * q - 1.5, my + 4, 3, 18);
      ctx.restore();
      fadeUp(f, 2300, () => {
        setFont(ctx, 'display', 44);
        ctx.fillStyle = theme.fg;
        const label = `${fmt.dist(life, 0)} ${fmt.distUnit.toUpperCase()}`;
        const x = M + CW * frac;
        const align = frac > 0.8 ? 'right' : frac < 0.2 ? 'left' : 'center';
        drawTracked(ctx, label, align === 'right' ? Math.min(W - M, x) : align === 'left' ? M : x, my + 80, 0, align);
      });

      // Las demás zapatillas (las que quepan).
      const listTop = my + 210;
      const maxRows = Math.max(0, Math.floor((1770 - listTop) / 110) + 1);
      const rows = rest.slice(0, maxRows);
      // Con una o dos zapatillas sobra sitio: sus kilómetros mes a mes.
      const chartTop = listTop + rows.length * 110 + (rows.length ? 30 : -50);
      if (rows.length <= 1 && 1740 - chartTop >= 250) {
        const lastMonth = s.isPartialYear ? s.periodEnd.mo - 1 : 11;
        const maxM = Math.max(1, ...top.months);
        const bottom = 1690, hMax = bottom - chartTop - 70;
        const gap = 14, bw = (CW - gap * 11) / 12;
        fadeUp(f, 1300, () => {
          setFont(ctx, 'text', 22, 800);
          ctx.fillStyle = theme.sub;
          drawTracked(ctx, fmt.t(`${fmt.distUnit.toUpperCase()} AL MES CON ELLAS`, `MONTHLY ${fmt.distUnit.toUpperCase()} IN THEM`), M, chartTop + 20, 3);
        });
        for (let i = 0; i < 12; i++) {
          const x = M + i * (bw + gap);
          const p = ease.outQuart(prog(f.t, 1400 + i * 60, 800));
          const h = i > lastMonth ? 6 : Math.max(6, (hMax * top.months[i]) / maxM) * p;
          ctx.fillStyle = i > lastMonth ? theme.faint : top.months[i] === maxM ? COLORS.orange : 'rgba(18,18,18,0.22)';
          roundRect(ctx, x, bottom - h, bw, h, 6);
          ctx.fill();
          ctx.save();
          ctx.globalAlpha = prog(f.t, 1400 + i * 60, 400);
          setFont(ctx, 'text', 22, 800);
          ctx.fillStyle = theme.sub;
          drawTracked(ctx, fmt.monthShort(i).charAt(0).toUpperCase(), x + bw / 2, bottom + 40, 0, 'center');
          ctx.restore();
        }
      }
      rows.forEach((sh, i) => {
        const yy = listTop + i * 110;
        fadeUp(f, 1100 + i * 140, () => {
          setFont(ctx, 'display', 44);
          ctx.fillStyle = theme.fg;
          const tw = drawTracked(ctx, `${fmt.dist(sh.distance, 0)} ${fmt.distUnit.toUpperCase()}`, W - M, yy + 2, 0, 'right');
          setFont(ctx, 'text', 30, 700);
          let label = cleanName(sh.name) || '—';
          while (ctx.measureText(label).width > CW - tw - 40 && label.length > 6) label = label.slice(0, -2) + '…';
          ctx.fillText(label, M, yy);
          const p = ease.outCubic(prog(f.t, 1200 + i * 140, 800));
          ctx.fillStyle = theme.faint;
          roundRect(ctx, M, yy + 22, CW, 14, 7);
          ctx.fill();
          ctx.fillStyle = 'rgba(18,18,18,0.55)';
          roundRect(ctx, M, yy + 22, Math.max(14, CW * (sh.distance / maxDist) * p), 14, 7);
          ctx.fill();
        });
      });
    },
  };
}

// ------------------------------------------------------------------ CURIOSIDADES
/** Datos curiosos disponibles, por orden de interés (se enseñan los 6 primeros). */
export function curiosityTiles(env: DeckEnv): { v: string; u?: string; l: string }[] {
  const { fmt, stats: s } = env;
  const tiles: { v: string; u?: string; l: string }[] = [];
  if (s.earliest) {
    // "Madrugón" solo si de verdad lo es; si no, la salida más temprana.
    const when = fmt.dateShort(s.earliest.run.local);
    tiles.push({ v: fmt.clock(s.earliest.minutes), l: s.earliest.minutes < 7 * 60 ? fmt.t(`Tu madrugón récord (${when})`, `Earliest start (${when})`) : fmt.t(`Tu salida más temprana (${when})`, `Earliest start (${when})`) });
  }
  if (s.latest && (s.latest.minutes >= 19 * 60 || s.latest.minutes < 4 * 60)) tiles.push({ v: fmt.clock(s.latest.minutes), l: fmt.t(`Tu salida más tardía (${fmt.dateShort(s.latest.run.local)})`, `Latest start (${fmt.dateShort(s.latest.run.local)})`) });
  if (s.sun && s.sun.dark >= 3) tiles.push({ v: fmt.num(s.sun.dark), l: fmt.t('Carreras con el sol ya puesto', 'Runs after dark') });
  if (s.kudos && s.kudos >= 5) tiles.push({ v: fmt.num(s.kudos), l: fmt.t('Kudos que has repartido', 'Kudos you gave out') });
  if (s.steps && s.steps > 1000) {
    const b = fmt.big(s.steps);
    tiles.push({ v: b.value, u: b.unit, l: fmt.t('Pasos, más o menos', 'Steps, give or take') });
  }
  if (s.calories && s.calories > 2000) tiles.push({ v: fmt.num(s.calories / PIZZA_KCAL), l: fmt.t(`Pizzas quemadas (${fmt.num(s.calories)} kcal)`, `Pizzas burned (${fmt.num(s.calories)} kcal)`) });
  if (s.hottest && s.coldest && s.hottest.temp - s.coldest.temp > 6) {
    tiles.push({ v: fmt.temp(s.hottest.temp), l: fmt.t(`La más calurosa según tu reloj (${fmt.dateShort(s.hottest.run.local)})`, `Hottest run, per your watch (${fmt.dateShort(s.hottest.run.local)})`) });
    tiles.push({ v: fmt.temp(s.coldest.temp), l: fmt.t(`Y la más fría (${fmt.dateShort(s.coldest.run.local)})`, `And the coldest (${fmt.dateShort(s.coldest.run.local)})`) });
  }
  if (s.challenges) tiles.push({ v: fmt.num(s.challenges), l: fmt.t(s.challenges === 1 ? 'Reto de Strava completado' : 'Retos de Strava completados', s.challenges === 1 ? 'Strava challenge completed' : 'Strava challenges completed') });
  if (s.races.length) tiles.push({ v: fmt.num(s.races.length), l: fmt.t(s.races.length === 1 ? 'Carrera con dorsal' : 'Carreras con dorsal', s.races.length === 1 ? 'Race with a bib' : 'Races with a bib') });
  if (s.cities.length >= 3) tiles.push({ v: fmt.num(s.cities.length), l: fmt.t('Ciudades distintas', 'Different cities') });
  tiles.push({ v: fmt.dist(s.avgDistance, 1), u: fmt.distUnit.toUpperCase(), l: fmt.t('Distancia media por carrera', 'Average distance per run') });
  tiles.push({ v: fmt.pct(s.weekendShare), l: fmt.t('De tus carreras, en fin de semana', 'Of your runs on weekends') });
  return tiles;
}

export function curiositiesCard(env: DeckEnv): Card {
  const { fmt } = env;
  const shown = curiosityTiles(env).slice(0, 6);
  return {
    id: 'curiosities',
    theme: 'orange',
    duration: 7500,
    render(f) {
      const { ctx } = f;
      kicker(f, fmt.t('Curiosidades', 'Fun facts'), M, KICK);
      const hs = 150;
      const y = topBaseline(f, hs);
      headline(f, [fmt.t('La letra', 'The fine'), fmt.t('pequeña', 'print')], M, y, hs, { start: 120, colors: [COLORS.ink, COLORS.white], lineHeight: 0.95 });
      const top = y + hs * 0.95 + 90;
      const colW = CW / 2;
      const rowH = Math.min(330, (1770 - top) / 3);
      shown.forEach((tile, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x = M + col * colW;
        const yy = top + row * rowH;
        fadeUp(f, 600 + i * 130, () => {
          ctx.fillStyle = 'rgba(18,18,18,0.14)';
          ctx.fillRect(x, yy, colW - 40, 3);
          setFont(ctx, 'display', 104);
          ctx.fillStyle = COLORS.white;
          const vb = yy + 30 + capRatio(ctx) * 104;
          const w = drawTracked(ctx, tile.v, x, vb, 0);
          if (tile.u) {
            setFont(ctx, 'display', 44);
            drawTracked(ctx, tile.u, x + w + 10, vb, 0);
          }
          const lay = layoutRich(ctx, tile.l, colW - 50, 27, 600, 600, 1.3);
          ctx.fillStyle = COLORS.ink;
          lay.lines.forEach((ln, k) => {
            setFont(ctx, 'text', 27, 600);
            ctx.fillText(ln.runs.map((r) => r.text).join(''), x, vb + 48 + k * lay.lineHeight);
          });
        });
      });
    },
  };
}

// ------------------------------------------------------------------ OTROS DEPORTES
export function othersCard(env: DeckEnv): Card {
  const { fmt, stats: s } = env;
  const list = s.others.slice(0, 6);
  const max = Math.max(1, ...list.map((o) => o.moving));
  const totalSec = s.others.reduce((a, o) => a + o.moving, 0);
  return {
    id: 'others',
    theme: 'light',
    duration: 6500,
    render(f) {
      const { ctx, theme } = f;
      kicker(f, fmt.t('Además de correr', 'Beyond running'), M, KICK);
      const hs = 150;
      const y = topBaseline(f, hs);
      const n = s.others.length;
      headline(f, [fmt.t(`${n} ${n === 1 ? 'deporte' : 'deportes'}`, `${n} more`), fmt.t('más', n === 1 ? 'sport' : 'sports')], M, y, hs, { start: 120, colors: [COLORS.orange, theme.fg], lineHeight: 0.95 });
      paragraph(
        f,
        totalSec >= 3600
          ? fmt.t(`Otras **${hoursLabel(fmt, totalSec)}** de entreno fuera del asfalto.`, `Another **${hoursLabel(fmt, totalSec)}** of training off the road.`)
          : fmt.t(`Otros **${Math.max(1, Math.round(totalSec / 60))} minutos** de entreno fuera del asfalto.`, `Another **${Math.max(1, Math.round(totalSec / 60))} minutes** of training off the road.`),
        M,
        y + hs * 0.95 + 88,
        CW,
        38,
        { start: 500 },
      );
      const top = y + hs * 0.95 + 230;
      const rowH = Math.min(150, (1760 - top) / Math.max(1, list.length));
      list.forEach((o, i) => {
        const yy = top + i * rowH;
        fadeUp(f, 800 + i * 130, () => {
          const time = o.moving < 3600 ? `${Math.max(1, Math.round(o.moving / 60))} MIN` : `${fmt.num(o.moving / 3600, o.moving < 36000 ? 1 : 0)} H`;
          setFont(ctx, 'display', 56);
          ctx.fillStyle = theme.fg;
          const tw = drawTracked(ctx, time, W - M, yy + 4, 0, 'right');
          setFont(ctx, 'text', 32, 700);
          let label = `${cleanName(sportLabel(fmt, o.category, o.label))} · ${fmt.num(o.count)} ${fmt.t(o.count === 1 ? 'sesión' : 'sesiones', o.count === 1 ? 'session' : 'sessions')}`;
          while (ctx.measureText(label).width > CW - tw - 40 && label.length > 6) label = label.slice(0, -2) + '…';
          ctx.fillText(label, M, yy);
          const p = ease.outCubic(prog(f.t, 900 + i * 130, 800));
          ctx.fillStyle = theme.faint;
          roundRect(ctx, M, yy + 24, CW, 16, 8);
          ctx.fill();
          ctx.fillStyle = i === 0 ? COLORS.orange : 'rgba(18,18,18,0.5)';
          roundRect(ctx, M, yy + 24, Math.max(16, CW * (o.moving / max) * p), 16, 8);
          ctx.fill();
        });
      });
    },
  };
}

// ------------------------------------------------------------------ FOTOS
export function photosCard(env: DeckEnv): Card {
  const { fmt, stats: s, photos } = env;
  const r = rng(s.year * 31 + photos.length);
  const slots = [
    { x: 300, y: 1000, rot: -0.12 },
    { x: 760, y: 900, rot: 0.1 },
    { x: 560, y: 1330, rot: -0.03 },
    { x: 260, y: 1520, rot: 0.08 },
    { x: 800, y: 1480, rot: -0.09 },
  ].slice(0, Math.min(5, photos.length));
  return {
    id: 'photos',
    theme: 'dark',
    duration: 7000,
    render(f) {
      const { ctx, theme } = f;
      kicker(f, fmt.t('Tus momentos', 'Your moments'), M, KICK);
      const hs = 140;
      const y = topBaseline(f, hs);
      headline(f, [fmt.t('Lo que', 'What the'), fmt.t('vieron tus ojos', 'road looked like')], M, y, hs, { start: 120, colors: [theme.fg, COLORS.orange], lineHeight: 0.95 });
      slots.forEach((sl, i) => {
        const img = photos[i];
        const p = ease.outBack(prog(f.t, 700 + i * 260, 700));
        if (p <= 0 || !img) return;
        const size = 380;
        ctx.save();
        ctx.translate(sl.x, sl.y);
        ctx.rotate(sl.rot * (2 - p) + (r() - 0.5) * 0.001);
        ctx.scale(0.6 + 0.4 * p, 0.6 + 0.4 * p);
        ctx.globalAlpha = Math.min(1, p * 1.4);
        ctx.shadowColor = 'rgba(0,0,0,0.45)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 14;
        ctx.fillStyle = COLORS.paper;
        ctx.fillRect(-size / 2 - 18, -size / 2 - 18, size + 36, size + 90);
        ctx.shadowColor = 'transparent';
        const k = Math.max(size / img.width, size / img.height);
        const sw = size / k, sh = size / k;
        ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, -size / 2, -size / 2, size, size);
        ctx.restore();
      });
    },
  };
}

// ------------------------------------------------------------------ PERFIL RUNNER
function archetypeIcon(f: Frame, key: string, cx: number, cy: number, p: number) {
  const { ctx } = f;
  ctx.save();
  ctx.strokeStyle = COLORS.white;
  ctx.fillStyle = COLORS.white;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const R = 170;
  const dash = (len: number) => {
    ctx.setLineDash([len * p, len]);
  };
  switch (key) {
    case 'earlybird': {
      dash(1200);
      ctx.beginPath();
      ctx.arc(cx, cy + 60, R, Math.PI, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      for (let i = 0; i < 7; i++) {
        const a = Math.PI + (i / 6) * Math.PI;
        const k = ease.outCubic(Math.max(0, Math.min(1, p * 2 - 1 - i * 0.05)));
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (R + 40), cy + 60 + Math.sin(a) * (R + 40));
        ctx.lineTo(cx + Math.cos(a) * (R + 40 + 50 * k), cy + 60 + Math.sin(a) * (R + 40 + 50 * k));
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(cx - R - 120, cy + 60);
      ctx.lineTo(cx + R + 120, cy + 60);
      ctx.stroke();
      break;
    }
    case 'nightowl': {
      dash(1400);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0.6, Math.PI * 2 - 0.6);
      ctx.arc(cx + 95, cy - 40, R * 0.85, Math.PI * 2 - 0.9, 0.9, true);
      ctx.stroke();
      break;
    }
    case 'globetrotter': {
      dash(1300);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 0.45, R, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - R, cy);
      ctx.lineTo(cx + R, cy);
      ctx.moveTo(cx - R * 0.86, cy - R * 0.5);
      ctx.lineTo(cx + R * 0.86, cy - R * 0.5);
      ctx.moveTo(cx - R * 0.86, cy + R * 0.5);
      ctx.lineTo(cx + R * 0.86, cy + R * 0.5);
      ctx.stroke();
      break;
    }
    case 'goat': {
      dash(1500);
      ctx.beginPath();
      ctx.moveTo(cx - 300, cy + 140);
      ctx.lineTo(cx - 120, cy - 80);
      ctx.lineTo(cx - 40, cy + 10);
      ctx.lineTo(cx + 90, cy - 170);
      ctx.lineTo(cx + 300, cy + 140);
      ctx.stroke();
      break;
    }
    case 'longhauler': {
      dash(2200);
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const x = cx - 380 + (i / 60) * 760;
        const y = cy + Math.sin(i / 6) * 70 * (1 - i / 80);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      break;
    }
    case 'speedster': {
      dash(1300);
      ctx.beginPath();
      ctx.moveTo(cx + 40, cy - 220);
      ctx.lineTo(cx - 100, cy + 20);
      ctx.lineTo(cx + 10, cy + 20);
      ctx.lineTo(cx - 60, cy + 230);
      ctx.lineTo(cx + 120, cy - 40);
      ctx.lineTo(cx + 10, cy - 40);
      ctx.closePath();
      ctx.stroke();
      break;
    }
    case 'metronome': {
      dash(1200);
      ctx.beginPath();
      ctx.moveTo(cx - 140, cy + 180);
      ctx.lineTo(cx - 60, cy - 200);
      ctx.lineTo(cx + 60, cy - 200);
      ctx.lineTo(cx + 140, cy + 180);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
      const a = Math.sin(f.t / 380) * 0.35 * Math.min(1, p * 1.5);
      ctx.beginPath();
      ctx.moveTo(cx, cy + 120);
      ctx.lineTo(cx + Math.sin(a) * 260, cy + 120 - Math.cos(a) * 260);
      ctx.stroke();
      break;
    }
    case 'weekender': {
      dash(1600);
      ctx.beginPath();
      ctx.rect(cx - 220, cy - 170, 440, 360);
      ctx.moveTo(cx - 220, cy - 80);
      ctx.lineTo(cx + 220, cy - 80);
      ctx.stroke();
      ctx.setLineDash([]);
      for (let i = 0; i < 7; i++) {
        const k = ease.outBack(Math.max(0, Math.min(1, p * 2 - 1 - i * 0.04)));
        ctx.globalAlpha = i >= 5 ? 1 : 0.35;
        ctx.beginPath();
        ctx.arc(cx - 180 + (i % 4) * 120, cy - 10 + Math.floor(i / 4) * 110, 26 * k, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'treadmill': {
      dash(1500);
      ctx.beginPath();
      ctx.moveTo(cx - 280, cy + 140);
      ctx.lineTo(cx + 220, cy + 140);
      ctx.arc(cx + 220, cy + 100, 40, Math.PI / 2, -Math.PI / 2, true);
      ctx.lineTo(cx - 280, cy + 60);
      ctx.moveTo(cx + 120, cy + 60);
      ctx.lineTo(cx + 210, cy - 190);
      ctx.lineTo(cx + 290, cy - 190);
      ctx.stroke();
      break;
    }
    default: {
      dash(1500);
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
        const rr = i % 2 === 0 ? R : R * 0.45;
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function archetypeCard(env: DeckEnv): Card {
  const { fmt, stats: s } = env;
  const key = s.archetype.key;
  const { title, desc } = archetypeText(fmt, key);
  const nightShare = (s.hours.slice(20).reduce((a, b) => a + b, 0) + s.hours.slice(0, 4).reduce((a, b) => a + b, 0)) / Math.max(1, s.runs);
  const facts: [string, string][] = (() => {
    const km: [string, string] = [fmt.dist(s.distance, 0), fmt.t(`${fmt.distUnit} en total`, `${fmt.distUnit} in total`)];
    const runs: [string, string] = [fmt.num(s.runs), fmt.t('carreras', 'runs')];
    switch (key) {
      case 'earlybird':
        return [[fmt.pct(s.earlyShare), fmt.t('antes de las 9', 'before 9 AM')], [s.earliest ? fmt.clock(s.earliest.minutes) : '–', fmt.t('madrugón récord', 'earliest start')], runs];
      case 'nightowl':
        return [[fmt.pct(nightShare), fmt.t('a partir de las 20 h', 'after 8 PM')], [s.latest ? fmt.clock(s.latest.minutes) : '–', fmt.t('la más tardía', 'latest start')], runs];
      case 'globetrotter':
        return [[fmt.num(s.countries.length), fmt.t('países', 'countries')], [fmt.num(s.cities.length), fmt.t('ciudades', 'cities')], km];
      case 'goat':
        return [[fmt.elev(s.elevation), fmt.t(`${fmt.elevUnit} de desnivel`, `${fmt.elevUnit} climbed`)], [fmt.num(fmt.elevValue(s.elevation) / Math.max(1e-6, fmt.distValue(s.distance)), 0), fmt.t(`${fmt.elevUnit}/${fmt.distUnit} de media`, `${fmt.elevUnit}/${fmt.distUnit} average`)], runs];
      case 'longhauler':
        return [[fmt.dist(s.avgDistance, 1), fmt.t(`${fmt.distUnit} de media`, `${fmt.distUnit} average`)], [s.longestRun ? fmt.dist(s.longestRun.distance, 1) : '–', fmt.t(`${fmt.distUnit} la más larga`, `${fmt.distUnit} longest`)], km];
      case 'speedster':
        return [[fmt.pace(s.avgPace), fmt.t(`ritmo medio ${fmt.paceUnit}`, `avg pace ${fmt.paceUnit}`)], [s.fastestRun ? fmt.pace(s.fastestRun.pace) : '–', fmt.t('tu más rápida', 'your fastest')], runs];
      case 'metronome':
        return [[`${s.activeWeeks}/${s.weeksInPeriod}`, fmt.t('semanas activas', 'active weeks')], [fmt.num(s.longestStreak.days), fmt.t('días de racha', 'day streak')], runs];
      case 'weekender':
        return [[fmt.pct(s.weekendShare), fmt.t('en fin de semana', 'on weekends')], [fmt.weekday(s.favoriteWeekday).slice(0, 3).toUpperCase(), fmt.t('día favorito', 'favourite day')], runs];
      case 'treadmill':
        return [[fmt.num(s.indoorRuns), fmt.t('en cinta', 'on the treadmill')], [fmt.pct(s.indoorRuns / Math.max(1, s.runs)), fmt.t('de tus carreras', 'of your runs')], km];
      default:
        return [runs, km, [fmt.num(s.moving / 3600), fmt.t('horas', 'hours')]];
    }
  })();
  return {
    id: 'archetype',
    theme: 'orange',
    duration: 8000,
    render(f) {
      const { ctx } = f;
      kicker(f, fmt.t('Tu perfil runner', 'Your runner type'), M, KICK);
      const hs = Math.min(190, fitSize(ctx, title[0], 'display', 190, CW), fitSize(ctx, title[1], 'display', 190, CW));
      const y = topBaseline(f, hs);
      headline(f, [title[0], title[1]], M, y, hs, { start: 150, colors: [COLORS.ink, COLORS.white], lineHeight: 0.93, stagger: 160 });
      const py = y + hs * 0.93 + 96;
      paragraph(f, desc, M, py, CW, 40, { start: 700, color: COLORS.ink, hl: COLORS.white });
      archetypeIcon(f, key, W / 2, 1300, ease.inOutCubic(prog(f.t, 1200, 2200)));
      facts.forEach(([v, l], i) => {
        fadeUp(f, 1800 + i * 140, () => {
          const x = M + i * (CW / 3);
          ctx.fillStyle = 'rgba(18,18,18,0.18)';
          ctx.fillRect(x, 1582, CW / 3 - 30, 3);
          setFont(ctx, 'display', 76);
          ctx.fillStyle = COLORS.ink;
          drawTracked(ctx, v, x, 1672, 0);
          setFont(ctx, 'text', 24, 700);
          ctx.fillStyle = 'rgba(18,18,18,0.75)';
          ctx.fillText(l, x, 1716);
        });
      });
    },
  };
}

// ------------------------------------------------------------------ RESUMEN
export function summaryCard(env: DeckEnv): Card {
  const { fmt, stats: s } = env;
  const { title } = archetypeText(fmt, s.archetype.key);
  const hours = s.moving / 3600;
  const cells: [string, string, string][] = [
    [fmt.dist(s.distance, s.distance < 100000 ? 1 : 0), fmt.distUnit.toUpperCase(), fmt.t('DISTANCIA', 'DISTANCE')],
    hours >= 1 ? [fmt.num(hours, hours < 10 ? 1 : 0), 'H', fmt.t('EN MOVIMIENTO', 'MOVING TIME')] : [fmt.num(s.moving / 60), 'MIN', fmt.t('EN MOVIMIENTO', 'MOVING TIME')],
    [fmt.num(s.runs), '', fmt.t(s.runs === 1 ? 'CARRERA' : 'CARRERAS', s.runs === 1 ? 'RUN' : 'RUNS')],
  ];
  // Cada dato solo si dice algo (nada de "0 m de desnivel" en la cinta).
  const extra: [string, string, string][] = [];
  if (s.elevation >= 100) extra.push([fmt.elev(s.elevation), fmt.elevUnit.toUpperCase(), fmt.t('DESNIVEL', 'ELEVATION')]);
  if (s.countries.length > 1) extra.push([fmt.num(s.countries.length), '', fmt.t('PAÍSES', 'COUNTRIES')]);
  const best = s.efforts.find((e) => e.target === 10000) ?? s.efforts.find((e) => e.target === 5000);
  if (best && s.runs >= 3) extra.push([fmt.dur(best.time), '', fmt.t(`MEJOR ${effortLabel(fmt, best.target)}`, `BEST ${effortLabel(fmt, best.target)}`)]);
  if (s.activeDays >= 2) extra.push([fmt.num(s.activeDays), '', fmt.t('DÍAS CORRIENDO', 'DAYS RUNNING')]);
  if (Number.isFinite(s.avgPace)) extra.push([fmt.pace(s.avgPace), '', fmt.t(`RITMO MEDIO ${fmt.paceUnit.toUpperCase()}`, `AVG PACE ${fmt.paceUnit.toUpperCase()}`)]);
  if (s.longestStreak.days >= 3) extra.push([fmt.num(s.longestStreak.days), '', fmt.t('DÍAS DE RACHA', 'DAY STREAK')]);
  if (s.longestRun && s.runs >= 2) extra.push([fmt.dist(s.longestRun.distance), fmt.distUnit.toUpperCase(), fmt.t('LA MÁS LARGA', 'LONGEST RUN')]);
  cells.push(...extra.slice(0, 3));
  const tracks = s.home?.tracks ?? [];
  return {
    id: 'summary',
    theme: 'dark',
    duration: 9000,
    render(f) {
      const { ctx, theme } = f;
      const art: Box = { x: 60, y: 200, w: W - 120, h: 700 };
      if (tracks.length) {
        const layer = f.layer('art', (g) => {
          const pr = projectRoutes(tracks, art, { lo: 0.03, hi: 0.97, pad: 0.02 });
          g.save();
          g.globalCompositeOperation = 'lighter';
          const alpha = Math.max(0.16, Math.min(0.5, 1.6 / Math.sqrt(tracks.length) + 0.06));
          g.strokeStyle = `rgba(252,90,24,${alpha.toFixed(3)})`;
          g.lineWidth = 2.2;
          g.lineCap = g.lineJoin = 'round';
          for (const p of pr.paths) {
            traceFull(g, p);
            g.stroke();
          }
          g.restore();
          // Fundido hacia abajo para que el texto respire.
          g.save();
          g.globalCompositeOperation = 'destination-out';
          const grad = g.createLinearGradient(0, art.y + art.h * 0.55, 0, art.y + art.h + 20);
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(1, 'rgba(0,0,0,1)');
          g.fillStyle = grad;
          g.fillRect(0, art.y, W, art.h + 40);
          g.restore();
        });
        ctx.save();
        ctx.globalAlpha = ease.outCubic(prog(f.t, 100, 1400));
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(layer, 0, 0, W, H);
        ctx.restore();
      }
      const name = (s.name ? `${s.name} ${s.year}` : String(s.year)).toUpperCase();
      const ns = fitSize(ctx, name, 'display', 170, CW);
      const ny = 830;
      headline(f, [name], M, ny, ns, { start: 300, color: theme.fg });
      setFont(ctx, 'text', 26, 800);
      fadeUp(f, 500, () => {
        ctx.fillStyle = COLORS.orange;
        drawTracked(ctx, fmt.t('MI AÑO CORRIENDO', 'MY YEAR IN RUNNING'), M, ny + 60, 6);
      });
      const top = ny + 120;
      const colW = CW / 2;
      cells.forEach(([v, u, l], i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x = M + col * colW;
        const yy = top + row * 225;
        fadeUp(f, 700 + i * 110, () => {
          ctx.fillStyle = theme.faint;
          ctx.fillRect(x, yy, colW - 36, 3);
          setFont(ctx, 'display', 112);
          ctx.fillStyle = COLORS.orange;
          const vb = yy + 26 + capRatio(ctx) * 112;
          const w = drawTracked(ctx, v, x, vb, 0);
          if (u) {
            setFont(ctx, 'display', 44);
            ctx.fillStyle = theme.fg;
            drawTracked(ctx, u, x + w + 10, vb, 0);
          }
          setFont(ctx, 'text', 23, 800);
          ctx.fillStyle = theme.sub;
          drawTracked(ctx, l, x, vb + 46, 3);
        });
      });
      pill(f, `${title[0]} ${title[1]}`.replace('TROTA MUNDOS', 'TROTAMUNDOS').replace('GLOBE TROTTER', 'GLOBETROTTER'), M, 1700, { bg: COLORS.orange, fg: COLORS.ink, size: 30, start: 1500 });
    },
  };
}

export type { Frame };
export { H };
