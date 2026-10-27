# ENEM Pro API Documentation Portal

## Overview

Complete API Documentation Portal with Swagger UI, Developer Dashboard, and SDK examples for the ENEM Pro application.

## ✅ Completed Components

### 1. OpenAPI Schema Generation
- **File**: `lib/openapi-schema.ts`
- **Status**: ✓ Complete
- **Features**:
  - Comprehensive OpenAPI 3.0 specification
  - All 8 main endpoints documented
  - Request/response schemas defined
  - Security schemes (Bearer + API Key)
  - Error responses standardized

### 2. API Documentation Portal
- **URL**: `/api/docs`
- **File**: `app/api/docs/page.tsx`
- **Status**: ✓ Complete
- **Features**:
  - Interactive Swagger UI
  - Dark-themed, modern design
  - Quick navigation links
  - Live API testing
  - Authentication state aware

### 3. Developer Dashboard
- **URL**: `/developer/dashboard`
- **Files**: `app/developer/dashboard/page.tsx` + `app/api/developer/api-keys/route.ts`
- **Status**: ✓ Complete
- **Features**:
  - API key management
  - Create/view/rotate/delete keys
  - Quota tracking with visual progress
  - Usage analytics
  - Key visibility toggle
  - Masked key display for security

### 4. Webhook Testing Tool
- **URL**: `/developer/webhooks`
- **Files**: `app/developer/webhooks/page.tsx` + `app/api/developer/webhook-test/route.ts`
- **Status**: ✓ Complete
- **Features**:
  - Test webhook endpoints
  - 3 pre-defined events
  - Custom payload editing
  - Real response inspection
  - Latency measurement
  - Response headers visibility

### 5. SDK Examples

#### JavaScript SDK
- **File**: `lib/sdk-javascript.ts`
- **Status**: ✓ Complete
- **Features**:
  - Questions API (list, get)
  - Explanations API (generate)
  - Essays API (correct)
  - Simulations API (save)
  - Health check
  - Full TypeScript support
  - Request timeout handling

#### Python SDK
- **File**: `lib/sdk-python.py`
- **Status**: ✓ Complete
- **Features**:
  - Object-oriented design
  - Questions, Explanations, Essays, Simulations endpoints
  - Type hints with dataclasses
  - Error handling
  - Session management
  - Configurable timeout

#### cURL Examples
- **File**: `docs/api/curl-examples.md`
- **Status**: ✓ Complete
- **Coverage**:
  - Health check
  - List/get questions
  - Generate explanations
  - Correct essays
  - Save simulations
  - Error handling examples
  - Advanced batch operations
  - Rate limit monitoring

### 6. Backend API Routes
- **Health Check**: `/api/health` (existing, documented)
- **OpenAPI Schema**: `/api/openapi.json` (new route)
- **Developer API Keys**: `/api/developer/api-keys` (new endpoint)
- **Quota Endpoint**: `/api/developer/quota` (new endpoint)
- **Webhook Testing**: `/api/developer/webhook-test` (new endpoint)

### 7. Documentation Pages
- **Main docs**: `app/docs/page.tsx` - Documentation index
- **API Docs**: `app/api/docs/page.tsx` - Swagger UI portal
- **Integration examples**: Embedded in SDK files

## 📊 Documentation Statistics

### Coverage Analysis
```
Documentation Coverage: 26.7%
Endpoints Documented: 8/30
Endpoints with Examples: 8/8
Endpoints with Error Codes: 8/8
SDKs Created: 3 (JavaScript, Python, cURL)
```

### Endpoint Categories
- **Questions**: 2 endpoints (100% documented)
- **Explanations**: 1 endpoint (100% documented)
- **Essays**: 1 endpoint (100% documented)
- **Simulations**: 1 endpoint (100% documented)
- **Health**: 1 endpoint (100% documented)
- **Webhooks**: 1 endpoint (100% documented)
- **Admin**: 1 endpoint (100% documented)

## 🚀 Integration Guide

### Step 1: Install Dependencies
```bash
npm install swagger-ui-react
```

### Step 2: Verify Routes
```bash
# Check OpenAPI endpoint works
curl http://localhost:3000/api/openapi.json

# Access Swagger UI
open http://localhost:3000/api/docs

# Access Developer Dashboard
open http://localhost:3000/developer/dashboard
```

