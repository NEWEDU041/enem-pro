import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site-config'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ discipline: string }>
}): Promise<Metadata> {
  const { discipline } = await params
  return {
    alternates: { canonical: `${SITE_URL}/questoes/${discipline}` },
  }
}

export default function QuestoesDisciplineLayout({ children }: { children: React.ReactNode }) {
  return children
}
