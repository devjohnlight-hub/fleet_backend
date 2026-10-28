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

### Étape 4 — Phase 2 : mutations (avec `reason` obligatoire + audit avant/après)
- [ ] `PATCH /admin/v1/clients/:uid/access` `{ disabled, reason }` — `support`, `super_admin`. Firebase `updateUser({disabled})` + `revokeRefreshTokens` si suspension.
- [ ] `POST /admin/v1/subscriptions/:uid/adjustments` `{ planId?, status?, endDate?, reason }` — `billing`, `super_admin`. Valider cohérence plan/permissions (lire `plans/{planId}`).
- [ ] `PATCH /admin/v1/devices/:deviceId` — `support`, `super_admin`. Synchroniser les champs véhicule Firestore comme le fait déjà `traccar-device.controller.ts`.
- [ ] `POST /admin/v1/devices/:deviceId/disable` `{ reason }` — `support`, `super_admin`.
- [ ] `POST /admin/v1/devices/:deviceId/link` `{ vehicleId, ownerId, reason }` — `support`, `super_admin` (utiliser `linkDeviceToUser`).
- [ ] Support `Idempotency-Key` sur les mutations relançables (stockage Redis).

### Étape 5 — Gestion staff et utilitaires
- [ ] `GET/POST/PATCH /admin/v1/staff` — `super_admin` uniquement (remplace le script à terme).
- [ ] `POST /admin/v1/clients/:uid/notes` (optionnel si Next.js écrit directement).
- [ ] `GET /admin/v1/documents/:id/download-url` — URL signée courte + audit.
- [ ] `GET /admin/v1/audit-logs?targetId=&actor=&cursor=` (si Next.js ne lit pas directement la collection).
- [ ] `POST /admin/v1/jobs/:name/run` — `super_admin`, pour remplacer les appels aux Cloud Functions `*Now` (à sécuriser côté Functions).

### Étape 6 — Tests
- [ ] Tests unitaires `StaffAuthGuard` (sans token, token client, rôle insuffisant, rôle OK).
- [ ] Tests `AdminAuditService.redact`.
- [ ] Tests e2e : `viewer` ne peut faire aucune mutation ; aucun champ secret dans les réponses.

## Dette sécurité existante (hors backoffice, à corriger)

1. `GET /users` et `GET /users/:id` (`firestore-user.controller.ts`) : accessibles à tout client connecté et sérialisent l'entité complète → **fuite de `traccarPassword` / `fcmToken`** de tous les utilisateurs. Restreindre à `id === req.user.id` et renvoyer un DTO sans secrets.
2. `PUT` / `DELETE /users/:id` : aucune vérification que l'`id` est celui de l'appelant.
3. `/traccar/groups`, `/companies`, `/vehicules` : aucun guard.
4. Côté Cloud Functions (autre dépôt) : `activateSubscription` lit `uid` du payload ; endpoints `*Now` et `runSubscriptionMigration` sans garde d'auth.
5. Changer les mots de passe des comptes de test partagés en clair pendant la session du 2026-10-12.
