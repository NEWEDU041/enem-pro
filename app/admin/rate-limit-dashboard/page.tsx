'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface RateLimitAnalytics {
  timestamp: string
  summary: {
    totalTiers: number
    freetierUsers: number
    proTierUsers: number
    proPercentage: string
  }
  topUsers: Array<{
    user_id: string
    daily_requests: number
    percentage_used: string
  }>
  dailyTrends: Array<{
    date: string
    totalRequests: number
    userCount: number
  }>
  rateLimitViolations: {
    count: number
    recent: Array<{
      user_id: string
      date: string
      requests: number
      percent_of_limit: string
    }>
  }
  tierConfig: {
    free: { daily_limit: number; hourly_limit: number; burst_limit: number }
    pro: { daily_limit: number; hourly_limit: number; burst_limit: number }
  }
}

export default function RateLimitDashboard() {
  const [data, setData] = useState<RateLimitAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/rate-limit-analytics')
        if (!response.ok) {
          throw new Error(`Failed to fetch analytics: ${response.statusText}`)
        }
        const json = await response.json()
        setData(json)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
    // Refresh every 5 minutes
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Carregando análise de rate limits...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-red-800 font-semibold mb-2">Erro ao carregar dados</h2>
        <p className="text-red-700">{error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Nenhum dado disponível</div>
      </div>
    )
  }

  const tierData = [
    { name: 'Free', value: data.summary.freetierUsers, color: '#3b82f6' },
    { name: 'Pro', value: data.summary.proTierUsers, color: '#10b981' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Rate Limit Analytics</h1>
          <p className="text-gray-600">
            Última atualização: {new Date(data.timestamp).toLocaleString('pt-BR')}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm font-medium mb-2">Total de Usuários</p>
            <p className="text-3xl font-bold text-gray-900">{data.summary.totalTiers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm font-medium mb-2">Usuários Free</p>
            <p className="text-3xl font-bold text-blue-600">{data.summary.freetierUsers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm font-medium mb-2">Usuários Pro</p>
            <p className="text-3xl font-bold text-green-600">{data.summary.proTierUsers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm font-medium mb-2">Violações Hoje</p>
            <p className="text-3xl font-bold text-red-600">{data.rateLimitViolations.count}</p>
          </div>
        </div>

        {/* Tier Distribution & Top Users */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Pie Chart - Tier Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Distribuição de Tiers</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tierData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) =>
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Users */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Usuários (hoje)</h2>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {data.topUsers.map((user, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate">{user.user_id}</p>
                    <p className="text-xs text-gray-500">{user.daily_requests} requisições</p>
                  </div>
                  <div className="text-right">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${Math.min(100, parseFloat(user.percentage_used))}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{user.percentage_used}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Trends */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tendência de Uso (7 dias)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.dailyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalRequests"
                stroke="#3b82f6"
                name="Total de Requisições"
              />
              <Line
                type="monotone"
                dataKey="userCount"
                stroke="#10b981"
                name="Usuários Ativos"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Rate Limit Violations */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Violações de Rate Limit ({data.rateLimitViolations.count} hoje)
          </h2>
          {data.rateLimitViolations.recent.length === 0 ? (
            <p className="text-gray-600">Nenhuma violação registrada</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-semibold">Usuário</th>
                    <th className="text-left py-2 px-4 font-semibold">Data</th>
                    <th className="text-right py-2 px-4 font-semibold">Requisições</th>
                    <th className="text-right py-2 px-4 font-semibold">% do Limite</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rateLimitViolations.recent.map((violation, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4 font-mono text-xs truncate">{violation.user_id}</td>
                      <td className="py-2 px-4">{violation.date}</td>
                      <td className="py-2 px-4 text-right">{violation.requests}</td>
                      <td className="py-2 px-4 text-right">
                        <span className={`font-semibold ${
                          parseFloat(violation.percent_of_limit) >= 100
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }`}>
                          {violation.percent_of_limit}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tier Configuration Info */}
        <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Configuração de Tiers</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-blue-900 mb-3">Free Tier</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Limite diário: {data.tierConfig.free.daily_limit.toLocaleString()} requisições</li>
                <li>• Limite por hora: {data.tierConfig.free.hourly_limit}</li>
                <li>• Limite de burst: {data.tierConfig.free.burst_limit}/min</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-green-900 mb-3">Pro Tier</h4>
              <ul className="space-y-2 text-sm text-green-800">
                <li>• Limite diário: {data.tierConfig.pro.daily_limit.toLocaleString()} requisições</li>
                <li>• Limite por hora: {data.tierConfig.pro.hourly_limit.toLocaleString()}</li>
                <li>• Limite de burst: {data.tierConfig.pro.burst_limit}/min</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
