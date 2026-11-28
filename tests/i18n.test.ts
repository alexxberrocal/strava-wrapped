import { describe, expect, it } from 'vitest';
import { LANGS, langFromTag, type Lang } from '../src/i18n/langs';
import { polishSite } from '../src/i18n/polish';
import { es as siteEs } from '../src/i18n/site/es';
import { es as cardsEs } from '../src/i18n/cards/es';
import { formatMessage } from '../src/i18n/message';
import { Fmt, registerCardMessages } from '../src/i18n/format';
import { canBreakBetween, layoutRich, type Ctx } from '../src/render/kit';
import { scriptsIn } from '../src/render/fonts';
import { accentNeeds } from '../src/ui/typo';
import { localizeHtml, sitemap } from '../scripts/site-pages';

type Dict = Record<string, string>;
const others = LANGS.filter((l) => l !== 'es');
const siteDicts = Object.fromEntries(await Promise.all(others.map(async (l) => [l, (await import(`../src/i18n/site/${l}.ts`)).default as Dict]))) as Record<Lang, Dict>;
const cardDicts = Object.fromEntries(await Promise.all(others.map(async (l) => [l, (await import(`../src/i18n/cards/${l}.ts`)).default as Dict]))) as Record<Lang, Dict>;

/** Variables de un mensaje ({name}, {n, plural, …}); el texto de cada rama del plural no cuenta. */
function varsOf(msg: string): string[] {
  const out = new Set<string>();
  for (const m of msg.matchAll(/\{\s*([a-zA-Z]\w*)\s*(?:,|\})/g)) {
    // "one {…}" es una rama del plural ("zone {zone}" sí es una variable).
    if (/(?:^|[\s{}])(?:zero|one|two|few|many|other|=\d+)\s*$/.test(msg.slice(0, m.index))) continue;
    // {date} y {dateArt} ("el 3 de marzo" / "on March 3") son intercambiables: el código pasa las dos.
    out.add(m[1] === 'dateArt' ? 'date' : m[1]);
  }
  return [...out].sort();
}
/** Variables que un idioma puede omitir (la leyenda "Más km" es "More" en inglés). */
const OPTIONAL_VARS = new Set(['calendar.more']);

describe('textos de la web en los 12 idiomas', () => {
  const keys = Object.keys(siteEs).sort();
  for (const lang of others) {
    it(lang, () => {
      const d = siteDicts[lang];
      expect(Object.keys(d).sort()).toEqual(keys);
      for (const k of keys) {
        const v = d[k];
        expect(v.trim(), `${lang} ${k} vacío`).not.toBe('');
        expect(varsOf(v), `${lang} ${k}: variables`).toEqual(varsOf(siteEs[k as keyof typeof siteEs]));
        // Solo el HTML que usamos, bien cerrado.
        expect(v.replace(/<br>|<\/?(em|b)>/g, ''), `${lang} ${k}: HTML`).not.toMatch(/[<>]/);
        expect((v.match(/<em>/g) ?? []).length).toBe((v.match(/<\/em>/g) ?? []).length);
        expect((v.match(/<b>/g) ?? []).length).toBe((v.match(/<\/b>/g) ?? []).length);
      }
      // El titular de la portada lleva una palabra destacada, como el español.
      expect(d['hero.title']).toContain('<em>');
      // La vista previa y el aviso legal nombran a Strava como compatible, no como oficial.
      expect(d['meta.description']).toContain('Strava');
      expect(d['hero.compat']).toContain('Strava');
      expect(d['share.textFull']).toContain('{url}');
    });
  }
});

describe('textos de las tarjetas en los 12 idiomas', () => {
  const keys = Object.keys(cardsEs).sort();
  for (const lang of others) {
    it(lang, () => {
      const d = cardDicts[lang];
      expect(Object.keys(d).sort()).toEqual(keys);
      registerCardMessages(lang, d as never);
      const fmt = new Fmt(lang, 'metric');
      for (const k of keys) {
        const v = d[k];
        const ref = varsOf(cardsEs[k as keyof typeof cardsEs]);
        if (OPTIONAL_VARS.has(k)) expect(ref, `${lang} ${k}: variables`).toEqual(expect.arrayContaining(varsOf(v)));
        else expect(varsOf(v), `${lang} ${k}: variables`).toEqual(ref);
        // Cada mensaje se puede formatear con números de todo tipo sin dejar llaves sueltas.
        for (const n of [0, 1, 2, 3, 5, 11, 21, 101, 1234.5]) {
          const vars = Object.fromEntries([...varsOf(v), 'dateArt'].map((name) => [name, n]));
          const out = formatMessage(v, vars, fmt.locale, (x) => String(x));
          expect(out, `${lang} ${k} (${n})`).not.toMatch(/[{}]/);
        }
      }
    });
  }
});

