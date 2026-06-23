"""
Gera explicações para todas as questões sem cache em question_explanations.
Requer: SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY
Uso: python scripts/generate_explanations.py [--year 2023] [--limit 50]
"""
import os, sys, json, time, argparse, requests

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://lxlwajmzwvqwimuvvsrb.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = "claude-haiku-4-5-20251001"  # mais barato

SB_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

SYSTEM_PROMPT = """Você é professor especialista do ENEM. Explique por que a alternativa correta está certa.
Seja direto, claro e didático. Máximo 4 parágrafos. Não repita o enunciado. Não mencione a letra da resposta
no início — comece explicando o conceito. Use linguagem acessível para estudante do ensino médio."""

def get_all_year_ids():
    r = requests.get(f"{SUPABASE_URL}/rest/v1/questions_cache?select=id", headers=SB_HEADERS)
    return [row["id"] for row in r.json()]

def get_questions_for_year(year_id: str):
    r = requests.get(f"{SUPABASE_URL}/rest/v1/questions_cache?id=eq.{year_id}&select=data", headers=SB_HEADERS)
    rows = r.json()
    if not rows:
        return []
    return rows[0]["data"]

def get_existing_ids():
    r = requests.get(f"{SUPABASE_URL}/rest/v1/question_explanations?select=question_id", headers=SB_HEADERS, params={"limit": 10000})
    return {row["question_id"] for row in r.json()}

def generate_explanation(question: dict) -> str:
    discipline = question.get("discipline", "")
    context = question.get("context", "") or ""
    intro = question.get("alternativesIntroduction", "") or ""
    alternatives = question.get("alternatives", [])
    correct_letter = question.get("correctAlternative", "")

    correct_text = ""
    for alt in alternatives:
        if alt.get("letter") == correct_letter and not alt.get("file"):
            correct_text = alt.get("text", "")
            break

    prompt_parts = [f"Disciplina: {discipline}"]
    if context:
        prompt_parts.append(f"Contexto: {context[:800]}")
    if intro:
        prompt_parts.append(f"Pergunta: {intro[:400]}")
    if correct_text:
        prompt_parts.append(f"Resposta correta ({correct_letter}): {correct_text}")

    prompt = "\n\n".join(prompt_parts)

    headers = {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    payload = {
        "model": ANTHROPIC_MODEL,
        "max_tokens": 600,
        "system": SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": prompt}],
    }

    r = requests.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload, timeout=30)
    if r.status_code == 429:
        print("  Rate limit — aguardando 30s...")
        time.sleep(30)
        r = requests.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload, timeout=30)

    if r.status_code != 200:
        print(f"  Erro Anthropic {r.status_code}: {r.text[:200]}")
        return ""

    return r.json()["content"][0]["text"].strip()

def save_explanation(question_id: str, discipline: str, year: int, text: str):
    payload = {
        "question_id": question_id,
        "explanation": text,
        "model": f"claude-haiku-4-5-20251001",
    }
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/question_explanations",
        headers={**SB_HEADERS, "Prefer": "resolution=merge-duplicates"},
        json=payload,
    )
    return r.status_code in (200, 201)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, help="Processar só este ano (ex: 2023)")
    parser.add_argument("--limit", type=int, default=200, help="Máximo de explicações por execução")
    parser.add_argument("--delay", type=float, default=0.8, help="Segundos entre requisições")
    args = parser.parse_args()

    if not SUPABASE_KEY:
        print("ERRO: SUPABASE_SERVICE_KEY não definido")
        sys.exit(1)
    if not ANTHROPIC_KEY:
        print("ERRO: ANTHROPIC_API_KEY não definido")
        sys.exit(1)

    print("Buscando questões e explicações existentes...")
    existing_ids = get_existing_ids()
    print(f"  Explicações já existentes: {len(existing_ids)}")

    year_ids = get_all_year_ids()
    if args.year:
        year_ids = [y for y in year_ids if str(args.year) in y]
    print(f"  Anos a processar: {year_ids}")

    total_generated = 0
    for year_id in sorted(year_ids, reverse=True):
        year_num = int(year_id.replace("year-", ""))
        questions = get_questions_for_year(year_id)
        pending = [q for q in questions if q.get("id") and q["id"] not in existing_ids]
        print(f"\n{year_id}: {len(pending)} questões sem explicação")

        for q in pending:
            if total_generated >= args.limit:
                print(f"\nLimite de {args.limit} atingido.")
                return

            qid = q["id"]
            disc = q.get("discipline", "")

            # Pular questões só com imagens (sem texto suficiente)
            context = q.get("context", "") or ""
            intro = q.get("alternativesIntroduction", "") or ""
            if len(context) + len(intro) < 30:
                print(f"  Pulando {qid} (sem texto suficiente)")
                continue

            print(f"  Gerando {qid} ({disc[:25]})...", end=" ", flush=True)
            explanation = generate_explanation(q)
            if not explanation:
                print("ERRO")
                continue

            ok = save_explanation(qid, disc, year_num, explanation)
            if ok:
                existing_ids.add(qid)
                total_generated += 1
                print(f"OK ({total_generated})")
            else:
                print("FALHA ao salvar")

            time.sleep(args.delay)

    print(f"\nTotal gerado: {total_generated}")

if __name__ == "__main__":
    main()
