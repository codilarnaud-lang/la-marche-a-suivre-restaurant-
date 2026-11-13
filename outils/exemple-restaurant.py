#!/usr/bin/env python3
"""Génère les données d'exemple de La marge à suivre : une brasserie fictive sur trois mois.

Les factures sont calculées à partir des recettes et des ventes (consommation théorique),
avec une surconsommation choisie par ingrédient et un arrondi au conditionnement :
les écarts affichés par le logiciel sont donc cohérents.

Usage : python3 outils/exemple-restaurant.py  (remplace la ligne « const SEED=… » de LaMargeASuivre.html)
"""
import json, math, re
from pathlib import Path

racine = Path(__file__).resolve().parent.parent

# id, nom, unité, contenu (g ou pièces), prix HT août, prix HT octobre, rendement, fournisseur, options
ING = [
    ("bavette", "Bavette d'aloyau", "kg", 1000, 22.50, 23.40, 1.0, "B", {}),
    ("poulet", "Suprême de volaille", "kg", 1000, 13.20, 13.50, 1.0, "B", {}),
    ("saumon", "Pavé de saumon", "kg", 1000, 27.00, 29.20, 1.0, "M", {}),
    ("pdt", "Pommes de terre", "sac 10 kg", 10000, 12.00, 12.40, 0.8, "P", {}),
    ("echalote", "Échalotes", "filet 5 kg", 5000, 15.50, 15.50, 0.85, "P", {}),
    ("carotte", "Carottes", "sac 5 kg", 5000, 7.50, 7.80, 0.85, "P", {}),
    ("poireau", "Poireaux", "kg", 1000, 3.20, 3.40, 0.6, "P", {}),
    ("mesclun", "Mesclun", "kg", 1000, 12.00, 12.00, 1.0, "P", {}),
    ("pomme", "Pommes golden", "caisse 6 kg", 6000, 16.00, 16.00, 0.8, "P", {}),
    ("chevre", "Bûche de chèvre", "kg", 1000, 17.00, 17.00, 1.0, "G", {}),
    ("beurre", "Beurre doux", "carton 10 kg", 10000, 110.00, 118.00, 1.0, "G", {}),
    ("creme", "Crème fraîche 30 %", "brique 1 L", 1000, 5.60, 5.70, 1.0, "G", {}),
    ("lait", "Lait entier", "pack 6 L", 6000, 5.70, 5.70, 1.0, "G", {}),
    ("oeufs", "Œufs plein air", "plateau 30", 30, 9.60, 9.90, 1.0, "G", {"pc": True}),
    ("farine", "Farine T55", "sac 25 kg", 25000, 19.00, 19.00, 1.0, "G", {}),
    ("sucre", "Sucre semoule", "sac 10 kg", 10000, 12.00, 12.00, 1.0, "G", {}),
    ("choco", "Chocolat noir 64 %", "sachet 1 kg", 1000, 17.00, 17.00, 1.0, "G", {}),
    ("fond", "Fond de veau déshydraté", "boîte 600 g", 600, 14.00, 14.00, 1.0, "G", {}),
    ("parmesan", "Parmesan", "kg", 1000, 25.00, 25.00, 1.0, "G", {}),
    ("tournesol", "Huile de tournesol", "bidon 5 L", 5000, 11.00, 11.00, 1.0, "G", {}),
    ("olive", "Huile d'olive vierge extra", "bidon 5 L", 5000, 31.50, 31.50, 1.0, "G", {}),
    ("vinaigre", "Vinaigre balsamique", "bouteille 1 L", 1000, 6.20, 6.20, 1.0, "G", {}),
    ("moutarde", "Moutarde de Dijon", "pot 1 kg", 1000, 4.10, 4.10, 1.0, "G", {}),
    ("coca", "Coca-Cola 33 cl", "pack 24", 24, 13.90, 13.90, 1.0, "G", {"hr": True}),
    ("vaisselle", "Produit vaisselle", "bidon 5 L", 5000, 18.00, 18.00, 1.0, "G", {"hr": True}),
]
PREPS = [
    {"id": "psauce", "nom": "Sauce échalote", "y": 600, "l": [("echalote", 300), ("fond", 60), ("beurre", 100), ("creme", 200)]},
    {"id": "pvin", "nom": "Vinaigrette maison", "y": None, "l": [("olive", 300), ("vinaigre", 100), ("moutarde", 30)]},
    {"id": "ppate", "nom": "Pâte brisée", "y": 850, "l": [("farine", 500), ("beurre", 250), ("oeufs", 1), ("sucre", 20)]},
]
# nom, catégorie, prix TTC, lignes
RECS = [
    ("Salade de chèvre chaud", "Entrées", 9.50, [("mesclun", 60), ("chevre", 60), ("pvin", 25)]),
    ("Velouté de poireaux", "Entrées", 7.50, [("poireau", 150), ("pdt", 80), ("creme", 30), ("beurre", 10)]),
    ("Œufs cocotte au parmesan", "Entrées", 8.00, [("oeufs", 2), ("creme", 40), ("parmesan", 10)]),
    ("Bavette sauce échalote, frites", "Plats", 19.80, [("bavette", 180), ("pdt", 250), ("tournesol", 15), ("psauce", 40), ("mesclun", 20)]),
    ("Suprême de volaille, purée", "Plats", 17.50, [("poulet", 180), ("pdt", 220), ("lait", 60), ("beurre", 20), ("creme", 20)]),
    ("Pavé de saumon, légumes glacés", "Plats", 21.00, [("saumon", 160), ("carotte", 120), ("poireau", 80), ("beurre", 15), ("creme", 30)]),
    ("Tarte fine aux pommes", "Desserts", 7.50, [("ppate", 80), ("pomme", 150), ("sucre", 15), ("beurre", 10)]),
    ("Mousse au chocolat", "Desserts", 7.00, [("choco", 60), ("oeufs", 2), ("sucre", 10)]),
    ("Crème brûlée", "Desserts", 7.00, [("creme", 120), ("oeufs", 2), ("sucre", 25), ("lait", 30)]),
]
FORMULES = [
    ("Formule midi (entrée + plat)", 19.90, ["Entrées", "Plats"]),
    ("Menu du soir (entrée + plat + dessert)", 29.00, ["Entrées", "Plats", "Desserts"]),
]
MOIS = ["2026-08", "2026-09", "2026-10"]
# ventes à la carte et en formule par mois (août plus fort, octobre plus calme)
VENTES = {
    "Salade de chèvre chaud": [260, 235, 210], "Velouté de poireaux": [120, 170, 230], "Œufs cocotte au parmesan": [180, 165, 150],
    "Bavette sauce échalote, frites": [560, 520, 490], "Suprême de volaille, purée": [380, 360, 345], "Pavé de saumon, légumes glacés": [330, 300, 280],
    "Tarte fine aux pommes": [260, 280, 300], "Mousse au chocolat": [230, 215, 200], "Crème brûlée": [210, 195, 185],
    "Formule midi (entrée + plat)": [720, 760, 700], "Menu du soir (entrée + plat + dessert)": [260, 240, 220],
}
COUVERTS = [2440, 2380, 2250]
# surconsommation constatée (achats ÷ théorie − 1) : bavette et crème trop généreuses, le reste proche des pertes ordinaires
SUR = {"bavette": 0.13, "creme": 0.11, "saumon": 0.03, "choco": 0.05, "pdt": 0.05}
SUR_DEFAUT = 0.035

