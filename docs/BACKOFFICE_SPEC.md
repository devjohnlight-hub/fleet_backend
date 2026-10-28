# Zira Backoffice — spécification de réalisation

> Ce document est le cahier des charges de référence pour construire le backoffice interne Zira. Il s'appuie sur les appels et modèles présents dans l'application Flutter et dans `functions/`. Il sépare les interfaces déjà utilisées par le produit des routes d'administration qui restent à créer.

## 1. Objectif

Construire une application web privée destinée à l'équipe Zira pour superviser l'ensemble du service :

- santé globale du produit et indicateurs d'activité ;
- clients (comptes propriétaires), véhicules, chauffeurs et affectations ;
- abonnements, plans, dates d'expiration et droits associés ;
- devices Traccar et leur rattachement aux véhicules et clients ;
- documents à expiration, journaux de paiement, notifications et incidents ;
- opérations d'assistance encadrées, traçables et limitées selon le rôle opérateur.

Le backoffice est un outil interne multi-client. Il peut consulter les données de tous les `ownerId`; l'application mobile, elle, filtre les données par l'utilisateur courant. Ne pas reprendre dans le backoffice le cloisonnement mono-client de l'application.

## 2. État technique constaté

- Application mobile : Flutter/Dart, architecture en couches, `flutter_bloc`, `go_router`, `get_it`.
- Authentification et données produit : Firebase Authentication, Cloud Firestore, Firebase Storage et Remote Config.
- API Zira appelée par le mobile : base URL `https://api.zira.ci`, client Dio, token Firebase ID dans `Authorization: Bearer ...`.
- GPS : l'API Zira sert de façade aux opérations Traccar. Le mobile utilise aussi Socket.IO pour les événements de position.
- Paiements intégrés : RevenueCat ; les états d'abonnement produit sont dans Firestore.
- Tâches serveur : Firebase Cloud Functions (Node.js 22, Functions v2).

### Sources du dépôt

- `lib/core/config/app_config.dart` : base URL API et configuration client.
- `lib/core/di/di_files/core_module.dart`, `lib/core/network/http_client.dart`, `lib/core/utils/auth_manager.dart` : Dio, auth Firebase et Bearer token.
- `lib/data/datasources/` : implémentations Firestore et endpoints réellement appelés.
- `lib/data/models/` : structure des données mobile.
- `functions/index.js`, `functions/*_service.js` : fonctions planifiées et Callable.
- `socket_io.md` : architecture du flux temps réel Traccar.
- `lib/core/design_system/`, `assets/` : identité visuelle.

## 3. Stack recommandée

### Frontend

- **Next.js (App Router) + TypeScript** : backoffice web réactif, routage, rendu serveur pour protéger les opérations privilégiées et typage strict.
- **Firebase Web SDK** pour connecter le personnel via Firebase Auth ; le navigateur ne lit pas directement les collections globales.
- **TanStack Query** pour requêtes, cache, pagination et invalidation ; **React Hook Form + Zod** pour formulaires administratifs.
- **Tailwind CSS** avec variables CSS reprenant les tokens Zira ci-dessous. Utiliser un kit de composants accessible (par exemple shadcn/ui) comme base, puis le thématiser ; il ne remplace pas le design system.
- **Recharts** pour les indicateurs et séries temporelles. Pour une carte, conserver Mapbox si le besoin d'explorer les positions multi-clients est validé ; ne charger le SDK cartographique que sur l'écran concerné.
- Icônes : Lucide ou Iconsax si une version web maintenue est disponible. Garder un seul jeu cohérent et éviter les icônes décoratives.

### Backend d'administration

