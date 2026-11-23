import { describe, expect, it } from 'vitest';
import { demoStats } from '../src/demo/demo';

describe('demo athlete', () => {
  it('produces a rich, plausible year', () => {
    const t0 = performance.now();
    const s = demoStats('es');
    const ms = performance.now() - t0;
    const km = s.distance / 1000;
    console.log(
      JSON.stringify({
        ms: Math.round(ms),
        runs: s.runs,
        km: Math.round(km),
        hours: Math.round(s.moving / 3600),
        elev: Math.round(s.elevation),
        days: s.activeDays,
        streak: s.longestStreak.days,
        countries: s.countries.map((c) => `${c.code}:${c.runs}`),
        indoor: s.indoorRuns,
        efforts: s.efforts.map((e) => `${e.target}:${Math.round(e.time)}`),
        longest: s.longestRun && Math.round(s.longestRun.distance),
        highest: s.highestPoint && Math.round(s.highestPoint.elevation),
        hr: s.hr && { avg: Math.round(s.hr.avg), max: s.hr.max, beats: Math.round(s.hr.beats) },
        shoes: s.shoes.map((x) => `${x.name}:${Math.round(x.distance / 1000)}`),
        arche: s.archetype,
        tod: s.timeOfDay,
        home: s.home && { n: s.home.name, runs: s.home.runs, tracks: s.home.tracks.length },
        bestMonth: s.bestMonth,
        others: s.others.map((o) => `${o.label}:${o.count}`),
        steps: Math.round(s.steps ?? 0),
        pace: Math.round(s.avgPace * 1000),
      }),
    );
    expect(s.runs).toBeGreaterThan(150);
    expect(km).toBeGreaterThan(1200);
    expect(km).toBeLessThan(2600);
    expect(s.countries.length).toBe(4);
    expect(s.efforts.some((e) => e.target === 42195)).toBe(true);
    expect(s.home?.name).toBe('Madrid');
    expect(ms).toBeLessThan(4000);
  });
});
