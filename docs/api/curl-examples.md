# ENEM Pro API - cURL Examples

Complete guide to making API requests using cURL.

## Authentication

All API requests require authentication using your API key:

```bash
# Set your API key as an environment variable
export ENEM_API_KEY="sk_live_your_api_key_here"

# Or pass it directly in headers
curl -H "X-API-Key: sk_live_your_api_key_here" \
  https://enem-pro.com/api/health
```

## Base URL

- **Production**: `https://enem-pro.com/api`
- **Development**: `http://localhost:3000/api`

---

## Endpoints

### Health Check

```bash
# Check API health status
curl -s -H "X-API-Key: $ENEM_API_KEY" \
  https://enem-pro.com/api/health | jq .
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": {
    "database": { "status": "ok", "latency_ms": 12 },
    "cache": { "status": "ok", "latency_ms": 5 }
  }
}
```

---

### Questions - List

```bash
# Get all questions from 2024
curl -s -H "X-API-Key: $ENEM_API_KEY" \
  "https://enem-pro.com/api/questoes?year=2024&limit=20"

# Filter by discipline
curl -s -H "X-API-Key: $ENEM_API_KEY" \
  "https://enem-pro.com/api/questoes?year=2024&discipline=Matemática&page=1&limit=50"

# Paginate through results
curl -s -H "X-API-Key: $ENEM_API_KEY" \
  "https://enem-pro.com/api/questoes?year=2024&page=2&limit=20" | jq '.questions[] | {id, text}'
```

**Parameters:**
- `year` (integer): ENEM exam year (default: 2024)
- `discipline` (string): Subject filter (Português, Matemática, História, Geografia, Física, Química, Biologia, Inglês, Espanhol)
- `page` (integer): Pagination page (default: 1)
- `limit` (integer): Results per page, max 50 (default: 20)

**Response:**
```json
{
  "questions": [
    {
      "id": "q_2024_001",
      "text": "Which of the following...",
      "alternatives": [
        { "label": "A", "text": "Option A" },
        { "label": "B", "text": "Option B" },
        { "label": "C", "text": "Option C" },
        { "label": "D", "text": "Option D" },
        { "label": "E", "text": "Option E" }
      ],
      "correct_answer": "C",
      "year": 2024,
      "discipline": "Matemática",
      "difficulty": "medium"
    }
  ],
  "total": 180,
  "page": 1,
  "limit": 20
}
```

---

### Questions - Get Single

```bash
# Get a specific question by ID
curl -s -H "X-API-Key: $ENEM_API_KEY" \
  https://enem-pro.com/api/questoes/q_2024_001 | jq .

# Pretty print with syntax highlighting
curl -s -H "X-API-Key: $ENEM_API_KEY" \
  https://enem-pro.com/api/questoes/q_2024_001 | jq '{id, text, correct_answer}'
```

---

### Explanations - Generate

```bash
# Get AI explanation for a question
curl -s -X POST \
  -H "X-API-Key: $ENEM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": "q_2024_001",
    "selected_alternative": "A"
  }' \
  https://enem-pro.com/api/explicar | jq .

# Save explanation to file
curl -s -X POST \
  -H "X-API-Key: $ENEM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": "q_2024_001",
    "selected_alternative": "A"
  }' \
  https://enem-pro.com/api/explicar > explanation.json

# Extract just the explanation text
curl -s -X POST \
  -H "X-API-Key: $ENEM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": "q_2024_001",
    "selected_alternative": "A"
  }' \
  https://enem-pro.com/api/explicar | jq -r '.explanation'
```

**Request Body:**
```json
{
  "question_id": "q_2024_001",
  "selected_alternative": "A"
}
```

**Response:**
```json
{
  "explanation": "This question tests understanding of...",
  "cached": false,
  "cache_source": "generated",
  "latency_ms": 1250
}
```

---

### Essays - Correct

```bash
# Submit an essay for correction
curl -s -X POST \
  -H "X-API-Key: $ENEM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "essay_text": "Education is the foundation of a society...",
    "theme": "The importance of education"
  }' \
  https://enem-pro.com/api/corrigir-redacao | jq .

# Read essay from file
curl -s -X POST \
  -H "X-API-Key: $ENEM_API_KEY" \
  -H "Content-Type: application/json" \
  -d @essay.json \
  https://enem-pro.com/api/corrigir-redacao | jq '.score, .feedback'
```

**Request Body:**
```json
{
  "essay_text": "Your essay text here...",
  "theme": "Optional theme"
}
```

**Response:**
```json
{
  "score": 8.5,
  "feedback": "Excellent argumentation with well-structured arguments...",
  "suggestions": [
    "Expand on the final paragraph",
    "Add more concrete examples"
  ],
  "latency_ms": 3200
}
```

---

### Simulations - Save

