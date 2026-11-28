// Matnni tushunish dasturini tekshirish: node tests/parser_test.js
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const A = path.join(__dirname, '..', 'app', 'src', 'main', 'assets');
vm.runInThisContext(fs.readFileSync(path.join(A, 'foods.js'), 'utf8') + '\n' +
  fs.readFileSync(path.join(A, 'core.js'), 'utf8').replace(/if \(typeof module[\s\S]*$/, ''));
loadFoods();
let ok = 0, bad = 0;
const lines = fs.readFileSync(path.join(__dirname, 'parser_cases.txt'), 'utf8').split('\n');
for (const line of lines) {
  if (!line.trim() || line.startsWith('#')) continue;
  const [text, exp] = line.split('=>').map(s => s.trim());
  const want = exp.split(';').map(x => { const [id, g] = x.trim().split('*'); return { id, g: +g }; });
  const r = parseMeal(text);
  const got = r.items.map(it => ({ id: it.food.id, g: Math.round(gramsOf(it.food, it.qty, it.unit)) }));
  const pass = got.length === want.length && want.every((w, i) => got[i].id === w.id && Math.abs(got[i].g - w.g) <= 2);
  if (pass) ok++;
  else {
    bad++;
    console.log('XATO:', text, '\n   kutilgan:', want.map(w => w.id + '*' + w.g).join('; '),
      '\n   chiqdi:  ', got.map(w => w.id + '*' + w.g).join('; '), r.unknown.length ? ' | tanilmadi: ' + r.unknown : '');
  }
}
console.log(`\n${ok} to'g'ri, ${bad} xato (${Math.round(ok / (ok + bad) * 100)}%)`);
process.exit(bad ? 1 : 0);
