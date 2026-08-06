import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Newsletter ENEM Pro — Questão do Dia + Dicas',
  description: 'Receba uma questão ENEM por dia + dicas de estudo. Grátis, sem spam.',
}

export default function NewsletterPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
        <nav className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
          <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900">Voltar</Link>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-zinc-900 mb-4">Questão do Dia</h1>
          <p className="text-lg text-zinc-600">Uma questão ENEM real + dica por email. Grátis.</p>
        </div>

        <div className="bg-indigo-50 rounded-2xl p-8 border border-indigo-200 mb-12">
          <h2 className="text-xl font-bold text-zinc-900 mb-4">📧 O que você vai receber</h2>
          <ul className="space-y-3 text-zinc-700">
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 mt-1">✓</span>
              <span><strong>Questão do dia:</strong> Uma questão REAL do INEP (2009-2024)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 mt-1">✓</span>
              <span><strong>Dica de estudo:</strong> Como resolver aquele tipo de questão</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 mt-1">✓</span>
              <span><strong>Link direto:</strong> Ver a questão no site com explicação de IA</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 mt-1">✓</span>
              <span><strong>Sem spam:</strong> Apenas 1 email por dia, sem propagandas</span>
            </li>
          </ul>
        </div>

        <form className="bg-white border-2 border-indigo-200 rounded-2xl p-8 mb-8">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-zinc-900 mb-2">Seu melhor email</label>
            <input
              type="email"
              placeholder="seu@email.com"
              className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
            Me inscrever na newsletter
          </button>

          <p className="text-xs text-zinc-500 text-center mt-4">
            Sem spam. Cancele quando quiser.
          </p>
        </form>

        <div className="bg-zinc-50 rounded-lg p-6 border border-zinc-200">
          <h3 className="font-bold text-zinc-900 mb-3">Exemplo do que você vai receber:</h3>
          <div className="bg-white rounded p-4 border border-zinc-200 text-sm text-zinc-700 space-y-3">
            <p className="font-semibold">📩 Questão do Dia: Matemática</p>
            <p>Oi João!</p>
            <p>Hoje temos uma questão clássica de Funções (cai MUITO em ENEM):</p>
            <p className="bg-zinc-50 p-3 rounded italic">
              &quot;Se f(x) = 2x + 3, qual é o valor de f(5)?&quot;
            </p>
            <p><strong>Dica:</strong> Quando vir f(x) = ..., significa que x é a variável. Só substituir o número no lugar de x.</p>
            <p><strong>Resposta e explicação:</strong> <a href="#" className="text-indigo-600 hover:underline">https://questoesenem.pro/questoes/...</a></p>
            <p className="text-xs text-zinc-500 border-t pt-3">Quer mais? Estude 10 questões grátis por dia em questoesenem.pro</p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <h3 className="text-lg font-bold text-zinc-900 mb-4">Ou estude direto no site</h3>
          <Link href="/auth/register" className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700">
            Começar grátis agora
          </Link>
        </div>
      </main>

      <footer className="bg-zinc-900 text-zinc-400 text-sm py-8 px-6 text-center mt-16 border-t border-zinc-800">
        <p>© 2026 ENEM Pro — Questões reais do ENEM com explicação por IA</p>
      </footer>
    </div>
  )
}