describe('idioma del navegador', () => {
  it('etiquetas', () => {
    expect(langFromTag('ca-ES')).toBe('ca');
    expect(langFromTag('va')).toBe('ca');
    expect(langFromTag('gl-ES')).toBe('es');
    expect(langFromTag('eu')).toBe('es');
    expect(langFromTag('pt-BR')).toBe('pt');
    expect(langFromTag('zh-TW')).toBe('zh');
    expect(langFromTag('en_GB')).toBe('en');
    expect(langFromTag('sv-SE')).toBeNull();
    expect(langFromTag('')).toBeNull();
  });
});

describe('tipografía de la web', () => {
  it('"100 %" no se parte y el francés lleva espacio fino', () => {
    expect(polishSite('es', { a: 'Gratis y 100 % en tu navegador' }).a).toBe('Gratis y 100 % en tu navegador');
    const fr = polishSite('fr', { a: 'C’est prêt ! Vraiment ? « Story » : oui ; non' }).a;
    expect(fr).toBe('C’est prêt ! Vraiment ? « Story » : oui ; non');
    expect(polishSite('en', { a: 'Ready! 100%' }).a).toBe('Ready! 100%');
  });
  it('tildes de los titulares', () => {
    expect(accentNeeds('AÑO')).toEqual({ up: true, down: false });
    expect(accentNeeds('año')).toEqual({ up: true, down: false });
    expect(accentNeeds('FRANÇAIS')).toEqual({ up: false, down: true });
    expect(accentNeeds('ЙОД')).toEqual({ up: true, down: false });
    expect(accentNeeds('HOLA')).toEqual({ up: false, down: false });
  });
  it('escrituras que necesitan su tipografía', () => {
    expect([...scriptsIn('Дмитрий', 'es')]).toEqual(['cyrillic']);
    expect([...scriptsIn('김민준', 'es')]).toEqual(['ko']);
    expect([...scriptsIn('東京', 'ja')]).toEqual(['ja']);
    expect([...scriptsIn('東京', 'es')]).toEqual(['sc']);
    expect([...scriptsIn('ひらがな', 'zh')]).toEqual(['ja']);
    expect(scriptsIn('Lucía 2026 · Ñ', 'es').size).toBe(0);
  });
});

describe('cortes de línea en chino y japonés', () => {
  // Lienzo de mentira: cada carácter mide medio cuerpo (los ideogramas, uno entero).
  const mock = {
    font: '40px x',
    measureText: (t: string) => {
      const size = Number(/(\d+)px/.exec(mock.font)?.[1] ?? 40);
      let w = 0;
      for (const ch of t) w += /[\u3000-\u9fff\uff00-\uffef]/.test(ch) ? size : size * 0.5;
      return { width: w } as TextMetrics;
    },
  };
  const ctx = mock as unknown as Ctx;

  it('se puede partir entre ideogramas, nunca antes de 。 ni dentro de "2,930 km"', () => {
    expect(canBreakBetween('跑', '步')).toBe(true);
    expect(canBreakBetween('步', '。')).toBe(false);
    expect(canBreakBetween('「', '跑')).toBe(false);
    expect(canBreakBetween('年', '2')).toBe(true);
    expect(canBreakBetween('2', '0')).toBe(false);
    expect(canBreakBetween(' ', '公')).toBe(false);
    expect(canBreakBetween('a', 'b')).toBe(false);
    expect(canBreakBetween('달', '려')).toBe(false); // el coreano se parte por espacios
  });

  it('un párrafo largo en chino cabe en su anchura', () => {
    const text = '{year}年全年共**169次跑步**。这是你的数据讲述的故事：从马德里一直跑到开罗，直线距离2,930 公里。'.replace('{year}', '2026');
    const lay = layoutRich(ctx, text, 400, 40);
    expect(lay.lines.length).toBeGreaterThan(3);
    for (const line of lay.lines) {
      expect(line.width).toBeLessThanOrEqual(400 + 0.01);
      expect(line.runs[0].text[0]).not.toMatch(/[。，：、]/);
    }
    expect(lay.lines.map((l) => l.runs.map((r) => r.text).join('')).join('')).toBe(text.replace(/\*\*/g, ''));
    // "2,930 公里" queda junto.
    expect(lay.lines.some((l) => l.runs.map((r) => r.text).join('').includes('2,930 公里'))).toBe(true);
  });

  it('el texto con espacios se sigue partiendo por palabras', () => {
    const lay = layoutRich(ctx, 'Uno dos tres cuatro cinco seis siete ocho nueve diez', 200, 40);
    for (const line of lay.lines) expect(line.runs[0].text).not.toBe(' ');
    expect(lay.lines.map((l) => l.runs.map((r) => r.text).join('')).join(' ')).toBe('Uno dos tres cuatro cinco seis siete ocho nueve diez');
  });
});

