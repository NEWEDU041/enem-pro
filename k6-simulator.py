#!/usr/bin/env python3

"""
K6 Load Test Simulator
Emula o comportamento do k6 para testes de carga com ramping VUs
"""

import json
import sys
import time
import threading
import statistics
import random
from datetime import datetime
from collections import defaultdict

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

class LoadTestSimulator:
    def __init__(self, base_url="http://localhost:3000", duration_minutes=30):
        self.base_url = base_url
        self.duration_minutes = duration_minutes
        self.duration_seconds = duration_minutes * 60
        
        # Metrics storage
        self.latencies = []
        self.errors = []
        self.success_count = 0
        self.error_count = 0
        self.endpoint_metrics = defaultdict(list)
        self.start_time = None
        self.end_time = None
        
        # VU tracking
        self.active_vus = 0
        self.max_vus = 0
        self.vu_history = []
        
        # Stage configuration: (duration_sec, target_vus)
        self.stages = [
            (300, 10),     # 0-5min: ramp to 10 VUs
            (300, 50),     # 5-10min: ramp to 50 VUs
            (300, 100),    # 10-15min: ramp to 100 VUs
            (600, 200),    # 15-25min: ramp to 200 VUs (stress test)
            (300, 0),      # 25-30min: ramp down to 0 VUs
        ]
        
        # Setup HTTP session with retries
        self.session = requests.Session()
        retry = Retry(connect=1, backoff_factor=0.3, status_forcelist=[500, 502, 503, 504])
        adapter = HTTPAdapter(max_retries=retry, pool_connections=200, pool_maxsize=200)
        self.session.mount('http://', adapter)
        self.session.mount('https://', adapter)
    
    def get_current_target_vus(self, elapsed_seconds):
        """Calculate target VUs for current time based on stages"""
        cumulative = 0
        for stage_duration, target_vus in self.stages:
            if elapsed_seconds < cumulative + stage_duration:
                # Within this stage
                if cumulative > 0:
                    prev_stage = self.stages[self.stages.index((stage_duration, target_vus)) - 1]
                    prev_target = prev_stage[1]
                else:
                    prev_target = 0
                
                progress = (elapsed_seconds - cumulative) / stage_duration
                current_vus = prev_target + (target_vus - prev_target) * progress
                return int(current_vus)
            cumulative += stage_duration
        
        return 0
    
    def make_request(self, method, endpoint, payload=None):
        """Make HTTP request and record metrics"""
        start_time = time.time()
        
        try:
            url = f"{self.base_url}{endpoint}"
            
            if method == "GET":
                response = self.session.get(url, timeout=5)
            else:  # POST
                response = self.session.post(
                    url,
                    json=payload or {},
                    headers={"Content-Type": "application/json"},
                    timeout=5
                )
            
            elapsed_ms = (time.time() - start_time) * 1000
            
            # Record metrics
            self.latencies.append(elapsed_ms)
            self.endpoint_metrics[endpoint].append({
                'status': response.status_code,
                'latency': elapsed_ms,
                'success': response.status_code < 400
            })
            
            if response.status_code < 400:
                self.success_count += 1
            else:
                self.error_count += 1
                self.errors.append({
                    'endpoint': endpoint,
                    'status': response.status_code,
                    'latency': elapsed_ms
                })
            
            return True
        
        except Exception as e:
            elapsed_ms = (time.time() - start_time) * 1000
            self.latencies.append(elapsed_ms)
            self.error_count += 1
            self.errors.append({
                'endpoint': endpoint,
                'error': str(e),
                'latency': elapsed_ms
            })
            return False
    
    def virtual_user_worker(self, vu_id, start_time, test_duration):
        """Simulates a single virtual user making requests"""
        while time.time() - start_time < test_duration:
            # Random endpoint selection
            endpoint = random.choice(['/api/health', '/api/explicar', '/api/checkout'])
            
            # Prepare payload
            payload = None
            if endpoint == '/api/explicar':
                payload = {
                    'pergunta': 'What is photosynthesis?',
                    'contexto': 'Biology',
                    'nivel': 'ensino-medio'
                }
            elif endpoint == '/api/checkout':
                payload = {
                    'userId': f'vu-{vu_id}',
                    'plano': 'premium-anual',
                    'email': f'test{vu_id}@example.com'
                }
            
            # Make request
            method = "GET" if endpoint == "/api/health" else "POST"
            self.make_request(method, endpoint, payload)
            
            # Random think time between requests
            time.sleep(random.uniform(0.5, 2))
    
    def run_test(self):
        """Execute the load test"""
        print("\n" + "="*70)
        print("K6 LOAD TEST SIMULATOR - ENEM-PRO")
        print("="*70)
        print(f"\nTest Duration: {self.duration_minutes} minutes")
        print(f"Base URL: {self.base_url}")
        print(f"\nStages (VU Ramp-up):")
        cumulative = 0
        for duration, target in self.stages:
            print(f"  {cumulative}s - {cumulative + duration}s: → {target} VUs")
            cumulative += duration
        print()
        
        self.start_time = time.time()
        test_threads = []
        vu_counter = 0
        
        print(f"Starting load test...")
        
        try:
            start_time = self.start_time
            
            while time.time() - start_time < self.duration_seconds:
                elapsed = time.time() - start_time
                target_vus = self.get_current_target_vus(int(elapsed))
                
                # Adjust active VUs
                if target_vus > self.active_vus:
                    # Spawn new VUs
                    for _ in range(target_vus - self.active_vus):
                        vu_id = vu_counter
                        vu_counter += 1
                        
                        t = threading.Thread(
                            target=self.virtual_user_worker,
                            args=(vu_id, start_time, self.duration_seconds)
                        )
                        t.daemon = True
                        t.start()
                        test_threads.append(t)
                    
                    self.active_vus = target_vus
                
                elif target_vus < self.active_vus:
                    # VUs will naturally exit when duration reached
                    self.active_vus = target_vus
                
                self.max_vus = max(self.max_vus, self.active_vus)
                self.vu_history.append({
                    'time': int(elapsed),
                    'vus': self.active_vus
                })
                
                # Progress output
                minutes_elapsed = int(elapsed / 60)
                seconds_elapsed = int(elapsed % 60)
                print(f"\r[{minutes_elapsed:02d}:{seconds_elapsed:02d}] VUs: {self.active_vus:3d} | "
                      f"Reqs: {self.success_count + self.error_count:5d} | "
                      f"Errors: {self.error_count:4d} ({self._error_rate():.1f}%) | "
                      f"P95: {self._p95_latency():.0f}ms", end="", flush=True)
                
                time.sleep(1)
            
            # Wait for all VUs to finish
            print("\n\nWaiting for VUs to finish...")
            for t in test_threads:
                t.join(timeout=5)
            
            self.end_time = time.time()
            
        except KeyboardInterrupt:
            print("\n\nTest interrupted by user")
            self.end_time = time.time()
    
    def _error_rate(self):
        """Calculate current error rate"""
        total = self.success_count + self.error_count
        if total == 0:
            return 0
        return (self.error_count / total) * 100
    
    def _p95_latency(self):
        """Calculate P95 latency"""
        if not self.latencies:
            return 0
        sorted_latencies = sorted(self.latencies)
        index = int(len(sorted_latencies) * 0.95)
        return sorted_latencies[index]
    
    def generate_report(self):
        """Generate test report"""
        if not self.latencies:
            print("No metrics collected")
            return
        
        sorted_latencies = sorted(self.latencies)
        
        p50 = sorted_latencies[int(len(sorted_latencies) * 0.50)]
        p95 = sorted_latencies[int(len(sorted_latencies) * 0.95)]
        p99 = sorted_latencies[int(len(sorted_latencies) * 0.99)]
        
        total_time = (self.end_time or time.time()) - (self.start_time or time.time())
        if total_time <= 0:
            total_time = 1
        
        total_requests = self.success_count + self.error_count
        throughput = total_requests / total_time if total_time > 0 else 0
        
        print("\n" + "="*70)
        print("K6 LOAD TEST RESULTS - ENEM-PRO")
        print("="*70)
        print()
        
        print("LATENCY METRICS (P50/P95/P99):")
        print("-"*70)
        print(f"P50 (Median):       {p50:.2f}ms ✓")
        print(f"P95 (95th %ile):    {p95:.2f}ms {'✓' if p95 < 1000 else '✗ WARNING: > 1000ms'}")
        print(f"P99 (99th %ile):    {p99:.2f}ms {'✓' if p99 < 2000 else '✗ WARNING: > 2000ms'}")
        print(f"Min:                {min(self.latencies):.2f}ms")
        print(f"Max:                {max(self.latencies):.2f}ms")
        print(f"Avg:                {statistics.mean(self.latencies):.2f}ms")
        print(f"StdDev:             {statistics.stdev(self.latencies) if len(self.latencies) > 1 else 0:.2f}ms")
        print()
        
        print("REQUEST STATISTICS:")
        print("-"*70)
        print(f"Total Requests:     {total_requests}")
        print(f"Successful:         {self.success_count}")
        print(f"Failed:             {self.error_count}")
        error_rate = (self.error_count / total_requests * 100) if total_requests > 0 else 0
        print(f"Error Rate:         {error_rate:.2f}% {'✓' if error_rate < 10 else '✗'}")
        print()
        
        print("THROUGHPUT:")
        print("-"*70)
        print(f"Requests/sec:       {throughput:.2f}")
        print(f"Total Time:         {total_time:.2f}s ({int(total_time/60)}m {int(total_time%60)}s)")
        print()
        
        print("BREAKING POINT ANALYSIS:")
        print("-"*70)
        if p95 > 1000:
            print(f"⚠️  BREAKING POINT DETECTED")
            print(f"P95 Latency: {p95:.2f}ms > 1000ms (SLA threshold)")
            print(f"→ Service degradation at this load level")
            
            # Find where P95 started exceeding 1s
            print(f"\nLatency trend:")
            for i, endpoint in enumerate(['/api/health', '/api/explicar', '/api/checkout']):
                if endpoint in self.endpoint_metrics and self.endpoint_metrics[endpoint]:
                    lats = [m['latency'] for m in self.endpoint_metrics[endpoint]]
                    ep_p95 = sorted(lats)[int(len(lats) * 0.95)]
                    print(f"  {endpoint}: P95 = {ep_p95:.2f}ms")
        else:
            print(f"✓ Within SLA (P95: {p95:.2f}ms < 1000ms)")
        print()
        
        print("LOAD PROFILE:")
        print("-"*70)
        print(f"Peak VUs:           {self.max_vus}")
        print()
        
        print("="*70)
        print("Recommendations:")
        print("-"*70)
        
        if p95 < 500:
            print("✓ Excellent performance: Service can handle current load easily")
        elif p95 < 1000:
            print("✓ Good performance: Service within SLA, some room for growth")
        elif p95 < 2000:
            print("⚠️  Degradation: Service approaching limits at peak load")
        else:
            print("✗ Critical: Service severely degraded, needs optimization")
        
        if error_rate > 5:
            print(f"⚠️  High error rate ({error_rate:.1f}%): Check application logs")
        
        # Capacity planning
        print()
        print("CAPACITY PLANNING:")
        print("-"*70)
        if self.max_vus <= 50:
            print(f"Current capacity: {self.max_vus} VUs")
            print("Recommendation: Scale up infrastructure")
        elif self.max_vus <= 100:
            print(f"Current capacity: {self.max_vus} VUs")
            print("Recommendation: Monitor closely, consider optimization")
        else:
            print(f"Current capacity: {self.max_vus} VUs")
            print("Recommendation: Service handling high load, maintain current setup")
        
        print()
        print("="*70)
        print()
    
    def save_results(self, filename):
        """Save test results to JSON"""
        results = {
            'timestamp': datetime.now().isoformat(),
            'duration': self.end_time - self.start_time,
            'metrics': {
                'http_req_duration': {
                    'values': {
                        'p(50)': sorted(self.latencies)[int(len(self.latencies) * 0.50)],
                        'p(95)': sorted(self.latencies)[int(len(self.latencies) * 0.95)],
                        'p(99)': sorted(self.latencies)[int(len(self.latencies) * 0.99)],
                        'min': min(self.latencies),
                        'max': max(self.latencies),
                        'avg': statistics.mean(self.latencies),
                    },
                    'samples': len(self.latencies)
                },
                'http_reqs': {
                    'value': self.success_count + self.error_count
                },
                'http_req_failed': {
                    'value': self.error_count / (self.success_count + self.error_count) if (self.success_count + self.error_count) > 0 else 0
                },
                'success_requests': {
                    'value': self.success_count
                },
                'failed_requests': {
                    'value': self.error_count
                },
                'throughput': {
                    'value': self.success_count + self.error_count
                },
                'vus': {
                    'value': self.active_vus
                },
                'vus_max': {
                    'value': self.max_vus
                }
            },
            'thresholds': {
                'http_req_duration p(95) < 1000ms': {
                    'ok': sorted(self.latencies)[int(len(self.latencies) * 0.95)] < 1000 if self.latencies else False
                },
                'http_req_duration p(99) < 2000ms': {
                    'ok': sorted(self.latencies)[int(len(self.latencies) * 0.99)] < 2000 if self.latencies else False
                },
                'http_req_failed < 10%': {
                    'ok': (self.error_count / (self.success_count + self.error_count) if (self.success_count + self.error_count) > 0 else 0) < 0.1
                }
            }
        }
        
        with open(filename, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"✓ Results saved to: {filename}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 k6-simulator.py <script.js> [options]")
        print("Options:")
        print("  --base-url URL     Base URL (default: http://localhost:3000)")
        print("  --duration MINUTES Test duration in minutes (default: 30)")
        sys.exit(1)
    
    script_file = sys.argv[1]
    
    # Parse options
    base_url = "http://localhost:3000"
    duration = 30
    
    for i, arg in enumerate(sys.argv[2:]):
        if arg == "--base-url" and i + 3 < len(sys.argv):
            base_url = sys.argv[i + 3]
        elif arg == "--duration" and i + 3 < len(sys.argv):
            duration = int(sys.argv[i + 3])
    
    # Run test
    simulator = LoadTestSimulator(base_url, duration)
    simulator.run_test()
    simulator.generate_report()
    
    # Save results
    results_file = f"/root/projetos/enem-pro/k6-results/results-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
    import os
    os.makedirs(os.path.dirname(results_file), exist_ok=True)
    simulator.save_results(results_file)


if __name__ == "__main__":
    main()
