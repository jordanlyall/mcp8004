import { randomBytes } from 'crypto'
import { verifyMessage, createPublicClient, http } from 'viem'
import { baseSepolia, base } from 'viem/chains'
import type { Address, Chain } from 'viem'
import jwt from 'jsonwebtoken'

// ─── Contract Addresses ───────────────────────────────────────────────────────

const IDENTITY_REGISTRY: Record<number, Address> = {
  84532: '0x8004A818BFB912233c491871b3d84c89A494BD9e', // Base Sepolia
  8453:  '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432', // Base Mainnet
}

const IDENTITY_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthMiddlewareOptions {
  /** Chain ID. Defaults to Base Sepolia (84532). Use 8453 for Base mainnet. */
  chainId?: 84532 | 8453
  /** Minimum reputation score to grant tools:all scope. Defaults to 0 (identity check only). */
  reputationThreshold?: number
  /** Allow agents without ERC-8004 identity to authenticate via x402 payment. */
  allowX402Fallback?: boolean
  /** JWT secret. Required in production. */
  jwtSecret?: string
  /** JWT TTL. Defaults to '1h'. */
  jwtTtl?: string
}

export interface SessionPayload {
  sub: string
  hasIdentity: boolean
  scopes: string[]
}

export interface AuthResult {
  token: string
  hasIdentity: boolean
  scopes: string[]
}

// ─── Challenge Store ──────────────────────────────────────────────────────────

const challenges = new Map<string, { message: string; expiresAt: number }>()

/** Generate a one-time challenge message for an agent address to sign. */
export function createChallenge(address: string): string {
  const nonce = randomBytes(16).toString('hex')
  const expiresAt = Date.now() + 5 * 60 * 1000
  const message = [
    'Sign this message to authenticate with mcp8004.',
    '',
    `Address: ${address.toLowerCase()}`,
    `Nonce: ${nonce}`,
    `Expires: ${new Date(expiresAt).toISOString()}`,
  ].join('\n')

  challenges.set(address.toLowerCase(), { message, expiresAt })
  return message
}

function consumeChallenge(address: string): string | null {
  const key = address.toLowerCase()
  const c = challenges.get(key)
  if (!c || Date.now() > c.expiresAt) { challenges.delete(key); return null }
  challenges.delete(key)
  return c.message
}

// ─── Core Verification ────────────────────────────────────────────────────────

/** Verify a wallet signature against a previously issued challenge. */
export async function verifyAgentSignature(address: string, signature: string): Promise<Address> {
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

/** Check whether an address holds an ERC-8004 identity on the given chain. */
export async function hasERC8004Identity(address: Address, chainId: 84532 | 8453 = 84532): Promise<boolean> {
  const registryAddress = IDENTITY_REGISTRY[chainId]
  if (!registryAddress) throw new Error(`No Identity Registry for chainId ${chainId}`)

  const chain: Chain = chainId === 8453 ? base : baseSepolia
  const client = createPublicClient({ chain, transport: http() })

  const balance = await client.readContract({
    address: registryAddress,
    abi: IDENTITY_ABI,
    functionName: 'balanceOf',
    args: [address],
  })
  return balance > 0n
}

/** Issue a scoped JWT session token. */
export function issueSessionToken(
  address: Address,
  hasIdentity: boolean,
  options: Pick<AuthMiddlewareOptions, 'jwtSecret' | 'jwtTtl'> = {}
): string {
  const secret = options.jwtSecret ?? 'dev-secret-change-in-production'
  const scopes = hasIdentity ? ['tools:all'] : ['tools:public']
  return jwt.sign(
    { sub: address.toLowerCase(), hasIdentity, scopes } satisfies SessionPayload,
    secret,
    { expiresIn: (options.jwtTtl ?? '1h') as jwt.SignOptions['expiresIn'] }
  )
}

/** Verify a session token and return its payload. Throws if invalid or expired. */
export function verifySessionToken(token: string, jwtSecret?: string): SessionPayload {
  return jwt.verify(token, jwtSecret ?? 'dev-secret-change-in-production') as SessionPayload
}

// ─── Drop-in Middleware ───────────────────────────────────────────────────────

/**
 * Full auth flow: verify signature → check ERC-8004 identity → issue token.
 *
 * @example
 * const result = await verifyAgentIdentity(address, signature, { chainId: 84532 })
 * // result.token — JWT to use for subsequent MCP tool calls
 * // result.hasIdentity — true if agent holds an ERC-8004 NFT
 * // result.scopes — ['tools:all'] or ['tools:public']
 */
export async function verifyAgentIdentity(
  address: string,
  signature: string,
  options: AuthMiddlewareOptions = {}
): Promise<AuthResult> {
  const { chainId = 84532, jwtSecret, jwtTtl } = options

  const verified = await verifyAgentSignature(address, signature)
  const hasIdentity = await hasERC8004Identity(verified, chainId)
  const token = issueSessionToken(verified, hasIdentity, { jwtSecret, jwtTtl })

  return { token, hasIdentity, scopes: hasIdentity ? ['tools:all'] : ['tools:public'] }
}

/**
 * Validate a Bearer token in a gated MCP tool handler.
 *
 * @example
 * mcp.tool('my_tool', 'Description', { token: z.string() }, async ({ token }) => {
 *   const session = requireAuth(`Bearer ${token}`, { scope: 'tools:all' })
 *   // proceed with authenticated session
 * })
 */
export function requireAuth(
  authHeader: string | undefined,
  options: { scope?: 'tools:all' | 'tools:public'; jwtSecret?: string } = {}
): SessionPayload {
  if (!authHeader) throw new Error('Missing Authorization header')
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
  const session = verifySessionToken(token, options.jwtSecret)

  if (options.scope === 'tools:all' && !session.scopes.includes('tools:all')) {
    throw new Error('This tool requires an ERC-8004 agent identity')
  }
  return session
}
