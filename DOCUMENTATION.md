# PCPhone — Documentation Index

> Start here. This file points you to the right doc based on what you want to know.

## For End Users

| If you want to... | Read this |
|---|---|
| Learn how the app works and how to use it | [`USER_GUIDE.md`](./USER_GUIDE.md) |
| Set up the app for the first time | [`SETUP.md`](./SETUP.md) |
| Get a quick start (developers) | [`README.md`](./README.md) |

## For Developers / Operators

| If you want to... | Read this |
|---|---|
| Understand the system architecture | [`docs/01-architecture.md`](./docs/01-architecture.md) |
| See the technology choices | [`docs/02-tech-stack.md`](./docs/02-tech-stack.md) |
| Check API endpoints | [`docs/03-api-design.md`](./docs/03-api-design.md) |
| Review database schema | [`docs/04-data-models.md`](./docs/04-data-models.md) |
| Understand authentication & security | [`docs/05-auth-security.md`](./docs/05-auth-security.md) |
| See the implementation roadmap | [`docs/06-implementation-roadmap.md`](./docs/06-implementation-roadmap.md) |
| Deploy the backend to a cloud server | [`docs/07-deployment.md`](./docs/07-deployment.md) |

## Repository Layout

```
pcphone/
├── USER_GUIDE.md         ← How the app works (for end users)
├── SETUP.md               ← First-time setup guide
├── README.md              ← Developer quick start
├── docs/                  ← Design & architecture documents
├── backend/               ← Node.js + Express + TypeScript API
├── mobile/                ← React Native (Expo) mobile + web app
├── admin/                  ← React + Vite admin dashboard
├── nginx/                  ← Production reverse-proxy config
├── scripts/deploy.sh      ← One-shot VPS deployment script
├── render.yaml            ← Render.com Blueprint
├── railway.toml           ← Railway.app config
├── fly.toml                ← Fly.io config
├── docker-compose.yml     ← Local dev (PostgreSQL + Redis + backend)
└── docker-compose.prod.yml ← Production stack (backend + nginx + SSL)
```

## Recommended Reading Order (New User)

1. [`USER_GUIDE.md`](./USER_GUIDE.md) — what PCPhone is and how to use it
2. [`SETUP.md`](./SETUP.md) — get it running locally
3. [`docs/07-deployment.md`](./docs/07-deployment.md) — put it on the internet

## Recommended Reading Order (New Contributor)

1. [`docs/01-architecture.md`](./docs/01-architecture.md) — high-level system
2. [`docs/02-tech-stack.md`](./docs/02-tech-stack.md) — what tech we use and why
3. [`docs/03-api-design.md`](./docs/03-api-design.md) — REST API contract
4. [`docs/04-data-models.md`](./docs/04-data-models.md) — database schema
5. [`docs/06-implementation-roadmap.md`](./docs/06-implementation-roadmap.md) — what's done and what's next
