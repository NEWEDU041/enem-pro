'use client'

const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|!\[[^\]]*\]\([^)]+\))/g

export default function QuestionText({ text }: { text: string }) {
  return (
    <div>
      {text.split('\n').map((line, li) => (
        <p key={li} className={li > 0 ? 'mt-2 text-sm text-zinc-700 leading-relaxed' : 'text-sm text-zinc-700 leading-relaxed'}>
          {line.split(TOKEN).map((part, i) => {
            if (/^\*\*(.+)\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>
            if (/^\*(.+)\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>
            const img = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
            if (img) {
              const src = img[2]
              if (src.includes('broken-image')) return null
              return (
                <span key={i} className="block my-2">
                  <img
                    src={src}
                    alt={img[1] || 'imagem da questão'}
                    className="max-w-full rounded border border-zinc-100"
                    onError={(e) => {
                      const el = e.currentTarget
                      el.style.display = 'none'
                      const msg = document.createElement('span')
                      msg.className = 'text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 block'
                      msg.textContent = '⚠️ Imagem não disponível. Consulte o caderno oficial do ENEM.'
                      el.parentNode?.appendChild(msg)
                    }}
                  />
                </span>
              )
            }
            return part
          })}
        </p>
      ))}
    </div>
  )
}
