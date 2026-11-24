import type { Lang } from '../i18n/langs';

/**
 * Nombres de las ciudades de destino en cada idioma (el español va en equivalences.ts).
 * Columnas: inglés | català | français | deutsch | italiano | português | nederlands | русский | 中文 | 日本語 | 한국어
 * Vacío = igual que en inglés.
 */
const TABLE = `
Madrid|||||Madri||Мадрид|马德里|マドリード|마드리드
Barcelona||Barcelone||Barcellona|||Барселона|巴塞罗那|バルセロナ|바르셀로나
Valencia|València|Valence|||Valência||Валенсия|瓦伦西亚|バレンシア|발렌시아
Seville|Sevilla|Séville|Sevilla|Siviglia|Sevilha|Sevilla|Севилья|塞维利亚|セビリア|세비야
Bilbao|||||||Бильбао|毕尔巴鄂|ビルバオ|빌바오
Malaga|Màlaga||Málaga||Málaga|Málaga|Малага|马拉加|マラガ|말라가
Zaragoza|Saragossa|Saragosse|Saragossa|Saragozza|Saragoça||Сарагоса|萨拉戈萨|サラゴサ|사라고사
Santiago de Compostela|Santiago de Compostel·la|Saint-Jacques-de-Compostelle||Santiago di Compostela||Santiago de Compostella|Сантьяго-де-Компостела|圣地亚哥-德孔波斯特拉|サンティアゴ・デ・コンポステーラ|산티아고데콤포스텔라
A Coruña|la Corunya|La Corogne||La Coruña|Corunha||Ла-Корунья|拉科鲁尼亚|ア・コルーニャ|아코루냐
Granada||Grenade|||||Гранада|格拉纳达|グラナダ|그라나다
Salamanca|||||||Саламанка|萨拉曼卡|サラマンカ|살라망카
Palma|||||||Пальма|帕尔马|パルマ|팔마
Las Palmas|||||||Лас-Пальмас|拉斯帕尔马斯|ラス・パルマス|라스팔마스
San Sebastián|Sant Sebastià|Saint-Sébastien|||||Сан-Себастьян|圣塞瓦斯蒂安|サン・セバスティアン|산세바스티안
Pamplona||Pampelune|||||Памплона|潘普洛纳|パンプローナ|팜플로나
Valladolid|||||||Вальядолид|巴利亚多利德|バリャドリッド|바야돌리드
Oviedo|||||||Овьедо|奥维耶多|オビエド|오비에도
Murcia|Múrcia|Murcie|||Múrcia||Мурсия|穆尔西亚|ムルシア|무르시아
Alicante|Alacant||||||Аликанте|阿利坎特|アリカンテ|알리칸테
Córdoba|Còrdova|Cordoue||Cordova|Córdova||Кордова|科尔多瓦|コルドバ|코르도바
Cádiz|Cadis|Cadix||Cadice|Cádis||Кадис|加的斯|カディス|카디스
Toledo||Tolède|||||Толедо|托莱多|トレド|톨레도
Burgos|||||||Бургос|布尔戈斯|ブルゴス|부르고스
León|Lleó||||||Леон|莱昂|レオン|레온
Santander|||||||Сантандер|桑坦德|サンタンデール|산탄데르
Vigo|||||||Виго|维戈|ビーゴ|비고
Almería|Almeria||||||Альмерия|阿尔梅里亚|アルメリア|알메리아
Cáceres|Càceres||||||Касерес|卡塞雷斯|カセレス|카세레스
Logroño|||||||Логроньо|洛格罗尼奥|ログローニョ|로그로뇨
Girona||Gérone|||||Жирона|赫罗纳|ジローナ|지로나
Tarragona||Tarragone|||||Таррагона|塔拉戈纳|タラゴナ|타라고나
Lleida||Lérida|||||Льейда|莱里达|リェイダ|레리다
Albacete|||||||Альбасете|阿尔瓦塞特|アルバセテ|알바세테
Huelva|||||||Уэльва|韦尔瓦|ウエルバ|우엘바
Castellón|Castelló de la Plana||||||Кастельон|卡斯特利翁|カステリョン|카스테욘
Santa Cruz de Tenerife|||||||Санта-Крус-де-Тенерифе|圣克鲁斯-德特内里费|サンタ・クルス・デ・テネリフェ|산타크루스데테네리페
Lisbon|Lisboa|Lisbonne|Lissabon|Lisbona|Lisboa|Lissabon|Лиссабон|里斯本|リスボン|리스본
Porto|||||||Порту|波尔图|ポルト|포르투
Faro|||||||Фару|法鲁|ファロ|파루
Andorra la Vella|||||||Андорра-ла-Велья|安道尔城|アンドラ・ラ・ベリャ|안도라라베야
Monaco|Mònaco||||Mônaco||Монако|摩纳哥|モナコ|모나코
Paris|París|||Parigi||Parijs|Париж|巴黎|パリ|파리
Marseille|Marsella|||Marsiglia|Marselha||Марсель|马赛|マルセイユ|마르세유
Lyon|Lió|||Lione|||Лион|里昂|リヨン|리옹
Bordeaux|Bordeus||||Bordéus||Бордо|波尔多|ボルドー|보르도
Toulouse|Tolosa||||||Тулуза|图卢兹|トゥールーズ|툴루즈
Nice|Niça||Nizza|Nizza|||Ницца|尼斯|ニース|니스
Nantes|||||||Нант|南特|ナント|낭트
Strasbourg|Estrasburg||Straßburg|Strasburgo|Estrasburgo|Straatsburg|Страсбург|斯特拉斯堡|ストラスブール|스트라스부르
Lille|||||||Лилль|里尔|リール|릴
Montpellier|Montpeller||||||Монпелье|蒙彼利埃|モンペリエ|몽펠리에
Biarritz|||||||Биарриц|比亚里茨|ビアリッツ|비아리츠
Perpignan|Perpinyà|||Perpignano|||Перпиньян|佩皮尼昂|ペルピニャン|페르피냥
London|Londres|Londres||Londra|Londres|Londen|Лондон|伦敦|ロンドン|런던
Manchester|||||||Манчестер|曼彻斯特|マンチェスター|맨체스터
Edinburgh|Edimburg|Édimbourg||Edimburgo|Edimburgo||Эдинбург|爱丁堡|エディンバラ|에든버러
Glasgow|||||||Глазго|格拉斯哥|グラスゴー|글래스고
Liverpool|||||||Ливерпуль|利物浦|リヴァプール|리버풀
Cardiff|||||||Кардифф|加的夫|カーディフ|카디프
Belfast|||||||Белфаст|贝尔法斯特|ベルファスト|벨파스트
Dublin|Dublín|||Dublino|||Дублин|都柏林|ダブリン|더블린
Amsterdam|||||Amsterdã||Амстердам|阿姆斯特丹|アムステルダム|암스테르담
Rotterdam|||||Roterdã||Роттердам|鹿特丹|ロッテルダム|로테르담
Brussels|Brussel·les|Bruxelles|Brüssel|Bruxelles|Bruxelas|Brussel|Брюссель|布鲁塞尔|ブリュッセル|브뤼셀
Bruges|||Brügge||||Брюгге|布鲁日|ブルージュ|브뤼허
Luxembourg|Luxemburg||Luxemburg|Lussemburgo|Luxemburgo|Luxemburg|Люксембург|卢森堡|ルクセンブルク|룩셈부르크
Berlin|Berlín|||Berlino|Berlim|Berlijn|Берлин|柏林|ベルリン|베를린
Munich|Munic||München|Monaco di Baviera|Munique|München|Мюнхен|慕尼黑|ミュンヘン|뮌헨
Hamburg||Hambourg||Amburgo|Hamburgo||Гамбург|汉堡|ハンブルク|함부르크
Frankfurt||Francfort||Francoforte|||Франкфурт|法兰克福|フランクフルト|프랑크푸르트
Cologne|Colònia||Köln|Colonia|Colônia|Keulen|Кёльн|科隆|ケルン|쾰른
Stuttgart||||Stoccarda|||Штутгарт|斯图加特|シュトゥットガルト|슈투트가르트
Dresden||Dresde||Dresda|||Дрезден|德累斯顿|ドレスデン|드레스덴
Leipzig||||Lipsia|||Лейпциг|莱比锡|ライプツィヒ|라이프치히
Zurich|Zúric||Zürich|Zurigo|Zurique|Zürich|Цюрих|苏黎世|チューリッヒ|취리히
Geneva|Ginebra|Genève|Genf|Ginevra|Genebra|Genève|Женева|日内瓦|ジュネーヴ|제네바
Bern|Berna|Berne||Berna|Berna||Берн|伯尔尼|ベルン|베른
Vienna|Viena|Vienne|Wien||Viena|Wenen|Вена|维也纳|ウィーン|빈
Salzburg||Salzbourg||Salisburgo|Salzburgo||Зальцбург|萨尔茨堡|ザルツブルク|잘츠부르크
Innsbruck|||||||Инсбрук|因斯布鲁克|インスブルック|인스브루크
Rome|Roma||Rom|Roma|Roma||Рим|罗马|ローマ|로마
Milan|Milà||Mailand|Milano|Milão|Milaan|Милан|米兰|ミラノ|밀라노
Venice|Venècia|Venise|Venedig|Venezia|Veneza|Venetië|Венеция|威尼斯|ヴェネツィア|베네치아
Florence|Florència||Florenz|Firenze|Florença||Флоренция|佛罗伦萨|フィレンツェ|피렌체
Naples|Nàpols||Neapel|Napoli|Nápoles|Napels|Неаполь|那不勒斯|ナポリ|나폴리
Turin|Torí|||Torino|Turim|Turijn|Турин|都灵|トリノ|토리노
Bologna|Bolonya|Bologne|||Bolonha||Болонья|博洛尼亚|ボローニャ|볼로냐
Palermo||Palerme|||||Палермо|巴勒莫|パレルモ|팔레르모
Genoa|Gènova|Gênes|Genua|Genova|Gênova|Genua|Генуя|热那亚|ジェノヴァ|제노바
Copenhagen|Copenhaguen|Copenhague|Kopenhagen|Copenaghen|Copenhague|Kopenhagen|Копенгаген|哥本哈根|コペンハーゲン|코펜하겐
Stockholm|Estocolm|||Stoccolma|Estocolmo||Стокгольм|斯德哥尔摩|ストックホルム|스톡홀름
Oslo|||||||Осло|奥斯陆|オスロ|오슬로
Helsinki|Hèlsinki||||||Хельсинки|赫尔辛基|ヘルシンキ|헬싱키
Reykjavik|Reykjavík||Reykjavík||||Рейкьявик|雷克雅未克|レイキャビク|레이캬비크
Prague|Praga||Prag|Praga|Praga|Praag|Прага|布拉格|プラハ|프라하
Warsaw|Varsòvia|Varsovie|Warschau|Varsavia|Varsóvia|Warschau|Варшава|华沙|ワルシャワ|바르샤바
Krakow|Cracòvia|Cracovie|Krakau|Cracovia|Cracóvia|Krakau|Краков|克拉科夫|クラクフ|크라쿠프
Budapest|||||Budapeste||Будапешт|布达佩斯|ブダペスト|부다페스트
Bratislava|||||||Братислава|布拉迪斯拉发|ブラチスラヴァ|브라티슬라바
Ljubljana||||Lubiana|Liubliana||Любляна|卢布尔雅那|リュブリャナ|류블랴나
Zagreb||||Zagabria|||Загреб|萨格勒布|ザグレブ|자그레브
Belgrade|Belgrad||Belgrad|Belgrado|Belgrado|Belgrado|Белград|贝尔格莱德|ベオグラード|베오그라드
Bucharest|Bucarest|Bucarest|Bukarest|Bucarest|Bucareste|Boekarest|Бухарест|布加勒斯特|ブカレスト|부쿠레슈티
Sofia|||||Sófia||София|索非亚|ソフィア|소피아
Athens|Atenes|Athènes|Athen|Atene|Atenas|Athene|Афины|雅典|アテネ|아테네
Thessaloniki|Tessalònica|Thessalonique||Salonicco|Tessalônica||Салоники|塞萨洛尼基|テッサロニキ|테살로니키
Istanbul|||||Istambul|Istanboel|Стамбул|伊斯坦布尔|イスタンブール|이스탄불
Kyiv|Kíiv|Kiev|Kiew|Kiev|Kiev|Kiev|Киев|基辅|キーウ|키이우
Moscow|Moscou|Moscou|Moskau|Mosca|Moscou|Moskou|Москва|莫斯科|モスクワ|모스크바
Saint Petersburg|Sant Petersburg|Saint-Pétersbourg|Sankt Petersburg|San Pietroburgo|São Petersburgo|Sint-Petersburg|Санкт-Петербург|圣彼得堡|サンクトペテルブルク|상트페테르부르크
Riga|||||||Рига|里加|リガ|리가
Vilnius|||||||Вильнюс|维尔纽斯|ヴィリニュス|빌뉴스
Tallinn|||||||Таллин|塔林|タリン|탈린
Marrakesh|Marràqueix|Marrakech|Marrakesch|Marrakech|Marrakech||Марракеш|马拉喀什|マラケシュ|마라케시
Casablanca|||||||Касабланка|卡萨布兰卡|カサブランカ|카사블랑카
Tangier|Tànger|Tanger|Tanger|Tangeri|Tânger|Tanger|Танжер|丹吉尔|タンジェ|탕헤르
Algiers|Alger|Alger|Algier|Algeri|Argel||Алжир|阿尔及尔|アルジェ|알제
Tunis||||Tunisi|Túnis||Тунис|突尼斯|チュニス|튀니스
Cairo|el Caire|Le Caire|Kairo|Il Cairo||Caïro|Каир|开罗|カイロ|카이로
Dakar|||||||Дакар|达喀尔|ダカール|다카르
Lagos|||||||Лагос|拉各斯|ラゴス|라고스
Nairobi|||||||Найроби|内罗毕|ナイロビ|나이로비
Addis Ababa|Addis Abeba|Addis-Abeba|Addis Abeba|Addis Abeba|Adis Abeba|Addis Abeba|Аддис-Абеба|亚的斯亚贝巴|アディスアベバ|아디스아바바
Cape Town|Ciutat del Cap|Le Cap|Kapstadt|Città del Capo|Cidade do Cabo|Kaapstad|Кейптаун|开普敦|ケープタウン|케이프타운
Johannesburg|||||Joanesburgo||Йоханнесбург|约翰内斯堡|ヨハネスブルグ|요하네스버그
Dubai||Dubaï|||||Дубай|迪拜|ドバイ|두바이
Doha|||||||Доха|多哈|ドーハ|도하
Jerusalem||Jérusalem||Gerusalemme|Jerusalém|Jeruzalem|Иерусалим|耶路撒冷|エルサレム|예루살렘
Amman|||||Amã||Амман|安曼|アンマン|암만
Riyadh|Riad|Riyad|Riad|Riad|Riad|Riyad|Эр-Рияд|利雅得|リヤド|리야드
New Delhi|Nova Delhi||Neu-Delhi|Nuova Delhi|Nova Délhi||Нью-Дели|新德里|ニューデリー|뉴델리
Mumbai|Bombai|Bombay|||||Мумбаи|孟买|ムンバイ|뭄바이
Kathmandu|Katmandú|Katmandou||Katmandu|Catmandu||Катманду|加德满都|カトマンズ|카트만두
Bangkok|||||Banguecoque||Бангкок|曼谷|バンコク|방콕
Singapore|Singapur|Singapour|Singapur||Singapura||Сингапур|新加坡|シンガポール|싱가포르
Kuala Lumpur|||||||Куала-Лумпур|吉隆坡|クアラルンプール|쿠알라룸푸르
Jakarta||||Giacarta|Jacarta||Джакарта|雅加达|ジャカルタ|자카르타
Bali|||||||Бали|巴厘岛|バリ島|발리
Hanoi||Hanoï|||Hanói||Ханой|河内|ハノイ|하노이
Hong Kong|||Hongkong||||Гонконг|香港|香港|홍콩
Beijing|Pequín|Pékin|Peking|Pechino|Pequim|Peking|Пекин|北京|北京|베이징
Shanghai|Xangai||Schanghai||Xangai||Шанхай|上海|上海|상하이
Seoul|Seül|Séoul||Seul|Seul||Сеул|首尔|ソウル|서울
Tokyo|Tòquio||Tokio||Tóquio|Tokio|Токио|东京|東京|도쿄
Osaka|||||||Осака|大阪|大阪|오사카
Manila|||||||Манила|马尼拉|マニラ|마닐라
Taipei|||||Taipé||Тайбэй|台北|台北|타이베이
Sydney|||||||Сидней|悉尼|シドニー|시드니
Melbourne|||||||Мельбурн|墨尔本|メルボルン|멜버른
Perth|||||||Перт|珀斯|パース|퍼스
Auckland|||||||Окленд|奥克兰|オークランド|오클랜드
New York|Nova York||||Nova York||Нью-Йорк|纽约|ニューヨーク|뉴욕
Boston|||||||Бостон|波士顿|ボストン|보스턴
Chicago|||||||Чикаго|芝加哥|シカゴ|시카고
Los Angeles|||||||Лос-Анджелес|洛杉矶|ロサンゼルス|로스앤젤레스
San Francisco|||||São Francisco||Сан-Франциско|旧金山|サンフランシスコ|샌프란시스코
Miami|||||||Майами|迈阿密|マイアミ|마이애미
Washington|||||||Вашингтон|华盛顿|ワシントン|워싱턴
Seattle|||||||Сиэтл|西雅图|シアトル|시애틀
Las Vegas|||||||Лас-Вегас|拉斯维加斯|ラスベガス|라스베이거스
Denver|||||||Денвер|丹佛|デンバー|덴버
Austin|||||||Остин|奥斯汀|オースティン|오스틴
Houston|||||||Хьюстон|休斯敦|ヒューストン|휴스턴
New Orleans|Nova Orleans|La Nouvelle-Orléans|||Nova Orleans||Новый Орлеан|新奥尔良|ニューオーリンズ|뉴올리언스
Atlanta|||||||Атланта|亚特兰大|アトランタ|애틀랜타
Philadelphia|Filadèlfia|Philadelphie||Filadelfia|Filadélfia||Филадельфия|费城|フィラデルフィア|필라델피아
Honolulu|||||||Гонолулу|檀香山|ホノルル|호놀룰루
Anchorage|||||||Анкоридж|安克雷奇|アンカレッジ|앵커리지
Toronto|||||||Торонто|多伦多|トロント|토론토
Montreal|Mont-real|Montréal||Montréal|||Монреаль|蒙特利尔|モントリオール|몬트리올
Vancouver|||||||Ванкувер|温哥华|バンクーバー|밴쿠버
Mexico City|Ciutat de Mèxic|Mexico|Mexiko-Stadt|Città del Messico|Cidade do México|Mexico-Stad|Мехико|墨西哥城|メキシコシティ|멕시코시티
Guadalajara|||||||Гвадалахара|瓜达拉哈拉|グアダラハラ|과달라하라
Monterrey|||||||Монтеррей|蒙特雷|モンテレイ|몬테레이
Cancun|Cancún|Cancún|Cancún|Cancún|Cancún|Cancún|Канкун|坎昆|カンクン|칸쿤
Oaxaca|||||||Оахака|瓦哈卡|オアハカ|오악사카
Guatemala City|Ciutat de Guatemala|Guatemala|Guatemala-Stadt|Città del Guatemala|Cidade da Guatemala|Guatemala-Stad|Гватемала|危地马拉城|グアテマラシティ|과테말라시티
San José|||||||Сан-Хосе|圣何塞|サンホセ|산호세
Panama City|Ciutat de Panamà|Panama|Panama-Stadt|Città di Panama|Cidade do Panamá|Panama-Stad|Панама|巴拿马城|パナマシティ|파나마시티
Havana|l’Havana|La Havane|Havanna|L’Avana|||Гавана|哈瓦那|ハバナ|아바나
Santo Domingo||Saint-Domingue|||São Domingos||Санто-Доминго|圣多明各|サントドミンゴ|산토도밍고
San Juan|||||||Сан-Хуан|圣胡安|サンフアン|산후안
Bogotá|||||||Богота|波哥大|ボゴタ|보고타
Medellín|||||||Медельин|麦德林|メデジン|메데인
Cali|||||||Кали|卡利|カリ|칼리
Cartagena|Cartagena de Indias|Carthagène des Indes|||||Картахена|卡塔赫纳|カルタヘナ|카르타헤나
Caracas|||||||Каракас|加拉加斯|カラカス|카라카스
Quito|||||||Кито|基多|キト|키토
Guayaquil|||||||Гуаякиль|瓜亚基尔|グアヤキル|과야킬
Lima|||||||Лима|利马|リマ|리마
Cusco||Cuzco||||Cuzco|Куско|库斯科|クスコ|쿠스코
La Paz|||||||Ла-Пас|拉巴斯|ラパス|라파스
Santiago|Santiago de Xile|Santiago du Chili|Santiago de Chile|Santiago del Cile|||Сантьяго|圣地亚哥|サンティアゴ|산티아고
Buenos Aires|||||||Буэнос-Айрес|布宜诺斯艾利斯|ブエノスアイレス|부에노스아이레스
Mendoza|||||||Мендоса|门多萨|メンドーサ|멘도사
Ushuaia|||||||Ушуая|乌斯怀亚|ウシュアイア|우수아이아
Montevideo|||||||Монтевидео|蒙得维的亚|モンテビデオ|몬테비데오
Asunción|||||Assunção||Асунсьон|亚松森|アスンシオン|아순시온
São Paulo|||||||Сан-Паулу|圣保罗|サンパウロ|상파울루
Rio de Janeiro|||||||Рио-де-Жанейро|里约热内卢|リオデジャネイロ|리우데자네이루
`;

const COLS: Lang[] = ['ca', 'fr', 'de', 'it', 'pt', 'nl', 'ru', 'zh', 'ja', 'ko'];
const NAMES = new Map<string, Partial<Record<Lang, string>>>();
for (const line of TABLE.split('\n')) {
  if (!line.trim()) continue;
  const [en, ...rest] = line.split('|');
  const m: Partial<Record<Lang, string>> = {};
  rest.forEach((v, i) => {
    if (v) m[COLS[i]] = v;
  });
  NAMES.set(en, m);
}

/** Nombre de una ciudad de destino en el idioma pedido (inglés si no hay traducción). */
export function cityName(en: string, es: string, lang: Lang): string {
  if (lang === 'es') return es;
  if (lang === 'en') return en;
  const m = NAMES.get(en);
  // En catalán, si no hay nombre propio, el castellano suele ser el correcto (Bilbao, Salamanca…).
  return m?.[lang] ?? (lang === 'ca' ? es : en);
}
