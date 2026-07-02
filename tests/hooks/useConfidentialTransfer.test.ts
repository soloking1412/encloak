import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import type { WrapperPair } from "@/types"

vi.mock("wagmi", () => ({
  useAccount: vi.fn(),
  usePublicClient: vi.fn(),
  useWalletClient: vi.fn(),
}))

vi.mock("@/lib/sdk", () => ({
  getZamaSDK: vi.fn(),
  confidentialTransfer: vi.fn(),
}))

import { useAccount, usePublicClient, useWalletClient } from "wagmi"
import { getZamaSDK, confidentialTransfer } from "@/lib/sdk"
import { useConfidentialTransfer } from "@/hooks/useConfidentialTransfer"

const USER = "0x1111111111111111111111111111111111111111" as `0x${string}`
const RECIPIENT = "0x2222222222222222222222222222222222222222"

const PAIR: WrapperPair = {
  chainId: 11155111,
  erc20: { address: "0x3333333333333333333333333333333333333333", name: "Mock USDC", symbol: "USDCMock", decimals: 6 },
  wrapper: { address: "0x4444444444444444444444444444444444444444", name: "cUSDCMock", symbol: "cUSDCMock", decimals: 6 },
  rate: 1n,
  inferredTotalSupply: 0n,
  isValid: true,
  source: "onchain",
}

const SDK = { id: "sdk" }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAccount).mockReturnValue({ address: USER } as unknown as ReturnType<typeof useAccount>)
  vi.mocked(usePublicClient).mockReturnValue({} as unknown as ReturnType<typeof usePublicClient>)
  vi.mocked(useWalletClient).mockReturnValue({
    data: { account: { address: USER } },
  } as unknown as ReturnType<typeof useWalletClient>)
  vi.mocked(getZamaSDK).mockResolvedValue(SDK as never)
})

describe("useConfidentialTransfer", () => {
  it("starts idle and flags an invalid recipient", () => {
    const { result } = renderHook(() => useConfidentialTransfer(PAIR, "not-an-address", "10"))
    expect(result.current.state).toBe("idle")
    expect(result.current.recipientValid).toBe(false)
  })

  it("detects the user's own address as recipient", () => {
    const { result } = renderHook(() => useConfidentialTransfer(PAIR, USER, "10"))
    expect(result.current.recipientValid).toBe(true)
    expect(result.current.isSelf).toBe(true)
  })

  it("rejects sending to yourself without calling the SDK", async () => {
    const { result } = renderHook(() => useConfidentialTransfer(PAIR, USER, "10"))
    await act(async () => {
      await result.current.send()
    })
    expect(confidentialTransfer).not.toHaveBeenCalled()
    expect(result.current.state).toBe("error")
    expect(result.current.error).toContain("your own address")
  })

  it("rejects a zero amount", async () => {
    const { result } = renderHook(() => useConfidentialTransfer(PAIR, RECIPIENT, "0"))
    await act(async () => {
      await result.current.send()
    })
    expect(confidentialTransfer).not.toHaveBeenCalled()
    expect(result.current.state).toBe("error")
  })

  it("sends with the correct token, recipient, and parsed amount", async () => {
    vi.mocked(confidentialTransfer).mockResolvedValue("0xSendHash" as `0x${string}`)
    const { result } = renderHook(() => useConfidentialTransfer(PAIR, RECIPIENT, "100"))
    await act(async () => {
      await result.current.send()
    })
    expect(confidentialTransfer).toHaveBeenCalledWith(SDK, PAIR.wrapper.address, RECIPIENT, 100_000_000n)
    expect(result.current.state).toBe("success")
    expect(result.current.txHash).toBe("0xSendHash")
  })

  it("maps a user rejection to 'Transaction rejected'", async () => {
    vi.mocked(confidentialTransfer).mockRejectedValue(new Error("User rejected the request"))
    const { result } = renderHook(() => useConfidentialTransfer(PAIR, RECIPIENT, "100"))
    await act(async () => {
      await result.current.send()
    })
    expect(result.current.error).toBe("Transaction rejected")
  })

  it("maps an insufficient-balance error to a friendly message", async () => {
    vi.mocked(confidentialTransfer).mockRejectedValue(new Error("InsufficientConfidentialBalance"))
    const { result } = renderHook(() => useConfidentialTransfer(PAIR, RECIPIENT, "100"))
    await act(async () => {
      await result.current.send()
    })
    expect(result.current.error).toBe("Insufficient confidential balance")
  })

  it("reset() returns to idle", async () => {
    vi.mocked(confidentialTransfer).mockRejectedValue(new Error("fail"))
    const { result } = renderHook(() => useConfidentialTransfer(PAIR, RECIPIENT, "100"))
    await act(async () => {
      await result.current.send()
    })
    expect(result.current.state).toBe("error")
    act(() => result.current.reset())
    expect(result.current.state).toBe("idle")
    expect(result.current.error).toBeNull()
  })
})
