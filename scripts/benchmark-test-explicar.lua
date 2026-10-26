-- wrk Lua script for testing /api/explicar endpoint
-- Usage: wrk -t4 -c20 -d30s --script test-explicar.lua http://localhost:3000/api/explicar

-- Configuration
local question_ids = {
  "2022-1", "2022-5", "2022-10", "2021-1", "2021-8", "2020-2", "2020-12"
}
local auth_token = os.getenv("AUTH_TOKEN") or "test_token"

-- Global counters
local cache_hits = 0
local cache_misses = 0
local errors = 0

function setup(thread)
  thread:set("id", 1)
end

function init(args)
  requests = 0
  responses = 0

  -- HTTP request counter
  wrk.headers["Authorization"] = "Bearer " .. auth_token
  wrk.headers["Content-Type"] = "application/json"
  wrk.headers["User-Agent"] = "wrk-optimizer-benchmark/1.0"
end

function request()
  -- Cycle through different questions to test cache behavior
  local question_index = (requests % #question_ids) + 1
  local question_id = question_ids[question_index]
  
  requests = requests + 1
  
  -- Create request body
  local body = string.format(
    '{"question_id":"%s","selected_alternative":null}',
    question_id
  )
  
  -- Build request
  wrk.body = body
  wrk.method = "POST"
  
  return wrk.format("POST", "/api/explicar")
end

function response(status, headers, body)
  responses = responses + 1
  
  if status == 200 then
    if string.find(body, '"cached":true') then
      cache_hits = cache_hits + 1
    else
      cache_misses = cache_misses + 1
    end
  elseif status == 202 or status == 429 or status == 403 then
    -- Expected status codes
  else
    errors = errors + 1
  end
end

function done(summary, latency, requests)
  print("\n==========================================")
  print("BENCHMARK RESULTS: /api/explicar")
  print("==========================================")
  print("")
  
  print("Requests Summary:")
  print(string.format("  Total Requests:    %d", summary.requests))
  print(string.format("  Total Responses:   %d", summary.responses))
  print(string.format("  Cache Hits:        %d (%.1f%%)", cache_hits, (cache_hits / summary.responses) * 100))
  print(string.format("  Cache Misses:      %d (%.1f%%)", cache_misses, (cache_misses / summary.responses) * 100))
  print(string.format("  Errors:            %d", errors))
  
  print("\nLatency Metrics (ms):")
  print(string.format("  Mean:              %.2f", latency.mean))
  print(string.format("  Stdev:             %.2f", latency.stdev))
  print(string.format("  50th percentile:   %.2f", latency:percentile(50)))
  print(string.format("  95th percentile:   %.2f", latency:percentile(95)))
  print(string.format("  99th percentile:   %.2f", latency:percentile(99)))
  print(string.format("  Max:               %.2f", latency.max))
  
  print("\nThroughput:")
  print(string.format("  Requests/sec:      %.2f", summary.requests / summary.duration))
  print(string.format("  Duration:          %.1fs", summary.duration))
  
  print("\nStatus Code Distribution:")
  for status, count in pairs(summary.status) do
    print(string.format("  %d: %d requests", status, count))
  end
  
  print("")
end
