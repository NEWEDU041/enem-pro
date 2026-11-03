#!/usr/bin/env python3
"""
Daily tracking for Phase 1 Days 8-14: Monitor CTR + Revenue
Runs at 23:59 UTC each day. Collects snapshots of metrics from GSC + payment processor.
"""
import json
import os
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
TRACKING_FILE = PROJECT_ROOT / ".deploy/phase1-tracking-daily.json"
LOGS_DIR = PROJECT_ROOT / ".deploy/tracking-logs"
LOGS_DIR.mkdir(exist_ok=True)

def log_daily_snapshot(day: int, date_str: str, ctr_percent: float = None, revenue_brl: float = None, notes: str = ""):
    """Record daily snapshot of metrics"""
    
    # Load tracking file
    with open(TRACKING_FILE, "r") as f:
        data = json.load(f)
    
    # Find and update day entry
    for snapshot in data["daily_tracking"]["daily_snapshots"]:
        if snapshot["day"] == day and snapshot["date"] == date_str:
            snapshot["ctr"] = ctr_percent
            snapshot["revenue_brl"] = revenue_brl
            snapshot["status"] = "completed" if ctr_percent is not None else "pending"
            snapshot["last_updated"] = datetime.utcnow().isoformat() + "Z"
            if notes:
                snapshot["notes"] = notes
            break
    
    # Write back
    with open(TRACKING_FILE, "w") as f:
        json.dump(data, f, indent=2)
    
    # Also write daily log
    log_file = LOGS_DIR / f"tracking-day{day}-{date_str}.log"
    with open(log_file, "w") as f:
        f.write(f"Day {day} ({date_str})\n")
        f.write(f"CTR: {ctr_percent}%\n" if ctr_percent else "CTR: pending\n")
        f.write(f"Revenue: R$ {revenue_brl}\n" if revenue_brl else "Revenue: pending\n")
        f.write(f"Notes: {notes}\n" if notes else "")
    
    print(f"✅ Day {day} snapshot recorded: CTR={ctr_percent}%, Revenue=R${revenue_brl}")
    print(f"   Log: {log_file}")

def get_current_metrics():
    """
    Placeholder: Would fetch from real sources:
    - CTR: Google Search Console API
    - Revenue: Stripe API / Payment processor
    """
    return {
        "ctr": None,  # Fetch from GSC
        "revenue": None,  # Fetch from Stripe
    }

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 4:
        print("Usage: python track-daily.py <day> <date> <ctr_percent> [revenue_brl] [notes]")
        print("Example: python track-daily.py 9 2026-11-04 8.5 750 'Good CTR movement'")
        sys.exit(1)
    
    day = int(sys.argv[1])
    date_str = sys.argv[2]
    ctr = float(sys.argv[3]) if sys.argv[3] != "null" else None
    revenue = float(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[4] != "null" else None
    notes = sys.argv[5] if len(sys.argv) > 5 else ""
    
    log_daily_snapshot(day, date_str, ctr, revenue, notes)
