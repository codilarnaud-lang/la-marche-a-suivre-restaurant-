// Charge le logiciel (LaMargeASuivre.html) dans Node, sans navigateur : le script de la page tourne
// dans un contexte isolé avec un document et un stockage factices. Les fonctions de calcul et de rendu
// sont ensuite appelées directement.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function charger() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'LaMargeASuivre.html'), 'utf8');
  const code = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];
  const els = {};
  const el = () => ({ innerHTML: '', textContent: '', value: '', dataset: {}, children: [],
    classList: { add() {}, remove() {} }, content: { cloneNode: () => ({}) },
    appendChild() {}, closest: () => null, focus() {} });
  const store = {};
  const ctx = {
    console, setTimeout, clearTimeout,
    document: { querySelector: s => els[s] || (els[s] = el()), querySelectorAll: () => [],
      addEventListener() {}, createElement: el, body: el(), activeElement: null },
    location: { hash: '', protocol: 'file:' },
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    navigator: {}, addEventListener() {}, scrollY: 0, scrollTo() {},
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'LaMargeASuivre.html' });
  // run('expression') évalue dans la page ; val('expression') renvoie une copie JSON utilisable par assert
  const run = c => vm.runInContext(c, ctx);
  const val = c => JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', ctx));
  return { run, val, store };
}

module.exports = { charger };
