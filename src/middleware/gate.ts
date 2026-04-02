import { verifyToken, type SessionPayload } from '../auth/verify.js'

export interface GateOptions {
  scope?: 'tools:all' | 'tools:public'
}

/**
 * Validate a Bearer token and optionally check for a required scope.
 * Call this at the top of any gated MCP tool handler.
 */
export function requireAuth(authHeader: string | undefined, options: GateOptions = {}): SessionPayload {
  if (!authHeader) throw new Error('Missing Authorization header')

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
  const session = verifyToken(token)

  if (options.scope === 'tools:all' && !session.scopes.includes('tools:all')) {
    throw new Error('This tool requires an ERC-8004 agent identity')
  }

  return session
}
