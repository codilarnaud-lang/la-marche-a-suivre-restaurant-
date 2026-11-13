// Charge le logiciel (LaMargeASuivre.html) dans Node, sans navigateur : le script de la page tourne
// dans un contexte isolé avec un document et un stockage factices. Les fonctions de calcul et de rendu
// sont ensuite appelées directement.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

// options.claude : faux objet window.claude (voir fausseBase) pour tester la sauvegarde en ligne
function charger(options = {}) {
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
    location: { hash: '', protocol: options.claude ? 'https:' : 'file:' },
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    navigator: {}, addEventListener() {}, scrollY: 0, scrollTo() {},
  };
  ctx.window = ctx;
  if (options.claude) ctx.claude = options.claude;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'LaMargeASuivre.html' });
  // run('expression') évalue dans la page ; val('expression') renvoie une copie JSON utilisable par assert
  const run = c => vm.runInContext(c, ctx);
  const val = c => JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', ctx));
  return { run, val, store };
}

// Fausse base Claude partagée entre plusieurs pages : refuse, comme la vraie, un document de plus de 256 Kio.
function fausseBase() {
  const docs = new Map(), ecritures = [];
  const ref = chemin => ({
    get: async () => { const v = docs.get(chemin); return { exists: v !== undefined, data: () => (v === undefined ? undefined : JSON.parse(v)) }; },
    set: async o => { const j = JSON.stringify(o); if (Buffer.byteLength(j) > 262144) { const e = new Error('document trop gros'); e.code = 'invalid_argument'; throw e; } docs.set(chemin, j); ecritures.push(chemin); },
    delete: async () => { docs.delete(chemin); },
  });
  const db = { doc: ref, collection: c => ({ doc: id => ref(c + '/' + id) }) };
  const user = { id: async () => 'u1' };
  return { docs, ecritures, claude: { use: async n => (n === 'db' ? db : n === 'user' ? user : null) } };
}
const attendre = ms => new Promise(r => setTimeout(r, ms));

module.exports = { charger, fausseBase, attendre };
