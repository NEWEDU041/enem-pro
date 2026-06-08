import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const VALID_SIZES = [192, 512]

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeStr } = await params
  const size = parseInt(sizeStr, 10)

  if (!VALID_SIZES.includes(size)) {
    return new Response('Not Found', { status: 404 })
  }

  const fontSize = Math.round(size * 0.35)
  const radius = Math.round(size * 0.22)

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          borderRadius: radius,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <span
          style={{
            color: '#ffffff',
            fontSize: fontSize,
            fontWeight: 800,
            letterSpacing: '-2px',
            lineHeight: 1,
          }}
        >
          EP
        </span>
        <span
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: Math.round(size * 0.09),
            fontWeight: 600,
            letterSpacing: '1px',
            marginTop: Math.round(size * 0.04),
          }}
        >
          ENEM PRO
        </span>
      </div>
    ),
    { width: size, height: size }
  )
}
