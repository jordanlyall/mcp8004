/**
 * Week 1 handshake test.
 * Simulates an agent: get challenge → sign → exchange for token → call gated tool.
 *
 * Usage:
 *   BYPASS_IDENTITY=true tsx scripts/test-handshake.ts
 *
 * Requires a running server: npm run dev (in another terminal)
 */

import { privateKeyToAccount } from 'viem/accounts'

const BASE_URL = 'http://localhost:3000'

// Test wallet — NEVER use a real wallet with funds here
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const account = privateKeyToAccount(TEST_PRIVATE_KEY)

console.log(`\nTest agent address: ${account.address}\n`)

// Step 1: Get challenge
console.log('1. Requesting challenge...')
const challengeRes = await fetch(`${BASE_URL}/challenge?address=${account.address}`)
const { message } = await challengeRes.json() as { message: string }
console.log(`   Message to sign:\n${message.split('\n').map(l => `   ${l}`).join('\n')}\n`)

// Step 2: Sign with wallet
console.log('2. Signing with wallet...')
const signature = await account.signMessage({ message })
console.log(`   Signature: ${signature.slice(0, 20)}...\n`)

// Step 3: Exchange for session token
console.log('3. Authenticating...')
const authRes = await fetch(`${BASE_URL}/auth`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ address: account.address, signature }),
})
const auth = await authRes.json() as { token: string; hasIdentity: boolean; scopes: string[] }
console.log(`   hasIdentity: ${auth.hasIdentity}`)
console.log(`   scopes: ${auth.scopes.join(', ')}`)
console.log(`   token: ${auth.token.slice(0, 30)}...\n`)

console.log('Handshake complete.')
console.log(`\nUse this token in the whoami MCP tool:\n${auth.token}`)
