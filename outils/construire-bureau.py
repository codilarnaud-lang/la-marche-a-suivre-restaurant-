#!/usr/bin/env python3
"""Construit LaMargeASuivre-bureau.html : la version à enregistrer sur un ordinateur.

- Document HTML complet (la version Claude reçoit son squelette à la publication).
- jsPDF intégré au fichier : le bilan PDF fonctionne sans internet.
- pdf.js et xlsx retirés : ils ne servent qu'à la lecture automatique, qui demande Claude.

Usage : python3 outils/construire-bureau.py
"""
from pathlib import Path

racine = Path(__file__).resolve().parent.parent
src = (racine / "LaMargeASuivre.html").read_text(encoding="utf-8")
jspdf = (racine / "vendor" / "jspdf-2.5.1.umd.min.js").read_text(encoding="utf-8")
assert "</script" not in jspdf.lower()

cdn = {
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>':
        "<script>/* jsPDF 2.5.1, licence MIT */\n" + jspdf + "\n</script>",
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>': "",
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"></script>': "",
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>': "",
}
for ancien, nouveau in cdn.items():
    assert src.count(ancien) == 1, ancien
    src = src.replace(ancien, nouveau)
src = src.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', "")

page = ('<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
        '<style>body{margin:0}[hidden]{display:none!important}</style>\n</head>\n<body>\n'
        + src + '\n</body>\n</html>\n')
sortie = racine / "LaMargeASuivre-bureau.html"
sortie.write_text(page, encoding="utf-8")
print(f"{sortie.name} : {len(page.encode('utf-8')) // 1024} Ko")
