import { describe, it, expect } from "vitest"
import { isAddress } from "viem"
import {
  REGISTRY_ADDRESSES,
  SEPOLIA_PAIRS,
  MAINNET_PAIRS,
  etherscanTx,
  etherscanAddr,
} from "@/lib/contracts/addresses"

describe("REGISTRY_ADDRESSES", () => {
  it("has a valid address for Sepolia (11155111)", () => {
    const addr = REGISTRY_ADDRESSES[11155111]
    expect(isAddress(addr)).toBe(true)
    expect(addr).toBe("0x2f0750Bbb0A246059d80e94c454586a7F27a128e")
  })

  it("has a valid address for Mainnet (1)", () => {
    const addr = REGISTRY_ADDRESSES[1]
    expect(isAddress(addr)).toBe(true)
    expect(addr).toBe("0xeb5015fF021DB115aCe010f23F55C2591059bBA0")
  })
})

describe("SEPOLIA_PAIRS", () => {
  it("contains exactly 8 entries", () => {
    expect(SEPOLIA_PAIRS).toHaveLength(8)
  })

  it("has valid wrapper and erc20 addresses for every entry", () => {
    for (const pair of SEPOLIA_PAIRS) {
      expect(isAddress(pair.wrapper), `wrapper ${pair.symbol}`).toBe(true)
      expect(isAddress(pair.erc20), `erc20 ${pair.symbol}`).toBe(true)
    }
  })

  it("wrapper and erc20 addresses are distinct for every entry", () => {
    for (const pair of SEPOLIA_PAIRS) {
      expect(pair.wrapper.toLowerCase()).not.toBe(pair.erc20.toLowerCase())
    }
  })

  it("has no duplicate wrapper addresses", () => {
    const wrappers = SEPOLIA_PAIRS.map((p) => p.wrapper.toLowerCase())
    expect(new Set(wrappers).size).toBe(wrappers.length)
  })

  it("has no duplicate erc20 addresses", () => {
    const erc20s = SEPOLIA_PAIRS.map((p) => p.erc20.toLowerCase())
    expect(new Set(erc20s).size).toBe(erc20s.length)
  })

  it("marks 7 entries as isMock true and 1 as false", () => {
    const mocks = SEPOLIA_PAIRS.filter((p) => p.isMock)
    const nonMocks = SEPOLIA_PAIRS.filter((p) => !p.isMock)
    expect(mocks).toHaveLength(7)
    expect(nonMocks).toHaveLength(1)
  })

  it("includes all expected cTokenMock symbols", () => {
    const symbols = SEPOLIA_PAIRS.map((p) => p.symbol)
    const expected = ["cUSDCMock", "cUSDTMock", "cWETHMock", "cBRONMock", "cZAMAMock", "ctGBPMock", "cXAUtMock"]
    for (const sym of expected) {
      expect(symbols).toContain(sym)
    }
  })
})

describe("MAINNET_PAIRS", () => {
  it("contains exactly 9 entries", () => {
    expect(MAINNET_PAIRS).toHaveLength(9)
  })

  it("has valid wrapper and erc20 addresses for every entry", () => {
    for (const pair of MAINNET_PAIRS) {
      expect(isAddress(pair.wrapper), `wrapper ${pair.symbol}`).toBe(true)
      expect(isAddress(pair.erc20), `erc20 ${pair.symbol}`).toBe(true)
    }
  })

  it("has no duplicate wrapper addresses", () => {
    const wrappers = MAINNET_PAIRS.map((p) => p.wrapper.toLowerCase())
    expect(new Set(wrappers).size).toBe(wrappers.length)
  })

  it("includes expected mainnet symbols", () => {
    const symbols = MAINNET_PAIRS.map((p) => p.symbol)
    for (const sym of ["cUSDC", "cUSDT", "cWETH", "cBRON", "cZAMA", "ctGBP", "cXAUt", "cbbqTGBP", "csteakcUSDC"]) {
      expect(symbols).toContain(sym)
    }
  })

  it("USDC wrapper points to the canonical USDC address", () => {
    const usdc = MAINNET_PAIRS.find((p) => p.symbol === "cUSDC")
    expect(usdc?.erc20.toLowerCase()).toBe("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48")
  })

  it("USDT wrapper points to the canonical USDT address", () => {
    const usdt = MAINNET_PAIRS.find((p) => p.symbol === "cUSDT")
    expect(usdt?.erc20.toLowerCase()).toBe("0xdac17f958d2ee523a2206206994597c13d831ec7")
  })
})

describe("etherscanTx", () => {
  const hash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

  it("generates sepolia link for chain 11155111", () => {
    const url = etherscanTx(11155111, hash)
    expect(url).toContain("sepolia.etherscan.io")
    expect(url).toContain(hash)
  })

  it("generates mainnet link for chain 1", () => {
    const url = etherscanTx(1, hash)
    expect(url).toContain("etherscan.io")
    expect(url).not.toContain("sepolia")
    expect(url).toContain(hash)
  })

  it("falls back to mainnet for unknown chains", () => {
    const url = etherscanTx(999, hash)
    expect(url).toContain("etherscan.io")
  })
})

describe("etherscanAddr", () => {
  const addr = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"

  it("generates address link for Sepolia", () => {
    const url = etherscanAddr(11155111, addr)
    expect(url).toContain("sepolia.etherscan.io/address")
    expect(url).toContain(addr)
  })

  it("generates address link for Mainnet", () => {
    const url = etherscanAddr(1, addr)
    expect(url).toContain("etherscan.io/address")
    expect(url).not.toContain("sepolia")
  })
})
