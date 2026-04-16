## Plan en 3 sprints (a partir de ton projet actuel)

### Sprint 1 - Fondations Stock ERP (MVP operationnel)
**Objectif**
- Fiabiliser le stock en base et tracer tous les mouvements de maniere standard.

**Perimetre**
1. Renforcer le modele produit
2. Standardiser les types de mouvements
3. Exposer des API stock de base
4. Poser les ecrans minimum cote React

**Backlog**
1. Ajouter les champs stockDisponible, stockReserve, stockMin sur produit.
2. Conserver stockMovements comme journal unique des operations.
3. Definir les types de mouvement autorises: ENTREE_ACHAT, SORTIE_VENTE, SORTIE_CONSOMMATION, AJUSTEMENT_INVENTAIRE, RESERVATION, LIBERATION_RESERVATION.
4. Creer un service metier central StockService pour eviter la logique dispersee dans les controleurs.
5. Ajouter endpoints:
	- consultation stock par produit
	- consultation historique des mouvements
	- entree manuelle de stock
	- sortie manuelle de stock avec controle anti-stock negatif
6. Front:
	- page Liste Stock
	- page Mouvements Stock (filtre produit/date/type)
	- formulaire Entree/Sortie

**Criteres d'acceptation**
1. Impossible de sortir une quantite superieure au stock disponible.
2. Chaque entree/sortie cree un mouvement horodate avec utilisateur.
3. Le stock affiche correspond exactement a l'etat persistant en base.
4. Historique consultable et filtrable.

**Livrable sprint**
- Module stock de base utilisable par le magasinier, avec tracabilite complete.

---

### Sprint 2 - Integration Workflow Achat -> Reception
**Objectif**
- Relier le workflow deja present (demande, proforma, BC) a l'augmentation reelle de stock.

**Perimetre**
1. Reception fournisseur a partir des bons de commande
2. Reception partielle
3. Mise a jour automatique du stock a la reception
4. Statuts d'avancement achat plus robustes

**Backlog**
1. Ajouter un flux Reception BC:
	- BC envoye
	- reception partielle
	- reception totale
2. Enregistrer les receptions avec quantite recue, date, utilisateur, commentaire.
3. A chaque reception, creer mouvement ENTREE_ACHAT et incrementer stockDisponible.
4. Gerer les ecarts receptionnes vs commandes.
5. Mettre a jour les statuts du BC et de la demande achat selon avancement.
6. Front:
	- page Receptions
	- detail BC avec quantites commandees/recues/restantes
	- actions de validation reception

**Criteres d'acceptation**
1. Une reception partielle ne cloture pas le BC.
2. Une reception totale cloture le BC et met le flux achat en etat termine.
3. Le stock augmente uniquement sur reception validee.
4. Les ecarts sont visibles en UI et traces en base.

**Livrable sprint**
- Chaine achat complete jusqu'a l'entree reelle en stock.

---

### Sprint 3 - Controle avance: Reservation, Inventaire, Alertes
**Objectif**
- Passer d'un stock "transactionnel" a un stock "pilote ERP".

**Perimetre**
1. Reservation/liberation de stock
2. Inventaire physique et ajustement
3. Alertes de rupture et reapprovisionnement
4. Dashboard KPI stock

**Backlog**
1. Implementer regles de reservation:
	- reserver depuis stockDisponible
	- consommer depuis stockReserve
	- liberer en cas d'annulation
2. Ajouter inventaire physique:
	- saisie quantite comptee
	- calcul des ecarts
	- generation AJUSTEMENT_INVENTAIRE
3. Seuils:
	- alerte si stockDisponible <= stockMin
	- proposition de demande d'achat auto (ou semi-auto)
4. Dashboard:
	- taux de rupture
	- top sorties
	- stock sous seuil
	- rotation simple du stock
5. Securite/qualite:
	- validations transactionnelles
	- tests metier des cas critiques

**Criteres d'acceptation**
1. Reservation et liberation coherentes sur tous les cas metier.
2. Inventaire cree des ajustements tracables.
3. Alertes de seuil visibles en temps reel.
4. KPI exploitables pour decision achat.

**Livrable sprint**
- Module stock ERP complet: execution + controle + pilotage.

---

## Decoupage temporel conseille
1. Sprint 1: 2 semaines
2. Sprint 2: 2 semaines
3. Sprint 3: 2 semaines

## Definition of Done commune (pour les 3 sprints)
1. API testees sur cas nominal + cas erreur.
2. Ecrans React branches sur API reelles.
3. Tracabilite utilisateur/date/commentaire sur toute operation stock.
4. Script SQL de migration a jour.
5. Demo de fin de sprint avec scenario metier complet.
