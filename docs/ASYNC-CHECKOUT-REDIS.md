# Redis Configuration for Async Checkout

## Environment Variables

Configure these in `.env.local`:

```bash
# Redis connection
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=  # Optional, leave empty if no password

# Stripe Price IDs (must be configured)
STRIPE_MONTHLY_PRICE_ID=price_xxxxxxxxx
STRIPE_ANNUAL_PRICE_ID=price_yyyyyyyyy
```

## Installation

### Option 1: Local Redis (Development)

**macOS (using Homebrew):**
```bash
brew install redis
brew services start redis
```

**Linux (using apt):**
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
```

**Docker (recommended):**
```bash
docker run -d -p 6379:6379 --name redis-checkout redis:7-alpine
```

### Option 2: Redis Cloud (Production)

1. Sign up at https://app.redis.com/
2. Create a new database
3. Get connection details (host, port, password)
4. Set environment variables

## Verification

Check Redis connection:
```bash
redis-cli ping
# Output: PONG
```

Monitor checkout queue:
```bash
redis-cli
> KEYS checkout*
> HGETALL bull:checkout:1  # View job details
> QUIT
```

## Architecture

### Queue Processing Flow

```
1. User POSTs to /api/checkout
   └─> Enqueue job to Bull queue (immediate, <100ms)
       └─> Return HTTP 202 with jobId and statusUrl
       
2. Background worker (Bull processor)
   └─> Process job async (max 3 retries on failure)
   ├─> Create Stripe session
   ├─> Log transaction to DB
   └─> Cache result in Redis (1 hour TTL)
   
3. Frontend polls /api/checkout/status/:jobId
   └─> Get result from Redis cache
   └─> Render checkout URL when ready
```

### Storage

- **Queue Jobs**: Redis (Bull queue)
- **Job Results**: Redis (1-hour TTL)
- **Transaction Logs**: PostgreSQL (durable audit trail)

### Job Schema

```typescript
interface CheckoutJobData {
  userId: string
  email: string
  plan: 'monthly' | 'annual'
  priceId: string
  origin: string
}

interface CheckoutJobResult {
  jobId: string
  sessionUrl?: string
  stripeSessionId?: string
  status: 'processing' | 'completed' | 'failed'
  error?: string
  timestamp: string
  retries: number
  maxRetries: number
}
```

## Monitoring

### Health Check

```bash
curl http://localhost:3000/api/health
# Look for: "checkout_worker": { "status": "active" }
```

### Benchmark Performance

```bash
npm run checkout:benchmark
# Expected output:
# ✅ Average enqueue time: <500ms (vs old 2,860ms)
# ✅ Improvement: 82% latency reduction
```

### View Transaction Logs

```bash
npm run checkout:logs
# Shows recent checkout transactions and processing history
```

## Troubleshooting

### Queue not processing jobs

1. Check Redis is running:
   ```bash
   redis-cli ping
   ```

2. Check worker is started:
   ```bash
   curl http://localhost:3000/api/health | jq '.checkout_worker'
   ```

3. Check logs:
   ```bash
   npm run dev 2>&1 | grep checkout
   ```

### Jobs stuck in queue

```bash
# Clear all jobs (development only!)
redis-cli
> FLUSHDB
> QUIT
```

### Stripe session not created

1. Verify `STRIPE_MONTHLY_PRICE_ID` and `STRIPE_ANNUAL_PRICE_ID` are valid
2. Check Stripe API key is set: `STRIPE_SECRET_KEY`
3. Review worker logs for detailed error

## Database Schema (Optional)

Create transaction log table for audit trail:

```sql
CREATE TABLE checkout_logs (
  id BIGSERIAL PRIMARY KEY,
  job_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'started', 'processing', 'completed', 'failed'
  stripe_session_id TEXT,
  error TEXT,
  duration_ms INT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE INDEX idx_checkout_logs_user_id ON checkout_logs(user_id);
CREATE INDEX idx_checkout_logs_job_id ON checkout_logs(job_id);
```

## Performance Metrics

| Metric | Before (Sync) | After (Async) | Improvement |
|--------|---------------|---------------|-------------|
| HTTP response time | 2,860ms | <500ms | 82% ↓ |
| Stripe API call | 2,800ms | Async | Non-blocking |
| User perception | Long wait | Instant | Better UX |

## API Endpoints

### Create Checkout (Enqueue Job)

**Request:**
```
POST /api/checkout
Content-Type: application/json

{
  "plan": "monthly" | "annual"
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "checkout-user123-1630000000",
  "statusUrl": "/api/checkout/status/checkout-user123-1630000000",
  "message": "Checkout job enqueued. Poll statusUrl for completion."
}
```

### Check Checkout Status

**Request:**
```
GET /api/checkout/status/:jobId
```

**Response (200 OK, 202 Processing, or 400 Failed):**
```json
{
  "jobId": "checkout-user123-1630000000",
  "status": "completed",
  "sessionUrl": "https://checkout.stripe.com/...",
  "stripeSessionId": "cs_live_...",
  "timestamp": "2026-10-27T02:00:00Z",
  "retries": 0,
  "maxRetries": 3
}
```

## Frontend Integration

See `lib/hooks/use-checkout-status.ts` for React hook:

```tsx
import { useCheckoutStatus } from '@/lib/hooks/use-checkout-status'

export function CheckoutButton() {
  const [jobId, setJobId] = useState<string | null>(null)
  
  const { status, isPolling, error } = useCheckoutStatus(jobId, {
    pollIntervalMs: 1000,
    maxPolls: 300,
    onComplete: (status) => {
      // Redirect to Stripe checkout
      window.location.href = status.sessionUrl
    },
  })
  
  const handleCheckout = async () => {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'monthly' })
    })
    const { jobId } = await res.json()
    setJobId(jobId)
  }
  
  return (
    <>
      <button onClick={handleCheckout} disabled={isPolling}>
        {isPolling ? 'Carregando...' : 'Fazer upgrade'}
      </button>
      {error && <p className="error">{error}</p>}
    </>
  )
}
```
