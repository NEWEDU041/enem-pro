'use client'

import { useEffect, useState } from 'react'

const LEMBRETE_HOURS = [7, 8, 9, 18, 19, 20]

export default function PushSubscribeButton() {
  const [supported, setSupported] = useState(false)
  const [granted, setGranted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [scheduled, setScheduled] = useState(false)

  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs React state with browser Notification/localStorage APIs
      setSupported(true)
      setGranted(Notification.permission === 'granted')
      setScheduled(!!localStorage.getItem('enem_push_enabled'))
    }
  }, [])

  async function enable() {
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setLoading(false); return }
      setGranted(true)

      // Schedule daily reminder via SW (client-side only — no push server needed)
      const now = new Date()
      const nextHour = LEMBRETE_HOURS.find((h) => h > now.getHours()) ?? LEMBRETE_HOURS[0]
      const next = new Date()
      next.setHours(nextHour, 0, 0, 0)
      if (next <= now) next.setDate(next.getDate() + 1)

      const delay = next.getTime() - Date.now()
      localStorage.setItem('enem_push_enabled', '1')
      localStorage.setItem('enem_push_next', String(next.getTime()))
      setScheduled(true)

      // Immediate local notification as confirmation
      setTimeout(() => {
        new Notification('ENEM Pro — Lembretes ativados!', {
          body: `Você receberá lembretes diários para treinar. Próximo às ${nextHour}h.`,
          icon: '/api/icons/192',
        })
      }, 500)

      // Schedule recurring check (polling via setTimeout — no push server required)
      scheduleLocalPush(delay)
    } finally {
      setLoading(false)
    }
  }

  function scheduleLocalPush(delay: number) {
    setTimeout(() => {
      if (localStorage.getItem('enem_push_enabled') !== '1') return
      if (Notification.permission === 'granted') {
        new Notification('ENEM Pro — Hora de treinar!', {
          body: 'Suas questões do ENEM estão esperando. 10 minutos de treino faz diferença.',
          icon: '/api/icons/192',
        })
      }
      // Reschedule for next day (24h)
      localStorage.setItem('enem_push_next', String(Date.now() + 86400000))
      scheduleLocalPush(86400000)
    }, delay)
  }

  function disable() {
    localStorage.removeItem('enem_push_enabled')
    localStorage.removeItem('enem_push_next')
    setScheduled(false)
  }

  if (!supported) return null

  if (scheduled && granted) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-green-700">
          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          Lembretes diários ativados
        </div>
        <button onClick={disable} className="text-xs text-zinc-400 hover:text-zinc-600 underline">
          Desativar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={enable}
      disabled={loading}
      className="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl hover:bg-amber-100 transition-colors text-sm font-medium disabled:opacity-60"
    >
      <span className="text-lg">🔔</span>
      <span>{loading ? 'Ativando...' : 'Ativar lembrete diário de estudos'}</span>
    </button>
  )
}
