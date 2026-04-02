# mcp8004

Replace API keys with onchain identity for AI agents. Drop-in auth middleware for MCP servers using [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) on Base.

```bash
npm install mcp8004
```

---

## The Problem

Every agent framework loads API keys from `.env` files. No scoping, no rotation, no audit trail. An agent that needs read access holds a key that grants full permissions. GitGuardian found 29M hardcoded secrets exposed on GitHub last year. AI credential leaks are up 81% YoY.

The fix isn't better key management. It's eliminating keys entirely.

## How It Works

An agent's wallet can serve as its universal credential. The wallet address is the identity. The signature is the proof. [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) is the registry.

```
Agent → GET /challenge          # server issues nonce
Agent signs with wallet          # EIP-191 signature
Agent → POST /auth              # address + signature
Server → ERC-8004 Identity Registry on Base
Server → issues scoped JWT session token
Agent calls MCP tools with token
```

Agents without an ERC-8004 identity can authenticate via [x402](https://www.x402.org/) payment fallback.

---

## Quick Start

```typescript
import { authMiddleware } from 'mcp8004'

server.use(authMiddleware({
  chainId: 84532,            // Base Sepolia (use 8453 for mainnet)
  reputationThreshold: 0,    // minimum ERC-8004 reputation score
  allowX402Fallback: true,   // allow payment auth for unregistered agents
}))
```

That's it. Existing MCP server, existing tools. One import, one middleware call.

---

## API

### `createChallenge(address: string): string`
Generate a one-time challenge message for an agent to sign.

### `verifyAgentSignature(address, signature): Promise<Address>`
Verify a wallet signature against the stored challenge.

### `hasERC8004Identity(address, chainId?): Promise<boolean>`
Check whether an address holds an ERC-8004 identity on Base.

### `issueSessionToken(address, hasIdentity, options?): string`
Issue a scoped JWT. Agents with identity get `tools:all`. Others get `tools:public`.

### `verifyAgentIdentity(address, signature, options?): Promise<AuthResult>`
Full flow in one call: verify signature → check ERC-8004 → issue token.

### `requireAuth(authHeader, options?): SessionPayload`
Validate a Bearer token in a gated MCP tool handler.

```typescript
mcp.tool('my_tool', 'Description', { token: z.string() }, async ({ token }) => {
  const session = requireAuth(`Bearer ${token}`, { scope: 'tools:all' })
  // session.sub      — agent wallet address
  // session.hasIdentity — true if ERC-8004 identity confirmed
  // session.scopes   — ['tools:all'] or ['tools:public']
})
```

---

## Contract Addresses

| Network | Contract | Address |
|---------|----------|---------|
| Base Sepolia | Identity Registry | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| Base Mainnet | Identity Registry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |

Read-only interaction only. No new contracts to deploy.

---

## Register an Agent Identity

```bash
# Fund the agent address with Base Sepolia ETH, then:
CASE_WALLET_PRIVATE_KEY=0x... npx tsx scripts/mint-identity.ts
```

Or register directly via the [ERC-8004 contracts](https://github.com/erc-8004/erc-8004-contracts).

---

## Hosted Verification API

Don't want to run your own verification? Use the hosted endpoint:

```
POST https://mcp8004.xyz/api/verify
{ address, signature }
→ { token, hasIdentity, scopes }
```

Metered at $0.001/verification via x402 (USDC on Base). Coming in v0.2.0.

---

## Roadmap

- **v0.1.0** — Identity verification + JWT session tokens (shipped)
- **v0.2.0** — x402 payment auth fallback + hosted API
- **v0.3.0** — Reputation Registry gating

---

## Resources

- [ERC-8004 spec](https://eips.ethereum.org/EIPS/eip-8004)
- [awesome-erc8004](https://github.com/sudeepb02/awesome-erc8004)
- [x402 protocol](https://www.x402.org/)
- [MCP auth spec](https://modelcontextprotocol.io/specification/draft/basic/authorization)
- [mcp8004.xyz](https://mcp8004.xyz)

---

MIT License · Jordan Lyall · [@JordanLyall](https://x.com/JordanLyall)
