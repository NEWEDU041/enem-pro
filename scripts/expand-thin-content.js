#!/usr/bin/env node

/**
 * Identify and expand thin content (<1500 words)
 * Automatically generate expansion sections based on:
 * - Related keywords (LSI)
 * - FAQ patterns
 * - Comparison tables
 * - Internal link opportunities
 */

const fs = require('fs');
const path = require('path');

function analyzeContent(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const wordCount = content.split(/\s+/).length;
  
  return {
    file: path.basename(filePath),
    wordCount,
    isThin: wordCount < 1500,
    expansion: wordCount < 1500 ? Math.ceil((1500 - wordCount) / 100) * 100 : 0
  };
}

function findThinContent(directory) {
  const posts = fs.readdirSync(directory)
    .filter(f => f.endsWith('.md'))
    .map(f => analyzeContent(path.join(directory, f)))
    .filter(p => p.isThin)
    .sort((a, b) => a.wordCount - b.wordCount);

  return posts;
}

function generateExpansionGuide(post) {
  return {
    file: post.file,
    currentWords: post.wordCount,
    targetWords: 1500,
    wordsNeeded: post.expansion,
    suggestions: [
      '+ Add FAQ section (300-400 words)',
      '+ Add comparison table (200-300 words)',
      '+ Add real-world examples (300-400 words)',
      '+ Add troubleshooting section (200-300 words)',
      '+ Add internal linking mesh (100-150 words)',
      '+ Add study tips/checklist (150-200 words)'
    ]
  };
}

const postsDir = path.join(__dirname, '../app/blog/posts');
const thinPosts = findThinContent(postsDir);

console.log(`\n📊 THIN CONTENT ANALYSIS`);
console.log(`═════════════════════════════════\n`);
console.log(`Total thin posts: ${thinPosts.length}`);
console.log(`Total words to add: ${thinPosts.reduce((sum, p) => sum + p.expansion, 0)}`);
console.log(`Estimated effort: ${Math.ceil(thinPosts.length * 1.5)} hours\n`);

console.log(`TOP 10 PRIORITY (Most thin):\n`);
thinPosts.slice(0, 10).forEach((post, i) => {
  const guide = generateExpansionGuide(post);
  console.log(`${i + 1}. ${guide.file}`);
  console.log(`   Current: ${guide.currentWords} words → Target: ${guide.targetWords} words (+${guide.wordsNeeded} words)`);
  console.log(`   Suggestions: ${guide.suggestions.slice(0, 3).join(' | ')}`);
  console.log();
});

// Save report
const report = {
  totalThin: thinPosts.length,
  totalWordsNeeded: thinPosts.reduce((sum, p) => sum + p.expansion, 0),
  estimatedHours: Math.ceil(thinPosts.length * 1.5),
  posts: thinPosts.slice(0, 25).map(p => generateExpansionGuide(p))
};

fs.writeFileSync(
  path.join(__dirname, '../reports/thin-content-analysis.json'),
  JSON.stringify(report, null, 2)
);

console.log(`\n✅ Report saved: reports/thin-content-analysis.json`);
