#!/usr/bin/env node

/**
 * Generate a secure webhook secret key
 * Usage: node scripts/generate-webhook-secret.js
 */

import crypto from 'crypto';

console.log('🔐 Generating Webhook Secret Key...\n');

// Generate a 32-byte (256-bit) random secret
const secret = crypto.randomBytes(32).toString('hex');

console.log('✅ Generated Webhook Secret:');
console.log(`WEBHOOK_SECRET=${secret}\n`);

console.log('📋 Add this to your .env.local file:');
console.log(`WEBHOOK_SECRET=${secret}\n`);

console.log('🔒 Security Notes:');
console.log('- Keep this secret secure and never commit it to version control');
console.log('- Use different secrets for development and production');
console.log('- Rotate this secret regularly for security');
