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


#### Pipeline de logs (production)

La stack prod ajoute **Loki** (stockage), **Promtail** (scrape Docker via `docker_sd_configs`) et **Grafana** (UI). pino émet du JSON sur stdout → Docker capture → Promtail enrichit avec `service`/`container`/`level` puis pousse vers Loki.

- `observability/loki-config.yml` — Loki single-binary, rétention 7 jours, schéma `v13`.
- `observability/promtail-config.yml` — découverte Docker, parsing JSON ciblé sur le container `api`.
- `observability/grafana/provisioning/datasources/loki.yml` — Loki provisionné comme datasource par défaut.


## Démarrage (stack de dev)

La stack de dev se compose de **Postgres en Docker** + l'API lancée localement via `npm run dev` (rechargement à chaud, sources TypeScript).

```bash
cp .env.dist .env                       # ajuster JWT_SECRET (>= 32 chars)
docker compose up -d                    # Postgres 16 sur :5432 (compose file: docker-compose.yml)
npm install
npm run db:migrate                      # applique les migrations
npm run db:seed                         # 10 salles + films + utilisateurs de démo
npm run dev                             # http://localhost:3000
```

Pour arrêter Postgres : `docker compose down` (ajoute `-v` pour effacer aussi le volume de données).

## Tests

```bash
npm test                                       # tous les tests
npm test -- tests/integration/rooms.test.ts    # uniquement le M5
```

Les tests utilisent une base `cinema_test` séparée, créée et migrée automatiquement par `tests/global-setup.ts`.

## Production (stack complète)

Image Docker multi-étape (`Dockerfile`) : build TypeScript → image runtime sans sources `.ts`. La stack `docker-compose.prod.yml` orchestre Postgres + un job de migration unique (`prisma migrate deploy`) + l'API + Caddy (reverse proxy + TLS auto Let's Encrypt) + Prometheus (métriques) + Loki/Promtail/Grafana (logs et dashboards).

Variables requises dans le fichier d'env (par convention `.env.prod`, non versionné) :
`POSTGRES_PASSWORD`, `JWT_SECRET`, `DATABASE_URL`, `PUBLIC_URL`, `PUBLIC_HOST`, `GRAFANA_ADMIN_PASSWORD`.

```bash
# Démarrer (build de l'image + up détaché)
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build

# Suivre les logs
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f api

# Arrêter (conserve les volumes : DB, certificats, données Loki/Prometheus)
docker compose --env-file .env.prod -f docker-compose.prod.yml down

# Arrêter et tout effacer (DB + certs + métriques + logs)
docker compose --env-file .env.prod -f docker-compose.prod.yml down -v
```

## API déployée

Base URL pour l'API :
`http://31.56.29.3:4444/v1`

Documentation Swagger :
`http://31.56.29.3:4444/docs`

Métriques Prometheus :
`http://31.56.29.3:4444/metrics`

Grafana :
`http://31.56.29.3:3001/`

Caddy gère HTTPS automatiquement pour le domaine défini par `PUBLIC_HOST` (les certificats persistent dans le volume `caddy_data`). Grafana est exposé sur le port `3001` (toutes interfaces) — login via `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD`.
