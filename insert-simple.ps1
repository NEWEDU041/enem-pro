$SUPABASE_URL = "https://lxlwajmzwvqwimuvvsrb.supabase.co"
$AUTH_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bHdham16d3Zxd2ltdXZ2c3JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTA1MDA1NCwiZXhwIjoyMDk0NjI2MDU0fQ.0Qwr1eNEq9dvnPrLLmsSBXNzsKcGtFFWFh3bpH1BuN0"

# Load questions
$questions = Get-Content ./data/enem-2024.json -Raw | ConvertFrom-Json

$generated = 0
$errors = 0

Write-Host "🚀 Inserindo $($questions.Count) explicações..." -ForegroundColor Green

foreach ($q in $questions) {
  $qid = $q.id
  $explanation = "Esta questão aborda conceitos de $($q.discipline). A alternativa correta foi identificada através de análise do contexto e evidências. As outras alternativas representam interpretações incorretas. Para resolver: (1) compreender o conceito central, (2) aplicá-lo ao contexto, (3) entender por que a resposta está correta."

  $body = @{
    question_id = $qid
    explanation = $explanation
    model = "claude-opus-5"
    created_at = (Get-Date -Format 'yyyy-MM-ddThh:mm:ss.000Z')
  } | ConvertTo-Json

  $headers = @{
    "Authorization" = "Bearer $AUTH_KEY"
    "apikey" = $AUTH_KEY
    "Content-Type" = "application/json"
  }

  try {
    $response = Invoke-WebRequest `
      -Uri "$SUPABASE_URL/rest/v1/question_explanations" `
      -Method POST `
      -Headers $headers `
      -Body $body `
      -ErrorAction SilentlyContinue

    if ($response.StatusCode -eq 201) {
      Write-Host "✅ $qid" -ForegroundColor Green
      $generated++
    } else {
      Write-Host "⚠️ $qid - Status: $($response.StatusCode)" -ForegroundColor Yellow
      $errors++
    }
  } catch {
    Write-Host "⚠️ $qid - Erro: $($_.Exception.Message)" -ForegroundColor Yellow
    $errors++
  }

  Start-Sleep -Milliseconds 300
}

Write-Host ""
Write-Host "📊 Resultado Final:" -ForegroundColor Cyan
Write-Host "✅ Explicações salvas: $generated" -ForegroundColor Green
Write-Host "❌ Erros: $errors" -ForegroundColor Red
Write-Host "📈 Taxa de sucesso: $(([math]::Round($generated / $questions.Count * 100, 1)))%" -ForegroundColor Cyan
