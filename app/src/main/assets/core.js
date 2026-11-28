// Sog'lom Hayot — hisob-kitob yadrosi: taomlar bazasi, matnni tushunish, kaloriya va me'yor.
// Brauzersiz ham (Node) sinash mumkin.

const FOODS = {};
let FOOD_LIST = [];
let CUSTOM = [];
let SYN_INDEX = [];

function loadFoods() {
  FOOD_LIST = [];
  for (const k in FOODS) delete FOODS[k];
  FOOD_DATA.trim().split('\n').forEach(line => {
    line = line.trim();
    if (!line) return;
    const [id, cat, nut, uz, ru, en, syn, units, flags = ''] = line.split('|');
    const [kcal, p, f, c] = nut.split(',').map(Number);
    const portions = {};
    let def = null;
    units.split(',').forEach(u => {
      const [k, g] = u.split(':');
      portions[k] = +g;
      if (!def) def = k;
    });
    const food = { id, cat, kcal, p, f, c, name: { uz, ru, en }, syn: syn.split(','), portions, def,
      healthy: flags.includes('h'), water: flags.includes('w') };
    FOODS[id] = food;
    FOOD_LIST.push(food);
  });
  CUSTOM.forEach(cf => {
    const food = { id: cf.id, cat: 'custom', kcal: cf.kcal, p: cf.p || 0, f: cf.f || 0, c: cf.c || 0,
      name: { uz: cf.name, ru: cf.name, en: cf.name }, syn: [cf.name], portions: { porsiya: cf.g || 100 },
      def: 'porsiya', healthy: false, water: false, custom: true };
    FOODS[food.id] = food;
    FOOD_LIST.push(food);
  });
  buildIndex();
}

// ---------- Matnni normallashtirish ----------
const CYR = { 'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'j','з':'z','и':'i','й':'y','к':'k','л':'l',
  'м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'x','ц':'ts','ч':'ch','ш':'sh','щ':'sh',
  'ъ':"'",'ы':'i','ь':'','э':'e','ю':'yu','я':'ya','ў':"o'",'қ':'q','ғ':"g'",'ҳ':'h' };

