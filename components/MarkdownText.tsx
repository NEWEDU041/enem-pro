'use client'

import ReactMarkdown from 'react-markdown'

const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|!\[[^\]]*\]\([^)]+\))/g

function filterImages(src: string): boolean {
  return !src.includes('enem.dev') && !src.includes('broken-image')
}

interface MarkdownTextProps {
  text: string
  className?: string
}

export default function MarkdownText({ text, className }: MarkdownTextProps) {
  // Fast path for simple text — avoids ReactMarkdown overhead for enunciados
  const hasMarkdown = /[*#`\[\]!]/.test(text)

  if (!hasMarkdown) {
    return (
      <div className={className}>
        {text.split('\n').map((line, i) => (
          <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
        ))}
      </div>
    )
  }

  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          img: ({ src, alt }) => {
            const srcStr = typeof src === 'string' ? src : ''
            if (!srcStr || !filterImages(srcStr)) return null
            src = srcStr
            return (
              <img
                src={src}
                alt={alt || 'imagem'}
                className="max-w-full my-2 rounded"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            )
          },
          p: ({ children }) => <p className="mt-2 first:mt-0">{children}</p>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}

// For pages that don't use ReactMarkdown (SSR / no 'use client')
export function MarkdownTextStatic({ text, className }: MarkdownTextProps) {
  return (
    <div className={className}>
      {text.split('\n').map((line, li) => (
        <p key={li} className={li > 0 ? 'mt-2' : ''}>
          {line.split(TOKEN).map((part, i) => {
            if (/^\*\*(.+)\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>
            if (/^\*(.+)\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>
            const img = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
            if (img) {
              const src = img[2]
              if (!filterImages(src)) return null
              return (
                <img key={i} src={src} alt={img[1] || 'imagem'} className="max-w-full my-2 rounded"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              )
            }
            return part
          })}
        </p>
      ))}
    </div>
  )
}
