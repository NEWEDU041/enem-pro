# ONBOARDING.md — enem-pro Team Guide

**Status:** Production-Ready  
**Last Updated:** 2026-10-27  
**Audience:** New developers, DevOps engineers, team onboarding  
**Time:** 30 min from zero to running locally + understanding the system

---

## ⚡ 60-Second TL;DR

```bash
# 1. Clone & install (5 min)
git clone https://github.com/desenvolve-sites/enem-pro.git
cd enem-pro
npm install

# 2. Set up environment (2 min)
cp .env.example .env.local
# Edit .env.local: Add SUPABASE_URL, SUPABASE_KEY, ANTHROPIC_KEY

# 3. Start dev server (2 min)
npm run dev
# Open http://localhost:3000

# 4. Run tests (5 min)
npm test -- --run

# Done! You're running enem-pro locally
```

**Next:** Read "System Architecture" below, then tackle a task from the issue tracker.

---

## 📚 System Architecture (5 min read)

### Stack Overview

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 + React 19 | App shell, SEO optimization, blog rendering |
| **Backend** | Next.js API routes | REST APIs, authentication, webhooks |
| **Database** | Supabase (PostgreSQL) | Blog posts, user data, subscriptions, audit logs |
| **Cache** | Redis | L1 memory cache (LRU), L2 Redis (60GB) |
| **Auth** | Supabase Auth | Email/password, OAuth, 2FA for admins |
| **Payment** | Stripe | Subscriptions, one-time purchases |
| **AI** | Anthropic Claude | Blog generation, explanations, redaction help |
| **Observability** | Prometheus + Grafana | Metrics, dashboards, health checks |
| **Error Tracking** | Sentry | Exception tracking, user feedback |
| **Deployment** | Vercel | Multi-region edge deployment (gru1, iad1, iad1-eu-west-1) |

### Key Architectural Decisions

See `/docs/adr/` for full details (7 decision records):

1. **ADR-001:** Multi-region deployment (3 regions, < 5s failover)
2. **ADR-002:** Multi-layer caching (88-92% hit rate, 85% latency reduction)
3. **ADR-003:** Disaster recovery (15-20 min RTO, 24h RPO)
4. **ADR-004:** Zero-downtime deployment (blue-green + canary)
5. **ADR-005:** Database pooling (20 connections, batch queries)
6. **ADR-006:** API key management (env vars, rotation, timing-safe)
7. **ADR-007:** Observability stack (Prometheus, Pino, Jaeger, Sentry)

---

## 🚀 Getting Started (30 min)

### Prerequisites

```bash
# Check versions (should be recent)
node --version    # ≥ v20
npm --version     # ≥ 10
git --version     # ≥ 2.40
```

### Step 1: Clone Repository

```bash
git clone https://github.com/desenvolve-sites/enem-pro.git
cd enem-pro
git checkout main  # Ensure on main branch
```

### Step 2: Install Dependencies

```bash
npm install
# Expected: "added 500+ packages in 45s"
```

### Step 3: Environment Setup

```bash
# Copy example env file
cp .env.example .env.local

# Edit variables in .env.local:
# 1. NEXT_PUBLIC_SUPABASE_URL
# 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
# 3. SUPABASE_SERVICE_ROLE_KEY (keep secret!)
# 4. ANTHROPIC_API_KEY (sk-ant-v3-...)
# 5. STRIPE_SECRET_KEY (sk_test_...)
```

### Step 4: Start Development Server

```bash
npm run dev
# Open http://localhost:3000
```

### Step 5: Verify Setup

```bash
curl -s http://localhost:3000/api/health-check | jq .
npm test -- --run
```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Cannot find module 'next' | `npm install` |
| DATABASE_URL not found | Check `.env.local` has all required vars |
| Port 3000 already in use | `npm run dev -- -p 3001` |
| Redis connection refused | Set `REDIS_URL=` (empty) to disable |
| Tests failing | `rm -rf node_modules .next && npm install` |

---

## 📖 Important Documents

- **[COMO_ARRUMAMOS_TUDO.md](/COMO_ARRUMAMOS_TUDO.md)** — 32h modernization journey
- **[Architecture Decisions](/docs/adr/)** — 7 key technical decisions
- **[Deployment Guide](/docs/runbooks/DEPLOY.md)** — How to deploy
- **[Incident Response](/docs/runbooks/INCIDENT.md)** — Emergency procedures
- **[Performance Debugging](/docs/runbooks/PERF_DEBUG.md)** — Latency investigation

---

## 📊 Key Metrics

Target performance (current):
- P95 latency: < 500ms (currently 347ms) ✅
- Error rate: < 1% (currently 0.2%) ✅
- Cache hit rate: > 85% (currently 88%) ✅
- Uptime: > 99.95% (currently 99.99%) ✅

---

## ✅ First Week Checklist

- [ ] Day 1: Get app running locally
- [ ] Day 2: Read COMO_ARRUMAMOS_TUDO.md
- [ ] Day 3: Read 2-3 ADRs
- [ ] Day 4: Submit your first PR
- [ ] Day 5: Review someone's PR

---

**Questions?** Ask in #dev on Slack.  
**Ready to deploy?** See [DEPLOY.md](./docs/runbooks/DEPLOY.md).
