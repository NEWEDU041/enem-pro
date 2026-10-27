'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import {
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  RotateCcw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'

interface APIKey {
  id: string
  name: string
  key: string
  masked_key: string
  created_at: string
  last_used_at: string | null
  quota_remaining: number
  quota_limit: number
  status: 'active' | 'revoked'
}

interface QuotaStatus {
  tier: string
  quota_used: number
  quota_limit: number
  period: string
  reset_at: string
}

export default function DeveloperDashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [quota, setQuota] = useState<QuotaStatus | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createdKey, setCreatedKey] = useState<APIKey | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/developer/dashboard')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [keysRes, quotaRes] = await Promise.all([
        fetch('/api/developer/api-keys'),
        fetch('/api/developer/quota'),
      ])

      if (keysRes.ok) {
        const data = await keysRes.json()
        setApiKeys(data.keys)
      }

      if (quotaRes.ok) {
        const data = await quotaRes.json()
        setQuota(data)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createNewKey = async () => {
    if (!newKeyName.trim()) return

    try {
      setCreating(true)
      const res = await fetch('/api/developer/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      })

      if (res.ok) {
        const data = await res.json()
        setCreatedKey(data.key)
        setApiKeys([...apiKeys, data.key])
        setNewKeyName('')
      }
    } catch (error) {
      console.error('Failed to create key:', error)
    } finally {
      setCreating(false)
    }
  }

  const deleteKey = async (keyId: string) => {
    if (!confirm('Are you sure? This cannot be undone.')) return

    try {
      const res = await fetch(`/api/developer/api-keys/${keyId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setApiKeys(apiKeys.filter((k) => k.id !== keyId))
      }
    } catch (error) {
      console.error('Failed to delete key:', error)
    }
  }

  const rotateKey = async (keyId: string) => {
    if (!confirm('This will invalidate the current key. Continue?')) return

    try {
      const res = await fetch(`/api/developer/api-keys/${keyId}/rotate`, {
        method: 'POST',
      })

      if (res.ok) {
        const data = await res.json()
        setCreatedKey(data.key)
        setApiKeys(
          apiKeys.map((k) => (k.id === keyId ? { ...k, key: data.key.key, masked_key: data.key.masked_key } : k))
        )
      }
    } catch (error) {
      console.error('Failed to rotate key:', error)
    }
  }

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text)
    setCopied(keyId)
    setTimeout(() => setCopied(null), 2000)
  }

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId)
    } else {
      newVisible.add(keyId)
    }
    setVisibleKeys(newVisible)
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const quotaPercentage = quota ? (quota.quota_used / quota.quota_limit) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-950/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-white">Developer Dashboard</h1>
          <p className="text-slate-300 mt-1">Manage your API keys and quota</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Quota Status */}
        {quota && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Usage & Quota</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-300">
                    {quota.quota_used.toLocaleString()} / {quota.quota_limit.toLocaleString()} requests
                  </span>
                  <span className="text-slate-400 text-sm">
                    {quota.tier} tier • Resets {new Date(quota.reset_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      quotaPercentage > 80 ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(quotaPercentage, 100)}%` }}
                  />
                </div>
              </div>
              {quotaPercentage > 80 && (
                <div className="flex items-start gap-3 p-3 bg-red-900/20 border border-red-700 rounded">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-300">
                    You're using {quotaPercentage.toFixed(0)}% of your quota. Consider upgrading your plan.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* API Keys */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">API Keys</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Key
            </button>
          </div>

          {createdKey && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-300">New API Key Created</h3>
                    <p className="text-sm text-green-300 mt-2 font-mono bg-slate-900 p-2 rounded">
                      {createdKey.key}
                    </p>
                    <p className="text-xs text-green-400 mt-2">
                      Make sure to copy this key now. You won't be able to see it again.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    copyToClipboard(createdKey.key, createdKey.id)
                  }}
                  className="p-2 hover:bg-green-800 rounded transition"
                >
                  <Copy className="w-4 h-4 text-green-400" />
                </button>
              </div>
            </div>
          )}

          {apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">No API keys yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div key={key.id} className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{key.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Created {new Date(key.created_at).toLocaleDateString()}
                        {key.last_used_at && ` • Last used ${new Date(key.last_used_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      key.status === 'active'
                        ? 'bg-green-900/50 text-green-300'
                        : 'bg-red-900/50 text-red-300'
                    }`}>
                      {key.status}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <code className="flex-1 p-2 bg-slate-800 rounded text-sm font-mono text-slate-300">
                      {visibleKeys.has(key.id) ? key.key : key.masked_key}
                    </code>
                    <button
                      onClick={() => toggleKeyVisibility(key.id)}
                      className="p-2 hover:bg-slate-600 rounded transition"
                    >
                      {visibleKeys.has(key.id) ? (
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(key.key, key.id)}
                      className="p-2 hover:bg-slate-600 rounded transition relative"
                    >
                      <Copy
                        className={`w-4 h-4 transition ${
                          copied === key.id ? 'text-green-400' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="mb-3 text-xs text-slate-400">
                    Requests this period: {key.quota_remaining} / {key.quota_limit}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => rotateKey(key.id)}
                      className="flex-1 px-3 py-2 rounded text-sm bg-slate-600 hover:bg-slate-500 text-white transition flex items-center justify-center gap-2"
                      disabled={key.status !== 'active'}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Rotate
                    </button>
                    <button
                      onClick={() => deleteKey(key.id)}
                      className="px-3 py-2 rounded text-sm bg-red-900/30 hover:bg-red-900/50 text-red-300 transition flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Key Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">Create New API Key</h3>
              <input
                type="text"
                placeholder="Key name (e.g., Production API)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={createNewKey}
                  disabled={creating || !newKeyName.trim()}
                  className="flex-1 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Start */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Start</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-mono text-sm font-semibold text-blue-400 mb-2">1. Using your API Key</h3>
              <pre className="bg-slate-900 p-4 rounded text-sm overflow-x-auto text-slate-300">
                {`curl -H "X-API-Key: your-api-key-here" \\
  https://enem-pro.com/api/questoes`}
              </pre>
            </div>
            <div>
              <h3 className="font-mono text-sm font-semibold text-blue-400 mb-2">2. With JavaScript SDK</h3>
              <pre className="bg-slate-900 p-4 rounded text-sm overflow-x-auto text-slate-300">
                {`import ENEMPro from '@enem-pro/sdk'

const client = new ENEMPro({ apiKey: 'your-key' })
const questions = await client.questions.list()`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
