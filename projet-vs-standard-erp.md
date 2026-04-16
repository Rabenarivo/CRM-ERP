# Ton projet actuel vs standard ERP

## Contexte
Ce comparatif est base sur ta base actuelle et ton code existant (CRM + ERP) avec focus sur le flux Vente -> Stock -> Compta.

## Resume executif
- Ton projet couvre deja des briques importantes: produits, commandes, transactions, workflow achat, mouvements de stock.
- Le niveau ERP est en progression, mais il manque encore des liens forts entre documents de vente, impact stock, et ecritures comptables automatiques.
- Priorite: fiabiliser la chaine de bout en bout Vente -> Livraison -> Sortie stock -> Facturation -> Ecriture comptable.

## Comparatif global
| Axe | Projet actuel | Standard ERP | Ecart |
|---|---|---|---|
| Referentiel produit | Produit avec prix, stock disponible/reserve/min en cours d'adoption | Referentiel complet (UoM, categories, taxes, lots, emplacements) | Moyen |
| Processus vente | Table commandes presente, logique metier partielle | Cycle complet devis -> commande -> livraison -> facture -> paiement | Eleve |
| Stock operationnel | Mouvements existants et sortie stock via API | Mouvements relies aux documents source + statuts robustes | Moyen |
| Compta operationnelle | Table transactions existe | Journal comptable structure, plan comptable, ecritures auto | Eleve |
| Traçabilite | Historique workflow + stock_movement | Audit complet avec sourceType/sourceId sur chaque impact | Moyen |
| Controle interne | Validations de base cote API | Segregation des roles, approbations, rapprochements | Eleve |

## Focus 1: Vente
### Ce qui existe deja
- Donnees de vente presentes via commandes.
- Transactions de type ENTREE/SORTIE disponibles.
- API stock permettant une sortie explicite.

### Standard ERP attendu
- Documents de vente chaines: devis, commande client, bon de livraison, facture client.
- Statuts normalises: BROUILLON, VALIDE, LIVRE_PARTIEL, LIVRE, FACTURE, REGLE.
- Regles de credit client, taxes, remises, conditions de paiement.

### Ecart cle
- La vente n'est pas encore completement pilotee par des statuts documentaires alignes finance et logistique.

## Focus 2: Stock
### Ce qui existe deja
- Table stock_movements.
- Sortie de stock protegee contre stock insuffisant.
- Distinction initiale des types de mouvement (ex: SORTIE_VENTE).

### Standard ERP attendu
- Stock disponible, reserve, en transit, qualite.
- Mouvement cree au bon moment metier:
  - Vente: a la livraison.
  - Achat: a la reception.
- Lien documentaire obligatoire pour tout mouvement:
  - sourceType (VENTE, ACHAT, INVENTAIRE, AJUSTEMENT)
  - sourceId (id du document origine)

### Ecart cle
- Le type de mouvement existe, mais la reference documentaire et l'orchestration complete par statut sont a renforcer.

## Focus 3: Compta
### Ce qui existe deja
- Table transactions avec montant, type, description, date.

### Standard ERP attendu
- Journal comptable structure (piece, compte debit, compte credit, journal, periode).
- Ecritures automatiques declenchees par les evenements metier.
- Rapprochement commande/livraison/facture/paiement.

### Ecart cle
- La table transactions est un bon debut, mais insuffisante pour une comptabilite ERP complete et auditable.

## Vue process cible: Vente -> Stock -> Compta
1. Commande client validee.
2. Reservation de stock.
3. Livraison (totale/partielle).
4. Sortie stock creee automatiquement avec sourceType=VENTE et sourceId=livraison.
5. Facture client generee.
6. Ecriture comptable automatique (produit + TVA + creance client).
7. Encaissement et lettrage.

## Diagnostic maturite (sur 5)
- Vente: 2.5/5
- Stock: 3/5
- Compta: 1.5/5
- Integration bout en bout: 2/5

## Priorites recommandees
1. Rendre obligatoire le lien sourceType/sourceId sur stock_movements.
2. Introduire les statuts de vente et livraison avec transitions controlees.
3. Declencher les sorties stock uniquement depuis la livraison.
4. Passer de transactions simples a des ecritures comptables structurees.
5. Ajouter un controle de coherence quotidien entre ventes, stock et compta.

## Indicateurs de succes
- 100% des sorties stock de vente liees a une livraison validee.
- Ecart stock theorique vs physique < 1%.
- 100% des factures vente ont une ecriture comptable correspondante.
- Temps de cloture mensuelle reduit grace a la coherence inter-modules.
