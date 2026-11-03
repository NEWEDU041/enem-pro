# Phase 1: 7-Phase Deployment Gates Architecture

**Version:** 1.0  
**Date:** 2026-11-03  
**Scope:** All 4 active projects (enem-pro, site-clicks, convertio-next, editor-de-reels)

---

## Overview

7-phase gate system enforces quality standards, security, and performance before any code reaches production. Each gate is a hard stop — failures block deployment.

---

## The 7 Gates

### Gate 1: Commit Lint (Pre-commit Hook)
**When:** On every `git commit`  
**Check:** Validates commit message format and detects staged secrets  
**Tool:** `husky` + `commitlint` + `detect-secrets`  
**Failure:** Commit blocked  
**Config:** `.commitlintrc.json`, `.husky/pre-commit`

**Rules:**
- Commit message format: `type(scope): subject` (conventional commits)
- No hardcoded secrets: AWS keys, DB passwords, API tokens
- No large binary files (>50MB)

**Pass Condition:** ✅ Commit message valid AND no staged secrets found

---

### Gate 2: Build Test
**When:** On push to any branch  
**Check:** `npm run build` exits with code 0 and 0 errors  
**Tool:** GitHub Actions (CI job)  
**Failure:** Build fails, deployment blocked  
**Config:** `.github/workflows/deployment-pipeline.yml` (build job)

**Rules:**
- No TypeScript errors (`tsc --noEmit`)
- No ESLint errors (strict mode)
- No bundle warnings in production build
- Build output <50MB

**Pass Condition:** ✅ Build succeeds with 0 errors/warnings

---

### Gate 3: Unit Tests (100% Pass)
**When:** After build passes  
**Check:** `npm run test` — all tests pass  
**Tool:** Jest / Vitest  
**Failure:** Any test fails, deployment blocked  
**Config:** `.github/workflows/deployment-pipeline.yml` (test job)

**Rules:**
- Minimum 80% code coverage (line + branch)
- All tests must pass
- No skipped tests in critical paths
- Test timeout: 30s per test

**Pass Condition:** ✅ All tests pass AND coverage ≥80%

---

### Gate 4: Security Scan
**When:** After tests pass  
**Check:** Hardcoded secrets audit (0 found) + dependency vulnerabilities  
**Tool:** `detect-secrets`, `npm audit`, `snyk` (free tier)  
**Failure:** Any vulnerability found (critical/high), deployment blocked  
**Config:** `.github/workflows/deployment-pipeline.yml` (security job)

**Rules:**
- No hardcoded credentials (AWS, DB, API keys)
- No SQL injection patterns detected
- Dependency audit: 0 critical, 0 high (low/medium reviewed)
- No timing-attack vectors in auth

**Pass Condition:** ✅ Security scan: 0 critical/high vulnerabilities

---

### Gate 5: Performance Check (Lighthouse >85)
**When:** Staging deploy succeeds  
**Check:** Lighthouse CI audit against staging environment  
**Tool:** Lighthouse CI (puppeteer-based)  
**Failure:** Score <85, deployment blocked  
**Config:** `.github/workflows/deployment-pipeline.yml` (lighthouse job)

**Rules:**
- Performance: >85 (Core Web Vitals)
- Accessibility: >85
- Best Practices: >85
- SEO: >85
- Min LCP: <2.5s, CLS: <0.1, FID: <100ms

**Pass Condition:** ✅ Lighthouse score ≥85 on all metrics

---

### Gate 6: Staging Deploy (Dry-Run)
**When:** All previous gates pass  
**Check:** Deploy to staging environment (live test, then rollback or keep)  
**Tool:** GitHub Actions + Vercel (or docker-compose for FastAPI)  
**Failure:** Staging deploy fails, production blocked  
**Config:** `.github/workflows/deployment-pipeline.yml` (staging-deploy job)

**Rules:**
- Staging environment uses production-like config (same DB schema, env vars)
- Smoke tests run against staging (health check, critical paths)
- API response times recorded (baseline for performance gate)
- Database migrations validated
- No new runtime errors in logs

**Pass Condition:** ✅ Staging healthy + smoke tests pass + no new errors

---

### Gate 7: Production Deploy (Main Branch Only)
**When:** All gates pass + manual approval  
**Check:** Deploy to production (only from `main` branch)  
**Tool:** GitHub Actions + Vercel (or docker-compose + systemd)  
**Failure:** Production deploy fails, automatic rollback triggered  
**Config:** `.github/workflows/deployment-pipeline.yml` (prod-deploy job)

**Rules:**
- Only triggered on `main` branch merges
- Requires manual approval (2 maintainers) via GitHub Actions
- Blue-green or canary deployment (phased rollout)
- Health check: POST-deploy verification (5 min)
- Rollback: Automatic if health check fails
- Rollback triggers: Error rate >1%, P95 latency >5x baseline

**Pass Condition:** ✅ Manual approval given + health check passes + error rate <1%

---

## Gate Enforcement Matrix

