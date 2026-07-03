import { NextResponse } from 'next/server'

/**
 * Wraps an API route handler with a top-level try/catch so uncaught
 * errors return a structured 500 response with a server-side log,
 * instead of crashing the function without any trace.
 */
export function withErrorHandling<A extends unknown[]>(
  handler: (...args: A) => Promise<Response>
): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    try {
      return await handler(...args)
    } catch (e) {
      console.error('[API Error]', e)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
  }
}
