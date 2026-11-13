// Tests des calculs de La marge à suivre. Lancer : node --test tests/
// Les valeurs attendues sont vérifiées à la main (le détail est en commentaire) ou découlent de la façon
// dont les données d'exemple sont construites (outils/exemple-restaurant.py : bavette +13 %, crème +11 %).
const test = require('node:test');
const assert = require('node:assert');
const { charger } = require('./charger.js');

const proche = (v, attendu, tol = 0.01, msg) => assert.ok(Math.abs(v - attendu) <= tol, `${msg || ''} ${v} au lieu de ${attendu}`);

test('brasserie d\'exemple : ratios, cible et couverts', () => {
  const { val } = charger();
  const r = val(`(()=>{const d=D(),c=cible(d),r=calc(d,'all');return {cible:c.val,src:c.src,reel:r.ratioReel,theo:r.ratioTheo,ca:r.ca,couv:r.couv,hr:r.horsRatio,stk:r.stk}})()`);
  proche(r.cible, 29.90, 0.01, 'cible');
  assert.strictEqual(r.src, 'calcul');
  proche(r.reel, 28.94, 0.01, 'ratio réel');
  proche(r.theo, 27.68, 0.01, 'ratio théorique');
  proche(r.ca, 148134.55, 0.01, 'CA');
  assert.strictEqual(r.couv, 2440 + 2380 + 2250);
  proche(r.stk, -41.47, 0.01, 'variation de stock');
  assert.ok(r.hr > 600, 'boissons et entretien hors ratio');
});

test('écarts : seules les surconsommations construites ressortent', () => {
  const { val } = charger();
  const e = val(`Object.fromEntries(calc(D(),'all').ecarts.map(e=>[e.i.id,{ec:e.ec,al:e.al}]))`);
  proche(e.bavette.ec, 13.0, 0.05, 'bavette');
  proche(e.creme.ec, 11.0, 0.05, 'crème');
  assert.strictEqual(e.bavette.al, 'bd');
  assert.strictEqual(e.creme.al, 'bd');
  for (const [id, x] of Object.entries(e)) if (!['bavette', 'creme'].includes(id) && x.al !== 'na') assert.notStrictEqual(x.al, 'bd', id);
  assert.ok(!('coca' in e), 'les boissons hors ratio ne sont pas dans les écarts');
});

test('préparation de base : coût au kilo', () => {
  const { val } = charger();
  // Sauce échalote, prix d'octobre : échalotes 300 g × 15,50 €/5 kg ÷ 0,85 + fond 60 g × 14 €/600 g
  // + beurre 100 g × 118 €/10 kg + crème 200 g × 5,70 €/L = 4,8141 € pour 600 g obtenus = 8,0235 €/kg
  const attendu = (300 * 15.5 / 5000 / 0.85 + 60 * 14 / 600 + 100 * 118 / 10000 + 200 * 5.7 / 1000) / 600 * 1000;
  proche(val(`calc(D(),'all').preps.psauce.cg*1000`), attendu, 1e-6, 'sauce échalote');
  proche(attendu, 8.0235, 0.0001);
});

test('ratio par catégorie : les plats dépassent la cible', () => {
  const { val } = charger();
  const c = val(`(()=>{const r=calc(D(),'all');return {cats:r.cats,cible:cible(D()).val,ca:r.ca}})()`);
  assert.ok(c.cats.Plats.ratioR > c.cible);
  assert.ok(c.cats.Desserts.ratioR < c.cible);
  const somme = Object.values(c.cats).reduce((s, o) => s + o.ca, 0);
  proche(somme, c.ca, 0.01, 'le CA réparti par catégorie redonne le CA total');
});

test('formule : CA d\'une vente et restriction d\'un créneau', () => {
  const { run, val } = charger();
  run(`D().docs.push({id:'t1',type:'vente',date:'2026-11-28',l:[{p:'Formule midi (entrée + plat)',q:50}]})`);
  proche(val(`calc(D(),'2026-11').ca`), 50 * 19.9 / 1.1, 0.001, '50 formules à 19,90 € TTC');
  const avant = val(`calc(D(),'all').pizzas['Formule midi (entrée + plat)'].cost`);
  run(`D().recs.find(r=>r.nom==='Formule midi (entrée + plat)').slots[1].choix=['Suprême de volaille, purée']`);
  const apres = val(`calc(D(),'all').pizzas['Formule midi (entrée + plat)'].cost`);
  const supreme = val(`calc(D(),'all').pizzas['Suprême de volaille, purée'].cost`);
  const entree = val(`calc(D(),'all').pizzas['Formule midi (entrée + plat)'].mix[0].reduce((s,{n,w})=>s+w*calc(D(),'all').pizzas[n].cost,0)`);
  proche(apres, entree + supreme, 1e-9, 'coût = entrée moyenne + suprême');
  assert.ok(apres < avant);
});

