# PHASE 2: Robots.txt + Meta-Generator for ENEM-Pro

## Decision
- Create `public/robots.txt` with crawl directives for SEO
- Create `src/lib/meta-generator.ts` (from Clube-da-Escolha reference)
- Add meta-tag validation and sanitization
- Validate with curl + grep tests

## Directives
- Deny: /admin, /api/, .env files
- Allow: /questions, /exams, /solutions
- Add sitemap references
- Crawl-delay: 1 (Googlebot), 2 (others)

## References
- Clube-da-Escolha pattern: `/root/projetos/clube-da-escolha/public/robots.txt`
- Meta-generator source: `/root/projetos/clube-da-escolha/src/lib/meta-generator.ts`

## Scope
- robots.txt: public crawl rules
- meta-generator.ts: 100+ meta tags, sanitization, validation
- Validation: curl + grep tests
