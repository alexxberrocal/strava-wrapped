import { BRAND, PRIVACY_TRIM_METERS } from '../config';
import type { ArchiveInput } from '../parse/archive';
import { exportPath } from '../parse/exportPath';
import type { Dataset, Pipeline } from '../app/pipeline';
import { loadCountries } from '../geo/countries';
import { Fmt, type Units } from '../i18n/format';
import { applySiteLang, pctLabel, siteLang, tr } from '../i18n/site';
import { CardPainter, type Card, type DeckEnv } from '../render/card';
import { buildDeck } from '../render/deck';
import { ensureCardAssets, preloadDeckText } from '../render/fonts';
import { athleteName } from '../stats/names';
import type { Activity, WrappedStats } from '../stats/types';
import { fillAds } from './ads';
import { downloadBlob, h, slug, toast } from './dom';
import { paintThumb, renderZip } from './export';
import { StoryPlayer } from './player';
import { inviteFriends } from './invite';
import { openShareSheet } from './shareSheet';

interface Settings {
  year: number;
  name: string;
  units: Units;
  cityMap: boolean;
  trim: boolean;
  runTypes: Set<string>;
}

interface Built {
  stats: WrappedStats;
  cards: Card[];
  painter: CardPainter;
  demo: boolean;
}

/** Controla todo el recorrido: archivo → progreso → ajustes → historia → resultados. */
export class Flow {
  private pipeline: Pipeline | null = null;
  private dataset: Dataset | null = null;
  private settings: Settings | null = null;
  private yearData: { key: string; runs: Activity[]; others: Activity[]; excluded: number } | null = null;
  private building: Promise<void> | null = null;
  private buildToken = 0;
  private built: Built | null = null;
  private dropHTML: string;

  constructor(
    private flowEl: HTMLElement,
    private resultsEl: HTMLElement,
    private getUnits: () => Units,
  ) {
    this.dropHTML = flowEl.innerHTML;
    this.bindDrop();
    this.bindPageDrop();
    this.bindResults();
  }

