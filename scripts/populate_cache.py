"""
Popula questions_cache no Supabase com dados da api.enem.dev.
Roda localmente (api.enem.dev bloqueia IPs do Vercel).
"""
import json
import time
import urllib.request
import urllib.error
import sys

SUPABASE_URL = "https://lxlwajmzwvqwimuvvsrb.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bHdham16d3Zxd2ltdXZ2c3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTAwNTQsImV4cCI6MjA5NDYyNjA1NH0.FZj-G3Bg9Z5TfqsYnS6zm8KuwoW-As64m0kzk_ycfzA"

YEARS = [2023,2022,2021,2020,2019,2018,2017,2016,2015,2014,2013,2012,2011,2010,2009]

DISCIPLINE_MAP = {
    'linguagens': 'Linguagens, Códigos e suas Tecnologias',
    'ciencias-humanas': 'Ciências Humanas e suas Tecnologias',
    'ciencias-natureza': 'Ciências da Natureza e suas Tecnologias',
    'matematica': 'Matemática',
    'ciências humanas e suas tecnologias': 'Ciências Humanas e suas Tecnologias',
    'ciências da natureza e suas tecnologias': 'Ciências da Natureza e suas Tecnologias',
    'linguagens, códigos e suas tecnologias': 'Linguagens, Códigos e suas Tecnologias',
    'matemática': 'Matemática',
    'matemática e suas tecnologias': 'Matemática',
}

def normalize_discipline(raw):
    if not raw:
        return 'Geral'
    return DISCIPLINE_MAP.get(raw.lower().strip(), raw)

PAGE_LIMIT = 50

def fetch_page(year, offset):
    url = f"https://api.enem.dev/v1/exams/{year}/questions?limit={PAGE_LIMIT}&offset={offset}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def map_question(year, i, q):
    alts_raw = q.get('alternatives') or q.get('alternativas') or []
    return {
        'id': f"{year}-{i+1}",
        'year': year,
        'discipline': normalize_discipline(q.get('discipline') or q.get('disciplina')),
        'title': q.get('title') or q.get('enunciado') or '',
        'context': q.get('context') or q.get('contexto') or '',
        'alternativesIntroduction': q.get('alternativesIntroduction') or '',
        'alternatives': [
            {
                'letter': a.get('letter') or a.get('letra') or '',
                'text': a.get('text') or a.get('texto') or '',
                'isCorrect': bool(a.get('isCorrect')),
            }
            for a in alts_raw
        ],
        'correctAlternative': q.get('correctAlternative') or q.get('gabarito') or '',
    }

def fetch_year(year):
    all_questions = []
    offset = 0
    while True:
        data = fetch_page(year, offset)
        raw_qs = data.get('questions', data if isinstance(data, list) else [])
        total = data.get('metadata', {}).get('total', len(raw_qs)) if isinstance(data, dict) else len(raw_qs)
        for i, q in enumerate(raw_qs):
            all_questions.append(map_question(year, offset + i, q))
        offset += len(raw_qs)
        has_more = data.get('metadata', {}).get('hasMore', False) if isinstance(data, dict) else False
        if not has_more or offset >= total or not raw_qs:
            break
        time.sleep(0.5)
    return all_questions

def upsert_year(year, questions):
    from datetime import datetime, timezone
    payload = json.dumps({
        'id': f'year-{year}',
        'year': year,
        'discipline': None,
        'data': questions,
        'cached_at': datetime.now(timezone.utc).isoformat(),
    }).encode()
    url = f"{SUPABASE_URL}/rest/v1/questions_cache"
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  Supabase error {e.code}: {body[:200]}")
        return e.code

def main():
    years = YEARS
    if len(sys.argv) > 1:
        years = [int(y) for y in sys.argv[1:]]

    for year in years:
        print(f"[{year}] Fetching...", end='', flush=True)
        try:
            qs = fetch_year(year)
            print(f" {len(qs)} questões...", end='', flush=True)
            status = upsert_year(year, qs)
            print(f" upsert={status} OK")
        except Exception as e:
            print(f" ERRO: {e}")
        time.sleep(2)

if __name__ == '__main__':
    main()
