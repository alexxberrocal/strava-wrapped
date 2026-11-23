/**
 * Clasificación del "Tipo de actividad" de Strava, que viene traducido al idioma de la cuenta
 * ("Run", "Carrera", "Lauf", "Course à pied", "Corsa", "Corrida", "Hardloopsessie", "跑步"...).
 */
export type SportCategory =
  | 'run'
  | 'ride'
  | 'swim'
  | 'walk'
  | 'hike'
  | 'workout'
  | 'weights'
  | 'yoga'
  | 'winter'
  | 'water'
  | 'other';

function norm(s: string): string {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

const RULES: [SportCategory, RegExp][] = [
  // Primero lo que podría confundirse con correr ("Skilanglauf", "Inline skate"...).
  ['winter', /ski|snowboard|snowshoe|raquet|schneeschuh|langlauf|eislauf|patin|skat|\bice\b|hielo|ghiaccio|esqui|sciare|lyzh|лыж|滑雪|スキー/],
  ['water', /\brow|rema|rudern|aviron|canot|kayak|canoe|kanu|surf|\bsup\b|paddle|stand ?up|kite|windsurf|sail|\bvela\b|segel|voile|velejar|rafting|piraguis/],
  ['ride', /ride|bike|cycl|bici|cicli|velo|\brad|fahrrad|radfahrt|fiets|wielr|rower|bisiklet|велосипед|自行车|骑行|サイクリング|ライド|mtb|gravel|handcycle|vuelta ciclista/],
  ['run', /\brun\b|running|trail ?run|\blauf\b|laufen|traillauf|carrera|correr|course|corsa|corrida|hardloop|hardlopen|\bbieg|\bbeh\b|\bkosu|kosmak|lopning|\bløb|\bløp|\blob\b|бег|забег|ラン|跑|트레일|러닝|달리기|\btrail\b/],
  ['swim', /swim|\bnatac|\bnatat|schwimm|nuoto|zwem|plyw|pływ|yuzme|плав|游泳|スイム|수영/],
  ['hike', /hike|hiking|excursi|senderis|wander(?!ing)|randonn|escursion|trilha|trekk|wedrowk|поход|徒步|ハイク|하이킹|caminata de montana/],
  ['walk', /walk|camin|spazier|gehen|marche|cammin|wandel|spacer|yuruyus|ходьб|прогулк|步行|ウォーク|걷기/],
  ['weights', /weight|pesas|pesos|gewicht|kraft|musculation|pesi|musculac|kracht|silow|agirlik|сил|力量|ウェイト|웨이트/],
  ['yoga', /yoga|йога|瑜伽|ヨガ|요가|pilates/],
  ['workout', /workout|entren|training|entrain|allenam|treino|trening|antrenman|тренир|训练|ワークアウト|운동|hiit|crossfit|elliptic|eliptic|stair|escalera|stepper|cardio/],
];

const cache = new Map<string, SportCategory>();

export function classifySport(raw: string): SportCategory {
  const key = raw ?? '';
  const hit = cache.get(key);
  if (hit) return hit;
  const n = norm(key);
  let cat: SportCategory = 'other';
  for (const [c, re] of RULES) {
    if (re.test(n)) {
      cat = c;
      break;
    }
  }
  cache.set(key, cat);
  return cat;
}

/** Deporte que declara el propio fichero (FIT/GPX/TCX) -> categoría. */
export function categoryFromFileSport(sport: string | null | undefined): SportCategory | null {
  if (!sport) return null;
  const s = sport.toLowerCase();
  if (/run|trail|treadmill|^9$/.test(s)) return 'run';
  if (/cycl|bik|ride|^1$/.test(s)) return 'ride';
  if (/swim/.test(s)) return 'swim';
  if (/walk/.test(s)) return 'walk';
  if (/hik/.test(s)) return 'hike';
  return null;
}
