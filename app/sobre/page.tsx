import Link from "next/link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sobre ENEM Pro — Questões Reais com Explicação por IA",
  description: "Conheça o ENEM Pro. Uma plataforma educacional com 2.900+ questões ENEM reais (2009-2024) e explicações por IA que realmente funcionam.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
        <nav className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
          <Link href="/questoes" className="text-sm text-zinc-600 hover:text-zinc-900">Voltar</Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <section className="mb-16">
          <h1 className="text-4xl font-bold text-zinc-900 mb-4">Sobre ENEM Pro</h1>
          <p className="text-lg text-zinc-600">Uma plataforma educacional focada em resultados reais para quem quer passar na federal.</p>
        </section>

        <section className="mb-16 bg-indigo-50 rounded-2xl p-8 border border-indigo-200">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">📖 A História</h2>
          <div className="space-y-4 text-zinc-700 leading-relaxed">
            <p>ENEM Pro nasceu de uma frustração real: alunos preparando para o ENEM tinham acesso a questões antigas desorganizadas, explicações genéricas que não ensinavam, e falta de um lugar centralizado para estudar com qualidade.</p>
            <p>Então criamos: um banco com <strong>2.900+ questões ENEM reais</strong> (2009-2024), cada uma com <strong>explicação por IA</strong> que realmente ensina o conceito por trás da resposta.</p>
            <p>Não é genérico. É focado <strong>exclusivamente em ENEM</strong>, com <strong>gabarito oficial</strong>, <strong>dados reais</strong>, e <strong>explicações que funcionam</strong>.</p>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-zinc-900 mb-8">📊 Por Números</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-zinc-50 rounded-lg p-6 border border-zinc-200">
              <div className="text-3xl font-bold text-indigo-600 mb-2">2.900+</div>
              <div className="text-sm text-zinc-600">Questões ENEM</div>
            </div>
            <div className="bg-zinc-50 rounded-lg p-6 border border-zinc-200">
              <div className="text-3xl font-bold text-indigo-600 mb-2">16 Anos</div>
              <div className="text-sm text-zinc-600">2009-2024</div>
            </div>
            <div className="bg-zinc-50 rounded-lg p-6 border border-zinc-200">
              <div className="text-3xl font-bold text-indigo-600 mb-2">100%</div>
              <div className="text-sm text-zinc-600">Com Explicação</div>
            </div>
            <div className="bg-zinc-50 rounded-lg p-6 border border-zinc-200">
              <div className="text-3xl font-bold text-indigo-600 mb-2">Grátis</div>
              <div className="text-sm text-zinc-600">Para Começar</div>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">🎯 Nossa Missão</h2>
          <p className="text-lg text-zinc-700 leading-relaxed mb-6"><strong>Democratizar acesso a educação de qualidade para ENEM.</strong></p>
          <p className="text-zinc-700 leading-relaxed mb-6">Você deveria ter:</p>
          <ul className="space-y-3 text-zinc-700">
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 mt-1">✓</span>
              <span><strong>Questões reais</strong> (não exercícios fabricados)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 mt-1">✓</span>
              <span><strong>Explicações que ensinam</strong> (não só &quot;a resposta é B&quot;)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 mt-1">✓</span>
              <span><strong>Tudo organizado</strong> (por disciplina, ano, dificuldade)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 mt-1">✓</span>
              <span><strong>Acesso grátis inicial</strong> (para testar antes de pagar)</span>
            </li>
          </ul>
        </section>

        <section className="mb-16 bg-zinc-50 rounded-2xl p-8 border border-zinc-200">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">✅ Por Que Confiar</h2>
          <ul className="space-y-3 text-zinc-700">
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 font-bold">•</span>
              <span><strong>Dados oficiais:</strong> Gabarito oficial INEP</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 font-bold">•</span>
              <span><strong>Explicações reais:</strong> IA especializada em educação</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 font-bold">•</span>
              <span><strong>16 anos de cobertura:</strong> 2009-2024</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 font-bold">•</span>
              <span><strong>Organizado:</strong> 7 disciplinas, por ano</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 font-bold">•</span>
              <span><strong>Gratuito inicialmente:</strong> Comece sem pagar</span>
            </li>
          </ul>
        </section>

        <section className="text-center">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">Pronto para Começar?</h2>
          <Link href="/questoes" className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700">
            Ir para as Questões →
          </Link>
        </section>
      </main>

      <footer className="bg-zinc-900 text-zinc-400 text-sm py-8 px-6 text-center mt-16 border-t border-zinc-800">
        <p>© 2026 ENEM Pro — Questões reais do ENEM com explicação por IA</p>
      </footer>
    </div>
  )
}
