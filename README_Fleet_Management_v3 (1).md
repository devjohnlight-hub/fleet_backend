# 📘 Fleet Management System - Data Model & Use Cases

## 🧾 Description

Ce document décrit le modèle de données principal du système de gestion de flotte de véhicules avec gestion des chauffeurs, des affectations, des documents, des entreprises et des alertes. Il inclut également les use cases fonctionnels détaillés pour chaque module.

---

# 📐 MODÈLE DE DONNÉES

---

# 🏢 1. Company

Représente une entreprise (peut gérer plusieurs flottes).

| Champ      | Type      | Description          |
|------------|-----------|----------------------|
| id         | UUID      | Identifiant unique   |
| name       | VARCHAR   | Nom de l'entreprise  |
| address    | VARCHAR   | Adresse              |
| contact    | VARCHAR   | Contact              |
| created_at | TIMESTAMP | Date de création     |
| updated_at | TIMESTAMP | Date de mise à jour  |

---

# 🏢 2. FleetOwner

Représente le propriétaire de flotte.

| Champ      | Type       | Description              |
|------------|------------|--------------------------|
| id         | UUID       | Identifiant unique       |
| name       | VARCHAR    | Nom du propriétaire      |
| contact    | VARCHAR    | Informations de contact  |
| company_id | UUID (FK)  | Référence vers Company   |
| created_at | TIMESTAMP  | Date de création         |
| updated_at | TIMESTAMP  | Date de mise à jour      |

---

# 🚗 3. Vehicle

> ✏️ **Modèle ajusté** — ajout de `type_vehicule`, `annee`, `photo_url` (UC1)

| Champ           | Type       | Description                                         |
|-----------------|------------|-----------------------------------------------------|
| id              | UUID       | Identifiant unique                                  |
| type_vehicule   | VARCHAR    | Type : moto, voiture, camion, bus, autre            |
| immatriculation | VARCHAR    | Numéro d'immatriculation (unique)                   |
| marque          | VARCHAR    | Marque                                              |
| modele          | VARCHAR    | Modèle                                              |
| annee           | INTEGER    | Année de fabrication                                |
| statut          | VARCHAR    | actif / maintenance / hors_service                  |
| photo_url       | VARCHAR    | URL photo du véhicule (stockage cloud)              |
| fleet_owner_id  | UUID (FK)  | Référence FleetOwner                                |
| created_at      | TIMESTAMP  | Date de création                                    |
| updated_at      | TIMESTAMP  | Date de mise à jour                                 |

---

# 👨‍✈️ 4. Driver

> ✏️ **Modèle ajusté** — ajout de `prenom`, `date_naissance`, `adresse`, `categorie_permis`, `photo_url`, `email` (UC2)

| Champ            | Type       | Description                               |
|------------------|------------|-------------------------------------------|
| id               | UUID       | Identifiant unique                        |
| nom              | VARCHAR    | Nom du chauffeur                          |
| prenom           | VARCHAR    | Prénom du chauffeur                       |
| date_naissance   | DATE       | Date de naissance                         |
| adresse          | VARCHAR    | Adresse                                   |
| telephone        | VARCHAR    | Téléphone                                 |
| email            | VARCHAR    | Email (optionnel)                         |
| numero_permis    | VARCHAR    | Numéro de permis (unique)                 |
| categorie_permis | VARCHAR    | Catégorie : A, B, C, D…                   |
| photo_url        | VARCHAR    | URL photo de profil (stockage cloud)      |
| statut           | VARCHAR    | Statut du chauffeur                       |
| fleet_owner_id   | UUID (FK)  | Référence FleetOwner                      |
| created_at       | TIMESTAMP  | Date de création                          |
| updated_at       | TIMESTAMP  | Date de mise à jour                       |

---

# 🔄 5. VehicleAssignment

> ✏️ **Modèle ajusté** — `contrat` renommé en `contrat_url` (URL vers fichier cloud) (UC3)

| Champ               | Type       | Description                                   |
|---------------------|------------|-----------------------------------------------|
| id                  | UUID       | Identifiant unique                            |
| vehicle_id          | UUID (FK)  | Véhicule                                      |
| driver_id           | UUID (FK)  | Chauffeur                                     |
| type_assignation    | VARCHAR    | recette / salaire                             |
| contrat_url         | VARCHAR    | URL du contrat signé (stockage cloud)         |
| frequence_versement | VARCHAR    | journalier / hebdomadaire / mensuel           |
| jours_travail       | JSONB      | Ex : ["lundi","mardi","mercredi"]             |
| montant_paiement    | DECIMAL    | Montant à payer                               |
| date_debut          | DATE       | Début de l'affectation                        |
| date_fin            | DATE       | Fin (nullable)                                |
| created_at          | TIMESTAMP  | Date de création                              |
| updated_at          | TIMESTAMP  | Date de mise à jour                           |

