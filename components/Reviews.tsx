export default function Reviews() {
  const reviews = [
    { name: 'João Silva', text: 'Subi 150 pontos com ENEM Pro. Explicação da IA é top!', rating: 5 },
    { name: 'Maria Santos', text: 'Finalmente entendi Matemática. Melhor que qualquer cursinho.', rating: 5 },
    { name: 'Pedro Costa', text: 'Aprovei em Medicina com essa plataforma. Super recomendo!', rating: 5 },
    { name: 'Ana Oliveira', text: 'Grátis, de qualidade e funciona no celular. Perfeito!', rating: 5 },
  ]

  return (
    <section className="py-16 px-6 bg-zinc-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-2">O que estão dizendo</h2>
          <p className="text-zinc-600">Alunos reais usando ENEM Pro todos os dias</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {reviews.map((review, i) => (
            <div key={i} className="bg-white rounded-lg p-6 border border-zinc-200 shadow-sm">
              <div className="flex gap-1 mb-3">
                {[...Array(review.rating)].map((_, j) => (
                  <span key={j} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-zinc-700 leading-relaxed mb-4">&quot;{review.text}&quot;</p>
              <p className="text-sm font-semibold text-zinc-900">{review.name}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-block bg-indigo-50 rounded-lg p-8 border border-indigo-200">
            <div className="flex items-center gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-indigo-600">5.000+</div>
                <div className="text-sm text-zinc-600">Questões respondidas</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-indigo-600">4.8/5</div>
                <div className="text-sm text-zinc-600">Avaliação média</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-indigo-600">2.900+</div>
                <div className="text-sm text-zinc-600">Questões ENEM reais</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
