# RatioPizza

Audit et suivi mensuel du ratio matière des pizzerias : factures, ventes, fiches techniques, écarts, stock, cible et bilan PDF.

## Stock de fin de mois

Deux façons de le saisir, au choix pour chaque mois :
- **Total** : la valeur HT du stock, dans le tableau « Suivi des documents et du stock » du Tableau de bord.
- **Produit par produit** : onglet **Stocks**, quantité de chaque produit dans l'unité de la facture. La valeur est calculée au prix HT de référence au moment de la saisie. Pour ce mois, elle remplace le total saisi.

Avec le stock du début et de la fin d'une période, le ratio réel utilise la consommation réelle (achats + stock début − stock fin). L'inventaire produit par produit corrige aussi les écarts par produit de l'onglet Écarts.

## Deux versions

| Fichier | Où l'utiliser | Lecture automatique des documents | Sauvegarde |
|---|---|---|---|
| `RatioPizza.html` | Publié comme artefact dans Claude | Oui (PDF, photo, CSV, Excel) | Navigateur + espace privé en ligne |
| `RatioPizza-bureau.html` | Sur ton ordinateur, sans internet | Non : saisie manuelle ou copier-coller | Navigateur de cet ordinateur |

Les deux versions partagent le même format de sauvegarde. Pour passer de l'une à l'autre : onglet **Ingrédients et données**, « Enregistrer la sauvegarde dans un fichier », puis « Ouvrir un fichier de sauvegarde » dans l'autre version. Le copier-coller reste possible.

## Sur téléphone

Utilise la version Claude : ouvre son lien dans l'application Claude (ou dans le navigateur du téléphone, connecté à ton compte Claude). Ses données sont sauvegardées dans ton espace privé en ligne : tu retrouves les mêmes clients sur ton PC et sur ton téléphone, à condition d'utiliser la version Claude sur les deux. La page s'adapte aux petits écrans.

Le fichier `RatioPizza-bureau.html` n'est pas fait pour le téléphone : les téléphones ouvrent mal les fichiers HTML enregistrés et n'y gardent pas les données de façon fiable.

## Utiliser la version ordinateur

1. Télécharge `RatioPizza-bureau.html` et range-le dans un dossier fixe (par exemple `Documents\RatioPizza`).
2. Double-clique dessus : il s'ouvre dans ton navigateur (Chrome, Edge ou Firefox).
3. Ajoute-le à tes favoris pour le rouvrir facilement.

Les données sont gardées par le navigateur, pour ce fichier à cet emplacement. Garde toujours le même navigateur et ne déplace pas le fichier. Enregistre régulièrement la sauvegarde dans un fichier et garde-le ailleurs (clé USB, Drive, e-mail) : effacer les données du navigateur efface aussi celles de RatioPizza.

## Mettre à jour la version ordinateur

`RatioPizza-bureau.html` est fabriqué à partir de `RatioPizza.html` :

```
python3 outils/construire-bureau.py
```

Le script intègre jsPDF 2.5.1 (`vendor/`, licence MIT) pour que le bilan PDF fonctionne sans internet. Il retire pdf.js et xlsx, qui ne servent qu'à la lecture automatique.
