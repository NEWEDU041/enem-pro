import { NextRequest, NextResponse } from 'next/server'
import { generateOpenAPISchema } from '@/lib/openapi-schema'

export const dynamic = 'force-static'
export const revalidate = 3600 // Cache for 1 hour

export async function GET() {
  const schema = generateOpenAPISchema()
  return NextResponse.json(schema, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
