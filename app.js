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
    const B = 2 - A + Math.floor(A / 4);
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
    if (h !== null) {
      const hbIdx = hourBranchIndex(h, mi);
      const hsIdx = hourStemIndex(JIKKAN.indexOf(dayStem), hbIdx);
      const hourGz = JIKKAN[hsIdx] + JUNISHI[hbIdx];
      const hourJuniun = juniunFor(dayStem, hbIdx);
      jichu = { gz: hourGz, juniun: hourJuniun, ...JUNIUN_TO_ANIMAL[hourJuniun] };
    }

    const bunrui60No = di + 1;
    const bunrui60Detail = BUNRUI60_DETAIL[bunrui60No] || { kanGroup:"", charaName:"" };
    const fukuNoKami = calcFukuNoKami(y, m, d);
    const rail = calcRail(dayStem, JUNISHI[mbIdx], y, m, d);

    return {
      bunrui60: bunrui60No,            // 1〜60
      bunrui60_gz: dayGz,
      bunrui60_kanGroup: bunrui60Detail.kanGroup,
      bunrui60_charaName: bunrui60Detail.charaName,
      fukuNoKami,
      rail,
      dayGz, monthGz, yearGz,
      honshitsu: { juniun: honshitsu, ...JUNIUN_TO_ANIMAL[honshitsu] },
      hyomen:    { juniun: hyomen,    ...JUNIUN_TO_ANIMAL[hyomen] },
      ishi:       { juniun: ishi,       ...JUNIUN_TO_ANIMAL[ishi] },
      jichu,
      effYear
    };
  }

  // ===================================================================
  // アプリ UI ロジック
  // ===================================================================

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

  // Firebase側からのリアルタイム更新を受け取り、メモリ上のキャッシュを更新して再描画する
  window.addEventListener("metaq:results-updated", (e) => {
    results = e.detail.results || [];
    dataReady = true;
    renderResults();
    refreshAllGroupUI();
  });
  window.addEventListener("metaq:groups-updated", (e) => {
    groups = e.detail.groups || [];
    sortGroupsInPlace();
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

  function parseFlexibleDate(str) {
    str = normalizeNumericString(str);
    if (!str) return null;

    // パターンA: 区切りあり 1990/06/24, 1990-6-24, 1990.6.24, 1990年6月24日, スペース区切りも許容
    // 数字の間に空白が混じっていても(例: "1990 / 0 6 / 24")対応するため、まず区切り文字以外の空白を除去
    let compact = str.replace(/(\d)\s+(?=\d)/g, "$1"); // 数字と数字の間の単独スペースを除去(2 -> 02のような分割対策)
    compact = compact.replace(/\s+/g, ""); // 残りの空白も除去

    let m = compact.match(/^(\d{4})[\/\-\.年](\d{1,2})[\/\-\.月](\d{1,2})日?$/);
    if (m) return { y: +m[1], m: +m[2], d: +m[3] };

    // パターンB: 区切りなし 8桁 (19900624) または 6桁(YYMMDD想定はせず、YYYYMMDDのみ厳格対応)
    m = compact.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (m) {
      const mm = +m[2], dd = +m[3];
      if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) return { y: +m[1], m: mm, d: dd };
    }

    return null;
  }

  function parseFlexibleTime(str) {
    str = normalizeNumericString(str);
    if (!str) return null;

    let compact = str.replace(/(\d)\s+(?=\d)/g, "$1").replace(/\s+/g, "");

    let m = compact.match(/^(\d{1,2})[:時](\d{1,2})分?$/);
    if (m) return { h: +m[1], mi: +m[2] };

    // 区切りなし4桁 (2256 -> 22:56)
    m = compact.match(/^(\d{2})(\d{2})$/);
    if (m) {
      const hh = +m[1], mm = +m[2];
      if (hh <= 23 && mm <= 59) return { h: hh, mi: mm };
    }

    // 時のみ
    m = compact.match(/^(\d{1,2})$/);
    if (m) return { h: +m[1], mi: 0 };

    return null;
  }

  // 入力欄からフォーカスが外れた時に、解析できた値を統一表記(YYYY/MM/DD, HH:MM)に整形して表示する
  function formatDateForDisplay(parsed) {
    return `${parsed.y}/${String(parsed.m).padStart(2,"0")}/${String(parsed.d).padStart(2,"0")}`;
  }
  function formatTimeForDisplay(parsed) {
    return `${String(parsed.h).padStart(2,"0")}:${String(parsed.mi).padStart(2,"0")}`;
  }

  async function addResult(name, y, m, d, h, mi, groupIds, note, sei, mei) {
    const calc = calcFourPillars(y, m, d, h, mi);
    const gids = Array.isArray(groupIds) ? groupIds.filter(Boolean) : (groupIds ? [groupIds] : []);
    const entry = {
      id: "r_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      name: name || "（名前未入力）",
      sei: sei || "",
      mei: mei || "",
      note: note || "",
      birthDate: `${y}/${String(m).padStart(2,"0")}/${String(d).padStart(2,"0")}`,
      birthTime: (h !== null && h !== undefined) ? `${String(h).padStart(2,"0")}:${String(mi||0).padStart(2,"0")}` : "",
      groupIds: gids,
      calc
    };
    const fs = getFS();
    if (fs) {
      try { await fs.saveResult(entry); } catch (e) { console.error(e); showToast("保存に失敗しました"); }
    }
    // Firestoreのリアルタイム購読が結果を反映するまでの一瞬のラグを埋めるため、
    // 画面には即時反映しておく(購読イベントが届くと正しい状態に上書きされる)
    results = [entry, ...results];
    renderResults();
    scheduleSheetSync();
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

  async function setResultGroups(id, groupIds) {
    const r = results.find(r => r.id === id);
    if (!r) return;
    const updated = { ...r, groupIds: (groupIds || []).filter(Boolean) };
    delete updated.groupId;
    const fs = getFS();
    if (fs) {
      try { await fs.saveResult(updated); } catch (e) { console.error(e); showToast("更新に失敗しました"); return; }
    }
    results = results.map(x => x.id === id ? updated : x);
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
          <span class="swatch" style="background:${g.color}"></span>${escapeHtml(g.name)}</label>`
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
      ? gObjs.map(g => `<span class="rc-group"><span class="swatch" style="background:${g.color}"></span>${escapeHtml(g.name)}</span>`).join("")
      : `<span class="rc-group" style="color:#cfc3d6;">未設定</span>`;

    // 性・名・備考があればその順で組み立てる。性/名が無ければ従来のnameを使う(後方互換)
    const displayNameParts = (entry.sei || entry.mei)
      ? [entry.sei, entry.mei, entry.note].filter(s => s)
      : [entry.name, entry.note].filter(s => s);
    const displayName = displayNameParts.join("　");

    // 小さな柱チップ(本質/表面/意思/時柱)。動物名だけをグループ色で。
    const pill = (label, p) => p
      ? `<span class="rc-pill ${p.group}"><span class="lbl">${label}</span>${escapeHtml(p.animal)}</span>`
      : `<span class="rc-pill empty"><span class="lbl">${label}</span>—</span>`;

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
        <span class="rc-gz">${c.bunrui60_gz} ${c.bunrui60_kanGroup}</span>
        <span class="rc-chara">${escapeHtml(c.bunrui60_charaName)}</span>
      </div>
      <div class="rc-badges">
        <span class="rc-rail">レール ${escapeHtml(c.rail.rail)}</span>
        <span class="rc-fuku">福の神 ${c.fukuNoKami.label}</span>
      </div>
      <div class="rc-pillars">
        ${pill("本質", c.honshitsu)}
        ${pill("表面", c.hyomen)}
        ${pill("意思", c.ishi)}
        ${pill("時柱", c.jichu)}
      </div>
    </div>`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
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
    let filtered = results;
    if (filterVal === "none") filtered = results.filter(r => resultGroupIds(r).length === 0);
    else if (filterVal !== "all") filtered = results.filter(r => resultGroupIds(r).includes(filterVal));

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
        <p>このグループには診断結果がありません。</p>
      </div>`;
      return;
    }
    list.innerHTML = filtered.map(renderResultCard).join("");
    list.querySelectorAll(".del-btn").forEach(btn => {
      btn.addEventListener("click", () => deleteResult(btn.dataset.id));
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
    if (valid.length === 0) { showToast("登録できる行がありません"); return; }

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

    for (const r of valid) {
      await addResult(r.name, r.y, r.m, r.d, r.h, r.mi, nameToId[r.groupName] || null);
    }
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
    results.forEach(r => {
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
  function resultRowColors(r, base) {
    const c = r.calc;
    const bg = Array(RESULT_HEADERS.length).fill(base);
    const g = getGroupById(resultGroupIds(r)[0]);
    if (g) bg[3] = g.color;                                   // グループ名(複数時は先頭の色)
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
      const values = [RESULT_HEADERS.slice()];
      const backgrounds = [RESULT_HEADERS.map(() => tabColor || "#d9b3ff")];
      const fontWeights = [RESULT_HEADERS.map(() => "bold")];
      members.forEach((r, i) => {
        values.push(resultToRow(r));
        backgrounds.push(resultRowColors(r, stripe(i)));
        fontWeights.push(RESULT_HEADERS.map(() => "normal"));
      });
      return {
        name: uniqueName(sanitizeSheetName(name)),
        tabColor: tabColor || null,
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
    return { token: SHEET_SYNC_TOKEN, sheets };
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
      setSheetSyncStatus(`✓ スプレッドシートに同期済み（${t.getHours()}:${String(t.getMinutes()).padStart(2, "0")}）`);
      if (manual) showToast("スプレッドシートに同期しました");
    } catch (e) {
      console.error("sheet sync failed:", e);
      setSheetSyncStatus("⚠️ 同期に失敗しました。URLとデプロイ設定(アクセス:全員)を確認してください。");
      if (manual) showToast("スプレッドシートへの同期に失敗しました");
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
        <span class="swatch" style="background:${g.color}"></span>${escapeHtml(g.name)}
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
    list.innerHTML = groups.map((g, idx) => {
      const count = results.filter(r => resultGroupIds(r).includes(g.id)).length;
      if (g.id === editingGroupId) {
        const swatches = GROUP_COLOR_PALETTE.map(c =>
          `<button class="swatch-btn ${c === g.color ? "selected" : ""}" data-color="${c}" style="background:${c}" title="${c}"></button>`
        ).join("");
        return `
        <div class="group-item editing">
          <div style="flex:1; display:flex; flex-direction:column; gap:10px;">
            <input type="text" class="gedit-name" value="${escapeHtml(g.name)}" placeholder="グループ名">
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
        <span class="swatch" style="background:${g.color}"></span>
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
  ];

  let libraryRendered = false;

  function updateAdminUI(email) {
    const isAdmin = (email || "").toLowerCase() === ADMIN_EMAIL;
    const tabBtn = document.getElementById("tab-library");
    if (tabBtn) tabBtn.style.display = isAdmin ? "" : "none";
    if (isAdmin && !libraryRendered) { renderLibraryGenreSelect(); renderLibrary(); libraryRendered = true; }
  }

  window.addEventListener("metaq:auth-ready", (e) => {
    updateAdminUI(e.detail && e.detail.email);
  });

  // "YYYY/MM/DD" 形式のときだけ {y,m,d} を返す(年のみ・紀元前などは診断しない)
  function libDateParts(dateStr) {
    const m = /^(\d{3,4})\/(\d{1,2})\/(\d{1,2})$/.exec((dateStr || "").trim());
    return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
  }

  function libraryCardHtml(name, dateStr, desc, c) {
    const diag = c ? `
      <div class="classify-strip">
        <div class="row-top">
          <span class="num">No.${String(c.bunrui60).padStart(2, "0")}</span>
          <span class="gz">${c.bunrui60_gz}　${c.bunrui60_kanGroup}</span>
        </div>
        <div class="chara-name">${escapeHtml(c.bunrui60_charaName)}</div>
        <div class="fuku-badge">福の神No. <span class="fuku-num">${c.fukuNoKami.label}</span></div>
        <div class="rail-badge">レール <span class="rail-num">${escapeHtml(c.rail.rail)}</span><span class="rail-sub">（${escapeHtml(c.rail.tsuhensei)}）</span></div>
      </div>
      <div class="pillars">
        ${pillarBoxHtml("本質", c.honshitsu)}
        ${pillarBoxHtml("表面", c.hyomen)}
        ${pillarBoxHtml("意思", c.ishi)}
      </div>`
      : `<div class="hint" style="padding:2px 18px 14px;">※生年月日が確定していないため、診断は省略しています。</div>`;
    return `
    <div class="result-card">
      <div class="result-head">
        <div>
          <div class="name">${escapeHtml(name)}</div>
          <div class="birth">${escapeHtml(dateStr || "生没年不詳")}</div>
        </div>
      </div>
      <div class="lib-desc">${escapeHtml(desc || "")}</div>
      ${diag}
    </div>`;
  }

  function renderLibrary() {
    const container = document.getElementById("library-content");
    if (!container) return;
    const term = (document.getElementById("library-search")?.value || "").trim().toLowerCase();
    const matched = LIBRARY_PEOPLE.filter(p =>
      !term || p.name.toLowerCase().includes(term) || (p.desc || "").toLowerCase().includes(term));

    let html = `<div class="hint" style="margin-bottom:14px;">
      ${matched.length}名を表示中${term ? `（「${escapeHtml(term)}」で検索）` : "（有名人・スポーツ選手・偉人／生年月日は公開情報に基づきます）"}
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
  // イベント登録
  // ===================================================================

  document.addEventListener("DOMContentLoaded", () => {
    renderResults();
    refreshAllGroupUI();

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
      if (date.m < 1 || date.m > 12 || date.d < 1 || date.d > 31) { showToast("日付の値が正しくありません"); return; }
      if (selectedSingleGroupIds.length === 0) { showToast("グループを1つ以上選択してください"); return; }

      const time = parseFlexibleTime(timeVal);
      const h = time ? time.h : null;
      const mi = time ? time.mi : null;

      await addResult(name, date.y, date.m, date.d, h, mi, selectedSingleGroupIds);
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
      for (const r of validRows) {
        await addResult(r.name, r.y, r.m, r.d, r.h, r.mi, selectedBulkGroupId, r.note, r.sei, r.mei);
      }
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
      try {
        await confirmGroupBulkImport(lastGroupBulkRows);
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
      document.getElementById("gbulk-textarea").value = "";
      document.getElementById("gbulk-preview").innerHTML = "";
      btn.style.display = "none";
      switchTab("results");
      showToast(`${valid.length}件をグループ分け登録しました`);
    });

    // 診断結果 - グループフィルター
    document.getElementById("results-group-filter").addEventListener("change", renderResults);

    // CSV出力・全削除
    document.getElementById("export-csv-btn").addEventListener("click", exportCsv);
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
