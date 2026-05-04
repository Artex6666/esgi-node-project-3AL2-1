# Cinema API

API REST pour la gestion d'un cinéma (sujet ESGI). Node.js + TypeScript + PostgreSQL.

Le cinéma est ouvert du lundi au vendredi de 9h à 20h.

## Stack et choix techniques

| Couche | Choix | Pourquoi |
|---|---|---|
| Runtime | **Node.js ≥ 25**, TypeScript strict, ESM natif | Imports `.js` côté source, build via `tsc`, pas de transpilation custom |
| Framework HTTP | **Express 5** + **express-zod-api** | Express pour la maturité, `express-zod-api` pour brancher des endpoints typés bout-en-bout (input/output Zod → handlers, OpenAPI auto, gestion d'erreurs unifiée) |
| Validation | **Zod 4** | Une seule source de vérité : les schémas valident l'entrée HTTP, typent le handler, et servent à générer la doc. Pas de DTO ni de class-validator |
| ORM | **Prisma 6** + PostgreSQL | Schéma déclaratif, migrations versionnées, types générés. Postgres pour les contraintes (FK, unique) et `String[]` natif sur `Room.images` |
| Auth | **JWT (HS256)** access + **refresh tokens hashés en DB** (sha256) | Stateful refresh : on peut révoquer un device sans toucher au secret JWT. Access courts (5 min, sujet) → rotation via refresh |
| Hash de mots de passe | **argon2** | Standard moderne, recommandé par OWASP, plus résistant au GPU que bcrypt |
| Logger | **pino** (JSON) | Logs structurés (1 ligne JSON par évènement), pas de string concaténée. Branché sur `express-zod-api` (logs request/response) et sur les events Prisma. Champs sensibles (Authorization, cookie, `*.password`, `*.token`) redactés via `redact:` |
| Métriques | `prom-client` | Endpoint Prometheus prévu pour l'observabilité |
| Tests | **vitest** + **supertest** | Tests d'intégration HTTP qui frappent la vraie app contre une DB Postgres dédiée (`cinema_test`), créée et migrée par `tests/global-setup.ts` |
| Lint / format | ESLint flat config + Prettier | Standard, pas de règles maison exotiques |

### Convention de modules

Chaque module suit la même arborescence :

```
src/modules/<name>/
  schemas.ts     // schémas Zod (input/output, partagés service ↔ HTTP)
  service.ts     // logique métier + accès Prisma
  endpoints.ts   // build() via factories typées
  routing.ts     // arbre de routes pour express-zod-api
```

Les **factories** composent les middlewares : `baseFactory` → `authedFactory` (+ JWT) → `adminFactory` (+ rôle). Aucun module n'a besoin de redéclarer la chaîne d'auth.

### Erreurs

Une seule classe racine `AppError` dans `src/lib/errors.ts` qui imite la shape `http-errors` (`statusCode`, `status`, `expose`) pour que `defaultResultHandler` d'`express-zod-api` propage le bon code HTTP au lieu de tout coercer en 500. Les sous-classes : `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `UnprocessableError`.

---

## Modules livrés

### M1–M4 — Fondations, Auth, Films — *Etienne Quantin*

- [x] Bootstrap Express + `express-zod-api`, factory `baseFactory`, endpoint `/health`
- [x] Docker Compose dev (Postgres 16-alpine, healthcheck, volume persistant)
- [x] Schéma Prisma complet (User, RefreshToken, Room, Movie, Session, Ticket, TicketUsage, Transaction, EmployeeShift) + migration initiale + seed
- [x] Validation d'environnement via Zod (`src/config/env.ts`) — fail-fast au boot si `JWT_SECRET` < 32 chars, `DATABASE_URL` invalide, etc.
- [x] Logger pino structuré + redaction des champs sensibles
- [x] Classes d'erreurs HTTP réutilisables (`src/lib/errors.ts`)
- [x] Helpers tokens (`src/lib/tokens.ts`) : signature/vérification JWT, émission de refresh tokens hashés, **rotation transactionnelle** du refresh token, révocation globale par user
- [x] Auth middleware (Bearer JWT) injectant l'utilisateur dans le contexte
- [x] Role middleware (`requireRole(...)`) composable
- [x] Endpoints auth : `POST /v1/auth/register`, `/login`, `/refresh`, `/logout`
- [x] Endpoint `GET /v1/me`
- [x] Module **Movies** : CRUD admin + planning par film + filtre maintenance des salles
- [x] Tests d'intégration auth + movies (helpers `seedUser`, `truncateAll`, DB de test isolée)

### M5 — Gestion des Salles — *Loris RAMEAU*

Conforme à la section *Gestion des Salles de Cinéma* du sujet.

- [x] CRUD complet (Créer, Lire, Mettre à jour, Supprimer) sur les salles
- [x] Champs : `name`, `description`, `images` (string[]), `type`, `capacity`, `accessible` (optionnel, défaut `false`)
- [x] Contrainte de capacité **15 ≤ capacity ≤ 30** appliquée au schéma Zod (rejet 400)
- [x] Au moins **10 salles** seedées (`prisma/seed.ts`)
- [x] Toggle de mise en maintenance par admin (`PATCH /v1/rooms/:id/maintenance`)
- [x] Une salle en maintenance n'apparaît plus dans le planning : la liste des séances renvoyée pour cette salle est vide (cohérent avec le filtre déjà appliqué côté `movies/:id/planning`)
- [x] **Planning d'une salle** sur une période choisie (`from`/`to` ISO-8601, optionnels) — passé ou futur — accessible à tout utilisateur authentifié
- [x] Suppression refusée (409) si la salle a encore des séances (FK Prisma `P2003`)
- [x] Création refusée (409) si le nom est déjà pris (`P2002`)
- [x] Tests d'intégration sur tous les endpoints (rôles, validation, maintenance, planning)

#### Endpoints exposés

| Méthode | Path | Accès |
|---|---|---|
| `GET` | `/v1/rooms` | authentifié |
| `GET` | `/v1/rooms/:id` | authentifié |
| `POST` | `/v1/rooms` | admin |
| `PUT` | `/v1/rooms/:id` | admin |
| `DELETE` | `/v1/rooms/:id` | admin |
| `PATCH` | `/v1/rooms/:id/maintenance` | admin — body `{ underMaintenance: boolean }` |
| `GET` | `/v1/rooms/:id/planning?from=&to=` | authentifié |

### M6 — Gestion des Séances — *Loris RAMEAU*

Conforme à la section *Gestion des Séances* du sujet.

- [x] Helpers temporels réutilisables : [src/lib/businessHours.ts](src/lib/businessHours.ts) (heures d'ouverture, durée min, weekday) et [src/lib/overlap.ts](src/lib/overlap.ts) (intervalles semi-ouverts)
- [x] CRUD complet sur les séances réservé aux admins
- [x] Liste / planning des séances accessible à tout utilisateur authentifié, avec filtre `from`/`to` ISO-8601
- [x] Endpoint admin de fréquentation par séance (`attendeesCount` = nombre de `TicketUsage` rattachés)
- [x] **Règle « cinéma ouvert Lun-Ven 09:00–20:00 »** : rejet 422 si la séance déborde, n'est pas un jour ouvré, ou chevauche minuit
- [x] **Règle « durée ≥ film + 30 min »** : rejet 422 si la séance est trop courte
- [x] **Pas de chevauchement** : rejet 409 si une autre séance dans la même salle ou pour le même film recoupe l'intervalle (intervalles semi-ouverts → enchaînements dos à dos OK)
- [x] Salle en maintenance : création/MAJ refusée (422), et la liste ne renvoie pas les séances qui s'y déroulent
- [x] Suppression refusée (409) si la séance a déjà des billets utilisés (FK Prisma `P2003`)
- [x] Seed planifie ≥ 1 mois de séances ouvrées à l'avance (déjà en place)
- [x] Tests d'intégration : CRUD + rôles, business hours (weekend, avant 9h, après 20h, start ≥ end), durée (frontière `film + 30`), overlap (même salle, même film salle ≠, dos-à-dos OK, salles ≠ films ≠ OK), maintenance, attendance (compte, 0, 403, 404)

#### Endpoints exposés

| Méthode | Path | Accès |
|---|---|---|
| `GET` | `/v1/sessions?from=&to=` | authentifié — exclut les salles en maintenance |
| `GET` | `/v1/sessions/:id` | authentifié |
| `POST` | `/v1/sessions` | admin |
| `PUT` | `/v1/sessions/:id` | admin |
| `DELETE` | `/v1/sessions/:id` | admin |
| `GET` | `/v1/sessions/:id/attendance` | admin — `{ sessionId, attendeesCount }` |

---

## Démarrage

```bash
cp .env.dist .env          # ajuster JWT_SECRET (>= 32 chars)
docker compose up -d       # Postgres
npm install
npm run db:migrate         # applique les migrations
npm run db:seed            # 10 salles + films + utilisateurs de démo
npm run dev                # http://localhost:3000
```

## Tests

```bash
npm test                                       # tous les tests
npm test -- tests/integration/rooms.test.ts    # uniquement le M5
```

Les tests utilisent une base `cinema_test` séparée, créée et migrée automatiquement par `tests/global-setup.ts`.
