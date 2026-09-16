#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function analyzeEvergreenPotential(post) {
  const signals = {
    hasDate: /202[0-9]/.test(post.title),
    hasSeason: /janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro/i.test(post.title),
    hasVersion: /v\d+|atualizado|2025|2026/.test(post.title),
    wordCount: post.content ? post.content.split(/\s+/).length : 0,
  };

  const evergreenScore = calculateScore(signals);

  return {
    slug: post.slug,
    title: post.title,
    signals,
    evergreenScore,
    status: evergreenScore > 0.7 ? 'evergreen' : 'seasonal',
    recommendations: generateRecommendations(signals, evergreenScore)
  };
}

function calculateScore(signals) {
  let score = 1.0;
  if (signals.hasDate) score -= 0.3;
  if (signals.hasSeason) score -= 0.2;
  if (signals.hasVersion) score -= 0.15;
  if (signals.wordCount < 800) score -= 0.1;
  return Math.max(0, score);
}

function generateRecommendations(signals, score) {
  const recs = [];
  if (signals.hasDate) recs.push('Remove or generalize year references');
  if (signals.hasSeason) recs.push('Make seasonal content template-based');
  if (signals.wordCount < 1500) recs.push('Expand thin content to 1500+ words');
  return recs;
}

function main() {
  const report = {
    timestamp: new Date().toISOString(),
    analysis: [
      analyzeEvergreenPotential({
        slug: 'logaritmos-matematica-enem',
        title: 'Logaritmos em Matemática para o ENEM',
        content: 'Lorem ipsum dolor sit amet...' // placeholder
      }),
      analyzeEvergreenPotential({
        slug: 'enem-2025-gabarito',
        title: 'Gabarito ENEM 2025 - Respostas Oficiais',
        content: 'A' // short
      })
    ],
    summary: {
      evergreenCount: 0,
      seasonalCount: 0,
      averageScore: 0
    }
  };

  // Calculate summary
  report.analysis.forEach(a => {
    if (a.status === 'evergreen') report.summary.evergreenCount++;
    else report.summary.seasonalCount++;
    report.summary.averageScore += a.evergreenScore;
  });
  report.summary.averageScore /= report.analysis.length;

  const reportPath = path.join(__dirname, '../evergreen-analysis.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log('✅ Evergreen strategy analysis complete');
}

main();