describe('páginas estáticas de cada idioma', () => {
  const html = `<!doctype html>
<html lang="es">
<head>
<title>My Run Year · Tu año corriendo, en una historia</title>
<meta name="description" content="x" />
<link rel="canonical" href="https://ejemplo.test/" />
<link rel="icon" href="./favicon.svg" />
<meta property="og:url" content="https://ejemplo.test/" />
<meta property="og:title" content="x" />
<meta property="og:description" content="x" />
<meta property="og:image" content="https://ejemplo.test/og-es.jpg" />
<meta property="og:image:alt" content="x" />
<meta property="og:locale" content="es_ES" />
<meta name="twitter:title" content="x" />
<meta name="twitter:description" content="x" />
<meta name="twitter:image" content="x" />
<script type="application/ld+json">{"@type":"WebApplication","url":"https://ejemplo.test/","description":"x"}</script>
<script type="module" src="./assets/index.js"></script>
</head>
<body>
<span class="lang__code" id="lang-code">ES</span>
<select><option value="es" selected>Español</option><option value="fr">Français</option></select>
<h1 class="hero__title" data-i18n-html="hero.title">Tu año</h1>
<p data-i18n="hero.lead">x</p>
<a href="#crear"><span data-i18n="hero.cta">Crear</span> →</a>
<select aria-label="Idioma" data-i18n-aria="lang.label"></select>
</body>
</html>`;

  it('francés en /fr/', () => {
    const fr = localizeHtml(html, 'fr', 'https://ejemplo.test/', 'fr/');
    expect(fr).toContain('<html lang="fr-FR"');
    expect(fr).toContain('<title>My Run Year · Ton année de course, en une story</title>');
    expect(fr).toContain('<meta property="og:url" content="https://ejemplo.test/fr/" />');
    expect(fr).toContain('<meta property="og:image" content="https://ejemplo.test/og-fr.jpg" />');
    expect(fr).toContain('<meta property="og:locale" content="fr_FR" />');
    expect(fr).toContain('<link rel="canonical" href="https://ejemplo.test/fr/" />');
    expect(fr).toContain('href="../favicon.svg"');
    expect(fr).toContain('src="../assets/index.js"');
    expect(fr).toContain('href="#crear"');
    expect(fr).toContain('<em>racontée</em>');
    expect(fr).toContain('<span data-i18n="hero.cta">Créer mon bilan</span>');
    expect(fr).toContain('aria-label="Langue"');
    expect(fr).toContain('<option value="fr" selected>');
    expect(fr).not.toContain('<option value="es" selected>');
    expect(fr).toContain('>FR</span>');
    expect(JSON.parse(/<script type="application\/ld\+json">(.*?)<\/script>/.exec(fr)![1]).url).toBe('https://ejemplo.test/fr/');
  });

  it('textos con comillas y < > escapados', () => {
    const ru = localizeHtml(html, 'ru', 'https://ejemplo.test/', 'ru/');
    expect(ru).not.toMatch(/content="[^"]*"[^ />]/);
  });

  it('sitemap con las 12 versiones', () => {
    const xml = sitemap('https://ejemplo.test/');
    for (const l of LANGS) expect(xml).toContain(`<loc>https://ejemplo.test/${l}/</loc>`);
    expect(xml).toContain('hreflang="x-default"');
  });
});

describe('contracciones y fechas con artículo', () => {
  const sp = (s: string) => s.replace(/\s/g, ' ');
  it('catalán: d’, al, de l’1 a l’11, de Strava', () => {
    registerCardMessages('ca', cardDicts.ca as never);
    const f = new Fmt('ca', 'metric');
    expect(f.m('distance.textDest', { home: 'Olot', dest: 'el Caire', dist: '2.000 km', marathons: f.m('unit.marathons', { n: 47 }) })).toBe(
      'Sortint d’Olot, hauries arribat corrent fins al **Caire**: 2.000 km en línia recta. Són **47 maratons**.',
    );
    expect(f.m('calendar.goalWeek', { target: '20 km', hit: 3, total: 11 })).toContain('3 d’11 setmanes');
    expect(f.dateRange({ mo: 3, d: 1 }, { mo: 3, d: 11 })).toBe('de l’1 a l’11 de març');
    expect(f.dateRange({ mo: 2, d: 26 }, { mo: 3, d: 4 })).toBe('del 26 de febrer al 4 de març');
    expect(f.m('fun.challenges', { n: 1 })).toBe('Repte de Strava completat');
  });
  it('francés: d’Amsterdam', () => {
    registerCardMessages('fr', cardDicts.fr as never);
    const f = new Fmt('fr', 'metric');
    expect(f.m('distance.textDest', { home: 'Amsterdam', dest: 'Le Caire', dist: '2 000 km', marathons: '47' })).toMatch(/^En partant d’Amsterdam,/);
  });
  it('italiano: al Cairo, l’1 agosto', () => {
    registerCardMessages('it', cardDicts.it as never);
    const f = new Fmt('it', 'metric');
    expect(f.m('distance.textDest', { home: 'Olbia', dest: 'Il Cairo', dist: '2.000 km', marathons: '47' })).toContain('fino al **Cairo**');
    expect(f.m('intro.partial', { runs: 87, dateArt: f.dateArt({ mo: 8, d: 1 }) })).toContain('tra il 1º gennaio e l’1 agosto');
  });
  it('inglés: rangos cortos', () => {
    expect(sp(new Fmt('en', 'metric').dateRange({ mo: 3, d: 3 }, { mo: 3, d: 9 }, true))).toBe('Mar 3 – 9');
  });
});