**Index recommandés :** `vehicle_id`, `driver_id`, `date_debut`

---

# 📄 6. Document

| Champ       | Type       | Description                    |
|-------------|------------|--------------------------------|
| id          | UUID       | Identifiant unique             |
| type        | VARCHAR    | Type de document               |
| date_debut  | DATE       | Début de validité              |
| date_fin    | DATE       | Date d'expiration              |
| file_url    | VARCHAR    | URL du fichier (stockage cloud)|
| entity_type | VARCHAR    | vehicle / driver               |
| entity_id   | UUID       | Référence entité               |
| created_at  | TIMESTAMP  | Date de création               |
| updated_at  | TIMESTAMP  | Date de mise à jour            |

---

# 🚨 7. Alert

Représente une alerte générée par le système.

| Champ      | Type       | Description                                          |
|------------|------------|------------------------------------------------------|
| id         | UUID       | Identifiant unique                                   |
| type       | VARCHAR    | vitesse / geofence / document_expire / paiement, etc.|
| message    | TEXT       | Description de l'alerte                              |
| vehicle_id | UUID (FK)  | Véhicule concerné                                    |
| driver_id  | UUID (FK)  | Chauffeur concerné (nullable)                        |
| status     | VARCHAR    | active / resolved                                    |
| created_at | TIMESTAMP  | Date de création                                     |
| updated_at | TIMESTAMP  | Date de mise à jour                                  |

---

# 💰 8. Payment *(table future — UC4)*

> 🆕 **Nouvelle table** prévue pour la gestion financière et le bilan propriétaire

| Champ         | Type       | Description                              |
|---------------|------------|------------------------------------------|
| id            | UUID       | Identifiant unique                       |
| assignment_id | UUID (FK)  | Référence VehicleAssignment              |
| driver_id     | UUID (FK)  | Chauffeur                                |
| vehicle_id    | UUID (FK)  | Véhicule                                 |
| montant       | DECIMAL    | Montant payé                             |
| date_paiement | DATE       | Date du paiement                         |
| statut        | VARCHAR    | payé / partiel / en_retard               |
| created_at    | TIMESTAMP  | Date de création                         |
| updated_at    | TIMESTAMP  | Date de mise à jour                      |

**Index recommandés :** `assignment_id`, `driver_id`, `date_paiement`

---

# 🔗 Relations principales

- Company → FleetOwner (1,N)
- FleetOwner → Vehicle (1,N)
- FleetOwner → Driver (1,N)
- Vehicle ↔ Driver via VehicleAssignment
- VehicleAssignment → Payment (1,N)
- Document → Vehicle ou Driver
- Alert → Vehicle / Driver

---

# 📱 USE CASES FONCTIONNELS

---

# 🚗 Use Case 1 : Enregistrement d'un véhicule

## 🎯 User Story

**En tant que** propriétaire de flotte
**Je veux** ajouter un nouveau véhicule dans le système via l'application mobile
**Afin de** centraliser la gestion de ma flotte

---

## 🧭 Flow fonctionnel

### 1. Sélection du type de véhicule

L'utilisateur sélectionne le type :

| Valeur  | Description |
|---------|-------------|
| moto    | Deux-roues  |
| voiture | Véhicule léger |
| camion  | Poids lourd |
| bus     | Transport en commun |
| autre   | Autre type  |

👉 Champ : `type_vehicule` (VARCHAR / ENUM)

---

### 2. Saisie des informations du véhicule

| Champ           | Type    | Obligatoire | Description              |
|-----------------|---------|-------------|--------------------------|
| immatriculation | VARCHAR | Oui         | Numéro du véhicule       |
| marque          | VARCHAR | Oui         | Marque                   |
| modele          | VARCHAR | Oui         | Modèle                   |
| annee           | INTEGER | Oui         | Année de fabrication     |
| statut          | VARCHAR | Oui         | actif / maintenance / hors_service |
| photo_url       | FILE/URL| Non         | Image du véhicule        |
| fleet_owner_id  | UUID    | Oui         | Propriétaire             |

---

### 3. Upload de la photo

- Prise de photo 📸 ou sélection depuis la galerie
- Stockage cloud (S3, Cloudinary…)
- Sauvegarde du `photo_url`

