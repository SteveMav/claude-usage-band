export type Snapshot = {
  ctxTokens: number | null
  ctxWindow: number
  costUsd: number | null
  limits: { kind: string; percentUsed: number; resetsAt: string | null }[]
}

declare module 'claude-code' {
  interface PluginState {
    'usage-band': {
      snap: Snapshot | null
      baseline: Record<string, number>
    }
  }
}
