import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { z } from 'zod'
import { createChallenge } from './auth/challenge.js'
import { verifySignature, hasERC8004Identity, issueToken } from './auth/verify.js'
import { requireAuth } from './middleware/gate.js'

const PORT = parseInt(process.env.PORT ?? '3000')

// ─── HTTP Auth Server ────────────────────────────────────────────────────────
// Handles the challenge/sign/verify flow before the MCP session starts.

const app = new Hono()

/**
 * GET /challenge?address=0x...
 * Returns a message for the agent to sign with its wallet.
 */
app.get('/challenge', (c) => {
  const address = c.req.query('address')
  if (!address) return c.json({ error: 'address query param required' }, 400)
  const message = createChallenge(address)
  return c.json({ message })
})

/**
 * POST /auth
 * Body: { address: string, signature: string }
 * Returns: { token, hasIdentity, scopes }
 */
app.post('/auth', async (c) => {
  let body: { address?: string; signature?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const { address, signature } = body
  if (!address || !signature) {
    return c.json({ error: 'address and signature required' }, 400)
  }

  const verified = await verifySignature(address, signature).catch((err: Error) =>
    c.json({ error: err.message }, 401)
  )
  if (!verified || typeof verified !== 'string') return verified as Response

  const identity = await hasERC8004Identity(verified)
  const token = issueToken(verified, identity)

  return c.json({
    token,
    hasIdentity: identity,
    scopes: identity ? ['tools:all'] : ['tools:public'],
  })
})

app.get('/health', (c) => c.json({ ok: true, version: '0.1.0' }))

serve({ fetch: app.fetch, port: PORT }, () => {
  console.error(`mcp8004 auth server listening on http://localhost:${PORT}`)
})

// ─── MCP Server ───────────────────────────────────────────────────────────────
// Tools require a session token obtained from the HTTP auth flow above.
// Pass the token in the `token` argument until HTTP transport is wired in week 2.

const mcp = new McpServer({
  name: 'mcp8004-demo',
  version: '0.1.0',
})

/** Public — no auth required */
mcp.tool('ping', 'Health check', {}, async () => ({
  content: [{ type: 'text', text: 'pong' }],
}))

/** Gated — requires valid session token with any scope */
mcp.tool(
  'whoami',
  'Return authenticated agent info. Requires a valid session token from mcp8004 /auth.',
  { token: z.string().describe('Bearer token from POST /auth') },
  async ({ token }) => {
    const session = requireAuth(`Bearer ${token}`)
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(
          { address: session.sub, hasIdentity: session.hasIdentity, scopes: session.scopes },
          null,
          2
        ),
      }],
    }
  }
)

/** Gated — requires ERC-8004 identity (tools:all scope) */
mcp.tool(
  'identity_tools',
  'Access tools reserved for registered ERC-8004 agents.',
  { token: z.string().describe('Bearer token from POST /auth') },
  async ({ token }) => {
    const session = requireAuth(`Bearer ${token}`, { scope: 'tools:all' })
    return {
      content: [{
        type: 'text',
        text: `Access granted for registered agent ${session.sub}. This is where premium tools would live.`,
      }],
    }
  }
)

const transport = new StdioServerTransport()
await mcp.connect(transport)
