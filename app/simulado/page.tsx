import SimuladoClient from './SimuladoClient'

export default function SimuladoPage() {
  return (
    <>
      <div className="sr-only">
        <h1>Simulado ENEM 2026 Grátis — Questões Reais do INEP</h1>
        <p>
          Faça um simulado do ENEM com questões reais do INEP de 2009 a 2024. Escolha o ano, a
          disciplina e a quantidade de questões, responda com cronômetro e receba sua nota
          estimada com base na curva TRI ao final. Grátis, com plano Pro para questões
          ilimitadas.
        </p>
      </div>
      <SimuladoClient />
    </>
  )
}
