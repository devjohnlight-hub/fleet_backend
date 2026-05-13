# WebSocket — Fleet Backend

## Vue d'ensemble

Le système WebSocket du Fleet Backend permet aux clients (applications mobile/web) de recevoir **en temps réel** les événements Traccar (positions GPS, changements d'état des véhicules, alertes) sans polling HTTP.

### Architecture

```
Client (Socket.IO)
      │
      │  subscribe(token Firebase)
      ▼
FleetGateway (Socket.IO — NestJS)
      │
      │  getSessionCookie(email, password)
      ▼
TraccarWebsocketService
      │
      │  WebSocket natif ws://traccar/api/socket
      ▼
Serveur Traccar
```

Chaque utilisateur authentifié dispose de **sa propre connexion WebSocket vers Traccar**. Les événements reçus sont immédiatement retransmis au client Socket.IO correspondant.

---

## Dépendances

| Package | Version | Rôle |
|---|---|---|
| `@nestjs/websockets` | ^11 | Décorateurs NestJS (Gateway, Server…) |
| `@nestjs/platform-socket.io` | ^11 | Adaptateur Socket.IO pour NestJS |
| `socket.io` | ^4 | Transport client ↔ gateway |
| `ws` | ^8 | Connexion WebSocket native vers Traccar |

---

## Fichiers concernés

```
src/
└── infrastructure/
    ├── gateways/
    │   └── fleet.gateway.ts          # Point d'entrée Socket.IO côté client
    ├── modules/
    │   └── fleet-websocket.module.ts # Module NestJS regroupant les providers
    └── traccar/
        └── traccar-websocket.service.ts  # Connexion WebSocket vers Traccar
```

---

## Connexion et authentification

### 1. Se connecter au serveur

Le client se connecte via Socket.IO à la racine du serveur :

```js
const socket = io('http://localhost:3000');
```

> CORS est configuré en `origin: '*'` (à restreindre en production).

### 2. S'abonner aux événements Traccar

Après connexion, le client envoie l'événement `subscribe` avec son **token Firebase ID** :

```js
socket.emit('subscribe', '<firebase_id_token>');
```

**Ce qui se passe côté serveur :**

1. Le token Firebase est vérifié via `admin.auth().verifyIdToken(token)`.
2. Le profil Firestore de l'utilisateur est récupéré pour obtenir ses credentials Traccar.
3. Une connexion WebSocket est ouverte vers `ws://traccar/api/socket` avec un cookie de session Traccar.
4. Les événements Traccar sont relayés en temps réel au client.

### 3. Réponses de l'étape d'abonnement

| Événement reçu | Condition | Payload |
|---|---|---|
| `subscribed` | Succès | `{ status: 'connected' }` |
| `error` | Token invalide | `'Token Firebase invalide'` |
| `error` | Pas de compte Traccar | `'Aucun compte Traccar associé'` |

---

## Événements temps réel

Une fois abonné, le client reçoit l'événement `traccar_event` à chaque message Traccar :

```js
socket.on('traccar_event', (event) => {
  console.log(event);
});
```

### Structure d'un `TraccarEvent`

```ts
interface TraccarEvent {
  devices?:   unknown[];  // Changements d'état des appareils
  positions?: unknown[];  // Nouvelles positions GPS
  events?:    unknown[];  // Alertes / notifications Traccar
}
```

> Les champs sont optionnels. Un message peut ne contenir que `positions`, ou `events`, etc.

#### Exemple — mise à jour de position

```json
{
  "positions": [
    {
      "id": 1,
      "deviceId": 42,
      "latitude": 48.8566,
      "longitude": 2.3522,
      "speed": 72.5,
      "course": 180,
      "fixTime": "2026-05-13T10:00:00.000Z"
    }
  ]
}
```

#### Exemple — changement d'état d'un appareil

```json
{
  "devices": [
    {
      "id": 42,
      "name": "Camion-01",
      "status": "online",
      "lastUpdate": "2026-05-13T10:00:00.000Z"
    }
  ]
}
```

---

## Déconnexion

La déconnexion est gérée automatiquement. Quand un client Socket.IO se déconnecte, `FleetGateway.handleDisconnect` :

1. Retrouve le `firebaseUid` associé au `socketId`.
2. Appelle `TraccarWebsocketService.disconnect(firebaseUid)` pour fermer la connexion WebSocket Traccar.
3. Nettoie la map `userSockets`.

Le client peut aussi se déconnecter explicitement :

```js
socket.disconnect();
```

---

## Exemple complet (client JavaScript)

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  const token = await getFirebaseIdToken(); // votre logique d'auth Firebase
  socket.emit('subscribe', token);
});

socket.on('subscribed', ({ status }) => {
  console.log('Abonnement Traccar actif :', status);
});

socket.on('traccar_event', (event) => {
  if (event.positions) {
    event.positions.forEach((pos) => {
      console.log(`Appareil ${pos.deviceId} → lat:${pos.latitude} lng:${pos.longitude}`);
    });
  }
});

socket.on('error', (msg) => {
  console.error('Erreur WebSocket :', msg);
  socket.disconnect();
});
```

---

## Comportement en production

- **Reconnexion Traccar** : si la connexion WebSocket vers Traccar se ferme (timeout, redémarrage), elle n'est pas reconnectée automatiquement. Le client doit se déconnecter et re-émettre `subscribe`.
- **Arrêt du serveur** : `TraccarWebsocketService.onModuleDestroy` ferme proprement toutes les connexions Traccar ouvertes.
- **CORS** : restreindre `origin: '*'` dans `FleetGateway` selon les domaines autorisés en production.
