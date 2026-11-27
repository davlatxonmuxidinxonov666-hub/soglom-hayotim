// Sog'lom Hayot — interfeys
const AND = window.Android || null;
const $ = s => document.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem('sh_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('sh_' + k, JSON.stringify(v)); } catch (e) {} },
};

let lang = store.get('lang', null);
let profile = store.get('profile', null);
let days = store.get('days', {});
let weights = store.get('weights', []);
let settings = Object.assign({ water: 0, stepGoal: 10000 }, store.get('settings', {}));
let planSeed = store.get('planSeed', 7);
CUSTOM = store.get('custom', []);
loadFoods();

let tab = 'home';
let curDate = todayStr();
let parsed = null;
let selMeal = defaultMeal();
let foodCat = 'all';
let foodQuery = '';
let stepsData = { today: 0, hist: {} };
let modalOpen = false;

const MEALS = ['breakfast', 'lunch', 'snack', 'dinner'];
const CATS = ['all', 'uz', 'non', 'meat', 'garnish', 'dairy', 'salad', 'fruit', 'nuts', 'sweet', 'drink', 'fast', 'other', 'custom'];

function t(k, ...a) {
  let s = (I18N[lang] && I18N[lang][k]) || I18N.uz[k] || k;
  a.forEach((v, i) => { s = s.split('{' + i + '}').join(v); });
  return s;
}
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function fmt(n) { return Math.round(n).toLocaleString('ru-RU').replace(/,/g, ' '); }
function pad(n) { return (n < 10 ? '0' : '') + n; }
function dstr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function todayStr() { return dstr(new Date()); }
function addDays(s, n) { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return dstr(d); }
function dateLabel(s) {
  const d = new Date(s + 'T12:00:00');
  const m = t('months').split(',')[d.getMonth()];
  if (s === todayStr()) return t('today');
  if (s === addDays(todayStr(), -1)) return t('yesterday');
  return lang === 'en' ? m + ' ' + d.getDate() : lang === 'uz' ? d.getDate() + '-' + m : d.getDate() + ' ' + m;
}
function dayShort(s) { return t('wd').split(',')[new Date(s + 'T12:00:00').getDay()]; }
function defaultMeal() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return 'breakfast';
  if (h >= 11 && h < 16) return 'lunch';
  if (h >= 18 && h < 24) return 'dinner';
  return 'snack';
}
function fname(f) { return f.name[lang] || f.name.uz; }
function unitName(u, q) { return t('u_' + u); }

function day(d) {
  if (!days[d]) days[d] = { food: [], water: 0, workouts: [], steps: 0 };
  const x = days[d];
  x.food = x.food || []; x.workouts = x.workouts || []; x.water = x.water || 0; x.steps = x.steps || 0;
  return x;
}
function save() { store.set('days', days); }

// ---------- Qadamlar ----------
function refreshSteps() {
  if (!AND) return;
  try { stepsData = JSON.parse(AND.steps()); } catch (e) {}
}
function stepsFor(d) {
  let s = 0;
  if (d === todayStr()) s = stepsData.today || 0;
  else if (stepsData.hist && stepsData.hist[d]) s = stepsData.hist[d];
  return s + (days[d] ? days[d].steps || 0 : 0);
}

// ---------- Kun hisobi ----------
function totals(d) {
  const x = day(d);
  const r = { kcal: 0, p: 0, f: 0, c: 0 };
  x.food.forEach(i => { r.kcal += i.kcal; r.p += i.p; r.f += i.f; r.c += i.c; });
  return r;
}
function dayCalc(d) {
  const n = norms(profile);
  const eaten = totals(d);
  const steps = stepsFor(d);
  const st = stepStats(profile, steps);
  const work = day(d).workouts.reduce((a, w) => a + w.kcal, 0);
  const active = st.kcal + work;
  const allowance = n.target + active;
  const spent = n.base + active;
  return { n, eaten, steps, st, work, active, allowance, spent, left: allowance - eaten.kcal, balance: eaten.kcal - spent };
}

// ---------- Navigatsiya ----------
const CAT_ICON = { uz: '🍲', non: '🥖', meat: '🍗', garnish: '🍚', dairy: '🥛', salad: '🥗', fruit: '🍎', nuts: '🥜',
  sweet: '🍰', drink: '🥤', fast: '🍔', other: '🧂', custom: '⭐', all: '🍽️' };
const MEAL_ICON = { breakfast: '🌅', lunch: '☀️', snack: '🍏', dinner: '🌙' };
const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

function go(name) {
  tab = name;
  document.querySelectorAll('.nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
  render(true);
  window.scrollTo(0, 0);
}
function render(animate) {
  refreshSteps();
  $('#nav').style.display = profile ? '' : 'none';
  document.querySelectorAll('.nav button').forEach(b => { b.querySelector('span').textContent = t('tab_' + b.dataset.tab); });
  const v = $('#view');
  if (!profile) v.innerHTML = store.get('intro', false) ? renderProfile() : renderIntro();
  else v.innerHTML = { home: renderHome, food: renderFood, activity: renderActivity, plan: renderPlan, profile: renderProfile }[tab]();
  if (profile && tab === 'food') { renderParsed(); renderFoodList(); }
  v.classList.remove('anim');
  if (animate && !REDUCED) {
    void v.offsetWidth;
    v.classList.add('anim');
    [...v.children].forEach((el, i) => el.style.animationDelay = Math.min(i, 8) * 55 + 'ms');
    countUp(v);
  }
}
// Raqamlarni 0 dan sanab chiqarish
function countUp(root) {
  root.querySelectorAll('[data-n]').forEach(el => {
    const end = parseFloat(el.dataset.n), dec = parseInt(el.dataset.d || '0'), pre = el.dataset.p || '';
    const t0 = performance.now(), dur = 800;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3), v = end * e;
      el.textContent = pre + (dec ? v.toFixed(dec) : fmt(v));
      if (k < 1) requestAnimationFrame(step);
    };
    el.textContent = pre + (dec ? (0).toFixed(dec) : '0');
    requestAnimationFrame(step);
  });
}
function num(v, pre = '', dec = 0) {
  return `<b data-n="${v}" data-p="${pre}" data-d="${dec}">${pre}${dec ? (+v).toFixed(dec) : fmt(v)}</b>`;
}

// ---------- Tanishtiruv ----------
let introStep = 0;
function renderIntro() {
  const slides = [['🍽️', 'intro1t', 'intro1'], ['✍️', 'intro2t', 'intro2'], ['👟', 'intro3t', 'intro3'], ['🎯', 'intro4t', 'intro4']];
  const [ic, tt, tx] = slides[introStep];
  const langs = introStep === 0 ? `<div class="chips center">${['uz', 'ru', 'en'].map(l => `<button class="chip ${lang === l ? 'on' : ''}" onclick="setLang('${l}')">${{ uz: "O'zbekcha", ru: 'Русский', en: 'English' }[l]}</button>`).join('')}</div>` : '';
  return `<div class="intro">
    <div class="introIcon" key="${introStep}">${ic}</div>
    <h1>${introStep === 0 ? "Sog'lom Hayot" : t(tt)}</h1>
    ${introStep === 0 ? `<h3>${t(tt)}</h3>` : ''}
    <p>${t(tx)}</p>
    ${langs}
    <div class="dots">${slides.map((_, i) => `<i class="${i === introStep ? 'on' : ''}"></i>`).join('')}</div>
    <button class="btn primary big" onclick="introNext()">${introStep < slides.length - 1 ? t('next') + ' →' : t('letsStart')}</button>
    ${introStep < slides.length - 1 ? `<button class="btn link" onclick="introStep=${slides.length - 1};render(true)">${t('skip')}</button>` : ''}
  </div>`;
}
function introNext() {
  if (introStep < 3) { introStep++; render(true); return; }
  store.set('intro', true); render(true);
}

