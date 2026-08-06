import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface CTASectionProps {
  title?: string
  description?: string
  primaryCTA?: {
    text: string
    href: string
  }
  secondaryCTA?: {
    text: string
    href: string
  }
  showDiscord?: boolean
  showNewsletter?: boolean
}

export default function CTASection({
  title = '🚀 Pronto para passar no ENEM?',
  description = 'Junte-se a 10.000+ estudantes que estão evoluindo diariamente',
  primaryCTA = { text: 'Começar Grátis →', href: '/questoes' },
  secondaryCTA = { text: 'Ver simulado', href: '/simulado' },
  showDiscord = true,
  showNewsletter = true,
}: CTASectionProps) {
  return (
    <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16 px-6 rounded-2xl">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
        <p className="text-lg opacity-95 mb-8">{description}</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            href={primaryCTA.href}
            className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            {primaryCTA.text}
            <ArrowRight size={20} />
          </Link>

          <Link
            href={secondaryCTA.href}
            className="border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-indigo-600 transition-colors"
          >
            {secondaryCTA.text}
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm opacity-90">
          {showDiscord && (
            <a
              href="https://discord.gg/emenprof"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:opacity-100 transition-opacity"
            >
              💬 Comunidade Discord
            </a>
          )}

          {showNewsletter && (
            <a
              href="#"
              onClick={() => {
                const popup = document.querySelector('[data-newsletter-popup]')
                if (popup) {
                  popup.dispatchEvent(new CustomEvent('open'))
                }
              }}
              className="flex items-center gap-2 hover:opacity-100 transition-opacity cursor-pointer"
            >
              📧 Receber dicas
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
