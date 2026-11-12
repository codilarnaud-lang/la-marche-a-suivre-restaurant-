# RatioPizza

Audit et suivi mensuel du ratio matière des pizzerias : factures, ventes, fiches techniques, écarts, stock, cible et bilan PDF.

## Deux versions

| Fichier | Où l'utiliser | Lecture automatique des documents | Sauvegarde |
|---|---|---|---|
| `RatioPizza.html` | Publié comme artefact dans Claude | Oui (PDF, photo, CSV, Excel) | Navigateur + espace privé en ligne |
| `RatioPizza-bureau.html` | Sur ton ordinateur, sans internet | Non : saisie manuelle ou copier-coller | Navigateur de cet ordinateur |

Les deux versions partagent le même format de sauvegarde. Pour passer de l'une à l'autre : onglet **Ingrédients et données**, « Copier la sauvegarde », puis « Restaurer » dans l'autre version.

## Utiliser la version ordinateur

1. Télécharge `RatioPizza-bureau.html` et range-le dans un dossier fixe (par exemple `Documents\RatioPizza`).
2. Double-clique dessus : il s'ouvre dans ton navigateur (Chrome, Edge ou Firefox).
3. Ajoute-le à tes favoris pour le rouvrir facilement.

Les données sont gardées par le navigateur, pour ce fichier à cet emplacement. Garde toujours le même navigateur et ne déplace pas le fichier. Copie la sauvegarde régulièrement et garde-la ailleurs : effacer les données du navigateur efface aussi celles de RatioPizza.

## Mettre à jour la version ordinateur

`RatioPizza-bureau.html` est fabriqué à partir de `RatioPizza.html` :

```
python3 outils/construire-bureau.py
```

Le script intègre jsPDF 2.5.1 (`vendor/`, licence MIT) pour que le bilan PDF fonctionne sans internet. Il retire pdf.js et xlsx, qui ne servent qu'à la lecture automatique.
