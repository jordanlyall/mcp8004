import React from 'react'
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion'
import { theme } from './theme'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fadeIn = (frame: number, start: number, duration = 8) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

const slideUp = (frame: number, start: number, distance = 18, duration = 10) =>
  interpolate(frame, [start, start + duration], [distance, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

// ─── Shared Components ────────────────────────────────────────────────────────

const Label: React.FC<{ children: React.ReactNode; opacity?: number }> = ({ children, opacity = 1 }) => (
  <div style={{
    fontFamily: theme.fontMono,
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    color: theme.amber,
    opacity,
    marginBottom: 20,
  }}>
    {children}
  </div>
)

const CodeLine: React.FC<{
  children: React.ReactNode
  opacity?: number
  translateY?: number
  dim?: boolean
  highlight?: boolean
}> = ({ children, opacity = 1, translateY = 0, dim, highlight }) => (
  <div style={{
    fontFamily: theme.fontMono,
    fontSize: 28,
    lineHeight: 1.7,
    color: dim ? theme.textDim : highlight ? theme.amber : theme.textSecondary,
    opacity,
    transform: `translateY(${translateY}px)`,
    transition: 'all 0.1s',
  }}>
    {children}
  </div>
)

// ─── Scene 1: The Problem (0–210 frames, 7s) ─────────────────────────────────

const SceneProblem: React.FC = () => {
  const frame = useCurrentFrame()

  const lines = [
    { text: 'OPENAI_API_KEY=sk-proj-a8f2...3kQp', delay: 8, danger: true },
    { text: 'ANTHROPIC_API_KEY=sk-ant-api03-X...', delay: 18, danger: true },
    { text: 'WALLET_PRIVATE_KEY=0xac0974bec3...', delay: 28, danger: true },
    { text: 'DATABASE_URL=postgres://prod:p@ss...', delay: 38, danger: true },
  ]

  const warningOpacity = fadeIn(frame, 65)
  const warningY = slideUp(frame, 65)

  return (
    <AbsoluteFill style={{ background: theme.bg, justifyContent: 'center', alignItems: 'center', padding: '0 160px' }}>
      <div style={{ width: '100%', maxWidth: 1100 }}>

        <Label opacity={fadeIn(frame, 0)}>The Problem</Label>

        {/* .env file card */}
        <div style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: '36px 44px',
          opacity: fadeIn(frame, 5),
          marginBottom: 40,
        }}>
          <div style={{
            fontFamily: theme.fontMono,
            fontSize: 18,
            color: theme.textDim,
            marginBottom: 20,
            letterSpacing: '0.1em',
          }}>
            .env
          </div>
          {lines.map(({ text, delay, danger }) => (
            <div key={text} style={{
              fontFamily: theme.fontMono,
              fontSize: 26,
              lineHeight: 1.8,
              color: danger ? theme.red : theme.textSecondary,
              opacity: fadeIn(frame, delay),
              transform: `translateX(${interpolate(frame, [delay, delay + 12], [-20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
            }}>
              {text}
            </div>
          ))}
        </div>

        {/* Warning */}
        <div style={{
          opacity: warningOpacity,
          transform: `translateY(${warningY}px)`,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <div style={{
            width: 6,
            height: 56,
            background: theme.red,
            borderRadius: 3,
            flexShrink: 0,
          }} />
          <div style={{
            fontFamily: theme.fontSans,
            fontSize: 30,
            fontWeight: 600,
            color: theme.textSecondary,
            lineHeight: 1.4,
          }}>
            29M secrets exposed on GitHub last year.{' '}
            <span style={{ color: theme.textMuted }}>AI credential leaks up 81% YoY.</span>
          </div>
        </div>

      </div>
    </AbsoluteFill>
  )
}

// ─── Scene 2: The Insight (210–420 frames, 7s) ───────────────────────────────

const SceneInsight: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const scale = spring({ fps, frame: frame - 6, config: { damping: 80, stiffness: 140 } })

  return (
    <AbsoluteFill style={{ background: theme.bg, justifyContent: 'center', alignItems: 'center', padding: '0 160px' }}>
      <div style={{ width: '100%', maxWidth: 1100 }}>

        <Label opacity={fadeIn(frame, 0)}>The Insight</Label>

        <div style={{
          borderLeft: `4px solid ${theme.amber}`,
          paddingLeft: 40,
          opacity: fadeIn(frame, 5),
          transform: `scale(${scale})`,
          transformOrigin: 'left center',
          marginBottom: 48,
        }}>
          <div style={{
            fontFamily: theme.fontSans,
            fontSize: 64,
            fontWeight: 700,
            color: theme.textPrimary,
            lineHeight: 1.2,
          }}>
            The wallet is already<br />
            a credential.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            { icon: '→', text: 'Address is the identity', delay: 25 },
            { icon: '→', text: 'Signature is the proof', delay: 40 },
            { icon: '→', text: 'ERC-8004 is the registry', delay: 55 },
          ].map(({ icon, text, delay }) => (
            <div key={text} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              opacity: fadeIn(frame, delay),
              transform: `translateX(${interpolate(frame, [delay, delay + 16], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
            }}>
              <span style={{ fontFamily: theme.fontMono, fontSize: 28, color: theme.amber }}>{icon}</span>
              <span style={{ fontFamily: theme.fontSans, fontSize: 30, color: theme.textSecondary, fontWeight: 500 }}>{text}</span>
            </div>
          ))}
        </div>

      </div>
    </AbsoluteFill>
  )
}

// ─── Scene 3: Auth Flow (420–690 frames, 9s) ─────────────────────────────────

const SceneAuthFlow: React.FC = () => {
  const frame = useCurrentFrame()

  const steps = [
    { label: '1  GET /challenge', detail: 'nonce + timestamp', color: theme.textSecondary, delay: 0 },
    { label: '2  sign(message)', detail: 'EIP-191 wallet signature', color: theme.amber, delay: 22 },
    { label: '3  POST /auth', detail: 'address + signature', color: theme.textSecondary, delay: 44 },
    { label: '4  ERC-8004 lookup', detail: 'Base Sepolia — 0x8004A818...', color: theme.green, delay: 66 },
    { label: '5  JWT issued', detail: 'scopes: ["tools:all"]', color: theme.amber, delay: 90 },
  ]

  const txOpacity = fadeIn(frame, 118)

  return (
    <AbsoluteFill style={{ background: theme.bg, justifyContent: 'center', alignItems: 'center', padding: '0 160px' }}>
      <div style={{ width: '100%', maxWidth: 1100 }}>

        <Label opacity={fadeIn(frame, 0)}>Auth Flow</Label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 44 }}>
          {steps.map(({ label, detail, color, delay }) => {
            const visible = fadeIn(frame, delay)
            return (
              <div key={label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
                opacity: visible,
              }}>
                <div style={{
                  fontFamily: theme.fontMono,
                  fontSize: 26,
                  color,
                  minWidth: 380,
                  fontWeight: 700,
                }}>
                  {label}
                </div>
                <div style={{
                  fontFamily: theme.fontMono,
                  fontSize: 22,
                  color: theme.textDim,
                }}>
                  // {detail}
                </div>
              </div>
            )
          })}
        </div>

        {/* Tx receipt */}
        <div style={{
          opacity: txOpacity,
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 10,
          padding: '20px 30px',
          display: 'flex',
          gap: 20,
          alignItems: 'center',
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: theme.green, flexShrink: 0 }} />
          <div style={{ fontFamily: theme.fontMono, fontSize: 20, color: theme.textMuted }}>
            <span style={{ color: theme.green }}>tx</span>
            {' '}0x2b3488d345e49b8545fec87c2b85c672b8ab440fa2ab34419f7ffe3f9f6fff24
          </div>
          <div style={{ marginLeft: 'auto', fontFamily: theme.fontMono, fontSize: 18, color: theme.textDim }}>
            Base Sepolia · block 39692097
          </div>
        </div>

      </div>
    </AbsoluteFill>
  )
}

