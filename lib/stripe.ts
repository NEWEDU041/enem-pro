import Stripe from 'stripe'
import { cleanEnv } from './utils'

let _stripe: Stripe | null = null

/** Returns a singleton Stripe client, or null if STRIPE_SECRET_KEY is not configured. */
export function getStripe(): Stripe | null {
  const key = cleanEnv(process.env.STRIPE_SECRET_KEY)
  if (!key) return null
  if (!_stripe) _stripe = new Stripe(key)
  return _stripe
}
