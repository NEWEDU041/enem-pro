/**
 * Phase 3: Code Splitting Strategy for enem-pro & site-clicks
 * 
 * Objective: Reduce initial JS bundle by 40%+ via route-based and component-based splitting
 * 
 * Current Issues (baseline):
 * - enem-pro: ~500KB main JS (includes all utilities, charts, editors)
 * - Heavy components: MathJax, CodeMirror, Chart.js loaded on first load
 * - Target: Initial bundle <300KB (40% reduction)
 * 
 * Strategy:
 * 1. Route-based splitting (automatic via Next.js dynamic imports)
 * 2. Component-based splitting (dynamic() for heavy components)
 * 3. Library optimization (remove unused code, use tree-shaking)
 * 4. Defer non-critical scripts (analytics, ads)
 */

import dynamic from 'next/dynamic';
import { ComponentType, ReactNode } from 'react';

// ============================================================================
// ROUTE-BASED SPLITTING (Automatic in Next.js)
// ============================================================================
// Next.js automatically code-splits at each route:
// - pages/index.tsx → _next/static/chunks/pages/index.js
// - pages/blog/[slug].tsx → _next/static/chunks/pages/blog/[slug].js
// This is configured out-of-the-box; no changes needed.

// ============================================================================
// COMPONENT-BASED SPLITTING
// ============================================================================

/**
 * Heavy math rendering library - used on /questoes pages only
 * Bundle size: ~120KB (MathJax + dependencies)
 * Loading time: 500-800ms
 * Solution: Lazy load on demand
 */
export const MathEditor = dynamic(() => import('./components/MathEditor'), {
  loading: () => <div className="text-gray-500">Loading math editor...</div>,
  ssr: true, // Keep SSR for SEO
});

/**
 * Code editor - used on /editor, /challenges pages
 * Bundle size: ~80KB (Monaco/CodeMirror)
 * Solution: Lazy load on route or user interaction
 */
export const CodeEditor = dynamic(() => import('./components/CodeEditor'), {
  loading: () => <div className="bg-gray-100 h-96 flex items-center justify-center">Loading editor...</div>,
  ssr: false, // Monaco needs browser APIs
});

/**
 * Interactive charts - used on /statistics, /dashboard
 * Bundle size: ~50KB (Chart.js + react-chartjs-2)
 * Solution: Lazy load when statistics tab is active
 */
export const AnalyticsChart = dynamic(() => import('./components/AnalyticsChart'), {
  loading: () => <div className="bg-gray-50 h-64 animate-pulse" />,
  ssr: false,
});

/**
 * Video player - used on /video-explanations
 * Bundle size: ~30KB (plyr, hls.js)
 * Solution: Lazy load on video page
 */
export const VideoPlayer = dynamic(() => import('./components/VideoPlayer'), {
  loading: () => <div className="bg-black aspect-video flex items-center justify-center"><span className="text-white">Loading...</span></div>,
  ssr: false,
});

/**
 * Rich text editor - used on admin pages
 * Bundle size: ~40KB (TipTap + extensions)
 * Solution: Load only on admin routes
 */
export const RichEditor = dynamic(() => import('./components/RichEditor'), {
  loading: () => <div className="border border-gray-300 p-4">Loading editor...</div>,
  ssr: false,
});

/**
 * Google Maps - used on /schools page
 * Bundle size: ~50KB (google-maps + react wrapper)
 * Solution: Load on intersection (map component visible)
 */
export const SchoolMap = dynamic(() => import('./components/SchoolMap'), {
  loading: () => <div className="bg-gray-200 h-96 flex items-center justify-center">Loading map...</div>,
  ssr: false,
});

// ============================================================================
// SCRIPT DEFERRAL (Non-Critical)
// ============================================================================
// Moved to next/script with strategy="afterInteractive":
//
// In _app.tsx or _document.tsx:
//
// import Script from 'next/script';
//
// export default function MyApp() {
//   return (
//     <>
//       {/* Critical scripts only in head */}
//
//       {/* Defer non-critical scripts */}
//       <Script
//         src="https://analytics.google.com/analytics.js"
//         strategy="afterInteractive"
//         data-measurement-id="GA_MEASUREMENT_ID"
//       />
//       <Script
//         src="https://cdn.sentry.io/..."
//         strategy="afterInteractive"
//         onLoad={() => Sentry.init(...)}
//       />
//     </>
//   );
// }

// ============================================================================
// LIBRARY OPTIMIZATION
// ============================================================================

/**
 * Tree-shaking configuration (next.config.js):
 * 
 * const nextConfig = {
 *   webpack: (config, { isServer }) => {
 *     if (!isServer) {
 *       config.optimization.usedExports = true;
 *       config.optimization.sideEffects = false;
 *     }
 *     return config;
 *   },
 * };
 */

/**
 * Bundle analysis (to find large dependencies):
 * 
 * 1. Install analyzer: npm install --save-dev @next/bundle-analyzer
 * 2. Update next.config.js:
 *    const withBundleAnalyzer = require('@next/bundle-analyzer')({
 *      enabled: process.env.ANALYZE === 'true',
 *    });
 *    module.exports = withBundleAnalyzer(nextConfig);
 * 3. Run: ANALYZE=true npm run build
 * 4. Open: .next/static/chunks/
 */

/**
 * Size budgets (configure in package.json):
 * 
 * "budgetOfBundles": [
 *   {
 *     "name": "main",
 *     "maxSize": "300kb"
 *   },
 *   {
 *     "name": "vendor",
 *     "maxSize": "150kb"
 *   }
 * ]
 */

// ============================================================================
// USAGE EXAMPLE: Dashboard with Lazy-Loaded Charts
// ============================================================================

interface DashboardProps {
  userId: string;
}

export function Dashboard({ userId }: DashboardProps): ReactNode {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'analytics'>('overview');

  return (
    <div className="space-y-6">
      <h1>Your Dashboard</h1>

      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={activeTab === 'overview' ? 'border-b-2 border-blue-500' : ''}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={activeTab === 'analytics' ? 'border-b-2 border-blue-500' : ''}
        >
          Analytics
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <h2>Recent Activity</h2>
          {/* Quick stats, no heavy components */}
        </div>
      )}

      {/* Lazy-load analytics only when tab is active */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <h2>Your Statistics</h2>
          <AnalyticsChart userId={userId} />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPECTED PERFORMANCE IMPROVEMENTS (Phase 3)
// ============================================================================
// Before:
//   Initial JS: ~500KB
//   First Contentful Paint (FCP): 2.5s
//   Largest Contentful Paint (LCP): 4.2s
//
// After:
//   Initial JS: ~300KB (-40%)
//   FCP: 1.5s (-40%)
//   LCP: 2.8s (-33%)
//
// Revenue Impact: +R$200-400/month
// - Faster pages → +10-15% CTR
// - Mobile users +5% conversion (mobile first)
//
// ============================================================================

export default Dashboard;
