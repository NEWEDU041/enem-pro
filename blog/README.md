# Blog Index

This directory contains the blog for ENEM-Pro. All blog posts are organized here.

## Structure

- `[slug].md` - Individual blog posts in markdown format
- `_metadata.json` - Blog metadata and configuration

## Adding Posts

1. Create a new markdown file with the format: `article-title.md`
2. Add frontmatter with metadata (title, date, author, tags)
3. Write the content in markdown

## SEO

All blog posts are automatically indexed and included in the sitemap.xml. Each post generates:

- Meta tags (title, description, OG tags)
- JSON-LD schema markup
- Breadcrumb navigation
- Related posts

See `/lib/schema.ts` for schema generators.
