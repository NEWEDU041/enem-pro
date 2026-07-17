const colors = {
  gold: 'bg-gold-100 text-gold-700',
  ink: 'bg-ink-100 text-ink-700',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
  zinc: 'bg-zinc-100 text-zinc-600',
  onDark: 'bg-white/10 text-gold-400 ring-1 ring-inset ring-white/15',
}

export function Badge({
  children,
  color = 'gold',
  className = '',
}: {
  children: React.ReactNode
  color?: keyof typeof colors
  className?: string
}) {
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${colors[color]} ${className}`}>
      {children}
    </span>
  )
}
