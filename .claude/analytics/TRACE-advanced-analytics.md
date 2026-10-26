# Advanced Analytics Implementation Trace

**Task**: Implement cohort analysis, retention curves, churn prediction, and revenue forecast
**Start**: 2026-10-26
**Domains**: 6 independent domains (cohort, retention, churn, forecast, dashboard, testing)

## Orient (Task Decomposition)

### 1. Cohort Analysis
- SQL: GROUP BY signup_cohort, track retention by cohort over time
- Queries in supabase/migrations

### 2. Retention Curves  
- 1w, 4w, 13w retention %
- SQL: LEFT JOIN with last_login timestamps
- Python: Pandas calculations

### 3. Churn Prediction
- Features: inactivity_days, last_login, session_duration
- Heuristic or ML (scikit-learn)
- Output: churn_score per user

### 4. Revenue Forecast
- Prophet/ARIMA: 12-week ahead
- Time series from Stripe/Supabase revenue data

### 5. Grafana Dashboard
- JSON config: retention curves, churn score distribution, forecast
- Datasource: PostgreSQL (Supabase)

### 6. Testing
- Real data from enem-pro
- Verify cohort SQL, retention calculations, predictions

## Status
- [ ] Inspect: Supabase schema + existing data
- [ ] Decide: Architecture approach
- [ ] Act: Implement 6 domains
- [ ] Verify: Query results, calculations, dashboard rendering
- [ ] Report: Results with evidence

