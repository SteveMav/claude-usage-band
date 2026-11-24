import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderChildren, SessionUsage } from 'claude-code'

import type { Snapshot } from '../types'

const snap = atom({ plugin: 'usage-band', key: 'snap' } as const, null)
const baseline = atom({ plugin: 'usage-band', key: 'baseline' } as const, {})

function toSnap(u: Pick<SessionUsage, 'context' | 'rateLimits' | 'cost'>): Snapshot {
  return {
    ctxTokens: u.context.tokens ?? null,
    ctxWindow: u.context.window,
    costUsd: u.cost?.usd ?? null,
    limits: u.rateLimits.map(r => ({ kind: r.kind, percentUsed: r.percentUsed, resetsAt: r.resetsAt ?? null })),
  }
}

function k(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  return `${Math.round(n / 1000)}k`
}

function left(iso: string | null, now: number): string {
  if (!iso) return ''
  const ms = Date.parse(iso) - now
  if (!(ms > 0)) return 'maintenant'
  const min = Math.round(ms / 60_000)
  if (min < 60) return `${min}m`
  const h = Math.round(min / 60)
  if (h < 24) return `${h}h`
  return `${Math.round(h / 24)}j`
}

function pct(n: number): string {
  return `${Number.isInteger(n) ? n : n.toFixed(1)}%`
}

async function refresh($: EngineInterface) {
  try {
    const s = toSnap(await $.session.usage())
    await update($, snap, () => s)
    await update($, baseline, b => {
      const nb = { ...b }
      for (const l of s.limits) if (nb[l.kind] === undefined) nb[l.kind] = l.percentUsed
      return nb
    })
  } catch {
    // chiffres indisponibles pour l'instant
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const r = await next(e)
    $.ui.status(undefined)
    await refresh($)
    return r
  })

  on('session.measure', async ($, e, next) => {
    await refresh($)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const { Box, Text } = $.ui.resolve(e)

    let s = await read($, snap)
    if (s === null) {
      try {
        s = toSnap(await $.session.usage())
      } catch {
        s = null
      }
    }
    if (s === null) return <Text size="caption" dimColor>Quota : en attente…</Text>
    const cur = s

    const base = await read($, baseline)
    const now = await $.clock.now()

    const BLUE = '#3b7cf0'
    const GREEN = '#3fb950'
    const TRACK = '#4a4d55'
    const PILL_BG = '#3a3d45'
    const CARD_BG = '#25272c'
    const card = (key: string, children: RenderChildren[]) => (
      <Box key={key} flexDirection="row" gap={1} alignItems="center" backgroundColor={CARD_BG} paddingX={1} flexShrink={0}>
        {children}
      </Box>
    )
    const tone = (p: number, ok: string) => (p >= 90 ? '#f85149' : p >= 70 ? '#d29922' : ok)

    // Ligne fine grise, la partie utilisée en couleur.
    const line = (p: number, key: string, fill: string) => {
      const width = 8
      const full = Math.max(p > 0 ? 1 : 0, Math.min(width, Math.round((p / 100) * width)))
      return (
        <Box key={key} flexDirection="row">
          {full > 0 ? <Text size="caption" color={fill}>{'━'.repeat(full)}</Text> : null}
          {full < width ? <Text size="caption" color={TRACK}>{'━'.repeat(width - full)}</Text> : null}
        </Box>
      )
    }

    const limit = (kind: string, label: string) => {
      const l = cur.limits.find(x => x.kind === kind)
      if (!l) return null
      const d = Math.round((l.percentUsed - (base[kind] ?? l.percentUsed)) * 10) / 10
      const t = left(l.resetsAt, now)
      return card(kind, [
        <Text size="caption" key="l" dimColor>{label}</Text>,
        line(l.percentUsed, `${kind}-line`, tone(l.percentUsed, GREEN)),
        <Text size="caption" key="p" bold>{pct(l.percentUsed)}</Text>,
        d > 0 ? <Text size="caption" key="d" color={GREEN}>{`+${pct(d)}`}</Text> : null,
        t ? <Text size="caption" key="t" dimColor>{t}</Text> : null,
      ])
    }

    const ctxPct = cur.ctxTokens === null ? 0 : Math.min(100, (cur.ctxTokens / cur.ctxWindow) * 100)
    const ctxText = `${cur.ctxTokens === null ? '–' : k(cur.ctxTokens)}/${k(cur.ctxWindow)}`

    return (
      <Box flexDirection="row" columnGap={1} flexWrap="nowrap" alignItems="center">
        {card('ctx', [
          <Text size="caption" key="s" dimColor>S</Text>,
          <Box key="pill" position="relative" backgroundColor={PILL_BG} paddingX={1} overflow="hidden">
            <Box
              key="pill-fill"
              position="absolute"
              top={0}
              left={0}
              bottom={0}
              width={`${Math.max(Math.round(ctxPct), 4)}%`}
              backgroundColor={tone(ctxPct, BLUE)}
            />
            <Text size="caption" bold color="#ffffff">{ctxText}</Text>
          </Box>,
          cur.costUsd !== null ? <Text size="caption" key="cost" bold>{`$${cur.costUsd.toFixed(2)}`}</Text> : null,
        ])}
        {limit('five_hour', '5h')}
        {limit('seven_day', 'Semaine')}
      </Box>
    )
  })
}
