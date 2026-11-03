# Deployment Gates (OPUS Wave B)

## Phase 1: Setup
- [ ] .env copied from .env.example
- [ ] Dependencies installed (npm install)
- [ ] Database migrations applied (if applicable)

## Phase 2: Smoke Tests
- [ ] Lint passes (npm run lint)
- [ ] Unit tests pass (npm run test)
- [ ] Type checks pass (TypeScript)

## Phase 3: Docker Build (if applicable)
- [ ] Image builds successfully
- [ ] Image size reasonable (<500MB)
- [ ] No build warnings

## Phase 4: Validation
- [ ] Build directory exists (dist/ or .next/)
- [ ] Local docker-compose up succeeds (if applicable)
- [ ] Health check endpoint returns 200
- [ ] Integration tests pass

## Phase 5: Staging Deploy
- [ ] Staging images pushed
- [ ] Staging services healthy
- [ ] All staging endpoints respond
- [ ] No error rate spike (>5%)

**GATE:** Proceed to Phase 6? (STOP if staging health checks fail)

## Phase 6: Production Deploy
- [ ] Green stack builds successfully
- [ ] Green stack starts and is healthy
- [ ] Load balancer switched to green
- [ ] Production health checks pass (200 OK)
- [ ] Error rate <5%

**GATE:** Proceed to Phase 7? (STOP if production health checks fail; execute rollback)

## Phase 7: Monitoring (24h)
- [ ] Error rate <1% after 1h
- [ ] P95 latency within SLA
- [ ] No critical alerts triggered
- [ ] Database connections stable
- [ ] Memory usage stable
- [ ] After 24h: green promoted to blue

**FINAL GATE:** Deployment successful? Archive blue, finalize green as production.

