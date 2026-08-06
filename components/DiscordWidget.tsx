'use client'

import { MessageCircle } from 'lucide-react'

export default function DiscordWidget() {
  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Discord floating button */}
      <a
        href="https://discord.gg/emenprof"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 group"
      >
        <div className="flex items-center gap-2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.211.375-.444.864-.607 1.25a18.27 18.27 0 00-5.487 0c-.163-.386-.395-.875-.607-1.25a.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 00-.042-.106 13.107 13.107 0 01-1.872-.892.077.077 0 00-.008-.128 10.2 10.2 0 00.372-.294.075.075 0 00.081-.01 14.047 14.047 0 0012.081 0c.024.02.055.02.081.009.12.098.246.198.372.294a.077.077 0 00-.008.129c-.598.35-1.22.645-1.872.892a.077.077 0 00-.041.107c.354.699.765 1.364 1.226 1.994a.076.076 0 00.084.028 19.963 19.963 0 006.002-3.03.077.077 0 00.032-.057c.5-4.506.151-8.921-.571-13.087a.061.061 0 00-.032-.03zM8.02 15.33c-1.183 0-2.157-.965-2.157-2.156 0-1.193.979-2.157 2.157-2.157 1.183 0 2.157.964 2.157 2.157 0 1.19-.974 2.156-2.157 2.156zm7.975 0c-1.183 0-2.157-.965-2.157-2.156 0-1.193.979-2.157 2.157-2.157 1.183 0 2.157.964 2.157 2.157 0 1.19-.974 2.156-2.157 2.156z" />
          </svg>
          <span className="font-semibold hidden sm:inline">
            Comunidade Discord
          </span>
        </div>

        {/* Online indicator */}
        <div className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      </a>

      {/* Tooltip */}
      <div className="absolute bottom-16 right-0 bg-gray-900 text-white px-3 py-2 rounded-lg whitespace-nowrap text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Junte-se a 2k+ estudantes!
        <div className="absolute top-full right-3 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  )
}
