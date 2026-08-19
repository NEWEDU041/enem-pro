#!/usr/bin/env python3
"""
Submit URL to Google Search Console Indexing API
Fixed version for ENEM Pro local factory
"""
import sys
import os
import json

# Add project to path
sys.path.insert(0, "/root/projetos/enem-pro")

try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    
    # Load credentials
    creds_path = os.environ.get("GOOGLE_INDEXING_CREDENTIALS") or "/root/projetos/enem-pro/gsc-credentials.json"
    
    if not os.path.exists(creds_path):
        print(f"Credentials not found at {creds_path}")
        print("Create service account key at: https://console.cloud.google.com/")
        print("Enable Indexing API, create service account, download JSON key")
        sys.exit(1)
    
    credentials = service_account.Credentials.from_service_account_file(
        creds_path,
        scopes=["https://www.googleapis.com/auth/indexing"]
    )
    
    service = build("indexing", "v3", credentials=credentials)
    
    url = sys.argv[1] if len(sys.argv) > 1 else "https://enemprep.com.br"
    
    result = service.urlNotifications().publish(
        body={
            "url": url,
            "type": "URL_UPDATED"
        }
    ).execute()
    
    print(f"Submitted: {url} -> {result}")
    
except ImportError:
    print("google-api-python-client not installed")
    print("Run: pip3 install google-api-python-client google-auth")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)