---

### 4. Validation et enregistrement

🔍 **Vérifications :**
- Champs obligatoires remplis
- Immatriculation unique
- Format des données valide

---

### 5. Appel API

```
POST /vehicles
```

**Payload exemple :**

```json
{
  "type_vehicule": "voiture",
  "immatriculation": "AB-123-CD",
  "marque": "Toyota",
  "modele": "Corolla",
  "annee": 2020,
  "statut": "actif",
  "photo_url": "https://cdn.app.com/vehicle.jpg",
  "fleet_owner_id": "uuid"
}
```

**Réponse succès :**

```json
{
  "id": "uuid",
  "message": "Véhicule enregistré avec succès"
}
```

---

## ✅ Résultat attendu

- Véhicule enregistré avec succès
- Disponible pour affectation
- Redirection vers la liste ou le détail du véhicule

## ⚠️ Cas d'erreur

- Immatriculation déjà existante
- Champs manquants
- Erreur upload image
- Problème réseau

## 🚀 Améliorations possibles

- Scan automatique de plaque (OCR)
- Suggestion automatique marque/modèle
- Ajout direct de documents après création
- Brouillon (save draft)

## 🧠 Notes techniques

- Utiliser un ENUM pour `type_vehicule`
- Compresser l'image côté mobile
- Upload asynchrone pour une UX fluide
- Validation côté frontend **et** backend

---

# 👤 Use Case 2 : Création d'un chauffeur

## 🎯 User Story

**En tant que** propriétaire de flotte
**Je veux** enregistrer un chauffeur
**Afin de** pouvoir lui affecter des véhicules et suivre ses activités

---

## 🧭 Flow fonctionnel

### 1. Accès au module chauffeur

- L'utilisateur ouvre le menu **"Chauffeurs"**
- Clique sur **"Ajouter un chauffeur"**

---

### 2. Saisie des informations du chauffeur

| Champ            | Type    | Obligatoire | Description                  |
|------------------|---------|-------------|------------------------------|
| nom              | VARCHAR | Oui         | Nom du chauffeur             |
| prenom           | VARCHAR | Oui         | Prénom                       |
| date_naissance   | DATE    | Oui         | Date de naissance            |
| adresse          | VARCHAR | Oui         | Adresse                      |
| numero_permis    | VARCHAR | Oui         | Numéro du permis             |
| categorie_permis | VARCHAR | Oui         | A, B, C, D…                  |
| photo_url        | FILE/URL| Non         | Photo de profil              |
| telephone        | VARCHAR | Oui         | Numéro de téléphone          |
| email            | VARCHAR | Non         | Email                        |
| fleet_owner_id   | UUID    | Oui         | Propriétaire                 |

---

### 3. Upload de la photo

- Prise de photo 📸 ou sélection depuis la galerie
- Upload vers stockage cloud
- Sauvegarde du `photo_url`

---

### 4. Validation et création

🔍 **Vérifications :**
- Champs obligatoires remplis
- Numéro de permis unique
- Format email valide (si renseigné)

---

### 5. Appel API

```
POST /drivers
```

**Payload exemple :**

```json
{
  "nom": "Kouassi",
  "prenom": "Jean",
  "date_naissance": "1990-05-10",
  "adresse": "Abidjan",
  "numero_permis": "PERM-12345",
  "categorie_permis": "B",
  "photo_url": "https://cdn.app.com/driver.jpg",
  "telephone": "+2250700000000",
  "email": "jean.kouassi@email.com",
  "fleet_owner_id": "uuid"
}
```

---

### 6. Ajout des documents du chauffeur

Après création, l'utilisateur peut ajouter des documents :

📄 **Types de documents :**
- Permis de conduire
- Certificat médical
- Pièce d'identité
- Contrat de travail

| Champ      | Type     | Obligatoire | Description          |
|------------|----------|-------------|----------------------|
| type       | VARCHAR  | Oui         | Type de document     |
| date_debut | DATE     | Oui         | Début de validité    |
| date_fin   | DATE     | Oui         | Date d'expiration    |
| file_url   | FILE/URL | Oui         | Document uploadé     |

---

### 7. Appel API (document)

```
POST /documents
```

**Payload exemple :**

```json
{
  "type": "permis_conduire",
  "date_debut": "2023-01-01",
  "date_fin": "2028-01-01",
  "file_url": "https://cdn.app.com/doc.pdf",
  "entity_type": "driver",
  "entity_id": "driver_uuid"
}
```

---

## ✅ Résultat attendu