// ---------- Bosh sahifa ----------
function ring(pct, color, size = 132, stroke = 12) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, pct || 0));
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--track)" stroke-width="${stroke}"/>
  <circle class="prog" style="--c:${c}" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
   stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}" transform="rotate(-90 ${size/2} ${size/2})"/></svg>`;
}
function bar(label, val, goal, color, icon) {
  const p = goal ? Math.min(100, val / goal * 100) : 0;
  return `<div class="mbar"><div class="mrow"><span>${icon} ${label}</span><b>${Math.round(val)} <small>/ ${goal} ${t('gr')}</small></b></div>
    <div class="track"><i style="width:${p}%;background:${color}"></i></div></div>`;
}
function startCard() {
  if (settings.guideDone) return '';
  const anyFood = Object.values(days).some(d => d.food && d.food.length);
  const stepsOk = !AND || AND.sensor() === 'none' || AND.stepsOn();
  const steps = [
    [true, t('g1'), ''],
    [anyFood, t('g2'), "openAdd()"],
    [stepsOk, t('g3'), "go('activity')"],
    [settings.water > 0, t('g4'), "go('profile')"],
  ];
  const done = steps.filter(s => s[0]).length;
  if (done === steps.length) return '';
  return `<div class="card guide"><div class="ghead"><h3>🚀 ${t('gTitle')}</h3><button class="x" onclick="settings.guideDone=true;store.set('settings',settings);render()">×</button></div>
    <div class="track"><i style="width:${done / steps.length * 100}%;background:var(--grad)"></i></div>
    ${steps.map(([ok, txt, fn]) => `<div class="gstep ${ok ? 'ok' : ''}" ${!ok && fn ? `onclick="${fn}"` : ''}><span>${ok ? '✓' : ''}</span>${txt}${!ok && fn ? '<em>›</em>' : ''}</div>`).join('')}
  </div>`;
}

function renderHome() {
  const isToday = curDate === todayStr();
  const c = dayCalc(curDate);
  const over = c.left < 0;
  const x = day(curDate);
  const water = x.water;
  let meals = '';
  MEALS.forEach(m => {
    const items = x.food.map((it, idx) => ({ it, idx })).filter(o => o.it.meal === m);
    const sum = items.reduce((a, o) => a + o.it.kcal, 0);
    const goalM = Math.round(c.n.target * MEAL_SHARE[m] / 10) * 10;
    const pm = Math.min(100, sum / goalM * 100);
    meals += `<div class="meal m-${m}"><div class="mhead"><b><i class="mico">${MEAL_ICON[m]}</i><span class="mt">${t('meal_' + m)}<small>${fmt(sum)} / ${fmt(goalM)} ${t('kcal')}</small></span></b>
      <button class="tip" onclick="openMealAdvice('${m}')">💡</button><button class="plus" onclick="openAdd('${m}')">+</button></div>
      <div class="track thin"><i style="width:${pm}%;background:${sum > goalM * 1.15 ? 'linear-gradient(90deg,#FB7185,#E11D48)' : 'var(--grad)'}"></i></div>`;
    if (!items.length) meals += `<div class="empty" onclick="openAdd('${m}')">${t('emptyMeal')}</div>`;
    items.forEach(o => {
      const f = FOODS[o.it.id];
      meals += `<div class="fitem"><i class="av">${CAT_ICON[f ? f.cat : 'custom']}</i><div><div class="fn">${esc(f ? fname(f) : o.it.nm)}</div><div class="fs">${o.it.u && o.it.u !== 'g' ? esc(amountText(o.it.q, o.it.u)) + ' · ' : ''}${o.it.g} ${t('gr')} · ${t('pfc', Math.round(o.it.p), Math.round(o.it.f), Math.round(o.it.c))}</div></div>
      <div class="fk">${fmt(o.it.kcal)}<small>${t('kcal')}</small></div><button class="x" onclick="delFood(${o.idx})">×</button></div>`;
    });
    meals += '</div>';
  });
  const stPct = c.steps / (settings.stepGoal || 10000);
  const pctEaten = Math.round(c.eaten.kcal / c.allowance * 100);
  return `
  <div class="datebar"><button onclick="shiftDay(-1)">‹</button><b>${dateLabel(curDate)}</b><button onclick="shiftDay(1)" ${isToday ? 'disabled' : ''}>›</button></div>
  ${startCard()}
  <div class="card hero ${over ? 'over' : ''}">
    <div class="ringwrap">${ring(c.eaten.kcal / c.allowance, over ? '#FECDD3' : '#fff', 140, 13)}
      <div class="ringtxt"><span>${over ? t('overTop') : t('leftTop')}</span>${num(Math.abs(c.left))}<span>${t('kcal')}</span></div></div>
    <div class="herolist">
      <div><span>🎯 ${t('goal')}</span><b>${fmt(c.n.target)}</b></div>
      <div><span>🔥 ${t('activity')}</span><b>+${fmt(c.active)}</b></div>
      <div><span>🍽️ ${t('eaten')}</span><b>−${fmt(c.eaten.kcal)}</b></div>
      <p class="heroHint">${over ? t('heroOver') : t('heroLeft', pctEaten)}</p>
    </div>
  </div>
  <div class="grid2">
    <div class="card tile steps" onclick="go('activity')">
      <div class="tring">${ring(stPct, '#fff', 64, 7)}<i>👟</i></div>
      <div>${num(c.steps)}<span>${t('stepsOf', fmt(settings.stepGoal))}</span><span>${c.st.km.toFixed(1)} ${t('km')} · 🔥 ${fmt(c.st.kcal)}</span></div>
    </div>
    <div class="card tile water">
      <div class="tring">${ring(water / c.n.water, '#fff', 64, 7)}<i>💧</i></div>
      <div><b>${(water / 1000).toFixed(2).replace(/0$/, '')} ${t('l')}</b><span>${t('of')} ${(c.n.water / 1000).toFixed(1)} ${t('l')}</span>
      <div class="wbtn"><button onclick="event.stopPropagation();addWater(-250)">−</button><button onclick="event.stopPropagation();addWater(250,this)">+ ${t('glass')}</button></div></div>
    </div>
  </div>
  <div class="card">
    <h3>📊 ${t('dayBalance')}</h3>
    <div class="stats3">
      <div class="s-eat"><span>${t('eaten')}</span>${num(c.eaten.kcal)}<small>${t('kcal')}</small></div>
      <div class="s-burn"><span>${t('spent')}</span>${num(c.spent)}<small>${t('kcal')}</small></div>
      <div class="${c.balance > 0 ? 's-plus' : 's-minus'}"><span>${t('balance')}</span>${num(Math.abs(c.balance), c.balance > 0 ? '+' : '−')}<small>${t('kcal')}</small></div>
    </div>
    <p class="hint">${c.balance > 0 ? t('balPlus') : t('balMinus')}</p>
    ${bar(t('protein'), c.eaten.p, c.n.prot, 'linear-gradient(90deg,#38BDF8,#0284C7)', '🥩')}
    ${bar(t('fat'), c.eaten.f, c.n.fat, 'linear-gradient(90deg,#FCD34D,#F59E0B)', '🧈')}
    ${bar(t('carb'), c.eaten.c, c.n.carb, 'linear-gradient(90deg,#C4B5FD,#7C3AED)', '🍞')}
  </div>
  <div class="card">${meals}</div>
  <button class="btn primary big pulse" onclick="openAdd()">＋ ${t('addFood')}</button>
  <p class="disc">${t('approx')}</p>`;
}

