import { ImageResponse } from 'next/og'
import { getPost, getCategory } from '@/lib/blog-data'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)

  const title = post?.title ?? 'ENEM Pro'
  const category = post ? getCategory(slug) : 'Blog'

  // Truncate title to ~2 lines
  const shortTitle = title.length > 80 ? title.slice(0, 77) + '…' : title

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: '#18181b',
          padding: '64px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top accent bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{ width: '40px', height: '4px', background: '#6366f1', borderRadius: '2px' }} />
          <span style={{ color: '#a5b4fc', fontSize: '18px', fontWeight: 600, letterSpacing: '0.05em' }}>
            ENEM PRO
          </span>
          <div style={{
            background: '#312e81',
            color: '#c7d2fe',
            fontSize: '14px',
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: '20px',
            marginLeft: '8px',
          }}>
            {category}
          </div>
        </div>

        {/* Title */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
        }}>
          <span style={{
            color: '#f4f4f5',
            fontSize: shortTitle.length > 60 ? '44px' : '52px',
            fontWeight: 700,
            lineHeight: 1.2,
          }}>
            {shortTitle}
          </span>
        </div>

        {/* Bottom */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#71717a', fontSize: '18px' }}>enem-pro.vercel.app</span>
          <div style={{
            background: '#6366f1',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 600,
            padding: '10px 24px',
            borderRadius: '8px',
          }}>
            Estudar grátis →
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
