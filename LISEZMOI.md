# La marge à suivre

Audit et suivi mensuel du ratio matière des restaurants, sur la partie alimentaire seulement (les boissons sont exclues) : factures, ventes, fiches techniques, écarts, stock, cible et bilan PDF. Version restaurant de RatioPizza, tenue à part : elle a ses propres données et ne touche pas à RatioPizza. Pour y reprendre un client RatioPizza, enregistre une sauvegarde dans RatioPizza et ouvre-la ici : ses produits sont rangés dans la catégorie « Pizzas ».

## La carte

- **Catégories** : chaque produit est rangé dans une rubrique de la carte (Entrées, Plats, Desserts, Pizzas…). Le ratio par catégorie s'affiche dans le Tableau de bord, les Fiches techniques et le bilan PDF.
- **Préparations de base** : sous-recettes réutilisables (sauce, fond, pâte, vinaigrette), avec leur poids obtenu. On les ajoute dans les fiches comme un ingrédient ; pour les écarts d'achats, elles sont remplacées par leurs ingrédients.
- **Formules et menus** : un prix fixe et des créneaux (entrée, plat, dessert). Chaque créneau propose une catégorie entière ou seulement les produits cochés. Le coût d'une formule est la moyenne des produits proposés, pondérée par leurs ventes à la carte.
- **TVA par produit** : vide, le produit prend la TVA générale du client.
- **Couverts** : saisis par mois dans le Tableau de bord ou avec le relevé de ventes, ils donnent le ticket moyen et le coût matière par couvert.

Les ventes passées gardent les prix et les recettes en vigueur au moment de la vente : modifier une fiche, une préparation ou une formule ne réécrit pas les mois passés.

## La cible

La cible est le ratio matière maximum que le restaurant peut se permettre. Les charges (personnel, loyer…) sont celles de tout le restaurant, et les boissons en paient une partie : dans l'onglet Cadrage, saisis le CA HT mensuel des boissons et leur coût d'achat (en % de leur CA).

Cible = (CA total − charges − frais proportionnels − achat des boissons) ÷ CA alimentaire.

Sans boissons saisies, toutes les charges pèsent sur la nourriture et la cible est trop sévère : le Cadrage le signale.

## Stock de fin de mois

Deux façons de le saisir, au choix pour chaque mois :
- **Total** : la valeur HT du stock, dans le tableau « Suivi des documents et du stock » du Tableau de bord.
- **Produit par produit** : onglet **Stocks**, quantité de chaque produit dans l'unité de la facture. La valeur est calculée au prix HT de référence au moment de la saisie. Pour ce mois, elle remplace le total saisi.

Avec le stock du début et de la fin d'une période, le ratio réel utilise la consommation réelle (achats + stock début − stock fin). L'inventaire produit par produit corrige aussi les écarts par produit de l'onglet Écarts.

## Deux versions

| Fichier | Où l'utiliser | Lecture automatique des documents | Sauvegarde |
|---|---|---|---|
| `LaMargeASuivre.html` | Publié comme artefact dans Claude | Oui (PDF, photo, CSV, Excel) | Navigateur + espace privé en ligne |
| `LaMargeASuivre-bureau.html` | Sur ton ordinateur, sans internet | Non : saisie manuelle ou copier-coller | Navigateur de cet ordinateur |

Les deux versions partagent le même format de sauvegarde, et lisent aussi les sauvegardes de RatioPizza. Pour passer de l'une à l'autre : onglet **Ingrédients et données**, « Enregistrer la sauvegarde dans un fichier », puis « Ouvrir un fichier de sauvegarde » dans l'autre version. Le copier-coller reste possible.

## Sur téléphone

Utilise la version Claude : ouvre son lien dans l'application Claude (ou dans le navigateur du téléphone, connecté à ton compte Claude). Ses données sont sauvegardées dans ton espace privé en ligne : tu retrouves les mêmes clients sur ton PC et sur ton téléphone, à condition d'utiliser la version Claude sur les deux. La page s'adapte aux petits écrans.

Le fichier `LaMargeASuivre-bureau.html` n'est pas fait pour le téléphone : les téléphones ouvrent mal les fichiers HTML enregistrés et n'y gardent pas les données de façon fiable.

## Utiliser la version ordinateur

1. Garde ton fichier RatioPizza : les deux logiciels sont indépendants et n'utilisent pas les mêmes données.
2. Télécharge `LaMargeASuivre-bureau.html` et range-le dans un dossier fixe (par exemple `Documents\La marge à suivre`).
3. Double-clique dessus : il s'ouvre dans ton navigateur (Chrome, Edge ou Firefox), avec la brasserie d'exemple. Pour y reprendre un client, ouvre sa sauvegarde avec « Ouvrir un fichier de sauvegarde ».
4. Ajoute-le à tes favoris pour le rouvrir facilement.

Les données sont gardées par le navigateur. Garde toujours le même navigateur et ne déplace pas le fichier. Enregistre régulièrement la sauvegarde dans un fichier et garde-le ailleurs (clé USB, Drive, e-mail) : effacer les données du navigateur efface aussi celles du logiciel.

## Outils

```
python3 outils/construire-bureau.py      # fabrique LaMargeASuivre-bureau.html à partir de LaMargeASuivre.html
python3 outils/exemple-restaurant.py     # régénère les données d'exemple (brasserie fictive, trois mois)
```

La version ordinateur intègre jsPDF 2.5.1 (`vendor/`, licence MIT) pour que le bilan PDF fonctionne sans internet. Elle n'inclut pas pdf.js et xlsx, qui ne servent qu'à la lecture automatique.

Les données d'exemple sont calculées à partir des recettes et des ventes : les factures correspondent à la consommation théorique, avec une surconsommation volontaire sur la bavette (+13 %) et la crème (+11 %), et les restes de conditionnements entamés sont comptés aux inventaires de fin de mois.
