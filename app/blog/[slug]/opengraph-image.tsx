import { ImageResponse } from 'next/og'
import { getPostMetaLight } from '@/lib/blog-index'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const CATEGORY_ACCENT: Record<string, string> = {
  'Gabarito':      '#059669',
  'Questões':      '#4f46e5',
  'Redação':       '#7c3aed',
  'Universidades': '#d97706',
  'Por Matéria':   '#0284c7',
  'Estratégias':   '#e11d48',
  'Como Funciona': '#52525b',
  'Planejamento':  '#0d9488',
  'Comparativos':  '#ea580c',
}

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostMetaLight(slug)

  const title = post?.title ?? 'Blog ENEM Pro'
  const category = post?.category ?? 'ENEM Pro'
  const accent = CATEGORY_ACCENT[category] ?? '#4f46e5'
  const shortTitle = title.length > 75 ? title.slice(0, 72) + '…' : title

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: '#09090b',
          padding: '0',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Accent bar top */}
        <div style={{ width: '100%', height: '6px', background: accent, flexShrink: 0 }} />

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, padding: '60px 80px 64px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              background: '#4f46e5',
              borderRadius: '10px',
              padding: '8px 22px',
              color: 'white',
              fontSize: '20px',
              fontWeight: '700',
            }}>
              ENEM Pro
            </div>
            <div style={{
              background: accent,
              borderRadius: '8px',
              padding: '7px 18px',
              color: 'white',
              fontSize: '17px',
              fontWeight: '600',
            }}>
              {category}
            </div>
          </div>

          {/* Title */}
          <div style={{
            color: '#fafafa',
            fontSize: shortTitle.length > 50 ? '50px' : '62px',
            fontWeight: '800',
            lineHeight: '1.18',
            letterSpacing: '-0.5px',
            maxWidth: '980px',
          }}>
            {shortTitle}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#52525b', fontSize: '19px' }}>questoesenem.pro</span>
            <div style={{
              background: accent,
              color: '#fff',
              fontSize: '18px',
              fontWeight: '600',
              padding: '12px 28px',
              borderRadius: '10px',
            }}>
              Ler artigo →
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