function translit(s) {
  let out = '';
  for (const ch of String(s).toLowerCase()) out += (CYR[ch] !== undefined ? CYR[ch] : ch);
  return out;
}
function rawNorm(s) { return translit(s).replace(/[ʻʼ’‘`´']/g, "'"); }
// Solishtirish kaliti: tutuq belgisisiz, h→x, q→k (sh, ch saqlanadi)
function key(w) {
  return w.replace(/'/g, '').replace(/sh/g, '§').replace(/ch/g, '¤').replace(/h/g, 'x').replace(/q/g, 'k')
    .replace(/§/g, 'sh').replace(/¤/g, 'ch');
}

// Matnni so'zlarga bo'lish. Har bir so'z uchun: o — asl yozilishi, raw — lotinchaga o'girilgan, k — solishtirish kaliti.
function tokenize(text) {
  let s = String(text).toLowerCase().replace(/[ʻʼ’‘`´']/g, "'")
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/(\d)([^\d\s.,'])/gu, '$1 $2')
    .replace(/([^\d\s.,])(\d)/gu, '$1 $2')
    .replace(/[+,;:!?()\n\r\/"«»]/g, ' , ')
    .replace(/\s[-–—]\s/g, ' , ')
    .replace(/([^\d\s])-(?=[^\d\s])/gu, '$1 ')
    .replace(/\.(\s|$)/g, ' , ');
  const out = [];
  s.split(/\s+/).filter(Boolean).forEach(w => {
    if (w === ',') { out.push({ raw: ',', k: ',', o: ',' }); return; }
    const o = w.replace(/^['-]+|['-]+$/g, '');
    const raw = rawNorm(o).replace(/^['-]+|['-]+$/g, '');
    const k = key(raw).replace(/[^a-z0-9.\-]/g, '');
    if (k === '' || k === '-') return;
    // "polkosy", "poltarelki", "пол-лепёшки" → "pol" + qolgan qism
    const pm = k.match(/^pol-?(.{3,})$/);
    if (pm && !/^(ovin|ozi|uch|ezn|ny|tor|dnik|sk|ent|ez)/.test(pm[1]) && (UNIT_RE.some(([, re]) => re.test(pm[1])) || /^(lepesh|tarel|kos|stakan|pial|ports|bank|butil|kusk|shampur)/.test(pm[1]))) {
      out.push({ raw: 'pol', k: 'pol', o: o });
      out.push({ raw: pm[1], k: pm[1], o: '' });
      return;
    }
    out.push({ raw, k, o });
  });
  return out;
}

function buildIndex() {
  SYN_INDEX = [];
  FOOD_LIST.forEach(f => {
    const set = new Set(f.syn);
    Object.values(f.name).forEach(n => {
      set.add(n);
      const base = n.split('(')[0];
      set.add(base);
      base.split('/').forEach(p => set.add(p));
    });
    set.forEach(s => {
      const w = tokenize(s).map(t => t.k).filter(x => x !== ',');
      if (w.length) SYN_INDEX.push({ w, food: f, len: w.join('').length });
    });
  });
}

function lev(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 9;
  const d = [];
  for (let i = 0; i <= a.length; i++) { d[i] = [i]; }
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1));
  return d[a.length][b.length];
}

// 3 — aniq, 2 — so'z to'liq + qo'shimcha ("лимон"+"ом"), 1 — o'zakdan/yaqin, 0 — mos emas
function wmatch(sw, t) {
  if (sw === t) return 3;
  if (/^\d/.test(sw) || /^\d/.test(t)) return 0;
  if (sw.length >= 4 && t.startsWith(sw) && t.length <= sw.length + 3) return 2;
  if (sw.length >= 4) {
    const st = sw.slice(0, sw.length > 5 ? sw.length - 2 : sw.length - 1);
    if (t.startsWith(st) && t.length <= sw.length + 3) return 1;
  }
  if (sw.length >= 5 && t.length >= 5 && lev(sw, t) <= 1) return 1;
  return 0;
}

function matchFood(toks, i, minWords, maxWords = 9) {
  let best = null;
  const all = [];
  for (const s of SYN_INDEX) {
    const n = s.w.length;
    if (n < minWords || n > maxWords || i + n > toks.length) continue;
    let exact = true, full = true, ok = true;
    for (let j = 0; j < n; j++) {
      const tk = toks[i + j].k;
      if (tk === ',') { ok = false; break; }
      const r = wmatch(s.w[j], tk);
      if (!r) { ok = false; break; }
      if (r < 3) exact = false;
      if (r < 2) full = false;
    }
    if (!ok) continue;
    const sc = n * 100 + (exact ? 50 : full ? 25 : 0) + s.len;
    all.push({ sc, food: s.food, len: n, exact });
    if (!best || sc > best.sc) best = { sc, food: s.food, len: n, exact };
  }
  if (best) {
    // Boshqa ehtimoliy taomlar ("Siz buni nazarda tutdingizmi?")
    const seen = new Set([best.food.id]);
    best.alts = [];
    all.sort((a, b) => b.sc - a.sc).forEach(c => {
      if (seen.has(c.food.id) || c.len !== best.len) return;
      if (c.sc < best.sc - (best.exact ? 0 : 40)) return;
      seen.add(c.food.id);
      if (best.alts.length < 3) best.alts.push(c.food);
    });
  }
  return best;
}

// ---------- Sonlar va o'lchovlar ----------
const NUMS = {
  'bir':1,'bitta':1,'odin':1,'odna':1,'odnu':1,'one':1,
  'ikki':2,'ikkita':2,'dva':2,'dve':2,'two':2,
  'uch':3,'uchta':3,'tri':3,'three':3,
  "to'rt":4,"to'rtta":4,'chetire':4,'chetyre':4,'four':4,
  'besh':5,'beshta':5,'pyat':5,'five':5,
  'olti':6,'oltita':6,'shest':6,
  'yetti':7,'yettita':7,'sem':7,'seven':7,
  'sakkiz':8,'sakkizta':8,'vosem':8,'eight':8,
  "to'qqiz":9,"to'qqizta":9,'devyat':9,'nine':9,
  "o'n":10,"o'nta":10,'desyat':10,'ten':10,
  'yarim':0.5,'yarimta':0.5,'pol':0.5,'polovina':0.5,'polovinu':0.5,'polovinka':0.5,'polovinku':0.5,'half':0.5,
  'poltora':1.5,'poltori':1.5,
};

function numberAt(toks, i) {
  const t = toks[i];
  if (/^\d+(\.\d+)?$/.test(t.k)) {
    let v = parseFloat(t.k), len = 1;
    if (toks[i+1] && (toks[i+1].raw === 'yarim' || toks[i+1].k === 's' && toks[i+2] && toks[i+2].k.startsWith('polovin'))) {
      v += 0.5; len += toks[i+1].raw === 'yarim' ? 1 : 2;
    }
    return { v, len, dona: false };
  }
  const r = t.raw;
  if (NUMS[r] !== undefined) {
    let v = NUMS[r], len = 1;
    if (v >= 1 && toks[i+1] && toks[i+1].raw === 'yarim') { v += 0.5; len = 2; }
    return { v, len, dona: /ta$/.test(r) && r !== 'poltora' };
  }
  return null;
}

const UNIT_RE = [
  ['kg', /^(kg|kilo\w*)$/, 1000],
  ['g', /^(g|gr|gramm?\w*)$/, 1],
  ['ml', /^(ml|millilitr\w*)$/, 1],
  ['l', /^(l|litr\w*|liter\w*|litre\w*)$/, 1000],
  ['dona', /^(ta|dona\w*|sht\w*|piece\w*|pcs)$/, 1],
  ['tarelka', /^(tarel\w*|likopch\w*|plate\w*)$/, 1],
  ['lagan', /^(lagan\w*)$/, 1],
  ['kosa', /^(kosa\w*|kosushk\w*|bowl\w*|misk\w*|chashk\w*)$/, 1],
  ['piyola', /^(piyol\w*|pial\w*|cup\w*|krujk\w*|kruzhk\w*)$/, 1],
  ['stakan', /^(stakan\w*|glass\w*)$/, 1],
  ['oshqoshiq', /^(tbsp)$/, 1],
  ['qoshiq', /^(koshik\w*|lojk\w*|lojech\w*|spoon\w*)$/, 1],
  ['choyqoshiq', /^(tsp)$/, 1],
  ['bolak', /^(bolak\w*|kus\w*|slice\w*|lomt\w*|tilim\w*|piece)$/, 1],
  ['six', /^(sikh|shampur\w*|skewer\w*|six|palk\w*|paloch\w*|tayoqch\w*)$/, 1],
  ['hovuch', /^(xovuch\w*|gorst\w*|handful\w*)$/, 1],
  ['porsiya', /^(porsi\w*|portsi\w*|porci\w*|portion\w*|serving\w*)$/, 1],
  ['paket', /^(paket\w*|pachk\w*|pack\w*|sachet\w*)$/, 1],
  ['butilka', /^(butil\w*|bottle\w*|shisha\w*)$/, 1],
  ['banka', /^(bank\w*|can|cans)$/, 1],
];

function unitAt(toks, i) {
  const a = toks[i].k, b = toks[i+1] ? toks[i+1].k : '';
  const spoon = /^(koshik\w*|lojk\w*|lojech\w*|spoon\w*)$/;
  if ((a === 'osh' || a.startsWith('stolov') || a === 'table') && spoon.test(b)) return { unit: 'oshqoshiq', mul: 1, len: 2 };
  if ((a === 'choy' || a.startsWith('chayn') || a === 'tea') && spoon.test(b)) return { unit: 'choyqoshiq', mul: 1, len: 2 };
  for (const [u, re, mul] of UNIT_RE) if (re.test(a)) return { unit: u, mul, len: 1 };
  return null;
}

const SEP = new Set(([',', 'va', 'bilan', 'ham', 'yoki', 'i', 's', 'so', 'and', 'with', 'plus', 'keyin', 'potom', 'then', 'or', 'ili']).map(key));
const STOP = new Set(['ozbek','ozbekcha','uzbekskiy','uzbekskaya','uzbekskogo','uzbek','narsa','narsam','yedim','yedik','yegan','yeyman','ichdim','ichdik','men','biz','bugun','kecha','ertalab','kechqurun',
  'tushlik','tushlikka','tushlikda','nonushta','nonushtaga','nonushtada','kechki','ovkat','ovkatga','ovkatlandim','uchun','edi',
  'tamaddi','ozgina','kup','kop','juda','katta','kichik','dan','da','ga','ni','birga',
  'na','obed','obeda','zavtrak','zavtraka','ujin','ujina','poel','poela','poeli','sel','sela','seli','vipil','vipila','ya','mi',
  'kakoy','kakoe','kakaya','kakie','to','eshe','eshyo','toje','tozhe','eto','bilo','byl','byla','esli','mnogo','malo','primerno','okolo','gde','tam','qandaydir','biroz','taxminan','some','about','around','segodnya','utrom','vecherom','dnem','perekus','perekusa','perekusil','perekusila','obedal','obedala','pouzhinal','uzhinal','zavtrakal','zavtrakala','poobedal','pozavtrakal','eshe','tolko','chut','nemnogo','bolshoy','bolshaya','malenkiy','kusochek',
  'ate','eat','had','drank','drink','for','lunch','breakfast','dinner','snack','some','a','an','the','of','my','i'].map(key));

// Matndan taomlar ro'yxatini ajratib oladi
function parseMeal(text) {
  const toks = tokenize(text);
  const items = [], unknown = [];
  let pq = null, pu = null, pmul = 1, last = null, ps = null;
  const push = (m, i) => {
    const it = { food: m.food, q: pq, u: pu, mul: pmul, s: ps === null ? i : ps, e: i + m.len, alts: m.alts || [] };
    items.push(it);
    last = it; pq = null; pu = null; pmul = 1; ps = null;
    return i + m.len;
  };
  // Keyingi taomning o'z miqdori bormi ("norin 300g bulochka 200g")
  const nextHasQty = j => {
    const u = toks[j] ? unitAt(toks, j) : null;
    if (u) j += u.len;
    if (j >= toks.length || toks[j].k === ',') return false;
    const m = matchFood(toks, j, 1);
    if (!m) return false;
    const k = j + m.len;
    return k < toks.length && !!numberAt(toks, k);
  };
  const foodAhead = j => {
    const u = toks[j] ? unitAt(toks, j) : null;
    if (u) j += u.len;
    return j < toks.length && toks[j].k !== ',' && !!matchFood(toks, j, 1);
  };
  // Yozish uslubi: "osh 300g" (avval taom) yoki "300g osh" (avval miqdor)
  let foodFirst = false;
  for (let j = 0; j < toks.length; j++) {
    if (SEP.has(toks[j].k) || STOP.has(toks[j].k)) continue;
    if (numberAt(toks, j) || unitAt(toks, j)) break;
    if (matchFood(toks, j, 1)) { foodFirst = true; break; }
  }
  for (let i = 0; i < toks.length;) {
    const tk = toks[i];
    if (SEP.has(tk.k)) { last = null; i++; continue; }
    let m = matchFood(toks, i, 2);
    if (m) { i = push(m, i); continue; }
    if (tk.k === 'six' && pq === null && !(i > 0 && numberAt(toks, i - 1)) && toks[i+1] && matchFood(toks, i + 1, 1)) {
      pq = 6; if (ps === null) ps = i; i++; continue;
    }
    const n = numberAt(toks, i);
    if (n) {
      const trailing = last && last.q === null && pq === null && (!foodAhead(i + n.len) || (foodFirst && nextHasQty(i + n.len)));
      if (trailing) { last.q = n.v; if (n.dona && !last.u) last.u = 'dona'; last.e = i + n.len; }
      else { pq = n.v; if (n.dona) pu = 'dona'; if (ps === null) ps = i; }
      i += n.len; continue;
    }
    const u = unitAt(toks, i);
    if (u) {
      if (last && last.u === null && pq === null && pu === null && (!foodAhead(i + u.len) || (foodFirst && nextHasQty(i + u.len)))) { last.u = u.unit; last.mul = u.mul; last.e = i + u.len; }
      else { pu = u.unit; pmul = u.mul; if (ps === null) ps = i; }
      i += u.len; continue;
    }
    if (STOP.has(tk.k)) { i++; continue; }
    m = matchFood(toks, i, 1, 1);
    if (m) { i = push(m, i); continue; }
    if (tk.k.length >= 3 && !/^\d/.test(tk.k)) unknown.push(tk.o || tk.raw);
    i++;
  }
  const srcOf = it => toks.slice(it.s, it.e).map(t => t.o).filter(Boolean).join(' ');
  return {
    items: items.map(it => Object.assign(resolve(it), { src: srcOf(it), alts: it.alts })),
    unknown,
  };
}

const GENERIC = { tarelka: 350, lagan: 350, kosa: 400, piyola: 200, stakan: 250, oshqoshiq: 15, choyqoshiq: 5,
  bolak: 50, six: 90, hovuch: 30, paket: 50, butilka: 500, banka: 330 };
const SIMILAR = { tarelka: ['lagan', 'kosa', 'porsiya'], lagan: ['tarelka', 'kosa'], kosa: ['tarelka', 'piyola'],
  piyola: ['stakan', 'kosa'], stakan: ['piyola', 'butilka'], six: ['porsiya', 'bolak'], bolak: ['dona', 'porsiya'],
  dona: ['bolak', 'porsiya', 'six', 'paket', 'banka'] };

// {food, q, u, mul} → {food, qty, unit, grams}
function resolve(it) {
  const f = it.food;
  let q = it.q == null ? 1 : it.q;
  let u = it.u;
  if (u === 'kg' || u === 'g' || u === 'ml' || u === 'l') return { food: f, qty: Math.round(q * it.mul), unit: 'g' };
  if (!u && q < 1 && f.portions.dona) u = 'dona';
  if (!u || u === 'porsiya') u = f.portions.porsiya ? 'porsiya' : f.def;
  if (u === 'qoshiq') {
    // "qoshiq/ложка": shakar, asal uchun choy qoshiq, qolganlar uchun osh qoshiq
    u = f.portions.choyqoshiq ? 'choyqoshiq' : 'oshqoshiq';
    if (!f.portions[u]) return { food: f, qty: Math.round(q * 15), unit: 'g' };
  }
  if (!f.portions[u]) {
    const alt = (SIMILAR[u] || []).find(x => f.portions[x]);
    if (alt && (u !== 'dona' || alt !== 'porsiya' || f.def === 'porsiya')) u = alt;
    else if (u === 'dona') u = f.def;
    else if (GENERIC[u]) return { food: f, qty: Math.round(q * GENERIC[u]), unit: 'g' };
    else u = f.def;
  }
  return { food: f, qty: q, unit: u };
}

function gramsOf(food, qty, unit) {
  if (unit === 'g') return qty;
  return qty * (food.portions[unit] || GENERIC[unit] || 100);
}

function nutr(food, grams) {
  const k = grams / 100;
  return { g: Math.round(grams), kcal: Math.round(food.kcal * k), p: +(food.p * k).toFixed(1),
    f: +(food.f * k).toFixed(1), c: +(food.c * k).toFixed(1) };
}

// ---------- Me'yor ----------
const JOB = { sit: 1.2, stand: 1.3, heavy: 1.45 };
const GOAL_ADJ = { lose: -500, slow: -250, keep: 0, gain: 300 };

function bmrOf(p) {
  return Math.round(10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'f' ? -161 : 5));
}
function bmiOf(p) { return p.weight / Math.pow(p.height / 100, 2); }

function norms(p) {
  const bmr = bmrOf(p);
  const base = Math.round(bmr * (JOB[p.job] || 1.2));
  const bmi = bmiOf(p);
  let goal = p.goal;
  let underweight = false;
  if (bmi < 18.5 && (goal === 'lose' || goal === 'slow')) { goal = 'keep'; underweight = true; }
  const floor = p.sex === 'f' ? 1200 : 1500;
  const target = Math.max(base + GOAL_ADJ[goal], floor);
  const protPerKg = goal === 'keep' ? 1.2 : 1.6;
  const prot = Math.round(p.weight * protPerKg);
  const fat = Math.round(target * 0.28 / 9);
  const carb = Math.max(0, Math.round((target - prot * 4 - fat * 9) / 4));
  const water = Math.round(p.weight * 33 / 50) * 50;
  return { bmr, base, target, prot, fat, carb, water, bmi, goal, underweight };
}

// Qadamlar: 2000 qadamgacha kundalik harakat asosiy me'yorda hisoblangan
function stepStats(p, steps) {
  const stride = p.height * 0.414 / 100;
  const km = steps * stride / 1000;
  const extraKm = Math.max(0, steps - 2000) * stride / 1000;
  return { km, kcal: Math.round(extraKm * p.weight * 0.5) };
}

const WORKOUTS = { walk_slow: 3.0, walk_fast: 4.3, run: 8.3, run_fast: 11, cycle: 7.5, swim: 6, gym: 5, hiit: 8,
  football: 7, basketball: 6.5, volleyball: 4, wrestling: 6, boxing: 7.8, dance: 5, yoga: 2.5, stretch: 2.3,
  jumprope: 11, stairs: 8, housework: 3.3, garden: 4, heavywork: 6 };

function workoutKcal(type, minutes, weight) {
  return Math.round((WORKOUTS[type] - 1) * weight * minutes / 60);
}

// ---------- Ovqatlanish rejasi ----------
function makePlan(target, seed) {
  let s = seed || 1;
  const rnd = n => { s = (s * 9301 + 49297) % 233280; return Math.floor(s / 233280 * n); };
  const meals = {};
  let total = 0;
  for (const m of ['breakfast', 'lunch', 'snack', 'dinner']) {
    const opts = PLAN_TEMPLATES[m];
    meals[m] = opts[rnd(opts.length)].map(([id, g]) => ({ id, g }));
    meals[m].forEach(x => total += FOODS[x.id].kcal * x.g / 100);
  }
  const factor = Math.min(1.45, Math.max(0.6, target / total));
  let sum = 0;
  for (const m in meals) {
    meals[m] = meals[m].map(x => {
      const f = FOODS[x.id];
      const isDrink = f.cat === 'drink' && f.kcal < 5;
      let g = isDrink ? x.g : Math.max(10, Math.round(x.g * factor / 10) * 10);
      if (f.def === 'dona' && f.portions.dona >= 40 && !isDrink) {
        const n = Math.max(1, Math.round(g / f.portions.dona * 2) / 2);
        g = n * f.portions.dona;
      }
      const n = nutr(f, g);
      sum += n.kcal;
      return { id: x.id, g, ...n };
    });
  }
  return { meals, total: sum };
}

if (typeof module !== 'undefined') {
  module.exports = { loadFoods, parseMeal, FOODS, gramsOf, nutr, norms, stepStats, workoutKcal, makePlan, tokenize,
    setData: (d, p) => { global.FOOD_DATA = d; global.PLAN_TEMPLATES = p; } };
}
