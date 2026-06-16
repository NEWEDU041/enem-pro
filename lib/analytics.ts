declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  // GA4
  if (window.gtag) window.gtag('event', name, params)
  // Meta Pixel custom events
  if (window.fbq) window.fbq('trackCustom', name, params)
}

export function trackPurchase(value: number, currency = 'BRL', plan: string) {
  if (typeof window === 'undefined') return
  if (window.gtag) {
    window.gtag('event', 'purchase', {
      currency,
      value,
      items: [{ item_id: plan, item_name: `ENEM Pro ${plan}`, price: value }],
    })
  }
  if (window.fbq) {
    window.fbq('track', 'Purchase', { currency, value })
  }
}

export function trackBeginCheckout(plan: string, value: number) {
  if (typeof window === 'undefined') return
  if (window.gtag) window.gtag('event', 'begin_checkout', { currency: 'BRL', value, items: [{ item_id: plan, item_name: `ENEM Pro ${plan}` }] })
  if (window.fbq) window.fbq('track', 'InitiateCheckout', { value, currency: 'BRL' })
}

export function trackSignUp() {
  if (typeof window === 'undefined') return
  if (window.gtag) window.gtag('event', 'sign_up', { method: 'email' })
  if (window.fbq) window.fbq('track', 'CompleteRegistration')
}

export function trackPaywallHit(questionsUsed: number) {
  if (typeof window === 'undefined') return
  if (window.gtag) window.gtag('event', 'paywall_hit', { questions_used: questionsUsed })
  if (window.fbq) window.fbq('trackCustom', 'PaywallHit', { questions_used: questionsUsed })
}