// ─── Scene 4: Ship It (690–900 frames, 7s) ────────────────────────────────────

const SceneShip: React.FC = () => {
  const frame = useCurrentFrame()

  const lines = [
    { text: "import { authMiddleware } from 'mcp8004'", delay: 0, color: theme.textSecondary },
    { text: '', delay: 0, color: theme.textMuted },
    { text: 'server.use(authMiddleware({', delay: 12, color: theme.textSecondary },
    { text: '  chainId: 84532,', delay: 22, color: theme.green },
    { text: '  reputationThreshold: 0,', delay: 32, color: theme.green },
    { text: '  allowX402Fallback: true,', delay: 42, color: theme.green },
    { text: '}))', delay: 52, color: theme.textSecondary },
  ]

  const taglineOpacity = fadeIn(frame, 75)
  const taglineY = slideUp(frame, 75)

  return (
    <AbsoluteFill style={{ background: theme.bg, justifyContent: 'center', alignItems: 'center', padding: '0 160px' }}>
      <div style={{ width: '100%', maxWidth: 1100 }}>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 36,
          opacity: fadeIn(frame, 0),
        }}>
          <Label>npm install mcp8004</Label>
          <div style={{
            fontFamily: theme.fontMono,
            fontSize: 18,
            color: theme.textDim,
            letterSpacing: '0.1em',
          }}>
            v0.1.0
          </div>
        </div>

        <div style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: '36px 44px',
          marginBottom: 44,
          opacity: fadeIn(frame, 5),
        }}>
          {lines.map(({ text, delay, color }, i) => (
            <div key={i} style={{
              fontFamily: theme.fontMono,
              fontSize: 26,
              lineHeight: 1.75,
              color,
              opacity: fadeIn(frame, delay),
            }}>
              {text || '\u00A0'}
            </div>
          ))}
        </div>

        <div style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            fontFamily: theme.fontSans,
            fontSize: 32,
            fontWeight: 700,
            color: theme.textPrimary,
          }}>
            No API key.{' '}
            <span style={{ color: theme.amber }}>No OAuth dance.</span>{' '}
            The wallet IS the credential.
          </div>
          <div style={{
            fontFamily: theme.fontMono,
            fontSize: 20,
            color: theme.textDim,
            textAlign: 'right' as const,
            lineHeight: 1.6,
          }}>
            mcp8004.xyz<br />
            github.com/jordanlyall/mcp8004
          </div>
        </div>

      </div>
    </AbsoluteFill>
  )
}

// ─── Root Composition ─────────────────────────────────────────────────────────

export const Mcp8004Demo: React.FC = () => (
  <AbsoluteFill style={{ background: theme.bg }}>
    <Sequence from={0} durationInFrames={150}>
      <SceneProblem />
    </Sequence>
    <Sequence from={150} durationInFrames={120}>
      <SceneInsight />
    </Sequence>
    <Sequence from={270} durationInFrames={180}>
      <SceneAuthFlow />
    </Sequence>
    <Sequence from={450} durationInFrames={150}>
      <SceneShip />
    </Sequence>
  </AbsoluteFill>
)
