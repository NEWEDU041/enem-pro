import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Como Estudar ENEM Efetivamente — Guia Completo 2026',
  description: 'Estratégia completa para estudar ENEM: cronograma de 12 semanas, disciplinas prioritárias, questões por nível, e plano de ação mês a mês.',
}

export default function HowToStudyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
        <nav className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
          <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900">Voltar</Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-zinc-900 mb-4">Como Estudar ENEM Efetivamente</h1>
        <p className="text-lg text-zinc-600 mb-12">Guia completo: cronograma, estratégia por disciplina, e plano de ação mês a mês para aprovação na federal.</p>

        <section className="mb-16 bg-indigo-50 rounded-2xl p-8 border border-indigo-200">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">📅 Cronograma de 12 Semanas</h2>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border-l-4 border-indigo-600">
              <h3 className="font-bold text-zinc-900 mb-2">Semanas 1-3: Fundação</h3>
              <p className="text-sm text-zinc-700">Revisar conceitos básicos de cada disciplina. Fazer questões fáceis (nível 1-3). Meta: 10 questões/dia.</p>
            </div>
            <div className="bg-white rounded-lg p-4 border-l-4 border-indigo-600">
              <h3 className="font-bold text-zinc-900 mb-2">Semanas 4-7: Intensidade</h3>
              <p className="text-sm text-zinc-700">Questões médias e difíceis. Fazer simulados semanais. Meta: 20 questões/dia + 1 simulado 45 questões.</p>
            </div>
            <div className="bg-white rounded-lg p-4 border-l-4 border-indigo-600">
              <h3 className="font-bold text-zinc-900 mb-2">Semanas 8-10: Especialização</h3>
              <p className="text-sm text-zinc-700">Focar nas disciplinas com menor desempenho. Revisão de conceitos. Meta: 25 questões/dia.</p>
            </div>
            <div className="bg-white rounded-lg p-4 border-l-4 border-indigo-600">
              <h3 className="font-bold text-zinc-900 mb-2">Semanas 11-12: Final</h3>
              <p className="text-sm text-zinc-700">Simulado completo a cada 2 dias. Revisar erros. Meta: nota estimada 700+.</p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">🎯 Estratégia por Disciplina</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-50 rounded-lg p-6 border border-zinc-200">
              <h3 className="font-bold text-zinc-900 mb-3">Matemática</h3>
              <ul className="space-y-2 text-sm text-zinc-700">
                <li>• Semanas 1-3: Álgebra + Funções</li>
                <li>• Semanas 4-6: Geometria + Trigonometria</li>
                <li>• Semanas 7-12: Revisão + testes</li>
                <li>• Dica: 5 questões/dia focadas</li>
              </ul>
            </div>
            <div className="bg-zinc-50 rounded-lg p-6 border border-zinc-200">
              <h3 className="font-bold text-zinc-900 mb-3">Português</h3>
              <ul className="space-y-2 text-sm text-zinc-700">
                <li>• Semanas 1-4: Leitura + interpretação</li>
                <li>• Semanas 5-8: Gramática + figuras</li>
                <li>• Semanas 9-12: Simulados + redação</li>
                <li>• Dica: 3 questões/dia + 1 redação</li>
              </ul>
            </div>
            <div className="bg-zinc-50 rounded-lg p-6 border border-zinc-200">
              <h3 className="font-bold text-zinc-900 mb-3">História</h3>
              <ul className="space-y-2 text-sm text-zinc-700">
                <li>• Semanas 1-3: Brasil colonial + império</li>
                <li>• Semanas 4-7: República + século XX</li>
                <li>• Semanas 8-12: Mundo + contemporâneo</li>
                <li>• Dica: 3 questões/dia + resumos</li>
              </ul>
            </div>
            <div className="bg-zinc-50 rounded-lg p-6 border border-zinc-200">
              <h3 className="font-bold text-zinc-900 mb-3">Biologia</h3>
              <ul className="space-y-2 text-sm text-zinc-700">
                <li>• Semanas 1-4: Genética + evolução</li>
                <li>• Semanas 5-8: Ecologia + corpo humano</li>
                <li>• Semanas 9-12: Integração + testes</li>
                <li>• Dica: 4 questões/dia + diagramas</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-16 bg-zinc-50 rounded-2xl p-8 border border-zinc-200">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">📊 Níveis de Dificuldade</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-zinc-900 mb-2">Nível 1 (Fácil) — Semanas 1-3</h3>
              <p className="text-sm text-zinc-700 mb-3">Conceitos básicos, aplicação direta. Objetivo: ganhar confiança.</p>
              <Link href="/questoes?level=facil" className="text-indigo-600 hover:underline text-sm font-semibold">Fazer questões fáceis →</Link>
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 mb-2">Nível 2 (Médio) — Semanas 4-7</h3>
              <p className="text-sm text-zinc-700 mb-3">Requer interpretação e combinação de conceitos. Objetivo: dominar.</p>
              <Link href="/questoes?level=medio" className="text-indigo-600 hover:underline text-sm font-semibold">Fazer questões médias →</Link>
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 mb-2">Nível 3 (Difícil) — Semanas 8-12</h3>
              <p className="text-sm text-zinc-700 mb-3">Texto longo, pegadinha, conceitos avançados. Objetivo: maximizar nota.</p>
              <Link href="/questoes?level=dificil" className="text-indigo-600 hover:underline text-sm font-semibold">Fazer questões difíceis →</Link>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">✅ Checklist Semanal</h2>
          <div className="bg-white border-2 border-zinc-200 rounded-lg p-6">
            <ul className="space-y-3 text-sm text-zinc-700">
              <li className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" />
                <span><strong>Completei 100+ questões</strong> essa semana</span>
              </li>
              <li className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" />
                <span><strong>Revisei meus erros</strong> e entendi o conceito</span>
              </li>
              <li className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" />
                <span><strong>Fiz pelo menos 1 simulado</strong> completo</span>
              </li>
              <li className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" />
                <span><strong>Minha nota estimada</strong> subiu ou manteve</span>
              </li>
              <li className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" />
                <span><strong>Estudei todas as 7 disciplinas</strong> no mínimo</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-16 bg-green-50 rounded-2xl p-8 border border-green-200">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">🎓 Dicas de Aprovação</h2>
          <ul className="space-y-3 text-zinc-700">
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold">1.</span>
              <span><strong>Qualidade > Quantidade:</strong> 10 questões bem revisadas são melhores que 50 feitas rápido.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold">2.</span>
              <span><strong>Revisão de Erros:</strong> Cada erro deve gerar uma aula no seu caderno. Vire referência.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold">3.</span>
              <span><strong>Simulados Reais:</strong> Faça com timer, sem distrações, como se fosse o ENEM.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold">4.</span>
              <span><strong>Saúde Mental:</strong> Descanse 1 dia por semana. Sono de 7-8h é essencial.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold">5.</span>
              <span><strong>Comunidade:</strong> Estude com amigos, tire dúvidas, compartilhe estratégias.</span>
            </li>
          </ul>
        </section>

        <section className="text-center mb-16">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">Pronto para Começar?</h2>
          <p className="text-zinc-600 mb-6">2.900+ questões com explicação por IA esperando por você. Começe com o plano gratuito — 10 questões por dia.</p>
          <Link href="/auth/register" className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700">
            Começar Grátis Agora →
          </Link>
        </section>
      </main>

      <footer className="bg-zinc-900 text-zinc-400 text-sm py-8 px-6 text-center mt-16 border-t border-zinc-800">
        <p>© 2026 ENEM Pro — Questões reais do ENEM com explicação por IA</p>
      </footer>
    </div>
  )
}
