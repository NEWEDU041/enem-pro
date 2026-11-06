import { ReactNode } from 'react'

export const metadata = {
  title: 'Posts - ENEM Pro',
  description: 'API Documentation, Guides, and Tutorials',
}

export default function PostsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <a href="/posts" className="text-blue-600 hover:text-blue-800 font-semibold">
            ← Back to Posts
          </a>
        </div>
      </nav>

      {/* Main content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-600 text-sm">
          <p>© 2026 ENEM Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
