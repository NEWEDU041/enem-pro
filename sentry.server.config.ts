/**
 * Initialize Sentry for the entire Next.js application
 * This file should be imported at the very top of your app
 */

// Only initialize Sentry on the server side
if (typeof window === 'undefined') {
  require('./lib/sentry/init').initSentry();
}

export {};
