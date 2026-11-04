'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface TestMetrics {
  testId: string;
  variants: {
    name: string;
    impressions: number;
    clicks: number;
    conversions: number;
    clickRate: string;
    conversionRate: string;
  }[];
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  lastUpdated: string;
}

interface MetricsDashboardProps {
  testId: string;
  refreshInterval?: number; // ms
}

export function MetricsDashboard({
  testId,
  refreshInterval = 30000,
}: MetricsDashboardProps) {
  const [metrics, setMetrics] = useState<TestMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/metrics/ab-tests/${testId}`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      
      const data = await response.json();
      setMetrics(data);
      setError(null);

      // Add to history for charting
      setHistoryData((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString(),
          ...data.variants.reduce(
            (acc: any, v: any) => ({
              ...acc,
              [`${v.name}_clicks`]: v.clicks,
              [`${v.name}_conversions`]: v.conversions,
            }),
            {}
          ),
        },
      ].slice(-20)); // Keep last 20 data points
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [testId, refreshInterval]);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">A/B Test Results</h2>
          <p className="text-sm text-gray-600">Test ID: {testId}</p>
        </div>
        <div className="text-sm text-gray-600">
          Last updated: {new Date(metrics.lastUpdated).toLocaleTimeString()}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600 mb-1">Total Impressions</p>
          <p className="text-3xl font-bold text-blue-900">{metrics.totalImpressions.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-gray-600 mb-1">Total Clicks</p>
          <p className="text-3xl font-bold text-green-900">{metrics.totalClicks.toLocaleString()}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-sm text-gray-600 mb-1">Total Conversions</p>
          <p className="text-3xl font-bold text-purple-900">{metrics.totalConversions.toLocaleString()}</p>
        </div>
      </div>

      {/* Variant Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-900">Variant</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-900">Impressions</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-900">Clicks</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-900">Click Rate</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-900">Conversions</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-900">Conversion Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {metrics.variants.map((v) => (
              <tr key={v.name} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900 capitalize">
                  {v.name}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {v.impressions.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {v.clicks.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-block bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-xs font-semibold">
                    {v.clickRate}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {v.conversions.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-block bg-green-100 text-green-900 px-3 py-1 rounded-full text-xs font-semibold">
                    {v.conversionRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Charts */}
      {historyData.length > 1 && (
        <div className="grid grid-cols-2 gap-6">
          {/* Clicks over time */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-4">Clicks Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                {metrics.variants.map((v) => (
                  <Line
                    key={`${v.name}_clicks`}
                    type="monotone"
                    dataKey={`${v.name}_clicks`}
                    stroke={`hsl(${Math.random() * 360}, 70%, 50%)`}
                    name={`${v.name} Clicks`}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Conversions over time */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-4">Conversions Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                {metrics.variants.map((v) => (
                  <Bar
                    key={`${v.name}_conversions`}
                    dataKey={`${v.name}_conversions`}
                    fill={`hsl(${Math.random() * 360}, 70%, 50%)`}
                    name={`${v.name} Conversions`}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default MetricsDashboard;
