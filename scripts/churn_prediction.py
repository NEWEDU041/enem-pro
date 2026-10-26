#!/usr/bin/env python3
"""
Advanced Analytics: Churn Prediction
ML-based churn scoring using inactivity, session duration, and engagement
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
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.preprocessing import StandardScaler
except ImportError:
    print("Missing dependencies. Install with: pip install supabase pandas numpy scikit-learn")
    exit(1)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChurnPrediction:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_KEY")
        if not self.url or not self.key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY env vars required")
        self.client: Client = create_client(self.url, self.key)
        self.model = None
        self.scaler = StandardScaler()
    
    def extract_features(self) -> pd.DataFrame:
        """Extract churn prediction features from database"""
        logger.info("Extracting churn prediction features...")
        try:
            # Get subscriber data
            response = self.client.table("premium_subscribers").select(
                "id, created_at, last_download_at"
            ).execute()
            
            df = pd.DataFrame(response.data)
            df["created_at"] = pd.to_datetime(df["created_at"])
            df["last_download_at"] = pd.to_datetime(df["last_download_at"])
            
            # Calculate feature: days since signup
            df["days_since_signup"] = (datetime.utcnow() - df["created_at"]).dt.days
            
            # Calculate feature: inactivity days
            df["inactivity_days"] = (datetime.utcnow() - df["last_download_at"]).dt.days
            df["inactivity_days"] = df["inactivity_days"].fillna(df["days_since_signup"])
            
            # Get download count (engagement)
            response2 = self.client.table("product_downloads").select(
                "subscriber_id, COUNT(*) as download_count"
            ).execute()
            
            downloads = pd.DataFrame(response2.data)
            df = df.merge(downloads, left_on="id", right_on="subscriber_id", how="left")
            df["download_count"] = df["download_count"].fillna(0)
            
            # Calculate feature: average downloads per week
            df["downloads_per_week"] = df["download_count"] / np.maximum(df["days_since_signup"] / 7, 1)
            
            # Calculate feature: trial claimed (from trial_offers)
            try:
                response3 = self.client.table("trial_offers").select(
                    "subscriber_id, claimed"
                ).execute()
                
                trials = pd.DataFrame(response3.data)
                trials = trials.groupby("subscriber_id")["claimed"].max().reset_index()
                trials.columns = ["subscriber_id", "trial_claimed"]
                df = df.merge(trials, left_on="id", right_on="subscriber_id", how="left")
                df["trial_claimed"] = df["trial_claimed"].fillna(False)
            except:
                df["trial_claimed"] = False
            
            # Normalize features
            df["inactivity_days"] = df["inactivity_days"].clip(0, 365)  # Cap at 1 year
            df["downloads_per_week"] = df["downloads_per_week"].clip(0, 10)  # Cap at 10/week
            
            logger.info(f"Extracted features for {len(df)} users")
            return df
        except Exception as e:
            logger.error(f"Error extracting features: {e}")
            return pd.DataFrame()
    
    def calculate_churn_heuristic(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate churn score using heuristic (non-ML approach)"""
        logger.info("Calculating churn scores (heuristic)...")
        
        # Normalize features to 0-1 scale
        inactivity_score = np.minimum(df["inactivity_days"] / 90, 1.0)  # 90 days = max risk
        engagement_score = 1.0 - np.minimum(df["downloads_per_week"] / 5, 1.0)  # 5+ per week = safe
        age_factor = np.maximum(1.0 - (df["days_since_signup"] / 180), 0.2)  # Newer users are riskier
        
        # Weighted churn score (0-1, higher = more likely to churn)
        df["churn_score"] = (
            inactivity_score * 0.5 +      # 50% weight on inactivity
            engagement_score * 0.3 +      # 30% weight on low engagement
            age_factor * 0.2               # 20% weight on being new
        )
        
        df["churn_score"] = df["churn_score"].clip(0, 1.0)
        
        # Risk levels
        df["churn_risk_level"] = pd.cut(
            df["churn_score"],
            bins=[0, 0.3, 0.6, 0.8, 1.0],
            labels=["low", "medium", "high", "critical"]
        )
        
        # Predicted churn (threshold 0.7)
        df["predicted_churn"] = df["churn_score"] > 0.7
        
        logger.info(f"Calculated heuristic churn scores")
        return df
    
    def train_ml_model(self, df: pd.DataFrame) -> Tuple[RandomForestClassifier, np.ndarray]:
        """Train ML model for churn prediction (requires historical churn labels)"""
        logger.info("Training churn prediction ML model...")
        
        # Features for model
        feature_cols = ["inactivity_days", "downloads_per_week", "days_since_signup"]
        X = df[feature_cols].fillna(0)
        X_scaled = self.scaler.fit_transform(X)
        
        # For demo: use heuristic as labels (in production, use actual churn history)
        df["actual_churn"] = df["inactivity_days"] > 60  # Simplified: inactive >60 days = churn
        y = df["actual_churn"].astype(int)
        
        # Train model
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        self.model.fit(X_scaled, y)
        
        logger.info("Model trained")
        return self.model, X_scaled
    
    def save_churn_scores(self, df: pd.DataFrame) -> Dict:
        """Save churn scores to database"""
        logger.info("Saving churn scores to database...")
        try:
            # Update using stored procedure
            result = self.client.rpc("update_churn_scores").execute()
            logger.info("Churn scores updated in database")
            return {"status": "success", "count": len(df)}
        except Exception as e:
            logger.error(f"Error saving churn scores: {e}")
            return {"status": "error", "message": str(e)}
    
    def get_churn_summary(self) -> Dict:
        """Get summary of churn scores"""
        logger.info("Fetching churn summary...")
        try:
            response = self.client.table("v_churn_risk_summary").select("*").execute()
            df = pd.DataFrame(response.data)
            
            summary = {
                "total_users": df["user_count"].sum(),
                "risk_distribution": df.to_dict(orient="records"),
                "high_risk_count": int(df[df["churn_risk_level"].isin(["high", "critical"])]["user_count"].sum()),
                "high_risk_pct": float(df[df["churn_risk_level"].isin(["high", "critical"])]["pct_of_total"].sum()),
            }
            
            logger.info(f"Churn summary: {summary}")
            return summary
        except Exception as e:
            logger.error(f"Error getting churn summary: {e}")
            return {}
    
    def export_churn_report(self, output_file: str = "churn_prediction_report.json"):
        """Export detailed churn prediction report"""
        logger.info(f"Exporting churn report to {output_file}...")
        
        df = self.extract_features()
        if df.empty:
            logger.warning("No data to export")
            return None
        
        df = self.calculate_churn_heuristic(df)
        summary = self.get_churn_summary()
        
        report = {
            "generated_at": datetime.utcnow().isoformat(),
            "model_type": "heuristic",
            "summary": summary,
            "top_10_churn_risk": df.nlargest(10, "churn_score")[
                ["id", "churn_score", "inactivity_days", "downloads_per_week", "churn_risk_level"]
            ].to_dict(orient="records"),
            "feature_statistics": {
                "avg_inactivity_days": float(df["inactivity_days"].mean()),
                "avg_downloads_per_week": float(df["downloads_per_week"].mean()),
                "avg_days_since_signup": float(df["days_since_signup"].mean()),
            }
        }
        
        with open(output_file, "w") as f:
            json.dump(report, f, indent=2, default=str)
        
        logger.info(f"Report exported to {output_file}")
        return output_file

if __name__ == "__main__":
    churn = ChurnPrediction()
    
    # Extract features
    df = churn.extract_features()
    
    # Calculate heuristic churn scores
    if not df.empty:
        df = churn.calculate_churn_heuristic(df)
        
        # Save to database
        churn.save_churn_scores(df)
        
        # Export report
        churn.export_churn_report()
        
        # Print summary
        summary = churn.get_churn_summary()
        print("\n=== Churn Prediction Summary ===")
        print(json.dumps(summary, indent=2, default=str))