  // ------------------------------------------------------------ Entrada
  private bindDrop() {
    const drop = this.flowEl.querySelector<HTMLLabelElement>('#drop');
    const input = this.flowEl.querySelector<HTMLInputElement>('#file-input');
    const folderBtn = this.flowEl.querySelector<HTMLButtonElement>('#folder-btn');
    const folderInput = this.flowEl.querySelector<HTMLInputElement>('#folder-input');
    if (!drop || !input) return;
    input.addEventListener('change', () => {
      const f = input.files?.[0];
      if (f) void this.start(f.name.toLowerCase().endsWith('.csv') ? { kind: 'files', files: [{ path: 'activities.csv', file: f }] } : { kind: 'zip', file: f });
      input.value = '';
    });
    drop.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        input.click();
      }
    });
    folderBtn?.addEventListener('click', () => folderInput?.click());
    folderInput?.addEventListener('change', () => {
      const files = [...(folderInput.files ?? [])]
        .map((file) => ({ path: exportPath((file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name), file }))
        .filter((x): x is { path: string; file: File } => x.path != null);
      if (files.length) void this.start({ kind: 'files', files });
      folderInput.value = '';
    });
    for (const ev of ['dragenter', 'dragover']) {
      drop.addEventListener(ev, (e) => {
        e.preventDefault();
        drop.classList.add('is-over');
      });
    }
    for (const ev of ['dragleave', 'drop']) drop.addEventListener(ev, () => drop.classList.remove('is-over'));
  }

  /** Se puede soltar el archivo en cualquier parte de la página. */
  private bindPageDrop() {
    window.addEventListener('dragover', (e) => {
      if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
    });
    window.addEventListener('drop', (e) => {
      if (!e.dataTransfer) return;
      e.preventDefault();
      void inputFromDataTransfer(e.dataTransfer).then((input) => {
        if (input) {
          document.getElementById('crear')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          void this.start(input);
        }
      });
    });
  }

  // ------------------------------------------------------------ Proceso
  async start(input: ArchiveInput) {
    this.reset();
    // El motor de análisis (workers, zonas horarias…) solo se descarga al subir un archivo.
    const { Pipeline } = await import('../app/pipeline');
    this.pipeline = new Pipeline(input);
    const status = h('ul', { class: 'status' });
    const bar = h('i');
    const progress = h('div', { class: 'progress is-indeterminate' }, bar);
    this.flowEl.replaceChildren(
      h('div', { class: 'panel' }, h('h3', { class: 'panel__title' }, tr('flow.reading')), h('p', { class: 'panel__sub' }, ' '), progress, status),
    );
    const step = (text: string) => {
      status.querySelectorAll('li.is-active').forEach((li) => li.classList.replace('is-active', 'is-done'));
      status.append(h('li', { class: 'is-active' }, text));
    };
    step(tr('flow.reading'));
    try {
      this.dataset = await this.pipeline.load();
    } catch (err) {
      this.showError(err);
      return;
    }
    const ds = this.dataset;
    const year = ds.defaultYear ?? new Date().getFullYear();
    this.settings = {
      year,
      name: athleteName(ds.firstName ?? ''),
      // Las unidades que la persona tiene puestas en Strava; si el archivo no lo dice, las de su región.
      units: ds.scan.extras.units ?? this.getUnits(),
      cityMap: true,
      trim: true,
      runTypes: this.pipeline.defaultRunTypes(),
    };
    this.renderSetup();
    this.kickBuild();
  }

  private kickBuild() {
    const p = this.pipeline!, s = this.settings!;
    const key = `${s.year}|${[...s.runTypes].sort().join('§')}`;
    if (this.yearData?.key === key) return;
    const token = ++this.buildToken;
    this.yearData = null;
    this.setGo(false, 0);
    this.building = p
      .buildYear(s.year, { runTypes: s.runTypes }, (done, total) => {
        if (token === this.buildToken) this.setGo(false, total ? done / total : 0);
      })
      .then(({ runs, others, excluded }) => {
        if (token !== this.buildToken) return;
        this.yearData = { key, runs, others, excluded };
        this.renderSummaryLine();
        this.setGo(runs.length > 0, 1);
      })
      .catch((err) => {
        if (token === this.buildToken) this.showError(err);
      });
  }

  private goBtn: HTMLButtonElement | null = null;
  private summaryEl: HTMLElement | null = null;
  private warnEl: HTMLElement | null = null;
  private optionsEl: HTMLDetailsElement | null = null;

  private setGo(ready: boolean, p: number) {
    if (!this.goBtn) return;
    this.goBtn.disabled = !ready;
    this.goBtn.innerHTML = ready ? `<span>${tr('setup.go')}</span> <span aria-hidden="true">→</span>` : `<span>${tr('setup.wait', { pct: pctLabel(p) })}</span>`;
  }

  private renderSummaryLine() {
    if (!this.summaryEl || !this.yearData || !this.settings) return;
    const fmt = new Fmt(siteLang(), this.settings.units);
    const runs = this.yearData.runs;
    const dist = runs.reduce((a, r) => a + r.csv.distance, 0);
    const skipped = this.yearData.excluded ? tr('flow.excluded', { n: fmt.num(this.yearData.excluded) }) : '';
    this.summaryEl.textContent = tr('flow.summary', { runs: fmt.num(runs.length), year: this.settings.year, km: fmt.distWithUnit(dist, 0) }) + skipped;
    if (this.warnEl) {
      this.warnEl.hidden = runs.length > 0;
      // Sin carreras en ese año: las opciones (año y tipos de actividad) se abren solas.
      if (!runs.length && this.optionsEl) this.optionsEl.open = true;
      this.warnEl.textContent = tr('err.noRuns', { year: this.settings.year });
    }
  }

  private setStepTitle(key: 'step3.title' | 'step3.ready') {
    const el = document.getElementById('step3-title');
    if (el) {
      el.dataset.i18n = key;
      el.textContent = tr(key);
    }
  }

  private renderSetup() {
    const ds = this.dataset!, s = this.settings!, p = this.pipeline!;
    this.setStepTitle('step3.ready');
    const hello = h('h3', { class: 'panel__title' }, s.name ? tr('flow.hello', { name: s.name }) : tr('flow.helloAnon'));
    this.summaryEl = h('p', { class: 'panel__sub' }, tr('flow.scanned', { n: new Fmt(siteLang(), s.units).num(ds.scan.csv.activities.length) }));
    this.warnEl = h('p', { class: 'panel__error', hidden: true });

    const years = ds.years.filter((y) => y.activities > 0).slice(0, 8);
    const yearChips = h('div', { class: 'chips', role: 'group' });
    for (const y of years) {
      const chip = h('button', { type: 'button', class: 'chip', 'aria-pressed': String(y.year === s.year) }, String(y.year), y.runs ? h('small', {}, String(y.runs)) : null);
      chip.addEventListener('click', () => {
        s.year = y.year;
        yearChips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
        this.renderTypes(typesWrap);
        this.kickBuild();
      });
      yearChips.append(chip);
    }
    const nameInput = h('input', { class: 'input', type: 'text', maxlength: 18, value: s.name, autocomplete: 'off', autocapitalize: 'words', spellcheck: 'false', enterkeyhint: 'done', 'aria-label': tr('setup.name') }) as HTMLInputElement;
    nameInput.addEventListener('input', () => (s.name = athleteName(nameInput.value)));

    const unitChips = h('div', { class: 'chips', role: 'group' });
    for (const u of ['metric', 'imperial'] as Units[]) {
      const chip = h('button', { type: 'button', class: 'chip', 'aria-pressed': String(u === s.units) }, u === 'metric' ? tr('setup.km') : tr('setup.mi'));
      chip.addEventListener('click', () => {
        s.units = u;
        unitChips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
        this.renderSummaryLine();
      });
      unitChips.append(chip);
    }
    const toggle = (label: string, value: boolean, onChange: (v: boolean) => void) => {
      const input = h('input', { type: 'checkbox' }) as HTMLInputElement;
      input.checked = value;
      input.addEventListener('change', () => onChange(input.checked));
      return h('label', { class: 'toggle' }, input, h('span', {}, label));
    };
    const typesWrap = h('div', { class: 'chips' });
    this.renderTypes(typesWrap);

    this.goBtn = h('button', { type: 'button', class: 'btn btn--primary', disabled: true }) as HTMLButtonElement;
    this.goBtn.addEventListener('click', () => void this.play());
    const restart = h('button', { type: 'button', class: 'linkish' }, tr('setup.restart'));
    restart.addEventListener('click', () => this.resetToDrop());

    // A la vista solo lo esencial (el nombre y el botón): año, unidades, mapa, privacidad y tipos de
    // actividad ya vienen bien elegidos y quedan plegados en "Personalizar".
    this.optionsEl = h(
      'details',
      { class: 'options' },
      h('summary', {}, tr('setup.customize')),
      h(
        'div',
        { class: 'setup' },
        h('div', { class: 'field field--full' }, h('span', { class: 'field__label' }, tr('setup.year')), yearChips),
        h('div', { class: 'field field--full' }, h('span', { class: 'field__label' }, tr('setup.units')), unitChips),
        h('div', { class: 'field field--full' }, toggle(tr('setup.map'), s.cityMap, (v) => (s.cityMap = v)), toggle(tr('setup.trim'), s.trim, (v) => (s.trim = v))),
        h('div', { class: 'field field--full' }, h('span', { class: 'field__label' }, tr('setup.types')), typesWrap),
      ),
    ) as HTMLDetailsElement;
    this.flowEl.replaceChildren(
      h(
        'div',
        { class: 'panel' },
        hello,
        this.summaryEl,
        this.warnEl,
        h('label', { class: 'field field--name' }, h('span', { class: 'field__label' }, tr('setup.name')), nameInput),
        this.optionsEl,
        h('div', { class: 'panel__actions' }, this.goBtn, restart),
      ),
    );
    void p;
    this.setGo(false, 0);
  }

  private renderTypes(wrap: HTMLElement) {
    const p = this.pipeline!, s = this.settings!;
    wrap.replaceChildren();
    for (const t of p.typesFor(s.year)) {
      const on = s.runTypes.has(t.typeRaw);
      const chip = h('button', { type: 'button', class: 'chip', 'aria-pressed': String(on) }, t.typeRaw || '—', h('small', {}, String(t.count)));
      chip.addEventListener('click', () => {
        if (s.runTypes.has(t.typeRaw)) s.runTypes.delete(t.typeRaw);
        else s.runTypes.add(t.typeRaw);
        chip.setAttribute('aria-pressed', String(s.runTypes.has(t.typeRaw)));
        this.kickBuild();
      });
      wrap.append(chip);
    }
  }

  // ------------------------------------------------------------ Historia
  private async build(): Promise<Built | null> {
    const p = this.pipeline, s = this.settings, yd = this.yearData;
    if (!p || !s || !yd || !yd.runs.length) return null;
    const lang = siteLang();
    const stats = p.wrapped(s.year, yd.runs, yd.others, { name: s.name, lang, trimMeters: s.trim ? PRIVACY_TRIM_METERS : 0 }, s.runTypes);
    const [, countries, photos] = await Promise.all([
      ensureCardAssets(lang, s.name),
      loadCountries().catch(() => null),
      stats.photos.length >= 3 ? withTimeout(p.photos(stats.photos, 5), 6000, [] as ImageBitmap[]) : Promise.resolve([] as ImageBitmap[]),
    ]);
    const env: DeckEnv = { fmt: new Fmt(lang, s.units), stats, countries, photos, brand: BRAND.name, domain: BRAND.domain };
    const cards = buildDeck(env, { cityMap: s.cityMap });
    const painter = new CardPainter(env);
    // Ruso, chino, japonés, coreano (o un nombre en otra escritura): letras listas antes de pintar.
    await preloadDeckText(painter, cards, lang, s.name);
    return { stats, cards, painter, demo: false };
  }

  private async play() {
    if (this.goBtn) this.goBtn.disabled = true;
    try {
      const built = await this.build();
      if (!built) return;
      this.built = built;
      this.openStory(0);
    } catch (err) {
      console.error(err);
      toast(tr('err.generic', { msg: String((err as Error)?.message ?? err) }));
    } finally {
      if (this.goBtn) this.goBtn.disabled = false;
    }
  }

  /** Solo desarrollo: pinta todas las tarjetas (estado final) en una capa para revisarlas. */
  async debugStills(width = 200): Promise<string[]> {
    const built = await this.build();
    if (!built) return [];
    this.built = built;
    document.getElementById('debug-stills')?.remove();
    const wrap = h('div', { id: 'debug-stills', style: 'position:fixed;inset:0;z-index:99;overflow:auto;background:#222;display:flex;flex-wrap:wrap;gap:8px;padding:8px;align-content:flex-start' });
    for (const card of built.cards) {
      const c = h('canvas', { title: card.id });
      paintThumb(built.painter, card, c, width);
      c.style.width = `${width}px`;
      wrap.append(c);
    }
    document.body.append(wrap);
    return built.cards.map((c) => c.id);
  }

  /** Historia de ejemplo con el atleta de demo. */
  async playDemo(units: Units) {
    const lang = siteLang();
    const { demoStats } = await import('../demo/demo');
    const [, countries] = await Promise.all([ensureCardAssets(lang), loadCountries().catch(() => null)]);
    const stats = demoStats(lang);
    const env: DeckEnv = { fmt: new Fmt(lang, units), stats, countries, photos: [], brand: BRAND.name, domain: BRAND.domain };
    const cards = buildDeck(env);
    const painter = new CardPainter(env);
    await preloadDeckText(painter, cards, lang);
    const player = new StoryPlayer({
      cards,
      painter,
      demo: true,
      onShare: (card, index) => openShareSheet({ painter, card, index, filePrefix: `${BRAND.slug}-demo`, brand: BRAND.text }),
      onClose: () => undefined,
    });
    player.open();
  }

  private openStory(start: number) {
    const b = this.built;
    if (!b) return;
    const player = new StoryPlayer({
      cards: b.cards,
      painter: b.painter,
      start,
      demo: b.demo,
      onShare: (card, index) => openShareSheet({ painter: b.painter, card, index, filePrefix: this.filePrefix(), brand: BRAND.text }),
      onClose: () => this.showResults(),
      onFinish: () => player.close(),
    });
    player.open();
  }

  private filePrefix(): string {
    const s = this.built?.stats;
    return [BRAND.slug, s?.name ? slug(s.name) : '', s?.year].filter(Boolean).join('-');
  }

  // ------------------------------------------------------------ Resultados
  private bindResults() {
    this.resultsEl.querySelector('#results-play')?.addEventListener('click', () => this.openStory(0));
    this.resultsEl.querySelector('#results-invite')?.addEventListener('click', () => void inviteFriends());
    this.resultsEl.querySelector('#results-settings')?.addEventListener('click', () => {
      document.getElementById('crear')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    const zipBtn = this.resultsEl.querySelector<HTMLButtonElement>('#results-zip');
    zipBtn?.addEventListener('click', async () => {
      const b = this.built;
      if (!b || zipBtn.disabled) return;
      zipBtn.disabled = true;
      const label = zipBtn.innerHTML;
      try {
        const blob = await renderZip(b.painter, b.cards, this.filePrefix(), (p) => {
          zipBtn.textContent = tr('share.zipMaking', { pct: pctLabel(p) });
        });
        downloadBlob(blob, `${this.filePrefix()}.zip`);
      } catch (err) {
        toast(String((err as Error)?.message ?? err));
      } finally {
        zipBtn.disabled = false;
        zipBtn.innerHTML = label;
      }
    });
  }

  /**
   * Cambio de idioma con un archivo ya cargado: los ajustes y las pantallas pasan al idioma nuevo
   * (se quedaban en el anterior hasta volver a empezar).
   */
  async relocalize() {
    if (this.settings && this.dataset && this.flowEl.querySelector('.panel__actions')) {
      const open = !!this.optionsEl?.open;
      this.renderSetup();
      if (this.optionsEl) this.optionsEl.open = open;
      if (this.yearData) {
        this.renderSummaryLine();
        this.setGo(this.yearData.runs.length > 0, 1);
      }
    }
    if (this.built && !this.built.demo && !this.resultsEl.hidden) {
      try {
        const built = await this.build();
        if (built) {
          this.built = built;
          this.showResults(false);
        }
      } catch (err) {
        console.warn(err);
      }
    }
  }

  private showResults(scroll = true) {
    const b = this.built;
    if (!b) return;
    this.resultsEl.hidden = false;
    const kicker = this.resultsEl.querySelector('#results-kicker');
    if (kicker) kicker.textContent = tr('results.kicker', { year: b.stats.year });
    const grid = this.resultsEl.querySelector('#results-grid')!;
    grid.replaceChildren();
    b.cards.forEach((card, i) => {
      const canvas = h('canvas');
      const btn = h('button', { type: 'button', class: 'results__card', 'aria-label': `${tr('story.share')} ${i + 1}` }, canvas);
      btn.addEventListener('click', () => openShareSheet({ painter: b.painter, card, index: i, filePrefix: this.filePrefix(), brand: BRAND.text }));
      grid.append(btn);
      requestAnimationFrame(() => paintThumb(b.painter, card, canvas, Math.max(170, btn.clientWidth || 190)));
    });
    requestAnimationFrame(() => {
      if (scroll) this.resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      fillAds(this.resultsEl);
    });
  }

  // ------------------------------------------------------------ Errores y reinicio
  private showError(err: unknown) {
    console.error(err);
    const code = (err as { code?: string })?.code;
    const msg =
      code === 'no-csv'
        ? tr('err.noCsv')
        : code === 'bad-zip'
          ? tr('err.badZip')
          : code === 'encrypted'
            ? tr('err.encrypted')
            : tr('err.generic', { msg: String((err as Error)?.message ?? err) });
    const retry = h('button', { type: 'button', class: 'btn btn--light' }, tr('err.retry'));
    retry.addEventListener('click', () => this.resetToDrop());
    this.flowEl.replaceChildren(h('div', { class: 'panel' }, h('p', { class: 'panel__error', role: 'alert' }, msg), retry));
  }

  private reset() {
    this.buildToken++;
    this.pipeline?.dispose();
    this.pipeline = null;
    this.dataset = null;
    this.settings = null;
    this.yearData = null;
    this.building = null;
    // Con otro archivo (o al empezar de nuevo) no pueden quedar a la vista las pantallas del anterior.
    this.built = null;
    this.resultsEl.hidden = true;
    this.resultsEl.querySelector('#results-grid')?.replaceChildren();
  }

  resetToDrop() {
    this.reset();
    this.setStepTitle('step3.title');
    this.flowEl.innerHTML = this.dropHTML;
    applySiteLang(this.flowEl);
    this.bindDrop();
  }

  /** Para pruebas automáticas en desarrollo. */
  debugState() {
    return { dataset: this.dataset, settings: this.settings, yearRuns: this.yearData?.runs.length ?? null, cards: this.built?.cards.map((c) => c.id) ?? null, building: !!this.building };
  }
}

async function inputFromDataTransfer(dt: DataTransfer): Promise<ArchiveInput | null> {
  const items = [...dt.items].filter((i) => i.kind === 'file');
  const entries = items.map((i) => (i as DataTransferItem & { webkitGetAsEntry?: () => FileSystemEntry | null }).webkitGetAsEntry?.() ?? null);
  if (entries.some((e) => e?.isDirectory)) {
    const files: { path: string; file: File }[] = [];
    for (const e of entries) if (e) await walk(e, '', files);
    return files.length ? { kind: 'files', files } : null;
  }
  const f = dt.files[0];
  if (!f) return null;
  if (f.name.toLowerCase().endsWith('.csv')) return { kind: 'files', files: [{ path: 'activities.csv', file: f }] };
  return { kind: 'zip', file: f };
}

async function walk(entry: FileSystemEntry, prefix: string, out: { path: string; file: File }[]): Promise<void> {
  const path = prefix ? `${prefix}/${entry.name}` : entry.name;
  if (entry.isFile) {
    const rel = exportPath(path);
    if (rel == null) return;
    const file = await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej));
    out.push({ path: rel, file });
    return;
  }
  const reader = (entry as FileSystemDirectoryEntry).createReader();
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej));
    if (!batch.length) break;
    for (const e of batch) await walk(e, path, out);
  }
}

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p.catch(() => fallback), new Promise<T>((r) => setTimeout(() => r(fallback), ms))]);
}
