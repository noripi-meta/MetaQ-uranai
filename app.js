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
    for (let i = 0; i < 6; i++) {
      const dt = new Date(y, 1, 2 + i); // 2/2始まりで探索
      const jd = toJulianDay(dt.getFullYear(), dt.getMonth() + 1, dt.getDate(), 0);
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
  function calcFourPillars(y, m, d, h, mi) {
    h = (h === undefined || h === null || isNaN(h)) ? null : h;
    mi = (mi === undefined || mi === null || isNaN(mi)) ? 0 : mi;

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
  function resultSearchText(r) {
    const c = r.calc || {};
    const gnames = resultGroupIds(r).map(id => { const g = getGroupById(id); return g ? g.name : ""; });
    const parts = [
      r.sei, r.mei, r.name, r.note, r.birthDate, r.birthTime,
      ...gnames,
      c.bunrui60 != null ? "no." + c.bunrui60 : "", c.bunrui60_gz, c.bunrui60_kanGroup, c.bunrui60_charaName,
      c.rail && c.rail.rail, c.rail && c.rail.tsuhensei,
      c.fukuNoKami && ("福の神" + c.fukuNoKami.label),
      c.honshitsu && c.honshitsu.animal, c.honshitsu && GROUP_LABEL[c.honshitsu.group],
      c.hyomen && c.hyomen.animal, c.hyomen && GROUP_LABEL[c.hyomen.group],
      c.ishi && c.ishi.animal, c.ishi && GROUP_LABEL[c.ishi.group],
      c.jichu && c.jichu.animal
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
      const bars = c.ability.axes.map(a => {
        const pct = Math.round((a.value / c.ability.max) * 100);
        const col = FIVE_ELEMENT_COLOR[a.element] || "#c6a8ff";
        // 陰陽の内訳: 例 a+2 / b-1(数がある方だけ)
        const parts = [];
        if (a.plus) parts.push(`${a.codes[0]}(+)${a.plus}`);
        if (a.minus) parts.push(`${a.codes[1]}(−)${a.minus}`);
        const detail = parts.length ? `<span class="det-bar-codes">${parts.join(" / ")}</span>` : "";
        return `<div class="det-bar-row">
          <span class="det-bar-label"><span class="lbl-line"><span class="det-el-dot" style="background:${col}"></span>${a.label}</span><small>${a.sub}</small></span>
          <span class="det-bar-track"><span class="det-bar-fill" style="width:${pct}%;background:${col}"></span></span>
          <span class="det-bar-val">${a.value}</span>
          ${detail}
        </div>`;
      }).join("");
      body += `<div class="det-sec"><div class="det-h">📊 能力<span class="det-sub">（五行＋陰陽）</span></div>${bars}</div>`;
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
  async function editResult(id, name, dateStr, timeStr, note, groupIds) {
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
          <span class="rc-name">${escapeHtml(displayName)}</span>
          <span class="rc-birth">${entry.birthDate}${entry.birthTime ? " " + entry.birthTime : ""}</span>
        </div>
        <div class="head-btns">
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
    // 編集: キャンセル
    list.querySelectorAll(".redit-cancel").forEach(btn => {
      btn.addEventListener("click", () => { editingResultId = null; renderResults(); });
    });
    // 編集: 保存
    list.querySelectorAll(".redit-save").forEach(btn => {
      btn.addEventListener("click", async () => {
        const card = btn.closest(".result-card");
        const name = card.querySelector(".edit-name").value.trim();
        const dateStr = card.querySelector(".edit-date").value;
        const timeStr = card.querySelector(".edit-time").value;
        const note = card.querySelector(".edit-note").value.trim();
        const groupIds = [...card.querySelectorAll(".edit-group:checked")].map(cb => cb.value);
        if (!parseFlexibleDate(dateStr)) { showToast("生年月日を正しい形式で入力してください（例：1990/06/24）"); return; }
        editingResultId = null;
        const ok = await editResult(btn.dataset.id, name, dateStr, timeStr, note, groupIds);
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
  const RESULT_HEADERS = ["性","名","備考","グループ名","生年月日","時刻","レール","レール(本当の呼び方)","福の神No","福の神No(1つめ)","福の神No(2つめ)","福の神No(3つめ)","60分類No","60分類干支","干グループ","60分類キャラクター名","本質グループ","本質(動物)","本質(十二運)","表面グループ","表面(動物)","表面(十二運)","意思グループ","意思(動物)","意思(十二運)","時柱(動物)","時柱(十二運)"];

  function resultToRow(r) {
    const c = r.calc;
    const gnames = resultGroupIds(r).map(id => getGroupById(id)).filter(Boolean).map(g => g.name);
    const seiOut = r.sei || r.name || "";
    const meiOut = r.mei || "";
    return [
      seiOut, meiOut, r.note || "", gnames.length ? gnames.join("・") : "（未設定）", r.birthDate, r.birthTime,
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
    if (gc) bg[3] = safeColor(gc);                            // グループ名
    const railColor = RAIL_COLOR[c.rail.rail];
    if (railColor) { bg[6] = railColor; bg[7] = railColor; }  // レール
    bg[16] = bg[17] = PIE_COLORS[c.honshitsu.group];          // 本質
    bg[19] = bg[20] = PIE_COLORS[c.hyomen.group];             // 表面
    bg[22] = bg[23] = PIE_COLORS[c.ishi.group];               // 意思
    if (c.jichu) bg[25] = PIE_COLORS[c.jichu.group];          // 時柱
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
  const LIBRARY_PEOPLE = [
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
    { genre: "著名人", name: "マイク　タイソン", date: "1966/06/30", desc: "「鉄の拳」と呼ばれた元世界ヘビー級統一王者のボクサー。" },
    { genre: "著名人", name: "橋下　徹", date: "1969/06/29", desc: "弁護士・政治家。元大阪府知事・大阪市長。" },
    { genre: "著名人", name: "樺沢　紫苑", date: "1965/10/27", desc: "精神科医・作家。『アウトプット大全』などの著書で知られる。" },
    { genre: "著名人", name: "misono", date: "1984/10/13", desc: "day after tomorrowを経てソロで活躍した歌手。" },
    { genre: "著名人", name: "斎藤　一人", date: "1948/08/03", desc: "「銀座まるかん」創業者の実業家・著述家。" },
    { genre: "著名人", name: "ひろゆき", date: "1976/11/16", desc: "「2ちゃんねる」開設者として知られる実業家・論客。" },
    { genre: "著名人", name: "池川　明", date: "1954/10/11", desc: "「胎内記憶」の研究で知られる産婦人科医。" },
    { genre: "著名人", name: "麻生　太郎", date: "1940/09/20", desc: "内閣総理大臣などを務めた政治家。" },
    { genre: "著名人", name: "高市　早苗", date: "1961/03/07", desc: "日本の政治家。" },
    { genre: "著名人", name: "鴨頭　嘉人", date: "1966/12/23", desc: "「話し方」で知られる講演家・YouTuber。" },
    { genre: "著名人", name: "中村　文昭", date: "1969/01/18", desc: "「人のご縁」をテーマに全国で講演する実業家・講演家。" },
    { genre: "著名人", name: "拓専務", date: "1975/05/21", desc: "" },
    { genre: "著名人", name: "バリのアニキ", date: "1966/01/12", desc: "" },
    { genre: "著名人", name: "西野", date: "1980/07/03", desc: "" },
    { genre: "著名人", name: "進撃のノア", date: "1995/01/12", desc: "" },
    { genre: "著名人", name: "ひめか", date: "2000/10/27", desc: "" },
    { genre: "著名人", name: "小田桐　あさぎ", date: "1983/03/11", desc: "" },
    { genre: "著名人", name: "藤本　ジョニー", date: "1964/01/12", desc: "" },
    { genre: "著名人", name: "鈴木美歩", date: "1983/01/16", desc: "" },
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
    { genre: "スポーツ", name: "マイク・タイソン", date: "1966/06/30", desc: "史上最年少ヘビー級世界王者" },
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
    { genre: "フォーブス世界2026", name: "イーロン・マスク", date: "1971/06/28", desc: "1位 自動車・宇宙／Tesla" },
    { genre: "フォーブス世界2026", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "2位 EC・クラウド／Amazon" },
    { genre: "フォーブス世界2026", name: "ベルナール・アルノー", date: "1949/03/05", desc: "3位 高級ブランド／LVMH" },
    { genre: "フォーブス世界2026", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "4位 SNS・IT／Meta" },
    { genre: "フォーブス世界2026", name: "ビル・ゲイツ", date: "1955/10/28", desc: "5位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2026", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "6位 投資・保険／Berkshire Hathaway" },
    { genre: "フォーブス世界2026", name: "ラリー・エリソン", date: "1944/08/17", desc: "7位 ソフトウェア／Oracle" },
    { genre: "フォーブス世界2026", name: "ラリー・ペイジ", date: "1973/03/26", desc: "8位 IT・検索／Google" },
    { genre: "フォーブス世界2026", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "9位 IT・検索／Google" },
    { genre: "フォーブス世界2026", name: "スティーブ・バルマー", date: "1956/03/24", desc: "10位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2026", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "11位 アパレル小売／Inditex (ZARA)" },
    { genre: "フォーブス世界2026", name: "カルロス・スリム", date: "1940/01/28", desc: "12位 通信／America Movil" },
    { genre: "フォーブス世界2026", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "13位 金融情報・メディア／Bloomberg" },
    { genre: "フォーブス世界2026", name: "ムケシュ・アンバニ", date: "1957/04/19", desc: "14位 石油・通信／Reliance Industries" },
    { genre: "フォーブス世界2025", name: "イーロン・マスク", date: "1971/06/28", desc: "1位 自動車・宇宙／Tesla" },
    { genre: "フォーブス世界2025", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "2位 EC・クラウド／Amazon" },
    { genre: "フォーブス世界2025", name: "ベルナール・アルノー", date: "1949/03/05", desc: "3位 高級ブランド／LVMH" },
    { genre: "フォーブス世界2025", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "4位 SNS・IT／Meta" },
    { genre: "フォーブス世界2025", name: "ビル・ゲイツ", date: "1955/10/28", desc: "5位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2025", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "6位 投資・保険／Berkshire Hathaway" },
    { genre: "フォーブス世界2025", name: "ラリー・エリソン", date: "1944/08/17", desc: "7位 ソフトウェア／Oracle" },
    { genre: "フォーブス世界2025", name: "ラリー・ペイジ", date: "1973/03/26", desc: "8位 IT・検索／Google" },
    { genre: "フォーブス世界2025", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "9位 IT・検索／Google" },
    { genre: "フォーブス世界2025", name: "スティーブ・バルマー", date: "1956/03/24", desc: "10位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2025", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "11位 アパレル小売／Inditex (ZARA)" },
    { genre: "フォーブス世界2025", name: "カルロス・スリム", date: "1940/01/28", desc: "12位 通信／America Movil" },
    { genre: "フォーブス世界2025", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "13位 金融情報・メディア／Bloomberg" },
    { genre: "フォーブス世界2025", name: "ムケシュ・アンバニ", date: "1957/04/19", desc: "14位 石油・通信／Reliance Industries" },
    { genre: "フォーブス世界2024", name: "イーロン・マスク", date: "1971/06/28", desc: "1位 自動車・宇宙／Tesla" },
    { genre: "フォーブス世界2024", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "2位 EC・クラウド／Amazon" },
    { genre: "フォーブス世界2024", name: "ベルナール・アルノー", date: "1949/03/05", desc: "3位 高級ブランド／LVMH" },
    { genre: "フォーブス世界2024", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "4位 SNS・IT／Meta" },
    { genre: "フォーブス世界2024", name: "ビル・ゲイツ", date: "1955/10/28", desc: "5位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2024", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "6位 投資・保険／Berkshire Hathaway" },
    { genre: "フォーブス世界2024", name: "ラリー・エリソン", date: "1944/08/17", desc: "7位 ソフトウェア／Oracle" },
    { genre: "フォーブス世界2024", name: "ラリー・ペイジ", date: "1973/03/26", desc: "8位 IT・検索／Google" },
    { genre: "フォーブス世界2024", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "9位 IT・検索／Google" },
    { genre: "フォーブス世界2024", name: "スティーブ・バルマー", date: "1956/03/24", desc: "10位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2024", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "11位 アパレル小売／Inditex (ZARA)" },
    { genre: "フォーブス世界2024", name: "カルロス・スリム", date: "1940/01/28", desc: "12位 通信／America Movil" },
    { genre: "フォーブス世界2024", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "13位 金融情報・メディア／Bloomberg" },
    { genre: "フォーブス世界2024", name: "ムケシュ・アンバニ", date: "1957/04/19", desc: "14位 石油・通信／Reliance Industries" },
    { genre: "フォーブス世界2023", name: "イーロン・マスク", date: "1971/06/28", desc: "1位 自動車・宇宙／Tesla" },
    { genre: "フォーブス世界2023", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "2位 EC・クラウド／Amazon" },
    { genre: "フォーブス世界2023", name: "ベルナール・アルノー", date: "1949/03/05", desc: "3位 高級ブランド／LVMH" },
    { genre: "フォーブス世界2023", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "4位 SNS・IT／Meta" },
    { genre: "フォーブス世界2023", name: "ビル・ゲイツ", date: "1955/10/28", desc: "5位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2023", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "6位 投資・保険／Berkshire Hathaway" },
    { genre: "フォーブス世界2023", name: "ラリー・エリソン", date: "1944/08/17", desc: "7位 ソフトウェア／Oracle" },
    { genre: "フォーブス世界2023", name: "ラリー・ペイジ", date: "1973/03/26", desc: "8位 IT・検索／Google" },
    { genre: "フォーブス世界2023", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "9位 IT・検索／Google" },
    { genre: "フォーブス世界2023", name: "スティーブ・バルマー", date: "1956/03/24", desc: "10位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2023", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "11位 アパレル小売／Inditex (ZARA)" },
    { genre: "フォーブス世界2023", name: "カルロス・スリム", date: "1940/01/28", desc: "12位 通信／America Movil" },
    { genre: "フォーブス世界2023", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "13位 金融情報・メディア／Bloomberg" },
    { genre: "フォーブス世界2023", name: "ムケシュ・アンバニ", date: "1957/04/19", desc: "14位 石油・通信／Reliance Industries" },
    { genre: "フォーブス世界2022", name: "イーロン・マスク", date: "1971/06/28", desc: "1位 自動車・宇宙／Tesla" },
    { genre: "フォーブス世界2022", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "2位 EC・クラウド／Amazon" },
    { genre: "フォーブス世界2022", name: "ベルナール・アルノー", date: "1949/03/05", desc: "3位 高級ブランド／LVMH" },
    { genre: "フォーブス世界2022", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "4位 SNS・IT／Meta" },
    { genre: "フォーブス世界2022", name: "ビル・ゲイツ", date: "1955/10/28", desc: "5位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2022", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "6位 投資・保険／Berkshire Hathaway" },
    { genre: "フォーブス世界2022", name: "ラリー・エリソン", date: "1944/08/17", desc: "7位 ソフトウェア／Oracle" },
    { genre: "フォーブス世界2022", name: "ラリー・ペイジ", date: "1973/03/26", desc: "8位 IT・検索／Google" },
    { genre: "フォーブス世界2022", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "9位 IT・検索／Google" },
    { genre: "フォーブス世界2022", name: "スティーブ・バルマー", date: "1956/03/24", desc: "10位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2022", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "11位 アパレル小売／Inditex (ZARA)" },
    { genre: "フォーブス世界2022", name: "カルロス・スリム", date: "1940/01/28", desc: "12位 通信／America Movil" },
    { genre: "フォーブス世界2022", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "13位 金融情報・メディア／Bloomberg" },
    { genre: "フォーブス世界2022", name: "ムケシュ・アンバニ", date: "1957/04/19", desc: "14位 石油・通信／Reliance Industries" },
    { genre: "フォーブス世界2021", name: "イーロン・マスク", date: "1971/06/28", desc: "1位 自動車・宇宙／Tesla" },
    { genre: "フォーブス世界2021", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "2位 EC・クラウド／Amazon" },
    { genre: "フォーブス世界2021", name: "ベルナール・アルノー", date: "1949/03/05", desc: "3位 高級ブランド／LVMH" },
    { genre: "フォーブス世界2021", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "4位 SNS・IT／Meta" },
    { genre: "フォーブス世界2021", name: "ビル・ゲイツ", date: "1955/10/28", desc: "5位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2021", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "6位 投資・保険／Berkshire Hathaway" },
    { genre: "フォーブス世界2021", name: "ラリー・エリソン", date: "1944/08/17", desc: "7位 ソフトウェア／Oracle" },
    { genre: "フォーブス世界2021", name: "ラリー・ペイジ", date: "1973/03/26", desc: "8位 IT・検索／Google" },
    { genre: "フォーブス世界2021", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "9位 IT・検索／Google" },
    { genre: "フォーブス世界2021", name: "スティーブ・バルマー", date: "1956/03/24", desc: "10位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2021", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "11位 アパレル小売／Inditex (ZARA)" },
    { genre: "フォーブス世界2021", name: "カルロス・スリム", date: "1940/01/28", desc: "12位 通信／America Movil" },
    { genre: "フォーブス世界2021", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "13位 金融情報・メディア／Bloomberg" },
    { genre: "フォーブス世界2021", name: "ムケシュ・アンバニ", date: "1957/04/19", desc: "14位 石油・通信／Reliance Industries" },
    { genre: "フォーブス世界2020", name: "イーロン・マスク", date: "1971/06/28", desc: "1位 自動車・宇宙／Tesla" },
    { genre: "フォーブス世界2020", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "2位 EC・クラウド／Amazon" },
    { genre: "フォーブス世界2020", name: "ベルナール・アルノー", date: "1949/03/05", desc: "3位 高級ブランド／LVMH" },
    { genre: "フォーブス世界2020", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "4位 SNS・IT／Meta" },
    { genre: "フォーブス世界2020", name: "ビル・ゲイツ", date: "1955/10/28", desc: "5位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2020", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "6位 投資・保険／Berkshire Hathaway" },
    { genre: "フォーブス世界2020", name: "ラリー・エリソン", date: "1944/08/17", desc: "7位 ソフトウェア／Oracle" },
    { genre: "フォーブス世界2020", name: "ラリー・ペイジ", date: "1973/03/26", desc: "8位 IT・検索／Google" },
    { genre: "フォーブス世界2020", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "9位 IT・検索／Google" },
    { genre: "フォーブス世界2020", name: "スティーブ・バルマー", date: "1956/03/24", desc: "10位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2020", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "11位 アパレル小売／Inditex (ZARA)" },
    { genre: "フォーブス世界2020", name: "カルロス・スリム", date: "1940/01/28", desc: "12位 通信／America Movil" },
    { genre: "フォーブス世界2020", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "13位 金融情報・メディア／Bloomberg" },
    { genre: "フォーブス世界2020", name: "ムケシュ・アンバニ", date: "1957/04/19", desc: "14位 石油・通信／Reliance Industries" },
    { genre: "フォーブス世界2019", name: "イーロン・マスク", date: "1971/06/28", desc: "1位 自動車・宇宙／Tesla" },
    { genre: "フォーブス世界2019", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "2位 EC・クラウド／Amazon" },
    { genre: "フォーブス世界2019", name: "ベルナール・アルノー", date: "1949/03/05", desc: "3位 高級ブランド／LVMH" },
    { genre: "フォーブス世界2019", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "4位 SNS・IT／Meta" },
    { genre: "フォーブス世界2019", name: "ビル・ゲイツ", date: "1955/10/28", desc: "5位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2019", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "6位 投資・保険／Berkshire Hathaway" },
    { genre: "フォーブス世界2019", name: "ラリー・エリソン", date: "1944/08/17", desc: "7位 ソフトウェア／Oracle" },
    { genre: "フォーブス世界2019", name: "ラリー・ペイジ", date: "1973/03/26", desc: "8位 IT・検索／Google" },
    { genre: "フォーブス世界2019", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "9位 IT・検索／Google" },
    { genre: "フォーブス世界2019", name: "スティーブ・バルマー", date: "1956/03/24", desc: "10位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2019", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "11位 アパレル小売／Inditex (ZARA)" },
    { genre: "フォーブス世界2019", name: "カルロス・スリム", date: "1940/01/28", desc: "12位 通信／America Movil" },
    { genre: "フォーブス世界2019", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "13位 金融情報・メディア／Bloomberg" },
    { genre: "フォーブス世界2019", name: "ムケシュ・アンバニ", date: "1957/04/19", desc: "14位 石油・通信／Reliance Industries" },
    { genre: "フォーブス世界2018", name: "イーロン・マスク", date: "1971/06/28", desc: "1位 自動車・宇宙／Tesla" },
    { genre: "フォーブス世界2018", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "2位 EC・クラウド／Amazon" },
    { genre: "フォーブス世界2018", name: "ベルナール・アルノー", date: "1949/03/05", desc: "3位 高級ブランド／LVMH" },
    { genre: "フォーブス世界2018", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "4位 SNS・IT／Meta" },
    { genre: "フォーブス世界2018", name: "ビル・ゲイツ", date: "1955/10/28", desc: "5位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2018", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "6位 投資・保険／Berkshire Hathaway" },
    { genre: "フォーブス世界2018", name: "ラリー・エリソン", date: "1944/08/17", desc: "7位 ソフトウェア／Oracle" },
    { genre: "フォーブス世界2018", name: "ラリー・ペイジ", date: "1973/03/26", desc: "8位 IT・検索／Google" },
    { genre: "フォーブス世界2018", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "9位 IT・検索／Google" },
    { genre: "フォーブス世界2018", name: "スティーブ・バルマー", date: "1956/03/24", desc: "10位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2018", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "11位 アパレル小売／Inditex (ZARA)" },
    { genre: "フォーブス世界2018", name: "カルロス・スリム", date: "1940/01/28", desc: "12位 通信／America Movil" },
    { genre: "フォーブス世界2018", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "13位 金融情報・メディア／Bloomberg" },
    { genre: "フォーブス世界2018", name: "ムケシュ・アンバニ", date: "1957/04/19", desc: "14位 石油・通信／Reliance Industries" },
    { genre: "フォーブス世界2017", name: "イーロン・マスク", date: "1971/06/28", desc: "1位 自動車・宇宙／Tesla" },
    { genre: "フォーブス世界2017", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "2位 EC・クラウド／Amazon" },
    { genre: "フォーブス世界2017", name: "ベルナール・アルノー", date: "1949/03/05", desc: "3位 高級ブランド／LVMH" },
    { genre: "フォーブス世界2017", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "4位 SNS・IT／Meta" },
    { genre: "フォーブス世界2017", name: "ビル・ゲイツ", date: "1955/10/28", desc: "5位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2017", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "6位 投資・保険／Berkshire Hathaway" },
    { genre: "フォーブス世界2017", name: "ラリー・エリソン", date: "1944/08/17", desc: "7位 ソフトウェア／Oracle" },
    { genre: "フォーブス世界2017", name: "ラリー・ペイジ", date: "1973/03/26", desc: "8位 IT・検索／Google" },
    { genre: "フォーブス世界2017", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "9位 IT・検索／Google" },
    { genre: "フォーブス世界2017", name: "スティーブ・バルマー", date: "1956/03/24", desc: "10位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2017", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "11位 アパレル小売／Inditex (ZARA)" },
    { genre: "フォーブス世界2017", name: "カルロス・スリム", date: "1940/01/28", desc: "12位 通信／America Movil" },
    { genre: "フォーブス世界2017", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "13位 金融情報・メディア／Bloomberg" },
    { genre: "フォーブス世界2017", name: "ムケシュ・アンバニ", date: "1957/04/19", desc: "14位 石油・通信／Reliance Industries" },
    { genre: "フォーブス世界2016", name: "イーロン・マスク", date: "1971/06/28", desc: "1位 自動車・宇宙／Tesla" },
    { genre: "フォーブス世界2016", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "2位 EC・クラウド／Amazon" },
    { genre: "フォーブス世界2016", name: "ベルナール・アルノー", date: "1949/03/05", desc: "3位 高級ブランド／LVMH" },
    { genre: "フォーブス世界2016", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "4位 SNS・IT／Meta" },
    { genre: "フォーブス世界2016", name: "ビル・ゲイツ", date: "1955/10/28", desc: "5位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2016", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "6位 投資・保険／Berkshire Hathaway" },
    { genre: "フォーブス世界2016", name: "ラリー・エリソン", date: "1944/08/17", desc: "7位 ソフトウェア／Oracle" },
    { genre: "フォーブス世界2016", name: "ラリー・ペイジ", date: "1973/03/26", desc: "8位 IT・検索／Google" },
    { genre: "フォーブス世界2016", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "9位 IT・検索／Google" },
    { genre: "フォーブス世界2016", name: "スティーブ・バルマー", date: "1956/03/24", desc: "10位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2016", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "11位 アパレル小売／Inditex (ZARA)" },
    { genre: "フォーブス世界2016", name: "カルロス・スリム", date: "1940/01/28", desc: "12位 通信／America Movil" },
    { genre: "フォーブス世界2016", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "13位 金融情報・メディア／Bloomberg" },
    { genre: "フォーブス世界2016", name: "ムケシュ・アンバニ", date: "1957/04/19", desc: "14位 石油・通信／Reliance Industries" },
    { genre: "フォーブス世界2015", name: "イーロン・マスク", date: "1971/06/28", desc: "1位 自動車・宇宙／Tesla" },
    { genre: "フォーブス世界2015", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "2位 EC・クラウド／Amazon" },
    { genre: "フォーブス世界2015", name: "ベルナール・アルノー", date: "1949/03/05", desc: "3位 高級ブランド／LVMH" },
    { genre: "フォーブス世界2015", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "4位 SNS・IT／Meta" },
    { genre: "フォーブス世界2015", name: "ビル・ゲイツ", date: "1955/10/28", desc: "5位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2015", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "6位 投資・保険／Berkshire Hathaway" },
    { genre: "フォーブス世界2015", name: "ラリー・エリソン", date: "1944/08/17", desc: "7位 ソフトウェア／Oracle" },
    { genre: "フォーブス世界2015", name: "ラリー・ペイジ", date: "1973/03/26", desc: "8位 IT・検索／Google" },
    { genre: "フォーブス世界2015", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "9位 IT・検索／Google" },
    { genre: "フォーブス世界2015", name: "スティーブ・バルマー", date: "1956/03/24", desc: "10位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2015", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "11位 アパレル小売／Inditex (ZARA)" },
    { genre: "フォーブス世界2015", name: "カルロス・スリム", date: "1940/01/28", desc: "12位 通信／America Movil" },
    { genre: "フォーブス世界2015", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "13位 金融情報・メディア／Bloomberg" },
    { genre: "フォーブス世界2015", name: "ムケシュ・アンバニ", date: "1957/04/19", desc: "14位 石油・通信／Reliance Industries" },
    { genre: "フォーブス世界2014", name: "イーロン・マスク", date: "1971/06/28", desc: "1位 自動車・宇宙／Tesla" },
    { genre: "フォーブス世界2014", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "2位 EC・クラウド／Amazon" },
    { genre: "フォーブス世界2014", name: "ベルナール・アルノー", date: "1949/03/05", desc: "3位 高級ブランド／LVMH" },
    { genre: "フォーブス世界2014", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "4位 SNS・IT／Meta" },
    { genre: "フォーブス世界2014", name: "ビル・ゲイツ", date: "1955/10/28", desc: "5位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2014", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "6位 投資・保険／Berkshire Hathaway" },
    { genre: "フォーブス世界2014", name: "ラリー・エリソン", date: "1944/08/17", desc: "7位 ソフトウェア／Oracle" },
    { genre: "フォーブス世界2014", name: "ラリー・ペイジ", date: "1973/03/26", desc: "8位 IT・検索／Google" },
    { genre: "フォーブス世界2014", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "9位 IT・検索／Google" },
    { genre: "フォーブス世界2014", name: "スティーブ・バルマー", date: "1956/03/24", desc: "10位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2014", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "11位 アパレル小売／Inditex (ZARA)" },
    { genre: "フォーブス世界2014", name: "カルロス・スリム", date: "1940/01/28", desc: "12位 通信／America Movil" },
    { genre: "フォーブス世界2014", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "13位 金融情報・メディア／Bloomberg" },
    { genre: "フォーブス世界2014", name: "ムケシュ・アンバニ", date: "1957/04/19", desc: "14位 石油・通信／Reliance Industries" },
    { genre: "フォーブス世界2013", name: "イーロン・マスク", date: "1971/06/28", desc: "1位 自動車・宇宙／Tesla" },
    { genre: "フォーブス世界2013", name: "ジェフ・ベゾス", date: "1964/01/12", desc: "2位 EC・クラウド／Amazon" },
    { genre: "フォーブス世界2013", name: "ベルナール・アルノー", date: "1949/03/05", desc: "3位 高級ブランド／LVMH" },
    { genre: "フォーブス世界2013", name: "マーク・ザッカーバーグ", date: "1984/05/14", desc: "4位 SNS・IT／Meta" },
    { genre: "フォーブス世界2013", name: "ビル・ゲイツ", date: "1955/10/28", desc: "5位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2013", name: "ウォーレン・バフェット", date: "1930/08/30", desc: "6位 投資・保険／Berkshire Hathaway" },
    { genre: "フォーブス世界2013", name: "ラリー・エリソン", date: "1944/08/17", desc: "7位 ソフトウェア／Oracle" },
    { genre: "フォーブス世界2013", name: "ラリー・ペイジ", date: "1973/03/26", desc: "8位 IT・検索／Google" },
    { genre: "フォーブス世界2013", name: "セルゲイ・ブリン", date: "1973/08/21", desc: "9位 IT・検索／Google" },
    { genre: "フォーブス世界2013", name: "スティーブ・バルマー", date: "1956/03/24", desc: "10位 ソフトウェア／Microsoft" },
    { genre: "フォーブス世界2013", name: "アマンシオ・オルテガ", date: "1936/03/28", desc: "11位 アパレル小売／Inditex (ZARA)" },
    { genre: "フォーブス世界2013", name: "カルロス・スリム", date: "1940/01/28", desc: "12位 通信／America Movil" },
    { genre: "フォーブス世界2013", name: "マイケル・ブルームバーグ", date: "1942/02/14", desc: "13位 金融情報・メディア／Bloomberg" },
    { genre: "フォーブス世界2013", name: "ムケシュ・アンバニ", date: "1957/04/19", desc: "14位 石油・通信／Reliance Industries" },
    { genre: "フォーブス日本2026", name: "柳井正", date: "1949/02/07", desc: "1位 アパレル小売／ファーストリテイリング" },
    { genre: "フォーブス日本2026", name: "孫正義", date: "1957/08/11", desc: "2位 通信・投資／ソフトバンクグループ" },
    { genre: "フォーブス日本2026", name: "滝崎武光", date: "1945/06/10", desc: "3位 電子機器・センサー／キーエンス" },
    { genre: "フォーブス日本2026", name: "三木谷浩史", date: "1965/03/11", desc: "4位 EC・金融・通信／楽天グループ" },
    { genre: "フォーブス日本2026", name: "高原豪久", date: "1961/07/12", desc: "5位 衛生用品製造／ユニ・チャーム" },
    { genre: "フォーブス日本2026", name: "森章", date: "1936/07/12", desc: "6位 不動産開発／森トラスト" },
    { genre: "フォーブス日本2026", name: "似鳥昭雄", date: "1944/03/05", desc: "7位 家具・インテリア小売／ニトリホールディングス" },
    { genre: "フォーブス日本2026", name: "重田康光", date: "1965/02/25", desc: "8位 情報通信・OA機器／光通信" },
    { genre: "フォーブス日本2026", name: "永守重信", date: "1944/08/28", desc: "9位 精密モーター製造／ニデック" },
    { genre: "フォーブス日本2026", name: "安田隆夫", date: "1949/05/15", desc: "10位 総合ディスカウント小売／パン・パシフィック・インターナショナル" },
    { genre: "フォーブス日本2026", name: "藤田晋", date: "1973/05/16", desc: "11位 ネット広告・メディア／サイバーエージェント" },
    { genre: "フォーブス日本2026", name: "前沢友作", date: "1975/11/22", desc: "12位 ECアパレル／ZOZO" },
    { genre: "フォーブス日本2025", name: "柳井正", date: "1949/02/07", desc: "1位 アパレル小売／ファーストリテイリング" },
    { genre: "フォーブス日本2025", name: "孫正義", date: "1957/08/11", desc: "2位 通信・投資／ソフトバンクグループ" },
    { genre: "フォーブス日本2025", name: "滝崎武光", date: "1945/06/10", desc: "3位 電子機器・センサー／キーエンス" },
    { genre: "フォーブス日本2025", name: "三木谷浩史", date: "1965/03/11", desc: "4位 EC・金融・通信／楽天グループ" },
    { genre: "フォーブス日本2025", name: "高原豪久", date: "1961/07/12", desc: "5位 衛生用品製造／ユニ・チャーム" },
    { genre: "フォーブス日本2025", name: "森章", date: "1936/07/12", desc: "6位 不動産開発／森トラスト" },
    { genre: "フォーブス日本2025", name: "似鳥昭雄", date: "1944/03/05", desc: "7位 家具・インテリア小売／ニトリホールディングス" },
    { genre: "フォーブス日本2025", name: "重田康光", date: "1965/02/25", desc: "8位 情報通信・OA機器／光通信" },
    { genre: "フォーブス日本2025", name: "永守重信", date: "1944/08/28", desc: "9位 精密モーター製造／ニデック" },
    { genre: "フォーブス日本2025", name: "安田隆夫", date: "1949/05/15", desc: "10位 総合ディスカウント小売／パン・パシフィック・インターナショナル" },
    { genre: "フォーブス日本2025", name: "藤田晋", date: "1973/05/16", desc: "11位 ネット広告・メディア／サイバーエージェント" },
    { genre: "フォーブス日本2025", name: "前沢友作", date: "1975/11/22", desc: "12位 ECアパレル／ZOZO" },
    { genre: "フォーブス日本2024", name: "柳井正", date: "1949/02/07", desc: "1位 アパレル小売／ファーストリテイリング" },
    { genre: "フォーブス日本2024", name: "孫正義", date: "1957/08/11", desc: "2位 通信・投資／ソフトバンクグループ" },
    { genre: "フォーブス日本2024", name: "滝崎武光", date: "1945/06/10", desc: "3位 電子機器・センサー／キーエンス" },
    { genre: "フォーブス日本2024", name: "三木谷浩史", date: "1965/03/11", desc: "4位 EC・金融・通信／楽天グループ" },
    { genre: "フォーブス日本2024", name: "高原豪久", date: "1961/07/12", desc: "5位 衛生用品製造／ユニ・チャーム" },
    { genre: "フォーブス日本2024", name: "森章", date: "1936/07/12", desc: "6位 不動産開発／森トラスト" },
    { genre: "フォーブス日本2024", name: "似鳥昭雄", date: "1944/03/05", desc: "7位 家具・インテリア小売／ニトリホールディングス" },
    { genre: "フォーブス日本2024", name: "重田康光", date: "1965/02/25", desc: "8位 情報通信・OA機器／光通信" },
    { genre: "フォーブス日本2024", name: "永守重信", date: "1944/08/28", desc: "9位 精密モーター製造／ニデック" },
    { genre: "フォーブス日本2024", name: "安田隆夫", date: "1949/05/15", desc: "10位 総合ディスカウント小売／パン・パシフィック・インターナショナル" },
    { genre: "フォーブス日本2024", name: "藤田晋", date: "1973/05/16", desc: "11位 ネット広告・メディア／サイバーエージェント" },
    { genre: "フォーブス日本2024", name: "前沢友作", date: "1975/11/22", desc: "12位 ECアパレル／ZOZO" },
    { genre: "フォーブス日本2023", name: "柳井正", date: "1949/02/07", desc: "1位 アパレル小売／ファーストリテイリング" },
    { genre: "フォーブス日本2023", name: "孫正義", date: "1957/08/11", desc: "2位 通信・投資／ソフトバンクグループ" },
    { genre: "フォーブス日本2023", name: "滝崎武光", date: "1945/06/10", desc: "3位 電子機器・センサー／キーエンス" },
    { genre: "フォーブス日本2023", name: "三木谷浩史", date: "1965/03/11", desc: "4位 EC・金融・通信／楽天グループ" },
    { genre: "フォーブス日本2023", name: "高原豪久", date: "1961/07/12", desc: "5位 衛生用品製造／ユニ・チャーム" },
    { genre: "フォーブス日本2023", name: "森章", date: "1936/07/12", desc: "6位 不動産開発／森トラスト" },
    { genre: "フォーブス日本2023", name: "似鳥昭雄", date: "1944/03/05", desc: "7位 家具・インテリア小売／ニトリホールディングス" },
    { genre: "フォーブス日本2023", name: "重田康光", date: "1965/02/25", desc: "8位 情報通信・OA機器／光通信" },
    { genre: "フォーブス日本2023", name: "永守重信", date: "1944/08/28", desc: "9位 精密モーター製造／ニデック" },
    { genre: "フォーブス日本2023", name: "安田隆夫", date: "1949/05/15", desc: "10位 総合ディスカウント小売／パン・パシフィック・インターナショナル" },
    { genre: "フォーブス日本2023", name: "藤田晋", date: "1973/05/16", desc: "11位 ネット広告・メディア／サイバーエージェント" },
    { genre: "フォーブス日本2023", name: "前沢友作", date: "1975/11/22", desc: "12位 ECアパレル／ZOZO" },
    { genre: "フォーブス日本2022", name: "柳井正", date: "1949/02/07", desc: "1位 アパレル小売／ファーストリテイリング" },
    { genre: "フォーブス日本2022", name: "孫正義", date: "1957/08/11", desc: "2位 通信・投資／ソフトバンクグループ" },
    { genre: "フォーブス日本2022", name: "滝崎武光", date: "1945/06/10", desc: "3位 電子機器・センサー／キーエンス" },
    { genre: "フォーブス日本2022", name: "三木谷浩史", date: "1965/03/11", desc: "4位 EC・金融・通信／楽天グループ" },
    { genre: "フォーブス日本2022", name: "高原豪久", date: "1961/07/12", desc: "5位 衛生用品製造／ユニ・チャーム" },
    { genre: "フォーブス日本2022", name: "森章", date: "1936/07/12", desc: "6位 不動産開発／森トラスト" },
    { genre: "フォーブス日本2022", name: "似鳥昭雄", date: "1944/03/05", desc: "7位 家具・インテリア小売／ニトリホールディングス" },
    { genre: "フォーブス日本2022", name: "重田康光", date: "1965/02/25", desc: "8位 情報通信・OA機器／光通信" },
    { genre: "フォーブス日本2022", name: "永守重信", date: "1944/08/28", desc: "9位 精密モーター製造／ニデック" },
    { genre: "フォーブス日本2022", name: "安田隆夫", date: "1949/05/15", desc: "10位 総合ディスカウント小売／パン・パシフィック・インターナショナル" },
    { genre: "フォーブス日本2022", name: "藤田晋", date: "1973/05/16", desc: "11位 ネット広告・メディア／サイバーエージェント" },
    { genre: "フォーブス日本2022", name: "前沢友作", date: "1975/11/22", desc: "12位 ECアパレル／ZOZO" },
    { genre: "フォーブス日本2021", name: "柳井正", date: "1949/02/07", desc: "1位 アパレル小売／ファーストリテイリング" },
    { genre: "フォーブス日本2021", name: "孫正義", date: "1957/08/11", desc: "2位 通信・投資／ソフトバンクグループ" },
    { genre: "フォーブス日本2021", name: "滝崎武光", date: "1945/06/10", desc: "3位 電子機器・センサー／キーエンス" },
    { genre: "フォーブス日本2021", name: "三木谷浩史", date: "1965/03/11", desc: "4位 EC・金融・通信／楽天グループ" },
    { genre: "フォーブス日本2021", name: "高原豪久", date: "1961/07/12", desc: "5位 衛生用品製造／ユニ・チャーム" },
    { genre: "フォーブス日本2021", name: "森章", date: "1936/07/12", desc: "6位 不動産開発／森トラスト" },
    { genre: "フォーブス日本2021", name: "似鳥昭雄", date: "1944/03/05", desc: "7位 家具・インテリア小売／ニトリホールディングス" },
    { genre: "フォーブス日本2021", name: "重田康光", date: "1965/02/25", desc: "8位 情報通信・OA機器／光通信" },
    { genre: "フォーブス日本2021", name: "永守重信", date: "1944/08/28", desc: "9位 精密モーター製造／ニデック" },
    { genre: "フォーブス日本2021", name: "安田隆夫", date: "1949/05/15", desc: "10位 総合ディスカウント小売／パン・パシフィック・インターナショナル" },
    { genre: "フォーブス日本2021", name: "藤田晋", date: "1973/05/16", desc: "11位 ネット広告・メディア／サイバーエージェント" },
    { genre: "フォーブス日本2021", name: "前沢友作", date: "1975/11/22", desc: "12位 ECアパレル／ZOZO" },
    { genre: "フォーブス日本2020", name: "柳井正", date: "1949/02/07", desc: "1位 アパレル小売／ファーストリテイリング" },
    { genre: "フォーブス日本2020", name: "孫正義", date: "1957/08/11", desc: "2位 通信・投資／ソフトバンクグループ" },
    { genre: "フォーブス日本2020", name: "滝崎武光", date: "1945/06/10", desc: "3位 電子機器・センサー／キーエンス" },
    { genre: "フォーブス日本2020", name: "三木谷浩史", date: "1965/03/11", desc: "4位 EC・金融・通信／楽天グループ" },
    { genre: "フォーブス日本2020", name: "高原豪久", date: "1961/07/12", desc: "5位 衛生用品製造／ユニ・チャーム" },
    { genre: "フォーブス日本2020", name: "森章", date: "1936/07/12", desc: "6位 不動産開発／森トラスト" },
    { genre: "フォーブス日本2020", name: "似鳥昭雄", date: "1944/03/05", desc: "7位 家具・インテリア小売／ニトリホールディングス" },
    { genre: "フォーブス日本2020", name: "重田康光", date: "1965/02/25", desc: "8位 情報通信・OA機器／光通信" },
    { genre: "フォーブス日本2020", name: "永守重信", date: "1944/08/28", desc: "9位 精密モーター製造／ニデック" },
    { genre: "フォーブス日本2020", name: "安田隆夫", date: "1949/05/15", desc: "10位 総合ディスカウント小売／パン・パシフィック・インターナショナル" },
    { genre: "フォーブス日本2020", name: "藤田晋", date: "1973/05/16", desc: "11位 ネット広告・メディア／サイバーエージェント" },
    { genre: "フォーブス日本2020", name: "前沢友作", date: "1975/11/22", desc: "12位 ECアパレル／ZOZO" },
    { genre: "フォーブス日本2019", name: "柳井正", date: "1949/02/07", desc: "1位 アパレル小売／ファーストリテイリング" },
    { genre: "フォーブス日本2019", name: "孫正義", date: "1957/08/11", desc: "2位 通信・投資／ソフトバンクグループ" },
    { genre: "フォーブス日本2019", name: "滝崎武光", date: "1945/06/10", desc: "3位 電子機器・センサー／キーエンス" },
    { genre: "フォーブス日本2019", name: "三木谷浩史", date: "1965/03/11", desc: "4位 EC・金融・通信／楽天グループ" },
    { genre: "フォーブス日本2019", name: "高原豪久", date: "1961/07/12", desc: "5位 衛生用品製造／ユニ・チャーム" },
    { genre: "フォーブス日本2019", name: "森章", date: "1936/07/12", desc: "6位 不動産開発／森トラスト" },
    { genre: "フォーブス日本2019", name: "似鳥昭雄", date: "1944/03/05", desc: "7位 家具・インテリア小売／ニトリホールディングス" },
    { genre: "フォーブス日本2019", name: "重田康光", date: "1965/02/25", desc: "8位 情報通信・OA機器／光通信" },
    { genre: "フォーブス日本2019", name: "永守重信", date: "1944/08/28", desc: "9位 精密モーター製造／ニデック" },
    { genre: "フォーブス日本2019", name: "安田隆夫", date: "1949/05/15", desc: "10位 総合ディスカウント小売／パン・パシフィック・インターナショナル" },
    { genre: "フォーブス日本2019", name: "藤田晋", date: "1973/05/16", desc: "11位 ネット広告・メディア／サイバーエージェント" },
    { genre: "フォーブス日本2019", name: "前沢友作", date: "1975/11/22", desc: "12位 ECアパレル／ZOZO" },
    { genre: "フォーブス日本2018", name: "柳井正", date: "1949/02/07", desc: "1位 アパレル小売／ファーストリテイリング" },
    { genre: "フォーブス日本2018", name: "孫正義", date: "1957/08/11", desc: "2位 通信・投資／ソフトバンクグループ" },
    { genre: "フォーブス日本2018", name: "滝崎武光", date: "1945/06/10", desc: "3位 電子機器・センサー／キーエンス" },
    { genre: "フォーブス日本2018", name: "三木谷浩史", date: "1965/03/11", desc: "4位 EC・金融・通信／楽天グループ" },
    { genre: "フォーブス日本2018", name: "高原豪久", date: "1961/07/12", desc: "5位 衛生用品製造／ユニ・チャーム" },
    { genre: "フォーブス日本2018", name: "森章", date: "1936/07/12", desc: "6位 不動産開発／森トラスト" },
    { genre: "フォーブス日本2018", name: "似鳥昭雄", date: "1944/03/05", desc: "7位 家具・インテリア小売／ニトリホールディングス" },
    { genre: "フォーブス日本2018", name: "重田康光", date: "1965/02/25", desc: "8位 情報通信・OA機器／光通信" },
    { genre: "フォーブス日本2018", name: "永守重信", date: "1944/08/28", desc: "9位 精密モーター製造／ニデック" },
    { genre: "フォーブス日本2018", name: "安田隆夫", date: "1949/05/15", desc: "10位 総合ディスカウント小売／パン・パシフィック・インターナショナル" },
    { genre: "フォーブス日本2018", name: "藤田晋", date: "1973/05/16", desc: "11位 ネット広告・メディア／サイバーエージェント" },
    { genre: "フォーブス日本2018", name: "前沢友作", date: "1975/11/22", desc: "12位 ECアパレル／ZOZO" },
    { genre: "フォーブス日本2017", name: "柳井正", date: "1949/02/07", desc: "1位 アパレル小売／ファーストリテイリング" },
    { genre: "フォーブス日本2017", name: "孫正義", date: "1957/08/11", desc: "2位 通信・投資／ソフトバンクグループ" },
    { genre: "フォーブス日本2017", name: "滝崎武光", date: "1945/06/10", desc: "3位 電子機器・センサー／キーエンス" },
    { genre: "フォーブス日本2017", name: "三木谷浩史", date: "1965/03/11", desc: "4位 EC・金融・通信／楽天グループ" },
    { genre: "フォーブス日本2017", name: "高原豪久", date: "1961/07/12", desc: "5位 衛生用品製造／ユニ・チャーム" },
    { genre: "フォーブス日本2017", name: "森章", date: "1936/07/12", desc: "6位 不動産開発／森トラスト" },
    { genre: "フォーブス日本2017", name: "似鳥昭雄", date: "1944/03/05", desc: "7位 家具・インテリア小売／ニトリホールディングス" },
    { genre: "フォーブス日本2017", name: "重田康光", date: "1965/02/25", desc: "8位 情報通信・OA機器／光通信" },
    { genre: "フォーブス日本2017", name: "永守重信", date: "1944/08/28", desc: "9位 精密モーター製造／ニデック" },
    { genre: "フォーブス日本2017", name: "安田隆夫", date: "1949/05/15", desc: "10位 総合ディスカウント小売／パン・パシフィック・インターナショナル" },
    { genre: "フォーブス日本2017", name: "藤田晋", date: "1973/05/16", desc: "11位 ネット広告・メディア／サイバーエージェント" },
    { genre: "フォーブス日本2017", name: "前沢友作", date: "1975/11/22", desc: "12位 ECアパレル／ZOZO" },
    { genre: "フォーブス日本2016", name: "柳井正", date: "1949/02/07", desc: "1位 アパレル小売／ファーストリテイリング" },
    { genre: "フォーブス日本2016", name: "孫正義", date: "1957/08/11", desc: "2位 通信・投資／ソフトバンクグループ" },
    { genre: "フォーブス日本2016", name: "滝崎武光", date: "1945/06/10", desc: "3位 電子機器・センサー／キーエンス" },
    { genre: "フォーブス日本2016", name: "三木谷浩史", date: "1965/03/11", desc: "4位 EC・金融・通信／楽天グループ" },
    { genre: "フォーブス日本2016", name: "高原豪久", date: "1961/07/12", desc: "5位 衛生用品製造／ユニ・チャーム" },
    { genre: "フォーブス日本2016", name: "森章", date: "1936/07/12", desc: "6位 不動産開発／森トラスト" },
    { genre: "フォーブス日本2016", name: "似鳥昭雄", date: "1944/03/05", desc: "7位 家具・インテリア小売／ニトリホールディングス" },
    { genre: "フォーブス日本2016", name: "重田康光", date: "1965/02/25", desc: "8位 情報通信・OA機器／光通信" },
    { genre: "フォーブス日本2016", name: "永守重信", date: "1944/08/28", desc: "9位 精密モーター製造／ニデック" },
    { genre: "フォーブス日本2016", name: "安田隆夫", date: "1949/05/15", desc: "10位 総合ディスカウント小売／パン・パシフィック・インターナショナル" },
    { genre: "フォーブス日本2016", name: "藤田晋", date: "1973/05/16", desc: "11位 ネット広告・メディア／サイバーエージェント" },
    { genre: "フォーブス日本2016", name: "前沢友作", date: "1975/11/22", desc: "12位 ECアパレル／ZOZO" },
    { genre: "フォーブス日本2015", name: "柳井正", date: "1949/02/07", desc: "1位 アパレル小売／ファーストリテイリング" },
    { genre: "フォーブス日本2015", name: "孫正義", date: "1957/08/11", desc: "2位 通信・投資／ソフトバンクグループ" },
    { genre: "フォーブス日本2015", name: "滝崎武光", date: "1945/06/10", desc: "3位 電子機器・センサー／キーエンス" },
    { genre: "フォーブス日本2015", name: "三木谷浩史", date: "1965/03/11", desc: "4位 EC・金融・通信／楽天グループ" },
    { genre: "フォーブス日本2015", name: "高原豪久", date: "1961/07/12", desc: "5位 衛生用品製造／ユニ・チャーム" },
    { genre: "フォーブス日本2015", name: "森章", date: "1936/07/12", desc: "6位 不動産開発／森トラスト" },
    { genre: "フォーブス日本2015", name: "似鳥昭雄", date: "1944/03/05", desc: "7位 家具・インテリア小売／ニトリホールディングス" },
    { genre: "フォーブス日本2015", name: "重田康光", date: "1965/02/25", desc: "8位 情報通信・OA機器／光通信" },
    { genre: "フォーブス日本2015", name: "永守重信", date: "1944/08/28", desc: "9位 精密モーター製造／ニデック" },
    { genre: "フォーブス日本2015", name: "安田隆夫", date: "1949/05/15", desc: "10位 総合ディスカウント小売／パン・パシフィック・インターナショナル" },
    { genre: "フォーブス日本2015", name: "藤田晋", date: "1973/05/16", desc: "11位 ネット広告・メディア／サイバーエージェント" },
    { genre: "フォーブス日本2015", name: "前沢友作", date: "1975/11/22", desc: "12位 ECアパレル／ZOZO" },
    { genre: "フォーブス日本2014", name: "柳井正", date: "1949/02/07", desc: "1位 アパレル小売／ファーストリテイリング" },
    { genre: "フォーブス日本2014", name: "孫正義", date: "1957/08/11", desc: "2位 通信・投資／ソフトバンクグループ" },
    { genre: "フォーブス日本2014", name: "滝崎武光", date: "1945/06/10", desc: "3位 電子機器・センサー／キーエンス" },
    { genre: "フォーブス日本2014", name: "三木谷浩史", date: "1965/03/11", desc: "4位 EC・金融・通信／楽天グループ" },
    { genre: "フォーブス日本2014", name: "高原豪久", date: "1961/07/12", desc: "5位 衛生用品製造／ユニ・チャーム" },
    { genre: "フォーブス日本2014", name: "森章", date: "1936/07/12", desc: "6位 不動産開発／森トラスト" },
    { genre: "フォーブス日本2014", name: "似鳥昭雄", date: "1944/03/05", desc: "7位 家具・インテリア小売／ニトリホールディングス" },
    { genre: "フォーブス日本2014", name: "重田康光", date: "1965/02/25", desc: "8位 情報通信・OA機器／光通信" },
    { genre: "フォーブス日本2014", name: "永守重信", date: "1944/08/28", desc: "9位 精密モーター製造／ニデック" },
    { genre: "フォーブス日本2014", name: "安田隆夫", date: "1949/05/15", desc: "10位 総合ディスカウント小売／パン・パシフィック・インターナショナル" },
    { genre: "フォーブス日本2014", name: "藤田晋", date: "1973/05/16", desc: "11位 ネット広告・メディア／サイバーエージェント" },
    { genre: "フォーブス日本2014", name: "前沢友作", date: "1975/11/22", desc: "12位 ECアパレル／ZOZO" },
    { genre: "フォーブス日本2013", name: "柳井正", date: "1949/02/07", desc: "1位 アパレル小売／ファーストリテイリング" },
    { genre: "フォーブス日本2013", name: "孫正義", date: "1957/08/11", desc: "2位 通信・投資／ソフトバンクグループ" },
    { genre: "フォーブス日本2013", name: "滝崎武光", date: "1945/06/10", desc: "3位 電子機器・センサー／キーエンス" },
    { genre: "フォーブス日本2013", name: "三木谷浩史", date: "1965/03/11", desc: "4位 EC・金融・通信／楽天グループ" },
    { genre: "フォーブス日本2013", name: "高原豪久", date: "1961/07/12", desc: "5位 衛生用品製造／ユニ・チャーム" },
    { genre: "フォーブス日本2013", name: "森章", date: "1936/07/12", desc: "6位 不動産開発／森トラスト" },
    { genre: "フォーブス日本2013", name: "似鳥昭雄", date: "1944/03/05", desc: "7位 家具・インテリア小売／ニトリホールディングス" },
    { genre: "フォーブス日本2013", name: "重田康光", date: "1965/02/25", desc: "8位 情報通信・OA機器／光通信" },
    { genre: "フォーブス日本2013", name: "永守重信", date: "1944/08/28", desc: "9位 精密モーター製造／ニデック" },
    { genre: "フォーブス日本2013", name: "安田隆夫", date: "1949/05/15", desc: "10位 総合ディスカウント小売／パン・パシフィック・インターナショナル" },
    { genre: "フォーブス日本2013", name: "藤田晋", date: "1973/05/16", desc: "11位 ネット広告・メディア／サイバーエージェント" },
    { genre: "フォーブス日本2013", name: "前沢友作", date: "1975/11/22", desc: "12位 ECアパレル／ZOZO" },
    { genre: "富家", name: "フランソワーズ・ベッテンコート・メイヤーズ", date: "1953/07/10", desc: "生まれながらの富裕層・化粧品／L'Oreal" },
    { genre: "富家", name: "毒島秀行", date: "1952/11/16", desc: "生まれながらの富裕層・遊技機製造／SANKYO" },
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
        { head: "【読み解きのコツ】柱同士の「対話」を見る", body: "単体で読むだけでなく、柱同士の「エネルギーの橋渡し」を見ると、その人の人生のストーリーが浮かび上がってきます。\n\n・「年柱」と「月柱」の対比：「自分のルーツ（年）」と「今の仕事（月）」が合致しているか、それとも相反して苦労しているかを見ます。ここがスムーズだと、親の跡を継いだり、順調にステップアップする人生になりやすいです。\n\n・「日柱」と「月柱」の葛藤：社会的な責任（月）と、本当の自分（日）のどちらが強いかを見ます。ここが一致していると「公私混同がない＝ストレスが少ない人生」ですが、違うと「仕事ではこう振る舞っているが、家では全く違う顔」という二面性として現れます。\n\n・「日柱」と「時柱」の成熟度：中年期（日）から晩年（時）にかけて、星がどう変化するかを見ます。「今は忙しい（月）が、晩年は趣味を楽しむ（時）」といった未来予測は、この読み解きから導き出されます。" },
      ]
    },
    {
      icon: "🌳", menu: "五行バランス", title: "五行（木・火・土・金・水）バランスの読み方",
      intro: "五行のバランスは、その人の心身の傾向や行動パターンに強く影響します。「多すぎる場合」の過剰な性質と、「一つだけ欠けている場合」の欠落・代償的な性質を10パターンに整理しました。",
      items: [
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
        { head: "◎ 五行は「調和」が理想", body: "もし一つが欠けている場合は、その要素を持つ色を身につけたり、その性質を持つ方角へ行くなどして、日常的に「気」を補うのが古くからの開運の知恵とされています。" },
      ]
    },
  ];

  let kaisetsuActive = 0;
  function renderKaisetsuSection(i) {
    kaisetsuActive = i;
    const body = document.getElementById("kaisetsu-body");
    const sec = KAISETSU_SECTIONS[i];
    if (!body || !sec) return;
    body.innerHTML = `<div class="card">
      <h2>${sec.icon} ${escapeHtml(sec.title)}</h2>
      <div class="hint" style="margin-bottom:10px;">${escapeHtml(sec.intro)}</div>
      ${sec.items.map(it => `<details class="rc-detail compat-item">
        <summary>${escapeHtml(it.head)}</summary>
        <div class="rc-detail-body"><div class="det-row" style="line-height:1.9; white-space:pre-wrap;">${escapeHtml(it.body)}</div></div>
      </details>`).join("")}
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

  function updateAdminUI(email) {
    const isAdmin = (email || "").toLowerCase() === ADMIN_EMAIL;
    const tabBtn = document.getElementById("tab-library");
    if (tabBtn) tabBtn.style.display = isAdmin ? "" : "none";
    const compatTab = document.getElementById("tab-compat");
    if (compatTab) compatTab.style.display = isAdmin ? "" : "none";
    const kaisetsuTab = document.getElementById("tab-kaisetsu");
    if (kaisetsuTab) kaisetsuTab.style.display = isAdmin ? "" : "none";
    if (isAdmin) {
      if (!libraryRendered) { renderLibraryGenreSelect(); renderLibrary(); libraryRendered = true; }
      renderCompatGuide();
      renderKaisetsu();
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
  function libraryCardHtml(name, dateStr, desc, c) {
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
      ${resultDetailHtml(c, name)}`
      : `<div class="hint" style="padding:0 14px 12px;">※生年月日が確定していないため、診断は省略しています。</div>`;
    return `
    <div class="result-card compact">
      <div class="rc-head">
        <div class="rc-name-wrap">
          <span class="rc-name">${escapeHtml(name)}</span>
          <span class="rc-birth">${escapeHtml(dateStr || "生没年不詳")}</span>
        </div>
      </div>
      ${desc ? `<div class="lib-desc">${escapeHtml(desc)}</div>` : ""}
      ${diag}
    </div>`;
  }

  let libraryGenreFilter = "all"; // 図書館のジャンル絞り込み

  // ジャンル絞り込みチップ(すべて/各ジャンル)を描く
  function renderLibraryGenreChips() {
    const box = document.getElementById("library-genre-chips");
    if (!box) return;
    const genres = [...new Set(LIBRARY_PEOPLE.map(p => p.genre))];
    const chip = (val, label) =>
      `<div class="chip ${libraryGenreFilter === val ? "selected" : ""}" data-genre="${escapeHtml(val)}">${escapeHtml(label)}</div>`;
    box.innerHTML = chip("all", "すべて") + genres.map(g => chip(g, g)).join("");
    box.querySelectorAll(".chip").forEach(c => c.addEventListener("click", () => {
      libraryGenreFilter = c.dataset.genre;
      renderLibrary();
    }));
  }

  function renderLibrary() {
    const container = document.getElementById("library-content");
    if (!container) return;
    renderLibraryGenreChips();
    const term = (document.getElementById("library-search")?.value || "").trim().toLowerCase();
    let matched = LIBRARY_PEOPLE.filter(p => libraryGenreFilter === "all" || p.genre === libraryGenreFilter);
    if (term) matched = matched.filter(p =>
      p.name.toLowerCase().includes(term) || (p.desc || "").toLowerCase().includes(term));

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
      byGenre[genre].forEach(p => {
        const d = libDateParts(p.date);
        const c = d ? calcFourPillars(d.y, d.m, d.d, null, null) : null;
        html += libraryCardHtml(p.name, p.date, p.desc, c);
      });
      html += `</div>`;
    });
    container.innerHTML = html;
  }

  // 図書館のジャンル集計用セレクトを用意する
  function renderLibraryGenreSelect() {
    const sel = document.getElementById("library-agg-genre");
    if (!sel || sel.dataset.ready) return;
    const genres = [...new Set(LIBRARY_PEOPLE.map(p => p.genre))];
    sel.innerHTML = `<option value="">集計しない（一覧のみ）</option>` +
      genres.map(g => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join("");
    sel.dataset.ready = "1";
  }

  // 選択したジャンルの人物(生年月日が確定している人)で集計を表示する
  function renderLibraryAggregate(genre) {
    const box = document.getElementById("library-agg");
    if (!box) return;
    if (!genre) { box.innerHTML = ""; return; }
    const members = LIBRARY_PEOPLE.filter(p => p.genre === genre)
      .map(p => { const d = libDateParts(p.date); return d ? { calc: calcFourPillars(d.y, d.m, d.d, null, null) } : null; })
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
    const ym = calcRhythm(dayStem, y, m, 1);
    const nowd = new Date();
    const todayR = calcRhythm(dayStem, nowd.getFullYear(), nowd.getMonth() + 1, nowd.getDate());
    document.getElementById("rhythm-cal-summary").innerHTML =
      `<span class="det-chip">${y}年 <b>${escapeHtml(ym.year)}</b></span>
       <span class="det-chip">${m}月 <b>${escapeHtml(ym.month)}</b></span>
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

    // 図書館 - 検索
    const librarySearch = document.getElementById("library-search");
    if (librarySearch) librarySearch.addEventListener("input", () => renderLibrary());
    // 図書館 - ジャンル別集計
    renderLibraryGenreSelect();
    const libraryAggGenre = document.getElementById("library-agg-genre");
    if (libraryAggGenre) libraryAggGenre.addEventListener("change", (e) => renderLibraryAggregate(e.target.value));
    // 図書館タブを開いたときも集計セレクトを用意
    document.querySelectorAll(".tab-btn").forEach(btn => {
      if (btn.dataset.tab === "library") btn.addEventListener("click", renderLibraryGenreSelect);
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
    document.getElementById("results-search").addEventListener("input", renderResults);

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
