/**
 * Mint an ERC-8004 agent identity on Base Sepolia for CASE.
 *
 * Usage (from Mini, where .case-wallet.env lives):
 *   CASE_WALLET_PRIVATE_KEY=0x... tsx scripts/mint-identity.ts
 *
 * Or set CASE_WALLET_PRIVATE_KEY in your environment before running.
 */

import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'

const PRIVATE_KEY = process.env.CASE_WALLET_PRIVATE_KEY as `0x${string}`
if (!PRIVATE_KEY) throw new Error('CASE_WALLET_PRIVATE_KEY env var required')

const IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as const

const REGISTER_ABI = [
  {
    name: 'register',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'agentURI', type: 'string' }],
    outputs: [{ name: 'agentId', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

const account = privateKeyToAccount(PRIVATE_KEY)

const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(),
})

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
})

// Agent card metadata — stored inline as a data URI for the demo.
// In production this would be an IPFS URI.
const agentCard = {
  name: 'CASE',
  description: 'Claude Code agent. Synthesis monitor and onchain operator.',
  version: '1.0.0',
  address: account.address,
  capabilities: ['mcp', 'synthesis', 'onchain-queries'],
  mcpEndpoint: 'http://localhost:3000',
  created: new Date().toISOString(),
}

const agentURI = `data:application/json;base64,${Buffer.from(JSON.stringify(agentCard)).toString('base64')}`

console.log(`\nMinting ERC-8004 identity for CASE`)
console.log(`Address: ${account.address}`)
console.log(`Registry: ${IDENTITY_REGISTRY} (Base Sepolia)\n`)

// Check if already registered
const balance = await publicClient.readContract({
  address: IDENTITY_REGISTRY,
  abi: REGISTER_ABI,
  functionName: 'balanceOf',
  args: [account.address],
})

if (balance > 0n) {
  console.log(`Already registered. Balance: ${balance} identity token(s).`)
  process.exit(0)
}

// Simulate first
await publicClient.simulateContract({
  address: IDENTITY_REGISTRY,
  abi: REGISTER_ABI,
  functionName: 'register',
  args: [agentURI],
  account,
})

console.log('Simulation passed. Sending transaction...')

const hash = await walletClient.writeContract({
  address: IDENTITY_REGISTRY,
  abi: REGISTER_ABI,
  functionName: 'register',
  args: [agentURI],
})

console.log(`Transaction: ${hash}`)
console.log(`Tracking: https://sepolia.basescan.org/tx/${hash}\n`)

console.log('Waiting for confirmation...')
const receipt = await publicClient.waitForTransactionReceipt({ hash })
console.log(`Confirmed in block ${receipt.blockNumber}`)
console.log(`\nCASE has an ERC-8004 identity on Base Sepolia.`)
