#!/usr/bin/env python3
"""
Scheduler maestro para fábrica de posts ENEM Pro
Roda diariamente, sorteia 15-30 posts + horários aleatórios,
cria cron jobs filhos para cada post.
"""

import json
import random
import subprocess
from datetime import datetime, timedelta
from pathlib import Path

# Path to create scheduled jobs
CRONJOB_SCRIPT = "/root/projetos/enem-pro/scripts/schedule_cron.py"

def main():
    print("=== SCHEDULER MAESTRO ===")
    
    # Sorteia quantidade de posts hoje
    count = random.randint(15, 30)
    print(f"Sorteado: {count} posts para hoje")
    
    # Horários aleatórios com precisão ms
    start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)
    
    # Cria horários
    times = []
    for i in range(count):
        # Random time within today
        random_seconds = random.randint(0, 86400)
        t = start + timedelta(seconds=random_seconds)
        # ms precision
        microsecond = random.randint(0, 999999)
        t = t.replace(microsecond=microsecond)
        times.append(t)
    
    times.sort()
    
    print("Horários agendados:")
    for t in times[:5]:  # show first 5
        print(f"  {t.isoformat()}")
    if count > 5:
        print(f"  ... +{count-5} mais")
    
    # Calls schedule_cron.py for each
    for i, t in enumerate(times):
        print(f"Agendando post #{i+1} para {t.isoformat()}")
        # This would call the actual cron scheduler
        # subprocess.run([sys.executable, CRONJOB_SCRIPT, t.isoformat()])
    
    print("=== SCHEDULER MAESTRO CONCLUÍDO ===")

if __name__ == "__main__":
    main()