import { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const CTASection = dynamic(() => import('@/components/CTASection'), { ssr: true })

export const metadata: Metadata = {
  title: 'Dicas ENEM — Do TikTok para a Sua Nota 900+',
  description: 'Viu nosso TikTok? Aqui tem mais dicas, questões grátis e simulado para você passar no ENEM. Comece agora!',
  robots: { index: true, follow: true },
}

export default function TikTokLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            ENEM Pro
          </Link>
          <div className="flex items-center gap-4">
            <a
              href="https://discord.gg/emenprof"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-600 hover:text-indigo-600 transition-colors"
            >
              Discord
            </a>
            <Link
              href="/auth/register"
              className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
          🎬 Viu nosso TikTok?
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 mb-6">
          Passou por aqui pelo TikTok? 👋
        </h1>

        <p className="text-xl text-zinc-600 mb-4">
          Ficou interessado nas dicas que postamos? Aqui você encontra:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-12">
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <div className="text-3xl mb-3">📚</div>
            <h3 className="font-bold text-zinc-900 mb-2">2,900+ Questões</h3>
            <p className="text-sm text-zinc-600">
              Todas as questões ENEM 2009-2024 com gabarito
            </p>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-bold text-zinc-900 mb-2">IA Explica</h3>
            <p className="text-sm text-zinc-600">
              Por que cada resposta está certa (Pro)
            </p>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-bold text-zinc-900 mb-2">Simulados</h3>
            <p className="text-sm text-zinc-600">
              Teste real com cronômetro e nota TRI
            </p>
          </div>
        </div>

        <p className="text-zinc-600 mb-8">
          Escolha como quer começar:
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="/questoes"
            className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-indigo-700 transition-colors text-center"
          >
            ✅ Ver Questões Grátis
          </Link>

          <Link
            href="/simulado"
            className="bg-purple-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-purple-700 transition-colors text-center"
          >
            🎯 Fazer Simulado
          </Link>

          <Link
            href="/planos"
            className="border-2 border-indigo-600 text-indigo-600 px-8 py-4 rounded-lg font-bold hover:bg-indigo-600 hover:text-white transition-colors text-center"
          >
            ⭐ Ver Plano Pro
          </Link>
        </div>
      </section>

      {/* Social Proof */}
      <section className="max-w-2xl mx-auto px-6 py-12 bg-white rounded-2xl border border-zinc-200 mb-16">
        <h2 className="text-2xl font-bold text-zinc-900 text-center mb-8">
          👥 Junte-se a 10.000+ estudantes
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-indigo-600">2.9k</div>
            <p className="text-sm text-zinc-600">Questões ENEM</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-indigo-600">90+</div>
            <p className="text-sm text-zinc-600">Lighthouse Score</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-indigo-600">16 anos</div>
            <p className="text-sm text-zinc-600">De cobertura</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-2xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-zinc-900 mb-8">
          ✨ O que você ganha aqui?
        </h2>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="text-2xl">📱</div>
            <div>
              <h3 className="font-bold text-zinc-900">Acesso 24/7</h3>
              <p className="text-zinc-600">Estude quando quiser, onde quiser (app ou web)</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="text-2xl">⚡</div>
            <div>
              <h3 className="font-bold text-zinc-900">Super rápido</h3>
              <p className="text-zinc-600">Site carrega em menos de 2 segundos (Lighthouse 95+)</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="text-2xl">🎯</div>
            <div>
              <h3 className="font-bold text-zinc-900">Foco no que cai</h3>
              <p className="text-zinc-600">Questões REAIS do ENEM, não exercícios inventados</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="text-2xl">📚</div>
            <div>
              <h3 className="font-bold text-zinc-900">Blog com dicas</h3>
              <p className="text-zinc-600">Posts sobre estratégia, técnicas e temas do ENEM</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="text-2xl">👥</div>
            <div>
              <h3 className="font-bold text-zinc-900">Comunidade ativa</h3>
              <p className="text-zinc-600">Discord com 2k+ estudantes se ajudando</p>
            </div>
          </div>
        </div>
      </section>

      {/* Discord CTA */}
      <section className="max-w-2xl mx-auto px-6 py-12 bg-indigo-50 rounded-2xl border border-indigo-200 mb-16 text-center">
        <h3 className="text-2xl font-bold text-zinc-900 mb-4">
          💬 Quer fazer parte da comunidade?
        </h3>
        <p className="text-zinc-600 mb-6">
          2.000+ estudantes já estão no Discord compartilhando dicas, resolvendo dúvidas e celebrando vitórias
        </p>
        <a
          href="https://discord.gg/emenprof"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
        >
          Entrar no Discord 🔗
        </a>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-zinc-900 mb-8">
          ❓ Perguntas frequentes
        </h2>

        <div className="space-y-4">
          <details className="bg-white rounded-lg border border-zinc-200 p-6 cursor-pointer group">
            <summary className="font-bold text-zinc-900 flex items-center gap-2">
              <span className="group-open:hidden">▶</span>
              <span className="hidden group-open:inline">▼</span>
              Quanto custa?
            </summary>
            <div className="mt-4 text-zinc-600">
              <p><strong>Grátis:</strong> 10 questões/dia + blog + simulados básicos</p>
              <p className="mt-2"><strong>Pro (R$29,90/mês):</strong> Questões ilimitadas + explicações IA completas + relatório detalhado</p>
            </div>
          </details>

          <details className="bg-white rounded-lg border border-zinc-200 p-6 cursor-pointer group">
            <summary className="font-bold text-zinc-900 flex items-center gap-2">
              <span className="group-open:hidden">▶</span>
              <span className="hidden group-open:inline">▼</span>
              As questões são reais do ENEM?
            </summary>
            <div className="mt-4 text-zinc-600">
              Sim! Todas as 2.900+ questões são oficiais do ENEM de 2009 a 2024. Não são exercícios inventados.
            </div>
          </details>

          <details className="bg-white rounded-lg border border-zinc-200 p-6 cursor-pointer group">
            <summary className="font-bold text-zinc-900 flex items-center gap-2">
              <span className="group-open:hidden">▶</span>
              <span className="hidden group-open:inline">▼</span>
              Posso cancelar quando quiser?
            </summary>
            <div className="mt-4 text-zinc-600">
              Sim! Sem compromisso. Cancele quando quiser via configurações da conta.
            </div>
          </details>
        </div>
      </section>

      {/* Final CTA */}
      <CTASection
        title="🚀 Ficou interessado?"
        description="Comece grátis agora, sem cartão de crédito"
        primaryCTA={{ text: 'Acessar Questões Grátis →', href: '/questoes' }}
        showDiscord={true}
        showNewsletter={true}
      />

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-400 py-12 px-6 mt-16">
        <div className="max-w-2xl mx-auto text-center text-sm">
          <p>© 2026 ENEM Pro — Questões reais do ENEM com explicação por IA</p>
          <p className="mt-2">
            <Link href="/sobre" className="hover:text-white">Sobre</Link>
            {' • '}
            <Link href="/planos" className="hover:text-white">Planos</Link>
            {' • '}
            <a href="https://discord.gg/emenprof" target="_blank" rel="noopener noreferrer" className="hover:text-white">Discord</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
