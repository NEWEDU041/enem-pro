#!/usr/bin/env python3
"""
Advanced Analytics: Cohort Analysis
Queries Supabase for cohort growth, retention, and trends
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

class CohortAnalysis:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_KEY")
        if not self.url or not self.key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY env vars required")
        self.client: Client = create_client(self.url, self.key)
    
    def populate_cohort_data(self) -> Dict:
        """Populate cohort_analysis table from existing subscribers"""
        logger.info("Populating cohort analysis data...")
        try:
            result = self.client.rpc("populate_cohort_analysis").execute()
            logger.info(f"Cohort data populated")
            return {"status": "success", "message": "Cohort analysis populated"}
        except Exception as e:
            logger.error(f"Error populating cohort data: {e}")
            return {"status": "error", "message": str(e)}
    
    def get_cohort_retention_matrix(self) -> pd.DataFrame:
        """Get cohort retention matrix (weeks 0, 1, 4, 13)"""
        logger.info("Fetching cohort retention matrix...")
        try:
            response = self.client.table("v_cohort_retention_matrix").select("*").execute()
            df = pd.DataFrame(response.data)
            logger.info(f"Fetched {len(df)} cohorts")
            return df
        except Exception as e:
            logger.error(f"Error fetching cohort matrix: {e}")
            return pd.DataFrame()
    
    def get_weekly_cohort_growth(self) -> pd.DataFrame:
        """Get weekly new subscriber growth by cohort"""
        logger.info("Fetching weekly cohort growth...")
        try:
            response = self.client.table("v_weekly_cohort_growth").select("*").execute()
            df = pd.DataFrame(response.data)
            logger.info(f"Fetched {len(df)} weeks of growth data")
            return df
        except Exception as e:
            logger.error(f"Error fetching weekly growth: {e}")
            return pd.DataFrame()
    
    def analyze_cohort_trends(self) -> Dict:
        """Analyze trends within cohorts"""
        df_matrix = self.get_cohort_retention_matrix()
        if df_matrix.empty:
            return {"status": "no_data"}
        
        analysis = {
            "total_cohorts": len(df_matrix),
            "total_subscribers": df_matrix["cohort_size"].sum(),
            "avg_retention_1w": df_matrix["retention_1w_pct"].mean(),
            "avg_retention_4w": df_matrix["retention_4w_pct"].mean(),
            "avg_retention_13w": df_matrix["retention_13w_pct"].mean(),
            "best_cohort_1w": df_matrix.loc[df_matrix["retention_1w_pct"].idxmax()] if not df_matrix.empty else None,
            "worst_cohort_1w": df_matrix.loc[df_matrix["retention_1w_pct"].idxmin()] if not df_matrix.empty else None,
        }
        
        # Calculate trend (is retention improving over time?)
        df_matrix["cohort_num"] = pd.factorize(df_matrix["cohort_year_week"])[0]
        trend_1w = df_matrix[["cohort_num", "retention_1w_pct"]].corr().iloc[0, 1]
        trend_4w = df_matrix[["cohort_num", "retention_4w_pct"]].corr().iloc[0, 1]
        
        analysis["retention_trend_1w"] = float(trend_1w) if pd.notna(trend_1w) else 0.0
        analysis["retention_trend_4w"] = float(trend_4w) if pd.notna(trend_4w) else 0.0
        
        return analysis
    
    def get_cohort_by_source(self) -> pd.DataFrame:
        """Analyze retention by signup source (landing_page, email, social, etc)"""
        logger.info("Analyzing cohorts by signup source...")
        try:
            response = self.client.table("cohort_analysis").select("signup_source, cohort_year_week, subscriber_id").execute()
            df = pd.DataFrame(response.data)
            
            if df.empty:
                return df
            
            # Count by source and cohort
            source_analysis = df.groupby(["signup_source", "cohort_year_week"])["subscriber_id"].count().reset_index()
            source_analysis.columns = ["source", "cohort", "subscriber_count"]
            logger.info(f"Analyzed {len(source_analysis)} source-cohort combinations")
            return source_analysis
        except Exception as e:
            logger.error(f"Error analyzing by source: {e}")
            return pd.DataFrame()
    
    def export_report(self, output_file: str = "cohort_analysis_report.json"):
        """Export comprehensive cohort analysis report"""
        logger.info(f"Exporting report to {output_file}...")
        
        report = {
            "generated_at": datetime.utcnow().isoformat(),
            "cohort_trends": self.analyze_cohort_trends(),
            "cohort_matrix": self.get_cohort_retention_matrix().to_dict(orient="records"),
            "weekly_growth": self.get_weekly_cohort_growth().to_dict(orient="records"),
            "by_source": self.get_cohort_by_source().to_dict(orient="records"),
        }
        
        with open(output_file, "w") as f:
            json.dump(report, f, indent=2, default=str)
        
        logger.info(f"Report exported to {output_file}")
        return output_file

if __name__ == "__main__":
    cohort = CohortAnalysis()
    
    # Populate data
    cohort.populate_cohort_data()
    
    # Analyze
    trends = cohort.analyze_cohort_trends()
    print("\n=== Cohort Analysis Results ===")
    print(json.dumps(trends, indent=2, default=str))
    
    # Export
    cohort.export_report()
