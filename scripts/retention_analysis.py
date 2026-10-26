#!/usr/bin/env python3
"""
Advanced Analytics: Retention Curves
Calculate 1-week, 4-week, and 13-week retention rates by cohort
"""

import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import logging

try:
    from supabase import create_client, Client
    import pandas as pd
    import numpy as np
except ImportError:
    print("Missing dependencies. Install with: pip install supabase pandas numpy")
    exit(1)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RetentionAnalysis:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_KEY")
        if not self.url or not self.key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY env vars required")
        self.client: Client = create_client(self.url, self.key)
    
    def populate_retention_events(self) -> Dict:
        """Populate retention_events table from product_downloads"""
        logger.info("Populating retention events...")
        try:
            result = self.client.rpc("populate_retention_events").execute()
            logger.info("Retention events populated")
            return {"status": "success"}
        except Exception as e:
            logger.error(f"Error populating retention events: {e}")
            return {"status": "error", "message": str(e)}
    
    def calculate_retention_curves(self) -> pd.DataFrame:
        """Calculate retention curves: 1w, 4w, 13w after signup"""
        logger.info("Calculating retention curves...")
        try:
            response = self.client.table("v_cohort_retention_matrix").select("*").execute()
            df = pd.DataFrame(response.data)
            
            if df.empty:
                logger.warning("No cohort data available")
                return df
            
            # Calculate retention percentages
            retention = {
                "cohort": df["cohort_year_week"],
                "cohort_size": df["cohort_size"],
                "retention_1w": df["retention_1w_pct"],
                "retention_4w": df["retention_4w_pct"],
                "retention_13w": df["retention_13w_pct"],
            }
            
            retention_df = pd.DataFrame(retention)
            logger.info(f"Calculated retention for {len(retention_df)} cohorts")
            return retention_df
        except Exception as e:
            logger.error(f"Error calculating retention curves: {e}")
            return pd.DataFrame()
    
    def get_retention_by_user(self) -> pd.DataFrame:
        """Get individual user retention status"""
        logger.info("Fetching per-user retention data...")
        try:
            # Get all subscribers with their signup date and last activity
            response = self.client.table("cohort_analysis").select(
                "subscriber_id, cohort_date"
            ).execute()
            
            cohort_df = pd.DataFrame(response.data)
            
            # Get last activity for each user
            response2 = self.client.table("retention_events").select(
                "subscriber_id, MAX(event_date) as last_activity_date"
            ).execute()
            
            activity_df = pd.DataFrame(response2.data)
            
            # Merge and calculate days retained
            if not cohort_df.empty and not activity_df.empty:
                merged = cohort_df.merge(activity_df, on="subscriber_id", how="left")
                merged["cohort_date"] = pd.to_datetime(merged["cohort_date"])
                merged["last_activity_date"] = pd.to_datetime(merged["last_activity_date"])
                merged["days_retained"] = (merged["last_activity_date"] - merged["cohort_date"]).dt.days
                merged["weeks_retained"] = merged["days_retained"] / 7
                merged["retained_1w"] = merged["weeks_retained"] >= 1
                merged["retained_4w"] = merged["weeks_retained"] >= 4
                merged["retained_13w"] = merged["weeks_retained"] >= 13
                
                logger.info(f"Fetched retention data for {len(merged)} users")
                return merged
            else:
                logger.warning("No activity data found")
                return pd.DataFrame()
        except Exception as e:
            logger.error(f"Error fetching per-user retention: {e}")
            return pd.DataFrame()
    
    def plot_retention_curves(self, output_file: str = "retention_curves.json"):
        """Generate retention curves data for visualization"""
        logger.info("Generating retention curves for plotting...")
        
        df = self.calculate_retention_curves()
        if df.empty:
            return None
        
        # Prepare data for time-series plot
        plot_data = {
            "cohorts": df["cohort"].tolist(),
            "cohort_sizes": df["cohort_size"].astype(int).tolist(),
            "retention_1w": df["retention_1w"].tolist(),
            "retention_4w": df["retention_4w"].tolist(),
            "retention_13w": df["retention_13w"].tolist(),
        }
        
        # Calculate cohort age and create step-by-step retention curve
        df["cohort_date"] = pd.to_datetime(df["cohort"].str.replace("W", "-W"), format="%G-W%V")
        df = df.sort_values("cohort_date")
        
        # Prepare week-by-week retention curve (all cohorts aggregated)
        user_retention = self.get_retention_by_user()
        if not user_retention.empty:
            by_week = {
                "week_0": len(user_retention),
                "week_1": user_retention["retained_1w"].sum(),
                "week_4": user_retention["retained_4w"].sum(),
                "week_13": user_retention["retained_13w"].sum(),
            }
            
            # Calculate percentages
            week_0_count = by_week["week_0"]
            if week_0_count > 0:
                by_week["retention_1w_pct"] = round((by_week["week_1"] / week_0_count) * 100, 2)
                by_week["retention_4w_pct"] = round((by_week["week_4"] / week_0_count) * 100, 2)
                by_week["retention_13w_pct"] = round((by_week["week_13"] / week_0_count) * 100, 2)
            
            plot_data["aggregated_retention"] = by_week
        
        with open(output_file, "w") as f:
            json.dump(plot_data, f, indent=2, default=str)
        
        logger.info(f"Retention curves saved to {output_file}")
        return plot_data
    
    def export_retention_report(self, output_file: str = "retention_report.json"):
        """Export detailed retention analysis report"""
        logger.info(f"Exporting retention report to {output_file}...")
        
        retention_curves = self.calculate_retention_curves()
        user_retention = self.get_retention_by_user()
        
        report = {
            "generated_at": datetime.utcnow().isoformat(),
            "retention_curves": retention_curves.to_dict(orient="records") if not retention_curves.empty else [],
            "summary": {
                "total_users": len(user_retention),
                "retained_1w_count": int(user_retention["retained_1w"].sum()) if not user_retention.empty else 0,
                "retained_4w_count": int(user_retention["retained_4w"].sum()) if not user_retention.empty else 0,
                "retained_13w_count": int(user_retention["retained_13w"].sum()) if not user_retention.empty else 0,
                "retention_1w_pct": float(user_retention["retained_1w"].mean() * 100) if not user_retention.empty else 0.0,
                "retention_4w_pct": float(user_retention["retained_4w"].mean() * 100) if not user_retention.empty else 0.0,
                "retention_13w_pct": float(user_retention["retained_13w"].mean() * 100) if not user_retention.empty else 0.0,
            }
        }
        
        with open(output_file, "w") as f:
            json.dump(report, f, indent=2, default=str)
        
        logger.info(f"Report exported to {output_file}")
        return output_file

if __name__ == "__main__":
    retention = RetentionAnalysis()
    
    # Populate data
    retention.populate_retention_events()
    
    # Calculate and plot
    retention.plot_retention_curves()
    
    # Export report
    retention.export_retention_report()
