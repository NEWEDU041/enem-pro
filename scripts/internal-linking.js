#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function generateInternalLinks(posts) {
  const linkMatrix = {};

  posts.forEach((post, idx) => {
    const keywords = extractKeywords(post.title);
    const relatedPosts = posts
      .map((p, i) => ({
        ...p,
        idx: i,
        score: calculateSimilarity(keywords, extractKeywords(p.title))
      }))
      .filter(p => p.idx !== idx && p.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    linkMatrix[post.slug] = relatedPosts.map(p => ({
      slug: p.slug,
      title: p.title,
      relevance: p.score
    }));
  });

  return linkMatrix;
}

function extractKeywords(title) {
  return title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
}

function calculateSimilarity(kw1, kw2) {
  const set1 = new Set(kw1);
  const set2 = new Set(kw2);
  const intersection = [...set1].filter(k => set2.has(k)).length;
  const union = new Set([...set1, ...set2]).size;
  return union === 0 ? 0 : intersection / union;
}

module.exports = { generateInternalLinks };
