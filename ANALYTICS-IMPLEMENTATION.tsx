
// Adicione isto em: app/components/Analytics.tsx

'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

export function Analytics() {
  const pathname = usePathname()

  useEffect(() => {
    // Script do Google Analytics
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX'
    document.head.appendChild(script)

    window.dataLayer = window.dataLayer || []
    function gtag(...args: any[]) {
      window.dataLayer.push(arguments)
    }
    gtag('js', new Date())
    gtag('config', 'G-XXXXXXXX', {
      page_path: pathname,
      send_page_view: true
    })
  }, [pathname])

  useEffect(() => {
    // Rastrear scroll depth
    let scrollPercent = 0
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      scrollPercent = docHeight ? (scrollTop / docHeight) * 100 : 0

      if (scrollPercent > 50 && !document.body.dataset.scroll50) {
        document.body.dataset.scroll50 = 'true'
        window.gtag?.('event', 'blog_engagement', {
          engagement_type: 'scroll_50',
          page: pathname
        })
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [pathname])

  return null
}
