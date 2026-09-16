#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function generateGA4Dashboard() {
  const dashboard = {
    name: 'enem-pro-ga4-dashboard',
    views: [
      {
        name: 'traffic-overview',
        metrics: ['sessions', 'users', 'bounceRate', 'pageviewsPerSession'],
        dimensions: ['date', 'source']
      },
      {
        name: 'conversion-funnel',
        metrics: ['conversions', 'conversionRate', 'conversionValue'],
        dimensions: ['eventName']
      },
      {
        name: 'content-performance',
        metrics: ['screenPageViews', 'averageSessionDuration', 'bounceRate'],
        dimensions: ['pagePath', 'pageTitle'],
        filters: [{ dimension: 'pagePath', operator: 'begins_with', value: '/blog/' }]
      },
      {
        name: 'ecommerce-performance',
        metrics: ['purchaseRevenue', 'purchaseQuantity', 'cartAddRate'],
        dimensions: ['itemName', 'itemCategory']
      }
    ],
    autoRefresh: 3600,
    alerts: [
      { metric: 'bounceRate', threshold: 0.7, action: 'email' },
      { metric: 'conversionRate', threshold: 0.02, action: 'slack' }
    ]
  };

  const configPath = path.join(__dirname, '../ga4-dashboard.json');
  fs.writeFileSync(configPath, JSON.stringify(dashboard, null, 2));
  console.log('✅ GA4 Dashboard config created');
}

generateGA4Dashboard();
