#!/usr/bin/env python3
"""
Advanced Analytics: Revenue Forecast
12-week revenue forecast using Prophet or ARIMA
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
    try:
        from statsmodels.tsa.arima.model import ARIMA
        HAS_STATSMODELS = True
    except ImportError:
        HAS_STATSMODELS = False
    
    try:
        from prophet import Prophet
        HAS_PROPHET = True
    except ImportError:
        HAS_PROPHET = False
except ImportError:
    print("Missing dependencies. Install with: pip install supabase pandas numpy prophet")
    exit(1)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RevenueForecast:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_KEY")
        if not self.url or not self.key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY env vars required")
        self.client: Client = create_client(self.url, self.key)
        self.forecast_days = 84  # 12 weeks
    
    def get_daily_revenue(self, days_back: int = 180) -> pd.DataFrame:
        """Get daily revenue data from Stripe (approximated from premium_subscribers)"""
        logger.info(f"Fetching {days_back}-day revenue history...")
        try:
            # In production, this would come from Stripe API
            # For now, we simulate from premium_subscribers signup pattern
            response = self.client.table("premium_subscribers").select(
                "created_at, id"
            ).execute()
            
            df = pd.DataFrame(response.data)
            df["created_at"] = pd.to_datetime(df["created_at"])
            df["date"] = df["created_at"].dt.date
            
            # Count signups per day (approximates revenue growth)
            daily_data = df.groupby("date").size().reset_index(name="revenue")
            
            # Filter to requested days
            cutoff = datetime.utcnow().date() - timedelta(days=days_back)
            daily_data = daily_data[daily_data["date"] >= cutoff].copy()
            daily_data["date"] = pd.to_datetime(daily_data["date"])
            
            # Approximate revenue: $X per signup (in production, use actual Stripe data)
            daily_data["revenue"] = daily_data["revenue"] * 29  # $29 per premium signup
            
            logger.info(f"Fetched {len(daily_data)} days of revenue data")
            return daily_data
        except Exception as e:
            logger.error(f"Error fetching revenue data: {e}")
            return pd.DataFrame()
    
    def forecast_prophet(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict]:
        """Forecast revenue using Facebook Prophet"""
        if not HAS_PROPHET:
            logger.warning("Prophet not installed, using ARIMA instead")
            return None, {}
        
        logger.info("Forecasting with Prophet...")
        try:
            # Prepare data for Prophet
            df_prophet = df.copy()
            df_prophet.columns = ["ds", "y"]
            df_prophet["ds"] = pd.to_datetime(df_prophet["ds"])
            
            # Filter out anomalies
            df_prophet = df_prophet[df_prophet["y"] > 0]
            
            # Train model
            model = Prophet(
                yearly_seasonality=False,
                weekly_seasonality=True,
                daily_seasonality=False,
                interval_width=0.95,
                growth="linear"
            )
            model.fit(df_prophet)
            
            # Forecast
            future = model.make_future_dataframe(periods=self.forecast_days)
            forecast = model.predict(future)
            
            logger.info("Prophet forecast complete")
            
            # Extract forecast for next 12 weeks
            forecast_12w = forecast[forecast["ds"] > datetime.utcnow()][["ds", "yhat", "yhat_lower", "yhat_upper"]].head(self.forecast_days)
            forecast_12w.columns = ["date", "predicted_revenue", "confidence_lower", "confidence_upper"]
            
            # Calculate metrics
            metrics = {
                "forecast_method": "prophet",
                "total_forecast_12w": float(forecast_12w["predicted_revenue"].sum()),
                "avg_daily_forecast": float(forecast_12w["predicted_revenue"].mean()),
                "confidence_interval_95pct": True,
            }
            
            return forecast_12w, metrics
        except Exception as e:
            logger.error(f"Prophet forecast failed: {e}")
            return None, {}
    
    def forecast_arima(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict]:
        """Forecast revenue using ARIMA"""
        if not HAS_STATSMODELS:
            logger.warning("statsmodels not installed")
            return None, {}
        
        logger.info("Forecasting with ARIMA...")
        try:
            # Prepare series
            ts = df.set_index("date")["revenue"]
            ts = ts[ts > 0]  # Remove zero revenue days
            
            # Fit ARIMA model (p, d, q)
            model = ARIMA(ts, order=(5, 1, 2))
            fitted_model = model.fit()
            
            # Forecast
            forecast_result = fitted_model.get_forecast(steps=self.forecast_days)
            forecast = forecast_result.conf_int(alpha=0.05)
            forecast["yhat"] = forecast_result.predicted_mean
            
            logger.info("ARIMA forecast complete")
            
            # Format output
            forecast_12w = pd.DataFrame({
                "date": pd.date_range(start=df["date"].max() + timedelta(days=1), periods=self.forecast_days),
                "predicted_revenue": forecast["yhat"].values,
                "confidence_lower": forecast.iloc[:, 0].values,
                "confidence_upper": forecast.iloc[:, 1].values,
            })
            
            metrics = {
                "forecast_method": "arima",
                "total_forecast_12w": float(forecast_12w["predicted_revenue"].sum()),
                "avg_daily_forecast": float(forecast_12w["predicted_revenue"].mean()),
                "aic": float(fitted_model.aic),
                "bic": float(fitted_model.bic),
            }
            
            return forecast_12w, metrics
        except Exception as e:
            logger.error(f"ARIMA forecast failed: {e}")
            return None, {}
    
    def forecast_naive_trend(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict]:
        """Fallback: Simple trend-based forecast"""
        logger.info("Using naive trend forecast...")
        
        if df.empty:
            return None, {}
        
        # Calculate trend from last 30 days
        recent = df.tail(30)
        if len(recent) < 2:
            return None, {}
        
        avg_recent = recent["revenue"].mean()
        trend = (recent["revenue"].iloc[-1] - recent["revenue"].iloc[0]) / len(recent)
        
        # Project forward
        forecast_values = []
        for i in range(self.forecast_days):
            value = max(avg_recent + (trend * i), 0)
            forecast_values.append(value)
        
        forecast_12w = pd.DataFrame({
            "date": pd.date_range(start=df["date"].max() + timedelta(days=1), periods=self.forecast_days),
            "predicted_revenue": forecast_values,
            "confidence_lower": np.array(forecast_values) * 0.8,
            "confidence_upper": np.array(forecast_values) * 1.2,
        })
        
        metrics = {
            "forecast_method": "naive_trend",
            "total_forecast_12w": float(forecast_12w["predicted_revenue"].sum()),
            "avg_daily_forecast": float(forecast_12w["predicted_revenue"].mean()),
            "trend_component": float(trend),
        }
        
        return forecast_12w, metrics
    
    def save_forecast(self, df: pd.DataFrame) -> Dict:
        """Save forecast to database"""
        logger.info("Saving forecast to database...")
        try:
            records = []
            for _, row in df.iterrows():
                records.append({
                    "forecast_date": row["date"].date().isoformat(),
                    "forecast_week": row["date"].strftime("%G-W%V"),
                    "predicted_revenue": float(row["predicted_revenue"]),
                    "confidence_interval_lower": float(row["confidence_lower"]),
                    "confidence_interval_upper": float(row["confidence_upper"]),
                })
            
            # Insert in batches
            batch_size = 100
            for i in range(0, len(records), batch_size):
                batch = records[i:i+batch_size]
                self.client.table("revenue_forecast").insert(batch).execute()
            
            logger.info(f"Saved {len(records)} forecast records")
            return {"status": "success", "count": len(records)}
        except Exception as e:
            logger.error(f"Error saving forecast: {e}")
            return {"status": "error", "message": str(e)}
    
    def export_forecast_report(self, output_file: str = "revenue_forecast_report.json"):
        """Export detailed forecast report"""
        logger.info(f"Exporting forecast report to {output_file}...")
        
        # Get historical data
        df_revenue = self.get_daily_revenue()
        if df_revenue.empty:
            logger.warning("No revenue data available")
            return None
        
        # Try Prophet first, fall back to ARIMA, then naive
        forecast_12w, metrics = self.forecast_prophet(df_revenue)
        if forecast_12w is None:
            forecast_12w, metrics = self.forecast_arima(df_revenue)
        if forecast_12w is None:
            forecast_12w, metrics = self.forecast_naive_trend(df_revenue)
        
        if forecast_12w is None:
            logger.error("All forecast methods failed")
            return None
        
        # Save forecast
        self.save_forecast(forecast_12w)
        
        # Build report
        report = {
            "generated_at": datetime.utcnow().isoformat(),
            "historical_stats": {
                "data_points": len(df_revenue),
                "date_range_start": df_revenue["date"].min().isoformat(),
                "date_range_end": df_revenue["date"].max().isoformat(),
                "total_revenue_30d": float(df_revenue.tail(30)["revenue"].sum()),
                "avg_daily_revenue_30d": float(df_revenue.tail(30)["revenue"].mean()),
                "avg_daily_revenue_all": float(df_revenue["revenue"].mean()),
            },
            "forecast": {
                "method": metrics.get("forecast_method", "unknown"),
                "period_days": self.forecast_days,
                "total_predicted_revenue_12w": metrics.get("total_forecast_12w", 0),
                "avg_daily_forecast": metrics.get("avg_daily_forecast", 0),
                "confidence": metrics,
                "details": forecast_12w.to_dict(orient="records"),
            }
        }
        
        with open(output_file, "w") as f:
            json.dump(report, f, indent=2, default=str)
        
        logger.info(f"Report exported to {output_file}")
        return output_file

if __name__ == "__main__":
    forecast = RevenueForecast()
    forecast.export_forecast_report()
    
    # Print summary
    try:
        with open("revenue_forecast_report.json") as f:
            report = json.load(f)
            print("\n=== 12-Week Revenue Forecast ===")
            print(json.dumps(report["forecast"], indent=2, default=str))
    except:
        pass
