import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ ENEM — Dúvidas Frequentes Respondidas',
  description: 'Respostas para as perguntas mais comuns sobre ENEM: como funciona, quanto custa, quando é a prova, como é a nota.',
}

const faqs = [
  {
    q: 'Quantas questões tem o ENEM?',
    a: 'O ENEM tem 180 questões ao todo: 45 de Linguagens, 45 de Matemática, 45 de Ciências Humanas, 45 de Ciências da Natureza, mais 1 redação. Prova tem 5h30min de duração.',
  },
  {
    q: 'Como é calculada a nota do ENEM?',
    a: 'O ENEM usa a TRI (Teoria da Resposta ao Item). Cada questão vale pontos diferentes baseado na dificuldade. Nota varia de 0-1000 por área. Redação também é pontuada de 0-1000.',
  },
  {
    q: 'Qual é a nota de corte para Medicina?',
    a: 'Varia por ano e universidade. Em 2024, foi ~750-800 em universidades federais. USP e UFRJ pedem ~800+. Confira no site da faculdade que quer.',
  },
  {
    q: 'Quantos dias faltam para o ENEM 2026?',
    a: 'O ENEM 2026 acontece em novembro. Verifique a data exata no site do INEP (inep.gov.br). Geralmente é primeira semana de novembro.',
  },
  {
    q: 'Posso fazer o ENEM mais de uma vez?',
    a: 'Sim! Você pode fazer quantas vezes quiser. Pode usar o melhor resultado para se inscrever em universidades. Não há limite de tentativas.',
  },
  {
    q: 'Qual é o valor da inscrição do ENEM?',
    a: 'O valor da inscrição varia. Em 2024 foi R$ 85. Há isenção para quem precisa (baixa renda, enem anterior). Confira edital oficial do ano.',
  },
  {
    q: 'Preciso de diploma de Ensino Médio para fazer ENEM?',
    a: 'Não obrigatoriamente para fazer a prova, mas para usar o resultado em universidades federais sim. Você precisa ter concluído o EM até a data de matrícula.',
  },
  {
    q: 'Como funciona o ENEM Pro?',
    a: 'ENEM Pro é uma plataforma com 2.900+ questões reais do INEP (2009-2024). Responda qualquer questão → IA explica em 30 segundos. Grátis 10/dia, ou Pro ilimitado R$29,90/mês.',
  },
  {
    q: 'As questões do ENEM Pro são de verdade?',
    a: 'Sim! Todas as 2.900+ questões são REAIS do gabarito oficial do INEP. Não são exercícios genéricos. Você estuda com questões que REALMENTE cairam.',
  },
  {
    q: 'Posso usar ENEM Pro no celular?',
    a: 'Sim! ENEM Pro funciona em qualquer dispositivo (celular, tablet, PC). É otimizado para mobile. Você estuda onde quiser, quando quiser.',
  },
  {
    q: 'A explicação por IA é confiável?',
    a: 'A IA foi treinada especificamente para educação. Ela explica não só a resposta, mas o CONCEITO por trás. Muito mais útil que só o gabarito.',
  },
  {
    q: 'Qual é a melhor estratégia para estudar ENEM?',
    a: 'Comece pela fundação (conceitos básicos), depois questões fáceis, depois médias e difíceis. Faça simulados semanais. Qualidade > quantidade. Veja nosso guia completo em /como-estudar-enem',
  },
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
        <nav className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">ENEM Pro</Link>
          <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900">Voltar</Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-zinc-900 mb-4">Dúvidas Frequentes sobre ENEM</h1>
        <p className="text-lg text-zinc-600 mb-12">Respostas para as perguntas mais comuns. Se sua dúvida não estiver aqui, entre em contato conosco.</p>

        <div className="space-y-8">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-zinc-50 rounded-lg p-6 border border-zinc-200">
              <h2 className="text-lg font-bold text-zinc-900 mb-3">{faq.q}</h2>
              <p className="text-zinc-700 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        <section className="mt-16 bg-indigo-50 rounded-2xl p-8 border border-indigo-200 text-center">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">Sua dúvida não está aqui?</h2>
          <p className="text-zinc-600 mb-6">Acesse nosso guia completo sobre como estudar ENEM, ou comece a praticar.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/como-estudar-enem" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-700">
              Ver Guia Completo
            </Link>
            <Link href="/auth/register" className="bg-white text-indigo-600 px-6 py-2.5 rounded-lg font-semibold border border-indigo-600 hover:bg-indigo-50">
              Começar a Estudar
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-zinc-900 text-zinc-400 text-sm py-8 px-6 text-center mt-16 border-t border-zinc-800">
        <p>© 2026 ENEM Pro — Questões reais do ENEM com explicação por IA</p>
      </footer>
    </div>
  )
}
