# Backoffice Zira — plan d'action backend

> Suivi de l'implémentation côté `fleet_backend` (NestJS) des routes d'administration décrites dans `docs/BACKOFFICE_SPEC.md`.
> Dernière mise à jour : 2026-10-28.

## Principe

- Les **lectures Firebase** (clients, abonnements, plans, véhicules, chauffeurs, documents, payment_logs) sont faites directement par le serveur Next.js du backoffice via Admin SDK → **pas de route ici**.
- Ce backend expose uniquement sous `/admin/v1/*` : **mutations sensibles** et **opérations Traccar multi-clients**, avec RBAC staff + audit.
- Façon de travailler : Claude écrit le code, **l'utilisateur lance lui-même les commandes** (build, start, curl, scripts) et renvoie les résultats.

## Conventions mises en place

| Élément | Fichier | Usage |
|---|---|---|
| Rôles staff | `src/core/domain/entities/staff-role.ts` | `StaffRole` (`super_admin`, `support`, `billing`, `viewer`), claim Firebase `staffRole`, interface `StaffUser { id, email, role, requestId }` |
| Guard | `src/infrastructure/guards/staff-auth.guard.ts` | `verifyIdToken(token, true)` (révocation vérifiée), refuse sans claim valide (403), pose `req.staff`, header `X-Request-Id` |
| Restriction de rôle | `src/infrastructure/decorators/staff-roles.decorator.ts` | `@StaffRoles(StaffRole.SUPPORT, ...)` — sans décorateur, tout rôle staff passe |
| Staff courant | `src/infrastructure/decorators/current-staff.decorator.ts` | `@CurrentStaff() staff: StaffUser` |
| Audit | `src/core/application/services/admin-audit.service.ts` | `audit.log(staff, { action, targetType, targetId, result, reason, before, after, error })` → `admin_audit_logs`, append-only, clés sensibles masquées |
| Module | `src/infrastructure/modules/admin.module.ts` | Enregistré dans `app.module.ts`. Services core instanciés via `useFactory` (même pattern que les autres modules) |
| Provisionnement | `scripts/set-staff-role.ts` | `node --env-file=.env -r ts-node/register scripts/set-staff-role.ts <email> <role\|none>` (révoque les sessions → reconnexion nécessaire) |

Obtenir un ID token de test :

```bash
curl -s "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=<FIREBASE_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"<email>","password":"<mot de passe>","returnSecureToken":true}'
```

Format de réponse : enveloppe existante `ApiResponse` `{success, message, data}`. Pour les listes admin : `data = { items, nextCursor, hasMore }`.

## Avancement

### ✅ Étape 1 — Fondations staff
- Rôles, guard, décorateur, script de provisionnement. Build OK, compte `super_admin` créé.

### ✅ Étape 2 — Audit + module admin + health
- `GET /admin/v1/health` (tout staff) : vérifie Firestore, Redis, Traccar (`/api/server`) avec latence.
- Testé : super_admin → 200 ; compte client → 403 « Accès réservé au personnel Zira ».
- `AdminAuditService` créé mais pas encore utilisé (sera branché sur la première mutation).

### ⚠️ Bloquants ouverts
1. **Traccar injoignable en local** : health renvoie `traccar: down` (timeout 10 s). Problème réseau (firewall droplet / port 8082 / `TRACCAR_URL` privée), pas de code. Diagnostic : `grep TRACCAR_URL .env` puis `curl -i -m 10 "<TRACCAR_URL>/api/server"`. Bloque toutes les routes devices.
2. ~~`StaffRole.VIEWER` vaut `' '`~~ → corrigé (`'viewer'`).

## Prochaines étapes

### 🚧 Étape 3 — Phase 1 : devices Traccar en lecture (tout staff)
Utiliser `TraccarHttpClient` sans `credentials` → auth admin Traccar.

Code écrit le 2026-10-28, **build et tests à faire** : `admin-device.controller.ts`, `admin-device.service.ts`, `admin-devices-query.dto.ts`.
Filtres supplémentaires : `neverSeen`, `disabled`, `unlinked` (booléens). Incohérences renvoyées dans `issues[]` ; véhicules pointant un device absent dans `orphanVehicles` (1re page uniquement). Contrôle `OWNER_NO_TRACCAR_PERMISSION` seulement sur le détail (coûteux en liste).

