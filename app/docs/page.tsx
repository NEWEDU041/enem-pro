'use client'

import Link from 'next/link'
import { ArrowRight, BookOpen, Code, Zap, Key, AlertCircle } from 'lucide-react'

const sections = [
  {
    title: 'Getting Started',
    description: 'Learn the basics of the ENEM Pro API',
    icon: BookOpen,
    items: [
      { title: 'Introduction', href: '/docs/api/getting-started' },
      { title: 'Authentication', href: '/docs/api/authentication' },
      { title: 'Rate Limits & Quotas', href: '/docs/api/rate-limits' },
      { title: 'Errors & Status Codes', href: '/docs/api/errors' },
    ],
  },
  {
    title: 'SDKs & Tools',
    description: 'Client libraries and code examples',
    icon: Code,
    items: [
      { title: 'JavaScript SDK', href: '/docs/sdk/javascript' },
      { title: 'Python SDK', href: '/docs/sdk/python' },
      { title: 'cURL Examples', href: '/docs/api/curl-examples' },
      { title: 'REST Client Integration', href: '/docs/sdk/rest-clients' },
    ],
  },
  {
    title: 'API Reference',
    description: 'Complete endpoint documentation',
    icon: Zap,
    items: [
      { title: 'Questions', href: '/docs/api/endpoints/questions' },
      { title: 'Explanations', href: '/docs/api/endpoints/explanations' },
      { title: 'Essays', href: '/docs/api/endpoints/essays' },
      { title: 'Simulations', href: '/docs/api/endpoints/simulations' },
    ],
  },
  {
    title: 'Developer Tools',
    description: 'Manage keys, test webhooks, and monitor usage',
    icon: Key,
    items: [
      { title: 'API Key Management', href: '/developer/dashboard' },
      { title: 'Webhook Testing', href: '/developer/webhooks' },
      { title: 'Interactive API Explorer', href: '/api/docs' },
      { title: 'Usage Analytics', href: '/developer/analytics' },
    ],
  },
  {
    title: 'Best Practices',
    description: 'Optimize your integration',
    icon: AlertCircle,
    items: [
      { title: 'Caching Strategies', href: '/docs/guides/caching' },
      { title: 'Error Handling', href: '/docs/guides/error-handling' },
      { title: 'Performance Optimization', href: '/docs/guides/performance' },
      { title: 'Security', href: '/docs/guides/security' },
    ],
  },
]

export default function DocumentationIndex() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-950/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-white mb-4">API Documentation</h1>
          <p className="text-lg text-slate-300 max-w-2xl">
            Complete guide to integrating with ENEM Pro API. From authentication to advanced features.
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Link
            href="/api/docs"
            className="p-4 rounded-lg bg-blue-900/20 border border-blue-700 hover:border-blue-500 transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Interactive API</p>
                <p className="text-sm text-slate-300">Test endpoints live</p>
              </div>
              <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition" />
            </div>
          </Link>
          <Link
            href="/developer/dashboard"
            className="p-4 rounded-lg bg-green-900/20 border border-green-700 hover:border-green-500 transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Developer Dashboard</p>
                <p className="text-sm text-slate-300">Manage API keys</p>
              </div>
              <ArrowRight className="w-5 h-5 text-green-400 group-hover:translate-x-1 transition" />
            </div>
          </Link>
          <Link
            href="/developer/webhooks"
            className="p-4 rounded-lg bg-purple-900/20 border border-purple-700 hover:border-purple-500 transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Webhook Tester</p>
                <p className="text-sm text-slate-300">Test webhook events</p>
              </div>
              <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        </div>
      </div>

      {/* Documentation Sections */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-12">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <div key={section.title}>
              <div className="flex items-center gap-3 mb-6">
                <Icon className="w-6 h-6 text-blue-400" />
                <div>
                  <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                  <p className="text-slate-400">{section.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="p-4 rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-500 transition group"
                  >
                    <p className="font-medium text-white group-hover:text-blue-400 transition flex items-center gap-2">
                      {item.title}
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition -translate-x-2 group-hover:translate-x-0" />
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 bg-slate-950/50 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400">
          <p>Need help? Email us at api@enem-pro.com or check our FAQ</p>
        </div>
      </div>
    </div>
  )
}
