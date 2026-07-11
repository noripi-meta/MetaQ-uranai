// ===================================================================
// MetaQ 四柱推命診断アプリ ロジック
// 計算ロジックは Google スプレッドシート「四柱推命命式作成シート」の
// サンプルデータ8件と完全一致するよう検証済み。
// ===================================================================

(function () {
  "use strict";

  // ---------- 基本データ ----------
  const JIKKAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
  const JUNISHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
  const YINYANG = {"甲":1,"乙":-1,"丙":1,"丁":-1,"戊":1,"己":-1,"庚":1,"辛":-1,"壬":1,"癸":-1};
  const ELEMENT = {"甲":"木","乙":"木","丙":"火","丁":"火","戊":"土","己":"土","庚":"金","辛":"金","壬":"水","癸":"水"};

  const JUNIUN_NAMES = ["長生","沐浴","冠帯","建禄","帝旺","衰","病","死","墓","絶","胎","養"];
  const CHANGSHENG_BRANCH = {
    "甲":"亥","乙":"午","丙":"寅","丁":"酉","戊":"寅",
    "己":"酉","庚":"巳","辛":"子","壬":"申","癸":"卯"
  };

  const MONTH_BRANCH_ORDER = ["寅","卯","辰","巳","午","未","申","酉","戌","亥","子","丑"];
  const WUHU_DUN  = {0:2,5:2, 1:4,6:4, 2:6,7:6, 3:8,8:8, 4:0,9:0};   // 月干用(五虎遁)
  const WUSHU_DUN = {0:0,5:0, 1:2,6:2, 2:4,7:4, 3:6,8:6, 4:8,9:8};   // 時干用(五鼠遁)

  // 十二運 -> 動物・グループ・カラー（のりぴさん確定版）
  const JUNIUN_TO_ANIMAL = {
    "長生": { animal:"猿",     group:"earth" },
    "沐浴": { animal:"チータ",  group:"sun" },
    "冠帯": { animal:"黒ひょう", group:"moon" },
    "建禄": { animal:"ライオン", group:"sun" },
    "帝旺": { animal:"虎",     group:"earth" },
    "衰":   { animal:"たぬき",  group:"moon" },
    "病":   { animal:"子守熊", group:"earth" },
    "死":   { animal:"ゾウ",   group:"sun" },
    "墓":   { animal:"ひつじ",  group:"moon" },
    "絶":   { animal:"ペガサス", group:"sun" },
    "胎":   { animal:"狼",    group:"earth" },
    "養":   { animal:"こじか", group:"moon" },
  };

  const GROUP_LABEL = { earth:"地球", moon:"月", sun:"太陽" };

  // 12動物の表示順(地球グループ→月グループ→太陽グループの順でまとめる)
  const ANIMAL_ORDER = [
    { animal:"猿",     group:"earth" },
    { animal:"虎",     group:"earth" },
    { animal:"子守熊", group:"earth" },
    { animal:"狼",    group:"earth" },
    { animal:"黒ひょう", group:"moon" },
    { animal:"たぬき",  group:"moon" },
    { animal:"ひつじ",  group:"moon" },
    { animal:"こじか", group:"moon" },
    { animal:"チータ",  group:"sun" },
    { animal:"ライオン", group:"sun" },
    { animal:"ゾウ",   group:"sun" },
    { animal:"ペガサス", group:"sun" },
  ];

  // 10種のレール表示順(木火土金水の順、各＋－)。色は五行に対応したパステルカラー。
  const RAIL_ORDER = [
    { rail:"マイペース",   element:"木", color:"#a8d8a0" },
    { rail:"マイウェイ",   element:"木", color:"#7fc788" },
    { rail:"ピース",       element:"火", color:"#ffb3a8" },
    { rail:"ロマン",       element:"火", color:"#ff9080" },
    { rail:"ヒューマニティ", element:"土", color:"#e3c89a" },
    { rail:"リアリティ",   element:"土", color:"#cba36e" },
    { rail:"ワイルド",     element:"金", color:"#e8d97a" },
    { rail:"エリート",     element:"金", color:"#d4c14e" },
    { rail:"ユニーク",     element:"水", color:"#8fd4ff" },
    { rail:"ロジック",     element:"水", color:"#6fb8e8" },
  ];

  // 60分類 No.(1-60) -> 固有の形容詞付きキャラクター名・干グループ
  // 出典: MetaQ「木火土金水と12分類キャラクター」表（のりぴさん提供画像より転記・確定）
  const BUNRUI60_DETAIL = {
    1:  { kanGroup:"大樹T+", charaName:"長距離ランナーのチータ" },
    2:  { kanGroup:"草花T-", charaName:"社交家のたぬき" },
    3:  { kanGroup:"太陽F+", charaName:"落ち着きのない猿" },
    4:  { kanGroup:"灯火F-", charaName:"フットワークの軽い子守熊" },
    5:  { kanGroup:"山岳E+", charaName:"面倒見のいい黒ひょう" },
    6:  { kanGroup:"大地E-", charaName:"愛情あふれる虎" },
    7:  { kanGroup:"鉱脈M+", charaName:"全力疾走するチータ" },
    8:  { kanGroup:"宝石M-", charaName:"磨き上げられたたぬき" },
    9:  { kanGroup:"海洋W+", charaName:"大きな志を持った猿" },
    10: { kanGroup:"雨露W-", charaName:"母性豊かな子守熊" },
    11: { kanGroup:"大樹T+", charaName:"正直なこじか" },
    12: { kanGroup:"草花T-", charaName:"人気者のゾウ" },
    13: { kanGroup:"太陽F+", charaName:"ネアカの狼" },
    14: { kanGroup:"灯火F-", charaName:"協調性のないひつじ" },
    15: { kanGroup:"山岳E+", charaName:"どっしりとした猿" },
    16: { kanGroup:"大地E-", charaName:"コアラの中の子守熊" },
    17: { kanGroup:"鉱脈M+", charaName:"強い意志持ったこじか" },
    18: { kanGroup:"宝石M-", charaName:"デリケートなゾウ" },
    19: { kanGroup:"海洋W+", charaName:"放浪の狼" },
    20: { kanGroup:"雨露W-", charaName:"物静かなひつじ" },
    21: { kanGroup:"大樹T+", charaName:"落ち着きのあるペガサス" },
    22: { kanGroup:"草花T-", charaName:"強靭な翼を持つペガサス" },
    23: { kanGroup:"太陽F+", charaName:"無邪気なひつじ" },
    24: { kanGroup:"灯火F-", charaName:"クリエイティヴな狼" },
    25: { kanGroup:"山岳E+", charaName:"穏やかな狼" },
    26: { kanGroup:"大地E-", charaName:"粘り強いひつじ" },
    27: { kanGroup:"鉱脈M+", charaName:"波乱に満ちたペガサス" },
    28: { kanGroup:"宝石M-", charaName:"優雅なペガサス" },
    29: { kanGroup:"海洋W+", charaName:"チャレンジ精神旺盛なひつじ" },
    30: { kanGroup:"雨露W-", charaName:"順応性のある狼" },
    31: { kanGroup:"大樹T+", charaName:"リーダーとなるゾウ" },
    32: { kanGroup:"草花T-", charaName:"しっかり者のこじか" },
    33: { kanGroup:"太陽F+", charaName:"活動的な子守熊" },
    34: { kanGroup:"灯火F-", charaName:"気分屋の猿" },
    35: { kanGroup:"山岳E+", charaName:"頼られると嬉しいひつじ" },
    36: { kanGroup:"大地E-", charaName:"好感の持たれる狼" },
    37: { kanGroup:"鉱脈M+", charaName:"まっしぐらに突き進むゾウ" },
    38: { kanGroup:"宝石M-", charaName:"華やかなこじか" },
    39: { kanGroup:"海洋W+", charaName:"夢とロマンの子守熊" },
    40: { kanGroup:"雨露W-", charaName:"尽くす猿" },
    41: { kanGroup:"大樹T+", charaName:"大器晩成のたぬき" },
    42: { kanGroup:"草花T-", charaName:"足腰の強いチータ" },
    43: { kanGroup:"太陽F+", charaName:"動き回る虎" },
    44: { kanGroup:"灯火F-", charaName:"情熱的な黒ひょう" },
    45: { kanGroup:"山岳E+", charaName:"サービス精神旺盛な子守熊" },
    46: { kanGroup:"大地E-", charaName:"守りの猿" },
    47: { kanGroup:"鉱脈M+", charaName:"人間味溢れるたぬき" },
    48: { kanGroup:"宝石M-", charaName:"品格のあるチータ" },
    49: { kanGroup:"海洋W+", charaName:"ゆったりとした悠然の虎" },
    50: { kanGroup:"雨露W-", charaName:"落ち込みの激しい黒ひょう" },
    51: { kanGroup:"大樹T+", charaName:"我が道を行くライオン" },
    52: { kanGroup:"草花T-", charaName:"統率力のあるライオン" },
    53: { kanGroup:"太陽F+", charaName:"感情豊かな黒ひょう" },
    54: { kanGroup:"灯火F-", charaName:"楽天的な虎" },
    55: { kanGroup:"山岳E+", charaName:"パワフルな虎" },
    56: { kanGroup:"大地E-", charaName:"気取らない黒ひょう" },
    57: { kanGroup:"鉱脈M+", charaName:"感情的なライオン" },
    58: { kanGroup:"宝石M-", charaName:"傷つきやすいライオン" },
    59: { kanGroup:"海洋W+", charaName:"束縛を嫌う黒ひょう" },
    60: { kanGroup:"雨露W-", charaName:"慈悲深い虎" },
  };

  // ---------- ユリウス日 ----------
  function toJulianDay(y, m, d, h) {
    let yy = y, mm = m;
    if (mm <= 2) { yy -= 1; mm += 12; }
    const A = Math.floor(yy / 100);
    // グレゴリオ暦への切替(1582/10/15)より前の日付は、歴史資料上ユリウス暦で
    // 記録されているのが通例のため、ユリウス暦として扱う(Meeusの標準的な方法)。
    // これを分けないと、切替前の日付(織田信長など)の日柱が約10日ズレる。
    const isGregorian = (y > 1582) || (y === 1582 && (m > 10 || (m === 10 && d >= 15)));
    const B = isGregorian ? (2 - A + Math.floor(A / 4)) : 0;
    const jd = Math.floor(365.25 * (yy + 4716)) + Math.floor(30.6001 * (mm + 1)) + d + B - 1524.5;
    return jd + (h / 24.0);
  }

  // ---------- 太陽黄経（簡易高精度式、誤差最大約20秒角） ----------
  function sunLongitude(jd) {
    const T = (jd - 2451545.0) / 36525.0;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    const Mrad = M * Math.PI / 180;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad)
            + (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad)
            + 0.000289 * Math.sin(3 * Mrad);
    const trueLong = L0 + C;
    const omega = 125.04 - 1934.136 * T;
    let lam = trueLong - 0.00569 - 0.00478 * Math.sin(omega * Math.PI / 180);
    lam = lam % 360;
    if (lam < 0) lam += 360;
    return lam;
  }

  // ---------- 日柱 ----------
  const REF_JD = toJulianDay(1900, 1, 31, 0); // 1900-01-31 = 甲辰
  const REF_INDEX = 40;

  function dayIndex(y, m, d) {
    const jd = toJulianDay(y, m, d, 0);
    const delta = Math.round(jd - REF_JD);
    let idx = (REF_INDEX + delta) % 60;
    if (idx < 0) idx += 60;
    return idx;
  }

  // ---------- 月柱 ----------
  function monthBranchIndex(longitude) {
    let shifted = (longitude - 315) % 360;
    if (shifted < 0) shifted += 360;
    const block = Math.floor(shifted / 30);
    return JUNISHI.indexOf(MONTH_BRANCH_ORDER[block]);
  }

  function monthStemIndex(yearStemIdx, monthBranchIdx) {
    const startStem = WUHU_DUN[yearStemIdx];
    const posInCycle = MONTH_BRANCH_ORDER.indexOf(JUNISHI[monthBranchIdx]);
    return (startStem + posInCycle) % 10;
  }

  // ---------- 年柱（立春基準） ----------
  function findLichunDate(y) {
    // 月柱の節入り判定(正午基準)と同じ基準で立春日を探す。
    // 深夜0時基準だと立春が午前に来る年に年の切替が1日遅れ、月柱とズレる。
    for (let i = 0; i < 6; i++) {
      const dt = new Date(y, 1, 2 + i); // 2/2始まりで探索
      const jd = toJulianDay(dt.getFullYear(), dt.getMonth() + 1, dt.getDate(), 12);
      const lon = sunLongitude(jd);
      if (lon >= 315) return dt;
    }
    return new Date(y, 1, 4);
  }

  function yearGanzhiIndex(y, m, d) {
    const lichun = findLichunDate(y);
    const target = new Date(y, m - 1, d);
    const effYear = (target >= lichun) ? y : y - 1;
    let idx = (effYear - 4) % 60;
    if (idx < 0) idx += 60;
    return { idx, effYear };
  }

  // ---------- 時柱 ----------
  function hourBranchIndex(hour, minute) {
    const totalMin = hour * 60 + minute;
    let shifted = (totalMin - 23 * 60 + 24 * 60) % (24 * 60); // 23:00を子の開始とする
    return Math.floor(shifted / 120) % 12;
  }

  function hourStemIndex(dayStemIdx, hourBranchIdx) {
    const ziStem = WUSHU_DUN[dayStemIdx];
    return (ziStem + hourBranchIdx) % 10;
  }

  // ---------- 十二運 ----------
  function juniunFor(dayStem, branchIdx) {
    const startBranch = JUNISHI.indexOf(CHANGSHENG_BRANCH[dayStem]);
    const isYang = YINYANG[dayStem] === 1;
    let pos;
    if (isYang) pos = (branchIdx - startBranch + 12) % 12;
    else pos = (startBranch - branchIdx + 12) % 12;
    return JUNIUN_NAMES[pos];
  }

  // ---------- 月律分野蔵干表（レール計算用） ----------
  // のりぴさんから提供された65件の実例から逆算して確定(64/65件一致、99%)。
  // 各支について [蔵干, 節入りからの累積経過日数(1始まり)の上限] のペア。
  // 子はサンプルが無く一般的配分で仮置き(将来サンプルが増えれば調整可能)。
  const BANYA_TABLE = {
    "子": [["壬", 10], ["癸", 30]],
    "丑": [["癸", 12], ["己", 30]],
    "寅": [["戊", 10], ["丙", 19], ["甲", 30]],
    "卯": [["乙", 30]],
    "辰": [["乙", 9], ["癸", 12], ["戊", 30]],
    "巳": [["戊", 7], ["庚", 14], ["丙", 30]],
    "午": [["己", 19], ["丁", 30]],
    "未": [["丁", 15], ["己", 30]],
    "申": [["戊", 12], ["壬", 15], ["庚", 30]],
    "酉": [["辛", 30]],
    "戌": [["辛", 12], ["戊", 30]],
    "亥": [["甲", 12], ["壬", 30]],
  };

  // 月支ブロック(30度区切り)が始まった日(節気の節入り日)を求め、
  // 対象日がそのブロックの何日目か(1始まり)を返す
  function findSekkuElapsedDays(y, m, d) {
    const targetJd = toJulianDay(y, m, d, 12); // 正午基準で日付のブレを避ける
    for (let back = 0; back < 35; back++) {
      const checkJd = targetJd - back;
      const checkLon = sunLongitude(checkJd);
      let checkShifted = (checkLon - 315) % 360;
      if (checkShifted < 0) checkShifted += 360;
      const checkBlock = Math.floor(checkShifted / 30);

      const prevJd = checkJd - 1;
      const prevLon = sunLongitude(prevJd);
      let prevShifted = (prevLon - 315) % 360;
      if (prevShifted < 0) prevShifted += 360;
      const prevBlock = Math.floor(prevShifted / 30);

      if (checkBlock !== prevBlock) {
        return Math.round(targetJd - checkJd) + 1; // 1始まり
      }
    }
    return 1; // フォールバック
  }

  function getZoukanForMonthBranch(branchName, elapsedDays) {
    const table = BANYA_TABLE[branchName];
    for (const [stem, cumulativeEnd] of table) {
      if (elapsedDays <= cumulativeEnd) return stem;
    }
    return table[table.length - 1][0];
  }

  // ---------- 通変星（レール計算用） ----------
  const GEN_ORDER = ["木", "火", "土", "金", "水"];

  function tsuhenseiFor(dayStem, targetStem) {
    const de = ELEMENT[dayStem], te = ELEMENT[targetStem];
    const dy = YINYANG[dayStem], ty = YINYANG[targetStem];
    const same = (dy === ty);
    if (de === te) return same ? "比肩" : "劫財";
    const deIdx = GEN_ORDER.indexOf(de);
    if (GEN_ORDER[(deIdx + 1) % 5] === te) return same ? "食神" : "傷官";
    if (GEN_ORDER[(deIdx + 2) % 5] === te) return same ? "偏財" : "正財";
    if (GEN_ORDER[(deIdx + 3) % 5] === te) return same ? "偏官" : "正官";
    if (GEN_ORDER[(deIdx + 4) % 5] === te) return same ? "偏印" : "印綬";
    return "?";
  }

  // 通変星 -> レール名（五行＋陰陽、本当の呼び方も保持）
  const TSUHENSEI_TO_RAIL = {
    "比肩":   { rail: "マイペース", element: "木", sign: "+" },
    "劫財":   { rail: "マイウェイ", element: "木", sign: "-" },
    "食神":   { rail: "ピース",     element: "火", sign: "+" },
    "傷官":   { rail: "ロマン",     element: "火", sign: "-" },
    "偏財":   { rail: "ヒューマニティ", element: "土", sign: "+" },
    "正財":   { rail: "リアリティ", element: "土", sign: "-" },
    "偏官":   { rail: "ワイルド",   element: "金", sign: "+" },
    "正官":   { rail: "エリート",   element: "金", sign: "-" },
    "偏印":   { rail: "ユニーク",   element: "水", sign: "+" },
    "印綬":   { rail: "ロジック",   element: "水", sign: "-" },
  };

  function calcRail(dayStem, monthBranchName, y, m, d) {
    const elapsed = findSekkuElapsedDays(y, m, d);
    const zoukan = getZoukanForMonthBranch(monthBranchName, elapsed);
    const tsuhensei = tsuhenseiFor(dayStem, zoukan);
    const railInfo = TSUHENSEI_TO_RAIL[tsuhensei] || { rail: "?", element: "", sign: "" };
    return {
      zoukan,
      tsuhensei,
      rail: railInfo.rail,
      element: railInfo.element,
      sign: railInfo.sign,
      label: `${railInfo.rail}（${tsuhensei}）`
    };
  }

  // ---------- 福の神No. ----------
  function digitSumUntilSingle(n) {
    n = Math.abs(n);
    while (n >= 10) {
      n = String(n).split("").reduce((sum, c) => sum + parseInt(c, 10), 0);
    }
    return n;
  }

  function calcFukuNoKami(y, m, d) {
    const n1 = digitSumUntilSingle(y);
    const monthDaySum = String(m).split("").reduce((s, c) => s + parseInt(c, 10), 0)
                      + String(d).split("").reduce((s, c) => s + parseInt(c, 10), 0);
    const n2 = digitSumUntilSingle(monthDaySum);
    const n3 = digitSumUntilSingle(n1 + n2);
    return { n1, n2, n3, label: `${n1}${n2}${n3}` };
  }

  // ---------- 空亡（旬空亡） ----------
  // 日干支番号X(1〜60)から旬グループ(0〜5)を出し、空亡になる地支と月を決める。
  const KOBAKU = [
    { junName: "甲子旬", branches: ["戌", "亥"], months: [10, 11] },
    { junName: "甲戌旬", branches: ["申", "酉"], months: [8, 9] },
    { junName: "甲申旬", branches: ["午", "未"], months: [6, 7] },
    { junName: "甲午旬", branches: ["辰", "巳"], months: [4, 5] },
    { junName: "甲辰旬", branches: ["寅", "卯"], months: [2, 3] },
    { junName: "甲寅旬", branches: ["子", "丑"], months: [12, 1] },
  ];
  function calcKobaku(bunrui60No) {
    const group = Math.floor((bunrui60No - 1) / 10); // 0〜5
    const k = KOBAKU[group];
    return { group, junName: k.junName, branches: k.branches.slice(), months: k.months.slice() };
  }
  // 空亡の地支に当たる西暦年を、基準年から先に向かって探す(年空亡の表示用)
  function nextKobakuYears(branches, fromYear, count) {
    const idxs = branches.map(b => JUNISHI.indexOf(b));
    const years = [];
    for (let y = fromYear; years.length < (count || branches.length) && y < fromYear + 24; y++) {
      const bi = ((y - 4) % 12 + 12) % 12; // その年の地支
      if (idxs.includes(bi)) years.push(y);
    }
    return years;
  }

  // ---------- エネルギー（十二運の点数合計） ----------
  const ENERGY_POINTS = {
    "長生": 9, "沐浴": 8, "冠帯": 10, "建禄": 11, "帝旺": 12, "衰": 7,
    "病": 4, "死": 2, "墓": 5, "絶": 1, "胎": 3, "養": 6
  };
  function calcEnergy(honshitsuJ, hyomenJ, ishiJ) {
    const p = (j) => ENERGY_POINTS[j] || 0;
    const a = p(honshitsuJ), b = p(hyomenJ), c = p(ishiJ);
    return { total: a + b + c, honshitsu: a, hyomen: b, ishi: c };
  }

  // ---------- 能力（通変星のレーダー） ----------
  // 各地支に含まれる蔵干(すべて)。命式内の通変星をもれなく数えるために使う。
  const ZOUKAN_ALL = {
    "子": ["癸"], "丑": ["己", "癸", "辛"], "寅": ["甲", "丙", "戊"], "卯": ["乙"],
    "辰": ["戊", "乙", "癸"], "巳": ["丙", "庚", "戊"], "午": ["丁", "己"], "未": ["己", "丁", "乙"],
    "申": ["庚", "壬", "戊"], "酉": ["辛"], "戌": ["戊", "辛", "丁"], "亥": ["壬", "甲"]
  };
  // 5つの能力軸。五行(木火土金水)＋陰陽コード(a〜j)に対応(MetaQの表に準拠)。
  const ABILITY_AXES = [
    { key: "jiritsu", label: "自立", sub: "計画力・独立心", element: "木", stars: ["比肩", "劫財"], codes: ["a", "b"] },
    { key: "hyogen", label: "表現", sub: "想像力・発信力", element: "火", stars: ["食神", "傷官"], codes: ["c", "d"] },
    { key: "jinmyaku", label: "人脈", sub: "交渉力・実行力", element: "土", stars: ["偏財", "正財"], codes: ["e", "f"] },
    { key: "kodo", label: "行動", sub: "統率力・分析力", element: "金", stars: ["偏官", "正官"], codes: ["g", "h"] },
    { key: "chisei", label: "知性", sub: "継続力・指導力", element: "水", stars: ["偏印", "印綬"], codes: ["i", "j"] },
  ];
  // ISDの10能力(通変星→コードa〜j・能力名・五行)。第一/第二能力の表示に使う。
  const ABILITY_10 = [
    { code: "a", name: "実行力", star: "比肩", element: "木" },
    { code: "b", name: "計画力", star: "劫財", element: "木" },
    { code: "c", name: "判断力", star: "食神", element: "火" },
    { code: "d", name: "表現力", star: "傷官", element: "火" },
    { code: "e", name: "包容力", star: "偏財", element: "土" },
    { code: "f", name: "計数力", star: "正財", element: "土" },
    { code: "g", name: "対話力", star: "偏官", element: "金" },
    { code: "h", name: "分析力", star: "正官", element: "金" },
    { code: "i", name: "応用力", star: "偏印", element: "水" },
    { code: "j", name: "吸収力", star: "印綬", element: "水" },
  ];

  // 命式の天干(年月日時)と全地支の蔵干から通変星を数え、5軸に集計する。陰(+)と陽(-)は別に数える。
  function calcAbility(dayStem, stems) {
    const counts = {};
    stems.forEach(s => { const t = tsuhenseiFor(dayStem, s); if (t) counts[t] = (counts[t] || 0) + 1; });
    const axes = ABILITY_AXES.map(ax => {
      const plus = counts[ax.stars[0]] || 0, minus = counts[ax.stars[1]] || 0;
      return { key: ax.key, label: ax.label, sub: ax.sub, element: ax.element, codes: ax.codes, plus, minus, value: plus + minus };
    });
    const max = Math.max(1, ...axes.map(a => a.value));
    return { axes, max, counts };
  }

  // ---------- リズム（バイオリズム） ----------
  // MetaQ提供の「五行×陰陽」表に準拠(比肩=活動⑤, 印綬=学習⑥ など)。通変星→リズム名。
  const RHYTHM_NAME = {
    "比肩": "活動", "劫財": "浪費", "食神": "調整", "傷官": "焦燥", "偏財": "投資",
    "正財": "成果", "偏官": "転換", "正官": "完結", "偏印": "整理", "印綬": "学習"
  };
  // リズム名 -> 五行(カレンダーの色分け用)
  const RHYTHM_TO_ELEMENT = {
    "活動": "木", "浪費": "木", "調整": "火", "焦燥": "火", "投資": "土",
    "成果": "土", "転換": "金", "完結": "金", "整理": "水", "学習": "水"
  };
  // リズム名 -> 番号(ISD準拠、カレンダー表示用)
  const RHYTHM_NUMBER = {
    "活動": 5, "浪費": 2, "調整": 4, "焦燥": 1, "投資": 8,
    "成果": 9, "転換": 7, "完結": 10, "整理": 3, "学習": 6
  };
  // ある対象日(ty/tm/td)の年干・月干・日干を求め、本人の日干から見た通変星でリズムを返す
  function calcRhythm(dayStem, ty, tm, td) {
    const jd = toJulianDay(ty, tm, td, 12);
    const mbIdx = monthBranchIndex(sunLongitude(jd));
    const { idx: yi } = yearGanzhiIndex(ty, tm, td);
    const yearStem = JIKKAN[(yi % 10 + 10) % 10];
    const monthStem = JIKKAN[monthStemIndex(yi % 10, mbIdx)];
    const dayStemT = JIKKAN[dayIndex(ty, tm, td) % 10];
    const rhythmOf = (targetStem) => RHYTHM_NAME[tsuhenseiFor(dayStem, targetStem)] || "?";
    return { year: rhythmOf(yearStem), month: rhythmOf(monthStem), day: rhythmOf(dayStemT) };
  }

  // ---------- 統合計算 ----------
  // 個性心理学の四柱推命では23:00が1日の区切り(23:00〜翌22:59が1日)。
  // 23時台生まれは翌日の日付として四柱全体を計算する(のりぴさん確定仕様 2026-07-09)。
  function nextCalendarDay(y, m, d) {
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const dim = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    d++;
    if (d > dim[m - 1]) { d = 1; m++; }
    if (m > 12) { m = 1; y++; }
    return { y, m, d };
  }

  function calcFourPillars(y, m, d, h, mi) {
    h = (h === undefined || h === null || isNaN(h)) ? null : h;
    mi = (mi === undefined || mi === null || isNaN(mi)) ? 0 : mi;
    if (h === 23) { const nd = nextCalendarDay(y, m, d); y = nd.y; m = nd.m; d = nd.d; }

    const di = dayIndex(y, m, d);
    const dayStem = JIKKAN[di % 10];
    const dayBranch = JUNISHI[di % 12];
    const dayGz = dayStem + dayBranch;

    // 月柱の判定には正午を使う（時刻不明でも月が変わる可能性は低いため）
    const noonH = (h === null) ? 12 : h;
    const jd = toJulianDay(y, m, d, noonH + mi / 60);
    const lon = sunLongitude(jd);
    const mbIdx = monthBranchIndex(lon);

    const { idx: yi, effYear } = yearGanzhiIndex(y, m, d);
    const yearStemIdx = yi % 10;
    const yearBranchIdx = yi % 12;
    const yearGz = JIKKAN[yearStemIdx] + JUNISHI[yearBranchIdx];

    const msIdx = monthStemIndex(yearStemIdx, mbIdx);
    const monthGz = JIKKAN[msIdx] + JUNISHI[mbIdx];

    const honshitsu = juniunFor(dayStem, di % 12);      // 本質＝日柱
    const hyomen     = juniunFor(dayStem, mbIdx);        // 表面＝月柱
    const ishi        = juniunFor(dayStem, yearBranchIdx); // 意思＝年柱

    let jichu = null; // 時柱
    let hourStem = null, hourBranch = null;
    if (h !== null) {
      const hbIdx = hourBranchIndex(h, mi);
      const hsIdx = hourStemIndex(JIKKAN.indexOf(dayStem), hbIdx);
      hourStem = JIKKAN[hsIdx];
      hourBranch = JUNISHI[hbIdx];
      const hourGz = hourStem + hourBranch;
      const hourJuniun = juniunFor(dayStem, hbIdx);
      jichu = { gz: hourGz, juniun: hourJuniun, ...JUNIUN_TO_ANIMAL[hourJuniun] };
    }

    const bunrui60No = di + 1;
    const bunrui60Detail = BUNRUI60_DETAIL[bunrui60No] || { kanGroup:"", charaName:"" };
    const fukuNoKami = calcFukuNoKami(y, m, d);
    const rail = calcRail(dayStem, JUNISHI[mbIdx], y, m, d);

    // 空亡・エネルギー・能力(生年月日だけで決まる部分。年空亡とリズムは表示時に計算)
    const kobaku = calcKobaku(bunrui60No);
    const energy = calcEnergy(honshitsu, hyomen, ishi);
    // 能力: 命式の天干(年月日時)＋全地支の蔵干から通変星を数える
    const abilityStems = [dayStem, JIKKAN[yearStemIdx], JIKKAN[msIdx]];
    if (hourStem) abilityStems.push(hourStem);
    const branchesForZoukan = [dayBranch, JUNISHI[yearBranchIdx], JUNISHI[mbIdx]];
    if (hourBranch) branchesForZoukan.push(hourBranch);
    branchesForZoukan.forEach(b => (ZOUKAN_ALL[b] || []).forEach(s => abilityStems.push(s)));
    const ability = calcAbility(dayStem, abilityStems);
    // 五行バランス: 命式の全ての干(天干＋蔵干)を木火土金水に数える
    const gogyou = { "木": 0, "火": 0, "土": 0, "金": 0, "水": 0 };
    abilityStems.forEach(s => { const e = ELEMENT[s]; if (e) gogyou[e]++; });

    return {
      bunrui60: bunrui60No,            // 1〜60
      bunrui60_gz: dayGz,
      bunrui60_kanGroup: bunrui60Detail.kanGroup,
      bunrui60_charaName: bunrui60Detail.charaName,
      fukuNoKami,
      rail,
      dayGz, monthGz, yearGz,
      dayStem,                          // リズム計算(表示時)に使う本人の日干
      honshitsu: { juniun: honshitsu, ...JUNIUN_TO_ANIMAL[honshitsu] },
      hyomen:    { juniun: hyomen,    ...JUNIUN_TO_ANIMAL[hyomen] },
      ishi:       { juniun: ishi,       ...JUNIUN_TO_ANIMAL[ishi] },
      jichu,
      kobaku,
      energy,
      ability,
      gogyou,
      effYear
    };
  }

  // ===================================================================
  // アプリ UI ロジック
  // ===================================================================

  // 12動物のカラー(のりぴさん指定)。60分類キャラ・動物チップの背景に使う。
  const ANIMAL_COLOR = {
    "ペガサス": "#9b59b6",   // パープル
    "狼": "#12c2b5",         // ターコイズ
    "こじか": "#9acd32",     // イエローグリーン
    "猿": "#f39c12",         // オレンジ
    "チータ": "#ff5a36",     // レッドオレンジ
    "黒ひょう": "#f4c724",   // イエロー
    "ライオン": "#3f51b5",   // インディゴ
    "虎": "#12a89a",         // ブルーグリーン
    "たぬき": "#2f8fe0",     // ブルー
    "子守熊": "#e0459b",     // マゼンタ
    "ゾウ": "#e53935",       // レッド
    "ひつじ": "#4caf50",     // グリーン
  };
  // 五行のカラー(木火土金水)。レール・能力・五行バランスの色に使う。火＝ピンク等。
  const FIVE_ELEMENT_COLOR = {
    "木": "#5cb85c", "火": "#ff8fb3", "土": "#f0e2a8", "金": "#d4af37", "水": "#5aa9e0"
  };
  // 背景色に対して読みやすい文字色(明るい背景は濃い文字、暗い背景は白)を返す
  function textOn(hex) {
    const c = String(hex || "").replace("#", "");
    if (c.length < 6) return "#333";
    const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b);
    return lum > 165 ? "#3a2f45" : "#fff";
  }
  // キャラ名や動物名に含まれる12動物を見つけて色を返す
  function animalColorOf(text) {
    const a = Object.keys(ANIMAL_COLOR).find(name => String(text || "").includes(name));
    return a ? ANIMAL_COLOR[a] : null;
  }

  // ---------- 共通の色付き表示ヘルパー ----------
  // 柱チップ(本質/表面/意思/時柱)は三分類(地球=earth/月=moon/太陽=sun)の色で表示
  function animalPillHtml(label, p) {
    if (!p) return `<span class="rc-pill empty"><span class="lbl">${label}</span>—</span>`;
    return `<span class="rc-pill ${p.group}"><span class="lbl">${label}</span>${escapeHtml(p.animal)}</span>`;
  }
  // 60分類キャラ名を、その動物の色の背景で表示
  function charaChipHtml(charaName) {
    const col = animalColorOf(charaName);
    if (!col) return `<span class="rc-chara">${escapeHtml(charaName)}</span>`;
    return `<span class="rc-chara chara-color" style="background:${col};color:${textOn(col)}">${escapeHtml(charaName)}</span>`;
  }
  // レールを五行の色＋陰陽(+/-)で表示(例: ロマン(-))
  function railBadgeHtml(rail) {
    const bg = FIVE_ELEMENT_COLOR[rail.element] || "#f4ecfb";
    const sign = rail.sign ? `(${rail.sign})` : "";
    return `<span class="rc-rail" style="background:${bg};color:${textOn(bg)}">レール ${escapeHtml(rail.rail)}${sign}</span>`;
  }
  // 干支＋干グループ(例: 辛卯 宝石M-)。干グループは日干の五行の色で表示。
  function kanGroupChipHtml(c) {
    const dayStemChar = (c.dayGz || "")[0];
    const bg = FIVE_ELEMENT_COLOR[ELEMENT[dayStemChar]];
    const gz = `<span class="rc-gz">${escapeHtml(c.bunrui60_gz)}</span>`;
    if (!bg || !c.bunrui60_kanGroup) return `<span class="rc-gz">${escapeHtml(c.bunrui60_gz)} ${escapeHtml(c.bunrui60_kanGroup || "")}</span>`;
    return `${gz}<span class="rc-kangroup" style="background:${bg};color:${textOn(bg)}">${escapeHtml(c.bunrui60_kanGroup)}</span>`;
  }

  // パステルカラーパレット（グループの自動色割り当て用）
  const GROUP_COLOR_PALETTE = [
    "#ffb3d9", "#bda3ff", "#8fd4ff", "#7fe0bd", "#ffe3a8",
    "#ffb3b3", "#b3e0ff", "#d9b3ff", "#b3ffd9", "#ffd9b3"
  ];

  // データはFirestoreで管理する。ここではアプリ内のメモリ上のキャッシュとして保持し、
  // Firebase側のリアルタイム購読イベント(metaq:results-updated / metaq:groups-updated)で更新される。
  let groups = [];
  let results = [];
  let dataReady = false; // Firestoreからの初回データ取得が完了したか

  function getFS() {
    return window.metaqFirestore || null;
  }

  async function createGroup(name) {
    const color = GROUP_COLOR_PALETTE[groups.length % GROUP_COLOR_PALETTE.length];
    const g = { id: "g_" + Date.now() + "_" + Math.random().toString(36).slice(2,6), name, color, _createdAt: Date.now() };
    const fs = getFS();
    if (fs) {
      try { await fs.saveGroup(g); } catch (e) { console.error(e); showToast("グループの保存に失敗しました"); return null; }
    }
    // Firestoreの購読が反映されるまでのラグを埋めるため、即時にローカルへも追加する
    // (一括登録で連続作成する際に、色や名前→IDの対応が正しく取れるようにする)
    groups = [...groups, g];
    sortGroupsInPlace();
    refreshAllGroupUI();
    scheduleSheetSync();
    return g;
  }

  // グループの名前・色を後から編集する
  async function editGroup(groupId, newName, newColor) {
    const g = getGroupById(groupId);
    if (!g) return;
    const updated = { ...g, name: (newName != null ? newName : g.name), color: newColor || g.color };
    const fs = getFS();
    if (fs) {
      try { await fs.saveGroup(updated); }
      catch (e) { console.error(e); showToast("グループの更新に失敗しました"); return; }
    }
    groups = groups.map(x => x.id === groupId ? updated : x);
    sortGroupsInPlace();
    refreshAllGroupUI();
    renderResults();
    scheduleSheetSync();
  }

  // グループの表示順を1つ上/下へ入れ替える(dir: -1=上, +1=下)。
  // 並び順はユーザー設定(settings/app の groupOrder = グループIDの配列)に保存し、
  // どの端末でも・スプレッドシートのシート順にも反映される。
  async function moveGroup(groupId, dir) {
    const ids = groups.map(g => g.id);
    const i = ids.indexOf(groupId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    const tmp = ids[i]; ids[i] = ids[j]; ids[j] = tmp;
    appSettings = { ...appSettings, groupOrder: ids };
    sortGroupsInPlace();
    refreshAllGroupUI();
    renderResults();
    const fs = getFS();
    if (fs && fs.saveSettings) {
      try { await fs.saveSettings({ groupOrder: ids }); }
      catch (e) { console.error(e); showToast("並び順の保存に失敗しました"); }
    }
    scheduleSheetSync();
  }

  // groups配列を、ユーザー設定の並び順(groupOrder)に従って並べ替える。
  // 未設定・新規グループは末尾に作成順で並ぶ。
  function sortGroupsInPlace() {
    const order = (appSettings && Array.isArray(appSettings.groupOrder)) ? appSettings.groupOrder : [];
    const rank = (id) => { const idx = order.indexOf(id); return idx === -1 ? Infinity : idx; };
    groups.sort((a, b) => {
      const ra = rank(a.id), rb = rank(b.id);
      if (ra !== rb) return ra - rb;
      return (a._createdAt || 0) - (b._createdAt || 0);
    });
  }

  async function deleteGroupById(groupId) {
    const fs = getFS();
    if (!fs) return;
    try {
      await fs.deleteGroup(groupId);
      // このグループに属していた人は、そのグループだけ外す(他のグループには残す)
      const affected = results.filter(r => resultGroupIds(r).includes(groupId));
      for (const r of affected) {
        const updated = { ...r, groupIds: resultGroupIds(r).filter(id => id !== groupId) };
        delete updated.groupId;
        await fs.saveResult(updated);
      }
      // 並び順設定(groupOrder)からも削除したグループのIDを取り除く(ゴミが溜まらないように)
      if (Array.isArray(appSettings.groupOrder) && appSettings.groupOrder.includes(groupId)) {
        const pruned = appSettings.groupOrder.filter(id => id !== groupId);
        appSettings = { ...appSettings, groupOrder: pruned };
        if (fs.saveSettings) {
          try { await fs.saveSettings({ groupOrder: pruned }); } catch (e) { console.error(e); }
        }
      }
      scheduleSheetSync();
    } catch (e) {
      console.error(e);
      showToast("グループの削除に失敗しました");
    }
  }

  function getGroupById(id) {
    return groups.find(g => g.id === id) || null;
  }

  // 1人が複数グループに所属できる。データは groupIds(配列)で持つが、
  // 旧データ(groupId 単一)も読めるように正規化して返す。
  function resultGroupIds(r) {
    if (Array.isArray(r.groupIds)) return r.groupIds;
    return r.groupId ? [r.groupId] : [];
  }

  // 重複判定用に名前を正規化(全角/半角スペースを除去)
  function normalizePersonName(r) {
    const base = (r.sei || r.mei) ? (r.sei || "") + (r.mei || "") : (r.name || "");
    return String(base).replace(/[\s　]/g, "");
  }
  // 同じ名前(スペース無視)＋同じ生年月日の既存の人を探す
  function findDuplicate(nameNorm, birthDate) {
    return results.find(r => normalizePersonName(r) === nameNorm && r.birthDate === birthDate) || null;
  }

  // 診断結果の検索用テキスト(名前・備考・グループ名・生年月日・診断内容をまとめる)
  // 柱ごとの検索トークン(動物と十二運の両方)を作る
  function pillarSearchTokens(c) {
    const t = [];
    const add = (label, p) => { if (p) { t.push(label + p.animal); if (p.juniun) t.push(label + p.juniun); } };
    add("本質", c.honshitsu); add("表面", c.hyomen); add("意思", c.ishi); add("時柱", c.jichu);
    return t;
  }

  function resultSearchText(r) {
    const c = r.calc || {};
    const gnames = resultGroupIds(r).map(id => { const g = getGroupById(id); return g ? g.name : ""; });
    const parts = [
      r.sei, r.mei, r.name, r.nickname, r.note, r.birthDate, r.birthTime,
      ...gnames,
      c.bunrui60 != null ? "no." + c.bunrui60 : "", c.bunrui60_gz, c.bunrui60_kanGroup, c.bunrui60_charaName,
      c.rail && c.rail.rail, c.rail && c.rail.tsuhensei,
      c.fukuNoKami && ("福の神" + c.fukuNoKami.label),
      c.honshitsu && c.honshitsu.animal, c.honshitsu && GROUP_LABEL[c.honshitsu.group],
      c.hyomen && c.hyomen.animal, c.hyomen && GROUP_LABEL[c.hyomen.group],
      c.ishi && c.ishi.animal, c.ishi && GROUP_LABEL[c.ishi.group],
      c.jichu && c.jichu.animal,
      // 柱別検索用トークン: 「本質ライオン」「表面チータ」「意思胎」「時柱死」のように検索できる
      ...pillarSearchTokens(c)
    ];
    return parts.filter(Boolean).join(" ").toLowerCase();
  }

  // Firebase側からのリアルタイム更新を受け取り、メモリ上のキャッシュを更新して再描画する
  window.addEventListener("metaq:results-updated", (e) => {
    results = e.detail.results || [];
    dataReady = true;
    renderResults();
    refreshAllGroupUI();
    refreshCompatPeople();
  });
  window.addEventListener("metaq:groups-updated", (e) => {
    groups = e.detail.groups || [];
    sortGroupsInPlace();
    renderResults();
    refreshAllGroupUI();
  });
  // ログアウト時: メモリ上の全キャッシュと選択状態を白紙に戻す
  window.addEventListener("metaq:signed-out", () => {
    results = [];
    groups = [];
    appSettings = {};
    dataReady = false;
    currentUid = null;
    selectedSingleGroupIds = [];
    selectedBulkGroupId = null;
    editingResultId = null;
    editingGroupId = null;
    libraryRendered = false;
    if (sheetSyncTimer) { clearTimeout(sheetSyncTimer); sheetSyncTimer = null; }
    // 管理者用の図書館タブも隠し、通常タブへ戻す
    const libTab = document.getElementById("tab-library");
    if (libTab) libTab.style.display = "none";
    switchTab("single");
    renderResults();
    refreshAllGroupUI();
  });

  function showToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2200);
  }

  // ---------- 表記ゆれ吸収ユーティリティ ----------
  // 全角数字(０-９)を半角(0-9)に変換し、全角記号も半角化、前後の余分な空白を除去
  function normalizeNumericString(str) {
    if (str === null || str === undefined) return "";
    let s = String(str);
    // 全角数字 -> 半角数字
    s = s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
    // 全角記号の表記ゆれを半角へ
    s = s.replace(/[／]/g, "/").replace(/[－ー―‐]/g, "-").replace(/[．]/g, ".").replace(/[：]/g, ":");
    // 全角スペース・連続スペースを単一の半角スペースへ、前後はtrim
    s = s.replace(/[\u3000\s]+/g, " ").trim();
    return s;
  }

  // 実在する日付かどうか(2月29日のうるう年判定・6月31日の排除など)
  function isValidYmd(y, m, d) {
    if (m < 1 || m > 12 || d < 1) return false;
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const dim = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return d <= dim[m - 1];
  }

  function parseFlexibleDate(str) {
    str = normalizeNumericString(str);
    if (!str) return null;

    // パターンA: 区切りあり 1990/06/24, 1990-6-24, 1990.6.24, 1990年6月24日, スペース区切りも許容
    // 数字の間に空白が混じっていても(例: "1990 / 0 6 / 24")対応するため、まず区切り文字以外の空白を除去
    let compact = str.replace(/(\d)\s+(?=\d)/g, "$1"); // 数字と数字の間の単独スペースを除去(2 -> 02のような分割対策)
    compact = compact.replace(/\s+/g, ""); // 残りの空白も除去

    let m = compact.match(/^(\d{4})[\/\-\.年](\d{1,2})[\/\-\.月](\d{1,2})日?$/);
    if (m && isValidYmd(+m[1], +m[2], +m[3])) return { y: +m[1], m: +m[2], d: +m[3] };

    // パターンB: 区切りなし 8桁 (19900624) または 6桁(YYMMDD想定はせず、YYYYMMDDのみ厳格対応)
    m = compact.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (m && isValidYmd(+m[1], +m[2], +m[3])) return { y: +m[1], m: +m[2], d: +m[3] };

    return null;
  }

  // 実在する時刻か(0〜23時・0〜59分)
  function isValidHm(h, mi) {
    return h >= 0 && h <= 23 && mi >= 0 && mi <= 59;
  }

  function parseFlexibleTime(str) {
    str = normalizeNumericString(str);
    if (!str) return null;

    let compact = str.replace(/(\d)\s+(?=\d)/g, "$1").replace(/\s+/g, "");

    let m = compact.match(/^(\d{1,2})[:時](\d{1,2})分?$/);
    if (m) return isValidHm(+m[1], +m[2]) ? { h: +m[1], mi: +m[2] } : null;

    // 区切りなし4桁 (2256 -> 22:56)
    m = compact.match(/^(\d{2})(\d{2})$/);
    if (m) return isValidHm(+m[1], +m[2]) ? { h: +m[1], mi: +m[2] } : null;

    // 時のみ
    m = compact.match(/^(\d{1,2})$/);
    if (m) return isValidHm(+m[1], 0) ? { h: +m[1], mi: 0 } : null;

    return null;
  }

  // 入力欄からフォーカスが外れた時に、解析できた値を統一表記(YYYY/MM/DD, HH:MM)に整形して表示する
  function formatDateForDisplay(parsed) {
    return `${parsed.y}/${String(parsed.m).padStart(2,"0")}/${String(parsed.d).padStart(2,"0")}`;
  }
  function formatTimeForDisplay(parsed) {
    return `${String(parsed.h).padStart(2,"0")}:${String(parsed.mi).padStart(2,"0")}`;
  }

  // 診断結果1件分のデータを作る(保存はしない)。単発登録と一括登録で共用。
  function makeResultEntry(name, y, m, d, h, mi, groupIds, note, sei, mei, createdAt) {
    const gids = Array.isArray(groupIds) ? groupIds.filter(Boolean) : (groupIds ? [groupIds] : []);
    return {
      id: "r_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      name: name || "（名前未入力）",
      sei: sei || "",
      mei: mei || "",
      note: note || "",
      birthDate: `${y}/${String(m).padStart(2,"0")}/${String(d).padStart(2,"0")}`,
      birthTime: (h !== null && h !== undefined) ? `${String(h).padStart(2,"0")}:${String(mi||0).padStart(2,"0")}` : "",
      groupIds: gids,
      calc: calcFourPillars(y, m, d, h, mi),
      _createdAt: createdAt || Date.now()
    };
  }

  async function addResult(name, y, m, d, h, mi, groupIds, note, sei, mei) {
    const entry = makeResultEntry(name, y, m, d, h, mi, groupIds, note, sei, mei);
    const fs = getFS();
    if (fs) {
      // 保存に失敗したら画面・シートには反映しない(あるように見えて実は消える事故を防ぐ)
      try { await fs.saveResult(entry); }
      catch (e) { console.error(e); showToast("保存に失敗しました"); return false; }
    }
    // Firestoreのリアルタイム購読が結果を反映するまでの一瞬のラグを埋めるため、
    // 画面には即時反映しておく(購読イベントが届くと正しい状態に上書きされる)
    results = [entry, ...results];
    renderResults();
    scheduleSheetSync();
    return true;
  }

  // 全員の診断内容(calc)を、今の最新ロジックで計算し直す。
  // 診断ロジックを直したとき、既存の保存済みデータにも反映するために使う。
  // 生年月日・時刻から計算し直し、内容が変わった人だけまとめて保存する。
  async function recalcAllResults() {
    if (results.length === 0) { showToast("診断結果がありません"); return; }
    const changed = [];
    results.forEach(r => {
      const d = parseFlexibleDate(r.birthDate);
      if (!d) return; // 生年月日が読み取れないものは触らない
      const t = r.birthTime ? parseFlexibleTime(r.birthTime) : null;
      const h = t ? t.h : null, mi = t ? t.mi : null;
      const newCalc = calcFourPillars(d.y, d.m, d.d, h, mi);
      if (JSON.stringify(newCalc) !== JSON.stringify(r.calc)) {
        changed.push({ ...r, calc: newCalc });
      }
    });
    if (changed.length === 0) { showToast("計算し直しました。変わった人はいませんでした"); return; }
    if (!confirm(`${changed.length}人の診断内容が新しい計算で更新されます。よろしいですか？`)) return;
    const fs = getFS();
    if (fs && fs.saveResultsBatch) {
      try { await fs.saveResultsBatch(changed); }
      catch (e) { console.error(e); showToast("保存に失敗しました"); return; }
    }
    const byId = {};
    changed.forEach(c => { byId[c.id] = c; });
    results = results.map(r => byId[r.id] || r);
    renderResults();
    refreshAllGroupUI();
    scheduleSheetSync();
    showToast(`${changed.length}人の診断を更新しました`);
  }

  // 複数件をまとめて登録する(一括登録の高速化)。まとめ書きで一度に保存する。
  async function addResultsBulk(entries) {
    if (entries.length === 0) return true;
    const fs = getFS();
    if (fs && fs.saveResultsBatch) {
      try { await fs.saveResultsBatch(entries); }
      catch (e) { console.error(e); showToast("保存に失敗しました"); return false; }
    }
    // 画面には登録順(古い順)で先頭が最新になるよう、逆順で前に積む
    results = [...entries.slice().reverse(), ...results];
    renderResults();
    scheduleSheetSync();
    return true;
  }

  async function deleteResult(id) {
    const fs = getFS();
    if (fs) {
      try { await fs.deleteResult(id); } catch (e) { console.error(e); showToast("削除に失敗しました"); return; }
    }
    results = results.filter(r => r.id !== id);
    renderResults();
    scheduleSheetSync();
  }


  function groupChipHtml(group) {
    return `<span class="group-chip ${group}">${GROUP_LABEL[group]}</span>`;
  }

  function pillarBoxHtml(label, pillar) {
    if (!pillar) {
      return `<div class="pillar-box" style="background:#f3eef7;">
        <div class="label">${label}</div>
        <div class="animal" style="color:#bbb;">—</div>
        <div class="juniun">未入力</div>
      </div>`;
    }
    return `<div class="pillar-box ${pillar.group}">
      <div class="label">${label}</div>
      <div class="animal">${pillar.animal}</div>
      <div class="juniun">${pillar.juniun}</div>
    </div>`;
  }

  // 折りたたみ式の詳細(空亡・エネルギー・能力・リズム)。calc(c)から組み立てる。
  // 年空亡とリズムは「今日」に依存するため、保存せず表示のたびに計算する。
  function resultDetailHtml(c, personName) {
    if (!c) return "";
    const now = new Date();
    let body = "";
    if (c.kobaku) {
      const kb = c.kobaku;
      const years = nextKobakuYears(kb.branches, now.getFullYear(), 2);
      body += `<div class="det-sec">
        <div class="det-h">🕳️ 空亡（${escapeHtml(kb.junName)}）</div>
        <div class="det-row">空亡の十二支：<b>${kb.branches.join("・")}</b></div>
        <div class="det-row">月空亡（毎年）：<b>${kb.months.map(m => m + "月").join("・")}</b></div>
        <div class="det-row">年空亡（次回）：<b>${years.join("・")}年</b></div>
      </div>`;
    }
    if (c.energy) {
      body += `<div class="det-sec">
        <div class="det-h">⚡ エネルギー</div>
        <div class="det-row">合計 <b class="det-big">${c.energy.total}</b> 点<span class="det-sub">（本質${c.energy.honshitsu}＋表面${c.energy.hyomen}＋意思${c.energy.ishi}）</span></div>
      </div>`;
    }
    if (c.ability) {
      // 10能力(a〜j)の値を通変星カウントから作り、多い順に並べる
      const items = ABILITY_10.map(ab => ({
        ...ab, value: (c.ability.counts && c.ability.counts[ab.star]) || 0
      }));
      const ranked = [...items].sort((x, y) => y.value - x.value);
      const max = Math.max(1, ...items.map(i => i.value));
      const first = ranked[0], second = ranked[1];
      const topCard = (rank, ab) => {
        const col = FIVE_ELEMENT_COLOR[ab.element] || "#c6a8ff";
        return `<div class="abil-top">
          <div class="abil-top-rank">${rank}</div>
          <div class="abil-top-body"><span class="abil-top-code" style="background:${col};color:${textOn(col)}">${ab.code}</span><b>${ab.name}</b></div>
        </div>`;
      };
      // 10能力の数値バー(a〜j順)。第一/第二はマーク付き
      const bars = items.map(ab => {
        const col = FIVE_ELEMENT_COLOR[ab.element] || "#c6a8ff";
        const pct = Math.round((ab.value / max) * 100);
        const mark = ab.code === first.code ? " ①" : ab.code === second.code ? " ②" : "";
        return `<div class="abil-bar-row${mark ? " hot" : ""}">
          <span class="abil-bar-label"><span class="abil-code" style="background:${col};color:${textOn(col)}">${ab.code}</span>${ab.name}${mark}</span>
          <span class="abil-bar-track"><span class="abil-bar-fill" style="width:${pct}%;background:${col}"></span></span>
          <span class="abil-bar-val">${ab.value}</span>
        </div>`;
      }).join("");
      body += `<div class="det-sec"><div class="det-h">📊 能力<span class="det-sub">（強い順）</span></div>
        <div class="abil-tops">${topCard("第一能力", first)}${topCard("第二能力", second)}</div>
        <div class="abil-bars">${bars}</div></div>`;
    }
    // 60タイプパーソナリティ(日柱の干支=60分類No.から引く)
    if (c.bunrui60 && SIXTY_TYPES[c.bunrui60 - 1]) {
      const st = SIXTY_TYPES[c.bunrui60 - 1];
      body += `<div class="det-sec">
        <div class="det-h">🎭 60タイプパーソナリティ</div>
        <div class="sixty-head"><span class="sixty-code">${escapeHtml(st.code)}</span><span class="sixty-kanshi">${escapeHtml(st.kanshi)}</span></div>
        <div class="sixty-hitokoto">「${escapeHtml(st.hitokoto)}」</div>
        <div class="det-row">🎭 表裏：${escapeHtml(st.omoteura)}</div>
        <div class="det-row">💬 決めゼリフ：「${escapeHtml(st.serifu)}」</div>
        <div class="det-row">👤 日干の特徴：${escapeHtml(st.tokucho)}</div>
      </div>`;
    }
    if (c.gogyou) {
      const g = c.gogyou;
      const gmax = Math.max(1, ...Object.values(g));
      const gtotal = Object.values(g).reduce((s, v) => s + v, 0) || 1;
      const order = ["木", "火", "土", "金", "水"];
      const gbars = order.map(el => {
        const pct = Math.round((g[el] / gmax) * 100);
        const col = FIVE_ELEMENT_COLOR[el];
        return `<div class="det-bar-row">
          <span class="det-bar-label gogyou-label" style="width:38px"><span class="lbl-line"><span class="det-el-dot" style="background:${col}"></span>${el}</span></span>
          <span class="det-bar-track"><span class="det-bar-fill" style="width:${pct}%;background:${col}"></span></span>
          <span class="det-bar-val">${g[el]}</span>
        </div>`;
      }).join("");
      // 偏り(一番多い/一番少ない/無い五行)を一言で
      const maxEl = order.filter(el => g[el] === gmax);
      const zeros = order.filter(el => g[el] === 0);
      const note = `一番強い五行は<b>${maxEl.join("・")}</b>` + (zeros.length ? `／<b>${zeros.join("・")}</b>が無く偏りあり` : "");
      body += `<div class="det-sec"><div class="det-h">☯️ 五行バランス<span class="det-sub">（命式の木火土金水の偏り）</span></div>${gbars}<div class="det-row" style="margin-top:4px">${note}</div></div>`;
    }
    if (c.dayStem) {
      const r = calcRhythm(c.dayStem, now.getFullYear(), now.getMonth() + 1, now.getDate());
      body += `<div class="det-sec">
        <div class="det-h">🎵 リズム<span class="det-sub">（${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}時点）</span></div>
        <div class="det-chips">
          <span class="det-chip">年 <b>${escapeHtml(r.year)}</b></span>
          <span class="det-chip">月 <b>${escapeHtml(r.month)}</b></span>
          <span class="det-chip">日 <b>${escapeHtml(r.day)}</b></span>
        </div>
        <button class="rhythm-cal-btn" data-daystem="${escapeHtml(c.dayStem)}" data-name="${escapeHtml(personName || "")}">📅 リズムカレンダーを見る</button>
      </div>`;
    }
    if (!body) return "";
    return `<details class="rc-detail"><summary>詳細</summary><div class="rc-detail-body">${body}</div></details>`;
  }

  let editingResultId = null; // 個別編集中の結果ID

  // 個別の診断結果の 名前・生年月日・時刻・備考 を編集して保存する。
  // 生年月日/時刻が変わると命式を計算し直す。
  async function editResult(id, name, dateStr, timeStr, note, groupIds, nickname) {
    const r = results.find(x => x.id === id);
    if (!r) return false;
    const date = parseFlexibleDate(dateStr);
    if (!date || date.m < 1 || date.m > 12 || date.d < 1 || date.d > 31) {
      showToast("生年月日を正しい形式で入力してください（例：1990/06/24）");
      return false;
    }
    const time = parseFlexibleTime(timeStr);
    const h = time ? time.h : null;
    const mi = time ? time.mi : null;
    const pad = (n) => String(n).padStart(2, "0");
    const updated = {
      ...r,
      name: name || "（名前未入力）",
      sei: "", mei: "",
      nickname: (nickname !== undefined ? nickname : (r.nickname || "")) || "",
      note: note || "",
      groupIds: (groupIds || []).filter(Boolean),
      birthDate: `${date.y}/${pad(date.m)}/${pad(date.d)}`,
      birthTime: (h !== null && h !== undefined) ? `${pad(h)}:${pad(mi || 0)}` : "",
      calc: calcFourPillars(date.y, date.m, date.d, h, mi)
    };
    delete updated.groupId;
    const fs = getFS();
    if (fs) {
      try { await fs.saveResult(updated); }
      catch (e) { console.error(e); showToast("保存に失敗しました"); return false; }
    }
    results = results.map(x => x.id === id ? updated : x);
    renderResults();
    scheduleSheetSync();
    return true;
  }

  function renderResultCard(entry) {
    const c = entry.calc;
    const gids = resultGroupIds(entry);

    // 編集中はこのカードを編集フォームに差し替える
    if (entry.id === editingResultId) {
      const editName = (entry.sei || entry.mei)
        ? [entry.sei, entry.mei].filter(Boolean).join(" ")
        : (entry.name === "（名前未入力）" ? "" : entry.name);
      const groupChecks = groups.map(g =>
        `<label class="grp-check"><input type="checkbox" class="edit-group" value="${g.id}" ${gids.includes(g.id) ? "checked" : ""}>
          <span class="swatch" style="background:${safeColor(g.color)}"></span>${escapeHtml(g.name)}</label>`
      ).join("") || `<div class="hint">グループがありません。「グループ管理」で作成してください。</div>`;
      return `
      <div class="result-card">
        <div class="result-head"><div><div class="name">✎ 編集中</div></div></div>
        <div class="edit-form">
          <div class="field"><label>名前</label><input type="text" class="edit-name" value="${escapeHtml(editName)}" placeholder="名前"></div>
          <div class="field"><label>ニックネーム（任意・検索にも使えます）</label><input type="text" class="edit-nickname" value="${escapeHtml(entry.nickname || "")}" placeholder="あだ名・旧姓など"></div>
          <div class="field"><label>生年月日</label><input type="text" class="edit-date" value="${escapeHtml(entry.birthDate || "")}" placeholder="1990/06/24"></div>
          <div class="field"><label>時刻（任意・空欄OK）</label><input type="text" class="edit-time" value="${escapeHtml(entry.birthTime || "")}" placeholder="14:30"></div>
          <div class="field"><label>備考（任意）</label><input type="text" class="edit-note" value="${escapeHtml(entry.note || "")}" placeholder="メモ"></div>
          <div class="field"><label>グループ（複数選択できます）</label>
            <div class="grp-checks">${groupChecks}</div>
          </div>
          <div style="display:flex; gap:8px; margin-top:4px;">
            <button class="redit-save" data-id="${entry.id}">保存</button>
            <button class="redit-cancel">キャンセル</button>
          </div>
        </div>
      </div>`;
    }
    const gObjs = gids.map(id => getGroupById(id)).filter(Boolean);
    const groupBadge = gObjs.length
      ? gObjs.map(g => `<span class="rc-group"><span class="swatch" style="background:${safeColor(g.color)}"></span>${escapeHtml(g.name)}</span>`).join("")
      : `<span class="rc-group" style="color:#cfc3d6;">未設定</span>`;

    // 性・名・備考があればその順で組み立てる。性/名が無ければ従来のnameを使う(後方互換)
    const displayNameParts = (entry.sei || entry.mei)
      ? [entry.sei, entry.mei, entry.note].filter(s => s)
      : [entry.name, entry.note].filter(s => s);
    const displayName = displayNameParts.join("　");

    return `
    <div class="result-card compact">
      <div class="rc-head">
        <div class="rc-name-wrap">
          <span class="rc-name">${escapeHtml(displayName)}</span>${entry.nickname ? `<span class="rc-nick">（${escapeHtml(entry.nickname)}）</span>` : ""}
          <span class="rc-birth">${entry.birthDate}${entry.birthTime ? " " + entry.birthTime : ""}</span>
        </div>
        <div class="head-btns">
          <button class="pin-btn${getPinnedIds().includes(entry.id) ? " pinned" : ""}" data-id="${entry.id}" title="ピン留めして上に固定（最大5人）">${getPinnedIds().includes(entry.id) ? "⭐" : "☆"}</button>
          <button class="redit-btn" data-id="${entry.id}" title="編集">✎</button>
          <button class="del-btn" data-id="${entry.id}" title="削除">×</button>
        </div>
      </div>
      <div class="rc-groupline">${groupBadge}</div>
      <div class="rc-info">
        <span class="rc-no">No.${String(c.bunrui60).padStart(2,"0")}</span>
        ${kanGroupChipHtml(c)}
        ${charaChipHtml(c.bunrui60_charaName)}
      </div>
      <div class="rc-badges">
        ${railBadgeHtml(c.rail)}
        <span class="rc-fuku">福の神 ${c.fukuNoKami.label}</span>
      </div>
      <div class="rc-pillars">
        ${animalPillHtml("本質", c.honshitsu)}
        ${animalPillHtml("表面", c.hyomen)}
        ${animalPillHtml("意思", c.ishi)}
        ${animalPillHtml("時柱", c.jichu)}
      </div>
      ${resultDetailHtml(c, displayName)}
    </div>`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  // データ由来の色をstyle属性やスプレッドシートに使う前の安全チェック。
  // #rgb/#rrggbb形式以外(壊れたデータや紛れ込んだ文字列)はグレーに置き換える。
  function safeColor(c) {
    return /^#[0-9a-fA-F]{3,8}$/.test(String(c || "")) ? c : "#cccccc";
  }

  function renderResultsGroupFilterOptions() {
    const sel = document.getElementById("results-group-filter");
    const current = sel.value || "all";
    sel.innerHTML = `<option value="all">すべて表示</option><option value="none">グループ未設定のみ</option>` +
      groups.map(g => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join("");
    if ([...sel.options].some(o => o.value === current)) sel.value = current;
  }

  // ピン留めID一覧(最大5人)。旧設定selfResultId(単一)も自動で引き継ぐ
  const MAX_PINS = 5;
  function getPinnedIds() {
    if (appSettings && Array.isArray(appSettings.pinnedIds)) return appSettings.pinnedIds;
    return (appSettings && appSettings.selfResultId) ? [appSettings.selfResultId] : [];
  }

  function renderResults() {
    const list = document.getElementById("results-list");
    const actions = document.getElementById("results-actions");
    renderResultsGroupFilterOptions();

    const filterVal = document.getElementById("results-group-filter").value || "all";
    const term = (document.getElementById("results-search")?.value || "").trim().toLowerCase();
    let filtered = results;
    if (filterVal === "none") filtered = results.filter(r => resultGroupIds(r).length === 0);
    else if (filterVal !== "all") filtered = results.filter(r => resultGroupIds(r).includes(filterVal));
    if (term) filtered = filtered.filter(r => resultSearchText(r).includes(term));
    // ⭐でピン留めした人(最大5人)を常に上へ(ピンした順)
    const pinned = getPinnedIds();
    if (pinned.length) {
      const top = pinned.map(id => filtered.find(r => r.id === id)).filter(Boolean);
      if (top.length) filtered = [...top, ...filtered.filter(r => !pinned.includes(r.id))];
    }

    if (results.length === 0) {
      actions.style.display = "none";
      list.innerHTML = `<div class="empty-state">
        <div class="emoji">🌙</div>
        <p>まだ診断結果がありません。<br>「新規登録」または「まとめて登録」から<br>生年月日を入力してください。</p>
      </div>`;
      return;
    }
    actions.style.display = "flex";
    if (filtered.length === 0) {
      list.innerHTML = `<div class="empty-state">
        <div class="emoji">🔍</div>
        <p>${term ? "該当する人が見つかりません。" : "このグループには診断結果がありません。"}</p>
      </div>`;
      return;
    }
    // 編集中に再描画(他端末の更新やグループ変更の反映)が起きても、
    // 入力途中の内容が消えないように退避しておく
    let editDraft = null;
    if (editingResultId && list.querySelector(".edit-form")) {
      const f = list.querySelector(".edit-form");
      editDraft = {
        name: f.querySelector(".edit-name").value,
        nickname: f.querySelector(".edit-nickname").value,
        date: f.querySelector(".edit-date").value,
        time: f.querySelector(".edit-time").value,
        note: f.querySelector(".edit-note").value,
        groupIds: [...f.querySelectorAll(".edit-group:checked")].map(cb => cb.value)
      };
    }

    list.innerHTML = filtered.map(renderResultCard).join("");

    // 退避した入力途中の内容を新しいフォームに書き戻す
    if (editDraft && list.querySelector(".edit-form")) {
      const f = list.querySelector(".edit-form");
      f.querySelector(".edit-name").value = editDraft.name;
      f.querySelector(".edit-nickname").value = editDraft.nickname || "";
      f.querySelector(".edit-date").value = editDraft.date;
      f.querySelector(".edit-time").value = editDraft.time;
      f.querySelector(".edit-note").value = editDraft.note;
      f.querySelectorAll(".edit-group").forEach(cb => { cb.checked = editDraft.groupIds.includes(cb.value); });
    }

    list.querySelectorAll(".del-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const entry = results.find(r => r.id === btn.dataset.id);
        const nm = entry ? (((entry.sei || entry.mei) ? [entry.sei, entry.mei].filter(Boolean).join(" ") : entry.name) || "この人") : "この人";
        if (confirm(`「${nm}」の診断データを削除します。\nこの操作は取り消せません。本当に削除してよいですか？`)) deleteResult(btn.dataset.id);
      });
    });
    // 個別編集を開始
    list.querySelectorAll(".redit-btn").forEach(btn => {
      btn.addEventListener("click", () => { editingResultId = btn.dataset.id; renderResults(); });
    });
    // ⭐: ピン留め/解除(最大5人・設定はFirestoreに保存され、どの端末でも同じ)
    list.querySelectorAll(".pin-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const cur = getPinnedIds();
        let next;
        if (cur.includes(id)) {
          next = cur.filter(x => x !== id);
        } else {
          if (cur.length >= MAX_PINS) { showToast(`ピン留めは${MAX_PINS}人までです（⭐を1つ外してください）`); return; }
          next = [...cur, id];
        }
        appSettings = { ...appSettings, pinnedIds: next };
        renderResults();
        const fs = getFS();
        if (fs && fs.saveSettings) {
          try { await fs.saveSettings({ pinnedIds: next }); }
          catch (e) { console.error(e); showToast("設定の保存に失敗しました"); }
        }
        showToast(cur.includes(id) ? "ピン留めを外しました" : `ピン留めしました（${next.length}/${MAX_PINS}人）`);
      });
    });
    // 編集: キャンセル
    list.querySelectorAll(".redit-cancel").forEach(btn => {
      btn.addEventListener("click", () => { editingResultId = null; renderResults(); });
    });
    // 編集: 保存
    list.querySelectorAll(".redit-save").forEach(btn => {
      btn.addEventListener("click", async () => {
        const card = btn.closest(".result-card");
        const name = card.querySelector(".edit-name").value.trim();
        const nickname = card.querySelector(".edit-nickname").value.trim();
        const dateStr = card.querySelector(".edit-date").value;
        const timeStr = card.querySelector(".edit-time").value;
        const note = card.querySelector(".edit-note").value.trim();
        const groupIds = [...card.querySelectorAll(".edit-group:checked")].map(cb => cb.value);
        if (!parseFlexibleDate(dateStr)) { showToast("生年月日を正しい形式で入力してください（例：1990/06/24）"); return; }
        editingResultId = null;
        const ok = await editResult(btn.dataset.id, name, dateStr, timeStr, note, groupIds, nickname);
        if (ok) showToast("編集を保存しました");
      });
    });
  }


  function switchTab(tabName) {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tabName));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    document.getElementById("panel-" + tabName).classList.add("active");
  }

  // ---------- 一括入力パース ----------
  function parseBulkText(text) {
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    const rows = [];
    lines.forEach((line, i) => {
      const cols = line.split("\t");
      // タブが無い場合はスペース2個以上やカンマで分割するフォールバック
      let parts = cols.length >= 2 ? cols : line.split(/,|\s{2,}/);

      let sei, mei, dateStr, timeStr, noteStr;

      if (parts.length >= 5) {
        // 新形式: 性, 名, 生年月日, 時刻, 備考
        sei = (parts[0] || "").trim();
        mei = (parts[1] || "").trim();
        dateStr = (parts[2] || "").trim();
        timeStr = (parts[3] || "").trim();
        noteStr = (parts[4] || "").trim();
      } else if (parts.length === 4) {
        // 4列の場合: 性, 名, 生年月日, (時刻 または 備考)
        // 4列目が時刻として解釈できなければ備考として扱う
        sei = (parts[0] || "").trim();
        mei = (parts[1] || "").trim();
        dateStr = (parts[2] || "").trim();
        const fourthCol = (parts[3] || "").trim();
        if (parseFlexibleTime(fourthCol)) {
          timeStr = fourthCol;
          noteStr = "";
        } else {
          timeStr = "";
          noteStr = fourthCol;
        }
      } else {
        // 旧形式(後方互換): 名前(1列), 生年月日, 時間
        sei = (parts[0] || "").trim();
        mei = "";
        dateStr = (parts[1] || "").trim();
        timeStr = (parts[2] || "").trim();
        noteStr = "";
      }
      const name = [sei, mei].filter(s => s).join(" ");

      const date = parseFlexibleDate(dateStr);
      const time = parseFlexibleTime(timeStr);

      let error = null;
      if (!date) error = "生年月日の形式が読み取れません";
      else if (date.m < 1 || date.m > 12 || date.d < 1 || date.d > 31) error = "日付の値が不正です";

      rows.push({
        lineNo: i + 1, name, sei, mei, dateStr, timeStr, note: noteStr || "",
        y: date ? date.y : null, m: date ? date.m : null, d: date ? date.d : null,
        h: time ? time.h : null, mi: time ? time.mi : null,
        error
      });
    });
    return rows;
  }

  function renderBulkPreview(rows) {
    const container = document.getElementById("bulk-preview");
    const okCount = rows.filter(r => !r.error).length;
    const errCount = rows.length - okCount;

    let html = `<div class="hint" style="margin-top:14px;">
      ${rows.length}件中 <b>${okCount}件 読み取りOK</b>${errCount > 0 ? `／<span style="color:#e0648a;">${errCount}件 エラー</span>` : ""}
    </div>`;
    html += `<table class="preview-table"><thead><tr>
      <th>#</th><th>性</th><th>名</th><th>生年月日</th><th>時刻</th><th>備考</th><th>状態</th>
    </tr></thead><tbody>`;
    rows.forEach(r => {
      const rowClass = r.error ? "err-row" : "";
      html += `<tr class="${rowClass}">
        <td>${r.lineNo}</td>
        <td>${escapeHtml(r.sei || "—")}</td>
        <td>${escapeHtml(r.mei || "—")}</td>
        <td>${escapeHtml(r.dateStr || "—")}</td>
        <td>${escapeHtml(r.timeStr || "—")}</td>
        <td>${escapeHtml(r.note || "—")}</td>
        <td>${r.error ? "⚠️ " + r.error : "✓ OK"}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
  }

  // ---------- グループ列つき一括登録 ----------
  // 「名前 / 生年月日 / 時刻 / グループ名」のタブ区切りを解析する。
  // グループごとに振り分けて登録するための専用パーサ(既存のまとめて登録とは別物)。
  function parseGroupBulkText(text) {
    const lines = text.split("\n").map(l => l.replace(/\r$/, "")).filter(l => l.trim().length > 0);
    const rows = [];
    lines.forEach((line, i) => {
      const cols = line.split("\t");
      const parts = cols.length >= 2 ? cols : line.split(/,|\s{2,}/);
      const name = (parts[0] || "").trim();
      const dateStr = (parts[1] || "").trim();
      const timeStr = (parts[2] || "").trim();
      const groupName = (parts[3] || "").trim();

      const date = parseFlexibleDate(dateStr);
      // 見出し行や空行(名前も日付も無い)は静かにスキップする
      if (!name && !date) return;

      const time = parseFlexibleTime(timeStr);
      let error = null;
      if (!date) error = "生年月日が読み取れません";
      else if (date.m < 1 || date.m > 12 || date.d < 1 || date.d > 31) error = "日付の値が不正です";
      else if (!groupName) error = "グループ名がありません";

      rows.push({
        lineNo: i + 1, name, dateStr, timeStr, groupName,
        y: date ? date.y : null, m: date ? date.m : null, d: date ? date.d : null,
        h: time ? time.h : null, mi: time ? time.mi : null,
        error
      });
    });
    return rows;
  }

  function renderGroupBulkPreview(rows) {
    const container = document.getElementById("gbulk-preview");
    const valid = rows.filter(r => !r.error);
    const errCount = rows.length - valid.length;
    const existingNames = new Set(groups.map(g => g.name));
    const groupNames = [...new Set(valid.map(r => r.groupName))];
    const newGroups = groupNames.filter(n => !existingNames.has(n));

    let html = `<div class="hint" style="margin-top:14px;">
      ${rows.length}件中 <b>${valid.length}件 登録OK</b>${errCount > 0 ? `／<span style="color:#e0648a;">${errCount}件 エラー</span>` : ""}<br>
      グループ ${groupNames.length}種類${newGroups.length > 0 ? `（うち新規作成 <b>${newGroups.length}</b>：${newGroups.map(escapeHtml).join("、")}）` : ""}
    </div>`;
    html += `<table class="preview-table"><thead><tr>
      <th>#</th><th>名前</th><th>生年月日</th><th>時刻</th><th>グループ</th><th>状態</th>
    </tr></thead><tbody>`;
    rows.forEach(r => {
      const rowClass = r.error ? "err-row" : "";
      html += `<tr class="${rowClass}">
        <td>${r.lineNo}</td>
        <td>${escapeHtml(r.name || "—")}</td>
        <td>${escapeHtml(r.dateStr || "—")}</td>
        <td>${escapeHtml(r.timeStr || "—")}</td>
        <td>${escapeHtml(r.groupName || "—")}</td>
        <td>${r.error ? "⚠️ " + r.error : "✓ OK"}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
  }

  async function confirmGroupBulkImport(rows) {
    const valid = rows.filter(r => !r.error);
    if (valid.length === 0) { showToast("登録できる行がありません"); return false; }

    // グループ名 -> ID の対応表。既存グループは名前で照合し、無いものだけ新規作成する。
    const nameToId = {};
    groups.forEach(g => { if (!(g.name in nameToId)) nameToId[g.name] = g.id; });
    const neededNames = [];
    valid.forEach(r => {
      if (!nameToId[r.groupName] && neededNames.indexOf(r.groupName) === -1) neededNames.push(r.groupName);
    });
    for (const gname of neededNames) {
      const g = await createGroup(gname);
      if (g) nameToId[gname] = g.id;
    }

    // 全件をまとめて1回で保存する(1件ずつawaitしない)。
    // _createdAtを1msずつずらして、入力順(古い→新しい)が保たれるようにする。
    const base = Date.now();
    const entries = valid.map((r, i) =>
      makeResultEntry(r.name, r.y, r.m, r.d, r.h, r.mi, nameToId[r.groupName] || null, "", "", "", base + i));
    return await addResultsBulk(entries);
  }

  // ---------- 出力用の共通行データ（CSV出力・スプレッドシート同期で共用） ----------
  const RESULT_HEADERS = ["性","名","ニックネーム","備考","グループ名","生年月日","時刻","レール","レール(本当の呼び方)","福の神No","福の神No(1つめ)","福の神No(2つめ)","福の神No(3つめ)","60分類No","60分類干支","干グループ","60分類キャラクター名","本質グループ","本質(動物)","本質(十二運)","表面グループ","表面(動物)","表面(十二運)","意思グループ","意思(動物)","意思(十二運)","時柱(動物)","時柱(十二運)"];
  // 色付けに使う列位置は列名から求める(列を増減してもズレないように)
  const COL = {
    group: RESULT_HEADERS.indexOf("グループ名"),
    rail: RESULT_HEADERS.indexOf("レール"),
    honshitsu: RESULT_HEADERS.indexOf("本質グループ"),
    hyomen: RESULT_HEADERS.indexOf("表面グループ"),
    ishi: RESULT_HEADERS.indexOf("意思グループ"),
    jichu: RESULT_HEADERS.indexOf("時柱(動物)")
  };

  function resultToRow(r) {
    const c = r.calc;
    const gnames = resultGroupIds(r).map(id => getGroupById(id)).filter(Boolean).map(g => g.name);
    const seiOut = r.sei || r.name || "";
    const meiOut = r.mei || "";
    return [
      seiOut, meiOut, r.nickname || "", r.note || "", gnames.length ? gnames.join("・") : "（未設定）", r.birthDate, r.birthTime,
      c.rail.rail, c.rail.tsuhensei,
      c.fukuNoKami.label, c.fukuNoKami.n1, c.fukuNoKami.n2, c.fukuNoKami.n3,
      c.bunrui60, c.bunrui60_gz, c.bunrui60_kanGroup, c.bunrui60_charaName,
      GROUP_LABEL[c.honshitsu.group], c.honshitsu.animal, c.honshitsu.juniun,
      GROUP_LABEL[c.hyomen.group], c.hyomen.animal, c.hyomen.juniun,
      GROUP_LABEL[c.ishi.group], c.ishi.animal, c.ishi.juniun,
      c.jichu ? c.jichu.animal : "", c.jichu ? c.jichu.juniun : ""
    ];
  }

  // ---------- CSV出力 ----------
  function exportCsv() {
    if (results.length === 0) { showToast("診断結果がありません"); return; }
    const lines = [RESULT_HEADERS.join(",")];
    // resultsは新しい順なので、CSVでは登録順(古い順)に並べる(スプレッドシートと揃える)
    results.slice().reverse().forEach(r => {
      const row = resultToRow(r).map(v => `"${String(v).replace(/"/g,'""')}"`);
      lines.push(row.join(","));
    });
    const csv = "\uFEFF" + lines.join("\n"); // BOM付きでExcelの文字化け防止
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MetaQ四柱推命診断結果_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("CSVを出力しました");
  }

  // ===================================================================
  // Googleスプレッドシート連携
  // グループ管理タブで設定したApps Script WebアプリのURLへ診断結果の
  // 全件スナップショットを送信し、GAS側がグループごとのシートに書き込む。
  // URLはFirestoreのユーザー設定(users/{uid}/settings/app)に保存され、
  // どの端末からログインしても同じ設定が使われる。
  // ===================================================================

  // spreadsheet-sync.gs の TOKEN と同じ文字列にすること
  const SHEET_SYNC_TOKEN = "metaq-uranai-sync";

  let appSettings = {};       // Firestoreの設定購読で更新される
  let sheetSyncTimer = null;  // 連続操作をまとめるためのデバウンスタイマー
  let sheetSyncing = false;
  let currentUid = null;      // ログイン中のFirebaseユーザーID(GAS側のアカウント照合に使う)

  window.addEventListener("metaq:auth-ready", (e) => {
    currentUid = (e.detail && e.detail.uid) || null;
  });

  window.addEventListener("metaq:settings-updated", (e) => {
    appSettings = e.detail.settings || {};
    const input = document.getElementById("sheet-url-input");
    if (input && document.activeElement !== input) input.value = appSettings.sheetUrl || "";
    updateSheetSyncStatusIdle();
    // 並び順設定(groupOrder)が届いたらグループ表示に反映する
    sortGroupsInPlace();
    refreshAllGroupUI();
    renderResults();
  });

  function getSheetUrl() {
    return (appSettings.sheetUrl || "").trim();
  }

  function setSheetSyncStatus(text) {
    const el = document.getElementById("sheet-sync-status");
    if (el) el.textContent = text;
  }

  function updateSheetSyncStatusIdle() {
    setSheetSyncStatus(getSheetUrl()
      ? "✓ 連携設定済み。診断結果を登録・変更すると自動でシートに反映されます。"
      : "未設定です。設定するとグループごとのシートに一覧が自動で書き込まれます。");
  }

  // レール名 -> パステルカラー(RAIL_ORDERから逆引き)
  const RAIL_COLOR = {};
  RAIL_ORDER.forEach(r => { RAIL_COLOR[r.rail] = r.color; });

  // 1行分のセル背景色を作る(アプリと同じ配色をスプレッドシートにも反映する)
  // base: 縞模様用の地の色。グループ名・レール・本質/表面/意思・時柱のセルに色を付ける
  // sheetColor: 書き込み先シートのグループ色。複数グループ所属の人でも、
  // そのシートのグループの色で塗る(先頭グループの色だと文脈と食い違うため)
  function resultRowColors(r, base, sheetColor) {
    const c = r.calc;
    const bg = Array(RESULT_HEADERS.length).fill(base);
    const g = getGroupById(resultGroupIds(r)[0]);
    const gc = sheetColor || (g && g.color);
    if (gc) bg[COL.group] = safeColor(gc);
    const railColor = RAIL_COLOR[c.rail.rail];
    if (railColor) { bg[COL.rail] = railColor; bg[COL.rail + 1] = railColor; }
    bg[COL.honshitsu] = bg[COL.honshitsu + 1] = PIE_COLORS[c.honshitsu.group];
    bg[COL.hyomen] = bg[COL.hyomen + 1] = PIE_COLORS[c.hyomen.group];
    bg[COL.ishi] = bg[COL.ishi + 1] = PIE_COLORS[c.ishi.group];
    if (c.jichu) bg[COL.jichu] = PIE_COLORS[c.jichu.group];
    return bg;
  }

  // シート名に使えない文字を除去し、空なら代替名を返す
  function sanitizeSheetName(name) {
    let s = String(name || "").replace(/[\[\]\*\/\\\?:：]/g, " ").replace(/\s+/g, " ").trim();
    if (!s) s = "名称未設定";
    return s.slice(0, 90);
  }

  function buildSheetPayload() {
    const usedNames = {};
    const uniqueName = (base) => {
      let n = base, i = 2;
      while (usedNames[n]) n = `${base}(${i++})`;
      usedNames[n] = true;
      return n;
    };
    const stripe = (i) => (i % 2 === 1) ? "#fdfaff" : "#ffffff";

    // 1シート分を「見出し行を含む、そのまま書き込める完成形」として組み立てる。
    // 値(values)・背景色(backgrounds)・太字(fontWeights)を同じ行列サイズで作り、
    // GAS(spreadsheet-sync.gs)は中身を解釈せず貼り付けるだけにする。
    // → 表示項目や配色を変えたいときは、このアプリを直すだけで反映される
    //   (GAS側は汎用なので貼り替え不要)。
    function makeSheet(name, tabColor, members) {
      const tc = tabColor ? safeColor(tabColor) : null;
      const values = [RESULT_HEADERS.slice()];
      const backgrounds = [RESULT_HEADERS.map(() => tc || "#d9b3ff")];
      const fontWeights = [RESULT_HEADERS.map(() => "bold")];
      members.forEach((r, i) => {
        values.push(resultToRow(r));
        backgrounds.push(resultRowColors(r, stripe(i), tc));
        fontWeights.push(RESULT_HEADERS.map(() => "normal"));
      });
      return {
        name: uniqueName(sanitizeSheetName(name)),
        tabColor: tc,
        frozenRows: 1,
        autoResize: true,
        values, backgrounds, fontWeights
      };
    }

    // resultsは新しい順なので、シートでは登録順(古い順)に並べ替える。
    // 複数グループに属する人は、所属する各グループのシートに登場する。
    const sheets = groups.map(g =>
      makeSheet(g.name, g.color, results.filter(r => resultGroupIds(r).includes(g.id)).slice().reverse())
    );
    const ungrouped = results.filter(r => resultGroupIds(r).length === 0).slice().reverse();
    if (ungrouped.length > 0) {
      sheets.push(makeSheet("グループ未設定", "#cccccc", ungrouped));
    }
    // uid: GAS側で「このスプレッドシートの持ち主のアカウントか」を照合するために送る。
    // 別アカウントの同期で他人のシートが消されるのを防ぐ。
    return { token: SHEET_SYNC_TOKEN, uid: currentUid, sheets };
  }

  // データ変更後に呼ぶ。連続操作(一括登録など)は1回の送信にまとめる
  function scheduleSheetSync() {
    if (!getSheetUrl()) return;
    if (sheetSyncTimer) clearTimeout(sheetSyncTimer);
    sheetSyncTimer = setTimeout(() => {
      sheetSyncTimer = null;
      syncToSheets(false);
    }, 2500);
  }

  async function syncToSheets(manual) {
    const url = getSheetUrl();
    if (!url) {
      if (manual) showToast("先にWebアプリのURLを設定してください");
      return;
    }
    // Firestoreからの初回読み込みが終わる前に同期すると、空のデータで
    // シートを上書き(=全消去)してしまうため、読み込み完了まで待つ
    if (!dataReady) {
      if (manual) showToast("データを読み込み中です。少し待ってからもう一度お試しください");
      scheduleSheetSync();
      return;
    }
    if (sheetSyncing) { scheduleSheetSync(); return; }
    sheetSyncing = true;
    setSheetSyncStatus("同期中...");
    try {
      // Content-Typeをtext/plainにするとCORSのプリフライトが発生せず、
      // Apps ScriptのWebアプリにブラウザから直接POSTできる
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(buildSheetPayload())
      });
      let data = null;
      try { data = await res.json(); } catch (e) {}
      if (!res.ok || !data || !data.ok) {
        throw new Error((data && data.error) || `HTTP ${res.status}`);
      }
      const t = new Date();
      const hhmm = `${t.getHours()}:${String(t.getMinutes()).padStart(2, "0")}`;
      if (data.skipped && data.skipped.length > 0) {
        // 手作りの中身ありシートと名前が被って書き込めなかったグループがある
        setSheetSyncStatus(`⚠️ 同期しましたが、次のシートは手書きの内容があるため書き込めませんでした：${data.skipped.join("、")}（グループ名を変えるか、そのシートを空にしてください）`);
        if (manual) showToast(`一部書き込めませんでした：${data.skipped.join("、")}`);
      } else {
        setSheetSyncStatus(`✓ スプレッドシートに同期済み（${hhmm}）`);
        if (manual) showToast("スプレッドシートに同期しました");
      }
    } catch (e) {
      console.error("sheet sync failed:", e);
      if (String(e.message).includes("different-account")) {
        setSheetSyncStatus("⚠️ このスプレッドシートは別のアカウントと連携されています。アカウントごとに別のスプレッドシートを用意してください。");
        if (manual) showToast("このスプレッドシートは別のアカウント専用です");
      } else {
        setSheetSyncStatus("⚠️ 同期に失敗しました。URLとデプロイ設定(アクセス:全員)を確認してください。");
        if (manual) showToast("スプレッドシートへの同期に失敗しました");
      }
    } finally {
      sheetSyncing = false;
    }
  }

  // ===================================================================
  // グループ管理 UI
  // ===================================================================

  // isSelected(id)->bool、onToggle(id, isNowSelected)。multi=trueで複数選択可。
  function renderGroupSelectChips(containerId, isSelected, onToggle, multi) {
    const container = document.getElementById(containerId);
    if (groups.length === 0) {
      container.innerHTML = `<div class="hint" style="color:#e0648a;">グループがまだありません。「グループ管理」タブから作成してください。</div>`;
      return;
    }
    container.innerHTML = groups.map(g => `
      <div class="chip ${isSelected(g.id) ? "selected" : ""}" data-group-id="${g.id}">
        <span class="swatch" style="background:${safeColor(g.color)}"></span>${escapeHtml(g.name)}
      </div>
    `).join("");
    container.querySelectorAll(".chip").forEach(chip => {
      chip.addEventListener("click", () => {
        if (multi) {
          const on = !chip.classList.contains("selected");
          chip.classList.toggle("selected", on);
          onToggle(chip.dataset.groupId, on);
        } else {
          container.querySelectorAll(".chip").forEach(c => c.classList.remove("selected"));
          chip.classList.add("selected");
          onToggle(chip.dataset.groupId, true);
        }
      });
    });
  }

  let selectedSingleGroupIds = []; // 新規登録: 複数グループ選択可
  let selectedBulkGroupId = null;

  function refreshAllGroupUI() {
    renderGroupSelectChips("single-group-chips",
      (id) => selectedSingleGroupIds.includes(id),
      (id, on) => {
        if (on) selectedSingleGroupIds = [...new Set([...selectedSingleGroupIds, id])];
        else selectedSingleGroupIds = selectedSingleGroupIds.filter(x => x !== id);
      }, true);
    renderGroupSelectChips("bulk-group-chips",
      (id) => id === selectedBulkGroupId,
      (id) => { selectedBulkGroupId = id; }, false);
    renderGroupManageList();
    renderAggregateGroupSelect();
  }

  let editingGroupId = null; // 編集中のグループID(インライン編集フォームを表示)

  function renderGroupManageList() {
    const list = document.getElementById("group-list");
    if (groups.length === 0) {
      list.innerHTML = `<div class="empty-state" style="padding:30px 10px;">
        <div class="emoji">📂</div>
        <p>まだグループがありません。<br>上のフォームから作成してください。</p>
      </div>`;
      return;
    }
    // 編集中に再描画が起きても入力途中の内容が消えないように退避しておく
    let gEditDraft = null;
    if (editingGroupId && list.querySelector(".group-item.editing")) {
      const item = list.querySelector(".group-item.editing");
      const sel = item.querySelector(".color-picker .swatch-btn.selected");
      gEditDraft = { name: item.querySelector(".gedit-name").value, color: sel ? sel.dataset.color : null };
    }

    list.innerHTML = groups.map((g, idx) => {
      const count = results.filter(r => resultGroupIds(r).includes(g.id)).length;
      if (g.id === editingGroupId) {
        const selColor = (gEditDraft && gEditDraft.color) || g.color;
        const editName = gEditDraft ? gEditDraft.name : g.name;
        const swatches = GROUP_COLOR_PALETTE.map(c =>
          `<button class="swatch-btn ${c === selColor ? "selected" : ""}" data-color="${c}" style="background:${c}" title="${c}"></button>`
        ).join("");
        return `
        <div class="group-item editing">
          <div style="flex:1; display:flex; flex-direction:column; gap:10px;">
            <input type="text" class="gedit-name" value="${escapeHtml(editName)}" placeholder="グループ名">
            <div class="color-picker">${swatches}</div>
            <div style="display:flex; gap:8px;">
              <button class="gedit-save" data-gid="${g.id}">保存</button>
              <button class="gedit-cancel">キャンセル</button>
            </div>
          </div>
        </div>`;
      }
      return `
      <div class="group-item">
        <div class="greorder">
          <button class="gup-btn" data-gid="${g.id}" ${idx === 0 ? "disabled" : ""} title="上へ">▲</button>
          <button class="gdown-btn" data-gid="${g.id}" ${idx === groups.length - 1 ? "disabled" : ""} title="下へ">▼</button>
        </div>
        <span class="swatch" style="background:${safeColor(g.color)}"></span>
        <span class="gname">${escapeHtml(g.name)}</span>
        <span class="gcount">${count}人</span>
        <button class="gedit-btn" data-gid="${g.id}" title="編集">✎</button>
        <button class="gdel-btn" data-gid="${g.id}" title="削除">×</button>
      </div>`;
    }).join("");

    // 並べ替え
    list.querySelectorAll(".gup-btn").forEach(b => b.addEventListener("click", () => moveGroup(b.dataset.gid, -1)));
    list.querySelectorAll(".gdown-btn").forEach(b => b.addEventListener("click", () => moveGroup(b.dataset.gid, 1)));

    // 編集を開始
    list.querySelectorAll(".gedit-btn").forEach(b => b.addEventListener("click", () => {
      editingGroupId = b.dataset.gid;
      renderGroupManageList();
    }));
    // 編集中: 色選択
    list.querySelectorAll(".color-picker .swatch-btn").forEach(b => b.addEventListener("click", () => {
      list.querySelectorAll(".color-picker .swatch-btn").forEach(x => x.classList.remove("selected"));
      b.classList.add("selected");
    }));
    // 編集: キャンセル
    list.querySelectorAll(".gedit-cancel").forEach(b => b.addEventListener("click", () => {
      editingGroupId = null;
      renderGroupManageList();
    }));
    // 編集: 保存
    list.querySelectorAll(".gedit-save").forEach(b => b.addEventListener("click", async () => {
      const item = b.closest(".group-item");
      const name = item.querySelector(".gedit-name").value.trim();
      const sel = item.querySelector(".color-picker .swatch-btn.selected");
      const color = sel ? sel.dataset.color : null;
      if (!name) { showToast("グループ名を入力してください"); return; }
      const gid = b.dataset.gid;
      editingGroupId = null;
      await editGroup(gid, name, color);
      showToast("グループを更新しました");
    }));

    // 削除
    list.querySelectorAll(".gdel-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const g = getGroupById(btn.dataset.gid);
        const count = results.filter(r => resultGroupIds(r).includes(btn.dataset.gid)).length;
        const msg = count > 0
          ? `「${g.name}」を削除します。このグループの${count}人からこのグループが外れます（他のグループには残ります）。よろしいですか？`
          : `「${g.name}」を削除します。よろしいですか？`;
        if (confirm(msg)) {
          await deleteGroupById(btn.dataset.gid);
          showToast("グループを削除しました");
        }
      });
    });
  }

  function renderAggregateGroupSelect() {
    const sel = document.getElementById("aggregate-group-select");
    const current = sel.value;
    if (groups.length === 0) {
      sel.innerHTML = `<option value="">グループがありません</option>`;
      renderAggregateContent(null);
      return;
    }
    sel.innerHTML = groups.map(g => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join("");
    if ([...sel.options].some(o => o.value === current)) sel.value = current;
    renderAggregateContent(sel.value);
  }

  // ---------- 円グラフ生成（SVG, ライブラリ不要） ----------
  const PIE_COLORS = { earth: "#8fd4ff", moon: "#ffe3a8", sun: "#ff9ec7" };

  function buildPieSvg(counts) {
    // counts: {earth, moon, sun} の人数
    const total = counts.earth + counts.moon + counts.sun;
    const order = ["earth", "moon", "sun"];
    const cx = 80, cy = 80, r = 70;

    if (total === 0) {
      return `<svg viewBox="0 0 160 160"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#f3eef7"/></svg>`;
    }

    let startAngle = -90; // 12時方向から開始
    let paths = "";
    order.forEach(key => {
      const val = counts[key];
      if (val <= 0) return;
      const angle = (val / total) * 360;
      const endAngle = startAngle + angle;

      if (val === total) {
        // 100%は円弧が描けないため真円で描画
        paths += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${PIE_COLORS[key]}"/>`;
      } else {
        const x1 = cx + r * Math.cos(startAngle * Math.PI / 180);
        const y1 = cy + r * Math.sin(startAngle * Math.PI / 180);
        const x2 = cx + r * Math.cos(endAngle * Math.PI / 180);
        const y2 = cy + r * Math.sin(endAngle * Math.PI / 180);
        const largeArc = angle > 180 ? 1 : 0;
        paths += `<path d="M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${largeArc} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${PIE_COLORS[key]}"/>`;
      }
      startAngle = endAngle;
    });

    return `<svg viewBox="0 0 160 160">${paths}<circle cx="${cx}" cy="${cy}" r="34" fill="#fff"/></svg>`;
  }

  function calcGroupCounts(memberResults, pillarKey) {
    const counts = { earth: 0, moon: 0, sun: 0 };
    memberResults.forEach(r => {
      const group = r.calc[pillarKey].group;
      counts[group]++;
    });
    return counts;
  }

  // 12動物別の人数分布を集計(本質/表面/意思いずれかについて)
  function calcAnimalCounts(memberResults, pillarKey) {
    const counts = {};
    ANIMAL_ORDER.forEach(a => { counts[a.animal] = 0; });
    memberResults.forEach(r => {
      const animal = r.calc[pillarKey].animal;
      if (counts[animal] !== undefined) counts[animal]++;
    });
    return counts;
  }

  function animalRankingHtml(title, pillarKey, memberResults) {
    const counts = calcAnimalCounts(memberResults, pillarKey);
    const total = memberResults.length;
    const ranking = ANIMAL_ORDER
      .map(a => ({ animal: a.animal, group: a.group, count: counts[a.animal] }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);

    if (ranking.length === 0) {
      return `<div class="fuku-rank-card"><h3>${title}</h3><div class="hint">データがありません</div></div>`;
    }
    const maxCount = ranking[0].count;
    const rows = ranking.map(item => {
      const pct = Math.round((item.count / total) * 100);
      const isTop = item.count === maxCount;
      return `
        <div class="fuku-rank-row ${isTop ? "top" : ""}">
          <span class="frank-no animal-label">${isTop ? "👑" : ""}<span class="animal-dot" style="background:${PIE_COLORS[item.group]}"></span>${escapeHtml(item.animal)}</span>
          <div class="frank-bar-track">
            <div class="frank-bar-fill" style="width:${pct}%; background:${PIE_COLORS[item.group]};"></div>
          </div>
          <span class="frank-pct">${item.count}人 (${pct}%)</span>
        </div>`;
    }).join("");
    return `
    <div class="fuku-rank-card">
      <h3>${title}</h3>
      ${rows}
    </div>`;
  }

  // レール(マイペース/マイウェイ/ピース/ロマン...)の人数分布を集計
  function calcRailCounts(memberResults) {
    const counts = {};
    RAIL_ORDER.forEach(r => { counts[r.rail] = 0; });
    memberResults.forEach(r => {
      const rail = r.calc.rail.rail;
      if (counts[rail] !== undefined) counts[rail]++;
    });
    return counts;
  }

  function railRankingHtml(memberResults) {
    const counts = calcRailCounts(memberResults);
    const total = memberResults.length;
    const ranking = RAIL_ORDER
      .map(r => ({ rail: r.rail, color: r.color, count: counts[r.rail] }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);

    if (ranking.length === 0) {
      return `<div class="fuku-rank-card"><h3>レール</h3><div class="hint">データがありません</div></div>`;
    }
    const maxCount = ranking[0].count;
    const rows = ranking.map(item => {
      const pct = Math.round((item.count / total) * 100);
      const isTop = item.count === maxCount;
      return `
        <div class="fuku-rank-row ${isTop ? "top" : ""}">
          <span class="frank-no animal-label">${isTop ? "👑" : ""}<span class="animal-dot" style="background:${item.color}"></span>${escapeHtml(item.rail)}</span>
          <div class="frank-bar-track">
            <div class="frank-bar-fill" style="width:${pct}%; background:${item.color};"></div>
          </div>
          <span class="frank-pct">${item.count}人 (${pct}%)</span>
        </div>`;
    }).join("");
    return `
    <div class="fuku-rank-card">
      <h3>レール</h3>
      ${rows}
    </div>`;
  }

  // 福の神No.の各桁(n1/n2/n3)について、0-9の出現回数を集計し、多い順に並べる
  function calcFukuNoKamiRanking(memberResults, key) {
    const counts = Array(10).fill(0); // index 0-9
    memberResults.forEach(r => {
      const val = r.calc.fukuNoKami[key];
      counts[val]++;
    });
    const total = memberResults.length;
    const ranking = counts
      .map((count, num) => ({ num, count }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
    return { ranking, total };
  }

  function fukuRankingHtml(title, key, memberResults) {
    const { ranking, total } = calcFukuNoKamiRanking(memberResults, key);
    if (ranking.length === 0) {
      return `<div class="fuku-rank-card"><h3>${title}</h3><div class="hint">データがありません</div></div>`;
    }
    const maxCount = ranking[0].count;
    const rows = ranking.map((item, idx) => {
      const pct = Math.round((item.count / total) * 100);
      const isTop = item.count === maxCount;
      return `
        <div class="fuku-rank-row ${isTop ? "top" : ""}">
          <span class="frank-no">${isTop ? "👑" : ""}${item.num}</span>
          <div class="frank-bar-track">
            <div class="frank-bar-fill" style="width:${pct}%;"></div>
          </div>
          <span class="frank-pct">${item.count}人 (${pct}%)</span>
        </div>`;
    }).join("");
    return `
    <div class="fuku-rank-card">
      <h3>${title}</h3>
      ${rows}
    </div>`;
  }

  function pieCardHtml(title, counts) {
    const total = counts.earth + counts.moon + counts.sun;
    const pct = (n) => total > 0 ? Math.round((n / total) * 100) : 0;
    return `
    <div class="pie-card">
      <h3>${title}</h3>
      ${buildPieSvg(counts)}
      <div class="pie-legend">
        <span class="litem"><span class="dot" style="background:${PIE_COLORS.earth}"></span>地球 ${pct(counts.earth)}%</span>
        <span class="litem"><span class="dot" style="background:${PIE_COLORS.moon}"></span>月 ${pct(counts.moon)}%</span>
        <span class="litem"><span class="dot" style="background:${PIE_COLORS.sun}"></span>太陽 ${pct(counts.sun)}%</span>
      </div>
    </div>`;
  }

  function renderAggregateContent(groupId) {
    const container = document.getElementById("aggregate-content");
    if (!groupId) {
      container.innerHTML = `<div class="empty-state">
        <div class="emoji">📊</div>
        <p>「グループ管理」タブでグループを作成すると<br>ここに集計が表示されます。</p>
      </div>`;
      return;
    }
    const members = results.filter(r => resultGroupIds(r).includes(groupId));
    if (members.length === 0) {
      container.innerHTML = `<div class="empty-state">
        <div class="emoji">🌙</div>
        <p>このグループにはまだ診断結果がありません。</p>
      </div>`;
      return;
    }
    container.innerHTML = `<div class="agg-count">このグループ：${members.length}人で集計</div>` + aggregateBodyHtml(members);
  }

  // 集計本体(円グラフ＋動物・レール・福の神ランキング)を組み立てる。
  // グループ集計と図書館のジャンル集計で共用する。members は .calc を持つ配列。
  function aggregateBodyHtml(members) {
    const honshitsuCounts = calcGroupCounts(members, "honshitsu");
    const hyomenCounts = calcGroupCounts(members, "hyomen");
    const ishiCounts = calcGroupCounts(members, "ishi");
    return `
      <div class="pie-grid">
        ${pieCardHtml("本質グループ", honshitsuCounts)}
        ${pieCardHtml("表面グループ", hyomenCounts)}
        ${pieCardHtml("意思グループ", ishiCounts)}
      </div>
      <div class="card" style="margin-top:18px;">
        <h2>🐾 動物別 集計</h2>
        <div class="hint" style="margin-bottom:14px;">本質・表面・意思それぞれで、12動物の分布を多い順に表示します</div>
        ${animalRankingHtml("本質（動物別）", "honshitsu", members)}
        ${animalRankingHtml("表面（動物別）", "hyomen", members)}
        ${animalRankingHtml("意思（動物別）", "ishi", members)}
      </div>
      <div class="card" style="margin-top:18px;">
        <h2>🚃 レール 集計</h2>
        <div class="hint" style="margin-bottom:14px;">多いレールを順に表示します</div>
        ${railRankingHtml(members)}
      </div>
      <div class="card" style="margin-top:18px;">
        <h2>🍀 福の神No. 集計</h2>
        <div class="hint" style="margin-bottom:14px;">1つめ・2つめ・3つめの数字ごとに、多い番号を表示します</div>
        ${fukuRankingHtml("1つめの数字", "n1", members)}
        ${fukuRankingHtml("2つめの数字", "n2", members)}
        ${fukuRankingHtml("3つめの数字", "n3", members)}
      </div>
    `;
  }


  // ===================================================================
  // 診断図書館（管理者のみ）
  // 誰もが知っている有名人・スポーツ選手・偉人の診断一覧。ジャンル別に表示する。
  // これはアプリ内蔵の参照データ(Firestoreの個人データとは別)で、全員同じ内容。
  // 管理者(orn.pomme@gmail.com)でログインしたときだけ「図書館」タブが表示される。
  // 生年月日は公開情報に基づく。出生時刻は不明のため未使用。
  // ===================================================================
  const ADMIN_EMAIL = "orn.pomme@gmail.com";

  // 各エントリ: { genre, name, date, desc }
  // date は "YYYY/MM/DD" のとき診断を計算。年のみ・紀元前・「頃」など不確かなものは
  // 生没年をそのまま表示し、診断は省略する。
  // 60タイプパーソナリティ(のりぴさん提供・一字一句原文どおり)。noは60分類No.(=日柱干支の通し番号)と同じ
  const SIXTY_TYPES = [
    {"no": 1, "code": "1C", "kanshi": "甲子", "letter": "C", "tsuhensei": "印星", "omoteura": "大人の振りした子供", "serifu": "すべてわたしが中心です", "tokucho": "挫折に弱く天然ボケだけどプライドの高いポジティブな人", "hitokoto": "自分が大好きな子供", "naze": "甲子の日生まれ。地支「子」は12支の1番目なので数字は1。日干「甲」は木、地支「子」は水で、水は日干を生む関係（印星）なので英字はC（印星）。"},
    {"no": 2, "code": "2S", "kanshi": "乙丑", "letter": "S", "tsuhensei": "財星", "omoteura": "どMのふりしたどS", "serifu": "すべてわたしが決めます", "tokucho": "生まれながらのネガティブだけど協調性のある控えめな温厚な人", "hitokoto": "いつも眠たいドS", "naze": "乙丑の日生まれ。地支「丑」は12支の2番目なので数字は2。日干「乙」は木、地支「丑」は土で、土は日干が剋（こく）す関係（財星）なので英字はS（財星）。"},
    {"no": 3, "code": "3C", "kanshi": "丙寅", "letter": "C", "tsuhensei": "印星", "omoteura": "大人の振りした子供", "serifu": "すべてわたしが中心です", "tokucho": "表舞台に立つわたしが主役な一言多いおしゃれさん", "hitokoto": "気難しいとっつきにくい子供", "naze": "丙寅の日生まれ。地支「寅」は12支の3番目なので数字は3。日干「丙」は火、地支「寅」は木で、木は日干を生む関係（印星）なので英字はC（印星）。"},
    {"no": 4, "code": "4C", "kanshi": "丁卯", "letter": "C", "tsuhensei": "印星", "omoteura": "大人の振りした子供", "serifu": "すべてわたしが中心です", "tokucho": "控えめだけど目立って自分が輝くおしゃれさん", "hitokoto": "目立つ人の後ろで輝きたい子供", "naze": "丁卯の日生まれ。地支「卯」は12支の4番目なので数字は4。日干「丁」は火、地支「卯」は木で、木は日干を生む関係（印星）なので英字はC（印星）。"},
    {"no": 5, "code": "5P", "kanshi": "戊辰", "letter": "P", "tsuhensei": "比劫星", "omoteura": "コミュニケーション苦手なふりしたひとたらしな自己中", "serifu": "すべてわたしの気分です", "tokucho": "頑固でずぼらだけど包容力のある優しい人", "hitokoto": "優しい顔した切れたらめちゃ怖い自己中", "naze": "戊辰の日生まれ。地支「辰」は12支の5番目なので数字は5。日干「戊」は土、地支「辰」は土で、土は日干と同じ五行（比劫星）なので英字はP（比劫星）。"},
    {"no": 6, "code": "6C", "kanshi": "己巳", "letter": "C", "tsuhensei": "印星", "omoteura": "大人の振りした子供", "serifu": "すべてわたしが中心です", "tokucho": "妄想しがちでしつこいけど穏やかでフレンドリーな優しい人", "hitokoto": "好きなことには貪欲な子供", "naze": "己巳の日生まれ。地支「巳」は12支の6番目なので数字は6。日干「己」は土、地支「巳」は火で、火は日干を生む関係（印星）なので英字はC（印星）。"},
    {"no": 7, "code": "7M", "kanshi": "庚午", "letter": "M", "tsuhensei": "官星", "omoteura": "どSのふりしたどM", "serifu": "すべてあなたが決めてください", "tokucho": "白黒、せっかち、頑固な頭の切れるチャレンジャー", "hitokoto": "なんでも知ってますって顔したドМ", "naze": "庚午の日生まれ。地支「午」は12支の7番目なので数字は7。日干「庚」は金、地支「午」は火で、火は日干を剋（こく）す関係（官星）なので英字はM（官星）。"},
    {"no": 8, "code": "8C", "kanshi": "辛未", "letter": "C", "tsuhensei": "印星", "omoteura": "大人の振りした子供", "serifu": "すべてわたしが中心です", "tokucho": "白黒、せっかち、辛口のくせに繊細で美意識と責任感で生きてる人", "hitokoto": "１０００倍速な子供", "naze": "辛未の日生まれ。地支「未」は12支の8番目なので数字は8。日干「辛」は金、地支「未」は土で、土は日干を生む関係（印星）なので英字はC（印星）。"},
    {"no": 9, "code": "9C", "kanshi": "壬申", "letter": "C", "tsuhensei": "印星", "omoteura": "大人の振りした子供", "serifu": "すべてわたしが中心です", "tokucho": "疑い深いアブノーマルだけど魅力的な変化に強い感覚派", "hitokoto": "頭の良い子供", "naze": "壬申の日生まれ。地支「申」は12支の9番目なので数字は9。日干「壬」は水、地支「申」は金で、金は日干を生む関係（印星）なので英字はC（印星）。"},
    {"no": 10, "code": "10C", "kanshi": "癸酉", "letter": "C", "tsuhensei": "印星", "omoteura": "大人の振りした子供", "serifu": "すべてわたしが中心です", "tokucho": "疑い深いアブノーマルな魅力のある他人に寄り添う感覚派", "hitokoto": "おバカか？賢いかの2極な子供", "naze": "癸酉の日生まれ。地支「酉」は12支の10番目なので数字は10。日干「癸」は水、地支「酉」は金で、金は日干を生む関係（印星）なので英字はC（印星）。"},
    {"no": 11, "code": "11S", "kanshi": "甲戌", "letter": "S", "tsuhensei": "財星", "omoteura": "どMのふりしたどS", "serifu": "すべてわたしが決めます", "tokucho": "挫折に弱く天然ボケだけどプライドの高いポジティブな人", "hitokoto": "えーかっこしいのドS", "naze": "甲戌の日生まれ。地支「戌」は12支の11番目なので数字は11。日干「甲」は木、地支「戌」は土で、土は日干が剋（こく）す関係（財星）なので英字はS（財星）。"},
    {"no": 12, "code": "12C", "kanshi": "乙亥", "letter": "C", "tsuhensei": "印星", "omoteura": "大人の振りした子供", "serifu": "すべてわたしが中心です", "tokucho": "生まれながらのネガティブだけど協調性のある控えめな温厚な人", "hitokoto": "ネガティブな勘が良く当たる子供", "naze": "乙亥の日生まれ。地支「亥」は12支の12番目なので数字は12。日干「乙」は木、地支「亥」は水で、水は日干を生む関係（印星）なので英字はC（印星）。"},
    {"no": 13, "code": "1M", "kanshi": "丙子", "letter": "M", "tsuhensei": "官星", "omoteura": "どSのふりしたどM", "serifu": "すべてあなたが決めてください", "tokucho": "表舞台に立つわたしが主役な一言多いおしゃれさん", "hitokoto": "苦労を買ってするドМ", "naze": "丙子の日生まれ。地支「子」は12支の1番目なので数字は1。日干「丙」は火、地支「子」は水で、水は日干を剋（こく）す関係（官星）なので英字はM（官星）。"},
    {"no": 14, "code": "2A", "kanshi": "丁丑", "letter": "A", "tsuhensei": "食傷星", "omoteura": "子供のふりした大人", "serifu": "すべてわたしが基本です", "tokucho": "控えめだけど目立って自分が輝くおしゃれさん", "hitokoto": "スマートなふるまいをする大人", "naze": "丁丑の日生まれ。地支「丑」は12支の2番目なので数字は2。日干「丁」は火、地支「丑」は土で、土は日干が生む関係（食傷星）なので英字はA（食傷星）。"},
    {"no": 15, "code": "3M", "kanshi": "戊寅", "letter": "M", "tsuhensei": "官星", "omoteura": "どSのふりしたどM", "serifu": "すべてあなたが決めてください", "tokucho": "頑固でずぼらだけど包容力のある優しい人", "hitokoto": "変態（オタク、マニア）に見えない変態（オタク、マニア）なドМ", "naze": "戊寅の日生まれ。地支「寅」は12支の3番目なので数字は3。日干「戊」は土、地支「寅」は木で、木は日干を剋（こく）す関係（官星）なので英字はM（官星）。"},
    {"no": 16, "code": "4M", "kanshi": "己卯", "letter": "M", "tsuhensei": "官星", "omoteura": "どSのふりしたどM", "serifu": "すべてあなたが決めてください", "tokucho": "妄想しがちでしつこいけど穏やかでフレンドリーな優しい人", "hitokoto": "変態（オタク、マニア）マニアックなドМ", "naze": "己卯の日生まれ。地支「卯」は12支の4番目なので数字は4。日干「己」は土、地支「卯」は木で、木は日干を剋（こく）す関係（官星）なので英字はM（官星）。"},
    {"no": 17, "code": "5C", "kanshi": "庚辰", "letter": "C", "tsuhensei": "印星", "omoteura": "大人の振りした子供", "serifu": "すべてわたしが中心です", "tokucho": "白黒、せっかち、頑固な頭の切れるチャレンジャー", "hitokoto": "面白くないと全く動かない子供", "naze": "庚辰の日生まれ。地支「辰」は12支の5番目なので数字は5。日干「庚」は金、地支「辰」は土で、土は日干を生む関係（印星）なので英字はC（印星）。"},
    {"no": 18, "code": "6M", "kanshi": "辛巳", "letter": "M", "tsuhensei": "官星", "omoteura": "どSのふりしたどM", "serifu": "すべてあなたが決めてください", "tokucho": "白黒、せっかち、辛口のくせに繊細で美意識と責任感で生きてる人", "hitokoto": "うだうだ言うけどやるドМ", "naze": "辛巳の日生まれ。地支「巳」は12支の6番目なので数字は6。日干「辛」は金、地支「巳」は火で、火は日干を剋（こく）す関係（官星）なので英字はM（官星）。"},
    {"no": 19, "code": "7S", "kanshi": "壬午", "letter": "S", "tsuhensei": "財星", "omoteura": "どMのふりしたどS", "serifu": "すべてわたしが決めます", "tokucho": "疑い深いアブノーマルだけど魅力的な変化に強い感覚派", "hitokoto": "大胆なモテモテドS", "naze": "壬午の日生まれ。地支「午」は12支の7番目なので数字は7。日干「壬」は水、地支「午」は火で、火は日干が剋（こく）す関係（財星）なので英字はS（財星）。"},
    {"no": 20, "code": "8M", "kanshi": "癸未", "letter": "M", "tsuhensei": "官星", "omoteura": "どSのふりしたどM", "serifu": "すべてあなたが決めてください", "tokucho": "疑い深いアブノーマルな魅力のある他人に寄り添う感覚派", "hitokoto": "尽くしても報われないむなしいドМ", "naze": "癸未の日生まれ。地支「未」は12支の8番目なので数字は8。日干「癸」は水、地支「未」は土で、土は日干を剋（こく）す関係（官星）なので英字はM（官星）。"},
    {"no": 21, "code": "9M", "kanshi": "甲申", "letter": "M", "tsuhensei": "官星", "omoteura": "どSのふりしたどM", "serifu": "すべてあなたが決めてください", "tokucho": "挫折に弱く天然ボケだけどプライドの高いポジティブな人", "hitokoto": "お人好しドМ", "naze": "甲申の日生まれ。地支「申」は12支の9番目なので数字は9。日干「甲」は木、地支「申」は金で、金は日干を剋（こく）す関係（官星）なので英字はM（官星）。"},
    {"no": 22, "code": "10M", "kanshi": "乙酉", "letter": "M", "tsuhensei": "官星", "omoteura": "どSのふりしたどM", "serifu": "すべてあなたが決めてください", "tokucho": "生まれながらのネガティブだけど協調性のある控えめな温厚な人", "hitokoto": "私は全然自信ないい点張りのドМ", "naze": "乙酉の日生まれ。地支「酉」は12支の10番目なので数字は10。日干「乙」は木、地支「酉」は金で、金は日干を剋（こく）す関係（官星）なので英字はM（官星）。"},
    {"no": 23, "code": "11A", "kanshi": "丙戌", "letter": "A", "tsuhensei": "食傷星", "omoteura": "子供のふりした大人", "serifu": "すべてわたしが基本です", "tokucho": "表舞台に立つわたしが主役な一言多いおしゃれさん", "hitokoto": "わかりやすい上から目線な大人", "naze": "丙戌の日生まれ。地支「戌」は12支の11番目なので数字は11。日干「丙」は火、地支「戌」は土で、土は日干が生む関係（食傷星）なので英字はA（食傷星）。"},
    {"no": 24, "code": "12M", "kanshi": "丁亥", "letter": "M", "tsuhensei": "官星", "omoteura": "どSのふりしたどM", "serifu": "すべてあなたが決めてください", "tokucho": "控えめだけど目立って自分が輝くおしゃれさん", "hitokoto": "証拠が欲しいドМ", "naze": "丁亥の日生まれ。地支「亥」は12支の12番目なので数字は12。日干「丁」は火、地支「亥」は水で、水は日干を剋（こく）す関係（官星）なので英字はM（官星）。"},
    {"no": 25, "code": "1S", "kanshi": "戊子", "letter": "S", "tsuhensei": "財星", "omoteura": "どMのふりしたどS", "serifu": "すべてわたしが決めます", "tokucho": "頑固でずぼらだけど包容力のある優しい人", "hitokoto": "目覚めたらど変態（オタク、マニア）のドS", "naze": "戊子の日生まれ。地支「子」は12支の1番目なので数字は1。日干「戊」は土、地支「子」は水で、水は日干が剋（こく）す関係（財星）なので英字はS（財星）。"},
    {"no": 26, "code": "2P", "kanshi": "己丑", "letter": "P", "tsuhensei": "比劫星", "omoteura": "コミュニケーション苦手なふりしたひとたらしな自己中", "serifu": "すべてわたしの気分です", "tokucho": "妄想しがちでしつこいけど穏やかでフレンドリーな優しい人", "hitokoto": "プライド高めのめんどくさがりの自己中", "naze": "己丑の日生まれ。地支「丑」は12支の2番目なので数字は2。日干「己」は土、地支「丑」は土で、土は日干と同じ五行（比劫星）なので英字はP（比劫星）。"},
    {"no": 27, "code": "3S", "kanshi": "庚寅", "letter": "S", "tsuhensei": "財星", "omoteura": "どMのふりしたどS", "serifu": "すべてわたしが決めます", "tokucho": "白黒、せっかち、頑固な頭の切れるチャレンジャー", "hitokoto": "態度でかめの小心者のどS", "naze": "庚寅の日生まれ。地支「寅」は12支の3番目なので数字は3。日干「庚」は金、地支「寅」は木で、木は日干が剋（こく）す関係（財星）なので英字はS（財星）。"},
    {"no": 28, "code": "4S", "kanshi": "辛卯", "letter": "S", "tsuhensei": "財星", "omoteura": "どMのふりしたどS", "serifu": "すべてわたしが決めます", "tokucho": "白黒、せっかち、辛口のくせに繊細で美意識と責任感で生きてる人", "hitokoto": "裏と表だけ時速200キロのドSウサギ", "naze": "辛卯の日生まれ。地支「卯」は12支の4番目なので数字は4。日干「辛」は金、地支「卯」は木で、木は日干が剋（こく）す関係（財星）なので英字はS（財星）。"},
    {"no": 29, "code": "5M", "kanshi": "壬辰", "letter": "M", "tsuhensei": "官星", "omoteura": "どSのふりしたどM", "serifu": "すべてあなたが決めてください", "tokucho": "疑い深いアブノーマルだけど魅力的な変化に強い感覚派", "hitokoto": "好きなもの以外どうでもいいドМ", "naze": "壬辰の日生まれ。地支「辰」は12支の5番目なので数字は5。日干「壬」は水、地支「辰」は土で、土は日干を剋（こく）す関係（官星）なので英字はM（官星）。"},
    {"no": 30, "code": "6S", "kanshi": "癸巳", "letter": "S", "tsuhensei": "財星", "omoteura": "どMのふりしたどS", "serifu": "すべてわたしが決めます", "tokucho": "疑い深いアブノーマルな魅力のある他人に寄り添う感覚派", "hitokoto": "小さな場所なら自信満々のドS", "naze": "癸巳の日生まれ。地支「巳」は12支の6番目なので数字は6。日干「癸」は水、地支「巳」は火で、火は日干が剋（こく）す関係（財星）なので英字はS（財星）。"},
    {"no": 31, "code": "7A", "kanshi": "甲午", "letter": "A", "tsuhensei": "食傷星", "omoteura": "子供のふりした大人", "serifu": "すべてわたしが基本です", "tokucho": "挫折に弱く天然ボケだけどプライドの高いポジティブな人", "hitokoto": "ナチュラルビューティーな大人", "naze": "甲午の日生まれ。地支「午」は12支の7番目なので数字は7。日干「甲」は木、地支「午」は火で、火は日干が生む関係（食傷星）なので英字はA（食傷星）。"},
    {"no": 32, "code": "8S", "kanshi": "乙未", "letter": "S", "tsuhensei": "財星", "omoteura": "どMのふりしたどS", "serifu": "すべてわたしが決めます", "tokucho": "生まれながらのネガティブだけど協調性のある控えめな温厚な人", "hitokoto": "切れたら怖すぎる自己肯定低めのドS", "naze": "乙未の日生まれ。地支「未」は12支の8番目なので数字は8。日干「乙」は木、地支「未」は土で、土は日干が剋（こく）す関係（財星）なので英字はS（財星）。"},
    {"no": 33, "code": "9S", "kanshi": "丙申", "letter": "S", "tsuhensei": "財星", "omoteura": "どMのふりしたどS", "serifu": "すべてわたしが決めます", "tokucho": "表舞台に立つわたしが主役な一言多いおしゃれさん", "hitokoto": "THE芸能人私みてみてすごいでしょなドS", "naze": "丙申の日生まれ。地支「申」は12支の9番目なので数字は9。日干「丙」は火、地支「申」は金で、金は日干が剋（こく）す関係（財星）なので英字はS（財星）。"},
    {"no": 34, "code": "10S", "kanshi": "丁酉", "letter": "S", "tsuhensei": "財星", "omoteura": "どMのふりしたどS", "serifu": "すべてわたしが決めます", "tokucho": "控えめだけど目立って自分が輝くおしゃれさん", "hitokoto": "頭の良いキレッキレのドS", "naze": "丁酉の日生まれ。地支「酉」は12支の10番目なので数字は10。日干「丁」は火、地支「酉」は金で、金は日干が剋（こく）す関係（財星）なので英字はS（財星）。"},
    {"no": 35, "code": "11P", "kanshi": "戊戌", "letter": "P", "tsuhensei": "比劫星", "omoteura": "コミュニケーション苦手なふりしたひとたらしな自己中", "serifu": "すべてわたしの気分です", "tokucho": "頑固でずぼらだけど包容力のある優しい人", "hitokoto": "めんどうなことは一刀両断の自己中", "naze": "戊戌の日生まれ。地支「戌」は12支の11番目なので数字は11。日干「戊」は土、地支「戌」は土で、土は日干と同じ五行（比劫星）なので英字はP（比劫星）。"},
    {"no": 36, "code": "12S", "kanshi": "己亥", "letter": "S", "tsuhensei": "財星", "omoteura": "どMのふりしたどS", "serifu": "すべてわたしが決めます", "tokucho": "妄想しがちでしつこいけど穏やかでフレンドリーな優しい人", "hitokoto": "常識があるようで全くないどS", "naze": "己亥の日生まれ。地支「亥」は12支の12番目なので数字は12。日干「己」は土、地支「亥」は水で、水は日干が剋（こく）す関係（財星）なので英字はS（財星）。"},
    {"no": 37, "code": "1A", "kanshi": "庚子", "letter": "A", "tsuhensei": "食傷星", "omoteura": "子供のふりした大人", "serifu": "すべてわたしが基本です", "tokucho": "白黒、せっかち、頑固な頭の切れるチャレンジャー", "hitokoto": "イヤなものはとことんイヤでも我慢する大人", "naze": "庚子の日生まれ。地支「子」は12支の1番目なので数字は1。日干「庚」は金、地支「子」は水で、水は日干が生む関係（食傷星）なので英字はA（食傷星）。"},
    {"no": 38, "code": "2C", "kanshi": "辛丑", "letter": "C", "tsuhensei": "印星", "omoteura": "大人の振りした子供", "serifu": "すべてわたしが中心です", "tokucho": "白黒、せっかち、辛口のくせに繊細で美意識と責任感で生きてる人", "hitokoto": "何でもできちゃうけど一番が苦手な人見知りの子供", "naze": "辛丑の日生まれ。地支「丑」は12支の2番目なので数字は2。日干「辛」は金、地支「丑」は土で、土は日干を生む関係（印星）なので英字はC（印星）。"},
    {"no": 39, "code": "3A", "kanshi": "壬寅", "letter": "A", "tsuhensei": "食傷星", "omoteura": "子供のふりした大人", "serifu": "すべてわたしが基本です", "tokucho": "疑い深いアブノーマルだけど魅力的な変化に強い感覚派", "hitokoto": "私に任せて安心だから！の大人", "naze": "壬寅の日生まれ。地支「寅」は12支の3番目なので数字は3。日干「壬」は水、地支「寅」は木で、木は日干が生む関係（食傷星）なので英字はA（食傷星）。"},
    {"no": 40, "code": "4A", "kanshi": "癸卯", "letter": "A", "tsuhensei": "食傷星", "omoteura": "子供のふりした大人", "serifu": "すべてわたしが基本です", "tokucho": "疑い深いアブノーマルな魅力のある他人に寄り添う感覚派", "hitokoto": "一途な心配性、世間体が大事な大人", "naze": "癸卯の日生まれ。地支「卯」は12支の4番目なので数字は4。日干「癸」は水、地支「卯」は木で、木は日干が生む関係（食傷星）なので英字はA（食傷星）。"},
    {"no": 41, "code": "5S", "kanshi": "甲辰", "letter": "S", "tsuhensei": "財星", "omoteura": "どMのふりしたどS", "serifu": "すべてわたしが決めます", "tokucho": "挫折に弱く天然ボケだけどプライドの高いポジティブな人", "hitokoto": "怒らせたらいけないどS", "naze": "甲辰の日生まれ。地支「辰」は12支の5番目なので数字は5。日干「甲」は木、地支「辰」は土で、土は日干が剋（こく）す関係（財星）なので英字はS（財星）。"},
    {"no": 42, "code": "6A", "kanshi": "乙巳", "letter": "A", "tsuhensei": "食傷星", "omoteura": "子供のふりした大人", "serifu": "すべてわたしが基本です", "tokucho": "生まれながらのネガティブだけど協調性のある控えめな温厚な人", "hitokoto": "霊感人間、執念はとび級大人", "naze": "乙巳の日生まれ。地支「巳」は12支の6番目なので数字は6。日干「乙」は木、地支「巳」は火で、火は日干が生む関係（食傷星）なので英字はA（食傷星）。"},
    {"no": 43, "code": "7P", "kanshi": "丙午", "letter": "P", "tsuhensei": "比劫星", "omoteura": "コミュニケーション苦手なふりしたひとたらしな自己中", "serifu": "すべてわたしの気分です", "tokucho": "表舞台に立つわたしが主役な一言多いおしゃれさん", "hitokoto": "自己愛があふれる自己中", "naze": "丙午の日生まれ。地支「午」は12支の7番目なので数字は7。日干「丙」は火、地支「午」は火で、火は日干と同じ五行（比劫星）なので英字はP（比劫星）。"},
    {"no": 44, "code": "8A", "kanshi": "丁未", "letter": "A", "tsuhensei": "食傷星", "omoteura": "子供のふりした大人", "serifu": "すべてわたしが基本です", "tokucho": "控えめだけど目立って自分が輝くおしゃれさん", "hitokoto": "自己愛ばかり、愛したら命がけの大人", "naze": "丁未の日生まれ。地支「未」は12支の8番目なので数字は8。日干「丁」は火、地支「未」は土で、土は日干が生む関係（食傷星）なので英字はA（食傷星）。"},
    {"no": 45, "code": "9A", "kanshi": "戊申", "letter": "A", "tsuhensei": "食傷星", "omoteura": "子供のふりした大人", "serifu": "すべてわたしが基本です", "tokucho": "頑固でずぼらだけど包容力のある優しい人", "hitokoto": "隠してるつもり、でもバレバレの上から目線な大人", "naze": "戊申の日生まれ。地支「申」は12支の9番目なので数字は9。日干「戊」は土、地支「申」は金で、金は日干が生む関係（食傷星）なので英字はA（食傷星）。"},
    {"no": 46, "code": "10A", "kanshi": "己酉", "letter": "A", "tsuhensei": "食傷星", "omoteura": "子供のふりした大人", "serifu": "すべてわたしが基本です", "tokucho": "妄想しがちでしつこいけど穏やかでフレンドリーな優しい人", "hitokoto": "めんどくさいと言いながら断らず引き受ける大人", "naze": "己酉の日生まれ。地支「酉」は12支の10番目なので数字は10。日干「己」は土、地支「酉」は金で、金は日干が生む関係（食傷星）なので英字はA（食傷星）。"},
    {"no": 47, "code": "11C", "kanshi": "庚戌", "letter": "C", "tsuhensei": "印星", "omoteura": "大人の振りした子供", "serifu": "すべてわたしが中心です", "tokucho": "白黒、せっかち、頑固な頭の切れるチャレンジャー", "hitokoto": "都合のいいこと、好きなことだけしか聞かない子供", "naze": "庚戌の日生まれ。地支「戌」は12支の11番目なので数字は11。日干「庚」は金、地支「戌」は土で、土は日干を生む関係（印星）なので英字はC（印星）。"},
    {"no": 48, "code": "12A", "kanshi": "辛亥", "letter": "A", "tsuhensei": "食傷星", "omoteura": "子供のふりした大人", "serifu": "すべてわたしが基本です", "tokucho": "白黒、せっかち、辛口のくせに繊細で美意識と責任感で生きてる人", "hitokoto": "私が一番、名誉も一番、一番が大好き大人", "naze": "辛亥の日生まれ。地支「亥」は12支の12番目なので数字は12。日干「辛」は金、地支「亥」は水で、水は日干が生む関係（食傷星）なので英字はA（食傷星）。"},
    {"no": 49, "code": "1P", "kanshi": "壬子", "letter": "P", "tsuhensei": "比劫星", "omoteura": "コミュニケーション苦手なふりしたひとたらしな自己中", "serifu": "すべてわたしの気分です", "tokucho": "疑い深いアブノーマルだけど魅力的な変化に強い感覚派", "hitokoto": "仕事命、でも自由でのんびりも大好きな自己中", "naze": "壬子の日生まれ。地支「子」は12支の1番目なので数字は1。日干「壬」は水、地支「子」は水で、水は日干と同じ五行（比劫星）なので英字はP（比劫星）。"},
    {"no": 50, "code": "2M", "kanshi": "癸丑", "letter": "M", "tsuhensei": "官星", "omoteura": "どSのふりしたどM", "serifu": "すべてあなたが決めてください", "tokucho": "疑い深いアブノーマルな魅力のある他人に寄り添う感覚派", "hitokoto": "決めたら早いおっとり屋のドМ", "naze": "癸丑の日生まれ。地支「丑」は12支の2番目なので数字は2。日干「癸」は水、地支「丑」は土で、土は日干を剋（こく）す関係（官星）なので英字はM（官星）。"},
    {"no": 51, "code": "3P", "kanshi": "甲寅", "letter": "P", "tsuhensei": "比劫星", "omoteura": "コミュニケーション苦手なふりしたひとたらしな自己中", "serifu": "すべてわたしの気分です", "tokucho": "挫折に弱く天然ボケだけどプライドの高いポジティブな人", "hitokoto": "わが道をいく天然な自己中", "naze": "甲寅の日生まれ。地支「寅」は12支の3番目なので数字は3。日干「甲」は木、地支「寅」は木で、木は日干と同じ五行（比劫星）なので英字はP（比劫星）。"},
    {"no": 52, "code": "4P", "kanshi": "乙卯", "letter": "P", "tsuhensei": "比劫星", "omoteura": "コミュニケーション苦手なふりしたひとたらしな自己中", "serifu": "すべてわたしの気分です", "tokucho": "生まれながらのネガティブだけど協調性のある控えめな温厚な人", "hitokoto": "闇の中からフェロモンにあふれる自己中", "naze": "乙卯の日生まれ。地支「卯」は12支の4番目なので数字は4。日干「乙」は木、地支「卯」は木で、木は日干と同じ五行（比劫星）なので英字はP（比劫星）。"},
    {"no": 53, "code": "5A", "kanshi": "丙辰", "letter": "A", "tsuhensei": "食傷星", "omoteura": "子供のふりした大人", "serifu": "すべてわたしが基本です", "tokucho": "表舞台に立つわたしが主役な一言多いおしゃれさん", "hitokoto": "イヤイヤ言うけどそうでもない大人", "naze": "丙辰の日生まれ。地支「辰」は12支の5番目なので数字は5。日干「丙」は火、地支「辰」は土で、土は日干が生む関係（食傷星）なので英字はA（食傷星）。"},
    {"no": 54, "code": "6P", "kanshi": "丁巳", "letter": "P", "tsuhensei": "比劫星", "omoteura": "コミュニケーション苦手なふりしたひとたらしな自己中", "serifu": "すべてわたしの気分です", "tokucho": "控えめだけど目立って自分が輝くおしゃれさん", "hitokoto": "カリスマに見えてしまう自己中", "naze": "丁巳の日生まれ。地支「巳」は12支の6番目なので数字は6。日干「丁」は火、地支「巳」は火で、火は日干と同じ五行（比劫星）なので英字はP（比劫星）。"},
    {"no": 55, "code": "7C", "kanshi": "戊午", "letter": "C", "tsuhensei": "印星", "omoteura": "大人の振りした子供", "serifu": "すべてわたしが中心です", "tokucho": "頑固でずぼらだけど包容力のある優しい人", "hitokoto": "いつでもポジティブマンの子供", "naze": "戊午の日生まれ。地支「午」は12支の7番目なので数字は7。日干「戊」は土、地支「午」は火で、火は日干を生む関係（印星）なので英字はC（印星）。"},
    {"no": 56, "code": "8P", "kanshi": "己未", "letter": "P", "tsuhensei": "比劫星", "omoteura": "コミュニケーション苦手なふりしたひとたらしな自己中", "serifu": "すべてわたしの気分です", "tokucho": "妄想しがちでしつこいけど穏やかでフレンドリーな優しい人", "hitokoto": "怖がりだけど、やりとげる自己中", "naze": "己未の日生まれ。地支「未」は12支の8番目なので数字は8。日干「己」は土、地支「未」は土で、土は日干と同じ五行（比劫星）なので英字はP（比劫星）。"},
    {"no": 57, "code": "9P", "kanshi": "庚申", "letter": "P", "tsuhensei": "比劫星", "omoteura": "コミュニケーション苦手なふりしたひとたらしな自己中", "serifu": "すべてわたしの気分です", "tokucho": "白黒、せっかち、頑固な頭の切れるチャレンジャー", "hitokoto": "相棒がいないと立ってられない仕事マンの自己中", "naze": "庚申の日生まれ。地支「申」は12支の9番目なので数字は9。日干「庚」は金、地支「申」は金で、金は日干と同じ五行（比劫星）なので英字はP（比劫星）。"},
    {"no": 58, "code": "10P", "kanshi": "辛酉", "letter": "P", "tsuhensei": "比劫星", "omoteura": "コミュニケーション苦手なふりしたひとたらしな自己中", "serifu": "すべてわたしの気分です", "tokucho": "白黒、せっかち、辛口のくせに繊細で美意識と責任感で生きてる人", "hitokoto": "見えないけど本当は自分さえよければいい自己中", "naze": "辛酉の日生まれ。地支「酉」は12支の10番目なので数字は10。日干「辛」は金、地支「酉」は金で、金は日干と同じ五行（比劫星）なので英字はP（比劫星）。"},
    {"no": 59, "code": "11M", "kanshi": "壬戌", "letter": "M", "tsuhensei": "官星", "omoteura": "どSのふりしたどM", "serifu": "すべてあなたが決めてください", "tokucho": "疑い深いアブノーマルだけど魅力的な変化に強い感覚派", "hitokoto": "食いしん坊万歳なドМ", "naze": "壬戌の日生まれ。地支「戌」は12支の11番目なので数字は11。日干「壬」は水、地支「戌」は土で、土は日干を剋（こく）す関係（官星）なので英字はM（官星）。"},
    {"no": 60, "code": "12P", "kanshi": "癸亥", "letter": "P", "tsuhensei": "比劫星", "omoteura": "コミュニケーション苦手なふりしたひとたらしな自己中", "serifu": "すべてわたしの気分です", "tokucho": "疑い深いアブノーマルな魅力のある他人に寄り添う感覚派", "hitokoto": "わが道しかいけない天才的な自己中", "naze": "癸亥の日生まれ。地支「亥」は12支の12番目なので数字は12。日干「癸」は水、地支「亥」は水で、水は日干と同じ五行（比劫星）なので英字はP（比劫星）。"},
  ];

  const LIBRARY_PEOPLE = [
    { genre: "実業家", name: "小林一三", date: "1873/01/03", desc: "阪急電鉄・宝塚歌劇団・東宝を創業した実業家。" },
    { genre: "思想・政治", name: "ドナルド・トランプ", date: "1946/06/14", desc: "第45・47代アメリカ大統領。不動産王・実業家。" },
    { genre: "キャバ嬢", name: "ゆいぴす", date: "2002/01/08", desc: "歌舞伎町のキャバ嬢・インフルエンサー。" },
    { genre: "キャバ嬢", name: "一条響", date: "1992/09/09", desc: "歌舞伎町の伝説的キャバ嬢。" },
    { genre: "キャバ嬢", name: "愛沢えみり", date: "1988/09/01", desc: "元歌舞伎町No.1キャバ嬢。アパレル等の実業家。" },
    { genre: "インフルエンサー", name: "明日花キララ", date: "1988/10/02", desc: "タレント・モデル・インフルエンサー。" },
    { genre: "インフルエンサー", name: "三上悠亜", date: "1993/08/16", desc: "タレント・インフルエンサー。" },
    { genre: "インフルエンサー", name: "嬉野ゆみ", date: "1996/07/24", desc: "インフルエンサー。" },
    { genre: "インフルエンサー", name: "溝口勇児", date: "1984/11/23", desc: "FiNC創業。実業家・インフルエンサー。" },
    { genre: "インフルエンサー", name: "春木開", date: "1988/06/28", desc: "実業家・インフルエンサー（キングダム）。" },
    { genre: "インフルエンサー", name: "けーりん", date: "1980/07/25", desc: "インフルエンサー。" },
    { genre: "インフルエンサー", name: "鈴木亜美", date: "1988/09/27", desc: "インフルエンサー。" },
    { genre: "インフルエンサー", name: "Rちゃん", date: "1996/08/04", desc: "インフルエンサー。" },
    { genre: "インフルエンサー", name: "てんちむ", date: "1993/11/19", desc: "YouTuber・インフルエンサー。" },
    { genre: "芸能・エンタメ", name: "ヒカル", date: "1991/05/29", desc: "YouTuber・実業家。" },
    { genre: "キャバ嬢", name: "南柚子", date: "1998/09/20", desc: "キャバ嬢。" },
    { genre: "インフルエンサー", name: "Honami", date: "1987/10/13", desc: "インフルエンサー。" },
    { genre: "実業家", name: "森岡毅", date: "1972/10/12", desc: "マーケター。USJ再建、「刀」代表。" },
    { genre: "実業家", name: "ファム・ニャット・ヴオン", date: "1968/08/05", desc: "ベトナム最大の財閥ビングループ創業者。" },
    { genre: "芸能・エンタメ", name: "北原照久", date: "1948/01/30", desc: "「開運！なんでも鑑定団」鑑定士。ブリキのおもちゃ博物館館長。" },
    // スポーツ
    { genre: "スポーツ", name: "大谷 翔平", date: "1994/07/05", desc: "投打二刀流で世界を驚かせたメジャーリーガー。" },
    { genre: "スポーツ", name: "イチロー", date: "1973/10/22", desc: "MLBで年間最多安打記録を打ち立てた安打製造機。" },
    { genre: "スポーツ", name: "羽生 結弦", date: "1994/12/07", desc: "五輪連覇を果たしたフィギュアスケートの王者。" },
    { genre: "スポーツ", name: "錦織 圭", date: "1989/12/29", desc: "アジア男子テニス界を牽引したトッププレーヤー。" },
    { genre: "スポーツ", name: "本田 圭佑", date: "1986/06/13", desc: "W杯で活躍し海外で戦った日本サッカーの中心選手。" },
    { genre: "スポーツ", name: "三浦 知良", date: "1967/02/26", desc: "50代まで現役を続ける『キング・カズ』。" },
    { genre: "スポーツ", name: "リオネル・メッシ", date: "1987/06/24", desc: "数々の記録を塗り替えたアルゼンチンの至宝。" },
    { genre: "スポーツ", name: "クリスティアーノ・ロナウド", date: "1985/02/05", desc: "世界最高峰の得点力を誇るポルトガルの英雄。" },
    // 音楽
    { genre: "音楽", name: "宇多田 ヒカル", date: "1983/01/19", desc: "『First Love』で一時代を築いたシンガーソングライター。" },
    { genre: "音楽", name: "米津 玄師", date: "1991/03/10", desc: "独創的な楽曲で世代を超えて支持される音楽家。" },
    { genre: "音楽", name: "桑田 佳祐", date: "1956/02/26", desc: "サザンオールスターズを率いる国民的ミュージシャン。" },
    { genre: "音楽", name: "松任谷 由実", date: "1954/01/19", desc: "『ユーミン』の愛称で親しまれる音楽界の重鎮。" },
    { genre: "音楽", name: "坂本 龍一", date: "1952/01/17", desc: "YMOや映画音楽で世界的に評価された作曲家。" },
    { genre: "音楽", name: "テイラー・スウィフト", date: "1989/12/13", desc: "世界的な人気を誇るアメリカのシンガーソングライター。" },
    // 芸能・エンタメ
    { genre: "芸能・エンタメ", name: "タモリ", date: "1945/08/22", desc: "長寿番組を支え続けた日本を代表する司会者。" },
    { genre: "芸能・エンタメ", name: "ビートたけし（北野 武）", date: "1947/01/18", desc: "お笑いから世界的映画監督まで多才な表現者。" },
    { genre: "芸能・エンタメ", name: "明石家 さんま", date: "1955/07/01", desc: "日本のお笑い界を牽引する国民的コメディアン。" },
    { genre: "芸能・エンタメ", name: "木村 拓哉", date: "1972/11/13", desc: "一時代を築いた日本を代表する俳優。" },
    { genre: "芸能・エンタメ", name: "新垣 結衣", date: "1988/06/11", desc: "幅広い作品で愛される人気女優。" },
    { genre: "芸能・エンタメ", name: "綾瀬 はるか", date: "1985/03/24", desc: "透明感のある演技で親しまれる女優。" },
    { genre: "芸能・エンタメ", name: "レオナルド・ディカプリオ", date: "1974/11/11", desc: "『タイタニック』などで知られるハリウッド俳優。" },
    // 実業家
    { genre: "実業家", name: "ビル・ゲイツ", date: "1955/10/28", desc: "マイクロソフトを創業しPCを世界に普及させた。" },
    { genre: "実業家", name: "イーロン・マスク", date: "1971/06/28", desc: "テスラ・スペースXを率いる起業家。" },
    { genre: "実業家", name: "孫 正義", date: "1957/08/11", desc: "ソフトバンクを一代で築いた実業家。" },
    { genre: "実業家", name: "松下 幸之助", date: "1894/11/27", desc: "パナソニックを創業した『経営の神様』。" },
    { genre: "実業家", name: "稲盛 和夫", date: "1932/01/21", desc: "京セラ・KDDIを創業し経営哲学を説いた。" },
    // 偉人
    { genre: "偉人", name: "アルベルト・アインシュタイン", date: "1879/03/14", desc: "相対性理論を提唱し、現代物理学の基礎を築いた天才物理学者。" },
    { genre: "偉人", name: "トーマス・エジソン", date: "1847/02/11", desc: "白熱電球や蓄音機など生涯に1,300以上の発明を行った「発明王」。" },
    { genre: "偉人", name: "アイザック・ニュートン", date: "1643/01/04", desc: "万有引力の法則を発見し、微積分法を開発した近代科学の父。" },
    { genre: "偉人", name: "ガリレオ・ガリレイ", date: "1564/02/15", desc: "天体望遠鏡を自作し、地動説を支持・証明した「天文学の父」。" },
    { genre: "偉人", name: "チャールズ・ダーウィン", date: "1809/02/12", desc: "『種の起源』を著し、進化論（自然選択説）を提唱した生物学者。" },
    { genre: "偉人", name: "マリー・キュリー", date: "1867/11/07", desc: "ラジウムとポロニウムを発見し、女性初のノーベル賞（物理・化学）を受賞。" },
    { genre: "偉人", name: "ニコラ・テスラ", date: "1856/07/10", desc: "交流電流（AC）の送電システムを発明し、現代の電気社会の基礎を作った。" },
    { genre: "偉人", name: "スティーブ・ジョブズ", date: "1955/02/24", desc: "アップル社の共同創業者で、iPhoneやMacを生み出しIT革命を主導。" },
    { genre: "偉人", name: "レオナルド・ダ・ヴィンチ", date: "1452/04/15", desc: "『モナ・リザ』を描き、科学や解剖学にも通じたルネサンスの万能の天才。" },
    { genre: "偉人", name: "パブロ・ピカソ", date: "1881/10/25", desc: "キュビスムを創始し、『ゲルニカ』などの名作を残した20世紀最大の画家。" },
    { genre: "偉人", name: "フィンセント・ファン・ゴッホ", date: "1853/03/30", desc: "『ひまわり』などで知られる、強烈な色彩と感情表現が特徴のポスト印象派の画家。" },
    { genre: "偉人", name: "ウィリアム・シェイクスピア", date: "1564/04/26", desc: "『ハムレット』『ロミオとジュリエット』などを執筆した英国の劇作家（洗礼日）。" },
    { genre: "偉人", name: "ヴォルフガング・アマデウス・モーツァルト", date: "1756/01/27", desc: "5歳から作曲を始め、35年の生涯で600以上の名曲を残した音楽の神童。" },
    { genre: "偉人", name: "ルートヴィヒ・ヴァン・ベートーヴェン", date: "1770/12/17", desc: "失聴の苦難を乗り越え、『運命』『第九』などを作曲した「楽聖」（洗礼日）。" },
    { genre: "偉人", name: "ヨハン・ゼバスティアン・バッハ", date: "1685/03/31", desc: "近代音楽の基礎となる数々の宗教曲・器楽曲を残した「音楽の父」。" },
    { genre: "偉人", name: "チャーリー・チャップリン", date: "1889/04/16", desc: "『モダン・タイムス』などで社会風刺を行い、世界を笑わせた映画界の巨匠。" },
    { genre: "偉人", name: "ウォルト・ディズニー", date: "1901/12/05", desc: "ミッキーマウスを生み出し、世界初の長編アニメやディズニーランドを作った。" },
    { genre: "偉人", name: "ナポレオン・ボナパルト", date: "1769/08/15", desc: "フランス革命後の混乱を収拾し、ヨーロッパの大半を支配した軍事・政治の天才。" },
    { genre: "偉人", name: "エイブラハム・リンカーン", date: "1809/02/12", desc: "アメリカ第16代大統領。奴隷解放宣言を行い、南北戦争で国家の分裂を防いだ。" },
    { genre: "偉人", name: "マハトマ・ガンディー", date: "1869/10/02", desc: "「非暴力・不服従」を掲げ、インドをイギリスからの独立に導いた「建国の父」。" },
    { genre: "偉人", name: "マザー・テレサ", date: "1910/08/26", desc: "インドで「神の愛の宣教者会」を設立し、貧民や病人の救済に生涯を捧げた。" },
    { genre: "偉人", name: "マルティン・ルーサー・キング・ジュニア", date: "1929/01/15", desc: "アメリカの黒人公民権運動の指導者。「I Have a Dream」の演説が有名。" },
    { genre: "偉人", name: "ジョン・F・ケネディ", date: "1917/05/29", desc: "アメリカ第35代大統領。キューバ危機を回避し、アポロ計画を推進。" },
    { genre: "偉人", name: "ウィンストン・チャーチル", date: "1874/11/30", desc: "第二次世界大戦中にイギリス首相として国民を鼓舞し、連合国を勝利に導いた。" },
    { genre: "偉人", name: "フランクリン・ルーズベルト", date: "1882/01/30", desc: "世界恐慌に対してニューディール政策を行い、第二次世界大戦を戦い抜いた米大統領。" },
    { genre: "偉人", name: "ジョージ・ワシントン", date: "1732/02/22", desc: "アメリカ独立戦争を率いて勝利し、初代アメリカ合衆国大統領となった。" },
    { genre: "偉人", name: "カール・マルクス", date: "1818/05/05", desc: "『資本論』『共産党宣言』を著し、社会主義・共産主義の思想的基礎を築いた。" },
    { genre: "偉人", name: "アダム・スミス", date: "1723/06/05", desc: "『国富論』を著し、「神の見えざる手」による市場経済を説いた「経済学の父」（洗礼日）。" },
    { genre: "偉人", name: "シグムント・フロイト", date: "1856/05/06", desc: "人間の無意識の世界を探求し、「精神分析学」を創始した心理学者。" },
    { genre: "偉人", name: "ジャン＝ジャック・ルソー", date: "1712/06/28", desc: "『社会契約論』を著し、人民主権を唱えてフランス革命に大きな影響を与えた思想家。" },
    { genre: "偉人", name: "ルネ・デカルト", date: "1596/03/31", desc: "「われ思う、ゆえにわれあり」で知られる、近代哲学および解析幾何学の祖。" },
    { genre: "偉人", name: "織田 信長", date: "1534/06/23", desc: "天下布武を掲げ、楽市楽座や鉄砲の導入などで戦国時代の終結を推し進めた。" },
    { genre: "偉人", name: "豊臣 秀吉", date: "1537/03/17", desc: "足軽から天下人に上り詰め、太閤検地や刀狩りで天下統一を成し遂げた。" },
    { genre: "偉人", name: "徳川 家康", date: "1543/01/31", desc: "関ヶ原の戦いに勝利して江戸幕府を開き、約260年続く泰平の世の礎を築いた。" },
    { genre: "偉人", name: "坂本 龍馬", date: "1836/01/03", desc: "薩長同盟の仲介や「船中八策」の提示を行い、明治維新の立役者となった幕末の志士。" },
    { genre: "偉人", name: "福沢 諭吉", date: "1835/01/10", desc: "『学問のすすめ』を著し、慶應義塾を創設して日本の近代化に貢献した。" },
    { genre: "偉人", name: "野口 英世", date: "1876/11/09", desc: "黄熱病や梅毒の研究に命を捧げ、世界的に活躍した日本の細菌学者。" },
    { genre: "偉人", name: "紫式部", date: "973年頃", desc: "平安時代に世界最古の長編小説とされる『源氏物語』を執筆した女性作家。" },
    { genre: "偉人", name: "聖徳太子", date: "574/02/07", desc: "推古天皇の摂政として十七条憲法や冠位十二階を定め、隋に遣使を派遣した政治家。" },
    { genre: "偉人", name: "クリストファー・コロンブス", date: "1451年頃", desc: "大西洋を横断して大航海時代を切り開き、ヨーロッパ人にアメリカ大陸を認知させた。" },
    { genre: "偉人", name: "フェルディナンド・マゼラン", date: "1480年頃", desc: "人類史上初となる世界周航を成し遂げた航海を率いたポルトガルの探検家。" },
    { genre: "偉人", name: "マルコ・ポーロ", date: "1254/09/15", desc: "アジアを旅して『東方見聞録』を著し、欧州にアジアの文化を紹介した。" },
    { genre: "偉人", name: "ウィルバー・ライト", date: "1867/04/16", desc: "ライト兄弟の兄。弟と共に人類初の動力飛行機による有人飛行に成功した。" },
    { genre: "偉人", name: "オーヴィル・ライト", date: "1871/08/19", desc: "ライト兄弟の弟。兄と共に飛行機の発明と実用化を成し遂げた。" },
    { genre: "偉人", name: "アレクサンダー・グラハム・ベル", date: "1847/03/03", desc: "実用的な電話機を発明し、世界の通信システムを劇的に変えた発明家。" },
    { genre: "偉人", name: "ルイ・パスツール", date: "1822/12/27", desc: "牛乳の低温殺菌法を開発し、狂犬病ワクチンなどを発明した近代細菌学の開祖。" },
    { genre: "偉人", name: "アレクサンダー・フレミング", date: "1881/08/06", desc: "世界初の抗生物質「ペニシリン」を発見し、医療に革命をもたらした細菌学者。" },
    { genre: "偉人", name: "ガイウス・ユリウス・カエサル", date: "紀元前100年7月12日", desc: "「賽は投げられた」で有名。終身独裁官となりローマ帝国誕生の礎を築いた。" },
    { genre: "偉人", name: "アレクサンドロス大王", date: "紀元前356年頃", desc: "ギリシャからインドに及ぶ大帝国を築き、ヘレニズム文化を生んだマケドニアの王。" },
    { genre: "偉人", name: "チンギス・ハーン", date: "1162年頃", desc: "遊牧民族を統一してモンゴル帝国を建国し、史上最大の連続領土を築いた征服者。" },
    { genre: "偉人", name: "ジャンヌ・ダルク", date: "1412/01/06", desc: "百年戦争でフランス軍を率いてオルレアンを解放した「オルレアンの乙女」。" },
    { genre: "偉人", name: "エリザベス1世", date: "1533/09/07", desc: "イギリスの黄金時代を築き、スペインの無敵艦隊を撃破した女王。" },
    { genre: "偉人", name: "ルイ14世", date: "1638/09/05", desc: "「太陽王」と呼ばれ、ヴェルサイユ宮殿を建設してフランス絶対王政の最盛期を築いた。" },
    { genre: "偉人", name: "ピョートル1世（大帝）", date: "1672/06/09", desc: "ロシアを近代化・西欧化し、一大帝国へと発展させたロシア皇帝。" },
    { genre: "偉人", name: "クレオパトラ7世", date: "紀元前69年", desc: "古代エジプト最後の女王。美貌と知略でカエサルやアントニウスと結んだ。" },
    { genre: "偉人", name: "始皇帝", date: "紀元前259年2月18日", desc: "中国を初めて統一して秦王朝を樹立。万里の長城の建設や文字・通貨の統一を行った。" },
    { genre: "偉人", name: "孔子", date: "紀元前551年9月28日", desc: "儒教の開祖。『論語』を通じて東アジアの道徳や政治思想に多大な影響を与えた。" },
    { genre: "偉人", name: "ブッダ（ゴータマ・シッダールタ）", date: "紀元前5〜6世紀頃", desc: "仏教の開祖。四諦や八正道を説き、生きる苦しみからの解脱を教えた。" },
    { genre: "偉人", name: "イエス・キリスト", date: "紀元前4年頃", desc: "キリスト教の精神的基盤となったナザレの預言者。神の愛と許しを説いた。" },
    { genre: "偉人", name: "ムハンマド", date: "570年頃", desc: "イスラム教の開祖。神（アッラー）の啓示を受け、イスラム共同体を確立した。" },
    { genre: "偉人", name: "ソクラテス", date: "紀元前470年頃", desc: "「無知の知」を提唱し、対話を通じて真理を追究した古代ギリシャの哲学者。" },
    { genre: "偉人", name: "プラトン", date: "紀元前427年頃", desc: "ソクラテスの弟子。『国家』などを著し、イデア論を提唱した西洋哲学の祖。" },
    { genre: "偉人", name: "アリストテレス", date: "紀元前384年", desc: "万学の祖と呼ばれ、論理学、物理学、政治学などあらゆる分野を体系化した。" },
    { genre: "偉人", name: "ホメロス", date: "紀元前8世紀頃", desc: "古代ギリシャの盲目の詩人。『イリアス』『オデュッセイア』の二大叙事詩を残した。" },
    { genre: "偉人", name: "ダンテ・アリギエーリ", date: "1265/06/01", desc: "『神曲』を著し、イタリア文学の基礎を築くとともにルネサンスの先駆者となった。" },
    { genre: "偉人", name: "ヨハン・グーテンベルク", date: "1400年頃", desc: "活版印刷術を発明し、聖書などの大量印刷を可能にして知識の普及に貢献した。" },
    { genre: "偉人", name: "ニコラウス・コペルニクス", date: "1473/02/19", desc: "天動説が主流だった時代に、地球が太陽の周りを回っているとする地動説を唱えた。" },
    { genre: "偉人", name: "イマヌエル・カント", date: "1724/04/22", desc: "『純粋理性批判』を著し、認識論に大きな変革をもたらしたドイツの哲学者。" },
    { genre: "偉人", name: "フリードリヒ・ニーチェ", date: "1844/10/15", desc: "「神は死んだ」と言い放ち、永劫回帰や「超人」思想を唱えた哲学者。" },
    { genre: "偉人", name: "アンネ・フランク", date: "1929/06/12", desc: "ナチスの迫害から隠れ家で過ごした日々を『アンネの日記』として残したユダヤ人の少女。" },
    { genre: "偉人", name: "ヘレン・ケラー", date: "1880/06/27", desc: "視覚・聴覚の重複障害を乗り越え、障害者の教育・福祉のために世界中で活動した。" },
    { genre: "偉人", name: "フローレンス・ナイチンゲール", date: "1820/05/12", desc: "クリミア戦争で負傷兵の衛生管理を改善し、近代看護教育の基礎を築いた。" },
    { genre: "偉人", name: "杉原 千畝", date: "1900/01/01", desc: "第二次世界大戦中、リトアニア領事代理として「命のビザ」を発給し多くのユダヤ人を救った。" },
    { genre: "偉人", name: "マハティール・ビン・モハマド", date: "1925/07/10", desc: "マレーシア元首相。「ルックイースト政策」を進め、自国の急速な経済発展を主導。" },
    { genre: "偉人", name: "ネルソン・マンデラ", date: "1918/07/18", desc: "南アフリカのアパルトヘイト（人種隔離）撤廃に尽力し、初の黒人大統領となった。" },
    { genre: "偉人", name: "チェ・ゲバラ", date: "1928/06/14", desc: "キューバ革命をカストロと共に成功に導いた、アルゼンチン出身の伝説的革命家。" },
    { genre: "偉人", name: "ジョン・レノン", date: "1940/10/09", desc: "「ザ・ビートルズ」のリーダー。解散後も『イマジン』などで平和運動を展開。" },
    { genre: "偉人", name: "マイケル・ジャクソン", date: "1958/08/29", desc: "「キング・オブ・ポップ」と称され、『スリラー』の大ヒットやダンスで世界を魅了。" },
    { genre: "偉人", name: "ボブ・ディラン", date: "1941/05/24", desc: "メッセージ性の高い楽曲を作り続け、ミュージシャンとして初のノーベル文学賞を受賞。" },
    { genre: "偉人", name: "スティーヴン・ホーキング", date: "1942/01/08", desc: "ALSと闘いながらブラックホールの研究を進め、宇宙論に大きく貢献した物理学者。" },
    { genre: "偉人", name: "ジェームズ・ワット", date: "1736/01/19", desc: "蒸気機関を劇的に改良し、産業革命の原動力を提供したスコットランドの発明家。" },
    { genre: "偉人", name: "カール・ベンツ", date: "1844/11/25", desc: "ガソリンエンジン自動車を発明し、現代の自動車産業の基礎を築いたドイツの技師。" },
    { genre: "偉人", name: "ヘンリー・フォード", date: "1863/07/30", desc: "T型フォードの製造にベルトコンベア方式を導入し、自動車を大衆化させた。" },
    { genre: "偉人", name: "アンリ・デュナン", date: "1828/05/08", desc: "戦場の惨状を目撃したことから国際赤十字を創設し、第1回ノーベル平和賞を受賞。" },
    { genre: "偉人", name: "ジャン＝アンリ・ファーブル", date: "1823/12/21", desc: "膨大な観察をもとに『昆虫記』を執筆し、昆虫の生態を克明に伝えた博物学者。" },
    { genre: "偉人", name: "ルイス・キャロル", date: "1832/01/27", desc: "本業は数学者でありながら、『不思議の国のアリス』を執筆した児童文学作家。" },
    { genre: "偉人", name: "ハンス・クリスチャン・アンデルセン", date: "1805/04/02", desc: "『人魚姫』『マッチ売りの少女』など、世界中で愛される童話を残した「童話の王様」。" },
    { genre: "偉人", name: "ヤコブ・グリム", date: "1785/01/04", desc: "グリム兄弟の兄。弟と共にドイツの民話を収集して『グリム童話集』を編纂した。" },
    { genre: "偉人", name: "アガサ・クリスティ", date: "1890/09/15", desc: "名探偵ポアロやマープルを生み出し、「ミステリの女王」と称される小説家。" },
    { genre: "偉人", name: "アーネスト・ヘミングウェイ", date: "1899/07/21", desc: "『老人と海』『誰がために鐘は鳴る』などで知られるアメリカのノーベル賞作家。" },
    { genre: "偉人", name: "太宰 治", date: "1909/06/19", desc: "『人間失格』『走れメロス』など、人間の弱さや葛藤を描いた昭和の文豪。" },
    { genre: "偉人", name: "夏目 漱石", date: "1867/02/09", desc: "『吾輩は猫である』『こころ』など、日本近代文学の最高峰とされる作品を残した文豪。" },
    { genre: "偉人", name: "手塚 治虫", date: "1928/11/03", desc: "『鉄腕アトム』『ブラック・ジャック』を描き、ストーリー漫画の礎を築いた。" },
    { genre: "偉人", name: "黒澤 明", date: "1910/03/23", desc: "『七人の侍』『羅生門』などを監督し、世界の映画界に多大な影響を与えた巨匠。" },
    { genre: "偉人", name: "宮崎 駿", date: "1941/01/05", desc: "スタジオジブリを率い、『千と千尋の神隠し』などで世界的な評価を得た映画監督。" },
    { genre: "偉人", name: "葛飾 北斎", date: "1760/10/31", desc: "『富嶽三十六景』で知られ、海外の印象派の画家たちにも大きな影響を与えた浮世絵師。" },
    { genre: "偉人", name: "鑑真", date: "688年", desc: "唐の僧侶。5度もの失明の苦難を乗り越えて日本に渡り、正しい仏教の戒律を伝えた。" },
    { genre: "偉人", name: "マシュー・ペリー", date: "1794/04/10", desc: "黒船を率いて浦賀に来航し、鎖国をしていた日本に開国を迫ったアメリカの海軍提督。" },
    { genre: "偉人", name: "ニール・アームストロング", date: "1930/08/05", desc: "アポロ11号の船長として、1969年に人類で初めて月面に足跡を刻んだ宇宙飛行士。" },
    { genre: "偉人", name: "渋沢 栄一", date: "1840/03/16", desc: "約500もの企業の設立に関わり、日本の近代資本主義の基礎を築いた実業家。" },
    // 診断結果の「偉人」グループから図書館へ移動(2026-07-08)。渋沢栄一は上に既出のため除外。
    { genre: "偉人", name: "広岡 浅子", date: "1849/10/18", desc: "大同生命の創業などに関わった明治期の女性実業家。" },
    { genre: "偉人", name: "安倍 晋三", date: "1954/09/21", desc: "憲政史上最長の在任期間を務めた内閣総理大臣。" },
    { genre: "偉人", name: "御手洗 毅（キヤノン創業者）", date: "1901/03/11", desc: "キヤノンの創業に参画し社長を務めた実業家・医師。" },
    // 診断結果の「著名人」グループから図書館へ移動(2026-07-08)。
    { genre: "スポーツ", name: "マイク・タイソン", date: "1966/06/30", desc: "「鉄の拳」と呼ばれた元世界ヘビー級統一王者のボクサー。" },
    { genre: "思想・政治", name: "橋下　徹", date: "1969/06/29", desc: "弁護士・政治家。元大阪府知事・大阪市長。" },
    { genre: "文学", name: "樺沢　紫苑", date: "1965/10/27", desc: "精神科医・作家。『アウトプット大全』などの著書で知られる。" },
    { genre: "音楽", name: "misono", date: "1984/10/13", desc: "day after tomorrowを経てソロで活躍した歌手。" },
    { genre: "実業家", name: "斎藤　一人", date: "1948/08/03", desc: "「銀座まるかん」創業者の実業家・著述家。" },
    { genre: "実業家", name: "ひろゆき", date: "1976/11/16", desc: "「2ちゃんねる」開設者として知られる実業家・論客。" },
    { genre: "科学・発明", name: "池川　明", date: "1954/10/11", desc: "「胎内記憶」の研究で知られる産婦人科医。" },
    { genre: "思想・政治", name: "麻生　太郎", date: "1940/09/20", desc: "内閣総理大臣などを務めた政治家。" },
    { genre: "思想・政治", name: "高市　早苗", date: "1961/03/07", desc: "日本の政治家。" },
    { genre: "実業家", name: "鴨頭　嘉人", date: "1966/12/23", desc: "「話し方」で知られる講演家・YouTuber。" },
    { genre: "実業家", name: "中村　文昭", date: "1969/01/18", desc: "「人のご縁」をテーマに全国で講演する実業家・講演家。" },
    { genre: "実業家", name: "拓専務", date: "1975/05/21", desc: "" },
    { genre: "実業家", name: "バリのアニキ", date: "1966/01/12", desc: "" },
    { genre: "キャバ嬢", name: "進撃のノア", date: "1995/01/12", desc: "" },
    { genre: "キャバ嬢", name: "ひめか", date: "2000/10/27", desc: "" },
    { genre: "実業家", name: "小田桐　あさぎ", date: "1983/03/11", desc: "" },
    { genre: "芸能・エンタメ", name: "藤本　ジョニー", date: "1964/01/12", desc: "" },
    { genre: "実業家", name: "鈴木美歩", date: "1983/01/16", desc: "" },
    // ---- 著名人・偉人 追加(2026-07-08) ----
    { genre: "音楽", name: "エルヴィス・プレスリー", date: "1935/01/08", desc: "ロックンロールの象徴的存在" },
    { genre: "音楽", name: "マドンナ", date: "1958/08/16", desc: "ポップミュージック界を代表する歌手" },
    { genre: "音楽", name: "フレディ・マーキュリー", date: "1946/09/05", desc: "Queenのボーカル" },
    { genre: "音楽", name: "ヨハン・セバスティアン・バッハ", date: "1685/03/31", desc: "バロック音楽の巨匠" },
    { genre: "文学", name: "マーク・トウェイン", date: "1835/11/30", desc: "『トム・ソーヤーの冒険』の作者" },
    { genre: "芸術", name: "ミケランジェロ", date: "1475/03/06", desc: "『ダビデ像』やシスティーナ礼拝堂天井画を制作" },
    { genre: "芸術", name: "ラファエロ", date: "1483/04/06", desc: "ルネサンス三大巨匠の一人" },
    { genre: "思想・政治", name: "アブラハム・リンカーン", date: "1809/02/12", desc: "奴隷解放を推進したアメリカ大統領" },
    { genre: "思想・政治", name: "マーティン・ルーサー・キング・ジュニア", date: "1929/01/15", desc: "公民権運動を率いた" },
    { genre: "思想・政治", name: "ルートヴィヒ・ウィトゲンシュタイン", date: "1889/04/26", desc: "20世紀を代表する哲学者" },
    { genre: "思想・政治", name: "ジークムント・フロイト", date: "1856/05/06", desc: "精神分析学を創始した" },
    { genre: "芸能・エンタメ", name: "マリリン・モンロー", date: "1926/06/01", desc: "ハリウッドを代表する映画スター" },
    { genre: "芸能・エンタメ", name: "オードリー・ヘプバーン", date: "1929/05/04", desc: "『ローマの休日』で知られる名女優" },
    { genre: "芸能・エンタメ", name: "トム・ハンクス", date: "1956/07/09", desc: "『フォレスト・ガンプ』などで知られる" },
    { genre: "芸能・エンタメ", name: "ジャッキー・チェン", date: "1954/04/07", desc: "アクション映画の世界的スター" },
    { genre: "芸能・エンタメ", name: "ブルース・リー", date: "1940/11/27", desc: "世界にカンフーを広めた武術家" },
    { genre: "芸能・エンタメ", name: "アーノルド・シュワルツェネッガー", date: "1947/07/30", desc: "『ターミネーター』で有名な俳優" },
    { genre: "芸能・エンタメ", name: "ローワン・アトキンソン", date: "1955/01/06", desc: "「Mr.ビーン」で知られるコメディアン" },
    { genre: "芸能・エンタメ", name: "モーガン・フリーマン", date: "1937/06/01", desc: "重厚な演技とナレーションで知られる名優" },
    { genre: "スポーツ", name: "ペレ", date: "1940/10/23", desc: "「サッカーの王様」と呼ばれた伝説的選手" },
    { genre: "スポーツ", name: "ディエゴ・マラドーナ", date: "1960/10/30", desc: "1986年ワールドカップ優勝の立役者" },
    { genre: "スポーツ", name: "ジネディーヌ・ジダン", date: "1972/06/23", desc: "フランスを世界一に導いた名選手" },
    { genre: "スポーツ", name: "デビッド・ベッカム", date: "1975/05/02", desc: "正確なフリーキックで有名" },
    { genre: "スポーツ", name: "ベーブ・ルース", date: "1895/02/06", desc: "野球史を代表するホームラン王" },
    { genre: "スポーツ", name: "マイケル・ジョーダン", date: "1963/02/17", desc: "NBA史上最高の選手の一人" },
    { genre: "スポーツ", name: "コービー・ブライアント", date: "1978/08/23", desc: "NBAを代表するスター選手" },
    { genre: "スポーツ", name: "レブロン・ジェームズ", date: "1984/12/30", desc: "NBA歴代屈指のオールラウンダー" },
    { genre: "スポーツ", name: "ウサイン・ボルト", date: "1986/08/21", desc: "100m・200m世界記録保持者" },
    { genre: "スポーツ", name: "カール・ルイス", date: "1961/07/01", desc: "オリンピックで9個の金メダルを獲得" },
    { genre: "スポーツ", name: "モハメド・アリ", date: "1942/01/17", desc: "世界ヘビー級王者として伝説となった" },
    { genre: "スポーツ", name: "ロジャー・フェデラー", date: "1981/08/08", desc: "男子テニス界を代表する名選手" },
    { genre: "スポーツ", name: "ラファエル・ナダル", date: "1986/06/03", desc: "全仏オープン最多優勝" },
    { genre: "スポーツ", name: "ノバク・ジョコビッチ", date: "1987/05/22", desc: "四大大会で歴代最多級の優勝を誇る" },
    { genre: "スポーツ", name: "セリーナ・ウィリアムズ", date: "1981/09/26", desc: "女子テニス史上最高峰の選手" },
    { genre: "思想・政治", name: "西郷隆盛", date: "1828/01/23", desc: "明治維新を支えた中心人物" },
    { genre: "思想・政治", name: "勝海舟", date: "1823/03/12", desc: "江戸城無血開城を実現した" },
    { genre: "科学・発明", name: "北里柴三郎", date: "1853/01/29", desc: "破傷風菌研究などで近代医学に貢献した" },
    { genre: "文学", name: "芥川龍之介", date: "1892/03/01", desc: "『羅生門』『鼻』で知られる小説家" },
    { genre: "文学", name: "川端康成", date: "1899/06/14", desc: "日本人初のノーベル文学賞受賞者" },
    { genre: "文学", name: "三島由紀夫", date: "1925/01/14", desc: "『金閣寺』などで知られる文学者" },
    { genre: "文学", name: "司馬遼太郎", date: "1923/08/07", desc: "『竜馬がゆく』の作者" },
    { genre: "芸術", name: "藤子・F・不二雄", date: "1933/12/01", desc: "『ドラえもん』の作者" },
    { genre: "芸術", name: "鳥山明", date: "1955/04/05", desc: "『ドラゴンボール』の作者" },
    { genre: "芸術", name: "尾田栄一郎", date: "1975/01/01", desc: "『ONE PIECE』の作者" },
    { genre: "音楽", name: "美空ひばり", date: "1937/05/29", desc: "「昭和の歌姫」と呼ばれた国民的歌手" },
    { genre: "音楽", name: "坂本九", date: "1941/12/10", desc: "『上を向いて歩こう』を世界的ヒットにした" },
    { genre: "音楽", name: "MISIA", date: "1978/07/07", desc: "圧倒的な歌唱力で知られるシンガー" },
    { genre: "音楽", name: "浜崎あゆみ", date: "1978/10/02", desc: "平成を代表する女性アーティスト" },
    { genre: "芸能・エンタメ", name: "高倉健", date: "1931/02/16", desc: "日本映画を代表する名優" },
    { genre: "芸能・エンタメ", name: "吉永小百合", date: "1945/03/13", desc: "長年活躍する国民的女優" },
    { genre: "芸能・エンタメ", name: "石原裕次郎", date: "1934/12/28", desc: "昭和を代表するスター" },
    { genre: "芸能・エンタメ", name: "渥美清", date: "1928/03/10", desc: "『男はつらいよ』の車寅次郎役で有名" },
    { genre: "芸能・エンタメ", name: "志村けん", date: "1950/02/20", desc: "『8時だョ!全員集合』などで国民的人気" },
    { genre: "芸能・エンタメ", name: "所ジョージ", date: "1955/01/26", desc: "マルチな才能で活躍する芸能人" },
    { genre: "スポーツ", name: "王貞治", date: "1940/05/20", desc: "世界記録となる通算868本塁打を達成したレジェンド" },
    { genre: "スポーツ", name: "長嶋茂雄", date: "1936/02/20", desc: "「ミスタープロ野球」と呼ばれた国民的スター" },
    { genre: "スポーツ", name: "松井秀喜", date: "1974/06/12", desc: "MLBでも活躍し、ワールドシリーズMVPを受賞" },
    { genre: "スポーツ", name: "野茂英雄", date: "1968/08/31", desc: "日本人メジャーリーガーの先駆者" },
    { genre: "スポーツ", name: "浅田真央", date: "1990/09/25", desc: "世界中で人気を集めた女子フィギュア選手" },
    { genre: "スポーツ", name: "高橋尚子", date: "1972/05/06", desc: "女子マラソンで日本初のオリンピック金メダル" },
    { genre: "スポーツ", name: "吉田沙保里", date: "1982/10/05", desc: "世界大会で圧倒的な成績を残した" },
    { genre: "スポーツ", name: "内村航平", date: "1989/01/03", desc: "「キング・オブ・ジムナスト」と呼ばれた体操選手" },
    { genre: "スポーツ", name: "井上尚弥", date: "1993/04/10", desc: "世界4団体統一王者となった名ボクサー" },
    { genre: "スポーツ", name: "中田英寿", date: "1977/01/22", desc: "世界で活躍した日本サッカー界のパイオニア" },
    { genre: "スポーツ", name: "澤穂希", date: "1978/09/06", desc: "女子W杯優勝に貢献し、世界最優秀選手を受賞" },
    { genre: "スポーツ", name: "福原愛", date: "1988/11/01", desc: "「愛ちゃん」の愛称で親しまれた" },
    { genre: "スポーツ", name: "伊調馨", date: "1984/06/13", desc: "オリンピック4連覇を達成" },
    { genre: "スポーツ", name: "北島康介", date: "1982/09/22", desc: "「チョー気持ちいい」の名言でも有名" },
    { genre: "スポーツ", name: "池江璃花子", date: "2000/07/04", desc: "白血病を克服し競技復帰した競泳選手" },
    { genre: "スポーツ", name: "室伏広治", date: "1974/10/08", desc: "オリンピック金メダリスト" },
    { genre: "実業家", name: "本田宗一郎", date: "1906/11/17", desc: "Honda創業者" },
    { genre: "実業家", name: "盛田昭夫", date: "1921/01/26", desc: "ソニー共同創業者" },
    { genre: "実業家", name: "柳井正", date: "1949/02/07", desc: "ユニクロを世界的ブランドへ育てた" },
    { genre: "実業家", name: "安藤百福", date: "1910/03/05", desc: "インスタントラーメンを発明した" },
    { genre: "実業家", name: "岩崎弥太郎", date: "1835/01/09", desc: "三菱グループの礎を築いた" },
    { genre: "科学・発明", name: "豊田佐吉", date: "1867/02/14", desc: "トヨタグループ発展の礎を築いた" },
    { genre: "実業家", name: "豊田喜一郎", date: "1894/06/11", desc: "トヨタ自動車を創業した" },
    { genre: "芸能・エンタメ", name: "織田裕二", date: "1967/12/13", desc: "『踊る大捜査線』で国民的人気を獲得" },
    { genre: "芸能・エンタメ", name: "阿部寛", date: "1964/06/22", desc: "『TRICK』『ドラゴン桜』などの主演で知られる" },
    { genre: "芸能・エンタメ", name: "渡辺謙", date: "1959/10/21", desc: "ハリウッドでも活躍する国際派俳優" },
    { genre: "芸能・エンタメ", name: "真田広之", date: "1960/10/12", desc: "国内外で活躍し、世界的評価を受ける俳優" },
    { genre: "芸能・エンタメ", name: "高橋一生", date: "1980/12/09", desc: "映画・ドラマで幅広く活躍" },
    { genre: "芸能・エンタメ", name: "菅田将暉", date: "1993/02/21", desc: "映画・ドラマ・音楽で活躍" },
    { genre: "音楽", name: "福山雅治", date: "1969/02/06", desc: "シンガーソングライターとしても人気" },
    { genre: "音楽", name: "アデル", date: "1988/05/05", desc: "世界的ヒットを連発するシンガー" },
    { genre: "音楽", name: "ビヨンセ", date: "1981/09/04", desc: "世界的ポップスター" },
    { genre: "音楽", name: "レディー・ガガ", date: "1986/03/28", desc: "音楽と映画で活躍" },
    { genre: "音楽", name: "エド・シーラン", date: "1991/02/17", desc: "世界的人気のシンガーソングライター" },
    { genre: "音楽", name: "ジャスティン・ビーバー", date: "1994/03/01", desc: "若くして世界的スターとなった" },
    { genre: "音楽", name: "ブルーノ・マーズ", date: "1985/10/08", desc: "グラミー賞を多数受賞したアーティスト" },
    { genre: "音楽", name: "セリーヌ・ディオン", date: "1968/03/30", desc: "『タイタニック』主題歌で有名" },
    { genre: "音楽", name: "ホイットニー・ヒューストン", date: "1963/08/09", desc: "世界的な歌唱力で知られる" },
    { genre: "音楽", name: "プリンス", date: "1958/06/07", desc: "革新的な音楽で世界に影響を与えた" },
    { genre: "芸能・エンタメ", name: "スティーヴン・スピルバーグ", date: "1946/12/18", desc: "『E.T.』『ジュラシック・パーク』などを監督" },
    { genre: "芸能・エンタメ", name: "ジェームズ・キャメロン", date: "1954/08/16", desc: "『タイタニック』『アバター』を監督" },
    { genre: "芸能・エンタメ", name: "ジョージ・ルーカス", date: "1944/05/14", desc: "『スター・ウォーズ』の生みの親" },
    { genre: "芸能・エンタメ", name: "アルフレッド・ヒッチコック", date: "1899/08/13", desc: "サスペンス映画の巨匠" },
    { genre: "芸能・エンタメ", name: "クエンティン・タランティーノ", date: "1963/03/27", desc: "独特な演出で知られる監督" },
    { genre: "芸術", name: "スタン・リー", date: "1922/12/28", desc: "マーベル作品の生みの親" },
    { genre: "文学", name: "ジョージ・オーウェル", date: "1903/06/25", desc: "『1984年』の作者" },
    { genre: "文学", name: "J・K・ローリング", date: "1965/07/31", desc: "『ハリー・ポッター』シリーズの作者" },
    { genre: "文学", name: "ヴィクトル・ユーゴー", date: "1802/02/26", desc: "『レ・ミゼラブル』の作者" },
    { genre: "文学", name: "レフ・トルストイ", date: "1828/09/09", desc: "『戦争と平和』を著した文豪" },
    { genre: "文学", name: "フョードル・ドストエフスキー", date: "1821/11/11", desc: "『罪と罰』の作者" },
    { genre: "文学", name: "フランツ・カフカ", date: "1883/07/03", desc: "『変身』で知られる文学者" },
    { genre: "文学", name: "ジョージ・バーナード・ショー", date: "1856/07/26", desc: "ノーベル文学賞受賞" },
    { genre: "文学", name: "ヨハン・ヴォルフガング・フォン・ゲーテ", date: "1749/08/28", desc: "『ファウスト』の作者" },
    { genre: "文学", name: "セルバンテス", date: "1547/09/29", desc: "『ドン・キホーテ』の作者" },
    { genre: "芸能・エンタメ", name: "ロバート・ダウニー・Jr.", date: "1965/04/04", desc: "アイアンマン役で有名" },
    { genre: "芸能・エンタメ", name: "ジョニー・デップ", date: "1963/06/09", desc: "『パイレーツ・オブ・カリビアン』主演" },
    { genre: "芸能・エンタメ", name: "ブラッド・ピット", date: "1963/12/18", desc: "世界的人気を誇るハリウッドスター" },
    { genre: "芸能・エンタメ", name: "トム・クルーズ", date: "1962/07/03", desc: "『ミッション:インポッシブル』シリーズで有名" },
    { genre: "芸能・エンタメ", name: "キアヌ・リーブス", date: "1964/09/02", desc: "『マトリックス』『ジョン・ウィック』主演" },
    { genre: "芸能・エンタメ", name: "ウィル・スミス", date: "1968/09/25", desc: "映画・音楽で活躍するエンターテイナー" },
    { genre: "芸能・エンタメ", name: "ジュリア・ロバーツ", date: "1967/10/28", desc: "『プリティ・ウーマン』主演" },
    { genre: "芸能・エンタメ", name: "メリル・ストリープ", date: "1949/06/22", desc: "アカデミー賞受賞多数の名女優" },
    { genre: "芸能・エンタメ", name: "アンジェリーナ・ジョリー", date: "1975/06/04", desc: "女優・映画監督・人道活動家として活躍" },
    { genre: "思想・政治", name: "アン・フランク", date: "1929/06/12", desc: "『アンネの日記』の著者" },
    { genre: "科学・発明", name: "グレゴール・メンデル", date: "1822/07/20", desc: "遺伝学の父" },
    { genre: "科学・発明", name: "ユーリイ・ガガーリン", date: "1934/03/09", desc: "人類初の宇宙飛行を成功させた" },
    { genre: "科学・発明", name: "リチャード・ファインマン", date: "1918/05/11", desc: "ノーベル物理学賞受賞、量子電磁力学に貢献" },
    { genre: "科学・発明", name: "カール・セーガン", date: "1934/11/09", desc: "宇宙科学の普及に大きく貢献" },
    { genre: "科学・発明", name: "アルフレッド・ノーベル", date: "1833/10/21", desc: "ダイナマイトを発明し、ノーベル賞を創設" },
    { genre: "科学・発明", name: "ライト兄弟", date: "1867/04/16", desc: "世界初の動力飛行機の飛行に成功したウィルバー" },
    { genre: "科学・発明", name: "グリエルモ・マルコーニ", date: "1874/04/25", desc: "無線通信技術を実用化" },
    { genre: "科学・発明", name: "ジェームズ・クック", date: "1728/11/07", desc: "太平洋各地を探検した航海者" },
    { genre: "科学・発明", name: "アメリア・イアハート", date: "1897/07/24", desc: "女性航空界の先駆者" },
    { genre: "科学・発明", name: "ジャック・クストー", date: "1910/06/11", desc: "海洋探査で世界的に活躍" },
    { genre: "科学・発明", name: "ジェーン・グドール", date: "1934/04/03", desc: "チンパンジー研究の第一人者" },
    { genre: "科学・発明", name: "デイビッド・アッテンボロー", date: "1926/05/08", desc: "自然ドキュメンタリーで世界的に有名" },
    { genre: "思想・政治", name: "マリア・モンテッソーリ", date: "1870/08/31", desc: "モンテッソーリ教育法を考案" },
    { genre: "科学・発明", name: "ジャン・ピアジェ", date: "1896/08/09", desc: "発達心理学の基礎を築いた" },
    { genre: "科学・発明", name: "カール・ユング", date: "1875/07/26", desc: "分析心理学の創始者" },
    { genre: "科学・発明", name: "アブラハム・マズロー", date: "1908/04/01", desc: "欲求段階説を提唱" },
    { genre: "科学・発明", name: "B・F・スキナー", date: "1904/03/20", desc: "行動分析学を発展させた" },
    { genre: "芸術", name: "クロード・モネ", date: "1840/11/14", desc: "印象派を代表する画家" },
    { genre: "芸術", name: "サルバドール・ダリ", date: "1904/05/11", desc: "シュルレアリスムを代表する画家" },
    { genre: "芸術", name: "アンリ・マティス", date: "1869/12/31", desc: "20世紀を代表する画家" },
    { genre: "芸術", name: "レンブラント", date: "1606/07/15", desc: "オランダ黄金時代を代表する画家" },
    { genre: "芸術", name: "ヨハネス・フェルメール", date: "1632/10/31", desc: "『真珠の耳飾りの少女』で知られる" },
    { genre: "音楽", name: "ヨハン・シュトラウス2世", date: "1825/10/25", desc: "『美しく青きドナウ』を作曲" },
    { genre: "音楽", name: "フレデリック・ショパン", date: "1810/03/01", desc: "「ピアノの詩人」と呼ばれる" },
    { genre: "音楽", name: "ヨハネス・ブラームス", date: "1833/05/07", desc: "ロマン派を代表する作曲家" },
    { genre: "音楽", name: "ピョートル・チャイコフスキー", date: "1840/05/07", desc: "『白鳥の湖』などを作曲" },
    { genre: "音楽", name: "ジュゼッペ・ヴェルディ", date: "1813/10/10", desc: "『アイーダ』などのオペラを作曲" },
    { genre: "音楽", name: "リヒャルト・ワーグナー", date: "1813/05/22", desc: "楽劇を確立した作曲家" },
    { genre: "音楽", name: "ヨハン・パッヘルベル", date: "1653/09/01", desc: "『カノン』で有名" },
    { genre: "音楽", name: "アントニオ・ヴィヴァルディ", date: "1678/03/04", desc: "『四季』を作曲" },
    { genre: "音楽", name: "フランツ・シューベルト", date: "1797/01/31", desc: "『魔王』などを作曲" },
    { genre: "音楽", name: "フランツ・リスト", date: "1811/10/22", desc: "19世紀を代表するピアニスト・作曲家" },
    { genre: "芸能・エンタメ", name: "ミケランジェロ・アントニオーニ", date: "1912/09/29", desc: "世界の芸術映画に大きな影響を与えた" },
    { genre: "芸能・エンタメ", name: "オーソン・ウェルズ", date: "1915/05/06", desc: "『市民ケーン』で知られる" },
    { genre: "音楽", name: "フランク・シナトラ", date: "1915/12/12", desc: "20世紀を代表するエンターテイナー" },
    { genre: "音楽", name: "レイ・チャールズ", date: "1930/09/23", desc: "ソウルミュージックの先駆者" },
    { genre: "音楽", name: "スティーヴィー・ワンダー", date: "1950/05/13", desc: "グラミー賞を多数受賞した音楽家" },
    { genre: "音楽", name: "ジョン・ウィリアムズ", date: "1932/02/08", desc: "『スター・ウォーズ』など映画音楽の巨匠" },
    { genre: "音楽", name: "ハンス・ジマー", date: "1957/09/12", desc: "『ライオン・キング』『インセプション』などを作曲" },
    { genre: "音楽", name: "エンニオ・モリコーネ", date: "1928/11/10", desc: "映画音楽の巨匠" },
    { genre: "芸術", name: "安藤忠雄", date: "1941/09/13", desc: "世界的に評価される建築家" },
    { genre: "芸術", name: "ル・コルビュジエ", date: "1887/10/06", desc: "近代建築の巨匠" },
    { genre: "芸術", name: "フランク・ロイド・ライト", date: "1867/06/08", desc: "近代建築を代表する建築家" },
    { genre: "芸術", name: "アントニ・ガウディ", date: "1852/06/25", desc: "サグラダ・ファミリアを設計" },
    { genre: "芸術", name: "岡本太郎", date: "1911/02/26", desc: "「太陽の塔」を制作" },
    { genre: "芸術", name: "草間彌生", date: "1929/03/22", desc: "水玉模様の作品で世界的に有名" },
    { genre: "芸術", name: "奈良美智", date: "1959/12/05", desc: "現代アートを代表する作家" },
    { genre: "芸術", name: "村上隆", date: "1962/02/01", desc: "「スーパーフラット」理論で知られる" },
    { genre: "スポーツ", name: "羽生善治", date: "1970/09/27", desc: "将棋界初の永世七冠を達成" },
    { genre: "スポーツ", name: "藤井聡太", date: "2002/07/19", desc: "史上最年少で数々のタイトルを獲得" },
    // ---- フォーブス長者番付(2013-2026)＋富家 ----
    { genre: "フォーブス世界2026", name: "イーロン・マスク", date: "1971/06/28", desc: "1位 テスラ・スペースX｜EVや宇宙ロケット、AI（xAI）事業を牽引。" },
    { genre: "フォーブス世界2026", name: "ラリー・ペイジ", date: "1973/03/26", desc: "2位 Google｜Googleの共同創業者。検索エンジンのアルゴリズムを開発。" },
    { genre: "フォーブス世界2026", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "3位 Google｜Googleの共同創業者。ネットの歴史を変えた。" },
    { genre: "フォーブス世界2026", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "4位 Amazon｜Amazonの創業者。ECとクラウド（AWS）の帝国を築く。" },
    { genre: "フォーブス世界2026", name: "マイケル・デル", date: "1965/02/23", desc: "5位 デル・テクノロジーズ｜デルの創業者。PC直販モデルを確立、AIサーバーで急成長。" },
    { genre: "フォーブス世界2026", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "6位 Meta（Facebook）｜Facebookの創業者。SNSの世界的覇権を握る。" },
    { genre: "フォーブス世界2026", name: "ラリー・エリソン", date: "1944/08/17", desc: "7位 オラクル｜データベース大手オラクルの共同創業者。" },
    { genre: "フォーブス世界2026", name: "ジェンセン・ファン", date: "1963/02/17", desc: "8位 NVIDIA｜NVIDIAの共同創業者。生成AIブームでGPU需要が爆発。" },
    { genre: "フォーブス世界2026", name: "ベルナール・アルノー", date: "1949/03/05", desc: "9位 LVMH｜ルイ・ヴィトンやディオールを傘下に持つ高級ブランド帝国の総帥。" },
    { genre: "フォーブス世界2026", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "10位 バークシャー・ハサウェイ｜「投資の神様」と呼ばれる世界一有名な投資家。" },
    { genre: "フォーブス世界2026", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "11位 インディテックス（ZARA）｜ファストファッション「ZARA」の創業者。" },
    { genre: "フォーブス世界2026", name: "ジム・ウォルトン", date: "1948/06/07", desc: "12位 ウォルマート｜ウォルマート創業者の三男。" },
    { genre: "フォーブス世界2026", name: "ロブ・ウォルトン", date: "1944/10/28", desc: "13位 ウォルマート｜ウォルマート創業者の長男。元会長。" },
    { genre: "フォーブス世界2026", name: "アリス・ウォルトン", date: "1949/10/07", desc: "14位 ウォルマート｜ウォルマート創業者の長女。アートコレクター。" },
    { genre: "フォーブス世界2026", name: "スティーブ・バルマー", date: "1956/03/24", desc: "15位 マイクロソフト｜マイクロソフトの元CEO。NBAクリッパーズのオーナー。" },
    { genre: "フォーブス世界2026", name: "カルロス・スリム", date: "1940/01/28", desc: "16位 テルメックス｜ラテンアメリカ最大の富豪。" },
    { genre: "フォーブス世界2026", name: "チャンポン・ジャオ", date: "1977/02/05", desc: "17位 バイナンス｜世界最大の暗号資産取引所「Binance」の創業者。" },
    { genre: "フォーブス世界2026", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "18位 ブルームバーグ｜金融情報メディアの創業者。元ニューヨーク市長。" },
    { genre: "フォーブス世界2026", name: "トーマス・ピーターフィ", date: "1944/11/17", desc: "19位 インタラクティブ・ブローカーズ｜電子取引のパイオニア。格安オンライン証券で巨万の富。" },
    { genre: "フォーブス世界2026", name: "ビル・ゲイツ", date: "1955/10/28", desc: "20位 マイクロソフト｜マイクロソフトの共同創業者。現在は慈善活動に注力。" },
    { genre: "フォーブス世界2026", name: "ムケシュ・アンバニ", date: "1957/04/19", desc: "21位 リライアンス・インダストリーズ｜インド最大のエネルギー・通信複合企業のトップ。" },
    { genre: "フォーブス世界2026", name: "フランソワーズ・ベッテンコート・メイヤーズ", date: "1953/07/10", desc: "22位 ロレアル｜化粧品大手ロレアル創業者の孫。世界一の女性富豪。" },
    { genre: "フォーブス世界2026", name: "ガウタム・アダニ", date: "1962/06/24", desc: "23位 アダニ・グループ｜インフラ・港湾・エネルギーで急成長したインドの財閥。" },
    { genre: "フォーブス世界2026", name: "ジュリア・コック", date: "1962/04/12", desc: "24位 コック・インダストリーズ｜米複合企業コックの莫大な遺産を相続。" },
    { genre: "フォーブス世界2026", name: "チャールズ・コック", date: "1935/11/01", desc: "25位 コック・インダストリーズ｜同社を米最大級の非公開企業に育てた経営者。" },
    { genre: "フォーブス世界2026", name: "鍾睒睒（ジョン・シャンシャン）", date: "1954/12/04", desc: "26位 農夫山泉｜中国のボトル飲料水の王。" },
    { genre: "フォーブス世界2026", name: "馬化騰（ポニー・マー）", date: "1971/10/29", desc: "27位 テンセント｜WeChatやゲームで知られる中国IT大手の創業者。" },
    { genre: "フォーブス世界2026", name: "張一鳴（チャン・イーミン）", date: "1983/04/01", desc: "28位 バイトダンス｜「TikTok」の創業者。" },
    { genre: "フォーブス世界2026", name: "ジェフ・ヤス", date: "1956/05/18", desc: "29位 サスケハナ・インターナショナル｜取引・投資会社を設立。TikTokへの初期投資で大成功。" },
    { genre: "フォーブス世界2026", name: "ヘルマン・ラリア・モタ・ベラスコ", date: "1953/10/26", desc: "30位 グルポ・メヒコ｜メキシコ最大の採鉱企業のCEO。" },
    { genre: "フォーブス世界2025", name: "イーロン・マスク", date: "1971/06/28", desc: "1位 テスラ・スペースX｜テスラ株の回復やスペースX、xAIの成長で首位を盤石に。" },
    { genre: "フォーブス世界2025", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "2位 Meta（Facebook）｜AI投資の成功と株価急騰で一時2位へ躍進。" },
    { genre: "フォーブス世界2025", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "3位 Amazon｜ECとAWSの順調な業績でトップ3を維持。" },
    { genre: "フォーブス世界2025", name: "ラリー・エリソン", date: "1944/08/17", desc: "4位 オラクル｜クラウド・AIインフラ需要の拡大で資産を大幅に伸ばす。" },
    { genre: "フォーブス世界2025", name: "ベルナール・アルノー", date: "1949/03/05", desc: "5位 LVMH｜高級ブランドの世界的需要に乗り欧州トップを維持。" },
    { genre: "フォーブス世界2025", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "6位 バークシャー・ハサウェイ｜堅実なバリュー投資で世界中から崇拝される重鎮。" },
    { genre: "フォーブス世界2025", name: "ラリー・ペイジ", date: "1973/03/26", desc: "7位 Google｜Google共同創業者。Alphabetの主要株主。" },
    { genre: "フォーブス世界2025", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "8位 Google｜Googleを共同創業。検索システムを構築。" },
    { genre: "フォーブス世界2025", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "9位 インディテックス（ZARA）｜圧倒的なサプライチェーンを誇るZARAの創業者。" },
    { genre: "フォーブス世界2025", name: "スティーブ・バルマー", date: "1956/03/24", desc: "10位 マイクロソフト｜元CEO。保有する莫大な株式でランクイン。" },
    { genre: "フォーブス世界2025", name: "ロブ・ウォルトン", date: "1944/10/28", desc: "11位 ウォルマート｜ウォルマート創業者の長男。" },
    { genre: "フォーブス世界2025", name: "ジム・ウォルトン", date: "1948/06/07", desc: "12位 ウォルマート｜ウォルマート創業者の三男。一族の銀行も運営。" },
    { genre: "フォーブス世界2025", name: "マイケル・デル", date: "1965/02/23", desc: "13位 デル・テクノロジーズ｜PC直販を開拓、現在はサーバー事業に注力。" },
    { genre: "フォーブス世界2025", name: "アリス・ウォルトン", date: "1949/10/07", desc: "14位 ウォルマート｜ウォルマート創業者の長女。著名な美術品コレクター。" },
    { genre: "フォーブス世界2025", name: "ジェンセン・ファン", date: "1963/02/17", desc: "15位 NVIDIA｜生成AIブームの中心NVIDIAを率いトップ15へ猛追。" },
    { genre: "フォーブス世界2025", name: "カルロス・スリム", date: "1940/01/28", desc: "16位 テルメックス｜メキシコ・中南米の通信網を支配。" },
    { genre: "フォーブス世界2025", name: "チャンポン・ジャオ", date: "1977/02/05", desc: "17位 バイナンス｜仮想通貨取引所Binanceの創業者。" },
    { genre: "フォーブス世界2025", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "18位 ブルームバーグ｜金融端末・メディア大手の創業者。" },
    { genre: "フォーブス世界2025", name: "ビル・ゲイツ", date: "1955/10/28", desc: "19位 マイクロソフト｜共同創業者。ゲイツ財団で活動。" },
    { genre: "フォーブス世界2025", name: "フランソワーズ・ベッテンコート・メイヤーズ", date: "1953/07/10", desc: "20位 ロレアル｜ロレアルの相続人。女性首位。" },
    { genre: "フォーブス世界2025", name: "ムケシュ・アンバニ", date: "1957/04/19", desc: "21位 リライアンス・インダストリーズ｜インド最大の民間企業を率いる大富豪。" },
    { genre: "フォーブス世界2025", name: "ジャンカルロ・デヴァシーニ", date: "", desc: "22位 テザー（Tether）｜ステーブルコインUSDTを発行するテザー社のCFO。" },
    { genre: "フォーブス世界2025", name: "トーマス・ピーターフィ", date: "1944/11/17", desc: "23位 インタラクティブ・ブローカーズ｜オンライン証券の先駆者。" },
    { genre: "フォーブス世界2025", name: "ジュリア・コック", date: "1962/04/12", desc: "24位 コック・インダストリーズ｜米最大級の非上場企業の遺産を相続。" },
    { genre: "フォーブス世界2025", name: "チャールズ・コック", date: "1935/11/01", desc: "25位 コック・インダストリーズ｜石油・化学・エネルギーの巨大企業の経営トップ。" },
    { genre: "フォーブス世界2025", name: "張一鳴（チャン・イーミン）", date: "1983/04/01", desc: "26位 バイトダンス｜TikTokを生み出しSNSの勢力図を塗り替えた。" },
    { genre: "フォーブス世界2025", name: "鍾睒睒（ジョン・シャンシャン）", date: "1954/12/04", desc: "27位 農夫山泉｜中国ミネラルウォーター最大手・製薬会社の創業者。" },
    { genre: "フォーブス世界2025", name: "ジェフ・ヤス", date: "1956/05/18", desc: "28位 サスケハナ・インターナショナル｜投資会社を設立。TikTok初期投資で知られる。" },
    { genre: "フォーブス世界2025", name: "ディーター・シュワルツ", date: "1939/09/24", desc: "29位 シュワルツ・グループ｜ドイツの格安スーパーLidlを展開する流通の王。" },
    { genre: "フォーブス世界2025", name: "ヘルマン・ラリア・モタ・ベラスコ", date: "1953/10/26", desc: "30位 グルポ・メヒコ｜メキシコ最大の鉱業企業を率いる実業家。" },
    { genre: "フォーブス世界2024", name: "ベルナール・アルノー", date: "1949/03/05", desc: "1位 LVMH｜75の高級ブランドを傘下に持つ帝国の総帥。" },
    { genre: "フォーブス世界2024", name: "イーロン・マスク", date: "1971/06/28", desc: "2位 テスラ・スペースX｜EV普及・宇宙開発をリード。xAIでAIへ本格進出。" },
    { genre: "フォーブス世界2024", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "3位 Amazon｜Amazonを創業し世界最大のEC・クラウドへ育成。" },
    { genre: "フォーブス世界2024", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "4位 Meta（Facebook）｜Metaへ社名変更しAIとメタバースへ舵を切る。" },
    { genre: "フォーブス世界2024", name: "ラリー・エリソン", date: "1944/08/17", desc: "5位 オラクル｜オラクル共同創業者。クラウド事業を推進。" },
    { genre: "フォーブス世界2024", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "6位 バークシャー・ハサウェイ｜「オマハの賢人」。長期・バリュー投資で富を築く。" },
    { genre: "フォーブス世界2024", name: "ビル・ゲイツ", date: "1955/10/28", desc: "7位 マイクロソフト｜共同創業者。現在は慈善活動に奔走。" },
    { genre: "フォーブス世界2024", name: "スティーブ・バルマー", date: "1956/03/24", desc: "8位 マイクロソフト｜2代目CEO。保有株式でランクイン。" },
    { genre: "フォーブス世界2024", name: "ムケシュ・アンバニ", date: "1957/04/19", desc: "9位 リライアンス・インダストリーズ｜石油・小売・通信を独占するインド最大の民間企業。" },
    { genre: "フォーブス世界2024", name: "ラリー・ペイジ", date: "1973/03/26", desc: "10位 Google｜Google共同創業者。検索エンジンの基礎を作る。" },
    { genre: "フォーブス世界2024", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "11位 Google｜Googleを共同創業。ネット広告の基盤を開発。" },
    { genre: "フォーブス世界2024", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "12位 ブルームバーグ｜金融端末の創業者。元NY市長。" },
    { genre: "フォーブス世界2024", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "13位 インディテックス（ZARA）｜スピード経営のZARAの創業者。" },
    { genre: "フォーブス世界2024", name: "カルロス・スリム", date: "1940/01/28", desc: "14位 テルメックス｜中南米の通信網を牛耳る富豪。" },
    { genre: "フォーブス世界2024", name: "フランソワーズ・ベッテンコート・メイヤーズ", date: "1953/07/10", desc: "15位 ロレアル｜ロレアル創業者の孫。世界で最も裕福な女性。" },
    { genre: "フォーブス世界2024", name: "マイケル・デル", date: "1965/02/23", desc: "16位 デル・テクノロジーズ｜PC直販を確立。サーバー需要で成長。" },
    { genre: "フォーブス世界2024", name: "ガウタム・アダニ", date: "1962/06/24", desc: "17位 アダニ・グループ｜インフラ・港湾・エネルギーのインド大財閥。" },
    { genre: "フォーブス世界2024", name: "ロブ・ウォルトン", date: "1944/10/28", desc: "18位 ウォルマート｜ウォルマート創業者の長男。" },
    { genre: "フォーブス世界2024", name: "ジム・ウォルトン", date: "1948/06/07", desc: "19位 ウォルマート｜ウォルマート創業者の三男。" },
    { genre: "フォーブス世界2024", name: "ジェンセン・ファン", date: "1963/02/17", desc: "20位 NVIDIA｜AIブームでGPU需要が急伸しトップ20入り。" },
    { genre: "フォーブス世界2024", name: "アリス・ウォルトン", date: "1949/10/07", desc: "21位 ウォルマート｜ウォルマート創業者の長女。美術館設立で知られる。" },
    { genre: "フォーブス世界2024", name: "鍾睒睒（ジョン・シャンシャン）", date: "1954/12/04", desc: "22位 農夫山泉｜中国ミネラルウォーター最大手の創業者。" },
    { genre: "フォーブス世界2024", name: "ジュリア・コック", date: "1962/04/12", desc: "23位 コック・インダストリーズ｜米複合企業コックの資産を相続。" },
    { genre: "フォーブス世界2024", name: "チャールズ・コック", date: "1935/11/01", desc: "24位 コック・インダストリーズ｜石油・エネルギーの巨大企業を育てた実業家。" },
    { genre: "フォーブス世界2024", name: "ディーター・シュワルツ", date: "1939/09/24", desc: "25位 シュワルツ・グループ｜欧州の超巨大格安スーパーLidlのトップ。" },
    { genre: "フォーブス世界2024", name: "ジョバンニ・フェレロ", date: "1964/09/21", desc: "26位 フェレロ｜「ヌテラ」「フェレロ ロシェ」の菓子メーカー。" },
    { genre: "フォーブス世界2024", name: "張一鳴（チャン・イーミン）", date: "1983/04/01", desc: "27位 バイトダンス｜TikTokの開発元を創業。ショート動画市場を開拓。" },
    { genre: "フォーブス世界2024", name: "柳井正", date: "1949/02/07", desc: "28位 ファーストリテイリング｜ユニクロを運営。日本から唯一トップ30入り。" },
    { genre: "フォーブス世界2024", name: "フィル・ナイト", date: "1938/02/24", desc: "29位 NIKE｜スポーツブランド「ナイキ」の共同創業者。" },
    { genre: "フォーブス世界2024", name: "マーク・メイトシッツ", date: "1992/05/07", desc: "30位 レッドブル｜エナジードリンク「レッドブル」共同創業者の遺産を相続。" },
    { genre: "フォーブス世界2023", name: "ベルナール・アルノー", date: "1949/03/05", desc: "1位 LVMH｜高級ブランドの記録的業績で初の年間世界1位に。" },
    { genre: "フォーブス世界2023", name: "イーロン・マスク", date: "1971/06/28", desc: "2位 テスラ・スペースX｜X買収やテスラ株下落が重なり2位へ後退。" },
    { genre: "フォーブス世界2023", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "3位 Amazon｜株低迷期ながら巨大な資産で3位をキープ。" },
    { genre: "フォーブス世界2023", name: "ラリー・エリソン", date: "1944/08/17", desc: "4位 オラクル｜クラウドの成長で資産を維持。" },
    { genre: "フォーブス世界2023", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "5位 バークシャー・ハサウェイ｜市場不安の中、安定したバリュー投資の強み。" },
    { genre: "フォーブス世界2023", name: "ビル・ゲイツ", date: "1955/10/28", desc: "6位 マイクロソフト｜巨額の慈善寄付を行いつつ上位を維持。" },
    { genre: "フォーブス世界2023", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "7位 ブルームバーグ｜金融情報端末ビジネスの独占的地位を強固に。" },
    { genre: "フォーブス世界2023", name: "カルロス・スリム", date: "1940/01/28", desc: "8位 テルメックス｜ペソ高の恩恵で中南米最大の富豪。" },
    { genre: "フォーブス世界2023", name: "ムケシュ・アンバニ", date: "1957/04/19", desc: "9位 リライアンス・インダストリーズ｜石油化学から小売・通信へ広げるインド一の富豪。" },
    { genre: "フォーブス世界2023", name: "スティーブ・バルマー", date: "1956/03/24", desc: "10位 マイクロソフト｜元CEO。配当・株価の底堅さでトップ10入り。" },
    { genre: "フォーブス世界2023", name: "ラリー・ペイジ", date: "1973/03/26", desc: "11位 Google｜Alphabet共同創業者。" },
    { genre: "フォーブス世界2023", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "12位 Google｜Googleを共同創業。広告事業の基盤を構築。" },
    { genre: "フォーブス世界2023", name: "フランソワーズ・ベッテンコート・メイヤーズ", date: "1953/07/10", desc: "13位 ロレアル｜3年連続で世界最高額の女性富豪。" },
    { genre: "フォーブス世界2023", name: "鍾睒睒（ジョン・シャンシャン）", date: "1954/12/04", desc: "14位 農夫山泉｜飲料水のヒットで中国トップ富豪を維持。" },
    { genre: "フォーブス世界2023", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "15位 インディテックス（ZARA）｜SPAの先駆者。店舗網の回復で躍進。" },
    { genre: "フォーブス世界2023", name: "ジム・ウォルトン", date: "1948/06/07", desc: "16位 ウォルマート｜ウォルマート創業者一族。" },
    { genre: "フォーブス世界2023", name: "ロブ・ウォルトン", date: "1944/10/28", desc: "17位 ウォルマート｜ウォルマート元会長。創業者の長男。" },
    { genre: "フォーブス世界2023", name: "アリス・ウォルトン", date: "1949/10/07", desc: "18位 ウォルマート｜創業者の長女。芸術分野へ多大な投資。" },
    { genre: "フォーブス世界2023", name: "チャールズ・コック", date: "1935/11/01", desc: "19位 コック・インダストリーズ｜米の巨大非上場複合企業を運営。" },
    { genre: "フォーブス世界2023", name: "ジュリア・コック", date: "1962/04/12", desc: "20位 コック・インダストリーズ｜夫の遺産である複合企業株の42%を相続。" },
    { genre: "フォーブス世界2023", name: "デビッド・トムソン", date: "1957/06/12", desc: "21位 トムソン・ロイター｜カナダ最大のメディア・情報通信社の一族トップ。" },
    { genre: "フォーブス世界2023", name: "マイケル・デル", date: "1965/02/23", desc: "22位 デル・テクノロジーズ｜PC直販から企業向けITへの転換に成功。" },
    { genre: "フォーブス世界2023", name: "張一鳴（チャン・イーミン）", date: "1983/04/01", desc: "23位 バイトダンス｜TikTokを世界的社会現象に押し上げた。" },
    { genre: "フォーブス世界2023", name: "フィル・ナイト", date: "1938/02/24", desc: "24位 NIKE｜世界の「ナイキ」を創業。" },
    { genre: "フォーブス世界2023", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "25位 Meta（Facebook）｜メタバースへの過剰投資懸念で一時25位前後へ。" },
    { genre: "フォーブス世界2023", name: "ロドルフ・サアデ", date: "", desc: "26位 CMA CGM｜フランスの大手海運・コンテナ輸送を継承。" },
    { genre: "フォーブス世界2023", name: "ジャクリーン・マース", date: "1939/10/10", desc: "27位 マーズ｜M&M'sやペットフード大手マーズの株式を相続。" },
    { genre: "フォーブス世界2023", name: "ジョン・マース", date: "1936/10/15", desc: "28位 マーズ｜ジャクリーン氏の兄。巨大菓子メーカーの株式を保有。" },
    { genre: "フォーブス世界2023", name: "ジョバンニ・フェレロ", date: "1964/09/21", desc: "29位 フェレロ｜「フェレロ ロシェ」「ヌテラ」のイタリア菓子王。" },
    { genre: "フォーブス世界2023", name: "馬化騰（ポニー・マー）", date: "1971/10/29", desc: "30位 テンセント｜WeChatやゲームのプラットフォームを運営。" },
    { genre: "フォーブス世界2022", name: "イーロン・マスク", date: "1971/06/28", desc: "1位 テスラ・スペースX｜テスラ株の急騰で初めて世界長者番付の頂点に。" },
    { genre: "フォーブス世界2022", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "2位 Amazon｜首位をイーロンに譲るも圧倒的資産を維持。" },
    { genre: "フォーブス世界2022", name: "ベルナール・アルノー", date: "1949/03/05", desc: "3位 LVMH｜高級ブランド需要の爆発的復活で世界3位に定着。" },
    { genre: "フォーブス世界2022", name: "ビル・ゲイツ", date: "1955/10/28", desc: "4位 マイクロソフト｜多額の寄付を行いつつ上位。" },
    { genre: "フォーブス世界2022", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "5位 バークシャー・ハサウェイ｜不安定な市場でバリュー投資の手腕を発揮。" },
    { genre: "フォーブス世界2022", name: "ラリー・ペイジ", date: "1973/03/26", desc: "6位 Google｜Google（Alphabet）の共同創業者。" },
    { genre: "フォーブス世界2022", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "7位 Google｜Googleを共同創業。技術面を指揮。" },
    { genre: "フォーブス世界2022", name: "ラリー・エリソン", date: "1944/08/17", desc: "8位 オラクル｜オラクル創業者。クラウド事業が好調。" },
    { genre: "フォーブス世界2022", name: "スティーブ・バルマー", date: "1956/03/24", desc: "9位 マイクロソフト｜2代目CEO。保有株の価値が上昇。" },
    { genre: "フォーブス世界2022", name: "ムケシュ・アンバニ", date: "1957/04/19", desc: "10位 リライアンス・インダストリーズ｜石油から通信インフラを握るアジアのメガ富豪。" },
    { genre: "フォーブス世界2022", name: "ガウタム・アダニ", date: "1962/06/24", desc: "11位 アダニ・グループ｜インフラ・港湾で急上昇したインドの雄。" },
    { genre: "フォーブス世界2022", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "12位 ブルームバーグ｜金融情報端末ビジネスで富を独占。" },
    { genre: "フォーブス世界2022", name: "カルロス・スリム", date: "1940/01/28", desc: "13位 テルメックス｜ラテンアメリカ全域の通信インフラを支配。" },
    { genre: "フォーブス世界2022", name: "フランソワーズ・ベッテンコート・メイヤーズ", date: "1953/07/10", desc: "14位 ロレアル｜ロレアルの相続人。最も裕福な女性の地位を確立。" },
    { genre: "フォーブス世界2022", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "15位 Meta（Facebook）｜メタバース投資への懸念で株価下落し順位を落とす。" },
    { genre: "フォーブス世界2022", name: "ジム・ウォルトン", date: "1948/06/07", desc: "16位 ウォルマート｜ウォルマート創業者の三男。" },
    { genre: "フォーブス世界2022", name: "鍾睒睒（ジョン・シャンシャン）", date: "1954/12/04", desc: "17位 農夫山泉｜中国のボトル飲料水最大手の創業者。" },
    { genre: "フォーブス世界2022", name: "アリス・ウォルトン", date: "1949/10/07", desc: "18位 ウォルマート｜創業者の長女。芸術活動で有名。" },
    { genre: "フォーブス世界2022", name: "ロブ・ウォルトン", date: "1944/10/28", desc: "19位 ウォルマート｜創業者の長男。元会長。" },
    { genre: "フォーブス世界2022", name: "チャンポン・ジャオ", date: "1977/02/05", desc: "20位 バイナンス｜暗号資産ブーム絶頂でBinanceとともに資産が急増。" },
    { genre: "フォーブス世界2022", name: "チャールズ・コック", date: "1935/11/01", desc: "21位 コック・インダストリーズ｜米最大の非上場複合企業の経営者。" },
    { genre: "フォーブス世界2022", name: "ジュリア・コック", date: "1962/04/12", desc: "22位 コック・インダストリーズ｜夫から引き継いだ巨大複合企業の株式を保有。" },
    { genre: "フォーブス世界2022", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "23位 インディテックス（ZARA）｜スペインが誇る「ZARA」の創業者。" },
    { genre: "フォーブス世界2022", name: "マイケル・デル", date: "1965/02/23", desc: "24位 デル・テクノロジーズ｜受注生産から企業向けITで安定。" },
    { genre: "フォーブス世界2022", name: "張一鳴（チャン・イーミン）", date: "1983/04/01", desc: "25位 バイトダンス｜TikTokが社会現象となり資産が急伸。" },
    { genre: "フォーブス世界2022", name: "デビッド・トムソン", date: "1957/06/12", desc: "26位 トムソン・ロイター｜カナダの巨大メディア・情報配信の一族トップ。" },
    { genre: "フォーブス世界2022", name: "ディーター・シュワルツ", date: "1939/09/24", desc: "27位 シュワルツ・グループ｜欧州で圧倒的な格安スーパーLidlを展開。" },
    { genre: "フォーブス世界2022", name: "ホセ・ビジャレアル", date: "", desc: "28位 アルファ・グループ｜メキシコの巨大石油化学・食品・自動車部品企業。" },
    { genre: "フォーブス世界2022", name: "ロドルフ・サアデ", date: "", desc: "29位 CMA CGM｜海上物流の混乱と運賃高騰の恩恵を受けた海運大手。" },
    { genre: "フォーブス世界2022", name: "フランソワ・ピノー", date: "1936/08/21", desc: "30位 ケリング｜グッチ・サンローランを擁するラグジュアリー創業者。" },
    { genre: "フォーブス世界2021", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "1位 Amazon｜巣ごもり需要でECが爆発し4年連続の世界首位。" },
    { genre: "フォーブス世界2021", name: "イーロン・マスク", date: "1971/06/28", desc: "2位 テスラ・スペースX｜テスラ株が前年比705%上昇し前年31位から2位へ。" },
    { genre: "フォーブス世界2021", name: "ベルナール・アルノー", date: "1949/03/05", desc: "3位 LVMH｜高級ブランドの中国市場等での売上が急回復し3位。" },
    { genre: "フォーブス世界2021", name: "ビル・ゲイツ", date: "1955/10/28", desc: "4位 マイクロソフト｜持株と広範な投資で上位を維持。" },
    { genre: "フォーブス世界2021", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "5位 Meta（Facebook）｜SNS利用拡大で株価80%上昇しトップ5入り。" },
    { genre: "フォーブス世界2021", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "6位 バークシャー・ハサウェイ｜90歳でも健在。堅実なバリュー投資の富が拡大。" },
    { genre: "フォーブス世界2021", name: "ラリー・エリソン", date: "1944/08/17", desc: "7位 オラクル｜企業向けソフト巨頭。クラウドで成長継続。" },
    { genre: "フォーブス世界2021", name: "ラリー・ペイジ", date: "1973/03/26", desc: "8位 Google｜テック巨人Alphabetの共同創業者。" },
    { genre: "フォーブス世界2021", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "9位 Google｜Googleを共同創業。先進技術部門をリード。" },
    { genre: "フォーブス世界2021", name: "ムケシュ・アンバニ", date: "1957/04/19", desc: "10位 リライアンス・インダストリーズ｜通信業Jioへの海外投資誘致に成功しアジア首位。" },
    { genre: "フォーブス世界2021", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "11位 インディテックス（ZARA）｜ZARAのECシフトを進めランクイン。" },
    { genre: "フォーブス世界2021", name: "フランソワーズ・ベッテンコート・メイヤーズ", date: "1953/07/10", desc: "12位 ロレアル｜ロレアル一族。最も裕福な女性の座を守る。" },
    { genre: "フォーブス世界2021", name: "鍾睒睒（ジョン・シャンシャン）", date: "1954/12/04", desc: "13位 農夫山泉｜飲料水会社の香港上場で資産が33倍以上に暴騰。" },
    { genre: "フォーブス世界2021", name: "スティーブ・バルマー", date: "1956/03/24", desc: "14位 マイクロソフト｜元CEO。保有する莫大な同社株の恩恵。" },
    { genre: "フォーブス世界2021", name: "馬化騰（ポニー・マー）", date: "1971/10/29", desc: "15位 テンセント｜WeChatやゲームが巣ごもり需要で絶好調。" },
    { genre: "フォーブス世界2021", name: "カルロス・スリム", date: "1940/01/28", desc: "16位 テルメックス｜中南米の通信網を独占するメキシコの実業家。" },
    { genre: "フォーブス世界2021", name: "アリス・ウォルトン", date: "1949/10/07", desc: "17位 ウォルマート｜ウォルマート創業者の娘。" },
    { genre: "フォーブス世界2021", name: "ジム・ウォルトン", date: "1948/06/07", desc: "18位 ウォルマート｜創業者の三男。一族の金融部門を支える。" },
    { genre: "フォーブス世界2021", name: "ロブ・ウォルトン", date: "1944/10/28", desc: "19位 ウォルマート｜創業者の長男。チェーンの拡大に尽力。" },
    { genre: "フォーブス世界2021", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "20位 ブルームバーグ｜金融市場に欠かせない情報システムの創業者。" },
    { genre: "フォーブス世界2021", name: "コリン・ホアン（黄崢）", date: "", desc: "21位 拼多多（ピンドゥオドゥオ）｜共同購入ECの創業者。急速にユーザーを獲得。" },
    { genre: "フォーブス世界2021", name: "マッケンジー・スコット", date: "1970/04/07", desc: "22位 Amazon｜ベゾス氏との離婚で得たAmazon株を元手に慈善寄付。" },
    { genre: "フォーブス世界2021", name: "ダニエル・ギルバート", date: "1962/01/17", desc: "23位 クイッケン・ローンズ｜オンライン住宅ローン大手の上場で資産が急増。" },
    { genre: "フォーブス世界2021", name: "ガウタム・アダニ", date: "1962/06/24", desc: "24位 アダニ・グループ｜インフラ・石炭・港湾。この頃から資産が急上昇。" },
    { genre: "フォーブス世界2021", name: "デビッド・トムソン", date: "1957/06/12", desc: "25位 トムソン・ロイター｜カナダの通信・メディア・データ大手のトップ。" },
    { genre: "フォーブス世界2021", name: "フィル・ナイト", date: "1938/02/24", desc: "26位 NIKE｜スポーツブランド「ナイキ」の共同創業者。" },
    { genre: "フォーブス世界2021", name: "ジャック・マー（馬雲）", date: "1964/09/10", desc: "27位 アリババグループ｜当局の規制に直面しつつも高い資産を維持。" },
    { genre: "フォーブス世界2021", name: "チャールズ・コック", date: "1935/11/01", desc: "28位 コック・インダストリーズ｜米巨大非上場企業のトップ。" },
    { genre: "フォーブス世界2021", name: "ジュリア・コック", date: "1962/04/12", desc: "29位 コック・インダストリーズ｜夫の逝去に伴いコック一族の資産を相続。" },
    { genre: "フォーブス世界2021", name: "孫正義", date: "1957/08/11", desc: "30位 ソフトバンクグループ｜日本首位として世界トップ30にもランクイン。" },
    { genre: "フォーブス世界2020", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "1位 Amazon｜離婚の資産分割はあったが巣ごもり特需で3年連続1位。" },
    { genre: "フォーブス世界2020", name: "ビル・ゲイツ", date: "1955/10/28", desc: "2位 マイクロソフト｜長年トップ2を維持。のち財団活動に専念。" },
    { genre: "フォーブス世界2020", name: "ベルナール・アルノー", date: "1949/03/05", desc: "3位 LVMH｜高級ブランドの帝王。バフェットを抜き初の3位へ。" },
    { genre: "フォーブス世界2020", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "4位 バークシャー・ハサウェイ｜現金ポジションを維持しつつ4位。" },
    { genre: "フォーブス世界2020", name: "ラリー・エリソン", date: "1944/08/17", desc: "5位 オラクル｜クラウド転換を進めるオラクルの創業者。" },
    { genre: "フォーブス世界2020", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "6位 インディテックス（ZARA）｜実店舗閉鎖の影響で前年から順位を落とす。" },
    { genre: "フォーブス世界2020", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "7位 Meta（Facebook）｜SNSトラフィック激増で35歳の若さで7位。" },
    { genre: "フォーブス世界2020", name: "ジム・ウォルトン", date: "1948/06/07", desc: "8位 ウォルマート｜ウォルトン一族の三男。銀行部門も統括。" },
    { genre: "フォーブス世界2020", name: "アリス・ウォルトン", date: "1949/10/07", desc: "9位 ウォルマート｜創業者サムの長女。世界最高峰の女性富豪。" },
    { genre: "フォーブス世界2020", name: "ロブ・ウォルトン", date: "1944/10/28", desc: "10位 ウォルマート｜創業者サムの長男。長年会長を務めた重鎮。" },
    { genre: "フォーブス世界2020", name: "スティーブ・バルマー", date: "1956/03/24", desc: "11位 マイクロソフト｜元CEO。株好調とNBAクリッパーズ所有。" },
    { genre: "フォーブス世界2020", name: "カルロス・スリム", date: "1940/01/28", desc: "12位 テルメックス｜メキシコ・中南米の通信網を掌握。" },
    { genre: "フォーブス世界2020", name: "ラリー・ペイジ", date: "1973/03/26", desc: "13位 Google｜AlphabetのCEOを退任も大株主として健在。" },
    { genre: "フォーブス世界2020", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "14位 Google｜役職を退くも莫大なGoogle株で14位。" },
    { genre: "フォーブス世界2020", name: "フランソワーズ・ベッテンコート・メイヤーズ", date: "1953/07/10", desc: "15位 ロレアル｜ロレアルの創業者孫娘。一族を代表しランクイン。" },
    { genre: "フォーブス世界2020", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "16位 ブルームバーグ｜金融情報インフラを独占。米大統領選に挑戦。" },
    { genre: "フォーブス世界2020", name: "ジャック・マー（馬雲）", date: "1964/09/10", desc: "17位 アリババグループ｜会長職は退任もECの需要増で中国首位を維持。" },
    { genre: "フォーブス世界2020", name: "馬化騰（ポニー・マー）", date: "1971/10/29", desc: "18位 テンセント｜WeChatやゲーム・動画が巣ごもりで爆発的利益。" },
    { genre: "フォーブス世界2020", name: "ジャクリーン・マース", date: "1939/10/10", desc: "19位 マーズ｜「M&M's」やペットフードで知られる非上場巨頭。" },
    { genre: "フォーブス世界2020", name: "ジョン・マース", date: "1936/10/15", desc: "20位 マーズ｜ジャクリーン氏の兄。マース株を保有。" },
    { genre: "フォーブス世界2020", name: "ムケシュ・アンバニ", date: "1957/04/19", desc: "21位 リライアンス・インダストリーズ｜格安4G通信Jioの成功でアジア屈指の地位へ。" },
    { genre: "フォーブス世界2020", name: "マッケンジー・スコット", date: "1970/04/07", desc: "22位 Amazon｜離婚に伴いAmazon株の4%を取得し世界有数の富豪へ。" },
    { genre: "フォーブス世界2020", name: "カール・アルブレヒトJr.", date: "", desc: "23位 Aldi（アルディ）｜ドイツの超巨大格安スーパーを築いた一族の継承者。" },
    { genre: "フォーブス世界2020", name: "デビッド・トムソン", date: "1957/06/12", desc: "24位 トムソン・ロイター｜カナダの世界的メディア・金融データ大手を率いる。" },
    { genre: "フォーブス世界2020", name: "フィル・ナイト", date: "1938/02/24", desc: "25位 NIKE｜世界No.1スポーツブランド「ナイキ」共同創業者。" },
    { genre: "フォーブス世界2020", name: "李嘉誠（リ・カシン）", date: "1928/07/29", desc: "26位 長江和記実業｜香港のインフラ・港湾・不動産・通信を支配。" },
    { genre: "フォーブス世界2020", name: "許家印（シュー・ジアイエン）", date: "1958/10/09", desc: "27位 恒大集団（エバーグランデ）｜当時は中国不動産バブルの恩恵で上位。" },
    { genre: "フォーブス世界2020", name: "ジョセフ・サフラ", date: "1938/08/28", desc: "28位 サフラ・グループ｜ブラジル最強の銀行家。最も裕福なプライベートバンカー。" },
    { genre: "フォーブス世界2020", name: "李兆基（リ・シャウキー）", date: "1928/01/29", desc: "29位 恒基兆業地産｜不動産開発で香港経済を支える巨頭。" },
    { genre: "フォーブス世界2020", name: "楊惠妍（ヤン・フイイェン）", date: "1981/07/20", desc: "30位 碧桂園（カントリー・ガーデン）｜父から不動産大手株を譲り受けアジアで最も裕福な女性に。" },
    { genre: "フォーブス世界2019", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "1位 Amazon｜資産1000億ドル超で2年連続の世界首位。" },
    { genre: "フォーブス世界2019", name: "ビル・ゲイツ", date: "1955/10/28", desc: "2位 Microsoft｜資産増もAmazonに届かず2位。" },
    { genre: "フォーブス世界2019", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "3位 バークシャー・ハサウェイ｜保有株の下落でやや資産減。" },
    { genre: "フォーブス世界2019", name: "ベルナール・アルノー", date: "1949/03/05", desc: "4位 LVMH｜高級ブランドが好調で欧州勢トップ。" },
    { genre: "フォーブス世界2019", name: "カルロス・スリム", date: "1940/01/28", desc: "5位 テルメックス｜中南米全域のインフラを支配。" },
    { genre: "フォーブス世界2019", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "6位 インディテックス(ZARA)｜実店舗拡大とEC強化を両立。" },
    { genre: "フォーブス世界2019", name: "ラリー・エリソン", date: "1944/08/17", desc: "7位 オラクル｜クラウド事業の買収を加速。" },
    { genre: "フォーブス世界2019", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "8位 Meta(Facebook)｜個人情報流出問題の逆風で資産減。" },
    { genre: "フォーブス世界2019", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "9位 ブルームバーグ｜金融情報端末の圧倒的シェアでトップ10。" },
    { genre: "フォーブス世界2019", name: "ラリー・ペイジ", date: "1973/03/26", desc: "10位 Google｜共同創業者。親会社Alphabetの運営に携わる。" },
    { genre: "フォーブス世界2019", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "11位 Google｜検索技術の基盤を作った天才。" },
    { genre: "フォーブス世界2019", name: "ムケシュ・アンバニ", date: "1957/04/19", desc: "12位 リライアンス｜印の石油化学・通信巨頭。アジア唯一のトップ15。" },
    { genre: "フォーブス世界2019", name: "チャールズ・コック", date: "1935/11/01", desc: "13位 コック・インダストリーズ｜巨大非上場コングロマリットを率いる。" },
    { genre: "フォーブス世界2019", name: "デビッド・コック", date: "1940/05/03", desc: "14位 コック・インダストリーズ｜チャールズの弟。※同年8月逝去前の最後の番付。" },
    { genre: "フォーブス世界2019", name: "フランソワーズ・ベッテンコート・メイヤーズ", date: "1953/07/10", desc: "15位 ロレアル｜祖父創業のロレアルを継ぎ世界一裕福な女性に。" },
    { genre: "フォーブス世界2019", name: "ジム・ウォルトン", date: "1948/06/07", desc: "16位 ウォルマート｜一族の資産管理を担う。" },
    { genre: "フォーブス世界2019", name: "アリス・ウォルトン", date: "1949/10/07", desc: "17位 ウォルマート｜創業者の娘。アート支援に注力。" },
    { genre: "フォーブス世界2019", name: "ロブ・ウォルトン", date: "1944/10/28", desc: "18位 ウォルマート｜創業者の長男。長年取締役会を率いる。" },
    { genre: "フォーブス世界2019", name: "スティーブ・バルマー", date: "1956/03/24", desc: "19位 Microsoft｜元CEO。株価上昇で順位を上げる。" },
    { genre: "フォーブス世界2019", name: "馬化騰(ポニー・マー)", date: "1971/10/29", desc: "20位 テンセント｜「WeChat」運営トップ。" },
    { genre: "フォーブス世界2019", name: "ジャック・マー(馬雲)", date: "1964/09/10", desc: "21位 アリババグループ｜9月に会長職を退任。" },
    { genre: "フォーブス世界2019", name: "許家印", date: "1958/10/09", desc: "22位 恒大集団｜不動産バブル絶頂で業界世界トップ。" },
    { genre: "フォーブス世界2019", name: "ベアテ・ハイスター（一族）", date: "1951/10/05", desc: "23位 アルディ｜独発の世界的格安スーパー。" },
    { genre: "フォーブス世界2019", name: "李兆基", date: "1928/02/20", desc: "24位 恒基兆業地産｜香港の不動産開発巨頭。" },
    { genre: "フォーブス世界2019", name: "王健林", date: "1954/10/24", desc: "25位 万達集団(ワンダ)｜不動産・エンタメを広く手がける中国の巨頭。" },
    { genre: "フォーブス世界2019", name: "フィル・ナイト", date: "1938/02/24", desc: "26位 NIKE｜スポーツアパレル王者ナイキの共同創業者。" },
    { genre: "フォーブス世界2019", name: "ジャクリーヌ・マーズ", date: "1939/10/10", desc: "27位 マーズ｜菓子・ペットフード非上場大手。" },
    { genre: "フォーブス世界2019", name: "ジョン・マーズ", date: "1936/10/15", desc: "28位 マーズ｜非上場企業ならではの盤石な一族資産。" },
    { genre: "フォーブス世界2019", name: "シェルドン・アデルソン", date: "1933/08/04", desc: "29位 ラスベガス・サンズ｜ラスベガス・マカオの開発を先導。" },
    { genre: "フォーブス世界2019", name: "マイケル・デル", date: "1965/02/23", desc: "30位 デル・テクノロジーズ｜企業向けITインフラ事業への転換に成功。" },
    { genre: "フォーブス世界2018", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "1位 Amazon｜EC最大手を創業し世界の流通を変革。" },
    { genre: "フォーブス世界2018", name: "ビル・ゲイツ", date: "1955/10/28", desc: "2位 Microsoft｜Windowsを普及させIT社会の基盤を作る。" },
    { genre: "フォーブス世界2018", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "3位 バークシャー・ハサウェイ｜卓越した価値投資で富を築く。" },
    { genre: "フォーブス世界2018", name: "ベルナール・アルノー", date: "1949/03/05", desc: "4位 LVMH｜ルイ・ヴィトン等を買収し巨大高級ブランド帝国を築く。" },
    { genre: "フォーブス世界2018", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "5位 Facebook(Meta)｜世界最大のSNSを在学中に立ち上げ。" },
    { genre: "フォーブス世界2018", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "6位 インディテックス(ZARA)｜ファストファッションのモデルを確立。" },
    { genre: "フォーブス世界2018", name: "カルロス・スリム", date: "1940/01/28", desc: "7位 アメリカ・モービル｜中南米最大の通信会社を築く。" },
    { genre: "フォーブス世界2018", name: "チャールズ・コック", date: "1935/11/01", desc: "8位 コック・インダストリーズ｜米最大の非上場複合企業を経営。" },
    { genre: "フォーブス世界2018", name: "デビッド・コック", date: "1940/05/03", desc: "8位 コック・インダストリーズ｜兄と家業を世界的巨企業へ成長。" },
    { genre: "フォーブス世界2018", name: "ラリー・エリソン", date: "1944/08/17", desc: "10位 オラクル｜企業向けDBの先駆者としてITインフラを支える。" },
    { genre: "フォーブス世界2018", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "11位 ブルームバーグ｜金融端末と報道機関を市場のインフラに。" },
    { genre: "フォーブス世界2018", name: "ラリー・ペイジ", date: "1973/03/26", desc: "12位 Google｜検索アルゴリズムを開発しネット検索を変えた。" },
    { genre: "フォーブス世界2018", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "13位 Google｜共同創業者としてネット経済を牽引。" },
    { genre: "フォーブス世界2018", name: "ジム・ウォルトン", date: "1948/06/07", desc: "14位 ウォルマート｜創業者の三男。一族の資産を管理。" },
    { genre: "フォーブス世界2018", name: "ロブ・ウォルトン", date: "1944/10/28", desc: "15位 ウォルマート｜創業者の長男。長年取締役会長。" },
    { genre: "フォーブス世界2018", name: "アリス・ウォルトン", date: "1949/10/07", desc: "16位 ウォルマート｜創業者の長女。アート・慈善に投資。" },
    { genre: "フォーブス世界2018", name: "馬化騰(ポニー・マー)", date: "1971/10/29", desc: "17位 テンセント｜「WeChat」やゲーム・決済インフラを構築。" },
    { genre: "フォーブス世界2018", name: "フランソワーズ・ベッテンコート・メイヤーズ", date: "1953/07/10", desc: "18位 ロレアル｜世界最大の化粧品メーカーの筆頭株主。" },
    { genre: "フォーブス世界2018", name: "ムケシュ・アンバニ", date: "1957/04/19", desc: "19位 リライアンス｜印最大の財閥。石油化学から格安通信まで。" },
    { genre: "フォーブス世界2018", name: "馬雲(ジャック・マー)", date: "1964/09/10", desc: "20位 アリババグループ｜「タオバオ」等で中国の流通を変えた。" },
    { genre: "フォーブス世界2018", name: "シェルドン・アデルソン", date: "1933/08/04", desc: "21位 ラスベガス・サンズ｜カジノ・リゾートの巨頭。" },
    { genre: "フォーブス世界2018", name: "スティーブ・バルマー", date: "1956/03/24", desc: "22位 Microsoft(元CEO)｜CEOとして同社の商業的成功を拡大。" },
    { genre: "フォーブス世界2018", name: "李嘉誠", date: "1928/07/29", desc: "23位 長江和記実業｜アジア全域のインフラを牛耳る富豪。" },
    { genre: "フォーブス世界2018", name: "許家印", date: "1958/10/09", desc: "24位 恒大集団｜国内最大級の不動産デベロッパーを築く。" },
    { genre: "フォーブス世界2018", name: "李兆基", date: "1928/02/20", desc: "24位 恒基兆業地産｜香港の超高層ビル群の開発を主導。" },
    { genre: "フォーブス世界2018", name: "王健林", date: "1954/10/24", desc: "26位 万達集団(ワンダ)｜商業施設・映画館を世界展開。" },
    { genre: "フォーブス世界2018", name: "ベアテ・ハイスター（一族）", date: "1951/10/05", desc: "27位 アルディ｜独の格安スーパーを世界的チェーンに育てた継承者。" },
    { genre: "フォーブス世界2018", name: "フィル・ナイト", date: "1938/02/24", desc: "28位 ナイキ｜世界最大のスポーツブランドを創業。" },
    { genre: "フォーブス世界2018", name: "ジョルジ・パウロ・レマン", date: "1939/08/26", desc: "29位 3Gキャピタル｜ABインベブやバーガーキングを統括。" },
    { genre: "フォーブス世界2018", name: "フランソワ・ピノー", date: "1936/08/21", desc: "30位 ケリング｜グッチ等を傘下に持つ高級ファッション大手を創業。" },
    { genre: "フォーブス世界2017", name: "ビル・ゲイツ", date: "1955/10/28", desc: "1位 Microsoft｜4年連続、通算18回目の世界首位。" },
    { genre: "フォーブス世界2017", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "2位 バークシャー・ハサウェイ｜株高を捉え2位を奪還。" },
    { genre: "フォーブス世界2017", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "3位 Amazon｜資産を約276億ドル増やし初のトップ3入り。" },
    { genre: "フォーブス世界2017", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "4位 インディテックス(ZARA)｜世界最大のファストファッション帝国。" },
    { genre: "フォーブス世界2017", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "5位 Meta(Facebook)｜モバイル広告好調で初のトップ5入り。" },
    { genre: "フォーブス世界2017", name: "カルロス・スリム", date: "1940/01/28", desc: "6位 テルメックス｜メキシコの通信王。今回は6位に後退。" },
    { genre: "フォーブス世界2017", name: "ラリー・エリソン", date: "1944/08/17", desc: "7位 オラクル｜クラウド部門への転換期を指揮。" },
    { genre: "フォーブス世界2017", name: "チャールズ・コック", date: "1935/11/01", desc: "8位 コック・インダストリーズ｜弟と米最大の非上場企業を運営。" },
    { genre: "フォーブス世界2017", name: "デイビッド・コック", date: "1940/05/03", desc: "8位 コック・インダストリーズ｜石油精製・化学など広範に展開。" },
    { genre: "フォーブス世界2017", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "10位 ブルームバーグ｜金融インフラを支配。元NY市長。" },
    { genre: "フォーブス世界2017", name: "ベルナール・アルノー", date: "1949/03/05", desc: "11位 LVMH｜欧州最高の富豪。高級ブランド帝国を率いる。" },
    { genre: "フォーブス世界2017", name: "ラリー・ペイジ", date: "1973/03/26", desc: "12位 Google｜親会社AlphabetのCEOとして事業を統括。" },
    { genre: "フォーブス世界2017", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "13位 Google｜検索技術の天才。共同創業者。" },
    { genre: "フォーブス世界2017", name: "フランソワーズ・ベッテンコート・メイヤーズ", date: "1953/07/10", desc: "14位 ロレアル｜世界一の化粧品メーカーの資産を継承。" },
    { genre: "フォーブス世界2017", name: "ロブ・ウォルトン", date: "1944/10/28", desc: "15位 ウォルマート｜創業者の長男。長く会長を務める。" },
    { genre: "フォーブス世界2017", name: "ジム・ウォルトン", date: "1948/06/07", desc: "16位 ウォルマート｜一族のアルヴェスト銀行CEO。" },
    { genre: "フォーブス世界2017", name: "アリス・ウォルトン", date: "1949/10/07", desc: "17位 ウォルマート｜創業者の長女。アート分野で活躍。" },
    { genre: "フォーブス世界2017", name: "王健林", date: "1954/10/24", desc: "18位 万達集団｜中国の不動産・エンタメ巨頭。中国首位。" },
    { genre: "フォーブス世界2017", name: "李嘉誠", date: "1928/07/29", desc: "19位 長江和記実業｜アジアのインフラ・不動産の巨頭。" },
    { genre: "フォーブス世界2017", name: "シェルドン・アデルソン", date: "1933/08/04", desc: "20位 ラスベガス・サンズ｜巨大カジノ・リゾートの帝王。" },
    { genre: "フォーブス世界2017", name: "スティーブ・バルマー", date: "1956/03/24", desc: "21位 Microsoft｜前CEO。保有株の価値上昇でランクイン。" },
    { genre: "フォーブス世界2017", name: "ジョルジ・パウロ・レマン", date: "1939/08/26", desc: "22位 ABインベブ｜世界最大のビール会社を支配。" },
    { genre: "フォーブス世界2017", name: "ジャック・マー(馬雲)", date: "1964/09/10", desc: "23位 アリババグループ｜キャッシュレス社会の基盤を作る。" },
    { genre: "フォーブス世界2017", name: "デビッド・トムソン", date: "1957/06/12", desc: "24位 トムソン・ロイター｜カナダ代表のメディア・金融データ大手。" },
    { genre: "フォーブス世界2017", name: "ジャクリーヌ・マーズ", date: "1939/10/10", desc: "26位 マーズ｜チョコ菓子・ペットフード大手の実権を握る。" },
    { genre: "フォーブス世界2017", name: "ジョン・マーズ", date: "1936/10/15", desc: "26位 マーズ｜巨大非上場企業マーズの株式を均等保有。" },
    { genre: "フォーブス世界2017", name: "フィル・ナイト", date: "1938/02/24", desc: "28位 NIKE｜スニーカー文化のパイオニア。" },
    { genre: "フォーブス世界2017", name: "ジョヴァンニ・フェレロ", date: "1964/09/21", desc: "29位 フェレロ｜「ヌテラ」等で有名な伊菓子大手。" },
    { genre: "フォーブス世界2017", name: "ジョージ・ソロス", date: "1930/08/12", desc: "29位 ソロス・ファンド｜世界で最も有名なヘッジファンドの帝王。" },
    { genre: "フォーブス世界2016", name: "ビル・ゲイツ", date: "1955/10/28", desc: "1位 Microsoft｜3年連続で世界首位。IT社会の基礎を築く。" },
    { genre: "フォーブス世界2016", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "2位 インディテックス(ZARA)｜資産を伸ばし世界2位へ浮上。" },
    { genre: "フォーブス世界2016", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "3位 バークシャー・ハサウェイ｜長期バリュー投資で富を維持。" },
    { genre: "フォーブス世界2016", name: "カルロス・スリム", date: "1940/01/28", desc: "4位 アメリカ・モービル｜株価下落で2位から4位へ後退。" },
    { genre: "フォーブス世界2016", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "5位 Amazon｜クラウド(AWS)の急成長で初のトップ5入り。" },
    { genre: "フォーブス世界2016", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "6位 Facebook(Meta)｜31歳で初のトップ10入り。" },
    { genre: "フォーブス世界2016", name: "ラリー・エリソン", date: "1944/08/17", desc: "7位 オラクル｜ビジネスDBソフトの世界的シェアを独占。" },
    { genre: "フォーブス世界2016", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "8位 ブルームバーグ｜金融情報端末と報道機関を展開。元NY市長。" },
    { genre: "フォーブス世界2016", name: "チャールズ・コック", date: "1935/11/01", desc: "9位 コック・インダストリーズ｜米最大の非上場複合企業を兄弟で経営。" },
    { genre: "フォーブス世界2016", name: "デビッド・コック", date: "1940/05/03", desc: "9位 コック・インダストリーズ｜兄と共に一族を代表。" },
    { genre: "フォーブス世界2016", name: "リリアン・ベッテンコート", date: "1922/10/21", desc: "11位 ロレアル｜化粧品大手の令嬢。世界最高の女性富豪。" },
    { genre: "フォーブス世界2016", name: "ラリー・ペイジ", date: "1973/03/26", desc: "12位 Google(Alphabet)｜親会社CEOとして検索から自動運転まで統括。" },
    { genre: "フォーブス世界2016", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "13位 Google(Alphabet)｜共同創業。先端技術開発を指揮。" },
    { genre: "フォーブス世界2016", name: "ベルナール・アルノー", date: "1949/03/05", desc: "14位 LVMH｜高級ブランドを傘下に持つファッション界の帝王。" },
    { genre: "フォーブス世界2016", name: "ジム・ウォルトン", date: "1948/06/07", desc: "15位 ウォルマート｜創業家。一族の金融機関を統括。" },
    { genre: "フォーブス世界2016", name: "アリス・ウォルトン", date: "1949/10/07", desc: "16位 ウォルマート｜創業者の長女。アート収集・慈善に注力。" },
    { genre: "フォーブス世界2016", name: "ロブ・ウォルトン", date: "1944/10/28", desc: "17位 ウォルマート｜創業者の長男。23年間会長を務めた。" },
    { genre: "フォーブス世界2016", name: "王健林", date: "1954/10/24", desc: "18位 万達集団(ワンダ)｜商業不動産・映画館でアジア首位に。" },
    { genre: "フォーブス世界2016", name: "ジョルジ・パウロ・レマン", date: "1939/08/26", desc: "19位 3Gキャピタル｜ビール最大手ABインベブを支配。" },
    { genre: "フォーブス世界2016", name: "李嘉誠", date: "1928/07/29", desc: "20位 長江和記実業｜香港のインフラ・不動産王。" },
    { genre: "フォーブス世界2016", name: "ベアテ・ハイスター（一族）", date: "1951/10/05", desc: "21位 アルディ｜独の激安スーパーを世界展開する創業家。" },
    { genre: "フォーブス世界2016", name: "シェルドン・アデルソン", date: "1933/08/04", desc: "22位 ラスベガス・サンズ｜統合型リゾートのカジノ王。" },
    { genre: "フォーブス世界2016", name: "ジョージ・ソロス", date: "1930/08/12", desc: "23位 ソロス・ファンド｜伝説的ヘッジファンド経営者。" },
    { genre: "フォーブス世界2016", name: "フィル・ナイト", date: "1938/02/24", desc: "24位 ナイキ｜世界最大のスポーツブランドを育成。" },
    { genre: "フォーブス世界2016", name: "デビッド・トムソン", date: "1957/06/12", desc: "25位 トムソン・ロイター｜カナダ最大のメディア帝国を継ぐ。" },
    { genre: "フォーブス世界2016", name: "スティーブ・バルマー", date: "1956/03/24", desc: "26位 Microsoft(元CEO)｜筆頭株主。NBAクリッパーズを買収。" },
    { genre: "フォーブス世界2016", name: "フォルスト・マーズ・ジュニア", date: "1931/04/16", desc: "27位 マーズ｜巨大菓子・ペットフードメーカーの創業家。" },
    { genre: "フォーブス世界2016", name: "ジャクリーヌ・マーズ", date: "1939/10/10", desc: "27位 マーズ｜非上場の巨大企業マーズの資産を共有。" },
    { genre: "フォーブス世界2016", name: "ジョン・マーズ", date: "1936/10/15", desc: "27位 マーズ｜一族3人で同額の資産を保有。" },
    { genre: "フォーブス世界2016", name: "マリア・フランカ・フィッソロ", date: "1917/12/19", desc: "30位 フェレロ｜「ヌテラ」等を持つ伊製菓大手の未亡人。" },
    { genre: "フォーブス世界2015", name: "ビル・ゲイツ", date: "1955/10/28", desc: "1位 Microsoft｜Windowsを世界に普及。通算16回目の世界首位。" },
    { genre: "フォーブス世界2015", name: "カルロス・スリム", date: "1940/01/28", desc: "2位 アメリカ・モービル｜メキシコ・中南米の通信網を独占。" },
    { genre: "フォーブス世界2015", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "3位 バークシャー・ハサウェイ｜「投資の神様」。" },
    { genre: "フォーブス世界2015", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "4位 インディテックス(ZARA)｜ファストファッションの生みの親。" },
    { genre: "フォーブス世界2015", name: "ラリー・エリソン", date: "1944/08/17", desc: "5位 オラクル｜企業向けデータベースで圧倒的シェア。" },
    { genre: "フォーブス世界2015", name: "チャールズ・コック", date: "1935/11/01", desc: "6位 コック・インダストリーズ｜米国最大の非上場企業を統括。" },
    { genre: "フォーブス世界2015", name: "デビッド・コック", date: "1940/05/03", desc: "6位 コック・インダストリーズ｜兄と家業を巨大複合企業へ成長。" },
    { genre: "フォーブス世界2015", name: "クリスティ・ウォルトン", date: "1949/02/08", desc: "8位 ウォルマート｜創業者の未亡人。当時世界一裕福な女性。" },
    { genre: "フォーブス世界2015", name: "ジム・ウォルトン", date: "1948/06/07", desc: "9位 ウォルマート｜創業者の三男。一族の銀行を運営。" },
    { genre: "フォーブス世界2015", name: "リリアン・ベッテンコート", date: "1922/10/21", desc: "10位 ロレアル｜化粧品大手の令嬢。欧州で最も裕福な女性。" },
    { genre: "フォーブス世界2015", name: "アリス・ウォルトン", date: "1949/10/07", desc: "11位 ウォルマート｜創業者の長女。美術品コレクター。" },
    { genre: "フォーブス世界2015", name: "ロブ・ウォルトン", date: "1944/10/28", desc: "12位 ウォルマート｜創業者の長男。長年取締役会長を務める。" },
    { genre: "フォーブス世界2015", name: "ベルナール・アルノー", date: "1949/03/05", desc: "13位 LVMH｜世界最大の高級ブランド帝国を築く。" },
    { genre: "フォーブス世界2015", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "14位 ブルームバーグ｜金融情報端末を世界に普及。" },
    { genre: "フォーブス世界2015", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "15位 Amazon｜ネット通販とクラウド(AWS)で資産急増。" },
    { genre: "フォーブス世界2015", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "16位 Facebook(Meta)｜当時30歳。モバイル広告で急騰。" },
    { genre: "フォーブス世界2015", name: "李嘉誠", date: "1928/07/29", desc: "17位 長江和記実業｜香港発、不動産・通信・港湾を支配。" },
    { genre: "フォーブス世界2015", name: "シェルドン・アデルソン", date: "1933/08/04", desc: "18位 ラスベガス・サンズ｜統合型リゾートのカジノ王。" },
    { genre: "フォーブス世界2015", name: "ラリー・ペイジ", date: "1973/03/26", desc: "19位 Google(Alphabet)｜持株会社アルファベット設立とCEO就任。" },
    { genre: "フォーブス世界2015", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "20位 Google(Alphabet)｜検索技術とネット広告の基盤を作る。" },
    { genre: "フォーブス世界2015", name: "ジョルジ・パウロ・レマン", date: "1939/08/26", desc: "21位 3Gキャピタル｜ブラジル出身の世界的投資家。" },
    { genre: "フォーブス世界2015", name: "フランソワ・ピノー", date: "1936/08/21", desc: "22位 ケリング｜グッチ等を擁する高級ブランド大手の創業者。" },
    { genre: "フォーブス世界2015", name: "フォルスト・マーズ・ジュニア", date: "1931/04/16", desc: "23位 マーズ｜製菓・ペットフードの巨大非上場企業の創業家。" },
    { genre: "フォーブス世界2015", name: "ジャクリーヌ・マーズ", date: "1939/10/10", desc: "23位 マーズ｜創業家3兄妹で資産を均等保有。" },
    { genre: "フォーブス世界2015", name: "ジョン・マーズ", date: "1936/10/15", desc: "23位 マーズ｜創業家の一員。3人が同額でランクイン。" },
    { genre: "フォーブス世界2015", name: "デビッド・トムソン", date: "1957/06/12", desc: "26位 トムソン・ロイター｜カナダ最大の情報・メディア帝国。" },
    { genre: "フォーブス世界2015", name: "ディーター・シュワルツ", date: "1939/09/24", desc: "27位 シュワルツ・グループ｜激安スーパーLidlを欧州に拡大。" },
    { genre: "フォーブス世界2015", name: "マルク・ミュリエ", date: "1932/05/14", desc: "28位 オーシャン｜仏の巨大スーパーを運営する一族の代表。" },
    { genre: "フォーブス世界2015", name: "王健林", date: "1954/10/24", desc: "29位 万達集団(ワンダ)｜映画館・商業ビル開発で中国首位へ。" },
    { genre: "フォーブス世界2015", name: "馬雲(ジャック・マー)", date: "1964/09/10", desc: "30位 アリババグループ｜米国で歴史的上場、世界的テック富豪に。" },
    { genre: "フォーブス世界2014", name: "ビル・ゲイツ", date: "1955/10/28", desc: "1位 Microsoft｜株価上昇で4年ぶりに世界首位へ返り咲き。" },
    { genre: "フォーブス世界2014", name: "カルロス・スリム", date: "1940/01/28", desc: "2位 アメリカ・モービル｜4年守った首位を明け渡すも中南米通信の巨頭。" },
    { genre: "フォーブス世界2014", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "3位 インディテックス(ZARA)｜ZARAのグローバル展開が加速。" },
    { genre: "フォーブス世界2014", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "4位 バークシャー・ハサウェイ｜世界で最も尊敬される投資家。" },
    { genre: "フォーブス世界2014", name: "ラリー・エリソン", date: "1944/08/17", desc: "5位 オラクル｜企業向けDBソフトのシェアを独占。" },
    { genre: "フォーブス世界2014", name: "チャールズ・コック", date: "1935/11/01", desc: "6位 コック・インダストリーズ｜米最大の非上場複合企業を経営。" },
    { genre: "フォーブス世界2014", name: "デビッド・コック", date: "1940/05/03", desc: "6位 コック・インダストリーズ｜兄と共に一族を代表。" },
    { genre: "フォーブス世界2014", name: "シェルドン・アデルソン", date: "1933/08/04", desc: "8位 ラスベガス・サンズ｜マカオ・シンガポールのIRが大成功。" },
    { genre: "フォーブス世界2014", name: "クリスティ・ウォルトン", date: "1949/02/08", desc: "9位 ウォルマート｜創業者の未亡人。一族で最高額の資産。" },
    { genre: "フォーブス世界2014", name: "ジム・ウォルトン", date: "1948/06/07", desc: "10位 ウォルマート｜創業者の三男。一族の資産管理・銀行運営。" },
    { genre: "フォーブス世界2014", name: "リリアン・ベッテンコート", date: "1922/10/21", desc: "11位 ロレアル｜化粧品大手の令嬢。世界有数の女性富豪。" },
    { genre: "フォーブス世界2014", name: "ステファン・パーソン", date: "1947/10/04", desc: "12位 H&M｜ファストファッションH&Mを世界的ブランドに育てた2代目。" },
    { genre: "フォーブス世界2014", name: "アリス・ウォルトン", date: "1949/10/07", desc: "13位 ウォルマート｜創業者の長女。アート収集・慈善に注力。" },
    { genre: "フォーブス世界2014", name: "ロブ・ウォルトン", date: "1944/10/28", desc: "14位 ウォルマート｜創業者の長男。取締役会長として世界展開を指揮。" },
    { genre: "フォーブス世界2014", name: "ベルナール・アルノー", date: "1949/03/05", desc: "15位 LVMH｜高級ブランドを次々買収しブランド帝国を統括。" },
    { genre: "フォーブス世界2014", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "16位 ブルームバーグ｜NY市長退任後、自社メディアへフルタイム復帰。" },
    { genre: "フォーブス世界2014", name: "ラリー・ペイジ", date: "1973/03/26", desc: "17位 Google｜Androidの普及と広告事業の好調で資産拡大。" },
    { genre: "フォーブス世界2014", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "18位 Google｜共同創業者。ネット検索のあり方を変革。" },
    { genre: "フォーブス世界2014", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "19位 Amazon｜書籍通販から巨大EC・ITインフラへ成長させた。" },
    { genre: "フォーブス世界2014", name: "李嘉誠", date: "1928/07/29", desc: "20位 長江和記実業｜アジアの不動産・投資王。" },
    { genre: "フォーブス世界2014", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "21位 Facebook(Meta)｜株価V字回復。当時29歳でトップ20目前へ急浮上。" },
    { genre: "フォーブス世界2014", name: "カール・アイカーン", date: "1936/02/16", desc: "22位 アイカーン・エンタープライズ｜「物言う株主」の筆頭格。" },
    { genre: "フォーブス世界2014", name: "ジョルジ・パウロ・レマン", date: "1939/08/26", desc: "23位 3Gキャピタル｜ハインツやABインベブの買収を主導。" },
    { genre: "フォーブス世界2014", name: "ルイ・チーウー", date: "1929/08/09", desc: "24位 ギャラクシー・エンターテインメント｜マカオの大型リゾートで香港2位へ。" },
    { genre: "フォーブス世界2014", name: "アル・ワリード・ビン・タラール", date: "1955/03/07", desc: "25位 キングダム・ホールディング｜サウジの王子で世界的投資家。" },
    { genre: "フォーブス世界2014", name: "フォルスト・マーズ・ジュニア", date: "1931/04/16", desc: "26位 マーズ｜巨大菓子・ペットフードメーカーの創業家代表。" },
    { genre: "フォーブス世界2014", name: "ジャクリーヌ・マーズ", date: "1939/10/10", desc: "26位 マーズ｜創業家3兄妹で資産を均等保有。" },
    { genre: "フォーブス世界2014", name: "ジョン・マーズ", date: "1936/10/15", desc: "26位 マーズ｜一族3人が同額で26位に並ぶ。" },
    { genre: "フォーブス世界2014", name: "デビッド・トムソン", date: "1957/06/12", desc: "29位 トムソン・ロイター｜カナダ最大の情報・メディア帝国を統括。" },
    { genre: "フォーブス世界2014", name: "ディーター・シュワルツ", date: "1939/09/24", desc: "30位 シュワルツ・グループ｜激安スーパーLidlを欧州に拡大。" },
    { genre: "フォーブス世界2013", name: "カルロス・スリム", date: "1940/01/28", desc: "1位 アメリカ・モービル｜中南米のインフラ・商業を支配し4年連続の世界首位。" },
    { genre: "フォーブス世界2013", name: "ビル・ゲイツ", date: "1955/10/28", desc: "2位 Microsoft｜慈善活動に注力しつつ保有株の上昇で2位を維持。" },
    { genre: "フォーブス世界2013", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "3位 インディテックス(ZARA)｜資産を約195億ドル急増させ初のトップ3入り。" },
    { genre: "フォーブス世界2013", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "4位 バークシャー・ハサウェイ｜13年ぶりにトップ3から後退も安定のバリュー投資。" },
    { genre: "フォーブス世界2013", name: "ラリー・エリソン", date: "1944/08/17", desc: "5位 オラクル｜クラウド移行期もエンタープライズ向けソフトの覇者。" },
    { genre: "フォーブス世界2013", name: "チャールズ・コック", date: "1935/11/01", desc: "6位 コック・インダストリーズ｜全米最大級の非上場複合企業を牽引。" },
    { genre: "フォーブス世界2013", name: "デビッド・コック", date: "1940/05/03", desc: "6位 コック・インダストリーズ｜兄と共にコック家の膨大な資産を二分。" },
    { genre: "フォーブス世界2013", name: "李嘉誠", date: "1928/07/29", desc: "8位 長江和記実業｜欧州のインフラ・通信企業の買収を積極的に進める。" },
    { genre: "フォーブス世界2013", name: "リリアン・ベッテンコート", date: "1922/10/21", desc: "9位 ロレアル｜株価上昇でこの年の世界最高額の女性富豪に。" },
    { genre: "フォーブス世界2013", name: "ベルナール・アルノー", date: "1949/03/05", desc: "10位 LVMH｜高級ブランドの世界的需要で欧州屈指の富豪。" },
    { genre: "フォーブス世界2013", name: "クリスティ・ウォルトン", date: "1949/02/08", desc: "11位 ウォルマート｜相続株にファースト・ソーラー株の恩恵も加わり一族首位。" },
    { genre: "フォーブス世界2013", name: "ステファン・パーソン", date: "1947/10/04", desc: "12位 H&M｜ファストファッションH&Mの店舗網を世界で拡大。" },
    { genre: "フォーブス世界2013", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "13位 ブルームバーグ｜NY市長を務めつつ金融端末事業のシェアで資産拡大。" },
    { genre: "フォーブス世界2013", name: "ジム・ウォルトン", date: "1948/06/07", desc: "14位 ウォルマート｜一族のアルベスト銀行CEOとして資産を管理。" },
    { genre: "フォーブス世界2013", name: "シェルドン・アデルソン", date: "1933/08/04", desc: "15位 ラスベガス・サンズ｜マカオのカジノ市場回復で資産価値が大幅上昇。" },
    { genre: "フォーブス世界2013", name: "アリス・ウォルトン", date: "1949/10/07", desc: "16位 ウォルマート｜創業者の長女。クリスタル・ブリッジズ美術館に傾注。" },
    { genre: "フォーブス世界2013", name: "ロブ・ウォルトン", date: "1944/10/28", desc: "17位 ウォルマート｜取締役会会長として世界最大の小売のガバナンスを統括。" },
    { genre: "フォーブス世界2013", name: "カール・アルブレヒト", date: "1920/02/20", desc: "18位 アルディ｜独の激安スーパー「Aldi Süd」の創業者。ローコスト経営の祖。" },
    { genre: "フォーブス世界2013", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "19位 Amazon｜Kindleの普及やAWSの潜在成長力で注目を集める。" },
    { genre: "フォーブス世界2013", name: "ラリー・ペイジ", date: "1973/03/26", desc: "20位 Google｜Android・YouTubeの成長を主軸に若くしてトップ富豪の地位。" },
    { genre: "フォーブス世界2013", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "21位 Google｜「Google X」など先進的な未来技術開発を指揮。" },
    { genre: "フォーブス世界2013", name: "ムケシュ・アンバニ", date: "1957/04/19", desc: "21位 リライアンス｜石油精製から小売までインド最大の民間財閥を率いる同国首位。" },
    { genre: "フォーブス世界2013", name: "ミケーレ・フェレロ", date: "1925/04/26", desc: "23位 フェレロ｜「ヌテラ」等で有名な伊のチョコレート菓子メーカーを統括。" },
    { genre: "フォーブス世界2013", name: "李兆基", date: "1928/02/20", desc: "24位 恒基兆業地産｜香港の不動産開発デベロッパー。香港2位の富豪。" },
    { genre: "フォーブス世界2013", name: "デビッド・トムソン", date: "1957/06/12", desc: "24位 トムソン・ロイター｜カナダ代表のメディア・金融情報配信の巨頭。" },
    { genre: "フォーブス世界2013", name: "アル・ワリード・ビン・タラール", date: "1955/03/07", desc: "26位 キングダム・ホールディング｜サウジの王子で国際投資家。" },
    { genre: "フォーブス世界2013", name: "カール・アイカーン", date: "1936/02/16", desc: "26位 アイカーン・エンタープライズ｜株主還元・企業改革を迫る投資手法で利益。" },
    { genre: "フォーブス世界2013", name: "ディーター・シュワルツ", date: "1939/09/24", desc: "29位 シュワルツ・グループ｜ディスカウントスーパー「Lidl」を欧州で拡大。" },
    { genre: "フォーブス世界2013", name: "ジョージ・ソロス", date: "1930/08/12", desc: "30位 ソロス・ファンド・マネジメント｜伝説的ヘッジファンドマネージャー。" },
    { genre: "フォーブス日本2026", name: "孫 正義", date: "1957/08/11", desc: "1位 ソフトバンクグループ｜ソフトバンクの創業者。世界のAI・ハイテク企業へ投資。" },
    { genre: "フォーブス日本2026", name: "柳井 正", date: "1949/02/07", desc: "2位 ファーストリテイリング｜「ユニクロ」「ジーユー」を世界的ブランドに育てた。" },
    { genre: "フォーブス日本2026", name: "滝崎 武光", date: "1945/06/10", desc: "3位 キーエンス｜センサー大手キーエンスの創業者。超高収益モデルを確立。" },
    { genre: "フォーブス日本2026", name: "佐治 信忠", date: "1945/11/25", desc: "4位 サントリーHD｜サントリー創業者一族のトップ。米ビーム社買収などを牽引。" },
    { genre: "フォーブス日本2026", name: "関家一馬（一族）", date: "1974/10/14", desc: "5位 ディスコ｜半導体製造用の切削・研磨装置で世界シェアの大半を握る。" },
    { genre: "フォーブス日本2026", name: "重田 康光", date: "1965/02/25", desc: "6位 光通信｜光通信の創業者。携帯販売やOA機器などを手掛ける。" },
    { genre: "フォーブス日本2026", name: "安田 隆夫", date: "1949/05/07", desc: "7位 PPIH（ドン・キホーテ）｜総合ディスカウントストア「ドン・キホーテ」の創業者。" },
    { genre: "フォーブス日本2026", name: "毒島 秀行", date: "1952/09/25", desc: "8位 SANKYO｜パチンコ・パチスロ大手SANKYO創業者の長男。" },
    { genre: "フォーブス日本2026", name: "竹中 統一", date: "1942/12/25", desc: "9位 竹中工務店｜大手ゼネコン竹中工務店の元社長・会長。" },
    { genre: "フォーブス日本2026", name: "森 章", date: "1936/07/12", desc: "10位 森トラスト｜不動産ディベロッパー森トラストの総帥。" },
    { genre: "フォーブス日本2026", name: "伊藤雅俊（一族）", date: "1924/04/30", desc: "11位 セブン＆アイHD｜イトーヨーカドーやセブンを築いた伊藤雅俊氏の資産を継承。" },
    { genre: "フォーブス日本2026", name: "三木 正浩", date: "1955/07/26", desc: "12位 ABCマート｜靴量販店「ABCマート」の創業者。" },
    { genre: "フォーブス日本2026", name: "三木谷 浩史", date: "1965/03/11", desc: "13位 楽天グループ｜楽天の創業者。EC・金融・モバイルの経済圏を構築。" },
    { genre: "フォーブス日本2026", name: "高原 豪久", date: "1961/07/15", desc: "14位 ユニ・チャーム｜ユニ・チャーム創業者長男。アジア展開を加速。" },
    { genre: "フォーブス日本2026", name: "野田 順弘", date: "1938/08/20", desc: "15位 オービック｜基幹システム（ERP）を提供するIT企業の創業者。" },
    { genre: "フォーブス日本2026", name: "大塚 裕司", date: "1953/09/01", desc: "16位 大塚商会｜ITソリューション商社・大塚商会の2代目社長。" },
    { genre: "フォーブス日本2026", name: "上月 景正", date: "1940/11/12", desc: "17位 コナミグループ｜ゲーム・スポーツクラブ大手コナミの創業者。" },
    { genre: "フォーブス日本2026", name: "小川一維（一族）", date: "1977/10/19", desc: "18位 ゼンショーHD｜「すき家」等を展開する外食日本一のチェーン。" },
    { genre: "フォーブス日本2026", name: "内山庄三郎（一族）", date: "", desc: "19位 レーザーテック｜半導体マスク欠陥検査装置で世界シェア100%の一族。" },
    { genre: "フォーブス日本2026", name: "森佳子（一族）", date: "1940/07/13", desc: "20位 森ビル｜六本木ヒルズ・麻布台ヒルズなど都心の街づくりを行う一族。" },
    { genre: "フォーブス日本2026", name: "永守 重信", date: "1944/08/28", desc: "21位 ニデック（日本電産）｜世界的モーター大手ニデックの創業者。M&Aの達人。" },
    { genre: "フォーブス日本2026", name: "土屋嘉雄（一族）", date: "1932/05/18", desc: "22位 ワークマン／カインズ｜ベイシアグループ創業者。「ワークマン」を一般向けに大ヒット。" },
    { genre: "フォーブス日本2026", name: "元谷外志雄（一族）", date: "1943/06/03", desc: "23位 アパグループ｜日本最大級のホテルチェーン「APAホテル」を築いた。" },
    { genre: "フォーブス日本2026", name: "荒井 正昭", date: "1965/12/17", desc: "24位 オープンハウスグループ｜戸建住宅急成長企業の創業者。" },
    { genre: "フォーブス日本2026", name: "似鳥 昭雄", date: "1944/03/05", desc: "25位 ニトリHD｜家具チェーン「ニトリ」の創業者。" },
    { genre: "フォーブス日本2026", name: "多田 勝美", date: "1945/07/11", desc: "26位 大東建託｜アパート建築・管理大手・大東建託の創業者。" },
    { genre: "フォーブス日本2026", name: "襟川 陽一・恵子", date: "", desc: "27位 コーエーテクモHD｜「信長の野望」などを生んだゲーム業界の名物夫妻。" },
    { genre: "フォーブス日本2026", name: "福嶋 康博", date: "1947/08/18", desc: "28位 スクウェア・エニックス｜旧エニックス創業者。「ドラゴンクエスト」の生みの親。" },
    { genre: "フォーブス日本2026", name: "宇野 正晃", date: "1947/05/18", desc: "29位 コスモス薬品｜九州発「ドラッグコスモス」を全国展開。" },
    { genre: "フォーブス日本2026", name: "石原崇匡（一族）", date: "1978/07/26", desc: "30位 平和｜パチンコ・パチスロ大手「平和」の創業者一族。" },
    { genre: "フォーブス日本2025", name: "柳井正", date: "1949/02/07", desc: "1位 ファーストリテイリング｜ユニクロの海外展開が絶好調で日本首位を維持。" },
    { genre: "フォーブス日本2025", name: "孫正義", date: "1957/08/11", desc: "2位 ソフトバンクグループ｜4年ぶりの最終黒字。AI半導体・データセンターへ投資加速。" },
    { genre: "フォーブス日本2025", name: "滝崎武光", date: "1945/06/10", desc: "3位 キーエンス｜超高収益で知られるFAの覇者。" },
    { genre: "フォーブス日本2025", name: "佐治信忠", date: "1945/11/25", desc: "4位 サントリーHD｜飲料・酒類でグローバルに展開する一族トップ。" },
    { genre: "フォーブス日本2025", name: "重田康光", date: "1965/02/25", desc: "5位 光通信｜通信回線やOA機器を販売する独自基盤を構築。" },
    { genre: "フォーブス日本2025", name: "安田隆夫", date: "1949/05/07", desc: "6位 パン・パシフィック・インターナショナル｜「ドン・キホーテ」創業者。インバウンド復活で資産急増。" },
    { genre: "フォーブス日本2025", name: "高原豪久", date: "1961/07/15", desc: "7位 ユニ・チャーム｜生理用品・おむつの大手。アジア開拓で高収益。" },
    { genre: "フォーブス日本2025", name: "関家一馬（一族）", date: "1974/10/14", desc: "8位 ディスコ｜半導体用精密加工装置。生成AI需要で急上昇。" },
    { genre: "フォーブス日本2025", name: "伊藤雅俊（一族）", date: "1924/04/30", desc: "9位 セブン＆アイHD｜イトーヨーカドーやセブンを育てた一族の資産を管理。" },
    { genre: "フォーブス日本2025", name: "森章", date: "1936/07/12", desc: "10位 森トラスト｜高級ホテル誘致やオフィスビル開発の重鎮。" },
    { genre: "フォーブス日本2025", name: "毒島秀行", date: "1952/09/30", desc: "11位 SANKYO｜パチンコ機大手。スマートパチンコ等のヒットで安定。" },
    { genre: "フォーブス日本2025", name: "三木正浩", date: "1955/07/26", desc: "12位 ABCマート｜靴量販店を全国展開しスニーカーブームを牽引。" },
    { genre: "フォーブス日本2025", name: "三木谷浩史", date: "1965/03/11", desc: "13位 楽天グループ｜携帯赤字圧縮やEC・金融の堅調さで巻き返し。" },
    { genre: "フォーブス日本2025", name: "野田順弘", date: "1938/08/20", desc: "14位 オービック｜独立系SIer。企業のDX需要を取り込む。" },
    { genre: "フォーブス日本2025", name: "小川一維（一族）", date: "1977/10/19", desc: "15位 ゼンショーHD｜「すき家」など外食チェーン。海外M&Aで拡大。" },
    { genre: "フォーブス日本2025", name: "似鳥昭雄", date: "1944/03/05", desc: "16位 ニトリHD｜「ニトリ」創業者。製造物流小売モデルを確立。" },
    { genre: "フォーブス日本2025", name: "上月景正", date: "1940/11/12", desc: "17位 コナミグループ｜スポーツクラブ・アミューズメント・ゲームの複合大手。" },
    { genre: "フォーブス日本2025", name: "大塚裕司", date: "1954/02/13", desc: "18位 大塚商会｜オフィスのIT化や物販サービスを統合。" },
    { genre: "フォーブス日本2025", name: "襟川陽一・恵子", date: "", desc: "19位 コーエーテクモHD｜歴史ゲームIPを多数持ち投資家としても有名。" },
    { genre: "フォーブス日本2025", name: "永守重信", date: "1944/08/28", desc: "20位 ニデック（日本電産）｜精密から大型まで網羅する世界的モーターの王。" },
    { genre: "フォーブス日本2025", name: "森佳子（一族）", date: "1940/07/13", desc: "21位 森ビル｜「ヒルズ」シリーズを展開し都心の価値向上に貢献。" },
    { genre: "フォーブス日本2025", name: "多田勝美", date: "1945/07/12", desc: "22位 大東建託｜賃貸住宅の管理・仲介で圧倒的シェアを構築。" },
    { genre: "フォーブス日本2025", name: "元谷外志雄（一族）", date: "1943/06/03", desc: "23位 アパグループ｜駅前に高密度なビジネスホテルをドミナント展開。" },
    { genre: "フォーブス日本2025", name: "福嶋康博", date: "1947/08/18", desc: "24位 スクウェア・エニックス｜旧エニックス創業者。ドラクエの基盤を作った人物。" },
    { genre: "フォーブス日本2025", name: "宇野正晃", date: "1947/05/18", desc: "25位 コスモス薬品｜小商圏型メガドラッグストア戦略で躍進。" },
    { genre: "フォーブス日本2025", name: "石原崇匡（一族）", date: "1978/07/26", desc: "26位 平和｜パチンコ機大手。ゴルフ場（PGM）も傘下に持つ。" },
    { genre: "フォーブス日本2025", name: "荒井正昭", date: "1965/12/17", desc: "27位 オープンハウスグループ｜狭小地を活用したリーズナブルな戸建で急成長。" },
    { genre: "フォーブス日本2025", name: "金沢一家", date: "", desc: "28位 三洋物産｜「海物語」シリーズなどメガヒット機種を持つメーカー。" },
    { genre: "フォーブス日本2025", name: "加藤功夫", date: "", desc: "29位 カカクコム／デジタルガレージ｜「価格.com」「食べログ」を運営するネット企業の主要創業者。" },
    { genre: "フォーブス日本2025", name: "杉浦広一", date: "1950/07/22", desc: "30位 スギHD｜「スギ薬局」を展開する大手一族。" },
    { genre: "フォーブス日本2024", name: "柳井正", date: "1949/02/07", desc: "1位 ファーストリテイリング｜ユニクロを世界展開。安定成長で日本首位を維持。" },
    { genre: "フォーブス日本2024", name: "孫正義", date: "1957/08/11", desc: "2位 ソフトバンクグループ｜ビジョン・ファンドでハイテク企業へ大規模投資。" },
    { genre: "フォーブス日本2024", name: "滝崎武光", date: "1945/06/10", desc: "3位 キーエンス｜代理店抜きモデルを確立した超高収益センサーメーカー。" },
    { genre: "フォーブス日本2024", name: "佐治信忠", date: "1945/11/25", desc: "4位 サントリーHD｜グローバル展開とM&Aで事業拡大を指揮。" },
    { genre: "フォーブス日本2024", name: "関家一馬（一族）", date: "1974/10/14", desc: "5位 ディスコ｜精密ダイシングソー（切断装置）で世界一のシェア。" },
    { genre: "フォーブス日本2024", name: "高原豪久", date: "1961/07/15", desc: "6位 ユニ・チャーム｜紙おむつ・生理用品をアジアで大ヒットさせ牽引。" },
    { genre: "フォーブス日本2024", name: "重田康光", date: "1965/02/25", desc: "7位 光通信｜インフラ・回線・OA機器を販売するグループを形成。" },
    { genre: "フォーブス日本2024", name: "森章", date: "1936/07/12", desc: "8位 森トラスト｜高級ホテル誘致や都心の超高層ビル開発を牽引。" },
    { genre: "フォーブス日本2024", name: "安田隆夫", date: "1949/05/07", desc: "9位 パン・パシフィック・インターナショナル｜「ドン・キホーテ」のビジネスを開拓。" },
    { genre: "フォーブス日本2024", name: "三木正浩", date: "1955/07/26", desc: "10位 ABCマート｜シューズ量販店の国内最大手チェーンを築いた。" },
    { genre: "フォーブス日本2024", name: "三木谷浩史", date: "1965/03/11", desc: "11位 楽天グループ｜楽天エコシステム（金融・モバイル等）を立ち上げ。" },
    { genre: "フォーブス日本2024", name: "毒島秀行", date: "1952/09/30", desc: "12位 SANKYO｜パチンコ機大手の資産を受け継ぐ一族のリーダー。" },
    { genre: "フォーブス日本2024", name: "野田順弘", date: "1938/08/20", desc: "13位 オービック｜企業の基幹システム「OBIC7」を開発。" },
    { genre: "フォーブス日本2024", name: "伊藤雅俊（一族）", date: "1924/04/30", desc: "14位 セブン＆アイHD｜イトーヨーカドー・セブンを巨大化した創業者の資産を管理。" },
    { genre: "フォーブス日本2024", name: "大塚裕司", date: "1954/02/13", desc: "15位 大塚商会｜オフィス向けIT機器のワンストップサービスを統括。" },
    { genre: "フォーブス日本2024", name: "似鳥昭雄", date: "1944/03/05", desc: "16位 ニトリHD｜製造から物流・販売までを一気通貫するSPAを構築。" },
    { genre: "フォーブス日本2024", name: "小川一維（一族）", date: "1977/10/19", desc: "17位 ゼンショーHD｜「すき家」等を擁する日本最大の外食グループ。" },
    { genre: "フォーブス日本2024", name: "上月景正", date: "1940/11/12", desc: "18位 コナミグループ｜ゲーム開発からスポーツクラブ運営へ拡大。" },
    { genre: "フォーブス日本2024", name: "永守重信", date: "1944/08/28", desc: "19位 ニデック（日本電産）｜小型モーターから車載用まで展開する世界シェア1位。" },
    { genre: "フォーブス日本2024", name: "島野容三", date: "", desc: "20位 シマノ｜世界の自転車部品で圧倒的シェアを持つ。" },
    { genre: "フォーブス日本2024", name: "多田勝美", date: "1945/07/12", desc: "21位 大東建託｜独自の賃貸住宅一括管理で成長。" },
    { genre: "フォーブス日本2024", name: "内山庄三郎（一族）", date: "", desc: "22位 レーザーテック｜EUVマスク検査装置を独占製造。" },
    { genre: "フォーブス日本2024", name: "森佳子（一族）", date: "1940/07/13", desc: "23位 森ビル｜「アークヒルズ」「六本木ヒルズ」等の都市開発を手掛ける。" },
    { genre: "フォーブス日本2024", name: "福嶋康博", date: "1947/08/18", desc: "24位 スクウェア・エニックス｜旧エニックスを創業し「ドラゴンクエスト」を発信。" },
    { genre: "フォーブス日本2024", name: "宇野正晃", date: "1947/05/18", desc: "25位 コスモス薬品｜調剤を強みとした小商圏型の格安ドラッグストア。" },
    { genre: "フォーブス日本2024", name: "荒井正昭", date: "1965/12/17", desc: "26位 オープンハウスグループ｜都心の狭小地を活用した戸建住宅で急成長。" },
    { genre: "フォーブス日本2024", name: "元谷外志雄（一族）", date: "1943/06/03", desc: "27位 アパグループ｜一代で「APAホテル」の巨大ネットワークを構築。" },
    { genre: "フォーブス日本2024", name: "石原崇匡（一族）", date: "1978/07/26", desc: "28位 平和｜パチンコ機器開発およびゴルフ場（PGM）の運営。" },
    { genre: "フォーブス日本2024", name: "杉浦広一", date: "1950/07/22", desc: "29位 スギHD｜調剤併設型の「スギ薬局」で地域医療密着型店舗を展開。" },
    { genre: "フォーブス日本2024", name: "金沢一家", date: "", desc: "30位 三洋物産｜パチンコ業界の定番「海物語」シリーズを開発。" },
    { genre: "フォーブス日本2023", name: "柳井正", date: "1949/02/07", desc: "1位 ファーストリテイリング｜円安による海外ユニクロの利益押し上げで日本首位を独走。" },
    { genre: "フォーブス日本2023", name: "滝崎武光", date: "1945/06/10", desc: "2位 キーエンス｜超ハイリターンな工場用センサー。孫氏を抜き2位に。" },
    { genre: "フォーブス日本2023", name: "孫正義", date: "1957/08/11", desc: "3位 ソフトバンクグループ｜テック株下落やファンドの赤字で資産を減らし3位。" },
    { genre: "フォーブス日本2023", name: "佐治信忠", date: "1945/11/25", desc: "4位 サントリーHD｜酒類・飲料のグローバル安定成長で上位をキープ。" },
    { genre: "フォーブス日本2023", name: "高原豪久", date: "1961/07/15", desc: "5位 ユニ・チャーム｜中国・インドネシア等で衛生用品シェア拡大。" },
    { genre: "フォーブス日本2023", name: "伊藤雅俊（一族）", date: "1924/04/30", desc: "6位 セブン＆アイHD｜2023年に逝去した名誉会長の遺産を一族で管理。" },
    { genre: "フォーブス日本2023", name: "毒島秀行", date: "1952/09/30", desc: "7位 SANKYO｜規制緩和に伴うヒット機で資産堅調。" },
    { genre: "フォーブス日本2023", name: "似鳥昭雄", date: "1944/03/05", desc: "8位 ニトリHD｜円安逆風下でも抜群のコスト管理で店舗網を拡大。" },
    { genre: "フォーブス日本2023", name: "野田順弘", date: "1938/08/20", desc: "9位 オービック｜「OBIC7」の定額制（ストック型）で高収益。" },
    { genre: "フォーブス日本2023", name: "三木正浩", date: "1955/07/26", desc: "10位 ABCマート｜インバウンド復活で靴販売が急回復。" },
    { genre: "フォーブス日本2023", name: "重田康光", date: "1965/02/25", desc: "11位 光通信｜法人向けのストック型販売モデルを徹底。" },
    { genre: "フォーブス日本2023", name: "森章", date: "1936/07/12", desc: "12位 森トラスト｜都心の大型ビルと高級ホテルの開発・運営。" },
    { genre: "フォーブス日本2023", name: "三木谷浩史", date: "1965/03/11", desc: "13位 楽天グループ｜携帯事業の先行投資と赤字が響き順位をやや落とす。" },
    { genre: "フォーブス日本2023", name: "大塚裕司", date: "1954/02/13", desc: "14位 大塚商会｜中小企業向けITとサプライ品販売を展開。" },
    { genre: "フォーブス日本2023", name: "小川一維（一族）", date: "1977/10/19", desc: "15位 ゼンショーHD｜「すき家」を筆頭に外食需要回復を捉え急伸。" },
    { genre: "フォーブス日本2023", name: "安田隆夫", date: "1949/05/07", desc: "16位 パン・パシフィック・インターナショナル｜免税店ドンキに外国人客が戻り業績が上向く。" },
    { genre: "フォーブス日本2023", name: "上月景正", date: "1940/11/12", desc: "17位 コナミグループ｜スポーツジム・esports・家庭用ゲームを世界展開。" },
    { genre: "フォーブス日本2023", name: "永守重信", date: "1944/08/28", desc: "18位 ニデック（日本電産）｜車載・産業用モーターを狙った積極経営。" },
    { genre: "フォーブス日本2023", name: "多田勝美", date: "1945/07/12", desc: "19位 大東建託｜土地活用スキームでアパマン建築・管理の王座を維持。" },
    { genre: "フォーブス日本2023", name: "福嶋康博", date: "1947/08/18", desc: "20位 スクウェア・エニックス｜旧エニックス創業者。ドラクエ等の強力なIPを保有。" },
    { genre: "フォーブス日本2023", name: "宇野正晃", date: "1947/05/18", desc: "21位 コスモス薬品｜「フード＆ドラッグ」戦略で業界トップクラスの効率。" },
    { genre: "フォーブス日本2023", name: "島野容三", date: "", desc: "22位 シマノ｜自転車ブーム後も高いシェアを誇る自転車部品大手。" },
    { genre: "フォーブス日本2023", name: "内山庄三郎（一族）", date: "", desc: "23位 レーザーテック｜最先端半導体向け検査装置が世界で絶賛され資産高騰。" },
    { genre: "フォーブス日本2023", name: "森佳子（一族）", date: "1940/07/13", desc: "24位 森ビル｜2023年開業の「麻布台ヒルズ」など大規模再開発を推進。" },
    { genre: "フォーブス日本2023", name: "石原崇匡（一族）", date: "1978/07/26", desc: "25位 平和｜パチンコ事業とゴルフ場PGMの運営が安定収益に。" },
    { genre: "フォーブス日本2023", name: "杉浦広一", date: "1950/07/22", desc: "26位 スギHD｜調剤とドラッグの融合型店舗でシニア層を囲い込む。" },
    { genre: "フォーブス日本2023", name: "元谷外志雄（一族）", date: "1943/06/03", desc: "27位 アパグループ｜コロナ禍中も手を止めずホテルを開業し続けた。" },
    { genre: "フォーブス日本2023", name: "金沢一家", date: "", desc: "28位 三洋物産｜定番「海物語」の版権・製造を独占。" },
    { genre: "フォーブス日本2023", name: "荒井正昭", date: "1965/12/17", desc: "29位 オープンハウスグループ｜都心のリーズナブルな戸建てという鉱脈を発掘。" },
    { genre: "フォーブス日本2023", name: "襟川陽一・恵子", date: "", desc: "30位 コーエーテクモHD｜ゲーム開発と恵子会長の優れた資金運用の二馬力。" },
    { genre: "フォーブス日本2022", name: "柳井正", date: "1949/02/07", desc: "1位 ファーストリテイリング｜ソフトバンク株下落で日本首位に再び返り咲く。" },
    { genre: "フォーブス日本2022", name: "滝崎武光", date: "1945/06/10", desc: "2位 キーエンス｜超高収益構造で資産が安定し2位に躍進。" },
    { genre: "フォーブス日本2022", name: "孫正義", date: "1957/08/11", desc: "3位 ソフトバンクグループ｜ハイテク株暴落でビジョンファンドが苦戦し3位へ。" },
    { genre: "フォーブス日本2022", name: "佐治信忠", date: "1945/11/25", desc: "4位 サントリーHD｜飲料・酒類ビジネスで安定の4位を死守。" },
    { genre: "フォーブス日本2022", name: "高原豪久", date: "1961/07/15", desc: "5位 ユニ・チャーム｜アジア圏でマスクやおむつの需要増を捉える。" },
    { genre: "フォーブス日本2022", name: "永守重信", date: "1944/08/28", desc: "6位 ニデック（日本電産）｜EV用駆動モーター「E-Axle」への注力で注目。" },
    { genre: "フォーブス日本2022", name: "三木谷浩史", date: "1965/03/11", desc: "7位 楽天グループ｜携帯の先行投資が続く中EC・金融の利益でカバー。" },
    { genre: "フォーブス日本2022", name: "伊藤雅俊", date: "1924/04/30", desc: "8位 セブン＆アイHD｜セブンを日本・世界最大のコンビニへ育てた重鎮。" },
    { genre: "フォーブス日本2022", name: "毒島秀行", date: "1952/09/30", desc: "9位 SANKYO｜パチンコ・パチスロ大手の資産を維持しトップ10。" },
    { genre: "フォーブス日本2022", name: "野田順弘", date: "1938/08/20", desc: "10位 オービック｜テレワーク・DX需要で会計・人事システムが絶好調。" },
    { genre: "フォーブス日本2022", name: "三木正浩", date: "1955/07/26", desc: "11位 ABCマート｜靴販売チェーン。EC化と店舗網の強みで安定。" },
    { genre: "フォーブス日本2022", name: "似鳥昭雄", date: "1944/03/05", desc: "12位 ニトリHD｜巣ごもり需要が一巡する中でも高い経営力を維持。" },
    { genre: "フォーブス日本2022", name: "重田康光", date: "1965/02/25", desc: "13位 光通信｜通信・水・電力のストック型ビジネスを継続。" },
    { genre: "フォーブス日本2022", name: "森章", date: "1936/07/12", desc: "14位 森トラスト｜外資系高級ホテル誘致や都心オフィス開発で安定。" },
    { genre: "フォーブス日本2022", name: "大塚裕司", date: "1954/02/13", desc: "15位 大塚商会｜中小企業向けITサポートと物販で高収益。" },
    { genre: "フォーブス日本2022", name: "上月景正", date: "1940/11/12", desc: "16位 コナミグループ｜人気ゲームIPやカードゲームの世界的ヒット。" },
    { genre: "フォーブス日本2022", name: "多田勝美", date: "1945/07/12", desc: "17位 大東建託｜建築から一括管理までパッケージ化した不動産モデル。" },
    { genre: "フォーブス日本2022", name: "福嶋康博", date: "1947/08/18", desc: "18位 スクウェア・エニックス｜旧エニックス創業者。ドラクエの強いライセンス収入。" },
    { genre: "フォーブス日本2022", name: "宇野正晃", date: "1947/05/18", desc: "19位 コスモス薬品｜食品をフックにした独自のドラッグストア包囲網。" },
    { genre: "フォーブス日本2022", name: "島野容三", date: "", desc: "20位 シマノ｜自転車ブームの恩恵を最大級に受ける。" },
    { genre: "フォーブス日本2022", name: "襟川陽一・恵子", date: "", desc: "21位 コーエーテクモHD｜歴史ゲームと恵子氏の資産運用のハイブリッド。" },
    { genre: "フォーブス日本2022", name: "石原崇匡（一族）", date: "1978/07/26", desc: "22位 平和｜パチンコ機の製造とゴルフ場PGMの運営。" },
    { genre: "フォーブス日本2022", name: "杉浦広一", date: "1950/07/22", desc: "23位 スギHD｜調剤併設型に特化し処方箋ビジネスを強化。" },
    { genre: "フォーブス日本2022", name: "元谷外志雄（一族）", date: "1943/06/03", desc: "24位 アパグループ｜コロナ禍中も逆張りでホテルを大量開業。" },
    { genre: "フォーブス日本2022", name: "金沢一家", date: "", desc: "25位 三洋物産｜大ヒットパチンコ機「海物語」の権利を独占。" },
    { genre: "フォーブス日本2022", name: "荒井正昭", date: "1965/12/17", desc: "26位 オープンハウスグループ｜低金利と住宅需要を追い風に都心の新築戸建を販売。" },
    { genre: "フォーブス日本2022", name: "安田隆夫", date: "1949/05/07", desc: "27位 パン・パシフィック・インターナショナル｜国内ドンキの深夜営業等で健闘。" },
    { genre: "フォーブス日本2022", name: "関家一馬（一族）", date: "1974/10/14", desc: "28位 ディスコ｜半導体用切断装置の需要が高まり一族の資産が上昇。" },
    { genre: "フォーブス日本2022", name: "内山庄三郎（一族）", date: "", desc: "29位 レーザーテック｜EUV向け検査装置の事実上の世界独占で株価急騰。" },
    { genre: "フォーブス日本2022", name: "森佳子（一族）", date: "1940/07/13", desc: "30位 森ビル｜虎ノ門・麻布台エリアの都市開発に向け資産を運用。" },
    { genre: "フォーブス日本2021", name: "孫正義", date: "1957/08/11", desc: "1位 ソフトバンクグループ｜前年から資産を倍以上に増やし日本1位に返り咲き。" },
    { genre: "フォーブス日本2021", name: "柳井正", date: "1949/02/07", desc: "2位 ファーストリテイリング｜約90%資産を増やすも孫氏の猛追を受け2位に。" },
    { genre: "フォーブス日本2021", name: "滝崎武光", date: "1945/06/10", desc: "3位 キーエンス｜FAに不可欠な精密センサーで抜群の利益率。" },
    { genre: "フォーブス日本2021", name: "佐治信忠", date: "1945/11/25", desc: "4位 サントリーHD｜飲料・食品・酒類の国内外での安定成長。" },
    { genre: "フォーブス日本2021", name: "永守重信", date: "1944/08/28", desc: "5位 ニデック（日本電産）｜EVシフトを見据えたモーター事業拡大で急増し5位へ。" },
    { genre: "フォーブス日本2021", name: "高原豪久", date: "1961/07/15", desc: "6位 ユニ・チャーム｜マスク需要やアジアでの衛生用品の伸長。" },
    { genre: "フォーブス日本2021", name: "三木谷浩史", date: "1965/03/11", desc: "7位 楽天グループ｜モバイル投資を進めつつECの巣ごもり特需で好調。" },
    { genre: "フォーブス日本2021", name: "似鳥昭雄", date: "1944/03/05", desc: "8位 ニトリHD｜在宅ワーク需要の家具買い替え特需を捉える。" },
    { genre: "フォーブス日本2021", name: "重田康光", date: "1965/02/25", desc: "9位 光通信｜通信やサービスのストック型ビジネスの積み上げ。" },
    { genre: "フォーブス日本2021", name: "毒島秀行", date: "1952/09/30", desc: "10位 SANKYO｜パチンコ・パチスロ機器大手。安定した地位をキープ。" },
    { genre: "フォーブス日本2021", name: "安田隆夫", date: "1949/05/07", desc: "11位 パン・パシフィック・インターナショナル｜「ドン・キホーテ」の日常使い・ディスカウント戦略。" },
    { genre: "フォーブス日本2021", name: "三木正浩", date: "1955/07/26", desc: "12位 ABCマート｜スニーカー販売チェーン。実店舗の逆風をECで耐える。" },
    { genre: "フォーブス日本2021", name: "伊藤雅俊", date: "1924/04/30", desc: "13位 セブン＆アイHD｜コンビニの利便性がコロナ禍で再評価される。" },
    { genre: "フォーブス日本2021", name: "野田順弘", date: "1938/08/20", desc: "14位 オービック｜クラウド化・DXの流れでERP導入が進む。" },
    { genre: "フォーブス日本2021", name: "森章", date: "1936/07/12", desc: "15位 森トラスト｜都市のオフィスビルと高級外資系ホテルの開発。" },
    { genre: "フォーブス日本2021", name: "大塚裕司", date: "1954/02/13", desc: "16位 大塚商会｜テレワーク・IT機器導入支援が追い風に。" },
    { genre: "フォーブス日本2021", name: "関家一馬（一族）", date: "1974/10/14", desc: "17位 ディスコ｜世界的な半導体不足で精密加工装置の需要が立ち上がる。" },
    { genre: "フォーブス日本2021", name: "上月景正", date: "1940/11/12", desc: "18位 コナミグループ｜『桃太郎電鉄』のヒットや巣ごもりのゲーム需要増。" },
    { genre: "フォーブス日本2021", name: "多田勝美", date: "1945/07/12", desc: "19位 大東建託｜賃貸住宅の建築請負と一括管理の安定収益。" },
    { genre: "フォーブス日本2021", name: "福嶋康博", date: "1947/08/18", desc: "20位 スクウェア・エニックス｜エニックス創業者として保有株式が上昇。" },
    { genre: "フォーブス日本2021", name: "宇野正晃", date: "1947/05/18", desc: "21位 コスモス薬品｜「安い食品」で客を呼ぶ郊外型の巨大ドラッグ戦略。" },
    { genre: "フォーブス日本2021", name: "島野容三", date: "", desc: "22位 シマノ｜密を避ける移動・スポーツとしての自転車ブームで成長。" },
    { genre: "フォーブス日本2021", name: "鈴木敏文", date: "1932/12/01", desc: "23位 セブン＆アイHD｜セブン-イレブンを日本に定着させた流通の神様。" },
    { genre: "フォーブス日本2021", name: "杉浦広一", date: "1950/07/22", desc: "24位 スギHD｜調剤併設で高齢化社会に密着した安定ビジネス。" },
    { genre: "フォーブス日本2021", name: "山田進太郎", date: "1977/09/21", desc: "25位 メルカリ｜断捨離ブームで利用者急増、資産増加率で日本1位に。" },
    { genre: "フォーブス日本2021", name: "襟川陽一・恵子", date: "", desc: "26位 コーエーテクモHD｜スマホゲーム好調に加え恵子氏の株式運用が話題に。" },
    { genre: "フォーブス日本2021", name: "石原崇匡（一族）", date: "1978/07/26", desc: "27位 平和｜パチンコ機製造とゴルフ場PGMの経営。" },
    { genre: "フォーブス日本2021", name: "金沢一家", date: "", desc: "28位 三洋物産｜ホール定番「海物語」シリーズを製造。" },
    { genre: "フォーブス日本2021", name: "小川一維（一族）", date: "1977/10/19", desc: "29位 ゼンショーHD｜「すき家」等でテイクアウト需要を捉え外食で奮闘。" },
    { genre: "フォーブス日本2021", name: "森佳子（一族）", date: "1940/07/13", desc: "30位 森ビル｜「六本木ヒルズ」等の管理と次の大規模再開発の仕込み。" },
    { genre: "フォーブス日本2020", name: "柳井正", date: "1949/02/07", desc: "1位 ファーストリテイリング｜店舗休業の打撃を部屋着需要等で耐え首位キープ。" },
    { genre: "フォーブス日本2020", name: "孫正義", date: "1957/08/11", desc: "2位 ソフトバンクグループ｜投資先の株価低迷で資産を減らすも2位を維持。" },
    { genre: "フォーブス日本2020", name: "滝崎武光", date: "1945/06/10", desc: "3位 キーエンス｜精密センサー大手。株価安定で資産を増やし3位。" },
    { genre: "フォーブス日本2020", name: "佐治信忠", date: "1945/11/25", desc: "4位 サントリーHD｜非上場一族の強みを発揮した飲料・酒類大手。" },
    { genre: "フォーブス日本2020", name: "高原豪久", date: "1961/07/15", desc: "5位 ユニ・チャーム｜マスクや除菌シートが世界的に売れ5位へ大躍進。" },
    { genre: "フォーブス日本2020", name: "三木谷浩史", date: "1965/03/11", desc: "6位 楽天グループ｜巣ごもりの楽天市場EC増がモバイル投資を支える。" },
    { genre: "フォーブス日本2020", name: "重田康光", date: "1965/02/25", desc: "7位 光通信｜OA機器・回線販売のストック型で底堅い利益。" },
    { genre: "フォーブス日本2020", name: "毒島秀行", date: "1952/09/30", desc: "8位 SANKYO｜パチンコ機大手。創業者の長男として一族資産を管理。" },
    { genre: "フォーブス日本2020", name: "似鳥昭雄", date: "1944/03/05", desc: "9位 ニトリHD｜在宅自粛のインテリア・家具の特需を追い風に。" },
    { genre: "フォーブス日本2020", name: "森章", date: "1936/07/12", desc: "10位 森トラスト｜高級ホテル・オフィスビル開発の一族資産で10位。" },
    { genre: "フォーブス日本2020", name: "関家一馬（一族）", date: "1974/10/14", desc: "11位 ディスコ｜半導体用ダイシングソーで世界首位。一族でランクイン。" },
    { genre: "フォーブス日本2020", name: "伊藤雅俊", date: "1924/04/30", desc: "12位 セブン＆アイHD｜イトーヨーカドー・セブンを築いた流通の巨人。" },
    { genre: "フォーブス日本2020", name: "野田順弘", date: "1938/08/20", desc: "13位 オービック｜ERPソフトで盤石な高収益体質。" },
    { genre: "フォーブス日本2020", name: "三木正浩", date: "1955/07/26", desc: "14位 ABCマート｜店舗自粛の逆風下でも網羅的なスニーカー需要で14位。" },
    { genre: "フォーブス日本2020", name: "小川一維（一族）", date: "1977/10/19", desc: "15位 ゼンショーHD｜「すき家」等外食巨頭。テイクアウト対応で健闘。" },
    { genre: "フォーブス日本2020", name: "大塚裕司", date: "1954/02/13", desc: "16位 大塚商会｜テレワーク急増でPC・ITインフラ導入特需。" },
    { genre: "フォーブス日本2020", name: "上月景正", date: "1940/11/12", desc: "17位 コナミグループ｜ゲーム・デジタルエンタメが巣ごもり消費で好調。" },
    { genre: "フォーブス日本2020", name: "永守重信", date: "1944/08/28", desc: "18位 ニデック（日本電産）｜製造業停滞で一時順位を落とすもEVシフトへ投資継続。" },
    { genre: "フォーブス日本2020", name: "多田勝美", date: "1945/07/12", desc: "19位 大東建託｜賃貸住宅の建築・管理。サブリースで安定。" },
    { genre: "フォーブス日本2020", name: "福嶋康博", date: "1947/08/18", desc: "20位 スクウェア・エニックス｜旧エニックス創業者。ゲームブームで保有株が高評価。" },
    { genre: "フォーブス日本2020", name: "森佳子（一族）", date: "1940/07/13", desc: "21位 森ビル｜故・森稔氏の遺族。六本木ヒルズ等の都市開発資産。" },
    { genre: "フォーブス日本2020", name: "宇野正晃", date: "1947/05/18", desc: "22位 コスモス薬品｜自粛中の食品・日用品買い出しで急成長。" },
    { genre: "フォーブス日本2020", name: "鈴木敏文", date: "1932/12/01", desc: "23位 セブン＆アイHD｜日本にコンビニ文化を根付かせた元トップ。" },
    { genre: "フォーブス日本2020", name: "杉浦広一", date: "1950/07/22", desc: "24位 スギHD｜スギ薬局。調剤とマスク・衛生用品特需で堅調。" },
    { genre: "フォーブス日本2020", name: "土屋嘉雄（一族）", date: "1932/05/18", desc: "25位 ワークマン／カインズ｜「ワークマンプラス」のブームで初のトップ30入り。" },
    { genre: "フォーブス日本2020", name: "元谷外志雄（一族）", date: "1943/06/03", desc: "26位 アパグループ｜逆風下でも低価格・大量出店戦略と自己資金力で維持。" },
    { genre: "フォーブス日本2020", name: "荒井正昭", date: "1965/12/17", desc: "27位 オープンハウスグループ｜コロナ下の住宅見直し需要を掴む戸建て販売。" },
    { genre: "フォーブス日本2020", name: "襟川陽一・恵子", date: "", desc: "28位 コーエーテクモHD｜『あつ森』の共同開発や自社タイトルのヒット。" },
    { genre: "フォーブス日本2020", name: "石原崇匡（一族）", date: "1978/07/26", desc: "29位 平和｜パチンコ機製造とゴルフ場PGM経営。一族でランクイン。" },
    { genre: "フォーブス日本2020", name: "島野容三", date: "", desc: "30位 シマノ｜世界的な自転車ブームが始動。" },
    { genre: "フォーブス日本2019", name: "柳井正", date: "1949/02/07", desc: "1位 ファーストリテイリング｜ユニクロ世界進出加速で2年ぶり日本首位。" },
    { genre: "フォーブス日本2019", name: "孫正義", date: "1957/08/11", desc: "2位 ソフトバンクグループ｜ビジョン・ファンドを率いるも株価下落で2位。" },
    { genre: "フォーブス日本2019", name: "滝崎武光", date: "1945/06/10", desc: "3位 キーエンス｜FA需要の高まりで安定の3位。" },
    { genre: "フォーブス日本2019", name: "佐治信忠", date: "1945/11/25", desc: "4位 サントリーHD｜非上場の強みで酒類・飲料で盤石。" },
    { genre: "フォーブス日本2019", name: "三木谷浩史", date: "1965/03/11", desc: "5位 楽天グループ｜経済圏を拡大しモバイル投資を本格化。" },
    { genre: "フォーブス日本2019", name: "重田康光", date: "1965/02/25", desc: "6位 光通信｜法人向けストックビジネスで着実に資産を積み上げ。" },
    { genre: "フォーブス日本2019", name: "毒島秀行", date: "1952/09/30", desc: "7位 SANKYO｜創業者の長男として安定した一族の富を維持。" },
    { genre: "フォーブス日本2019", name: "森章", date: "1936/07/12", desc: "8位 森トラスト｜高級ホテル誘致やビル開発の不動産王。" },
    { genre: "フォーブス日本2019", name: "永守重信", date: "1944/08/28", desc: "9位 ニデック(日本電産)｜モーター需要を牽引しM&Aで世界拡大。" },
    { genre: "フォーブス日本2019", name: "似鳥昭雄", date: "1944/03/05", desc: "10位 ニトリHD｜30期以上連続増収増益の驚異の記録。" },
    { genre: "フォーブス日本2019", name: "伊藤雅俊", date: "1924/04/30", desc: "11位 セブン＆アイHD｜イトーヨーカ堂創業者。流通の礎を築く。" },
    { genre: "フォーブス日本2019", name: "三木正浩", date: "1955/07/26", desc: "12位 ABCマート｜実店舗の強さでシューズ小売の大手。" },
    { genre: "フォーブス日本2019", name: "野田順弘", date: "1938/08/20", desc: "13位 オービック｜独立系SIer。ERPで高収益。" },
    { genre: "フォーブス日本2019", name: "大塚裕司", date: "1954/02/13", desc: "14位 大塚商会｜IT機器販売と「たのめーる」等の物販が堅調。" },
    { genre: "フォーブス日本2019", name: "高原豪久", date: "1961/07/15", desc: "15位 ユニ・チャーム｜アジアで紙おむつシェアを拡大。" },
    { genre: "フォーブス日本2019", name: "関家一馬（一族）", date: "1974/10/14", desc: "16位 ディスコ｜半導体製造用の超精密加工装置で世界を独占。" },
    { genre: "フォーブス日本2019", name: "多田勝美", date: "1945/07/12", desc: "17位 大東建託｜アパート建築請負と一括借上モデルの創業者。" },
    { genre: "フォーブス日本2019", name: "上月景正", date: "1940/11/12", desc: "18位 コナミグループ｜スポーツクラブとゲームが好調。" },
    { genre: "フォーブス日本2019", name: "小川一維（一族）", date: "1977/10/19", desc: "19位 ゼンショーHD｜「すき家」等で外食日本一のチェーン網。" },
    { genre: "フォーブス日本2019", name: "前澤友作", date: "1975/11/22", desc: "20位 ZOZO｜ZOZOTOWNを創業。この年秋にヤフーへ売却。" },
    { genre: "フォーブス日本2019", name: "宇野正晃", date: "1947/05/18", desc: "22位 コスモス薬品｜激安食品を武器に全国へ拡大するドラッグストア。" },
    { genre: "フォーブス日本2019", name: "福嶋康博", date: "1947/08/18", desc: "23位 スクウェア・エニックス｜『ドラクエ』のエニックス創業者。" },
    { genre: "フォーブス日本2019", name: "鈴木敏文", date: "1932/12/01", desc: "24位 セブン＆アイHD｜セブン-イレブンをコンビニ王者に育てた立役者。" },
    { genre: "フォーブス日本2019", name: "杉浦広一", date: "1950/07/22", desc: "25位 スギHD｜調剤併設型ドラッグストアを展開。" },
    { genre: "フォーブス日本2019", name: "森佳子（一族）", date: "1940/07/13", desc: "26位 森ビル｜森稔氏の遺族。六本木ヒルズ等の巨大アセット。" },
    { genre: "フォーブス日本2019", name: "安田隆夫", date: "1949/05/07", desc: "27位 パン・パシフィック(ドン・キホーテ)｜圧縮陳列・深夜営業で急成長。" },
    { genre: "フォーブス日本2019", name: "石原崇匡（一族）", date: "1978/07/26", desc: "28位 平和｜パチンコ機の開発・製造とゴルフ場運営(PGM)。" },
    { genre: "フォーブス日本2019", name: "金沢信明（一族）", date: "1974/09/27", desc: "29位 三洋物産｜『海物語』シリーズの製造メーカー。" },
    { genre: "フォーブス日本2019", name: "襟川陽一", date: "1950/10/26", desc: "30位 コーエーテクモHD｜『信長の野望』など歴史ゲームの老舗。" },
    { genre: "フォーブス日本2018", name: "孫正義", date: "1957/08/11", desc: "1位 ソフトバンクグループ｜10兆円規模のビジョン・ファンドで世界のIT投資を牽引。" },
    { genre: "フォーブス日本2018", name: "柳井正", date: "1949/02/07", desc: "2位 ファーストリテイリング｜ユニクロ・GUを世界展開。" },
    { genre: "フォーブス日本2018", name: "佐治信忠", date: "1945/11/25", desc: "3位 サントリーHD｜ビーム社買収で世界的酒類メーカーへ。" },
    { genre: "フォーブス日本2018", name: "滝崎武光", date: "1945/06/10", desc: "4位 キーエンス｜ファブレスの高収益モデルでセンサー独占。" },
    { genre: "フォーブス日本2018", name: "森章", date: "1936/07/12", desc: "5位 森トラスト｜都心オフィスビル・高級ホテルを開発。" },
    { genre: "フォーブス日本2018", name: "永守重信", date: "1944/08/28", desc: "6位 ニデック(日本電産)｜精密モーターを一代で築きM&Aで拡大。" },
    { genre: "フォーブス日本2018", name: "三木谷浩史", date: "1965/03/11", desc: "7位 楽天グループ｜EC・金融・モバイルの経済圏を構築。" },
    { genre: "フォーブス日本2018", name: "高原慶一朗", date: "1931/03/16", desc: "8位 ユニ・チャーム｜アジア圏へいち早く進出し成功。" },
    { genre: "フォーブス日本2018", name: "似鳥昭雄", date: "1944/03/05", desc: "9位 ニトリHD｜製造から小売まで自社で行うモデルを築く。" },
    { genre: "フォーブス日本2018", name: "毒島秀行", date: "1952/09/30", desc: "10位 SANKYO｜創業者(邦雄氏)の長男として事業を継承。" },
    { genre: "フォーブス日本2018", name: "重田康光", date: "1965/02/25", desc: "11位 光通信｜圧倒的な営業力で販売網を拡大。" },
    { genre: "フォーブス日本2018", name: "伊藤雅俊", date: "1924/04/30", desc: "12位 セブン＆アイHD｜米セブンを買収し世界最大のコンビニへ。" },
    { genre: "フォーブス日本2018", name: "三木正浩", date: "1955/07/26", desc: "13位 ABCマート｜スニーカーブームを捉え全国展開。" },
    { genre: "フォーブス日本2018", name: "前澤友作", date: "1975/11/22", desc: "14位 ZOZO｜ZOZOTOWNを日本最大級のアパレル通販に。" },
    { genre: "フォーブス日本2018", name: "野田順弘", date: "1938/08/20", desc: "15位 オービック｜企業向けERPで日本のIT効率化を支える。" },
    { genre: "フォーブス日本2018", name: "大塚裕司", date: "1954/02/13", desc: "16位 大塚商会｜企業のオフィスIT化・システムインフラを支援。" },
    { genre: "フォーブス日本2018", name: "韓昌祐", date: "1931/02/15", desc: "17位 マルハン｜パチンコ業界のクリーン化・大型店舗化を推進。" },
    { genre: "フォーブス日本2018", name: "上月景正", date: "1940/11/12", desc: "18位 コナミグループ｜世界的ゲーム会社を一代で築く。" },
    { genre: "フォーブス日本2018", name: "宇野正晃", date: "1947/05/18", desc: "19位 コスモス薬品｜小商圏型メガドラッグストアで成功。" },
    { genre: "フォーブス日本2018", name: "多田勝美", date: "1945/07/12", desc: "20位 大東建託｜賃貸経営受託システムで建設・不動産の巨頭に。" },
    { genre: "フォーブス日本2018", name: "鈴木郷史", date: "1954/03/28", desc: "21位 ポーラ・オルビスHD｜訪問販売から店舗・海外展開へ改革。" },
    { genre: "フォーブス日本2018", name: "小林一俊", date: "1962/09/12", desc: "22位 コーセー｜デパコス強化とグローバル化を推進。" },
    { genre: "フォーブス日本2018", name: "岡田和生", date: "1942/10/03", desc: "23位 ユニバーサルエンターテインメント｜比のリゾート開発も主導。" },
    { genre: "フォーブス日本2018", name: "松井道夫", date: "1953/01/03", desc: "24位 松井証券｜日本初のネット専業証券に転換。" },
    { genre: "フォーブス日本2018", name: "土屋嘉雄", date: "1932/08/22", desc: "25位 ワークマン(ベイシア)｜作業服専門店を創業。" },
    { genre: "フォーブス日本2018", name: "大倉博", date: "1940/04/11", desc: "26位 ノエビアHD｜対面販売の化粧品メーカー。新規ランクイン。" },
    { genre: "フォーブス日本2018", name: "襟川陽一", date: "1950/10/26", desc: "27位 コーエーテクモHD｜『信長の野望』等の歴史ゲームを確立。" },
    { genre: "フォーブス日本2018", name: "福嶋康博", date: "1947/08/18", desc: "28位 スクウェア・エニックス｜『ドラクエ』を生んだ立役者。" },
    { genre: "フォーブス日本2018", name: "兼子文雄", date: "1951/05/10", desc: "29位 アイ・ケイ・ケイHD｜ゲストハウス型婚礼施設で成功。" },
    { genre: "フォーブス日本2018", name: "石橋寛（一族）", date: "1946/07/03", desc: "30位 ブリヂストン｜創業者の孫。一族の資産・文化財を管理。" },
    { genre: "フォーブス日本2017", name: "孫正義", date: "1957/08/11", desc: "1位 ソフトバンクグループ｜世界的IT投資の覇権で首位奪還。" },
    { genre: "フォーブス日本2017", name: "柳井正", date: "1949/02/07", desc: "2位 ファーストリテイリング｜ユニクロ海外事業の収益性が向上。" },
    { genre: "フォーブス日本2017", name: "佐治信忠", date: "1945/11/25", desc: "3位 サントリーHD｜ビーム社統合を軌道に。世界的酒類企業へ。" },
    { genre: "フォーブス日本2017", name: "滝崎武光", date: "1945/06/10", desc: "4位 キーエンス｜FAセンサーで海外売上比率50%、驚異の利益率。" },
    { genre: "フォーブス日本2017", name: "三木谷浩史", date: "1965/03/11", desc: "5位 楽天グループ｜フィンテック急成長でEC経済圏を強化。" },
    { genre: "フォーブス日本2017", name: "高原慶一朗", date: "1931/03/16", desc: "6位 ユニ・チャーム｜アジアで紙おむつ・生理用品のシェア拡大。" },
    { genre: "フォーブス日本2017", name: "森章", date: "1936/07/12", desc: "7位 森トラスト｜五輪に向けた都心再開発を先導。" },
    { genre: "フォーブス日本2017", name: "毒島邦雄", date: "1925/04/01", desc: "8位 SANKYO｜創業者逝去後、長男ら一族が経営を継承。" },
    { genre: "フォーブス日本2017", name: "伊藤雅俊", date: "1924/04/30", desc: "9位 セブン＆アイHD｜流通帝国を築き一族の資産を維持。" },
    { genre: "フォーブス日本2017", name: "三木正浩", date: "1955/07/26", desc: "10位 ABCマート｜シューズ小売の王者。インバウンド需要も取り込む。" },
    { genre: "フォーブス日本2017", name: "永守重信", date: "1944/08/28", desc: "11位 ニデック(日本電産)｜EVシフトを見据え車載用モーターを拡大。" },
    { genre: "フォーブス日本2017", name: "毒島秀行", date: "1952/09/30", desc: "12位 SANKYO｜毒島邦雄氏の長男。個人名義でも上位に。" },
    { genre: "フォーブス日本2017", name: "重田康光", date: "1965/02/25", desc: "13位 光通信｜法人向け販売で圧倒的なストックビジネス。" },
    { genre: "フォーブス日本2017", name: "小林一俊", date: "1962/09/12", desc: "14位 コーセー｜ハイエンド化粧品が絶好調。一族でランクイン。" },
    { genre: "フォーブス日本2017", name: "大塚裕司", date: "1954/02/13", desc: "15位 大塚商会｜中小企業向けシステムサービスが堅調。" },
    { genre: "フォーブス日本2017", name: "岡田和生", date: "1942/10/03", desc: "16位 ユニバーサルエンターテインメント｜「オカダ・マニラ」を開業。" },
    { genre: "フォーブス日本2017", name: "韓昌祐", date: "1931/02/15", desc: "17位 マルハン｜パチンコ業界のガリバー。多角化も展開。" },
    { genre: "フォーブス日本2017", name: "前澤友作", date: "1975/11/22", desc: "18位 ZOZO｜出店ブランド急拡大で株価暴騰。若きIT長者。" },
    { genre: "フォーブス日本2017", name: "森佳子（一族）", date: "1940/07/13", desc: "19位 森ビル｜森稔氏の妻。六本木ヒルズ等の不動産資産を継承。" },
    { genre: "フォーブス日本2017", name: "木下盛好", date: "1949/03/12", desc: "20位 アコム｜消費者金融大手として三菱UFJ傘下で安定。" },
    { genre: "フォーブス日本2017", name: "多田直樹", date: "1947/02/12", desc: "21位 サンドラッグ｜1店舗2店長制のローコスト運営で急成長。" },
    { genre: "フォーブス日本2017", name: "安田隆夫", date: "1949/05/07", desc: "22位 ドン・キホーテ(PPIH)｜圧縮陳列の深夜型小売で独走。" },
    { genre: "フォーブス日本2017", name: "宇野正晃", date: "1947/05/18", desc: "23位 コスモス薬品｜食品格安モデルが当たり株価急上昇。" },
    { genre: "フォーブス日本2017", name: "多田勝美", date: "1945/07/12", desc: "24位 大東建託｜相続税対策とアパート建築で高収益を維持。" },
    { genre: "フォーブス日本2017", name: "鈴木郷史", date: "1954/03/28", desc: "25位 ポーラ・オルビスHD｜「リンクルショット」が大ヒット。" },
    { genre: "フォーブス日本2017", name: "野田順弘", date: "1938/08/20", desc: "26位 オービック｜独立系SIerとして会計ソフトで圧倒的シェア。" },
    { genre: "フォーブス日本2017", name: "金沢信求", date: "1956/11/18", desc: "28位 三洋物産｜『海物語』シリーズで莫大な利益。" },
    { genre: "フォーブス日本2017", name: "福嶋康博", date: "1947/08/18", desc: "29位 スクウェア・エニックスHD｜『ドラクエXI』好調で資産維持。" },
    { genre: "フォーブス日本2017", name: "松井道夫", date: "1953/01/03", desc: "30位 松井証券｜業態転換した夫婦名義の一族資産。" },
    { genre: "フォーブス日本2016", name: "柳井正", date: "1949/02/07", desc: "1位 ファーストリテイリング｜暖冬の逆風でも2年連続日本首位。" },
    { genre: "フォーブス日本2016", name: "孫正義", date: "1957/08/11", desc: "2位 ソフトバンクグループ｜アリババ株の含み益で資産増。" },
    { genre: "フォーブス日本2016", name: "佐治信忠", date: "1945/11/25", desc: "3位 サントリーHD｜ビーム社買収後、外部社長を招聘。" },
    { genre: "フォーブス日本2016", name: "滝崎武光", date: "1945/06/10", desc: "4位 キーエンス｜自動化センサー需要で超高収益。" },
    { genre: "フォーブス日本2016", name: "三木谷浩史", date: "1965/03/11", desc: "5位 楽天グループ｜電子マネー・通信事業を強化。" },
    { genre: "フォーブス日本2016", name: "森章", date: "1936/07/12", desc: "6位 森トラスト｜都心一等地の再開発・ホテル事業。" },
    { genre: "フォーブス日本2016", name: "高原慶一朗", date: "1931/03/16", desc: "7位 ユニ・チャーム｜アジアで生理用品・おむつが好調。" },
    { genre: "フォーブス日本2016", name: "毒島邦雄", date: "1925/04/01", desc: "8位 SANKYO｜パチンコ機大手。年末に創業者逝去、一族へ承継。" },
    { genre: "フォーブス日本2016", name: "伊藤雅俊", date: "1924/04/30", desc: "9位 セブン＆アイHD｜コンビニ・流通網で抜群の安定資産。" },
    { genre: "フォーブス日本2016", name: "三木正浩", date: "1955/07/26", desc: "10位 ABCマート｜スニーカーブームとインバウンドで業績拡大。" },
    { genre: "フォーブス日本2016", name: "永守重信", date: "1944/08/28", desc: "11位 ニデック(日本電産)｜車載用モーターへシフトを推進。" },
    { genre: "フォーブス日本2016", name: "重田康光", date: "1965/02/25", desc: "12位 光通信｜ストック型の通信決済代理店ビジネスへ。" },
    { genre: "フォーブス日本2016", name: "森佳子（一族）", date: "1940/07/13", desc: "13位 森ビル｜森稔氏の妻。六本木ヒルズ等の資産を管理。" },
    { genre: "フォーブス日本2016", name: "木下盛好", date: "1949/03/12", desc: "14位 アコム｜創業者の息子。三菱UFJ傘下で安定。" },
    { genre: "フォーブス日本2016", name: "安田隆夫", date: "1949/05/07", desc: "15位 ドン・キホーテ(PPIH)｜圧縮陳列の深夜型小売で巨頭に。" },
    { genre: "フォーブス日本2016", name: "大塚裕司", date: "1954/02/13", desc: "16位 大塚商会｜OA機器・システムインフラ販売で中小企業を支える。" },
    { genre: "フォーブス日本2016", name: "似鳥昭雄", date: "1944/03/05", desc: "17位 ニトリHD｜製造から小売まで内製化しデフレ期に成長。" },
    { genre: "フォーブス日本2016", name: "金沢信求", date: "1956/11/18", desc: "18位 三洋物産｜『海物語』を開発。一族経営で高収益。" },
    { genre: "フォーブス日本2016", name: "多田直樹", date: "1947/02/12", desc: "20位 サンドラッグ｜ローコスト運営で店舗数を急拡大。" },
    { genre: "フォーブス日本2016", name: "前澤友作", date: "1975/11/22", desc: "21位 ZOZO｜ZOZOTOWNの会員数・取扱高が急増。" },
    { genre: "フォーブス日本2016", name: "岡田和生", date: "1942/10/03", desc: "22位 ユニバーサルエンターテインメント｜比のカジノリゾートを主導。" },
    { genre: "フォーブス日本2016", name: "宇野正晃", date: "1947/05/18", desc: "23位 コスモス薬品｜食品を武器にしたメガドラッグストア。新規ランクイン。" },
    { genre: "フォーブス日本2016", name: "多田勝美", date: "1945/07/12", desc: "24位 大東建託｜アパート建築から賃貸管理までパッケージ化。" },
    { genre: "フォーブス日本2016", name: "馬場功淳", date: "1978/01/07", desc: "25位 コロプラ｜『白猫プロジェクト』などのメガヒットで急成長。" },
    { genre: "フォーブス日本2016", name: "小林一俊", date: "1962/09/12", desc: "26位 コーセー｜創業家3代目。高級路線で急浮上。新規ランクイン。" },
    { genre: "フォーブス日本2016", name: "笠原健治", date: "1975/12/06", desc: "27位 MIXI｜『モンスト』の成功で資産を再拡大。" },
    { genre: "フォーブス日本2016", name: "杉浦広一", date: "1950/07/22", desc: "28位 スギHD｜調剤併設型ドラッグストアを全国へ。" },
    { genre: "フォーブス日本2016", name: "松井道夫", date: "1953/01/03", desc: "29位 松井証券｜ネット専業証券の基礎を作る。" },
    { genre: "フォーブス日本2016", name: "福武總一郎", date: "1945/12/14", desc: "30位 ベネッセHD｜進研ゼミでトップ。直島のアート活動も。" },
    { genre: "フォーブス日本2015", name: "柳井正", date: "1949/02/07", desc: "1位 ファーストリテイリング｜ユニクロの海外売上急増で首位返り咲き。" },
    { genre: "フォーブス日本2015", name: "孫正義", date: "1957/08/11", desc: "2位 ソフトバンクグループ｜スプリント再建コストで資産減。" },
    { genre: "フォーブス日本2015", name: "佐治信忠", date: "1945/11/25", desc: "3位 サントリーHD｜創業家3代目。ビーム社買収で大改革。" },
    { genre: "フォーブス日本2015", name: "三木谷浩史", date: "1965/03/11", desc: "4位 楽天グループ｜金融とECの連携、電子マネーを強化。" },
    { genre: "フォーブス日本2015", name: "滝崎武光", date: "1945/06/10", desc: "5位 キーエンス｜3月に会長退任。超高収益の仕組みを完成。" },
    { genre: "フォーブス日本2015", name: "高原慶一朗", date: "1931/03/16", desc: "6位 ユニ・チャーム｜アジアで日用品・おむつ需要が拡大し躍進。" },
    { genre: "フォーブス日本2015", name: "韓昌祐", date: "1931/02/15", desc: "7位 マルハン｜パチンコ業界の王者。店舗のエンタメ化。" },
    { genre: "フォーブス日本2015", name: "毒島邦雄", date: "1925/04/01", desc: "8位 SANKYO｜パチンコ機製造大手。強固な財務体質を維持。" },
    { genre: "フォーブス日本2015", name: "伊藤雅俊", date: "1924/04/30", desc: "9位 セブン&アイHD｜コンビニ・流通のインフラを確立。" },
    { genre: "フォーブス日本2015", name: "森章", date: "1936/07/12", desc: "10位 森トラスト｜高級ホテル展開と都心オフィス開発。" },
    { genre: "フォーブス日本2015", name: "三木正浩", date: "1955/07/26", desc: "11位 ABCマート｜低価格スニーカーの販売網で覇権を維持。" },
    { genre: "フォーブス日本2015", name: "永守重信", date: "1944/08/28", desc: "12位 ニデック(日本電産)｜精密小型モーターで世界シェア。" },
    { genre: "フォーブス日本2015", name: "森佳子（一族）", date: "1940/07/13", desc: "13位 森ビル｜森稔氏の妻。虎ノ門ヒルズ等の一族資産を継承。" },
    { genre: "フォーブス日本2015", name: "重田康光", date: "1965/02/25", desc: "14位 光通信｜法人向けITのストック型ビジネスへ転換。" },
    { genre: "フォーブス日本2015", name: "木下盛好", date: "1949/03/12", desc: "15位 アコム｜創業者の息子。三菱UFJ傘下で経営。" },
    { genre: "フォーブス日本2015", name: "安田隆夫", date: "1949/05/07", desc: "16位 ドン・キホーテ(PPIH)｜6月にCEO退任。創業精神を継承。" },
    { genre: "フォーブス日本2015", name: "似鳥昭雄", date: "1944/03/05", desc: "17位 ニトリHD｜自社製造・自社物流で高粗利を維持。" },
    { genre: "フォーブス日本2015", name: "馬場功淳", date: "1978/01/07", desc: "18位 コロプラ｜『黒猫のウィズ』『白猫プロジェクト』が大ヒット。" },
    { genre: "フォーブス日本2015", name: "大塚裕司", date: "1954/02/13", desc: "19位 大塚商会｜中小企業向けIT一括管理サービスで成功。" },
    { genre: "フォーブス日本2015", name: "金沢信求", date: "1956/11/18", desc: "20位 三洋物産｜『CR海物語』で業界随一の利益率。" },
    { genre: "フォーブス日本2015", name: "多田直樹", date: "1947/02/12", desc: "22位 サンドラッグ｜1店舗2店長制で首都圏に急拡大。" },
    { genre: "フォーブス日本2015", name: "前澤友作", date: "1975/11/22", desc: "23位 ZOZO｜ZOZOTOWNがファッションECの標準に。" },
    { genre: "フォーブス日本2015", name: "笠原健治", date: "1975/12/06", desc: "24位 MIXI｜『モンスト』の大ヒットで業績がV字回復。" },
    { genre: "フォーブス日本2015", name: "多田勝美", date: "1945/07/12", desc: "25位 大東建託｜アパート建設と一括借上(サブリース)で独走。" },
    { genre: "フォーブス日本2015", name: "杉浦広一", date: "1950/07/22", desc: "26位 スギHD｜スギ薬局の出店加速で新規ランクイン。" },
    { genre: "フォーブス日本2015", name: "松井道夫", date: "1953/01/03", desc: "27位 松井証券｜いち早くネット証券に特化。" },
    { genre: "フォーブス日本2015", name: "岡田和生", date: "1942/10/03", desc: "28位 ユニバーサルエンターテインメント｜アミューズ機器とカジノ。" },
    { genre: "フォーブス日本2015", name: "福武總一郎", date: "1945/12/14", desc: "29位 ベネッセHD｜進研ゼミの第一人者。直島でアート活動も。" },
    { genre: "フォーブス日本2015", name: "田中良和", date: "1977/02/18", desc: "30位 グリー(GREE)｜携帯ソーシャルゲームで急成長。" },
    { genre: "フォーブス日本2014", name: "孫正義", date: "1957/08/11", desc: "1位 ソフトバンクグループ｜スプリント買収とアリババ上場観測で株価急騰、首位へ。" },
    { genre: "フォーブス日本2014", name: "柳井正", date: "1949/02/07", desc: "2位 ファーストリテイリング｜ユニクロ好調も孫氏の急上昇で2位に。" },
    { genre: "フォーブス日本2014", name: "三木谷浩史", date: "1965/03/11", desc: "3位 楽天グループ｜電子マネー・プロ野球参入、楽天市場の拡大で資産維持。" },
    { genre: "フォーブス日本2014", name: "滝崎武光", date: "1945/06/10", desc: "4位 キーエンス｜FAセンサー需要で圧倒的な高収益を継続。" },
    { genre: "フォーブス日本2014", name: "毒島邦雄", date: "1925/04/01", desc: "5位 SANKYO｜パチンコ機大手。長男らと財務体質・トップシェアを維持。" },
    { genre: "フォーブス日本2014", name: "森章", date: "1936/07/12", desc: "6位 森トラスト｜都心一等地の再編とホテル事業の拡大を主導。" },
    { genre: "フォーブス日本2014", name: "高原慶一朗", date: "1931/03/16", desc: "7位 ユニ・チャーム｜インドネシア・中国で生理用品・オムツを独占。" },
    { genre: "フォーブス日本2014", name: "伊藤雅俊", date: "1924/04/30", desc: "8位 セブン＆アイHD｜日本のコンビニ・流通の基礎を確立。" },
    { genre: "フォーブス日本2014", name: "三木正浩", date: "1955/07/26", desc: "9位 ABCマート｜ドミナント出店と大量仕入れでシューズ小売の覇権。" },
    { genre: "フォーブス日本2014", name: "永守重信", date: "1944/08/28", desc: "10位 ニデック(日本電産)｜小型精密から中大型・車載用モーターへシフト。" },
    { genre: "フォーブス日本2014", name: "韓昌祐", date: "1931/02/15", desc: "11位 マルハン｜郊外型大型店舗戦略で利益を拡大。" },
    { genre: "フォーブス日本2014", name: "重田康光", date: "1965/02/25", desc: "12位 光通信｜法人向けITインフラのストック型ビジネスへ転換。" },
    { genre: "フォーブス日本2014", name: "森佳子（一族）", date: "1940/07/13", desc: "13位 森ビル｜森稔氏の妻。六本木ヒルズ等の一族資産を継承。" },
    { genre: "フォーブス日本2014", name: "大塚裕司", date: "1954/02/13", desc: "14位 大塚商会｜中小企業向けIT一括管理サービスで成功。" },
    { genre: "フォーブス日本2014", name: "木下盛好", date: "1949/03/12", desc: "15位 アコム｜創業者の息子。三菱UFJ傘下で安定。" },
    { genre: "フォーブス日本2014", name: "安田隆夫", date: "1949/05/07", desc: "16位 ドン・キホーテ(PPIH)｜圧縮陳列・深夜営業で小売の異端児として君臨。" },
    { genre: "フォーブス日本2014", name: "似鳥昭雄", date: "1944/03/05", desc: "17位 ニトリHD｜自社製造・自社物流でデフレ期の強さを発揮。" },
    { genre: "フォーブス日本2014", name: "金沢信求", date: "1956/11/18", desc: "19位 三洋物産｜『海物語』シリーズで際立つ高利益率。" },
    { genre: "フォーブス日本2014", name: "多田直樹", date: "1947/02/12", desc: "20位 サンドラッグ｜ローコスト運営で急成長。" },
    { genre: "フォーブス日本2014", name: "福武總一郎", date: "1945/12/14", desc: "21位 ベネッセHD｜進研ゼミなどの通信教育。直島のアート活動も。" },
    { genre: "フォーブス日本2014", name: "多田勝美", date: "1945/07/12", desc: "22位 大東建託｜アパート建築から賃貸管理まで一括モデルで成功。" },
    { genre: "フォーブス日本2014", name: "岡田和生", date: "1942/10/03", desc: "23位 ユニバーサルエンターテインメント｜アジアの巨大カジノ開発を主導。" },
    { genre: "フォーブス日本2014", name: "田中良和", date: "1977/02/18", desc: "24位 グリー(GREE)｜携帯ソーシャルゲームで急成長した若きIT富豪。" },
    { genre: "フォーブス日本2014", name: "前澤友作", date: "1975/11/22", desc: "25位 ZOZO｜ZOZOTOWNの取扱高が急増し注目を集め始める。" },
    { genre: "フォーブス日本2014", name: "松井道夫", date: "1953/01/03", desc: "26位 松井証券｜日本で初めて本格的なネット取引を導入。" },
    { genre: "フォーブス日本2014", name: "馬場功淳", date: "1978/01/07", desc: "27位 コロプラ｜『黒猫のウィズ』等のヒットで番付に浮上。" },
    { genre: "フォーブス日本2014", name: "盛田賢治（一族）", date: "1951/05/10", desc: "28位 ソニー(元)｜創業者盛田昭夫の親族。一族の資産管理会社で富を維持。" },
    { genre: "フォーブス日本2014", name: "上月景正", date: "1940/11/12", desc: "29位 コナミグループ｜ゲーム・スポーツクラブ大手へ育成。" },
    { genre: "フォーブス日本2014", name: "荻原博", date: "1957/08/16", desc: "30位 ソネット・メディア｜IT・通信・広告事業を興し成功。" },
    { genre: "フォーブス日本2013", name: "柳井正", date: "1949/02/07", desc: "1位 ファーストリテイリング｜ユニクロのグローバル展開を加速し日本首位。" },
    { genre: "フォーブス日本2013", name: "孫正義", date: "1957/08/11", desc: "2位 ソフトバンクグループ｜米スプリント買収を発表。攻めの投資でIT・通信界を牽引。" },
    { genre: "フォーブス日本2013", name: "三木谷浩史", date: "1965/03/11", desc: "3位 楽天グループ｜楽天市場の拡大や電子書籍Koboなど多角化を進める。" },
    { genre: "フォーブス日本2013", name: "佐治信忠", date: "1945/11/25", desc: "4位 サントリーHD｜創業家の代表。強固なブランド力で上位。" },
    { genre: "フォーブス日本2013", name: "滝崎武光", date: "1945/06/10", desc: "5位 キーエンス｜製造現場向けセンサーの高収益ビジネスを構築。" },
    { genre: "フォーブス日本2013", name: "森章", date: "1936/07/12", desc: "6位 森トラスト｜都心ビル賃貸と高級ホテル経営を軸に不動産の一翼を担う。" },
    { genre: "フォーブス日本2013", name: "高原慶一朗", date: "1931/03/16", desc: "7位 ユニ・チャーム｜アジアでのシェア拡大が評価され資産を大きく増加。" },
    { genre: "フォーブス日本2013", name: "毒島邦雄", date: "1925/04/01", desc: "8位 SANKYO｜パチンコ・パチスロ機器で圧倒的シェアとキャッシュフロー。" },
    { genre: "フォーブス日本2013", name: "韓昌祐", date: "1931/02/15", desc: "9位 マルハン｜パチンコホールの全国チェーン展開でアミューズ業界トップ。" },
    { genre: "フォーブス日本2013", name: "伊藤雅俊", date: "1924/04/30", desc: "10位 セブン＆アイHD｜セブン-イレブン・イトーヨーカドーの基礎を創った巨頭。" },
    { genre: "フォーブス日本2013", name: "三木正浩", date: "1955/07/26", desc: "11位 ABCマート｜シューズ小売の覇者。ドミナント出店を成功させる。" },
    { genre: "フォーブス日本2013", name: "森佳子（一族）", date: "1940/07/13", desc: "12位 森ビル｜森稔氏亡き後、六本木ヒルズ等を運営する森ビルの資産を相続。" },
    { genre: "フォーブス日本2013", name: "永守重信", date: "1944/08/28", desc: "13位 ニデック(日本電産)｜精密モーターで世界シェアトップ。車載用に本格参入。" },
    { genre: "フォーブス日本2013", name: "大塚裕司", date: "1954/02/13", desc: "14位 大塚商会｜中小企業へのITシステム・複合機導入で顧客基盤を確立。" },
    { genre: "フォーブス日本2013", name: "安田隆夫", date: "1949/05/07", desc: "15位 ドン・キホーテ(PPIH)｜深夜営業とアミューズメント性で成長。" },
    { genre: "フォーブス日本2013", name: "重田康光", date: "1965/02/25", desc: "16位 光通信｜携帯販売代理店から法人向けストック型サービスへ多角化。" },
    { genre: "フォーブス日本2013", name: "似鳥昭雄", date: "1944/03/05", desc: "17位 ニトリHD｜製造・物流・販売を垂直統合(SPA)しデフレ下でも連続増益。" },
    { genre: "フォーブス日本2013", name: "金沢信求", date: "1956/11/18", desc: "18位 三洋物産｜『海物語』の知的財産で高収益。" },
    { genre: "フォーブス日本2013", name: "木下盛好", date: "1949/03/12", desc: "19位 アコム｜消費者金融大手。三菱UFJグループの機能会社として安定。" },
    { genre: "フォーブス日本2013", name: "福武總一郎", date: "1945/12/14", desc: "20位 ベネッセHD｜「進研ゼミ」等の通信教育と教育・介護事業を展開。" },
    { genre: "フォーブス日本2013", name: "岡田和生", date: "1942/10/03", desc: "21位 ユニバーサルエンターテインメント｜比の大型カジノリゾート開発へ舵を切る。" },
    { genre: "フォーブス日本2013", name: "田中良和", date: "1977/02/18", desc: "22位 グリー(GREE)｜ガラケー向けSNSゲームで一世を風靡。" },
    { genre: "フォーブス日本2013", name: "多田直樹", date: "1947/02/12", desc: "23位 サンドラッグ｜調剤・ドラッグストアでローコストモデルを貫き業績拡大。" },
    { genre: "フォーブス日本2013", name: "多田勝美", date: "1945/07/12", desc: "24位 大東建託｜地主向けアパート建築と一括借上で独走。" },
    { genre: "フォーブス日本2013", name: "松井道夫", date: "1953/01/03", desc: "25位 松井証券｜ネット証券の草分け。手数料定額制などを主導。" },
    { genre: "フォーブス日本2013", name: "盛田賢治（一族）", date: "1951/05/10", desc: "26位 ソニー(元)｜ソニー共同創業者の一族。資産管理会社で財産を守る。" },
    { genre: "フォーブス日本2013", name: "上月景正", date: "1940/11/12", desc: "27位 コナミグループ｜ゲーム事業・アミューズ機器・スポーツクラブが堅調。" },
    { genre: "フォーブス日本2013", name: "馬場功淳", date: "1978/01/07", desc: "28位 コロプラ｜位置情報ゲームから『黒猫のウィズ』へ繋げ番付入り。" },
    { genre: "フォーブス日本2013", name: "荻原博", date: "1957/08/16", desc: "29位 ソネット・メディア｜ネット広告・マーケティング技術で資産を増やす。" },
    { genre: "フォーブス日本2013", name: "石原昌幸", date: "1948/11/22", desc: "30位 平和(HEIWA)｜パチンコ機大手。PGM(ゴルフ場事業)買収等で拡大。" },
    { genre: "富家", name: "フランソワーズ・ベッテンコート・メイヤーズ", date: "1953/07/10", desc: "生まれながらの富裕層・化粧品／L'Oreal" },
    { genre: "富家", name: "毒島秀行", date: "1952/09/30", desc: "生まれながらの富裕層・遊技機製造／SANKYO" },
    // ---- ISD著名フォルダから追加(2026-07-09) ----
    { genre: "音楽", name: "AK69", date: "1978/08/28", desc: "ヒップホップMC・音楽プロデューサー。" },
    { genre: "科学・発明", name: "ジェームズ・ダイソン", date: "1947/05/02", desc: "サイクロン掃除機で知られるダイソン創業者・発明家。" },
    { genre: "芸能・エンタメ", name: "ダレノガレ明美", date: "1990/07/16", desc: "タレント・モデル。" },
    { genre: "芸能・エンタメ", name: "松山ケンイチ", date: "1985/03/05", desc: "『デスノート』などで知られる俳優。" },
    { genre: "実業家", name: "桜庭露樹", date: "1969/09/04", desc: "「運の学校」などで知られる実業家・作家。" },
    { genre: "芸能・エンタメ", name: "細木数子", date: "1938/04/04", desc: "六星占術で一世を風靡した占い師・タレント。" },
    { genre: "実業家", name: "三崎優太", date: "1989/03/29", desc: "「青汁王子」として知られる実業家。" },
    { genre: "芸能・エンタメ", name: "西野亮廣", date: "1980/07/03", desc: "キングコングのお笑い芸人・絵本作家。" },
    { genre: "実業家", name: "高田明", date: "1948/11/03", desc: "ジャパネットたかた創業者。" },
    { genre: "実業家", name: "堀江貴文", date: "1972/10/29", desc: "実業家（ホリエモン）。ライブドア元社長。" },
    { genre: "実業家", name: "カルロス・ゴーン", date: "1954/03/09", desc: "日産自動車を再建した元CEO。" },
    { genre: "実業家", name: "木村清", date: "1952/04/19", desc: "「すしざんまい」を展開する喜代村の創業者。" },
    { genre: "実業家", name: "田中実", date: "1962/05/06", desc: "「価格.com」「食べログ」を生んだカカクコム創業者。" },
    { genre: "実業家", name: "森川亮", date: "1967/01/13", desc: "LINE元社長。C Channel創業者。" },
    { genre: "偉人", name: "新渡戸稲造", date: "1862/09/01", desc: "『武士道』を著した教育者・国際人。" },
    { genre: "芸能・エンタメ", name: "ローランド", date: "1992/07/27", desc: "「現代ホスト界の帝王」と称される実業家。" },
    { genre: "実業家", name: "与沢翼", date: "1982/11/11", desc: "「秒速で稼ぐ男」として知られる実業家・投資家。" },
    { genre: "スポーツ", name: "タイガー・ウッズ", date: "1975/12/30", desc: "ゴルフ史を代表するプロゴルファー。" },
    { genre: "芸能・エンタメ", name: "マツコ・デラックス", date: "1972/10/26", desc: "コラムニスト・タレント。" },
    { genre: "科学・発明", name: "苫米地英人", date: "1959/09/07", desc: "認知科学者・実業家。" },
    { genre: "文学", name: "本田健", date: "1967/08/23", desc: "『ユダヤ人大富豪の教え』などの作家。" },
  ];

  // ===== 宿曜 命宿エンジン（senjutsu.jp の精密旧暦テーブルを移植・1900〜2099） =====
  // solarToLunar: 旧暦へ変換 / honmeiShuku: 旧暦月の基準宿から日数ぶん進めて命宿を出す。
  // 自作の天文計算(月位置)と全13人で一致を確認済み＝命宿は正確。
  var EPOCH_DATE_UTC=Date.UTC(1900,0,1);
  var EPOCH_YEAR=1900;
  var MONTH_START={1:"室",2:"奎",3:"胃",4:"畢",5:"参",6:"鬼",7:"張",8:"角",9:"氐",10:"心",11:"斗",12:"虚"};
  var SHUKU_27=["昴","畢","觜","参","井","鬼","柳","星","張","翼","軫","角","亢","氐","房","心","尾","箕","斗","女","虚","危","室","壁","奎","婁","胃"];
  var LUNAR_YEARS=[[30,[29,30,29,29,30,29,30,30,30,30,29,30],8,29],[414,[29,30,29,29,30,29,30,29,30,30,30,29],0,0],[768,[30,29,30,29,29,30,29,30,29,30,30,30],0,0],[1123,[29,30,29,30,29,30,29,30,29,30,30,29],5,29],[1506,[30,30,29,30,29,29,30,29,30,29,30,29],0,0],[1860,[30,30,30,29,30,29,29,30,29,30,29,30],0,0],[2215,[29,30,30,29,29,30,29,30,29,30,29,30],4,30],[2599,[29,30,29,30,30,29,30,29,30,29,30,29],0,0],[2953,[30,29,30,29,30,29,30,29,30,30,29,30],0,0],[3308,[29,30,29,30,29,30,30,29,30,30,29,30],2,29],[3692,[29,30,29,29,30,29,30,29,30,30,30,29],0,0],[4046,[30,29,30,29,29,30,29,30,30,30,29,30],6,29],[4430,[30,29,30,29,29,30,29,29,30,30,29,30],0,0],[4784,[30,30,29,30,29,29,30,29,29,30,29,30],0,0],[5138,[30,30,29,30,30,29,30,29,30,29,29,30],5,29],[5522,[30,29,30,30,29,30,29,30,29,30,29,30],0,0],[5877,[29,30,29,30,29,30,30,29,30,29,30,29],0,0],[6231,[30,29,30,29,30,30,29,30,30,29,30,29],2,29],[6615,[30,29,29,30,29,30,29,30,30,30,29,30],0,0],[6970,[29,30,29,29,30,29,30,30,30,29,30,30],7,29],[7354,[29,30,29,29,30,29,29,30,30,29,30,30],0,0],[7708,[30,29,30,29,29,30,29,29,30,29,30,30],0,0],[8062,[30,29,30,30,29,30,29,29,30,29,30,30],5,29],[8446,[29,30,30,29,30,29,30,29,30,29,29,30],0,0],[8800,[30,29,30,29,30,30,29,30,29,30,29,29],0,0],[9154,[30,29,30,30,30,29,30,30,29,30,29,30],4,29],[9539,[29,29,30,29,30,29,30,30,29,30,30,29],0,0],[9893,[30,29,29,30,29,30,29,30,30,29,30,30],0,0],[10248,[29,30,29,30,29,29,30,30,29,30,30,30],2,29],[10632,[29,30,29,29,30,29,29,30,29,30,30,30],0,0],[10986,[29,30,30,29,29,30,29,30,29,30,30,29],6,29],[11369,[30,30,30,29,29,30,29,29,30,29,30,29],0,0],[11723,[30,30,30,29,30,29,30,29,29,30,29,30],0,0],[12078,[29,30,30,29,30,29,30,29,30,29,29,30],5,30],[12462,[29,30,29,30,30,29,30,30,29,30,29,30],0,0],[12817,[29,29,30,29,30,29,30,30,29,30,30,29],0,0],[13171,[30,29,29,29,30,29,30,29,30,30,30,29],3,30],[13555,[30,29,29,30,29,29,30,29,30,30,30,29],0,0],[13909,[30,30,29,29,30,29,29,29,30,30,29,30],7,30],[14293,[30,30,29,29,30,29,29,30,29,30,29,30],0,0],[14647,[30,30,29,30,29,30,29,29,30,29,30,29],0,0],[15001,[30,30,29,30,30,29,29,29,30,29,30,29],6,30],[15385,[30,29,30,30,29,30,30,29,30,29,29,30],0,0],[15740,[29,30,29,30,29,30,30,29,30,30,29,30],0,0],[16095,[29,29,30,29,29,30,29,30,30,29,30,30],4,30],[16479,[29,29,30,29,29,30,29,30,30,30,29,30],0,0],[16833,[30,29,29,30,29,29,30,29,30,30,29,30],0,0],[17187,[30,30,29,30,29,29,30,29,30,29,30,30],2,29],[17571,[30,29,30,29,30,29,29,30,29,30,29,30],0,0],[17925,[30,30,29,30,29,30,29,30,29,30,29,30],7,29],[18309,[30,29,30,30,29,30,29,29,30,29,30,29],0,0],[18663,[30,29,30,30,29,30,29,30,29,30,29,30],0,0],[19018,[29,30,29,30,29,30,29,30,29,30,29,30],5,30],[19402,[29,30,29,29,30,30,29,30,30,29,30,30],0,0],[19757,[29,29,30,29,29,30,29,30,30,29,30,30],0,0],[20111,[30,29,29,29,29,30,29,30,29,30,30,30],3,30],[20495,[29,30,29,30,29,29,30,29,30,29,30,30],0,0],[20849,[30,29,30,29,30,29,29,30,30,29,30,30],8,29],[21233,[29,30,30,29,30,29,29,30,29,30,29,30],0,0],[21587,[29,30,30,29,30,29,30,29,30,29,30,29],0,0],[21941,[30,29,30,29,30,30,30,29,30,29,30,29],6,29],[22325,[30,29,30,29,30,29,30,30,29,30,29,30],0,0],[22680,[29,30,29,29,30,29,30,30,29,30,30,29],0,0],[23034,[30,29,30,29,30,29,30,29,30,30,30,29],4,29],[23418,[30,29,30,29,29,30,29,30,29,30,30,30],0,0],[23773,[29,30,29,30,29,29,30,29,29,30,30,30],0,0],[24127,[29,30,30,30,29,29,30,29,29,30,30,29],3,29],[24510,[30,30,29,30,30,29,29,30,29,30,29,30],0,0],[24865,[29,30,30,29,30,29,30,30,29,30,29,30],7,29],[25249,[29,30,29,30,29,30,30,29,30,29,30,29],0,0],[25603,[30,29,29,30,30,29,30,29,30,30,29,30],0,0],[25958,[29,30,29,29,30,30,29,30,30,30,29,30],5,29],[26342,[29,30,29,29,30,29,30,29,30,30,30,29],0,0],[26696,[30,29,30,29,29,30,29,29,30,30,30,29],0,0],[27050,[30,30,29,30,29,30,29,29,30,30,29,30],4,29],[27434,[30,30,29,30,29,29,30,29,29,30,29,30],0,0],[27788,[30,30,29,30,29,30,29,30,30,29,29,30],8,29],[28172,[30,29,30,30,29,30,29,30,29,30,29,29],0,0],[28526,[30,30,29,30,29,30,30,29,30,29,30,29],0,0],[28881,[30,29,29,30,29,30,29,30,30,29,30,29],6,30],[29265,[30,29,29,30,29,30,29,30,30,29,30,30],0,0],[29620,[29,30,29,29,30,29,29,30,30,29,30,30],0,0],[29974,[30,29,30,29,30,29,29,30,30,29,30,30],4,29],[30358,[30,29,30,29,29,30,29,29,30,29,30,30],0,0],[30712,[30,29,30,30,29,29,30,29,29,30,30,30],10,29],[31096,[29,30,30,29,30,29,30,29,29,30,29,30],0,0],[31450,[29,30,30,29,30,30,29,30,29,30,29,29],0,0],[31804,[30,29,30,30,29,30,30,30,29,30,29,30],6,29],[32189,[29,29,30,29,30,29,30,30,29,30,30,29],0,0],[32543,[30,29,29,30,29,30,29,30,30,29,30,30],0,0],[32898,[29,30,29,29,30,29,30,30,29,30,30,30],5,29],[33282,[29,30,29,29,30,29,29,30,29,30,30,30],0,0],[33636,[29,30,30,29,29,30,29,29,30,29,30,30],0,0],[33990,[29,30,30,30,29,30,29,29,30,29,30,29],3,29],[34373,[30,30,30,29,30,29,30,29,29,30,29,30],0,0],[34728,[29,30,30,29,30,30,29,30,30,29,29,30],8,29],[35112,[29,30,29,30,30,29,30,29,30,30,29,30],0,0],[35467,[29,29,30,29,30,29,30,30,29,30,30,29],0,0],[35821,[30,29,29,30,29,30,30,29,30,30,30,29],5,29],[36205,[30,29,29,30,29,29,30,29,30,30,30,29],0,0],[36559,[30,30,29,29,30,29,29,30,29,30,30,29],0,0],[36913,[30,30,30,29,30,29,29,30,29,30,29,30],4,29],[37297,[30,30,29,30,29,30,29,29,30,29,30,29],0,0],[37651,[30,30,29,30,30,29,30,29,29,30,29,30],0,0],[38006,[29,30,30,30,29,30,29,30,29,30,29,30],2,29],[38390,[29,30,29,30,29,30,30,29,30,30,29,29],0,0],[38744,[30,29,30,29,30,29,30,30,30,29,30,30],7,29],[39129,[29,29,30,29,29,30,29,30,30,30,29,30],0,0],[39483,[30,29,29,30,29,29,30,29,30,30,29,30],0,0],[39837,[30,30,29,29,30,29,30,29,30,29,30,30],5,29],[40221,[30,29,30,29,30,29,29,30,29,30,29,30],0,0],[40575,[30,29,30,30,29,30,29,29,30,29,30,29],0,0],[40929,[30,29,30,30,29,30,29,29,30,29,30,29],3,30],[41313,[30,29,30,30,29,30,29,30,29,30,29,30],0,0],[41668,[29,30,29,30,29,30,29,30,30,30,29,30],9,29],[42052,[29,30,29,29,30,29,30,30,30,29,30,29],0,0],[42406,[30,29,30,29,29,30,29,30,30,29,30,30],0,0],[42761,[29,30,29,30,29,30,29,30,29,30,30,30],5,29],[43145,[29,30,29,30,29,29,30,29,30,29,30,30],0,0],[43499,[30,29,30,29,30,29,29,30,29,30,29,30],0,0],[43853,[30,29,30,30,30,29,29,30,29,30,29,30],4,29],[44237,[29,30,30,29,30,29,30,29,30,29,30,29],0,0],[44591,[30,29,30,29,30,30,29,30,29,30,29,30],0,0],[44946,[29,30,30,29,30,29,30,30,29,30,29,30],2,29],[45330,[29,30,29,29,30,29,30,30,29,30,30,29],0,0],[45684,[30,29,30,29,29,30,30,29,30,30,30,29],6,29],[46068,[30,29,30,29,29,30,29,30,29,30,30,30],0,0],[46423,[29,30,29,30,29,29,30,29,29,30,30,30],0,0],[46777,[29,30,30,29,30,29,30,29,29,30,30,29],5,29],[47160,[30,30,29,30,30,29,29,30,29,29,30,30],0,0],[47515,[29,30,29,30,30,29,30,29,30,29,30,29],0,0],[47869,[30,29,30,30,29,30,30,29,30,29,30,29],3,29],[48253,[30,29,29,30,29,30,30,29,30,30,29,30],0,0],[48608,[29,30,29,29,30,29,30,29,30,30,30,30],11,29],[48992,[29,30,29,29,30,29,30,29,30,30,30,29],0,0],[49346,[30,29,30,29,29,30,29,29,30,30,29,30],0,0],[49700,[30,30,29,30,29,29,29,29,30,30,29,30],6,30],[50084,[30,30,29,30,29,29,30,29,29,30,29,30],0,0],[50438,[30,30,29,30,29,30,29,30,29,29,30,29],0,0],[50792,[30,30,29,30,30,30,29,30,29,30,29,29],5,29],[51176,[30,29,30,30,29,30,30,29,30,29,30,29],0,0],[51531,[30,29,29,30,29,30,30,29,30,30,29,30],0,0],[51886,[29,30,29,30,29,30,29,30,30,29,30,30],2,29],[52270,[29,30,29,29,30,29,29,30,30,29,30,30],0,0],[52624,[30,29,30,29,29,30,29,30,29,30,30,30],7,29],[53008,[30,29,30,29,29,30,29,29,30,29,30,30],0,0],[53362,[30,29,30,30,29,29,30,29,29,30,29,30],0,0],[53716,[30,29,30,30,29,29,30,29,29,30,29,30],5,30],[54100,[29,30,30,29,30,30,29,30,29,30,29,29],0,0],[54454,[30,29,30,29,30,30,29,30,30,29,30,29],0,0],[54809,[30,29,29,29,30,29,30,30,29,30,30,29],3,30],[55193,[30,29,29,30,29,30,29,30,29,30,30,30],0,0],[55548,[29,30,29,29,30,29,29,30,29,30,30,30],8,30],[55932,[29,30,29,29,30,29,29,30,29,30,30,30],0,0],[56286,[29,30,30,29,29,30,29,29,30,29,30,30],0,0],[56640,[29,30,30,29,30,29,29,29,30,29,30,29],6,30],[57023,[30,30,30,29,30,29,30,29,29,30,29,30],0,0],[57378,[29,30,30,29,30,29,30,30,29,29,30,29],0,0],[57732,[30,29,30,29,30,29,30,29,30,30,29,29],4,30],[58116,[30,29,30,29,30,29,30,30,29,30,30,29],0,0],[58471,[30,29,29,30,29,29,30,30,29,30,30,30],0,0],[58826,[29,30,29,30,29,29,30,29,30,30,30,29],3,29],[59209,[30,30,29,29,30,29,29,30,29,30,30,29],0,0],[59563,[30,30,29,30,29,30,29,30,29,30,29,30],7,29],[59947,[30,30,29,30,29,30,29,29,30,29,30,29],0,0],[60301,[30,30,29,30,30,29,30,29,29,30,29,30],0,0],[60656,[29,30,29,30,30,30,29,30,29,30,29,30],5,29],[61040,[29,30,29,30,29,30,30,29,30,29,30,29],0,0],[61394,[30,29,30,29,30,29,30,29,30,30,29,30],0,0],[61749,[30,29,29,30,29,30,29,30,30,30,29,30],4,29],[62133,[30,29,29,30,29,29,30,29,30,30,29,30],0,0],[62487,[30,30,29,29,30,29,29,30,30,29,30,30],8,29],[62871,[30,29,30,29,30,29,29,30,29,30,29,30],0,0],[63225,[30,29,30,30,29,30,29,29,30,29,30,29],0,0],[63579,[30,29,30,30,29,30,29,29,30,29,30,29],6,30],[63963,[30,29,30,29,30,30,29,30,29,30,29,30],0,0],[64318,[29,30,29,30,29,30,29,30,30,29,30,29],0,0],[64672,[30,29,30,29,30,29,30,30,30,29,30,29],4,29],[65056,[30,29,30,29,29,30,29,30,30,29,30,30],0,0],[65411,[29,30,29,30,29,29,30,29,30,29,30,30],0,0],[65765,[30,29,30,30,29,29,30,29,30,29,30,30],3,29],[66149,[30,29,30,29,30,29,29,30,29,29,30,30],0,0],[66503,[29,30,30,30,29,30,29,30,29,30,29,30],7,29],[66887,[29,30,30,29,30,29,30,29,30,29,30,29],0,0],[67241,[30,29,30,29,30,30,29,30,29,30,29,30],0,0],[67596,[29,30,29,29,30,29,30,30,29,30,29,30],5,30],[67980,[29,30,29,29,30,29,30,30,29,30,30,29],0,0],[68334,[30,29,30,29,29,30,29,30,29,30,30,30],0,0],[68689,[29,30,29,30,29,30,29,29,30,30,30,30],4,29],[69073,[29,30,29,30,29,29,30,29,29,30,30,29],0,0],[69426,[30,30,30,29,30,29,29,30,29,30,30,29],8,29],[69810,[30,30,29,30,29,30,29,30,29,29,30,30],0,0],[70165,[29,30,29,30,30,29,30,29,30,29,30,29],0,0],[70519,[30,29,30,29,30,29,30,29,30,29,30,29],6,30],[70903,[30,29,29,30,29,30,30,29,30,30,29,30],0,0],[71258,[29,30,29,29,30,29,30,29,30,30,30,29],0,0],[71612,[30,29,30,29,30,29,30,29,30,30,30,29],4,29],[71996,[30,29,30,29,29,30,29,29,30,30,29,30],0,0],[72350,[30,30,29,30,29,29,30,29,29,30,30,29],0,0],[72704,[30,30,30,30,29,29,30,29,29,30,29,30],3,29]];
  function daysSinceEpoch(y,m,d){return Math.floor((Date.UTC(y,m-1,d)-EPOCH_DATE_UTC)/86400000);}
  function solarToLunar(y,m,d){var target=daysSinceEpoch(y,m,d);if(target<0)return null;if(!Array.isArray(LUNAR_YEARS)||LUNAR_YEARS.length===0)return null;function entryNyd(i){var e=LUNAR_YEARS[i];return(e&&typeof e[0]==="number")?e[0]:null;}var lo=0,hi=LUNAR_YEARS.length-1,idx=-1;while(lo<=hi){var mid=(lo+hi)>>1;var nyd=entryNyd(mid);if(nyd===null){var leftValid=mid-1,rightValid=mid+1;while(leftValid>=lo&&entryNyd(leftValid)===null)leftValid--;while(rightValid<=hi&&entryNyd(rightValid)===null)rightValid++;if(leftValid>=lo){nyd=entryNyd(leftValid);if(nyd<=target){idx=leftValid;lo=mid+1;}else hi=leftValid-1;}else if(rightValid<=hi){nyd=entryNyd(rightValid);if(nyd<=target){idx=rightValid;lo=rightValid+1;}else hi=mid-1;}else{break;}continue;}if(nyd<=target){idx=mid;lo=mid+1;}else hi=mid-1;}if(idx<0)return null;var nxt=idx+1;while(nxt<LUNAR_YEARS.length&&entryNyd(nxt)===null)nxt++;if(nxt<LUNAR_YEARS.length){var nxtNyd=entryNyd(nxt);if(target>=nxtNyd)idx=nxt;}var entry=LUNAR_YEARS[idx];if(!entry)return null;var newYearDays=entry[0];var mlens=entry[1];var leapMonth=entry[2];var leapLen=entry[3];var offset=target-newYearDays;var mo=1;var isLeap=false;for(var i=0;i<12;i++){var len=mlens[i];if(offset<len){return{year:EPOCH_YEAR+idx,month:i+1,day:offset+1,isLeap:false};}offset-=len;if(leapMonth!==0&&(i+1)===leapMonth){if(offset<leapLen){return{year:EPOCH_YEAR+idx,month:i+1,day:offset+1,isLeap:true};}offset-=leapLen;}}return null;}
  function honmeiShuku(y,m,d){var lun=solarToLunar(y,m,d);if(!lun)return null;var startShuku=MONTH_START[lun.month];var startIdx=SHUKU_27.indexOf(startShuku);var idx=(startIdx+(lun.day-1))%27;return{shuku:SHUKU_27[idx],shukuIdx:idx,lunar:lun};}

  // ISDの実データ15組から確定した「宿差(0-26)→相性コード」。矛盾ゼロ。未確定オフセットはnull。
  // ISD実データ47組から全27オフセットを確定(矛盾ゼロ)。生年月日→宿曜相性を完全自動化。
  const ISD_OFFSET_CODE = {0:"E",1:"A",2:"G",3:"I",4:"F",5:"F",6:"J",7:"G",8:"B",9:"C",10:"D",11:"G",12:"K",13:"H",14:"H",15:"N",16:"G",17:"D",18:"C",19:"B",20:"G",21:"M",22:"F",23:"F",24:"L",25:"G",26:"A"};
  // 未確定オフセットの「参考」表示用: 伝統宿曜の関係名(近1-8/中10-17/遠19-26 ＋ 命0/業9/胎18)
  const SENJUTSU_REL = ["命","栄","衰","安","危","成","壊","友","親","業","栄","衰","安","危","成","壊","友","親","胎","栄","衰","安","危","成","壊","友","親"];
  function ringLabel(off){ if(off===0||off===9||off===18) return ""; return off<9?"（近）":(off<18?"（中）":"（遠）"); }
  // 生年月日文字列(何形式でも数字3つ拾う)→ {shuku, idx}
  function shukuOf(dateStr){ const p=String(dateStr||"").match(/(\d{3,4})\D+(\d{1,2})\D+(\d{1,2})/); if(!p)return null; const y=+p[1],m=+p[2],d=+p[3]; if(y<1900||y>2099)return null; const hs=honmeiShuku(y,m,d); return hs?{shuku:hs.shuku, idx:hs.shukuIdx}:null; }
  // 自分dateA→相手dateB の相性
  function compatBetween(dateA, dateB){ const A=shukuOf(dateA), B=shukuOf(dateB); if(!A||!B)return null; const offset=((B.idx-A.idx)%27+27)%27; return { A, B, offset, code: ISD_OFFSET_CODE[offset]||null, refRel: SENJUTSU_REL[offset]+ringLabel(offset) }; }

  // ---------- 相性ガイド（宿曜27宿＋相性コードA〜N） ----------
  const SHUKU_MASTER = [
    { id: 1, name: "角宿", yomi: "かく", group: "東方青龍" },
    { id: 2, name: "亢宿", yomi: "こう", group: "東方青龍" },
    { id: 3, name: "氐宿", yomi: "てい", group: "東方青龍" },
    { id: 4, name: "房宿", yomi: "ぼう", group: "東方青龍" },
    { id: 5, name: "心宿", yomi: "しん", group: "東方青龍" },
    { id: 6, name: "尾宿", yomi: "び", group: "東方青龍" },
    { id: 7, name: "箕宿", yomi: "き", group: "東方青龍" },
    { id: 8, name: "斗宿", yomi: "と", group: "北方玄武" },
    { id: 9, name: "女宿", yomi: "じょ", group: "北方玄武" },
    { id: 10, name: "虚宿", yomi: "きょ", group: "北方玄武" },
    { id: 11, name: "危宿", yomi: "き", group: "北方玄武" },
    { id: 12, name: "室宿", yomi: "しつ", group: "北方玄武" },
    { id: 13, name: "壁宿", yomi: "へき", group: "北方玄武" },
    { id: 14, name: "奎宿", yomi: "けい", group: "西方白虎" },
    { id: 15, name: "婁宿", yomi: "ろう", group: "西方白虎" },
    { id: 16, name: "胃宿", yomi: "い", group: "西方白虎" },
    { id: 17, name: "昴宿", yomi: "ぼう", group: "西方白虎" },
    { id: 18, name: "畢宿", yomi: "ひつ", group: "西方白虎" },
    { id: 19, name: "觜宿", yomi: "し", group: "西方白虎" },
    { id: 20, name: "参宿", yomi: "しん", group: "西方白虎" },
    { id: 21, name: "井宿", yomi: "せい", group: "南方朱雀" },
    { id: 22, name: "鬼宿", yomi: "き", group: "南方朱雀" },
    { id: 23, name: "柳宿", yomi: "りゅう", group: "南方朱雀" },
    { id: 24, name: "星宿", yomi: "せい", group: "南方朱雀" },
    { id: 25, name: "張宿", yomi: "ちょう", group: "南方朱雀" },
    { id: 26, name: "翼宿", yomi: "よく", group: "南方朱雀" },
    { id: 27, name: "軫宿", yomi: "しん", group: "南方朱雀" },
  ];

  // 相性コードA〜N(ユーザー提供の解説文)。P〜AAは未提供のため後日追加。
  const COMPAT_CODES = [
    { code: "A", headline: "波長が完全に一致する運命的な関係", sub: "自分自身を見つめ直す", desc: `自分自身と全く同じ性質を持つ相手であり、鏡に映った自分を見ているような相性です。出会った瞬間に言葉を超えたレベルで波長が一致し、説明の手間を省いてお互いを理解し合える不思議な感覚を覚えるでしょう。良い部分も悪い部分もすべて筒抜けになるため、自分の嫌な一面を相手の中に見てしまい、時に自己嫌悪に陥ることもあります。お互いの調子が良い時はこれ以上ない強力な味方(シンクロニシティ)となりますが、一度歯車が狂うと、お互いに一歩も引けずに泥沼化しやすい脆さも秘めています。相手を尊重することは、自分自身を大切にすることと同義です。適度なプライベートの空間を意識的に保つことで、長く最高の理解者でいられるでしょう。` },
    { code: "B", headline: "お互いがサポートしあえる相性", sub: "無意識に良い状態を作る", desc: `お互いがサポートしあえるもっとも良い相性といえます。この相手となら気持ちを1つにしてハッピーストーリーを描くことができるでしょう。2人で力を合わせれば、より創造的な愛が育めるプラスの関係です。最初から気になる相手で、何となく気が合いそうであることも察知できます。会うたびにそんな手応えが確かなものになるので、愛は一気に深まるでしょう。相手の長所を十分に認め、また互いにそれを何とか活かしたいと思えてくる不思議な引力を持った相性といえます。2人のコンビネーションも抜群の信頼関係のなかで、隔たりなども感じることなくいたってスムーズで安心できる関係です。ただ、相手に対しての遠慮を拭い切れず、いつまでも一線を画した他人行儀さを心のどこかに残してしまうことがたまに見受けられます。それは相手を尊重する気持ちゆえの関係であり、愛情であることをお互いに理解しあえれば、対立や争い事をスムーズに回避できる、いたって穏やかな相性といえます。` },
    { code: "C", headline: "最初から意気投合できる最高の相性", sub: "親しみやすさと信頼の構築", desc: `初対面のときから、まるで昔からの親友であったかのような強い親近感を覚える相性です。特別な努力をしなくても、自然と相手の考えていることが理解でき、お互いに無条件の安心感を与えることができます。精神的な結びつきが非常に強く、プライベートの友人としてはもちろん、結婚や共同プロジェクトのパートナーとしてもこれ以上ない最高の組み合わせです。欠点を見つけようとしても、不思議とそれすら愛おしく、あるいは補い合える要素としてポジティブに捉えることができます。甘えが生じて「親しき仲にも礼儀あり」を忘れがちになる点にだけ注意すれば、一生モノの財産となる素晴らしい関係性を維持し続けることができるでしょう。` },
    { code: "D", headline: "近くも遠くもない、程よい関係が保たれる相性", sub: "一緒に行動することが良い", desc: `衝突もなければマンネリもない、ほどよい関係が保たれる相性です。ギブ・アンド・テイクの関係が心地よいパートナーになります。最初の出会いの印象は、ほとんど残っていないような相手でも、出会いの回数を重ねるごとにお互いの良さが分かり、仲間意識が強まります。よく話してみると趣味・センス・物事の考え方など、古い友達のように似たもの同士の2人です。いつも共感を覚えながらコミュニケーションが計れますので、2人の関係にけじめがなくなったり、行き過ぎた真似をして口論になったりする心配はないでしょう。親しみのなかにも厳しさを忘れず、お互いに助け合っていくことができます。ただ、ひとつ気を付けなければならないことは、本人たちの意識とは別に、何故かすれ違いが生じ、何かと誤解を招きます。また、予定がキャンセルになったり、計画が頓挫したりと、不可抗力による妨害には注意が必要です。せっかくの信頼関係がつまらぬことで壊されることがないように、積極的に相手に働き掛け、2人の関係を保つ努力は怠らないようにして下さい。自然消滅させてしまうには、あまりにも惜しい相手です。` },
    { code: "E", headline: "すぐに意気投合できる相性", sub: "お互いがお互いを気遣う", desc: `出会いもそこそこで、すぐに意気投合できる相性です。あらゆる面で話のわかりあえる相手であり、自分とよく似た何かを感じることが多いでしょう。巡りあうべくして巡り合ったパートナーであり、「この人だ!」というインスピレーションを感じることも少なくありません。その直感のままに、まず間違いなくプラスになる相手です。考え方や感じ方がよく似ているため、共通の目的のために仲良く手を取り合って歩んでいくことができます。特に年齢差のあるカップルの場合には、コンビネーションが実にうまくいきます。たとえ、窮地に追い込まれる状況になったとしても、最後まで力を合わすことができるような深い結びつきに守られています。まさに、光と影のような一体感のある相性です。しかし、そんな密接さが災いして摩擦を起こしてしまうことも少なくありません。似たものゆえに、反発した時のエネルギーは壮絶を極めます。2人の時間をあまりにも多く共有すると、相手の欠点が目に付いて嫌になる機会が増えるため、時には1人の新鮮な時間を持つことも必要です。` },
    { code: "F", headline: "ビジネスや人生のベストパートナー", sub: "お互いを高め合い繁栄する", desc: `2人が合わさることで、1人では成し得なかった大きな成果やエネルギーを生み出すことができる「繁栄」の相性です。特に仕事や共通の目標を持っている場合、お互いの強みがカチッと噛み合い、驚くほどのスピード感で物事が進展していきます。感情的なベタベタした関係ではなく、お互いの実力やスタンスをプロフェッショナルとして認め合える、非常に建設的でドライかつ健全な絆です。距離感が中距離であるため、近すぎてぶつかることもなく、遠すぎて疎遠になることもない絶妙なバランスが保たれます。迷ったときや新しい挑戦をしたいときに、一番に意見を求めるべきキーパーソンとなるでしょう。` },
    { code: "G", headline: "信頼関係をじっくり築ける良好な相性", sub: "穏やかな精神的支柱", desc: `激しい燃え上がりはないものの、時間が経てば経つほど、お盆に水が染み込むようにじんわりと信頼が深まっていく相性です。一緒にいると不思議とトゲトゲした気持ちが消え、穏やかでフラットな自分に戻ることができます。相手はあなたにとって、進むべき道を優しく照らしてくれる「ガイド(案内人)」のような役割を果たしてくれることが多く、精神的な支柱になってくれます。派手なイベントや劇的な展開を求めると少し物足りなさを感じるかもしれませんが、人生の荒波を一緒に乗り越えるパートナーとしては、これほど心強い存在はいません。お互いへの感謝の言葉を日常的に口にすることが、この関係をさらに盤石にする鍵です。` },
    { code: "H", headline: "お互いの感性を刺激し高め合う相性", sub: "クリエイティブな相乗効果", desc: `出会った瞬間に強烈なインパクトを覚え、お互いの独特な感性や世界観に引き込まれる相性です。共通の趣味やクリエイティブな分野、アート、エンターテインメントなどにおいて、これ以上ない刺激的なアイデアを生み出すことができるでしょう。相手の突飛な発想や行動が、あなたにとっては自分の限界を突破する大きなヒントになります。ただし、感情の起伏が激しくなりやすい組み合わせでもあるため、お互いにプライベートでベタベタしすぎると、些細なセンスの違いから大きな衝突に発展することがあります。良い意味での「ライバル」としての緊張感と、相手の個性を100%尊重する大人の余裕を持つことで、常に新鮮でモチベーションを高め合える最高のパートナーでいられます。` },
    { code: "I", headline: "居心地が良く素の自分を出せる相性", sub: "アットホームな安心感", desc: `まるで同じ家で育った家族や親戚のように、最初からまったく緊張せずに「素の自分」をさらけ出すことができる相性です。特別なおもてなしや気遣いをしなくても、一緒にいるだけで張り詰めた心がほぐれ、深いリラクゼーションを得ることができます。恋愛関係においては、激しいドラマよりも「この人といると一番落ち着く」という安心感から、自然と結婚を意識するようになることが多いでしょう。弱みを見せ合える関係だからこそ、お互いがピンチのときには無条件で味方になり、支え合うことができます。唯一の注意点は、お互いに甘えが出すぎて、言葉遣いや態度が雑になってしまうことです。日頃から「ありがとう」を言葉にする習慣を大切にすれば、何年経っても変わらない温かい絆が保たれます。` },
    { code: "J", headline: "共通の目的へ向かって強固に結束する相性", sub: "タッグを組むと無敵の関係", desc: `単なる仲良しではなく、「成し遂げたい共通の目的やゴール」があるときに、その絆が最強の結びつきに化ける相性です。お互いの得意分野が綺麗に分かれていることが多く、あなたが苦手なことを相手が涼しい顔でこなし、相手の盲点をあなたが鋭くフォローするという、完璧なパズルが完成します。ビジネスの起業パートナー、サークルの運営、あるいは共通の趣味を極める仲間として、この上ない強力なタッグを組むことができます。目的に向かっているときの2人は無敵ですが、ゴールを達成した後に「次の目的」が見つからないと、急に距離感が分からなくなることがあります。常に2人で「次の一歩」を語り合い、新しい挑戦を共有し続けることが、この関係を長く繁栄させる秘訣です。` },
    { code: "K", headline: "流れに変化を起こしてくれる相性", sub: "キーパーソン・重要人物", desc: `お互いの違う部分をぶつけ合うなかで、磨き合いながら成長していける相手となるでしょう。互いの長所を補い合える良き友人関係を築くことができ、同時に良きライバルとしても手応えのある関係となれるでしょう。痛い思いをさせられることがあってもそれは大きな成長への一つのきっかけとなることが多いので、素晴らしい関係でもあります。何かと問題の起こる関係ですが、お互いが協力し合うのはウェルカムです。出会ってしまうとそのまますり過ごすことができないくらい強烈なエネルギーを感じる相手です。そこで、お互いを必要に感じたり、尊重しあうことになるでしょう。ただ、一線を引いた関係をキープすることはお互いに意識しておく方がベターです。近づきすぎれば、火花を散らすような勢いで衝突し、容赦なく相手を叩きのめしてしまうので注意。できるだけ穏便に一定の距離を保った付き合いをすることが大切です。` },
    { code: "L", headline: "縁と絆を作り上げていく相性", sub: "長い目で付き合う・深い縁", desc: `どうしても付き合ってしまう相手です。お互いに「くされ縁」という感覚で付き合っているので友達のように結束力も生みやすく、隠し事をせずにフラットに話ができるでしょう。ただ、お互いを尊敬しあい、心底惚れあうことはありません。お互い包み隠さずのスタンスなので喧嘩やもめごとは多いですが、すんなりと水に流せる関係です。ひいてはそれが関係を長続きさせている秘訣かもしれません。自ら冷静になって、友人感覚の関係のもとフランクな付き合いを心がけましょう。良い意味での諦めの気持ちが大切です。2人の相性を良く保つためにはある種の覚悟と注意が必要です。気持ちの持ち方ひとつですべての人間関係が上手くいけば良いのですが、どうにもならない気持ちの隔たりを持つ人も世の中にはいることを悟っておくべきかも知れません。` },
    { code: "M", headline: "お互いを向上させる相性", sub: "親しき中にも礼儀あり", desc: `ある程度の距離を保てば、何とかうまくいく関係です。成熟した大人のカップルであれば、事態の深刻さは軽減されますが、こと結婚においては、かなり激しくなる可能性を秘めていますのでくれぐれも注意。お互いに強気な態度を崩しませんので、ことごとく反発したり、相手の言い分にはもはや聞く耳を持ちません。そうなると修復不可能な関係に陥るので、そうなる前に手を打ちましょう。そんな2人ですがお互いに惹きつける部分があります。そこが辛いところです。初対面から気に入ったり、意気投合したりすることも稀にあります。何故かこの相手を、多少無理をしても自分の力で何とかしてやりたいという気持ちが勝り、親近感が芽生えて同じ目的に向かって協力することもあるでしょう。せっかく培うことができた信頼感を大切にするためにも、一線を引いた距離をキープしてください。` },
    { code: "N", headline: "短所を補い長所をパワーアップしてくれる相性", sub: "あなたにとって必要性の高い人", desc: `お互いの違う部分をぶつけ合うなかで、磨き合いながら成長していける相手となるでしょう。互いのプラスマイナスを補い合える良き友人関係を築くことができ、同時に良きライバルとしても手応えのある関係となれるでしょう。恋愛は一日で好きになってしまうことが多いわりに、裏切りも多い関係です。お互いが大きく傷つけ合う残念な結果になってしまうことが多いですが、人間性の向上に努める理解ある相手ならば素晴らしい付き合いができるでしょう。ビジネスシーンでは、プライベートに深入りしないようにすれば良きライバル、学び合える関係として良好な組み合わせでしょう。徹底的に議論し破壊し合うことで、あいまいな点が削ぎ落とされて新たな発見を生むこともあります。最高のパートナーとなる可能性を持った相手とも言えるでしょう。` },
  ];

  const COMPAT_BY_CODE = () => Object.fromEntries(COMPAT_CODES.map(c => [c.code, c]));

  // 目的別のおすすめ相性ベスト3(ユーザー提供)
  const COMPAT_PURPOSES = [
    { icon: "🤝", title: "友情（安心感）", sub: "精神的な充電器", ranks: [
      { code: "C", name: "core", desc: "初対面の瞬間から、まるで長年連れ添った親友のような懐かしさを感じさせる存在です。言葉を尽くさずとも意思疎通が図れ、お互いの存在そのものが心の拠り所となります。人生という長い旅において、どんな時も変わらぬ信頼を寄せられる、一生モノの財産と言える友情の形です。" },
      { code: "I", name: "intimacy", desc: "日常生活の景色に自然と溶け込むような、家族にも似た絆です。一緒にいるだけで張り詰めた心が解け、肩の力を抜いていられます。特別なイベントがなくとも、ただ同じ時間を共有すること自体が、あなたにとって何よりの癒やしとなる関係です。" },
      { code: "D", name: "do", desc: "信頼という名の階段を、一歩ずつ着実に上っていくような関係性です。最初から全てをさらけ出すのではなく、時間をかけて絆を深めることで、極めて安定した関係を築けます。突発的な衝突が少なく、穏やかな日常を共に歩むパートナーとして理想的です。" },
    ]},
    { icon: "💕", title: "恋愛（刺激・愛情）", sub: "人生の彩りとなる関係／ときめきと深い絆", ranks: [
      { code: "A", name: "ace", tag: "「運命」としての恋愛（ドラマ・シンクロニシティ・魂の共鳴）", desc: "自分自身を映し出す鏡のような存在。出会った瞬間に魂レベルの波長一致を感じる、宿曜における究極の絆です。単なるドキドキを超えた「自分を見つめ直す」という精神的な深まりがあり、互いの存在が人生の密度を最高値まで引き上げます。これこそが、他では代替できない恋愛の最高峰です。" },
      { code: "B", name: "best", tag: "「生活」としての恋愛（信頼・協力・持続可能な幸福）", desc: "刺激による高揚と、安心感による安定を併せ持つ、最もバランスの取れた幸福な相性です。相手の長所を認め合い、互いを支える信頼関係が自然に育まれるため、ドラマチックな波乱を望まずとも、深い充足感の中で愛を育てることができます。人生を長く共に歩むパートナーとして、これ以上の選択肢はありません。" },
      { code: "H", name: "high", tag: "「感性」としての恋愛（発見・創造・新鮮な驚き）", desc: "互いの感性や世界観をぶつけ合い、化学反応を楽しむエキサイティングな関係です。創造性やユニークなアイデアを刺激し合うため、退屈とは無縁の時間を過ごせます。適度な緊張感が常に新しいトキメキを生み出し、二人だけの特別な世界を築き上げる「感性の伴侶」として刺激的な日々をもたらします。" },
    ]},
    { icon: "💼", title: "ビジネス（成果）", sub: "目標達成のブースター", ranks: [
      { code: "F", name: "focus", desc: "ビジネスにおける究極のパートナーシップ。感情的なしがらみを排し、お互いの実力をプロフェッショナルとして認め合う、非常に機能的で健全な関係です。迷いのない意志決定と、驚くべきスピードでの目標達成が可能となる、繁栄のためのベストペアです。" },
      { code: "J", name: "join", desc: "まるで精巧なパズルのピースが噛み合うような、理想的な役割分担が可能です。あなたが苦手な領域を相手が、相手の欠点をあなたがフォローすることで、組織のような盤石な体制を即座に構築できます。共通の目的達成において無敵の力を発揮します。" },
      { code: "N", name: "need", desc: "妥協を許さない高いレベルでの切磋琢磨が可能です。あえて耳の痛い指摘をし合い、互いの弱点を研ぎ澄ますことで、最高品質のアウトプットを追求します。馴れ合いを捨て、互いにプロとして高みを目指すことで、驚異的な成果を生み出します。" },
    ]},
    { icon: "🌱", title: "成長（学び・鏡）", sub: "未熟さを映す教科書", ranks: [
      { code: "A", name: "ace", desc: "あなた自身も気づいていない、隠れた才能や、逆に克服すべき未熟さを鏡のように突きつけてくる存在です。時にその鋭さに苦しむこともありますが、この関係を通して自分自身と正面から向き合い、人間としての器を確実に広げることができます。" },
      { code: "K", name: "key person", desc: "あなたの現状をあえて揺さぶり、次のステージへと押し上げる触媒的存在です。心地よい現状維持を許してくれないため、衝突や摩擦も起こりますが、それはあなたが飛躍するために必要な「成長痛」です。この出会いにより、あなたの可能性が開花します。" },
      { code: "N", name: "need", desc: "破壊と創造のサイクルを共に回す関係。あいまいな現状にメスを入れ、お互いの盲点を指摘し合うことで、真実の姿を浮き彫りにします。厳しいフィードバックを素直に受け入れられる器があるとき、この関係は最高の自己成長の場となります。" },
    ]},
    { icon: "🛋️", title: "安らぎ（癒やし・避難所）", sub: "感情のデトックス場所", ranks: [
      { code: "I", name: "intimacy", desc: "鎧を脱ぎ捨て、飾らない素の自分に戻れる唯一無二の場所です。何をやっても、どんな自分であっても受け入れてくれるという確信が、張り詰めた心を深い静寂へと導きます。心の奥底に溜まった澱（おり）を流し出せる、人生における不可欠な避難所です。" },
      { code: "B", name: "best", desc: "凪（なぎ）のような平穏な空気が流れる精神的なゆりかごです。相手からは一切の過度な期待や要求がなされないため、心に溜まったノイズが消えていくのを感じられます。何も語らなくても通じ合える、究極のフラットな休息地点です。" },
      { code: "G", name: "guide", desc: "深い包容力であなたを包み込み、「そのままで大丈夫」という安心感を授けてくれる保護者のような存在です。人生の不安に立ちすくむとき、相手の穏やかな眼差しは、あなたを正しい方向へと優しく導き、心に確かな安定をもたらしてくれます。" },
    ]},
    { icon: "🔭", title: "変容（レンズ・触媒）", sub: "世界を広げる道具", ranks: [
      { code: "H", name: "high", desc: "世界を認識するための「レンズ」を、強制的に新しいものへ交換させてくれる存在です。相手が持つ独特な感性や非常識なまでのアイデアは、あなたの固定観念という枠組みを破壊し、全く新しい景色を見せてくれます。人生の深みを知るための貴重な視点です。" },
      { code: "K", name: "key person", desc: "今の世界にとどまることを許さず、未知なる場所へとあなたを連れ出そうとする存在です。新しい価値観や経験を惜しげもなく与えてくれるため、視野は広がり続け、自分の可能性という概念そのものが根本から書き換わっていく感覚を覚えるはずです。" },
      { code: "E", name: "even", desc: "鏡のように似ているようでいて、微妙にズレたレンズを持つ相手。そのズレを通して、自分一人では決して見ることができなかった「自分の隠れた可能性」を発見する体験をします。相手を通じて世界を客観視することで、知的な成熟が促されます。" },
    ]},
  ];
  function compatPurposesHtml() {
    const medals = ["🥇", "🥈", "🥉"];
    return `<div class="card">
      <h2>🎯 目的別おすすめ相性</h2>
      <div class="hint" style="margin-bottom:10px;">「どんな関係を求めるか」ごとに、相性コードのベスト3をまとめました。項目をタップで開きます。</div>
      ${COMPAT_PURPOSES.map(p => `<details class="rc-detail compat-item compat-purpose">
        <summary><b>${p.icon} ${escapeHtml(p.title)}</b><span class="compat-purpose-sub">〜${escapeHtml(p.sub)}〜</span></summary>
        <div class="rc-detail-body">${p.ranks.map((r, i) => `
          <div class="compat-rank">
            <div class="compat-rank-head"><span class="compat-rank-medal">${medals[i]}</span><span class="compat-code">${r.code}</span><span class="compat-rank-name">${escapeHtml(r.name)}</span></div>
            ${r.tag ? `<div class="compat-rank-tag">${escapeHtml(r.tag)}</div>` : ""}
            <div class="compat-desc" style="margin-top:5px;">${escapeHtml(r.desc)}</div>
          </div>`).join("")}</div>
      </details>`).join("")}
    </div>`;
  }

  // 相性コードの発生確率(対応表の27オフセットから算出。登録者の実測ともほぼ一致)
  function compatProbHtml() {
    const cnt = {};
    for (let o = 0; o < 27; o++) { const c = ISD_OFFSET_CODE[o]; if (c) cnt[c] = (cnt[c] || 0) + 1; }
    const info = COMPAT_BY_CODE();
    const rows = Object.keys(cnt).map(c => ({ c, p: cnt[c] / 27 * 100 }))
      .sort((a, b) => b.p - a.p || a.c.localeCompare(b.c));
    const max = Math.max(...rows.map(r => r.p));
    // 発生率の高さで色分け(多い→緑, ふつう→青, やや珍しい→橙, レア→ピンク)
    const tierColor = p => p >= 20 ? "#43a047" : p >= 12 ? "#1e88e5" : p >= 6 ? "#fb8c00" : "#e53980";
    return `<div class="card">
      <h2>発生率📊</h2>
      <div class="hint" style="margin-bottom:12px;">27通りの宿の組み合わせのうち、各コードが何通りを占めるか＝その相性の出やすさです。色が濃い緑ほど出やすく、ピンクほどレアです。</div>
      ${rows.map(r => { const col = tierColor(r.p); return `<div class="prob-row">
        <div class="prob-line"><span class="compat-code">${r.c}</span><b class="prob-val" style="color:${col}">${r.p.toFixed(1)}%</b><span class="prob-head">${escapeHtml(info[r.c] ? info[r.c].headline : "")}</span></div>
        <div class="prob-bar-track"><span class="prob-bar-fill" style="width:${(r.p / max * 100).toFixed(1)}%; background:${col}"></span></div>
      </div>`; }).join("")}
      <div class="prob-legend">
        <span><i style="background:#43a047"></i>出やすい</span>
        <span><i style="background:#1e88e5"></i>ふつう</span>
        <span><i style="background:#fb8c00"></i>やや珍しい</span>
        <span><i style="background:#e53980"></i>レア</span>
      </div>
    </div>`;
  }

  // 登録済み(生年月日あり)の人を {id,name,date,groupIds} で返す
  function compatPeople() {
    return results.filter(r => r.birthDate).map(r => ({
      id: r.id,
      name: ((r.sei || r.mei) ? [r.sei, r.mei].filter(Boolean).join(" ") : r.name) || "(無名)",
      date: r.birthDate,
      groupIds: resultGroupIds(r)
    }));
  }
  function compatGroupOptions() {
    return `<option value="">グループを選ぶ…</option><option value="__all">（全登録者）</option>` +
      groups.map(g => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join("");
  }
  function compatPersonOptions(groupId) {
    let people = compatPeople();
    if (groupId && groupId !== "__all") people = people.filter(p => p.groupIds.includes(groupId));
    if (!people.length) return `<option value="">（この中に登録者がいません）</option>`;
    return `<option value="">人を選ぶ…</option>` +
      people.map(p => `<option value="${escapeHtml(p.date)}">${escapeHtml(p.name)}（${escapeHtml(p.date)}）</option>`).join("");
  }
  // 対象(a/b/base)の入力生年月日: 手入力優先、なければ人セレクトの値
  function compatInputDate(t) {
    const man = (document.getElementById("compat-" + t) || {}).value || "";
    if (man.trim()) return man.trim();
    const sel = document.getElementById("compat-" + t + "-sel");
    return sel ? sel.value : "";
  }
  // グループ/人セレクトを最新の登録データで更新(選択は保持)
  function refreshCompatPeople() {
    document.querySelectorAll(".compat-grp").forEach(sel => {
      const cur = sel.value; sel.innerHTML = compatGroupOptions(); if (cur) sel.value = cur;
    });
    ["a", "b", "base"].forEach(t => {
      const gs = document.querySelector(`.compat-grp[data-target="${t}"]`);
      const ps = document.getElementById(`compat-${t}-sel`);
      if (gs && ps) { const cur = ps.value; ps.innerHTML = compatPersonOptions(gs.value); if (cur) ps.value = cur; }
    });
    const lg = document.getElementById("compat-list-grp");
    if (lg) { const cur = lg.value; lg.innerHTML = compatGroupOptions(); if (cur) lg.value = cur; }
  }
  // 対象の選択UI(グループ→人 のカスケード + 生年月日直接入力)
  function compatPickerHtml(target, label) {
    return `<div class="compat-pick"><label>${label}</label>
      <div class="compat-pick-row">
        <select class="compat-grp" data-target="${target}"></select>
        <select class="compat-per" id="compat-${target}-sel"></select>
      </div>
      <input class="compat-manual" id="compat-${target}" placeholder="または生年月日を直接入力（例 1990/06/24）">
    </div>`;
  }

  // 1方向ぶんの相性ブロック(自分→相手)
  function compatDirectionHtml(label, aStr, bStr) {
    const r = compatBetween(aStr, bStr);
    if (!r) return `<div class="compat-dir err">${label}：生年月日が読み取れませんでした（1900〜2099年、例 1990/06/24）</div>`;
    const codeInfo = r.code ? COMPAT_BY_CODE()[r.code] : null;
    const shukuLine = `<div class="compat-shuku"><b>${escapeHtml(r.A.shuku)}宿</b> <span class="compat-arrow">→</span> <b>${escapeHtml(r.B.shuku)}宿</b></div>`;
    if (codeInfo) {
      return `<div class="compat-dir">
        <div class="compat-dir-head">${label}</div>
        ${shukuLine}
        <div class="compat-result-card confirmed">
          <div class="compat-code-big">${codeInfo.code}</div>
          <div class="compat-code-body">
            <div class="compat-headline">${escapeHtml(codeInfo.headline)}</div>
            <div class="compat-sub">〜${escapeHtml(codeInfo.sub)}〜</div>
          </div>
        </div>
        <div class="compat-desc">${escapeHtml(codeInfo.desc)}</div>
      </div>`;
    }
    // 未確定オフセット: 参考表示(伝統宿曜の関係名)
    return `<div class="compat-dir">
      <div class="compat-dir-head">${label}</div>
      ${shukuLine}
      <div class="compat-result-card pending">
        <div class="compat-code-big">?</div>
        <div class="compat-code-body">
          <div class="compat-headline">参考：${escapeHtml(r.refRel)}の関係</div>
          <div class="compat-sub">この組み合わせ（宿差${r.offset}）はISDコード未確定です</div>
        </div>
      </div>
      <div class="compat-desc muted">正式なA〜Nコードは、ISDでこの2人の相性を1度確認できれば確定できます。上は伝統的な宿曜の関係名です。</div>
    </div>`;
  }

  function renderCompatResult() {
    const out = document.getElementById("compat-result");
    const a = compatInputDate("a"), b = compatInputDate("b");
    if (!out) return;
    if (!a.trim() || !b.trim()) { out.innerHTML = `<div class="hint">対象①と②の両方を選んで（または入力して）ください。</div>`; return; }
    out.innerHTML =
      compatDirectionHtml("① から見た ②", a, b) +
      `<div class="compat-divider"></div>` +
      compatDirectionHtml("② から見た ①", b, a);
  }

  // グループ内の全員との相性をコード別に一覧
  function renderCompatList() {
    const out = document.getElementById("compat-list-result");
    if (!out) return;
    const baseDate = compatInputDate("base");
    if (!baseDate.trim()) { out.innerHTML = `<div class="hint">基準の人を選んでください。</div>`; return; }
    const listGrp = (document.getElementById("compat-list-grp") || {}).value || "";
    let people = compatPeople();
    if (listGrp && listGrp !== "__all") people = people.filter(p => p.groupIds.includes(listGrp));
    if (!people.length) { out.innerHTML = `<div class="hint">対象の登録者がいません。</div>`; return; }
    const byCode = {};
    people.forEach(p => {
      if (p.date === baseDate) return; // 本人は除外
      const r = compatBetween(baseDate, p.date);
      if (!r || !r.code) return;
      (byCode[r.code] = byCode[r.code] || []).push(p);
    });
    const codes = Object.keys(byCode).sort();
    if (!codes.length) { out.innerHTML = `<div class="hint">相性を計算できる相手がいませんでした。</div>`; return; }
    const info = COMPAT_BY_CODE();
    out.innerHTML = `<div class="hint" style="margin:8px 0;">基準の人「自分」から見た相性です（逆から見ると変わる場合があります）。</div>` +
      codes.map(code => `<div class="compat-list-group">
        <div class="compat-list-head"><span class="compat-code">${code}</span>${escapeHtml(info[code] ? info[code].headline : "")}</div>
        <div class="compat-list-people">${byCode[code].map(p => `<span class="compat-list-chip">${escapeHtml(p.name)}</span>`).join("")}</div>
      </div>`).join("");
  }

  function renderCompatGuide() {
    const box = document.getElementById("compat-content");
    if (!box) return;
    if (!box.dataset.ready) {
      let html = `<div class="card">
        <h2>💞 2人の相性を見る</h2>
        <div class="hint" style="margin-bottom:8px;">グループから人を選ぶか、生年月日を直接入力してください。相性は宿曜27宿にもとづきます。</div>
        ${compatPickerHtml("a", "対象①（自分）")}
        ${compatPickerHtml("b", "対象②（お相手）")}
        <button id="compat-run" class="compat-run-btn">💞 相性を見る</button>
        <div id="compat-result"></div>
      </div>`;
      html += `<div class="card">
        <h2>📋 相性一覧（グループ内）</h2>
        <div class="hint" style="margin-bottom:8px;">基準の人を選ぶと、グループ内の全員との相性をコード別にまとめて表示します。</div>
        ${compatPickerHtml("base", "基準の人（自分）")}
        <div class="compat-pick"><label>一覧にするグループ</label>
          <select id="compat-list-grp"></select>
        </div>
        <button id="compat-list-run" class="compat-run-btn">📋 一覧を出す</button>
        <div id="compat-list-result"></div>
      </div>`;
      html += compatPurposesHtml();
      html += compatProbHtml();
      html += `<div class="card">
        <h2>📖 相性コードA〜N 解説</h2>
        <div class="hint" style="margin-bottom:10px;">画面に出る相性コードの意味です。</div>`;
      html += COMPAT_CODES.map(c => `
        <details class="rc-detail compat-item">
          <summary><span class="compat-code">${c.code}</span>${escapeHtml(c.headline)}<small>〜${escapeHtml(c.sub)}〜</small></summary>
          <div class="rc-detail-body"><div class="det-row" style="line-height:1.9">${escapeHtml(c.desc)}</div></div>
        </details>`).join("");
      html += `</div>`;
      box.innerHTML = html;
      box.dataset.ready = "1";
    }
    refreshCompatPeople();
  }

  // ---------- 読み方ガイド（四柱・五行などの解説集。項目は今後追加可） ----------
  const KAISETSU_SECTIONS = [
    {
      icon: "🏛️", menu: "四柱の読み方", title: "四柱（年・月・日・時）の読み解き方",
      intro: "それぞれの柱は「人生のどの時期、またはどの側面」を担当しているかという役割分担があります。",
      items: [
        { head: "年柱（ねんちゅう）：先祖・幼少期・社会の入り口", body: "役割：自分のルーツ、家系、生まれてから10代後半までの環境。\n読み方：自分が社会からどう見られているかという「第一印象」や、親や先祖から受け継いだ「土台」を表します。ここが強いと、社会的な環境に恵まれていたり、伝統的なものを引き継ぐ運命を持っていたりすることが多いです。" },
        { head: "月柱（げっちゅう）：才能・仕事・中年の運気", body: "役割：社会運、仕事観、20代〜40代の運勢。\n読み方：四柱推命で最も重要視される柱です。自分の「本質的な才能」や「どうやって社会に貢献するか」がここに詰まっています。ここにある通変星が、その人が社会で勝負するときの武器になります。" },
        { head: "日柱（にっちゅう）：自分自身・プライベート・パートナー", body: "役割：自分自身（日干）、配偶者、内面、魂の傾向。\n読み方：一番大切な「自分自身」を表します。月柱が「社会的な顔」なら、日柱は「素の自分」です。また、配偶者との縁や、自分がリラックスしているときにどんな性格が出るかを読み解く際、ここを最も注視します。" },
        { head: "時柱（じちゅう）：未来・晩年・子供・可能性", body: "役割：晩年の運勢、夢、趣味、部下・子供、隠れた能力。\n読み方：人生が成熟した後の状態や、自分が「心からやりたいこと」を表します。また、仕事以外の「クリエイティブな才能」や、コントロールできる環境（部下や子供など）がここに表れます。" },
        { type: "info", head: "【読み解きのコツ】柱同士の「対話」を見る", body: "単体で読むだけでなく、柱同士の「エネルギーの橋渡し」を見ると、その人の人生のストーリーが浮かび上がってきます。\n\n・「年柱」と「月柱」の対比：「自分のルーツ（年）」と「今の仕事（月）」が合致しているか、それとも相反して苦労しているかを見ます。ここがスムーズだと、親の跡を継いだり、順調にステップアップする人生になりやすいです。\n\n・「日柱」と「月柱」の葛藤：社会的な責任（月）と、本当の自分（日）のどちらが強いかを見ます。ここが一致していると「公私混同がない＝ストレスが少ない人生」ですが、違うと「仕事ではこう振る舞っているが、家では全く違う顔」という二面性として現れます。\n\n・「日柱」と「時柱」の成熟度：中年期（日）から晩年（時）にかけて、星がどう変化するかを見ます。「今は忙しい（月）が、晩年は趣味を楽しむ（時）」といった未来予測は、この読み解きから導き出されます。" },
      ]
    },
    {
      icon: "🌳", menu: "五行", title: "五行（木・火・土・金・水）",
      intro: "まず「五行ってなに？」と5つの性質を読んでから、下の「バランスの読み方」（多すぎ・欠け）に進んでください。",
      items: [
        { type: "info", head: "五行ってなに？", body: "五行（ごぎょう）は、世界のすべてを「木・火・土・金・水」の5つのエレメントに分ける、古代中国生まれの考え方です。\n\n四柱推命では、命式に含まれる干（かん）をこの5つに置きかえて数えます。多い五行＝強く出る性質、欠けた五行＝苦手だったり、逆に強く求めたりする性質。この偏りこそが個性です。\n\n診断結果の「五行バランス」の図は、この集計をそのまま表示しています。まず下の5つでそれぞれの性質をつかんでから、「バランスの読み方」に進んでください。" },
        { head: "🌳 木（もく）── 成長とやさしさ", body: "性質：上へ上へと伸びていく「成長」のエネルギー。向上心、素直さ、やさしさ、教育や育成の才能。\n\nたとえ：陽の木＝甲（大樹・まっすぐな大木）、陰の木＝乙（草花・しなやかで折れない）。\n\n五本能では「守備本能」＝自分や大切な人を守る力。アプリの表示色は緑です。" },
        { head: "🔥 火（か）── 情熱と表現", body: "性質：明るく燃えて周りを照らす「情熱」のエネルギー。表現力、直感、華やかさ、人を元気にする力。\n\nたとえ：陽の火＝丙（太陽・みんなを照らす）、陰の火＝丁（灯火・そっとあたためる炎）。\n\n五本能では「伝達本能」＝気持ちや情報を伝える力。アプリの表示色はピンクです。" },
        { head: "⛰️ 土（ど）── 安定と包容", body: "性質：どっしり受け止めて育てる「安定」のエネルギー。信頼感、継続力、面倒見のよさ、現実的な強さ。\n\nたとえ：陽の土＝戊（山・動かない大きな山）、陰の土＝己（畑・作物を育てる豊かな土）。\n\n五本能では「魅力本能」＝人を引きつける力。アプリの表示色はゴールドです。" },
        { head: "⚔️ 金（ごん）── 決断と美意識", body: "性質：鍛えられて鋭く輝く「決断」のエネルギー。正義感、行動力、切れ味のいい判断、美意識。\n\nたとえ：陽の金＝庚（刀・鉄、鍛えるほど強くなる）、陰の金＝辛（宝石・磨かれて輝く）。\n\n五本能では「攻撃本能」＝道を切り開く力。アプリの表示色はグレーです。" },
        { head: "🌊 水（すい）── 知恵と柔軟さ", body: "性質：形を変えて流れ、しみこむ「知恵」のエネルギー。思考力、吸収力、柔軟さ、想像力。\n\nたとえ：陽の水＝壬（海・大河、大きく自由に流れる）、陰の水＝癸（雨・湧き水、静かにしみこむ）。\n\n五本能では「習得本能」＝学び取る力。アプリの表示色は青です。" },
        { type: "info", head: "バランスの読み方について", body: "下の10項目は、五行が「多すぎる場合」と「一つだけ欠けている場合」にどんな性質が出るかの解説です。\n\n五行がぴったり均等な人はほとんどいません。偏りは悪いことではなく、その人のエンジンの形。「多すぎ」は使いこなせば強力な武器になり、「欠け」はそれを補う工夫や、欠けているからこそ強く求める行動として表れます。" },
        { head: "木が多すぎる：【過信と攻撃性】", body: "成長のエネルギーが強すぎるため、自己主張が激しく、自分の考えを曲げない頑固さが出やすくなります。他者への攻撃性や、コントロール欲求が強くなる傾向があります。" },
        { head: "火が多すぎる：【激しさと落ち着きのなさ】", body: "情熱や表現欲が強すぎて、せっかちで感情の起伏が非常に激しくなります。常に動いていないと気が済まず、エネルギーを出し切る前に心身が疲弊しやすい状態です。" },
        { head: "土が多すぎる：【保守と執着】", body: "安定と蓄積の性質が過剰になり、変化を極端に嫌うようになります。過去への執着や思考の停滞が強く、新しい環境に適応するのに大きな苦労を伴います。" },
        { head: "金が多すぎる：【潔癖と冷徹】", body: "正義感や決断力が鋭すぎ、白黒はっきりさせようとする厳しさが強くなります。自分にも他人にも非常に厳しく、柔軟性を欠いた「冷たさ」として周囲に受け取られることがあります。" },
        { head: "水が多すぎる：【不安と流転】", body: "思考が深すぎて現実から浮遊しやすく、あれこれと考えすぎて行動が伴わない「流されやすい」性質になります。感情が沈みやすく、精神的に不安定な状況に陥るリスクがあります。" },
        { head: "木が欠けている：【実行力と若々しさの欠如】", body: "新しいことを始める「発進力」や、困難に立ち向かう向上心が育ちにくいです。体調面では関節や肝臓が弱くなりやすく、常に何かに守られていたいという依存心が出やすくなります。" },
        { head: "火が欠けている：【情熱と自己表現の欠如】", body: "自分の思いを外に伝えるのが苦手で、控えめで冷めた印象を与えがちです。喜びや感動を表現するエネルギーが不足するため、人生の彩りが乏しく感じられ、無気力になりやすい傾向があります。" },
        { head: "土が欠けている：【安定感と信用基盤の欠如】", body: "足元が定まらない感覚が強く、生活習慣が乱れたり、信頼関係を築くのに時間がかかったりします。人生の土台となる「一貫性」や「継続力」が不足し、腰を据えて何かに取り組むことが苦手になります。" },
        { head: "金が欠けている：【けじめと自制心の欠如】", body: "物事を完結させる力や、自分を律する規律が不足しやすくなります。最後までやり遂げるのが苦手で、周囲からの評価や世間体に対する感覚が薄く、約束や期限を守る意識が希薄になることがあります。" },
        { head: "水が欠けている：【柔軟性と休息の欠如】", body: "物事を潤滑に進める適応力や、冷静に自分を振り返る「休息」が取れなくなります。常に張り詰めた状態が続き、精神的にクールダウンする余裕がないため、感情の摩擦が起きやすくなります。" },
        { type: "info", head: "◎ 五行は「調和」が理想", body: "もし一つが欠けている場合は、その要素を持つ色を身につけたり、その性質を持つ方角へ行くなどして、日常的に「気」を補うのが古くからの開運の知恵とされています。" },
      ]
    },
    {
      icon: "🎯", menu: "能力の10タイプ", title: "能力（先天的な10タイプ）の読み方",
      intro: "先天的な能力は a〜j の10タイプ。そのうち中心となる1〜3個が「第一能力・第二能力（＋α）」として現れます。残りの7〜9個も「できる可能性」として秘めていますが、絶対比較では主要な能力にはなりません。この中心的な能力を継続的に発揮・活用することで「才能」として開花します。",
      items: [
        { type: "info", head: "💯 能力100%の考え方（第一・第二＋α）", body: "能力100％ ＝ 第一能力60％ ＋ 第二能力40％ ＋ α\n\n・第一能力・第二能力 … 「生年月日」から決まる（中心の能力）\n・＋α … 「出生時間」から決まる\n\n中心となる1〜3個の能力を、置かれた場面で進化させ「才能」につなげていくのがISDロジックの考え方です。（※昔は 50％／30％／20％ と表現していました）" },
        { type: "info", head: "🌳🔥 五本能（木・火・土・金・水）", body: "五行の「気」＝人の精神を構成する基本的な本能です。それぞれが欠けると、その力を失います。\n\n・木＝守備本能（守るもの）… 欠けると「自衛力」を失う\n・火＝伝達本能（伝えるもの）… 欠けると「生きるための前進力」を失う\n・土＝魅力本能（魅きつけるもの）… 欠けると「人間としての価値」を失う\n・金＝攻撃本能（攻めるもの）… 欠けると「生活能力」を失う\n・水＝習得本能（学ぶもの）… 欠けると「世の中への対応力」を失う" },
        { head: "a：実行力（守備本能・マイペース T＋）", body: "物事をゴールに向けて達成するために、直線的に推進させるのに必要となる能力です。\n\n【くわしく】\n自分自身で物事を成し遂げる能力です。行動力・実践力と言われることもありますが、確実に行動に移すことのできる力のことです。この力は、あなたの人生をあなたの思う方向へ進めるために重要となります。自分で計画したことや、組織の方針に従って、途中で諦めることなく着実に進めていくことができます。目標に向かう中では、予想外の出来事も起こりうるでしょう。しかし、それらに屈しない意志の強さと体力も持ち合わせています。自分がどういう思いで行動しているか、何の目的で協力を人にお願いするのかなど、自分の要求を的確に関係者に提示できる器用さがあります。誰にも依存しない独立心と、何にも屈しない押しの強さが根っこにあります。\n\n【サブ能力】\n・推進力：自分の欲求を相手に示しながら、理論的に考えられることやそうすべきだと思うことを一直線に押し進んでいくことができる力\n・達成力：目的を達成するために最後まで成し遂げようとする強い気持ちが、行動となって現れる力\nこの「推進力」と「達成力」が合わさって「実行力」になります。\n\n【どんな人？】\n人から言われて行動することは少なく、周囲からは独断と偏見に満ちているように思われがち（熱しやすく、続かないことも）。\n\n【能力を発揮するには】\n手当たり次第にトライするのではなく、一つのことをじっくりと最後までやりきること。\n\n【aが100%の場合】\n自分が考えたアイデアや企画を、まわりに左右されることなく推し進めることができます。自分または組織・グループで決めた目的や目標を最後まで成し遂げようとするスキルも高い。まわりの人の意見に耳を傾け、自分のスタイルを貫いていくことができれば、ますます能力を発揮できるでしょう。\n（有名人の例：小泉純一郎、芥川龍之介、稲盛和夫）\n\n【実践メモ】\n・「やり切る力」。行動力が全て。まっしぐら。\n・第一能力がaの有名人：マツコ・デラックス、森ビル創業家、DHC吉田氏、高田明、イーロン・マスク、マイケル・デル\n・ピッチャータイプが加わると2〜3倍のスピードに。ライオンがOKを出したら早い。\n\n🔁 対の能力：f：計数力" },
        { head: "b：計画力（守備本能・マイウェイ T－）", body: "周囲の人の意見を引き出し、聞き入れ、議論しつつ、目標に向かって決められた手順に沿って具現化できる能力です。\n\n【くわしく】\n物事を円滑に進めるために欠かせない、重要な能力です。設定したゴールに対して何が必要であるかを見定め、必要な布陣を敷き、全体を巧みに動かしていきます。この力はビジネスでもプライベートでも非常に重宝されます。自分で計画したことや、組織の方針に従って、関係者を説得したり快く動かす交渉術も持ち合わせています。途中で起こりうる予想外の出来事にもきちんと対処できる幅広い知識があるため、単なる理想論ではない地に足の着いた進め方ができるのが特徴です。相手の要求をしっかり聞き入れる人当たりの良さ、直感的に上手く話を切り返す話術、物事の全貌を俯瞰できる頭の切れの良さ、この三拍子そろった能力が計画力なのです。\n\n【サブ能力】\n・交渉力：まずは相手の欲求を聞きながら、成功に導くために自分の意見を言いつつ、合意や調整をしていくことができる力\n・社交力：初めての人や状況に動じることなく関わることができ、社会生活を営む上で必要な人付き合いができる力\nこの「交渉力」と「社交力」が合わさって「計画力」になります。\n\n【どんな人？】\n直感的に相手の話を聞きながらも、自分の要求を通す。\n\n【能力を発揮するには】\n手当たり次第にトライするのではなく、周りの人の意見に耳を傾けながら自分の考えを実行していくこと（近道しすぎるとここが伸びない）。\n\n【bが100%の場合】\n第三者の意見を十分に聞き入れつつ議論を進め、合意や調整に到達させることができます。初めての環境や状況、初対面の人に対して、何かしらの目的をもって、動じることなく関わるスキルも備わっているでしょう。手当たり次第にトライするのではなく、1つのことをじっくりと最後までやり切ることで、さらに能力を伸ばすことができるでしょう。\n（有名人の例：本田美奈子、ウサイン・ボルト）\n\n【実践メモ】\n・段取り力。一段ずつ登っていく。登りつめる、まわりを巻き込む。近道したがるけど、近道しないことで計画力になる。\n・直観にも根拠あり。手順と準備が大事。ランチに行く前に一旦みんなに聞くタイプ。営業力。\n・第一能力がbの有名人：木村清（すしざんまい）、マーク・ザッカーバーグ、スティーブ・バルマー、ラリー・エリソン\n\n🔁 対の能力：e：包容力" },
        { head: "c：判断力（伝達本能・ピース F＋）", body: "瞬時に状況を捉えて選択し、最良の意思決定をするために必要となる能力です。\n\n【くわしく】\n人間関係をスムーズに進めるための要となる能力です。ビジネスシーンでもプライベートでも、人と人とをつなげる潤滑油として大変重宝されます。目的のために必要なことは何かを常に考えながら、その時その時の判断を下していきます。言葉での表現が非常に優れているので、関わる人達に対して必要な情報を的確に伝えることができるのが最大の強みです。難しいことを分かりやすく噛み砕き、細かいことを概念的にまとめて提示し、大きな流れの中で今どこにいて、向かおうとしている方向はどこかを達観した視点で伝達することができます。良好なコミュニケーションを保ちながら関わる人達を適材適所で活かしていく力、それが判断力の真髄です。\n\n【サブ能力】\n・宣伝力：言葉や文章によって、自分の主義・主張に対する理解・賛同を求めて広く伝え知らせることができる力\n・伝達力：上下の立場に関係なく、間接的または直接的に、感情を入れずに命令や連絡事項を正確に伝えることができる力\nこの「宣伝力」と「伝達力」が合わさって「判断力」になります。\n\n【どんな人？】\n感情を入れずに伝えることができ、言葉による人の使い方が上手い。\n\n【能力を発揮するには】\n時間がかかっても、ルールに従って周囲の状況を見ながら自分の考えを進めていくこと（のろしを上げ続けたら良い）。\n\n【cが100%の場合】\n言葉や文章で主義や主張に対する理解や賛同を求めて、広く伝え知らせることができます。上下の立場に関係なく、間接的または直接的に命令や連絡事項などを感情を入れずに正確に伝えるスキルにも恵まれています。時間がかかっても、ルールに従って周囲の状況を見ながら、自分の考えを進めていくと、もっとうまくいくでしょう。\n（有名人の例：中川礼二）\n\n【実践メモ】\n・ビジョン・ミッションを語る、キャッチコピーの才能。選ぶ言葉のチョイスが上手、切り返しが上手。言葉を使って手柄を立てたい。\n・言葉が強い。言いにくいことを上手に言える。感情を入れない・やらしくない伝え方ができる。そのぶん人の言い方が気になる。\n\n🔁 対の能力：h：分析力" },
        { head: "d：表現力（伝達本能・ロマン F－）", body: "第三者にわかりやすく、イメージで伝える力を作るためになくてはならない能力です。\n\n【くわしく】\n物事を具体的なカタチにすることができる能力です。言語だけに頼らず、あらゆる手法を駆使して伝えたいことをきちんと伝えることのできる力を意味しています。物事を鋭い視点で観察し、独自の推論を組み立てます。とても繊細なセンスも持ち合わせており、人間の五感に強く訴えかけるような表現の工夫が得意です。これと決めたことに対しては、周囲が驚くほどの集中力を発揮し、次々と確かな技術を習得していきます。このような優れた表現力は、プライベートでは自分自身を理解してもらうことにつながります。ビジネスシーンにおいては、プロジェクトを計画通りの形に仕上げたり、実務的な作業を的確にこなしていく力として活かされます。\n\n【サブ能力】\n・技術力：断片的に物事の仕組みをとらえることができ、それを巧みに成し遂げることができる力\n・決断力：状況に惑わされることなく決定するだけでなく、その後も状況に応じて対処できる力\nこの「技術力」と「決断力」が合わさって「表現力」になります。\n\n【どんな人？】\n鋭い推論やセンスがあり、形にするのが上手い。\n\n【能力を発揮するには】\n自分の考えを進めるにあたり、表情・身振り・記号・言語などを用いて理解を得ながら進めていくこと。\n\n【dが100%の場合】\n断片的に物事のシステムをとらえることができ、その全体像を組み上げていくことができるでしょう。状況に惑わされることなく、決定するだけでなく、その後も状況の変化に応じて対処できるスキルを持っています。自分の考えを進めるにあたり、表情、身振り手振り、記号、言語などを十分用いて理解を得ながら進めるともっとスムーズに事が運ぶでしょう。\n（有名人の例：d-d：相葉雅紀、小林幸子 ／ d-a：IKKO）\n\n【実践メモ】\n・話すと身ぶり手ぶりが出てくる。ロゴ・キャラクターなど「伝えるもの」の職人。\n・プレゼン力。音楽・ダンス・料理など、言葉以外で伝える力。\n\n🔁 対の能力：g：対話力" },
        { head: "e：包容力（魅力本能・ヒューマニティ E＋）", body: "人間関係をチーム単位で引き上げていく、リーダーシップをとる時に必要な能力です。\n\n【くわしく】\nリーダーシップに必要な、人を受け入れ個性を活かすことのできる能力です。人と人とを結び付け、必要な資金を呼び込むために欠かせない力が備わっており、まとめ役として適任です。一つ目の特徴は、人間関係や仕事の状況を敏感に察知して物事をジャッジできるところ。二つ目の特徴は、関わる人達との距離を良好に保ちながら、全体をひっぱっていくところ。このように、類まれなる統率力で、集団をまとめ上げます。ただし、あくまで人間本位なのが最大の魅力です。強引さで引きずるような進め方はしません。相手の感情を受け止めた上で指揮を執るので、多くの人が付いてくるでしょう。その懐の深さで、必要な資金も呼び寄せます。\n\n【サブ能力】\n・資金運用力：人脈や情報を活用して資金を調達し、なおかつその資金を運用し増やすことができる力\n・統率力：小組織（グループ単位）において、あらゆる目的や目標に対して周囲を巻き込み行動させることができる力\nこの「資金運用力」と「統率力」が合わさって「包容力」になります。\n\n【どんな人？】\n小さなグループで、ひとりよりも多数の人を巻き込んでいく。\n\n【能力を発揮するには】\n少人数（2〜3人）を巻き込み、周囲の信用を得つつ、自分の考えを進めていくこと。\n\n【eが100%の場合】\n人脈や情報を活用しながら資金調達し、運用するのが得意でしょう。自分自身の考えではなく、周囲からの情報やアイデアを生かして結果を残すこともできます。目的や目標に対して、周囲を巻き込み、動かしていくスキルも高い。少人数を巻き込み、信用を得ながら自分の考えを進めていくスタイルを貫けば、もっと成果があがるでしょう。\n（有名人の例：春木開、ダルビッシュ有、一風堂創業者）\n\n【実践メモ】\n・「ありがとう」を大事にする。強引じゃなく自然にリードできる。プレゼン力・情報発信がうまい。\n・人の受け入れ力がすごい。人と人をつなげられて、言葉も上手。目が届くのは5人くらいの範囲。\n・回転財（お金を回して増やす）。スポーツ選手や作家に多い。\n\n🔁 対の能力：j：吸収力" },
        { head: "f：計数力（魅力本能・リアリティ E－）", body: "感覚的なものを、数値化やキーワードを使ってより現実的にするために必要な能力です。\n\n【くわしく】\n一見地味に思えるかもしれませんが、物事を成し遂げるためには欠かせない能力です。目に見えないもの、感覚的なものを、分かりやすい形で示すことができる力です。一般的には「数学」のセンスと理解度の高さがこれにあたります。自分が関わっていること、今取り組んでいることが、経済的にはどういった位置づけにあるのかの理解が深いところがあなたの強みです。仕事においては、経理・財務に直結する「数字」を意識した営業活動ができます。家庭においても、お金の流れを把握して健全な家計を維持できます。財産を管理し資産を増やすことにも長けています。敬遠されがちな緻密な業務を的確にこなしていく忍耐力も備わっています。\n\n【サブ能力】\n・蓄財力：収益を上げるために、資金の有利な調達および運用の多様化・効率化を図る力\n・不動産運用力：不動産や会社を利殖などの目的のために他の財産形態に変えたり、収益につなげていくことができる力\nこの「蓄財力」と「不動産運用力」が合わさって「計数力」になります。\n\n【どんな人？】\nお金を数字として見ることができ、蓄財・投資が上手い。堅実に貯めていく。\n\n【能力を発揮するには】\n自分の考えを数字に置き換えて計算し、コツコツと積み重ねていくこと。\n\n【fが100%の場合】\n収益を上げるために、資金の有利な調達や運用の多様化と効率化を図ることができるでしょう。不動産や会社などを活用し、収益につなげるスキルも高いでしょう。自分の考えを数字に置き換えて計画し、コツコツと積み重ねていくことができれば、もっと能力を発揮できるでしょう。\n（有名人の例：孫正義、三木谷浩史（第一能力がf））\n\n【実践メモ】\n・家計簿・ポイントカードが得意。数字が得意。「何個にする」「何人で行く」がすぐ出る。資料づくりも得意。\n・縦列駐車など空間把握能力が高い。IKEAやコストコで迷わない。電卓とメジャーが鞄に入っているタイプ。\n・経営者ならプライベートと会社のお金をきっちり分けられる。自分の土地の運用も上手。\n\n🔁 対の能力：i：応用力" },
        { head: "g：対話力（攻撃本能・ワイルド M＋）", body: "相手に不快感を与えず、自分の意見を伝えるコミュニケーションを取るために必要な能力です。\n\n【くわしく】\n人間関係、お金の動き、物の配置など、総合的にマネジメントできる能力です。関わる人達に対して、細やかな気遣いができ、上手く自己主張できない人に対してもしっかりと目を配ることができます。組織の動きを俯瞰して捉えることができるので、業務の管理をするには適任と言えるでしょう。物事に関わる人間・資金・モノをきちんと統括し、計算の上で偏りなく全体を活かしていくことができます。その際に要となるのが、対話におけるコミュニケーションの深さです。相手に対して不快感や不信感を抱かせない、巧みな表現で関わる人達の心をつかみ、強固にまとめ上げます。\n\n【サブ能力】\n・組織展開力：人間関係や情報網を通じてコミュニケーションを円滑に進め、外側に向かって展開することができる力\n・人材運用力：適材適所に人材を配置することができる力\nこの「組織展開力」と「人材運用力」が合わさって「対話力」になります。\n\n【どんな人？】\n物事を決めるのは別の人で、それを外に向けて発信・拡大する。\n\n【能力を発揮するには】\n多くの人と接する中で、客観的に物事をとらえ、外に向けて自分の考えを進めていくこと。\n\n【gが100%の場合】\n人間関係や情報ネットワークを通じてコミュニケーションを円滑に進めて、外側に発信できます。適材適所で人材を配置するスキルもずば抜けています。組織内のルールを取り決め、環境を良い状態に維持するなどの手法で、内部からまとめていくことも得意でしょう。自分の考えを外に向けてアナウンスできる適材適所を見極めれば、次のステージが待ち受けているでしょう。\n（有名人の例：大泉洋）\n\n【実践メモ】\n・コミュニケーションの天才。話しながら（相手の良さを）見つける。人の長所・短所を見極めて言語化できる。\n・人の見極めと配置が上手。必要な人を不快感なく配置できるマネジメント力。\n・No.2要素。誰かへのリスペクトを持っていて、いつも心のNo.1がいる。自分以外の能力を外から引っ張ってきたり、組織を使って発信する。\n\n🔁 対の能力：b：計画力" },
        { head: "h：分析力（攻撃本能・エリート M－）", body: "長所と短所を瞬時に見極めることができ、その利点や問題を追及するために必要な能力です。\n\n【くわしく】\n物事の表と裏、長所と短所など、多角的に見極めることができる能力です。正確に分析するためには常にフラットな自分であることが大切ですが、そのような自己管理能力も持ち合わせています。冷静沈着で、少し先の展開を読むことができるのが強みです。単なる希望的観測によるプランニングとは違い、あらゆる場面を想定して起こりうる可能性を探った上で、取りこぼしのない緻密な計画の立案ができます。計画に基づいた実践的な業務を遂行していきます。大きな枠組みの中で、長期目標、中期目標、短期目標を定め、日々の具体的なステップまで落とし込めるところが特徴です。プロジェクトの完遂、夢の実現などに結びつく有用な能力と言えるでしょう。\n\n【サブ能力】\n・組織管理力：組織外の情報やルールを取り決めて組織に落とし込み、内部から組織を作り上げていくことができる力\n・実務力：ルーティンワークなど、繰り返し繊細さが要求されることを続け、完成させることができる力\nこの「組織管理力」と「実務力」が合わさって「分析力」になります。\n\n【どんな人？】\n自己管理・計画性に優れ、上下関係に厳しいが、人と人をつなぎ合わせることができる。\n\n【能力を発揮するには】\n自分の考えを客観的に見ながら、具体的な計画を立て実行していくこと。\n\n【hが100%の場合】\n組織外の情報やルールを取り決めて組織に落とし込み、内部から組織をつくり上げることができます。ルーティンワークなど繰り返し繊細さが要求されることを続けるのも得意です。自分の考えを客観的に見ながら、細かな実務をこなして自分の考えを進めていくことができれば、スキルアップにつながるでしょう。\n\n【実践メモ】\n・目標達成したい頑張り屋さん。品性（M－）。\n・人の分析が得意で「似て非なるもの」が分かる。本質を見抜く力。フラットでいられる。\n・100%まで時間がかかると分かった上でステップを踏める。中をまとめたいからルールを作る。ルーティンワークで無敵。\n\n🔁 対の能力：a：実行力" },
        { head: "i：応用力（習得本能・ユニーク W＋）", body: "情報と情報をつなぎ合わせて、新しいものを作り出す企画力を作るために必要な能力です。\n\n【くわしく】\n人と人、物と物、情報と情報など、あらゆるものをミックスさせて新しいものを生み出すことができる能力です。クリエイティブな場面で非常に活きてくる力で、企画力と言われることもあります。自分らしさのフィルターを通して様々な事象を吸収し、そこから柔軟な発想が生まれます。他人が思いもよらない切り口での提案が得意です。ゼロから何かを生み出すだけでなく、今あるものを活かす応用力があなたの強みであり、機転に富んだ対応ができるのが魅力なのです。そもそもの着眼点が抜きんでているので、アイデアは枯れることなくあなたの中から泉のように湧き続けることでしょう。「協働共生」がキーワードのこれからの時代に、最も求められる能力です。\n\n【サブ能力】\n・創造力：自分の考え、直感やイメージから、それまでになかったものを作り出すことができる力\n・企画力：実現すべき物事の内容を考え、その実現に向けての計画を立てることができる力\nこの「創造力」と「企画力」が合わさって「応用力」になります。\n\n【どんな人？】\n見たもの・聞いたものを自分で変化させて展開する。変化を求めるため組織向きではない。\n\n【能力を発揮するには】\n直感やイメージを大切にして、具体的な計画を立て実行していくこと。\n\n【iが100%の場合】\n自分の考え、直感やイメージから、それまでになかったものをつくり出すことができます。実現すべき物事の内容を考え、その実現に向けての計画を立てるのも上手です。直感やイメージを状況や条件とつなぎ合わせながらうまく進めていけば、さらなる成功につながるでしょう。\n（有名人の例：戸田恵梨香）\n\n【実践メモ】\n・破壊と創造、工夫と発想。0→1（ゼロイチ）が得意。アイデアの質が高い。1＋1を3にする力。\n・「aとbどっちがいい？」に「cでいきましょう」と返せる人。クリエイター向き。\n\n🔁 対の能力：d：表現力" },
        { head: "j：吸収力（習得本能・ロジック W－）", body: "見たものや聞いたものを、必要なポイントだけを絞り込んで理解するために必要な能力です。\n\n【くわしく】\n見聞きしたもののポイントを見極め、必要な情報を集めて取り入れることのできる、貴重な能力です。吸収する精度と速度、両輪ともに優れているので、学習能力が高いところが特筆すべき点です。プライベートにおいてもビジネスシーンにおいても、あなた自身を育みへと導いてくれる力と言えます。計画を推進させるために欠かせないスキルや情報をきちんと押さえた上で、前向きに展開させていきます。このように、行動に直結することから、実働部隊としての実力を高く評価されます。特にスタートアップ期には大変重宝されるでしょう。忍耐強さや体力も備わっており、身のこなし方ひとつで組織の中枢に抜擢されることも少なくありません。\n\n【サブ能力】\n・分析力：対象やイメージ・概念などを、それを構成する部分や要素、条件などに分け入って解明することができる力\n・説得力：自分の考えも人の話も、いかにも自分が体験したかのように相手に伝え、納得させることができる力\nこの「分析力」と「説得力」が合わさって「吸収力」になります。\n\n【どんな人？】\n見た・聞いたものをそのままの形で展開し、伝えることができる。\n\n【能力を発揮するには】\n他人の経験や成功例を取り入れながら、自分で考え自分で進めていくこと。\n\n【jが100%の場合】\n対象やイメージ・概念などを、構成する部分・要素・条件などに細かく分け入って解明することができます。自分の話だけでなく、人の話でさえもいかにも自分が体験したように相手に伝え、納得させるスキルも高い。他人の経験や成功例を取り入れ、具体的に自分の考えに置き換えて進めていけば、さらなる高みに到達できるでしょう。\n（有名人の例：j-j：小林一三、寺田心、坂本龍一）\n\n【実践メモ】\n・一旦は完コピ→守破離（分解して整理）。吸収して出す。出典元を気にするタイプ。\n\n🔁 対の能力：c：判断力" },
      ]
    },
    {
      icon: "🌙", menu: "宿曜27宿", title: "宿曜27宿 ── 月の占星術",
      intro: "まず「宿曜教ってなに？」を読んでから、7つのチームを開いて自分の宿を探してください。どの宿も発生比率は約3.7%（27分の1）です。",
      items: [
        { type: "info", head: "宿曜教（すくようきょう）ってなに？", body: "宿曜教は、約1200年前に弘法大師・空海が中国（唐）から日本へ持ち帰った「宿曜経（すくようきょう）」というお経がもとになっている、月の占星術です。\n\n西洋占星術が太陽の通り道を12星座に分けるのに対して、宿曜は月の通り道（白道）を27に分けます。この27の区画を「宿（しゅく）」と呼び、生まれた日に月がどの宿にいたかで、その人の「本命宿（ほんみょうしゅく）」が決まります。\n\n性格だけでなく「人と人との相性」を読むのがとても得意な占いで、戦国武将が家来選びや戦の作戦に使ったと言われるほど。このアプリの相性ページも、この宿曜の仕組みで計算しています。\n\nどの宿になるかの発生比率は全て約3.7%（27分の1）。「珍しい宿」「ありふれた宿」の差はほぼなく、みんな平等です。\n\n27宿は、性質の近いもの同士で7つのチームに分けられます：\n🪨 安重宿…おっとりどっしり安定チーム（畢・翼・斗・壁）\n🌸 和善宿…みんなに愛される優等生チーム（觜・角・房・奎）\n🐺 悪害宿…一匹狼のカリスマチーム（参・柳・心・尾）※「悪い宿」ではなく、個性が強いという意味です\n💨 急速宿…フットワーク激軽スピードスターチーム（鬼・軫・婁・胃）\n🔥 猛悪宿…圧倒的パワフルリーダーチーム（星・張・箕・室）\n🎭 剛柔宿…ギャップ萌えの芸術家チーム（昴・氐）\n🪁 軽躁宿…自由大好きなチャレンジャーチーム（井・亢・女・虚・危）" },
        { head: "🪨 安重宿 ── おっとりどっしり安定チーム（畢・翼・斗・壁）", children: [
            { head: "畢宿（ひっしゅく）── 意志の強さは27宿No.1のじっくり職人", body: "🪨 所属：安重宿（おっとりどっしり安定チーム）／発生比率：約3.7%\n\n⭕ 長所\nとにかく粘り強く、一度決めた目標はどれだけ時間がかかっても最後までやり遂げます。真面目でウソを言わないため、周りからの信頼はバツグンです。\n\n⚠️ 短所\n人のアドバイスを頑なに拒む「超・頑固者」になるところ。自分のペースを乱されるとフリーズしたり、不機嫌になったりします。\n\n🏫 クラスでの日常\n定期テストの3週間前から毎日きっちり2時間勉強するタイプ。周りが「もう提出物あきらめた〜」と騒いでいても、一切流されずに自分のワークを黙々と終わらせています。" },
            { head: "翼宿（よくしゅく）── 理想を高く持つ、誠実な旅人", body: "🪨 所属：安重宿（おっとりどっしり安定チーム）／発生比率：約3.7%\n\n⭕ 長所\n誰に対しても礼儀正しく、曲がったことが嫌いな優等生。自分の限界を決めず、海外や広い世界で活躍するような、大きくて綺麗な夢を持っています。\n\n⚠️ 短所\n自分にも他人にも「完璧」を求めすぎるため、少し息苦しくなりがち。思い通りにいかないと、一人で部屋に引きこもって悩み込んでしまいます。\n\n🏫 クラスでの日常\n英語の授業や、海外の文化を紹介する行事で大活躍。派手なグループには属さず、自分の価値観を理解してくれる一握りの親友と、深く静かに付き合います。" },
            { head: "斗宿（としゅく）── 生まれながらに勝利が約束されたカリスマ", body: "🪨 所属：安重宿（おっとりどっしり安定チーム）／発生比率：約3.7%\n\n⭕ 長所\n必死にガツガツしていないのに、なぜかいつも美味しいところを持っていける「強運」の持ち主。頭が良くて品があり、不思議と周りから一目置かれます。\n\n⚠️ 短所\n心の奥ではかなりのプライドを持っています。そのため、自分のプライドが傷つくような失敗をしそうになると、挑戦せずに逃げてしまうことも。\n\n🏫 クラスでの日常\n合唱コンクールや体育祭で、自分から立候補したわけでもないのに「お前がリーダーやってよ」と周りから推薦され、しかもそれをスマートにこなしてしまうタイプ。" },
            { head: "壁宿（へきしゅく）── 頼れるみんなの保健室・サポーター", body: "🪨 所属：安重宿（おっとりどっしり安定チーム）／発生比率：約3.7%\n\n⭕ 長所\n穏やかで優しく、人の心の痛みに誰よりも敏感です。友達の愚痴や悩みを「うん、うん」と何時間でも聞いてあげられる、クラスの癒やしキャラ。\n\n⚠️ 短所\n他人を優先しすぎて、自分の意見を後回しにしがち。「本当は嫌だけど、断ったら悪いな…」と、都合よく使われてしまうことがあります。\n\n🏫 クラスでの日常\n班決めで余ってしまった人がいたら、真っ先に「こっちおいで！」と声をかけるタイプ。裏方でみんなを支えるのが上手で、部活のマネージャーをやると神がかります。" },
        ] },
        { head: "🌸 和善宿 ── みんなに愛される優等生チーム（觜・角・房・奎）", children: [
            { head: "觜宿（ししゅく）── おしゃべりと計算で道を切り開く頭脳派", body: "🌸 所属：和善宿（みんなに愛される優等生チーム）／発生比率：約3.7%\n\n⭕ 長所\n言葉のセンスが天才的で、知識を吸収するのが大好き。物事を冷静に分析する能力が高く、どうすれば自分が得をするかを考える「戦略家」です。\n\n⚠️ 短所\n口が達者すぎるあまり、相手の痛いところをズバズバ突きすぎて論破してしまうことも。周りから「理屈っぽくてちょっと怖い」と思われることがあります。\n\n🏫 クラスでの日常\n授業のディベート（討論）や、班の発表の時に大活躍。誰も言い返せないような完璧な意見をバシッと言って、先生を「おぉ…」と唸らせるタイプです。" },
            { head: "角宿（かくしゅく）── 楽しいことならお任せのおしゃれ番長", body: "🌸 所属：和善宿（みんなに愛される優等生チーム）／発生比率：約3.7%\n\n⭕ 長所\n明るくて人懐っこく、初対面の人ともすぐに仲良くなれます。ファッションや音楽などのセンスが良く、遊ぶことに関するアイデアは無限大です。\n\n⚠️ 短所\n楽しいことへの誘惑にめちゃくちゃ弱いです。やろうと思っていた宿題を「明日でいいや」と後回しにし続け、最終日に泣きを見る典型タイプ。\n\n🏫 クラスでの日常\n文化祭の出し物を決めるとき、「お化け屋敷がいい！」「こういう衣装作ろう！」と一番ワクワクする提案をして、クラスのテンションを爆上げする人です。" },
            { head: "房宿（ぼうしゅく）── お金と運に守られた、気高きエリート", body: "🌸 所属：和善宿（みんなに愛される優等生チーム）／発生比率：約3.7%\n\n⭕ 長所\n直感がものすごく鋭く、美味しいチャンスを見つけるのが大得意。生まれつき金運や周囲からの引き立て運があり、大人っぽい不思議な魅力があります。\n\n⚠️ 短所\n自分が一番でありたいという「女王様・王様」な気質があります。他人を見下すような態度をとってしまうと、周りから孤立することがあるので注意。\n\n🏫 クラスでの日常\n普段はクールでちょっと近寄りがたいオーラを出していますが、テストの点数はいつも上位。たまに見せる笑顔のギャップで、実はファンが多いタイプです。" },
            { head: "奎宿（けいしゅく）── 純度100%のピュアな王子様・お姫様", body: "🌸 所属：和善宿（みんなに愛される優等生チーム）／発生比率：約3.7%\n\n⭕ 長所\n育ちが良くて上品、そして心がとっても綺麗です。困っている人がいれば損得抜きで助けに行きます。恋愛や友情に対しても、とにかく一途です。\n\n⚠️ 短所\n世界を綺麗に見すぎているため、人のウソや悪意に簡単に騙されてしまいます。傷つくとショックが大きすぎて、立ち直るのにもの凄く時間がかかります。\n\n🏫 クラスでの日常\n落ちているゴミを当たり前のように拾ったり、誰もやりたがらない雑用を笑顔で引き受けたりします。そのピュアさに、クラスのヤンキーですら一目置くレベル。" },
        ] },
        { head: "🐺 悪害宿 ── 一匹狼のカリスマチーム（参・柳・心・尾）", children: [
            { head: "参宿（しんしゅく）── 常識をぶっ壊す、陽気なアイデアマン", body: "🐺 所属：悪害宿（一匹狼のカリスマチーム）／発生比率：約3.7%\n\n⭕ 長所\n27宿の中で一番「新しさ」を愛する人。古いルールに縛られず、新しいトレンドや面白いことをどんどん取り入れ、周りに笑いを届けます。\n\n⚠️ 短所\n悪気は一切ないのですが、思ったことをその場でストレートに口に出してしまいます。「その髪型、変だよ！」などと言って、相手をガチ凹みさせちゃうことも。\n\n🏫 クラスでの日常\nクラスのLINEグループで、誰も使っていないような面白いスタンプを連発して会話を盛り上げるタイプ。怒られてもケロッと翌日には忘れています。" },
            { head: "柳宿（りゅうしゅく）── 仲間を命がけで守る、熱血の隠れボス", body: "🐺 所属：悪害宿（一匹狼のカリスマチーム）／発生比率：約3.7%\n\n⭕ 長所\n見た目は物静かで穏やかに見えますが、内面はとんでもなく情熱的。特に「自分の大好きな友達」に対する愛情は深く、仲間のためなら先生にも盾突きます。\n\n⚠️ 短所\n好き嫌いが激しすぎるところ。一度「この人嫌い」と思うと、心のシャッターを完全に下ろしてしまい、挨拶すら拒否するような極端さがあります。\n\n🏫 クラスでの日常\n普段は教室の隅で静かに本を読んでいたりしますが、友達が別のグループから嫌がらせを受けているのを知ると、即座にブチ切れて味方をしてくれるアツい人。" },
            { head: "心宿（しんしゅく）── 相手の心を透視する、愛されミステリアス", body: "🐺 所属：悪害宿（一匹狼のカリスマチーム）／発生比率：約3.7%\n\n⭕ 長所\n相手が「今、何を言ってほしいか」が直感でわかる読心術の天才。誰にでも合わせられるので、先輩からも後輩からも「話しやすい人」としてモテモテになります。\n\n⚠️ 短所\n周りに合わせすぎて、自分の本当の気持ちが迷子になりがち。また、実はかなりの疑り深さを持っていて、相手をなかなか100%信用しません。\n\n🏫 クラスでの日常\nヤンキーグループとも、ガリ勉グループとも、オタクグループとも、なぜか全員と楽しそうに世間話ができる、クラスで一番謎の多い世渡り上手。" },
            { head: "尾宿（びしゅく）── 競争を勝ち抜く、ストイックな本格職人", body: "🐺 所属：悪害宿（一匹狼のカリスマチーム）／発生比率：約3.7%\n\n⭕ 長所\n自分の興味があることに対して、狂気的なまでの集中力を発揮します。お世辞を言わず、常に本気で勝負する、背中で語るタイプのかっこよさがあります。\n\n⚠️ 短所\n言葉数が少なすぎて、「怒ってるのかな？」と勘違いされやすいです。また、ライバル意識が強すぎて、勝負事になると周りが見えなくなることも。\n\n🏫 クラスでの日常\nスマホゲームのランキングで全国上位に入っていたり、絵や演奏でとんでもない賞を取ったりするタイプ。普段の影は薄いですが、実力はガチです。" },
        ] },
        { head: "💨 急速宿 ── フットワーク激軽スピードスターチーム（鬼・軫・婁・胃）", children: [
            { head: "鬼宿（きしゅく）── 自由奔放、みんなの心を動かす風の申し子", body: "💨 所属：急速宿（フットワーク激軽スピードスターチーム）／発生比率：約3.7%\n\n⭕ 長所\n縛られるのが大嫌いで、常に自分のワクワクに従って動くピュアな人。直感力がものすごく高く、普通の人には思いつかないようなミラクルを起こします。\n\n⚠️ 短所\nとにかく気分屋さん。さっきまで「やろう！」と言っていたのに、5分後には別のことに夢中になっているような、自由すぎる行動で周りを振り回します。\n\n🏫 クラスでの日常\n昼休みに「アイス買いに行こう！」と急に言い出してダッシュしたかと思えば、途中で見つけた野良猫とずっと遊んでいて結局チャイムに遅れるようなタイプ。" },
            { head: "軫宿（しんしゅく）── 何でもこなす、気配り上手なスピードスター", body: "💨 所属：急速宿（フットワーク激軽スピードスターチーム）／発生比率：約3.7%\n\n⭕ 長所\n頭が良く、手先も器用で、動きも素早い。物事を要領よく片付けるのが得意で、さらに人の話をじっくり聞いてあげる優しさも持ち合わせています。\n\n⚠️ 短所\n傷つきやすい繊細な心（ガラスのハート）を隠しています。周りに気を使いすぎて、一人になった瞬間に「どっと疲れた…」とエネルギー切れになりやすいです。\n\n🏫 クラスでの日常\nグループワークの時に、みんなの意見をスマートにまとめて、ササッと綺麗なスライドやポスターを作ってくれる、班に一人は絶対に欲しい超有能キャラ。" },
            { head: "婁宿（ろうしゅく）── 困った人を放っておけない、お世話係の天才", body: "💨 所属：急速宿（フットワーク激軽スピードスターチーム）／発生比率：約3.7%\n\n⭕ 長所\n人をプロデュースしたり、看病したり、手助けしたりする才能がピカイチ。アイデアが豊富で、イベントなどの裏方的コーディネートがとても上手です。\n\n⚠️ 短所\n人のダメなところがパッと目についてしまうため、ついつい「小言」や「説教」が多くなりがち。「お母さんぶらないでよ！」と反発されることも。\n\n🏫 クラスでの日常\n友達が体調を崩したら、すぐに保健室へ連れて行き、ノートのコピーを頼まれなくても取っておいてあげるような、細やかで姉御肌（兄貴肌）な人。" },
            { head: "胃宿（いしゅく）── どんな壁もぶち破る、熱血パワフルファイター", body: "💨 所属：急速宿（フットワーク激軽スピードスターチーム）／発生比率：約3.7%\n\n⭕ 長所\nとにかくガッツと行動力が桁違い。難しい問題やピンチに直面するほど「おもしろくなってきたじゃん！」と燃え上がる、メンタル最強の戦士です。\n\n⚠️ 短所\n気が強すぎて、一度言い合いになると一歩も引きません。自分の意見を押し通そうとして、強引な独裁者になってしまうことがあります。\n\n🏫 クラスでの日常\n体育祭のクラス対抗リレーなどで、「おい、絶対勝つぞ！全員朝練な！」とみんなを引っ張るタイプ。最初は引かれるけど、最終的にはその熱さでクラスが一つになります。" },
        ] },
        { head: "🔥 猛悪宿 ── 圧倒的パワフルリーダーチーム（星・張・箕・室）", children: [
            { head: "星宿（せいしゅく）── 個性が爆発する、我が道をゆく頑固モノ", body: "🔥 所属：猛悪宿（圧倒的パワフルリーダーチーム）／発生比率：約3.7%\n\n⭕ 長所\n「人は人、自分は自分」が完全に突き抜けているタイプ。歴史や古いもの、あるいは誰も知らないマニアックなものが好きで、独特の深いセンスを持っています。\n\n⚠️ 短所\n自分の世界を邪魔されるのを極端に嫌います。親や先生から「普通はこうでしょ」と言われると、激しく反発して絶対に言うことを聞きません。\n\n🏫 クラスでの日常\nみんなが流行りの曲を聴いている中で、一人だけ昭和のレトロなアニソンや洋楽を聴いていたりするタイプ。自分のこだわりを語らせると止まりません。" },
            { head: "張宿（ちょうしゅく）── 華やかさ100%、クラスの主役スター", body: "🔥 所属：猛悪宿（圧倒的パワフルリーダーチーム）／発生比率：約3.7%\n\n⭕ 長所\nそこにいるだけでパッと周囲が明るくなるような、強烈なスター性を持っています。人をもてなすのが上手で、みんなから愛されるリーダーになります。\n\n⚠️ 短所\nついつい自分を大きく見せようと、話を盛ってしまったり、大げさな態度を取ったりしがち。見栄を張りすぎて後でお財布や予定がピンチになることも。\n\n🏫 クラスでの日常\n文化祭のステージ発表で、主役や司会をやって大歓声を浴びるタイプ。普段の学校生活でも、周りにいつも笑い声が絶えない中心人物です。" },
            { head: "箕宿（きしゅく）── 嵐のように豪快な、サッパリ肉食系", body: "🔥 所属：猛悪宿（圧倒的パワフルリーダーチーム）／発生比率：約3.7%\n\n⭕ 長所\nウジウジ悩むのが大嫌いな超ポジティブ人間。裏表が全くなく、自分の本音で堂々と生きているため、その男前（女前）な性格にみんながついて行きたくなります。\n\n⚠️ 短所\n細かい気配りや、人のデリケートな気持ちを察するのがちょっと苦手。「え？何でそんなことで泣いてるの？」と、悪気なく傷口に塩を塗ることがあります。\n\n🏫 クラスでの日常\nスポーツテストで学年トップクラスの記録を出し、部活では誰よりも大声を出してチームを盛り上げる、クラスの「頼れる兄貴・姉貴」です。" },
            { head: "室宿（しつしゅく）── 夢を現実に変える、圧倒的な実力派リーダー", body: "🔥 所属：猛悪宿（圧倒的パワフルリーダーチーム）／発生比率：約3.7%\n\n⭕ 長所\n「これをやる！」と決めた時のパワーと、それを成功させるための知能、行動力のすべてを持っています。大きな成功を手にする大物タイプです。\n\n⚠️ 短所\n自信がありすぎるあまり、他人の意見を「そんなのダメに決まってる」とバッサリ切り捨てがち。気がつけば周りがイエスマンばかりになる危険性も。\n\n🏫 クラスでの日常\n生徒会長や部活のキャプテンとして、圧倒的な実力で学校を引っ張るタイプ。少し怖いけど、この人についていけば間違いないという安心感があります。" },
        ] },
        { head: "🎭 剛柔宿 ── ギャップ萌えの芸術家チーム（昴・氐）", children: [
            { head: "昴宿（ぼうしゅく）── お上品に見えて、内面は負けず嫌いな引き立て美人", body: "🎭 所属：剛柔宿（ギャップ萌えの芸術家チーム）／発生比率：約3.7%\n\n⭕ 長所\n27宿の中で一番「お上品で綺麗」な星。言葉遣いや態度が洗練されていて、目上の人（先生や先輩）からとにかく可愛がられ、チャンスをたくさんもらえます。\n\n⚠️ 短所\n実はめちゃくちゃプライドが高く、負けず嫌い。周りから褒められないとやる気をなくしたり、地味な努力をカッコ悪いとサボったりする一面も。\n\n🏫 クラスでの日常\n先生から「これ手伝ってくれる？」と名指しで頼まれることが多いタイプ。ノートの字がめちゃくちゃ綺麗で、いつもスマートに見える人です。" },
            { head: "氐宿（ていしゅく）── 笑顔の裏に野心を秘めた、最強の世渡り上手", body: "🎭 所属：剛柔宿（ギャップ萌えの芸術家チーム）／発生比率：約3.7%\n\n⭕ 長所\n誰とでもパッと仲良くなれる、親しみやすさバツグンの人。ですが中身は超タフで、どうすれば自分が一番効率よく目標を達成できるか計算できる、現実的な強さがあります。\n\n⚠️ 短所\n自分の目的のためなら、少しズルいことや、人を上手く利用することも平気でできてしまいます。やりすぎると「あいつ、計算高いな」とバレてしまうことも。\n\n🏫 クラスでの日常\n普段は「え〜、勉強全然わかんない〜」と言って笑っているのに、テストが返ってくるとちゃっかり満点近く取っているような、油断ならない実力派。" },
        ] },
        { head: "🪁 軽躁宿 ── 自由大好きなチャレンジャーチーム（井・亢・女・虚・危）", children: [
            { head: "井宿（せいしゅく）── クールでロジカルな、クラスの裁判官", body: "🪁 所属：軽躁宿（自由大好きなチャレンジャーチーム）／発生比率：約3.7%\n\n⭕ 長所\n感情に流されず、常に「何が正しいか」を頭で考えられる、理系の天才タイプ。嘘を見抜くのが得意で、争い事を冷静に解決する力があります。\n\n⚠️ 短所\n正論をズバズバ言いすぎるため、相手の逃げ道をなくしてしまいます。冷たいロボットのようだと思われることもありますが、内面は寂しがりやです。\n\n🏫 クラスでの日常\n友達が「あの子がさ〜」と感情的に愚痴ってきたときに、「でもそれ、お前も悪くない？」と冷静すぎる正論を返して、相手を凍りつかせるタイプ。" },
            { head: "亢宿（こうしゅく）── 正義感で突き進む、クラスのヒーロー", body: "🪁 所属：軽躁宿（自由大好きなチャレンジャーチーム）／発生比率：約3.7%\n\n⭕ 長所\n自分が信じた「正義」や「ルール」を決して曲げません。いじめや不条理なルールに対して、誰よりも怒り、体を張って立ち向かうかっこよさがあります。\n\n⚠️ 短所\n融通が全く効かないところ。「今回だけは目をつぶってよ」という友達の頼みも断るため、真面目すぎて「お堅い人」と思われてしまうことがあります。\n\n🏫 クラスでの日常\n先生が理不尽な理由でクラス全員を怒っているときに、「それは先生の言い分がおかしいと思います！」と、一人だけ席から立って言い返してくれるような人。" },
            { head: "女宿（じょしゅく）── コツコツ努力で頂点に立つ、陰の支配者", body: "🪁 所属：軽躁宿（自由大好きなチャレンジャーチーム）／発生比率：約3.7%\n\n⭕ 長所\n目立つのは嫌いですが、自分を厳しくコントロールして、裏でコツコツと実力をつけます。計画を立ててそれを実行する能力は27宿トップクラスです。\n\n⚠️ 短所\n自分への厳しさを、他人にも求めてしまいます。「何でみんなちゃんとやらないの？」と、心の中で周りに対してイライラを溜め込みがち。\n\n🏫 クラスでの日常\n表立って目立つリーダーではないけれど、班活動のスケジュール管理や提出物のチェックを完璧にこなす、実質クラスを動かしている陰のボス。" },
            { head: "虚宿（きょしゅく）── 宇宙のような心を持つ、超ロマンチスト", body: "🪁 所属：軽躁宿（自由大好きなチャレンジャーチーム）／発生比率：約3.7%\n\n⭕ 長所\n誰も思いつかないような深い世界観や、芸術・音楽の才能を持っています。感受性が人一倍豊かで、物事の「本質」を見抜く力があります。\n\n⚠️ 短所\nメンタルのアップダウンが激しく、急に超ネガティブモードに入ることがあります。プライドが高くて傷つきやすいため、心を閉ざしてしまいがち。\n\n🏫 クラスでの日常\n休み時間に机に伏せて、少し寂しそうなオーラを出しつつ音楽を聴いている人。話しかけると、実はめちゃくちゃ面白くて深い考えを持っている「不思議ちゃん」。" },
            { head: "危宿（きしゅく）── 楽しさ重視、直感で生きるお調子者", body: "🪁 所属：軽躁宿（自由大好きなチャレンジャーチーム）／発生比率：約3.7%\n\n⭕ 長所\nとにかくピュアで無邪気！新しいゲーム、新しい遊びをみつけると真っ先に飛びつきます。ノリが良くてサッパリしているので、友達作りがとても上手です。\n\n⚠️ 短所\n飽きっぽさは27宿の中でダントツです。昨日まで「これ絶対一生続ける！」と言っていた趣味を、今日にはすっかり忘れて別のことをしています。\n\n🏫 クラスでの日常\nテスト当日の朝に「やばい！1秒も勉強してない！」と大騒ぎしているお調子者。でも、怒られても落ち込んでも、寝て起きたら笑顔で登校してくるメンタルの軽さがあります。" },
        ] },
      ]
    },
    {
      icon: "📜", menu: "60干支ずかん", title: "60干支ずかん ── 生まれた日の干支でわかる60タイプ",
      intro: "自分のNo.（診断結果カードのNo.◯◯）が入っているグループのボタンを押すと、その中の6つの干支が出てきます。",
      items: [
        { type: "info", open: true, head: "そもそも「60干支」ってなに？", body: "四柱推命(しちゅうすいめい)は、生まれた「年・月・日・時間」の4つの柱から、その人の性格や運勢を読みとく占いです。なかでもいちばん大事なのが「生まれた日」の干支=日柱(にっちゅう)。これがその人の「性格の芯(しん)」を表すといわれます。\n\n干支は、10種類の「干(かん)」と12種類の「支(し)」(子・丑・寅…おなじみの十二支)の組み合わせでできていて、全部で60種類あります。\n\n10種類の「干」は、それぞれ自然のものにたとえられます。「たとえ=つまりこういう性格」まで訳すと、こうなります。" },
        { head: "🌳 甲(きのえ)グループ — 大樹（No.1・11・21・31・41・51）", body: "空に向かってまっすぐのびる大きな木。正直でウソがきらい、みんなを引っぱるリーダータイプ。そのぶん「曲げない・折れない」がんこさも持っています。木が立つ場所(季節や環境)によって、6つの個性に分かれます。", children: [
            { head: "No.1 甲子(きのえね)🐾長距離ランナーのチータ", body: "「冬の水辺で育つ、かしこい若木」\n🐾 動物キャラ：長距離ランナーのチータ（エネルギー：大樹T+）\n\n60干支のいちばん最初の干支。冬の川のほとりで、たっぷり水をもらってすくすく育つ木のイメージです。頭の回転が速く、新しいことをスポンジみたいに吸収するのが得意。素直で人にかわいがられ、先生や先輩から引き立ててもらえるタイプです。流行にも敏感で、クラスで最初に新しいものに気づくのはこの人かも。\n\n⭕ いいところ\n吸収力バツグン。素直さと賢さで、目上の人に応援してもらえる。\n\n⚠️ 気をつけたいこと\n水が多すぎると根がゆらぐように、まわりに流されたり飽きっぽくなったりしがち。「これ!」と決めたことは続けてみよう。" },
            { head: "No.11 甲戌(きのえいぬ)🐾正直なこじか", body: "「秋の大地にどっしり立つ、義理がたい木」\n🐾 動物キャラ：正直なこじか（エネルギー：大樹T+）\n\n実りの秋、乾いた大地にしっかり根を張る木のイメージ。まじめで責任感が強く、一度「やる」と言ったことは最後までやりぬきます。正義感が強くて、困っている友だちを放っておけない親分・姉御タイプ。仲間からの信頼はバツグンです。\n\n⭕ いいところ\n約束を守る、めんどう見がいい、コツコツ努力できる。\n\n⚠️ 気をつけたいこと\n「こうあるべき!」が強くなりすぎると、自分もまわりも苦しくなることが。ときには「まあいっか」も大事。" },
            { head: "No.21 甲申(きのえさる)🐾落ち着きのあるペガサス", body: "「岩場でも育つ、くふう上手な木」\n🐾 動物キャラ：落ち着きのあるペガサス（エネルギー：大樹T+）\n\nごつごつした岩場に生えた木のイメージ。ふつうなら育ちにくい場所でも、根っこをくねらせて工夫して生きていく、頭のやわらかいアイデアマンです。行動力があり、環境が変わってもすぐ対応できるのが強み。話もうまく、その場を盛り上げるのが得意です。\n\n⭕ いいところ\nピンチに強い。発想力と器用さで道を切りひらける。\n\n⚠️ 気をつけたいこと\n器用なぶん、いろいろ手を出して中途半端になりがち。「ひとつを深く」も意識してみよう。" },
            { head: "No.31 甲午(きのえうま)🐾リーダーとなるゾウ", body: "「真夏の太陽の下で燃える、情熱の木」\n🐾 動物キャラ：リーダーとなるゾウ（エネルギー：大樹T+）\n\n真夏のギラギラした日ざしの中に立つ木。木が火を生むように、心の中にいつも情熱の炎を燃やしています。明るくてノリがよく、直感でパッと動けるタイプ。「おもしろそう!」と思ったら一直線で、その勢いがまわりの人を巻きこんでいきます。\n\n⭕ いいところ\n行動力とスピード感はトップクラス。場を明るくするムードメーカー。\n\n⚠️ 気をつけたいこと\n燃えすぎるとエネルギー切れに。せっかちで感情の波もあるので、深呼吸してから動くとうまくいく。" },
            { head: "No.41 甲辰(きのえたつ)🐾大器晩成のたぬき", body: "「うるおった春の大地に根を張る、ねばり強い木」\n🐾 動物キャラ：大器晩成のたぬき（エネルギー：大樹T+）\n\n春の、水分たっぷりのやわらかい土に根を張る木のイメージ。栄養がしっかりあるので、時間をかけて大きく育ちます。すぐに結果が出なくてもあきらめない、ねばり強さが最大の武器。夢が大きく、コツコツ積み上げて最後にドーンと花を咲かせる「大器晩成」タイプです。\n\n⭕ いいところ\nあきらめない心と大きな夢。逆境でもじわじわ成長できる。\n\n⚠️ 気をつけたいこと\nマイペースすぎて「がんこ」と思われることも。人のアドバイスにも耳をかたむけてみよう。" },
            { head: "No.51 甲寅(きのえとら)🐾我が道を行くライオン", body: "「森の中でいちばん高くそびえる、王様の木」\n🐾 動物キャラ：我が道を行くライオン（エネルギー：大樹T+）\n\n春のはじめ、森の中で堂々とそびえ立つ大木のイメージ。甲グループの中でも特にパワフルで、自分の考えをしっかり持ち、まっすぐつらぬくタイプです。たよりがいがあり、自然とリーダーに選ばれることが多いはず。竹を割ったような性格で、かけひきや裏工作は苦手です。\n\n⭕ いいところ\nブレない意志と行動力。「この人についていきたい」と思わせる存在感。\n\n⚠️ 気をつけたいこと\n大木は強い風で折れることも。プライドが高くなりすぎず、人にたよる勇気も持とう。" },
        ] },
        { head: "🌷 乙(きのと)グループ — 草花（No.2・12・22・32・42・52）", body: "風がふいてもしなって折れない、草や花のイメージ。やわらかくて協調性があり、どんな場所でも根を張れるたくましさが魅力。「おだやかに見えて、実はねばり強い」のが乙グループの合言葉です。", children: [
            { head: "No.2 乙丑(きのとうし)🐾社交家のたぬき", body: "「冬の土の下で春を待つ、がまん強い草」\n🐾 動物キャラ：社交家のたぬき（エネルギー：草花T-）\n\n冷たい冬の土の中で、じっと春を待つ草のイメージ。派手さはないけれど、コツコツ努力を積み重ねられる大変な努力家です。一歩一歩は小さくても、気づけばだれよりも遠くまで進んでいるタイプ。誠実さで、まわりからじわじわ信頼されていきます。\n\n⭕ いいところ\n忍耐力と継続力はピカイチ。地道な努力を裏切らない人。\n\n⚠️ 気をつけたいこと\nがまんしすぎて気持ちをため込みがち。つらいときは早めに人に話そう。" },
            { head: "No.12 乙亥(きのとい)🐾人気者のゾウ", body: "「水辺にゆれる、やさしい水草」\n🐾 動物キャラ：人気者のゾウ（エネルギー：草花T-）\n\n冬の水辺にただよう水草のイメージ。想像力が豊かで、心のやさしいロマンチストです。人の気持ちを感じとる力が強く、落ちこんでいる友だちにそっと寄りそえるタイプ。芸術や物語の世界が好きで、独特の感性を持っています。\n\n⭕ いいところ\n思いやりと豊かな想像力。いっしょにいるとホッとする存在。\n\n⚠️ 気をつけたいこと\n水の流れに身をまかせすぎて、人の意見に流されがち。「自分はどうしたい?」を大事にしよう。" },
            { head: "No.22 乙酉(きのととり)🐾強靭な翼を持つペガサス", body: "「花びんにかざられた、美しい切り花」\n🐾 動物キャラ：強靭な翼を持つペガサス（エネルギー：草花T-）\n\nきれいに生けられた花のイメージ。センスがよく、身のこなしや持ち物がどこか上品なタイプです。環境への適応力が高く、転校やクラス替えなど新しい場所でもすぐになじめます。実は芯が強く、きびしい環境でも凛(りん)と咲いていられる人です。\n\n⭕ いいところ\n美的センスと適応力。どこにいても「絵になる」存在感。\n\n⚠️ 気をつけたいこと\n繊細で傷つきやすい一面が。人の言葉を気にしすぎず、自分のペースで咲こう。" },
            { head: "No.32 乙未(きのとひつじ)🐾しっかり者のこじか", body: "「真夏のかわいた大地に咲く、ど根性の花」\n🐾 動物キャラ：しっかり者のこじか（エネルギー：草花T-）\n\n真夏の乾いた土に、それでもしっかり咲く花のイメージ。見た目はおだやかでかわいらしいのに、中身はおどろくほどがまん強い「ど根性」タイプです。家族や仲間をとても大切にし、自分のことよりみんなのことを優先しがち。苦しい場面ほど本領を発揮します。\n\n⭕ いいところ\n逆境に強い。やさしさと責任感で仲間を支えられる。\n\n⚠️ 気をつけたいこと\n心配性でかかえ込みやすい。「手伝って」と言えるようになると、もっと楽になるよ。" },
            { head: "No.42 乙巳(きのとみ)🐾足腰の強いチータ", body: "「初夏の日ざしをあびて咲きほこる花」\n🐾 動物キャラ：足腰の強いチータ（エネルギー：草花T-）\n\n初夏のあたたかい光の中で、いきいきと咲く花のイメージ。表現力が豊かで、人を楽しませるのが得意な華やかタイプです。好奇心旺盛でフットワークも軽く、友だちの輪がどんどん広がります。おしゃべりやパフォーマンスで注目を集める人気者になれる素質あり。\n\n⭕ いいところ\n明るさと表現力。その場をパッと華やかにできる。\n\n⚠️ 気をつけたいこと\n興味が次々うつって、気が多くなりがち。ここぞという場面では腰をすえてじっくりと。" },
            { head: "No.52 乙卯(きのとう)🐾統率力のあるライオン", body: "「春の野原いっぱいに広がる草花」\n🐾 動物キャラ：統率力のあるライオン（エネルギー：草花T-）\n\n春の野原に一面に咲く草花のイメージ。乙グループの中でいちばんのびのびした干支です。人あたりがやわらかく、だれとでも仲よくなれる社交家。ふまれてもふまれても立ち上がる雑草のようなしぶとさもあり、「やわらかいのに強い」を絵に描いたような人です。\n\n⭕ いいところ\n友だちづくりの天才。何度転んでも立ち上がれるしなやかさ。\n\n⚠️ 気をつけたいこと\nだれにでもいい顔をして「八方美人」に見られることも。本音を言える相手を大切に。" },
        ] },
        { head: "☀️ 丙(ひのえ)グループ — 太陽（No.3・13・23・33・43・53）", body: "みんなを平等に照らす太陽のイメージ。明るくてかくしごとがなく、いるだけで場がパッと明るくなる存在。太陽は自分から輝くので、目立つこと・注目されることが自然と似合います。", children: [
            { head: "No.3 丙寅(ひのえとら)🐾落ち着きのない猿", body: "「山からのぼる、勢いいっぱいの朝日」\n🐾 動物キャラ：落ち着きのない猿（エネルギー：太陽F+）\n\n早春の山からのぼる朝日のイメージ。これから空高くのぼっていく太陽なので、勢いと若々しさが最大の魅力です。思い立ったらすぐ行動、失敗してもすぐ立ち直る、まぶしいくらいの前向きさを持っています。新しいことを始めるときのパワーはクラスいちかも。\n\n⭕ いいところ\nスタートダッシュの天才。前向きさでまわりを元気にできる。\n\n⚠️ 気をつけたいこと\nせっかちで、待つのが苦手。じっくり準備する場面では、あえてゆっくりを心がけて。" },
            { head: "No.13 丙子(ひのえね)🐾ネアカの狼", body: "「冬の湖面にきらめく太陽」\n🐾 動物キャラ：ネアカの狼（エネルギー：太陽F+）\n\n冬の静かな湖に反射してきらきら光る太陽のイメージ。表向きは明るく朗らかなのに、心の中はおどろくほど冷静で、よく考えている「二刀流」タイプです。ノリのよさと頭のよさを両方持っているので、遊びも勉強もそつなくこなせます。\n\n⭕ いいところ\n明るさと冷静さのバランスが絶妙。とっさの判断が的確。\n\n⚠️ 気をつけたいこと\n外では明るくふるまって、本音を見せないことも。信頼できる人には心の中も話してみよう。" },
            { head: "No.23 丙戌(ひのえいぬ)🐾無邪気なひつじ", body: "「一日をやさしく終える、秋の夕焼け」\n🐾 動物キャラ：無邪気なひつじ（エネルギー：太陽F+）\n\n秋の空をオレンジ色にそめる夕日のイメージ。ギラギラした太陽ではなく、見る人の心をあたためる光です。情に厚く、めんどう見がよく、実はロマンチスト。ふだんは落ち着いているのに、好きなことや仲間のことになると内側の情熱が顔を出します。\n\n⭕ いいところ\nあたたかさと誠実さ。そばにいると安心される人。\n\n⚠️ 気をつけたいこと\n照れくさくて本音や愛情をかくしがち。「ありがとう」「うれしい」は言葉にして伝えよう。" },
            { head: "No.33 丙申(ひのえさる)🐾活動的な子守熊", body: "「西の空へ旅する、行動派の太陽」\n🐾 動物キャラ：活動的な子守熊（エネルギー：太陽F+）\n\n夕方に向かって空を移動していく太陽のイメージ。太陽が空を旅するように、じっとしているのが苦手な行動派です。多才で要領がよく、話もおもしろいので、どこへ行っても人気者。旅行や新しい体験が大好きで、行動範囲がとにかく広い人です。\n\n⭕ いいところ\nフットワークの軽さと多才さ。変化を楽しめる柔軟な心。\n\n⚠️ 気をつけたいこと\nあちこち興味が飛んで、ひとつのことが長続きしにくい。「これだけは続ける」を1つ決めておくと強い。" },
            { head: "No.43 丙午(ひのえうま)🐾動き回る虎", body: "「真夏の正午、頂点でかがやく太陽」\n🐾 動物キャラ：動き回る虎（エネルギー：太陽F+）\n\n真夏のお昼、空のてっぺんで照りつける太陽のイメージ。60干支の中でも指折りのエネルギーの持ち主です。情熱的で、目標に向かって突き進む力はけた外れ。堂々としていて、自然とみんなの中心になるカリスマ性があります。\n\n⭕ いいところ\nパワーと情熱は60干支トップクラス。大きな夢をつかめる器。\n\n⚠️ 気をつけたいこと\n光が強すぎて、まわりを「まぶしすぎる…」とさせてしまうことも。人の意見を聞く時間をつくると最強に。" },
            { head: "No.53 丙辰(ひのえたつ)🐾感情豊かな黒ひょう", body: "「春の大地をまるごと照らす、おおらかな太陽」\n🐾 動物キャラ：感情豊かな黒ひょう（エネルギー：太陽F+）\n\n春のうるおった大地をぽかぽかと照らす太陽のイメージ。作物を育てる春の日ざしのように、おおらかで包容力があり、人を育てたり応援したりするのが得意です。楽天的で細かいことを気にしないので、いっしょにいて気楽な存在。夢も大きめです。\n\n⭕ いいところ\n包容力と明るさ。人のいいところを見つけて伸ばせる。\n\n⚠️ 気をつけたいこと\nおおらかすぎて、ちょっとおおざっぱ。提出物や約束の日にちは要チェック!" },
        ] },
        { head: "🕯️ 丁(ひのと)グループ — 灯火（No.4・14・24・34・44・54）", body: "ろうそくや焚き火、夜空の星のような炎のイメージ。太陽ほど派手ではないけれど、暗いところでこそ輝く光。繊細で感受性が豊かで、心の中に静かな情熱を燃やしています。", children: [
            { head: "No.4 丁卯(ひのとう)🐾フットワークの軽い子守熊", body: "「春の夜をともす、やさしいあかり」\n🐾 動物キャラ：フットワークの軽い子守熊（エネルギー：灯火F-）\n\n春の夜、部屋をやわらかく照らすランプのイメージ。感受性がとても豊かで、音楽や絵、物語などの世界に深く感動できる人です。おだやかでやさしく、人を傷つけることが大きらい。その細やかな心が、芸術的なセンスや気くばり上手につながっています。\n\n⭕ いいところ\n芸術的センスと思いやり。小さな変化やがんばりに気づける。\n\n⚠️ 気をつけたいこと\n繊細なぶん、傷つきやすい。落ちこんだら好きなことで心を充電しよう。" },
            { head: "No.14 丁丑(ひのとうし)🐾協調性のないひつじ", body: "「冬の夜にじっと燃える、研究者のランプ」\n🐾 動物キャラ：協調性のないひつじ（エネルギー：灯火F-）\n\n寒い冬の夜、机の上でじっと燃えつづけるランプのイメージ。落ち着きがあり、好きなことをとことん調べたり極めたりする探究心の持ち主です。口数は多くないけれど、心の中には熱いこだわりがぎっしり。「静かなのに芯が熱い」職人・研究者タイプです。\n\n⭕ いいところ\n集中力と探究心。ひとつの道でスペシャリストになれる。\n\n⚠️ 気をつけたいこと\n心を開くまで時間がかかりがち。少しずつでいいので、自分の世界を人に見せてみよう。" },
            { head: "No.24 丁亥(ひのとい)🐾クリエイティヴな狼", body: "「夜の水面にゆれる、幻想的な灯」\n🐾 動物キャラ：クリエイティヴな狼（エネルギー：灯火F-）\n\n静かな夜、水面にゆらゆらと映る灯りのイメージ。想像力がとても豊かで、心の中に自分だけの深い世界を持っています。人の痛みがわかる思いやりの人で、聞き上手。スピリチュアルなことや目に見えない世界に興味を持つ人も多いタイプです。\n\n⭕ いいところ\n深い思いやりと豊かなイメージ力。人の心に寄りそえる。\n\n⚠️ 気をつけたいこと\n考えすぎて一人でぐるぐる悩みがち。体を動かすと心も軽くなるよ。" },
            { head: "No.34 丁酉(ひのととり)🐾気分屋の猿", body: "「秋の夜を彩る、きらめくイルミネーション」\n🐾 動物キャラ：気分屋の猿（エネルギー：灯火F-）\n\n秋の澄んだ夜にきらめく灯りのイメージ。美的センスと直感力にすぐれ、「なんかいい!」を見つける天才です。おしゃれや流行に敏感で、選ぶものにセンスが光ります。ひらめきが鋭く、勉強でも「コツをつかむ」のが早いタイプです。\n\n⭕ いいところ\nセンスとひらめき。人が気づかない魅力を見つけられる。\n\n⚠️ 気をつけたいこと\n好き・きらいがはっきりしすぎて、苦手なものを避けがち。食わずぎらいはもったいない!" },
            { head: "No.44 丁未(ひのとひつじ)🐾情熱的な黒ひょう", body: "「みんなが集まる、夏の夜のキャンプファイア」\n🐾 動物キャラ：情熱的な黒ひょう（エネルギー：灯火F-）\n\n夏の夜、みんなを引き寄せるキャンプファイアのイメージ。あたたかい人がらで、自然とまわりに人が集まってきます。世話好きで、困っている人を見ると放っておけないタイプ。おだやかに見えて、いざというときは意外なほどのがんばりを見せます。\n\n⭕ いいところ\n人を安心させるあたたかさ。縁の下の力持ちとしての信頼感。\n\n⚠️ 気をつけたいこと\nお世話がいきすぎると「おせっかい」になることも。相手のペースも尊重しよう。" },
            { head: "No.54 丁巳(ひのとみ)🐾楽天的な虎", body: "「静かに見えて燃えさかる、情熱のかがり火」\n🐾 動物キャラ：楽天的な虎（エネルギー：灯火F-）\n\n夜を明るく照らす大きなかがり火のイメージ。丁グループの中でいちばん火力が強い干支です。ふだんは物静かでおだやかなのに、目標や好きなことを見つけたときの集中力と負けん気はすさまじいものがあります。「静かな闘志」という言葉がぴったりです。\n\n⭕ いいところ\nここぞという場面の集中力と粘り。本番に強い。\n\n⚠️ 気をつけたいこと\n不満をため込んで、ある日ドカンと爆発しがち。小出しに気持ちを伝える練習を。" },
        ] },
        { head: "⛰️ 戊(つちのえ)グループ — 山（No.5・15・25・35・45・55）", body: "何百年も動かず、どっしりかまえる大きな山のイメージ。安定感と信頼感はナンバーワン。ちょっとやそっとのことでは動じない、たのもしい存在です。そのぶん、一度決めたら動かない「がんこさ」も山クラス。", children: [
            { head: "No.5 戊辰(つちのえたつ)🐾面倒見のいい黒ひょう", body: "「湖をいだく、スケールの大きな春の山」\n🐾 動物キャラ：面倒見のいい黒ひょう（エネルギー：山岳E+）\n\nふもとに大きな湖をたたえた、春の雄大な山のイメージ。竜(辰)が住むといわれる山だけあって、夢や野心のスケールが大きい人です。どっしりした安定感と包容力があり、まわりから「大物になりそう」と言われるタイプ。目標が大きいほど燃えます。\n\n⭕ いいところ\n大きな夢を持てる器と、それを支えるどっしり感。\n\n⚠️ 気をつけたいこと\nマイペースで、動き出すまでが遅め。小さな一歩から始めるとエンジンがかかるよ。" },
            { head: "No.15 戊寅(つちのえとら)🐾どっしりとした猿", body: "「若葉がしげる、エネルギーいっぱいの春山」\n🐾 動物キャラ：どっしりとした猿（エネルギー：山岳E+）\n\n春、木々がぐんぐん育つ若い山のイメージ。山なのにじっとしていない、行動力のあるタイプです。度胸があり、新しいことにも「よし、やってみよう!」と踏み出せます。面倒見がよく、後輩や年下から「たよれる先輩」としたわれる親分肌です。\n\n⭕ いいところ\n度胸と行動力、そして面倒見のよさ。開拓者の素質あり。\n\n⚠️ 気をつけたいこと\nよかれと思って強引に引っぱりすぎることも。ときにはみんなの意見を聞いてから進もう。" },
            { head: "No.25 戊子(つちのえね)🐾穏やかな狼", body: "「ふもとに清流が流れる、めぐみの山」\n🐾 動物キャラ：穏やかな狼（エネルギー：山岳E+）\n\n山のふもとに、きれいな川が流れているイメージ。見た目はどっしり落ち着いているのに、心の中には川のように豊かな感情やアイデアが流れている人です。人あたりがやわらかく、こまやかな気くばりもできるので、「見た目よりずっと親しみやすいね」と言われるタイプ。\n\n⭕ いいところ\n安定感とやさしさの両立。信頼されつつ愛される人。\n\n⚠️ 気をつけたいこと\n外と内のギャップで、本心が伝わりにくいことも。気持ちは言葉でも伝えてみよう。" },
            { head: "No.35 戊戌(つちのえいぬ)🐾頼られると嬉しいひつじ", body: "「びくともしない、秋の岩山」\n🐾 動物キャラ：頼られると嬉しいひつじ（エネルギー：山岳E+）\n\n秋空の下にそびえる、岩のようにかたい山のイメージ。戊グループの中でも特に意志が強く、一度「こう」と決めたら絶対にゆずらない信念の人です。誠実でうそがつけず、コツコツひとつの道をきわめる職人タイプ。時間はかかっても、最後には必ず信頼という宝物を手にします。\n\n⭕ いいところ\nゆるがない信念と誠実さ。「あの人が言うなら」と信じてもらえる。\n\n⚠️ 気をつけたいこと\nがんこさはグループ内No.1級。「変わること」も強さのひとつだと覚えておこう。" },
            { head: "No.45 戊申(つちのえさる)🐾サービス精神旺盛な子守熊", body: "「鉱石がねむる、たからものの山」\n🐾 動物キャラ：サービス精神旺盛な子守熊（エネルギー：山岳E+）\n\n金属の鉱石(こうせき)がたくさんねむっている山のイメージ。どっしりした見た目の中に、キラリと光る才能をいくつもかくし持っています。頭の回転が速く、手先も器用で、なんでもそつなくこなせるタイプ。ユーモアもあって、話していて楽しい人です。\n\n⭕ いいところ\n多才さと要領のよさ。安定感があるのに柔軟。\n\n⚠️ 気をつけたいこと\n器用貧乏になりがち。「どれを一番みがくか」を決めると、才能が宝石になるよ。" },
            { head: "No.55 戊午(つちのえうま)🐾パワフルな虎", body: "「マグマを秘めた、真夏の火山」\n🐾 動物キャラ：パワフルな虎（エネルギー：山岳E+）\n\n真夏の太陽に照らされた火山のイメージ。ふだんはどっしり落ち着いているのに、内側には熱いマグマのような情熱をたくわえています。ここぞという場面での爆発力とリーダーシップはすごいものがあり、みんなの先頭に立って大きなことを成しとげられる人です。\n\n⭕ いいところ\n安定感×情熱のハイブリッド。勝負どころで頼りになる。\n\n⚠️ 気をつけたいこと\n怒りやがまんをため込むと大噴火に。日ごろから少しずつガス抜きしよう。" },
        ] },
        { head: "🌾 己(つちのと)グループ — 畑（No.6・16・26・36・46・56）", body: "野菜や花を育てる、栄養たっぷりの畑のイメージ。人を育てたり支えたりするのが得意な、めんどう見のいいタイプ。知識をどんどん吸収してたくわえる「学びの土」でもあります。", children: [
            { head: "No.6 己巳(つちのとみ)🐾愛情あふれる虎", body: "「初夏の日ざしをたっぷりあびた、栄養満点の畑」\n🐾 動物キャラ：愛情あふれる虎（エネルギー：大地E-）\n\n初夏の太陽に照らされて、ほかほかにあたたまった畑のイメージ。学ぶこと・知ることが大好きで、知識をぐんぐん吸収して自分の力に変えていける人です。おだやかに見えて、心の中には「負けたくない」という向上心がしっかりあります。努力が実りやすい、恵まれた畑です。\n\n⭕ いいところ\n学ぶ力と向上心。積み上げた知識がそのまま武器になる。\n\n⚠️ 気をつけたいこと\n実はプライドが高め。「知らない」「教えて」と言える素直さも育てよう。" },
            { head: "No.16 己卯(つちのとう)🐾コアラの中の子守熊", body: "「草花を咲かせる、春のやさしい花だん」\n🐾 動物キャラ：コアラの中の子守熊（エネルギー：大地E-）\n\n色とりどりの草花が咲く、春の花だんのイメージ。自分が目立つより、人を輝かせることに喜びを感じるサポートの達人です。ひかえめでやさしく、そっと気をくばれるので、友だちから「いてくれて助かる」と感謝される存在。聞き上手でもあります。\n\n⭕ いいところ\n支える力と気くばり。チームに絶対必要な縁の下の力持ち。\n\n⚠️ 気をつけたいこと\n人に尽くしすぎて自分があとまわしに。自分の畑にも水をあげてね。" },
            { head: "No.26 己丑(つちのとうし)🐾粘り強いひつじ", body: "「雪の下で春を待つ、しんぼう強い畑」\n🐾 動物キャラ：粘り強いひつじ（エネルギー：大地E-）\n\n冬の間、雪の下でじっと春を待つ畑のイメージ。すぐに芽が出なくてもあせらず、コツコツ準備を続けられる努力の人です。まじめで堅実、約束やルールをきちんと守るタイプ。時間をかけて信頼を積み上げ、あとになるほど評価されていきます。\n\n⭕ いいところ\n忍耐力と堅実さ。「継続は力なり」を体現できる人。\n\n⚠️ 気をつけたいこと\n慎重すぎてチャンスを見送りがち。ときには「えいっ」と飛びこむ勇気も。" },
            { head: "No.36 己亥(つちのとい)🐾好感の持たれる狼", body: "「水をたっぷりふくんだ、しっとり畑」\n🐾 動物キャラ：好感の持たれる狼（エネルギー：大地E-）\n\n冬の雨をたっぷり吸いこんだ、しっとりやわらかい畑のイメージ。頭がやわらかく、人の話や新しい考えをすなおに取り入れられる人です。人づきあいの幅が広く、気づけばいろんなグループに友だちがいるタイプ。おだやかで、争いごとをうまくまるくおさめられます。\n\n⭕ いいところ\n柔軟さと人脈の広さ。だれとでもつながれる調整役。\n\n⚠️ 気をつけたいこと\n水を吸いすぎると畑がゆるむように、人に合わせすぎて疲れることも。休む時間を大切に。" },
            { head: "No.46 己酉(つちのととり)🐾守りの猿", body: "「作物がたわわに実る、収穫の秋の畑」\n🐾 動物キャラ：守りの猿（エネルギー：大地E-）\n\n実りの秋をむかえた、豊かな畑のイメージ。実務能力が高く、やるべきことをテキパキ片づけられるしっかり者です。社交的で愛きょうもあり、大人からも同級生からも好かれるタイプ。「ちゃんとしてるのに親しみやすい」といういいとこ取りの人です。\n\n⭕ いいところ\n実行力と愛される力。任された仕事を確実に実らせる。\n\n⚠️ 気をつけたいこと\nまわりの評価を気にしすぎるとブレやすい。自分の「実り」に自信を持って。" },
            { head: "No.56 己未(つちのとひつじ)🐾気取らない黒ひょう", body: "「真夏の日照りにたえる、責任感の畑」\n🐾 動物キャラ：気取らない黒ひょう（エネルギー：大地E-）\n\n真夏のかわいた大地で、それでも作物を育てつづける畑のイメージ。責任感がとても強く、任されたことは何があってもやりとげる人です。家族や仲間への思いが深く、みんなのためなら多少の無理もいとわないがんばり屋。苦労した分だけ、人の痛みがわかる深いやさしさが育ちます。\n\n⭕ いいところ\n責任感と面倒見のよさ。困難の中でも人を育てられる。\n\n⚠️ 気をつけたいこと\nひとりで背負いこみがち。畑にも雨が必要なように、人にたよることも忘れずに。" },
        ] },
        { head: "⚔️ 庚(かのえ)グループ — 刀・鉄（No.7・17・27・37・47・57）", body: "鍛えれば鍛えるほど強く、鋭くなる刀や鉄のイメージ。決断力と行動力にすぐれ、ものごとをスパッと割り切れるタイプ。試練や努力が、そのままこの人の「切れ味」になります。", children: [
            { head: "No.7 庚午(かのえうま)🐾全力疾走するチータ", body: "「炎の中で鍛えられる、真っ赤な鉄」\n🐾 動物キャラ：全力疾走するチータ（エネルギー：鉱脈M+）\n\n炉(ろ)の炎の中で真っ赤に熱され、たたかれて強くなっていく鉄のイメージ。情熱的で行動が早く、「思い立ったが吉日」を地で行くタイプです。明るく華があり、勝負ごとになると目の色が変わる負けず嫌い。もまれるほど、みるみる成長していきます。\n\n⭕ いいところ\n情熱とスピード。きたえられるほど強くなる成長力。\n\n⚠️ 気をつけたいこと\n熱くなりすぎて短気になることも。カッとしたら10秒数えてから話そう。" },
            { head: "No.17 庚辰(かのえたつ)🐾強い意志持ったこじか", body: "「まだ磨かれる前の、伝説の大剣」\n🐾 動物キャラ：強い意志持ったこじか（エネルギー：鉱脈M+）\n\n土の中からほり出されたばかりの、大きな剣のイメージ。磨けばとんでもない切れ味になる、大きな可能性を秘めた人です。野心とねばり強さがあり、目標のためなら長い下積みにもたえられます。ふつうの人が尻込みする大きな挑戦ほど、やる気が出るタイプ。\n\n⭕ いいところ\nスケールの大きな野心と、あきらめないタフさ。\n\n⚠️ 気をつけたいこと\n自分の力を信じるあまり、強引になったり人の助言を聞き流したりしがち。仲間の声は宝物だよ。" },
            { head: "No.27 庚寅(かのえとら)🐾波乱に満ちたペガサス", body: "「森を切りひらく、開拓者のオノ」\n🐾 動物キャラ：波乱に満ちたペガサス（エネルギー：鉱脈M+）\n\nだれも入ったことのない森を、ざくざく切りひらいていくオノのイメージ。行動力と度胸があり、「だれもやってないなら自分がやる!」という開拓者精神の持ち主です。決断が早く、リーダーとしてみんなの先頭を歩けるタイプ。新しい環境ほど燃えます。\n\n⭕ いいところ\n道なき道を進む勇気。ためらわない決断力。\n\n⚠️ 気をつけたいこと\n勢いあまって突っ走り、まわりが置いてけぼりに。ときどき後ろをふり返ろう。" },
            { head: "No.37 庚子(かのえね)🐾まっしぐらに突き進むゾウ", body: "「清らかな水で研がれた、切れ味するどい刀」\n🐾 動物キャラ：まっしぐらに突き進むゾウ（エネルギー：鉱脈M+）\n\n冷たく澄んだ水でていねいに研(と)がれた刀のイメージ。頭の切れ味がするどく、ものごとを筋道立てて考える分析派です。感情に流されず冷静に判断できるので、みんなが混乱しているときほど頼りになります。クールに見えて、実は仲間思いのあたたかさも。\n\n⭕ いいところ\n論理的な頭脳と冷静さ。むずかしい問題ほど力を発揮。\n\n⚠️ 気をつけたいこと\n正論がするどすぎて、言葉で人を切ってしまうことも。伝え方にひとさじのやさしさを。" },
            { head: "No.47 庚戌(かのえいぬ)🐾人間味溢れるたぬき", body: "「主君を守りぬく、義理がたい武士の刀」\n🐾 動物キャラ：人間味溢れるたぬき（エネルギー：鉱脈M+）\n\n腰にさした刀で仲間を守る、武士のイメージ。義理と人情に厚く、「仲間を裏切らない」を何より大事にする人です。責任感が強く、地味な役割でも文句を言わずやりぬきます。かざらない性格で、つき合いが長くなるほど良さがわかるスルメタイプ。\n\n⭕ いいところ\n忠実さと責任感。仲間のためなら本気を出せる。\n\n⚠️ 気をつけたいこと\n考え方がかたく、融通がきかないことも。「そういうやり方もあるんだ」と一度受け止めてみよう。" },
            { head: "No.57 庚申(かのえさる)🐾感情的なライオン", body: "「一瞬で勝負を決める、名刀そのもの」\n🐾 動物キャラ：感情的なライオン（エネルギー：鉱脈M+）\n\n研ぎすまされた名刀のイメージ。庚グループの中でいちばん切れ味がするどい干支です。判断も行動もスピーディーで、むだなことが大きらいな合理派。運動神経や反射神経にすぐれる人も多く、勝負どころでの集中力は別格です。さっぱりした性格で、引きずらないのも魅力。\n\n⭕ いいところ\n決断力・スピード・キレ。ここぞの場面で最強。\n\n⚠️ 気をつけたいこと\nストレートすぎる物言いで、知らぬ間に人を傷つけていることも。切れ味は言葉にはほどほどに。" },
        ] },
        { head: "💎 辛(かのと)グループ — 宝石（No.8・18・28・38・48・58）", body: "磨かれてこそ輝く宝石のイメージ。繊細で美意識が高く、プライドはひそかに高め。苦労や努力という「研磨」を経るほど、だれにもまねできない輝きを放つタイプです。", children: [
            { head: "No.8 辛未(かのとひつじ)🐾磨き上げられたたぬき", body: "「夏の大地にねむる、意志の強い原石」\n🐾 動物キャラ：磨き上げられたたぬき（エネルギー：宝石M-）\n\n夏の乾いた土の中で、静かに出番を待つ原石のイメージ。物腰はやわらかいのに、心の中には「絶対にこうしたい」という強いこだわりを持っています。ねばり強く、一度みがくと決めた自分の才能はとことんみがき上げる人。ギャップのある芯の強さが魅力です。\n\n⭕ いいところ\nやわらかさの中の強い意志。こだわりを形にできる。\n\n⚠️ 気をつけたいこと\nこだわりが強すぎると、ゆずれなくなって衝突も。「どうでもいいこと」はゆずるが勝ち。" },
            { head: "No.18 辛巳(かのとみ)🐾デリケートなゾウ", body: "「初夏の光をあびて、まばゆく輝くジュエリー」\n🐾 動物キャラ：デリケートなゾウ（エネルギー：宝石M-）\n\n初夏の強い日ざしに照らされて、キラッと光る宝石のイメージ。頭の回転が速く、直感もするどい、華やかな人です。センスがよく、ファッションでも作品でも「なんかおしゃれ」と一目置かれます。負けず嫌いで、注目されるほど実力を発揮するスター気質。\n\n⭕ いいところ\nひらめき・センス・華やかさの三拍子。本番に強い。\n\n⚠️ 気をつけたいこと\nプライドが高く、失敗を見られるのが苦手。「失敗も研磨のうち」と考えると無敵に。" },
            { head: "No.28 辛卯(かのとう)🐾優雅なペガサス", body: "「春の草原にきらめく、かれんなアクセサリー」\n🐾 動物キャラ：優雅なペガサス（エネルギー：宝石M-）\n\n春の草原の上で、朝つゆといっしょにきらめく宝石のイメージ。おしゃれで社交的、ふんわりした雰囲気で人を引きつけます。じつは観察力がするどく、人の気持ちの変化によく気づくタイプ。やさしい見た目とはうらはらに、目標に向かうしたたかさもちゃんと持っています。\n\n⭕ いいところ\n愛されキャラと観察力。人の輪の中で輝ける。\n\n⚠️ 気をつけたいこと\n繊細で、ちょっとした一言を引きずりがち。気にしすぎたら「ま、いっか」と声に出してみよう。" },
            { head: "No.38 辛丑(かのとうし)🐾華やかなこじか", body: "「冬の土の中でみがかれるのを待つ、努力の原石」\n🐾 動物キャラ：華やかなこじか（エネルギー：宝石M-）\n\n冬の冷たい土の中で、じっと自分をみがきつづける原石のイメージ。人知れずコツコツ努力できる、本物の努力家です。口数は少なめでも、内側には熱い向上心と負けん気をかくし持っています。時間をかけてみがいた実力は、やがてだれの目にも明らかな輝きに。\n\n⭕ いいところ\nかくれた努力を続ける力。逆境に負けないねばり。\n\n⚠️ 気をつけたいこと\nがまん強すぎて、つらさを表に出せないことも。信頼できる人には弱音を見せて大丈夫。" },
            { head: "No.48 辛亥(かのとい)🐾品格のあるチータ", body: "「清流で洗われて、透きとおるように輝く宝石」\n🐾 動物キャラ：品格のあるチータ（エネルギー：宝石M-）\n\nきれいな水で洗われて、くもりなく輝く宝石のイメージ。純粋で正義感が強く、うそやごまかしが大きらいな人です。知的で発想がユニークなので、「変わってるけど天才っぽい」と言われることも。理想が高く、本物・一流のものに強くひかれます。\n\n⭕ いいところ\n純粋さと知性。くもりのない目で本質を見ぬける。\n\n⚠️ 気をつけたいこと\n理想が高すぎて、現実や自分にダメ出ししがち。70点でもハナマルをあげよう。" },
            { head: "No.58 辛酉(かのととり)🐾傷つきやすいライオン", body: "「熟練の職人がみがき上げた、完成された宝石」\n🐾 動物キャラ：傷つきやすいライオン（エネルギー：宝石M-）\n\nプロの手で完璧にカットされた宝石のイメージ。辛グループの中でいちばん輝きがするどい干支です。美意識と完璧主義で、中途半端な仕上がりにはガマンできないタイプ。観察も分析もするどく、細部までこだわった作品や成果はまさに一級品です。\n\n⭕ いいところ\n完璧を目指せるプロ意識。仕上がりの質はだれにも負けない。\n\n⚠️ 気をつけたいこと\n自分にも人にも採点がきびしくなりがち。人のあらより、いいところ探しを。" },
        ] },
        { head: "🌊 壬(みずのえ)グループ — 海（No.9・19・29・39・49・59）", body: "大きく自由に流れる海や大河のイメージ。発想がのびのびしていて、細かいことにこだわらないスケールの大きさが魅力。どんなものも受け入れる包容力と、じっとしていられない自由な心を持っています。", children: [
            { head: "No.9 壬申(みずのえさる)🐾大きな志を持った猿", body: "「岩の間からわき出す、勢いのある源流」\n🐾 動物キャラ：大きな志を持った猿（エネルギー：海洋W+）\n\n岩のすき間から勢いよくわき出して、川になっていく水源のイメージ。頭の回転がとても速く、次から次へとアイデアがわいてくる人です。先を読む力があり、「気づいたらもう始めてる」フットワークの軽さも自慢。新しいもの好きで、時代の先頭を走れるタイプです。\n\n⭕ いいところ\nひらめきの泉と先見の明。スタートの速さはピカイチ。\n\n⚠️ 気をつけたいこと\n興味がわいては流れていくので、飽きっぽく見られがち。「続けたら勝ち」の場面を見きわめて。" },
            { head: "No.19 壬午(みずのえうま)🐾放浪の狼", body: "「太陽にきらめく、夏のにぎやかな海」\n🐾 動物キャラ：放浪の狼（エネルギー：海洋W+）\n\n真夏の太陽の下、キラキラ光るにぎやかな海のイメージ。明るく社交的で、初対面の人ともすぐ仲よくなれる人気者です。水の冷静さと夏の情熱をあわせ持ち、ノリがいいのに引き際もわかっている、バランス感覚の持ち主。恋愛や友情にもまっすぐです。\n\n⭕ いいところ\n社交力と明るさ。情熱と冷静のバランスがいい。\n\n⚠️ 気をつけたいこと\n海の天気のように気分が変わりやすい一面も。気分が落ちた日は無理せず休もう。" },
            { head: "No.29 壬辰(みずのえたつ)🐾チャレンジ精神旺盛なひつじ", body: "「竜がひそむ、底知れない大きな湖」\n🐾 動物キャラ：チャレンジ精神旺盛なひつじ（エネルギー：海洋W+）\n\n竜が住むといわれる、深く大きな湖のイメージ。ふだんは静かでも、心の中にはとほうもなく大きな夢と情熱をひそませています。ドラマチックな人生を歩む人が多いといわれ、ピンチをチャンスに変える底力は60干支トップクラス。良くも悪くもスケールが大きい人です。\n\n⭕ いいところ\n大きな夢と勝負強さ。どん底からはい上がる底力。\n\n⚠️ 気をつけたいこと\n思いこむと極端に走りがち。ときどき水面から顔を出して、まわりの景色も見よう。" },
            { head: "No.39 壬寅(みずのえとら)🐾夢とロマンの子守熊", body: "「春の若木を育てる、めぐみの大河」\n🐾 動物キャラ：夢とロマンの子守熊（エネルギー：海洋W+）\n\n春、岸辺の木々に水をあたえながら流れる大きな川のイメージ。自分の力で人や仲間を育て、応援することに喜びを感じるタイプです。行動力とやさしさをあわせ持ち、たのまれると断れないお人よしな一面も。この人のまわりでは、人も計画もすくすく育ちます。\n\n⭕ いいところ\n人を育て、応援する力。行動力のあるやさしさ。\n\n⚠️ 気をつけたいこと\n世話を焼きすぎて自分の時間がなくなりがち。自分の夢にも水をあげてね。" },
            { head: "No.49 壬子(みずのえね)🐾ゆったりとした悠然の虎", body: "「見わたすかぎり広がる、真冬の大海原」\n🐾 動物キャラ：ゆったりとした悠然の虎（エネルギー：海洋W+）\n\n真冬の、どこまでも広がる大海原のイメージ。壬グループの中でいちばん水のパワーが強い干支です。自由を愛し、だれかに命令されたり型にはめられたりするのが大の苦手。そのぶん発想は天才的で、だれも思いつかないアイデアで人をあっと言わせます。度胸も一級品です。\n\n⭕ いいところ\n自由な発想と大胆さ。スケールの大きな才能の持ち主。\n\n⚠️ 気をつけたいこと\n自由すぎて「マイペースな人」と思われることも。ルールを守るところは守るとより輝ける。" },
            { head: "No.59 壬戌(みずのえいぬ)🐾束縛を嫌う黒ひょう", body: "「秋の山にいだかれた、静かで深い湖」\n🐾 動物キャラ：束縛を嫌う黒ひょう（エネルギー：海洋W+）\n\n秋の山にかこまれた、静かで深い湖のイメージ。落ち着きと度量があり、人の秘密や悩みをどっしり受け止められる人です。努力を人に見せないタイプで、こっそり練習してさらっと成果を出す「かくれ努力家」。年上からも年下からも自然と信頼を集めます。\n\n⭕ いいところ\n深い包容力とかくれた努力。秘密を守れる信頼の人。\n\n⚠️ 気をつけたいこと\nなんでも自分の中にしまいこみがち。たまには湖の水を流すように、気持ちを外に出そう。" },
        ] },
        { head: "☔ 癸(みずのと)グループ — 雨（No.10・20・30・40・50・60）", body: "大地にしみこみ、命を育てる雨や湧き水のイメージ。10種類の干のいちばん最後で、やさしさと知性を静かにたくわえたタイプ。派手さはなくても、雨がないと花が咲かないように、なくてはならない存在です。", children: [
            { head: "No.10 癸酉(みずのととり)🐾母性豊かな子守熊", body: "「秋の空から降る、澄みきった雨」\n🐾 動物キャラ：母性豊かな子守熊（エネルギー：雨露W-）\n\nよく晴れた秋の空から降る、透明で冷たい雨のイメージ。感性がするどく、ものごとの本質をスッと見ぬく力を持っています。頭脳明晰(めいせき)で分析が得意、むだのない美しさを好むタイプ。純粋な心の持ち主で、うそやごまかしにはすぐ気づいてしまいます。\n\n⭕ いいところ\nするどい感性と分析力。ごまかしのない澄んだ心。\n\n⚠️ 気をつけたいこと\n細かいことが気になって神経質になりがち。「気にしない練習」も才能のうち。" },
            { head: "No.20 癸未(みずのとひつじ)🐾物静かなひつじ", body: "「ひでりの大地にそそぐ、めぐみの雨」\n🐾 動物キャラ：物静かなひつじ（エネルギー：雨露W-）\n\n夏のかわききった大地に、しっとり降りそそぐ雨のイメージ。困っている人のところへ自然と足が向く、献身的なやさしさの持ち主です。がまん強く、コツコツ積み重ねる努力も得意。この人の支えで救われた、という人がまわりにたくさんいるはずです。\n\n⭕ いいところ\n人をうるおす献身と忍耐力。困った人を放っておけない心。\n\n⚠️ 気をつけたいこと\n人のためにがんばりすぎて、自分がカラカラにかわいてしまうことも。自分にも雨を降らせよう。" },
            { head: "No.30 癸巳(みずのとみ)🐾順応性のある狼", body: "「初夏の空にかかる、雨上がりの虹」\n🐾 動物キャラ：順応性のある狼（エネルギー：雨露W-）\n\n初夏、雨と太陽が出会って虹がかかるイメージ。明るさと知性をあわせ持つ、めずらしいタイプです。勘がするどく、「なんとなくこっち」という直感がよく当たります。人なつっこくてかわいがられ上手。ピンチのあとに必ずチャンス(虹)がやってくる、強運の持ち主ともいわれます。\n\n⭕ いいところ\n直感力と愛されキャラ。ピンチをチャンスに変える運。\n\n⚠️ 気をつけたいこと\n気分やがりで移り気なところも。「なんとなく」に、ひと呼吸の確認をプラスしよう。" },
            { head: "No.40 癸卯(みずのとう)🐾尽くす猿", body: "「春の若葉をやさしくうるおす、ぬか雨」\n🐾 動物キャラ：尽くす猿（エネルギー：雨露W-）\n\n春、芽吹いたばかりの若葉にそっと降る、こまかい雨のイメージ。おだやかで争いがきらいな、いやし系の代表です。おしつけがましくないやさしさで、いるだけでその場の空気がやわらぎます。人望があつく、「あの人がいるとうまくいく」と言われる潤滑油タイプ。\n\n⭕ いいところ\nいやしの力と人望。場をなごませ、人を育てるやさしさ。\n\n⚠️ 気をつけたいこと\nおだやかすぎて、言いたいことをのみこみがち。NOと言う勇気も少しずつ育てよう。" },
            { head: "No.50 癸丑(みずのとうし)🐾落ち込みの激しい黒ひょう", body: "「冬の大地にしみこむ、冷たくも強い雨」\n🐾 動物キャラ：落ち込みの激しい黒ひょう（エネルギー：雨露W-）\n\n真冬の大地に降る、冷たい雨や雪のイメージ。派手さはまったくないのに、内側には燃えるような向上心をかくし持つ「静かな闘士」です。逆境に強く、人が投げ出すような場面でも黙々と続けられます。長い時間をかけて、だれよりも深いところまでしみこんでいく人です。\n\n⭕ いいところ\n逆境でこそ光るねばり強さと静かな闘志。\n\n⚠️ 気をつけたいこと\nがんこで、つらくても顔に出さなすぎるところが。がんばりはもっとアピールしていいんだよ。" },
            { head: "No.60 癸亥(みずのとい)🐾慈悲深い虎", body: "「すべての川が海へ帰る、雄大な流れ」\n🐾 動物キャラ：慈悲深い虎（エネルギー：雨露W-）\n\n60干支のいちばん最後、すべての水が集まって海へそそぐイメージ。豊かな想像力と深い直感を持ち、目に見えない流れを感じとる不思議な力があるといわれます。おだやかでやさしいのに、内側のエネルギーはとほうもなく大きい人。ひとつの物語の「最終回」と「次回予告」を同時に持つ、スケールの大きな干支です。\n\n⭕ いいところ\n底知れない想像力と直感。静かな中の大きなパワー。\n\n⚠️ 気をつけたいこと\n夢の世界にひたりすぎて、現実があとまわしになることも。夢は「予定」に変えると叶いやすい。" },
        ] },
      ]
    },
    {
      icon: "⭐", menu: "十二運と12動物", title: "十二運 ── 運の強さ・エネルギーの形と12動物",
      intro: "十二運はエネルギーを「人の一生」にたとえた12ステージ。このアプリの本質・表面・意思・時柱に出てくる12動物は、この十二運と1対1で対応しています。",
      items: [
        { type: "info", head: "十二運ってなに？（動物との対応つき）", body: "十二運は、その干支が持つエネルギーを「人の一生」にたとえたものです。生まれる前(胎・養)→誕生(長生)→思春期(沐浴)→成人(冠帯)→働き盛り(建禄)→頂点(帝旺)→引退(衰)→静かな時間(病・死)→蔵入り(墓)→無に還る(絶)…という12ステージ。「死」「病」「絶」などこわい名前もありますが、悪い意味ではなく「エネルギーの形」を表すだけなので安心してください。\n\nそして十二運は、どの柱にあるかで意味する場所が変わります。\n\n🧡日柱にあるとき=本質:その人のいちばん芯にある性格\n\n   💬月柱にあるとき=表面:まわりから見えている印象・ふるまい\n\n   🧭年柱にあるとき=意思:ものごとの考え方・決め方のクセ\n\n   🌠時柱にあるとき=希望:夢や将来への向かい方\n\nたとえば「本質は帝旺で王様なのに、表面は衰でひかえめ」のように、柱ごとにちがう十二運を持つのがふつう。その組み合わせが「外と内のギャップ」の正体です。\n\n🐾 十二運と動物の対応（このアプリの本質・表面・意思・時柱の動物はここから来ています）：\n長生＝猿（地球グループ）\n沐浴＝チータ（太陽グループ）\n冠帯＝黒ひょう（月グループ）\n建禄＝ライオン（太陽グループ）\n帝旺＝虎（地球グループ）\n衰＝たぬき（月グループ）\n病＝子守熊（地球グループ）\n死＝ゾウ（太陽グループ）\n墓＝ひつじ（月グループ）\n絶＝ペガサス（太陽グループ）\n胎＝狼（地球グループ）\n養＝こじか（月グループ）" },
        { type: "info", head: "🌗 4分類ってなに？", body: "12動物は、性質の近さで「月・地球・太陽」の3つに分けられます（診断結果の本質・表面・意思に出てくるグループ表示はこれです）。\n\nそのうち「月グループ」をさらに【新月】と【満月】に分けたものが4分類です。同じ月でも、身内の中で安心したい新月と、みんなの輪の中で輝きたい満月では、ふるまいがかなり違います。\n\n下の4つを開くと、それぞれの「価値観と行動パターン」「人付き合いのコツと弱点」「十二運とのつながり」がわかります。" },
        { head: "🌑 新月グループ ── こじか（養）・たぬき（衰）", body: "【価値観と行動パターン】\n4つの中でいちばん「安心」を大事にするチームです。行動の基準は「この人といてほんとうに大丈夫か」。だから新しい場所や初対面の人の前では、まずじっと様子を見ます。教室で例えると、4月のクラス替え直後はほとんどしゃべらないのに、夏休み前には仲のいい子の前でだけ別人みたいによくしゃべる——あれが新月です。人見知りは「感じが悪い」のではなく、心のセキュリティが高いだけ。そのかわり、一度「この人は安全」と認定した相手への信頼は、4グループ中でいちばん深くて長持ちします。\n\n【人付き合いのコツと弱点】\n人間関係では「そばにいること」自体が愛情表現。派手なサプライズより、毎日おなじメンバーとおなじ場所でごはんを食べるほうが幸せです。争いごとが本当に苦手で、ケンカになりそうだと自分が折れて丸くおさめます。ただしこれが弱点にもなっていて、NOと言えずにがまんをため込み、限界がくると突然ぷつんと連絡を絶ったり、殻にこもったりします。新月の子が静かに離れていくときは、怒っているのではなく「安心が壊れた」とき。まわりの人は、責めるより「味方だよ」と伝えるのが正解です。\n\n【十二運とのつながり】\n十二運で見ると、養は「大切に育てられる赤ちゃん」、衰は「頂点を過ぎて静かに暮らすご隠居さん」。人生の始まりと終わり、どちらも「だれかに見守られる・穏やかに過ごす」という静のエネルギーです。つまり新月は、自分がぐいぐい進むより、信頼できる人のそばで力を発揮するタイプ。応援してくれる人、ホッとできる居場所があるかどうかで、パフォーマンスが2倍にも半分にもなります。伸ばし方のコツは「急かさない・比べない・裏切らない」の3つです。\n\n【それぞれの動物】\n🐾 こじか（養）：警戒心が強いくせに、なつくと甘えん坊で「かまってほしい」オーラ全開。純粋で駆け引きができない正直者。\n🐾 たぬき（衰）：実年齢より落ち着いていて、場をなごませる天然の愛されキャラ。義理人情に厚く、目上の人にとてもかわいがられます。" },
        { head: "🌕 満月グループ ── 黒ひょう（冠帯）・ひつじ（墓）", body: "【価値観と行動パターン】\n同じ月グループでも、満月は「人の輪の中で輝く」チームです。行動の基準は「人にどう見られるか」と「人の役に立てているか」。新月が身内だけに心を開くのに対して、満月はもっと広く、クラス全体・グループ全体を見ています。だれかが元気ないとすぐ気づいて声をかけるし、頼まれごとは「いいよ」と引き受ける。気配りのレーダーの広さは4グループでNo.1です。そのぶん「かっこ悪いところを見られたくない」「仲間はずれにされたくない」という気持ちも人一倍強く、外ではきちんとした自分を保とうとがんばります。\n\n【人付き合いのコツと弱点】\nだから満月の疲れ方は独特です。みんなの前では明るくスマートにふるまって、家に帰るとどっと疲れている。がまんや不満を表に出さずに内側へためるので、まわりは「あの子はいつも大丈夫そう」と思いがちですが、実は「ありがとう」「助かったよ」の一言をだれよりも必要としています。満月と付き合うコツは、やってもらったことを当たり前にしないこと。感謝を言葉にしてもらえるかぎり、満月は無限にがんばれます。逆に、努力を無視されたり雑にあつかわれたりすると、静かに深く傷つきます。\n\n【十二運とのつながり】\n十二運で見ると、冠帯は「晴れ着を着て人前に立つ成人式」、墓は「大事なものをしまっておく蔵」。「人の目の中で立派にふるまう」エネルギーと「内側にためこむ」エネルギーの組み合わせです。これがまさに満月の二面性——外向きの華やかさ・きちんと感と、内側の寂しがりで秘密主義な部分——の正体。表の顔だけ見て「しっかりしてるから放っておいて大丈夫」と思わず、ときどき内側の蔵の扉をノックしてあげると、満月はいちばん喜びます。\n\n【それぞれの動物】\n🐾 黒ひょう（冠帯）：おしゃれで新しいもの好き、プライドが高くスマートにふるまう兄貴・姉御肌。ただし傷つきやすさは実は人一倍。\n🐾 ひつじ（墓）：さびしがり屋の世話焼きさんで、みんなの輪の中にいると安心するタイプ。お金も知識も、そして不満もこっそりためこみがちです。" },
        { head: "🌏 地球グループ ── 狼（胎）・猿（長生）・虎（帝旺）・子守熊（病）", body: "【価値観と行動パターン】\n「自分軸」で生きる現実派チームです。行動の基準は「目標に近づくか」「むだがないか」「損か得か」。月グループが「人にどう思われるか」で動くのに対して、地球は「自分が納得できるか」で動きます。他人と比べられるのが大きらいで、「〇〇ちゃんはできるのに」と言われた瞬間にやる気が消えます。逆に、自分で決めた目標に向かうときの集中力と持久力は4グループ最強。マラソンで例えると、まわりのペースに関係なく、自分のラップタイムだけを見て淡々と走りきるタイプです。\n\n【人付き合いのコツと弱点】\n会話にも特徴があります。地球グループは結論から聞きたい人たち。「で、要点は?」が口ぐせで、前置きの長い話や、オチのない話がじわじわストレスになります。ほめられるのは大好きですが、「すごーい!」という中身のないほめ言葉には逆に冷めるので、「この部分のこの工夫がいい」と具体的にほめるのが正解。お金や物、点数、順位など「目に見える結果」がモチベーションになるのも特徴で、ごほうびを設定すると急にがんばれたりします。ドライに見えますが、実は身内と認めた相手にはとても手厚く、頼られると悪い気はしません。\n\n【十二運とのつながり】\n十二運で見ると、胎（まだ形のない可能性）→長生（すくすく成長）→帝旺（王として君臨）→病（ベッドの上の空想家）。命が宿って、育って、頂点に立って、静かに振り返る——つまり「地に足のついた人生の本編」をまるごと担当しているのが地球グループです。だから4匹それぞれ個性はバラバラでも、「自分の人生は自分で組み立てる」という感覚だけは全員共通。まわりにできる応援は、あれこれ口を出すことではなく、目標を決めたら信じて任せることです。\n\n【それぞれの動物】\n🐾 狼（胎）：ひとりの時間が絶対に必要な一匹オオカミ。「人と同じ」がとにかくイヤで、オンリーワンの道を行きます。\n🐾 猿（長生）：要領がよくて憎めない人気者。小さな成功をコツコツ積み、ほめられるとぐんぐん伸びます。\n🐾 虎（帝旺）：悠然とした実力派の親分肌。公平・正義を重んじ、弱い者いじめを許しません。\n🐾 子守熊（病）：のんびりに見えて頭の中は常にシミュレーション中の計画屋。ロマンチストな一面と、安全第一の慎重さが同居しています。" },
        { head: "☀️ 太陽グループ ── チータ（沐浴）・ライオン（建禄）・ゾウ（死）・ペガサス（絶）", body: "【価値観と行動パターン】\n「気分軸」で生きる天才肌チームです。行動の基準は「今、ワクワクするかどうか」。月のように人の顔色は見ないし、地球のように損得も計算しません。直感で「これだ!」と思ったら理屈抜きで動き、気分が乗ったときの爆発力は他の3グループが束になってもかなわないレベル。そのかわり、気分が乗らないときは本当に何もできません。テスト前日に急にやる気が出て一夜漬けで乗り切る、あの波の大きさが太陽です。「ムラがある」のではなく、「波で動くエンジン」を積んでいるのだと理解してあげてください。\n\n【人付き合いのコツと弱点】\n太陽グループのもうひとつの特徴は「大物志向」。細かい作業やコツコツした積み重ね、決まりきったルーティンが苦手で、視線はいつも大きな夢や遠くの目標に向いています。教室のすみの掃除は雑なのに、文化祭の企画になると急に本気を出す、みたいなタイプ。そして4グループ中いちばん「おだてに弱い」のも太陽です。「天才!」「さすが!」と言われるとほんとうに天才級の力を出すので、まわりは細かいミスを指摘するより、まず才能をほめて気分を上げるのが攻略法。逆に、頭ごなしに否定されたり、細かいルールで縛られたりすると、翼をもがれたように輝きを失います。\n\n【十二運とのつながり】\n十二運で見ると、沐浴（ゆれ動く思春期）、建禄（実力で立つ働き盛り）、死（すべてが静止する集中）、絶（無に還って生まれ変わる）。共通するのは、どれも「常識のものさしの外側」にあるエネルギーだということ。変化・実力・極限集中・リセットという、ふつうの人が持てあます強い星ばかりが集まっています。だから太陽グループは、平凡な環境では「変わった人」あつかいされがちですが、自由にやらせてもらえる環境では文字どおり太陽のように輝く。「管理しないで、感動してあげる」のがこのチームとの正しい付き合い方です。\n\n【それぞれの動物】\n🐾 チータ（沐浴）：思い立ったら0.2秒で走り出す瞬発力No.1。新しいこと大好き、そのぶん飽きるのも早い。\n🐾 ライオン（建禄）：実力で頂点に立つ百獣の王。外では完璧で堂々、でも家では意外と甘えん坊というギャップ持ち。\n🐾 ゾウ（死）：太陽グループ唯一の職人肌。ひとつの道をとことん極める努力の人で、実は繊細。\n🐾 ペガサス（絶）：理屈より感性、束縛されると死んじゃうタイプの天才肌で、気分の波も一番大きい人たちです。" },
        { head: "胎(たい)🐾狼 ── 受胎 — 新しい命の芽生え", body: "「可能性のかたまり、はじまりエネルギー」\n🐾 動物：狼（地球グループ）／人生のステージ：受胎 — 新しい命の芽生え\n\n基本的な性質:おなかに新しい命が宿った瞬間のイメージ。まだ何にでもなれる「可能性のかたまり」です。好奇心いっぱいで発想が豊か、フットワークも軽い。そのぶん、まだ形が定まらず迷いやすい星でもあります。\n\n🧡 本質（日柱）にあるとき\nアイデアマンで、なんにでも興味を持つ。人なつっこくてかわいがられる。進路や好みが定まるまで時間がかかることも。\n\n💬 表面（月柱）にあるとき\n実年齢より若々しい印象。新しいこと・立ち上げ・企画ものにかかわると生き生きする。\n\n🧭 意思（年柱）にあるとき\n考え方がやわらかく、いい意味で影響を受けやすい。古いやり方にこだわらず、新しい風を吹きこめる。\n\n🌠 希望（時柱）にあるとき\n夢がたくさんあって、いくつになっても増えていく。晩年まで好奇心が枯れない、若々しい将来。\n\n【ウィークポイント】\nひとりの時間を優先しすぎて「付き合いが悪い」と誤解されやすい。「人と同じ」を嫌うあまり、損な回り道をすることも。\n\n【直すといいポイント】\n「嫌いなんじゃなくて、ひとりの時間が必要なだけ」と一言そえるだけで誤解は激減します。共同作業は時間を区切って参加すると、自分も周りもラクになります。", children: [
          { head: "📗 キーワード・特徴・タブー", body: "🔑 キーワード：独自性／頭で勝負／ユニーク／マイウェイ／オリジナリティ\n🐾 人生ステージのたとえ：胎児　／　別名：オリジナルタイプ\n\n【特徴】\n・一人だけの時間と空間が好き\n・自分しかできないことでNo.1を目指す\n・納得するまで考える\n・すぐメモを取りたがる人が多い\n・初志貫徹の精神\n・時系列の記憶力が高い\n・ペースを乱されるのを嫌う\n・「××流」・自己流を持っている\n・臨機応変の対応は苦手\n・歩くのが苦にならない\n・人まねをしたくない\n・「個性的だね」と言われるとうれしい（✍️「変わってるね」も）\n\n【好きなこと】\n・人まねではなく自分なりに改良を加えること\n・時代を読んで、その目的のために一歩一歩進んでいくこと\n\n【タブー（この人にやってはいけないこと）】\n・この人のする事にケチをつける行為\n・ペースを乱す行動\n・依頼に対して経過報告がない\n\n✍️ 手書きメモより\n・有名人の例：野村監督、船井幸雄、ホリエモン" },
          { head: "🔍 性格を深掘り ── 3つのポイント", body: "「自己流＆マイペースが大好きな自由人」\n\n■ 一匹狼の生き方が好き\n人とは違う「オリジナル」を常に心がけています。まわりとの考えが違って、変わっているととられがちな狼。しかし、本人は「個性的」と考え、そう言われることにむしろ喜びを感じています。\n　◇ こんなことありませんか？\n　・ひとりで行動することが好き\n　・個性を大事にしている\n　・「変わっているね」と言われるのがイヤではない\n\n■ 自己流＆マイペースをくずさない！\n何をやるにも自分の流儀、やり方があってマイペース。また、自分の趣味で固められた空間や、時間が何よりも大切。この大事にしている自分時間がないと生きていけません。\n　◇ こんなことありませんか？\n　・曲げられないこだわりがある\n　・趣味にはとことん打ち込む\n　・単純作業にも独自のやり方を持って熱中できる\n\n■ 相手にうまく真意が伝わらない\n狼は自己流の言葉で話すため、言葉足らずで相手に真意が伝わらず苦労することがあります。また、少ない言葉でズバリ真意を突いて、周囲を驚かせる、なんてこともあるでしょう。\n　◇ こんなことありませんか？\n　・まわりから自分を理解してもらえているのか不安\n　・言った言葉をカン違いしてとらえられてしまう\n　・口数は少ないほうだと思う" },
          { head: "🪞 自己診断と周りからの印象", body: "【自分から見た性格（自己診断）】\n・どんなときも自分流を貫く ── 仕事のやり方からお風呂で体を洗い始める場所まで、どんなときでも独自のこだわりを持つのが好き。\n・趣味のものに囲まれていたい ── こだわりのある趣味のもので部屋はいっぱい。興味のあることには熱心で、どんどん情報も集めたい。\n・「個性的」と言われたい ── まわりとは違っても自分は自分。変わったことも大好き。企画提案なども普通の人とは違う目線から行います。\n・自分のペースが一番大事 ── 独自の考えを持っているがゆえ、マイペースな部分があります。まわりを見て足並みをそろえることも必要。\n・世話焼き＆仕切り屋の一面も ── 認めた人や身内には、特別扱いして尽くす面があります。がんばる部下をフォローして支えてあげることも。\n\n【周りからはこう見えてる（印象診断）】\n・常に新しいものを探している ── 独特の変わったセンスを持っていて、提案する企画はいつも新鮮。刺激を受けることが多いです。\n・ちょっととっつきにくいかも ── ひとりでごはん、ひとりで旅行…。それを本人は楽しんでいる様子で、まわりは少し声をかけにくい印象に。\n・他の人にはない何かを持っている ── マネできない独自性は狼の強みであり、何にもかえられない財産。キラリと光る個性は憧れの的。\n・実は素直で楽天的 ── 困難な状況でも希望を失わず、楽天的に行動していく姿は、周囲の人を勇気づけているかもしれません。\n・わき目もふらずのめり込む ── 情緒が安定しているので、目標に向けてわき目もふらずに行動していける強さを持っています。" },
          { head: "💬 うれしい言葉・NGワード・謝り方", body: "😊 うれしい言葉（ビビッとくる）：独自の世界観を理解して\n「よく知ってるね」「独創的なやり方ですね」で大喜び。ますます仕事にのめり込むでしょう。\n\n⚡ NGワード（カチンとくる）：マイペースを否定しない\n「勝手に進めないで」は意欲低下の原因。「マイペースもほどほどにして」はアウトかもしれません。\n\n🙇 上手な謝り方：誠心誠意の謝罪を\n誠意が伝われば許してくれるはず。観察眼が鋭いため、本気で謝罪しているかどうか見抜きます。\n\n💐 感謝の伝え方：プレゼントで信頼を\n感謝の気持ちはモノであらわして。狼好みのプレゼントを渡せば、これまで以上に信頼関係を深められるかも。\n\n（キャラのひとこと）狼：「自分は自分。個性が大事でしょ」「私の世界観をわかってほしいの」" },
        ] },
        { head: "養(よう)🐾こじか ── 養育 — 大切に育てられる赤ちゃん", body: "「みんなに愛される、ほんわかエネルギー」\n🐾 動物：こじか（月グループ）／人生のステージ：養育 — 大切に育てられる赤ちゃん\n\n基本的な性質:家族みんなに大切に育てられる赤ちゃんのイメージ。おっとりマイペースで、そこにいるだけでかわいがられる「愛され運」の星です。平和主義で、人と人との橋渡しも得意です。\n\n🧡 本質（日柱）にあるとき\nおだやかで憎めない性格。目上にかわいがられ、援助を受けやすい。あとを継ぐ・引き継ぐ役割に縁がある。\n\n💬 表面（月柱）にあるとき\n人あたりがよく、敵を作らない印象。「あの子なら」と応援されて、チャンスをもらいやすい。\n\n🧭 意思（年柱）にあるとき\n争わず、みんなが納得する道を選ぶ考え方。家族や恩人への感謝を判断の軸にする。\n\n🌠 希望（時柱）にあるとき\n夢は「みんなで幸せになること」。晩年は子どもや仲間に恵まれ、大事にされる暗示。\n\n【ウィークポイント】\n甘えたい気持ちと警戒心の二面性で、周りを振り回してしまうことがある。NOと言えず、特定の人に依存しやすい。\n\n【直すといいポイント】\n安心できる人に少しずつ本音を出す練習を。「小さなことを自分で決める」経験を積むと、甘えと自立のバランスが取れてきます。", children: [
          { head: "📗 キーワード・特徴・タブー", body: "🔑 キーワード：信頼／安全性／原理／本物／探究心\n🐾 人生ステージのたとえ：赤ちゃん　／　別名：セキュリティタイプ\n\n【特徴】\n・好奇心旺盛\n・緊張が長く続かない\n・初対面では警戒心が強い\n・大勢の中でも親しい人としか話さない\n・親しくなると大胆になる\n・ついつい一言多くなりがち\n・愛情が確認できないと不安になる\n・駆け引きや裏表のある対応は苦手\n・感情を隠し切れない\n・安心できる環境作りが大切\n・食べ物、飲み物の添加物が気になる\n・人を育てたり教えたりするのが好き\n\n【好きなこと】\n・何がなんでもではなく無理なく自然体でいられること\n・自分が安心できる環境をじっくりと作り上げていくこと\n\n【タブー（この人にやってはいけないこと）】\n・大きな声を出す\n・ジョークと嘘の線引きをしない（✍️区別が分からないから）\n・駆け引きをする\n\n✍️ 手書きメモより\n・怒るとめっちゃ怖い\n・遠出しない" },
          { head: "🔍 性格を深掘り ── 3つのポイント", body: "「人見知りだけど、実は愛情に飢えている」\n\n■ 警戒心が強く人見知りしがち\n警戒心が強く、人に対する興味はありますが、初対面の人と話をするのが苦手。自分をうまく表現できません。でも、相手にわかってほしい、好かれたいという欲求は誰よりも大きいのです。\n　◇ こんなことありませんか？\n　・初対面の人と話すのはかなり緊張する\n　・人間関係でもっと器用になれたら…と思う\n　・自分のことを誤解されるのはイヤ\n\n■ 一度慣れると本性があらわれる\n一度仲よくなったり、打ち解け合える仲間がいると図々しくなったり、ワガママになりがち。ただし、こじかの無邪気なかわいさでまわりの人はなんとなく許してしまう…。そんな愛されキャラです。\n　◇ こんなことありませんか？\n　・「あなたって実は面白いよね」と言われたことがある\n　・仲よくなった人の前ではつい甘えてしまう\n　・狭く深い人づき合いが好き\n\n■ 相手からの愛情を常に求める\n駆け引きや計算の行動が苦手。つき合いが長くなるほど、人柄や思いやりがわかってもらえるようになります。また、相手の好意を常に感じられないと不安になってしまうのも特徴。\n　◇ こんなことありませんか？\n　・駆け引きをするのもされるのも苦手だ\n　・恋人との連絡は毎日欠かさずとりたい\n　・常に気がおけない仲間と一緒にいたい" },
          { head: "🪞 自己診断と周りからの印象", body: "【自分から見た性格（自己診断）】\n・警戒心が強く人見知りしがち ── 初対面の人には特にバリアを張りがち。慣れた友達や場所に居心地のよさを感じるので行動範囲が限られることも。\n・仲よくなると分け隔てない態度 ── 最初のおとなしいイメージから一転。慣れると素直な自分を開放し、誰からもかわいがられる存在に。\n・一定の距離を保ちたい ── 縄張り意識や団結力が強いので、慣れない人とは一定の距離を保ちます。向こうからうまくアプローチしてきてほしいのです。\n・駆け引きや裏表のある行動が苦手 ── 駆け引きをするのもされるのも苦手。純真な心を持っているので、まっすぐに気持ちを伝えてほしいのです。\n・恋愛では受け身の姿勢 ── 恋愛では特に相手からのアプローチ待ち。甘えん坊で、恋人からの連絡がないと心配になってしまいます。\n\n【周りからはこう見えてる（印象診断）】\n・控えめで温厚な印象 ── 初対面の人からは、おとなしく控えめで温厚そうに見えます。周囲の人に安心感を与えているのです。\n・強い意志を隠し持っている ── 控えめな印象とは裏腹に、他人には譲れない芯の強い部分を持っています。実はプライドも高いのです。\n・愛嬌があり笑顔が似合う ── 愛嬌があり、笑顔がかわいい人。どこか放っておけない雰囲気があり、まわりから「守りたい！」と思われます。\n・何ごとにも粘り強く取り組む ── 素直で粘り強い性格のこじかは、仕事も一途にしっかりとこなし、成功をおさめるタイプの人です。\n・縄張り意識や団結力が強い ── 信頼関係が築けた仲間と安心できる場所で一緒にいるのが大好き。それが一番居心地がいいみたい。" },
          { head: "💬 うれしい言葉・NGワード・謝り方", body: "😊 うれしい言葉（ビビッとくる）：いつも気にかけて\n「困ったときは声をかけてね」など、誰かに守られていることがわかると、安心して物事に取り組めます。\n\n⚡ NGワード（カチンとくる）：放任する言葉はダメ\n「ひとりでやってよ」「すべてお任せします」などはダメ。自分の殻に閉じこもってしまうかもしれません。\n\n🙇 上手な謝り方：先に謝ってみて\n本人からアクションを起こすことは少ないようです。悪いと思ったらこじかよりも先に動いて、わだかまりをなくしましょう。\n\n💐 感謝の伝え方：ダイレクトに伝えて\n純真なハートの持ち主なので、人の好意は素直に受け入れます。「感謝しています」「ご親切にありがとう」と伝えて。\n\n（キャラのひとこと）こじか：「警戒心は人一倍。でも構ってほしい」「お気に入りの仲間と平和に過ごしたいの」" },
        ] },
        { head: "長生(ちょうせい)🐾猿 ── 誕生 — すくすく育つ赤ちゃん", body: "「素直にまっすぐ伸びていく、成長のエネルギー」\n🐾 動物：猿（地球グループ）／人生のステージ：誕生 — すくすく育つ赤ちゃん\n\n基本的な性質:生まれたばかりの命が、まわりに愛されながらすくすく育つイメージ。素直で穏やか、人に恵まれ、あせらず着実に伸びていく発展運です。教わったことをぐんぐん吸収し、目上の人にかわいがられます。\n\n🧡 本質（日柱）にあるとき\n芯が素直で誠実。コツコツ成長し、だれからも信頼される「優等生タイプ」。世話好きで、年下のめんどうをよく見る。\n\n💬 表面（月柱）にあるとき\n礼儀正しく感じのいい印象。先生や先輩に引き立てられやすく、勉強や仕事も着実に評価されていく。\n\n🧭 意思（年柱）にあるとき\n考え方が正攻法。ズルい近道より「ちゃんと積み上げる」を選ぶ。親や家の教えを素直に受けつぐ傾向。\n\n🌠 希望（時柱）にあるとき\n夢は一発逆転ではなく、育てて叶えるタイプ。将来は安定していて、歳を重ねるほど良くなっていく。\n\n【ウィークポイント】\n素直な優等生ゆえに冒険が足りず、決められた枠から出ようとしない。褒めてくれる人がいないと伸び悩む。\n\n【直すといいポイント】\nたまには失敗覚悟のチャレンジを。応援・評価してくれる環境を「自分で選ぶ」ことも実力のうちです。", children: [
          { head: "📗 キーワード・特徴・タブー", body: "🔑 キーワード：すぐ使える／即効性／短期的／白黒はっきり／お得\n🐾 人生ステージのたとえ：小学生　／　別名：フィーリングタイプ\n\n【特徴】\n・細かいこと、小さいことに気がつく\n・乗せられると弱い\n・堅苦しい雰囲気に弱い\n・なんでもゲーム感覚で楽しむ\n・じっとしているのは嫌い\n・早とちりや早合点をしがち\n・すぐに結果を出したい\n・ギブ＆テイクの駆け引き\n・気配りしながらムードを盛り上げる\n・フロンティア精神の持ち主\n・手先が器用\n・短期決戦の勝負に強い\n\n【好きなこと】\n・瞬間、瞬間で成果・結果を出せること\n・勝負の駆け引きを楽しめるゲームやスリルのあること\n\n【タブー（この人にやってはいけないこと）】\n・話すときに目線をキョロキョロする\n・目的、指示を明確に出さない（✍️指示必要）\n・この人に優柔不断な態度を見せる" },
          { head: "🔍 性格を深掘り ── 3つのポイント", body: "「おだててほめれば実力発揮！落とし穴には注意」\n\n■ ソツなくこなせてアグレッシブ！\nじっとしていると落ち着かないほどアクティブな性格。なんでも器用にこなせて、複数のことを同時進行できます。ただし、早とちりなどちょっとおっちょこちょいな一面もあります。\n　◇ こんなことありませんか？\n　・休みの日も外に出るなど、アウトドアが好き\n　・まわりから「なんでもできちゃうね」と言われる\n　・たまにドジもするけど、なんだかんだ許してもらえちゃう\n\n■ 猿もおだてりゃ木に登る\nおだてにめちゃめちゃ弱く、ほめられるとなんでもやっちゃうお調子者です。人にほめられたいから、自分でも想像していなかった実力を発揮しちゃうなんてこともあるかもしれません。\n　◇ こんなことありませんか？\n　・よく人からものを頼まれる\n　・人からほめられるのが大好き\n　・うれしいことを言われると、もっとがんばってみたくなる\n\n■ 人を疑わない純粋な心の持ち主\n子どものようにまっすぐで、ピュアなあなた。自然とあたたかな人の輪をつくるでしょう。ただし、人を疑うことが苦手なので、おいしい話や甘い話にコロッとだまされないように注意して！\n　◇ こんなことありませんか？\n　・気になったことはすぐ口に出して言う\n　・正義感が強すぎて言い争うことがある\n　・盛り上げ上手" },
          { head: "🪞 自己診断と周りからの印象", body: "【自分から見た性格（自己診断）】\n・にぎやかでお調子者 ── 人づき合いがよく、まわりを盛り上げるのが大好き。向上心も強いので、いつもバタバタと動き回っています。\n・ボス猿的な存在 ── 小さなことにもよく気づき、周囲をなごやかなムードにするのも上手。まわりの人たちから頼られるでしょう。\n・頭の回転が速く向上心が旺盛 ── 物事の同時進行が得意。また、何ごとも吸収したことを生かして、自分自身を高めていける人です。\n・陽気なキャラで愛嬌がある ── 子どものように素直で活発な性格で、みんなから好かれます。パーティーや飲み会でも輪の中心に。\n・いつまでも純粋無垢 ── 年齢を重ねても、純粋無垢な気持ちを忘れません。たまにドジをして危なっかしいところもあるけどそれもかわいい。ほめてくれればなんでもしちゃう！\n\n【周りからはこう見えてる（印象診断）】\n・誰にでも配慮ができる ── 細かいところまで目を行きわたらせることができる人。だから、気のきく人という印象があります。\n・ベストを尽くすがんばり屋 ── 正義感が強いので、頼まれた仕事は全力を出してがんばります。ほめたりおだてると、さらにパワーアップ。\n・いつも活発で同時進行もOK ── ちょっと落ち着きはないけれど同時進行も得意。時間にムダがなく、すごいと思われています。\n・子どものように無邪気な人 ── その純粋さゆえ、人を疑うことが苦手。うまい話も信じやすく、だまされやすい特徴があります。\n・恋愛ではアピール待ち状態 ── 普段は陽気で楽しい性格ですが、恋になると一気に奥手に。でもそこも放っておけない魅力に。" },
          { head: "💬 うれしい言葉・NGワード・謝り方", body: "😊 うれしい言葉（ビビッとくる）：オリジナル性をほめて\n「誰も思いつかないやり方ですね」と独自性を評価して。「100点の出来ばえだよ」と数字を入れた表現も。\n\n⚡ NGワード（カチンとくる）：親切心をそいではダメ\n「マニュアル通りでいいんだから」「おせっかいはやめてください」はNG。純粋な心を傷つけてしまいます。\n\n🙇 上手な謝り方：謝罪＋ほめ言葉を\n謝罪に加えて「指導してくれるところを尊敬しています」など素直な感謝も伝えれば心を開いてくれそう。\n\n💐 感謝の伝え方：「ありがとう」が一番\n堅苦しい雰囲気は苦手なので、シンプルに表現するのが最も伝わります。お礼の品を渡せば、なおいいでしょう。\n\n（キャラのひとこと）猿：「みんなの雰囲気は壊したくないんだ」「あまり気どらずに素直な対応でよろしくね！」" },
        ] },
        { head: "沐浴(もくよく)🐾チータ ── 産湯・思春期 — ゆれ動くお年ごろ", body: "「変化と好奇心の、そわそわエネルギー」\n🐾 動物：チータ（太陽グループ）／人生のステージ：産湯・思春期 — ゆれ動くお年ごろ\n\n基本的な性質:思春期のように心がゆれ動くイメージ。好奇心旺盛で流行に敏感、センスと色気があります。そのぶん迷いやすく、環境も気持ちも変わりやすいのが特徴。「変化」こそがこの星のガソリンです。\n\n🧡 本質（日柱）にあるとき\n多才で飽きっぽい自由人。旅行や新しいものが大好きで、恋にも心がゆれやすい。感受性が豊かで芸術向き。\n\n💬 表面（月柱）にあるとき\nおしゃれで社交的な印象。環境や所属がよく変わり、「いろんな世界を知ってる人」に見られる。\n\n🧭 意思（年柱）にあるとき\n考えが柔軟でコロコロ変わるが、それは切りかえの早さでもある。早くから親元を離れて自立する暗示も。\n\n🌠 希望（時柱）にあるとき\n夢が次々変わるタイプ。ひとつにしぼるより「変化しつづける将来」が合っている。\n\n【ウィークポイント】\n飽きっぽく、迷いやすい。環境も気持ちも変わりやすく、中途半端が積み重なることがある。\n\n【直すといいポイント】\n「やめる基準」を始める前に決めておくと、飽きが失敗ではなく判断になります。続けたいことは意志ではなく仕組み（習慣・予約）で続けましょう。", children: [
          { head: "📗 キーワード・特徴・タブー", body: "🔑 キーワード：Big／Power／今すぐ／成功／世界的視野\n🐾 人生ステージのたとえ：ティーンエイジャー　／　別名：スピードタイプ\n\n【特徴】\n・成功願望が強い\n・好奇心が極めて強い\n・瞬発力はあるが長続きしない\n・チャレンジ精神旺盛\n・欲しいと思ったらすぐ買う\n・プライドが高い\n・話の飲み込みが早い\n・常に大勢の中心でいたい\n・超プラス思考\n・軽はずみな人の良さがある\n・負けず嫌いで一本気の傾向にある\n・大きな数字には強いが小さな数字には興味がない\n\n【好きなこと】\n・好奇心旺盛になんでもチャレンジすること\n・大きな夢と希望を持って、自分を大きくしていくこと\n\n【タブー（この人にやってはいけないこと）】\n・待たせる\n・ダラダラした態度を取る\n・他人の悪口や文句を言う\n\n✍️ 手書きメモより\n・仕事をするなら大きなことを。" },
          { head: "🔍 性格を深掘り ── 3つのポイント", body: "「積極的＆ポジティブ！ただし、あきらめが早いのが難点」\n\n■ 行動は早いけどあきらめも早い！\n瞬発力のあるチータのように、物事にとりかかる素早さはナンバーワン！ 先々を予測してしまい、ダメそうだとわかると即あきらめてしまいます。その早さも12動物キャラの中で一番です。\n　◇ こんなことありませんか？\n　・思いついたことはすぐに試してみたくなっちゃう\n　・くよくよしている時間がもったいない！\n　・気分が乗らないことは明日に持ち越し\n\n■ ポジティブなチャレンジャー\nポジティブなので傷ついたり落ち込んだりしても、すぐ立ち直ることができます。グチは言いたくないし、聞きたくない。「失敗しちゃうかも!?」という概念もまったくなし。「ネガティブ」の文字は存在しません。\n　◇ こんなことありませんか？\n　・“高嶺の花”にもホレたら果敢にチャレンジ！\n　・目が合うと「自分のこと好きなの？」とすぐにカン違い\n　・いいことをどんどん妄想するのが好き\n\n■ 話を盛って、外面をよく見せようとしがち\n知ったかぶりをしてしまい、自分を大きく見せようとする傾向があります。つい人前でカッコつけようとしてしまいがちです。また、好奇心の強さから新製品に飛びつくのも特徴。\n　◇ こんなことありませんか？\n　・知らないことは早く知りたい！\n　・輪の中心にいるのが好き\n　・新発売のお菓子はすぐに買ってみたくなる" },
          { head: "🪞 自己診断と周りからの印象", body: "【自分から見た性格（自己診断）】\n・とりかかるスピードはナンバーワン！ ── 妄想派のチータキャラ。さまざまなことに興味がわいてきて、それをすぐに実行したくなります。\n・あきらめの早さも一番 ── 「今日はもうダメ…」と思ったら作業を切り上げてしまうところも。スイッチのオンオフもすばやいのです。\n・常にポジティブで前進あるのみ ── チータキャラの辞書に「ネガティブ」の文字はありません。好奇心も強いので、どんどん前に進んでいきます。\n・チャレンジ精神が旺盛 ── 目の前の目標や壁が高ければ高いほど、気合いが入ります。アスリートタイプの人が多いみたい。\n・成功願望が人よりも強い ── 成功したいという気持ちが強いので、小さなことには目もくれず、常に中心人物として活躍したいのです。ネガティブなんて必要ない！\n\n【周りからはこう見えてる（印象診断）】\n・即実行のチャレンジャー ── 頭の回転が速く、思いついたアイデアは即実行！ 狙った獲物には一直線に向かい、逃がしません。\n・ちょっと突っ走りぎみかも ── とりかかりが早いがために、周囲は「本当にできるの？ 大丈夫？」と心配になってしまうことも。\n・フットワークの軽さでは一番 ── 思いついたことは、即座に行動に移さないと気がすみません。早くやらなきゃ意味がない…らしいのです。\n・プラス思考で前向き ── 失敗を恐れず常にプラス思考ですが、落ち込んでいる相手にはその前向きさが厚かましくうつってしまうかも…。\n・周囲を魅了する華やかな見た目 ── ポジティブな内面は外にもにじみ出ます。まわりをハッと魅了するそんな力も持っているのです。" },
          { head: "💬 うれしい言葉・NGワード・謝り方", body: "😊 うれしい言葉（ビビッとくる）：活動量をほめて\n「仕事が早いね」の言葉でテンションがグンとUP！ 「フォローはこちらに任せて」のひと言もうれしいはず。\n\n⚡ NGワード（カチンとくる）：せかす言葉はNG\n「まだできないの？」は絶対に禁止。集中力が途切れます。ダラダラと長い指摘をされるのも苦手です。\n\n🙇 上手な謝り方：オーバーに短時間で\nせっかちなので言葉を並べるよりも短時間でスパッと謝って。表情や声色、しぐさなどでオーバーに表現を。\n\n💐 感謝の伝え方：励ましでパワーUP\n感謝のあとに「いつも応援しているよ」と励ましを加えれば、仕事への意欲がますます上がるはず。\n\n（キャラのひとこと）チータ：「時間はムダにしたくないの！ 何ごともテキパキとね」「まわりへの配慮もしなきゃね」" },
        ] },
        { head: "冠帯(かんたい)🐾黒ひょう ── 成人式 — 大人の仲間入り", body: "「胸を張って歩きたい、華やかエネルギー」\n🐾 動物：黒ひょう（月グループ）／人生のステージ：成人式 — 大人の仲間入り\n\n基本的な性質:晴れ着を着て成人式に向かうイメージ。華やかで社交的、プライドが高く、「立派な自分でいたい」という気持ちが強い星です。負けず嫌いで、人前に出るほど力を発揮します。\n\n🧡 本質（日柱）にあるとき\n意志が強く、華のある人。リーダーや代表に選ばれやすい。外ではしっかり者、家ではちょっとわがままなことも。\n\n💬 表面（月柱）にあるとき\n堂々として頼れる印象。「ちゃんとしてる人」に見られ、仕事や部活で頭角を現しやすい。\n\n🧭 意思（年柱）にあるとき\n「かっこ悪いことはしたくない」が判断基準。世間体や名誉を重んじ、筋の通った選択をする。\n\n🌠 希望（時柱）にあるとき\n夢は「認められること・輝くこと」。晩年に名誉や肩書きに恵まれやすい。\n\n【ウィークポイント】\n見栄とプライドで無理をしがち。かっこ悪い自分を見せられず、ひとりで抱え込む。\n\n【直すといいポイント】\n弱みを見せられる相手を1人だけ持つこと。「立派に見えるか」より「素直でいられるか」を判断基準にすると、ぐっと生きやすくなります。", children: [
          { head: "📗 キーワード・特徴・タブー", body: "🔑 キーワード：最新の〜／スマート／新技術／かっこいい／日々新たに\n🐾 人生ステージのたとえ：大学生〜新卒　／　別名：パイオニアタイプ\n\n【特徴】\n・面子やプライド、立場にこだわる\n・スマートにリーダーシップを取りたい\n・主語が多い\n・新しいものが大好き\n・気を遣われると嬉しい\n・いつまでも現役でいたい（✍️ピッチャー気質）\n・割と傷つきやすい\n・攻撃的だがあきらめやすい\n・正義感が強い\n・話し合いから自分のペースを作る\n・先行逃げ切り型\n・情報に敏感\n\n【好きなこと】\n・周りより一足先に、新しい情報や機械を持つこと\n・スマートにリーダーシップをとってまとめていくこと\n\n【タブー（この人にやってはいけないこと）】\n・初対面でのぞんざいな言葉遣い\n・強引な行動\n・この人を人前で叱る（✍️→やめちゃう）\n\n✍️ 手書きメモより\n・興味のあるものの最新が好き\n・努力をみせたくない" },
          { head: "🔍 性格を深掘り ── 3つのポイント", body: "「プライドが高く、好き嫌いがはっきり！」\n\n■ プライドは高いけど他人には無頓着\n常にスマートでいたいと考えています。プライドが高く、メンツに強いこだわりがあります。ただ、まわりの人のプライドには無頓着で、気づかないうちに傷つけてしまっていることも……。\n　◇ こんなことありませんか？\n　・いつもカッコよくいたい\n　・ナルシストなところがある\n　・失敗を引きずってしまう\n\n■ どんなグループでもリーダー的存在に\nリーダーシップがあり、自分が中心になることが大好きです。自ら積極的に立候補することも。まわりから気を使ってもらえると上機嫌。ただ、「私は〜」など自分中心の会話になりがちなのが玉にキズ。\n　◇ こんなことありませんか？\n　・リーダーになりたがる\n　・気づくと自分の話に夢中\n　・恋人にはかまってほしいと思う\n\n■ はっきりした性格で正義感が強い\nあいまいで中途半端な感じが大嫌いで、物事を白黒はっきりさせないと気がすまない性格です。反骨精神を持ち、正義感が強いので、不正やズルいことには黙っていられません。\n　◇ こんなことありませんか？\n　・決断が遅い人は苦手\n　・候補がいないと自分がやりたくなる\n　・中途半端なことをする人は許せない" },
          { head: "🪞 自己診断と周りからの印象", body: "【自分から見た性格（自己診断）】\n・いつも流行を追いかけていたい ── 常に流行を追いかけて知っておきたいタイプ。まわりよりも一歩先に出たいので最先端な物事を求めています。\n・中途半端が大嫌い ── 負けず嫌いでコツコツと物事に打ち込む黒ひょうキャラ。いいかげんなことにはイヤな顔をしてしまうことも。\n・立ち居ふるまいもスマート ── プライドが高く、他人からどう思われているのか気にしています。いつも完璧でおしゃれに見られたいのです。\n・間違ったことは正したい ── 不正やズルは嫌い。白黒はっきりさせたいので、あいまいなことは正しく直したいと思う、正義の味方です。\n・感情が表に出やすい ── 自分が思っているよりも考えていることが顔に出やすいのが特徴。ビジネスなどのシーンでは少しおさえて。\n\n【周りからはこう見えてる（印象診断）】\n・いつでも元気はつらつ ── 誰とでも明るく接することができるので、いつも周囲を楽しくなごませています。\n・コツコツと努力を続ける ── 理想やプライドが高い黒ひょう。その実現のためにコツコツ努力をしてなし遂げる力を持っています。\n・あらゆるテクニックを駆使 ── 常にセンスアップしたい、永遠に若くありたいと願っています。その目的のためにはあらゆるテクニックを駆使します。\n・弱みを見せてくれない ── 相手に合わせるのが得意で本音を出しません。人間関係を円滑にするには、たまには本心を見せてもいいかも。\n・好き嫌いがはっきりしている ── 好きな分野にはとことん打ち込めますが、イヤなことや苦手なことには興味を示さない人が多いようです。" },
          { head: "💬 うれしい言葉・NGワード・謝り方", body: "😊 うれしい言葉（ビビッとくる）：常に斬新さをほめて\n「前代未聞のできばえだよ」「とても斬新なアイデアですね」は、黒ひょうにとって最高のほめ言葉です。\n\n⚡ NGワード（カチンとくる）：やる気をそいではダメ\n「先走りすぎだよ」「抜け駆け？」はNGワード。せっかく努力しているのに、一気にやる気ダウン。\n\n🙇 上手な謝り方：とにかく下手に出て\n「ご迷惑をおかけして恐縮です」など、丁寧に気を使ってくれる相手には寛大に接してくれます。\n\n💐 感謝の伝え方：尊敬の言葉をプラス\nまずは「いつも感謝しています」と素直に伝えて。そのあとで尊敬していることをほのめかせば、上機嫌。\n\n（キャラのひとこと）黒ひょう：「おしゃれに敏感でプライドが高いの」「私のセンスをわかってくれたらうれしいな」" },
        ] },
        { head: "建禄(けんろく)🐾ライオン ── 働き盛り — 自分の足で立つ大人", body: "「自分の力でかせぐ、自立のエネルギー」\n🐾 動物：ライオン（太陽グループ）／人生のステージ：働き盛り — 自分の足で立つ大人\n\n基本的な性質:仕事も暮らしも自分の力で回せる、いちばん充実した大人のイメージ。堅実で責任感があり、実力で信頼を勝ち取っていく星です。派手さより「確かさ」で勝負します。\n\n🧡 本質（日柱）にあるとき\n芯がしっかりした現実派。人をあてにせず自分で道を切りひらく。まかせて安心の実力タイプ。\n\n💬 表面（月柱）にあるとき\n有能で安定した印象。組織やチームで信頼され、着実にポジションが上がっていく。\n\n🧭 意思（年柱）にあるとき\n決め方が堅実で計画的。「損か得か」より「確実かどうか」で選ぶ。親の背中から学ぶことが多い。\n\n🌠 希望（時柱）にあるとき\n夢を現実的な計画に落としこめる人。晩年は経済的にも安定しやすい。\n\n【ウィークポイント】\n外では完璧を演じて疲れをためる。人に頼るのが下手で、家でだけ甘えやわがままが出る。\n\n【直すといいポイント】\n「人に任せる」練習を意識的に。外と内のギャップは仕様なので、意識して休む日をつくり、外の顔をオフにする時間を確保しましょう。", children: [
          { head: "📗 キーワード・特徴・タブー", body: "🔑 キーワード：確実性／きっちり／完璧／絶対／社会的権威\n🐾 人生ステージのたとえ：部長　／　別名：パーフェクトタイプ\n\n【特徴】\n・徹底的にこだわるので頑固に見える\n・その道の先生を目指す\n・教え方が厳しい\n・他人の細かいところに気がつく\n・人の言ったことを良く覚えている\n・礼儀正しく礼節を重んじる\n・世間体を気にする\n・決して弱音を吐かない\n・言わなくても分かると思っている\n・甘えん坊であるが甘え下手でもある\n・大きく漠然とした話が多い\n・内外の落差が激しい\n\n【好きなこと】\n・さりげなく、やるべきことをやって周りを驚かせること\n・人前で身銭をパッと使うなどカッコをつけてみせること\n\n【タブー（この人にやってはいけないこと）】\n・愚痴や手抜きを見せてしまう\n・きちんとした対応、態度を取らない\n・この人のプライドを傷つける" },
          { head: "🔍 性格を深掘り ── 3つのポイント", body: "「目立つの大好き！特別扱いで満足する王様キャラ」\n\n■ 自分が中心的存在なら実力を発揮\n百獣の王ライオンというだけあって、まわりの人からのVIP待遇＆大勢の中でも目立つのが大好き。自分もそんな周囲の特別扱いに気分をよくして、どんなことでも力を存分に発揮します！\n　◇ こんなことありませんか？\n　・個人的な作業が得意\n　・みんなの中心で目立つことが好き\n　・「あなただけ」など特別扱いがうれしい\n\n■ 自分にはもちろん他人にも厳しい！\n世間体や人目を気にし、常に弱みは見せない完璧主義者。また、獅子は我が子を千尋の谷に落とすという故事がある通り、自分だけじゃなく、他人にも厳しく目を光らせています。\n　◇ こんなことありませんか？\n　・仕事は責任を持ってやり遂げる\n　・妥協や甘えは好きではない\n　・相手にも完璧を求める\n\n■ 完璧に見えるけど実はかわいい一面も\n完璧主義者のライオンにも意外な一面が。家に帰ってみたら案外、部屋が散らかっていたり……。気を許した人に対しては甘えたところを見せるなんていうお茶目な部分もあります。\n　◇ こんなことありませんか？\n　・家ではなるべくまったりしたい\n　・仕事と家では態度にギャップが出る\n　・仕事では見せないデレデレの顔を持っている" },
          { head: "🪞 自己診断と周りからの印象", body: "【自分から見た性格（自己診断）】\n・他人よりも優遇されると満足 ── 目立ちたがり屋なので、自分が特別待遇を受けるととてもうれしくなります。自分が一番、が原動力。\n・妥協なしの完璧主義者 ── 何ごとにも高いレベルを求めてしまいます。できあがるものはどんなときでも完璧でないとイヤなのです。\n・ほめ言葉が大好き ── 自分を立ててくれて、優遇されていると感じると気分がよくなって、いつもの2倍も3倍も力を発揮できちゃいます。\n・自分だけでなく人にも厳しい ── 物事への妥協やズルは許さないまじめな性格。これを他人にも求めがち。少しゆるめるようにしてみて。\n・プライベートでは甘えた姿 ── 仕事でがんばり屋なぶん、家ではゴロゴロ甘えたいタイプ。このギャップが仕事への活力にもなっています。\n\n【周りからはこう見えてる（印象診断）】\n・完璧・一番がモットー ── 自分にもストイックだけど、まわりにもアメとムチを使い分けた教育が得意。\n・トラブルにも強く頼りになる人 ── 責任感が強い堂々とした態度で、初対面の人からも好印象。トラブルが起きても動じない心強い人です。\n・几帳面で合理主義 ── 完璧を求めるがゆえに几帳面。まわりを気づかう繊細な面もありますが、スピーディーさも大事にします。\n・信念を曲げない厳しい人 ── 一度決めたことは最後までやり遂げる粘り強さもあります。尊敬した上司にはまっすぐ忠誠心を貫きます。\n・どんな逆境にもめげない ── 常識的で前向き。気位の高い凛とした人です。逆境にもくじけない負けん気と粘り強さが持ち味。" },
          { head: "💬 うれしい言葉・NGワード・謝り方", body: "😊 うれしい言葉（ビビッとくる）：一番すごい、とほめて\n「ナンバーワンの腕前ですね」など、立ててくれるとやる気UP。「任せたよ」と自由に任せてあげるのもよいでしょう。\n\n⚡ NGワード（カチンとくる）：細かい計算や説明は×\n「小数点以下のデータを準備して」「最初から最後まで、すべて説明してください」は避けて。\n\n🙇 上手な謝り方：言いわけの前に謝罪\n丁寧に頭を下げられるとそれ以上言えません。潔く謝りましょう。「いつもお手本にしています」のひと言も添えて。\n\n💐 感謝の伝え方：優越感をくすぐって\n「あなたほど親切な人はいません」などと特別感を出すと、照れながらもとてもうれしく感じてくれます。\n\n（キャラのひとこと）ライオン：「人に頼るのはちょっと苦手。そのぶん家では甘えたい！」「難しい話は苦手。わかりやすくストレートに！」" },
        ] },
        { head: "帝旺(ていおう)🐾虎 ── 人生の頂点 — 王様", body: "「十二運でいちばん強い、王様エネルギー」\n🐾 動物：虎（地球グループ）／人生のステージ：人生の頂点 — 王様\n\n基本的な性質:人生の絶頂期、玉座にすわる王様のイメージ。十二運の中で最強のエネルギーを持ち、自信・度胸・リーダーシップのかたまりです。そのぶん、人に頭を下げるのはちょっと苦手。\n\n🧡 本質（日柱）にあるとき\n生まれながらの親分・姉御肌。堂々としていて、ピンチでも動じない。人の下につくより、まとめる側が向いている。\n\n💬 表面（月柱）にあるとき\n強気で堂々とした印象。「あの人にはかなわない」と一目置かれる。トップや独立を狙える仕事運。\n\n🧭 意思（年柱）にあるとき\n「最後は自分が決める」が信条。一度決めたらブレない。押しつけにならないよう注意すれば最強。\n\n🌠 希望（時柱）にあるとき\n夢のスケールが大きく、晩年まで現役でいたいタイプ。人を導く立場で輝く将来。\n\n【ウィークポイント】\n最強のエネルギーゆえに強引・ワンマンになり、いつの間にか人の意見を聞かなくなる。\n\n【直すといいポイント】\n決める前に一呼吸おいて、あえて人に相談を。自分より弱い立場の人への配慮が、王様の器をさらに大きくします。", children: [
          { head: "📗 キーワード・特徴・タブー", body: "🔑 キーワード：バランス／一歩一歩／誠意／納得／負けない\n🐾 人生ステージのたとえ：社長　／　別名：バランスタイプ\n\n【特徴】\n・MOONの要素を強く持っている\n・自由、平等、博愛主義\n・バランス感覚抜群（✍️均等に入った模様のようなバランス）\n・悠然とした雰囲気\n・決めると徹底的にやる\n・全体像がつかめないとダメ（✍️目的が必要）\n・自分の生活圏を大事にする\n・マイペースで基本的に忠実\n・器用貧乏\n・面倒見の良い親分肌\n・笑いながらきつい一言が言える\n・思い込みは強い\n\n【好きなこと】\n・全体の構図を決めてからあれこれ考えること\n・興味のあることに全力投球し、自分のモノにすること\n\n【タブー（この人にやってはいけないこと）】\n・誠心誠意のない行動\n・神経を逆なでするような言い方（✍️言い方でケンカになる）\n・義理をわきまえない" },
          { head: "🔍 性格を深掘り ── 3つのポイント", body: "「落ち着いた雰囲気を持ち、思わず頼りたくなる」\n\n■ 頼りがいがありいつも冷静\n虎のようにあわてず騒がず、堂々としたオーラをまとっています。また、面倒見がよく、頼まれたことが断れない性格で、ボランティア精神も旺盛です。トラブルにも冷静に対応できます。\n　◇ こんなことありませんか？\n　・困っている人は放っておけない\n　・冷静にトラブルに対応できる\n　・自分がなんでもやってあげたくなる\n\n■ 最後までやりきる忍耐強さがある\n地に足がついた堅実な生き方をします。サボる、手を抜くということがなく、休まず働きます。また、一度決めたら最後までとことんやる忍耐強さがあります。「なせば成る」の精神を持つがんばり屋です。\n　◇ こんなことありませんか？\n　・働き者、と言われることがある\n　・ギャンブルや賭け事は好きなほう\n　・常に動き回っているのが嫌いではない\n\n■ なんでもやれる反面、器用貧乏に陥ることも\n気合いとがんばりでどんなことにもチャレンジ、ソツなくこなしますが、ときには器用貧乏になってしまうことも……。そんな自分に満たされない思いを抱く場合があるかもしれません。\n　◇ こんなことありませんか？\n　・「やればなんとかなる」ことが多かった\n　・「なんでもできるね」とほめられたことがある\n　・同時進行でもバリバリこなせる" },
          { head: "🪞 自己診断と周りからの印象", body: "【自分から見た性格（自己診断）】\n・頼まれごとを断れない ── 「お願い！」と言われたら、「仕方ないな〜」と力を貸してあげたくなります。ボランティア精神も旺盛。\n・周囲の状況を適切につかむ ── 学校や職場、家庭でもまわりの状況を見渡し、適切な行動をとります。居心地がいい雰囲気をつくれます。\n・命令されるのは好きじゃない ── 意志が強いため、自分がこう、と決めたことは貫きます。それを実力でやり遂げたいと思っています。\n・堅実でサボることを知らない ── 礼儀やマナーを大事にしています。手抜きやサボることは好きではなく、それは他人に対しても同じ。\n・虎のように悠然とした雰囲気 ── おおらかで冷静な人。自分のやることに自信を持っているため、どんな人にも堂々と接することができます。\n\n【周りからはこう見えてる（印象診断）】\n・好きなことには真剣に取り組む ── 「がんばればなんでもできる」と常に前向きな性格。好きなことにはとことん真剣に打ち込みます。\n・パワフルに仕事をこなす ── 自分の仕事も頼まれた仕事も、器用にどんどんこなしていく様子に、尊敬している後輩も多いはず！\n・粘り強く仕事をやり抜く ── 何ごとにも熱心でまじめに取り組んでいる印象。一度手がけた仕事は最後まで黙々とやり抜きます。\n・どんな問題もサッと解決 ── まわりを見渡し、必要だと思うことに手を差し伸べ、アクションを起こしてくれます。\n・いつも度胸たっぷり ── 部下・同僚・上司まで、自分の思ったことを堂々と公言できる強さと、しなやかさがあります。" },
          { head: "💬 うれしい言葉・NGワード・謝り方", body: "😊 うれしい言葉（ビビッとくる）：頼られるのが好き！\n「そのパワーに憧れています」、または率直に「頼りにしてるよ」がいいでしょう。うれしくなっちゃうはず。\n\n⚡ NGワード（カチンとくる）：気配りに気づいて\n周囲への気づかいを忘れない人だけに「自分の仕事だけしていて」と突き放されるとがっかり。\n\n🙇 上手な謝り方：仕事のミスは行動で\nヘタな弁明をするくらいなら態度で示しましょう。そうすればきっと見直してくれるはずです。\n\n💐 感謝の伝え方：存在感を認めて\n単刀直入に「あなたのおかげです」と素直な気持ちを伝えれば、それをくみとってくれるタイプです。\n\n（キャラのひとこと）虎：「バランス感覚バツグンの頼られキャラ」「言葉よりも行動であらわしてほしいな〜」" },
        ] },
        { head: "衰(すい)🐾たぬき ── 引退 — 頂点を過ぎた落ち着き", body: "「経験からくる、しっとり落ち着きエネルギー」\n🐾 動物：たぬき（月グループ）／人生のステージ：引退 — 頂点を過ぎた落ち着き\n\n基本的な性質:王様の座をゆずって、静かに暮らすご隠居さんのイメージ。若いうちから妙に落ち着いていて、思慮深く、争いを好みません。無理をしない、堅実で味わいのある星です。\n\n🧡 本質（日柱）にあるとき\n物静かで思いやり深い。目立つより支える側が心地いい。年齢より大人びていて「渋いね」と言われる。\n\n💬 表面（月柱）にあるとき\n穏やかで落ち着いた印象。ガツガツしないので敵を作らず、コツコツ型の仕事ぶりで信頼される。\n\n🧭 意思（年柱）にあるとき\n決め方は慎重で安全第一。冒険より「守り」を選ぶ。石橋をたたいて渡るタイプ。\n\n🌠 希望（時柱）にあるとき\n夢は「穏やかで満ち足りた暮らし」。静かであたたかい晩年に向かっていく。\n\n【ウィークポイント】\n受け身で自分を出さず、損な役回りを引き受けがち。がまんが習慣になりやすい。\n\n【直すといいポイント】\n小さなことからNOを言う練習を。「自分はどうしたい？」を先に言ってから相手に合わせると、愛されキャラのまま消耗しなくなります。", children: [
          { head: "📗 キーワード・特徴・タブー", body: "🔑 キーワード：経験／実績／究極／ブランド化／自信\n🐾 人生ステージのたとえ：会長　／　別名：トラストタイプ\n\n【特徴】\n・何事も経験と実績を重んじる\n・古いものを大事にする\n・究極の逸品に弱い\n・根拠のない自信がある\n・役割分担が好き\n・物忘れが多い\n・自分の出番待ちをする（✍️出番をつくってあげる）\n・存在感がないとだめ\n・相手の依頼を断りにくい\n・粘り強さ、底意地がある\n・「はい、わかりました」と返事だけは良い\n・ほかのマスコットにも化けられるが尻尾が出る\n\n【好きなこと】\n・自分の限界まで精一杯努力すること\n・ブランド物や信用のある品物を集めること（✍️コレクターが多い）\n\n【タブー（この人にやってはいけないこと）】\n・無神経で気が利かない行動\n・愚痴や手抜きをする行動\n・話を最後まで聞かない\n\n✍️ 手書きメモより\n・外交家\n・とぼけるのが上手\n・行きつけの店がある（たぬきはトイレが決まってる）" },
          { head: "🔍 性格を深掘り ── 3つのポイント", body: "「さまざまなキャラを演じることができる役者」\n\n■ 自分の役割をいろいろ演じられる\n化けるのが上手なたぬきのように、どんなキャラにもなれて、いろいろなことができちゃいます。人からワザや経験を吸収するのが大得意。なので、他人の特技もいち早く見抜きます。\n　◇ こんなことありませんか？\n　・仕事を覚えるのが得意\n　・人から経験談を聞かれるのが好き\n　・相手の長所や得意分野を見極めるのが得意\n\n■ 大事なことから物忘れしがち\n物忘れが激しいのも特徴。それも大事なことから忘れてしまうのがやっかいなところです。頼まれごとも気持ちよく返事してしまうことが加わるため、無責任と思われてしまうことも。\n　◇ こんなことありませんか？\n　・ついさっき頼まれたことを忘れてしまう\n　・集合時間や場所などをすぐにメモしないと不安\n　・言われたことを相手に繰り返し聞いてしまう\n\n■ 愛嬌のよさで他人にイヤがられない得な性格\n根拠のない自信があり、明るく積極的。また、無責任＆お調子者に見えても、それがイヤミに見えません。愛嬌があるので、まわりの人は不思議と許してしまう、得な性分です。\n　◇ こんなことありませんか？\n　・先輩や上司にも好かれていると思う\n　・ミスをしてもあまり怒られない\n　・失敗にもへこたれない明るさがある" },
          { head: "🪞 自己診断と周りからの印象", body: "【自分から見た性格（自己診断）】\n・どんなキャラクターにも化けられる ── 自分がその人になりきれるので、この人は何が得意なのかなど、人の長所を見つけるのがうまい人です。\n・何ごとにも積極的に取り組む ── 自信があり明るいので、何ごとにも挑戦できます。もっと経験や実績を積み上げていきたいのです。\n・陰で支える縁の下の力持ち ── 自分から先頭をきって走ることはしませんが、陰で支え応援してくれる控えめな人です。\n・大事なことから忘れていく!? ── 3歩歩くと言われたことを忘れてしまう…。そんなことがしょっちゅう。わざとではありません。\n・気さくで愛嬌がある ── 天然な性格をカバーしてくれるのが、この愛嬌。「もう〜」とまわりはつい許してしまう愛されキャラです。\n\n【周りからはこう見えてる（印象診断）】\n・出しゃばらず落ち着いている人 ── 出しゃばらない、おとなしいイメージ。その雰囲気にまわりも癒されてしまいます。\n・物事を着実にやり遂げる ── お願いした仕事は見事に仕上げてきます。確実なステップアップが認められる人です。\n・めったなことでは自分を曲げない ── 折り合う気持ちを忘れて、意志を貫き通そうとする頑固なところも見え隠れ…。\n・みんなから愛される存在 ── なぜかかわいがってあげたくなる不思議な魅力を持っています。他人受けのいいキャラクターなんです。\n・頑固だけど情にもろい ── 頑固な反面、受け身で聞き上手なキャラ。相手の話に合わせてくれることもしばしば。" },
          { head: "💬 うれしい言葉・NGワード・謝り方", body: "😊 うれしい言葉（ビビッとくる）：経験や実績を聞いて\n「ノウハウを教えてください」「経験談を聞かせてください」などの言葉で心が満たされるはず。\n\n⚡ NGワード（カチンとくる）：がんばる姿を認めて\nおっとりしているように見えて本人は必死なときがあります。「やる気あるの？」「もっと真剣に」はダメ。\n\n🙇 上手な謝り方：すぐにひと言謝って\nめったに怒りませんが、トラブルや対立は避けたいと思っています。すぐに謝れば根に持たれる心配なし。\n\n💐 感謝の伝え方：お礼状や丁寧な電話で\n古風な面を持っています。たとえ親しい同僚とのメールでも「サンキュー」なんて軽い文はあり得ないかも！\n\n（キャラのひとこと）たぬき：「ちょっとだけ天然ボケなところがあるの」「常識と礼儀は持ってほしいな！ 怒らないけど」" },
        ] },
        { head: "病(びょう)🐾子守熊 ── 病床 — ベッドで空想する時間", body: "「やさしさと空想の、ふんわりエネルギー」\n🐾 動物：子守熊（地球グループ）／人生のステージ：病床 — ベッドで空想する時間\n\n基本的な性質:病気そのものではなく、「ベッドの上で本を読んだり空想したりする時間」のイメージ。心がやさしく感受性豊かで、人の痛みがよくわかります。想像力の豊かさは十二運トップクラス。\n\n🧡 本質（日柱）にあるとき\n献身的で、困っている人を放っておけない。ロマンチストで芸術や物語の才能あり。心配性な一面も。\n\n💬 表面（月柱）にあるとき\n物腰やわらかく、話しかけやすい印象。自然と相談ごとが集まってくる「保健室の先生」的存在。\n\n🧭 意思（年柱）にあるとき\n判断の基準は「だれかを傷つけないか」。争ってまで勝とうとしない、やさしさベースの考え方。\n\n🌠 希望（時柱）にあるとき\n夢見がちだけど、その空想が独創的なアイデアの源。晩年は健康を大事にするとうまくいく。\n\n【ウィークポイント】\n頭の中のシミュレーションが長すぎて動けない。心配性で、空想のまま終わることがある。\n\n【直すといいポイント】\n考える時間に締切を設定しましょう。「小さく試す」が特効薬です。たっぷりの休息もこの星の燃料なので、休みに罪悪感を持たないこと。", children: [
          { head: "📗 キーワード・特徴・タブー", body: "🔑 キーワード：夢／長期的展望／最終的には／一生もの／将来性\n🐾 人生ステージのたとえ：老人　／　別名：ドリームタイプ\n\n【特徴】\n・ボーっとする時間がないと頑張れない\n・競争意識は強いが負ける勝負はしない\n・笑いをとるための毒舌家\n・最悪のケースを考えてから行動する\n・無駄を嫌う（✍️体力を消耗するから）\n・サービス精神旺盛\n・後からあれこれと悔やむ\n・ロマンティストだが現実的\n・南の島、温泉が好き\n・長期的展望に立って考える\n・ペース配分が重要な勝負に強い\n・多趣味\n\n【好きなこと】\n・健康に良い食生活を前提にセルフ・コントロールすること\n・スポーツや趣味など自分を高めること\n\n【タブー（この人にやってはいけないこと）】\n・恩着せがましい態度\n・裏表のある話\n・この人をないがしろにする行動\n\n✍️ 手書きメモより\n・本音を言わない\n・社交的\n・エサをとりに行く時は速い" },
          { head: "🔍 性格を深掘り ── 3つのポイント", body: "「どんなことでも楽しさ＆損得を計算して行動」\n\n■ パワーを蓄えるゆとりの時間が必要\n一日中ユーカリの木の上にいるように、ゆとりの時間がなくちゃダメ。その間にパワーを蓄えます。そのせいかおとなしい人に思われがち。ですが、充電後にはサービス精神旺盛なキャラにチェンジ。\n　◇ こんなことありませんか？\n　・物静かな人、というイメージを持たれる\n　・南国などのあたたかいところでのんびりしたい\n　・ひとりで遊んでいるのも嫌いじゃない\n\n■ 「楽しさ」が物事の選択のポイント\n快楽主義者で楽しいことが大好き。常に何かを選択するときに楽しさを求めます。しかも、楽しさを優先しながら合理的で、損得勘定もできるという不思議な二面性を持っています。\n　◇ こんなことありませんか？\n　・旅行の計画などを立てるのが得意\n　・楽しい飲み会の席が好き\n　・お金の儲け話に興味がある\n\n■ 常に計算した行動パターン\n出し抜いて勝つことや、儲け話が大好きな子守熊。嫌いな人とでもビジネスなら割り切ってつき合えます。また、最悪のケースや、常に先を考える慎重さを持ち合わせています。\n　◇ こんなことありませんか？\n　・状況を先読みするのが得意\n　・面倒なことが好きではない\n　・計画は入念にチェック" },
          { head: "🪞 自己診断と周りからの印象", body: "【自分から見た性格（自己診断）】\n・余裕がないとがんばれない ── ボーッと過ごす時間も必要。あとから追いつめられた状態にならないように、先回りしてものを考えておきます。\n・楽しいことが大好き ── 物事を決める基準は楽しいのか、楽しくないのか。それでモチベーションがだいぶ変わっちゃいます。\n・慎重に進める策略家 ── 段取りが後手に回ったら、ボーッとする時間が確保できない！ そのために計画をしっかり練るのです。\n・まわりを納得させるのが得意 ── もし失敗がバレてしまったときのために、言いわけも用意。これがまた、みんなを納得させてしまうのです。\n・割り切ってつき合う器用さも ── 子守熊は儲け話が大好き。そのためなら少し苦手な人が相手でも、割り切ってお話ができるのです。\n\n【周りからはこう見えてる（印象診断）】\n・親しみやすくやさしい雰囲気 ── やさしい雰囲気を持っていて、人見知りもあまりしないので、誰とでも仲よくなりやすいです。\n・仲よくなると策略家の面も ── 第一印象はおとなしめ。でもつき合いが深くなるにつれ、ちょっと計算高いイメージも出てきます。\n・気楽に生きたい ── 人生を気楽に生きていきたいと考えている一面も。「飲み会、温泉…。毎日行けたら最高〜」と思っているんです。\n・計画を立てるのが上手 ── 実行に移す前の「計画」が一番大事。先を見通して把握する力もあるので、失敗はなかなかありません。\n・楽しいことを徹底的に追求 ── ずっと楽しいことをして暮らしていきたい…。仕事中も、夕方になると楽しい妄想で頭はいっぱいなんです。" },
          { head: "💬 うれしい言葉・NGワード・謝り方", body: "😊 うれしい言葉（ビビッとくる）：先を見通す力をほめて\n「先見の明がありますね」は大好物！ 今後の展望を計算しながら行動している姿を、支持してあげましょう。\n\n⚡ NGワード（カチンとくる）：センスを否定しないで\n創意工夫を欠かしません。「もっとシンプルに」「奇をてらいすぎ！」は、ショックが大きいひと言に。\n\n🙇 上手な謝り方：何度も足を運んで謝罪\n疑い深い面があります。一度の謝罪では信じてもらえない可能性が。何回もすることで絆を取り戻せるはず。\n\n💐 感謝の伝え方：「楽しい」を強調\n感謝しているのなら、平凡なお礼よりも「あなたとお仕事ができて楽しいです！」と言ってみて。\n\n（キャラのひとこと）子守熊：「計画がしっかりしていればあとがラク」「クリエイティブな部分を感じてもらえるとうれしいな」" },
        ] },
        { head: "死(し)🐾ゾウ ── 静止 — すべてが静かに止まる時間", body: "「むだをそぎ落とした、集中エネルギー」\n🐾 動物：ゾウ（太陽グループ）／人生のステージ：静止 — すべてが静かに止まる時間\n\n基本的な性質:こわい名前ですが、意味は「動から静へ」。ざわざわした動きが止まり、心が澄みわたるイメージです。冷静で無駄がなく、ひとつのことを深く極める研究者タイプ。直感も鋭い星です。\n\n🧡 本質（日柱）にあるとき\n落ち着いた知性派。広く浅くより「狭く深く」。決断は潔く、ぐずぐず引きずらない。勘がよく当たる。\n\n💬 表面（月柱）にあるとき\nまじめで静かな印象。専門職・職人的な分野でコツコツ成果を出し、「あの分野ならあの人」と言われる。\n\n🧭 意思（年柱）にあるとき\n決めたら迷わない、潔い考え方。損得より「納得できるか」で選ぶ。\n\n🌠 希望（時柱）にあるとき\n夢は「何かをとことん極めること」。晩年は静かで精神的に豊かな時間に向かう。\n\n【ウィークポイント】\n一点集中のあまり視野が狭くなる。繊細で傷つきやすいのに、無口なので「無関心な人」と誤解される。\n\n【直すといいポイント】\n定期的に顔を上げて、進み具合を周りと共有すること。自分の頑張りは言葉にして伝えないと伝わりません。", children: [
          { head: "📗 キーワード・特徴・タブー", body: "🔑 キーワード：プロ／多角化／権力／努力／コツコツ\n🐾 人生ステージのたとえ：瀕死（人生の終盤）　／　別名：パッションタイプ\n\n【特徴】\n・常に何かに打ち込んでいたい\n・その道のプロ、職人を目指す\n・さりげなく努力するポーズを見せる\n・何事にも努力と根性\n・記憶力、同化吸収力に優れる\n・やる時は徹夜してでもやり遂げる\n・「俺たちに明日はない」的発想\n・敵味方の区別が極めて明確\n・問題発見のプロ（✍️コンサル業向き）\n・報・連・相が苦手\n・話が大きい\n・不言実行タイプが多い\n\n【好きなこと】\n・プロ意識を持ってやりぬくこと\n・努力を重ねて始めて成果が出るようなこと\n\n【タブー（この人にやってはいけないこと）】\n・あれこれと言い訳をする\n・不安を与える言動\n・鋭い目つきでこの人を見る\n\n✍️ 手書きメモより\n・はちまき＝努力家\n・体が大きい＝ガンコ\n・耳が大きい＝地獄耳\n・ポーカーフェイス" },
          { head: "🔍 性格を深掘り ── 3つのポイント", body: "「信念が強く、どんなことでもやり遂げる！」\n\n■ 小さな努力もいとわず、やりきれる\n威厳のあるゾウのように信念が強く「やると決めたらやり通す」がモットー。いつも何かに打ち込む、打ち込んでいたいという欲求があります。見かけよりも心配性なのも特徴。\n　◇ こんなことありませんか？\n　・黙々と作業をしている時間が好きだ\n　・いつの間にか熱中していることがある\n　・物事に打ち込むのが嫌いではない\n\n■ 大きな耳は飾りで人の話を聞かない\nゾウの大きな耳とは正反対で人の話を聞かない傾向があります。周囲からの忠告も耳に入りません。さらに普段穏やかな人だけに、キレると手がつけられなくなったりすることも……。\n　◇ こんなことありませんか？\n　・話の最初を聞けばなんとなくの内容が見える\n　・人の話を聞いているときに違うことも同時に考えている\n　・怒ると怖い（怖そう）と言われる\n\n■ まわりと連携して対応できる協調性あり\n根回し上手。状況を正確につかんで、協調性のある働きをします。普段は悠然としていますが、相手が強気に出ると素直に従ってしまい、長いものに巻かれる処世術も身につけています。\n　◇ こんなことありませんか？\n　・相手が強気だと相手に合わせる\n　・一歩下がって状況を見られる\n　・意見や言動など柔軟に変えられる" },
          { head: "🪞 自己診断と周りからの印象", body: "【自分から見た性格（自己診断）】\n・有言実行がモットー ── やると決めたら、とことんがんばります。不正なことは嫌い。まわりからも頼りにされています。\n・心の中は不安でいっぱい ── 堂々とした外見とは裏腹に、心の中には不安がいっぱい。忘れるために何かに打ち込んでみる、ということも。\n・さりげなくがんばる ── 目標達成に向けて、コツコツと地道に努力を続けられます。子どものころの夢が現実に…なんてことも。\n・ときにはきついひと言も ── 普段はおおらかなのに、怒ると手がつけられなくなることも。きついひと言で相手を攻撃することもあります。\n・人の意見はあまり聞かない ── 話を聞いていない、というよりは一を聞いて十を知る、少しのヒントで先が見えちゃうカンのいい人なんです。\n\n【周りからはこう見えてる（印象診断）】\n・第一印象は堅実な人 ── 最初は生まじめで少々堅苦しいイメージ。でも努力を続けるのでいつの間にか信頼できるリーダーに。\n・がんばり方が激しい ── 目標が決まったら一直線に突き進みます。自分を犠牲にしてもがんばり続ける、ストイックさも持っています。\n・自分も他人も甘やかさない ── 根気強さを他人にも求めます。さりげないがんばりで目標に到達してほしいのです。\n・意外と柔軟性もある ── 普段威厳があり、大きく見えるゾウですが、長いものには巻かれる、の処世術も持っています。\n・深みのある人間関係を築く ── エネルギーがあふれながらも、さわやかな人物。まわりからも信頼され、よい人間関係を築いていけます。" },
          { head: "💬 うれしい言葉・NGワード・謝り方", body: "😊 うれしい言葉（ビビッとくる）：控えめにほめて\n「縁の下の力持ちだね」や「実は尊敬していました」とさりげない言葉で思わず顔がほころぶでしょう。\n\n⚡ NGワード（カチンとくる）：妥協や甘えはダメ\n「適当でいいんじゃないの」「そこまでやるんですか？」は慎んで。雑な仕事は好きではありません。\n\n🙇 上手な謝り方：白々しくても平謝り\nこれが得策でしょう。謙虚な態度に出られると、それ以上相手を責められない心やさしき人なのです。\n\n💐 感謝の伝え方：さりげない感謝を\nシャイな性格。大げさに感謝されるのは恥ずかしいみたい。「今後ともご指導ください」と頼めば喜んでくれます。\n\n（キャラのひとこと）ゾウ：「とにかくまじめな努力家なの」「大げさは苦手。控えめだとうれしいな」" },
        ] },
        { head: "墓(ぼ)🐾ひつじ ── 蔵 — 大事なものをしまっておく場所", body: "「コツコツためる、貯蔵エネルギー」\n🐾 動物：ひつじ（月グループ）／人生のステージ：蔵 — 大事なものをしまっておく場所\n\n基本的な性質:お墓というより「蔵」のイメージ。お金も知識も思い出も、大事なものをコツコツためこむ星です。探究心が強く、家族やご先祖とのつながりを大切にします。倹約家でコレクター気質。\n\n🧡 本質（日柱）にあるとき\n堅実でむだづかいしない。好きな分野をとことん調べる研究家。家族思いで、思い出の品を捨てられないタイプ。\n\n💬 表面（月柱）にあるとき\n地味だけど確実、という印象。管理・整理・お金の計算など「きっちり系」の役割で信頼される。\n\n🧭 意思（年柱）にあるとき\n考え方は「守る・受けつぐ」が軸。伝統や家のルールを大事にし、慎重に判断する。\n\n🌠 希望（時柱）にあるとき\n夢は「形あるものを残すこと」。コツコツためた貯えで、晩年は安泰になりやすい。\n\n【ウィークポイント】\n気持ちも、お金も、不満も、ためこむ。さびしがりなのに自分からは言い出せない。\n\n【直すといいポイント】\n不満は小さいうちに小出しに。ためたもの（物・お金・気持ち）を定期的に棚卸しして、頼られたら遠慮なく頼り返しましょう。", children: [
          { head: "📗 キーワード・特徴・タブー", body: "🔑 キーワード：気配り／現実性／人脈／常識的／シミュレーション\n🐾 人生ステージのたとえ：人生を見届ける存在　／　別名：リサーチタイプ\n\n【特徴】\n・淋しがり屋で、独りぼっちは嫌い\n・仲間はずれにされると傷つく\n・相談を受けるとすごく嬉しい\n・気を遣われるとすごく嬉しい\n・皆で助け合いの精神\n・「和」を乱す人を最も嫌う\n・客観的に物事を判断する\n・はっきりとものが言える\n・好き嫌いは激しい\n・守れない約束はしない\n・情報収集家\n・信頼すると愚痴やぼやきが多くなる\n\n【好きなこと】\n・いろいろなところに顔を出し、たくさんの仲間を作ること\n・気のきいた話をして、その場のムードを和やかにすること\n\n【タブー（この人にやってはいけないこと）】\n・約束を守らない\n・音信不通にしてしまう（✍️ごキゲン伺いメールが効く㊙）\n・気配りを欠いた振る舞い\n\n✍️ 手書きメモより\n・交流会に多い\n・世のため人のため（毛は布団、肉は食事になる）\n・マイナス思考になりやすい" },
          { head: "🔍 性格を深掘り ── 3つのポイント", body: "「人とのつながりを大事にする寂しん坊さん」\n\n■ 寂しがり屋で団体行動が絶対！\n群れをなして行動するひつじのように、寂しがり屋で人なつっこく、ひとりぼっちが苦手。特に仲間はずれにされるのが大嫌い。そんな性格なので、相談ごとにも親身に対応します。\n　◇ こんなことありませんか？\n　・仲間はずれやケンカは嫌い\n　・ひとりでどこかに行くなんて無理！\n　・好きな人には連絡をどんどんもらいたい\n\n■ 冷静な判断ができるCOOLキャラ\n和を大切にするので人脈づくり・情報集めが得意。また、ひつじのたっぷりな毛のように本音を隠しているため、表面的にはクールに見えます。冷静で客観的な判断ができます。\n　◇ こんなことありませんか？\n　・物知り、と言われることがある\n　・客観的な目線でアドバイスが的確\n　・データ管理やパソコン関係など、情報処理が得意\n\n■ 律儀さが頑固者と思われる場合もあり\n常識を重んじる性格なので、約束は絶対守るのが当たり前。自分にも相手にも求めます。ただし、律儀さが度を越すと融通のきかない頑固者と思われてしまうこともあります。\n　◇ こんなことありませんか？\n　・今まで大きな遅刻をしたことがない\n　・命令や強要はイヤ！ もっとしなやかな生活がいい\n　・時間にルーズな人はちょっと…" },
          { head: "🪞 自己診断と周りからの印象", body: "【自分から見た性格（自己診断）】\n・人の和を大事にする ── 「協調性」「みんなで仲よく」が大好き。友達や知り合いも多く、自然と情報も手に入るのです。\n・一度決めたことや約束は守る ── 事前に決めたことは守るのが当たり前、と思っています。ドタキャンする人は、恋人候補NGなのです。\n・相談されることに喜びを感じる ── もともと寂しがり屋の性格もあるけど、人から相談をもちかけられるとうれしくなって、熱心に考えます。\n・融通のきかない頑固なイメージ ── 自分と同じように相手にも規律や時間を守ってもらいたい！ それが当然と思ってしまっています。\n・自分の本音を伝えることが苦手 ── 厚い羊毛を持つように、本来の自分は奥に隠していたいのです。たまに発散したくもなるけれど…。\n\n【周りからはこう見えてる（印象診断）】\n・的確で丁寧に仕事をこなす ── 客観的な意見やデータを駆使して、的確で丁寧な仕事をしてくれます。問題も起こさず、高い評価を得ています。\n・平和や協調性を大事にする ── いつも平和や協調性を大事にしています。みんなから好かれる親切であたたかい性格の人なんです。\n・「いい人」への憧れが強い ── 時間を守り、相手の意見も尊重してくれます。みんなから頼りにされますが、ちょっと融通がきかないところも。\n・細かいことまで気にする ── 細かいことまで気にしすぎて、他人に厳しいところが…。あまり決めつけすぎると、相手が混乱するかも。\n・常に冷静で知的な印象 ── 情報処理やデータ管理が得意。常に冷静で客観的でもあるので、アドバイスも的確。頭がいい印象があります。" },
          { head: "💬 うれしい言葉・NGワード・謝り方", body: "😊 うれしい言葉（ビビッとくる）：知識の豊富さに着目！\n「博学ですね」「また教えてください」、このひと言で驚異的な働きぶりを見せるかもしれません。\n\n⚡ NGワード（カチンとくる）：「頭ごなし」はNG\n「言うとおりにやってくれるだけでいいから」は禁句中の禁句です。相手に反発したくなります。\n\n🙇 上手な謝り方：相手の情に訴えて\nなるべくひつじがすねる前に決着を。心を込めて謝って事態が収束するのを待ちましょう。\n\n💐 感謝の伝え方：こまめな感情表現を\n「ありがとう」「うれしい」はくり返し口に出しましょう。しつこいかなと思うくらいでちょうどいいみたい。\n\n（キャラのひとこと）ひつじ：「約束を守る律儀な性格なの」「感情表現は大げさなくらいがうれしいな」" },
        ] },
        { head: "絶(ぜつ)🐾ペガサス ── 無 — 生まれ変わる直前", body: "「リセットと再スタートの、変身エネルギー」\n🐾 動物：ペガサス（太陽グループ）／人生のステージ：無 — 生まれ変わる直前\n\n基本的な性質:いったんすべてが無になり、次の命に生まれ変わる直前のイメージ。十二運でいちばん不安定で、いちばん自由な星です。感受性は最大級、発想は天才肌。じっとしているのが苦手で、変化の中でこそ生きます。\n\n🧡 本質（日柱）にあるとき\n気分の浮き沈みはあるけれど、発想がユニークで憎めない人気者。環境をガラッと変えて再スタートするのが得意。\n\n💬 表面（月柱）にあるとき\nつかみどころのない、ミステリアスな印象。転校・引っ越し・転職など動きが多め。企画やアイデアの仕事向き。\n\n🧭 意思（年柱）にあるとき\n考えは変わりやすいが、しがらみに縛られない自由な発想ができる。ゼロから考え直すのが得意。\n\n🌠 希望（時柱）にあるとき\n夢は壮大で、何度も生まれ変わる。年をとってから新しいことを始めて花開くことも。\n\n【ウィークポイント】\n気分の波が激しく、束縛されると枯れる。地に足がつかず、周りを不安にさせることがある。\n\n【直すといいポイント】\n波があるのは欠点ではなくエンジンの仕様。気分が乗る時間帯に大事なことを配置し、「自由でいられる条件」を先に交渉しておきましょう。", children: [
          { head: "📗 キーワード・特徴・タブー", body: "🔑 キーワード：感性／直感／気ままに〜／超合理的／大企業\n🐾 人生ステージのたとえ：魂（生まれ変わる前）　／　別名：インスピレーションタイプ\n\n【特徴】\n・気分屋だがそれを隠そうとしない\n・束縛される環境に弱い\n・ピンとくる感性はすごい\n・ポイントは一言で良い\n・いちいち細かく指示されるとダメ\n・気が乗っているか否かで差が激しい\n・根拠のない考え方をする\n・大げさな人が多い\n・状況に応じた切り替えが速い\n・行動範囲が広い（✍️飛べるから）\n・人を使うのがうまい\n・得意分野には爆発的能力を発揮する\n\n【好きなこと】\n・自由気ままに出かけたり、自分の時間を楽しむこと\n・変化に応じてカンを働かせ、カッコよく対処すること\n\n【タブー（この人にやってはいけないこと）】\n・プライバシーに踏み込む\n・長話、長電話\n・管理、束縛等、「枠」に入れる\n\n✍️ 手書きメモより\n・マイナス思考になりやすい\n・「何もしてなくてもできるよ」と言えちゃう天才肌" },
          { head: "🔍 性格を深掘り ── 3つのポイント", body: "「気分が乗れば、天才的なひらめきを発揮！」\n\n■ 天真爛漫で束縛はNG\n大空を駆けめぐるペガサスのように、おおらかに生きていたいのがモットー。自由が大好きな気分屋です。そのため、束縛されるのをガマンできません。とらえどころがないのが特徴。\n　◇ こんなことありませんか？\n　・連絡をマメにとったり束縛されるのは苦手\n　・ミステリアスと言われることがある\n　・細かいことは気にしない性格\n\n■ 発想力はナンバーワン！\nひらめき、発想力は12動物キャラの中でナンバーワン。気分が乗っているときは実力を発揮できます。ただし、気分の切りかえがヘタで、悪循環にハマってしまうと脱出できないのが難点。\n　◇ こんなことありませんか？\n　・会議などとっさのときでも意見を言える\n　・調子のいいときはなんでもうまくいく\n　・逆に失敗のスパイラルにもハマりやすい\n\n■ イベント大好き！な盛り上げ上手\n本人の華のあるキャラと同様、みんなでワイワイと騒ぐ派手なイベントが大好き。そんな場に出ると、ついテンションが上がってしまいます。おしゃべりが多くなり、雰囲気を盛り上げようとします。\n　◇ こんなことありませんか？\n　・ペガサスの人には見た目でわかる華がある\n　・楽しいイベントには別の予定をドタキャンしてでも行きたい\n　・クリスマス、誕生日などの飾りつけは華やかにしてお祝いしたい" },
          { head: "🪞 自己診断と周りからの印象", body: "【自分から見た性格（自己診断）】\n・ひらめきや発想が天才的 ── 他の人とはひと味違ったコメントや企画がパッと思いつきます。みんなの視線を集める注目の存在。\n・気分が乗らないとまったくダメ ── 昨日は大丈夫だったのに、今日は全然ダメ。そんなこともしばしば。気分転換が大事かもしれません。\n・気まぐれなので行動が読めない ── 団体行動をしていても、不思議なことに、自分が興味を持ったほうにスーッと足が向いちゃうんです。\n・細かい指示や束縛は大嫌い ── 一から十まで、条件の多いお願いはよくわからなくなっちゃう…。ひと言で簡潔にすませてほしいのです。\n・ミステリアスなイメージ ── 頭はいいけど、お天気屋でミステリアス。相手にはつかめない、と思わせて、また違う一面を見せちゃいます。\n\n【周りからはこう見えてる（印象診断）】\n・おおらかで開放的 ── いつも自由な発想を持っている、おおらかな気分屋。でも、それを隠そうとはしていないみたいです。\n・意見をコロコロ変える ── 感性が豊かで、どんどんアイデアがわいてくるのですが、意見をコロコロ変えるので相手が混乱することも。\n・とらえどころのない雰囲気 ── あっという間に行動や考えが変わってしまう印象。だからこそ、いつまでも飽きのこない人でもあります。\n・直感でものを考える ── 一緒に旅行に行ってもひとりだけ団体と別行動になっていたり…。思ったことを思うままにする自由な人。\n・ひらめきはすばらしい ── 他の人にはできない面白い発想はペガサスの宝物。気分がいい状況だと特にそれが発揮されるようです。" },
          { head: "💬 うれしい言葉・NGワード・謝り方", body: "😊 うれしい言葉（ビビッとくる）：きらびやかな言葉を\n「鋭い感性を持っていますね」「仕事に向かう姿がキラキラとまぶしいです」とほめて。心を奪われそう。\n\n⚡ NGワード（カチンとくる）：クドい言葉は苦手\n「何度言ったらわかるの」はNG。周囲との対立も避けたいので「あのチームを倒そう」は意欲が下がります。\n\n🙇 上手な謝り方：簡潔にひと言で十分\nしつこい謝罪は逆に溝を深めます。「申し訳ありません」のひと言で。ご機嫌のいい時間帯に切り出して。\n\n💐 感謝の伝え方：その場その場で伝えて\nあとになってからお礼を言っても、気ままなペガサスは覚えていない…なんてことも。サラリと伝えて。\n\n（キャラのひとこと）ペガサス：「大きな空を羽ばたいていたい自由人」「細かいことや言葉は苦手。簡潔にお願いね」" },
        ] },
      ]
    },
    {
      icon: "📅", menu: "10リズム", title: "10リズム ── 年・月・日でめぐる運気の波",
      intro: "診断カードの📅（リズムカレンダー）に出てくる10リズムの解説です。まず「リズムってなに？」を読んでから、5つの期を開いてください。",
      items: [
        { type: "info", head: "リズムってなに？", body: "リズムは、あなたの日干（生まれた日のエネルギー）と「その年・月・日」のめぐり合わせで決まる、10種類の運気の波です。診断カードの📅ボタン（リズムカレンダー）で、年・月・日ごとのリズムをいつでも確認できます。\n\nリズムには1〜10の番号があり、年なら10年・月なら10ヶ月・日なら10日でひと回りします（カレンダーのマスに出ている数字がこの番号です）。\n\nまた、性質の近さで、畑づくりにたとえた5つの期（発芽・成長・開花・収穫・開墾）に2つずつ分類されます。「浪費」「焦燥」などドキッとする名前もありますが、悪い時期という意味ではなく「その時期に合った過ごし方がある」だけ。各リズムの【実践のコツ】を参考にしてください。" },
        { type: "info", html: true, head: "📊 10リズム早見表 ── 現象と本質", body: "<div class=\"rel-scroll\"><table class=\"rel-table\"><tr><th>期</th><th>リズム</th><th>現象</th><th>本質</th></tr><tr><td>🌱 発芽期</td><th>活動</th><td>アクセク</td><td>独立・積極・実行</td></tr><tr><td>🌱 発芽期</td><th>浪費</th><td>ガタガタ</td><td>協調・消極・緩慢</td></tr><tr><td>🌿 成長期</td><th>調整</th><td>ウッカリ</td><td>調整・安定・宣伝</td></tr><tr><td>🌿 成長期</td><th>焦燥</th><td>イライラ</td><td>直感・感情・紛争</td></tr><tr><td>🌸 開花期</td><th>投資</th><td>ドキドキ</td><td>奉仕・出入・流動</td></tr><tr><td>🌸 開花期</td><th>成果</th><td>ワクワク</td><td>収穫・資産・固定</td></tr><tr><td>🌾 収穫期</td><th>転換</th><td>イケイケ</td><td>転換・変動・拡大</td></tr><tr><td>🌾 収穫期</td><th>完結</th><td>ドッシリ</td><td>発展・責任・完成</td></tr><tr><td>🚜 開墾期</td><th>整理</th><td>アタフタ</td><td>変化・開発・整理</td></tr><tr><td>🚜 開墾期</td><th>学習</th><td>キッパリ</td><td>反省・研究・結果</td></tr></table></div><div class=\"rel-note\">「現象」＝その月の空気感をあらわすオノマトペ。アクセクする月、イライラしやすい月…と覚えると使いやすいです。<br>💼 使い方（未来編）：5年先までの自分の年リズムを一覧にして、各リズムの「ビジネスでの活かし方」から年ごとの計画を立てる、という使い方がISD教材で紹介されています。各リズムの中に💼の項目を追加してあります。</div>" },
        { head: "🌱 発芽期 ── 活動（5）・浪費（2）｜守備本能", body: "5つの期の中でいちばんエネルギーを使う時期。五本能では「守備本能」（木）にあたります。\n\n予定がどんどん入ってくるので、スケジュールをゆるめにしておくこと。忙しくなって人への対応が雑になりやすいので注意（レールでいうマイウェイ・マイペースの時期）。", children: [
            { head: "活動（リズム5）── 「巣立ち」小さくてもいいから何かをスタートさせるトキ", body: "【実践のコツ】\n・芽が上に伸びるイメージ。全員「活動」で生まれる。\n・自分の予定じゃないことが入りやすい。頑固になりやすい。\n・ビジネスの始まりが多い。とにかく計画・行動！小さくても良いから何かスタートさせること。\n・この時期にスタートしたものは10年続く。\n・自分が前に出る、一人で立ち上げるトキ。\n\n【キーワード】\n計画、実行、仕切り直し、新しい流れをつかむ、意欲的、柔軟性、リーダーシップ ➔ リスタートもOK。忙しく空回り、気苦労多し、部下の面倒、結婚不向き、旅立ち、体調万全、独立、ビジネス始め、人の上に立つ機会が増える。\n\n【年のリズム】今年のテーマ 「巣立ち」新しく何かをするために\n体調も良くなり、気力も充実しているトキです。大地にまいた種が一斉に芽を出し、新芽がまばゆいといったイメージです。このトキは何事にも積極的に出て行く行動をとり、自分の考えや気持ちを前面に出していきましょう。発芽期の今は、伸びようという意欲でいっぱいです。環境の変化にも十分対応できるでしょう。ただ意欲的な行動も周囲の人の気持ちを無視すると対人関係でトラブルとなりやすいので注意してください。いずれにしても新たな計画を行動に移すときです。\n\n【なぜそうなるの？】\n活動のリズムは、特別意識というものが薄れて、人に対して指導する力が備わってきます。前進力が加わり、能動的な思考に支えられるので、行動的になります。人生の確立期を意味する時期でもあるので、何かを始めるには最良の時期でもあるのです。\n\n【月のリズム】\n体調もよくなり、気力も充実しているトキです。大地にまいた種がいっせいに芽を出し、新芽の緑が目にまぶしいといったイメージです。\n💡 まず、行動を起こすことと指導力と推進力が冴えるトキです。周囲のスピードに苛立ちを感じますが、調和を保つことが必要です。\n\n【日のリズム】キーワード：計画、実行、仕切り直し\n殻をやぶり、何かが生まれてくるような、はつらつとした日です。\n💡 ともかく前向きな姿勢が似合う日です。頑張りましょう。\n\n【💼 ビジネスでの活かし方（未来編・年単位）】\n現象：アクセク\nキーワード：独立・積極・実行・計画・ポリシー\n・リーダーシップを意識する\n・実施・始動・再スタート\n・事業計画を固める" },
            { head: "浪費（リズム2）── 「愛情と信用」無理せず体力温存のトキ", body: "【実践のコツ】\n・根が下に伸びていくイメージ。検診（健康チェック）が良い。自分が健康な時は身内の体調チェックを。\n・疲れやすい、少ししんどい時期。人の意見を聞くと良い。\n・上限を決めること（例：12時以降は出歩かない、二次会までで三次会は行かない、キャッシュレスは1万円まで）。\n・自分への投資はOK。美容もOK。協力者とは心・物理的距離を意識。\n・協力者だと思ってたら違う、と気付けるトキ。\n\n【キーワード】\n時間を作る、体調管理、慎重な意思決定。余裕が必要、細心の注意、人事異動、転勤・出向、痛い損失、他界（身内など）、無駄遣い、気力減退、仲間を大切に、ビジネスでの決定事項はハズレやすい。\n\n【年のリズム】今年のテーマ 体力、時間、お金を意識「愛情と信用」\n何となく体調も優れず、気力も衰えているトキです。開墾期に広大な土地を耕した後にホッと気が抜けたような感じのイメージです。植物は、発芽期に大量の養分を必要とします。一仕事終えた安堵感から外に目がいきがちですが、今は無理せず体力を温存しておきましょう。特にお金に関する事は注意してください。何をやってもうまく行かず失う可能性があります。しかしその反面、協力者や仲間を得て強気になって行動力を発揮することもあります。愛情や信用は一度失ってしまうと取り戻すのは容易ではありません。人間関係には注意しながら生活する事が大切です。\n\n【なぜそうなるの？】\n浪費のリズムは、行動すると壁が多く、大きな進展は待つことによって展開されます。リズムとして考えれば「受身」のリズムでもあり、行動すればするほど精神的負担が大きくなってきます。身内の理解を得ることが出来ない代わりに、他人の中に理解者が現れます。この時期は「種まき」的な時期であり、未来に対する準備期間。いろいろな考え方が一つにまとまる時でもあるのです。\n\n【月のリズム】\n開墾期に広大な土地を耕した後だけにホッと気が抜けたような感じのイメージです。\n💡 経費に対してシビアになるトキです。出費が多くなりがちなので、財布の紐を締められるところは締めるよう心がけましょう。その反面、自分の事をよくわかってくれる理解者の出現に期待してください。\n\n【日のリズム】キーワード：時間を作る、体調管理、協力者\n体調がベストでないせいかもしれませんが、思わず聞き直した態度をとってしまうことも、また投げやりな態度に出てしまうこともある一日です。\n💡 今日一日だけいつもより細心の注意をはらってみてください。普段は何気なくしていることや話していることも、少し意識を傾けるだけで、意外に効果はあるものです。\n\n【💼 ビジネスでの活かし方（未来編・年単位）】\n現象：ガタガタ\nキーワード：協調・調和・再考・管理・コラボレーション\n・予算・数字の見直し\n・協調性・チームワークを意識する\n・社内外の信頼関係を重視" },
        ] },
        { head: "🌿 成長期 ── 焦燥（1）・調整（4）｜伝達本能", body: "五本能では「伝達本能」（火）にあたる時期（レールでいうボケ・ツッコミ）。目に見える成長と、見えない根っこの成長、両方が起きます。", children: [
            { head: "調整（リズム4）── 「転ばぬ先の杖」人気上昇・チャンスの無風期", body: "【実践のコツ】\n・つるが伸びる、つぼみがついて見えてくるイメージ。\n・「無風」の時期：可もなく不可もなく＝良い状態。みんなが合わせてくれる時期。\n・仕事とプライベートのバランスを意識すること。\n・SNSの投稿はこの日にすると見てもらいやすい。\n・モテ期。夏の恋が起きやすい。自慢話が自慢に聞こえない。\n・チャンス期。楽しんでいる姿がステキに見える。宝くじが当たりやすい。\n\n【キーワード】\n積極性、余裕を持った行動、人気上昇、広告宣伝、バランス感覚、プロモーション、利益。積極的、ゆったり、趣味を持つ、レジャー、お金が回る、遊びの出費がかさむ、遊泳注意、将来への展望、開放感、落とし穴、広告・宣伝は◎。\n\n【年のリズム】今年のテーマ 「転ばぬ先の杖」\n精神的にも安定しており、心に余裕があるので将来への見通しも明るいトキです。車も故障してから修理すると高くつくものです。調子の良い今だからこそボンネットを開けて定期点検をする、そんなイメージです。意外と気がつかなかったところが壊れていたり、部品の交換が必要だったり、気がつかずに乗っていたら高い修理代を払わなければならないところ、定期点検で大事故にならないよう普段から気をつけましょう。煩わしい人間関係から解放され、スムーズに物事が進みますが、気を引き締めていないとついつい怠惰な生活を送りやすく、思わぬミスをおこしてしまいます。体調もよく、取引先との関係も良好で気分はウキウキですが、新しい事を始めるよりも安定と家庭を重視して家庭サービスを意識するトキです。\n\n【なぜそうなるの？】\n調整のリズムは、社交の範囲は広がりながらも、自分ひとりの世界での楽しみを作り出すという特徴を持っています。その人本来の持つムードや雰囲気が醸しだされる為、周囲から見れば大きく変化したように見られます。名誉や地位よりも経済力が先行するので、新たな事業が発展したり、個人的にもお金回りが目に見えて良くなっていくのもこの時期の特徴です。\n\n【月のリズム】\n精神的にも安定しており、心に余裕があるので将来への見通しも明るいトキです。煩わしい人間関係から解放されます。これまでの努力が実って、みごとに大輪の花を咲かせるトキです。\n💡 人気の高まるトキですので、自らが広告になって活動してください。ただし、気持ちの緩みが出てくる月なのでうっかりミスには注意しましょう。\n\n【日のリズム】キーワード：積極性、余裕を持った行動、人気上昇\n普段なら何気なく見過ごしてしまうことでも、興味を持って見て下さい。新たな思いがけないことに出会える日かもしれません。\n💡 あなたの興味を示す意思が、きっと新しい発見やよい方向へいざなってくれることでしょう。\n\n【💼 ビジネスでの活かし方（未来編・年単位）】\n現象：ウッカリ\nキーワード：安定・需要・企画・人望・プロモーション\n・顧客を広げる手を打つ\n・商品・企業の認知度を上げる\n・新たなアプローチ・新分野へ開拓" },
            { head: "焦燥（リズム1）── 「笑う門には福来たる」脱皮と変革のトキ", body: "【実践のコツ】\n・根っこが成長する時期（人に見えない成長）。ちょっとしんどい。喜怒哀楽の全部が出る。\n・理想と現実のギャップに苦しんでイライラする。サナギが蝶になるイメージ（一旦カラダをドロドロにするような変革）。\n・精神の成長、パラレルチェンジ。月タイプは脱皮しにくく、自分勝手になれない。\n・クジや運試しは「口数6」とかピンと来るものが良い。\n・ケンカではなく、自然と環境が変わっていく。周りの言葉が「トゲがあって」聞こえがち。\n・モヤっとして動かない人は変われない。「ここが自分の場所じゃない」と感じたら、問題から目をそむけないこと。\n\n【キーワード】\n殻を破る、口先よりも実行、縁が切れる、直感重視、自己成長、スピード重視、自発性。苦労、一大事、調和を意識、万事休す、退職、別離・縁が切れる、脱皮、大胆、変わる、イライラ感、孤独、精神不安定、才能開花。\n\n【年のリズム】今年のテーマ 「笑う門には福来たる」\n今まで自分を縛り付けていた環境から力づくで脱皮し、大胆に行動する事で成功の可能性があるトキです。まさに発芽した芽が養分を十分に吸い取ってどんどん成長していくようなイメージです。急成長する植物は、他人の事に気を配る余裕は無く、茎も窮屈になっていますので、ちょっとした事でも気になったり、イライラしたり、我慢出来なくなっています。そのせいで、人間関係でわずらう事が多く、トラブルが避けられなくなってしまいます。このトキは常におおらかな気持ちで人と接する様に心がけ、この人はと思う人は必ず味方にしておいてください。トラブルを回避してくれる貴重な存在となるでしょう。\n\n【なぜそうなるの？】\n焦燥のリズムは、物事を単純に考えることが難しく、複雑な思考を作り出すので、他人に理解されることが少なく、孤独を感じる傾向が高くなります。深く思いつめる面と直感のみに頼る安易な面の2面性が現れます。他人の意見に惑わされやすく迷いが起こりやすく、目上に振り回される傾向があるため、環境を変えて新たな世界で自分を磨くことがここでいう処世術になります。\n\n【月のリズム】\n今まで自分を縛り付けていた環境から力づくで脱皮し、大胆に行動することで成功の可能性があるトキです。\n💡 口は災いのもと、全ての人に対して寛容な心を持ちましょう。感性が研ぎ澄まされる分イライラしがちですので、今月いっぱいは常に『笑顔』を意識してください。\n\n【日のリズム】キーワード：殻を破る、口先より実行、縁が切れる\n精神的にも不安定で気分も優れない一日となりそうです。\n💡 今日の予定を再確認して下さい。大事な予定があるのであれば、気分の一新をはかる努力をしてからにしましょう。\n\n【💼 ビジネスでの活かし方（未来編・年単位）】\n現象：イライラ\nキーワード：上昇・成長・直感・感性・ブレークスルー\n・確実よりもスピードを意識する\n・人材管理・確保の徹底\n・安定よりも成長を優先させる" },
        ] },
        { head: "🌸 開花期 ── 投資（8）・成果（9）｜魅力本能", body: "五本能では「魅力本能」（土）にあたる時期。人が集まり、努力が形になっていきます。", children: [
            { head: "投資（リズム8）── 「金は天下のまわりもの」人脈が広がるトキ", body: "【実践のコツ】\n・どんどんつぼみをつける時期。結果は次のリズム（成果）で出る。＋ヒューマニティを意識。\n・どんな人に出会いたいか明確化すること。「会えない人はいない」ほどのチャンス。\n・モノ、土地、場所への投資が良い。人が情報を教えてくれたり、運んできてくれたりする。\n・人脈の質がUPする。お金をかけてでも会いに行くべき。\n・やみくもに動くのはNG。目的は明確に。いろんな人を巻き込んで、つなげて循環させる。\n・新しい人脈を作りたいなら、「投資のリズム」の人と一緒にいると良い。\n\n【キーワード】\n人脈を広げる、一歩前進、情報を活用、期待と行動、奉仕精神、お金と時間を投資する。一歩前進、期待感、不動産購入、財運もしくは愛情運に恵まれる、新しい出会い、前向き、成就、人が集まる、社会的、情報活用、奉仕活動。\n\n【年のリズム】今年のテーマ 「金は天下のまわりもの」\n自分から積極的に働きかけて物事が成就するトキです。花見に沢山の人が自然に集まっています。お酒をふるまい、盛り上がっている、そんなイメージです。このトキの人間関係は極めて良好で、今まで考えられなかったような人たちとの出会いがあります。この新しい出会いが今後のあなたに大きく関わってきます。他人に対する奉仕活動も多くなりますが、必ず自分に戻ってきますので投資のつもりで心から支援してあげて下さい。お金が入ってくる可能性もありますが、出て行くトキでもあるので、貯めるよりは投資に回して下さい。目の前の好機を逃さない様に常に外に向け、情報に耳を傾けて下さい。\n\n【なぜそうなるの？】\n投資のリズムは、本人は冷静でありながらも環境に動きがあります。意図しないところで自分の役割が大きくなったり、持ち上げられたりします。本人の力量とは関係なく指導的な立場に立ったり、人と人との調整役として動くこともあります。流動や回転財という考え方から、大きく入れば大きく出ていき、それが大きな発展となりますが、出会いと別れが同時に現れる傾向も考えられます。\n\n【月のリズム】\n自分から積極的に働きかけて物事が成就するトキです。この新しい出会いが今後のあなたに大きく関わってきます。\n💡 経費より売上重視の考えを持ち、攻めの姿勢が必要です。新しい人たちとの出会いを期待できる月でもあります。どこにでも率先して顔をだしましょう。\n\n【日のリズム】キーワード：人脈を広げる、一歩前進、情報を活用\n今日は新しい出会いがあるかもしれません。出会いが大事なこともあります。\n💡 意識しているかどうかは重要なポイントとなるでしょう。\n\n【💼 ビジネスでの活かし方（未来編・年単位）】\n現象：ドキドキ\nキーワード：奉仕・出入・流動・社交・ネットワーク\n・人脈レベルをアップ\n・社会的役割・貢献を考える\n・企業資産の拡大を積極的に行う" },
            { head: "成果（リズム9）── 「出すぎた杭は打たれない」努力が実るトキ", body: "【実践のコツ】\n・お花畑がいっぱいに広がるイメージ。\n・リアリティ＝コツコツやることが大切。\n・実現しやすいが、前半はしんどいと感じることも。後半にしっかり結果が出て、波紋が広がる感じになる。\n・目標を3つくらいに絞る。小さい目標でOK。\n\n【キーワード】\n実現、仕上げ、利益重視、着実な思考、継続性、順風満帆、ビジネスモデルの確定。商談日、努力結実、バリバリ、結婚のチャンス、仕上げ・完成、絶頂感、思わぬ収入、財産的援助の可能性。\n\n【年のリズム】今年のテーマ 「出すぎた杭は打たれない」\n全ての物事が順調に発展するトキで、上司・部下・同僚とうまくいっている最高のトキです。苦労が実って見事に大輪の花を咲かせ、人々の賞賛を浴びている、そんなイメージです。このトキは積極的な行動に出て、無理をしてでも自分を押し出して良いのです。脂がのりきった状態で、あなた自身も生き生きと輝いています。\n\n【なぜそうなるの？】\n成果のリズムは、急激な変動はなく、基礎となるものから考えられる発展が大きく期待できる流れになります。人を引き付ける力が強くなるため、財力も強くなると考えられています。対人関係においては浅く広いものになりますが、自分を理解してくれる相手とこの時期に出会うことが出来れば、同性・異性問わず、一生涯通じての理解者となるはずです。\n\n【月のリズム】\n全ての物事が順調に発展するトキで、上司・部下・同僚とうまくやっていける最高のトキです。これまでの努力が実って、みごとに大輪の花を咲かせるトキです。\n💡 字のごとく成果の上がるトキですので、人の10倍・20倍がんばってください。『立ち止まらずに前進あるのみ』といった気持ちで今月を過ごしてください。\n\n【日のリズム】キーワード：実現、仕上げ、利益重視\n何事も詰めは大事です。今日はその最後の詰めまできっちりと運ぶ日ともいえます。\n💡 今日は仕上げまでうまくいくことになるでしょう。自信を持って下さい。\n\n【💼 ビジネスでの活かし方（未来編・年単位）】\n現象：ワクワク\nキーワード：収穫・資産・固定・利益・ビジネスモデル\n・収益性を重点に置いた事業戦略\n・全ての事業の効率を考える\n・着実に継続させることを優先する" },
        ] },
        { head: "🌾 収穫期 ── 転換（7）・完結（10）｜攻撃本能", body: "五本能では「攻撃本能」（金）にあたる時期。前のめりのチャンス期。たたこう、チャレンジしよう。", children: [
            { head: "転換（リズム7）── 「変身願望」チャンス・チェンジ・チャレンジ", body: "【実践のコツ】\n・ワイルドなエネルギー。チャンス・チェンジ・チャレンジの時期。\n・ただし転職・引越しは注意が必要。このリズムに入る「前」から考えて準備していた事なら実行してOK。\n・浮気心が出やすい時期（一回でスパッと切り替えられるもの、パートナーチェンジなど）。\n・筋トレを始めたりするのに良い。\n・情報が多く入る時期なので、優先順位は3つくらいに絞ること。\n\n【キーワード】\n変化を楽しむ、チャレンジ、行動範囲を広げる、拡大と展開、ビジネス優先、激動と摩擦。不安定、疑心暗鬼、諦め、隣の芝生が青く見える、油断大敵、足を引っ張られる、自分の目で耳で確かめる。\n\n【年のリズム】今年のテーマ 「変身願望」or「天使の誘惑」\nとにかく動きの激しいトキで、新規事業に取り組むと良いでしょう。収穫期を迎え、気持ちは既に次の作物や今後どう生きるかといった問題にとらわれている、そのようなイメージです。今の方針をかえて転職や家の新築など、自分を取り巻く環境から飛び出したいトキで、自然と目が外に向きがちです。これまで気にならなかった色々なことが耐え難く感じられ、いつもと違った自分に憧れたり、周囲との関係で対立や摩擦を生んだりします。激しい動きに対応して出費も多くなりがちですが、気も大きくなっているので注意して下さい。\n\n【なぜそうなるの？】\n転換のリズムは、強すぎる前進力から、目に見えないところで他人から批判を受けることがあります。この時期特有の高い行動力が終盤になるほど、高い次元の人から評価を受けます。四方八方に意識が分散され、行動も分散されやすいのですが、最終的に一つの線に結びつき、一つの目的に全て集約され、目標そのものが単純化されていきます。経済面よりプロセスが先行されます。\n\n【月のリズム】\nとにかく動きの激しいトキで、新規事業に取り組む時でしょう。収穫期を迎え、気持ちは既に次の作物や今後どう生きるかを考える、そんなイメージです。\n💡 意外な方向性や方法論、打開策が出てきます。やるべきこと、やりたいことを区別した優先順位を付けて行動しましょう。目が外に向きがちなので常に足元を見るように心がけましょう。\n\n【日のリズム】キーワード：変化を楽しむ、チャレンジ、行動範囲を広げる\n今日は自分でも驚くくらいの変化を、自分自身に感じる日かもしれません。\n💡 自分の中の変化を素直に受け止め、正直に表現してみてはいかがでしょう。\n\n【💼 ビジネスでの活かし方（未来編・年単位）】\n現象：イケイケ\nキーワード：変動・展開・拡大・挑戦・プライオリティー\n・可能性を考えそれを優先する\n・新分野・新戦略の立案・実行\n・キャパシティーを広げる時期" },
            { head: "完結（リズム10）── 「天下泰平」集大成と長期プランのトキ", body: "【実践のコツ】\n・エリートのエネルギー。一番良い時期。\n・このリズムの間に「次（のサイクル）」のことを考えておく。5年、10年先の長期プランをたくさん立てておくこと。\n・何か役（ポジション）を渡された時は、引き受けた方が良い。責任は自ら取りに行くこと。\n・お金よりも「量より質」を重視。\n・頑張ってきた人には「集大成」となるが、頑張ってこなかった人には「責任（ツケ）」が回ってくる。\n\n【キーワード】\n強気な攻め、責任から逃げない、名誉と名声、完成、安定感、全体のバランスを意識。強気、多忙、周囲から認められる、結果、ご縁、長期計画、財運上昇、再び結婚のチャンス、抜擢。\n\n【年のリズム】今年のテーマ 「天下泰平」\n何事においても、正確で正しく清い判断ができるトキです。豊作で沢山の収穫物に囲まれて人々も自然と集まってくるような、そんなイメージです。出世や栄転、新しいビジネスチャンスとの出会いがあり、社会的に発展すると同時に金銭面でも恵まれ申し分ありません。この収穫期には沢山の人が集まって来て、人気が高まるトキですが、次の開墾期が待っていますので、うかれてばかりはいられません。5年、10年先を見越した長期計画を是非立てて下さい。最も安定したトキです。\n\n【なぜそうなるの？】\n完結のリズムは、物事が一つ一つ静かに実現していくトキです。実よりも名が先行するため、精神的に複雑となる傾向があります。実よりも名をとる方が的確で早く、内容よりも外側の器を作る方が容易です。その為か目上の引き立ては大きく、自分自身の努力よりも他人から育てられることが先行されます。完結のリズムは前半どんなにうまくいかなくても、後半になれば幸運が向いてきます。\n\n【月のリズム】\n何事においても、正確で正しく清い判断ができるトキです。これまでの努力が実って、みごとに大輪の花を咲かせるトキです。\n💡 今月をゴールまたはスタートとして、完成を意識した計画を立ててください。目上の人からの引き上げや第三者に育てられることによって力を発揮するトキです。\n\n【日のリズム】キーワード：強気な攻め、責任から逃げない、名誉と名声\n将来における展望など、長い目でみた計画を立てるには、大変よい日といえるでしょう。\n💡 何がしたい、これがやりたい、というような漠然としたものではなく、自分の考えを十分落とし込み将来を考えてみて下さい。考える姿勢から、意欲がうちから湧いてくるものです。その意欲が現実への早道になるものです。\n\n【💼 ビジネスでの活かし方（未来編・年単位）】\n現象：ドッシリ\nキーワード：発展・責任・完成・組織・ビジョン\n・中長期の事業ビジョンを立てる\n・安定した体制・組織風土作り\n・企業の活性化を図る時期" },
        ] },
        { head: "🚜 開墾期 ── 整理（3）・学習（6）｜習得本能", body: "五本能では「習得本能」（水）にあたる時期。何もない畑を耕すトキで、まだ収穫しようとすると苦労します。「切り替え」がめちゃくちゃ大事な時期です。", children: [
            { head: "整理（リズム3）── 「整理整頓」断捨離とメモのトキ", body: "【実践のコツ】\n・完結（10）から整理（3）になるので、これからは「選択（断捨離）」していく。タスクの数を減らすこと。\n・ペンとメモ！とにかく何でもメモを取ること。\n・「人の整理（人間関係の整理）」になる。\n・新しく勉強したり、年下の意見を聞くと良いアイデアが生まれる。年下の人たちが口を揃えて言うことの中に「進化のポイント」がある。\n・完結のリズムの時にちゃんと計画をやっておかないと、この時期にバタバタする。\n・ユニークさが出る、土づくりの時期。\n\n【キーワード】\n強引な意思決定をしない、アイデア、価値観の変化、情報収集、自ら行動、改革と自由。迷い、曖昧、生活環境が変化、身内のトラブル、優柔不断、引っ込み思案、仲間の援助、自然消滅、悶々。\n\n【年のリズム】今年のテーマ 「整理整頓」\n物事の判断基準があいまいになり、気分的にもスッキリしないトキです。広大な大地を目の前にして、何から手をつけてよいのか迷っているようなイメージです。このトキは、決して慌てたり、焦ったりしてはいけません。動きまわるトキではないのです。ただ、発想は豊かになるので、いろいろと考えをめぐらすことはよいでしょう。それも目先のことではなく、長期的にプラス思考で独自の世界に思いを馳せて下さい。じっくりと腰を据えて自らの大地を耕すのです。労働の後は休憩を取り、エネルギーをたくわえて下さい。\n\n【なぜそうなるの？】\n整理のリズムは、思考と行動のバランスが悪くなり、自分自身でまとめることのできない行動を起こす可能性があります。目標を持たない人がこのリズムに入ると、自己反乱や動乱を自ら招いてしまいます。目標を持った人の行動力と静かな沈黙が、全ての事象を良好な方向へと導いていきます。自己の心の中を表現するのではなく、不言実行こそ、このリズムに合った処世術なのです。\n\n【月のリズム】\n物事の判断基準があいまいになり、気分的にもスッキリしないトキです。何から手をつけたらよいのか迷っているようなイメージです。\n💡 自身の考えも行動もまとまらない月です。投げやりになるのではなく一つ一つ整理していくことが大切。頭に浮かんだことは常にメモをするぐらいの慎重さが必要です。\n\n【日のリズム】キーワード：強引な意思決定をしない、アイデア、価値観を変化\n身体は疲れ気味ですが、頭はさえている日です。\n💡 ほんのちょっとしたアイデアやひらめきが、何かのきっかけで出てくるでしょう。焦らず黙々と温めながらすすめる事が大切です。\n\n【💼 ビジネスでの活かし方（未来編・年単位）】\n現象：アタフタ\nキーワード：変化・開発・進化・独創・クリエイティブ\n・次なる事業の準備・計画を図る\n・自社・商品の強みを徹底分析\n・発想・アイデアを書面化する" },
            { head: "学習（リズム6）── 「螢雪時代」吸収力が最強のトキ", body: "【実践のコツ】\n・「何を学ぶか」が極めて重要（この10年を反省して見直す。自分の不足している所を素直に受け入れて学ぶこと）。\n・吸収力がものすごく高いトキ。凄い（優秀な）人と一緒にいると、その人のスキルを「完コピ」できる。\n・ロジックの時期。\n・学ぶこと、一区切り終わらせることが大切。\n\n【キーワード】\n方向性を作る、決断する、過去の反省、未来の創造、勉強する、冷静な判断、理念重視。冷静沈着、視野良好、結論が出る、白黒ハッキリ、勤勉、頭脳明晰、吸収、教訓を生かす、出産のチャンス、好評価。\n\n【年のリズム】今年のテーマ 「螢雪（けいせつ）時代」\n今までスッキリしなかった頭が、霧が晴れたように明晰になり、心身ともに明るいトキです。広大な大地を一生懸命耕しながら、将来の実りに期待を込めて準備を開始しているというイメージです。何事も吸収し、学ぶという姿勢を大切にして努力しましょう。その姿勢は周囲から尊敬され、努力はやがて社会的に認められ報われます。ただ、今までの自分のあり方や仕事の進め方、人との接し方を振り返って大いに反省し、改めるべきところは改めて、自己の成長につなげて欲しいものです。そのためにも、将来事業や新規開拓に目を向けるのではなく、反省を生かしての準備期間であると言い聞かせることです。\n\n【なぜそうなるの？】\n学習のリズムは、自己の能力が一時上昇するときであり、そのことで周りの者たちとの間に大きな隙間ができるのです。特に自己の能力を認める人たちとの出会いもある時で、喜びと悲しみが混在する時でもあります。その為、敗北感、精神的な落ち込みを感じるのですが、その中から生まれるものは大きく発展していく才能なのです。集団より単独がよく、人を感化していく力を発揮出来ます。\n\n【月のリズム】\n今までスッキリしなかった頭が、霧が晴れたように明晰になり、心身ともに明るいトキです。\n💡 行動が鈍ったら本からの情報や、人と会って学ぶという姿勢を作る月です。いろんな意味で白黒ハッキリ結論が出るときでもありますが、行動力が鈍りやすいので知識を吸収する時間も作り、行動力に磨きをかけましょう。\n\n【日のリズム】キーワード：方向性を作る、決断をする、過去の反省\n自分にとっては過大なくらいの評価を周囲から受けるかもしれません。努力をしていたことは必ず認められるものです。\n💡 世間は見ていないようで、見ているものです。謙虚にして素直に喜んで下さい。\n\n【💼 ビジネスでの活かし方（未来編・年単位）】\n現象：キッパリ\nキーワード：反省・研究・結果・決断・シンパシー\n・事業の見直し・修正を図る\n・過去の整理と決断\n・人材育成を考えた研修の企画" },
        ] },
      ]
    },
    {
      icon: "🛤️", menu: "10レール", title: "10レール ── 生き方・仕事のスタイル",
      intro: "診断カードに出てくる「マイウェイ（劫財）」などのレールの解説です。まず「レールってなに？」を読んでから、5つの本能ペアを開いてください。",
      items: [
        { type: "info", head: "レールってなに？", body: "レールは、命式（月柱の蔵干と日干の関係）から出す「その人の生き方・仕事のスタイル」です。診断カードに「マイウェイ（劫財）」のように表示されているのがレールです。\n\n10種類あり、五本能（守備・伝達・魅力・攻撃・習得）×陰陽のペアで5組に分かれます。能力のa〜jとも1対1で対応しています（a=マイペース、b=マイウェイ…j=ロジック）。\n\nそれぞれのレールには「うまくいっている人」と「うまくいっていない人」のサインがあります。自分が今どちらに乗っているかをチェックして、【レールを活かすには】の3か条を実践するのがおすすめです。" },
        { head: "🌳 守備本能の2レール ── マイペース（陽）・マイウェイ（陰）", body: "木のエネルギー「守備本能」から生まれる2つのレール。同じ守る力でも、陽のマイペースは「個・垂直」で、陰のマイウェイは「集団・水平」で発揮します。", children: [
            { head: "マイペース（a）── マイペースでぶれない生一本な独立型", body: "称号「生一本（きいっぽん）」／エネルギー：大樹T＋・実行力\n\n【どんなレール？】\n・守備本能のレール。人間関係は狭くて深い。「この人」って決めた人が大事。\n・「個」で「垂直」に伸びるタイプ。指示されたくない。組織より個。\n・会社にいる場合は「独立するまでの学び」か「自分のポジション確立」のどちらか。\n\n【キーワード】\n生一本、やりきる、マイペース／独力、好き嫌い、努力家／自我心、頑固、全力／信念、自立、一貫\n\n【有名人の例】\nトランプ\n\n⭕ うまくいっている人\nよきライバルを作り向上心を持って、努力を怠らない。周りやほかのことにとらわれず、自分のポジションを認識している。\n\n⚠️ うまくいっていない人\n人の気持ちが理解できず、主観との摩擦が生じている。他人に完璧を求めすぎている。謝れない。\n\n【レールを活かすには】\n1. 我を通しすぎていたら、まずは受け入れる気持ちを持つ\n2. 集団や組織に身を置く場合、その中に「個」の環境を作る\n3. やる気がなくなったら、少し離れて客観的に見る" },
            { head: "マイウェイ（b）── ひとあたりソフトで社交的な頑張り屋さん", body: "称号「頑張り屋さん」／エネルギー：草花T－・計画力\n\n【どんなレール？】\n・守備本能のレール。「集団」「平和」の水平思考。ぱっと見は頑固に見えない。\n・交渉力とリーダーシップがある。みんなで何かができる政治力タイプ。\n・聞き入れるけど……（傾聴はするが、芯は曲げない）。\n\n【キーワード】\n社交性、和合、宗教心／頑張り、ソフト、政治力／対等、駆け引き、協調／笑顔、丁寧、傾聴\n\n【有名人の例】\n三木谷浩史、渋沢栄一、ローラ、アパ社長、池上彰、安倍晋三\n\n⭕ うまくいっている人\n駆け引きがさえている。助言に対して素直に受け入れることができる。説得力に魅力がある（腑に落ちる）。\n\n⚠️ うまくいっていない人\n感情的。自分の考えが最も正しいと思い込みが強くなる。イエスマンばかりをそばに置く（根が強いので、悪いところが出ると、自分の敵を極端におきたがらない）。\n\n【レールを活かすには】\n1. 外の評価が高い時こそ、身内への配慮をわすれない\n2. 仲間を作って組織を立ち上げトップに躍り出た際は、清濁併せ呑む覚悟を持つ\n3. 我慢をする傾向があるので、オンオフができる場所を持つ" },
        ] },
        { head: "🔥 伝達本能の2レール ── ピース（陽）・ロマン（陰）", body: "火のエネルギー「伝達本能」から生まれる2つのレール。陽のピースはおおらかな自然体、陰のロマンは鋭い感性の職人肌です。", children: [
            { head: "ピース（c）── おおらかでのんびり自然体の平和主義", body: "称号「おおらかで勝気」／エネルギー：太陽F＋・判断力\n\n【どんなレール？】\n・伝達本能のレール。ムダが少なく、自分の好きなことをしたいから、タイムマネジメント力がある。\n・問題のスルー力がある。遊びを入れながらやるのが良い。緊張しない。\n・おじゃる丸のイメージ。\n\n【キーワード】\n呑気、自然、道楽／勝気（はっきり伝える）、平和、趣味／のんびり、味覚、おおらか／満足、健康、安心\n\n【有名人の例】\n所ジョージ、テリー伊藤、マイケル・ジャクソン、マーク・ザッカーバーグ、バリの兄貴\n\n⭕ うまくいっている人\n自分に合った環境にしようと、周りを整えだす。他人への慈悲の思いが強く出る。時間を大切にしている。\n\n⚠️ うまくいっていない人\n自分が思っていることができなくなる。自分の利益を優先しすぎて単独行動が出る。自分の都合の良い話しかしない。\n\n【レールを活かすには】\n1. おおらかでのんびりした中でも、節目ごとの目標設定をする習慣を身に着ける\n2. 決められることに抵抗があるが、その中で自分なりの工夫ができることを見つける\n3. 自分でうまく事を運べない場合は、良いパートナーに託すことで解決する" },
            { head: "ロマン（d）── デリケートで鋭い感性を持つロマンチスト", body: "称号「プライド高き知性人」／エネルギー：灯火F－・表現力\n\n【どんなレール？】\n・伝達本能のレール。脚本家・技術屋さん・職人タイプで、ちょっと恥ずかしがりや。\n・口八丁手八丁。歌・ダンスなどレベルの高いものが上手く、センスがある。\n・嫌な場所は避ける。いつめん（いつものメンバー）が好きで、新規が多い場は苦手。\n\n【キーワード】\n芸術、斬新、神経質／デリケート、直感（勘がするどい）、感受性／冷静、反発、孤独／専門職（口達者）、敏感（勘がさえてる）、文化（あまのじゃく）\n\n【有名人の例】\nエジソン、手塚治虫、相田みつを、武田双雲、イーロン・マスク、ジェフ・ベゾス、安田隆夫（ドン・キホーテ）、本田健、カーブス創業者、藤子・F・不二雄（ファンタジー）\n\n⭕ うまくいっている人\n勘がさえている。気持ちを大切にしている。細かいことまで、俊敏にこなす。\n\n⚠️ うまくいっていない人\n神経質になり、強い頑固さが出る。身内に対して攻撃的。外には平和だけれど、内になると厳しくなる。\n\n【レールを活かすには】\n1. 不平不満が頂点に達した時こそ、心のゆとりを持つ\n2. 人と距離を置き精神のバランスを保つため、孤独の時間を持つ\n3. 失敗をばねにし、向上心を持って進んでいく\n\n💡 ロマンの人へのお願い：「ついでに」は嫌い。" },
        ] },
        { head: "⛰️ 魅力本能の2レール ── ヒューマニティ（陽）・リアリティ（陰）", body: "土のエネルギー「魅力本能」から生まれる2つのレール。陽のヒューマニティは華やかにお金を回し、陰のリアリティはコツコツ蓄えます。どちらもお金に縁のあるチームです。", children: [
            { head: "ヒューマニティ（e）── 義理人情に厚い愛情豊かな現実人間", body: "称号「多趣味な親分肌」／エネルギー：山岳E＋・包容力\n\n【どんなレール？】\n・魅力本能のレール。お金に困らないチーム。華やかな魅力があり、恋愛体質。\n・クライアントの窓口・秘書のような、自己犠牲的なサポートが得意。\n・回転財（A→B→Cとお金を回す）。自分が満ちたら人にあげる。そのぶん感謝がほしい・メリットがほしい（家族に「ありがとう」って言われないと離婚を考えるレベル）。\n\n【キーワード】\n親分肌、義理人情、奉仕／多趣味、世話好き、回転財／善良、愛情、献身／現実、感謝、充実\n\n【有名人の例】\n明石家さんま、ビートたけし、有吉弘行、浜崎あゆみ、田中実（カカクコム）、ラリー・ペイジ（Google）、広末涼子\n\n⭕ うまくいっている人\n周りに不快感を与えないよう意識する。期待されるそれ以上に応えようとする。他者を優先する。\n\n⚠️ うまくいっていない人\n評価が低いと不満を覚え、感情的になる。愛情を独占しがち。周りの機嫌を伺いながら行動しすぎて意思決定ができなくなる。\n\n【レールを活かすには】\n1. 小さな親切が大きなお世話になる可能性があるので、相手が必要としている範囲内で手助けをする\n2. 愛情とお金のバランスを取り、モラルをもって取り組むこと\n3. どんなピンチでもたくましく乗り越えられる自分を信じる" },
            { head: "リアリティ（f）── 家庭的で用心深い現実的な真面目人間", body: "称号「真面目な正直者」／エネルギー：大地E－・計数力\n\n【どんなレール？】\n・魅力本能のレール。真面目さ・誠実さが魅力。コツコツで家が買える蓄財タイプ。\n・「何かあった時に使うため」に備える倹約家。外食は毎日いらない。人間らしさが好き。\n\n【キーワード】\n真面目、家庭的／現実的、習慣／平静、蓄財（倹約家）／常識、慎重／堅実（コツコツ）、不動産（確実性）／財産（保守的）、健全\n\n【有名人の例】\n藤子不二雄Ⓐ、森岡毅、木村清（すしざんまい）、麻生太郎、孫正義、北原照久、大谷翔平、スティーブ・バルマー（Microsoft）、野口英世\n\n⭕ うまくいっている人\n小さなことでも達成感を感じ、充実している。イメージ通り段取りよく計画を進める。夢に挑戦している。\n\n⚠️ うまくいっていない人\n自分のまじめさに呆れて疲れている。人に振り回されすぎて周囲との距離を取り始めている。目先の利益を優先している。\n\n【レールを活かすには】\n1. 蓄積することでパワーを蓄え前進できる\n2. 要領よく立ち回るのではなく、実績を積みながら補佐的な役割をする\n3. 地味で目立たない面もあるが、ぶれない芯の強さを磨いていく" },
        ] },
        { head: "⚔️ 攻撃本能の2レール ── ワイルド（陽）・エリート（陰）", body: "金のエネルギー「攻撃本能」から生まれる2つのレール。陽のワイルドはヤブを切り開く行動派、陰のエリートは枠の中で輝く優等生です。", children: [
            { head: "ワイルド（g）── 一本気で逆境に強い正義感溢れる行動派", body: "称号「知性と反逆」／エネルギー：鉱脈M＋・対話力\n\n【どんなレール？】\n・攻撃本能のレール。二番手気質の番長。一番行動する人。行動力の停止＝思考の停止。\n・会社やお店をやっている人は、早く2店・3号店を出す→小さくする、の動きが向いている。\n・M＋のイメージ：舗装された道より、ヤブをカマ持って歩く。スタバや電車が集中できる。\n\n【キーワード】\n活発、責任、正義感／正直（0か100か）、迅速、一本調子／動乱、行動力／逆境（壁がある方が伸びる）、バイタリティー／素直、実行\n\n【有名人の例】\n柳井正、アマンシオ・オルテガ、ビル・ゲイツ、似鳥昭雄、マイケル・デル、高田明（ジャパネット）、蓮舫\n\n⭕ うまくいっている人\n積極的に弱者の力になろうとする。大きな目標を掲げている。\n\n⚠️ うまくいっていない人\n誰に対しても闘争心が強い。後ろ盾を使って人を力で抑えようとする。立場にこだわるので、個人主義だけど組織も使う。失敗や敗北の結果にこだわる。\n\n【レールを活かすには】\n1. チャレンジ精神がツキを呼び、才能を開花する\n2. 誰かと争い優劣をつけるのではなく、自分との闘いに勝利していく\n3. 白黒はっきりすることは大事だが、グレーゾーンの存在も受け入れる度量を持つ" },
            { head: "エリート（h）── 幾帳面で責任感の強い信頼と気品の優等生", body: "称号「信頼と気品」／エネルギー：宝石M－・分析力\n\n【どんなレール？】\n・攻撃本能のレール。学級委員長タイプ：リーダーがいない時に活躍する。\n・枠の中で生きている→テーマは「枠を広げる」こと（枠を破らせようとしないこと）。\n・立場が大事。役回りでやる気になる→役を明確にすると頑張ってくれる。\n・自分にも厳しく他人にも厳しい。興味ないことはちゃんとしない。\n・ギリギリ星人：80点で合格なら80点でいい。余計な努力はしたくない。校則も怒られないギリを攻める。\n\n【キーワード】\n自分、管理職、地位名誉／信頼、優等生、自制心／自尊心、プライド、使命／幾帳面、正確、約束（きっちり守れる）\n\n【有名人の例】\n堀江貴文、御手洗冨士夫（Canon）、ラリー・エリソン（Oracle）、鴨頭嘉人、ウォルト・ディズニー、小田切あさぎ\n\n⭕ うまくいっている人\n期待に応えようとする。安全策を安全に進める。基本やイロハを重んじて忠実に行う。\n\n⚠️ うまくいっていない人\n本当のことを言えなくなる。突然やる気を失い消極的になる。視野が狭くなる。\n\n【レールを活かすには】\n1. 名誉や名声にとらわれず、リーダーシップをとるよりも頼れる右腕を目指す\n2. 傷つくことを恐れて自己保身から逃げ腰になりがちだが、小さな枠にとらわれずまずやってみる\n3. 冷たい印象を持たれることもあるが、これはエリートの処世術と割り切る" },
        ] },
        { head: "🌊 習得本能の2レール ── ユニーク（陽）・ロジック（陰）", body: "水のエネルギー「習得本能」から生まれる2つのレール。陽のユニークは応用力（ブロックをキレイにつなげなくても形にできる）、陰のロジックは基礎力（ブロックをキレイに積む）です。", children: [
            { head: "ユニーク（i）── 常に新しいものを創造する冒険心の強い開拓者", body: "称号「個性的な頑固者」／エネルギー：海洋W＋・応用力\n\n【どんなレール？】\n・習得本能のレール。応用力の人。器用で色んなことを形にできる。転職をいっぱいしても結果を残す。\n・ブロックをキレイにつなげなくても形にできる。今あるものをより良いものにする力。\n・執着がない。「これをやってみよう」って人が好き→5年くらい先が見えている。\n・知的好奇心と提案力。資料とかを次々変えちゃうから、シェアしてくれる。\n・オオカミ（マイペースの人）とも話が合う。\n\n【キーワード】\n創造、忍耐→頑固／爆発、個性、改革／変化、革新、非常識／多感、噴火、自由（流れは 忍耐→爆発→変化）\n\n【有名人の例】\n志村けん、マツコ・デラックス、スティーブ・ジョブズ、夏目漱石、小林一三（阪急）、ウォーレン・バフェット、稲盛和夫、苫米地英人、マイケル・ブルームバーグ\n\n⭕ うまくいっている人\nインスピレーションがさえ、意思決定が良くなる。精神的安定がある。自分のこだわりや、レールに徹している。\n\n⚠️ うまくいっていない人\n普段の生活がマンネリ化して無関心になる。精神的に疲れ、生活や考え方に活力がなくなる。人に依存する。ゆだねようとする。\n\n【レールを活かすには】\n1. 世間のルールや価値観にとらわれず、型破りな人生を送ることも受け入れる\n2. 環境を変えることが必要で、ゆっくりリフレッシュできる環境を持つ\n3. 自分を律する強い意志と、すべてを引き受ける覚悟をもって自由に生きる" },
            { head: "ロジック（j）── 温故知新で吸収力が抜群の学究人間", body: "称号「学問と知恵」／エネルギー：雨露W－・吸収力\n\n【どんなレール？】\n・習得本能のレール。W－のしずくのように、入り込むのが上手。ブロックをキレイに積む基礎力の人。\n・素直モード（学びたいとき）と頑固モード（変なスイッチが入るとイコジになる）がある。\n・すぐ即戦力。知識をいっぱい持っているので、迷ったらロジックの人から学ぶと良い。\n・アウトプットベースでインプットするのがベスト。教えるのが上手。母親との縁が深い。\n\n【キーワード】\n論理性、母性愛（甘えたい）／吸収力（あるものをそのまま伝える）、冷静／温故知新、従順、習得、知識、知性、親愛／研究、結論\n\n【有名人の例】\nイチロー、斎藤一人、大嶋啓介、タモリ、滝崎武光（キーエンス）、サム・アルトマン（OpenAI）、ジャニー喜多川、劇団ひとり\n\n⭕ うまくいっている人\n奉仕の精神が良く出ている。現状を自己責任として受け入れている。積極的に出会い、意見を交換している（人の意見を大事にする）。\n\n⚠️ うまくいっていない人\nマイナスイメージが強くなり、何事も行動しなくなる。応用が効かなくなり、すべてが後回しになってしまう。\n\n【レールを活かすには】\n1. 相手の気持ちを思いやる気配りと社交性を身につければ、鋭い観察力や論理的なことばも受け入れられる\n2. 積極的に前に出るタイプではないので、個よりも集団の中に身をおく（活かすため→目立つ・前に出される）\n3. 先達（せんだち）から受け継がれた技術やノウハウを身に着け、スキルアップしていく" },
        ] },
      ]
    },
    {
      icon: "🧭", menu: "思考の2分類", title: "思考の2分類 ── 目標指向型と状況対応型",
      intro: "「目的地から逆算する人」と「目の前の波に乗る人」。相手のタイプがわかると、人間関係の摩擦が劇的に減ります。",
      items: [
        { type: "info", head: "思考の2分類ってなに？", body: "人間の行動パターン、モチベーションの源泉、意思決定の基準を大きく2つに分けたのが「思考の2分類」です。十二運（12動物）のエネルギーの性質に基づいています。\n\n自分がどちらのタイプかを知るだけでなく、「相手がどちらのタイプか」を理解することで、ビジネス・恋愛・子育て・すべての人間関係の摩擦を劇的に減らすことができます。\n\n【分類表（自分の本質の動物で見てください）】\n🎯 目標指向型：狼（胎）・猿（長生）・虎（帝旺）・子守熊（病）・黒ひょう（冠帯）・ひつじ（墓）\n🌊 状況対応型：こじか（養）・たぬき（衰）・チータ（沐浴）・ライオン（建禄）・ゾウ（死）・ペガサス（絶）\n\n4分類との関係はシンプルで、「地球＋満月＝目標指向型」「太陽＋新月＝状況対応型」です。自分軸で目標に向かう地球と、人の輪の中で立派にふるまいたい満月は目標型。気分軸で動く太陽と、安心第一で流れに寄り添う新月は状況対応型。\n\nなお、月グループ（新月・満月）は「人軸」なので、相手に合わせる中でもう一方の顔がのぞくこともあります。境界っぽく感じる人は両方読んでみてください。" },
        { head: "🎯 目標指向型 ── 「目的地が見えないと、一歩も動きたくない」", body: "対象：狼（胎）・猿（長生）・虎（帝旺）・子守熊（病）・黒ひょう（冠帯）・ひつじ（墓）\n\n【思考のメカニズム】\n目標指向型にとって、人生や仕事は「カーナビの目的地設定」と同じです。まずゴール（目的地）が決まり、そこから逆算して最短ルート（計画）を割り出します。ゴールがない状態は、霧の中で車を走らせているような猛烈な不安やストレスを感じます。\n\n「何のためにやるのか（目的）」と「達成したらどうなるのか（報酬・結果）」が明確な時に、十二運の持つ強力な現実エネルギー（帝旺・冠帯など）が爆発的に発揮されます。\n\n【合言葉】「いつまでに？」— 期限とゴールが決まると動ける人たちです。" },
        { head: "🌊 状況対応型 ── 「先のことはわからない。だから今、ベストを尽くす」", body: "対象：こじか（養）・たぬき（衰）・チータ（沐浴）・ライオン（建禄）・ゾウ（死）・ペガサス（絶）\n\n【思考のメカニズム】\n状況対応型にとって、人生や仕事は「川下り（ラフティング）」や「積み木」と同じです。あらかじめガチガチのゴールを決めるのではなく、今目の前にある波（状況）や、手元にあるブロック（環境・人間関係）に合わせて、臨機応変にベストな形を組み立てていきます。\n\n「楽しそうなプロセス（過程）」や「その場の良い空気感」がある時に、十二運の持つ柔軟で精神性の高いエネルギー（絶・沐浴など）が引き出されます。\n\n【合言葉】「いつから始める？」— 期限で縛られるより、動き出しやすい空気と環境で力が出る人たちです。" },
        { head: "📋 10のシチュエーション徹底比較", body: "同じ場面でも、2タイプで行動がこんなに違います。相手のタイプを思い浮かべながら読むと効果バツグンです。", children: [
            { head: "① 仕事の進め方・タスク管理", body: "🎯 目標指向型【逆算管理】\n「今月末までに売上100万円」というゴールから逆算し、「今週は25万、今日は5万、そのためには3件のアポ」とブレイクダウンして動きます。想定外のタスクが割り込むと、計画が狂うため激しく消耗します。\n\n🌊 状況対応型【積み上げ管理】\n「とりあえず今日できる仕事からどんどん片付けよう」と目の前のタスクを処理していきます。その結果、月末に「気づいたら120万いってた！」となるのが理想。突発的なトラブルや急な案件変更にも「よっしゃ、任せて！」と二つ返事で柔軟に対応できます。" },
            { head: "② 旅行・休日の計画", body: "🎯 目標指向型【しおり作成派】\n「10時に新幹線、12時に予約した店でランチ、14時に観光スポット」と、事前に完璧なタイムスケジュールを組みます。定休日だったり大渋滞に巻き込まれたりすると、機嫌が悪くなりやすいです。\n\n🌊 状況対応型【ノープランぶらり旅派】\n「とりあえず京都に行こう」とだけ決めて出発。現地で看板を見つけて美味しそうな店に入ったり、天気が悪いから予定を変えて映画館に行ったり、その場の気分と直感を最大限に楽しみます。" },
            { head: "③ 買い物・ショッピング", body: "🎯 目標指向型【目的買い】\n買うものをあらかじめ決めて店に向かいます（例：「黒のVネックのTシャツを買う」）。目的のものが手に入れば、10分で買い物を終えて帰宅します。無駄なウインドウショッピングは疲れるだけと感じます。\n\n🌊 状況対応型【出逢い買い】\n「何か良いものないかな〜」とショップを巡ります。予定になかったものでも、店員さんとの会話が弾んだり、一目惚れしたりすると「これも何かの縁！」と衝動買いします。" },
            { head: "④ モチベーションの掴み方", body: "🎯 目標指向型【インセンティブと勝利】\n「このプロジェクトを成功させたら昇進できる」「ライバル他社に勝つ」「ボーナスが出る」など、明確なご褒美や競争環境があると、限界を超えて頑張ることができます。\n\n🌊 状況対応型【人間関係とプロセス】\n「みんなが喜んでくれるから」「このチームの雰囲気が好きだから」「やっていて楽しいから」が原動力。どれだけお金がもらえても、ギスギスした環境や、やっていてつまらない作業には心が動きません。" },
            { head: "⑤ 相談とコミュニケーション", body: "🎯 目標指向型【結論ファースト】\n「結論から言うと、問題は〇〇です。解決策は2つあります」という話し方を好みます。オチのない話や、ただの愚痴を延々と聞かされると「で、何が言いたいの？」「どうしたいの？」と話を遮りたくなります。\n\n🌊 状況対応型【プロセス共感】\n「今日こんなことがあってね、その時こう思ったんだよね〜」と、感情のプロセスを時系列で共有したいと考えます。結論を急かされたり、アドバイス（正論）を突っぱねられたりすると、「冷たい人」「話を聞いてくれない」と傷つきます。" },
            { head: "⑥ 子どもの勉強・教育", body: "🎯 目標指向型の子ども\n「次のテストで80点取ったら、欲しかったゲームを買ってあげる」「〇〇高校に合格しよう」など、明確な目標と報酬を設定すると、目の色を変えて机に向かいます。\n\n🌊 状況対応型の子ども\n「この理科の実験、面白そう！」「先生に褒められたから、次のページもやっちゃおう」と、興味の湧くプロセスや環境作りが大切。目標で縛り付けると、プレッシャーでやる気を失います。" },
            { head: "⑦ 人に指示・依頼をするとき", body: "🎯 目標指向型への依頼\n「今週の金曜日の17時までに、この形式でデータを20件集めてほしい」と、期限・数値・ゴールを100%明確にして伝えると、完璧に遂行します。\n\n🌊 状況対応型への依頼\n「今、こういう状況で困っててさ。手が空いた時でいいから、このデータを少し手伝ってもらえるとすごく助かるんだけど…」と、理由や背景、相手を頼りにしているニュアンスを伝えると、「よし、一肌脱ごう！」と快く動いてくれます。" },
            { head: "⑧ トラブル・ピンチへの耐性", body: "🎯 目標指向型\n事前に「リスク管理」を徹底するため、想定内のトラブルには強いですが、計画の前提がひっくり返るような想定外の事態が起きると、パニックになったり思考停止したりしやすいです。\n\n🌊 状況対応型\n事前の準備は苦手ですが、修羅場や予測不能なアクシデントが起きた瞬間に本領を発揮します。「なるようになるさ」の精神で、その場の機転（アドリブ）だけで奇跡的な切り抜け方をします。" },
            { head: "⑨ お店選び（飲食）", body: "🎯 目標指向型\n口コミサイトで評価、予算、メニューを徹底的に調べ、事前に予約をしてから店に向かいます。「ハズレを引きたくない（時間を無駄にしたくない）」という意識が強いです。\n\n🌊 状況対応型\n街を歩きながら「あ、この店なんか暖簾が味があって良さそう」「店員さんの愛想がいいからここにしよう」と、その場の直感や空気感で店に入ります。" },
            { head: "⑩ 謝罪・トラブル収束の求め方", body: "🎯 目標指向型が求める謝罪\n「何が原因で、今後どうやって再発防止（対策）をするのか」という、具体的な改善案と結果を求めます。\n\n🌊 状況対応型が求める謝罪\n「本当に申し訳ないことをした」という、誠意や反省の「態度」「気持ち」をまずは何よりも重視します。" },
        ] },
        { head: "🤝 タイプ別「取扱説明書」── NG行動と響く褒め言葉", body: "職場の部下やパートナーとの関係改善に。「これをやったら嫌われる（NG行動）」と「こう接すればうまくいく」のまとめです。\n\n━━ 🎯 目標指向型の取扱説明書 ━━\n\n【絶対NGな行動】\n・「とりあえずやってみて」と丸投げする\n・途中でコロコロ指示やゴールを変える\n・結論のないダラダラした話を続ける\n\n【響く褒め言葉】\n・「さすが、結果を出したね！」\n・「有言実行で有能だね」\n・「〇〇さんのおかげで目標達成できたよ」\n\n【伸ばすための関わり方】\n長期的なキャリアビジョンや、達成した際のリターンを明確に提示する。ライバルを設定するのも有効。\n\n━━ 🌊 状況対応型の取扱説明書 ━━\n\n【絶対NGな行動】\n・「期限とノルマ」でガチガチに縛り付ける\n・頑張った「過程」を無視して結果だけで叱る\n・「マニュアル通りにやれ」と個性を奪う\n\n【響く褒め言葉】\n・「いつも臨機応変に助けてくれてありがとう」\n・「〇〇さんがいると、現場の空気が良くなるよ」\n・「プロセスが本当に丁寧だね」\n\n【伸ばすための関わり方】\n「今、何が楽しい？」「困っていることはない？」と、こまめに声をかけ、本人が動きやすい環境を整える。" },
      ]
    },
    {
      icon: "🕰️", menu: "特性の2分類", title: "特性の2分類 ── 未来展望型と過去回想型",
      intro: "「これからの話」にワクワクする人と、「これまでの実績」を信頼する人。視点の向きの違いです。",
      items: [
        { type: "info", head: "特性の2分類ってなに？", body: "「特性の2分類」は、視点（時間のベクトル）がどこを向いているかを表す「未来展望型」と「過去回想型」の分類です。十二運が持つ「魂の年齢（エネルギーの性質）」と深く連動しています。\n\n「未来の可能性」にワクワクする人と、「過去のデータと経験」を重んじる人。この時間軸のズレを理解すると、すれ違いの理由が驚くほど明確になります。\n\n【分類表（自分の本質の動物で見てください）】\n🚀 未来展望型：狼（胎）・こじか（養）・猿（長生）・チータ（沐浴）・黒ひょう（冠帯）・ペガサス（絶）\n⏳ 過去回想型：ライオン（建禄）・虎（帝旺）・たぬき（衰）・子守熊（病）・ゾウ（死）・ひつじ（墓）\n\n🧭「思考の2分類」（目標指向／状況対応）と掛け合わせて読むと、その人の考え方がさらに立体的にわかります。" },
        { head: "🚀 未来展望型 ── 「根拠はなくても、これから良くなる予感がする！」", body: "対象：狼（胎）・こじか（養）・猿（長生）・チータ（沐浴）・黒ひょう（冠帯）・ペガサス（絶）\n\n【思考のメカニズム】\n未来展望型に属する十二運は、「胎（胎児）」「養（赤ちゃん）」「長生（子供）」「沐浴（思春期）」「冠帯（新社会人）」といった【人生のこれからのステップ】、そして「絶（枠に囚われない魂）」のエネルギーです。\n\n視点が常に「明日」「来月」「数年後」に向いており、まだ見ぬ可能性や新しいアイデア、未開拓の分野に触れている時に最もモチベーションが高まります。過去の失敗に執着せず、切り替えが非常に早いのが特徴です。" },
        { head: "⏳ 過去回想型 ── 「過去のデータと経験こそが、最も信頼できる」", body: "対象：ライオン（建禄）・虎（帝旺）・たぬき（衰）・子守熊（病）・ゾウ（死）・ひつじ（墓）\n\n【思考のメカニズム】\n過去回想型に属する十二運は、「建禄（ベテラン）」「帝旺（社長・頂点）」「衰（隠居）」「病（病床）」「死（静止）」「墓（蔵入り）」といった、【人生の経験を十分に積んだ、あるいは形として完結していく】エネルギーです。\n\n視点のベースが「これまでどうだったか（実績・経験・歴史）」にあります。「過去に成功した確実なパターン」や「蓄積されたデータ」をもとに慎重に物事を判断するため、大崩れしない安定感を持っています。" },
        { head: "📋 10のシチュエーション徹底比較", body: "同じ場面でも、時間軸の向きでこんなに違います。", children: [
            { head: "① 新しい企画・プロジェクトの立ち上げ", body: "🚀 未来展望型【イケイケ提案】\n「これ、絶対に流行りますよ！ やってみましょう！」と、前例がなくても直感とワクワク感でスタートしようとします。リスクよりも「成功した時の明るい未来」しか見えていません。\n\n⏳ 過去回想型【堅実検証】\n「で、前例はあるの？」「過去の類似データを出して」とまず確認します。過去の失敗事例を洗い出し、リスクを徹底的に潰してからでないとGoサインを出せません。" },
            { head: "② ミス・失敗をしたときの態度", body: "🚀 未来展望型【即・切り替え】\n怒られても「次から気をつけまーす！」と一瞬で切り替えます（悪気なく、本当に忘れることも）。「終わったことをクヨクヨ悩んでも時間がもったいない」と考えます。\n\n⏳ 過去回想型【猛省・原因究明】\n「なぜあの時あの一言を言ってしまったのか…」と、過去の分岐点に戻って深く後悔し、落ち込みを引きずりやすいです。だからこそ、同じミスを繰り返さない仕組みを作れます。" },
            { head: "③ 買い物の決め手（商品選び）", body: "🚀 未来展望型【最新・トレンド買い】\n「日本初上陸！」「新発売！」「これまでにない画期的な機能！」という言葉に弱いです。まだ誰も使っていない最先端のものを手に入れることに喜びを感じます。\n\n⏳ 過去回想型【老舗・定番買い】\n「創業100年の伝統」「リピート率90%」「王道のベストセラー」を好みます。口コミを過去に遡ってしっかり読み込み、失敗しない確実な買い物を目指します。" },
            { head: "④ 会話での口癖・エピソード", body: "🚀 未来展望型\n「これから〇〇したいんだよね」「もしこうなったら面白くない？」「次はどこ行く？」など、「これからの話（ifの話）」がのべつまくなしに飛び出します。\n\n⏳ 過去回想型\n「前にもこういうことあったよね」「昔は〇〇だったなぁ」「あの時の経験が生きてる」など、「あの一件（過去の事実）」をベースに会話を展開します。" },
            { head: "⑤ 褒められて嬉しいポイント", body: "🚀 未来展望型【ポテンシャル重視】\n「将来が楽しみだね！」「大化けしそうだね」「〇〇さんには無限の可能性があるよ」と、これからの伸び代を褒められると天にも昇る気持ちになります。\n\n⏳ 過去回想型【キャリア・実績重視】\n「これまでの頑張りを見ていたよ」「〇〇さんのこれまでの実績のおかげだね」「歴史を作ってきたね」と、過去の積み重ねを認められると深く満たされます。" },
            { head: "⑥ 言い訳・自己弁護のパターン", body: "🚀 未来展望型\n「でも、次は絶対にうまくやれますから！」と、まだ見ぬ未来の約束でその場のピンチを切り抜けようとします。\n\n⏳ 過去回想型\n「だってあの時は、〇〇さんがこう言ったから…」「あの状況では仕方がなかったんです」と、過去の事実や経緯を引っ張り出して正当性を主張します。" },
            { head: "⑦ 人間関係の構築と付き合い", body: "🚀 未来展望型【新しい出会い】\n異業種交流会や新しいコミュニティなど、刺激的な出会いを好みます。付き合いが浅くても「意気投合したから親友！」となりやすいですが、疎遠になるのも早めです。\n\n⏳ 過去回想型【昔馴染みの信頼】\n幼馴染や、同じ苦労を共にした昔からの仲間を何よりも大切にします。時間をかけて信頼関係を築くため、人間関係の絆が非常に強固です。" },
            { head: "⑧ 目標設定のやり方", body: "🚀 未来展望型【ドリームマップ型】\n「フェラーリに乗る」「ハワイに移住する」など、現状を無視した大きすぎる夢を掲げることでエネルギーが湧いてきます。\n\n⏳ 過去回想型【ステップアップ型】\n「去年の売上が100万だから、今年は120万を目指そう」と、過去の基準から堅実に手の届く目標を設定します。" },
            { head: "⑨ 写真や思い出の品への執着", body: "🚀 未来展望型\n過去のアルバムや記念品、昔の恋人のプレゼントなどは「もう使わないから」とあっさり捨てられます。スマホの写真フォルダもあまり見返しません。\n\n⏳ 過去回想型\n思い出の品や写真、手紙などを大切に保管します。定期的に「あの時は楽しかったな」と思い出に浸る時間が、心のエネルギー充電になります。" },
            { head: "⑩ 人にアドバイスをするとき", body: "🚀 未来展望型\n「もっと気楽にいこうよ！」「これからいくらでもチャンスはあるって！」と、ポジティブで抽象的な未来の希望を提示します。\n\n⏳ 過去回想型\n「私の時はね、こうやって乗り越えたよ」「前例としては、こういうステップを踏むと安全だよ」と、自身の経験則に基づいた具体的なステップを教えます。" },
        ] },
        { head: "🤝 タイプ別「取扱説明書」── NG行動と響く褒め言葉", body: "━━ 🚀 未来展望型の取扱説明書 ━━\n\n【絶対NGな行動】\n・「前も失敗したでしょ」と過去を持ち出す\n・「現実を見ろ」と夢を全否定する\n・細かい過去の約束の不履行をネチネチ責める\n\n【響く褒め言葉】\n・「そのアイデア、すごく未来的でワクワクする！」\n・「センスが時代を先取りしてるね」\n・「次はどんな面白いことを企んでるの？」\n\n【伸ばすための関わり方】\n多少のミスには目をつぶり、自由に打席に立たせて「未来の可能性」に投資する姿勢を見せる。\n\n━━ ⏳ 過去回想型の取扱説明書 ━━\n\n【絶対NGな行動】\n・「根拠はないけど絶対大丈夫！」で押し切る\n・これまでの実績や経験を「古い」と一蹴する\n・事前の共有なしに、急にルールを変更する\n\n【響く褒め言葉】\n・「歴史や実績があるから本当に安心できる」\n・「〇〇さんの経験に基づいた言葉は重みが違う」\n・「これまで築いてくれた基盤のおかげです」\n\n【伸ばすための関わり方】\n新しいことを頼むときは、必ず「過去の経験のこれが活かせるよ」とブリッジ（架け橋）をかけてあげる。" },
      ]
    },
    {
      icon: "⚾", menu: "仕事の4分類", title: "仕事の役割4分類 ── 野球ポジションでわかる適性",
      intro: "ピッチャー・キャッチャー・監督・審判。自分に合ったポジションで戦うと、最小の労力で最大の成果が出ます。",
      items: [
        { type: "info", head: "仕事の役割4分類ってなに？", body: "十二運のエネルギーを、ビジネスシーンにおける「4つの役割（ポジション）」に分類したものです。野球にたとえると覚えやすくなります。\n\nどんなに優秀な人でも、自分のポジション（特性）に合わない仕事をするとパフォーマンスが半減します。逆に、この4分類をベースにチームを組むと、最小の労力で最大の成果を出す「最強の組織」が完成します。\n\n【分類表（自分の本質の動物で見てください）】\n⚾ ピッチャー（新規開拓）：猿（長生）・チータ（沐浴）・黒ひょう（冠帯）\n🫴 キャッチャー（守り・フォロー）：子守熊（病）・ゾウ（死）・ひつじ（墓）\n🧢 監督（マネジメント）：ライオン（建禄）・虎（帝旺）・たぬき（衰）\n⚖️ 審判（企画・ルール）：狼（胎）・こじか（養）・ペガサス（絶）" },
        { head: "⚾ ピッチャー（新規営業・突破型）── 猿・チータ・黒ひょう", body: "十二運：長生（猿）・沐浴（チータ）・冠帯（黒ひょう）\n核心にある心理：「自分が先陣を切って、新しいゲームをスタートさせる！」\n\n【思考のメカニズム】\nピッチャーに属する星は「子供〜新社会人」までの、これからグングン伸びていく勢いのあるエネルギーです。最大の武器は「初速」「勢い」「華やかさ」。\n\n前例のない市場を開拓したり、初対面の顧客の懐に飛び込んで契約を勝ち取ったりする「0→1（ゼロイチ）」のフェーズで無類の強さを発揮します。細かい書類仕事やルーティンワークは苦手ですが、チームに勢いをもたらすエースストライカーです。" },
        { head: "🫴 キャッチャー（ルート営業・守備型）── 子守熊・ゾウ・ひつじ", body: "十二運：病（子守熊）・死（ゾウ）・墓（ひつじ）\n核心にある心理：「確実な守りと丁寧なフォローで、ピンチを未然に防ぐ」\n\n【思考のメカニズム】\nキャッチャーに属する星は、人生の後半から完結へ向かう、非常に落ち着いたエネルギーです。最大の武器は「傾聴力」「リスク管理」「継続性」。\n\nピッチャーが取ってきた契約を、手厚いアフターフォローや顧客対応で「優良なリピーター」に育てる「1→10」のフェーズが得意です。派手さはありませんが、顧客の本音や不満をいち早く察知し、組織の解約（失点）を防ぐ、チームの文字通りの「要（かなめ）」です。" },
        { head: "🧢 監督（マネジメント・リーダー業務）── ライオン・虎・たぬき", body: "十二運：建禄（ライオン）・帝旺（虎）・衰（たぬき）\n核心にある心理：「全体のパワーバランスを見極め、組織を勝利（目標達成）に導く」\n\n【思考のメカニズム】\n監督型に属する星は、「ベテラン・社長・隠居」という、組織のトップを極めた大局的なエネルギーです。最大の武器は「責任感」「統率力」「圧倒的なオーラ」。\n\nメンバーそれぞれの個性を一歩引いた視点から観察し、誰をどこに配置すれば組織が勝てるかを戦略的に考えます。プレッシャーに強く、トラブル発生時には「俺が全責任を負う」という覚悟と器を持っているため、周囲からの信頼が非常に厚いです。" },
        { head: "⚖️ 審判（企画・ルールメイク型）── 狼・こじか・ペガサス", body: "十二運：胎（狼）・養（こじか）・絶（ペガサス）\n核心にある心理：「感情や利害から一歩引いて、公平なルールと仕組みでゲームを成立させる」\n\n【思考のメカニズム】\n審判に属する星は、「胎（まだ形のない構想）」「養（見守られて育つ中立さ）」「絶（枠の外にある魂）」という、しがらみゼロのゼロベースなエネルギーです。最大の武器は「客観性」「分析力」「企画力」。\n\nプレーヤーとして走り回るより、一歩引いた場所から全体を観察し、「そもそもどういうルール（仕組み）にすべきか」を考えるのが得意。新規事業の企画、社内ルールの策定、リサーチ、中立的な調整役など、「公平さと知性」が求められる場面で本領を発揮します。感情論に流されず、データと筋道で判断するチームの良心です。" },
        { head: "📋 10のシチュエーション徹底比較", body: "4ポジションが同じ場面でどう動くか。チームメンバーの顔を思い浮かべながらどうぞ。", children: [
            { head: "① 割り当てたい「最適な業務」", body: "⚾ ピッチャー：テレアポ、飛び込み営業、新商品のローンチ、SNSでの認知拡大、華やかなプレゼン。\n\n🫴 キャッチャー：既存顧客の定期訪問、カスタマーサポート、契約書の精査、クレーム対応、丁寧な引き継ぎ。\n\n🧢 監督：プロジェクトマネージャー、チームリーダー、予算管理、経営戦略、メンバーの評価・面談。\n\n⚖️ 審判：新規事業の企画、社内ルールの策定、コンプライアンスチェック、中立的な社内調整、監査。" },
            { head: "② モチベーションが爆上がりする瞬間", body: "⚾ ピッチャー：「新規契約が取れた！」「自分が表彰された！」「一番目立っている！」\n\n🫴 キャッチャー：「お客様から『あなたのおかげで助かった』と感謝された！」「大きなトラブルを未然に防げた！」\n\n🧢 監督：「チーム全員で大きな目標を達成した！」「部下が成長してくれた！」「組織の売上が過去最高になった！」\n\n⚖️ 審判：「自分の作った企画やシステムが完璧に稼働した！」「誰も気づかなかった問題点を見つけ出した！」" },
            { head: "③ ストレスを猛烈に感じる環境", body: "⚾ ピッチャー：毎日オフィスにこもって、同じ形式のExcelデータ入力をさせられる環境（翼を奪われた鳥になります）。\n\n🫴 キャッチャー：毎日「初めまして」の相手に、断られる前提の強引な飛び込み営業をさせられる環境（精神がすり減ります）。\n\n🧢 監督：自分の裁量権が全くなく、上からの細かい指示通りにしか動いてはいけない環境（エネルギーが腐ります）。\n\n⚖️ 審判：感情論が飛び交い、ルールや筋道が通っていない泥縄式の環境（存在意義を見失います）。" },
            { head: "④ トラブルが起きたときの初動", body: "⚾ ピッチャー：「あちゃー！…でも、なんとかなるっしょ！」と一瞬焦るものの、すぐに次のプラスの行動へ意識が向きます。\n\n🫴 キャッチャー：「大変だ、どこに原因があるんだろう…」と、すぐに顧客や現場のケア（守備）に走り、傷口を広げないようにします。\n\n🧢 監督：どっしりと構え、「よし、全員集まれ。状況を報告しろ。俺が決断する」と、全体の指揮を執ります。\n\n⚖️ 審判：「ルールブック（規約）的にはどうなっているか」「どっちにどれだけの非（データ）があるか」を客観的に精査します。" },
            { head: "⑤ 会議での立ち回り", body: "⚾ ピッチャー：「こんなことやったら面白くないですか！？」と、次々に新しくて斬新なアイデアを打ち上げます。\n\n🫴 キャッチャー：「それだと、今のリピーターのお客様が混乱しませんか？」と、現場目線のリスクや懸念点を優しく指摘します。\n\n🧢 監督：全員の意見をじっくり聞いた上で、「よし、今回はピッチャーの意見で行く。キャッチャーはフォローに回れ」と着地点を決めます。\n\n⚖️ 審判：議論がヒートアップした時に、「現在の論点は〇〇です。一度整理しましょう」と、客観的なファクトを提示して場を鎮めます。" },
            { head: "⑥ 買い物のスタイル", body: "⚾ ピッチャー：「これ、カッコいい！」「今買わなきゃ損！」と、デザインや直感で即決します。\n\n🫴 キャッチャー：保証内容やアフターサービス、他社との比較をしっかり確認し、長く使える安心なものを選びます。\n\n🧢 監督：「これは自分（または会社）のステータスに合うか」という、ブランド力や投資対効果で選びます。\n\n⚖️ 審判：スペック、成分、素材、価格の妥当性をロジカルに分析し、最もコスパが良く合理的なものを購入します。" },
            { head: "⑦ 他人から見た「第一印象」", body: "⚾ ピッチャー：明るい、元気、フットワークが軽い、スター性がある、ちょっとお調子者。\n\n🫴 キャッチャー：優しい、話しやすい、聞き上手、誠実、安心感がある、少し控えめ。\n\n🧢 監督：オーラがある、頼りになる、威厳がある、決断力がある、ちょっと怖そう。\n\n⚖️ 審判：冷静、知的、ミステリアス、ブレない、スマート、少しクール。" },
            { head: "⑧ 仕事でコンビ（ペア）を組むなら", body: "⚾×🫴 ピッチャー×キャッチャー【最強の凸凹コンビ】\nピッチャーが外でガンガン仕事を取ってきて、キャッチャーが中で完璧に回す。お互いの弱点を100%補い合える最高タッグ。\n\n🧢×⚖️ 監督×審判【王道の内閣コンビ】\n大統領（監督）と、最高裁判所（審判）の関係。監督の熱いビジョンに対して、審判が冷徹なデータでブレーキとアクセルのバランスを取る関係。" },
            { head: "⑨ チームメンバーへかける「最適な言葉」", body: "⚾ ピッチャーへ：「今回のプロジェクト、お前の爆発力が必要なんだ。頼むぞ！」（期待を乗せる）\n\n🫴 キャッチャーへ：「いつも裏で支えてくれて本当にありがとう。君がいるからみんな安心して攻められるよ」（感謝を伝える）\n\n🧢 監督へ：「さすがの決断力ですね。ついていきます！」（リーダーシップを立てる）\n\n⚖️ 審判へ：「〇〇さんの客観的なアドバイスが欲しい。どれが一番合理的だと思う？」（知性を頼る）" },
            { head: "⑩ 人生における「座右の銘」的なスタンス", body: "⚾ ピッチャー：「当たって砕けろ」「まずは行動」\n\n🫴 キャッチャー：「備えあれば憂いなし」「一期一会」\n\n🧢 監督：「俺の屍を越えてゆけ」「有言実行」\n\n⚖️ 審判：「一歩引いて大局を見る」「温故知新」" },
        ] },
        { head: "🤝 ポジション別「取扱説明書」── NG行動と響く褒め言葉", body: "━━ ⚾ ピッチャー ━━\n【絶対NGな行動】重箱の隅をつつくような細かい書類チェック／「目立つな、大人しくしろ」と枠にはめる\n【響く褒め言葉】「華があるね！」「行動力がケタ違い！」「お前にしかできない！」\n【伸ばし方】細かいミスは周囲がカバーすると割り切り、とにかく「初速」と「営業力」を活かせる前線に配置する。\n\n━━ 🫴 キャッチャー ━━\n【絶対NGな行動】「もっとガンガン新規を開拓しろ」と急かす／お客様との信頼関係を無視して利益だけ追わせる\n【響く褒め言葉】「本当に気が利くね」「〇〇さんがいると安心する」「いつも丁寧で助かる」\n【伸ばし方】サポートやルート営業など、「既存の人間関係を維持・深める」業務を任せ、プロセスをしっかり評価する。\n\n━━ 🧢 監督 ━━\n【絶対NGな行動】メンツ（プライド）を潰すような指示を出す／決定権を一切与えず、コマのように扱う\n【響く褒め言葉】「器が大きいですね」「頼りになります！」「さすがの決断力です」\n【伸ばし方】チームのリーダーや、何かしらの「役職（責任ある立場）」を与えることで、驚くほど当事者意識が芽生える。\n\n━━ ⚖️ 審判 ━━\n【絶対NGな行動】感情論や「気合い」だけで動かそうとする／ルールを無視した不公平な扱いをする\n【響く褒め言葉】「分析が完璧ですね」「目の付け所がスマート」「〇〇さんの企画はブレない」\n【伸ばし方】1つの分野を徹底的に調べ上げる「リサーチ」や、客観性が求められる「企画・仕組み作り」のポジションを任せる。" },
      ]
    },
    {
      icon: "🔗", menu: "リレーション", title: "リレーション ── 12動物の関係の順番",
      intro: "自分から見た「1〜12番目の相手」を動物ごとの図で確認できます。まず「リレーションってなに？」からどうぞ。",
      items: [
        { type: "info", head: "リレーションってなに？", body: "リレーションは、12動物どうしの「関係の順番」を表す仕組みです。自分から見て1番目〜12番目の相手が、きれいなルールで決まっています。\n\n【仕組み】\n① 12動物は「役割4グループ×3分類」の表に並んでいます。\n　⚾ピッチャー：黒ひょう(MOON)・猿(EARTH)・チータ(SUN)\n　🫴キャッチャー：ひつじ(MOON)・子守熊(EARTH)・ゾウ(SUN)\n　🧢監督：たぬき(MOON)・虎(EARTH)・ライオン(SUN)\n　⚖️審判：こじか(MOON)・狼(EARTH)・ペガサス(SUN)\n② 自分の位置から見た「自分の列・対面・同一・左」の4方向で、相手のグループが決まります。\n③ 3分類の「正（同じ）・分・逆」の組み合わせで、グループの中の誰かが決まります。\n　MOON→ 正:MOON 分:SUN 逆:EARTH ／ EARTH→ 正:EARTH 分:MOON 逆:SUN ／ SUN→ 正:SUN 分:EARTH 逆:MOON\n\n順番は「①自分の列の正（＝自分）→②分 →③対面の正→④分 →⑤同一の正→⑥分 →⑦左の正→⑧分 →⑨〜⑫各方向の逆」。1番はいつも自分自身です。\n\n下の各動物を開くと、その動物から見た1〜12番目の相手が色つきの図でわかります。役割グループの名前は「⚾仕事の4分類」と同じです。" },
        { head: "⚾ ピッチャーの3匹 ── 黒ひょう・猿・チータ", children: [
            { html: true, head: "黒ひょう（冠帯）のリレーション", body: "<div class=\"rel-grid\"><div></div><div class=\"rel-h\">自分の列<br>⚾ピッチャー</div><div class=\"rel-h\">対面<br>🧢監督</div><div class=\"rel-h\">同一<br>⚖️審判</div><div class=\"rel-h\">左<br>🫴キャッチャー</div><div class=\"rel-rh\">正</div><div class=\"rel-chip rel-self\" style=\"background:#f4c724;color:#3a3226\"><span class=\"rel-no\">1</span>黒ひょう（自分）</div><div class=\"rel-chip\" style=\"background:#2f8fe0;color:#ffffff\"><span class=\"rel-no\">3</span>たぬき</div><div class=\"rel-chip\" style=\"background:#9acd32;color:#3a3226\"><span class=\"rel-no\">5</span>こじか</div><div class=\"rel-chip\" style=\"background:#4caf50;color:#ffffff\"><span class=\"rel-no\">7</span>ひつじ</div><div class=\"rel-rh\">分</div><div class=\"rel-chip\" style=\"background:#ff5a36;color:#ffffff\"><span class=\"rel-no\">2</span>チータ</div><div class=\"rel-chip\" style=\"background:#3f51b5;color:#ffffff\"><span class=\"rel-no\">4</span>ライオン</div><div class=\"rel-chip\" style=\"background:#9b59b6;color:#ffffff\"><span class=\"rel-no\">6</span>ペガサス</div><div class=\"rel-chip\" style=\"background:#e53935;color:#ffffff\"><span class=\"rel-no\">8</span>ゾウ</div><div class=\"rel-rh\">逆</div><div class=\"rel-chip\" style=\"background:#f39c12;color:#3a3226\"><span class=\"rel-no\">9</span>猿</div><div class=\"rel-chip\" style=\"background:#12a89a;color:#ffffff\"><span class=\"rel-no\">10</span>虎</div><div class=\"rel-chip\" style=\"background:#12c2b5;color:#ffffff\"><span class=\"rel-no\">11</span>狼</div><div class=\"rel-chip\" style=\"background:#e0459b;color:#ffffff\"><span class=\"rel-no\">12</span>子守熊</div></div><div class=\"rel-note\">番号があなたから見た「1〜12番目」の相手です（1＝自分）。列は役割グループ、行は3分類の相性（正＝同じ3分類、分・逆はジャンケンのような関係）。</div><div class=\"rel-note\" style=\"margin-top:8px;\">【順番リスト】1.黒ひょう→2.チータ→3.たぬき→4.ライオン→5.こじか→6.ペガサス→7.ひつじ→8.ゾウ→9.猿→10.虎→11.狼→12.子守熊</div>" },
            { html: true, head: "猿（長生）のリレーション", body: "<div class=\"rel-grid\"><div></div><div class=\"rel-h\">自分の列<br>⚾ピッチャー</div><div class=\"rel-h\">対面<br>🧢監督</div><div class=\"rel-h\">同一<br>⚖️審判</div><div class=\"rel-h\">左<br>🫴キャッチャー</div><div class=\"rel-rh\">正</div><div class=\"rel-chip rel-self\" style=\"background:#f39c12;color:#3a3226\"><span class=\"rel-no\">1</span>猿（自分）</div><div class=\"rel-chip\" style=\"background:#12a89a;color:#ffffff\"><span class=\"rel-no\">3</span>虎</div><div class=\"rel-chip\" style=\"background:#12c2b5;color:#ffffff\"><span class=\"rel-no\">5</span>狼</div><div class=\"rel-chip\" style=\"background:#e0459b;color:#ffffff\"><span class=\"rel-no\">7</span>子守熊</div><div class=\"rel-rh\">分</div><div class=\"rel-chip\" style=\"background:#f4c724;color:#3a3226\"><span class=\"rel-no\">2</span>黒ひょう</div><div class=\"rel-chip\" style=\"background:#2f8fe0;color:#ffffff\"><span class=\"rel-no\">4</span>たぬき</div><div class=\"rel-chip\" style=\"background:#9acd32;color:#3a3226\"><span class=\"rel-no\">6</span>こじか</div><div class=\"rel-chip\" style=\"background:#4caf50;color:#ffffff\"><span class=\"rel-no\">8</span>ひつじ</div><div class=\"rel-rh\">逆</div><div class=\"rel-chip\" style=\"background:#ff5a36;color:#ffffff\"><span class=\"rel-no\">9</span>チータ</div><div class=\"rel-chip\" style=\"background:#3f51b5;color:#ffffff\"><span class=\"rel-no\">10</span>ライオン</div><div class=\"rel-chip\" style=\"background:#9b59b6;color:#ffffff\"><span class=\"rel-no\">11</span>ペガサス</div><div class=\"rel-chip\" style=\"background:#e53935;color:#ffffff\"><span class=\"rel-no\">12</span>ゾウ</div></div><div class=\"rel-note\">番号があなたから見た「1〜12番目」の相手です（1＝自分）。列は役割グループ、行は3分類の相性（正＝同じ3分類、分・逆はジャンケンのような関係）。</div><div class=\"rel-note\" style=\"margin-top:8px;\">【順番リスト】1.猿→2.黒ひょう→3.虎→4.たぬき→5.狼→6.こじか→7.子守熊→8.ひつじ→9.チータ→10.ライオン→11.ペガサス→12.ゾウ</div>" },
            { html: true, head: "チータ（沐浴）のリレーション", body: "<div class=\"rel-grid\"><div></div><div class=\"rel-h\">自分の列<br>⚾ピッチャー</div><div class=\"rel-h\">対面<br>🧢監督</div><div class=\"rel-h\">同一<br>⚖️審判</div><div class=\"rel-h\">左<br>🫴キャッチャー</div><div class=\"rel-rh\">正</div><div class=\"rel-chip rel-self\" style=\"background:#ff5a36;color:#ffffff\"><span class=\"rel-no\">1</span>チータ（自分）</div><div class=\"rel-chip\" style=\"background:#3f51b5;color:#ffffff\"><span class=\"rel-no\">3</span>ライオン</div><div class=\"rel-chip\" style=\"background:#9b59b6;color:#ffffff\"><span class=\"rel-no\">5</span>ペガサス</div><div class=\"rel-chip\" style=\"background:#e53935;color:#ffffff\"><span class=\"rel-no\">7</span>ゾウ</div><div class=\"rel-rh\">分</div><div class=\"rel-chip\" style=\"background:#f39c12;color:#3a3226\"><span class=\"rel-no\">2</span>猿</div><div class=\"rel-chip\" style=\"background:#12a89a;color:#ffffff\"><span class=\"rel-no\">4</span>虎</div><div class=\"rel-chip\" style=\"background:#12c2b5;color:#ffffff\"><span class=\"rel-no\">6</span>狼</div><div class=\"rel-chip\" style=\"background:#e0459b;color:#ffffff\"><span class=\"rel-no\">8</span>子守熊</div><div class=\"rel-rh\">逆</div><div class=\"rel-chip\" style=\"background:#f4c724;color:#3a3226\"><span class=\"rel-no\">9</span>黒ひょう</div><div class=\"rel-chip\" style=\"background:#2f8fe0;color:#ffffff\"><span class=\"rel-no\">10</span>たぬき</div><div class=\"rel-chip\" style=\"background:#9acd32;color:#3a3226\"><span class=\"rel-no\">11</span>こじか</div><div class=\"rel-chip\" style=\"background:#4caf50;color:#ffffff\"><span class=\"rel-no\">12</span>ひつじ</div></div><div class=\"rel-note\">番号があなたから見た「1〜12番目」の相手です（1＝自分）。列は役割グループ、行は3分類の相性（正＝同じ3分類、分・逆はジャンケンのような関係）。</div><div class=\"rel-note\" style=\"margin-top:8px;\">【順番リスト】1.チータ→2.猿→3.ライオン→4.虎→5.ペガサス→6.狼→7.ゾウ→8.子守熊→9.黒ひょう→10.たぬき→11.こじか→12.ひつじ</div>" },
        ] },
        { head: "🫴 キャッチャーの3匹 ── ひつじ・子守熊・ゾウ", children: [
            { html: true, head: "ひつじ（墓）のリレーション", body: "<div class=\"rel-grid\"><div></div><div class=\"rel-h\">自分の列<br>🫴キャッチャー</div><div class=\"rel-h\">対面<br>⚖️審判</div><div class=\"rel-h\">同一<br>🧢監督</div><div class=\"rel-h\">左<br>⚾ピッチャー</div><div class=\"rel-rh\">正</div><div class=\"rel-chip rel-self\" style=\"background:#4caf50;color:#ffffff\"><span class=\"rel-no\">1</span>ひつじ（自分）</div><div class=\"rel-chip\" style=\"background:#9acd32;color:#3a3226\"><span class=\"rel-no\">3</span>こじか</div><div class=\"rel-chip\" style=\"background:#2f8fe0;color:#ffffff\"><span class=\"rel-no\">5</span>たぬき</div><div class=\"rel-chip\" style=\"background:#f4c724;color:#3a3226\"><span class=\"rel-no\">7</span>黒ひょう</div><div class=\"rel-rh\">分</div><div class=\"rel-chip\" style=\"background:#e53935;color:#ffffff\"><span class=\"rel-no\">2</span>ゾウ</div><div class=\"rel-chip\" style=\"background:#9b59b6;color:#ffffff\"><span class=\"rel-no\">4</span>ペガサス</div><div class=\"rel-chip\" style=\"background:#3f51b5;color:#ffffff\"><span class=\"rel-no\">6</span>ライオン</div><div class=\"rel-chip\" style=\"background:#ff5a36;color:#ffffff\"><span class=\"rel-no\">8</span>チータ</div><div class=\"rel-rh\">逆</div><div class=\"rel-chip\" style=\"background:#e0459b;color:#ffffff\"><span class=\"rel-no\">9</span>子守熊</div><div class=\"rel-chip\" style=\"background:#12c2b5;color:#ffffff\"><span class=\"rel-no\">10</span>狼</div><div class=\"rel-chip\" style=\"background:#12a89a;color:#ffffff\"><span class=\"rel-no\">11</span>虎</div><div class=\"rel-chip\" style=\"background:#f39c12;color:#3a3226\"><span class=\"rel-no\">12</span>猿</div></div><div class=\"rel-note\">番号があなたから見た「1〜12番目」の相手です（1＝自分）。列は役割グループ、行は3分類の相性（正＝同じ3分類、分・逆はジャンケンのような関係）。</div><div class=\"rel-note\" style=\"margin-top:8px;\">【順番リスト】1.ひつじ→2.ゾウ→3.こじか→4.ペガサス→5.たぬき→6.ライオン→7.黒ひょう→8.チータ→9.子守熊→10.狼→11.虎→12.猿</div>" },
            { html: true, head: "子守熊（病）のリレーション", body: "<div class=\"rel-grid\"><div></div><div class=\"rel-h\">自分の列<br>🫴キャッチャー</div><div class=\"rel-h\">対面<br>⚖️審判</div><div class=\"rel-h\">同一<br>🧢監督</div><div class=\"rel-h\">左<br>⚾ピッチャー</div><div class=\"rel-rh\">正</div><div class=\"rel-chip rel-self\" style=\"background:#e0459b;color:#ffffff\"><span class=\"rel-no\">1</span>子守熊（自分）</div><div class=\"rel-chip\" style=\"background:#12c2b5;color:#ffffff\"><span class=\"rel-no\">3</span>狼</div><div class=\"rel-chip\" style=\"background:#12a89a;color:#ffffff\"><span class=\"rel-no\">5</span>虎</div><div class=\"rel-chip\" style=\"background:#f39c12;color:#3a3226\"><span class=\"rel-no\">7</span>猿</div><div class=\"rel-rh\">分</div><div class=\"rel-chip\" style=\"background:#4caf50;color:#ffffff\"><span class=\"rel-no\">2</span>ひつじ</div><div class=\"rel-chip\" style=\"background:#9acd32;color:#3a3226\"><span class=\"rel-no\">4</span>こじか</div><div class=\"rel-chip\" style=\"background:#2f8fe0;color:#ffffff\"><span class=\"rel-no\">6</span>たぬき</div><div class=\"rel-chip\" style=\"background:#f4c724;color:#3a3226\"><span class=\"rel-no\">8</span>黒ひょう</div><div class=\"rel-rh\">逆</div><div class=\"rel-chip\" style=\"background:#e53935;color:#ffffff\"><span class=\"rel-no\">9</span>ゾウ</div><div class=\"rel-chip\" style=\"background:#9b59b6;color:#ffffff\"><span class=\"rel-no\">10</span>ペガサス</div><div class=\"rel-chip\" style=\"background:#3f51b5;color:#ffffff\"><span class=\"rel-no\">11</span>ライオン</div><div class=\"rel-chip\" style=\"background:#ff5a36;color:#ffffff\"><span class=\"rel-no\">12</span>チータ</div></div><div class=\"rel-note\">番号があなたから見た「1〜12番目」の相手です（1＝自分）。列は役割グループ、行は3分類の相性（正＝同じ3分類、分・逆はジャンケンのような関係）。</div><div class=\"rel-note\" style=\"margin-top:8px;\">【順番リスト】1.子守熊→2.ひつじ→3.狼→4.こじか→5.虎→6.たぬき→7.猿→8.黒ひょう→9.ゾウ→10.ペガサス→11.ライオン→12.チータ</div>" },
            { html: true, head: "ゾウ（死）のリレーション", body: "<div class=\"rel-grid\"><div></div><div class=\"rel-h\">自分の列<br>🫴キャッチャー</div><div class=\"rel-h\">対面<br>⚖️審判</div><div class=\"rel-h\">同一<br>🧢監督</div><div class=\"rel-h\">左<br>⚾ピッチャー</div><div class=\"rel-rh\">正</div><div class=\"rel-chip rel-self\" style=\"background:#e53935;color:#ffffff\"><span class=\"rel-no\">1</span>ゾウ（自分）</div><div class=\"rel-chip\" style=\"background:#9b59b6;color:#ffffff\"><span class=\"rel-no\">3</span>ペガサス</div><div class=\"rel-chip\" style=\"background:#3f51b5;color:#ffffff\"><span class=\"rel-no\">5</span>ライオン</div><div class=\"rel-chip\" style=\"background:#ff5a36;color:#ffffff\"><span class=\"rel-no\">7</span>チータ</div><div class=\"rel-rh\">分</div><div class=\"rel-chip\" style=\"background:#e0459b;color:#ffffff\"><span class=\"rel-no\">2</span>子守熊</div><div class=\"rel-chip\" style=\"background:#12c2b5;color:#ffffff\"><span class=\"rel-no\">4</span>狼</div><div class=\"rel-chip\" style=\"background:#12a89a;color:#ffffff\"><span class=\"rel-no\">6</span>虎</div><div class=\"rel-chip\" style=\"background:#f39c12;color:#3a3226\"><span class=\"rel-no\">8</span>猿</div><div class=\"rel-rh\">逆</div><div class=\"rel-chip\" style=\"background:#4caf50;color:#ffffff\"><span class=\"rel-no\">9</span>ひつじ</div><div class=\"rel-chip\" style=\"background:#9acd32;color:#3a3226\"><span class=\"rel-no\">10</span>こじか</div><div class=\"rel-chip\" style=\"background:#2f8fe0;color:#ffffff\"><span class=\"rel-no\">11</span>たぬき</div><div class=\"rel-chip\" style=\"background:#f4c724;color:#3a3226\"><span class=\"rel-no\">12</span>黒ひょう</div></div><div class=\"rel-note\">番号があなたから見た「1〜12番目」の相手です（1＝自分）。列は役割グループ、行は3分類の相性（正＝同じ3分類、分・逆はジャンケンのような関係）。</div><div class=\"rel-note\" style=\"margin-top:8px;\">【順番リスト】1.ゾウ→2.子守熊→3.ペガサス→4.狼→5.ライオン→6.虎→7.チータ→8.猿→9.ひつじ→10.こじか→11.たぬき→12.黒ひょう</div>" },
        ] },
        { head: "🧢 監督の3匹 ── たぬき・虎・ライオン", children: [
            { html: true, head: "たぬき（衰）のリレーション", body: "<div class=\"rel-grid\"><div></div><div class=\"rel-h\">自分の列<br>🧢監督</div><div class=\"rel-h\">対面<br>⚾ピッチャー</div><div class=\"rel-h\">同一<br>🫴キャッチャー</div><div class=\"rel-h\">左<br>⚖️審判</div><div class=\"rel-rh\">正</div><div class=\"rel-chip rel-self\" style=\"background:#2f8fe0;color:#ffffff\"><span class=\"rel-no\">1</span>たぬき（自分）</div><div class=\"rel-chip\" style=\"background:#f4c724;color:#3a3226\"><span class=\"rel-no\">3</span>黒ひょう</div><div class=\"rel-chip\" style=\"background:#4caf50;color:#ffffff\"><span class=\"rel-no\">5</span>ひつじ</div><div class=\"rel-chip\" style=\"background:#9acd32;color:#3a3226\"><span class=\"rel-no\">7</span>こじか</div><div class=\"rel-rh\">分</div><div class=\"rel-chip\" style=\"background:#3f51b5;color:#ffffff\"><span class=\"rel-no\">2</span>ライオン</div><div class=\"rel-chip\" style=\"background:#ff5a36;color:#ffffff\"><span class=\"rel-no\">4</span>チータ</div><div class=\"rel-chip\" style=\"background:#e53935;color:#ffffff\"><span class=\"rel-no\">6</span>ゾウ</div><div class=\"rel-chip\" style=\"background:#9b59b6;color:#ffffff\"><span class=\"rel-no\">8</span>ペガサス</div><div class=\"rel-rh\">逆</div><div class=\"rel-chip\" style=\"background:#12a89a;color:#ffffff\"><span class=\"rel-no\">9</span>虎</div><div class=\"rel-chip\" style=\"background:#f39c12;color:#3a3226\"><span class=\"rel-no\">10</span>猿</div><div class=\"rel-chip\" style=\"background:#e0459b;color:#ffffff\"><span class=\"rel-no\">11</span>子守熊</div><div class=\"rel-chip\" style=\"background:#12c2b5;color:#ffffff\"><span class=\"rel-no\">12</span>狼</div></div><div class=\"rel-note\">番号があなたから見た「1〜12番目」の相手です（1＝自分）。列は役割グループ、行は3分類の相性（正＝同じ3分類、分・逆はジャンケンのような関係）。</div><div class=\"rel-note\" style=\"margin-top:8px;\">【順番リスト】1.たぬき→2.ライオン→3.黒ひょう→4.チータ→5.ひつじ→6.ゾウ→7.こじか→8.ペガサス→9.虎→10.猿→11.子守熊→12.狼</div>" },
            { html: true, head: "虎（帝旺）のリレーション", body: "<div class=\"rel-grid\"><div></div><div class=\"rel-h\">自分の列<br>🧢監督</div><div class=\"rel-h\">対面<br>⚾ピッチャー</div><div class=\"rel-h\">同一<br>🫴キャッチャー</div><div class=\"rel-h\">左<br>⚖️審判</div><div class=\"rel-rh\">正</div><div class=\"rel-chip rel-self\" style=\"background:#12a89a;color:#ffffff\"><span class=\"rel-no\">1</span>虎（自分）</div><div class=\"rel-chip\" style=\"background:#f39c12;color:#3a3226\"><span class=\"rel-no\">3</span>猿</div><div class=\"rel-chip\" style=\"background:#e0459b;color:#ffffff\"><span class=\"rel-no\">5</span>子守熊</div><div class=\"rel-chip\" style=\"background:#12c2b5;color:#ffffff\"><span class=\"rel-no\">7</span>狼</div><div class=\"rel-rh\">分</div><div class=\"rel-chip\" style=\"background:#2f8fe0;color:#ffffff\"><span class=\"rel-no\">2</span>たぬき</div><div class=\"rel-chip\" style=\"background:#f4c724;color:#3a3226\"><span class=\"rel-no\">4</span>黒ひょう</div><div class=\"rel-chip\" style=\"background:#4caf50;color:#ffffff\"><span class=\"rel-no\">6</span>ひつじ</div><div class=\"rel-chip\" style=\"background:#9acd32;color:#3a3226\"><span class=\"rel-no\">8</span>こじか</div><div class=\"rel-rh\">逆</div><div class=\"rel-chip\" style=\"background:#3f51b5;color:#ffffff\"><span class=\"rel-no\">9</span>ライオン</div><div class=\"rel-chip\" style=\"background:#ff5a36;color:#ffffff\"><span class=\"rel-no\">10</span>チータ</div><div class=\"rel-chip\" style=\"background:#e53935;color:#ffffff\"><span class=\"rel-no\">11</span>ゾウ</div><div class=\"rel-chip\" style=\"background:#9b59b6;color:#ffffff\"><span class=\"rel-no\">12</span>ペガサス</div></div><div class=\"rel-note\">番号があなたから見た「1〜12番目」の相手です（1＝自分）。列は役割グループ、行は3分類の相性（正＝同じ3分類、分・逆はジャンケンのような関係）。</div><div class=\"rel-note\" style=\"margin-top:8px;\">【順番リスト】1.虎→2.たぬき→3.猿→4.黒ひょう→5.子守熊→6.ひつじ→7.狼→8.こじか→9.ライオン→10.チータ→11.ゾウ→12.ペガサス</div>" },
            { html: true, head: "ライオン（建禄）のリレーション", body: "<div class=\"rel-grid\"><div></div><div class=\"rel-h\">自分の列<br>🧢監督</div><div class=\"rel-h\">対面<br>⚾ピッチャー</div><div class=\"rel-h\">同一<br>🫴キャッチャー</div><div class=\"rel-h\">左<br>⚖️審判</div><div class=\"rel-rh\">正</div><div class=\"rel-chip rel-self\" style=\"background:#3f51b5;color:#ffffff\"><span class=\"rel-no\">1</span>ライオン（自分）</div><div class=\"rel-chip\" style=\"background:#ff5a36;color:#ffffff\"><span class=\"rel-no\">3</span>チータ</div><div class=\"rel-chip\" style=\"background:#e53935;color:#ffffff\"><span class=\"rel-no\">5</span>ゾウ</div><div class=\"rel-chip\" style=\"background:#9b59b6;color:#ffffff\"><span class=\"rel-no\">7</span>ペガサス</div><div class=\"rel-rh\">分</div><div class=\"rel-chip\" style=\"background:#12a89a;color:#ffffff\"><span class=\"rel-no\">2</span>虎</div><div class=\"rel-chip\" style=\"background:#f39c12;color:#3a3226\"><span class=\"rel-no\">4</span>猿</div><div class=\"rel-chip\" style=\"background:#e0459b;color:#ffffff\"><span class=\"rel-no\">6</span>子守熊</div><div class=\"rel-chip\" style=\"background:#12c2b5;color:#ffffff\"><span class=\"rel-no\">8</span>狼</div><div class=\"rel-rh\">逆</div><div class=\"rel-chip\" style=\"background:#2f8fe0;color:#ffffff\"><span class=\"rel-no\">9</span>たぬき</div><div class=\"rel-chip\" style=\"background:#f4c724;color:#3a3226\"><span class=\"rel-no\">10</span>黒ひょう</div><div class=\"rel-chip\" style=\"background:#4caf50;color:#ffffff\"><span class=\"rel-no\">11</span>ひつじ</div><div class=\"rel-chip\" style=\"background:#9acd32;color:#3a3226\"><span class=\"rel-no\">12</span>こじか</div></div><div class=\"rel-note\">番号があなたから見た「1〜12番目」の相手です（1＝自分）。列は役割グループ、行は3分類の相性（正＝同じ3分類、分・逆はジャンケンのような関係）。</div><div class=\"rel-note\" style=\"margin-top:8px;\">【順番リスト】1.ライオン→2.虎→3.チータ→4.猿→5.ゾウ→6.子守熊→7.ペガサス→8.狼→9.たぬき→10.黒ひょう→11.ひつじ→12.こじか</div>" },
        ] },
        { head: "⚖️ 審判の3匹 ── こじか・狼・ペガサス", children: [
            { html: true, head: "こじか（養）のリレーション", body: "<div class=\"rel-grid\"><div></div><div class=\"rel-h\">自分の列<br>⚖️審判</div><div class=\"rel-h\">対面<br>🫴キャッチャー</div><div class=\"rel-h\">同一<br>⚾ピッチャー</div><div class=\"rel-h\">左<br>🧢監督</div><div class=\"rel-rh\">正</div><div class=\"rel-chip rel-self\" style=\"background:#9acd32;color:#3a3226\"><span class=\"rel-no\">1</span>こじか（自分）</div><div class=\"rel-chip\" style=\"background:#4caf50;color:#ffffff\"><span class=\"rel-no\">3</span>ひつじ</div><div class=\"rel-chip\" style=\"background:#f4c724;color:#3a3226\"><span class=\"rel-no\">5</span>黒ひょう</div><div class=\"rel-chip\" style=\"background:#2f8fe0;color:#ffffff\"><span class=\"rel-no\">7</span>たぬき</div><div class=\"rel-rh\">分</div><div class=\"rel-chip\" style=\"background:#9b59b6;color:#ffffff\"><span class=\"rel-no\">2</span>ペガサス</div><div class=\"rel-chip\" style=\"background:#e53935;color:#ffffff\"><span class=\"rel-no\">4</span>ゾウ</div><div class=\"rel-chip\" style=\"background:#ff5a36;color:#ffffff\"><span class=\"rel-no\">6</span>チータ</div><div class=\"rel-chip\" style=\"background:#3f51b5;color:#ffffff\"><span class=\"rel-no\">8</span>ライオン</div><div class=\"rel-rh\">逆</div><div class=\"rel-chip\" style=\"background:#12c2b5;color:#ffffff\"><span class=\"rel-no\">9</span>狼</div><div class=\"rel-chip\" style=\"background:#e0459b;color:#ffffff\"><span class=\"rel-no\">10</span>子守熊</div><div class=\"rel-chip\" style=\"background:#f39c12;color:#3a3226\"><span class=\"rel-no\">11</span>猿</div><div class=\"rel-chip\" style=\"background:#12a89a;color:#ffffff\"><span class=\"rel-no\">12</span>虎</div></div><div class=\"rel-note\">番号があなたから見た「1〜12番目」の相手です（1＝自分）。列は役割グループ、行は3分類の相性（正＝同じ3分類、分・逆はジャンケンのような関係）。</div><div class=\"rel-note\" style=\"margin-top:8px;\">【順番リスト】1.こじか→2.ペガサス→3.ひつじ→4.ゾウ→5.黒ひょう→6.チータ→7.たぬき→8.ライオン→9.狼→10.子守熊→11.猿→12.虎</div>" },
            { html: true, head: "狼（胎）のリレーション", body: "<div class=\"rel-grid\"><div></div><div class=\"rel-h\">自分の列<br>⚖️審判</div><div class=\"rel-h\">対面<br>🫴キャッチャー</div><div class=\"rel-h\">同一<br>⚾ピッチャー</div><div class=\"rel-h\">左<br>🧢監督</div><div class=\"rel-rh\">正</div><div class=\"rel-chip rel-self\" style=\"background:#12c2b5;color:#ffffff\"><span class=\"rel-no\">1</span>狼（自分）</div><div class=\"rel-chip\" style=\"background:#e0459b;color:#ffffff\"><span class=\"rel-no\">3</span>子守熊</div><div class=\"rel-chip\" style=\"background:#f39c12;color:#3a3226\"><span class=\"rel-no\">5</span>猿</div><div class=\"rel-chip\" style=\"background:#12a89a;color:#ffffff\"><span class=\"rel-no\">7</span>虎</div><div class=\"rel-rh\">分</div><div class=\"rel-chip\" style=\"background:#9acd32;color:#3a3226\"><span class=\"rel-no\">2</span>こじか</div><div class=\"rel-chip\" style=\"background:#4caf50;color:#ffffff\"><span class=\"rel-no\">4</span>ひつじ</div><div class=\"rel-chip\" style=\"background:#f4c724;color:#3a3226\"><span class=\"rel-no\">6</span>黒ひょう</div><div class=\"rel-chip\" style=\"background:#2f8fe0;color:#ffffff\"><span class=\"rel-no\">8</span>たぬき</div><div class=\"rel-rh\">逆</div><div class=\"rel-chip\" style=\"background:#9b59b6;color:#ffffff\"><span class=\"rel-no\">9</span>ペガサス</div><div class=\"rel-chip\" style=\"background:#e53935;color:#ffffff\"><span class=\"rel-no\">10</span>ゾウ</div><div class=\"rel-chip\" style=\"background:#ff5a36;color:#ffffff\"><span class=\"rel-no\">11</span>チータ</div><div class=\"rel-chip\" style=\"background:#3f51b5;color:#ffffff\"><span class=\"rel-no\">12</span>ライオン</div></div><div class=\"rel-note\">番号があなたから見た「1〜12番目」の相手です（1＝自分）。列は役割グループ、行は3分類の相性（正＝同じ3分類、分・逆はジャンケンのような関係）。</div><div class=\"rel-note\" style=\"margin-top:8px;\">【順番リスト】1.狼→2.こじか→3.子守熊→4.ひつじ→5.猿→6.黒ひょう→7.虎→8.たぬき→9.ペガサス→10.ゾウ→11.チータ→12.ライオン</div>" },
            { html: true, head: "ペガサス（絶）のリレーション", body: "<div class=\"rel-grid\"><div></div><div class=\"rel-h\">自分の列<br>⚖️審判</div><div class=\"rel-h\">対面<br>🫴キャッチャー</div><div class=\"rel-h\">同一<br>⚾ピッチャー</div><div class=\"rel-h\">左<br>🧢監督</div><div class=\"rel-rh\">正</div><div class=\"rel-chip rel-self\" style=\"background:#9b59b6;color:#ffffff\"><span class=\"rel-no\">1</span>ペガサス（自分）</div><div class=\"rel-chip\" style=\"background:#e53935;color:#ffffff\"><span class=\"rel-no\">3</span>ゾウ</div><div class=\"rel-chip\" style=\"background:#ff5a36;color:#ffffff\"><span class=\"rel-no\">5</span>チータ</div><div class=\"rel-chip\" style=\"background:#3f51b5;color:#ffffff\"><span class=\"rel-no\">7</span>ライオン</div><div class=\"rel-rh\">分</div><div class=\"rel-chip\" style=\"background:#12c2b5;color:#ffffff\"><span class=\"rel-no\">2</span>狼</div><div class=\"rel-chip\" style=\"background:#e0459b;color:#ffffff\"><span class=\"rel-no\">4</span>子守熊</div><div class=\"rel-chip\" style=\"background:#f39c12;color:#3a3226\"><span class=\"rel-no\">6</span>猿</div><div class=\"rel-chip\" style=\"background:#12a89a;color:#ffffff\"><span class=\"rel-no\">8</span>虎</div><div class=\"rel-rh\">逆</div><div class=\"rel-chip\" style=\"background:#9acd32;color:#3a3226\"><span class=\"rel-no\">9</span>こじか</div><div class=\"rel-chip\" style=\"background:#4caf50;color:#ffffff\"><span class=\"rel-no\">10</span>ひつじ</div><div class=\"rel-chip\" style=\"background:#f4c724;color:#3a3226\"><span class=\"rel-no\">11</span>黒ひょう</div><div class=\"rel-chip\" style=\"background:#2f8fe0;color:#ffffff\"><span class=\"rel-no\">12</span>たぬき</div></div><div class=\"rel-note\">番号があなたから見た「1〜12番目」の相手です（1＝自分）。列は役割グループ、行は3分類の相性（正＝同じ3分類、分・逆はジャンケンのような関係）。</div><div class=\"rel-note\" style=\"margin-top:8px;\">【順番リスト】1.ペガサス→2.狼→3.ゾウ→4.子守熊→5.チータ→6.猿→7.ライオン→8.虎→9.こじか→10.ひつじ→11.黒ひょう→12.たぬき</div>" },
        ] },
        { html: true, head: "📋 全12動物のリレーション一覧表", body: "<div class=\"rel-scroll\"><table class=\"rel-table\"><tr><th>自分</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th>9</th><th>10</th><th>11</th><th>12</th></tr><tr><th>こじか</th><td style=\"background:#9acd3222\">こじか</td><td style=\"background:#9b59b622\">ペガサス</td><td style=\"background:#4caf5022\">ひつじ</td><td style=\"background:#e5393522\">ゾウ</td><td style=\"background:#f4c72422\">黒ひょう</td><td style=\"background:#ff5a3622\">チータ</td><td style=\"background:#2f8fe022\">たぬき</td><td style=\"background:#3f51b522\">ライオン</td><td style=\"background:#12c2b522\">狼</td><td style=\"background:#e0459b22\">子守熊</td><td style=\"background:#f39c1222\">猿</td><td style=\"background:#12a89a22\">虎</td></tr><tr><th>狼</th><td style=\"background:#12c2b522\">狼</td><td style=\"background:#9acd3222\">こじか</td><td style=\"background:#e0459b22\">子守熊</td><td style=\"background:#4caf5022\">ひつじ</td><td style=\"background:#f39c1222\">猿</td><td style=\"background:#f4c72422\">黒ひょう</td><td style=\"background:#12a89a22\">虎</td><td style=\"background:#2f8fe022\">たぬき</td><td style=\"background:#9b59b622\">ペガサス</td><td style=\"background:#e5393522\">ゾウ</td><td style=\"background:#ff5a3622\">チータ</td><td style=\"background:#3f51b522\">ライオン</td></tr><tr><th>ペガサス</th><td style=\"background:#9b59b622\">ペガサス</td><td style=\"background:#12c2b522\">狼</td><td style=\"background:#e5393522\">ゾウ</td><td style=\"background:#e0459b22\">子守熊</td><td style=\"background:#ff5a3622\">チータ</td><td style=\"background:#f39c1222\">猿</td><td style=\"background:#3f51b522\">ライオン</td><td style=\"background:#12a89a22\">虎</td><td style=\"background:#9acd3222\">こじか</td><td style=\"background:#4caf5022\">ひつじ</td><td style=\"background:#f4c72422\">黒ひょう</td><td style=\"background:#2f8fe022\">たぬき</td></tr><tr><th>ひつじ</th><td style=\"background:#4caf5022\">ひつじ</td><td style=\"background:#e5393522\">ゾウ</td><td style=\"background:#9acd3222\">こじか</td><td style=\"background:#9b59b622\">ペガサス</td><td style=\"background:#2f8fe022\">たぬき</td><td style=\"background:#3f51b522\">ライオン</td><td style=\"background:#f4c72422\">黒ひょう</td><td style=\"background:#ff5a3622\">チータ</td><td style=\"background:#e0459b22\">子守熊</td><td style=\"background:#12c2b522\">狼</td><td style=\"background:#12a89a22\">虎</td><td style=\"background:#f39c1222\">猿</td></tr><tr><th>子守熊</th><td style=\"background:#e0459b22\">子守熊</td><td style=\"background:#4caf5022\">ひつじ</td><td style=\"background:#12c2b522\">狼</td><td style=\"background:#9acd3222\">こじか</td><td style=\"background:#12a89a22\">虎</td><td style=\"background:#2f8fe022\">たぬき</td><td style=\"background:#f39c1222\">猿</td><td style=\"background:#f4c72422\">黒ひょう</td><td style=\"background:#e5393522\">ゾウ</td><td style=\"background:#9b59b622\">ペガサス</td><td style=\"background:#3f51b522\">ライオン</td><td style=\"background:#ff5a3622\">チータ</td></tr><tr><th>ゾウ</th><td style=\"background:#e5393522\">ゾウ</td><td style=\"background:#e0459b22\">子守熊</td><td style=\"background:#9b59b622\">ペガサス</td><td style=\"background:#12c2b522\">狼</td><td style=\"background:#3f51b522\">ライオン</td><td style=\"background:#12a89a22\">虎</td><td style=\"background:#ff5a3622\">チータ</td><td style=\"background:#f39c1222\">猿</td><td style=\"background:#4caf5022\">ひつじ</td><td style=\"background:#9acd3222\">こじか</td><td style=\"background:#2f8fe022\">たぬき</td><td style=\"background:#f4c72422\">黒ひょう</td></tr><tr><th>黒ひょう</th><td style=\"background:#f4c72422\">黒ひょう</td><td style=\"background:#ff5a3622\">チータ</td><td style=\"background:#2f8fe022\">たぬき</td><td style=\"background:#3f51b522\">ライオン</td><td style=\"background:#9acd3222\">こじか</td><td style=\"background:#9b59b622\">ペガサス</td><td style=\"background:#4caf5022\">ひつじ</td><td style=\"background:#e5393522\">ゾウ</td><td style=\"background:#f39c1222\">猿</td><td style=\"background:#12a89a22\">虎</td><td style=\"background:#12c2b522\">狼</td><td style=\"background:#e0459b22\">子守熊</td></tr><tr><th>猿</th><td style=\"background:#f39c1222\">猿</td><td style=\"background:#f4c72422\">黒ひょう</td><td style=\"background:#12a89a22\">虎</td><td style=\"background:#2f8fe022\">たぬき</td><td style=\"background:#12c2b522\">狼</td><td style=\"background:#9acd3222\">こじか</td><td style=\"background:#e0459b22\">子守熊</td><td style=\"background:#4caf5022\">ひつじ</td><td style=\"background:#ff5a3622\">チータ</td><td style=\"background:#3f51b522\">ライオン</td><td style=\"background:#9b59b622\">ペガサス</td><td style=\"background:#e5393522\">ゾウ</td></tr><tr><th>チータ</th><td style=\"background:#ff5a3622\">チータ</td><td style=\"background:#f39c1222\">猿</td><td style=\"background:#3f51b522\">ライオン</td><td style=\"background:#12a89a22\">虎</td><td style=\"background:#9b59b622\">ペガサス</td><td style=\"background:#12c2b522\">狼</td><td style=\"background:#e5393522\">ゾウ</td><td style=\"background:#e0459b22\">子守熊</td><td style=\"background:#f4c72422\">黒ひょう</td><td style=\"background:#2f8fe022\">たぬき</td><td style=\"background:#9acd3222\">こじか</td><td style=\"background:#4caf5022\">ひつじ</td></tr><tr><th>たぬき</th><td style=\"background:#2f8fe022\">たぬき</td><td style=\"background:#3f51b522\">ライオン</td><td style=\"background:#f4c72422\">黒ひょう</td><td style=\"background:#ff5a3622\">チータ</td><td style=\"background:#4caf5022\">ひつじ</td><td style=\"background:#e5393522\">ゾウ</td><td style=\"background:#9acd3222\">こじか</td><td style=\"background:#9b59b622\">ペガサス</td><td style=\"background:#12a89a22\">虎</td><td style=\"background:#f39c1222\">猿</td><td style=\"background:#e0459b22\">子守熊</td><td style=\"background:#12c2b522\">狼</td></tr><tr><th>虎</th><td style=\"background:#12a89a22\">虎</td><td style=\"background:#2f8fe022\">たぬき</td><td style=\"background:#f39c1222\">猿</td><td style=\"background:#f4c72422\">黒ひょう</td><td style=\"background:#e0459b22\">子守熊</td><td style=\"background:#4caf5022\">ひつじ</td><td style=\"background:#12c2b522\">狼</td><td style=\"background:#9acd3222\">こじか</td><td style=\"background:#3f51b522\">ライオン</td><td style=\"background:#ff5a3622\">チータ</td><td style=\"background:#e5393522\">ゾウ</td><td style=\"background:#9b59b622\">ペガサス</td></tr><tr><th>ライオン</th><td style=\"background:#3f51b522\">ライオン</td><td style=\"background:#12a89a22\">虎</td><td style=\"background:#ff5a3622\">チータ</td><td style=\"background:#f39c1222\">猿</td><td style=\"background:#e5393522\">ゾウ</td><td style=\"background:#e0459b22\">子守熊</td><td style=\"background:#9b59b622\">ペガサス</td><td style=\"background:#12c2b522\">狼</td><td style=\"background:#2f8fe022\">たぬき</td><td style=\"background:#f4c72422\">黒ひょう</td><td style=\"background:#4caf5022\">ひつじ</td><td style=\"background:#9acd3222\">こじか</td></tr></table></div><div class=\"rel-note\">横にスクロールできます。</div>" },
      ]
    },
    {
      icon: "🎭", menu: "タイプの仕組み", title: "60タイプパーソナリティ ── コードの読み方と全タイプ",
      intro: "診断カードの🎭セクションに出てくる「7C」「9P」などのコードの読み方と、全60タイプの解説です。",
      items: [
        { type: "info", head: "60タイプってなに？（コードの読み方）", body: "60タイプパーソナリティは、生まれた日の干支（日柱）から機械的に決まる「数字＋英字」の2部構成のコードです（例：7C、9P）。\n\n・数字（1〜12）＝ 生まれた日の十二支の番号\n・英字（C／A／S／M／P）＝ 日干（生まれた日の十干）と地支の「五行の関係」\n\n番号は診断カードの「No.」とまったく同じ体系です（例：No.55 戊午＝7C）。診断カードの詳細を開くと、あなたのタイプが🎭セクションに表示されます。\n\n※23時台生まれは翌日として計算します（このアプリ共通のルールです）。" },
        { head: "🔢 数字の意味 ── 十二支の番号", body: "数字は、生まれた日の十二支をそのまま番号にしたものです。\n\n子＝1　丑＝2　寅＝3　卯＝4　辰＝5　巳＝6\n午＝7　未＝8　申＝9　酉＝10　戌＝11　亥＝12\n\n例：戊午の「午」は7番目 → 数字は7。" },
        { html: true, head: "🔥 英字の意味 ── 五行の相生・相剋", body: "<div class=\"det-row\" style=\"line-height:1.9;\">英字は、日干の五行と地支の五行の「関係」で決まります。五行は「木→火→土→金→水→木」の順にとなりを生み（相生）、ひとつ飛ばした相手を剋します（相剋）。</div><svg viewBox=\"0 0 300 320\" style=\"max-width:320px;width:100%;display:block;margin:8px auto;\" xmlns=\"http://www.w3.org/2000/svg\"><defs><marker id=\"ar-g\" markerWidth=\"7\" markerHeight=\"7\" refX=\"6\" refY=\"3.5\" orient=\"auto\"><path d=\"M0,0 L7,3.5 L0,7 z\" fill=\"#4a8c5c\"/></marker><marker id=\"ar-r\" markerWidth=\"7\" markerHeight=\"7\" refX=\"6\" refY=\"3.5\" orient=\"auto\"><path d=\"M0,0 L7,3.5 L0,7 z\" fill=\"#e05555\"/></marker></defs><line x1=\"176\" y1=\"69\" x2=\"219\" y2=\"100\" stroke=\"#4a8c5c\" stroke-width=\"2.5\" marker-end=\"url(#ar-g)\"/><line x1=\"235\" y1=\"150\" x2=\"219\" y2=\"200\" stroke=\"#4a8c5c\" stroke-width=\"2.5\" marker-end=\"url(#ar-g)\"/><line x1=\"177\" y1=\"231\" x2=\"123\" y2=\"231\" stroke=\"#4a8c5c\" stroke-width=\"2.5\" marker-end=\"url(#ar-g)\"/><line x1=\"81\" y1=\"200\" x2=\"65\" y2=\"150\" stroke=\"#4a8c5c\" stroke-width=\"2.5\" marker-end=\"url(#ar-g)\"/><line x1=\"81\" y1=\"100\" x2=\"124\" y2=\"69\" stroke=\"#4a8c5c\" stroke-width=\"2.5\" marker-end=\"url(#ar-g)\"/><line x1=\"160\" y1=\"80\" x2=\"199\" y2=\"200\" stroke=\"#e05555\" stroke-width=\"2\" stroke-dasharray=\"5,4\" marker-end=\"url(#ar-r)\"/><line x1=\"219\" y1=\"138\" x2=\"117\" y2=\"212\" stroke=\"#e05555\" stroke-width=\"2\" stroke-dasharray=\"5,4\" marker-end=\"url(#ar-r)\"/><line x1=\"183\" y1=\"212\" x2=\"81\" y2=\"138\" stroke=\"#e05555\" stroke-width=\"2\" stroke-dasharray=\"5,4\" marker-end=\"url(#ar-r)\"/><line x1=\"101\" y1=\"200\" x2=\"140\" y2=\"80\" stroke=\"#e05555\" stroke-width=\"2\" stroke-dasharray=\"5,4\" marker-end=\"url(#ar-r)\"/><line x1=\"87\" y1=\"119\" x2=\"213\" y2=\"119\" stroke=\"#e05555\" stroke-width=\"2\" stroke-dasharray=\"5,4\" marker-end=\"url(#ar-r)\"/><circle cx=\"150\" cy=\"50\" r=\"24\" fill=\"#4caf50\"/><text x=\"150\" y=\"50\" font-size=\"18\" font-weight=\"bold\" fill=\"#fff\" text-anchor=\"middle\" dominant-baseline=\"central\">木</text><circle cx=\"245\" cy=\"119\" r=\"24\" fill=\"#e8688f\"/><text x=\"245\" y=\"119\" font-size=\"18\" font-weight=\"bold\" fill=\"#fff\" text-anchor=\"middle\" dominant-baseline=\"central\">火</text><circle cx=\"209\" cy=\"231\" r=\"24\" fill=\"#c9a227\"/><text x=\"209\" y=\"231\" font-size=\"18\" font-weight=\"bold\" fill=\"#fff\" text-anchor=\"middle\" dominant-baseline=\"central\">土</text><circle cx=\"91\" cy=\"231\" r=\"24\" fill=\"#8a8f98\"/><text x=\"91\" y=\"231\" font-size=\"18\" font-weight=\"bold\" fill=\"#fff\" text-anchor=\"middle\" dominant-baseline=\"central\">金</text><circle cx=\"55\" cy=\"119\" r=\"24\" fill=\"#2f8fe0\"/><text x=\"55\" y=\"119\" font-size=\"18\" font-weight=\"bold\" fill=\"#fff\" text-anchor=\"middle\" dominant-baseline=\"central\">水</text><text x=\"150\" y=\"310\" font-size=\"11\" fill=\"#8a7a93\" text-anchor=\"middle\">→ 緑＝相生（生む）／ ⇢ 赤点線＝相剋（剋す）</text></svg><div class=\"rel-scroll\"><table class=\"rel-table\"><tr><th>英字</th><th>五行の関係</th><th>通変星</th><th>表裏</th><th>ニュアンス</th></tr><tr><th>🧸 C</th><td>地支が日干を生む</td><td>印星</td><td>大人の振りした子供</td><td>生じて「もらう」側なので中身は子供</td></tr><tr><th>🎩 A</th><td>日干が地支を生む</td><td>食傷星</td><td>子供のふりした大人</td><td>「与える」側なので中身は大人</td></tr><tr><th>👑 S</th><td>日干が地支を剋す</td><td>財星</td><td>どMのふりしたどS</td><td>「攻める」側なので本性はS</td></tr><tr><th>🎀 M</th><td>地支が日干を剋す</td><td>官星</td><td>どSのふりしたどM</td><td>「受ける」側なので本性はM</td></tr><tr><th>🌀 P</th><td>日干と同じ五行</td><td>比劫星</td><td>ひとたらしな自己中</td><td>自分と同質なので自分中心</td></tr></table></div><div class=\"rel-note\">「剋す（こくす）」＝抑える・コントロールする関係のことです。</div>" },
        { head: "🧪 具体例：戊午 → 7C になるまで", body: "① 生まれた日の干支を出す → 戊午（つちのえうま）\n② 地支「午」は十二支の7番目 → 数字は 7\n③ 日干「戊」の五行は土、地支「午」の五行は火\n④ 火は土を生む関係（火生土）＝地支が日干を生む → 印星 → 英字は C\n⑤ 合体して「7C」！\n\n同じ手順で、どの生年月日でも60タイプのどれかに必ず当てはまります。" },
        { head: "🧸 C（印星）──「大人の振りした子供」の12タイプ", body: "地支が日干を生む関係のグループ。決めゼリフは「すべてわたしが中心です」。生じて「もらう」側なので中身は子供。\n\n【印星（いんせい）ってどんな星？】\n「学びと吸収」の星です。知識・情報・愛情を受け取る側のエネルギーで、母性・教養・直感を象徴します。学ぶ・調べる・研究するのが得意で、先生や年上にかわいがられる甘え上手。守られる環境で才能が開きます。\n\n【印星が強い人の傾向】\n・勉強熱心で物知り。資格や肩書きにも縁がある\n・受け取るのは得意だけど、自分から与えるのは少し苦手\n・「わたしが中心」＝周りが世話を焼いてくれる前提で生きられる愛されキャラ\n・このアプリの能力でいうと i応用力・j吸収力（レールのユニーク・ロジック）と同じ星のエネルギーです", children: [
            { head: "1C 甲子 ──「自分が大好きな子供」", body: "🎭 表裏：大人の振りした子供\n💬 決めゼリフ：「すべてわたしが中心です」\n👤 日干の特徴：挫折に弱く天然ボケだけどプライドの高いポジティブな人\n\n【なぜ1Cになるの？】\n甲子の日生まれ。地支「子」は12支の1番目なので数字は1。日干「甲」は木、地支「子」は水で、水は日干を生む関係（印星）なので英字はC（印星）。\n\n（60分類No.1＝診断カードのNo.と同じ番号です）" },
            { head: "2C 辛丑 ──「何でもできちゃうけど一番が苦手な人見知りの子供」", body: "🎭 表裏：大人の振りした子供\n💬 決めゼリフ：「すべてわたしが中心です」\n👤 日干の特徴：白黒、せっかち、辛口のくせに繊細で美意識と責任感で生きてる人\n\n【なぜ2Cになるの？】\n辛丑の日生まれ。地支「丑」は12支の2番目なので数字は2。日干「辛」は金、地支「丑」は土で、土は日干を生む関係（印星）なので英字はC（印星）。\n\n（60分類No.38＝診断カードのNo.と同じ番号です）" },
            { head: "3C 丙寅 ──「気難しいとっつきにくい子供」", body: "🎭 表裏：大人の振りした子供\n💬 決めゼリフ：「すべてわたしが中心です」\n👤 日干の特徴：表舞台に立つわたしが主役な一言多いおしゃれさん\n\n【なぜ3Cになるの？】\n丙寅の日生まれ。地支「寅」は12支の3番目なので数字は3。日干「丙」は火、地支「寅」は木で、木は日干を生む関係（印星）なので英字はC（印星）。\n\n（60分類No.3＝診断カードのNo.と同じ番号です）" },
            { head: "4C 丁卯 ──「目立つ人の後ろで輝きたい子供」", body: "🎭 表裏：大人の振りした子供\n💬 決めゼリフ：「すべてわたしが中心です」\n👤 日干の特徴：控えめだけど目立って自分が輝くおしゃれさん\n\n【なぜ4Cになるの？】\n丁卯の日生まれ。地支「卯」は12支の4番目なので数字は4。日干「丁」は火、地支「卯」は木で、木は日干を生む関係（印星）なので英字はC（印星）。\n\n（60分類No.4＝診断カードのNo.と同じ番号です）" },
            { head: "5C 庚辰 ──「面白くないと全く動かない子供」", body: "🎭 表裏：大人の振りした子供\n💬 決めゼリフ：「すべてわたしが中心です」\n👤 日干の特徴：白黒、せっかち、頑固な頭の切れるチャレンジャー\n\n【なぜ5Cになるの？】\n庚辰の日生まれ。地支「辰」は12支の5番目なので数字は5。日干「庚」は金、地支「辰」は土で、土は日干を生む関係（印星）なので英字はC（印星）。\n\n（60分類No.17＝診断カードのNo.と同じ番号です）" },
            { head: "6C 己巳 ──「好きなことには貪欲な子供」", body: "🎭 表裏：大人の振りした子供\n💬 決めゼリフ：「すべてわたしが中心です」\n👤 日干の特徴：妄想しがちでしつこいけど穏やかでフレンドリーな優しい人\n\n【なぜ6Cになるの？】\n己巳の日生まれ。地支「巳」は12支の6番目なので数字は6。日干「己」は土、地支「巳」は火で、火は日干を生む関係（印星）なので英字はC（印星）。\n\n（60分類No.6＝診断カードのNo.と同じ番号です）" },
            { head: "7C 戊午 ──「いつでもポジティブマンの子供」", body: "🎭 表裏：大人の振りした子供\n💬 決めゼリフ：「すべてわたしが中心です」\n👤 日干の特徴：頑固でずぼらだけど包容力のある優しい人\n\n【なぜ7Cになるの？】\n戊午の日生まれ。地支「午」は12支の7番目なので数字は7。日干「戊」は土、地支「午」は火で、火は日干を生む関係（印星）なので英字はC（印星）。\n\n（60分類No.55＝診断カードのNo.と同じ番号です）" },
            { head: "8C 辛未 ──「１０００倍速な子供」", body: "🎭 表裏：大人の振りした子供\n💬 決めゼリフ：「すべてわたしが中心です」\n👤 日干の特徴：白黒、せっかち、辛口のくせに繊細で美意識と責任感で生きてる人\n\n【なぜ8Cになるの？】\n辛未の日生まれ。地支「未」は12支の8番目なので数字は8。日干「辛」は金、地支「未」は土で、土は日干を生む関係（印星）なので英字はC（印星）。\n\n（60分類No.8＝診断カードのNo.と同じ番号です）" },
            { head: "9C 壬申 ──「頭の良い子供」", body: "🎭 表裏：大人の振りした子供\n💬 決めゼリフ：「すべてわたしが中心です」\n👤 日干の特徴：疑い深いアブノーマルだけど魅力的な変化に強い感覚派\n\n【なぜ9Cになるの？】\n壬申の日生まれ。地支「申」は12支の9番目なので数字は9。日干「壬」は水、地支「申」は金で、金は日干を生む関係（印星）なので英字はC（印星）。\n\n（60分類No.9＝診断カードのNo.と同じ番号です）" },
            { head: "10C 癸酉 ──「おバカか？賢いかの2極な子供」", body: "🎭 表裏：大人の振りした子供\n💬 決めゼリフ：「すべてわたしが中心です」\n👤 日干の特徴：疑い深いアブノーマルな魅力のある他人に寄り添う感覚派\n\n【なぜ10Cになるの？】\n癸酉の日生まれ。地支「酉」は12支の10番目なので数字は10。日干「癸」は水、地支「酉」は金で、金は日干を生む関係（印星）なので英字はC（印星）。\n\n（60分類No.10＝診断カードのNo.と同じ番号です）" },
            { head: "11C 庚戌 ──「都合のいいこと、好きなことだけしか聞かない子供」", body: "🎭 表裏：大人の振りした子供\n💬 決めゼリフ：「すべてわたしが中心です」\n👤 日干の特徴：白黒、せっかち、頑固な頭の切れるチャレンジャー\n\n【なぜ11Cになるの？】\n庚戌の日生まれ。地支「戌」は12支の11番目なので数字は11。日干「庚」は金、地支「戌」は土で、土は日干を生む関係（印星）なので英字はC（印星）。\n\n（60分類No.47＝診断カードのNo.と同じ番号です）" },
            { head: "12C 乙亥 ──「ネガティブな勘が良く当たる子供」", body: "🎭 表裏：大人の振りした子供\n💬 決めゼリフ：「すべてわたしが中心です」\n👤 日干の特徴：生まれながらのネガティブだけど協調性のある控えめな温厚な人\n\n【なぜ12Cになるの？】\n乙亥の日生まれ。地支「亥」は12支の12番目なので数字は12。日干「乙」は木、地支「亥」は水で、水は日干を生む関係（印星）なので英字はC（印星）。\n\n（60分類No.12＝診断カードのNo.と同じ番号です）" },
        ] },
        { head: "🎩 A（食傷星）──「子供のふりした大人」の12タイプ", body: "日干が地支を生む関係のグループ。決めゼリフは「すべてわたしが基本です」。「与える」側なので中身は大人。\n\n【食傷星（しょくしょうせい）ってどんな星？】\n「表現と創造」の星です。自分の中のものを外に生み出すエネルギーで、話す・書く・作る・楽しませることを象徴します。サービス精神が旺盛で、衣食住のセンスも抜群。自由が大好きで、縛られると輝きを失います。\n\n【食傷星が強い人の傾向】\n・言葉やアイデアが泉のように湧く表現者\n・人を楽しませるのが好きで、場を明るくする\n・「わたしが基本」＝自分の感性が判断基準。ルールより自分のスタイル\n・このアプリの能力でいうと c判断力・d表現力（レールのピース・ロマン）と同じ星のエネルギーです", children: [
            { head: "1A 庚子 ──「イヤなものはとことんイヤでも我慢する大人」", body: "🎭 表裏：子供のふりした大人\n💬 決めゼリフ：「すべてわたしが基本です」\n👤 日干の特徴：白黒、せっかち、頑固な頭の切れるチャレンジャー\n\n【なぜ1Aになるの？】\n庚子の日生まれ。地支「子」は12支の1番目なので数字は1。日干「庚」は金、地支「子」は水で、水は日干が生む関係（食傷星）なので英字はA（食傷星）。\n\n（60分類No.37＝診断カードのNo.と同じ番号です）" },
            { head: "2A 丁丑 ──「スマートなふるまいをする大人」", body: "🎭 表裏：子供のふりした大人\n💬 決めゼリフ：「すべてわたしが基本です」\n👤 日干の特徴：控えめだけど目立って自分が輝くおしゃれさん\n\n【なぜ2Aになるの？】\n丁丑の日生まれ。地支「丑」は12支の2番目なので数字は2。日干「丁」は火、地支「丑」は土で、土は日干が生む関係（食傷星）なので英字はA（食傷星）。\n\n（60分類No.14＝診断カードのNo.と同じ番号です）" },
            { head: "3A 壬寅 ──「私に任せて安心だから！の大人」", body: "🎭 表裏：子供のふりした大人\n💬 決めゼリフ：「すべてわたしが基本です」\n👤 日干の特徴：疑い深いアブノーマルだけど魅力的な変化に強い感覚派\n\n【なぜ3Aになるの？】\n壬寅の日生まれ。地支「寅」は12支の3番目なので数字は3。日干「壬」は水、地支「寅」は木で、木は日干が生む関係（食傷星）なので英字はA（食傷星）。\n\n（60分類No.39＝診断カードのNo.と同じ番号です）" },
            { head: "4A 癸卯 ──「一途な心配性、世間体が大事な大人」", body: "🎭 表裏：子供のふりした大人\n💬 決めゼリフ：「すべてわたしが基本です」\n👤 日干の特徴：疑い深いアブノーマルな魅力のある他人に寄り添う感覚派\n\n【なぜ4Aになるの？】\n癸卯の日生まれ。地支「卯」は12支の4番目なので数字は4。日干「癸」は水、地支「卯」は木で、木は日干が生む関係（食傷星）なので英字はA（食傷星）。\n\n（60分類No.40＝診断カードのNo.と同じ番号です）" },
            { head: "5A 丙辰 ──「イヤイヤ言うけどそうでもない大人」", body: "🎭 表裏：子供のふりした大人\n💬 決めゼリフ：「すべてわたしが基本です」\n👤 日干の特徴：表舞台に立つわたしが主役な一言多いおしゃれさん\n\n【なぜ5Aになるの？】\n丙辰の日生まれ。地支「辰」は12支の5番目なので数字は5。日干「丙」は火、地支「辰」は土で、土は日干が生む関係（食傷星）なので英字はA（食傷星）。\n\n（60分類No.53＝診断カードのNo.と同じ番号です）" },
            { head: "6A 乙巳 ──「霊感人間、執念はとび級大人」", body: "🎭 表裏：子供のふりした大人\n💬 決めゼリフ：「すべてわたしが基本です」\n👤 日干の特徴：生まれながらのネガティブだけど協調性のある控えめな温厚な人\n\n【なぜ6Aになるの？】\n乙巳の日生まれ。地支「巳」は12支の6番目なので数字は6。日干「乙」は木、地支「巳」は火で、火は日干が生む関係（食傷星）なので英字はA（食傷星）。\n\n（60分類No.42＝診断カードのNo.と同じ番号です）" },
            { head: "7A 甲午 ──「ナチュラルビューティーな大人」", body: "🎭 表裏：子供のふりした大人\n💬 決めゼリフ：「すべてわたしが基本です」\n👤 日干の特徴：挫折に弱く天然ボケだけどプライドの高いポジティブな人\n\n【なぜ7Aになるの？】\n甲午の日生まれ。地支「午」は12支の7番目なので数字は7。日干「甲」は木、地支「午」は火で、火は日干が生む関係（食傷星）なので英字はA（食傷星）。\n\n（60分類No.31＝診断カードのNo.と同じ番号です）" },
            { head: "8A 丁未 ──「自己愛ばかり、愛したら命がけの大人」", body: "🎭 表裏：子供のふりした大人\n💬 決めゼリフ：「すべてわたしが基本です」\n👤 日干の特徴：控えめだけど目立って自分が輝くおしゃれさん\n\n【なぜ8Aになるの？】\n丁未の日生まれ。地支「未」は12支の8番目なので数字は8。日干「丁」は火、地支「未」は土で、土は日干が生む関係（食傷星）なので英字はA（食傷星）。\n\n（60分類No.44＝診断カードのNo.と同じ番号です）" },
            { head: "9A 戊申 ──「隠してるつもり、でもバレバレの上から目線な大人」", body: "🎭 表裏：子供のふりした大人\n💬 決めゼリフ：「すべてわたしが基本です」\n👤 日干の特徴：頑固でずぼらだけど包容力のある優しい人\n\n【なぜ9Aになるの？】\n戊申の日生まれ。地支「申」は12支の9番目なので数字は9。日干「戊」は土、地支「申」は金で、金は日干が生む関係（食傷星）なので英字はA（食傷星）。\n\n（60分類No.45＝診断カードのNo.と同じ番号です）" },
            { head: "10A 己酉 ──「めんどくさいと言いながら断らず引き受ける大人」", body: "🎭 表裏：子供のふりした大人\n💬 決めゼリフ：「すべてわたしが基本です」\n👤 日干の特徴：妄想しがちでしつこいけど穏やかでフレンドリーな優しい人\n\n【なぜ10Aになるの？】\n己酉の日生まれ。地支「酉」は12支の10番目なので数字は10。日干「己」は土、地支「酉」は金で、金は日干が生む関係（食傷星）なので英字はA（食傷星）。\n\n（60分類No.46＝診断カードのNo.と同じ番号です）" },
            { head: "11A 丙戌 ──「わかりやすい上から目線な大人」", body: "🎭 表裏：子供のふりした大人\n💬 決めゼリフ：「すべてわたしが基本です」\n👤 日干の特徴：表舞台に立つわたしが主役な一言多いおしゃれさん\n\n【なぜ11Aになるの？】\n丙戌の日生まれ。地支「戌」は12支の11番目なので数字は11。日干「丙」は火、地支「戌」は土で、土は日干が生む関係（食傷星）なので英字はA（食傷星）。\n\n（60分類No.23＝診断カードのNo.と同じ番号です）" },
            { head: "12A 辛亥 ──「私が一番、名誉も一番、一番が大好き大人」", body: "🎭 表裏：子供のふりした大人\n💬 決めゼリフ：「すべてわたしが基本です」\n👤 日干の特徴：白黒、せっかち、辛口のくせに繊細で美意識と責任感で生きてる人\n\n【なぜ12Aになるの？】\n辛亥の日生まれ。地支「亥」は12支の12番目なので数字は12。日干「辛」は金、地支「亥」は水で、水は日干が生む関係（食傷星）なので英字はA（食傷星）。\n\n（60分類No.48＝診断カードのNo.と同じ番号です）" },
        ] },
        { head: "👑 S（財星）──「どMのふりしたどS」の12タイプ", body: "日干が地支を剋す関係のグループ。決めゼリフは「すべてわたしが決めます」。「攻める」側なので本性はS。\n\n【財星（ざいせい）ってどんな星？】\n「現実とお金」の星です。自分がコントロールする側のエネルギーで、財産・人脈・行動力を象徴します。目に見える成果を作るのが得意で、フットワークが軽く、面倒見も良い。動きながら考える現実派です。\n\n【財星が強い人の傾向】\n・お金や数字、実利に強い。商売のセンスがある\n・世話好きで人が集まってくるけど、主導権はしっかり自分が握る\n・「わたしが決めます」＝ソフトに見えて決定権は渡さない\n・このアプリの能力でいうと e包容力・f計数力（レールのヒューマニティ・リアリティ）と同じ星のエネルギーです", children: [
            { head: "1S 戊子 ──「目覚めたらど変態（オタク、マニア）のドS」", body: "🎭 表裏：どMのふりしたどS\n💬 決めゼリフ：「すべてわたしが決めます」\n👤 日干の特徴：頑固でずぼらだけど包容力のある優しい人\n\n【なぜ1Sになるの？】\n戊子の日生まれ。地支「子」は12支の1番目なので数字は1。日干「戊」は土、地支「子」は水で、水は日干が剋（こく）す関係（財星）なので英字はS（財星）。\n\n（60分類No.25＝診断カードのNo.と同じ番号です）" },
            { head: "2S 乙丑 ──「いつも眠たいドS」", body: "🎭 表裏：どMのふりしたどS\n💬 決めゼリフ：「すべてわたしが決めます」\n👤 日干の特徴：生まれながらのネガティブだけど協調性のある控えめな温厚な人\n\n【なぜ2Sになるの？】\n乙丑の日生まれ。地支「丑」は12支の2番目なので数字は2。日干「乙」は木、地支「丑」は土で、土は日干が剋（こく）す関係（財星）なので英字はS（財星）。\n\n（60分類No.2＝診断カードのNo.と同じ番号です）" },
            { head: "3S 庚寅 ──「態度でかめの小心者のどS」", body: "🎭 表裏：どMのふりしたどS\n💬 決めゼリフ：「すべてわたしが決めます」\n👤 日干の特徴：白黒、せっかち、頑固な頭の切れるチャレンジャー\n\n【なぜ3Sになるの？】\n庚寅の日生まれ。地支「寅」は12支の3番目なので数字は3。日干「庚」は金、地支「寅」は木で、木は日干が剋（こく）す関係（財星）なので英字はS（財星）。\n\n（60分類No.27＝診断カードのNo.と同じ番号です）" },
            { head: "4S 辛卯 ──「裏と表だけ時速200キロのドSウサギ」", body: "🎭 表裏：どMのふりしたどS\n💬 決めゼリフ：「すべてわたしが決めます」\n👤 日干の特徴：白黒、せっかち、辛口のくせに繊細で美意識と責任感で生きてる人\n\n【なぜ4Sになるの？】\n辛卯の日生まれ。地支「卯」は12支の4番目なので数字は4。日干「辛」は金、地支「卯」は木で、木は日干が剋（こく）す関係（財星）なので英字はS（財星）。\n\n（60分類No.28＝診断カードのNo.と同じ番号です）" },
            { head: "5S 甲辰 ──「怒らせたらいけないどS」", body: "🎭 表裏：どMのふりしたどS\n💬 決めゼリフ：「すべてわたしが決めます」\n👤 日干の特徴：挫折に弱く天然ボケだけどプライドの高いポジティブな人\n\n【なぜ5Sになるの？】\n甲辰の日生まれ。地支「辰」は12支の5番目なので数字は5。日干「甲」は木、地支「辰」は土で、土は日干が剋（こく）す関係（財星）なので英字はS（財星）。\n\n（60分類No.41＝診断カードのNo.と同じ番号です）" },
            { head: "6S 癸巳 ──「小さな場所なら自信満々のドS」", body: "🎭 表裏：どMのふりしたどS\n💬 決めゼリフ：「すべてわたしが決めます」\n👤 日干の特徴：疑い深いアブノーマルな魅力のある他人に寄り添う感覚派\n\n【なぜ6Sになるの？】\n癸巳の日生まれ。地支「巳」は12支の6番目なので数字は6。日干「癸」は水、地支「巳」は火で、火は日干が剋（こく）す関係（財星）なので英字はS（財星）。\n\n（60分類No.30＝診断カードのNo.と同じ番号です）" },
            { head: "7S 壬午 ──「大胆なモテモテドS」", body: "🎭 表裏：どMのふりしたどS\n💬 決めゼリフ：「すべてわたしが決めます」\n👤 日干の特徴：疑い深いアブノーマルだけど魅力的な変化に強い感覚派\n\n【なぜ7Sになるの？】\n壬午の日生まれ。地支「午」は12支の7番目なので数字は7。日干「壬」は水、地支「午」は火で、火は日干が剋（こく）す関係（財星）なので英字はS（財星）。\n\n（60分類No.19＝診断カードのNo.と同じ番号です）" },
            { head: "8S 乙未 ──「切れたら怖すぎる自己肯定低めのドS」", body: "🎭 表裏：どMのふりしたどS\n💬 決めゼリフ：「すべてわたしが決めます」\n👤 日干の特徴：生まれながらのネガティブだけど協調性のある控えめな温厚な人\n\n【なぜ8Sになるの？】\n乙未の日生まれ。地支「未」は12支の8番目なので数字は8。日干「乙」は木、地支「未」は土で、土は日干が剋（こく）す関係（財星）なので英字はS（財星）。\n\n（60分類No.32＝診断カードのNo.と同じ番号です）" },
            { head: "9S 丙申 ──「THE芸能人私みてみてすごいでしょなドS」", body: "🎭 表裏：どMのふりしたどS\n💬 決めゼリフ：「すべてわたしが決めます」\n👤 日干の特徴：表舞台に立つわたしが主役な一言多いおしゃれさん\n\n【なぜ9Sになるの？】\n丙申の日生まれ。地支「申」は12支の9番目なので数字は9。日干「丙」は火、地支「申」は金で、金は日干が剋（こく）す関係（財星）なので英字はS（財星）。\n\n（60分類No.33＝診断カードのNo.と同じ番号です）" },
            { head: "10S 丁酉 ──「頭の良いキレッキレのドS」", body: "🎭 表裏：どMのふりしたどS\n💬 決めゼリフ：「すべてわたしが決めます」\n👤 日干の特徴：控えめだけど目立って自分が輝くおしゃれさん\n\n【なぜ10Sになるの？】\n丁酉の日生まれ。地支「酉」は12支の10番目なので数字は10。日干「丁」は火、地支「酉」は金で、金は日干が剋（こく）す関係（財星）なので英字はS（財星）。\n\n（60分類No.34＝診断カードのNo.と同じ番号です）" },
            { head: "11S 甲戌 ──「えーかっこしいのドS」", body: "🎭 表裏：どMのふりしたどS\n💬 決めゼリフ：「すべてわたしが決めます」\n👤 日干の特徴：挫折に弱く天然ボケだけどプライドの高いポジティブな人\n\n【なぜ11Sになるの？】\n甲戌の日生まれ。地支「戌」は12支の11番目なので数字は11。日干「甲」は木、地支「戌」は土で、土は日干が剋（こく）す関係（財星）なので英字はS（財星）。\n\n（60分類No.11＝診断カードのNo.と同じ番号です）" },
            { head: "12S 己亥 ──「常識があるようで全くないどS」", body: "🎭 表裏：どMのふりしたどS\n💬 決めゼリフ：「すべてわたしが決めます」\n👤 日干の特徴：妄想しがちでしつこいけど穏やかでフレンドリーな優しい人\n\n【なぜ12Sになるの？】\n己亥の日生まれ。地支「亥」は12支の12番目なので数字は12。日干「己」は土、地支「亥」は水で、水は日干が剋（こく）す関係（財星）なので英字はS（財星）。\n\n（60分類No.36＝診断カードのNo.と同じ番号です）" },
        ] },
        { head: "🎀 M（官星）──「どSのふりしたどM」の12タイプ", body: "地支が日干を剋す関係のグループ。決めゼリフは「すべてあなたが決めてください」。「受ける」側なので本性はM。\n\n【官星（かんせい）ってどんな星？】\n「組織と規律」の星です。自分がコントロールされる側のエネルギーで、責任感・忠誠心・名誉を象徴します。ルールや期待に応えることで力を発揮し、我慢強く、与えられた役割を最後までやりきります。\n\n【官星が強い人の傾向】\n・責任感が強く、組織や上司からの信頼が厚い\n・プレッシャーに耐えて結果を出す頑張り屋\n・「あなたが決めてください」＝相手に合わせながら、期待には全力で応える\n・このアプリの能力でいうと g対話力・h分析力（レールのワイルド・エリート）と同じ星のエネルギーです", children: [
            { head: "1M 丙子 ──「苦労を買ってするドМ」", body: "🎭 表裏：どSのふりしたどM\n💬 決めゼリフ：「すべてあなたが決めてください」\n👤 日干の特徴：表舞台に立つわたしが主役な一言多いおしゃれさん\n\n【なぜ1Mになるの？】\n丙子の日生まれ。地支「子」は12支の1番目なので数字は1。日干「丙」は火、地支「子」は水で、水は日干を剋（こく）す関係（官星）なので英字はM（官星）。\n\n（60分類No.13＝診断カードのNo.と同じ番号です）" },
            { head: "2M 癸丑 ──「決めたら早いおっとり屋のドМ」", body: "🎭 表裏：どSのふりしたどM\n💬 決めゼリフ：「すべてあなたが決めてください」\n👤 日干の特徴：疑い深いアブノーマルな魅力のある他人に寄り添う感覚派\n\n【なぜ2Mになるの？】\n癸丑の日生まれ。地支「丑」は12支の2番目なので数字は2。日干「癸」は水、地支「丑」は土で、土は日干を剋（こく）す関係（官星）なので英字はM（官星）。\n\n（60分類No.50＝診断カードのNo.と同じ番号です）" },
            { head: "3M 戊寅 ──「変態（オタク、マニア）に見えない変態（オタク、マニア）なドМ」", body: "🎭 表裏：どSのふりしたどM\n💬 決めゼリフ：「すべてあなたが決めてください」\n👤 日干の特徴：頑固でずぼらだけど包容力のある優しい人\n\n【なぜ3Mになるの？】\n戊寅の日生まれ。地支「寅」は12支の3番目なので数字は3。日干「戊」は土、地支「寅」は木で、木は日干を剋（こく）す関係（官星）なので英字はM（官星）。\n\n（60分類No.15＝診断カードのNo.と同じ番号です）" },
            { head: "4M 己卯 ──「変態（オタク、マニア）マニアックなドМ」", body: "🎭 表裏：どSのふりしたどM\n💬 決めゼリフ：「すべてあなたが決めてください」\n👤 日干の特徴：妄想しがちでしつこいけど穏やかでフレンドリーな優しい人\n\n【なぜ4Mになるの？】\n己卯の日生まれ。地支「卯」は12支の4番目なので数字は4。日干「己」は土、地支「卯」は木で、木は日干を剋（こく）す関係（官星）なので英字はM（官星）。\n\n（60分類No.16＝診断カードのNo.と同じ番号です）" },
            { head: "5M 壬辰 ──「好きなもの以外どうでもいいドМ」", body: "🎭 表裏：どSのふりしたどM\n💬 決めゼリフ：「すべてあなたが決めてください」\n👤 日干の特徴：疑い深いアブノーマルだけど魅力的な変化に強い感覚派\n\n【なぜ5Mになるの？】\n壬辰の日生まれ。地支「辰」は12支の5番目なので数字は5。日干「壬」は水、地支「辰」は土で、土は日干を剋（こく）す関係（官星）なので英字はM（官星）。\n\n（60分類No.29＝診断カードのNo.と同じ番号です）" },
            { head: "6M 辛巳 ──「うだうだ言うけどやるドМ」", body: "🎭 表裏：どSのふりしたどM\n💬 決めゼリフ：「すべてあなたが決めてください」\n👤 日干の特徴：白黒、せっかち、辛口のくせに繊細で美意識と責任感で生きてる人\n\n【なぜ6Mになるの？】\n辛巳の日生まれ。地支「巳」は12支の6番目なので数字は6。日干「辛」は金、地支「巳」は火で、火は日干を剋（こく）す関係（官星）なので英字はM（官星）。\n\n（60分類No.18＝診断カードのNo.と同じ番号です）" },
            { head: "7M 庚午 ──「なんでも知ってますって顔したドМ」", body: "🎭 表裏：どSのふりしたどM\n💬 決めゼリフ：「すべてあなたが決めてください」\n👤 日干の特徴：白黒、せっかち、頑固な頭の切れるチャレンジャー\n\n【なぜ7Mになるの？】\n庚午の日生まれ。地支「午」は12支の7番目なので数字は7。日干「庚」は金、地支「午」は火で、火は日干を剋（こく）す関係（官星）なので英字はM（官星）。\n\n（60分類No.7＝診断カードのNo.と同じ番号です）" },
            { head: "8M 癸未 ──「尽くしても報われないむなしいドМ」", body: "🎭 表裏：どSのふりしたどM\n💬 決めゼリフ：「すべてあなたが決めてください」\n👤 日干の特徴：疑い深いアブノーマルな魅力のある他人に寄り添う感覚派\n\n【なぜ8Mになるの？】\n癸未の日生まれ。地支「未」は12支の8番目なので数字は8。日干「癸」は水、地支「未」は土で、土は日干を剋（こく）す関係（官星）なので英字はM（官星）。\n\n（60分類No.20＝診断カードのNo.と同じ番号です）" },
            { head: "9M 甲申 ──「お人好しドМ」", body: "🎭 表裏：どSのふりしたどM\n💬 決めゼリフ：「すべてあなたが決めてください」\n👤 日干の特徴：挫折に弱く天然ボケだけどプライドの高いポジティブな人\n\n【なぜ9Mになるの？】\n甲申の日生まれ。地支「申」は12支の9番目なので数字は9。日干「甲」は木、地支「申」は金で、金は日干を剋（こく）す関係（官星）なので英字はM（官星）。\n\n（60分類No.21＝診断カードのNo.と同じ番号です）" },
            { head: "10M 乙酉 ──「私は全然自信ないい点張りのドМ」", body: "🎭 表裏：どSのふりしたどM\n💬 決めゼリフ：「すべてあなたが決めてください」\n👤 日干の特徴：生まれながらのネガティブだけど協調性のある控えめな温厚な人\n\n【なぜ10Mになるの？】\n乙酉の日生まれ。地支「酉」は12支の10番目なので数字は10。日干「乙」は木、地支「酉」は金で、金は日干を剋（こく）す関係（官星）なので英字はM（官星）。\n\n（60分類No.22＝診断カードのNo.と同じ番号です）" },
            { head: "11M 壬戌 ──「食いしん坊万歳なドМ」", body: "🎭 表裏：どSのふりしたどM\n💬 決めゼリフ：「すべてあなたが決めてください」\n👤 日干の特徴：疑い深いアブノーマルだけど魅力的な変化に強い感覚派\n\n【なぜ11Mになるの？】\n壬戌の日生まれ。地支「戌」は12支の11番目なので数字は11。日干「壬」は水、地支「戌」は土で、土は日干を剋（こく）す関係（官星）なので英字はM（官星）。\n\n（60分類No.59＝診断カードのNo.と同じ番号です）" },
            { head: "12M 丁亥 ──「証拠が欲しいドМ」", body: "🎭 表裏：どSのふりしたどM\n💬 決めゼリフ：「すべてあなたが決めてください」\n👤 日干の特徴：控えめだけど目立って自分が輝くおしゃれさん\n\n【なぜ12Mになるの？】\n丁亥の日生まれ。地支「亥」は12支の12番目なので数字は12。日干「丁」は火、地支「亥」は水で、水は日干を剋（こく）す関係（官星）なので英字はM（官星）。\n\n（60分類No.24＝診断カードのNo.と同じ番号です）" },
        ] },
        { head: "🌀 P（比劫星）──「ひとたらしな自己中」の12タイプ", body: "日干と地支が同じ五行のグループ。決めゼリフは「すべてわたしの気分です」。自分と同質なので自分中心。\n\n【比劫星（ひごうせい）ってどんな星？】\n「自我と仲間」の星です。自分自身と同じ質のエネルギーで、自立心・マイペース・対等な仲間意識を象徴します。誰にも支配されず、誰も支配しない。自分の気分とペースを何より大事にします。\n\n【比劫星が強い人の傾向】\n・自分軸がぶれない。人と比べられるのが嫌い\n・仲間は大事だけど、ベタベタした上下関係は苦手\n・「わたしの気分です」＝やる気スイッチは自分の内側にしかない\n・このアプリの能力でいうと a実行力・b計画力（レールのマイペース・マイウェイ）と同じ星のエネルギーです", children: [
            { head: "1P 壬子 ──「仕事命、でも自由でのんびりも大好きな自己中」", body: "🎭 表裏：コミュニケーション苦手なふりしたひとたらしな自己中\n💬 決めゼリフ：「すべてわたしの気分です」\n👤 日干の特徴：疑い深いアブノーマルだけど魅力的な変化に強い感覚派\n\n【なぜ1Pになるの？】\n壬子の日生まれ。地支「子」は12支の1番目なので数字は1。日干「壬」は水、地支「子」は水で、水は日干と同じ五行（比劫星）なので英字はP（比劫星）。\n\n（60分類No.49＝診断カードのNo.と同じ番号です）" },
            { head: "2P 己丑 ──「プライド高めのめんどくさがりの自己中」", body: "🎭 表裏：コミュニケーション苦手なふりしたひとたらしな自己中\n💬 決めゼリフ：「すべてわたしの気分です」\n👤 日干の特徴：妄想しがちでしつこいけど穏やかでフレンドリーな優しい人\n\n【なぜ2Pになるの？】\n己丑の日生まれ。地支「丑」は12支の2番目なので数字は2。日干「己」は土、地支「丑」は土で、土は日干と同じ五行（比劫星）なので英字はP（比劫星）。\n\n（60分類No.26＝診断カードのNo.と同じ番号です）" },
            { head: "3P 甲寅 ──「わが道をいく天然な自己中」", body: "🎭 表裏：コミュニケーション苦手なふりしたひとたらしな自己中\n💬 決めゼリフ：「すべてわたしの気分です」\n👤 日干の特徴：挫折に弱く天然ボケだけどプライドの高いポジティブな人\n\n【なぜ3Pになるの？】\n甲寅の日生まれ。地支「寅」は12支の3番目なので数字は3。日干「甲」は木、地支「寅」は木で、木は日干と同じ五行（比劫星）なので英字はP（比劫星）。\n\n（60分類No.51＝診断カードのNo.と同じ番号です）" },
            { head: "4P 乙卯 ──「闇の中からフェロモンにあふれる自己中」", body: "🎭 表裏：コミュニケーション苦手なふりしたひとたらしな自己中\n💬 決めゼリフ：「すべてわたしの気分です」\n👤 日干の特徴：生まれながらのネガティブだけど協調性のある控えめな温厚な人\n\n【なぜ4Pになるの？】\n乙卯の日生まれ。地支「卯」は12支の4番目なので数字は4。日干「乙」は木、地支「卯」は木で、木は日干と同じ五行（比劫星）なので英字はP（比劫星）。\n\n（60分類No.52＝診断カードのNo.と同じ番号です）" },
            { head: "5P 戊辰 ──「優しい顔した切れたらめちゃ怖い自己中」", body: "🎭 表裏：コミュニケーション苦手なふりしたひとたらしな自己中\n💬 決めゼリフ：「すべてわたしの気分です」\n👤 日干の特徴：頑固でずぼらだけど包容力のある優しい人\n\n【なぜ5Pになるの？】\n戊辰の日生まれ。地支「辰」は12支の5番目なので数字は5。日干「戊」は土、地支「辰」は土で、土は日干と同じ五行（比劫星）なので英字はP（比劫星）。\n\n（60分類No.5＝診断カードのNo.と同じ番号です）" },
            { head: "6P 丁巳 ──「カリスマに見えてしまう自己中」", body: "🎭 表裏：コミュニケーション苦手なふりしたひとたらしな自己中\n💬 決めゼリフ：「すべてわたしの気分です」\n👤 日干の特徴：控えめだけど目立って自分が輝くおしゃれさん\n\n【なぜ6Pになるの？】\n丁巳の日生まれ。地支「巳」は12支の6番目なので数字は6。日干「丁」は火、地支「巳」は火で、火は日干と同じ五行（比劫星）なので英字はP（比劫星）。\n\n（60分類No.54＝診断カードのNo.と同じ番号です）" },
            { head: "7P 丙午 ──「自己愛があふれる自己中」", body: "🎭 表裏：コミュニケーション苦手なふりしたひとたらしな自己中\n💬 決めゼリフ：「すべてわたしの気分です」\n👤 日干の特徴：表舞台に立つわたしが主役な一言多いおしゃれさん\n\n【なぜ7Pになるの？】\n丙午の日生まれ。地支「午」は12支の7番目なので数字は7。日干「丙」は火、地支「午」は火で、火は日干と同じ五行（比劫星）なので英字はP（比劫星）。\n\n（60分類No.43＝診断カードのNo.と同じ番号です）" },
            { head: "8P 己未 ──「怖がりだけど、やりとげる自己中」", body: "🎭 表裏：コミュニケーション苦手なふりしたひとたらしな自己中\n💬 決めゼリフ：「すべてわたしの気分です」\n👤 日干の特徴：妄想しがちでしつこいけど穏やかでフレンドリーな優しい人\n\n【なぜ8Pになるの？】\n己未の日生まれ。地支「未」は12支の8番目なので数字は8。日干「己」は土、地支「未」は土で、土は日干と同じ五行（比劫星）なので英字はP（比劫星）。\n\n（60分類No.56＝診断カードのNo.と同じ番号です）" },
            { head: "9P 庚申 ──「相棒がいないと立ってられない仕事マンの自己中」", body: "🎭 表裏：コミュニケーション苦手なふりしたひとたらしな自己中\n💬 決めゼリフ：「すべてわたしの気分です」\n👤 日干の特徴：白黒、せっかち、頑固な頭の切れるチャレンジャー\n\n【なぜ9Pになるの？】\n庚申の日生まれ。地支「申」は12支の9番目なので数字は9。日干「庚」は金、地支「申」は金で、金は日干と同じ五行（比劫星）なので英字はP（比劫星）。\n\n（60分類No.57＝診断カードのNo.と同じ番号です）" },
            { head: "10P 辛酉 ──「見えないけど本当は自分さえよければいい自己中」", body: "🎭 表裏：コミュニケーション苦手なふりしたひとたらしな自己中\n💬 決めゼリフ：「すべてわたしの気分です」\n👤 日干の特徴：白黒、せっかち、辛口のくせに繊細で美意識と責任感で生きてる人\n\n【なぜ10Pになるの？】\n辛酉の日生まれ。地支「酉」は12支の10番目なので数字は10。日干「辛」は金、地支「酉」は金で、金は日干と同じ五行（比劫星）なので英字はP（比劫星）。\n\n（60分類No.58＝診断カードのNo.と同じ番号です）" },
            { head: "11P 戊戌 ──「めんどうなことは一刀両断の自己中」", body: "🎭 表裏：コミュニケーション苦手なふりしたひとたらしな自己中\n💬 決めゼリフ：「すべてわたしの気分です」\n👤 日干の特徴：頑固でずぼらだけど包容力のある優しい人\n\n【なぜ11Pになるの？】\n戊戌の日生まれ。地支「戌」は12支の11番目なので数字は11。日干「戊」は土、地支「戌」は土で、土は日干と同じ五行（比劫星）なので英字はP（比劫星）。\n\n（60分類No.35＝診断カードのNo.と同じ番号です）" },
            { head: "12P 癸亥 ──「わが道しかいけない天才的な自己中」", body: "🎭 表裏：コミュニケーション苦手なふりしたひとたらしな自己中\n💬 決めゼリフ：「すべてわたしの気分です」\n👤 日干の特徴：疑い深いアブノーマルな魅力のある他人に寄り添う感覚派\n\n【なぜ12Pになるの？】\n癸亥の日生まれ。地支「亥」は12支の12番目なので数字は12。日干「癸」は水、地支「亥」は水で、水は日干と同じ五行（比劫星）なので英字はP（比劫星）。\n\n（60分類No.60＝診断カードのNo.と同じ番号です）" },
        ] },
        { html: true, head: "📋 60タイプ早見表（No.順）", body: "<div class=\"rel-scroll\"><table class=\"rel-table\"><tr><th>コード</th><th>日柱</th><th>No.</th><th>一言でいうと</th></tr><tr><th>1C</th><td>甲子</td><td>1</td><td style=\"text-align:left\">自分が大好きな子供</td></tr><tr><th>2S</th><td>乙丑</td><td>2</td><td style=\"text-align:left\">いつも眠たいドS</td></tr><tr><th>3C</th><td>丙寅</td><td>3</td><td style=\"text-align:left\">気難しいとっつきにくい子供</td></tr><tr><th>4C</th><td>丁卯</td><td>4</td><td style=\"text-align:left\">目立つ人の後ろで輝きたい子供</td></tr><tr><th>5P</th><td>戊辰</td><td>5</td><td style=\"text-align:left\">優しい顔した切れたらめちゃ怖い自己中</td></tr><tr><th>6C</th><td>己巳</td><td>6</td><td style=\"text-align:left\">好きなことには貪欲な子供</td></tr><tr><th>7M</th><td>庚午</td><td>7</td><td style=\"text-align:left\">なんでも知ってますって顔したドМ</td></tr><tr><th>8C</th><td>辛未</td><td>8</td><td style=\"text-align:left\">１０００倍速な子供</td></tr><tr><th>9C</th><td>壬申</td><td>9</td><td style=\"text-align:left\">頭の良い子供</td></tr><tr><th>10C</th><td>癸酉</td><td>10</td><td style=\"text-align:left\">おバカか？賢いかの2極な子供</td></tr><tr><th>11S</th><td>甲戌</td><td>11</td><td style=\"text-align:left\">えーかっこしいのドS</td></tr><tr><th>12C</th><td>乙亥</td><td>12</td><td style=\"text-align:left\">ネガティブな勘が良く当たる子供</td></tr><tr><th>1M</th><td>丙子</td><td>13</td><td style=\"text-align:left\">苦労を買ってするドМ</td></tr><tr><th>2A</th><td>丁丑</td><td>14</td><td style=\"text-align:left\">スマートなふるまいをする大人</td></tr><tr><th>3M</th><td>戊寅</td><td>15</td><td style=\"text-align:left\">変態（オタク、マニア）に見えない変態（オタク、マニア）なドМ</td></tr><tr><th>4M</th><td>己卯</td><td>16</td><td style=\"text-align:left\">変態（オタク、マニア）マニアックなドМ</td></tr><tr><th>5C</th><td>庚辰</td><td>17</td><td style=\"text-align:left\">面白くないと全く動かない子供</td></tr><tr><th>6M</th><td>辛巳</td><td>18</td><td style=\"text-align:left\">うだうだ言うけどやるドМ</td></tr><tr><th>7S</th><td>壬午</td><td>19</td><td style=\"text-align:left\">大胆なモテモテドS</td></tr><tr><th>8M</th><td>癸未</td><td>20</td><td style=\"text-align:left\">尽くしても報われないむなしいドМ</td></tr><tr><th>9M</th><td>甲申</td><td>21</td><td style=\"text-align:left\">お人好しドМ</td></tr><tr><th>10M</th><td>乙酉</td><td>22</td><td style=\"text-align:left\">私は全然自信ないい点張りのドМ</td></tr><tr><th>11A</th><td>丙戌</td><td>23</td><td style=\"text-align:left\">わかりやすい上から目線な大人</td></tr><tr><th>12M</th><td>丁亥</td><td>24</td><td style=\"text-align:left\">証拠が欲しいドМ</td></tr><tr><th>1S</th><td>戊子</td><td>25</td><td style=\"text-align:left\">目覚めたらど変態（オタク、マニア）のドS</td></tr><tr><th>2P</th><td>己丑</td><td>26</td><td style=\"text-align:left\">プライド高めのめんどくさがりの自己中</td></tr><tr><th>3S</th><td>庚寅</td><td>27</td><td style=\"text-align:left\">態度でかめの小心者のどS</td></tr><tr><th>4S</th><td>辛卯</td><td>28</td><td style=\"text-align:left\">裏と表だけ時速200キロのドSウサギ</td></tr><tr><th>5M</th><td>壬辰</td><td>29</td><td style=\"text-align:left\">好きなもの以外どうでもいいドМ</td></tr><tr><th>6S</th><td>癸巳</td><td>30</td><td style=\"text-align:left\">小さな場所なら自信満々のドS</td></tr><tr><th>7A</th><td>甲午</td><td>31</td><td style=\"text-align:left\">ナチュラルビューティーな大人</td></tr><tr><th>8S</th><td>乙未</td><td>32</td><td style=\"text-align:left\">切れたら怖すぎる自己肯定低めのドS</td></tr><tr><th>9S</th><td>丙申</td><td>33</td><td style=\"text-align:left\">THE芸能人私みてみてすごいでしょなドS</td></tr><tr><th>10S</th><td>丁酉</td><td>34</td><td style=\"text-align:left\">頭の良いキレッキレのドS</td></tr><tr><th>11P</th><td>戊戌</td><td>35</td><td style=\"text-align:left\">めんどうなことは一刀両断の自己中</td></tr><tr><th>12S</th><td>己亥</td><td>36</td><td style=\"text-align:left\">常識があるようで全くないどS</td></tr><tr><th>1A</th><td>庚子</td><td>37</td><td style=\"text-align:left\">イヤなものはとことんイヤでも我慢する大人</td></tr><tr><th>2C</th><td>辛丑</td><td>38</td><td style=\"text-align:left\">何でもできちゃうけど一番が苦手な人見知りの子供</td></tr><tr><th>3A</th><td>壬寅</td><td>39</td><td style=\"text-align:left\">私に任せて安心だから！の大人</td></tr><tr><th>4A</th><td>癸卯</td><td>40</td><td style=\"text-align:left\">一途な心配性、世間体が大事な大人</td></tr><tr><th>5S</th><td>甲辰</td><td>41</td><td style=\"text-align:left\">怒らせたらいけないどS</td></tr><tr><th>6A</th><td>乙巳</td><td>42</td><td style=\"text-align:left\">霊感人間、執念はとび級大人</td></tr><tr><th>7P</th><td>丙午</td><td>43</td><td style=\"text-align:left\">自己愛があふれる自己中</td></tr><tr><th>8A</th><td>丁未</td><td>44</td><td style=\"text-align:left\">自己愛ばかり、愛したら命がけの大人</td></tr><tr><th>9A</th><td>戊申</td><td>45</td><td style=\"text-align:left\">隠してるつもり、でもバレバレの上から目線な大人</td></tr><tr><th>10A</th><td>己酉</td><td>46</td><td style=\"text-align:left\">めんどくさいと言いながら断らず引き受ける大人</td></tr><tr><th>11C</th><td>庚戌</td><td>47</td><td style=\"text-align:left\">都合のいいこと、好きなことだけしか聞かない子供</td></tr><tr><th>12A</th><td>辛亥</td><td>48</td><td style=\"text-align:left\">私が一番、名誉も一番、一番が大好き大人</td></tr><tr><th>1P</th><td>壬子</td><td>49</td><td style=\"text-align:left\">仕事命、でも自由でのんびりも大好きな自己中</td></tr><tr><th>2M</th><td>癸丑</td><td>50</td><td style=\"text-align:left\">決めたら早いおっとり屋のドМ</td></tr><tr><th>3P</th><td>甲寅</td><td>51</td><td style=\"text-align:left\">わが道をいく天然な自己中</td></tr><tr><th>4P</th><td>乙卯</td><td>52</td><td style=\"text-align:left\">闇の中からフェロモンにあふれる自己中</td></tr><tr><th>5A</th><td>丙辰</td><td>53</td><td style=\"text-align:left\">イヤイヤ言うけどそうでもない大人</td></tr><tr><th>6P</th><td>丁巳</td><td>54</td><td style=\"text-align:left\">カリスマに見えてしまう自己中</td></tr><tr><th>7C</th><td>戊午</td><td>55</td><td style=\"text-align:left\">いつでもポジティブマンの子供</td></tr><tr><th>8P</th><td>己未</td><td>56</td><td style=\"text-align:left\">怖がりだけど、やりとげる自己中</td></tr><tr><th>9P</th><td>庚申</td><td>57</td><td style=\"text-align:left\">相棒がいないと立ってられない仕事マンの自己中</td></tr><tr><th>10P</th><td>辛酉</td><td>58</td><td style=\"text-align:left\">見えないけど本当は自分さえよければいい自己中</td></tr><tr><th>11M</th><td>壬戌</td><td>59</td><td style=\"text-align:left\">食いしん坊万歳なドМ</td></tr><tr><th>12P</th><td>癸亥</td><td>60</td><td style=\"text-align:left\">わが道しかいけない天才的な自己中</td></tr></table></div><div class=\"rel-note\">横にスクロールできます。英字ごとの一覧は上のグループを開いてください。</div>" },
      ]
    },
    {
      icon: "💼", menu: "ビジネス版", title: "ビジネス版 ── 3分類×12タイプの仕事・商売攻略",
      intro: "お客さん・部下・経営者としての12動物。まず3分類（MOON/EARTH/SUN）で買い方の傾向をつかみ、12タイプで細かい攻略法を見てください。",
      items: [
        { type: "info", head: "ビジネス版ってなに？", body: "「十二運と12動物」のビジネス版です。同じ12動物を、お客さん・部下・経営者として見たときの攻略法をまとめました。\n\nまず3分類（MOON・EARTH・SUN）で、お金の使い方・判断基準の大きな傾向をつかみます。\n・🌙 MOON＝理性タイプ ──「良いか悪いか」で判断（こじか・黒ひょう・たぬき・ひつじ）\n・🌏 EARTH＝比較タイプ ──「必要か不要か」で判断（狼・猿・虎・子守熊）\n・☀️ SUN＝感性タイプ ──「好きか嫌いか」で判断（チータ・ライオン・ゾウ・ペガサス）\n\n次に12タイプ（動物ごとのビジネス名。例：狼＝オリジナルタイプ）で細かい攻略法を見ます。それぞれに\n🛒 マーケティング（お客さんとしてのクセ）／📢 営業アプローチ（売り方・クロージング）／🧑‍💼 マネジメント（部下としての育て方）／👑 経営者版（トップになったときの顔）\nがあります。お客さんや取引先に使うときは、その人の本質（日柱）の動物で見るのが基本です。\n\n📅 リズム（年・月の運気）×ビジネスの話は、解説「10リズム」の各リズム内『💼ビジネスでの活かし方』にあります。" },
        { head: "🌙 理性タイプ（MOON）──「良いか悪いか」で判断", body: "対象：こじか・黒ひょう・たぬき・ひつじ（月グループ）\n\nモノやサービスを消費するとき、「良いか悪いか」という社会的規範や価値観をよりどころにして、理性的・知的な判断基準を優先するタイプ。\n\n【ストーリーとしての価値】\n商品のブランドや機能性より、感動のある開発ストーリー、しっかりした商品コンセプト、他者評価の高さなどが、意思決定を促進させる。\n\n【好む商品ジャンル】\n高単価・高品質・クオリティ・サービスが充実しているもの。それにそぐわない場合は、価格で選択するケースも。\n\n【要点】\n🛒 ①レビューを熟読 ②複数の商品を慎重に比較検討 ③お店の雰囲気や店員の態度が悪いと、気に入ったものがあってもそこでは買わない\n📢 ①商品メリットを順序立ててしっかりアピール ②次々と湧き出る疑問に丁寧に答える ③商談の前に誠実さをアピールして信頼を得る\n🧑‍💼 ①和気あいあいとしたグループワークが好き ②喜ばれ感謝されるとますます頑張る ③給料が上がることより、仕事を高く評価されることに喜びを感じる", children: [
            { head: "🛒 マーケティング ── 欲しい→「なぜ？」を考える", body: "行動を起こすときに「なぜ、こうなのか」という根本的な理由が納得できないと、次に進めないタイプ。自分の決断、他人の行動、商品の成り立ちなど、行動を起こすために必要な「理由」を強く求めます。他人の影響を受けやすく、自分の「欲しい」気持ちだけより「誰かのため」「みんなが言うなら」など大義名分があるほうが決断のハードルが下がります。人間的な温かさ・つながりを大切にし、冷たく機械的な印象を受けると敬遠しがちです。\n\n【キーワード】\n・自分を慕う人が好き／上から目線はNG\n・事前の情報収集に余念がない\n・情に弱い／情に訴えられると断れない\n・お金の話はサラッと済ませる\n・オススメに響く（知ってる人の）\n・思いやりや気遣いに弱い\n・レビューや人の意見が気になる\n・なぜ？が明確にならないと話が進まない\n・意見を聞いてくれる人を信頼する\n・「誰かの為に」が響く\n・手書き等のひと手間に感動する\n・不安を聞いてほしい\n・過程や詳細の透明性が大事\n・理念や使命感で動く\n・嘘のない親切な対応に心を開く\n・ストーリー性に響く\n・クオリティの高さを求める\n・NOをハッキリ言えない\n・欲しいと思っていても買うまで時間がかかる\n・パイオニアを信頼する\n\n【消費行動例】\nどの帽子を買うかで1時間ほど迷っていたのに、遅れてきた親友の「こっちが似合ってるよ」の一言ですぐに購入を決めた。" },
            { head: "📢 営業アプローチ ── 「なぜ？」に丁寧に答え、信頼関係を築く", body: "まず話をしっかり聞き、丁寧な対応を心がけ、誠実な人間として評価されること。買いたい気持ちはあっても購入までに小さなハードルがあるため、順序立てて話を進めながら「なぜ？」にしっかり付き合い、そのつど納得を得られる説明でクリアしていくことが重要です。他人の購入例やレビューの提示も効果的。とくに信頼する人からの後押しは絶大な効果があります。\n\n【基本】\n・納得が得られるまで言葉を尽くして説明する\n・商談の前に誠実さをアピールして信頼を得る\n・顧客自身に興味を示して気持ちを引き出す\n・次々と湧き出る疑問に丁寧に答える\n\n〈アプローチの方法〉\n・初対面のときは人の紹介があると会ってもらいやすい\n・役に立つ提案や情報を提供しながらアプローチすると警戒心が解ける\n・アンケートの回答を求めながら近づく手法も有効\n・相手の想いや意見は否定せず受け入れる（傾聴して気持ちを大切にする）。そこから軌道修正\n\n〈クロージングの方法〉\n・明確な理由がなく迷っている場合は、一問一答を繰り返しながら迷いを解消していく\n・その商品の購入は誰もが認める賢い選択であることを強調する\n・買った場合のメリットと買わなかった場合のデメリットを比べ、買わないと損だと自覚させる\n・注文書の内容に従って質問しながら記入し、最後にサインや押印をもらう\n\n【販促アプローチ例】\n高額トレーニングジムの申し込み時、「お金の大部分はトレーナーの育成にかかっている」と、トレーナー育成カリキュラムの緻密さと会社のビジョン・信頼性を熱く説明すると納得して入会してくれた。" },
            { head: "🧑‍💼 マネジメント ── 感謝されたいから頑張る", body: "和気あいあいとした雰囲気や、みんなで一緒のチームワークを大事にするタイプ。他人がどう考えるかに配慮し相手の意見を尊重するため、部署間の橋渡しや進行役、部下の育成に向いています。コツコツと信頼関係を築き、人に喜んでもらい感謝されるために頑張ります。「理由」や「役割」を明確にするほど集中して取り組み、給与より仕事ぶりの評価に喜びを感じ、働く意欲をかきたてられます。\n\n【キーワード】\n・面倒見がよく、相談されたら親身になって応じる\n・世のため人のためになる仕事には全力を尽くす\n・事前の情報収集に労力を惜しまない\n・失敗をいつまでも引きずり、立ち直るのに時間がかかる\n・会議は他の人の意見を聞きすぎる面もあり、まとまるのに時間がかかる\n・ヒューマニズムなグループワーク\n・人から喜ばれる、感謝されることでモチベーションが上がる\n・行動を起こすときに「なぜそうなのか？」が理解できないと次に進めないことがある\n・人とのつながり・あたたかさ・関係性を大切にする\n\n【マネジメント例】\nこのタイプの社長は忙しい合間を縫って、社員だけでなくアルバイトの学生の誕生日にまで毎年手書きの手紙を手渡ししている。" },
        ] },
        { head: "🌏 比較タイプ（EARTH）──「必要か不要か」で判断", body: "対象：狼・猿・虎・子守熊（地球グループ）\n\nモノやサービスを消費するとき、「必要か不要か」という自分自身の判断基準を優先するタイプ。\n\n【必要性という価値】\n流行やシェア率に引きずられることなく、いま買う必要があるか、そのタイミングか、コストパフォーマンスで優位かなど、より現実に即した情報が意思決定を促進させる。\n\n【好む商品ジャンル】\n内容と価格のバランスのよいもの、コストパフォーマンスのよいもの。\n\n【要点】\n🛒 ①類似商品とじっくり比較検討したい ②人の意見や評価に左右されず、自分が納得したものを買う ③コストパフォーマンスを重視する\n📢 ①くどくど説明せず、手短・論理的な説明を ②結論から伝える ③ノリに任せた一貫性のないトークはNG\n🧑‍💼 ①やることに無駄がなく仕事を効率よくこなす ②つねにマイペースで協調性に欠ける面も ③プロセスより成果や結果を徹底的に求める", children: [
            { head: "🛒 マーケティング ── 欲しい→比べる", body: "マイペースで自分の意見をしっかり持っているこのタイプは、他人の意見に左右されず、自分で考えて納得した上で購入を決断します。とくにコストパフォーマンスや、過程・結果の透明性を重視。同じものなら安さや利便性のいい所で買うリアリストです。急かされるのを嫌い、じっくり比較検討して良いモノ・必要なモノを選びます。セット販売やセールなど価格情報に敏感です。\n\n【キーワード】\n・お試し商品でまずは使ってもらう\n・質問には端的に素早く回答\n・決断が早い（引き際も）\n・手入れ道具や付属品購入率が高い\n・一目で分かるグラフが有効\n・普段使いの商品購入が多い\n・相手の聞きたい情報を伝えるだけでいい\n・数字的な根拠が重要／お金の話を先に聞きたい\n・あやふやな状態では決断しない\n・類似商品を比較できる資料\n・最初の決断をあまり変えない\n・納得しているかの確認を小まめにとる\n・一貫性のある話\n・効能やメリットが簡潔で分かりやすいもの\n・契約などに強い\n・顧客の意見に合うものを用意するのがベスト\n・本心を聴きだすまで粘り強くお願いする\n・リピートや購入に繋がりやすい\n・デメリット・メリットを包み隠さず知りたい\n・しっかりとしたアポイントを取っておく\n・好きなモノや趣味から話を膨らませる\n・実績を伝えると信頼する\n・独自性・希少価値のある商品\n・自分で判断できる材料が欲しい\n・自分の希望でカスタムできる要素がある\n・時間短縮やお手軽アピール\n・決断を急かされたくない／効能効果が明確\n\n【消費行動例】\n電化製品を買いに行くと、一軒目では決めずに必ずいつも行くお店を何軒かチェックしてから、一番コストパフォーマンスの高い所で買うまで歩き回る。" },
            { head: "📢 営業アプローチ ── 必要事項だけを正確かつ簡潔に", body: "すべての行動に自分の意見や意図があるこのタイプに、あやふやで一貫性のないトークはNG。事実に基づき要・不要の判断を下すので、検討や熟慮のための必要事項を簡潔に伝えます。質問には速度よりも正確性を重視して返答するほうが信用されます。何を言いたいのか？どうして欲しいのか？メリット・デメリットは？を事前に準備し、ゴールに向かって一直線に進める無駄のないアプローチが◎。\n\n【基本】\n・競合商品と比べ、どこが優れているかを明快に伝える\n・セールスポイントを端的にアピール\n・利用シーンが具体的に浮かぶトーク\n・説明は手短に論理的に（結論から）\n\n〈アプローチの方法〉\n・長々とした前置きは無用、単刀直入にアプローチ\n・記念品や粗品があると話がスムーズ\n・質問形式でアプローチを始めるとよい\n・目的、内容を整理して順番に伝える\n\n〈クロージングの方法〉\n・買わない理由を自覚していないこともあるので一問一答形式でハッキリさせる\n・AとBどちらが良いと思うかなど選択肢を限定して購入に導く\n・「今が絶好の機会」「これでラストチャンス」など買い時アピールで購買意欲を高める\n・購入後のメリットと購入しなかった時のデメリットを比較し、今が買い時と納得させる\n\n【販促アプローチ例】\n中古車販売で、以前のオーナーが手間暇かけた内部仕様やオプションがタダ同然でついてくることなど料金に関わるお得感と、要所要所での意思確認を行いながら説明することで購入してくれた。" },
            { head: "🧑‍💼 マネジメント ── 目標達成に一直線に進む", body: "最適な方法を考えてから行動に移すタイプ。考えをハッキリさせ、目標達成へ一直線に進もうとします。人にペースを合わせること、無駄が多いこと、協調性が重要な仕事は苦手。手順・ノルマ・目標が明確な分野で実力を発揮し、白黒ハッキリさせる仕事をキッチリこなします。職人気質で取り組む専門職や、成果が数字で見える営業職・中間管理職向き。負けず嫌いで、競争やゲーム性に意欲をかきたてられる企業戦士。自分の流儀を持っています。\n\n【キーワード】\n・パーソナルスペース、守られた自立ワーク\n・プロセスより成果や結果にモチベーションが上がる\n・自分で決めたプランで結果を出すことに喜びを感じる\n・最適な方法を明確に考えてから行動に移す\n・曖昧なままでは進みにくい傾向がある\n・行動に移すために必要な「目的」と「期日」を強く求める\n・チームプレーは苦手で、個人プレーに徹する傾向あり\n・付き合い・接待・社交辞令が天才的に下手\n・プロ意識が強く、専門分野を徹底的に究める\n・失敗はあまり気にしない、落ち込んでも立ち直りが早い\n・仕事に一途で意欲的\n・やることに無駄がなく、仕事を効率よくこなす\n・会議はポイントを押さえたレジュメに沿って時間内に終わらせる\n・仕事とプライベートはきっちり分ける\n\n【マネジメント例】\nこのタイプの同僚は不愛想なので新人に怖がられているが、自分で決めた期限内にきっちり納得のいく仕事をする頼れる存在だ。" },
        ] },
        { head: "☀️ 感性タイプ（SUN）──「好きか嫌いか」で判断", body: "対象：チータ・ライオン・ゾウ・ペガサス（太陽グループ）\n\nモノやサービスを消費するとき、「好きか嫌いか」という感覚や気分を判断基準として優先するタイプ。\n\n【記号としての価値】\n商品のシンボル性・記号としての価値が重要。その商品の象徴的な価値や、身につける・所有することで得られる満足感・優越感をイメージすることが、意思決定を促進させる。\n\n【好む商品ジャンル】\n嗜好性・趣味性が強く、人目に出るパブリックな空間で使う機会が多いもの。「このブランドなら安心」「ハズレがない」などの判断材料があることが重要。\n\n【要点】\n🛒 ①値段や機能性よりもメーカーやブランドが大事 ②他人から羨ましがられるものが好き ③欲しいと思ったらすぐに買う\n📢 ①「自分だけ特別扱いされたい」という満足感を与えるサービス ②スピーディな対応 ③人柄や商品より「ステイタス」をアピール\n🧑‍💼 ①大きな仕事を任されるほど張り切る ②計画性がなく、その日の気分やノリで仕事の進め方が変わる ③職場の雰囲気を盛り上げるムードメーカー", children: [
            { head: "🛒 マーケティング ── 欲しい→すぐ買う", body: "「欲しい」という自分の気持ちに素直に従うこのタイプは、他人の評価やコストパフォーマンスよりも、その瞬間に感じるインパクトや購入後のよいイメージが後押しになります。気分の落差が大きいので購入決定時に一番テンションが上がり、そのとき買わないと興味が薄れる傾向があります。ステイタスの高いモノに惹かれ、権威ある人のおススメや有名ブランドに信頼を置きます。\n\n【キーワード】\n・メリットのみを知りたい\n・新商品やトレンドに敏感\n・自分をプラスにさせる\n・使用時のよいイメージが響く\n・ゴージャスで上品なモノが響く\n・過大広告、極端な方が響く\n・世界を感じさせる商品／横文字が響く\n・面倒な説明や手間は省く\n・気分のいいときに決定までもっていく\n・話題性が重要\n・将来が明るくなるような提案\n・カリスマやNo.1を信頼する\n・プロ仕様や専門性を提示\n・おだてに弱い\n・決めたことにとやかく言われたくない\n・聞かれたことには明確に答える\n・権威や有名人も使用などの威光に響く\n・誰もが認めるブランドを強調\n・人に自慢できる要素を伝える\n・呼ばれたらすぐに駆け付ける\n・労力の少なさ（便利さ）をアピール\n・特別扱いが響く\n・シチュエーションに酔いやすい\n・プロのお任せコースに頼りたい\n・日常的な商品は安さ重視で何でもいい\n・流れるようにスムーズに事を運ぶ\n・分かりやすさ重視\n・好きなモノには奮発する（一点豪華主義）\n・意思確認は不要（問い詰めてはいけない）\n・優秀さやリッチな雰囲気が好き\n\n【消費行動例】\n友達の家電製品の下見について行っただけなのに、気づいたら自分のほうが高額な家電を買っていた。" },
            { head: "📢 営業アプローチ ── ノリよく持ち上げ、スピーディに", body: "長い説明より、アピールポイントを分かりやすく一言で伝えるほうが響くタイプ。気分の上がり下がりが激しく、時間が経つと考えも変わってくるため、相手のテンションを見極めてノリよくスピーディに話を進め、一気に決断まで持ち込むのがベスト。「限定」「今だけ」など決断を早めるアプローチも効果的。おだてや特別扱いに弱いですが、機嫌の悪いときは出直して再訪問するほうが賢明です。\n\n【基本】\n・自分だけ特別扱いされたいという満足感を与える対応\n・クロージングのタイミングを逃さない\n・人柄や商品よりステイタスをアピール\n・スピーディな対応\n\n〈アプローチの方法〉\n・この人が尊敬している人からの紹介状を持参できると話はスムーズ\n・礼儀作法や敬意を表現すると喜ばれる\n・心を込めた褒め言葉からアプローチを始めるとよい\n・今日と明日では違う反応をするが、サラッと受け流して再度連絡をする（粘らず、出直す）\n\n〈クロージングの方法〉\n・迷っている段階でも購入決定済みと考えて質問を重ねると、決断がスムーズになりやすい\n・「あなただけ」「特別な方だけ」と限定感を感じさせて決断を促す（気分をあげる言葉）\n・お客様の家族、友人などのアドバイスをトークに活用する\n・決断から購入までのお手続きを推す\n\n【販促アプローチ例】\n海外の最新シワ取りクリームの説明時に「ハリウッド女優が使っていた！アメリカのCNNでも紹介された」など認知度とステイタス性を伝えるだけで購入が決まった。" },
            { head: "🧑‍💼 マネジメント ── 大きな仕事ほど張り切るムードメーカー", body: "大きな仕事や前例のない仕事ほど張り切り、出世欲が強いタイプ。まずはやってみてから考えるスタイルで、その日の気分で仕事の進め方が変わります。目立つ人が多く、職場の雰囲気をガラリと変えるムードメーカー。社交辞令がうまい世渡り上手で、外商や交渉役向き。細かい面倒な作業は苦手で、手っ取り早く楽な方法をいつも探しています。人を頼ったり任せたりするのがうまく、上の立場やフリーに動ける環境でイキイキと働きます。\n\n【キーワード】\n・自由な環境とネットワーク\n・大きなビジョンや可能性にモチベーションが上がる\n・ステータスのあるポジションや賞賛を浴びることに喜びを感じる\n・状況に応じて優先順位を変化させながら物事を進めていく\n・行動に移すには、自分の想いやイメージが心に響くかどうか\n・感性、可能性、心、広がりを大切にする\n・どうすればいち早くゴールにたどり着くか？という視点で行動する\n・付き合い・接待・社交辞令が天才的に上手い\n・地位・名誉・権力が大好きで、出世欲が強い\n・誰も思いつかないような型破りなアイデアがひらめく\n・失敗はあまり気にしない、落ち込んでも立ち直りが早い\n\n【マネジメント例】\nこのタイプの同僚は、細かく指示を出すA上司のときは成果も元気もなかったが、あまり口出ししないB上司になってから部署で一番の成果を上げるようになった。" },
        ] },
        { head: "🐺狼 オリジナルタイプ ── 初志貫徹（Going My Way）", body: "動物：狼（EARTH＝比較タイプ／十二運：胎）／英語名：ORIGINAL TYPE", children: [
            { head: "📗 キーワード・特徴", body: "🔑 キーワード：独自性／頭で勝負／ユニーク／マイウェイ／オリジナリティ\n\n【特徴】\n・1人だけの時間と空間が好き\n・自分しかできないことでNo.1を目指す\n・初志貫徹の精神\n・ペースを乱されるのを嫌う\n・「××流」自己流を持っている\n・臨機応変の対応は苦手" },
            { head: "🛒 マーケティング ── お客さんとしてのクセ", body: "・独自性・希少価値のある商品\n・自分で判断できる材料が欲しい\n・自分の希望でカスタムできる要素がある\n・時間短縮やお手軽アピール\n・決断を急かされたくない\n・効果効能が明確" },
            { head: "📢 営業アプローチ ── 売り方とクロージング", body: "【基本】\n・競合商品と比べ、どこが優れているかを明快に伝える\n\n〈アプローチ〉効くキーワード：オリジナリティ／特別に／特別仕様\n・奨めたい商品以外のものを強調する\n・あまり話しかけずにじっくり考える時間を与える\n・薦めたい商品を相手の目の前に置いて他の商品を説明する\n\n〈商品説明の仕方〉\n・順を追って説明する\n・話がいきなり飛躍するなど、一貫性のない説明はNG\n・一気に関係を詰めず、徐々に関係性を深めていく\n\n〈決断のタイミング〉\n・決断のスピードは遅い\n・本人の納得のいくまで、急かさないことがポイント\n\n〈クロージング〉\n・買わない理由を本人が自覚していないこともあるので一問一答形式ではっきりさせるとよい（納得させる）\n・「ほかに類を見ない商品なのですが…」\n\n✍️ 手書きメモより\n・時間を与える。間がある。\n・「気になるのは値段ですか？デザインですか？」" },
            { head: "🧑‍💼 マネジメント ── 部下としての育て方", body: "【仕事ぶり】\n・独自の発想力や企画力を持っている\n・人から指示されるよりも、自分がやりたいように仕事を進めたい\n・付き合い・接待・社交辞令・ゴマすりなどは嫌い\n・自己主張が強いが、相手の意見も納得できれば素直に認める\n\n【育て方の手順】\n① ニーズと仕組みを理解させる\n② 順序立てて、ストーリー性のあるプレゼンテーションができるようにさせる\n③ 学んだものを自分流にアレンジし期限を決めて実践させる\n④ 目標設定をして計画を立てさせ、独自のやり方で計画を遂行できるように努力させる\n\n【陥りやすい点】\n・マニュアル通りの方法を教えず、自分なりの解釈で人に教える\n・放任主義で好き勝手にさせてしまう\n・ワンマンプレーに走り出す\n\n【目指すリーダー像】他の人とは違う戦術で結果を生み出すリーダーを目指す\n\n【事例】限定・希少価値のある商品を多く扱う靴屋が、業績不振の対策で一般的な靴に変更したら売り上げが下がった。調べたところこのタイプの顧客が多かったので、以前より限定・希少な商品中心に置き直すことで売り上げがUPした。" },
            { head: "👑 経営者版 ── トップになったときの顔", body: "【本質】\n狼タイプの経営者は「一匹狼」のイメージ。ひとりの時間と空間が好きで、このトップへの最高のサービスは「放っておくこと」。孤高で個性的、マイペースの自信家で、あれこれ指示されると反発します。初対面ではとっつきにくい感じですが、非凡な人生を目指すユニークな考え方は極めて魅力的。人マネが大嫌いで、自分にしかできないことでナンバーワンを目指し、役職が上がるほど強固なリーダーシップを発揮します。最大の賛辞は「変わってるね」。\n\n【成功経営者】\n代表は船井総研の船井幸雄氏。ひとりで過ごす時間を大切にし、他人からの干渉を嫌い、誰かに頼ることなく自分で解決しようとします。独特の感覚から発想することが得意で、自分の分野でのナンバーワンを目指し、新しいアイデアや面白いプランを考え出します。経営コンサルタント会社を世界で初めて上場させました。\n有名人：二宮和也、浅田真央\n\n【ビジネスルール8か条】\n1. 仕事のペースを乱されるのを嫌う\n2. 自分流のやり方でナンバーワンをめざす\n3. 何事も計画通りに進めたがる\n4. 変わっていると見られるのがうれしい\n5. たとえ親友であっても距離は置きたい\n6. 思ったことはハッキリ発言する\n7. 誤解されやすいが人間味にあふれている\n8. 群れることを嫌い孤高を通す\n\n【付き合い方】\n言葉足らずのところがあるので、一を聞いて十を知るゾウが一番狼を理解します。想像力や感性が豊かで同じ価値観を持つ子守熊もうまく付き合える相手。部下として使いやすいのはライオン・ペガサス・チータ。前置きから始まってじっくり腰を据えて話をしたがるMOONグループ（こじか・黒ひょう・たぬき・ひつじ）には、思っていることがなかなか伝わりにくく苦手です。出世や派閥、権力闘争には興味なし。独自の発想と自分流のペースで、やるべき仕事を計画的に着実に遂行します。誰にでも公平で誠実に評価し、仕事に忠実で独自に考える部下を愛するので、意見が食い違ったときは徹底的にやり合うことで信頼関係が築けます。" },
        ] },
        { head: "🦌こじか セキュリティタイプ ── 興味津々（What?）", body: "動物：こじか（MOON＝理性タイプ／十二運：養）／英語名：SECURITY TYPE", children: [
            { head: "📗 キーワード・特徴", body: "🔑 キーワード：信頼／安全性／本物／探究心／原理\n\n【特徴】\n・好奇心旺盛\n・初対面では警戒心が強い\n・大勢の中でも親しい人しか話さない\n・駆け引きや裏表のある対応は苦手\n・安心できる環境作りが大切\n・人を育てたり教えたりするのが大好き" },
            { head: "🛒 マーケティング ── お客さんとしてのクセ", body: "・不安を聞いてほしい\n・過程や詳細の透明性が大事\n・理念や使命感で動く\n・嘘のない親切な対応に心を開く\n・ストーリー性に響く\n・クオリティの高さを求める" },
            { head: "📢 営業アプローチ ── 売り方とクロージング", body: "【基本】\n・納得が得られるまで言葉を尽くして説明する\n\n〈アプローチ〉効くキーワード：高品質／安全性／自然の\n・まずは自分を気に入ってもらう\n・商品の話に終始しない\n\n〈商品説明の仕方〉\n・調査資料やデータを有効に使いながら、商品の魅力を訴求する\n・メリットだけでなくデメリットも正直に話すことで信頼を得る\n・誠意をもって接し、サポート体制を明確にする\n\n〈決断のタイミング〉\n・決断のスピードは遅いが、信頼している店や人がすすめると速い\n・「この商品で大丈夫」と安心して決断できるよう、販売側がリードする\n\n〈クロージング〉\n・注文書の内容に従って質問しながら記入し、最後にサインや押印をもらう\n・「安心してお使いいただけますよ」\n\n✍️ 手書きメモより\n・セキュリティタイプは待っている。押してほしい。\n・一言「返品もできますよ」" },
            { head: "🧑‍💼 マネジメント ── 部下としての育て方", body: "【仕事ぶり】\n・和気あいあいとしたグループワークが好き\n・世のため人のためになる仕事には全力を尽くす\n・任された仕事は、最後まで責任を持ってやり通す\n・失敗をいつまでも引きずり、立ち直るのに時間がかかる\n\n【育て方の手順】\n① ニーズや仕組みがなぜ必要なのかを理解させる\n② 効率を上げる手法として、ビジネスに必要な資料や商品等の収集方法を教える\n③ 小さくまとまらない組織作りをさせる\n④ 「私たちがやらなければ」という意識を持たせ、このビジネスに対して使命感を持たせることが大事\n\n【陥りやすい点】\n・成果や実績が伴うと強気の態度に変わる\n・いつまでも単独行動ができない\n・一つ一つの成果に評価を求める\n\n【目指すリーダー像】人間関係の質にこだわり、ビジネス以外でも絆が壊れないリーダーを目指す\n\n【事例】このタイプの顧客には、自分の提案よりも顧客の話を最後まで聞きとおすことで信頼され、その後の提案はほとんど受け入れてくれるようになった。" },
            { head: "👑 経営者版 ── トップになったときの顔", body: "【本質】\nこじかタイプの経営者は「赤ちゃん」のイメージ。好奇心が旺盛で、愛情をいつも感じていたい。かまってほしいし、親しくなるとわがままになるし、好き嫌いが激しい。駆け引きや裏表のある対応は大嫌いで、子どものように素直で純真。みんなに好かれたい八方美人で、相手の人柄がすべて。好奇心旺盛な反面、警戒心がとても強く、初対面の人にはすぐに心を開きません。人を教えたり育てたりするのはうまいが、好き嫌いの激しさで人間関係では苦労も。地道に仕事をこなす姿と「和」を尊ぶ潤滑油的な存在は高く評価されます。ノルマのない仕事で力を発揮します。\n\n【成功経営者】\n代表は藤田田氏（日本マクドナルド・日本トイザらス創業者のカリスマ経営者）。子どものように純粋な心の持ち主で感情を隠すのが苦手、駆け引きや裏表のある対応はできない人格者。自分や相手を傷つけるのが嫌い。人を見抜く洞察力を持ち、社交性を発揮して成功するタイプ。著書『ユダヤの商法』でユダヤ商法の鉄則を紹介しています。\n有名人：大沢たかお、安室奈美恵\n\n【ビジネスルール8か条】\n1. 相手の人柄をまず第一に考える\n2. 好奇心旺盛だが緊張感は持続しない\n3. 皆からかまわれたいと思っている\n4. 与えられた仕事をコツコツこなす\n5. 親切な指導で新人からの信頼は厚い\n6. 人を気遣いすぎてストレスをためる\n7. 駆け引きが苦手で押しに弱い\n8. 職場での自分に対する評価が気になる\n\n【付き合い方】\nかまってもらわないとストレスがたまるタイプ。サービス精神旺盛で何でも言うことを聞いてくれる頼れる子守熊、いつも一緒にいて何でも相談に乗ってくれるひつじが欠かせないパートナーです。状況や環境に合わせて対応してしまうこじかは、計画的に物事を進めるEARTHグループ（狼・猿・虎・子守熊）にフォローしてもらうのが最適。SUNグループ（チータ・ライオン・ゾウ・ペガサス）は移り気なのでペースが合いにくく、思うようには動いてくれません。好き嫌いが激しく気難しい印象ですが、根は飾らず素直で、信頼を第一に考える律儀で世話好きな人。表面からは想像できない情熱も秘めています。教え好きなので、指導を乞うと喜ばれます。" },
        ] },
        { head: "🐒猿 フィーリングタイプ ── 短期決戦（White Or Black）", body: "動物：猿（EARTH＝比較タイプ／十二運：長生）／英語名：FEELING TYPE", children: [
            { head: "📗 キーワード・特徴", body: "🔑 キーワード：すぐ使える／即効性／短期的／白黒ハッキリ／お得\n\n【特徴】\n・乗せられると弱い\n・なんでもゲーム感覚で楽しむ\n・すぐに結果を出したい\n・ギブ＆テイクの駆け引き\n・気配りしながらムードを盛り上げる\n・短期決戦の勝負に強い" },
            { head: "🛒 マーケティング ── お客さんとしてのクセ", body: "・お試し商品でまずは使ってもらう\n・質問には端的に素早く回答\n・決断が早い（引き際も）\n・コストの話が一番聞きたい\n・一目で分かるグラフが有効\n・普段使いの商品購入が多い" },
            { head: "📢 営業アプローチ ── 売り方とクロージング", body: "【基本】\n・利用シーンが具体的に浮かぶトークを展開\n\n〈アプローチ〉効くキーワード：コストパフォーマンス／値引き／おまけ／下取り\n・「今回に限り」を強調する\n・商品を置いていき、自由に使わせる\n\n〈商品説明の仕方〉\n・堅苦しくなくフレンドリーかつ明快な説明を好む\n・「お得感」を数字で表す\n・ものを渡すときは直接相手の目を見て渡す\n\n〈決断のタイミング〉\n・損得、必要、不要を素早く判断する即決タイプ\n・「早いもの勝ち」「ラスト1点」などの売り文句に弱い\n\n〈クロージング〉\n・「今が絶好の機会」「これでラストチャンス」など買い時アピールで購買意欲を高める\n・「早速今日から使えますよ」\n\n✍️ 手書きメモより\n・おまけのために購入する（ドリームタイプも好き）" },
            { head: "🧑‍💼 マネジメント ── 部下としての育て方", body: "【仕事ぶり】\n・仕事に一途で、意欲的\n・やることに無駄がなく、仕事を効率よくこなす\n・仕事の成果は、表彰よりも報酬で評価してほしい（✍️どちらかと言うと報酬がちょっと上）\n・失敗したら素早く原因を突き止め、さっさと先に進む\n\n【育て方の手順】\n① ニーズと仕組みを理解させる\n② 予定を一日いっぱい埋められるように目標設定をさせる\n③ 自分の満足ではなく聞き手側が理解できる「わかりやすさ」をプレゼンテーションで徹底させる\n④ 短期的な目標を掲げて計画を立てさせ、競争相手を決めゲーム感覚で達成させるクセをつけさせる\n\n【陥りやすい点】\n・目標が小さすぎる\n・人と比較して自分はできていると判断する\n・すぐに結果を求めてしまい、押し付け的な考えが前に出だす\n\n【目指すリーダー像】やりたい事をやりたい時にやりたいだけできるリーダーを目指す\n\n【事例】このタイプの社長は契約時も最初から申込書ばかり気になっていた様子だったので、見積書を見せて自分で考えてもらい、その後にアドバイスをして最終判断をしてもらうとすぐに決まった。" },
            { head: "👑 経営者版 ── トップになったときの顔", body: "【本質】\n猿タイプの経営者は「小学三年生のカツオくん」のイメージ。落ち着きがない、信じやすい、堅苦しい雰囲気に弱い。目的と指示を明確にしてあげないとダメで、人マネがうまく、手先も器用で愛嬌があり、仕事も遊びもうまくやる人気者。世渡り上手ですが人情の機微には弱く、合理性が強く出すぎると孤立してしまうことも。攻めの仕事で力を発揮します。今日を精一杯生きるのが猿型経営者。ほめられたいために頑張る。何事も短期決戦です。\n\n【成功経営者】\n代表は小倉昌男氏（ヤマト運輸元会長・宅急便の生みの親）。社交的でやや親分肌、堅苦しい雰囲気を嫌うフランクな人柄。心の奥に燃えたぎる情熱と大きな野心を秘め、理想の実現に向けて邁進する潔さが魅力。短期で利益を出すことに全力投球し、創業5年で採算点をクリア。「宅急便は絶対に儲かる」という信念を周囲に証明しました。モットーは攻めの経営・行政に頼らぬ自立の精神。ゲーム感覚で名付けた「クロネコヤマトの宅急便」は今日も世界に羽ばたいています。\n有名人：北野武、黒木瞳\n\n【ビジネスルール8か条】\n1. 生来の社交性を効果的に活用する\n2. 堅苦しさに弱く緊張感に欠ける\n3. 良き指導者を得れば実力を発揮できる\n4. 同じ場所にじっとしていられない\n5. 何でも器用にこなし重宝される\n6. 早合点してそそっかしいミスをする\n7. 気が短く長期計画には向かない\n8. 損得勘定が先立ち人情味に欠ける\n\n【付き合い方】\nSUNグループ（チータ・ライオン・ゾウ・ペガサス）はすぐに動いてくれて「あ・うん」の呼吸でいられる、基本的に動かしやすいグループ。EARTHグループ（狼・虎・子守熊）も結果を重視するので、猿の思考パターンを理解してくれます。しかしMOONグループ（こじか・黒ひょう・たぬき・ひつじ）は結論を出すのに時間がかかるため、苦手な相手です。" },
        ] },
        { head: "🐆チータ スピードタイプ ── 迅速果断（Dash）", body: "動物：チータ（SUN＝感性タイプ／十二運：沐浴）／英語名：SPEED TYPE", children: [
            { head: "📗 キーワード・特徴", body: "🔑 キーワード：BIG／POWER／今すぐ／成功／世界的視野\n\n【特徴】\n・成功願望が強い\n・欲しいと思ったらすぐ買う\n・プライドが高い\n・超プラス思考\n・軽はずみな人の良さがある\n・大きな数字には強いが小さな数字には興味がない" },
            { head: "🛒 マーケティング ── お客さんとしてのクセ", body: "・デメリットはいらない・メリットのみ知りたい\n・新商品やトレンドに敏感\n・使用時の良いイメージが響く\n・過大広告、極端な方が響く\n・面倒な説明や手間は省く\n・自信たっぷりな対応を信頼する" },
            { head: "📢 営業アプローチ ── 売り方とクロージング", body: "【基本】\n・何も言わず先回りの対応は嬉しい\n・スピーディな対応が成果を招く（12タイプの中で1番最速）\n\n〈アプローチ〉効くキーワード：抜群に…／カッコイイ／意欲\n・高い商品をあえて勧めない\n・専門的な話をしすぎない\n\n〈商品説明の仕方〉\n・メリットを数字で示せるとなお良い\n・選択肢を広げて迷わせるより、一つに絞った説明を心がける\n・その日の内に結論を出す可能性が高いので申込用紙必須\n\n〈決断のタイミング〉\n・即断即決\n・決断後はすぐに手応えをほしがる。スムーズな納品がポイント\n\n〈クロージング〉\n・迷っている段階でも購入決定済みと考えて質問を重ねると、決断がスムーズになりやすい\n・「TVや広告で有名な…」" },
            { head: "🧑‍💼 マネジメント ── 部下としての育て方", body: "【仕事ぶり】\n・若いころからトップを目指し、成功を夢見て全力疾走する\n・大きな仕事を任されるほど張り切る\n・世界を舞台に活躍することを考えている\n・目立ったり注目されたりするのが快感で、スタンドプレーが多い\n\n【育て方の手順】\n① ビジネスの発展性と可能性を理解させる\n② まずやるべき事を絞り基本をしっかり習得させ、見直しと点検の習慣を徹底させる\n③ 順序立てて必要なキャリアを習得させる\n④ 大きな目標に期限を設定し、そのために常に今何をするのか？を意識させる\n\n【陥りやすい点】\n・人からのアドバイスを素直に受けない\n・飽きやすく、面倒と思うことはやらなくなる\n・他力本願になる\n\n【目指すリーダー像】スピード出世や何かのNo.1といった記録保持者のリーダーを目指す\n\n【事例】このタイプの上司に丁寧に話をすればするほど冷たく対応されていたが、報告を簡潔にポイントのみで伝えると「最近変わったね」と評価がよくなり、上司との関係が変わった。" },
            { head: "👑 経営者版 ── トップになったときの顔", body: "【本質】\nチータタイプの経営者は「高校三年生」のイメージ。人前でカッコつけたがる、話も態度も大きい、超プラス志向。成功願望が強くプライドも人一倍高い。欲しいと思ったらすぐ買う、早とちりが多い、瞬発力はあるが長続きしない。社交的な人気者ですが、自分を頼る人を厚遇し、反抗する人を冷遇する傾向があります。逆境に強く前向きに努力するチャレンジャー。ただし目標を変えてしまいがち。好奇心旺盛な起業家タイプが多いです。\n\n【成功経営者】\n代表は任天堂「中興の祖」の山内溥氏。花札やカードゲーム製造の比較的地味な企業だった任天堂を、幾度もの倒産の危機を乗り越えて世界的企業へ成長させました。世界初のプラスチック製トランプ、ディズニーキャラクターを初めて絵柄に使う大胆な発想、そしてファミコンの歴史的大ヒットにより、娯楽企業としての今日の地位を築き上げました。\n有名人：石田純一、仲間由紀恵\n\n【ビジネスルール8か条】\n1. 夢の実現のために人一倍がんばる\n2. 好奇心旺盛でどんなことにも挑戦する\n3. プライドが高く極度に強気である\n4. 繊細なハートを持ち傷つきやすい\n5. 早合点をしてお人好しな面がある\n6. 超プラス志向で悲観論を嫌う\n7. 味方には親切だが敵には冷たい\n8. 攻めは強いが守りは弱く諦めが早い\n\n【付き合い方】\n人前に出ると良いところを見せようと張り切ってしまうタイプ。こじかのように温かく包み込んでくれるキャラクターが最適なパートナーです。ペガサスやゾウとは同じSUNグループで分かり合えますし、ひつじや黒ひょうは言うことを聞いてくれる便利な存在なので大事にしてください。ただし、はっきりものを言う虎などのEARTHグループには逆に使われてしまいます。" },
        ] },
        { head: "🐈‍⬛黒ひょう パイオニアタイプ ── 新進気鋭", body: "動物：黒ひょう（MOON＝理性タイプ／十二運：冠帯）／英語名：PIONEER TYPE", children: [
            { head: "📗 キーワード・特徴", body: "🔑 キーワード：最新の／スマート／日々新たに／新技術／かっこいい\n\n【特徴】\n・メンツやプライド・立場にこだわる\n・スマートにリーダーシップを取りたい\n・新しいものが大好き\n・話し合いから自分のペースを作る\n・先行逃げ切り型\n・情報に敏感" },
            { head: "🛒 マーケティング ── お客さんとしてのクセ", body: "・自分を慕う人が好き\n・上から目線はNG\n・事前の情報収集に余念がない\n・情に弱い\n・お金の話はサラッと済ませる\n・まわりより一足先に新商品を買う" },
            { head: "📢 営業アプローチ ── 売り方とクロージング", body: "【基本】\n・顧客自身に興味を示して気持ちを引き出す\n\n〈アプローチ〉効くキーワード：話題の…／最新機能の…／新製品\n・他社の製品との明確な違いを説明する\n・スマートさを強調\n\n〈商品説明の仕方〉\n・メンツやプライドを傷つけないように言葉を選んで\n・商品に対する自信と確信をもって明快に説明する\n・ビジネス自体が世間的にどう支持され普及しているかがわかる資料が必要\n\n〈決断のタイミング〉\n・決断のスピードは速いが、即決はしない（✍️即決すると「買わされた」と思う）\n・先見性があることを明確にすると、決断のスピードは速くなる\n\n〈クロージング〉\n・買った場合のメリットと買わなかった場合のデメリットを比べ「買わないと損だ」と自認させる\n・「まだこの辺りではあなたは◯人目なんですよ」\n\n✍️ 手書きメモより\n・自分の得意分野以外の物は決断するが即決は遅い\n・説明の中で名前・役職を呼ぶと気分が良くなる" },
            { head: "🧑‍💼 マネジメント ── 部下としての育て方", body: "【仕事ぶり】\n・リーダーシップに優れ、人をまとめるのが得意\n・事前の情報収集に労力を惜しまない\n・面倒見がよく、相談されたら親身になって応じる\n・失敗はすぐに報告せず、自分なりに結論を出してから報告する\n\n【育て方の手順】\n① ニーズや仕組みがなぜ必要なのかを理解させる\n② 人よりも一歩先・二歩先のスタートを追いかけさせる\n③ ただこなすだけではなく結果を重視させる\n④ 目標設定し計画を立てさせ、初めは低くても達成を優先し「達成が当たり前」と意識付けていく\n\n【陥りやすい点】\n・情報収集に偏って実務が乏しくなり、プライドを傷つけられるとやる気をなくす\n・自分の話ばかりを始める\n\n【目指すリーダー像】誰からも頼られるよう、結果主義と人格主義を兼ね備えたリーダーを目指す\n\n【事例】このタイプの顧客が購入を迷っていたので「この地域での購入者はまだいませんよ！」と独占・先進的であるという情報を伝えると、即決で購入していただけた。" },
            { head: "👑 経営者版 ── トップになったときの顔", body: "【本質】\n黒ひょうタイプの経営者は「成人式を迎えた二十歳」のイメージ。新しもの好き、傷つきやすい、スマートに生きたいがキーワード。最大の特徴は新しもの好きで、「まだ誰も知らない」などの言葉にイチコロです。「誰も持っていない」「いち早く」というこだわりの一方、「こうなったらどうしよう」と思い悩む心配性。正義感が強く信念を曲げない頑固さも秘め、批判精神が強く容易に心を開きません。重要なのは「カッコいいか、カッコ悪いか」。成果は人前で褒めることがご褒美。手堅く、情報通で頼りがいのある個性派です。\n\n【成功経営者】\n代表はマイクロソフト創業者のビル・ゲイツ氏。スマートでおしゃれ。時代の先端を行くトレンドを追いかけ、人がまだ知らないことをいち早くキャッチして話題にします。外面的には腰が低く、まめに気を配って粘り強い社交をします。人のために尽くすことを厭わない厚い義理人情の持ち主。早期に現役を引退して慈善活動に専念しているのはその本質の現れ。直感力に優れ、高度な駆け引きと説得力には目を見張るものがあります。\n有名人：手塚治虫、綾瀬はるか\n\n【ビジネスルール8か条】\n1. メンツにこだわる誇り高き知性派\n2. カッコよくスマートに仕事をこなす\n3. いち早く情報を入手する能力に長ける\n4. 攻めに強く守りに弱い攻撃型\n5. スタートが肝心の先行逃げ切りタイプ\n6. おしゃれで美意識が強い気取り屋\n7. 好みが激しく喜怒哀楽が出やすい\n8. 不正を許さない正義の味方\n\n【付き合い方】\nMOONグループ（こじか・たぬき・ひつじ）の中でははっきりものを言うタイプ。狼には指示がよく伝わり、言われた通りにやってくれるので最良のキャラクターです。ただし虎は人の「言い方」が気になり時々ぶつかり合うので注意。こじかやひつじには、なんとなく面倒を見てあげたくなる関係です。SUNグループの中でも特にライオンは思い通りにならないので、直接ビジネスを一緒にするのは避けたほうが無難。正義感が強く思い込みも激しいので、攻めているときは力を発揮しますが、守りに回るとトーンダウンしてしまいます。" },
        ] },
        { head: "🦁ライオン パーフェクトタイプ ── 権威主義", body: "動物：ライオン（SUN＝感性タイプ／十二運：建禄）／英語名：PERFECT TYPE", children: [
            { head: "📗 キーワード・特徴", body: "🔑 キーワード：確実性／キッチリ／完璧主義／絶対／社会的権威\n\n【特徴】\n・徹底的にこだわるので頑固に見える\n・その道の先生を目指す\n・礼儀正しく礼節を重んじる\n・世間体を気にする\n・決して弱音を吐かない\n・甘えん坊であるが甘え下手でもある" },
            { head: "🛒 マーケティング ── お客さんとしてのクセ", body: "・決めたことにとやかく言われたくない\n・聞かれたことには明確に答える\n・権威や有名人も使用などの威光に響く\n・誰もが認めるブランドを強調\n・人に自慢できる要素を伝える\n・呼ばれたらすぐに駆け付ける\n✍️ たいしたことが無い時は「大げさ」／本当にしんどい時は「大丈夫」／「ぜんぜん大丈夫」は気合" },
            { head: "📢 営業アプローチ ── 売り方とクロージング", body: "【基本】\n・人柄や商品よりステイタスをアピール\n\n〈アプローチ〉効くキーワード：多機能／アフターフォロー／完璧\n・礼儀礼節をかかさず接する\n・態度、服装に気を付ける\n\n〈商品説明の仕方〉\n・競合他社製品との違いを明確に説明する\n・ゆるぎない自信をもって勧める\n・このビジネスが社会的にどう位置づけられ評価されているかを説明する\n\n〈決断のタイミング〉\n・決断のスピードはやや遅い\n・決断までに問題がないかどうか、とことんチェックする\n\n〈クロージング〉\n・「あなただけ」「特別な方だけ」と限定感を感じさせて決断を促す\n・「どこから見ても非の打ちどころがない商品ですよ」\n\n✍️ 手書きメモより\n・他者評価が大切。マーケティング好き" },
            { head: "🧑‍💼 マネジメント ── 部下としての育て方", body: "【仕事ぶり】\n・地位・名誉・権力が大好きで、出世欲が強い\n・プロ意識が強く、専門分野を徹底的に究める\n・職場の雰囲気を盛り上げるムードメーカー\n・お金よりも、権力や名声に価値を感じる\n\n【育て方の手順】\n① ビジネスの発展性と可能性を理解させる\n② まずやるべき事を絞り基本をしっかり習得させる\n③ タイトルに似合う自分を作るための実力とプライドを養う\n④ 最高の目標達成をした自分を想像し、そのために今何をすべきかを常に考え意識させる\n\n【陥りやすい点】\n・自分のしていることを人に強要する\n・偏ったフォローをする\n・自分のやっていることを全て正当化する\n\n【目指すリーダー像】大舞台で表彰やスピーチができるリーダーを目指す\n\n【事例】このタイプのクライアントには、会社自体のブランド説明や海外展開などのスケールの大きい話、会社一押しのブランド商品の話をしつつ本題の商品を勧めると、上機嫌で契約していただけた。" },
            { head: "👑 経営者版 ── トップになったときの顔", body: "【本質】\nライオンはまさに百獣の王。威厳と強い意志を持ち、何事にも完璧を目指して努力します。プライドの高さも人一倍で、VIP待遇を喜びます。部下に対しては「わが子を谷底へ突き落とす」ほど育て方・教え方が厳しく、徹底的にしごいて育て、けじめのない人を嫌います。世間体を気にするタイプが多く、徹底的にこだわり、その道の先生を目指すレベル。礼儀・礼節・態度（お辞儀の仕方、名刺の渡し方、言葉遣いなど）に注意。なかなか人の意見を聞かず妥協しない面や、思い通りにいかないと機嫌を悪くする面もあります。\n\n【成功経営者】\nソフトバンクの孫正義氏やワタミの渡邉美樹氏などがいますが、代表はマツモトキヨシ創業者の松本清氏。一見腰が低いように見えますが、心の奥底には百獣の王らしいプライドの高さがあります。飾り気のない礼儀正しい経営者で、自分の運命は自分で切り開く独立心旺盛な努力家。妥協を許さない完璧主義者であるだけに、部下にも厳しい評価をします。社会的権威や実績を重視し、世間の評価や噂はまったく気にしません。何事も理詰めで考えて妥協を許さない姿勢が、独特の発想と行動力を生んでいます。\n有名人：向井理、福原愛\n\n【ビジネスルール8か条】\n1. 何事も理詰めで考えて妥協を許さない\n2. スパルタ式を信条とし部下には厳しく指導する\n3. 細かいことにこだわり口うるさい\n4. 礼儀礼節を気にして第一印象を重視する\n5. だらしがないのを嫌う\n6. 身だしなみは常にきちんとしている\n7. 機嫌のいい時と悪い時の落差が激しい\n8. 相手の立場・地位に応じて付き合い方を変える\n\n【付き合い方】\n基本的に「他人に厳しく、自分に甘い」ところがあり、部下からは敬遠されがち。しかし黒ひょう・こじか・チータは素直なので言うことを聞いてくれ、仕事もきちんとこなしてくれるビジネス上欠かせない存在です。一方、EARTHグループ（狼・猿・虎・子守熊）には指示がうまく伝わらず苦労するでしょう。そんなときは自分で指導するのではなく、黒ひょうやこじかを使って間接的に指示を出すとうまくいきます。仕事の上で弱音を吐く人を認めません。" },
        ] },
        { head: "🐯虎 バランスタイプ ── 中道精神", body: "動物：虎（EARTH＝比較タイプ／十二運：帝旺）／英語名：BALANCE TYPE", children: [
            { head: "📗 キーワード・特徴", body: "🔑 キーワード：バランス／一歩一歩／誠意／納得／負けない\n\n【特徴】\n・自由・平等・博愛主義\n・決めると徹底的にやる\n・全体像がつかめないとダメ\n・マイペースで基本に忠実\n・器用貧乏\n・笑いながらきつい一言が言える" },
            { head: "🛒 マーケティング ── お客さんとしてのクセ", body: "・本心を聞きたがるので単刀直入にお願いする\n・手入れ道具や付属品購入率が高い（✍️靴を購入したら靴磨きセットの提案をする）\n・デメリット・メリットを包み隠さず知りたい\n・しっかりとしたアポイントを取っておく\n・好きなモノや趣味から話を膨らませる\n・実績を伝えると信頼する" },
            { head: "📢 営業アプローチ ── 売り方とクロージング", body: "【基本】\n・説明は手短に端的に伝える（結論から）\n\n〈アプローチ〉効くキーワード：バランス／結果的には…\n・おだてて買わせようとするのは禁物\n・結果的に得だと納得させれば少々高くてもOK\n\n〈商品説明の仕方〉\n・商品によって得られる総合的なメリットを説明する\n・「基本的に〜」「これが基本の〜」など「基本」という言葉を多用する\n・言葉の印象をとても大事にするので軽はずみな言葉は使わない（✍️言い方でキレる）\n\n〈決断のタイミング〉\n・決断のスピードはやや遅い\n・疑問や不安をひとつひとつ取り除くことが、決断時の強い後押しになる\n\n〈クロージング〉\n・AとBどちらが良いと思うかなど選択肢を限定して購入に導く\n・「非常にバランスが取れた製品ですよ」" },
            { head: "🧑‍💼 マネジメント ── 部下としての育て方", body: "【仕事ぶり】\n・仕事に一途で、意欲的\n・常にマイペースで、協調性に欠ける面も\n・プロセスよりも成果や結果を徹底的に追求する\n・負けず嫌いで、ライバルが現れると燃える\n\n【育て方の手順】\n① ニーズと仕組みを理解させる\n② プレゼンテーションを聞かせながら疑問点を出させ、一つずつ納得させノウハウとして習得させていく\n③ 時間をかけて質疑応答をし、完全に納得させ自信につなげる\n④ 目標設定と計画を緻密に立て、スケジュールの全体像を常に把握させ全力投球で達成させる\n\n【陥りやすい点】\n・仕事の広がり方を意識しすぎてしまう\n・組織が安定し出すと、自分が動かなくなる\n・忠告のしすぎで周りの意識を下げてしまう\n\n【目指すリーダー像】有言したことが着実に実現し、段取りよく成果をあげていくリーダーを目指す\n\n【事例】このタイプの顧客への営業時に「考えておきます」と言われて断られたと思っていたら、半年後に連絡があり成約となった（すぐには決定せず、じっくり持ち帰って考える）。" },
            { head: "👑 経営者版 ── トップになったときの顔", body: "【本質】\n虎はどっしり構える「社長さん」のイメージ。多芸多才で何でもこなす、バランス感覚抜群の親分肌。キーワードは誠心誠意。自他に厳しく中途半端を嫌い、自己中心的なほどハッキリものを言うため、周囲から煙たがられる面もあります。お世辞を言わず、おだてにも乗らず、偏りのない考え方と正義感で信頼されます。即断即決は苦手。面倒見がよく悠然とした親分肌で、自由・平等・博愛主義がモットー。\n\n【成功経営者】\n代表はテンプスタッフ創業者の篠原欣子氏。米ビジネス誌『フォーチュン』に7年連続で「世界最強の女性経営者」に選ばれました。マイペースで悠々とした印象の経営者。弱い立場の者を守るために権力に立ち向かっていくような親分肌で、心を許した相手には誠心誠意を尽くします。温厚篤実な人柄ですが、何事にも積極的なプラス志向。一度着手したことを途中で放棄せず最後までやり抜く粘り強さを持ち、リーダーの資質に恵まれています。頭の回転が早く筋の通った正論を踏まえながら、理想を追いかけるロマンチストでもあります。\n有名人：明石家さんま、上野樹里\n\n【ビジネスルール8か条】\n1. 悠然とした雰囲気を持つ自信家\n2. 本音で生きる頑固な渡世人\n3. 公私混同せずけじめをつける\n4. バランス感覚抜群のスタイリスト\n5. 納得できないとテコでも動かない\n6. 決定事案は最後までやり抜く根性の人\n7. 全体像をつかんでから初めて着手する\n8. 自由・平等・博愛主義で反骨精神の人\n\n【付き合い方】\n思っていることをはっきり口に出します。何でも自分でやってしまわないと気がすまない面と、器用貧乏なところも。チータ・猿・ペガサスとは価値観が違いますが、彼らをほめておだてて上手に使うと素晴らしいチームになります。直球ばかりでなくカーブやスライダーも身につけると鬼に金棒。特に、ひつじ・たぬき・こじかに直球を投げ込むと仕事上の人間関係に亀裂が生じることがあるので気をつけて。バランス感覚抜群のリーダー資質を持っています。" },
        ] },
        { head: "🦝たぬき トラストタイプ ── 大器晩成", body: "動物：たぬき（MOON＝理性タイプ／十二運：衰）／英語名：TRUST TYPE", children: [
            { head: "📗 キーワード・特徴", body: "🔑 キーワード：経験／実績／究極／ブランド化／自信\n\n【特徴】\n・役割分担が好き\n・存在感がないとダメ\n・相手の依頼を断りにくい\n・粘り強い底意地がある\n・「はい、わかりました」と返事だけは良い\n・ほかのキャラクターにも化けられるがしっぽが出ている" },
            { head: "🛒 マーケティング ── お客さんとしてのクセ", body: "・NOをハッキリ言えない\n・欲しいと思っていても買うまで時間がかかる\n・情に訴えられると断れない\n・パイオニアを信頼する\n・究極の一品を買う\n・信用した人から買う" },
            { head: "📢 営業アプローチ ── 売り方とクロージング", body: "【基本】\n・商談の前に誠実さをアピールして信頼を得る\n\n〈アプローチ〉効くキーワード：究極の…／伝統の…\n・自信を持って勧め、信頼を与える\n・急かさずにじっくりと選ばせる\n\n〈商品説明の仕方〉\n・お互いに信頼しあえる人物であることを確認してから話を始める\n・いかに信頼性の高い商品であるかを徹底して話す\n・商品の理念や開発秘話を盛り込む\n\n〈決断のタイミング〉\n・決断のスピードはやや遅めで、実際の購入となるとさらに時間を要する傾向\n・口先だけの説明よりも、実際に製品を使ってもらい良さを体感させる\n\n〈クロージング〉\n・その商品の購入は誰もが認める賢い選択であることを強調する\n・「この商品には今まで1件もクレームが無いんですよ」\n\n✍️ 手書きメモより\n・「良いですね〜」からが長い\n・「運・縁・タイミング」これ以外は遅い" },
            { head: "🧑‍💼 マネジメント ── 部下としての育て方", body: "【仕事ぶり】\n・世のため人のためになる仕事には全力を尽くす\n・面倒見がよく、相談されたら親身になって応じる\n・飲み会などの幹事をさせると、ぬかりなく仕切る\n・仕事は真面目に取り組み、家庭やプライベートも大事にする\n\n【育て方の手順】\n① ニーズや仕組みがなぜ必要なのかを理解させる\n② 自己紹介から説明をはじめ、最初はできなくてもとにかく経験させる\n③ アプローチのみに集中させ、回数をこなして実績を作らせる\n④ 「私たちがやらなければ」という意識を持たせ、ビジネスに対する使命感を持たせることが大事\n\n【陥りやすい点】\n・根拠のない発言や将来性を語り出す\n・実績のみでビジネスへの取り組み姿勢を決め付ける\n・時間にルーズなところがあり、ダブルブッキング・大幅な遅刻が目立つ\n\n【目指すリーダー像】成功も失敗も経験した上で、しっかりした実績を積み上げたリーダーを目指す\n\n【事例】このタイプの顧客には、何度も何度も足を運び、お中元や年賀状など季節ごとのあいさつをしっかり繰り返すことで信頼を勝ち取れた。" },
            { head: "👑 経営者版 ── トップになったときの顔", body: "【本質】\nたぬきタイプの経営者は「会長さん」のイメージ。何事も経験と実績を重んじ、古いものや伝統あるものが好き。究極の逸品に弱く、天然ボケの人が多い。真面目な仕事ぶりで、与えられたものをコツコツとマイペースにこなします。職場の潤滑油的存在で、いつも周りからかわいがられるタイプ。「老舗」や「伝統」という言葉に弱く、見かけ倒しのカッコ良さには興味を示しません。抜けたところがあるのが愛嬌。信用を最優先して行動する堅実主義で、物事を最後までやり抜くタイプです。\n\n【成功経営者】\n代表格は本田宗一郎氏（ホンダ創業者）。※原本ではこのページの「成功経営者」欄の文章が黒ひょうのページ（ビル・ゲイツ氏）と同じ内容になっていたため、ここでは省略しています。\n有名人：タイガー・ウッズ、小雪\n\n【ビジネスルール8か条】\n1. 何事においても経験と実績を重視する\n2. 秩序を重んじ上下関係を大切にする\n3. どんな相手とも上手く合わせてやっていける\n4. 仕事を頼まれると断れずに受けてしまう\n5. 能力に合わせた役割分担を得意とする\n6. 仕事に自分なりのこだわりを持っている\n7. 「はい、わかりました」といい返事をする\n8. 他人の話をすぐ自分の話にする特技がある\n\n【付き合い方】\nなかなか本性を現しません。自分から率先して行動することもないので、猿・黒ひょう・狼といった行動派がパートナーとしてはオススメ。ただし猿や狼は「気持ちをくむ」ことが苦手なので、できるだけ具体的な指示を出さないと思い通りの結果が出ません。SUNグループ（チータ・ライオン・ゾウ・ペガサス）には苦手意識が拭えず、どうしても強く言えません。我慢強く人間関係を構築していく努力家です。" },
        ] },
        { head: "🐨子守熊 ドリームタイプ ── 長期展望", body: "動物：子守熊（EARTH＝比較タイプ／十二運：病）／英語名：DREAM TYPE", children: [
            { head: "📗 キーワード・特徴", body: "🔑 キーワード：夢／長期展望／最終的には／一生もの／将来性\n\n【特徴】\n・ぼーっとする時間がないと頑張れない\n・競争意識は強いが負ける勝負はしない\n・笑いを取るための毒舌家\n・最悪のケースを考えてから行動する\n・ロマンティストだが現実的\n・ペース配分が重要な勝負に強い" },
            { head: "🛒 マーケティング ── お客さんとしてのクセ", body: "・数字的な根拠が重要\n・お金の話を先に聞きたい\n・最初の決断をあまり変えない\n・納得しているかの確認を小まめにとる\n・一貫性のある話\n・効能やメリットが簡潔で分かりやすいもの" },
            { head: "📢 営業アプローチ ── 売り方とクロージング", body: "【基本】\n・セールスポイントを端的にアピール\n\n〈アプローチ〉効くキーワード：データ／疑問点は…\n・ひとつずつ問題をクリアしていく\n・使い勝手の良さを説明してあげる\n\n〈商品説明の仕方〉\n・商品開発の経緯など、ストーリー性のある話題で引き込む\n・嘘のない商品であることを徹底的にアピールする\n・最大値引きラインをあらかじめ設定し伝えておく（✍️「ここまで値引きできます、これ以上は無理です」と先に言う）\n\n〈決断のタイミング〉\n・よく考えたいのでやや遅い\n・時間を要しても、納得が得られるまで待つのがポイント\n\n〈クロージング〉\n・購入後のメリットと購入しなかった時のデメリットを比較し、今が買い時と納得させる\n・「一生使えるものですよ」\n\n✍️ 手書きメモより\n・言い訳が多い（バレた時の事を考えてから言い訳を考える）" },
            { head: "🧑‍💼 マネジメント ── 部下としての育て方", body: "【仕事ぶり】\n・負けず嫌いで、ライバルが現れると燃える\n・「報・連・相」は、要所要所でおこなう\n・仕事とプライベートはきっちり分ける\n・チームプレーは苦手で個人プレーに徹する\n\n【育て方の手順】\n① ニーズと仕組みを理解させる\n② 「いつまでに説明できるようになるのか？」という目的を持った計画を立てさせる\n③ プレゼンテーションの入り方とクロージングを徹底させる\n④ 長期の目標設定と計画を立てさせ、最悪の数字で動くと目標までどのくらいの年数がかかるのかを理解させる\n\n【陥りやすい点】\n・自分の成果を上げるために、仲間に対しても駆け引きをする\n・私利私欲的になりがちで、フォローする人を選ぶ\n・予定を入れすぎて身動きが取れなくなる\n\n【目指すリーダー像】それぞれの得意分野によって役割分担されたグループを編成するリーダーを目指す\n\n【事例】このタイプの顧客へは「これは一生使えます」「儲かる保険があれば興味ありますか？」の一言で興味をもってもらい、アポイントメントが取れた。" },
            { head: "👑 経営者版 ── トップになったときの顔", body: "【本質】\n子守熊タイプの経営者は「ゆったり休む老人」のイメージ。一見おとなしい人が多く、ボーッとしている時間がないと頑張れない。長期的展望に立って物事を捉え、20年後の夢のために今をがんばるタイプ。ロマンチストで現実派。負けん気が強く、負けるとわかっている勝負は絶対にしません。おとなしそうに見えて計算高く疑り深い面がありますが、その割にデータなどを示されると意外にコロッと説得されてしまうところも。とにかくムダを嫌う「省エネ」気質で、「最後に笑うのは自分だ」と思っています。\n\n【成功経営者】\n代表はダイエー創業者の中内功氏。自分が描いた夢や理想に向かって長期的な展望をする経営者。極めて意志が強く、ロマンチストで理想を持ちつつ、現実的な方法でそれを実現していきます。おとなしい印象ですが、簡単には人の話を信じない疑い深さも。義理人情に厚く裏切りはできないタイプで、一度受けた親切には必ず恩返しをする律儀さが、人の信望を集めるもとになっています。\n有名人：木村拓哉、宮崎あおい\n\n【ビジネスルール8か条】\n1. 損得勘定に長けた倹約・節約家で無駄を嫌う\n2. 一人でボンヤリ過ごす時間が何よりの気分転換\n3. 負ける勝負は避けて確実に勝てる勝負にのみ挑む\n4. 最後に笑うのは自分だと思っている\n5. 心配性なので「保険」は不可欠\n6. 「そんなうまい話などない」と醒めている\n7. 仕事中に軽く仮眠をとるとパワーアップする\n8. サービス精神旺盛なので取引先からの人気は抜群\n\n【付き合い方】\n常に長期的展望で物事を捉えるので、スケールの大きなライオンや虎、チータがお得意のキャラクターとなります。サービス精神が旺盛なので仕事の人間関係も良好。ただ「やるときはやる、遊ぶときは遊ぶ」に徹しているので、仕事とプライベートを割り切るのが下手なMOONグループ（こじか・黒ひょう・たぬき・ひつじ）が苦手です。人間関係が構築されないと心を開けないタイプだからです。" },
        ] },
        { head: "🐘ゾウ パッションタイプ ── 猪突猛進", body: "動物：ゾウ（SUN＝感性タイプ／十二運：死）／英語名：PASSION TYPE", children: [
            { head: "📗 キーワード・特徴", body: "🔑 キーワード：プロ／多角化／権力／努力／コツコツ\n\n【特徴】\n・その道のプロ・職人を目指す\n・何事も努力と根性\n・記憶力・同化吸収力に優れる\n・「俺たちに明日はない」的発想\n・敵味方の区別が極めて明確\n・報・連・相が苦手" },
            { head: "🛒 マーケティング ── お客さんとしてのクセ", body: "・イベント性のあるもの\n・話題性が重要\n・将来が明るくなるような提案\n・カリスマやNo.1を信頼する\n・プロ仕様や専門性を提示\n・「絶対・必ず」の強いフレーズが必要" },
            { head: "📢 営業アプローチ ── 売り方とクロージング", body: "【基本】\n・不安や不満、疑問はその場で取り除く\n\n〈アプローチ〉効くキーワード：絶対／大丈夫／ビッグネーム\n・細かい説明はいちいちしない\n・一番良いものから自信を持って勧める\n\n〈商品説明の仕方〉\n・質問をはぐらかさず、疑問点や不明点を残したまま話を次に進めない\n・商品だけでなく、商品の背景や企業姿勢まで話せるとなお良い\n・「将来的に」「権利収入」「相続できる」といった言葉を使うと興味がわいてくる\n\n〈決断のタイミング〉\n・即断即決\n・決断後の行動は速いが、その後の不安から何か行動したがる\n\n〈クロージング〉\n・お客様の家族・友人などのアドバイスをトークに活用する\n・「…スゴイ製品なんです」\n\n✍️ 手書きメモより\n・購入してから不安が続く（1〜3ヶ月が大切）。連絡を入れて安心してもらう" },
            { head: "🧑‍💼 マネジメント ── 部下としての育て方", body: "【仕事ぶり】\n・プロ意識が強く、専門分野を徹底的に究める\n・見せるだけである程度はできるようになる\n・スケジュール管理や、こまめな「報・連・相」は苦手\n・お金よりも、権力や名声に価値を感じる\n\n【育て方の手順】\n① ビジネスの発展性と可能性を理解させる\n② まずやるべき事を絞り基本を習得させ、期限を絶対守る癖・姿勢を身につけさせる\n③ プロ意識を持たせるためにビジネスの中から専門分野を見出し、それを育てる\n④ 大きな目標に期限を設定し、そのために常に今何をするのか？を意識させる\n\n【陥りやすい点】\n・報告・連絡・相談を全くしなくなる\n・不安材料が増えると、やる気がなくなる\n・利害関係を強く求める\n\n【目指すリーダー像】コツコツと我慢と忍耐を積み重ねたリーダーを目指す\n\n【事例】このタイプの顧客に「あの◯◯プロも愛用しているゴルフクラブです！」とプロや有名人も認める商品であることと、あとで人に話せる話題性のあるキーワードを出すことで購入していただけた。" },
            { head: "👑 経営者版 ── トップになったときの顔", body: "【本質】\nゾウタイプの経営者は、努力と根性が第一の必殺仕事人。「俺たちに明日はない」的な集中力で、妥協は絶対に認めず、やると決めたら最後までやり通さないと気がすみません。他人にも厳しさを求めます。人の話は聞かない、報・連・相ができない面も。身内意識が強く、敵に回した相手には徹底的に立ち向かうことも。根回しが多い、話が大きい、キレたときは最も怖い、細かい計算は苦手、といった特徴もあります。\n\n【成功経営者】\n代表は格安旅行最大手エイチ・アイ・エス創業者の澤田秀雄氏。飾り気のないさっぱりした性格で頼りになる親分肌。情緒に流されず何事も理詰めで割り切りますが、決して冷たいわけではなく、自由でいることを好み束縛が嫌いなだけ。常に目標を持って努力するのが好きで、やるべきことはその日のうちにすませるケジメを大切に、徹夜も平気。口八丁手八丁の行動主義ですが、人情の機微に疎い部分があるため、孤立しないような注意が必要です。\n有名人：中居正広、堀北真希\n\n【ビジネスルール8か条】\n1. 仕事熱心なので打ち込めるものが常に必要\n2. プロ意識が強く妥協を決して許さない\n3. 努力している姿を人に見られるのを嫌う\n4. 興味のない話にはまったく耳を傾けない\n5. 今日やるべきことはたとえ徹夜してでもすませる\n6. 瞬間、瞬間を尊ぶので待つことに耐えられない\n7. 過去の実績や世間の評価をとても気にする\n8. 普段は穏やかだがキレると自制がきかなくなる\n\n【付き合い方】\n「努力と根性」を身上とするプロ意識の強いタイプ。ビジネスに対する意識が低い人を許せません。最も動かしやすいのはたぬきで、良き理解者としてパートナーを組めます。いちいち細かく指示を出す必要のある相手は苦手ですが、自分は複数の仕事を同時に頼まれてもこなせます。大きな目標だけ決めれば後は臨機応変に対応できるので、大きな心で仕事仲間を包み込むと良いでしょう。" },
        ] },
        { head: "🐑ひつじ リサーチタイプ ── 温厚篤実", body: "動物：ひつじ（MOON＝理性タイプ／十二運：墓）／英語名：RESEARCH TYPE", children: [
            { head: "📗 キーワード・特徴", body: "🔑 キーワード：気配り／現実性／人脈／常識的／シミュレーション（✍️現実と空想の二面性がある／理念と利益のバランスが一番うまくいく）\n\n【特徴】\n・相談を受けるとすごくうれしい\n・皆で助け合いの精神\n・「和」を乱す人を最も嫌う\n・客観的に物事を判断する\n・情報収集家\n・信頼すると愚痴やボヤキが多くなる" },
            { head: "🛒 マーケティング ── お客さんとしてのクセ", body: "・オススメに響く（知ってる人の）\n・レビューや人の意見が気になる\n・なぜ？が明確にならないと話が進まない\n・意見を聞いてくれる人を信頼する\n・「誰かの為に」が響く\n・手書き等のひと手間に感動する" },
            { head: "📢 営業アプローチ ── 売り方とクロージング", body: "【基本】\n・次々と湧き出る疑問に丁寧に答える\n\n〈アプローチ〉効くキーワード：売れ筋／一般的／はずれのない（✍️定番の商品が好き）\n・費用はきちんと伝えておく\n・後悔させない\n\n〈商品説明の仕方〉\n・ゆるぎない自信をもって商品説明できるよう万全の準備を\n・完璧な商品知識を身に付けて商談に臨むこと\n・話し始めると長い傾向があるが、会話を中断したりうやむやで終わらせたりしない\n\n〈決断のタイミング〉\n・決断のスピードはやや遅い\n・疑問や質問に淡々と答えていくと、決断に対する迷いがなくなる\n\n〈クロージング〉\n・明確な理由がなく迷っている場合は、一問一答を繰り返しながら迷いを解消していく\n・「だいたいこのタイプを選ばれる方が多いですよ」\n\n✍️ 手書きメモより\n・質問を見分ける：①会話の中の質問 ②本当の質問。調べようとしてくれた人柄を見ている" },
            { head: "🧑‍💼 マネジメント ── 部下としての育て方", body: "【仕事ぶり】\n・自分の考えよりも周りの意見を尊重する\n・「報・連・相」は、まめに実行する\n・面倒見がよく、相談されたら親身になって応じる\n・重要ではないことにも時間をかけるため、仕事の効率はよくない\n\n【育て方の手順】\n① ニーズや仕組みがなぜ必要なのかを理解させる\n② このビジネスに必要な知識を先に身につけさせる\n③ プレゼンテーションをして問題点を出しクリアにしていく、を繰り返し、自分なりのスタイルを作り上げる\n④ 目標設定し計画を立て確実に達成させる。「達成しなかったらどうする？」と自己負担をかけてでも前に進む精神力を意識させる\n\n【陥りやすい点】\n・周りの人からの意見を気にしすぎてしまう\n・マイナス志向で行動を起こす前から悲観的発想をする\n・自分の存在感がなくなるとモチベーションが下がる\n\n【目指すリーダー像】人の気持ちを大事にするため、メンタル面でしっかりサポートできるリーダーを目指す\n\n【事例】このタイプの顧客には、豆知識に購入者コメント、お試しプレゼントなど、いろんな形の情報を丁寧な説明つきでご案内していたら、その姿勢を気に入られて購入していただけた。" },
            { head: "👑 経営者版 ── トップになったときの顔", body: "【本質】\nひつじタイプの個性は「群れる」イメージ。淋しがり屋で独りぼっちが嫌い、仲間はずれにされると傷つく、相談されるとすごく嬉しい、がキーワード。和を尊び、常に相手の立場に立った気配りをする潤滑油的存在です。人情に厚く丁寧で、物事を客観的に判断する能力に優れ、世の中のために役立つ何かをしたいと願っています。\n\n【成功経営者】\n代表はソニー創業者の盛田昭夫氏。気品ある紳士然としたタイプで、控えめで物静かな印象、穏やかな人柄。持ち前のユーモアは知的な魅力にもなっています。世間の情勢に遅れないよう様々な情報の収集に努め、多くの情報から客観的に物事を判断する能力に優れていました。\n有名人：小栗旬、北川景子\n\n【ビジネスルール8か条】\n1. 孤独を嫌う淋しがり屋で気疲れが多い\n2. 仲間はずれにされると傷つく\n3. 人に対する好き嫌いの激しい面がある\n4. 机の整理整頓が苦手で資料が散乱している\n5. 感情を抑えきれなくなることがある\n6. 得意な情報収集も過多となると混乱する\n7. お金のことはきちんとしている\n8. 「人のため」といいながら「自分」を優先させる\n\n【付き合い方】\n虎は面倒見がいいので大切なパートナー。言えないことを代わりに言ってくれたり、皆が嫌がる仕事も進んで引き受けてくれて大助かりです。悲観的になりがちなひつじ型を勇気付けてくれるのが、たぬきと猿。逆にペガサスにはいいように使われてしまい、言うことも聞いてくれないので、パートナーや部下には向きません。職場の人間関係が悪いと仕事に打ち込めないので、良き相談相手が必要です。" },
        ] },
        { head: "🦄ペガサス インスピレーションタイプ ── 自由奔放", body: "動物：ペガサス（SUN＝感性タイプ／十二運：絶）／英語名：INSPIRATION TYPE", children: [
            { head: "📗 キーワード・特徴", body: "🔑 キーワード：感性／直感／気ままに〜／超合理的／大企業\n\n【特徴】\n・束縛される環境に弱い\n・ポイントは一言でよい\n・いちいち細かく指示されるとダメ\n・気が乗っているか否かで差が激しい\n・行動範囲が広い\n・得意分野には爆発的能力を発揮する" },
            { head: "🛒 マーケティング ── お客さんとしてのクセ", body: "・労力の少なさ（便利さ）をアピール\n・シチュエーションに酔いやすい\n・プロのお任せコースに頼りたい\n・日常的な商品は安さ重視で何でもいい\n・好きなモノには奮発する（一点豪華主義）\n・意思確認は不要（問い詰めてはいけない）\n✍️ こだわりの無い商品・ランニングコストは安いにこしたことがない\n✍️ 「どうされますか？どちらにしますか？」の意思決定はいらない。製品の権威性をちらつかせる" },
            { head: "📢 営業アプローチ ── 売り方とクロージング", body: "【基本】\n・クロージングのタイミングを逃さない\n\n〈アプローチ〉効くキーワード：あなただけ…／特別に…／横文字\n・説明は特にしない\n\n〈商品説明の仕方〉\n・専門知識・用語を使うとさらに良い\n・質問には詳しく答える\n・同じことを繰り返したり、何度も念を押したりすることはタブー\n\n〈決断のタイミング〉\n・即断即決\n・決断は速いが行動までが遅く、意思決定がコロコロ変わりやすいので、インパクトのある一言が重要\n\n〈クロージング〉\n・決断から購入までのお手軽さを推す\n・「いつでもご都合のつくときに寄ってください」" },
            { head: "🧑‍💼 マネジメント ── 部下としての育て方", body: "【仕事ぶり】\n・付き合い・接待・社交辞令が天才的にうまい\n・誰も思いつかないような、型破りなアイデアをひらめく\n・会議もノリで進めるので、行き先が読めず周りは振り回される\n・失敗はあまり気にしない。落ち込んでも立ち直りが早い\n\n【育て方の手順】\n① ビジネスの発展性と可能性を理解させる\n② 確定・決定したもので判断や行動をする癖をつけさせる\n③ 外との交流を拡大させ視野を広げ、ビジネスに必要な状況判断力を養う\n④ 最高の目標達成をした自分を想像し、そのために今何をすべきかを常に考え意識させる\n\n【陥りやすい点】\n・協調性に欠ける\n・全て適当なフォローをする\n・急にやる気がなくなる\n\n【目指すリーダー像】成功のステータスが体からにじみ出るリーダーを目指す\n\n【事例】カーディーラーがこのタイプのお客様に対し、体感を重視してまず実際に車を試乗してもらい、その時の気分や周りの人の反応を感じてもらうことで、ほぼ説明なしで購入していただけた。" },
            { head: "👑 経営者版 ── トップになったときの顔", body: "【本質】\nペガサスタイプの個性は「宇宙人」のイメージ。温和な自由人で、天性のひらめきを仕事に活かす経営者です。ただし束縛に弱く、相談相手次第で天才にも凡人にもなります。おだてに乗りやすい移り気な性格ですが、おだてに乗るのが本能。ひらめき・発想は天才的です。\n\n【成功経営者】\n代表はフォード自動車創業者のヘンリー・フォード氏。ワイルドで男性的な風貌に渋みのあるダンディさが魅力。内面は大まかで細かいことにこだわらない人間味のある性格ながら、案外細かいところまで行き届き、相手を気遣います。そばにいるだけでリラックスでき、安心感の持てる経営者と評価されるでしょう。直感や気分、感性を頼りに生きる、飛び抜けた才能を持つ天才肌の経営者が多いタイプです。\n有名人：松本潤、滝川クリステル\n\n【ビジネスルール8か条】\n1. 気分によって別人のようになる\n2. 枠にはめられるとやる気をなくす\n3. 自分で自分がわからないときがある\n4. 大げさな感情表現で周囲を巻き込む\n5. 細かく面倒くさい作業を嫌う\n6. 機嫌がいいと明るくお人好しの面が出る\n7. 頼まれた仕事をすぐに忘れてしまう\n8. 天才的・直感的なひらめきを身に付けていくと運勢が好転していく\n\n【付き合い方】\nいちいち指示されたり期限を決められると、とてもストレスになります。動かしやすいのは、おっとり型のひつじやたぬき、そして何事もすぐにやってしまわないと気がすまないゾウ。言いにくいことも平気で言ってしまう猿・狼・虎は苦手で、思いも通じにくい相手です。組織やルールにがんじがらめにされると、せっかくの感性が鈍ってしまいます。海外でのビジネス展開は最適。「天才は理解されない」と開き直っている経営者こそがペガサス型です。" },
        ] },
      ]
    },
  ];

  let kaisetsuActive = 0;
  // 解説の1項目を描画する。
  // type:"info" = 前提・考え方(青系の色分け) / children = 入れ子(グループを開くと中の項目が出る) / open = 最初から開いておく
  function kaisetsuItemHtml(it) {
    const cls = "rc-detail compat-item" + (it.type === "info" ? " kai-info" : "") + (it.children ? " kai-group" : "");
    // it.html: true のとき body は信頼できる内製HTML(図など)としてそのまま描画する
    const bodyHtml = it.body
      ? (it.html
        ? `<div class="det-row" style="line-height:1.9;">${it.body}</div>`
        : `<div class="det-row" style="line-height:1.9; white-space:pre-wrap;">${escapeHtml(it.body)}</div>`)
      : "";
    const childHtml = it.children ? `<div class="kai-children">${it.children.map(kaisetsuItemHtml).join("")}</div>` : "";
    return `<details class="${cls}"${it.open ? " open" : ""}>
      <summary>${escapeHtml(it.head)}${it.children ? `<span class="kai-count">${it.children.length}</span>` : ""}</summary>
      <div class="rc-detail-body">${bodyHtml}${childHtml}</div>
    </details>`;
  }

  function renderKaisetsuSection(i) {
    kaisetsuActive = i;
    const body = document.getElementById("kaisetsu-body");
    const sec = KAISETSU_SECTIONS[i];
    if (!body || !sec) return;
    body.innerHTML = `<div class="card">
      <h2>${sec.icon} ${escapeHtml(sec.title)}</h2>
      <div class="hint" style="margin-bottom:10px;">${escapeHtml(sec.intro)}</div>
      ${sec.items.map(kaisetsuItemHtml).join("")}
    </div>`;
    document.querySelectorAll(".kaisetsu-menu-btn").forEach(b => b.classList.toggle("active", +b.dataset.sec === i));
  }
  function renderKaisetsu() {
    const box = document.getElementById("kaisetsu-content");
    if (!box || box.dataset.ready) return;
    box.innerHTML = `<div class="kaisetsu-menu">${KAISETSU_SECTIONS.map((s, i) =>
      `<button class="kaisetsu-menu-btn${i === 0 ? " active" : ""}" data-sec="${i}">${s.icon} ${escapeHtml(s.menu || s.title)}</button>`).join("")}</div>
      <div id="kaisetsu-body"></div>`;
    box.dataset.ready = "1";
    renderKaisetsuSection(0);
  }

  let libraryRendered = false;

  // アクセス許可リストの読み込み(管理者UI)
  let accessLoaded = false;
  async function loadAccessConfig() {
    const fs = window.metaqFirestore;
    if (!fs || !fs.getAccessConfig) return;
    const en = document.getElementById("access-enabled");
    const ta = document.getElementById("access-emails");
    if (!en || !ta) return;
    try {
      const cfg = await fs.getAccessConfig();
      en.checked = cfg.mode === "allowlist";
      ta.value = (cfg.emails || []).join("\n");
    } catch (e) { console.error(e); }
    if (!accessLoaded) {
      accessLoaded = true;
      const save = document.getElementById("access-save");
      if (save) save.addEventListener("click", async () => {
        const status = document.getElementById("access-status");
        const emails = ta.value.split("\n").map(s => s.trim()).filter(Boolean);
        const mode = en.checked ? "allowlist" : "open";
        if (mode === "allowlist" && emails.length === 0 &&
          !confirm("許可リストが空のまま有効にすると、あなた（管理者）以外は誰もログインできなくなります。よろしいですか？")) return;
        if (status) status.textContent = "保存中...";
        try {
          await fs.saveAccessConfig({ mode, emails });
          if (status) status.textContent = mode === "allowlist"
            ? `✅ 保存しました。今後は許可リストの${emails.length}人（＋あなた）だけがログインできます。`
            : "✅ 保存しました。現在は誰でもログインできる「開放」状態です。";
          showToast("アクセス設定を保存しました");
        } catch (e) { console.error(e); if (status) status.textContent = "保存に失敗しました。"; }
      });
    }
  }

  function updateAdminUI(email) {
    const isAdmin = (email || "").toLowerCase() === ADMIN_EMAIL;
    const tabBtn = document.getElementById("tab-library");
    if (tabBtn) tabBtn.style.display = isAdmin ? "" : "none";
    const compatTab = document.getElementById("tab-compat");
    if (compatTab) compatTab.style.display = isAdmin ? "" : "none";
    const kaisetsuTab = document.getElementById("tab-kaisetsu");
    if (kaisetsuTab) kaisetsuTab.style.display = isAdmin ? "" : "none";
    const accessCard = document.getElementById("access-mgr-card");
    if (accessCard) accessCard.style.display = isAdmin ? "" : "none";
    if (isAdmin) {
      if (!libraryRendered) { renderLibraryGenreSelect(); renderLibrary(); libraryRendered = true; }
      renderCompatGuide();
      renderKaisetsu();
      loadAccessConfig();
      loadLibraryExtra();
    } else {
      // 管理者以外がログインしたら、図書館・相性・解説を閉じて通常タブへ戻す
      libraryRendered = false;
      const libPanel = document.getElementById("panel-library");
      const compatPanel = document.getElementById("panel-compat");
      const kaisetsuPanel = document.getElementById("panel-kaisetsu");
      if ((libPanel && libPanel.classList.contains("active")) || (compatPanel && compatPanel.classList.contains("active")) || (kaisetsuPanel && kaisetsuPanel.classList.contains("active"))) switchTab("single");
    }
  }

  window.addEventListener("metaq:auth-ready", (e) => {
    updateAdminUI(e.detail && e.detail.email);
  });

  // "YYYY/MM/DD" 形式のときだけ {y,m,d} を返す(年のみ・紀元前などは診断しない)
  function libDateParts(dateStr) {
    const m = /^(\d{3,4})\/(\d{1,2})\/(\d{1,2})$/.exec((dateStr || "").trim());
    return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
  }

  // 図書館のカード(診断結果と同じコンパクトな見た目)。cが無い(生年月日不確か)人は診断を省く。
  function libraryCardHtml(name, dateStr, desc, c, lazyIdx, isCustom) {
    // 詳細(重いHTML)は開いた時に生成する(1200人分を毎回作るとレンダリングが数秒かかるため)
    const detail = (lazyIdx !== undefined)
      ? `<details class="rc-detail lib-lazy" data-lidx="${lazyIdx}"><summary>詳細</summary><div class="rc-detail-body"></div></details>`
      : resultDetailHtml(c, name);
    const diag = c ? `
      <div class="rc-info">
        <span class="rc-no">No.${String(c.bunrui60).padStart(2, "0")}</span>
        ${kanGroupChipHtml(c)}
        ${charaChipHtml(c.bunrui60_charaName)}
      </div>
      <div class="rc-badges">
        ${railBadgeHtml(c.rail)}
        <span class="rc-fuku">福の神 ${c.fukuNoKami.label}</span>
      </div>
      <div class="rc-pillars">
        ${animalPillHtml("本質", c.honshitsu)}${animalPillHtml("表面", c.hyomen)}${animalPillHtml("意思", c.ishi)}
      </div>
      ${detail}`
      : `<div class="hint" style="padding:0 14px 12px;">※生年月日が確定していないため、診断は省略しています。</div>`;
    return `
    <div class="result-card compact">
      <div class="rc-head">
        <div class="rc-name-wrap">
          <span class="rc-name">${escapeHtml(name)}</span>${isCustom ? '<span class="lib-custom-tag">追加分</span>' : ""}
          <span class="rc-birth">${escapeHtml(dateStr || "生没年不詳")}</span>
        </div>
        ${isCustom ? `<div class="head-btns"><button class="del-btn lib-del-btn" data-name="${escapeHtml(name)}" data-date="${escapeHtml(dateStr)}" title="図書館から削除">×</button></div>` : ""}
      </div>
      ${desc ? `<div class="lib-desc">${escapeHtml(desc)}</div>` : ""}
      ${diag}
    </div>`;
  }

  let libraryGenreFilter = "all"; // 図書館のジャンル絞り込み
  // 図書館の四柱計算キャッシュ(同じ生年月日は1回だけ計算する)
  const libCalcCache = new Map();
  function libCalc(dateStr) {
    if (!libCalcCache.has(dateStr)) {
      const d = libDateParts(dateStr);
      libCalcCache.set(dateStr, d ? calcFourPillars(d.y, d.m, d.d, null, null) : null);
    }
    return libCalcCache.get(dateStr);
  }
  let libraryMatchedRef = []; // 遅延詳細の参照先(表示中の人物)
  // のりぴさんがアプリから追加した図書館人物(Firestore config/library に保存)
  let libraryExtra = [];
  function allLibraryPeople() { return libraryExtra.length ? LIBRARY_PEOPLE.concat(libraryExtra) : LIBRARY_PEOPLE; }
  async function loadLibraryExtra() {
    const fs = window.metaqFirestore;
    if (!fs || !fs.getLibraryConfig) return;
    try {
      const people = await fs.getLibraryConfig();
      libraryExtra = (people || []).map(p => ({ ...p, custom: true }));
      const sel = document.getElementById("library-agg-genre");
      if (sel) delete sel.dataset.ready;
      renderLibraryGenreSelect();
      if (libraryRendered) renderLibrary();
    } catch (e) { console.error(e); }
  }
  async function saveLibraryExtra() {
    const fs = window.metaqFirestore;
    if (!fs || !fs.saveLibraryConfig) throw new Error("保存先に接続できません");
    await fs.saveLibraryConfig(libraryExtra.map(({ custom, ...p }) => p));
  }
  // 重複チェック(・/スペース無視の同名+同生年月日)
  function libraryDuplicate(name, date) {
    const norm = (x) => String(x || "").replace(/[\s\u3000・·]/g, "");
    const n = norm(name);
    return allLibraryPeople().find(p => norm(p.name) === n && p.date === date) || null;
  }

  // ジャンル絞り込みチップ(すべて/各ジャンル)を描く
  function renderLibraryGenreChips() {
    const box = document.getElementById("library-genre-chips");
    if (!box) return;
    const genres = [...new Set(allLibraryPeople().map(p => p.genre))];
    const chip = (val, label) =>
      `<div class="chip ${libraryGenreFilter === val ? "selected" : ""}" data-genre="${escapeHtml(val)}">${escapeHtml(label)}</div>`;
    box.innerHTML = chip("all", "すべて") + genres.map(g => chip(g, g)).join("");
    box.querySelectorAll(".chip").forEach(c => c.addEventListener("click", () => {
      libraryGenreFilter = c.dataset.genre;
      renderLibrary();
    }));
  }

  // フォーブス各年の出来事・考察(年ごとにカード上部へ表示)
  const FORBES_NOTES = {
    "2026": "世界はイーロン・マスクが首位を盤石に。日本は柳井正と孫正義が逆転し、孫正義が日本首位に。",
    "2025": "世界はマスクが首位を維持しAI投資が加速。日本は柳井正が首位、孫正義が2位（翌2026年に逆転）。",
    "2024": "ラグジュアリー市場の好調でベルナール・アルノー（LVMH）が世界首位。日本は半導体需要でディスコ関家一族がトップ5へ躍進。",
    "2023": "高級ブランドの記録的業績でアルノーがマスクを抜き初の年間世界1位。日本は円安で柳井正が首位を独走、滝崎武光が孫正義を抜き2位に。",
    "2022": "テスラ株の歴史的高値でイーロン・マスクが初めて世界1位に。日本は株価変動で柳井正が首位に返り咲いた。",
    "2021": "コロナ禍の金融緩和で株価が歴史的高値（バブル期のピーク）。世界はベゾスが4年連続首位、日本はソフトバンク株の暴騰で孫正義が首位に返り咲いた。",
    "2020": "コロナ初期の混乱。世界はベゾスが3年連続首位、アルノーが初の3位へ。日本はWeWork投資の損失等で孫正義が資産を減らし、柳井正が首位に。",
    "2019": "米中貿易摩擦の激化と世界的な株価調整で多くの富豪が資産を減らした年。世界はベゾスが2年連続首位、日本は柳井正が孫正義を抜いて首位に返り咲いた。",
    "2018": "世界はベゾスが首位。日本はソフトバンクのビジョン・ファンドによる世界的IT投資戦略で孫正義が首位。",
    "2017": "ITテック企業の躍進が加速。世界はビル・ゲイツが4年連続首位、ベゾスが初のトップ3入り。日本は孫正義が柳井正から首位を奪還した。",
    "2016": "原油安や株式市場の変動で上位陣も資産を減らした年。世界はゲイツが3年連続首位、ザッカーバーグが31歳で初のトップ10入り。日本は株安・円高で柳井正が2年連続首位。",
    "2015": "IT企業の躍進が加速し、スマホゲームで大復活が相次いだ年。世界はゲイツが2年連続首位、当時30歳のザッカーバーグが躍進。ウォルトン一族が上位を独占した。日本は柳井正が孫正義を抜き首位返り咲き。『モンスト』でミクシィがV字回復し、滝崎・安田らカリスマ創業者が経営の第一線を退いた節目の年。",
    "2014": "ビル・ゲイツが4年ぶりにカルロス・スリムから世界首位を奪還した年。ザッカーバーグが株価V字回復で29歳にしてトップ20目前へ急浮上。日本はソフトバンクの米スプリント買収やアリババ上場観測で孫正義が柳井正を抜き首位に。コロプラ・グリーなどスマホゲーム黎明期の若手IT富豪が上位に食い込んだ。",
    "2013": "カルロス・スリムが4年連続で世界首位を維持し、ZARAのアマンシオ・オルテガがバフェットを抜いて初の世界3位に浮上した年。日本はユニクロの柳井正が首位を堅持、翌年に孫正義と逆転する前夜。グリーやコロプラなどスマホゲーム関連の富豪が市場の主役へ躍り出る直前の時期。",
  };

  function renderLibrary() {
    const container = document.getElementById("library-content");
    if (!container) return;
    libraryMatchedRef = [];
    renderLibraryGenreChips();
    const term = (document.getElementById("library-search")?.value || "").trim().toLowerCase();
    let matched = allLibraryPeople().filter(p => libraryGenreFilter === "all" || p.genre === libraryGenreFilter);
    if (term) matched = matched.filter(p => {
      if (p.name.toLowerCase().includes(term) || (p.desc || "").toLowerCase().includes(term)) return true;
      // 柱別検索(本質ライオン・意思胎など)は計算結果からも探す
      if (/^(本質|表面|意思|時柱)/.test(term)) {
        const c = libCalc(p.date);
        if (c && pillarSearchTokens(c).some(tk => tk.toLowerCase().includes(term))) return true;
      }
      return false;
    });

    let html = `<div class="hint" style="margin-bottom:14px;">
      ${matched.length}名を表示中${libraryGenreFilter !== "all" ? `（${escapeHtml(libraryGenreFilter)}）` : ""}${term ? `（「${escapeHtml(term)}」で検索）` : ""}
    </div>`;
    if (matched.length === 0) {
      container.innerHTML = html + `<div class="empty-state"><div class="emoji">🔍</div><p>該当する人物が見つかりません。</p></div>`;
      return;
    }
    const byGenre = {};
    matched.forEach(p => { (byGenre[p.genre] = byGenre[p.genre] || []).push(p); });
    Object.keys(byGenre).forEach(genre => {
      html += `<div class="card"><h2>📖 ${escapeHtml(genre)}（${byGenre[genre].length}名）</h2>`;
      const ym = genre.match(/(\d{4})$/);
      if (ym && genre.startsWith("フォーブス") && FORBES_NOTES[ym[1]]) {
        html += `<div class="lib-note">📝 ${escapeHtml(FORBES_NOTES[ym[1]])}</div>`;
      }
      byGenre[genre].forEach(p => {
        const c = libCalc(p.date);
        const idx = libraryMatchedRef.push({ name: p.name, calc: c }) - 1;
        html += libraryCardHtml(p.name, p.date, p.desc, c, idx, p.custom);
      });
      html += `</div>`;
    });
    container.innerHTML = html;
  }

  // 図書館のジャンル集計用セレクトを用意する
  // 追加フォームのジャンル候補(既存ジャンルをdatalistに)
  function renderLibGenreDatalist() {
    const dl = document.getElementById("lib-genre-list");
    if (!dl) return;
    const genres = [...new Set(allLibraryPeople().map(p => p.genre))];
    dl.innerHTML = genres.map(g => `<option value="${escapeHtml(g)}">`).join("");
  }

  function renderLibraryGenreSelect() {
    const sel = document.getElementById("library-agg-genre");
    if (!sel || sel.dataset.ready) return;
    const genres = [...new Set(allLibraryPeople().map(p => p.genre))];
    sel.innerHTML = `<option value="">集計しない（一覧のみ）</option>` +
      genres.map(g => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join("");
    sel.dataset.ready = "1";
  }

  // 選択したジャンルの人物(生年月日が確定している人)で集計を表示する
  function renderLibraryAggregate(genre) {
    const box = document.getElementById("library-agg");
    if (!box) return;
    if (!genre) { box.innerHTML = ""; return; }
    const members = allLibraryPeople().filter(p => p.genre === genre)
      .map(p => { const c = libCalc(p.date); return c ? { calc: c } : null; })
      .filter(Boolean);
    if (members.length === 0) {
      box.innerHTML = `<div class="empty-state"><div class="emoji">🌙</div><p>このジャンルには集計できる（生年月日が確定した）人物がいません。</p></div>`;
      return;
    }
    box.innerHTML = `<div class="agg-count">${escapeHtml(genre)}：${members.length}名で集計</div>` + aggregateBodyHtml(members);
  }

  // ===================================================================
  // リズムカレンダー（月ごと・移動・日付ジャンプ）
  // ===================================================================
  let rhythmCal = { dayStem: null, name: "", y: 0, m: 0 };

  function openRhythmCalendar(dayStem, name) {
    if (!dayStem) return;
    const now = new Date();
    rhythmCal = { dayStem, name, y: now.getFullYear(), m: now.getMonth() + 1 };
    document.getElementById("rhythm-modal").style.display = "flex";
    renderRhythmCalendar();
  }
  function closeRhythmCalendar() { document.getElementById("rhythm-modal").style.display = "none"; }
  function rhythmCalShift(delta) {
    let y = rhythmCal.y, m = rhythmCal.m + delta;
    if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
    rhythmCal.y = y; rhythmCal.m = m; renderRhythmCalendar();
  }
  function renderRhythmCalendar() {
    const { dayStem, name, y, m } = rhythmCal;
    if (!dayStem) return;
    document.getElementById("rhythm-cal-name").textContent = name || "この人";
    document.getElementById("rhythm-cal-title").textContent = `${y}年 ${m}月`;
    const jy = document.getElementById("rhythm-jump-y"), jm = document.getElementById("rhythm-jump-m");
    if (jy && document.activeElement !== jy) jy.value = y;
    if (jm && document.activeElement !== jm) jm.value = m;
    // 年/月/今日のリズム
    // 月リズムは節入り(毎月4〜8日頃)、年リズムは立春で切り替わるため、
    // 月の途中で変わる場合は「1日〜: A ／ 節入り日〜: B」の形で両方見せる。
    const daysInM = new Date(y, m, 0).getDate();
    const first = calcRhythm(dayStem, y, m, 1);
    let mSwitch = null, ySwitch = null;
    for (let dd = 2; dd <= daysInM; dd++) {
      const r = calcRhythm(dayStem, y, m, dd);
      if (!mSwitch && r.month !== first.month) mSwitch = { d: dd, v: r.month };
      if (!ySwitch && r.year !== first.year) ySwitch = { d: dd, v: r.year };
      if (mSwitch && ySwitch) break;
    }
    const yearChip = ySwitch
      ? `${y}年 <b>${escapeHtml(first.year)}</b> → ${m}/${ySwitch.d}〜 <b>${escapeHtml(ySwitch.v)}</b>`
      : `${y}年 <b>${escapeHtml(first.year)}</b>`;
    const monthChip = mSwitch
      ? `${m}月 <b>${escapeHtml(first.month)}</b> → ${m}/${mSwitch.d}〜 <b>${escapeHtml(mSwitch.v)}</b>`
      : `${m}月 <b>${escapeHtml(first.month)}</b>`;
    // 個性心理学では23:00が1日の区切りなので、23時以降は翌日を「今日」として扱う(ISDねっとと同じ挙動)
    const nowd = new Date();
    if (nowd.getHours() >= 23) nowd.setDate(nowd.getDate() + 1);
    const todayR = calcRhythm(dayStem, nowd.getFullYear(), nowd.getMonth() + 1, nowd.getDate());
    document.getElementById("rhythm-cal-summary").innerHTML =
      `<span class="det-chip">${yearChip}</span>
       <span class="det-chip">${monthChip}</span>
       <span class="det-chip">今日の日 <b>${escapeHtml(todayR.day)}</b></span>`;
    // カレンダー本体
    const firstDow = new Date(y, m - 1, 1).getDay();
    const daysInMonth = new Date(y, m, 0).getDate();
    const isThisMonth = (nowd.getFullYear() === y && nowd.getMonth() + 1 === m);
    const cells = ["日", "月", "火", "水", "木", "金", "土"].map(w => `<div class="rcal-head">${w}</div>`);
    for (let i = 0; i < firstDow; i++) cells.push(`<div class="rcal-cell empty"></div>`);
    for (let d = 1; d <= daysInMonth; d++) {
      const rday = calcRhythm(dayStem, y, m, d).day;
      const col = FIVE_ELEMENT_COLOR[RHYTHM_TO_ELEMENT[rday]] || "#e0e0e0";
      const today = isThisMonth && d === nowd.getDate();
      const rnum = RHYTHM_NUMBER[rday];
      cells.push(`<div class="rcal-cell ${today ? "today" : ""}" style="border-top:3px solid ${col}">
        <span class="rcal-d">${d}</span><span class="rcal-r">${escapeHtml(rday)}</span>${rnum ? `<span class="rcal-n">${rnum}</span>` : ""}</div>`);
    }
    document.getElementById("rhythm-cal-grid").innerHTML = cells.join("");
  }

  // ===================================================================
  // イベント登録
  // ===================================================================

  document.addEventListener("DOMContentLoaded", () => {
    renderResults();
    refreshAllGroupUI();

    // リズムカレンダー: 各カードの「📅」ボタン(動的生成)を委譲で受ける
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".rhythm-cal-btn");
      if (btn) openRhythmCalendar(btn.dataset.daystem, btn.dataset.name);
      // 相性診断ボタン(相性タブ, 動的生成)
      if (e.target.closest("#compat-run")) renderCompatResult();
      if (e.target.closest("#compat-list-run")) renderCompatList();
      const kbtn = e.target.closest(".kaisetsu-menu-btn");
      if (kbtn) renderKaisetsuSection(+kbtn.dataset.sec);
    });
    // 相性タブ: グループ選択→人セレクトを絞り込み(委譲)
    document.addEventListener("change", (e) => {
      const gs = e.target.closest(".compat-grp");
      if (gs) {
        const ps = document.getElementById(`compat-${gs.dataset.target}-sel`);
        if (ps) ps.innerHTML = compatPersonOptions(gs.value);
      }
    });
    document.getElementById("rhythm-cal-close").addEventListener("click", closeRhythmCalendar);
    document.getElementById("rhythm-modal").addEventListener("click", (e) => {
      if (e.target.id === "rhythm-modal") closeRhythmCalendar();
    });
    document.getElementById("rhythm-prev").addEventListener("click", () => rhythmCalShift(-1));
    document.getElementById("rhythm-next").addEventListener("click", () => rhythmCalShift(1));
    document.getElementById("rhythm-today").addEventListener("click", () => {
      const now = new Date(); rhythmCal.y = now.getFullYear(); rhythmCal.m = now.getMonth() + 1; renderRhythmCalendar();
    });
    document.getElementById("rhythm-jump").addEventListener("click", () => {
      const yy = parseInt(document.getElementById("rhythm-jump-y").value, 10);
      const mm = parseInt(document.getElementById("rhythm-jump-m").value, 10);
      if (yy >= 1 && yy <= 9999 && mm >= 1 && mm <= 12) { rhythmCal.y = yy; rhythmCal.m = mm; renderRhythmCalendar(); }
      else showToast("年・月を正しく入力してください");
    });

    // 生年月日・時刻入力: フォーカスが外れたら統一表記に自動整形する
    const singleDateInput = document.getElementById("single-date");
    singleDateInput.addEventListener("blur", () => {
      const parsed = parseFlexibleDate(singleDateInput.value);
      if (parsed) singleDateInput.value = formatDateForDisplay(parsed);
    });
    const singleTimeInput = document.getElementById("single-time");
    singleTimeInput.addEventListener("blur", () => {
      if (!singleTimeInput.value.trim()) return; // 空欄はそのまま(任意項目)
      const parsed = parseFlexibleTime(singleTimeInput.value);
      if (parsed) singleTimeInput.value = formatTimeForDisplay(parsed);
    });

    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        switchTab(btn.dataset.tab);
        if (btn.dataset.tab === "groups") renderGroupManageList();
        if (btn.dataset.tab === "aggregate") renderAggregateGroupSelect();
        if (btn.dataset.tab === "results") renderResults();
        if (btn.dataset.tab === "library") renderLibrary();
        if (btn.dataset.tab === "compat") renderCompatGuide();
        if (btn.dataset.tab === "kaisetsu") renderKaisetsu();
      });
    });

    // 図書館 - 検索(入力が落ち着いてから描画する。1200人分の連続再描画を防ぐ)
    const librarySearch = document.getElementById("library-search");
    let libSearchTimer = null;
    if (librarySearch) librarySearch.addEventListener("input", () => {
      clearTimeout(libSearchTimer);
      libSearchTimer = setTimeout(() => renderLibrary(), 180);
    });
    // 図書館 - 人物の追加(のりぴさん用。Firestore config/libraryに保存)
    const libAddBtn = document.getElementById("lib-add-submit");
    if (libAddBtn) libAddBtn.addEventListener("click", async () => {
      const status = document.getElementById("lib-add-status");
      const name = document.getElementById("lib-add-name").value.trim();
      const dateRaw = document.getElementById("lib-add-date").value.trim();
      const genre = document.getElementById("lib-add-genre").value.trim();
      const desc = document.getElementById("lib-add-desc").value.trim();
      if (!name) { showToast("名前を入力してください"); return; }
      if (!genre) { showToast("ジャンルを入力してください"); return; }
      const d = parseFlexibleDate(dateRaw);
      if (!d) { showToast("生年月日を正しい形式で入力してください（例：1990/06/24）"); return; }
      const pad = (n) => String(n).padStart(2, "0");
      const date = `${d.y}/${pad(d.m)}/${pad(d.d)}`;
      const dup = libraryDuplicate(name, date);
      if (dup) { if (status) status.textContent = `⚠️ 同じ人がすでにいます：「${dup.name}」(${dup.genre || "図書館"})`; showToast("すでに登録されています"); return; }
      if (status) status.textContent = "保存中...";
      libraryExtra.push({ name, date, desc, genre, custom: true, _addedAt: Date.now() });
      try { await saveLibraryExtra(); }
      catch (e) { console.error(e); libraryExtra.pop(); if (status) status.textContent = "保存に失敗しました。通信環境を確認してください。"; return; }
      ["lib-add-name", "lib-add-date", "lib-add-desc"].forEach(id => { document.getElementById(id).value = ""; });
      const sel = document.getElementById("library-agg-genre");
      if (sel) delete sel.dataset.ready;
      renderLibraryGenreSelect();
      renderLibrary();
      renderLibGenreDatalist();
      if (status) status.textContent = `✅ 「${name}」を${genre}に追加しました`;
      showToast("図書館に追加しました");
    });
    // 図書館 - 追加分の削除(委譲・確認つき)
    document.getElementById("library-content")?.addEventListener("click", async (e) => {
      const btn = e.target.closest(".lib-del-btn");
      if (!btn) return;
      const nm = btn.dataset.name, dt = btn.dataset.date;
      if (!confirm(`「${nm}」を図書館から削除します。\nこの操作は取り消せません。本当に削除してよいですか？`)) return;
      const i = libraryExtra.findIndex(p => p.name === nm && p.date === dt);
      if (i === -1) return;
      const removed = libraryExtra.splice(i, 1)[0];
      try { await saveLibraryExtra(); }
      catch (err) { console.error(err); libraryExtra.splice(i, 0, removed); showToast("削除に失敗しました"); return; }
      const sel = document.getElementById("library-agg-genre");
      if (sel) delete sel.dataset.ready;
      renderLibraryGenreSelect();
      renderLibrary();
      showToast(`「${nm}」を図書館から削除しました`);
    });
    renderLibGenreDatalist();

    // 図書館 - 詳細の遅延生成(「詳細」を開いた時に初めて中身を作る)
    const libContent = document.getElementById("library-content");
    if (libContent) libContent.addEventListener("click", (e) => {
      const det = e.target.closest("details.lib-lazy");
      if (!det || det.dataset.filled) return;
      const ref = libraryMatchedRef[+det.dataset.lidx];
      if (!ref) return;
      det.dataset.filled = "1";
      const inner = resultDetailHtml(ref.calc, ref.name);
      const m = inner.match(/<div class="rc-detail-body">([\s\S]*)<\/div><\/details>$/);
      det.querySelector(".rc-detail-body").innerHTML = m ? m[1] : inner;
    });
    // 図書館 - ジャンル別集計
    renderLibraryGenreSelect();
    const libraryAggGenre = document.getElementById("library-agg-genre");
    if (libraryAggGenre) libraryAggGenre.addEventListener("change", (e) => renderLibraryAggregate(e.target.value));
    // 図書館タブを開いたときも集計セレクトを用意
    document.querySelectorAll(".tab-btn").forEach(btn => {
      if (btn.dataset.tab === "library") btn.addEventListener("click", renderLibraryGenreSelect);
    });
    // 図書館 - 「一覧」/「集計」の表示切り替え
    document.querySelectorAll(".lib-mode-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.libmode;
        document.querySelectorAll(".lib-mode-btn").forEach(b => b.classList.toggle("active", b === btn));
        const listView = document.getElementById("lib-view-list");
        const aggView = document.getElementById("lib-view-agg");
        if (listView) listView.style.display = mode === "list" ? "" : "none";
        if (aggView) aggView.style.display = mode === "agg" ? "" : "none";
        if (mode === "agg") renderLibraryGenreSelect();
      });
    });

    // 1人ずつ診断
    document.getElementById("single-submit").addEventListener("click", async () => {
      const name = document.getElementById("single-name").value.trim();
      const dateVal = document.getElementById("single-date").value;
      const timeVal = document.getElementById("single-time").value;

      const date = parseFlexibleDate(dateVal);
      if (!date) { showToast("生年月日を正しい形式で入力してください（例：1990/06/24）"); return; }
      if (selectedSingleGroupIds.length === 0) { showToast("グループを1つ以上選択してください"); return; }

      const time = parseFlexibleTime(timeVal);
      // 時刻を入力したのに読み取れない(25:30など)場合は登録せず知らせる
      if (timeVal.trim() && !time) { showToast("時刻は0〜23時・0〜59分で入力してください（空欄でもOK）"); return; }
      const h = time ? time.h : null;
      const mi = time ? time.mi : null;

      // 同名・同生年月日の人が既にいたら確認する(二重登録の防止)
      const birthDateStr = `${date.y}/${String(date.m).padStart(2,"0")}/${String(date.d).padStart(2,"0")}`;
      const dup = findDuplicate(String(name).replace(/[\s　]/g, ""), birthDateStr);
      if (dup && !confirm(`「${name}」さん（${birthDateStr}）はすでに登録されています。それでも別に登録しますか？\n（同じ人を複数グループに入れたい場合は、診断結果の✎編集からグループを追加する方が重複になりません）`)) return;

      const ok = await addResult(name, date.y, date.m, date.d, h, mi, selectedSingleGroupIds);
      if (!ok) return; // 保存失敗時はフォームを保持して再試行できるようにする
      document.getElementById("single-name").value = "";
      document.getElementById("single-date").value = "";
      document.getElementById("single-time").value = "";
      selectedSingleGroupIds = [];
      refreshAllGroupUI();
      switchTab("results");
      showToast(`${name || "診断結果"}を登録しました`);
    });

    // まとめて登録 - プレビュー
    let lastParsedRows = [];
    document.getElementById("bulk-preview-btn").addEventListener("click", () => {
      const text = document.getElementById("bulk-textarea").value;
      if (!text.trim()) { showToast("テキストを入力してください"); return; }
      lastParsedRows = parseBulkText(text);
      renderBulkPreview(lastParsedRows);
      const okCount = lastParsedRows.filter(r => !r.error).length;
      document.getElementById("bulk-submit").style.display = okCount > 0 ? "block" : "none";
    });

    // まとめて登録 - 確定
    document.getElementById("bulk-submit").addEventListener("click", async () => {
      if (!selectedBulkGroupId) { showToast("登録先グループを選択してください"); return; }
      const validRows = lastParsedRows.filter(r => !r.error);
      const base = Date.now();
      const entries = validRows.map((r, i) =>
        makeResultEntry(r.name, r.y, r.m, r.d, r.h, r.mi, selectedBulkGroupId, r.note, r.sei, r.mei, base + i));
      const ok = await addResultsBulk(entries);
      if (!ok) return;
      document.getElementById("bulk-textarea").value = "";
      document.getElementById("bulk-preview").innerHTML = "";
      document.getElementById("bulk-submit").style.display = "none";
      switchTab("results");
      showToast(`${validRows.length}件を一括登録しました`);
    });

    // グループ分けして一括登録 - プレビュー
    let lastGroupBulkRows = [];
    document.getElementById("gbulk-preview-btn").addEventListener("click", () => {
      const text = document.getElementById("gbulk-textarea").value;
      if (!text.trim()) { showToast("テキストを入力してください"); return; }
      lastGroupBulkRows = parseGroupBulkText(text);
      renderGroupBulkPreview(lastGroupBulkRows);
      const okCount = lastGroupBulkRows.filter(r => !r.error).length;
      document.getElementById("gbulk-submit").style.display = okCount > 0 ? "block" : "none";
    });

    // グループ分けして一括登録 - 確定
    document.getElementById("gbulk-submit").addEventListener("click", async () => {
      const btn = document.getElementById("gbulk-submit");
      const valid = lastGroupBulkRows.filter(r => !r.error);
      if (valid.length === 0) { showToast("登録できる行がありません"); return; }
      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = `登録中… (${valid.length}件)`;
      showToast(`${valid.length}件を登録中です。少しお待ちください…`);
      let ok = false;
      try {
        ok = await confirmGroupBulkImport(lastGroupBulkRows);
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
      if (!ok) return; // 保存失敗時はフォームを保持
      document.getElementById("gbulk-textarea").value = "";
      document.getElementById("gbulk-preview").innerHTML = "";
      btn.style.display = "none";
      switchTab("results");
      showToast(`${valid.length}件をグループ分け登録しました`);
    });

    // 診断結果 - グループフィルター
    document.getElementById("results-group-filter").addEventListener("change", renderResults);
    let resSearchTimer = null;
    document.getElementById("results-search").addEventListener("input", () => {
      clearTimeout(resSearchTimer);
      resSearchTimer = setTimeout(renderResults, 150);
    });

    // CSV出力・全削除
    document.getElementById("export-csv-btn").addEventListener("click", exportCsv);
    document.getElementById("recalc-btn").addEventListener("click", recalcAllResults);
    document.getElementById("clear-all-btn").addEventListener("click", async () => {
      if (results.length === 0) return;
      if (confirm("すべての診断結果を削除します。よろしいですか？")) {
        const fs = getFS();
        const targets = [...results];
        if (fs) {
          for (const r of targets) {
            try { await fs.deleteResult(r.id); } catch (e) { console.error(e); }
          }
        }
        results = [];
        renderResults();
        scheduleSheetSync();
        showToast("全件削除しました");
      }
    });

    // グループ管理 - 新規作成
    document.getElementById("new-group-submit").addEventListener("click", async () => {
      const input = document.getElementById("new-group-name");
      const name = input.value.trim();
      if (!name) { showToast("グループ名を入力してください"); return; }
      const g = await createGroup(name);
      input.value = "";
      if (g) showToast(`グループ「${name}」を作成しました`);
    });
    document.getElementById("new-group-name").addEventListener("keydown", (e) => {
      if (e.key === "Enter") document.getElementById("new-group-submit").click();
    });

    // グループ集計 - グループ切り替え
    document.getElementById("aggregate-group-select").addEventListener("change", (e) => {
      renderAggregateContent(e.target.value);
    });

    // スプレッドシート連携 - URL保存・手動同期
    const sheetUrlInput = document.getElementById("sheet-url-input");
    sheetUrlInput.value = getSheetUrl();
    updateSheetSyncStatusIdle();

    document.getElementById("sheet-url-save").addEventListener("click", async () => {
      const url = sheetUrlInput.value.trim();
      if (url && !/^https:\/\/script\.google\.com\/macros\//.test(url)) {
        showToast("Apps ScriptのWebアプリURL（https://script.google.com/macros/... で始まるもの）を入力してください");
        return;
      }
      const fs = getFS();
      if (fs && fs.saveSettings) {
        try { await fs.saveSettings({ sheetUrl: url }); }
        catch (e) { console.error(e); showToast("設定の保存に失敗しました"); return; }
      }
      appSettings = { ...appSettings, sheetUrl: url };
      updateSheetSyncStatusIdle();
      showToast(url ? "スプレッドシート連携を設定しました" : "スプレッドシート連携を解除しました");
      if (url) syncToSheets(true); // 設定直後に一度同期して動作確認を兼ねる
    });

    document.getElementById("sheet-sync-now").addEventListener("click", () => syncToSheets(true));
  });

})();
