#!/usr/bin/env python3
"""
Integration Test: Advanced Analytics (Cohort, Retention, Churn, Forecast)
Runs all analytics modules against real enem-pro data and validates results
"""

import os
import sys
import json
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, List

logging_enabled = True

def log(msg: str):
    """Simple logging"""
    if logging_enabled:
        print(f"[{datetime.utcnow().isoformat()}] {msg}")

def run_command(cmd: str, cwd: str = None) -> Dict:
    """Run a shell command and return result"""
    log(f"Running: {cmd}")
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            cwd=cwd or os.getcwd(),
            capture_output=True,
            text=True,
            timeout=120
        )
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "stdout": "",
            "stderr": "Command timed out",
            "returncode": -1
        }
    except Exception as e:
        return {
            "success": False,
            "stdout": "",
            "stderr": str(e),
            "returncode": -1
        }

class AnalyticsTestSuite:
    def __init__(self, project_root: str = "/root/projetos/enem-pro"):
        self.project_root = project_root
        self.scripts_dir = os.path.join(project_root, "scripts")
        self.reports_dir = os.path.join(project_root, ".claude", "analytics", "reports")
        Path(self.reports_dir).mkdir(parents=True, exist_ok=True)
        
        self.results = {
            "start_time": datetime.utcnow().isoformat(),
            "tests": {}
        }
    
    def test_cohort_analysis(self) -> bool:
        """Test cohort analysis"""
        log("Testing cohort analysis...")
        
        # Check if script exists
        script = os.path.join(self.scripts_dir, "cohort_analysis.py")
        if not os.path.exists(script):
            log(f"ERROR: Script not found: {script}")
            self.results["tests"]["cohort"] = {
                "status": "FAIL",
                "reason": "Script not found"
            }
            return False
        
        # Run script
        result = run_command(f"python3 {script}", cwd=self.scripts_dir)
        
        # Check results
        success = result["success"]
        self.results["tests"]["cohort"] = {
            "status": "PASS" if success else "FAIL",
            "returncode": result["returncode"],
            "stderr": result["stderr"] if not success else None
        }
        
        # Verify report file
        report_file = os.path.join(self.scripts_dir, "cohort_analysis_report.json")
        if os.path.exists(report_file):
            try:
                with open(report_file) as f:
                    report = json.load(f)
                    self.results["tests"]["cohort"]["report"] = report.get("cohort_trends", {})
                    log(f"✓ Cohort analysis: {report['cohort_trends']['total_cohorts']} cohorts analyzed")
            except Exception as e:
                log(f"WARNING: Could not parse cohort report: {e}")
        
        return success
    
    def test_retention_analysis(self) -> bool:
        """Test retention curves"""
        log("Testing retention analysis...")
        
        script = os.path.join(self.scripts_dir, "retention_analysis.py")
        if not os.path.exists(script):
            log(f"ERROR: Script not found: {script}")
            self.results["tests"]["retention"] = {
                "status": "FAIL",
                "reason": "Script not found"
            }
            return False
        
        result = run_command(f"python3 {script}", cwd=self.scripts_dir)
        
        success = result["success"]
        self.results["tests"]["retention"] = {
            "status": "PASS" if success else "FAIL",
            "returncode": result["returncode"],
            "stderr": result["stderr"] if not success else None
        }
        
        # Verify report
        report_file = os.path.join(self.scripts_dir, "retention_report.json")
        if os.path.exists(report_file):
            try:
                with open(report_file) as f:
                    report = json.load(f)
                    summary = report.get("summary", {})
                    self.results["tests"]["retention"]["summary"] = {
                        "total_users": summary.get("total_users"),
                        "retention_1w_pct": summary.get("retention_1w_pct"),
                        "retention_4w_pct": summary.get("retention_4w_pct"),
                        "retention_13w_pct": summary.get("retention_13w_pct"),
                    }
                    log(f"✓ Retention: {summary.get('retention_1w_pct')}% 1W, {summary.get('retention_4w_pct')}% 4W, {summary.get('retention_13w_pct')}% 13W")
            except Exception as e:
                log(f"WARNING: Could not parse retention report: {e}")
        
        return success
    
    def test_churn_prediction(self) -> bool:
        """Test churn prediction"""
        log("Testing churn prediction...")
        
        script = os.path.join(self.scripts_dir, "churn_prediction.py")
        if not os.path.exists(script):
            log(f"ERROR: Script not found: {script}")
            self.results["tests"]["churn"] = {
                "status": "FAIL",
                "reason": "Script not found"
            }
            return False
        
        result = run_command(f"python3 {script}", cwd=self.scripts_dir)
        
        success = result["success"]
        self.results["tests"]["churn"] = {
            "status": "PASS" if success else "FAIL",
            "returncode": result["returncode"],
            "stderr": result["stderr"] if not success else None
        }
        
        # Verify report
        report_file = os.path.join(self.scripts_dir, "churn_prediction_report.json")
        if os.path.exists(report_file):
            try:
                with open(report_file) as f:
                    report = json.load(f)
                    summary = report.get("summary", {})
                    self.results["tests"]["churn"]["summary"] = {
                        "total_users": summary.get("total_users"),
                        "high_risk_count": summary.get("high_risk_count"),
                        "high_risk_pct": summary.get("high_risk_pct"),
                    }
                    log(f"✓ Churn: {summary.get('high_risk_count')} high-risk users ({summary.get('high_risk_pct')}%)")
            except Exception as e:
                log(f"WARNING: Could not parse churn report: {e}")
        
        return success
    
    def test_revenue_forecast(self) -> bool:
        """Test revenue forecast"""
        log("Testing revenue forecast...")
        
        script = os.path.join(self.scripts_dir, "revenue_forecast.py")
        if not os.path.exists(script):
            log(f"ERROR: Script not found: {script}")
            self.results["tests"]["forecast"] = {
                "status": "FAIL",
                "reason": "Script not found"
            }
            return False
        
        result = run_command(f"python3 {script}", cwd=self.scripts_dir)
        
        success = result["success"]
        self.results["tests"]["forecast"] = {
            "status": "PASS" if success else "FAIL",
            "returncode": result["returncode"],
            "stderr": result["stderr"] if not success else None
        }
        
        # Verify report
        report_file = os.path.join(self.scripts_dir, "revenue_forecast_report.json")
        if os.path.exists(report_file):
            try:
                with open(report_file) as f:
                    report = json.load(f)
                    forecast = report.get("forecast", {})
                    self.results["tests"]["forecast"]["summary"] = {
                        "method": forecast.get("method"),
                        "total_predicted_12w": forecast.get("total_predicted_revenue_12w"),
                        "avg_daily_forecast": forecast.get("avg_daily_forecast"),
                    }
                    log(f"✓ Forecast ({forecast.get('method')}): ${forecast.get('total_predicted_revenue_12w'):.2f} total 12W")
            except Exception as e:
                log(f"WARNING: Could not parse forecast report: {e}")
        
        return success
    
    def verify_dashboard_config(self) -> bool:
        """Verify Grafana dashboard JSON"""
        log("Verifying Grafana dashboard config...")
        
        dashboard_file = os.path.join(
            self.project_root, 
            "monitoring", 
            "grafana-dashboards", 
            "advanced-analytics-dashboard.json"
        )
        
        if not os.path.exists(dashboard_file):
            log(f"ERROR: Dashboard config not found: {dashboard_file}")
            self.results["tests"]["dashboard"] = {
                "status": "FAIL",
                "reason": "File not found"
            }
            return False
        
        try:
            with open(dashboard_file) as f:
                dashboard = json.load(f)
                panels = dashboard.get("dashboard", {}).get("panels", [])
                
                self.results["tests"]["dashboard"] = {
                    "status": "PASS",
                    "panel_count": len(panels),
                    "panels": [p.get("title") for p in panels]
                }
                
                log(f"✓ Dashboard config valid: {len(panels)} panels")
                return True
        except json.JSONDecodeError as e:
            log(f"ERROR: Invalid JSON in dashboard config: {e}")
            self.results["tests"]["dashboard"] = {
                "status": "FAIL",
                "reason": f"Invalid JSON: {e}"
            }
            return False
    
    def verify_sql_migrations(self) -> bool:
        """Verify SQL migration file"""
        log("Verifying SQL migrations...")
        
        migration_file = os.path.join(
            self.project_root,
            "supabase",
            "migrations",
            "20261026_cohort_churn_analytics.sql"
        )
        
        if not os.path.exists(migration_file):
            log(f"ERROR: Migration file not found: {migration_file}")
            self.results["tests"]["migrations"] = {
                "status": "FAIL",
                "reason": "File not found"
            }
            return False
        
        try:
            with open(migration_file) as f:
                content = f.read()
                
                # Check for required tables and functions
                required = [
                    "cohort_analysis",
                    "retention_events",
                    "churn_scores",
                    "revenue_forecast",
                    "v_cohort_retention_matrix",
                    "v_churn_risk_summary",
                    "populate_cohort_analysis",
                    "update_churn_scores",
                ]
                
                missing = [r for r in required if r not in content]
                
                if missing:
                    log(f"ERROR: Missing in migration: {missing}")
                    self.results["tests"]["migrations"] = {
                        "status": "FAIL",
                        "reason": f"Missing: {missing}"
                    }
                    return False
                
                self.results["tests"]["migrations"] = {
                    "status": "PASS",
                    "verified_entities": required
                }
                log(f"✓ Migration verified: {len(required)} entities")
                return True
        except Exception as e:
            log(f"ERROR: Could not verify migration: {e}")
            self.results["tests"]["migrations"] = {
                "status": "FAIL",
                "reason": str(e)
            }
            return False
    
    def run_all_tests(self) -> bool:
        """Run all tests"""
        log("=" * 60)
        log("STARTING ADVANCED ANALYTICS TEST SUITE")
        log("=" * 60)
        
        tests = [
            ("SQL Migrations", self.verify_sql_migrations),
            ("Grafana Dashboard", self.verify_dashboard_config),
            ("Cohort Analysis", self.test_cohort_analysis),
            ("Retention Analysis", self.test_retention_analysis),
            ("Churn Prediction", self.test_churn_prediction),
            ("Revenue Forecast", self.test_revenue_forecast),
        ]
        
        results = []
        for name, test_fn in tests:
            try:
                passed = test_fn()
                results.append((name, passed))
            except Exception as e:
                log(f"EXCEPTION in {name}: {e}")
                results.append((name, False))
        
        # Summary
        log("\n" + "=" * 60)
        log("TEST SUMMARY")
        log("=" * 60)
        
        passed_count = sum(1 for _, p in results if p)
        total_count = len(results)
        
        for name, passed in results:
            status = "✓ PASS" if passed else "✗ FAIL"
            log(f"{status} - {name}")
        
        log(f"\nResult: {passed_count}/{total_count} tests passed")
        log("=" * 60)
        
        self.results["end_time"] = datetime.utcnow().isoformat()
        self.results["passed"] = passed_count
        self.results["total"] = total_count
        
        return passed_count == total_count
    
    def export_results(self, output_file: str = None):
        """Export test results"""
        if output_file is None:
            output_file = os.path.join(self.reports_dir, "test_results.json")
        
        Path(output_file).parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, "w") as f:
            json.dump(self.results, f, indent=2, default=str)
        
        log(f"\nResults exported to: {output_file}")
        return output_file

if __name__ == "__main__":
    project_root = sys.argv[1] if len(sys.argv) > 1 else "/root/projetos/enem-pro"
    
    test_suite = AnalyticsTestSuite(project_root)
    all_passed = test_suite.run_all_tests()
    test_suite.export_results()
    
    sys.exit(0 if all_passed else 1)
