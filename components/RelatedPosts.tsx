import Link from 'next/link'
import { getRelatedPosts } from '@/lib/blog-data'

interface RelatedPostsProps {
  slug: string
  limit?: number
}

export default function RelatedPosts({ slug, limit = 4 }: RelatedPostsProps) {
  const related = getRelatedPosts(slug, limit)

  if (related.length === 0) return null

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-8 mt-12">
      <h3 className="text-lg font-bold text-indigo-900 mb-4">📚 Leia também</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {related.map(post => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group bg-white rounded-lg p-4 border border-indigo-100 hover:border-indigo-400 transition-all"
          >
            <p className="text-sm font-semibold text-indigo-900 group-hover:text-indigo-600 line-clamp-2">
              {post.title}
            </p>
            <p className="text-xs text-indigo-600 mt-2">Ler artigo →</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