| Gate | Trigger | Blocker | Auto-Remedy | Visibility |
|------|---------|---------|-------------|-----------|
| 1. Commit Lint | `git commit` | Yes | Manual rewrite | Developer laptop |
| 2. Build Test | Push to branch | Yes | Logs in Actions | PR status + Slack |
| 3. Unit Tests | Build passes | Yes | Test output in Actions | PR status + Slack |
| 4. Security Scan | Tests pass | Yes | Secrets audit report | PR status + Slack |
| 5. Lighthouse | Staging live | Yes | Perf metrics in Actions | PR status + Slack |
| 6. Staging Deploy | Perf check passes | Yes | Rollback on error | GitHub Actions log |
| 7. Prod Deploy | Manual approval | Yes (until approved) | Blue-green rollback | Slack + PagerDuty |

---

## Implementation Per Project

### 1. Next.js Projects (enem-pro, site-clicks, convertio-next)

**Location:** `.github/workflows/deployment-pipeline.yml`  
**CI/CD:** GitHub Actions → Vercel  
**Flow:**
```
Commit → Lint (✓) → Build (✓) → Tests (✓) → Security (✓) 
→ Deploy to Staging (✓) → Lighthouse (✓) → Prod Deploy (approval)
```

**Pre-commit Hook Setup:**
```bash
npm install husky commitlint @commitlint/config-conventional detect-secrets -D
npx husky install
npx husky add .husky/pre-commit "npm run lint:staged && npm run security:check"
```

**Package Scripts (package.json):**
```json
{
  "scripts": {
    "build": "next build",
    "test": "jest --coverage --passWithNoTests",
    "test:e2e": "playwright test",
    "lint": "eslint . --fix",
    "lint:staged": "lint-staged",
    "security:check": "detect-secrets scan --all-files --force-add",
    "lighthouse:ci": "lhci autorun"
  }
}
```

---

### 2. FastAPI Project (editor-de-reels)

**Location:** `.github/workflows/deployment-pipeline.yml` + systemd service  
**CI/CD:** GitHub Actions → Local Docker + systemd  
**Flow:**
```
Commit → Lint (✓) → Build (✓) → Tests (✓) → Security (✓) 
→ Deploy to Staging (docker-compose) (✓) → Smoke tests (✓) → Prod Deploy (systemd restart)
```

**Pre-commit Hook Setup:**
```bash
pip install husky commitlint detect-secrets
husky install
husky add .husky/pre-commit "python -m pytest tests/ -v && python -m detect_secrets scan --all-files"
```

**Make Targets (Makefile):**
```makefile
build:
	docker-compose -f docker-compose.dev.yml build

test:
	docker-compose -f docker-compose.dev.yml run --rm api pytest tests/ -v --cov=app

security:
	detect-secrets scan --all-files --force-add

deploy-staging:
	docker-compose -f docker-compose.staging.yml up -d
	sleep 5
	curl -f http://localhost:8090/health || exit 1

deploy-prod:
	systemctl restart editor-de-reels || exit 1
	sleep 2
	curl -f http://localhost:8091/health || exit 1
```

---

## Gate Verification Checklist

Before production deploy, verify:

- [ ] **Gate 1 (Commit Lint):** No commits without valid messages or secrets
- [ ] **Gate 2 (Build):** Build command succeeds, output size <50MB
- [ ] **Gate 3 (Tests):** All tests pass, coverage ≥80%
- [ ] **Gate 4 (Security):** 0 critical/high vulnerabilities, no secrets
- [ ] **Gate 5 (Lighthouse):** All metrics ≥85 on staging
- [ ] **Gate 6 (Staging):** Staging environment stable, smoke tests pass
- [ ] **Gate 7 (Prod):** Manual approval received, health check live for 5 min

---

## Gate Configuration Files (To Be Created)

Each project needs:

1. `.commitlintrc.json` — Commit message rules
2. `.eslintrc.json` — Linting rules (strict)
3. `jest.config.js` or `vitest.config.ts` — Test runner config
4. `.detectsecretsrc` — Secret detection rules
5. `lighthouserc.json` — Lighthouse CI config (Next.js only)
6. `.github/workflows/deployment-pipeline.yml` — 7-phase orchestration

---

## Success Criteria

✅ **Gate 1:** Pre-commit hook installed and working on all 4 projects  
✅ **Gate 2:** Build test green on main branch  
✅ **Gate 3:** Unit tests 100% pass rate  
✅ **Gate 4:** Security scan 0 critical/high vulnerabilities  
✅ **Gate 5:** Lighthouse CI integrated + score ≥85  
✅ **Gate 6:** Staging deploy automated + smoke tests green  
✅ **Gate 7:** Production deploy requires manual approval + rollback on error  

---

## Timeline

- **Hours 14–20 (7h):** Create GATES.md + pre-commit hooks + GitHub Actions workflow
- **Deploy:** Run against all 4 projects in parallel

---

## References

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Husky](https://typicode.github.io/husky/)
- [Commitlint](https://commitlint.js.org/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Detect Secrets](https://github.com/Yelp/detect-secrets)