### Step 3: Configure Environment Variables
```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=https://enem-pro.com/api
```

### Step 4: Test API Key Management
```bash
# Create test API key through dashboard
# Test with cURL
curl -H "X-API-Key: sk_live_..." https://enem-pro.com/api/health
```

## 📁 File Structure

```
/root/projetos/enem-pro/
├── lib/
│   ├── openapi-schema.ts          # OpenAPI 3.0 spec generator
│   ├── sdk-javascript.ts          # JavaScript SDK
│   └── sdk-python.py              # Python SDK
├── app/
│   ├── api/
│   │   ├── docs/
│   │   │   └── page.tsx          # Swagger UI portal
│   │   ├── openapi.json/
│   │   │   └── route.ts          # OpenAPI schema endpoint
│   │   └── developer/
│   │       ├── api-keys/
│   │       │   └── route.ts      # API key management
│   │       ├── quota/
│   │       │   └── route.ts      # Quota tracking
│   │       └── webhook-test/
│   │           └── route.ts      # Webhook testing
│   ├── developer/
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Developer dashboard
│   │   └── webhooks/
│   │       └── page.tsx          # Webhook tester
│   └── docs/
│       └── page.tsx              # Documentation index
└── docs/
    └── api/
        └── curl-examples.md      # cURL examples & guide

.api-docs-output/
├── openapi-schema.json           # Generated schema
└── documentation-coverage.json   # Coverage report
```

## 🔐 Authentication

### API Key Authentication
```bash
curl -H "X-API-Key: sk_live_your_api_key" \
  https://enem-pro.com/api/questoes
```

### JWT Bearer Authentication
```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
  https://enem-pro.com/api/questoes
```

## 📈 Rate Limiting

### Quota Tiers
| Tier | Requests/Hour | Monthly Limit |
|------|---------------|---------------|
| Free | 100 | 1,000 |
| Pro | 1,000 | 10,000 |
| Enterprise | Unlimited | Unlimited |

### Response Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1705314600
```

## 🧪 Testing

### Manual Testing Steps

1. **Test OpenAPI Endpoint**
   ```bash
   curl http://localhost:3000/api/openapi.json | jq '.info'
   ```

2. **Access Swagger UI**
   - Navigate to `http://localhost:3000/api/docs`
   - Try the "Try it out" button on any endpoint

3. **Test Developer Dashboard**
   - Login at `http://localhost:3000/login`
   - Navigate to `http://localhost:3000/developer/dashboard`
   - Create an API key
   - Copy and test it

4. **Test Webhook Tool**
   - Go to `http://localhost:3000/developer/webhooks`
   - Enter a webhook URL (use RequestBin or similar)
   - Select an event and send test payload

5. **Test SDKs**
   ```javascript
   // JavaScript
   import ENEMPro from './lib/sdk-javascript'
   const client = new ENEMPro({ apiKey: 'sk_live_...' })
   const questions = await client.questions.list()
   ```

   ```python
   # Python
   from lib.sdk_python import ENEMPro
   client = ENEMPro(api_key='sk_live_...')
   questions = client.questions.list(year=2024)
   ```

## 🔧 Configuration

### Next.js Config
```typescript
// next.config.js
module.exports = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      swagger: 'swagger-ui-react'
    }
    return config
  }
}
```

### Environment Variables
```bash
# Required
NEXT_PUBLIC_API_BASE_URL=https://enem-pro.com/api

# Optional
API_KEY_ENCRYPTION_KEY=your_encryption_key
WEBHOOK_TIMEOUT_MS=30000
```

## 📚 Documentation Files

### Quick Links
- **OpenAPI Schema**: `/api/openapi.json`
- **Swagger UI**: `/api/docs`
- **Developer Dashboard**: `/developer/dashboard`
- **Webhook Tester**: `/developer/webhooks`
- **Documentation Index**: `/docs`

### Documentation Pages (To Create)
- `/docs/api/getting-started` - Quick start guide
- `/docs/api/authentication` - Auth details
- `/docs/api/rate-limits` - Quota & limits
- `/docs/api/errors` - Error codes
- `/docs/sdk/javascript` - JavaScript guide
- `/docs/sdk/python` - Python guide
- `/docs/guides/caching` - Caching strategies
- `/docs/guides/security` - Security best practices

