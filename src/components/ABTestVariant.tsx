/**
 * ABTestVariant Component
 * Handles variant selection, GTM event tracking, and analytics for A/B testing
 * 
 * Usage:
 * <ABTestVariant testId="post-headline-tone" variants={['baseline', 'professional', 'casual']}>
 *   {(variant) => <YourContent variant={variant} />}
 * </ABTestVariant>
 */

import { useEffect, useState, useCallback, ReactNode } from 'react';

export type ABTestVariant = 'baseline' | 'professional' | 'casual';

export interface ABTestVariantProps {
  testId: string;
  variants: ABTestVariant[];
  children?: (variant: ABTestVariant) => ReactNode;
  onVariantAssign?: (variant: ABTestVariant) => void;
  persistToLocalStorage?: boolean;
  userId?: string;
}

interface VariantAssignment {
  testId: string;
  variant: ABTestVariant;
  assignedAt: number;
  userId?: string;
}

/**
 * Deterministic variant assignment using user ID + test ID
 * Ensures same user always gets same variant across sessions
 */
function getVariantAssignment(
  testId: string,
  variants: ABTestVariant[],
  userId?: string
): ABTestVariant {
  const seed = userId || 'anonymous';
  const key = `${testId}:${seed}`;
  
  // Simple hash function for deterministic variant selection
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const index = Math.abs(hash) % variants.length;
  return variants[index];
}

/**
 * Fire GTM event for variant assignment
 */
function fireGTMEvent(
  testId: string,
  variant: ABTestVariant,
  userId?: string
): void {
  if (typeof window === 'undefined') return;

  // Push to GTM dataLayer
  if (window.dataLayer) {
    window.dataLayer.push({
      event: 'ab_test_variant_assigned',
      ab_test_id: testId,
      ab_test_variant: variant,
      user_id: userId || 'anonymous',
      timestamp: new Date().toISOString(),
    });
  }

  // Also fire conversion tracking event
  window.dataLayer?.push({
    event: 'page_view',
    ab_test_active: true,
    ab_test_id: testId,
    ab_test_variant: variant,
  });
}

/**
 * Track conversion/interaction events in GTM
 */
export function trackABTestEvent(
  testId: string,
  variant: ABTestVariant,
  eventName: string,
  eventData?: Record<string, any>
): void {
  if (typeof window === 'undefined') return;

  if (window.dataLayer) {
    window.dataLayer.push({
      event: `ab_test_${eventName}`,
      ab_test_id: testId,
      ab_test_variant: variant,
      timestamp: new Date().toISOString(),
      ...eventData,
    });
  }
}

export function ABTestVariant({
  testId,
  variants,
  children,
  onVariantAssign,
  persistToLocalStorage = true,
  userId,
}: ABTestVariantProps) {
  const [assignedVariant, setAssignedVariant] = useState<ABTestVariant | null>(
    null
  );
  const [isLoaded, setIsLoaded] = useState(false);

  const localStorageKey = `ab_test_${testId}`;

  const assignVariant = useCallback(() => {
    // Check localStorage first (if persistence enabled)
    let variant: ABTestVariant | null = null;

    if (persistToLocalStorage && typeof window !== 'undefined') {
      const stored = localStorage.getItem(localStorageKey);
      if (stored && (variants as string[]).includes(stored)) {
        variant = stored as ABTestVariant;
      }
    }

    // If not in localStorage, assign deterministically
    if (!variant) {
      variant = getVariantAssignment(testId, variants, userId);

      if (persistToLocalStorage && typeof window !== 'undefined') {
        localStorage.setItem(localStorageKey, variant);
      }
    }

    setAssignedVariant(variant);
    onVariantAssign?.(variant);
    fireGTMEvent(testId, variant, userId);
  }, [testId, variants, userId, persistToLocalStorage, localStorageKey, onVariantAssign]);

  // Initialize variant assignment on mount
  useEffect(() => {
    assignVariant();
    setIsLoaded(true);
  }, [assignVariant]);

  // Don't render until variant is assigned (prevents hydration mismatches)
  if (!isLoaded || !assignedVariant) {
    return null;
  }

  if (typeof children === 'function') {
    return <>{children(assignedVariant)}</>;
  }

  return <>{children}</>;
}

/**
 * Hook for accessing current test variant
 */
export function useABTestVariant(testId: string, variants: ABTestVariant[], userId?: string) {
  const [variant, setVariant] = useState<ABTestVariant | null>(null);

  useEffect(() => {
    const assigned = getVariantAssignment(testId, variants, userId);
    setVariant(assigned);
    fireGTMEvent(testId, assigned, userId);
  }, [testId, variants, userId]);

  return variant;
}

export default ABTestVariant;