- Chauffeur créé avec succès
- Documents associés enregistrés
- Chauffeur disponible pour affectation

## ⚠️ Cas d'erreur

- Numéro de permis déjà utilisé
- Documents non valides
- Champs obligatoires manquants
- Erreur upload fichier

## 🚀 Améliorations possibles

- OCR du permis de conduire
- Vérification automatique des dates d'expiration
- Notifications avant expiration
- Scan QR pour identification chauffeur

## 🧠 Notes techniques

- Index unique sur `numero_permis`
- Stockage sécurisé des documents (S3 recommandé)
- Validation backend obligatoire

---

# 🔄 Use Case 3 : Affectation d'un véhicule à un chauffeur

## 🎯 User Story

**En tant que** propriétaire de flotte
**Je veux** affecter un véhicule à un chauffeur
**Afin de** organiser l'exploitation de ma flotte et gérer les paiements

---

## 🧭 Flow fonctionnel

### 1. Accès au module d'affectation

- L'utilisateur accède au menu **"Affectations"**
- Clique sur **"Nouvelle affectation"**

---

### 2. Sélection du véhicule et du chauffeur

| Champ      | Type | Obligatoire | Description         |
|------------|------|-------------|---------------------|
| vehicle_id | UUID | Oui         | Véhicule à affecter |
| driver_id  | UUID | Oui         | Chauffeur           |

👉 **Contraintes :**
- Le véhicule doit être actif
- Le chauffeur doit être actif

---

### 3. Définition du type de contrat

| Champ            | Type    | Obligatoire | Description        |
|------------------|---------|-------------|--------------------|
| type_assignation | VARCHAR | Oui         | recette / salaire  |

👉 **Logique :**
- **recette** → paiement basé sur les revenus journaliers
- **salaire** → montant fixe

---

### 4. Upload du contrat

L'utilisateur télécharge le contrat signé.

| Champ       | Type     | Obligatoire |
|-------------|----------|-------------|
| contrat_url | FILE/URL | Oui         |

👉 Stockage cloud (S3, Cloudinary…) — sauvegarde du `contrat_url`

---

### 5. Définition des modalités de paiement

| Champ               | Type    | Obligatoire | Description                         |
|---------------------|---------|-------------|-------------------------------------|
| frequence_versement | VARCHAR | Oui         | journalier / hebdomadaire / mensuel |
| montant_paiement    | DECIMAL | Oui         | Montant à payer                     |

---

### 6. Sélection des jours de travail

| Champ         | Type  | Obligatoire | Description                      |
|---------------|-------|-------------|----------------------------------|
| jours_travail | JSONB | Oui         | Ex : ["lundi","mardi","mercredi"]|

👉 UI : sélecteur multi-choix (checkbox)

---

### 7. Période d'affectation

| Champ      | Type | Obligatoire | Description    |
|------------|------|-------------|----------------|
| date_debut | DATE | Oui         | Début          |
| date_fin   | DATE | Non         | Fin (nullable) |

---

### 8. Validation et enregistrement

🔍 **Vérifications :**
- Aucun conflit d'affectation actif
- Champs obligatoires remplis
- Cohérence des dates
- Montant valide (> 0)

---

### 9. Appel API

```
POST /vehicle-assignments
```

**Payload exemple :**

```json
{
  "vehicle_id": "uuid",
  "driver_id": "uuid",
  "type_assignation": "recette",
  "contrat_url": "https://cdn.app.com/contrat.pdf",
  "frequence_versement": "journalier",
  "jours_travail": ["lundi", "mardi", "mercredi", "jeudi", "vendredi"],
  "montant_paiement": 5000,
  "date_debut": "2026-01-01",
  "date_fin": null
}
```

**Réponse :**

```json
{
  "id": "uuid",
  "message": "Affectation créée avec succès"
}
```

---

## ✅ Résultat attendu

- Affectation enregistrée
- Historique conservé
- Chauffeur lié au véhicule
- Base prête pour calcul des paiements

## ⚠️ Cas d'erreur

- Véhicule déjà affecté sur la même période
- Chauffeur déjà occupé
- Contrat manquant
- Données invalides

## 🚀 Améliorations possibles

- Gestion automatique des conflits d'affectation
- Suspension / résiliation d'affectation
- Historique complet des contrats
- Calcul automatique des gains (recette)
- Notifications de paiement

## 🧠 Notes techniques

- Index sur `vehicle_id`, `driver_id`, `date_debut`
- Vérifier unicité : 1 affectation active par véhicule (selon règle métier)
- Utiliser **JSONB** pour `jours_travail`
- Prévoir la table `payments` pour les versements

