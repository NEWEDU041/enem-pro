# enem-pro API Response Validation Debug Report

**Date**: 2026-10-27  
**Issue**: All API endpoints returning 500 errors, failing k6 load test validation

## 1. Curl Output - Actual Response

### /api/health
- **Status**: 500 Internal Server Error
- **Headers**:
  - Cache-Control: no-store, must-revalidate
  - X-Powered-By: Next.js
  - Content-Type: text/html; charset=utf-8
  - Content-Length: 6505

- **Error Message**:
```
Error: unable to determine transport target for "pino-pretty"
Stack: At fixTarget (webpack-internal:///(rsc)/./node_modules/pino/lib/transport.js:295:13)
  at transport (webpack-internal:///(rsc)/./node_modules/pino/lib/transport.js:261:30)
  at normalizeArgs (webpack-internal:///(rsc)/./node_modules/pino/lib/tools.js:349:16)
  at pino (webpack-internal:///(rsc)/./node_modules/pino/pino.js:92:28)
  at eval (webpack-internal:///(rsc)/./lib/logger.ts:25:63)
```

### /api/explicar
- **Status**: 500 Internal Server Error
- **Headers**:
  - Cache-Control: no-cache, no-store, max-age=0, must-revalidate
  - Content-Type: text/plain (body was "Internal Server Error")
  
- **Same error as /api/health**

### /api/checkout
- **Status**: 500 Internal Server Error
- **Same root cause**

## 2. k6 Load Test Expectations (from k6-load-test.js)

Line 67 - Health endpoint:
```javascript
'health status is 200': (r) => r.status === 200,
'health response time < 100ms': (r) => r.timings.duration < 100,
```

Line 93 - Explicar endpoint:
```javascript
'explicar status is 200 or 201': (r) => r.status === 200 || r.status === 201,
'explicar has content': (r) => r.body && r.body.length > 0,
'explicar response time < 2s': (r) => r.timings.duration < 2000,
```

Line 121 - Checkout endpoint:
```javascript
'checkout status is 200 or 201': (r) => r.status === 200 || r.status === 201,
'checkout response time < 3s': (r) => r.timings.duration < 3000,
```

## 3. Divergence Analysis

| Endpoint | Expected Status | Actual Status | Expected Content | Actual Content |
|----------|-----------------|---------------|------------------|-----------------|
| /api/health | 200 | 500 | JSON | HTML (error page) |
| /api/explicar | 200 or 201 | 500 | JSON (explanation) | HTML (error page) |
| /api/checkout | 200 or 201 | 500 | JSON (receipt/status) | HTML (error page) |

**Root Cause**: Logger initialization failure in Next.js runtime
- **File**: `lib/logger.ts` line 16-30
- **Problem**: `pino-pretty` transport is not installed as dependency
- **Version**: pino ^10.4.0 in package.json
- **Missing**: pino-pretty not in package.json (neither dependencies nor devDependencies)

## 4. Root Cause

The logger initialization attempts to use `pino-pretty` transport in development:
```typescript
transport:
  process.env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',  // <-- NOT INSTALLED
        options: {...}
      }
    : undefined
```

When Next.js webpack bundles the code, `pino-pretty` cannot be resolved as a module transport, causing initialization failure on every API request.

## 5. Solution

### Option A: Remove pino-pretty (Recommended for Next.js)
- Pino's pretty-printing in Next.js context can cause bundling issues
- Better to use JSON logging in dev and let structured logging tools parse it
- Change: Set transport to `undefined` in development
- Impact: Minimal - development logs will be JSON instead of pretty-printed

### Option B: Install pino-pretty
- Add `pino-pretty` as devDependency
- Risk: May cause bundling issues in Next.js production build
- Not recommended for Next.js

**Chosen**: Option A (remove transport config)

## 6. Files to Modify

1. `/root/projetos/enem-pro/lib/logger.ts` - Remove pino-pretty transport reference
   - Keep development logging simple (JSON to console)
   - Structured logging tools (Sentry, etc) can parse JSON

## 7. Expected After Fix

All three endpoints should return:
- **/api/health**: 200 OK + JSON health status
- **/api/explicar**: 200 OK + JSON with explanation
- **/api/checkout**: 200 or 201 + JSON with checkout status

k6 checks will pass.
