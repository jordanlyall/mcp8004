import { verifyMessage, createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'
import type { Address } from 'viem'
import jwt from 'jsonwebtoken'
import { consumeChallenge } from './challenge.js'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'

// ERC-8004 contract addresses — Base Sepolia
const IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as Address

const IDENTITY_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
})

export interface SessionPayload {
  sub: string
  hasIdentity: boolean
  scopes: string[]
}

/**
 * Step 1: Verify the wallet signature against the stored challenge.
 * Returns the verified address or throws.
 */
export async function verifySignature(address: string, signature: string): Promise<Address> {
  const message = consumeChallenge(address)
  if (!message) throw new Error('No valid challenge for this address — request a new one')

  const valid = await verifyMessage({
    address: address as Address,
    message,
    signature: signature as `0x${string}`,
  })

  if (!valid) throw new Error('Signature verification failed')
  return address as Address
}

/**
 * Step 2: Check whether the address holds an ERC-8004 agent identity on Base Sepolia.
 * Set BYPASS_IDENTITY=true in .env to skip this check during week 1 testing.
 */
export async function hasERC8004Identity(address: Address): Promise<boolean> {
  if (process.env.BYPASS_IDENTITY === 'true') return true

  const balance = await client.readContract({
    address: IDENTITY_REGISTRY,
    abi: IDENTITY_ABI,
    functionName: 'balanceOf',
    args: [address],
  })
  return balance > 0n
}

/**
 * Step 3: Issue a scoped JWT session token.
 * Agents with ERC-8004 identity get tools:all.
 * Agents without identity (x402 fallback path) get tools:public.
 */
export function issueToken(address: Address, hasIdentity: boolean): string {
  const scopes = hasIdentity ? ['tools:all'] : ['tools:public']
  return jwt.sign(
    { sub: address.toLowerCase(), hasIdentity, scopes } satisfies SessionPayload,
    JWT_SECRET,
    { expiresIn: '1h' }
  )
}

/**
 * Verify a session token and return the payload. Throws if invalid or expired.
 */
export function verifyToken(token: string): SessionPayload {
  return jwt.verify(token, JWT_SECRET) as SessionPayload
}