- [ ] `GET /admin/v1/devices?clientId=&status=&staleBefore=&cursor=&limit=`
  - Traccar `GET /api/devices?all=true` (admin), enrichi avec Firestore `vehicles` (`deviceId`/`uniqueId`) et `users` (`traccarUserId`).
  - Pour chaque device : client, véhicule lié, `uniqueId`, modèle/catégorie, `disabled`, `status`, `lastUpdate`, âge du dernier signal.
  - Filtres : jamais vu, silencieux > seuil, désactivé, sans rattachement. Pagination bornée (limit max 100).
  - Signaler les **incohérences** (device sans véhicule, véhicule pointant un device inexistant, owner ≠ utilisateur Traccar lié) sans les corriger.
  - `clientId` → récupérer `users/{uid}.traccarUserId` puis `GET /api/devices?userId=`.
- [ ] `GET /admin/v1/devices/:deviceId` : détail Traccar + véhicule + client + dernière position + incohérences.
- [ ] `GET /admin/v1/devices/:deviceId/positions?from=&to=` : fenêtre bornée (ex. ≤ 7 jours, sinon 400), via Traccar `/api/positions?deviceId=&from=&to=`.
- [ ] Ne jamais renvoyer `traccarPassword`, `fcmToken`, tokens.

### 🚧 Étape 4 — Phase 2 : mutations (avec `reason` obligatoire + audit avant/après)
Code écrit le 2026-10-28, build OK, routes protégées (401 sans token). **Tests avec token staff à faire.**

- [x] `PATCH /admin/v1/clients/:uid/access` `{ disabled, reason }` — `support`, `super_admin`. `updateUser({disabled})` + `revokeRefreshTokens` si suspension. Refus : son propre compte (400), compte staff si l'appelant n'est pas `super_admin` (403).
- [x] `POST /admin/v1/subscriptions/:uid/adjustments` `{ planId?, status?, endDate?, reason }` — `billing`, `super_admin`. `planId` → copie `plans/{planId}.permissions`. Statuts acceptés : `trial`, `active`, `expired`, `cancelled`. Cohérence : `endDate > startDate` ; `active`/`trial` ⇒ `endDate` future ; `expired` ⇒ `endDate` passée. `trialEndDate` non modifié.
- [x] `PATCH /admin/v1/devices/:deviceId` `{ name?, uniqueId?, groupId?, phone?, model?, contact?, category?, reason }` — `support`, `super_admin`. PUT Traccar avec l'objet complet fusionné ; `uniqueId` resynchronisé sur les véhicules Firestore.
- [x] `POST /admin/v1/devices/:deviceId/disable` et `/enable` `{ reason }` — `support`, `super_admin`.
- [x] `POST /admin/v1/devices/:deviceId/link` `{ vehicleId, ownerId, reason }` — `support`, `super_admin`. Vérifie propriétaire du véhicule, compte Traccar du client ; 409 si véhicule ou device déjà rattaché ailleurs (jamais de déplacement implicite) ; ajoute la permission Traccar si absente.
- [x] `Idempotency-Key` (Redis, 24 h, par staff + méthode + chemin) : rejoue la réponse, 409 si en cours, 422 si corps différent ; clé libérée en cas d'échec.
- Audit via `AdminAuditService.record()` (succès et échec). No-op (état déjà atteint) → `changed: false`, pas d'audit.

### 🚧 Étape 5 — Gestion staff et utilitaires
Code écrit le 2026-10-28, build OK, routes protégées (401 sans token). **Tests avec token staff à faire.**