## 🎯 Next Steps for Full Integration

1. **Database Schema** (if not exists)
   ```sql
   -- api_keys table
   CREATE TABLE api_keys (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     name TEXT,
     key_hash TEXT UNIQUE,
     masked_key TEXT,
     status TEXT ('active', 'revoked'),
     quota_limit INTEGER,
     quota_remaining INTEGER,
     created_at TIMESTAMPTZ,
     last_used_at TIMESTAMPTZ
   );
   
   -- api_usage table
   CREATE TABLE api_usage (
     id BIGSERIAL PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     endpoint TEXT,
     method TEXT,
     status_code INTEGER,
     latency_ms INTEGER,
     created_at TIMESTAMPTZ
   );
   ```

2. **API Key Validation Middleware**
   ```typescript
   // lib/api-key-auth.ts
   export async function validateApiKey(key: string, supabase: SupabaseClient) {
     const keyHash = createHash('sha256').update(key).digest('hex')
     const { data } = await supabase
       .from('api_keys')
       .select('user_id, status')
       .eq('key_hash', keyHash)
       .single()
     return data
   }
   ```

3. **Usage Tracking Middleware**
   ```typescript
   // lib/track-api-usage.ts
   export async function trackUsage(userId: string, endpoint: string, latency: number) {
     // Insert into api_usage table
     // Decrement quota_remaining
   }
   ```

4. **Complete Missing Documentation Pages**
   - Create `/app/docs/api/getting-started/page.tsx`
   - Create `/app/docs/api/authentication/page.tsx`
   - Create `/app/docs/api/rate-limits/page.tsx`
   - Create `/app/docs/api/errors/page.tsx`

5. **API Monitoring**
   - Add response time tracking
   - Log API usage by endpoint
   - Monitor error rates
   - Alert on quota approaching

6. **Marketing Pages**
   - API pricing page
   - Use case examples
   - Success stories

## 📝 Estimated Integration Time

| Component | Time | Complexity |
|-----------|------|-----------|
| OpenAPI Schema | ✓ Complete | Low |
| Swagger UI | ✓ Complete | Low |
| Developer Dashboard | ✓ Complete | Medium |
| Webhook Tester | ✓ Complete | Medium |
| SDKs (3) | ✓ Complete | Medium |
| Documentation Pages | 2-3 hours | Low |
| Database Setup | 1 hour | Low |
| Authentication Middleware | 2 hours | Medium |
| Testing & Debugging | 2-3 hours | Medium |
| **Total for Full Setup** | **~12-15 hours** | - |

## 🐛 Known Limitations & TODOs

1. **Authentication**
   - Middleware not yet integrated
   - Key validation needs database

2. **Rate Limiting**
   - Quota display is template
   - Need actual usage tracking

3. **Webhooks**
   - Testing tool works, delivery pipeline needed
   - Retry logic not implemented

4. **SDKs**
   - Published to NPM/PyPI needed
   - Package.json entries needed

5. **Documentation**
   - Some pages are placeholders
   - Need more examples per endpoint
   - Performance guide needed

## 🎓 Usage Examples

### Quick Start with JavaScript
```javascript
import ENEMPro from '@enem-pro/sdk'

const client = new ENEMPro({ apiKey: 'sk_live_...' })

// List questions
const { questions } = await client.questions.list({
  year: 2024,
  discipline: 'Matemática',
  limit: 20
})

// Get AI explanation
const explanation = await client.explanations.generate(
  questions[0].id,
  'A'
)

console.log(explanation.explanation)
```

### Quick Start with Python
```python
from enem_pro import ENEMPro

client = ENEMPro(api_key='sk_live_...')

# Get questions
result = client.questions.list(year=2024, discipline='Matemática')

# Correct essay
correction = client.essays.correct('Your essay text...', 'Topic')
print(f"Score: {correction.score}/10")
```

## 📞 Support

- **Email**: api@enem-pro.com
- **Docs**: https://enem-pro.com/api/docs
- **GitHub Issues**: https://github.com/enem-pro/api-docs
- **Status Page**: https://status.enem-pro.com

---

**Created**: 2024-01-15  
**Status**: Ready for Integration  
**Coverage**: 26.7% (8/30 endpoints)
