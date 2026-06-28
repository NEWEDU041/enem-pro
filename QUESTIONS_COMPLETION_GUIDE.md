# 📚 ENEM Pro — Complete Question Explanations Guide

**Goal:** Get 100% of questions with high-quality explanations  
**Current Status:** 717/3600 (20%) + 1 needs improvement  
**Estimated Cost:** $1.50 (Haiku generation)  
**Estimated Time:** 1-2 hours

---

## 📊 Current Status

```
✅ 717 questions with explanations (100% cached)
└─ Quality breakdown:
   ├─ Excellent (≥500 chars): ~400 questions
   ├─ Good (200-500 chars): ~300 questions
   ├─ Acceptable (100-200 chars): ~17 questions
   └─ Poor (<100 chars, needs regen): 1 question

❌ ~2883 questions missing explanations (API offline)
└─ Action: Wait for API recovery, then run bulk generation
```

---

## 🔄 Step 1: Validate & Improve Current Explanations

**Script:** `scripts/validate-explanations.ts`

```bash
npx tsx scripts/validate-explanations.ts
```

**Output:**
```
✅ Excellent (≥500 chars): 400
✓ Good (200-500 chars): 300
⚠️  Acceptable (100-200 chars): 17
❌ Poor (<100 chars, needs regen): 1

Quality: 99% good or better

Questions needing regeneration:
   - 2023-45: 78 chars | Issues: too_short
```

**Cost:** Free (no API calls)

---

## 🚀 Step 2: Regenerate Poor Explanations

**Script:** `scripts/regenerate-poor-explanations.ts`

```bash
npx tsx scripts/regenerate-poor-explanations.ts
```

**What it does:**
1. Finds all explanations < 100 characters
2. Expands them using Claude Haiku
3. Updates the database
4. Verifies they're now > 200 characters

**Expected results:**
```
🔄 Found 1 explanations needing improvement

🔄 Regenerating: 2023-45
   ✅ Improved: 245 chars

📊 Summary:
   ✅ Improved: 1
   ❌ Failed: 0
   Total: 1
```

**Cost:** ~$0.0003 (1 question × 300 tokens)  
**Time:** < 1 minute

---

## ⏳ Step 3: Wait for API Recovery

**Status:** API `https://api.enem.dev/v1` is currently offline

**When it comes back:**
1. You'll be able to fetch questions for all years
2. Then run the complete generation script

**Check API status:**
```bash
curl https://api.enem.dev/v1/exams/2023/questions?limit=1
# Should return: 200 OK with question data
# Currently returns: Connection refused
```

---

## 🔨 Step 4: Complete All Missing Questions (When API Available)

**Script:** `scripts/complete-all-questions.ts`

```bash
npx tsx scripts/complete-all-questions.ts
```

**What it does:**
1. Fetches all questions from API (15 years × ~100 questions = ~1500)
2. Checks which are already cached
3. Generates explanations for missing ones
4. Shows progress per year

**Expected output:**
```
🚀 Completing all question explanations...

📅 Processing 2023...
   Found 90 questions
   Already cached: 90
   To generate: 0
   ✅ Complete

📅 Processing 2022...
   Found 95 questions
   Already cached: 75
   To generate: 20
   ✅ Generated 20/20

[... continues for all years ...]

📊 Final Summary:
   ✅ Generated: 2883
   ⏭️  Skipped (cached): 717
   ❌ Failed: 12
   Total: 3612

💰 Cost: ~$0.86 (2883 questions × 300 tokens × $0.000001)
```

**Cost estimate:**
```
2883 questions × 300 tokens × $0.000001 = $0.86
Time: ~2 hours (with rate limiting)
```

**After completion:**
- 100% of questions cached
- Zero AI calls for existing questions
- Cost per new user question: $0 (serve from cache)

---

## 📋 Checklist

### Phase 1: Validate Current (Do NOW)
- [ ] Run `validate-explanations.ts`
- [ ] Review quality breakdown
- [ ] Note any issues

### Phase 2: Improve Current (Do NOW)
- [ ] Run `regenerate-poor-explanations.ts`
- [ ] Verify 1 question improved
- [ ] Cost: ~$0.0003 ✓

### Phase 3: Wait for API (Do WHEN AVAILABLE)
- [ ] Monitor `https://api.enem.dev/v1`
- [ ] When API is back: `curl` test returns 200

### Phase 4: Complete All (Do AFTER API AVAILABLE)
- [ ] Run `complete-all-questions.ts`
- [ ] Monitor progress
- [ ] Verify 2883 new questions generated
- [ ] Cost: ~$0.86 ✓

---

## 🎯 End State (Target)

```
✅ 3600 total questions
├─ 717 existing (improved quality)
├─ 2883 newly generated
└─ Total cost: ~$0.86 + $0.0003 = ~$1.00

Quality:
├─ 95%+ with 200+ character explanations
├─ 100% in Haiku model (cheapest)
└─ 100% in database (cached)

Performance:
├─ Load explanation: <100ms (database only)
├─ Cost per load: $0 (cached)
├─ Throughput: unlimited (no API calls)
└─ User experience: instant
```

---

## 📊 Cost Breakdown

| Phase | Task | Questions | Cost |
|-------|------|-----------|------|
| 1 | Validate | 717 | $0.00 |
| 2 | Improve poor | 1 | $0.0003 |
| 3 | Complete missing | 2883 | $0.86 |
| **Total** | | **3600** | **~$0.86** |

**One-time setup cost: ~$1.00**  
**Then: Free forever (cached)**

---

## 🚨 Troubleshooting

### "Error: fetchQuestionsByYear failed"
→ API is still offline. Wait and retry.

### "Too many failed generations"
→ Check:
- [ ] API is up: `curl https://api.enem.dev/v1/exams/2023/questions?limit=1`
- [ ] ANTHROPIC_API_KEY is valid
- [ ] Database is accessible

### "Regeneration didn't improve quality"
→ Manual check needed. View the explanation and consider improving prompt.

### "Some questions still < 200 chars"
→ Run `validate-explanations.ts` again to identify them

---

## 💡 Pro Tips

### Skip Validation (if you trust the data)
```bash
# Jump straight to regeneration
npx tsx scripts/regenerate-poor-explanations.ts
```

### Test API Before Running (Recommended)
```bash
# Quick test
curl https://api.enem.dev/v1/exams/2023/questions?limit=1

# Should return JSON with questions
# If it fails, API is still offline
```

### Monitor Progress
```bash
# Watch database size grow
while true; do
  echo "$(date): $(curl -s https://questoesenem.pro/api/health | jq '.data.cached_questions')"
  sleep 60
done
```

### Parallel Generation (Optional)
```bash
# If you want to run for multiple years in parallel:
# (Not recommended - may hit API rate limits)

npx tsx scripts/complete-all-questions.ts &
npx tsx scripts/regenerate-poor-explanations.ts &
```

---

## 📞 Support

**Check scripts are correct:**
```bash
ls -la scripts/ | grep -E "(validate|regenerate|complete)"
```

**Check database state:**
```bash
curl -H "x-admin-secret: $CRON_SECRET" \
  https://questoesenem.pro/api/health | jq '.data'
```

**Check API status:**
```bash
curl https://api.enem.dev/v1/exams/2023/questions?limit=1 | head -c 100
```

---

## ✅ Success Criteria

- [ ] Validation shows 99%+ quality
- [ ] Poor explanations regenerated
- [ ] Missing questions completed (when API available)
- [ ] 3600 total questions cached
- [ ] `/api/health` shows 95%+ cache hit rate
- [ ] Cost < $1.50 total

🎉 **Ready to proceed?**
