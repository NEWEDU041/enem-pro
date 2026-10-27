'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/auth-client'
import Link from 'next/link'
import { ArrowRight, Code, Key, Zap } from 'lucide-react'

const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => <div className="p-8 text-center">Loading Swagger UI...</div>,
})

import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocsPage() {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-950/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">ENEM Pro API</h1>
              <p className="text-slate-300 mt-1">
                Complete API documentation with interactive testing
              </p>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    href="/developer/dashboard"
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
                  >
                    <Key className="inline w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                  <Link
                    href="/api/auth/logout"
                    className="px-4 py-2 rounded-lg text-slate-300 hover:text-white transition"
                  >
                    Logout
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 rounded-lg text-slate-300 hover:text-white transition"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
                  >
                    Sign Up
                    <ArrowRight className="inline w-4 h-4 ml-2" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/api/docs#/Questions"
            className="p-4 rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-500 transition group"
          >
            <div className="flex items-center gap-3 mb-2">
              <Code className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-white">Questions</span>
            </div>
            <p className="text-sm text-slate-400">Retrieve ENEM questions with filtering</p>
          </a>
          <a
            href="/api/docs#/Explanations"
            className="p-4 rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-500 transition group"
          >
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-purple-400" />
              <span className="font-semibold text-white">Explanations</span>
            </div>
            <p className="text-sm text-slate-400">AI-powered question explanations</p>
          </a>
          <a
            href="/developer/webhooks"
            className="p-4 rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-500 transition group"
          >
            <div className="flex items-center gap-3 mb-2">
              <Key className="w-5 h-5 text-green-400" />
              <span className="font-semibold text-white">Webhooks</span>
            </div>
            <p className="text-sm text-slate-400">Test and manage webhooks</p>
          </a>
        </div>
      </div>

      {/* Swagger UI */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg overflow-hidden shadow-lg">
          <SwaggerUI url="/api/openapi.json" />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 bg-slate-950/50 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-white mb-4">Documentation</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/docs/api/getting-started" className="text-slate-400 hover:text-white">
                    Getting Started
                  </Link>
                </li>
                <li>
                  <Link href="/docs/api/authentication" className="text-slate-400 hover:text-white">
                    Authentication
                  </Link>
                </li>
                <li>
                  <Link href="/docs/api/rate-limits" className="text-slate-400 hover:text-white">
                    Rate Limits
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">SDKs & Tools</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/docs/sdk/javascript" className="text-slate-400 hover:text-white">
                    JavaScript SDK
                  </Link>
                </li>
                <li>
                  <Link href="/docs/sdk/python" className="text-slate-400 hover:text-white">
                    Python SDK
                  </Link>
                </li>
                <li>
                  <Link href="/docs/api/curl" className="text-slate-400 hover:text-white">
                    cURL Examples
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Developer</h3>
              <ul className="space-y-2">
                <li>
                  {user ? (
                    <Link href="/developer/dashboard" className="text-slate-400 hover:text-white">
                      API Keys
                    </Link>
                  ) : (
                    <Link href="/login" className="text-slate-400 hover:text-white">
                      Get API Key
                    </Link>
                  )}
                </li>
                <li>
                  <Link href="/developer/webhooks" className="text-slate-400 hover:text-white">
                    Webhooks
                  </Link>
                </li>
                <li>
                  <Link href="/developer/test" className="text-slate-400 hover:text-white">
                    Test Console
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <a href="mailto:api@enem-pro.com" className="text-slate-400 hover:text-white">
                    Email Support
                  </a>
                </li>
                <li>
                  <Link href="/docs/faq" className="text-slate-400 hover:text-white">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400">
            <p>© 2024 ENEM Pro. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
