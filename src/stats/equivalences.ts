/** Comparaciones divertidas: destinos, montañas, comida… */

// [nombre es, nombre en, lat, lon, país]
type Dest = [string, string, number, number, string];

const DESTINATIONS: Dest[] = [
  // España
  ['Madrid', 'Madrid', 40.4168, -3.7038, 'ES'], ['Barcelona', 'Barcelona', 41.3874, 2.1686, 'ES'],
  ['Valencia', 'Valencia', 39.4699, -0.3763, 'ES'], ['Sevilla', 'Seville', 37.3891, -5.9845, 'ES'],
  ['Bilbao', 'Bilbao', 43.263, -2.935, 'ES'], ['Málaga', 'Malaga', 36.7213, -4.4214, 'ES'],
  ['Zaragoza', 'Zaragoza', 41.6488, -0.8891, 'ES'], ['Santiago de Compostela', 'Santiago de Compostela', 42.8782, -8.5448, 'ES'],
  ['A Coruña', 'A Coruña', 43.3623, -8.4115, 'ES'], ['Granada', 'Granada', 37.1773, -3.5986, 'ES'],
  ['Salamanca', 'Salamanca', 40.9701, -5.6635, 'ES'], ['Palma', 'Palma', 39.5696, 2.6502, 'ES'],
  ['Las Palmas', 'Las Palmas', 28.1235, -15.4363, 'ES'], ['San Sebastián', 'San Sebastián', 43.3183, -1.9812, 'ES'],
  ['Pamplona', 'Pamplona', 42.8125, -1.6458, 'ES'], ['Valladolid', 'Valladolid', 41.6523, -4.7245, 'ES'],
  ['Oviedo', 'Oviedo', 43.3614, -5.8494, 'ES'], ['Murcia', 'Murcia', 37.9922, -1.1307, 'ES'],
  ['Alicante', 'Alicante', 38.3452, -0.481, 'ES'], ['Córdoba', 'Córdoba', 37.8882, -4.7794, 'ES'],
  ['Cádiz', 'Cádiz', 36.5271, -6.2886, 'ES'], ['Toledo', 'Toledo', 39.8628, -4.0273, 'ES'],
  ['Burgos', 'Burgos', 42.3439, -3.6969, 'ES'], ['León', 'León', 42.5987, -5.5671, 'ES'],
  ['Santander', 'Santander', 43.4623, -3.8099, 'ES'], ['Vigo', 'Vigo', 42.2406, -8.7207, 'ES'],
  ['Almería', 'Almería', 36.834, -2.4637, 'ES'], ['Cáceres', 'Cáceres', 39.4753, -6.3724, 'ES'],
  ['Logroño', 'Logroño', 42.4627, -2.445, 'ES'], ['Girona', 'Girona', 41.9794, 2.8214, 'ES'],
  ['Tarragona', 'Tarragona', 41.1189, 1.2445, 'ES'], ['Lleida', 'Lleida', 41.6176, 0.62, 'ES'],
  ['Albacete', 'Albacete', 38.9943, -1.8585, 'ES'], ['Huelva', 'Huelva', 37.2614, -6.9447, 'ES'],
  ['Castellón', 'Castellón', 39.9864, -0.0513, 'ES'], ['Santa Cruz de Tenerife', 'Santa Cruz de Tenerife', 28.4636, -16.2518, 'ES'],
  // Portugal, Andorra, Mónaco, Gibraltar
  ['Lisboa', 'Lisbon', 38.7223, -9.1393, 'PT'], ['Oporto', 'Porto', 41.1579, -8.6291, 'PT'], ['Faro', 'Faro', 37.0194, -7.9322, 'PT'],
  ['Andorra la Vella', 'Andorra la Vella', 42.5063, 1.5218, 'AD'], ['Mónaco', 'Monaco', 43.7384, 7.4246, 'MC'],
  // Francia
  ['París', 'Paris', 48.8566, 2.3522, 'FR'], ['Marsella', 'Marseille', 43.2965, 5.3698, 'FR'], ['Lyon', 'Lyon', 45.764, 4.8357, 'FR'],
  ['Burdeos', 'Bordeaux', 44.8378, -0.5792, 'FR'], ['Toulouse', 'Toulouse', 43.6047, 1.4442, 'FR'], ['Niza', 'Nice', 43.7102, 7.262, 'FR'],
  ['Nantes', 'Nantes', 47.2184, -1.5536, 'FR'], ['Estrasburgo', 'Strasbourg', 48.5734, 7.7521, 'FR'], ['Lille', 'Lille', 50.6292, 3.0573, 'FR'],
  ['Montpellier', 'Montpellier', 43.6108, 3.8767, 'FR'], ['Biarritz', 'Biarritz', 43.4832, -1.5586, 'FR'], ['Perpiñán', 'Perpignan', 42.6887, 2.8948, 'FR'],
  // Reino Unido e Irlanda
  ['Londres', 'London', 51.5074, -0.1278, 'GB'], ['Mánchester', 'Manchester', 53.4808, -2.2426, 'GB'], ['Edimburgo', 'Edinburgh', 55.9533, -3.1883, 'GB'],
  ['Glasgow', 'Glasgow', 55.8642, -4.2518, 'GB'], ['Liverpool', 'Liverpool', 53.4084, -2.9916, 'GB'], ['Cardiff', 'Cardiff', 51.4816, -3.1791, 'GB'],
  ['Belfast', 'Belfast', 54.5973, -5.9301, 'GB'], ['Dublín', 'Dublin', 53.3498, -6.2603, 'IE'],
  // Benelux y Alemania
  ['Ámsterdam', 'Amsterdam', 52.3676, 4.9041, 'NL'], ['Róterdam', 'Rotterdam', 51.9244, 4.4777, 'NL'], ['Bruselas', 'Brussels', 50.8503, 4.3517, 'BE'],
  ['Brujas', 'Bruges', 51.2093, 3.2247, 'BE'], ['Luxemburgo', 'Luxembourg', 49.6116, 6.1319, 'LU'],
  ['Berlín', 'Berlin', 52.52, 13.405, 'DE'], ['Múnich', 'Munich', 48.1351, 11.582, 'DE'], ['Hamburgo', 'Hamburg', 53.5511, 9.9937, 'DE'],
  ['Fráncfort', 'Frankfurt', 50.1109, 8.6821, 'DE'], ['Colonia', 'Cologne', 50.9375, 6.9603, 'DE'], ['Stuttgart', 'Stuttgart', 48.7758, 9.1829, 'DE'],
  ['Dresde', 'Dresden', 51.0504, 13.7373, 'DE'], ['Leipzig', 'Leipzig', 51.3397, 12.3731, 'DE'],
  // Suiza, Austria, Italia
  ['Zúrich', 'Zurich', 47.3769, 8.5417, 'CH'], ['Ginebra', 'Geneva', 46.2044, 6.1432, 'CH'], ['Berna', 'Bern', 46.948, 7.4474, 'CH'],
  ['Viena', 'Vienna', 48.2082, 16.3738, 'AT'], ['Salzburgo', 'Salzburg', 47.8095, 13.055, 'AT'], ['Innsbruck', 'Innsbruck', 47.2692, 11.4041, 'AT'],
  ['Roma', 'Rome', 41.9028, 12.4964, 'IT'], ['Milán', 'Milan', 45.4642, 9.19, 'IT'], ['Venecia', 'Venice', 45.4408, 12.3155, 'IT'],
  ['Florencia', 'Florence', 43.7696, 11.2558, 'IT'], ['Nápoles', 'Naples', 40.8518, 14.2681, 'IT'], ['Turín', 'Turin', 45.0703, 7.6869, 'IT'],
  ['Bolonia', 'Bologna', 44.4949, 11.3426, 'IT'], ['Palermo', 'Palermo', 38.1157, 13.3615, 'IT'], ['Génova', 'Genoa', 44.4056, 8.9463, 'IT'],
  // Nórdicos
  ['Copenhague', 'Copenhagen', 55.6761, 12.5683, 'DK'], ['Estocolmo', 'Stockholm', 59.3293, 18.0686, 'SE'], ['Oslo', 'Oslo', 59.9139, 10.7522, 'NO'],
  ['Helsinki', 'Helsinki', 60.1699, 24.9384, 'FI'], ['Reikiavik', 'Reykjavik', 64.1466, -21.9426, 'IS'],
  // Centro y este de Europa
  ['Praga', 'Prague', 50.0755, 14.4378, 'CZ'], ['Varsovia', 'Warsaw', 52.2297, 21.0122, 'PL'], ['Cracovia', 'Krakow', 50.0647, 19.945, 'PL'],
  ['Budapest', 'Budapest', 47.4979, 19.0402, 'HU'], ['Bratislava', 'Bratislava', 48.1486, 17.1077, 'SK'], ['Liubliana', 'Ljubljana', 46.0569, 14.5058, 'SI'],
  ['Zagreb', 'Zagreb', 45.815, 15.9819, 'HR'], ['Belgrado', 'Belgrade', 44.7866, 20.4489, 'RS'], ['Bucarest', 'Bucharest', 44.4268, 26.1025, 'RO'],
  ['Sofía', 'Sofia', 42.6977, 23.3219, 'BG'], ['Atenas', 'Athens', 37.9838, 23.7275, 'GR'], ['Tesalónica', 'Thessaloniki', 40.6401, 22.9444, 'GR'],
  ['Estambul', 'Istanbul', 41.0082, 28.9784, 'TR'], ['Kiev', 'Kyiv', 50.4501, 30.5234, 'UA'], ['Moscú', 'Moscow', 55.7558, 37.6173, 'RU'],
  ['San Petersburgo', 'Saint Petersburg', 59.9311, 30.3609, 'RU'], ['Riga', 'Riga', 56.9496, 24.1052, 'LV'], ['Vilna', 'Vilnius', 54.6872, 25.2797, 'LT'],
  ['Tallin', 'Tallinn', 59.437, 24.7536, 'EE'],
  // África y Oriente Medio
  ['Marrakech', 'Marrakesh', 31.6295, -7.9811, 'MA'], ['Casablanca', 'Casablanca', 33.5731, -7.5898, 'MA'], ['Tánger', 'Tangier', 35.7595, -5.834, 'MA'],
  ['Argel', 'Algiers', 36.7538, 3.0588, 'DZ'], ['Túnez', 'Tunis', 36.8065, 10.1815, 'TN'], ['El Cairo', 'Cairo', 30.0444, 31.2357, 'EG'],
  ['Dakar', 'Dakar', 14.7167, -17.4677, 'SN'], ['Lagos', 'Lagos', 6.5244, 3.3792, 'NG'], ['Nairobi', 'Nairobi', -1.2921, 36.8219, 'KE'],
  ['Addis Abeba', 'Addis Ababa', 8.9806, 38.7578, 'ET'], ['Ciudad del Cabo', 'Cape Town', -33.9249, 18.4241, 'ZA'],
  ['Johannesburgo', 'Johannesburg', -26.2041, 28.0473, 'ZA'], ['Dubái', 'Dubai', 25.2048, 55.2708, 'AE'], ['Doha', 'Doha', 25.2854, 51.531, 'QA'],
  ['Jerusalén', 'Jerusalem', 31.7683, 35.2137, 'IL'], ['Ammán', 'Amman', 31.9454, 35.9284, 'JO'], ['Riad', 'Riyadh', 24.7136, 46.6753, 'SA'],
  // Asia y Oceanía
  ['Nueva Delhi', 'New Delhi', 28.6139, 77.209, 'IN'], ['Bombay', 'Mumbai', 19.076, 72.8777, 'IN'], ['Katmandú', 'Kathmandu', 27.7172, 85.324, 'NP'],
  ['Bangkok', 'Bangkok', 13.7563, 100.5018, 'TH'], ['Singapur', 'Singapore', 1.3521, 103.8198, 'SG'], ['Kuala Lumpur', 'Kuala Lumpur', 3.139, 101.6869, 'MY'],
  ['Yakarta', 'Jakarta', -6.2088, 106.8456, 'ID'], ['Bali', 'Bali', -8.6705, 115.2126, 'ID'], ['Hanói', 'Hanoi', 21.0278, 105.8342, 'VN'],
  ['Hong Kong', 'Hong Kong', 22.3193, 114.1694, 'HK'], ['Pekín', 'Beijing', 39.9042, 116.4074, 'CN'], ['Shanghái', 'Shanghai', 31.2304, 121.4737, 'CN'],
  ['Seúl', 'Seoul', 37.5665, 126.978, 'KR'], ['Tokio', 'Tokyo', 35.6762, 139.6503, 'JP'], ['Osaka', 'Osaka', 34.6937, 135.5023, 'JP'],
  ['Manila', 'Manila', 14.5995, 120.9842, 'PH'], ['Taipéi', 'Taipei', 25.033, 121.5654, 'TW'], ['Sídney', 'Sydney', -33.8688, 151.2093, 'AU'],
  ['Melbourne', 'Melbourne', -37.8136, 144.9631, 'AU'], ['Perth', 'Perth', -31.9505, 115.8605, 'AU'], ['Auckland', 'Auckland', -36.8485, 174.7633, 'NZ'],
  // Norteamérica
  ['Nueva York', 'New York', 40.7128, -74.006, 'US'], ['Boston', 'Boston', 42.3601, -71.0589, 'US'], ['Chicago', 'Chicago', 41.8781, -87.6298, 'US'],
  ['Los Ángeles', 'Los Angeles', 34.0522, -118.2437, 'US'], ['San Francisco', 'San Francisco', 37.7749, -122.4194, 'US'], ['Miami', 'Miami', 25.7617, -80.1918, 'US'],
  ['Washington', 'Washington', 38.9072, -77.0369, 'US'], ['Seattle', 'Seattle', 47.6062, -122.3321, 'US'], ['Las Vegas', 'Las Vegas', 36.1699, -115.1398, 'US'],
  ['Denver', 'Denver', 39.7392, -104.9903, 'US'], ['Austin', 'Austin', 30.2672, -97.7431, 'US'], ['Houston', 'Houston', 29.7604, -95.3698, 'US'],
  ['Nueva Orleans', 'New Orleans', 29.9511, -90.0715, 'US'], ['Atlanta', 'Atlanta', 33.749, -84.388, 'US'], ['Filadelfia', 'Philadelphia', 39.9526, -75.1652, 'US'],
  ['Honolulu', 'Honolulu', 21.3069, -157.8583, 'US'], ['Anchorage', 'Anchorage', 61.2181, -149.9003, 'US'], ['Toronto', 'Toronto', 43.6532, -79.3832, 'CA'],
  ['Montreal', 'Montreal', 45.5017, -73.5673, 'CA'], ['Vancouver', 'Vancouver', 49.2827, -123.1207, 'CA'],
  // México, Centroamérica y Caribe
  ['Ciudad de México', 'Mexico City', 19.4326, -99.1332, 'MX'], ['Guadalajara', 'Guadalajara', 20.6597, -103.3496, 'MX'],
  ['Monterrey', 'Monterrey', 25.6866, -100.3161, 'MX'], ['Cancún', 'Cancun', 21.1619, -86.8515, 'MX'], ['Oaxaca', 'Oaxaca', 17.0732, -96.7266, 'MX'],
  ['Ciudad de Guatemala', 'Guatemala City', 14.6349, -90.5069, 'GT'], ['San José', 'San José', 9.9281, -84.0907, 'CR'],
  ['Ciudad de Panamá', 'Panama City', 8.9824, -79.5199, 'PA'], ['La Habana', 'Havana', 23.1136, -82.3666, 'CU'],
  ['Santo Domingo', 'Santo Domingo', 18.4861, -69.9312, 'DO'], ['San Juan', 'San Juan', 18.4655, -66.1057, 'PR'],
  // Sudamérica
  ['Bogotá', 'Bogotá', 4.711, -74.0721, 'CO'], ['Medellín', 'Medellín', 6.2442, -75.5812, 'CO'], ['Cali', 'Cali', 3.4516, -76.532, 'CO'],
  ['Cartagena de Indias', 'Cartagena', 10.391, -75.4794, 'CO'], ['Caracas', 'Caracas', 10.4806, -66.9036, 'VE'], ['Quito', 'Quito', -0.1807, -78.4678, 'EC'],
  ['Guayaquil', 'Guayaquil', -2.171, -79.9224, 'EC'], ['Lima', 'Lima', -12.0464, -77.0428, 'PE'], ['Cuzco', 'Cusco', -13.532, -71.9675, 'PE'],
  ['La Paz', 'La Paz', -16.4897, -68.1193, 'BO'], ['Santiago de Chile', 'Santiago', -33.4489, -70.6693, 'CL'],
  ['Buenos Aires', 'Buenos Aires', -34.6037, -58.3816, 'AR'], ['Mendoza', 'Mendoza', -32.8895, -68.8458, 'AR'], ['Ushuaia', 'Ushuaia', -54.8019, -68.303, 'AR'],
  ['Montevideo', 'Montevideo', -34.9011, -56.1645, 'UY'], ['Asunción', 'Asunción', -25.2637, -57.5759, 'PY'],
  ['São Paulo', 'São Paulo', -23.5505, -46.6333, 'BR'], ['Río de Janeiro', 'Rio de Janeiro', -22.9068, -43.1729, 'BR'],
];