- Utiliser **Firebase Admin SDK dans l'environnement serveur du backoffice** pour vérifier les sessions staff, lire Firestore, parcourir Firebase Auth (`listUsers`) et exécuter les actions Auth autorisées. Les Server Components, route handlers ou server actions Next.js peuvent appeler Admin SDK directement pour alimenter les vues en lecture ; il n'est pas nécessaire de créer une API métier supplémentaire pour chaque lecture Firebase.
- Pour les **mutations sensibles** (suspension Auth, ajustement abonnement, audit) et les **opérations Traccar multi-clients**, ajouter des endpoints sécurisés au backend Zira existant (le document `socket_io.md` décrit ce backend comme NestJS), ou un service admin NestJS dédié. Ces endpoints centralisent les règles métier, vérifications de rôle, audit et opérations externes.
- Les route handlers Next.js peuvent servir de BFF si l'interface en a besoin. Ils doivent vérifier la session et le rôle avant chaque accès Admin SDK ; pour les mutations, faire aussi appliquer ces contrôles par le backend d'administration. Le frontend n'est jamais une frontière de sécurité.
- Déployer le frontend et son code serveur sur l'infrastructure web retenue. Garder secrets, credentials de service et accès Traccar dans Secret Manager / variables serveur, jamais dans les bundles navigateur.

### Pourquoi ne pas appeler Firestore Admin / Traccar depuis le navigateur ?

Le backoffice voit les données de tous les clients et peut déclencher des opérations à fort impact. Firebase Admin contourne les règles Firestore : son utilisation doit donc rester côté serveur, derrière une session staff et une vérification de rôle. Les opérations Traccar restent dans l'API serveur Zira, qui porte les credentials et journalise les changements. Une lecture Firebase côté serveur peut être directe et ne nécessite pas de nouvelle route NestJS dédiée.

## 4. Identité visuelle et règles UI

Respecter le logo et le système existant :

- Logo principal : `assets/logo.svg` (préféré sur fonds clairs) ou `assets/logo.png` ; icône compacte : `assets/logo_ic.png` ou `assets/logo_ic_primary.png`.
- Police : **Outfit**. Les fontes locales existent sous `assets/fonts/Outfit-Regular.ttf` et `assets/fonts/Outfit-Bold.ttf`. Les intégrer au projet web pour ne pas dépendre du chargement Google Fonts en production.
- Couleurs issues de `lib/core/design_system/ds_colors.dart` :

| Token | Valeur | Usage |
|---|---|---|
| `primary` | `#1C3557` | Navigation, titres forts, action principale |
| `accent` | `#2563EB` | Liens, sélection, action secondaire |
| `background` | `#F8FAFC` | Fond de page |
| `surface` | `#FFFFFF` | Cartes et panneaux |
| `border` | `#E2E8F0` | Bordures et séparateurs |
| `statusActive` | `#16A34A` | Actif / opérationnel |
| `statusMaintenance` | `#F59E0B` | Attention / maintenance |
| `statusInactive` | `#EF4444` | Inactif / erreur / expiré |
| `statusAvailable` | `#2563EB` | Disponible |
| `textPrimary` | `#0F172A` | Texte principal |
| `textSecondary` | `#64748B` | Texte secondaire |
| `textDisabled` | `#CBD5E1` | État désactivé |

- Définir ces couleurs comme variables CSS nommées `--zira-*`, et exposer des tokens typographiques/espacement/rayon dans un fichier de thème central.
- Interface desktop-first mais responsive : navigation latérale, en-tête avec recherche globale et profil, contenu avec titre, filtres, indicateurs et tables lisibles.
- Cartes blanches aérées, rayons proches de 16 px, ombre très légère, badges de statut en pilule. Utiliser les couleurs sémantiques avec un libellé textuel, jamais la couleur seule.
- Tables : pagination serveur, tri explicite, recherche avec délai, filtres persistants dans l'URL, états chargement/vide/erreur, export CSV seulement si le rôle le permet.
- Les confirmations/destructions doivent afficher l'entité et la conséquence. Toute action sensible demande une confirmation explicite et produit une entrée d'audit.
- Créer un composant `BrandLogo` réutilisable et ne pas redessiner le logo à la main.

## 5. Authentification, rôles et audit

### Rôles internes

Créer des rôles distincts des rôles métier mobile (`Admin`, `Gestionnaire`, `Observateur`) :

- `super_admin` : gestion des accès internes et opérations critiques ;
- `support` : consultation client et actions de support non destructives ;
- `billing` : lecture clients/abonnements et opérations de facturation autorisées ;
- `viewer` : lecture seule des tableaux de bord.

Utiliser des **custom claims Firebase Auth** ou un registre serveur fiable pour l'appartenance et les permissions. Provisionnement des comptes internes manuel/invitation uniquement ; aucun formulaire public d'inscription. Activer MFA pour les comptes staff. Vérifier l'ID token et le rôle sur chaque requête serveur. Refuser par défaut.

