# mcp8004

**When your agent calls another agent's MCP server, how does that server know your agent is who it says it is?**

Right now it doesn't. It trusts a hardcoded API key, or it trusts nothing at all.

mcp8004 fixes that. Drop-in auth middleware for MCP servers that verifies agent identity using [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) onchain — no keys to manage, no accounts to create, no OAuth to implement.

```bash
npm install mcp8004
```

---

## The Problem

Agent A wants to call Agent B's MCP server. B needs to know:

- Is A a registered agent with a real onchain identity?
- Does A have enough reputation to access premium tools?
- Can I revoke A's access without changing my API key for everyone?

None of this is possible today. Agents either share a key or get in. There's no middle ground.

---

## How mcp8004 Works

Agent A signs a challenge with its wallet. Server B checks [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) on Base — a live registry of 107K onchain agent identities. If A is registered, B issues a scoped session token. If not, A can still authenticate by paying per-request via [x402](https://www.x402.org/).

```
Agent A  →  GET /challenge           nonce issued
Agent A      signs with wallet       EIP-191, no key required
Agent A  →  POST /auth               { address, signature }
Server B     ERC-8004 on Base        is this agent registered?
Server B  →  scoped JWT              tools:all or tools:public
Agent A      calls MCP tools         bearer token, 1 hour TTL
```

The wallet address is the identity. The signature is the proof. The registry is Base.

---

## Quick Start

```typescript
import { authMiddleware } from 'mcp8004'

// One line. Works with any MCP server.
server.use(authMiddleware({
  chainId: 84532,            // Base Sepolia (8453 for mainnet)
  reputationThreshold: 0,    // raise this to gate on ERC-8004 reputation score
  allowX402Fallback: true,   // unregistered agents pay per-request in USDC
}))
```

Gate specific tools to verified agents only:

```typescript
import { requireAuth } from 'mcp8004'

mcp.tool('premium_tool', 'Registered agents only', { token: z.string() }, async ({ token }) => {
  const session = requireAuth(`Bearer ${token}`, { scope: 'tools:all' })
  // session.sub         — verified agent wallet address
  // session.hasIdentity — confirmed on ERC-8004, Base
  // session.scopes      — ['tools:all'] or ['tools:public']
})
```

---

## Give Your Agent an Onchain Identity

```bash
# Fund your agent's wallet with Base Sepolia ETH (faucet.base.org)
# Then register on ERC-8004:

AGENT_PRIVATE_KEY=0x... npx tsx scripts/mint-identity.ts

# Agent is now registered on ERC-8004 Identity Registry
# Any mcp8004 server will recognize it
```

Or register via the [ERC-8004 contracts](https://github.com/erc-8004/erc-8004-contracts) directly.

---

## Demo

CASE — an autonomous agent running on a Mac Mini — authenticating to an mcp8004 server using its ERC-8004 identity on Base Sepolia:

```
Agent address: 0x342bEc739F252387Ae3131F1570E2109A3161610

1. Challenge issued   → nonce: b6d1b72f3ec0e71b...
2. Wallet signed      → 0x96f5bbac5a422ced45...
3. ERC-8004 verified  → hasIdentity: true
4. Token issued       → scopes: ["tools:all"]
```

[View identity registration on Basescan →](https://sepolia.basescan.org/tx/0x2b3488d345e49b8545fec87c2b85c672b8ab440fa2ab34419f7ffe3f9f6fff24)

---

## API

| Function | Description |
|----------|-------------|
| `createChallenge(address)` | Issue a one-time nonce for an agent to sign |
| `verifyAgentSignature(address, sig)` | Verify EIP-191 signature against stored nonce |
| `hasERC8004Identity(address, chainId?)` | Check ERC-8004 Identity Registry on Base |
| `issueSessionToken(address, hasIdentity)` | Issue scoped JWT (`tools:all` or `tools:public`) |
| `verifyAgentIdentity(address, sig, opts?)` | Full auth flow in one call |
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

- [ERC-8004 spec](https://eips.ethereum.org/EIPS/eip-8004) — onchain agent identity standard
- [awesome-erc8004](https://github.com/sudeepb02/awesome-erc8004) — ecosystem
- [x402 protocol](https://www.x402.org/) — payment-as-authentication
- [MCP auth spec](https://modelcontextprotocol.io/specification/draft/basic/authorization)
- [mcp8004.xyz](https://mcp8004.xyz)

---

MIT · [Jordan Lyall](https://x.com/JordanLyall)
