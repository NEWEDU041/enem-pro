/**
 * A/B Testing Framework for PHASE 2
 * Humanization Variants Testing
 * 
 * This framework implements client-side A/B testing for 3 content tone variants:
 * - Variant A: Current (professional)
 * - Variant B: Casual (friendly, conversational)
 * - Variant C: Motivational (inspirational, action-oriented)
 */

import { cookies } from 'next/headers';

export type ToneVariant = 'current' | 'casual' | 'motivational';

interface ABTestConfig {
  testId: string;
  variants: Record<ToneVariant, number>; // percentage distribution
  startDate: Date;
  endDate: Date;
  metrics: {
    pageView: boolean;
    clickTracking: boolean;
    timeOnPage: boolean;
    scrollDepth: boolean;
  };
}

const TEST_CONFIG: ABTestConfig = {
  testId: 'phase-2-humanization',
  variants: {
    current: 0.33,
    casual: 0.33,
    motivational: 0.34,
  },
  startDate: new Date('2026-11-03'),
  endDate: new Date('2026-11-10'),
  metrics: {
    pageView: true,
    clickTracking: true,
    timeOnPage: true,
    scrollDepth: true,
  },
};

/**
 * Get or create user variant assignment
 */
export async function getUserVariant(userId?: string): Promise<ToneVariant> {
  const cookieStore = await cookies();
  const variantCookie = cookieStore.get(`ab_variant_${TEST_CONFIG.testId}`);

  if (variantCookie?.value) {
    return variantCookie.value as ToneVariant;
  }

  // Assign new variant based on distribution
  const variant = assignVariant();
  cookieStore.set(`ab_variant_${TEST_CONFIG.testId}`, variant, {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return variant;
}

/**
 * Randomly assign variant based on distribution percentages
 */
function assignVariant(): ToneVariant {
  const rand = Math.random();
  const keys = Object.keys(TEST_CONFIG.variants) as ToneVariant[];

  let accumulated = 0;
  for (const key of keys) {
    accumulated += TEST_CONFIG.variants[key];
    if (rand <= accumulated) {
      return key;
    }
  }

  return 'current';
}

/**
 * Track A/B test metric
 */
export async function trackABTestMetric(
  variant: ToneVariant,
  metric: keyof ABTestConfig['metrics'],
  value: any,
  pageUrl?: string
): Promise<void> {
  if (!TEST_CONFIG.metrics[metric]) return;

  const eventData = {
    event: `ab_test_${metric}`,
    testId: TEST_CONFIG.testId,
    variant,
    value,
    pageUrl: pageUrl || typeof window !== 'undefined' ? window.location.pathname : null,
    timestamp: new Date().toISOString(),
  };

  // Send to analytics (GA4, Segment, or custom endpoint)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventData.event, {
      test_id: eventData.testId,
      variant: eventData.variant,
      value: eventData.value,
      page: eventData.pageUrl,
    });
  }

  // Also send to backend analytics endpoint
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
  } catch (error) {
    console.error('Failed to track AB test metric:', error);
  }
}

/**
 * Get variant-specific content
 */
export function getVariantContent(
  variant: ToneVariant,
  contentKey: string
): string {
  const contentMap: Record<ToneVariant, Record<string, string>> = {
    current: {
      cta_button: 'Começar Agora',
      hero_subtitle: 'Simulados com questões reais do INEP, correção de redação por IA.',
      section_benefit: 'Estude com Estratégia',
    },
    casual: {
      cta_button: 'Vamos começar?',
      hero_subtitle: 'Vira-e-mexe você quer saber se tá no caminho certo, né? A gente te ajuda!',
      section_benefit: 'Chega de estudar no escuro',
    },
    motivational: {
      cta_button: 'Conquiste Sua Aprovação',
      hero_subtitle: 'Cada questão é uma oportunidade. Cada resposta certa é um passo para seu sonho.',
      section_benefit: 'Você é capaz. Nós provamos',
    },
  };

  return contentMap[variant]?.[contentKey] || contentMap.current[contentKey] || '';
}

/**
 * Client-side hook for tracking page metrics
 */
export function useABTestTracking(variant: ToneVariant, pageName: string) {
  if (typeof window === 'undefined') return;

  // Track page view
  trackABTestMetric(variant, 'pageView', { page: pageName });

  // Track time on page
  let timeSpent = 0;
  const startTime = Date.now();

  const onBeforeUnload = () => {
    timeSpent = Date.now() - startTime;
    trackABTestMetric(variant, 'timeOnPage', timeSpent, pageName);
  };

  // Track scroll depth
  let maxScroll = 0;
  const onScroll = () => {
    const scrolled = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    if (scrolled > maxScroll) {
      maxScroll = scrolled;
    }
  };

  const onClickOrAction = (e: Event) => {
    if (e.target instanceof HTMLElement && (e.target.tagName === 'A' || e.target.getAttribute('role') === 'button')) {
      trackABTestMetric(variant, 'clickTracking', {
        element: e.target.textContent,
        href: (e.target as HTMLAnchorElement).href,
      });
    }
  };

  window.addEventListener('beforeunload', onBeforeUnload);
  window.addEventListener('scroll', onScroll);
  document.addEventListener('click', onClickOrAction);

  return () => {
    window.removeEventListener('beforeunload', onBeforeUnload);
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('click', onClickOrAction);
  };
}
