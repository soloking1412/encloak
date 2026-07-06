import { formatUnits } from "viem"

export function formatTokenAmount(amount: bigint, decimals: number, maxFrac = 4): string {
  if (amount === 0n) return "0"
  const s = formatUnits(amount, decimals)
  const [int, frac = ""] = s.split(".")
  if (!frac) return int
  const trimmed = frac.slice(0, maxFrac).replace(/0+$/, "")
  // Non-zero amount that rounds below display precision — don't show it as "0".
  if (trimmed === "") return `<0.${"0".repeat(maxFrac - 1)}1`
  return `${int}.${trimmed}`
}

export function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function formatRate(rate: bigint): string {
  if (rate === 0n) return "—"
  return `1:${rate.toString()}`
}

export function formatCompactNumber(n: number): string {
  if (n === 0) return "0"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`
  return n.toFixed(4)
}

export function formatTVS(amount: bigint, decimals: number): string {
  if (amount === 0n) return "0"
  return formatCompactNumber(parseFloat(formatUnits(amount, decimals)))
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}