function shiftDay(n) {
  const d = addDays(curDate, n);
  if (d > todayStr()) return;
  curDate = d; render(true);
}
function addWater(ml, el) {
  const x = day(curDate); x.water = Math.max(0, x.water + ml); save();
  if (ml > 0) drops(el);
  render();
}
let undoItem = null;
function delFood(idx) {
  const x = day(curDate);
  undoItem = { d: curDate, idx, it: x.food.splice(idx, 1)[0] };
  save(); render();
  toast(t('deleted'), t('undo'), () => {
    if (!undoItem) return;
    day(undoItem.d).food.splice(undoItem.idx, 0, undoItem.it); save(); undoItem = null; render();
  });
}
function openAdd(m) { if (m) selMeal = m; go('food'); setTimeout(() => { const e = $('#mealText'); if (e) e.focus(); }, 80); }

// Suv tomchilari animatsiyasi
function drops(el) {
  if (REDUCED || !el) return;
  const r = el.getBoundingClientRect();
  for (let i = 0; i < 6; i++) {
    const d = document.createElement('i');
    d.className = 'drop'; d.textContent = '💧';
    d.style.left = (r.left + r.width / 2) + 'px'; d.style.top = r.top + 'px';
    d.style.setProperty('--dx', (Math.random() * 80 - 40) + 'px');
    d.style.animationDelay = i * 40 + 'ms';
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 1000);
  }
}
// Qo'shilganda tabrik animatsiyasi
function celebrate(kcal) {
  const o = $('#pop');
  o.innerHTML = `<div class="popin"><div class="check">✓</div><b>${kcal != null ? '+' + fmt(kcal) + ' ' + t('kcal') : ''}</b><span>${t('added')}</span></div>`;
  o.classList.remove('show'); void o.offsetWidth; o.classList.add('show');
  if (!REDUCED) {
    const em = ['🎉', '✨', '🥗', '💚', '⭐', '🍎'];
    for (let i = 0; i < 14; i++) {
      const p = document.createElement('i');
      p.className = 'conf'; p.textContent = em[i % em.length];
      const a = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 90;
      p.style.setProperty('--x', Math.cos(a) * dist + 'px'); p.style.setProperty('--y', Math.sin(a) * dist + 'px');
      o.appendChild(p);
    }
  }
  clearTimeout(celebrate.tm); celebrate.tm = setTimeout(() => o.classList.remove('show'), 1300);
}


// ---------- Ovqatlanish bo'yicha tavsiyalar ----------
const MEAL_SHARE = { breakfast: 0.25, lunch: 0.35, snack: 0.10, dinner: 0.30 };
function mealOptions(m, target, seed) {
  const opts = PLAN_TEMPLATES[m];
  const order = opts.map((_, i) => i).sort((a, b) => ((a * 7 + seed) % 11) - ((b * 7 + seed) % 11));
  return order.slice(0, 3).map(i => {
    const raw = opts[i].map(([id, g]) => ({ id, g }));
    const base = raw.reduce((a, x) => a + FOODS[x.id].kcal * x.g / 100, 0);
    const k = Math.min(1.35, Math.max(0.5, target / base));
    let sum = 0;
    const items = raw.map(x => {
      const f = FOODS[x.id];
      let g = f.cat === 'drink' && f.kcal < 5 ? x.g : Math.max(10, Math.round(x.g * k / 10) * 10);
      if (f.def === 'dona' && f.portions.dona >= 40) g = Math.max(1, Math.round(g / f.portions.dona * 2) / 2) * f.portions.dona;
      const n = nutr(f, g); sum += n.kcal;
      return { id: x.id, g, kcal: n.kcal };
    });
    return { items, sum };
  });
}
let adviceOpts = null;
function openMealAdvice(m) {
  const n = norms(profile);
  const goalM = Math.round(n.target * MEAL_SHARE[m] / 10) * 10;
  const eaten = day(curDate).food.filter(f => f.meal === m).reduce((a, f) => a + f.kcal, 0);
  const left = goalM - eaten;
  const tgt = left > 120 ? left : goalM;
  const seed = parseInt(curDate.replace(/-/g, '')) % 97;
  adviceOpts = { m, list: mealOptions(m, tgt, seed) };
  const share = MEAL_SHARE[m];
  openModal(`<div class="mhero"><i class="av big m-${m}i">${MEAL_ICON[m]}</i><div><h2>${t('meal_' + m)}</h2><p class="hint" style="margin:0">${t('advNorm', fmt(goalM), Math.round(share * 100))}</p></div></div>
    <div class="stats3">
      <div class="s-eat"><span>${t('eaten')}</span><b>${fmt(eaten)}</b><small>${t('kcal')}</small></div>
      <div class="${left >= 0 ? 's-minus' : 's-plus'}"><span>${left >= 0 ? t('canMore') : t('overBy')}</span><b>${fmt(Math.abs(left))}</b><small>${t('kcal')}</small></div>
      <div><span>${t('protein')}</span><b>${Math.round(n.prot * share)}</b><small>${t('gr')}</small></div>
    </div>
    <div class="advice">${t('adv_' + m)}</div>
    <h3>${left > 120 ? t('advPick', fmt(tgt)) : t('advPickFull', fmt(tgt))}</h3>
    ${adviceOpts.list.map((o, i) => `<div class="opt"><div class="optH"><b>${t('variant')} ${i + 1}</b><span>≈ ${fmt(o.sum)} ${t('kcal')}</span></div>
      ${o.items.map(x => `<div class="fitem small"><i class="av c-${FOODS[x.id].cat}">${CAT_ICON[FOODS[x.id].cat]}</i><div class="fn">${esc(fname(FOODS[x.id]))}</div><div class="fs">${x.g} ${t('gr')}</div><div class="fk">${fmt(x.kcal)}</div></div>`).join('')}
      <button class="btn ghost small" onclick="addAdvice(${i})">+ ${t('iAteThis')}</button></div>`).join('')}
    <button class="btn ghost" onclick="closeModal()">${t('close')}</button>`);
}
function addAdvice(i) {
  const o = adviceOpts.list[i];
  o.items.forEach(x => pushFood(FOODS[x.id], x.g, adviceOpts.m));
  save(); closeModal(); render(); celebrate(o.sum);
}