ing = {i[0]: i for i in ING}
prep = {p["id"]: p for p in PREPS}

def prep_yield(p):
    return p["y"] or sum(g for _, g in p["l"])

def raw(lines, f=1.0):
    out = {}
    for i, g in lines:
        if i in ing:
            out[i] = out.get(i, 0) + g * f
        else:
            p = prep[i]
            for j, h in raw(p["l"], g * f / prep_yield(p)).items():
                out[j] = out.get(j, 0) + h
    return out

recs = {r[0]: r for r in RECS}
def theo_mois(k):
    t = {}
    carte = {n: VENTES[n][k] for n in recs}
    def add(lines, q):
        for i, g in raw(lines).items():
            t[i] = t.get(i, 0) + q * g / ing[i][6]
    for n, q in carte.items():
        add(recs[n][3], q)
    for nom, _, cats in FORMULES:
        q = VENTES[nom][k]
        for c in cats:
            ch = [n for n in recs if recs[n][1] == c]
            tot = sum(carte[n] for n in ch)
            for n in ch:
                add(recs[n][3], q * carte[n] / tot)
    return t

def prix(i, k):
    a, b = ing[i][4], ing[i][5]
    return round(a + (b - a) * k / 2, 2)

FOURN = {"B": "BOUCHERIE EXEMPLE", "M": "MARÉE EXEMPLE SAS", "P": "PRIMEUR EXEMPLE", "G": "GROSSISTE EXEMPLE SARL"}
docs, n_fact = [], 100
# ce qui reste d'un conditionnement entamé passe au mois suivant, comme en cuisine ; il est compté à l'inventaire
# de fin de mois (onglet Stocks). Stock d'ouverture fin juillet : un quart de conditionnement de chaque produit.
OUVERT = "2026-07"
reste = {i: ing[i][3] * 0.25 for i in ing if ing[i][2] != "kg" and not ing[i][8].get("hr")}
inv = {OUVERT: {i: {"q": 0.25, "p": prix(i, 0)} for i in reste}}
for k, m in enumerate(MOIS):
    t = theo_mois(k)
    besoin = {}
    for i in ing:
        if ing[i][8].get("hr"):
            continue
        g = t.get(i, 0) * (1 + SUR.get(i, SUR_DEFAUT))
        u = ing[i][3]
        if ing[i][2] == "kg":
            q = round(g / u, 1)
        else:
            q = max(0, math.ceil((g - reste.get(i, 0)) / u - 1e-9))
            reste[i] = reste.get(i, 0) + q * u - g
        if q > 0:
            besoin[i] = q
    inv[m] = {i: {"q": round(r / ing[i][3], 2), "p": prix(i, k)} for i, r in reste.items() if r > 1e-6}
    besoin["coca"] = [14, 13, 11][k]
    besoin["vaisselle"] = 2
    # deux livraisons par mois pour la boucherie, le primeur et le grossiste ; une pour la marée
    for f, nliv in (("B", 2), ("M", 1), ("P", 2), ("G", 2)):
        items = [i for i in besoin if ing[i][7] == f]
        for liv in range(nliv):
            lignes = []
            for i in items:
                q = besoin[i]
                part = q / nliv if ing[i][2] == "kg" else (q // nliv + (1 if liv < q % nliv else 0))
                part = round(part, 1) if ing[i][2] == "kg" else int(part)
                if part <= 0:
                    continue
                lignes.append({"i": i, "q": part, "ht": round(part * prix(i, k), 2)})
            if not lignes:
                continue
            n_fact += 1
            jour = 6 + liv * 14 + "BMPG".index(f)
            ref = f"{f}X-2026-{n_fact:04d}"
            docs.append({"id": "f" + ref, "type": "achat", "date": f"{m}-{jour:02d}", "ref": ref, "fourn": FOURN[f], "l": lignes})
    docs.append({"id": "v" + m, "type": "vente", "date": f"{m}-28", "ref": f"Z de caisse {m}", "fourn": "Caisse",
                 "l": [{"p": n, "q": VENTES[n][k]} for n in VENTES]})

seed = {
    "nom": "Brasserie Exemple (fictif)", "tva": 10, "seuil": 10, "volmin": 20000, "perte": 4, "cible": None,
    "cad": {"perso": 30500, "loyer": 4500, "energie": 2600, "autres": 3200, "emprunt": 1500, "verse": 3500},
    "var": {"plat": 0, "com": 0, "cb": 1},
    "bois": {"ca": 16000, "ratio": 26},
    "cats": ["Entrées", "Plats", "Desserts"],
    "ings": [dict({"id": i, "nom": n, "unite": u, "g": g, "prix": b, "rend": r, "tva": 20 if o.get("hr") else 5.5}, **o)
             for i, n, u, g, a, b, r, f, o in ING],
    "preps": [{"id": p["id"], "nom": p["nom"], "y": p["y"], "l": [{"i": i, "g": g} for i, g in p["l"]]} for p in PREPS],
    "recs": [{"nom": n, "cat": c, "ttc": t, "l": [{"i": i, "g": g} for i, g in l]} for n, c, t, l in RECS]
          + [{"nom": n, "kind": "formule", "cat": "Formules", "ttc": t, "slots": [{"cat": c, "choix": []} for c in cs]} for n, t, cs in FORMULES],
    "docs": docs,
    "couv": dict(zip(MOIS, COUVERTS)),
    "inv": inv,
    "sim": {},
}
dest = racine / "LaMargeASuivre.html"
html = dest.read_text(encoding="utf-8")
ligne = "const SEED=" + json.dumps(seed, ensure_ascii=False, separators=(",", ":")) + ";"
html, n = re.subn(r"^const SEED=.*;$", lambda _: ligne, html, count=1, flags=re.M)
assert n == 1
dest.write_text(html, encoding="utf-8")
print(f"{len(docs)} documents, {len(ING)} ingrédients, {len(PREPS)} préparations, {len(RECS)} produits, {len(FORMULES)} formules")
