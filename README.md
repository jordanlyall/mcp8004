# mcp8004

**Your AI agent just authenticated to an MCP server using its onchain identity. No API key. No OAuth. The wallet IS the credential.**

```bash
npm install mcp8004
```

---

## Before / After

**Before — every agent framework, right now:**

```bash
# .env
OPENAI_API_KEY=sk-proj-a8f2...        # leaked on GitHub
ANTHROPIC_API_KEY=sk-ant-api03-X...   # leaked on GitHub  
WALLET_PRIVATE_KEY=0xac0974bec3...    # leaked on GitHub
```

29M hardcoded secrets exposed on GitHub last year. AI credential leaks up 81% YoY.

**After — mcp8004:**

```typescript
import { authMiddleware } from 'mcp8004'

server.use(authMiddleware({ chainId: 84532 }))
```

Agent signs a challenge with its wallet. Server checks the [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) Identity Registry on Base. Issues a scoped JWT. Done.

---

## How It Works

```
1. Agent   →  GET /challenge           server issues nonce + timestamp
2. Agent      signs with wallet        EIP-191 signature, no key required
3. Agent   →  POST /auth               { address, signature }
4. Server     readContract()           ERC-8004 Identity Registry on Base
5. Server  →  JWT session token        scopes: ["tools:all"]
6. Agent      calls MCP tools          Bearer token on every request
```

No key. No account. No OAuth dance. The wallet address is the identity. The signature is the proof.

Agents without an ERC-8004 identity? They authenticate via [x402](https://www.x402.org/) payment — same wallet, pay per-request in USDC.

---

## Demo

```
Test agent address: 0x342bEc739F252387Ae3131F1570E2109A3161610

1. Requesting challenge...
   Nonce: b6d1b72f3ec0e71b72761db3fe41bb7a
   Expires: 2026-04-02T18:00:27.093Z

2. Signing with wallet...
   Signature: 0x96f5bbac5a422ced45...

3. Authenticating...
   hasIdentity: true
   scopes: tools:all
   token: eyJhbGciOiJIUzI1NiIs...

Handshake complete.
```

[Basescan: CASE identity minted on Base Sepolia →](https://sepolia.basescan.org/tx/0x2b3488d345e49b8545fec87c2b85c672b8ab440fa2ab34419f7ffe3f9f6fff24)

---

## Quick Start

```typescript
import { authMiddleware } from 'mcp8004'

// Wrap your existing MCP server. That's it.
server.use(authMiddleware({
  chainId: 84532,            // Base Sepolia (8453 for mainnet)
  reputationThreshold: 0,    // min ERC-8004 reputation score
  allowX402Fallback: true,   // unregistered agents pay per-request
}))
```

Gate individual tools:

```typescript
import { requireAuth } from 'mcp8004'

mcp.tool('premium_tool', 'Requires agent identity', { token: z.string() }, async ({ token }) => {
  const session = requireAuth(`Bearer ${token}`, { scope: 'tools:all' })
  // session.sub         — agent wallet address
  // session.hasIdentity — confirmed via ERC-8004 on Base
  // session.scopes      — ['tools:all'] or ['tools:public']
})
```

---

## Give Your Agent an Identity

```bash
# 1. Generate a wallet for your agent
# 2. Fund with Base Sepolia ETH (faucet.base.org)
# 3. Register on ERC-8004

AGENT_PRIVATE_KEY=0x... npx tsx scripts/mint-identity.ts

# → Transaction confirmed
# → Agent is registered on ERC-8004 Identity Registry
# → Ready to authenticate to any mcp8004 server
```

Or register via the [ERC-8004 contracts](https://github.com/erc-8004/erc-8004-contracts) directly.

---

## API

| Function | Description |
|----------|-------------|
| `createChallenge(address)` | Issue a one-time nonce for an agent to sign |
| `verifyAgentSignature(address, sig)` | Verify EIP-191 signature against stored challenge |
| `hasERC8004Identity(address, chainId?)` | Check ERC-8004 Identity Registry on Base |
| `issueSessionToken(address, hasIdentity)` | Issue scoped JWT (`tools:all` or `tools:public`) |
| `verifyAgentIdentity(address, sig, opts?)` | Full flow in one call |
| `requireAuth(header, opts?)` | Validate Bearer token in a gated tool handler |

---

## Contract Addresses

| Network | Address |
|---------|---------|
| Base Sepolia | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| Base Mainnet | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |

Read-only. No new contracts to deploy.

---

## Roadmap

| Version | Status |
|---------|--------|
| v0.1.0 — Identity verification + JWT session tokens | shipped |
| v0.2.0 — x402 payment auth + hosted verification API | next |
| v0.3.0 — Reputation Registry gating | planned |

---

## Resources

- [ERC-8004 spec](https://eips.ethereum.org/EIPS/eip-8004) — the onchain agent identity standard
- [awesome-erc8004](https://github.com/sudeepb02/awesome-erc8004) — ecosystem resources
- [x402 protocol](https://www.x402.org/) — payment-as-authentication
- [MCP auth spec](https://modelcontextprotocol.io/specification/draft/basic/authorization) — the OAuth 2.1 world this bridges
- [mcp8004.xyz](https://mcp8004.xyz) — docs + hosted API

---

MIT · [Jordan Lyall](https://x.com/JordanLyall)