// ---------- Rasm orqali aniqlash (telefon ichidagi ISSAI modeli) ----------
const AI_MAP = {"achichuk": "achchiq_chuchuk", "airan-katyk": "qatiq", "almond": "bodom", "apple": "olma", "apricot": "orik", "artichoke": null, "arugula": "kokat", "asip": "hasip", "asparagus": null, "avocado": "avokado", "bacon": "kolbasa", "baklava": "pahlava", "banana": "banan", "basil": "kokat", "bauyrsak": "bogirsoq", "bean soup": "moshova", "beans": "loviya", "beef shashlyk": "shashlik_mol", "beef shashlyk-v": "shashlik_mol", "beer": "pivo", "beet": "lavlagi", "bell pepper": "qalampir", "beshbarmak": "norin", "beverages": null, "black olives": "zaytun", "blackberry": "malina", "blueberry": "chernika", "boiled chicken": "tovuq", "boiled eggs": "tuxum", "boiled meat": "mol_gosht", "borsch": "borsh", "bread": "non", "brizol": "kotlet", "broccoli": "brokkoli", "buckwheat": "grechka", "butter": "saryog", "cabbage": "karam", "cakes": "tort", "carrot": "sabzi", "cashew": "bodom", "casserole with meat and vegetables": "dimlama", "cauliflower": "gulkaram", "caviar": null, "celery": "kokat", "cereal based cooked food": "guruch", "chak-chak": "chakchak", "cheburek": "cheburek", "cheese": "pishloq", "cheese souce": "mayonez", "cherry": "gilos", "chestnuts": null, "chicken shashlyk": "tovuq_shashlik", "chicken shashlyk-v": "tovuq_shashlik", "chickpeas": "noxat", "chili pepper": null, "chips": "chips", "chocolate": "shokolad", "chocolate paste": "shokolad_pasta", "cinnabons": "bulochka", "coffee": "kofe", "condensed milk": "sgushenka", "cooked eggplant": "baqlajon", "cooked food based on meat": "jiz", "cooked food meat with vegetables": "dimlama", "cooked tomatoes": "pomidor", "cooked zucchini": "kabachok", "cookies": "pechenye", "corn": "makkajoxori", "corn flakes": "xlopya", "crepe": "blin", "crepe w filling": "blin", "croissant": "bulochka", "croissant sandwich": "sendvich", "cucumber": "bodring", "cutlet": "kotlet", "dates": "finik", "desserts": "pirojnoe", "dill": "kokat", "doner-lavash": "lavash", "doner-nan": "lavash", "dragon fruit": null, "dried fruits": "mayiz", "egg product": "quymoq_tuxum", "eggplant": "baqlajon", "figs": "anjir", "fish": "baliq", "french fries": "fri", "fried cheese": "pishloq", "fried chicken": "tovuq_qovurilgan", "fried eggs": "quymoq_tuxum", "fried fish": "baliq_qovurilgan", "fried meat": "jiz", "fruits": null, "garlic": null, "granola": "granola", "grapefruit": "greypfrut", "grapes": "uzum", "green beans": "loviya", "green olives": "zaytun", "hachapuri": "xachapuri", "hamburger": "burger", "hazelnut": "yongoq", "herbs": "kokat", "hinkali": "manti", "honey": "asal", "hot dog": "hotdog", "hummus": "xumus", "hvorost": "pishme", "ice-cream": "muzqaymoq", "irimshik": "qurt", "jam": "murabbo", "juice": "sharbat", "karta": "qazi", "kattama-nan": "qatlama", "kazy-karta": "qazi", "ketchup": "ketchup", "kiwi": "kivi", "kurt": "qurt", "kuyrdak": "jiz", "kymyz-kymyran": "qimiz", "lagman-fried": "qovurma_lagmon", "lagman-w-soup": "lagmon", "lavash": "lavash_non", "legumes": "loviya", "lemon": "limon", "lime": "limon", "mandarin": "mandarin", "mango": "mango", "manty": "manti", "mashed potato": "kartoshka_pyure", "mayonnaise": "mayonez", "meat based soup": "shurva", "meat product": "kolbasa", "melon": "qovun", "milk": "sut", "minced meat shashlyk": "lula", "mint": "kokat", "mixed berries": "malina", "mixed nuts": "yongoq", "muffin": "keks", "mushrooms": "zamburug", "naryn": "norin", "nauryz-kozhe": "halim", "noodles soup": "xamir_shurva", "nuggets": "nagets", "oil": "yog", "okra": null, "okroshka": "chalob", "olivie": "olivye", "onion": "piyoz", "onion rings": "fri", "orama": "xonim", "orange": "apelsin", "pancakes": "oladi", "parsley": "kokat", "pasta": "makaron", "pastry": "bulochka", "peach": "shaftoli", "peanut": "yeryongoq", "pear": "nok", "peas": "noxat", "pecan": "yongoq", "persimmon": "xurmo", "pickled cabbage": "karam_salat", "pickled cucumber": "tuzlangan_bodring", "pickled ginger": null, "pickled squash": "tuzlangan_bodring", "pie": "pirog", "pineapple": "ananas", "pistachio": "pista", "pizza": "pitsa", "plov": "osh", "plum": "olxori", "pomegranate": "anor", "porridge": "ovsyanka", "potatoes": "kartoshka", "pumpkin": "qovoq", "pumpkin seeds": "semechka", "quince": "behi", "radish": "turp", "raspberry": "malina", "redcurrant": "smorodina", "ribs": "shashlik_qoy", "rice": "guruch", "rosemary": "kokat", "salad fresh": "salat", "salad leaves": "kokat", "salad with fried meat veggie": "toshkent_salat", "salad with sauce": "olivye", "samsa": "somsa", "sandwich": "sendvich", "sausages": "sosiska", "scallion": "kokat", "seafood": "krevetka", "seafood soup": "tovuq_shurva", "sheep-head": "qoy_gosht", "shelpek": "qatlama", "shorpa": "shurva", "shorpa chicken": "tovuq_shurva", "smetana": "smetana", "smoked fish": "skumbriya", "snacks": "chips", "snacks bread": "suxarik", "soda": "kola", "souces": "ketchup", "soup-plain": "shurva", "soy souce": "soya_sous", "spinach": "kokat", "spirits": "aroq", "strawberry": "qulupnay", "sugar": "shakar", "sushi": "sushi", "sushi fish": "sushi", "sushi nori": "sushi", "sushki": "kraker", "suzbe": "suzma", "sweets": "konfet", "syrniki": "sirniki", "taba-nan": "non", "talkan-zhent": "holvaytar", "tartar": null, "tea": "kok_choy", "tomato": "pomidor", "tomato souce": "ketchup", "tomato-cucumber-salad": "salat", "tushpara-fried": "qovurma_chuchvara", "tushpara-w-soup": "chuchvara", "tushpara-wo-soup": "chuchvara", "vareniki": "vareniki", "vegetable based cooked food": "dimlangan_karam", "vegetable soup": "kartoshka_shurva", "waffles": "vafli", "walnut": "yongoq", "wasabi": null, "water": "suv", "watermelon": "tarvuz", "wine": "vino", "wings": "qanot", "zucchini": "kabachok"};
function aiOn() { try { return !!(AND && AND.aiAvailable()); } catch (e) { return false; } }
function aiFood(label) {
  if (AI_MAP[label] !== undefined) return AI_MAP[label] ? FOODS[AI_MAP[label]] : null;
  const toks = tokenize(label.replace(/[_-]/g, ' '));
  for (let i = 0; i < toks.length; i++) {
    const m = matchFood(toks, i, 1);
    if (m) return m.food;
  }
  return null;
}
function aiPhoto(camera) { if (camera) AND.takePhoto(); else AND.pickPhoto(); }
window.onAiResult = function (state, list, thumb) {
  if (state === 'busy') {
    openModal(`<div class="aiwait"><div class="scan"><i>🍽️</i></div><h2>${t('aiLooking')}</h2><p class="hint">${t('aiLookingHint')}</p></div>`);
    return;
  }
  if (state === 'cancel') { if (modalOpen) closeModal(); return; }
  if (state !== 'ok') { closeModal(); toast(t('aiError')); return; }
  closeModal();
  const items = [], unknown = [];
  (list || []).forEach(d => {
    const f = aiFood(d.label);
    if (!f) { unknown.push(d.label.replace(/_/g, ' ')); return; }
    const ex = items.find(x => x.food === f);
    if (ex) { if (f.def === 'dona') ex.qty += d.count; return; }
    const r = resolve({ food: f, q: f.def === 'dona' ? d.count : null, u: null, mul: 1 });
    r.ai = Math.round(d.score * 100);
    items.push(r);
  });
  if (tab !== 'food') go('food');
  parsed = { items, unknown, thumb };
  renderParsed();
  setTimeout(() => { const e = $('#parseOut'); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
};

// ---------- Ovqat qo'shish ----------
function mealChips(cur, fn) {
  return `<div class="chips">${MEALS.map(m => `<button class="chip ${m === cur ? 'on' : ''}" onclick="${fn}('${m}')">${MEAL_ICON[m]} ${t('meal_' + m)}</button>`).join('')}</div>`;
}
function setMeal(m) { selMeal = m; document.querySelectorAll('#mealChips .chip').forEach((b, i) => b.classList.toggle('on', MEALS[i] === m)); }

function renderFood() {
  const ex = t('examples').split('|');
  return `
  <div class="card">
    <h2>✍️ ${t('whatAte')}</h2>
    <p class="hint">${t('foodHelp')}</p>
    ${curDate !== todayStr() ? `<p class="hint">📅 ${dateLabel(curDate)}</p>` : ''}
    ${aiOn() ? `<div class="aibox"><button class="btn primary cam" onclick="aiPhoto(true)">📷 ${t('aiCamera')}</button><button class="btn ghost gal" onclick="aiPhoto(false)">🖼️</button></div>
    <p class="hint center">${t('aiOr')}</p>` : ''}
    <div class="stepLbl"><i>1</i>${t('step1')}</div>
    <textarea id="mealText" rows="3" placeholder="${esc(t('placeholder'))}"></textarea>
    <div class="chips ex"><span class="exl">${t('tryEx')}</span>${ex.map(e => `<button class="chip light" onclick="useEx(this)">${esc(e)}</button>`).join('')}</div>
    <div class="stepLbl"><i>2</i>${t('step2')}</div>
    <div id="mealChips">${mealChips(selMeal, 'setMeal')}</div>
    <div class="stepLbl"><i>3</i>${t('step3')}</div>
    <button class="btn primary" onclick="doParse()">🔍 ${t('calc')}</button>
    <div id="parseOut"></div>
  </div>
  <div class="card">
    <h2>📚 ${t('foodBase')} <span class="badge">${FOOD_LIST.length}</span></h2>
    <p class="hint">${t('baseHelp')}</p>
    <input id="foodSearch" class="inp search" placeholder="🔎 ${esc(t('search'))}" value="${esc(foodQuery)}" oninput="foodQuery=this.value;renderFoodList()">
    <div class="chips scroll">${CATS.filter(c => c !== 'custom' || CUSTOM.length).map(c => `<button class="chip ${c === foodCat ? 'on' : ''}" onclick="foodCat='${c}';render()">${CAT_ICON[c]} ${t('cat_' + c)}</button>`).join('')}</div>
    <div id="foodList"></div>
    <button class="btn ghost" onclick="openCustom()">+ ${t('customFood')}</button>
  </div>`;
}
function useEx(b) { const e = $('#mealText'); e.value = b.textContent; doParse(); }

function doParse() {
  const txt = $('#mealText').value.trim();
  if (!txt) { $('#mealText').focus(); return; }
  const r = parseMeal(txt);
  parsed = { items: r.items, unknown: r.unknown };
  renderParsed();
}

function unitOptions(f, cur) {
  const us = Object.keys(f.portions).concat(['g']);
  return us.map(u => `<option value="${u}" ${u === cur ? 'selected' : ''}>${u === 'g' ? t('gr') : unitName(u) + ' (' + f.portions[u] + ' ' + t('gr') + ')'}</option>`).join('');
}

function renderParsed() {
  const out = $('#parseOut');
  if (!out || !parsed) return;
  if (!parsed.items.length) {
    if (parsed.thumb) { out.innerHTML = `<div class="res warnbox"><img class="thumb" src="${parsed.thumb}">${t('aiNothing')}${parsed.unknown.length ? '<br>' + t('aiSaw') + ': <b>' + esc(parsed.unknown.join(', ')) + '</b>' : ''}</div>`; return; }
    out.innerHTML = `<div class="res warnbox">${t('notFound')}${parsed.unknown.length ? ': <b>' + esc(parsed.unknown.join(', ')) + '</b>' : ''}<br>${t('notFoundHint')}</div>`;
    return;
  }
  let sum = 0, rows = '';
  parsed.items.forEach((it, i) => {
    const g = gramsOf(it.food, it.qty, it.unit);
    const n = nutr(it.food, g);
    sum += n.kcal;
    rows += `<div class="prow">
      <div class="pname">${esc(fname(it.food))}${it.ai ? ` <em class="aiconf">🤖 ${it.ai}%</em>` : ''}<small>${n.g} ${t('gr')} · ${t('pfc', Math.round(n.p), Math.round(n.f), Math.round(n.c))}</small></div>
      <div class="pk">${fmt(n.kcal)}<small>${t('kcal')}</small></div>
      <button class="x" onclick="pDel(${i})">×</button>
      <div class="pctl"><input type="number" inputmode="decimal" min="0" step="${it.unit === 'g' ? 10 : 0.5}" value="${it.qty}" onchange="pEdit(${i},'qty',this.value)">
      <select onchange="pEdit(${i},'unit',this.value)">${unitOptions(it.food, it.unit)}</select></div></div>`;
  });
  out.innerHTML = `<div class="res pop">${parsed.thumb ? `<div class="aihead"><img class="thumb" src="${parsed.thumb}"><p>${t('aiCheck')}</p></div>` : ''}${rows}
    ${parsed.unknown.length ? `<p class="hint">❓ ${t('unknownWords')}: <b>${esc(parsed.unknown.join(', '))}</b> — ${t('unknownHint')}</p>` : ''}
    <div class="ptotal"><span>${t('total')}</span><b>${fmt(sum)} ${t('kcal')}</b></div>
    <button class="btn primary" onclick="addParsed()">✓ ${t('addTo', t('meal_' + selMeal))}</button></div>`;
}
function pEdit(i, k, v) {
  const it = parsed.items[i];
  if (k === 'qty') it.qty = Math.max(0, parseFloat(String(v).replace(',', '.')) || 0);
  else {
    const g = gramsOf(it.food, it.qty, it.unit);
    it.unit = v;
    it.qty = v === 'g' ? Math.round(g) : 1;
  }
  renderParsed();
}
function pDel(i) { parsed.items.splice(i, 1); renderParsed(); }

function amountText(qty, unit) {
  return unit === 'g' ? '' : (qty % 1 ? qty.toString().replace('.', ',') : qty) + ' ' + unitName(unit);
}
function pushFood(food, grams, meal, q, u) {
  const n = nutr(food, grams);
  const x = day(curDate);
  x.food.push({ id: food.id, nm: fname(food), q: q || 0, u: u || 'g', g: n.g, kcal: n.kcal, p: n.p, f: n.f, c: n.c, meal, ts: Date.now() });
  if (food.water) x.water += Math.round(grams);
}
function addParsed() {
  let sum = 0;
  parsed.items.forEach(it => {
    const g = gramsOf(it.food, it.qty, it.unit);
    if (g > 0) { pushFood(it.food, g, selMeal, it.qty, it.unit); sum += nutr(it.food, g).kcal; }
  });
  save();
  parsed = null;
  go('home');
  celebrate(sum);
}

function renderFoodList() {
  const el = $('#foodList');
  if (!el) return;
  const q = foodQuery.trim();
  let list = FOOD_LIST;
  if (foodCat !== 'all') list = list.filter(f => f.cat === foodCat);
  if (q) {
    const toks = tokenize(q).filter(x => x.k !== ',');
    if (toks.length) {
      list = list.filter(f => {
        const hay = tokenize([f.name.uz, f.name.ru, f.name.en].concat(f.syn).join(' ')).map(x => x.k);
        return toks.every(tk => hay.some(h => h.includes(tk.k) || wmatch(h, tk.k)));
      });
    }
  }
  el.innerHTML = list.slice(0, 80).map(f => {
    const pg = f.portions[f.def];
    return `<div class="litem" onclick="openFood('${f.id}')"><i class="av c-${f.cat}">${CAT_ICON[f.cat]}</i><div><div class="fn">${esc(fname(f))}</div>
      <div class="fs">1 ${unitName(f.def)} ≈ ${pg} ${t('gr')} · ${fmt(f.kcal)} ${t('kcal')}/100 ${t('gr')}</div></div>
      <div class="fk">${fmt(f.kcal * pg / 100)}<small>${t('kcal')}</small></div></div>`;
  }).join('') || `<p class="hint">${t('nothing')}</p>`;
}

// ---------- Modal oynalar ----------
function openModal(html) {
  $('#modal').innerHTML = `<div class="sheet">${html}</div>`;
  $('#modal').classList.add('show');
  modalOpen = true;
}
function closeModal() { $('#modal').classList.remove('show'); modalOpen = false; }
window.onBack = function () {
  if (modalOpen) { closeModal(); return true; }
  if (profile && tab !== 'home') { go('home'); return true; }
  return false;
};

let mFood = null;
function openFood(id) {
  const f = FOODS[id];
  mFood = { food: f, qty: 1, unit: f.def, meal: selMeal };
  const per = f.portions[f.def];
  openModal(`<div class="mhero"><i class="av big c-${f.cat}">${CAT_ICON[f.cat]}</i><h2>${esc(fname(f))}</h2></div>
    <p class="hint">100 ${t('gr')}: ${fmt(f.kcal)} ${t('kcal')} · ${t('pfc', f.p, f.f, f.c)}</p>
    <div class="pctl wide"><input id="mq" type="number" inputmode="decimal" min="0" step="0.5" value="1" oninput="mUpd()">
    <select id="mu" onchange="mUnit(this.value)">${unitOptions(f, f.def)}</select></div>
    <div id="mres" class="mres"></div>
    <div id="mMeal">${mealChips(selMeal, 'mMealSet')}</div>
    <button class="btn primary" onclick="mAdd()">✓ ${t('add')}</button>
    ${f.custom ? `<button class="btn ghost danger" onclick="delCustom('${f.id}')">${t('delete')}</button>` : ''}
    <button class="btn ghost" onclick="closeModal()">${t('cancel')}</button>`);
  mUpd();
}
function mUnit(u) {
  const g = gramsOf(mFood.food, mFood.qty, mFood.unit);
  mFood.unit = u; mFood.qty = u === 'g' ? Math.round(g) : 1;
  $('#mq').value = mFood.qty; $('#mq').step = u === 'g' ? 10 : 0.5;
  mUpd();
}
function mUpd() {
  mFood.qty = Math.max(0, parseFloat(String($('#mq').value).replace(',', '.')) || 0);
  const n = nutr(mFood.food, gramsOf(mFood.food, mFood.qty, mFood.unit));
  $('#mres').innerHTML = `<b>${fmt(n.kcal)}</b> ${t('kcal')} <span>· ${n.g} ${t('gr')} · ${t('pfc', Math.round(n.p), Math.round(n.f), Math.round(n.c))}</span>`;
}
function mMealSet(m) { mFood.meal = m; selMeal = m; document.querySelectorAll('#mMeal .chip').forEach((b, i) => b.classList.toggle('on', MEALS[i] === m)); }
function mAdd() {
  const g = gramsOf(mFood.food, mFood.qty, mFood.unit);
  if (g <= 0) return;
  pushFood(mFood.food, g, mFood.meal, mFood.qty, mFood.unit);
  save(); closeModal(); celebrate(nutr(mFood.food, g).kcal);
}

function openCustom() {
  openModal(`<h2>${t('customFood')}</h2>
    <label>${t('cfName')}</label><input id="cfn" class="inp">
    <label>${t('cfKcal')}</label><input id="cfk" class="inp" type="number" inputmode="decimal">
    <label>${t('cfPortion')}</label><input id="cfg" class="inp" type="number" inputmode="decimal" value="100">
    <div class="row3"><div><label>${t('protein')}</label><input id="cfp" class="inp" type="number" inputmode="decimal"></div>
    <div><label>${t('fat')}</label><input id="cff" class="inp" type="number" inputmode="decimal"></div>
    <div><label>${t('carb')}</label><input id="cfc" class="inp" type="number" inputmode="decimal"></div></div>
    <p class="hint">${t('cfHint')}</p>
    <button class="btn primary" onclick="saveCustom()">${t('save')}</button>
    <button class="btn ghost" onclick="closeModal()">${t('cancel')}</button>`);
}
function saveCustom() {
  const num = id => parseFloat(String($(id).value).replace(',', '.')) || 0;
  const name = $('#cfn').value.trim(), kcal = num('#cfk');
  if (!name || !kcal) { toast(t('fillAll')); return; }
  CUSTOM.push({ id: 'c' + Date.now(), name, kcal, g: num('#cfg') || 100, p: num('#cfp'), f: num('#cff'), c: num('#cfc') });
  store.set('custom', CUSTOM); loadFoods(); closeModal(); foodCat = 'custom'; render();
}
function delCustom(id) {
  CUSTOM = CUSTOM.filter(c => c.id !== id); store.set('custom', CUSTOM); loadFoods(); closeModal(); foodCat = 'all'; render();
}

// ---------- Faollik ----------
function weekBars(vals, labels, color, goal, color2, vals2) {
  const W = 320, H = 130, bw = 26, gap = (W - 7 * bw) / 7;
  const max = Math.max(goal || 0, ...vals, ...(vals2 || [0]), 1);
  let s = `<svg viewBox="0 0 ${W} ${H + 18}" class="chart"><defs><linearGradient id="gO" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FDBA74"/><stop offset="1" stop-color="#EA580C"/></linearGradient><linearGradient id="gT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34D399"/><stop offset="1" stop-color="#059669"/></linearGradient></defs>`;
  if (goal) { const y = H - goal / max * H; s += `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="var(--muted)" stroke-dasharray="4 4" stroke-width="1"/>`; }
  vals.forEach((v, i) => {
    const x = gap / 2 + i * (bw + gap);
    if (vals2) {
      const h1 = v / max * H, h2 = vals2[i] / max * H;
      s += `<rect x="${x}" y="${H - h1}" width="${bw / 2 - 1}" height="${h1}" rx="3" fill="${color}"/>`;
      s += `<rect x="${x + bw / 2 + 1}" y="${H - h2}" width="${bw / 2 - 1}" height="${h2}" rx="3" fill="${color2}"/>`;
    } else {
      const h = v / max * H;
      s += `<rect x="${x}" y="${H - h}" width="${bw}" height="${h}" rx="5" fill="${color}"/>`;
    }
    s += `<text x="${x + bw / 2}" y="${H + 14}" text-anchor="middle" font-size="11" fill="var(--muted)">${labels[i]}</text>`;
  });
  return s + '</svg>';
}

function renderActivity() {
  const c = dayCalc(curDate);
  const isToday = curDate === todayStr();
  let sensorBox = '';
  if (AND) {
    const sens = AND.sensor();
    if (sens === 'none') sensorBox = `<p class="hint warnbox">${t('noSensor')}</p>`;
    else if (!AND.stepsOn()) sensorBox = `<div class="res warnbox"><p>${t('stepsOff')}</p><button class="btn primary" onclick="AND.enableSteps()">👟 ${t('enableSteps')}</button></div>`;
    else sensorBox = `<p class="hint ok">✓ ${t('stepsOn')} <a onclick="AND.disableSteps();render()">${t('turnOff')}</a></p>`;
  } else sensorBox = `<p class="hint">${t('noAndroid')}</p>`;
  const last7 = [...Array(7)].map((_, i) => addDays(curDate, i - 6));
  const x = day(curDate);
  const wopts = Object.keys(WORKOUTS).map(k => `<option value="${k}">${t('w_' + k)}</option>`).join('');
  const wl = x.workouts.map((w, i) => `<div class="fitem"><div><div class="fn">${t('w_' + w.type)}</div><div class="fs">${w.min} ${t('min')}</div></div>
    <div class="fk good">−${fmt(w.kcal)}</div><button class="x" onclick="delWork(${i})">×</button></div>`).join('');
  return `
  <div class="datebar"><button onclick="shiftDay(-1)">‹</button><b>${dateLabel(curDate)}</b><button onclick="shiftDay(1)" ${isToday ? 'disabled' : ''}>›</button></div>
  <div class="card center">
    <div class="ringwrap">${ring(c.steps / settings.stepGoal, '#F97316', 160, 14)}<div class="ringtxt">${num(c.steps)}<span>${t('stepsOf', fmt(settings.stepGoal))}</span></div></div>
    <div class="stats3">
      <div><span>${t('distance')}</span><b>${c.st.km.toFixed(2)}</b><small>${t('km')}</small></div>
      <div><span>${t('burned')}</span><b>${fmt(c.st.kcal)}</b><small>${t('kcal')}</small></div>
      <div><span>${t('workouts')}</span><b>${fmt(c.work)}</b><small>${t('kcal')}</small></div>
    </div>
    ${sensorBox}
    <div class="inrow"><input id="manSteps" class="inp" type="number" inputmode="numeric" placeholder="${t('manualSteps')}"><button class="btn small" onclick="addSteps()">+</button></div>
  </div>
  <div class="card"><h3>📈 ${t('week')} — ${t('steps')}</h3>${weekBars(last7.map(stepsFor), last7.map(dayShort), 'url(#gO)', settings.stepGoal)}</div>
  <div class="card">
    <h3>🏋️ ${t('workouts')}</h3>
    <p class="hint">${t('workHelp')}</p>
    <select id="wt" class="inp" onchange="wPrev()">${wopts}</select>
    <div class="inrow"><input id="wm" class="inp" type="number" inputmode="numeric" value="30" oninput="wPrev()"><span class="unit">${t('min')}</span></div>
    <p class="hint" id="wprev"></p>
    <button class="btn primary" onclick="addWork()">+ ${t('add')}</button>
    ${wl}
  </div>
  <div class="card"><h3>⚖️ ${t('week')} — ${t('eatenVsSpent')}</h3>
    ${weekBars(last7.map(d => totals(d).kcal), last7.map(dayShort), 'url(#gT)', 0, 'url(#gO)', last7.map(d => { const x = days[d]; return (x && (x.food.length || x.workouts.length)) || stepsFor(d) ? dayCalc(d).spent : 0; }))}
    <div class="legend"><i style="background:#10B981"></i>${t('eaten')} <i style="background:#F97316"></i>${t('spent')}</div>
  </div>`;
}
function wPrev() {
  const e = $('#wprev'); if (!e) return;
  const m = parseFloat($('#wm').value) || 0;
  e.textContent = '≈ ' + fmt(workoutKcal($('#wt').value, m, profile.weight)) + ' ' + t('kcal');
}
function addWork() {
  const type = $('#wt').value, min = parseFloat($('#wm').value) || 0;
  if (min <= 0) return;
  day(curDate).workouts.push({ type, min, kcal: workoutKcal(type, min, profile.weight) });
  save(); render();
}
function delWork(i) { day(curDate).workouts.splice(i, 1); save(); render(); }
function addSteps() {
  const n = parseInt($('#manSteps').value) || 0;
  if (!n) return;
  const x = day(curDate); x.steps = Math.max(0, x.steps + n); save(); render();
}

// ---------- Reja ----------
function bmiCat(b) { return b < 18.5 ? t('bmi1') : b < 25 ? t('bmi2') : b < 30 ? t('bmi3') : t('bmi4'); }
function renderPlan() {
  const n = norms(profile);
  const plan = makePlan(n.target, planSeed);
  let menu = '';
  MEALS.forEach(m => {
    const items = plan.meals[m];
    const sum = items.reduce((a, x) => a + x.kcal, 0);
    menu += `<div class="meal"><div class="mhead"><b>${t('meal_' + m)}</b><span>${fmt(sum)} ${t('kcal')}</span></div>
      ${items.map(x => `<div class="fitem small"><div class="fn">${esc(fname(FOODS[x.id]))}</div><div class="fs">${x.g} ${t('gr')}</div><div class="fk">${fmt(x.kcal)}</div></div>`).join('')}
      <button class="btn ghost small" onclick="addPlanMeal('${m}')">+ ${t('toDiary')}</button></div>`;
  });
  const goalTxt = { lose: t('paceLose'), slow: t('paceSlow'), keep: t('paceKeep'), gain: t('paceGain') }[n.goal];
  return `
  <div class="card">
    <h2>🎯 ${t('yourNorm')}</h2>
    <div class="big">${num(n.target)} <small>${t('kcalDay')}</small></div>
    <p class="hint">${goalTxt}</p>
    ${n.underweight ? `<p class="res warnbox">${t('underweight')}</p>` : ''}
    <div class="stats3">
      <div><span>${t('protein')}</span><b>${n.prot}</b><small>${t('gr')}</small></div>
      <div><span>${t('fat')}</span><b>${n.fat}</b><small>${t('gr')}</small></div>
      <div><span>${t('carb')}</span><b>${n.carb}</b><small>${t('gr')}</small></div>
    </div>
    <div class="stats3">
      <div><span>${t('water')}</span><b>${(n.water / 1000).toFixed(1)}</b><small>${t('l')}</small></div>
      <div><span>BMI</span><b>${n.bmi.toFixed(1)}</b><small>${bmiCat(n.bmi)}</small></div>
      <div><span>${t('bmr')}</span><b>${fmt(n.bmr)}</b><small>${t('kcal')}</small></div>
    </div>
  </div>
  <div class="card">
    <h2>🍽️ ${t('perMeal')}</h2>
    <p class="hint">${t('perMealHint')}</p>
    ${MEALS.map(m => `<div class="pmrow" onclick="openMealAdvice('${m}')"><i class="mico m-${m}i">${MEAL_ICON[m]}</i><span>${t('meal_' + m)}<small>${t('time_' + m)}</small></span><b>${fmt(Math.round(n.target * MEAL_SHARE[m] / 10) * 10)} <small>${t('kcal')}</small></b><em>›</em></div>`).join('')}
  </div>
  <div class="card">
    <h2>🥗 ${t('menuTitle')}</h2>
    <p class="hint">${t('menuHint', fmt(plan.total))}</p>
    ${menu}
    <button class="btn primary" onclick="planSeed=(planSeed*7+13)%9973;store.set('planSeed',planSeed);render()">🔄 ${t('otherMenu')}</button>
  </div>
  <div class="card"><h2>💡 ${t('tipsTitle')}</h2><ul class="tips">${t('tips').split('|').map(x => `<li>${x}</li>`).join('')}</ul></div>
  <div class="card"><h3>🧮 ${t('howTitle')}</h3><p class="hint">${t('howText')}</p></div>`;
}
function addPlanMeal(m) {
  const plan = makePlan(norms(profile).target, planSeed);
  const save0 = curDate; curDate = todayStr();
  let sum = 0;
  plan.meals[m].forEach(x => { pushFood(FOODS[x.id], x.g, m); sum += x.kcal; });
  curDate = save0; save(); celebrate(sum);
}

// ---------- Profil ----------
function renderProfile() {
  const p = profile || { sex: 'm', age: '', height: '', weight: '', job: 'sit', goal: 'keep' };
  const ch = (name, val, opts) => `<div class="chips">${opts.map(o => `<button class="chip ${p[name] === o ? 'on' : ''}" onclick="pf('${name}','${o}',this)">${t(name + '_' + o)}</button>`).join('')}</div>`;
  const langs = `<div class="chips">${['uz', 'ru', 'en'].map(l => `<button class="chip ${lang === l ? 'on' : ''}" onclick="setLang('${l}')">${{ uz: "O'zbekcha", ru: 'Русский', en: 'English' }[l]}</button>`).join('')}</div>`;
  let extra = '';
  if (profile) {
    const wl = weights.slice(-30);
    extra = `
    <div class="card"><h3>⚖️ ${t('weightLog')}</h3>
      <div class="inrow"><input id="wkg" class="inp" type="number" inputmode="decimal" placeholder="${t('kg')}" value="${profile.weight}"><button class="btn small" onclick="addWeight()">+</button></div>
      ${wl.length > 1 ? weightChart(wl) : `<p class="hint">${t('weightHint')}</p>`}
      ${wl.slice(-5).reverse().map(w => `<div class="fitem small"><div class="fn">${dateLabel(w.d)}</div><div class="fk">${w.kg} ${t('kg')}</div></div>`).join('')}
    </div>
    <div class="card"><h3>💧 ${t('waterRemind')}</h3>
      <div class="chips">${[0, 1, 2, 3].map(h => `<button class="chip ${settings.water === h ? 'on' : ''}" onclick="setWaterRem(${h})">${h ? t('everyH', h) : t('off')}</button>`).join('')}</div>
    </div>
    <div class="card"><h3>❓ ${t('faqTitle')}</h3>${t('faq').split('|').map(q => { const [a, b] = q.split('=>'); return `<details class="faq"><summary>${a}</summary><p>${b}</p></details>`; }).join('')}</div>
    <div class="card"><h3>ℹ️ ${t('about')}</h3><p class="hint">${t('aboutText')}</p><p class="hint">${t('aiCredit')}</p>
      <button class="btn ghost danger" onclick="askReset()">${t('reset')}</button></div>`;
  }
  return `
  ${profile ? '' : `<div class="welcome"><div class="logo">🍽️</div><h1>Sog'lom Hayot</h1><p>${t('welcome')}</p></div>`}
  <div class="card"><h3>🌐 ${t('language')}</h3>${langs}</div>
  <div class="card">
    <h2>👤 ${t('aboutYou')}</h2>
    ${profile ? '' : `<p class="hint">${t('whyData')}</p>`}
    <label>${t('sex')}</label>${ch('sex', p.sex, ['m', 'f'])}
    <div class="row3">
      <div><label>${t('age')}</label><input id="pAge" class="inp" type="number" inputmode="numeric" value="${p.age}"></div>
      <div><label>${t('height')}</label><input id="pH" class="inp" type="number" inputmode="numeric" value="${p.height}"></div>
      <div><label>${t('weight')}</label><input id="pW" class="inp" type="number" inputmode="decimal" value="${p.weight}"></div>
    </div>
    <label>${t('job')}</label>${ch('job', p.job, ['sit', 'stand', 'heavy'])}
    <label>${t('goalQ')}</label>${ch('goal', p.goal, ['lose', 'slow', 'keep', 'gain'])}
    <label>${t('stepGoal')}</label><input id="pSG" class="inp" type="number" inputmode="numeric" value="${settings.stepGoal}">
    <button class="btn primary" onclick="saveProfile()">${profile ? t('save') : t('start')}</button>
  </div>${extra}`;
}
let pDraft = {};
function pf(name, val, el) {
  pDraft[name] = val;
  el.parentNode.querySelectorAll('.chip').forEach(b => b.classList.remove('on'));
  el.classList.add('on');
}
function saveProfile() {
  const base = profile || { sex: 'm', job: 'sit', goal: 'keep' };
  const p = Object.assign({}, base, pDraft);
  p.age = parseInt($('#pAge').value); p.height = parseFloat($('#pH').value); p.weight = parseFloat(String($('#pW').value).replace(',', '.'));
  if (!(p.age >= 10 && p.age <= 100) || !(p.height >= 100 && p.height <= 230) || !(p.weight >= 25 && p.weight <= 300)) { toast(t('checkData')); return; }
  settings.stepGoal = Math.max(1000, parseInt($('#pSG').value) || 10000);
  store.set('settings', settings);
  const first = !profile;
  profile = p; pDraft = {};
  store.set('profile', profile);
  if (first || !weights.length) { weights.push({ d: todayStr(), kg: p.weight }); store.set('weights', weights); }
  toast(t('saved'));
  go(first ? 'home' : 'profile');
}
function addWeight() {
  const kg = parseFloat(String($('#wkg').value).replace(',', '.'));
  if (!(kg >= 25 && kg <= 300)) return;
  const d = todayStr();
  weights = weights.filter(w => w.d !== d); weights.push({ d, kg }); weights.sort((a, b) => a.d < b.d ? -1 : 1);
  store.set('weights', weights);
  profile.weight = kg; store.set('profile', profile);
  render();
}
function weightChart(ws) {
  const W = 320, H = 120, min = Math.min(...ws.map(w => w.kg)) - 1, max = Math.max(...ws.map(w => w.kg)) + 1;
  const pts = ws.map((w, i) => [10 + i * (W - 20) / (ws.length - 1), 10 + (max - w.kg) / (max - min) * (H - 20)]);
  return `<svg viewBox="0 0 ${W} ${H}" class="chart"><polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="var(--pri2)" stroke-width="3" stroke-linejoin="round"/>
    ${pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="var(--pri)"/>`).join('')}
    <text x="4" y="12" font-size="10" fill="var(--muted)">${max.toFixed(0)}</text><text x="4" y="${H - 2}" font-size="10" fill="var(--muted)">${min.toFixed(0)}</text></svg>`;
}
function setWaterRem(h) {
  settings.water = h; store.set('settings', settings);
  if (AND) AND.setWater(h);
  render();
}
function askReset() {
  openModal(`<h2>${t('reset')}</h2><p>${t('resetQ')}</p>
    <button class="btn primary danger" onclick="doReset()">${t('delete')}</button><button class="btn ghost" onclick="closeModal()">${t('cancel')}</button>`);
}
function doReset() {
  ['profile', 'days', 'weights', 'custom', 'settings', 'planSeed'].forEach(k => localStorage.removeItem('sh_' + k));
  location.reload();
}

function setLang(l) {
  lang = l; store.set('lang', l);
  if (AND) AND.setTexts(JSON.stringify({ stepsChannel: t('n_stepsCh'), stepsTitle: t('n_stepsTitle'), stepsText: t('n_stepsText'),
    waterChannel: t('n_waterCh'), waterTitle: t('n_waterTitle'), waterText: t('n_waterText') }));
  document.documentElement.lang = l;
  render(true);
}

function toast(msg, action, fn) {
  const e = $('#toast');
  e.innerHTML = esc(msg) + (action ? ` <button>${esc(action)}</button>` : '');
  if (action) e.querySelector('button').onclick = () => { e.classList.remove('show'); fn(); };
  e.classList.add('show');
  clearTimeout(toast.tm); toast.tm = setTimeout(() => e.classList.remove('show'), action ? 4500 : 1800);
}

let lastToday = todayStr();
window.onAppResume = function () {
  if (curDate === lastToday && lastToday !== todayStr()) curDate = todayStr();
  lastToday = todayStr();
  if (!modalOpen && profile && (tab === 'home' || tab === 'activity')) render();
};
window.onStepsState = function () { render(); };

// ---------- Ishga tushirish ----------
(function init() {
  if (!lang) {
    const nl = (navigator.language || 'uz').slice(0, 2);
    lang = nl === 'ru' ? 'ru' : nl === 'en' ? 'en' : 'uz';
  }
  setLang(lang);
  if (profile) store.set('intro', true);
  setInterval(() => { if (!modalOpen && profile && (tab === 'home' || tab === 'activity') && document.activeElement.tagName !== 'INPUT') render(); }, 15000);
})();