### Journal d'audit

Enregistrer dans `admin_audit_logs` (ou une base d'audit append-only) : `actorUid`, rôle, action, type/ID cible, horodatage serveur, résultat, motif saisi par l'opérateur, identifiant de requête et champs modifiés avant/après avec données sensibles expurgées. Ne jamais consigner tokens, mots de passe, FCM token, secrets ou URL signées.

## 6. Données existantes et appels réellement disponibles

### 6.1 Collections Firestore observées

Les noms et champs ci-dessous viennent des datasources/modèles. Utiliser `ownerId` pour relier les objets métier au client (UID Firebase), et les IDs de documents Firestore comme identifiants principaux.

| Objet | Source | Champs utiles au backoffice |
|---|---|---|
| Clients/comptes | `users/{uid}` + Firebase Auth | `name`, `email`, `phoneNumber`, `photoUrl`, `userType`, `role`, `createdAt` selon écriture réelle, `traccarUserId`; Auth fournit `disabled`, `emailVerified`, `creationTime`, `lastSignInTime` |
| Véhicules | `vehicles/{id}` | `ownerId`, `type`, `brand`, `year`, `plate`, `vin`, `registrationNumber`, `label`, `color`, `status`, `createdAt`, `deviceId`, `uniqueId` |
| Chauffeurs | `drivers/{id}` | `ownerId`, `firstName`, `lastName`, `phoneNumber`, `status`, `photoUrl`, `createdAt` |
| Affectations | `assignments/{id}` | `ownerId`, `vehicleId`, `driverId`, `vehicleName`, `driverName`, `type`, `contractUrl`, `frequency`, `workDays`, `paymentAmount`, `startDate`, `endDate`, `isActive`, `createdAt` |
| Documents | `documents/{id}` | `ownerId`, `name`, `fileUrls`, `validFrom`, `validTo`, `enableReminder`, `entityType`, `entityId`, `metadata` |
| Paiements journaliers | `payment_logs/{id}` | `ownerId`, `assignmentId`, `dateString`, `date`, `status`, `expectedAmount`, `amountReceived`, `createdAt` |
| Notifications | `notifications/{id}` | `ownerId`, champs de `NotificationModel` (titre/message/type, lu, relation et date selon modèle) |
| Abonnements | `subscriptions/{uid}` | `planId`, `status`, `billingCycle`, `startDate`, `endDate`, `trialEndDate`, `autoRenew`, `permissions`, `createdAt`, `updatedAt` |
| Plans | `plans/{planId}` | Données de plan consommées par l'application : nom, prix, ordre, fonctionnalités, permissions. Valider le schéma actuel dans Firestore avant édition. |

Les collections `vehicles`, `drivers`, `assignments`, `documents`, `payment_logs` et `notifications` sont filtrées par `ownerId` dans l'application. Ne pas supposer qu'elles ont toutes une même stratégie de pagination/horodatage. Proposer une pagination serveur basée sur curseur, avec index Firestore adaptés.

**Minimisation** : ne jamais montrer `traccarPassword`, `fcmToken`, ID token ni secrets. `traccarPassword` est présent dans le modèle `UserModel` et doit être traité comme donnée sensible ; afficher uniquement si une nécessité opérationnelle validée existe, ce qui n'est pas attendu pour le MVP.

### 6.2 API Zira existante (mobile)

Base URL constatée : `https://api.zira.ci`. Ces chemins sont les seuls endpoints métier API relevés dans les datasources ; les méthodes de consultation globales ci-dessous ne sont pas confirmées par le code et ne doivent pas être inventées comme endpoints déjà existants.

| Méthode / chemin | Usage actuel | Paramètres / payload constatés | Usage backoffice |
|---|---|---|---|
| `POST /traccar/users` | Crée l'utilisateur Traccar lors de la création de compte | `{name, email, phone}` | Ne pas créer sans workflow d'onboarding explicite ; pas d'endpoint de recherche/liste client constaté. |
| `POST /traccar/devices` | Crée un device lié au véhicule | `name`, `uniqueId`, `vehiculeId`, `phone`, `model`, `contact`, `category`, `disabled`, `groupId`, `attributes` | Création admin à exposer côté serveur, après vérification du client et du véhicule. Note : clé actuelle `vehiculeId` orthographiée ainsi. |
| `PUT /traccar/devices/{id}` | Modifie un device | mêmes propriétés device, sans `vehiculeId` dans le payload actuel | Modifier via endpoint serveur avec contrôle de propriété/rattachement et audit. |
| `DELETE /traccar/devices/{id}` | Supprime un device | ID Traccar | Opération destructive : confirmation, permission renforcée et journal d'audit. Préférer une désactivation si l'API le permet. |
| `GET /traccar/devices?id={id}` | Lit un device par ID ; la réponse attendue est une liste dans le code mobile | `id` | Lecture multi-clients nécessitant un scope admin, non établi par le client mobile. |
| `GET /traccar/positions?deviceId={id}&id={positionId}&from={ISO}&to={ISO}` | Lit les positions et l'historique d'un device | paramètres optionnels indiqués | Détail device/carte ; ajouter limites de période, pagination et filtrage serveur. |
| `POST /files/upload?folder={folder}` (multipart) | Upload d'un document vers l'API Zira | fichier `file`, dossier selon type d'entité | À réserver au workflow documentaire dédié ; pas un endpoint général de téléchargement client. |

Toutes ces requêtes mobiles sont envoyées avec le Firebase ID token lorsque `requiresAuth: true`. **Cela ne confère pas de droits globaux au personnel** : une API d'administration doit vérifier les claims staff, et ne doit jamais simplement accepter qu'un token client puisse cibler un `ownerId` arbitraire.

Les détails d'enveloppe actuels API sont parsés en `ApiResponse` (`success`, `message`, `data`). Le contrat de réponse des futures routes admin doit être documenté et stable ; standard proposé : JSON, erreurs structurées `{code, message, requestId}`, dates ISO-8601 UTC, pagination `{items, nextCursor, hasMore}`.

### 6.3 Flux temps réel

Le mobile ouvre une connexion Socket.IO à `AppConfig.baseUrl`, puis émet l'événement `subscribe` avec son token et reçoit `subscribed` et `traccar_event` (`lib/core/services/traccar_socket_service.dart`). Le backoffice peut consommer un flux d'événements uniquement si le backend fournit un mode staff multi-tenant explicitement autorisé. Ne pas connecter le navigateur directement à Traccar ni transmettre un token dans les logs. Pour la première version, rafraîchissement contrôlé via API suffit.

### 6.4 Cloud Functions existantes

Fonctions relevées dans `functions/index.js` :

- `checkDocumentExpirations` : cron quotidien à 23 h, notifie à J-7, J-3, J-2, J-1 et J0 ; endpoint de test `checkDocumentExpirationsNow`.
- `generateDailyPaymentLogs` : cron quotidien à 23 h ; endpoint de test `generateDailyPaymentLogsNow`.
- `createDefaultSubscription` : déclenchée à la création de `users/{uid}`.
- `activateSubscription` : callable existante utilisée par le mobile.
- `checkExpiredSubscriptions` : cron quotidien ; endpoint de test `checkExpiredSubscriptionsNow`.
- `runSubscriptionMigration` : endpoint HTTP de migration.
- `deleteAccount` : callable de suppression en cascade et nettoyage Traccar.

Les endpoints `*Now` et migration sont des utilitaires de maintenance, pas des API de tableau de bord. Ne pas les exposer comme boutons accessibles à tous les opérateurs. S'ils doivent être invoqués depuis le backoffice, les sécuriser/autoriser côté serveur et journaliser l'opération.

## 7. Fonctionnalités et écrans

### 7.1 Tableau de bord global

Afficher des métriques filtrables par période (jour/semaine/mois/personnalisée) : clients inscrits et actifs, nouveaux comptes, abonnements par plan/statut, MRR/ARR si données RevenueCat vérifiées, véhicules et devices actifs/inactifs, dernière position reçue, documents expirés/à échéance, affectations actives, montant attendu/reçu/impayé selon `payment_logs`, erreurs API/Functions si les journaux d'observabilité sont connectés.

Chaque chiffre doit indiquer la période et la définition de calcul. Les chiffres financiers doivent provenir de données de facturation réconciliées (RevenueCat/webhooks ou source comptable retenue), pas être déduits du seul plan Firestore.

### 7.2 Clients

- Liste paginée, recherche email/nom/UID/téléphone, filtres plan, statut abonnement, date de création, dernière activité, état Auth.
- Vue détail client avec profil, état Firebase Auth, abonnement et permissions, volumes (véhicules/chauffeurs/documents), affectations, devices Traccar associés, incidents et historique d'actions support.
- Actions MVP : copier UID, ouvrir fiche, suspendre/réactiver le compte (Firebase Auth `disabled`), ajouter une note interne. Toute suspension exige motif et confirmation.
- Ne pas déclencher la suppression cascade depuis le premier écran. Si nécessaire, étape dédiée super_admin avec aperçu du nombre d'objets et de fichiers supprimés.

### 7.3 Abonnements et plans

- Liste et fiche avec plan, status, période, cycle, renouvellement, droits/quotas et informations de paiement disponibles.
- Filtres actifs/essai/expirés/annulés, plan, échéance prochaine.
- Actions autorisées : correction manuelle de statut/plan ou prolongation uniquement via endpoint admin serveur, avec motif, validation métier, cohérence des permissions et audit.
- Plans visibles depuis `plans/{planId}`. Une UI de modification n'est incluse qu'après spécification de validation, versionnement et effet sur les clients existants.
- Connexion RevenueCat : lire les événements/entitlements via API serveur ou webhooks existants à confirmer. Ne pas considérer `activateSubscription` comme le endpoint admin.

### 7.4 Parc véhicule / devices / GPS

- Table device avec client, véhicule lié, Traccar ID, `uniqueId`, modèle/catégorie, statut/disabled, `lastUpdate`, position la plus récente, âge du dernier signal.
- Fiche device : données Traccar, véhicule et client liés, dernière position, historique sur intervalle choisi, état de connexion et derniers événements.
- Filtrer devices jamais vus, silencieux au-delà d'un seuil configurable, désactivés ou sans rattachement.
- Rattachement déterminé en croisant `users/{uid}.traccarUserId`, `vehicles/{id}.deviceId`/`uniqueId`, et le device renvoyé par Traccar. Signaler les incohérences au lieu de les corriger implicitement.
- Toute action de rattachement/désactivation/suppression passe par API serveur avec audit. Le backoffice ne doit pas modifier directement les données Traccar.

### 7.5 Activité client et opérations métier

Vues en lecture d'abord pour véhicules, chauffeurs, affectations, documents et paiement logs. Les clients peuvent télécharger des documents sensibles : fournir uniquement des liens temporaires générés serveur, avec permission et audit si nécessaire. Les écrans support ne doivent pas afficher les documents privés par défaut.

### 7.6 Santé système

Table de disponibilité API, erreurs Cloud Functions, tâches planifiées, dernière exécution, notifications FCM en échec si observable, erreurs Traccar, latence et jobs de réconciliation. Brancher Cloud Logging / Error Reporting / Monitoring côté serveur ; ne pas interroger les URLs de test publiques des Functions pour constituer ces métriques.

## 8. Accès aux données : Firebase direct côté serveur, API pour opérations ciblées

### Lectures Firebase — pas de nouvelle API métier requise

Pour les vues de clients, abonnements, plans et données métier, le serveur Next.js peut interroger directement Firebase avec Admin SDK. Organiser ces accès derrière des fonctions serveur typées (par exemple `getClientsPage`, `getClientOverview`, `getSubscriptionsPage`) ; elles ne doivent jamais s'exécuter dans le navigateur.

- Liste totale des comptes : parcourir `Firebase Admin Auth listUsers(pageToken)` par pages, puis enrichir les résultats avec les profils `users/{uid}` et abonnements `subscriptions/{uid}` via lectures Firestore groupées. `listUsers` est paginé (ne pas supposer que 1 000 utilisateurs constituent la liste complète). L'email, le statut disabled et les dates de création/connexion viennent d'Auth ; le nom, téléphone et userType viennent du profil Firestore.
- Recherche : `listUsers` n'est pas un moteur de recherche général. Pour une recherche fiable par nom/téléphone et une pagination rapide, maintenir une projection serveur indexée (ex. `admin_client_index`) alimentée lors de création/mise à jour, ou proposer filtres paginés Firestore par champs indexables. Ne pas charger tous les comptes en mémoire à chaque recherche.
- Détail client : lire `users/{uid}`, `subscriptions/{uid}`, puis les collections filtrées par `ownerId == uid` (véhicules, chauffeurs, affectations, documents, payment_logs, notifications) et calculer les compteurs côté serveur.
- Abonnements et plans : `subscriptions` et `plans` sont consultables avec Admin SDK. Pagination par curseur ; prévoir index Firestore pour les filtres composés.
- Tableau de bord : les petits volumes peuvent être agrégés à la demande côté serveur ; pour les grands volumes, maintenir des agrégats/compteurs par jour ou par statut afin d'éviter un scan complet à chaque chargement.
- Créer une session serveur après connexion Firebase Auth (cookie HttpOnly, Secure, SameSite) ou valider le Firebase ID token à chaque requête serveur. Le rôle staff est vérifié avant chaque lecture globale, car Admin SDK contourne les règles Firestore.

### API dédiée — seulement pour actions sensibles et intégrations externes

Les routes suivantes sont des **routes proposées à créer** au backend serveur, pas des endpoints déjà constatés. Elles requièrent un compte staff vérifié et une permission précise. Les lectures Firebase restent des fonctions serveur du backoffice, sauf si un besoin d'API mutualisée apparaît.

| Méthode / route proposée | Objet |
|---|---|
| `PATCH /admin/v1/clients/{uid}/access` | Suspendre/réactiver via Firebase Admin Auth ; corps `{disabled, reason}` |
| `POST /admin/v1/subscriptions/{uid}/adjustments` | Ajustement exceptionnel abonnement avec validation métier, motif et audit |
| `GET /admin/v1/devices?clientId=&status=&staleBefore=&cursor=` | Inventaire Traccar multi-clients, enrichi avec Firestore (nécessite un accès Traccar admin côté serveur) |
| `GET /admin/v1/devices/{deviceId}` | Détail Traccar et relations client/véhicule |
| `GET /admin/v1/devices/{deviceId}/positions?from=&to=&cursor=` | Positions Traccar sur une période bornée |
| `PATCH /admin/v1/devices/{deviceId}` | Modification contrôlée dans Traccar |
| `POST /admin/v1/devices/{deviceId}/disable` | Désactivation si prise en charge par le backend Traccar |
| `GET /admin/v1/health` | Santé agrégée backend/jobs si elle n'est pas fournie par Cloud Monitoring |

Notes : la route mobile `GET /traccar/devices?id={id}` ne prouve pas qu'un compte puisse lister les devices de tous les clients. Confirmer le contrat et les permissions du backend Zira ; ajouter une route admin uniquement si ce scope n'existe pas. Les logs d'audit peuvent être écrits directement par le serveur Next.js via Admin SDK, sans API distincte, à condition que les règles d'accès et l'intégrité append-only soient appliquées.

## 9. Règles de sécurité et de cohérence

- Admin SDK uniquement en environnement serveur ; ne jamais inclure un compte de service dans Git ou le navigateur.
- Vérifier signature, expiration, audience et claims Firebase de chaque requête ; appliquer RBAC par route et journaliser les actions d'écriture.
- Autoriser MFA staff, HTTPS, politique CSP, protection CSRF pour cookies de session, limitation de débit, validation Zod/DTO, pagination bornée et timeouts.
- Exclure des réponses les mots de passe, `fcmToken`, tokens d'auth, identifiants secrets, données personnelles non nécessaires et URL Storage non protégées.
- Privilégier une désactivation à une suppression. Toute suppression nécessite une procédure et une confirmation renforcée.
- Ne pas déclencher d'actions depuis les GET. Idempotency key pour mutations relançables et traces `requestId`.
- Isoler les environnements dev/staging/prod et afficher clairement l'environnement courant dans l'interface.
- Les logs de paiement de l'application représentent le suivi attendu/reçu de l'activité, et ne prouvent pas à eux seuls un encaissement réel.

### Points de sécurité à corriger/valider avant réutilisation

1. `activateSubscription` vérifie `request.auth` mais lit `uid` depuis le payload (`functions/subscription_service.js`). Avant tout usage administratif ou nouvelle intégration, vérifier côté fonction que l'appelant est autorisé à changer ce `uid` (et idéalement imposer `uid === request.auth.uid` aux clients ordinaires ; route admin distincte pour le support).
2. Les handlers HTTP `checkDocumentExpirationsNow`, `generateDailyPaymentLogsNow`, `checkExpiredSubscriptionsNow` et `runSubscriptionMigration` ne montrent pas de garde d'auth dans `index.js` ; sécuriser l'accès avant de les appeler depuis un outil interne.
3. L'application conserve un champ `traccarPassword` dans son `UserModel`. Le backoffice ne doit jamais le restituer ; vérifier son stockage historique et planifier sa suppression/migration si ce champ n'est plus nécessaire.
4. Le modèle Firestore et `README.md` n'ont pas tous le même périmètre. Valider les règles Firestore et les index en production avant toute requête Admin globale.

## 10. Phasage de construction

### Phase 0 — Contrats et fondations

- Vérifier l'OpenAPI du backend Zira, les règles Firestore, index, règles Storage, claims disponibles et webhooks RevenueCat.
- Définir comptes staff, RBAC, audit, environnements et contrats d'API admin.
- Ajouter tests d'autorisation backend et données de démonstration anonymisées.

### Phase 1 — MVP interne en lecture seule

- Auth staff, shell visuel avec logo/tokens, overview, recherche clients, fiche client, liste abonnements, parc devices et état de dernière position.
- Pagination, filtres, états d'erreur, audit des lectures sensibles et observabilité.

### Phase 2 — Actions support limitées

- Suspension/réactivation client, ajustement abonnement, désactivation/rattachement device après API support correspondante.
- Motifs obligatoires, confirmation renforcée, audit et possibilité de consulter les changements.

### Phase 3 — Finances, automatisation et exploitation

- Réconciliation RevenueCat, rapports financiers validés, exports, tableaux de santé et flux temps réel staff si le backend le permet.

## 11. Critères d'acceptation

- Un compte non-staff ne peut ni ouvrir les pages ni appeler les routes admin ; les permissions sont testées côté serveur.
- Un rôle `viewer` ne peut effectuer aucune mutation ; chaque route d'écriture refuse les rôles insuffisants.
- La recherche et la pagination couvrent toutes les pages sans exposer les champs secrets.
- Depuis une fiche client, l'opérateur peut retrouver abonnement, véhicules et devices liés, avec les incohérences signalées.
- Un device montre son dernier signal avec horodatage et âge lisibles ; la carte/historique respecte une fenêtre de temps bornée.
- Toute mutation enregistre acteur, cible, motif, résultat et horodatage sans secret dans les logs.
- La direction visuelle utilise le logo, Outfit et les tokens Zira, avec navigation clavier, labels accessibles et contraste suffisant.
- Les données financières sont étiquetées selon leur source et ne mélangent pas abonnement commercial, revenus Traccar et paiement logs opérationnels.

## 12. Consignes à l'IA qui réalisera le code

1. Commencer par inspecter les contrats OpenAPI du backend, règles/index Firestore et schémas réels en staging ; ne pas inventer les routes existantes.
2. Implémenter d'abord le MVP lecture seule et l'API admin sécurisée, puis brancher l'interface. Utiliser des fixtures anonymisées si une source n'est pas disponible.
3. Garder les appels API dans une couche dédiée typée (`adminApi`), les composants UI sans logique métier et les permissions dérivées du serveur.
4. Réutiliser les noms de champs Firestore présents dans les modèles, tout en normalisant les DTO API au bord du système.
5. Construire des composants réutilisables : `AppShell`, `BrandLogo`, `MetricCard`, `DataTable`, `StatusBadge`, `DateRangeFilter`, `ConfirmActionDialog`, `AuditTimeline`.
6. Ajouter tests pour RBAC, pagination, masquage de données sensibles et actions destructives. Ne jamais mettre de clé secrète dans les fichiers frontend.
7. Si une donnée ou route n'existe pas, documenter le prérequis backend au lieu de fabriquer un faux résultat ou d'appeler directement Traccar depuis le navigateur.
