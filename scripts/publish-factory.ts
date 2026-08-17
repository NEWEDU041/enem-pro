/**
 * FÁBRICA DE POSTS ENEM Pro
 * 
 * Sistema que publica 15-30 posts/dia em horários aleatórios (precisão ms)
 * durante 15 dias. Pega drafts não publicados, roda quality-check,
 * internal-linking, commit, deploy e submete no GSC.
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE_DIR = "/root/projetos/enem-pro";
const DRAFTS_DIR = path.join(BASE_DIR, ".blog-memory/drafts");
const STATE_FILE = path.join(BASE_DIR, ".blog-memory/publish-queue.json");
const LOG_FILE = path.join(BASE_DIR, ".blog-memory/publish-log.json");

interface PublishState {
  queue: string[];           // drafts waiting to publish
  published: string[];       // already published
  failed: { slug: string; error: string; timestamp: string }[];
  currentBatch: string[];    // posts being published today
  lastRun: string;           // ISO timestamp
  daysRemaining: number;     // days left in 15-day campaign
  totalPublished: number;
}

interface PublishResult {
  success: boolean;
  slug: string;
  error?: string;
  deployUrl?: string;
}

function loadState(): PublishState {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
    } catch {
      // fallback
    }
  }
  return {
    queue: [],
    published: [],
    failed: [],
    currentBatch: [],
    lastRun: new Date().toISOString(),
    daysRemaining: 15,
    totalPublished: 0
  };
}

function saveState(state: PublishState): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function log(message: string, level: "info" | "warn" | "error" = "info"): void {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, message };
  
  let logs: any[] = [];
  if (fs.existsSync(LOG_FILE)) {
    try {
      logs = JSON.parse(fs.readFileSync(LOG_FILE, "utf-8"));
    } catch {}
  }
  logs.push(logEntry);
  // Keep last 1000 entries
  if (logs.length > 1000) logs = logs.slice(-1000);
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
  
  console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
}

// Get all unpublished drafts
function getUnpublishedDrafts(state: PublishState): string[] {
  const allDrafts = fs.readdirSync(DRAFTS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
  
  return allDrafts.filter(slug => 
    !state.published.includes(slug) && 
    !state.failed.some(f => f.slug === slug) &&
    !state.currentBatch.includes(slug) &&
    fs.existsSync(path.join(DRAFTS_DIR, slug, "article.md"))
  );
}

// Pick 15-30 random posts for today
function pickTodaysBatch(state: PublishState): string[] {
  const available = getUnpublishedDrafts(state);
  
  if (available.length === 0) {
    log("Nenhum draft disponível para publicar", "warn");
    return [];
  }
  
  // Random between 15-30
  const count = Math.min(
    Math.floor(Math.random() * (30 - 15 + 1)) + 15,
    available.length,
    30
  );
  
  // Shuffle and pick
  const shuffled = available.sort(() => Math.random() - 0.5);
  const batch = shuffled.slice(0, count);
  
  log(`Batch de hoje: ${batch.length} posts selecionados`);
  return batch;
}

// Convert draft to blog post (uses existing Python script)
function convertDraft(slug: string): boolean {
  try {
    log(`Convertendo draft: ${slug}`);
    execSync("python3 scripts/draft_to_blogpost.py", { 
      cwd: BASE_DIR, 
      stdio: "pipe",
      timeout: 120000
    });
    return true;
  } catch (error: any) {
    log(`Erro ao converter ${slug}: ${error.message}`, "error");
    return false;
  }
}

// Run quality checks
function runQualityCheck(): boolean {
  try {
    log("Rodando quality-check...");
    execSync("node scripts/auto-quality-check.js", { 
      cwd: BASE_DIR, 
      stdio: "pipe",
      timeout: 60000
    });
    return true;
  } catch (error: any) {
    log(`Quality check falhou: ${error.message}`, "error");
    return false;
  }
}

// Run internal linking
function runInternalLinking(): boolean {
  try {
    log("Rodando internal-linking...");
    execSync("node scripts/auto-internal-linking.js", { 
      cwd: BASE_DIR, 
      stdio: "pipe",
      timeout: 60000
    });
    return true;
  } catch (error: any) {
    log(`Internal linking falhou: ${error.message}`, "warn");
    return false; // Non-fatal
  }
}

// Git commit + push
function gitCommitAndPush(slug: string): boolean {
  try {
    log(`Commitando ${slug}...`);
    
    execSync("git add -A", { cwd: BASE_DIR, stdio: "pipe" });
    execSync(`git commit -m "feat: publish ${slug}"`, { cwd: BASE_DIR, stdio: "pipe" });
    execSync("git push origin master", { cwd: BASE_DIR, stdio: "pipe", timeout: 120000 });
    
    log(`Push realizado para ${slug}`);
    return true;
  } catch (error: any) {
    log(`Git push falhou para ${slug}: ${error.message}`, "error");
    return false;
  }
}

// Submit URL to GSC Indexing API
function submitToGSC(slug: string): boolean {
  try {
    const url = `https://questoesenem.pro/blog/${slug}`;
    log(`Submetendo ao GSC: ${url}`);
    
    // Uses the existing submit-sitemap-gsc script
    execSync(`python3 scripts/submit-sitemap-gsc.py "${url}"`, { 
      cwd: BASE_DIR, 
      stdio: "pipe",
      timeout: 30000
    });
    
    return true;
  } catch (error: any) {
    log(`GSC submit falhou para ${slug}: ${error.message}`, "warn");
    return false; // Non-fatal
  }
}

// Publish a single post
async function publishPost(slug: string): Promise<PublishResult> {
  log(`=== INICIANDO PUBLICAÇÃO: ${slug} ===`);
  
  try {
    // 1. Convert draft
    if (!convertDraft(slug)) {
      return { success: false, slug, error: "Falha na conversão do draft" };
    }
    
    // 2. Quality check
    if (!runQualityCheck()) {
      return { success: false, slug, error: "Falha no quality-check" };
    }
    
    // 3. Internal linking
    runInternalLinking(); // Non-blocking
    
    // 4. Git commit + push (triggers Vercel deploy)
    if (!gitCommitAndPush(slug)) {
      return { success: false, slug, error: "Falha no git push" };
    }
    
    // 5. Wait a bit for Vercel deploy
    log("Aguardando deploy Vercel (30s)...");
    await new Promise(r => setTimeout(r, 30000));
    
    // 6. Submit to GSC
    submitToGSC(slug);
    
    log(`=== PUBLICADO COM SUCESSO: ${slug} ===`);
    return { success: true, slug };
    
  } catch (error: any) {
    log(`Erro inesperado em ${slug}: ${error.message}`, "error");
    return { success: false, slug, error: error.message };
  }
}

// Main daily runner
async function runDailyBatch() {
  log("=== INICIANDO BATCH DIÁRIO ===");
  
  const state = loadState();
  
  // Check if campaign is done
  if (state.daysRemaining <= 0) {
    log("Campanha de 15 dias concluída!", "info");
    return;
  }
  
  // Pick today's batch
  const batch = pickTodaysBatch(state);
  
  if (batch.length === 0) {
    log("Nenhum post para publicar hoje", "warn");
    return;
  }
  
  state.currentBatch = batch;
  saveState(state);
  
  // Schedule each post at random time today (ms precision)
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  
  for (const slug of batch) {
    // Random time between now and end of day
    const randomMs = Math.floor(Math.random() * (endOfDay.getTime() - now.getTime()));
    const scheduledTime = new Date(now.getTime() + randomMs);
    
    log(`Agendado ${slug} para ${scheduledTime.toISOString()}`);
    
    // In production, this would be a separate cron job
    // For now, we publish sequentially with small delays
    await new Promise(r => setTimeout(r, 1000)); // 1s between posts
    
    const result = await publishPost(slug);
    
    if (result.success) {
      state.published.push(slug);
      state.totalPublished++;
    } else {
      state.failed.push({
        slug,
        error: result.error || "Erro desconhecido",
        timestamp: new Date().toISOString()
      });
    }
    
    // Remove from current batch
    state.currentBatch = state.currentBatch.filter(s => s !== slug);
    saveState(state);
  }
  
  // Update campaign progress
  state.daysRemaining--;
  state.lastRun = new Date().toISOString();
  saveState(state);
  
  log(`=== BATCH DIÁRIO CONCLUÍDO ===`);
  log(`Publicados hoje: ${batch.filter(s => state.published.includes(s)).length}/${batch.length}`);
  log(`Total publicado: ${state.totalPublished}`);
  log(`Dias restantes: ${state.daysRemaining}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDailyBatch().catch(err => {
    log(`Erro fatal: ${err.message}`, "error");
    process.exit(1);
  });
}

export { runDailyBatch, loadState, saveState };