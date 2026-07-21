import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '80px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '12px',
          padding: '8px 16px',
          color: 'white',
          fontSize: '18px',
          fontWeight: '600',
        }}>
          ENEM Pro
        </div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px' }}>
          ✦ Questões reais do INEP + IA
        </div>
      </div>

      <div style={{
        color: 'white',
        fontSize: '64px',
        fontWeight: '800',
        lineHeight: '1.1',
        marginBottom: '24px',
        maxWidth: '900px',
      }}>
        2.900+ questões do ENEM com explicação por IA
      </div>

      <div style={{
        color: 'rgba(199, 210, 254, 0.9)',
        fontSize: '28px',
        lineHeight: '1.4',
        marginBottom: '48px',
        maxWidth: '800px',
      }}>
        2009 a 2024 · Todas as disciplinas · IA explica cada erro em 30 segundos
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={{
          background: 'white',
          color: '#4f46e5',
          borderRadius: '16px',
          padding: '16px 32px',
          fontSize: '22px',
          fontWeight: '700',
        }}>
          10 questões/dia grátis
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          color: 'white',
          borderRadius: '16px',
          padding: '16px 32px',
          fontSize: '22px',
          fontWeight: '600',
          border: '2px solid rgba(255,255,255,0.3)',
        }}>
          Pro R$29,90/mês
        </div>
      </div>
    </div>
  )
}
