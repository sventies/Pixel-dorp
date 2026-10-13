// Smoke test for the exercise generators in index.html.
// Usage: node tools/check-generators.js
// Extracts the inline <script>, syntax-checks it, then runs every reading generator
// for every kern (0-12) and every math generator for every blok (0-8) many times,
// checking that each multiple-choice exercise has a valid answer and no duplicate options.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const js = src.split('<script>')[1].split('</script>')[0];
new Function(js); // throws on syntax error

// Only evaluate the pure part (helpers, sprites, curriculum, generators).
const part = js.split('/* ---------- kid model')[0];
global.window = {};
global.document = { createElement: () => ({ getContext: () => ({}), toDataURL: () => '' }) };

const N = 300;
eval(part + `
let errs = 0; const seen = new Set();
const check = (e, tag) => {
  seen.add(e.key);
  if (e.kind === 'choice') {
    if (e.ans < 0) throw Error(tag + ' ' + e.key + ': no correct option');
    const labels = e.opts.map(o => o.html);
    if (new Set(labels).size !== labels.length) throw Error(tag + ' ' + e.key + ': duplicate options ' + JSON.stringify(labels));
  }
};
for (let lv = 0; lv < L_LEVELS.length; lv++) for (let i = 0; i < N; i++) {
  try { check(genL(lv), 'L' + lv); } catch (x) { if (errs++ < 10) console.log(x.message); }
}
for (let b = 0; b < R_BLOK.length; b++) for (let i = 0; i < N; i++) {
  try { check(genR(b), 'R' + b); } catch (x) { if (errs++ < 10) console.log(x.message); }
}
console.log('exercise types seen:', seen.size, '| words:', WORDS.length, '| errors:', errs);
process.exitCode = errs ? 1 : 0;
`);