const ICONIC = new Set([
  'Madrid', 'Barcelona', 'Seville', 'Valencia', 'Lisbon', 'Porto', 'Paris', 'London', 'Rome', 'Berlin', 'Amsterdam',
  'Brussels', 'Vienna', 'Prague', 'Athens', 'Istanbul', 'Moscow', 'Copenhagen', 'Stockholm', 'Dublin', 'Edinburgh',
  'Venice', 'Milan', 'Munich', 'Cairo', 'Marrakesh', 'Dubai', 'New York', 'Los Angeles', 'Mexico City', 'Buenos Aires',
  'Rio de Janeiro', 'Tokyo', 'Beijing', 'Sydney', 'Cape Town', 'Reykjavik', 'Havana', 'Lima', 'Bogotá', 'Santiago',
  'Andorra la Vella', 'Monaco', 'Santiago de Compostela', 'Bilbao', 'Malaga', 'Kathmandu', 'Singapore', 'Bangkok',
]);

const R_KM = 6371.0088;
export function greatCircleKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = Math.PI / 180;
  const dLat = (lat2 - lat1) * r;
  const dLon = (lon2 - lon1) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export interface Destination {
  name: string;
  km: number;
  cc: string;
  lat: number;
  lon: number;
}

/**
 * Ciudad conocida a la que habrías llegado corriendo en línea recta desde casa con `totalKm`:
 * la más lejana que no se pase del total (y que esté a más de 40 km).
 */
