#!/usr/bin/env node

/**
 * Webhook Signature Examples Generator
 * 
 * Generates example webhook payloads with valid signatures
 * for testing Stripe and Anthropic webhooks.
 */

const crypto = require('crypto');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

function header(title) {
  console.log(`\n${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.cyan}  ${title}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}\n`);
}

function section(title) {
  console.log(`\n${colors.blue}▸ ${title}${colors.reset}`);
  console.log(colors.blue + '─'.repeat(70) + colors.reset);
}

function code(text) {
  console.log(`${colors.yellow}${text}${colors.reset}`);
}

/**
 * Example 1: Stripe Webhook - Checkout Session Completed
 */
function exampleStripeCheckout() {
  section('Stripe: Checkout Session Completed');

  const stripeSecret = 'whsec_test_abc123def456xyz789';
  const body = JSON.stringify({
    id: 'evt_1234567890',
    object: 'event',
    api_version: '2024-10-15',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'cs_test_4eC39HqLyjWDarhtT2jV8Xwj',
        object: 'checkout.session',
        client_reference_id: 'user_123abc',
        customer: 'cus_test_abc123',
        payment_status: 'paid',
        subscription: 'sub_test_xyz789',
        metadata: {
          plan: 'monthly',
        },
      },
    },
    livemode: false,
    pending_webhooks: 0,
    request: {
      id: null,
      idempotency_key: null,
    },
    type: 'checkout.session.completed',
  });

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signedContent = `${timestamp}.${body}`;
  const signature = crypto
    .createHmac('sha256', stripeSecret)
    .update(signedContent)
    .digest('hex');

  const stripeSignatureHeader = `t=${timestamp},v1=${signature}`;

  console.log('\n📤 HTTP Request:');
  code(`POST /api/webhook HTTP/1.1
Host: enem-pro.com
Content-Type: application/json
Content-Length: ${Buffer.byteLength(body)}
stripe-signature: ${stripeSignatureHeader}

${body}`);

  console.log('\n🔑 Signature Details:');
  code(`Timestamp: ${timestamp}
Signature: ${signature}
Signed Content: "${timestamp}.${body.substring(0, 50)}..."`);

  console.log('\n📋 curl Command:');
  code(`curl -X POST https://enem-pro.com/api/webhook \\
  -H "Content-Type: application/json" \\
  -H "stripe-signature: ${stripeSignatureHeader}" \\
  -d '${body}'`);

  console.log('\n✅ Expected Response:');
  code(`HTTP/1.1 200 OK
Content-Type: application/json

{"ok": true}`);
}

/**
 * Example 2: Stripe Webhook - Subscription Updated
 */
function exampleStripeSubscriptionUpdated() {
  section('Stripe: Customer Subscription Updated');

  const stripeSecret = 'whsec_test_abc123def456xyz789';
  const body = JSON.stringify({
    id: 'evt_9876543210',
    object: 'event',
    api_version: '2024-10-15',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'sub_test_xyz789',
        object: 'subscription',
        customer: 'cus_test_abc123',
        current_period_end: Math.floor(Date.now() / 1000) + 2592000,
        current_period_start: Math.floor(Date.now() / 1000),
        metadata: {
          user_id: 'user_123abc',
        },
        status: 'active',
      },
      previous_attributes: {
        status: 'incomplete',
      },
    },
    livemode: false,
    pending_webhooks: 0,
    request: {
      id: null,
      idempotency_key: null,
    },
    type: 'customer.subscription.updated',
  });

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signedContent = `${timestamp}.${body}`;
  const signature = crypto
    .createHmac('sha256', stripeSecret)
    .update(signedContent)
    .digest('hex');

  const stripeSignatureHeader = `t=${timestamp},v1=${signature}`;

  console.log('\n📤 HTTP Request:');
  code(`POST /api/webhook HTTP/1.1
Host: enem-pro.com
Content-Type: application/json
stripe-signature: ${stripeSignatureHeader}

${body}`);

  console.log('\n📋 curl Command:');
  code(`curl -X POST https://enem-pro.com/api/webhook \\
  -H "Content-Type: application/json" \\
  -H "stripe-signature: ${stripeSignatureHeader}" \\
  -d '${body}'`);
}

/**
 * Example 3: Anthropic Webhook - Message Completed
 */
function exampleAnthropicMessageCompleted() {
  section('Anthropic: Message Completed');

  const token = 'webhook_token_secret_xyz123';

  const body = JSON.stringify({
    type: 'message.completed',
    created_at: new Date().toISOString(),
    data: {
      id: 'msg_test_123abc',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: 'This is a generated explanation for ENEM question.',
        },
      ],
      model: 'claude-3-5-sonnet-20241022',
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: 256,
        output_tokens: 512,
      },
    },
  });

  console.log('\n📤 HTTP Request:');
  code(`POST /api/webhooks/anthropic HTTP/1.1
Host: enem-pro.com
Content-Type: application/json
Authorization: Bearer ${token}
Content-Length: ${Buffer.byteLength(body)}

${body}`);

  console.log('\n🔑 Token:');
  code(`Bearer: ${token}`);

  console.log('\n📋 curl Command:');
  code(`curl -X POST https://enem-pro.com/api/webhooks/anthropic \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  -d '${body}'`);

  console.log('\n✅ Expected Response:');
  code(`HTTP/1.1 200 OK
Content-Type: application/json

{"ok": true}`);
}