test('recettes figées : modifier une fiche ou une préparation ne réécrit pas le passé', () => {
  const { run, val } = charger();
  const aout = () => val(`calc(D(),'2026-08').ratioTheo`);
  const t0 = aout();
  run(`editRecette(D(),'Bavette sauce échalote, frites',r=>r.l[0].g=220)`);
  proche(aout(), t0, 1e-9, 'après la recette');
  run(`editPrep(D(),'psauce',p=>p.y=400)`);
  proche(aout(), t0, 1e-9, 'après la préparation');
  run(`D().docs.push({id:'t2',type:'vente',date:'2026-11-28',l:[{p:'Bavette sauce échalote, frites',q:10}]})`);
  assert.ok(val(`calc(D(),'2026-11').pizzas['Bavette sauce échalote, frites'].cost`) > val(`calc(D(),'2026-08').pizzas['Bavette sauce échalote, frites'].cost`) - 1, 'la fiche actuelle sert pour les nouvelles ventes');
  run(`D().docs.forEach(x=>{if(x.type==='vente')x.l.forEach(l=>{if(l.p==='Bavette sauce échalote, frites')delete l.rl})})`);
  assert.ok(aout() > t0, 'appliquer la recette actuelle au passé change bien le passé');
});

test('prix figés : changer la carte ne change pas le CA passé', () => {
  const { run, val } = charger();
  const ca0 = val(`calc(D(),'2026-08').ca`);
  run(`D().recs.forEach(r=>{logPrix(D(),r.nom,r.ttc,r.ttc+1);r.ttc+=1})`);
  proche(val(`calc(D(),'2026-08').ca`), ca0, 1e-6);
});

test('cible : les boissons paient une partie des charges (exemple du guide)', () => {
  const { run, val } = charger();
  // CA alimentaire 540 000 €, boissons 180 000 €, charges 41 000 €/mois, frais 1 %, boissons achetées 25 %
  // (720 000 − 492 000 − 7 200 − 45 000) ÷ 540 000 = 32,56 % ; sans boissons : 100 − 91,11 − 1 = 7,89 %
  run(`var t=JSON.parse(JSON.stringify(D()));t.docs=[{type:'vente',date:'2026-01-28',l:[{p:'X',q:1,pu:49500}]}];t.recs=[{nom:'X',cat:'Plats',ttc:49500,l:[]}];t.cad={perso:41000};t.var={cb:1};t.bois={ca:15000,ratio:25}`);
  proche(val(`cible(t).calc`), 32.56, 0.005);
  run(`t.bois={ca:0}`);
  proche(val(`cible(t).calc`), 7.89, 0.005);
});

test('stock : inventaires et ratio réel', () => {
  const { run, val } = charger();
  const r = val(`(()=>{const d=D(),r=calc(d,'2026-09');return {achats:r.achatsHT,conso:r.conso,s0:stockVal(d,'2026-08'),s1:stockVal(d,'2026-09'),ca:r.ca,ratio:r.ratioReel}})()`);
  proche(r.conso, r.achats + r.s0 - r.s1, 1e-6, 'consommation = achats + stock début − stock fin');
  proche(r.ratio, r.conso / r.ca * 100, 1e-9);
  run(`delete D().inv['2026-08']`);
  assert.strictEqual(val(`calc(D(),'2026-09').stk`), null, 'sans stock de début, pas de correction');
});

test('migration : une sauvegarde RatioPizza reste lisible', () => {
  const { run, val } = charger();
  run(`var v1={cur:'a',t:1,clients:{a:{nom:'Pizzeria',tva:10,seuil:10,volmin:20000,perte:4,cad:{perso:0},ings:[{id:'m',nom:'Mozza',unite:'kg',g:1000,prix:10,rend:1}],recs:[{nom:'Reine',ttc:11,l:[{i:'m',g:100}]}],docs:[{type:'vente',date:'2026-01-28',l:[{p:'Reine',q:10}]}],sim:{}}}};migrate(v1)`);
  assert.strictEqual(val(`v1.clients.a.recs[0].cat`), 'Pizzas');
  assert.deepStrictEqual(val(`v1.clients.a.cats`), ['Pizzas']);
  assert.strictEqual(val(`v1.v`), 2);
  proche(val(`calc(v1.clients.a,'all').ca`), 100, 1e-9);
});

