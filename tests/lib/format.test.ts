import { describe, it, expect } from "vitest"
import {
  formatTokenAmount,
  truncateAddress,
  formatRate,
  formatTVS,
  timeAgo,
} from "@/lib/format"

describe("formatTokenAmount", () => {
  it("formats a standard 18-decimal amount", () => {
    expect(formatTokenAmount(1000000000000000000n, 18)).toBe("1")
  })

  it("formats a fractional amount and trims trailing zeros", () => {
    expect(formatTokenAmount(1500000000000000000n, 18)).toBe("1.5")
  })

  it("respects maxFrac argument", () => {
    expect(formatTokenAmount(1234567890000000000n, 18, 2)).toBe("1.23")
  })

  it("formats 6-decimal amount (USDC-style)", () => {
    expect(formatTokenAmount(1000000n, 6)).toBe("1")
    expect(formatTokenAmount(1500000n, 6)).toBe("1.5")
  })

  it("returns '0' for a zero amount", () => {
    expect(formatTokenAmount(0n, 18)).toBe("0")
  })

  it("shows a non-zero amount below display precision as '<0.0001' rather than '0'", () => {
    expect(formatTokenAmount(50n, 6)).toBe("<0.0001")
    expect(formatTokenAmount(1n, 18)).toBe("<0.0001")
  })

  it("handles very large amounts", () => {
    const result = formatTokenAmount(1000000000000000000000000n, 18)
    expect(result).toBe("1000000")
  })
})

describe("truncateAddress", () => {
  it("truncates a standard 42-char address", () => {
    const addr = "0xabcdef1234567890abcdef1234567890abcdef12"
    const result = truncateAddress(addr)
    expect(result).toBe("0xabcd…ef12")
  })

  it("preserves the full address if it is short", () => {
    const addr = "0x1234"
    const result = truncateAddress(addr)
    expect(result.startsWith("0x12")).toBe(true)
  })
})

describe("formatRate", () => {
  it("returns '—' for zero rate", () => {
    expect(formatRate(0n)).toBe("—")
  })

  it("formats a typical rate of 1e12", () => {
    expect(formatRate(1000000000000n)).toBe("1:1000000000000")
  })

  it("formats rate of 1", () => {
    expect(formatRate(1n)).toBe("1:1")
  })
})

describe("formatTVS", () => {
  it("returns '0' for zero", () => {
    expect(formatTVS(0n, 6)).toBe("0")
  })

  it("formats millions with M suffix", () => {
    const amount = 5_000_000n * 1_000_000n
    expect(formatTVS(amount, 6)).toContain("M")
  })

  it("formats thousands with K suffix", () => {
    const amount = 50_000n * 1_000_000n
    expect(formatTVS(amount, 6)).toContain("K")
  })

  it("formats small amounts without suffix", () => {
    const amount = 100n * 1_000_000n
    const result = formatTVS(amount, 6)
    expect(result).not.toContain("K")
    expect(result).not.toContain("M")
  })
})

describe("timeAgo", () => {
  it("returns 'just now' for recent timestamps", () => {
    expect(timeAgo(Date.now() - 30_000)).toBe("just now")
  })

  it("returns minutes for timestamps less than 1 hour old", () => {
    expect(timeAgo(Date.now() - 5 * 60_000)).toBe("5m ago")
  })

  it("returns hours for timestamps less than 1 day old", () => {
    expect(timeAgo(Date.now() - 3 * 3_600_000)).toBe("3h ago")
  })

  it("returns days for older timestamps", () => {
    expect(timeAgo(Date.now() - 2 * 86_400_000)).toBe("2d ago")
  })
})