export function pickDestination(home: { lat: number; lon: number }, totalKm: number, lang: 'es' | 'en'): Destination | null {
  if (!(totalKm > 45)) return null;
  let best: Destination | null = null;
  let bestScore = -Infinity;
  for (const [es, en, lat, lon, cc] of DESTINATIONS) {
    const km = greatCircleKm(home.lat, home.lon, lat, lon);
    if (km < 40 || km > totalKm) continue;
    if (km < totalKm * 0.55) continue;
    // Las ciudades icónicas ganan por poco a las que quedan algo más cerca del total.
    const score = km / totalKm + (ICONIC.has(en) ? 0.06 : 0);
    if (!best || score > bestScore) {
      best = { name: lang === 'es' ? es : en, km, cc, lat, lon };
      bestScore = score;
    }
  }
  return best;
}

export interface Landmark {
  key: string;
  height: number;
}

const LANDMARKS: Landmark[] = [
  { key: 'everest', height: 8849 },
  { key: 'kilimanjaro', height: 5895 },
  { key: 'montblanc', height: 4806 },
  { key: 'teide', height: 3715 },
  { key: 'burj', height: 828 },
  { key: 'eiffel', height: 330 },
];

export function pickLandmark(meters: number): { landmark: Landmark; times: number } | null {
  if (!(meters > 50)) return null;
  for (const l of LANDMARKS) {
    const times = meters / l.height;
    if (times >= 1) return { landmark: l, times };
  }
  const eiffel = LANDMARKS[LANDMARKS.length - 1];
  return { landmark: eiffel, times: meters / eiffel.height };
}

export const MARATHON_M = 42195;
export const EARTH_KM = 40075;
export const PIZZA_KCAL = 1000;
