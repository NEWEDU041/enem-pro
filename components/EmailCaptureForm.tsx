'use client';

import { useState } from 'react';

export function EmailCaptureForm({ variant = 'sidebar' }: { variant?: 'sidebar' | 'popup' | 'footer' }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, leadMagnet: 'study-schedule' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to subscribe');
      }

      setSuccess(true);
      setEmail('');
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'sidebar') {
    return (
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-bold text-sm mb-2">Cronograma ENEM 2026</h3>
        <p className="text-xs text-gray-600 mb-3">Receba seu plano de 90 dias gratuitamente</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm mb-2"
            required
            disabled={loading}
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Receber Cronograma'}
          </button>
        </form>

        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        {success && <p className="text-xs text-green-600 mt-2">✓ Verifique seu email!</p>}
      </div>
    );
  }

  if (variant === 'popup') {
    return (
      <div className="fixed bottom-4 right-4 bg-white p-6 rounded-lg shadow-lg max-w-sm border border-gray-200">
        <h2 className="font-bold mb-2">Saia sem levar seu cronograma? 📅</h2>
        <p className="text-sm text-gray-600 mb-4">Plano de 90 dias + dicas semanais de especialistas</p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm mb-2"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium mb-2"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Ganhe 50% de Desconto'}
          </button>
        </form>

        {error && <p className="text-xs text-red-600">{error}</p>}
        {success && <p className="text-xs text-green-600">✓ Email recebido!</p>}
      </div>
    );
  }

  return null;
}