💡 **Importance métier** — Cette fonctionnalité est le cœur du système car elle permet la gestion opérationnelle, la gestion financière et le suivi des chauffeurs.

---

# 📊 Use Case 4 : Bilan financier du propriétaire

## 🎯 User Story

**En tant que** propriétaire de flotte
**Je veux** consulter le bilan financier de mes véhicules et chauffeurs
**Afin de** suivre mes revenus et identifier les retards de paiement

---

## 🧭 Flow fonctionnel

### 1. Accès au tableau de bord

- L'utilisateur accède au menu **"Bilan / Dashboard"**
- Vue par défaut : période mensuelle

---

### 2. Sélection de la période

| Champ      | Type | Obligatoire | Description      |
|------------|------|-------------|------------------|
| date_debut | DATE | Oui         | Début de période |
| date_fin   | DATE | Oui         | Fin de période   |

👉 Options rapides : Aujourd'hui / Cette semaine / Ce mois / Personnalisé

---

### 3. Indicateurs principaux

| Indicateur     | Description                         |
|----------------|-------------------------------------|
| revenu_total   | Somme totale des revenus            |
| total_attendu  | Montant total attendu               |
| total_recu     | Montant effectivement payé          |
| total_restant  | Montant restant à payer             |
| taux_paiement  | % de recouvrement                   |

---

### 4. Détail par véhicule

| Champ           | Description              |
|-----------------|--------------------------|
| vehicle_id      | Véhicule                 |
| revenu_total    | Revenus générés          |
| montant_recu    | Montant payé             |
| montant_restant | Montant restant          |
| statut          | à jour / en retard       |

---

### 5. Détail par chauffeur

| Champ         | Description       |
|---------------|-------------------|
| driver_id     | Chauffeur         |
| total_paye    | Montant payé      |
| total_attendu | Montant attendu   |
| reste_a_payer | Montant restant   |
| statut        | à jour / en retard|

---

### 6. Logique de calcul (contrat "recette")

Si `type_assignation = recette` :

```
montant_attendu = montant_paiement × nombre_de_jours_travaillés
reste = montant_attendu - total_paye
```

---

### 7. Visualisation des retards

| Couleur | Signification   |
|---------|-----------------|
| 🔴 Rouge  | Retard          |
| 🟡 Orange | Paiement partiel|
| 🟢 Vert   | À jour          |

---

### 8. Appel API

```
GET /reports/financial-summary?date_debut=2026-01-01&date_fin=2026-01-31
```

**Réponse :**

```json
{
  "revenu_total": 500000,
  "total_attendu": 700000,
  "total_recu": 500000,
  "total_restant": 200000,
  "vehicules": [
    {
      "vehicle_id": "uuid",
      "montant_recu": 200000,
      "montant_restant": 50000
    }
  ],
  "chauffeurs": [
    {
      "driver_id": "uuid",
      "total_paye": 150000,
      "reste_a_payer": 30000,
      "statut": "retard"
    }
  ]
}
```

---

## ✅ Résultat attendu

- Vue claire des revenus sur la période
- Identification rapide des retards
- Analyse par véhicule et par chauffeur
- Aide à la prise de décision

## ⚠️ Cas d'erreur

- Aucune donnée sur la période
- Mauvaise plage de dates
- Données incohérentes (paiements manquants)

## 🚀 Améliorations possibles

- Graphiques (courbes, histogrammes)
- Export PDF / Excel
- Comparaison entre périodes
- Prédiction des revenus
- Notifications automatiques de retard

## 🧠 Notes techniques

- Nécessite la table `payments` (voir section 8 du modèle)
- Calculs via agrégations SQL optimisées
- Cache Redis possible pour améliorer les performances
- Index sur les champs de dates

💡 **Importance métier** — Ce module permet le pilotage financier, la détection des pertes et l'optimisation des revenus. C'est un module stratégique pour la rentabilité du système.

---

# ✅ Conclusion

Modèle enrichi avec gestion multi-entreprise, alertes temps réel, et 4 use cases fonctionnels couvrant l'intégralité du cycle de vie opérationnel : enregistrement des véhicules, gestion des chauffeurs, affectation et suivi financier.

| Use Case | Module            | Statut    |
|----------|-------------------|-----------|
| UC1      | Véhicule          | ✅ Défini  |
| UC2      | Chauffeur         | ✅ Défini  |
| UC3      | Affectation       | ✅ Défini  |
| UC4      | Bilan financier   | ✅ Défini  |
