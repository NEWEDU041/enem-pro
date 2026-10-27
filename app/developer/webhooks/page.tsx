'use client'

import React, { useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { Send, Copy, AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface WebhookTestResult {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  latency_ms: number
  timestamp: string
}

const WEBHOOK_EVENTS = [
  {
    name: 'explanation.generated',
    description: 'Triggered when an AI explanation is generated',
    payload: {
      event: 'explanation.generated',
      timestamp: new Date().toISOString(),
      data: {
        question_id: 'q_2024_001',
        explanation:
          'This question tests knowledge of photosynthesis...',
        cached: false,
        latency_ms: 1250,
      },
    },
  },
  {
    name: 'essay.corrected',
    description: 'Triggered when an essay is corrected',
    payload: {
      event: 'essay.corrected',
      timestamp: new Date().toISOString(),
      data: {
        essay_id: 'essay_123',
        score: 8.5,
        feedback: 'Excellent argumentation...',
        suggestions: ['Expand on examples', 'Improve transitions'],
      },
    },
  },
  {
    name: 'simulation.completed',
    description: 'Triggered when a simulation is completed',
    payload: {
      event: 'simulation.completed',
      timestamp: new Date().toISOString(),
      data: {
        simulation_id: 'sim_456',
        score: 720,
        correct_answers: 130,
        total_answers: 180,
        discipline_breakdown: {
          'Matemática': { correct: 40, total: 45 },
          'Português': { correct: 38, total: 45 },
        },
      },
    },
  },
]

export default function WebhookTestPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [webhookUrl, setWebhookUrl] = useState('')
  const [selectedEvent, setSelectedEvent] = useState(WEBHOOK_EVENTS[0].name)
  const [customPayload, setCustomPayload] = useState(
    JSON.stringify(WEBHOOK_EVENTS[0].payload, null, 2)
  )
  const [testResult, setTestResult] = useState<WebhookTestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/developer/webhooks')
    }
  }, [user, isLoading, router])

  const selectedEventData = WEBHOOK_EVENTS.find((e) => e.name === selectedEvent)

  const sendWebhookTest = async () => {
    if (!webhookUrl.trim()) {
      alert('Please enter a webhook URL')
      return
    }

    try {
      setLoading(true)
      const payload = JSON.parse(customPayload)

      const startTime = performance.now()
      const response = await fetch('/api/developer/webhook-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhook_url: webhookUrl,
          payload,
        }),
      })

      const latency = Math.round(performance.now() - startTime)
      const body = await response.text()

      setTestResult({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body,
        latency_ms: latency,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      setTestResult({
        status: 0,
        statusText: 'Error',
        headers: {},
        body: String(error),
        latency_ms: 0,
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  const copyPayload = () => {
    navigator.clipboard.writeText(customPayload)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const isSuccessResponse = testResult && testResult.status >= 200 && testResult.status < 300

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-950/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-white">Webhook Testing</h1>
          <p className="text-slate-300 mt-1">Test webhook endpoints with sample events</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Webhook URL */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Webhook Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/webhooks/enem"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Your endpoint must accept POST requests and respond within 30 seconds
                  </p>
                </div>
              </div>
            </div>

            {/* Event Selection */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Select Event</h2>
              <div className="space-y-3">
                {WEBHOOK_EVENTS.map((event) => (
                  <label key={event.name} className="flex items-start gap-3 p-3 cursor-pointer rounded-lg hover:bg-slate-700 transition">
                    <input
                      type="radio"
                      name="event"
                      value={event.name}
                      checked={selectedEvent === event.name}
                      onChange={(e) => {
                        setSelectedEvent(e.target.value)
                        const selected = WEBHOOK_EVENTS.find((ev) => ev.name === e.target.value)
                        if (selected) {
                          setCustomPayload(JSON.stringify(selected.payload, null, 2))
                        }
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-white">{event.name}</p>
                      <p className="text-sm text-slate-400">{event.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Payload Editor */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Payload (JSON)</h2>
                <button
                  onClick={copyPayload}
                  className="px-3 py-1 rounded text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 transition flex items-center gap-2"
                >
                  <Copy className={`w-4 h-4 ${copied ? 'text-green-400' : ''}`} />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <textarea
                value={customPayload}
                onChange={(e) => setCustomPayload(e.target.value)}
                className="w-full h-64 px-4 py-2 bg-slate-700 border border-slate-600 rounded font-mono text-sm text-slate-300"
              />
            </div>

            {/* Send Button */}
            <button
              onClick={sendWebhookTest}
              disabled={loading || !webhookUrl.trim()}
              className="w-full px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium transition flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              {loading ? 'Sending...' : 'Send Test Event'}
            </button>
          </div>

          {/* Test Results */}
          <div className="lg:col-span-1">
            {testResult && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 sticky top-8">
                <h2 className="text-lg font-semibold text-white mb-4">Response</h2>

                {/* Status */}
                <div className="mb-4 p-3 rounded-lg bg-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    {isSuccessResponse ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className={`font-mono text-sm font-semibold ${
                      isSuccessResponse ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {testResult.status} {testResult.statusText}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-4 h-4" />
                    {testResult.latency_ms}ms
                  </div>
                </div>

                {/* Headers */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Response Headers</h3>
                  <div className="text-xs space-y-1 bg-slate-900 p-2 rounded max-h-32 overflow-y-auto">
                    {Object.entries(testResult.headers).map(([key, value]) => (
                      <div key={key} className="text-slate-400">
                        <span className="text-blue-400">{key}:</span> {String(value).substring(0, 30)}...
                      </div>
                    ))}
                  </div>
                </div>

                {/* Body */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Response Body</h3>
                  <pre className="text-xs bg-slate-900 p-2 rounded overflow-x-auto max-h-40 text-slate-300">
                    {testResult.body.substring(0, 500)}
                  </pre>
                </div>

                {/* Timestamp */}
                <p className="text-xs text-slate-500 mt-4 text-center">
                  {new Date(testResult.timestamp).toLocaleTimeString()}
                </p>
              </div>
            )}

            {!testResult && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
                <p className="text-slate-400">No test results yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
