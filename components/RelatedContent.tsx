'use client'

import Link from 'next/link'

interface RelatedItem {
  title: string
  href: string
  type: 'blog' | 'question'
}

interface RelatedContentProps {
  items: RelatedItem[]
  title?: string
}

export default function RelatedContent({ items, title = 'Conteúdo Relacionado' }: RelatedContentProps) {
  if (!items || items.length === 0) return null

  return (
    <div className="bg-indigo-50 rounded-2xl border border-indigo-200 p-6 mb-6">
      <h3 className="font-semibold text-indigo-900 mb-4">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx}>
            <Link
              href={item.href}
              className="text-sm text-indigo-700 hover:text-indigo-900 hover:underline flex items-start gap-2"
            >
              <span className="text-indigo-400 mt-0.5">→</span>
              <span>{item.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
