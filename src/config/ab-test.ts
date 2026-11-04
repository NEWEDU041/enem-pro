/**
 * A/B Test Configuration
 * Shared across all projects (enem-pro, site-clicks, clube-da-escolha, happy-scribes-nest)
 */

export const AB_TEST_CONFIG = {
  // Test metadata
  testId: 'tone_variants_2026_q4',
  name: 'Content Tone Variants Test',
  description: 'Testing impact of tone (baseline, professional, casual) on engagement metrics',
  
  // Variants
  variants: ['baseline', 'professional', 'casual'] as const,
  
  // Timeline
  startDate: new Date('2026-11-04'),
  endDate: new Date('2026-11-08'),
  
  // GTM tracking
  gtm: {
    containerId: process.env.NEXT_PUBLIC_GTM_ID || 'GTM-XXXX',
    dataLayerName: 'dataLayer',
  },
  
  // Projects enrolled
  projects: [
    {
      id: 'enem-pro',
      url: 'https://enem-pro.com',
      postsCount: 50,
      deployed: true,
    },
    {
      id: 'site-clicks',
      url: 'https://site-clicks.com',
      postsCount: 50,
      deployed: false,
    },
    {
      id: 'clube-da-escolha',
      url: 'https://clube-da-escolha.com',
      postsCount: 50,
      deployed: false,
    },
    {
      id: 'happy-scribes-nest',
      url: 'https://happy-scribes-nest.com',
      postsCount: 50,
      deployed: false,
    },
  ],
  
  // Metrics gates (success criteria)
  gates: {
    minimumImpressions: 100,
    minimumClicks: 50,
    minimumConversions: 10,
    clickRateThreshold: 5, // %
    conversionRateThreshold: 10, // %
  },
};

// Type exports
export type ABTestVariant = typeof AB_TEST_CONFIG.variants[number];
export type ProjectId = typeof AB_TEST_CONFIG.projects[number]['id'];

// Utility function to get project config
export function getProjectConfig(projectId: ProjectId) {
  return AB_TEST_CONFIG.projects.find((p) => p.id === projectId);
}

// Utility function to get GTM event name
export function getGTMEventName(eventType: string): string {
  return `ab_test_${eventType}`;
}

// Check if test is active
export function isTestActive(): boolean {
  const now = new Date();
  return now >= AB_TEST_CONFIG.startDate && now <= AB_TEST_CONFIG.endDate;
}

// Get test duration in days
export function getTestDuration(): number {
  const duration = AB_TEST_CONFIG.endDate.getTime() - AB_TEST_CONFIG.startDate.getTime();
  return Math.ceil(duration / (1000 * 60 * 60 * 24));
}

export default AB_TEST_CONFIG;
