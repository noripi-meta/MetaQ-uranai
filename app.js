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
    const g = { id: "g_" + Date.now() + "_" + Math.random().toString(36).slice(2,6), name, color };
    const fs = getFS();
    if (fs) {
      try { await fs.saveGroup(g); } catch (e) { console.error(e); showToast("グループの保存に失敗しました"); return null; }
    }
    return g;
  }

  async function deleteGroupById(groupId) {
    const fs = getFS();
    if (!fs) return;
    try {
      await fs.deleteGroup(groupId);
      // このグループに属していた人は「未分類」扱いにする(groupIdをnullへ)
      const affected = results.filter(r => r.groupId === groupId);
      for (const r of affected) {
        const updated = { ...r, groupId: null };
        await fs.saveResult(updated);
      }
    } catch (e) {
      console.error(e);
      showToast("グループの削除に失敗しました");
    }
  }

  function getGroupById(id) {
    return groups.find(g => g.id === id) || null;
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
    renderResults();
    refreshAllGroupUI();
  });

  function showToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2200);
  }

  function parseDateInput(dateStr) {
    // dateStr: "YYYY-MM-DD"
    const parts = dateStr.split("-");
    if (parts.length !== 3) return null;
    const y = parseInt(parts[0], 10), m = parseInt(parts[1], 10), d = parseInt(parts[2], 10);
    if (!y || !m || !d) return null;
    return { y, m, d };
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

  async function addResult(name, y, m, d, h, mi, groupId) {
    const calc = calcFourPillars(y, m, d, h, mi);
    const entry = {
      id: "r_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      name: name || "（名前未入力）",
      birthDate: `${y}/${String(m).padStart(2,"0")}/${String(d).padStart(2,"0")}`,
      birthTime: (h !== null && h !== undefined) ? `${String(h).padStart(2,"0")}:${String(mi||0).padStart(2,"0")}` : "",
      groupId: groupId || null,
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
  }

  async function deleteResult(id) {
    const fs = getFS();
    if (fs) {
      try { await fs.deleteResult(id); } catch (e) { console.error(e); showToast("削除に失敗しました"); return; }
    }
    results = results.filter(r => r.id !== id);
    renderResults();
  }

  async function setResultGroup(id, groupId) {
    const r = results.find(r => r.id === id);
    if (!r) return;
    const updated = { ...r, groupId: groupId || null };
    const fs = getFS();
    if (fs) {
      try { await fs.saveResult(updated); } catch (e) { console.error(e); showToast("更新に失敗しました"); return; }
    }
    results = results.map(x => x.id === id ? updated : x);
    renderResults();
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

  function renderResultCard(entry) {
    const c = entry.calc;
    const group = entry.groupId ? getGroupById(entry.groupId) : null;
    const groupBadge = group
      ? `<div class="name-group-badge"><span class="swatch" style="background:${group.color}"></span>${escapeHtml(group.name)}</div>`
      : `<div class="name-group-badge" style="color:#cfc3d6;">グループ未設定</div>`;

    const groupOptions = groups.map(g =>
      `<option value="${g.id}" ${entry.groupId === g.id ? "selected" : ""}>${escapeHtml(g.name)}</option>`
    ).join("");

    return `
    <div class="result-card">
      <div class="result-head">
        <div>
          <div class="name">${escapeHtml(entry.name)}</div>
          <div class="birth">${entry.birthDate}${entry.birthTime ? " " + entry.birthTime : ""}</div>
          ${groupBadge}
        </div>
        <button class="del-btn" data-id="${entry.id}" title="削除">×</button>
      </div>
      <div style="padding:0 18px 10px;">
        <select class="group-reassign" data-id="${entry.id}" style="width:100%; padding:8px 10px; border-radius:10px; border:1.5px solid #f0e3f6; background:#fdfaff; font-size:12px; color:var(--ink);">
          <option value="">グループ未設定にする</option>
          ${groupOptions}
        </select>
      </div>
      <div class="classify-strip">
        <div class="row-top">
          <span class="num">No.${String(c.bunrui60).padStart(2,"0")}</span>
          <span class="gz">${c.bunrui60_gz}　${c.bunrui60_kanGroup}</span>
          ${groupChipHtml(c.honshitsu.group)}
        </div>
        <div class="chara-name">${escapeHtml(c.bunrui60_charaName)}</div>
        <div class="fuku-badge">福の神No. <span class="fuku-num">${c.fukuNoKami.label}</span></div>
        <div class="rail-badge">レール <span class="rail-num">${escapeHtml(c.rail.rail)}</span><span class="rail-sub">（${escapeHtml(c.rail.tsuhensei)}）</span></div>
      </div>
      <div class="pillars">
        ${pillarBoxHtml("本質", c.honshitsu)}
        ${pillarBoxHtml("表面", c.hyomen)}
        ${pillarBoxHtml("意思", c.ishi)}
        ${pillarBoxHtml("時柱", c.jichu)}
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
    if (filterVal === "none") filtered = results.filter(r => !r.groupId);
    else if (filterVal !== "all") filtered = results.filter(r => r.groupId === filterVal);

    if (results.length === 0) {
      actions.style.display = "none";
      list.innerHTML = `<div class="empty-state">
        <div class="emoji">🌙</div>
        <p>まだ診断結果がありません。<br>「1人ずつ診断」または「まとめて登録」から<br>生年月日を入力してください。</p>
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
    list.querySelectorAll(".group-reassign").forEach(sel => {
      sel.addEventListener("change", () => setResultGroup(sel.dataset.id, sel.value));
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

      let sei, mei, dateStr, timeStr;
      if (parts.length >= 4) {
        // 新形式: 性, 名, 生年月日, 時間
        sei = (parts[0] || "").trim();
        mei = (parts[1] || "").trim();
        dateStr = (parts[2] || "").trim();
        timeStr = (parts[3] || "").trim();
      } else {
        // 旧形式(後方互換): 名前(1列), 生年月日, 時間
        sei = (parts[0] || "").trim();
        mei = "";
        dateStr = (parts[1] || "").trim();
        timeStr = (parts[2] || "").trim();
      }
      const name = [sei, mei].filter(s => s).join(" ");

      const date = parseFlexibleDate(dateStr);
      const time = parseFlexibleTime(timeStr);

      let error = null;
      if (!date) error = "生年月日の形式が読み取れません";
      else if (date.m < 1 || date.m > 12 || date.d < 1 || date.d > 31) error = "日付の値が不正です";

      rows.push({
        lineNo: i + 1, name, sei, mei, dateStr, timeStr,
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
      <th>#</th><th>性</th><th>名</th><th>生年月日</th><th>時刻</th><th>状態</th>
    </tr></thead><tbody>`;
    rows.forEach(r => {
      const rowClass = r.error ? "err-row" : "";
      html += `<tr class="${rowClass}">
        <td>${r.lineNo}</td>
        <td>${escapeHtml(r.sei || "—")}</td>
        <td>${escapeHtml(r.mei || "—")}</td>
        <td>${escapeHtml(r.dateStr || "—")}</td>
        <td>${escapeHtml(r.timeStr || "—")}</td>
        <td>${r.error ? "⚠️ " + r.error : "✓ OK"}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
  }

  // ---------- CSV出力 ----------
  function exportCsv() {
    if (results.length === 0) { showToast("診断結果がありません"); return; }
    const headers = ["名前","グループ名","生年月日","時刻","レール","レール(本当の呼び方)","福の神No","福の神No(1つめ)","福の神No(2つめ)","福の神No(3つめ)","60分類No","60分類干支","干グループ","60分類キャラクター名","本質グループ","本質(動物)","本質(十二運)","表面グループ","表面(動物)","表面(十二運)","意思グループ","意思(動物)","意思(十二運)","時柱(動物)","時柱(十二運)"];
    const lines = [headers.join(",")];
    results.forEach(r => {
      const c = r.calc;
      const g = r.groupId ? getGroupById(r.groupId) : null;
      const row = [
        r.name, g ? g.name : "（未設定）", r.birthDate, r.birthTime,
        c.rail.rail, c.rail.tsuhensei,
        c.fukuNoKami.label, c.fukuNoKami.n1, c.fukuNoKami.n2, c.fukuNoKami.n3,
        c.bunrui60, c.bunrui60_gz, c.bunrui60_kanGroup, c.bunrui60_charaName,
        GROUP_LABEL[c.honshitsu.group], c.honshitsu.animal, c.honshitsu.juniun,
        GROUP_LABEL[c.hyomen.group], c.hyomen.animal, c.hyomen.juniun,
        GROUP_LABEL[c.ishi.group], c.ishi.animal, c.ishi.juniun,
        c.jichu ? c.jichu.animal : "", c.jichu ? c.jichu.juniun : ""
      ].map(v => `"${String(v).replace(/"/g,'""')}"`);
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
  // グループ管理 UI
  // ===================================================================

  function renderGroupSelectChips(containerId, selectedGroupId, onSelect) {
    const container = document.getElementById(containerId);
    if (groups.length === 0) {
      container.innerHTML = `<div class="hint" style="color:#e0648a;">グループがまだありません。「グループ管理」タブから作成してください。</div>`;
      return;
    }
    container.innerHTML = groups.map(g => `
      <div class="chip ${g.id === selectedGroupId ? "selected" : ""}" data-group-id="${g.id}">
        <span class="swatch" style="background:${g.color}"></span>${escapeHtml(g.name)}
      </div>
    `).join("");
    container.querySelectorAll(".chip").forEach(chip => {
      chip.addEventListener("click", () => {
        container.querySelectorAll(".chip").forEach(c => c.classList.remove("selected"));
        chip.classList.add("selected");
        onSelect(chip.dataset.groupId);
      });
    });
  }

  let selectedSingleGroupId = null;
  let selectedBulkGroupId = null;

  function refreshAllGroupUI() {
    renderGroupSelectChips("single-group-chips", selectedSingleGroupId, (id) => { selectedSingleGroupId = id; });
    renderGroupSelectChips("bulk-group-chips", selectedBulkGroupId, (id) => { selectedBulkGroupId = id; });
    renderGroupManageList();
    renderAggregateGroupSelect();
  }

  function renderGroupManageList() {
    const list = document.getElementById("group-list");
    if (groups.length === 0) {
      list.innerHTML = `<div class="empty-state" style="padding:30px 10px;">
        <div class="emoji">📂</div>
        <p>まだグループがありません。<br>上のフォームから作成してください。</p>
      </div>`;
      return;
    }
    list.innerHTML = groups.map(g => {
      const count = results.filter(r => r.groupId === g.id).length;
      return `
      <div class="group-item">
        <span class="swatch" style="background:${g.color}"></span>
        <span class="gname">${escapeHtml(g.name)}</span>
        <span class="gcount">${count}人</span>
        <button class="gdel-btn" data-gid="${g.id}" title="削除">×</button>
      </div>`;
    }).join("");
    list.querySelectorAll(".gdel-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const g = getGroupById(btn.dataset.gid);
        const count = results.filter(r => r.groupId === btn.dataset.gid).length;
        const msg = count > 0
          ? `「${g.name}」を削除します。このグループの${count}人は「未設定」になります。よろしいですか？`
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
    const members = results.filter(r => r.groupId === groupId);
    if (members.length === 0) {
      container.innerHTML = `<div class="empty-state">
        <div class="emoji">🌙</div>
        <p>このグループにはまだ診断結果がありません。</p>
      </div>`;
      return;
    }
    const honshitsuCounts = calcGroupCounts(members, "honshitsu");
    const hyomenCounts = calcGroupCounts(members, "hyomen");
    const ishiCounts = calcGroupCounts(members, "ishi");

    container.innerHTML = `
      <div class="agg-count">このグループ：${members.length}人で集計</div>
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
        <h2>🍀 福の神No. 集計</h2>
        <div class="hint" style="margin-bottom:14px;">1つめ・2つめ・3つめの数字ごとに、グループ内で多い番号を表示します</div>
        ${fukuRankingHtml("1つめの数字", "n1", members)}
        ${fukuRankingHtml("2つめの数字", "n2", members)}
        ${fukuRankingHtml("3つめの数字", "n3", members)}
      </div>
    `;
  }


  // ===================================================================
  // イベント登録
  // ===================================================================

  document.addEventListener("DOMContentLoaded", () => {
    renderResults();
    refreshAllGroupUI();

    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        switchTab(btn.dataset.tab);
        if (btn.dataset.tab === "groups") renderGroupManageList();
        if (btn.dataset.tab === "aggregate") renderAggregateGroupSelect();
        if (btn.dataset.tab === "results") renderResults();
      });
    });

    // 1人ずつ診断
    document.getElementById("single-submit").addEventListener("click", async () => {
      const name = document.getElementById("single-name").value.trim();
      const dateVal = document.getElementById("single-date").value;
      const timeVal = document.getElementById("single-time").value;

      const date = parseDateInput(dateVal);
      if (!date) { showToast("生年月日を入力してください"); return; }
      if (!selectedSingleGroupId) { showToast("グループを選択してください"); return; }

      let h = null, mi = null;
      if (timeVal) {
        const [hh, mm] = timeVal.split(":").map(Number);
        h = hh; mi = mm;
      }

      await addResult(name, date.y, date.m, date.d, h, mi, selectedSingleGroupId);
      document.getElementById("single-name").value = "";
      document.getElementById("single-date").value = "";
      document.getElementById("single-time").value = "";
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
        await addResult(r.name, r.y, r.m, r.d, r.h, r.mi, selectedBulkGroupId);
      }
      document.getElementById("bulk-textarea").value = "";
      document.getElementById("bulk-preview").innerHTML = "";
      document.getElementById("bulk-submit").style.display = "none";
      switchTab("results");
      showToast(`${validRows.length}件を一括登録しました`);
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
  });

})();
