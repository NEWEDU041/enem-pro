#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Read consolidated posts
const consolidatedPath = 'C:\\Users\\Acer\\AppData\\Local\\Temp\\claude\\C--Users-Acer\\405904f8-616e-4b61-b71d-27a69b33c648\\scratchpad\\ALL_CONSOLIDATED_POSTS.json';
let consolidatedPosts = [];

try {
  let data = fs.readFileSync(consolidatedPath, 'utf-8');
  // Remove BOM if present
  if (data.charCodeAt(0) === 0xfeff) {
    data = data.slice(1);
  }
  consolidatedPosts = JSON.parse(data);
  console.log(`✓ Loaded ${consolidatedPosts.length} consolidated posts`);
} catch (error) {
  console.error('Error reading consolidated posts:', error.message);
  process.exit(1);
}

// Generate blog-data.ts
const blogDataContent = `export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: number;
  content: string;
  cover_url?: string;
  noindex?: boolean;
}

export const BLOG_POSTS: BlogPost[] = ${JSON.stringify(consolidatedPosts, null, 2)};

export function getAllPosts(): BlogPost[] {
  return BLOG_POSTS;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find(p => p.slug === slug);
}

export function getPost(slug: string): BlogPost | undefined {
  return getPostBySlug(slug);
}

export function getRelatedPosts(slug: string, limit: number = 3): BlogPost[] {
  const post = getPostBySlug(slug);
  if (!post) return [];
  return BLOG_POSTS.filter(p => p.slug !== slug).slice(0, limit);
}

export function getPostsByDiscipline(discipline: string, limit: number = 3): BlogPost[] {
  const disciplineLower = discipline.toLowerCase();
  return BLOG_POSTS.filter(p =>
    p.title.toLowerCase().includes(disciplineLower)
  ).slice(0, limit);
}

export function getCategory(slug: string): string {
  if (slug.includes("gabarito")) return "gabarito";
  if (slug.includes("questao")) return "questoes";
  return "blog";
}
`;

const outputPath = path.join(__dirname, '../lib/blog-data.ts');
fs.writeFileSync(outputPath, blogDataContent, 'utf-8');
console.log(`✓ Generated ${outputPath} with ${consolidatedPosts.length} posts`);
