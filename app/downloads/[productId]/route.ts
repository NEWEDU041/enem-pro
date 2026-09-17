import { readFile } from 'fs/promises'
import { join } from 'path'
import { NextRequest } from 'next/server'

const PRODUCTS = {
  'formula-sheet': { filename: 'formula-sheet.pdf', contentType: 'application/pdf' },
  'practice-test': { filename: 'practice-test.pdf', contentType: 'application/pdf' },
  'essay-template': { filename: 'essay-template.pdf', contentType: 'application/pdf' },
  'study-checklist': { filename: 'study-checklist.pdf', contentType: 'application/pdf' },
}

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const product = PRODUCTS[params.productId as keyof typeof PRODUCTS]

    if (!product) {
      return new Response('Produto não encontrado', { status: 404 })
    }

    // Try to read from public/downloads
    try {
      const filePath = join(process.cwd(), 'public', 'downloads', product.filename)
      const fileBuffer = await readFile(filePath)

      return new Response(fileBuffer, {
        headers: {
          'Content-Type': product.contentType,
          'Content-Disposition': `attachment; filename="${product.filename}"`,
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        },
      })
    } catch (fileError) {
      console.error(`File not found: ${product.filename}`, fileError)

      // Return a placeholder PDF message if file not found
      return new Response(
        'O arquivo de download não está disponível no momento. Entre em contato com o suporte.',
        {
          status: 404,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        }
      )
    }
  } catch (error) {
    console.error('Download error:', error)
    return new Response('Erro ao processar o download', { status: 500 })
  }
}
