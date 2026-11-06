import { notFound } from 'next/navigation'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { ReactNode } from 'react'

// Type definitions
interface Params {
  slug: string[]
}

interface FrontmatterData {
  title?: string
  description?: string
  date?: string
  slug?: string
  category?: string
  keywords?: string[]
  [key: string]: any
}

interface PostData {
  data: FrontmatterData
  content: string
}

// Helper: Parse MDX/Markdown frontmatter
function parseMDXFile(filePath: string): PostData {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const { data, content } = matter(fileContent)
    return { data, content }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error)
    throw error
  }
}

// Helper: Find MDX file (flexible matching)
function findMDXFile(slug: string[]): string | null {
  const baseDir = path.join(process.cwd(), 'src/posts')
  
  // Try exact match first
  const exactPath = path.join(baseDir, ...slug) + '.mdx'
  if (fs.existsSync(exactPath)) return exactPath
  
  // Try with .md
  const mdPath = path.join(baseDir, ...slug) + '.md'
  if (fs.existsSync(mdPath)) return mdPath
  
  // Try folder/index.mdx
  const indexMdxPath = path.join(baseDir, ...slug, 'index.mdx')
  if (fs.existsSync(indexMdxPath)) return indexMdxPath
  
  return null
}

// Generate static params for known posts (for SSG)
export async function generateStaticParams(): Promise<Params[]> {
  const postsDir = path.join(process.cwd(), 'src/posts')
  
  if (!fs.existsSync(postsDir)) {
    return []
  }
  
  const params: Params[] = []
  
  function walkDir(dir: string, prefix: string[] = []) {
    const files = fs.readdirSync(dir)
    
    for (const file of files) {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      
      if (stat.isDirectory()) {
        walkDir(filePath, [...prefix, file])
      } else if (file.endsWith('.mdx') || file.endsWith('.md')) {
        const slug = [...prefix, file.replace(/\.(mdx|md)$/, '')]
        params.push({ slug })
      }
    }
  }
  
  walkDir(postsDir)
  return params
}

// Metadata generation
export async function generateMetadata({ params }: { params: Params }) {
  const filePath = findMDXFile(params.slug)
  
  if (!filePath) {
    return {
      title: 'Not Found',
      description: 'Post not found',
    }
  }
  
  const { data } = parseMDXFile(filePath)
  
  return {
    title: data.title || 'Untitled',
    description: data.description || 'No description available',
    keywords: data.keywords?.join(', ') || '',
    openGraph: {
      title: data.title || 'Untitled',
      description: data.description || 'No description available',
      type: 'article',
      publishedTime: data.date || new Date().toISOString(),
    },
  }
}

// Simple MDX content renderer (you can replace with MDX Compiler if needed)
function RenderContent({ content }: { content: string }): ReactNode {
  // For now, render as HTML/plaintext
  // In production, use @mdx-js/react or next-mdx-remote
  return (
    <div 
      className="prose prose-lg max-w-4xl mx-auto"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

export default async function PostPage({ params }: { params: Params }) {
  const filePath = findMDXFile(params.slug)
  
  if (!filePath) {
    notFound()
  }
  
  let { data, content } = parseMDXFile(filePath)
  
  // Convert markdown to basic HTML (replace headers, code blocks, etc)
  content = content
    .replace(/^### (.*?)$/gm, '<h3 className="text-xl font-bold mt-4">$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2 className="text-2xl font-bold mt-6">$1</h2>')
    .replace(/^# (.*?)$/gm, '<h1 className="text-3xl font-bold mt-8">$1</h1>')
    .replace(/^```(\w+)?\n([\s\S]*?)\n```/gm, '<pre className="bg-gray-100 p-4 rounded"><code>$2</code></pre>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '<br/><br/>')
  
  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{data.title || 'Untitled'}</h1>
        <p className="text-gray-600 text-lg">{data.description}</p>
        {data.date && (
          <time className="text-gray-500 text-sm">
            {new Date(data.date).toLocaleDateString('pt-BR')}
          </time>
        )}
      </header>

      {/* Content */}
      <div className="prose prose-lg max-w-none">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-gray-200">
        {data.keywords && data.keywords.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-600 mb-2">Keywords:</p>
            <div className="flex flex-wrap gap-2">
              {data.keywords.map((keyword: string) => (
                <span 
                  key={keyword}
                  className="px-3 py-1 bg-gray-100 rounded text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
        {data.category && (
          <p className="text-sm text-gray-600">
            Category: <span className="font-semibold">{data.category}</span>
          </p>
        )}
      </footer>

      {/* Schema Markup (TechArticle) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'TechArticle',
            headline: data.title || 'Untitled',
            description: data.description || '',
            datePublished: data.date || new Date().toISOString(),
            author: {
              '@type': 'Organization',
              name: 'ENEM Pro',
              url: 'https://enem-pro.com',
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://enem-pro.com/posts/${params.slug.join('/')}`,
            },
            isAccessibleForFree: true,
            keywords: data.keywords?.join(', ') || '',
          }),
        }}
      />
    </article>
  )
}
