/**
 * GTM Analytics Service
 * Manages Google Tag Manager dataLayer for A/B testing metrics
 * Tracks: variant assignments, impressions, clicks, conversions
 */

export interface GTMEvent {
  event: string;
  ab_test_id: string;
  ab_test_variant: string;
  timestamp: string;
  user_id?: string;
  [key: string]: any;
}

export interface GTMEventPayload {
  ab_test_id: string;
  ab_test_variant: string;
  event_type: 'impression' | 'click' | 'conversion' | 'scroll' | 'custom';
  event_value?: number;
  event_label?: string;
  metadata?: Record<string, any>;
}

/**
 * Initialize GTM container if not already loaded
 */
export function initializeGTM(): void {
  if (typeof window === 'undefined') return;

  // Check if GTM is already initialized
  if (window.dataLayer) return;

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];

  // GTM initialization event
  window.dataLayer.push({
    event: 'gtm_ready',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Push A/B test event to GTM dataLayer
 */
export function pushABTestEvent(payload: GTMEventPayload): void {
  if (typeof window === 'undefined') return;

  if (!window.dataLayer) {
    initializeGTM();
  }

  window.dataLayer?.push({
    event: `ab_test_${payload.event_type}`,
    ab_test_id: payload.ab_test_id,
    ab_test_variant: payload.ab_test_variant,
    event_value: payload.event_value,
    event_label: payload.event_label,
    timestamp: new Date().toISOString(),
    ...payload.metadata,
  });
}

/**
 * Track page view with A/B test context
 */
export function trackPageViewWithABTest(
  testId: string,
  variant: string,
  metadata?: Record<string, any>
): void {
  pushABTestEvent({
    ab_test_id: testId,
    ab_test_variant: variant,
    event_type: 'impression',
    metadata,
  });
}

/**
 * Track click/interaction
 */
export function trackABTestClick(
  testId: string,
  variant: string,
  label: string,
  metadata?: Record<string, any>
): void {
  pushABTestEvent({
    ab_test_id: testId,
    ab_test_variant: variant,
    event_type: 'click',
    event_label: label,
    metadata,
  });
}

/**
 * Track conversion (e.g., form submission, purchase)
 */
export function trackABTestConversion(
  testId: string,
  variant: string,
  conversionValue: number = 1,
  metadata?: Record<string, any>
): void {
  pushABTestEvent({
    ab_test_id: testId,
    ab_test_variant: variant,
    event_type: 'conversion',
    event_value: conversionValue,
    metadata,
  });
}

/**
 * Track custom event
 */
export function trackABTestCustom(
  testId: string,
  variant: string,
  eventName: string,
  eventData?: Record<string, any>
): void {
  if (typeof window === 'undefined') return;

  if (!window.dataLayer) {
    initializeGTM();
  }

  window.dataLayer?.push({
    event: `ab_test_${eventName}`,
    ab_test_id: testId,
    ab_test_variant: variant,
    timestamp: new Date().toISOString(),
    ...eventData,
  });
}

/**
 * Get GTM dataLayer for debugging/inspection
 */
export function getGTMDataLayer(): GTMEvent[] {
  if (typeof window === 'undefined') return [];
  return (window.dataLayer || []) as GTMEvent[];
}

/**
 * Export all events as JSON (for batch processing)
 */
export function exportABTestEvents(testId?: string): GTMEvent[] {
  const allEvents = getGTMDataLayer();
  if (!testId) return allEvents;
  return allEvents.filter((e) => e.ab_test_id === testId);
}

// Declare global GTM window object
declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export default {
  initializeGTM,
  pushABTestEvent,
  trackPageViewWithABTest,
  trackABTestClick,
  trackABTestConversion,
  trackABTestCustom,
  getGTMDataLayer,
  exportABTestEvents,
};
