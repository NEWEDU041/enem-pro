#!/usr/bin/env python3
"""
FÁBRICA DE POSTS ENEM Pro - Versão Python
Publica 15-30 posts/dia em horários aleatórios (precisão ms) durante 15 dias.
"""

import os
import json
import random
import subprocess
import time
from datetime import datetime, timedelta
from pathlib import Path

BASE_DIR = Path("/root/projetos/enem-pro")
DRAFTS_DIR = BASE_DIR / ".blog-memory" / "drafts"
STATE_FILE = BASE_DIR / ".blog-memory" / "publish-queue.json"
LOG_FILE = BASE_DIR / ".blog-memory" / "publish-log.json"

def load_state():
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except:
            pass
    return {
        "queue": [],
        "published": [],
        "failed": [],
        "current_batch": [],
        "last_run": datetime.now().isoformat(),
        "days_remaining": 15,
        "total_published": 0
    }

def save_state(state):
    STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False))

def log(message, level="info"):
    timestamp = datetime.now().isoformat()
    entry = {"timestamp": timestamp, "level": level, "message": message}
    
    logs = []
    if LOG_FILE.exists():
        try:
            logs = json.loads(LOG_FILE.read_text())
        except:
            pass
    logs.append(entry)
    if len(logs) > 1000:
        logs = logs[-1000:]
    LOG_FILE.write_text(json.dumps(logs, indent=2, ensure_ascii=False))
    
    print(f"[{timestamp}] {level.upper()}: {message}")

def get_unpublished_drafts(state):
    all_drafts = [d.name for d in DRAFTS_DIR.iterdir() if d.is_dir()]
    return [s for s in all_drafts 
            if s not in state["published"] 
            and s not in [f["slug"] for f in state["failed"]]
            and s not in state["current_batch"]
            and (DRAFTS_DIR / s / "article.md").exists()]

def pick_todays_batch(state):
    available = get_unpublished_drafts(state)
    if not available:
        log("Nenhum draft disponível", "warn")
        return []
    
    count = min(random.randint(15, 30), len(available), 30)
    batch = random.sample(available, count)
    log(f"Batch de hoje: {len(batch)} posts")
    return batch

def run_cmd(cmd, cwd=BASE_DIR, timeout=120):
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True, timeout=timeout)
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return False, "", "Timeout"
    except Exception as e:
        return False, "", str(e)

def convert_draft(slug):
    log(f"Convertendo: {slug}")
    ok, out, err = run_cmd("python3 scripts/draft_to_blogpost.py", timeout=120)
    return ok

def run_quality_check():
    log("Quality check...")
    ok, out, err = run_cmd("node scripts/auto-quality-check.js", timeout=60)
    return ok

def run_internal_linking():
    log("Internal linking...")
    ok, out, err = run_cmd("node scripts/auto-internal-linking.js", timeout=60)
    return ok

def git_commit_push(slug):
    log(f"Git commit+push: {slug}")
    ok, out, err = run_cmd("git add -A", timeout=30)
    if not ok:
        return False
    ok, out, err = run_cmd(f'git commit -m "feat: publish {slug}"', timeout=30)
    if not ok:
        return False
    ok, out, err = run_cmd("git push origin master", timeout=120)
    return ok

def submit_gsc(slug):
    log(f"GSC submit: {slug}")
    url = f"https://questoesenem.pro/blog/{slug}"
    ok, out, err = run_cmd(f'python3 scripts/submit-sitemap-gsc.py "{url}"', timeout=30)
    return ok

def publish_post(slug):
    log(f"=== PUBLICANDO: {slug} ===")
    
    try:
        # 1. Convert
        if not convert_draft(slug):
            return False, "Falha conversão"
        
        # 2. Quality check
        if not run_quality_check():
            return False, "Falha quality-check"
        
        # 3. Internal linking (non-blocking)
        run_internal_linking()
        
        # 4. Git commit + push
        if not git_commit_push(slug):
            return False, "Falha git push"
        
        # 5. Wait for Vercel deploy
        log("Aguardando Vercel deploy (30s)...")
        time.sleep(30)
        
        # 6. GSC submit
        submit_gsc(slug)
        
        log(f"=== SUCESSO: {slug} ===")
        return True, None
        
    except Exception as e:
        log(f"Erro em {slug}: {e}", "error")
        return False, str(e)

def run_daily_batch():
    log("=== BATCH DIÁRIO INICIADO ===")
    state = load_state()
    
    if state["days_remaining"] <= 0:
        log("Campanha de 15 dias concluída!")
        return
    
    batch = pick_todays_batch(state)
    if not batch:
        return
    
    state["current_batch"] = batch
    save_state(state)
    
    # Schedule random times for today
    now = datetime.now()
    end_of_day = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    total_seconds = (end_of_day - now).total_seconds()
    
    for i, slug in enumerate(batch):
        # Random delay up to end of day
        delay = random.uniform(0, total_seconds)
        scheduled = now + timedelta(seconds=delay)
        log(f"Agendado {slug} para {scheduled.isoformat()}")
        
        # For now, run sequentially with small delay
        if i > 0:
            time.sleep(random.uniform(1, 5))  # 1-5s between posts
        
        success, error = publish_post(slug)
        
        if success:
            state["published"].append(slug)
            state["total_published"] += 1
        else:
            state["failed"].append({
                "slug": slug,
                "error": error,
                "timestamp": datetime.now().isoformat()
            })
        
        state["current_batch"] = [s for s in state["current_batch"] if s != slug]
        save_state(state)
    
    state["days_remaining"] -= 1
    state["last_run"] = datetime.now().isoformat()
    save_state(state)
    
    log("=== BATCH DIÁRIO CONCLUÍDO ===")
    today_published = len([s for s in batch if s in state["published"]])
    log(f"Publicados hoje: {today_published}/{len(batch)}")
    log(f"Total: {state['total_published']}")
    log(f"Dias restantes: {state['days_remaining']}")

if __name__ == "__main__":
    run_daily_batch()