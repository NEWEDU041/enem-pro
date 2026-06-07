import Link from 'next/link'

interface SiteHeaderProps {
  backHref?: string
  backLabel?: string
  showUpgrade?: boolean
  showAuth?: boolean
  userName?: string
  onLogout?: () => void
}

export default function SiteHeader({
  backHref,
  backLabel,
  showUpgrade,
  showAuth = true,
  userName,
  onLogout,
}: SiteHeaderProps) {
  return (
    <header className="bg-white border-b border-zinc-200 px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href={backHref ? backHref : '/'} className="text-xl font-bold text-indigo-600">
          ENEM Pro
        </Link>
        <div className="flex items-center gap-3">
          {backHref && backLabel && (
            <Link href={backHref} className="text-sm text-zinc-500 hover:text-zinc-900">{backLabel}</Link>
          )}
          {showUpgrade && (
            <Link href="/planos" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              Upgrade Pro
            </Link>
          )}
          {userName && (
            <span className="text-sm text-zinc-500 hidden sm:inline">{userName}</span>
          )}
          {onLogout && (
            <button onClick={onLogout} className="text-sm text-zinc-400 hover:text-zinc-700">Sair</button>
          )}
          {showAuth && !userName && !onLogout && (
            <>
              <Link href="/auth/login" className="text-sm text-zinc-500 hover:text-zinc-900">Entrar</Link>
              <Link href="/auth/register" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                Começar grátis
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
