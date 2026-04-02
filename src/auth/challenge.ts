import { randomBytes } from 'crypto'

interface Challenge {
  message: string
  expiresAt: number
}

// In-memory nonce store. One challenge per address, one-time use.
const store = new Map<string, Challenge>()

const TTL_MS = 5 * 60 * 1000 // 5 minutes

export function createChallenge(address: string): string {
  const nonce = randomBytes(16).toString('hex')
  const expiresAt = Date.now() + TTL_MS
  const message = [
    'Sign this message to authenticate with mcp8004.',
    '',
    `Address: ${address.toLowerCase()}`,
    `Nonce: ${nonce}`,
    `Expires: ${new Date(expiresAt).toISOString()}`,
  ].join('\n')

  store.set(address.toLowerCase(), { message, expiresAt })
  return message
}

export function consumeChallenge(address: string): string | null {
  const key = address.toLowerCase()
  const challenge = store.get(key)
  if (!challenge) return null
  if (Date.now() > challenge.expiresAt) {
    store.delete(key)
    return null
  }
  store.delete(key) // one-time use — prevents replay
  return challenge.message
}