/**
 * Example 4: Anthropic Webhook - Batch Completed
 */
function exampleAnthropicBatchCompleted() {
  section('Anthropic: Batch Processing Completed');

  const token = 'webhook_token_secret_xyz123';

  const body = JSON.stringify({
    type: 'batch.completed',
    created_at: new Date().toISOString(),
    data: {
      id: 'batch_test_789def',
      type: 'batch',
      status: 'completed',
      request_counts: {
        processing: 0,
        succeeded: 100,
        failed: 2,
        expired: 0,
      },
      message_counts: {
        total: 102,
        processing: 0,
        succeeded: 100,
        failed: 2,
      },
      created_at: new Date(Date.now() - 3600000).toISOString(),
      expires_at: new Date(Date.now() + 604800000).toISOString(),
      completed_at: new Date().toISOString(),
    },
  });

  console.log('\n📤 HTTP Request:');
  code(`POST /api/webhooks/anthropic HTTP/1.1
Host: enem-pro.com
Content-Type: application/json
Authorization: Bearer ${token}

${body}`);

  console.log('\n📋 curl Command:');
  code(`curl -X POST https://enem-pro.com/api/webhooks/anthropic \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  -d '${body}'`);
}

/**
 * Example 5: Invalid Request (Should Return 401)
 */
function exampleInvalidStripe() {
  section('Stripe: Invalid Signature (REJECTED)');

  const body = JSON.stringify({
    id: 'evt_fake_999',
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_fake' } },
  });

  const invalidSignature = 't=1234567890,v1=0000000000000000000000000000000000000000000000000000000000000000';

  console.log('\n📤 HTTP Request:');
  code(`POST /api/webhook HTTP/1.1
Host: enem-pro.com
Content-Type: application/json
stripe-signature: ${invalidSignature}

${body}`);

  console.log('\n❌ Expected Response (401 Unauthorized):');
  code(`HTTP/1.1 401 Unauthorized
Content-Type: application/json

{"error": "Webhook signature verification failed"}`);

  console.log('\n📋 curl Command:');
  code(`curl -X POST https://enem-pro.com/api/webhook \\
  -H "Content-Type: application/json" \\
  -H "stripe-signature: ${invalidSignature}" \\
  -d '${body}'`);
}

/**
 * Example 6: Invalid Anthropic Token
 */
function exampleInvalidAnthropicToken() {
  section('Anthropic: Invalid Token (REJECTED)');

  const body = JSON.stringify({
    type: 'message.completed',
    created_at: new Date().toISOString(),
    data: { id: 'msg_fake_999' },
  });

  const wrongToken = 'wrong_token_xyz';

  console.log('\n📤 HTTP Request:');
  code(`POST /api/webhooks/anthropic HTTP/1.1
Host: enem-pro.com
Content-Type: application/json
Authorization: Bearer ${wrongToken}

${body}`);

  console.log('\n❌ Expected Response (401 Unauthorized):');
  code(`HTTP/1.1 401 Unauthorized
Content-Type: application/json

{"error": "Webhook signature verification failed"}`);

  console.log('\n📋 curl Command:');
  code(`curl -X POST https://enem-pro.com/api/webhooks/anthropic \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${wrongToken}" \\
  -d '${body}'`);
}

/**
 * Testing Instructions
 */
function testingInstructions() {
  section('Testing Instructions');

  console.log('\n1️⃣  Setup Environment:');
  code(`export STRIPE_WEBHOOK_SECRET="whsec_test_abc123def456xyz789"
export ANTHROPIC_WEBHOOK_TOKEN="webhook_token_secret_xyz123"`);

  console.log('\n2️⃣  Start Development Server:');
  code(`npm run dev`);

  console.log('\n3️⃣  Run Test Script:');
  code(`node scripts/test-webhooks.js`);

  console.log('\n4️⃣  Or Use Examples Below:');
  console.log('Copy any of the curl commands below and paste into a terminal.\n');

  console.log('\n5️⃣  Check Logs:');
  code(`tail -f .logs/app.log | grep webhook`);

  console.log('\n6️⃣  Verify Signature Locally (Python):');
  code(`python3 << 'EOF'
import hmac
import hashlib
import json
import time

secret = "whsec_test_abc123def456xyz789"
body = json.dumps({"id": "evt_123", "type": "checkout.session.completed"})
timestamp = str(int(time.time()))

signed_content = f"{timestamp}.{body}"
signature = hmac.new(secret.encode(), signed_content.encode(), hashlib.sha256).hexdigest()
print(f"t={timestamp},v1={signature}")
EOF`);
}

/**
 * Main
 */
function main() {
  header('WEBHOOK SIGNATURE EXAMPLES & TEST CASES');

  console.log(`${colors.green}This document shows real webhook examples with valid signatures
for testing Stripe and Anthropic webhook validation.${colors.reset}\n`);

  // Stripe Examples
  exampleStripeCheckout();
  exampleStripeSubscriptionUpdated();

  // Anthropic Examples
  exampleAnthropicMessageCompleted();
  exampleAnthropicBatchCompleted();

  // Invalid Examples
  exampleInvalidStripe();
  exampleInvalidAnthropicToken();

  // Testing Instructions
  testingInstructions();

  console.log(`\n${colors.green}✓ Examples generated successfully!${colors.reset}\n`);
}

main();
