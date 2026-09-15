#!/usr/bin/env node
/**
 * 🗺️  AUTO-SITEMAP — DESATIVADO
 *
 * O sitemap deste projeto é DINÂMICO (app/sitemap.ts) e o robots é dinâmico
 * (app/robots.ts). Gerar um public/sitemap.xml estático faz o Next.js servir
 * o arquivo estático no lugar da rota dinâmica, congelando o sitemap e
 * quebrando a indexação (foi exatamente o que aconteceu entre ago/2026).
 *
 * Não recrie public/sitemap.xml nem public/robots.txt.
 */
console.log('⏭️  auto-sitemap.js está desativado de propósito.')
console.log('   Sitemap dinâmico: app/sitemap.ts  → https://questoesenem.pro/sitemap.xml')
console.log('   Robots dinâmico:  app/robots.ts   → https://questoesenem.pro/robots.txt')
process.exit(0)
