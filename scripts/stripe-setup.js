/**
 * ENEM Pro — Stripe Setup Script
 * Cria produtos e preços automaticamente no Stripe.
 *
 * USO:
 *   1. Defina a variável de ambiente: STRIPE_SECRET_KEY=sk_live_... (ou sk_test_...)
 *   2. node scripts/stripe-setup.js
 *   3. Copie os PRICE_IDs gerados e adicione no Vercel
 */

const Stripe = require('stripe')

const key = process.env.STRIPE_SECRET_KEY
if (!key) {
  console.error('STRIPE_SECRET_KEY não definida.')
  console.error('Use: STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup.js')
  process.exit(1)
}

const stripe = new Stripe(key)

async function main() {
  console.log('\n🔧 Configurando ENEM Pro no Stripe...\n')

  // 1. Criar produto
  const product = await stripe.products.create({
    name: 'ENEM Pro',
    description: 'Questões ilimitadas do ENEM (2009–2024) com explicação por IA',
    metadata: { app: 'enem-pro' },
  })
  console.log(`✅ Produto criado: ${product.id} — ${product.name}`)

  // 2. Preço mensal — R$14,90
  const monthly = await stripe.prices.create({
    product: product.id,
    unit_amount: 1490, // centavos
    currency: 'brl',
    recurring: { interval: 'month' },
    nickname: 'Pro Mensal',
    metadata: { plan: 'monthly' },
  })
  console.log(`✅ Preço mensal criado: ${monthly.id} — R$14,90/mês`)

  // 3. Preço anual — R$99
  const annual = await stripe.prices.create({
    product: product.id,
    unit_amount: 9900, // centavos
    currency: 'brl',
    recurring: { interval: 'year' },
    nickname: 'Pro Anual',
    metadata: { plan: 'annual' },
  })
  console.log(`✅ Preço anual criado: ${annual.id} — R$99/ano`)

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 ADICIONAR NO VERCEL (Settings → Environment Variables):')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log(`STRIPE_PRICE_ID_MONTHLY=${monthly.id}`)
  console.log(`STRIPE_PRICE_ID_ANNUAL=${annual.id}`)
  console.log('\n(STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET você já tem ou vai gerar)')
  console.log('\n📌 WEBHOOK:')
  console.log('  1. Acesse: https://dashboard.stripe.com/webhooks')
  console.log('  2. "+ Add endpoint"')
  console.log('  3. URL: https://enem-pro-eight.vercel.app/api/webhook')
  console.log('  4. Eventos: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted')
  console.log('  5. Copie o "Signing secret" → STRIPE_WEBHOOK_SECRET no Vercel\n')
}

main().catch((err) => {
  console.error('Erro:', err.message)
  process.exit(1)
})
