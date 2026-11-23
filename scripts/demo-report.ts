// Resumen de las estadísticas del atleta de demo (para ajustar el generador).
import { demoStats } from '../src/demo/demo';
const s = demoStats('es');
console.log(JSON.stringify({
  runs: s.runs, km: Math.round(s.distance / 1000), hours: Math.round(s.moving / 3600), elev: Math.round(s.elevation),
  days: s.activeDays, streak: s.longestStreak.days, weeks: `${s.activeWeeks}/${s.weeksInPeriod}`,
  countries: s.countries.map((c) => `${c.code}:${c.runs}`), indoor: s.indoorRuns,
  efforts: s.efforts.map((e) => `${e.target}:${Math.round(e.time)}s`), longest: s.longestRun && Math.round(s.longestRun.distance),
  highest: s.highestPoint && Math.round(s.highestPoint.elevation), hr: s.hr && { avg: Math.round(s.hr.avg), max: s.hr.max, beats: Math.round(s.hr.beats), zones: s.hr.zones.map((z) => Math.round(z.seconds / 3600)) },
  shoes: s.shoes.map((x) => `${x.name}:${Math.round(x.distance / 1000)}`), arche: s.archetype, tod: s.timeOfDay, early: s.earlyShare.toFixed(2),
  home: s.home && { n: s.home.name, runs: s.home.runs, tracks: s.home.tracks.length }, bestMonth: s.bestMonth,
  months: s.months.map((m) => Math.round(m.distance / 1000)), others: s.others.map((o) => `${o.label}:${o.count}`),
  steps: Math.round(s.steps ?? 0), pace: Math.round(s.avgPace * 1000), fastest: s.fastestRun && Math.round(s.fastestRun.pace * 1000),
  bestWeek: s.bestWeek && Math.round(s.bestWeek.distance / 1000), cal: Math.round(s.calories ?? 0), races: s.races.map((r) => r.name),
}, null, 1));