test('tous les écrans se dessinent sans erreur', () => {
  const { run } = charger();
  for (const v of ['tableau', 'documents', 'stocks', 'fiches', 'ecarts', 'pesees', 'historique', 'simulation', 'cadrage', 'donnees', 'guide']) run(`view='${v}';render0()`);
  run(`view='fiches';ficheMode='preps';render0();ficheMode='carte';rec='Menu du soir (entrée + plat + dessert)';render0()`);
  run(`period='2026-09';view='tableau';render0()`);
});

test('produit sans fiche : part du CA signalée', () => {
  const { run, val } = charger();
  assert.strictEqual(val(`calc(D(),'all').caSansFiche`), 0);
  // plat du jour sans recette, 100 ventes à 16,50 € TTC = 1 500 € HT
  run(`D().recs.push({nom:'Plat du jour',cat:'Plats',ttc:16.5,l:[]});D().docs.push({id:'t3',type:'vente',date:'2026-10-28',l:[{p:'Plat du jour',q:100}]})`);
  const r = val(`(()=>{const r=calc(D(),'2026-10');return {sf:r.caSansFiche,part:r.partSansFiche,ca:r.ca}})()`);
  assert.ok(r.sf >= 1500 - 1e-6, 'le CA direct du plat du jour est compté');
  assert.ok(r.sf > 1500, 'et sa part dans les formules aussi');
  proche(r.part, r.sf / r.ca * 100, 1e-9);
  run(`view='tableau';render0()`);
  assert.match(val(`document.querySelector('#main').innerHTML`), /Produits sans fiche technique/);
});

test('formules comptées deux fois : plus de plats que de couverts', () => {
  const { run, val } = charger();
  const alerte = () => val(`qualite(D()).filter(q=>/couverts/.test(q.txt)).map(q=>q.txt)`);
  assert.deepStrictEqual(alerte(), [], 'aucune alerte sur l\'exemple');
  // le Z d'octobre liste aussi les plats choisis dans les 920 formules d'octobre
  run(`D().docs.find(x=>x.id==='v2026-10').l.push({p:'Bavette sauce échalote, frites',q:420},{p:'Suprême de volaille, purée',q:300},{p:'Pavé de saumon, légumes glacés',q:200})`);
  const a = alerte();
  assert.strictEqual(a.length, 1);
  assert.match(a[0], /oct\. 2026/);
  // les milliers sont séparés par une espace insécable fine (format français) : \s la reconnaît
  assert.match(a[0], /2\s955 plats vendus pour 2\s250 couverts/);
});

test('libellés mémorisés : reconnus, renommés, oubliés', () => {
  const { run, val } = charger();
  assert.strictEqual(val(`aliasIng(D(),'BAVETTE ALOYAU VBF S/V KG')`), null);
  run(`remember(D(),'ing','BAVETTE ALOYAU VBF S/V KG','bavette');remember(D(),'prod','MENU MIDI','Formule midi (entrée + plat)')`);
  assert.strictEqual(val(`aliasIng(D(),'Bavette aloyau VBF s/v kg').id`), 'bavette', 'casse et ponctuation ignorées');
  assert.strictEqual(val(`aliasPz(D(),'menu midi').nom`), 'Formule midi (entrée + plat)');
  // un libellé déjà reconnu par son nom n'encombre pas la liste
  run(`remember(D(),'ing','Beurre doux','beurre')`);
  assert.strictEqual(val(`Object.keys(D().alias.ing).length`), 1);
  // renommer le produit suit le libellé
  run(`var d=D(),r=d.recs.find(x=>x.nom==='Formule midi (entrée + plat)');Object.keys(d.alias.prod).forEach(k=>{if(d.alias.prod[k]===r.nom)d.alias.prod[k]='Formule déjeuner'});r.nom='Formule déjeuner'`);
  assert.strictEqual(val(`aliasPz(D(),'MENU MIDI').nom`), 'Formule déjeuner');
  run(`view='donnees';render0()`);
  assert.match(val(`document.querySelector('#main').innerHTML`), /Libellés mémorisés/);
});