```bash
# Save a simulation with answers
curl -s -X POST \
  -H "X-API-Key: $ENEM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "q_2024_001": "A",
      "q_2024_002": "B",
      "q_2024_003": "C",
      "q_2024_004": "D",
      "q_2024_005": "E"
    },
    "simulation_name": "Morning Practice"
  }' \
  https://enem-pro.com/api/simulado/salvar | jq .

# Batch save multiple simulations
for i in {1..5}; do
  curl -s -X POST \
    -H "X-API-Key: $ENEM_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"answers\": {\"q_2024_001\": \"A\"},
      \"simulation_name\": \"Test $i\"
    }" \
    https://enem-pro.com/api/simulado/salvar
done
```

**Response:**
```json
{
  "simulation_id": "sim_abc123",
  "score": 720,
  "correct_answers": 130,
  "total_answers": 180
}
```

---

## Error Handling

### 401 Unauthorized

```bash
curl -s -H "X-API-Key: invalid_key" \
  https://enem-pro.com/api/questoes

# Response (401):
# {
#   "error": "Invalid or missing API key",
#   "error_code": "INVALID_AUTH",
#   "timestamp": "2024-01-15T10:30:00Z"
# }
```

### 429 Rate Limited

```bash
curl -s -H "X-API-Key: $ENEM_API_KEY" \
  https://enem-pro.com/api/questoes

# Response (429):
# {
#   "error": "Rate limit exceeded",
#   "tier": "free",
#   "reset_at": "2024-01-15T11:30:00Z",
#   "retry_after_seconds": 3600
# }
```

### 400 Bad Request

```bash
curl -s -X POST \
  -H "X-API-Key: $ENEM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"question_id": ""}' \
  https://enem-pro.com/api/explicar

# Response (400):
# {
#   "error": "Invalid request parameters",
#   "error_code": "VALIDATION_ERROR",
#   "details": {
#     "question_id": "Question ID is required"
#   }
# }
```

---

## Advanced Usage

### Rate Limit Information

```bash
# Check rate limit headers
curl -i -H "X-API-Key: $ENEM_API_KEY" \
  https://enem-pro.com/api/questoes 2>&1 | grep -i "x-ratelimit"

# Response headers:
# X-RateLimit-Limit: 1000
# X-RateLimit-Remaining: 995
# X-RateLimit-Reset: 1705314600
```

### Monitoring Performance

```bash
# Measure request latency
curl -w "@curl-format.txt" -o /dev/null -s \
  -H "X-API-Key: $ENEM_API_KEY" \
  https://enem-pro.com/api/questoes

# With timing breakdown
curl -w "\\nTime to first byte: %{time_starttransfer}s\\nTotal time: %{time_total}s\\n" \
  -H "X-API-Key: $ENEM_API_KEY" \
  https://enem-pro.com/api/questoes
```

### Batch Operations

```bash
# Get questions and save simulations in batch
QUESTION_IDS=$(curl -s -H "X-API-Key: $ENEM_API_KEY" \
  https://enem-pro.com/api/questoes?limit=10 | jq -r '.questions[].id')

# Create answers map
ANSWERS="{}"
for QID in $QUESTION_IDS; do
  ANSWERS=$(echo $ANSWERS | jq --arg id "$QID" '.[$id] = "A"')
done

# Save simulation
curl -s -X POST \
  -H "X-API-Key: $ENEM_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"answers\": $ANSWERS}" \
  https://enem-pro.com/api/simulado/salvar | jq '.score'
```

---

## Useful Tools & Scripts

### Save API Key Securely

```bash
# Add to ~/.bashrc or ~/.zshrc
source ~/.enem-pro-env  # Contains: export ENEM_API_KEY="..."

# Never commit this file to version control!
echo ".enem-pro-env" >> ~/.gitignore
```

### Create a Wrapper Script

```bash
#!/bin/bash
# enem-pro-api.sh

set -e

API_KEY="${ENEM_API_KEY}"
BASE_URL="https://enem-pro.com/api"

if [ -z "$API_KEY" ]; then
  echo "Error: ENEM_API_KEY environment variable not set"
  exit 1
fi

curl -s \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  "$@" \
  "$BASE_URL$API_ENDPOINT"

# Usage:
# ./enem-pro-api.sh /questoes
# ./enem-pro-api.sh -X POST /explicar -d '...'
```

### Parse JSON Responses

```bash
# Extract specific fields
curl -s -H "X-API-Key: $ENEM_API_KEY" \
  https://enem-pro.com/api/questoes | jq '.questions | map({id, discipline, difficulty}) | sort_by(.difficulty)'

# Count by discipline
curl -s -H "X-API-Key: $ENEM_API_KEY" \
  https://enem-pro.com/api/questoes?limit=100 | \
  jq '.questions | group_by(.discipline) | map({discipline: .[0].discipline, count: length})'
```

---

## Rate Limits

| Tier | Requests/Hour | Max per Day |
|------|---------------|------------|
| Free | 100 | 1,000 |
| Pro | 1,000 | 10,000 |
| Enterprise | Unlimited | Unlimited |

---

## Support

- Documentation: https://enem-pro.com/api/docs
- Email: api@enem-pro.com
- Status Page: https://status.enem-pro.com