- [x] `GET /admin/v1/staff` — `super_admin`. Parcourt Firebase Auth (`listUsers`) et filtre sur le claim ; expose `mfaEnrolled`.
- [x] `POST /admin/v1/staff` `{ email, role, reason }` — `super_admin`. Compte Auth existant uniquement ; 409 si déjà staff.
- [x] `PATCH /admin/v1/staff/:uid` `{ role | null, reason }` — `super_admin`. `null` retire l'accès ; refus sur soi-même (garantit qu'il reste un super_admin). Révoque les sessions.
- [x] `GET/POST /admin/v1/clients/:uid/notes` `{ body }` — lecture `support`/`billing`/`super_admin`, écriture `support`/`super_admin`. Collection `admin_client_notes`, append-only.
- [x] `GET /admin/v1/audit-logs?targetType=&targetId=&actorUid=&action=&cursor=&limit=` — `super_admin`, `support`, `billing`.
- [ ] `GET /admin/v1/documents/:id/download-url` — **reporté** : les fichiers sont sur Cloudinary en `type: upload` (URL publiques permanentes). Une URL signée n'a de sens qu'après migration en `type: authenticated`.
- [ ] `POST /admin/v1/jobs/:name/run` — **reporté** : nécessite le dépôt Cloud Functions (URLs et sécurisation des endpoints `*Now`).
- Index Firestore composites probablement requis : `admin_client_notes (clientId, createdAt desc)` et `admin_audit_logs (<filtre>, createdAt desc)` — le lien de création apparaît dans l'erreur `FAILED_PRECONDITION`.

### ✅ Étape 6 — Tests (2026-10-28)
`npx jest` (unitaires) et `npx jest --config ./test/jest-e2e.json test/admin.e2e-spec.ts` (e2e) — **81 tests, tous verts**. Vérifié que les tests échouent bien si une route de mutation est ouverte à `viewer`.

- [x] `staff-auth.guard.spec.ts` : sans token, Bearer absent, token invalide/révoqué, `checkRevoked`, compte client (403), claim inconnu, rôle insuffisant, rôle OK + `req.staff`, `X-Request-Id`.
- [x] `admin-audit.service.spec.ts` : masquage (casse, profondeur, tableaux), aucune valeur secrète écrite, `record()` succès/échec.
- [x] `admin.module.spec.ts` : inspection des métadonnées de **toutes** les routes — `StaffAuthGuard` sur chaque controller, chaque mutation restreinte sans `viewer` et avec `IdempotencyInterceptor`, staff réservé au `super_admin`. Une nouvelle route mal protégée fait échouer ce test.
- [x] `test/admin.e2e-spec.ts` (Firestore/Redis/Traccar simulés, `test/support/fake-firestore.ts`) : 401 sans token, 403 compte client, `viewer` refusé sur les 9 mutations sans effet de bord ni audit, séparation support/billing, aucun `traccarPassword`/`fcmToken` dans `GET /devices` et `/devices/:id`, mutation autorisée + audit, 400 sans motif, rejeu `Idempotency-Key` et 422.
- Non couvert : les tests contre les vrais Firebase/Traccar (nécessitent un token staff et des données de test), `test/app.e2e-spec.ts` existant (dépend de l'infra réelle).
- Lint : Prettier appliqué aux fichiers backoffice ; il reste 42 erreurs ESLint type-aware (surtout `require-await`/`no-unsafe-*` dans les tests). Le dépôt n'est pas propre au lint par ailleurs (123 erreurs hors backoffice).

## Dette sécurité existante (hors backoffice, à corriger)

1. `GET /users` et `GET /users/:id` (`firestore-user.controller.ts`) : accessibles à tout client connecté et sérialisent l'entité complète → **fuite de `traccarPassword` / `fcmToken`** de tous les utilisateurs. Restreindre à `id === req.user.id` et renvoyer un DTO sans secrets.
2. `PUT` / `DELETE /users/:id` : aucune vérification que l'`id` est celui de l'appelant.
3. `/traccar/groups`, `/companies`, `/vehicules` : aucun guard.
4. Côté Cloud Functions (autre dépôt) : `activateSubscription` lit `uid` du payload ; endpoints `*Now` et `runSubscriptionMigration` sans garde d'auth.
5. Changer les mots de passe des comptes de test partagés en clair pendant la session du 2026-10-12.
6. `POST /files/upload` (`file-upload.controller.ts`) : **aucun guard** — upload anonyme vers le compte Cloudinary, `folder` libre.
7. Documents clients stockés en Cloudinary public (`type: upload`) : toute `fileUrl` est accessible sans authentification.
8. À vérifier : `PUT /traccar/devices/:id` envoie un objet partiel à Traccar, qui remplace l'entité entière → risque d'effacement des champs absents.
