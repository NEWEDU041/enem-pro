#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function clusterByTopic(posts) {
  const clusters = new Map();

  posts.forEach(post => {
    const topic = extractMainTopic(post.title);
    if (!clusters.has(topic)) {
      clusters.set(topic, []);
    }
    clusters.get(topic).push(post);
  });

  return Array.from(clusters.entries()).map(([topic, posts]) => ({
    topic,
    posts: posts.map(p => ({ slug: p.slug, title: p.title })),
    count: posts.length,
    pillarPost: posts[0].slug, // First post becomes hub
  }));
}

function extractMainTopic(title) {
  // Simple topic extraction from title
  const topics = {
    'redação': 'essays',
    'matemática': 'mathematics',
    'história': 'history',
    'geografia': 'geography',
    'português': 'portuguese',
    'física': 'physics',
    'química': 'chemistry',
    'biologia': 'biology',
  };

  for (const [word, topic] of Object.entries(topics)) {
    if (title.toLowerCase().includes(word)) {
      return topic;
    }
  }

  return 'general';
}

function generateContentStrategy(clusters) {
  const strategy = {
    timestamp: new Date().toISOString(),
    clusters,
    actions: [
      {
        type: 'pillar-hub-strategy',
        description: 'Create hub pages for each topic cluster',
        priority: 'high',
        effort: '5 hours'
      },
      {
        type: 'internal-linking',
        description: 'Link related posts within clusters',
        priority: 'high',
        effort: '3 hours'
      },
      {
        type: 'expand-thin-content',
        description: 'Expand posts < 1500 words in high-traffic clusters',
        priority: 'medium',
        effort: '20 hours'
      }
    ]
  };

  const strategyPath = path.join(__dirname, '../content-strategy.json');
  fs.writeFileSync(strategyPath, JSON.stringify(strategy, null, 2));
  console.log('✅ Content strategy generated');
}

// Main flow
const mockPosts = [
  { title: 'Redação ENEM 2025', slug: 'redacao-enem-2025' },
  { title: 'Matemática Financeira', slug: 'matematica-financeira' },
  { title: 'Como passar em Medicina', slug: 'como-passar-medicina' }
];

const clusters = clusterByTopic(mockPosts);
generateContentStrategy(clusters);
