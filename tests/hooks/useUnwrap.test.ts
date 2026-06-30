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
  requestUnwrap: vi.fn(),
  finalizeUnwrap: vi.fn(),
}))

vi.mock("@/hooks/usePendingUnwraps", () => ({
  usePendingUnwraps: vi.fn(),
}))

import { useAccount, usePublicClient, useWalletClient } from "wagmi"
import { getZamaSDK, requestUnwrap, finalizeUnwrap } from "@/lib/sdk"
import { usePendingUnwraps } from "@/hooks/usePendingUnwraps"
import { useUnwrap } from "@/hooks/useUnwrap"

const PAIR: WrapperPair = {
  chainId: 11155111,
  erc20: { address: "0xERC20000000000000000000000000000000000000", name: "Mock USDC", symbol: "USDCMock", decimals: 6 },
  wrapper: { address: "0xWRAPPER00000000000000000000000000000000000", name: "cUSDCMock", symbol: "cUSDCMock", decimals: 6 },
  rate: 1n,
  inferredTotalSupply: 0n,
  isValid: true,
  source: "onchain",
}

const MOCK_ADD = vi.fn()
const SDK = { id: "sdk" }

beforeEach(() => {
  vi.clearAllMocks()

  vi.mocked(useAccount).mockReturnValue({
    address: "0xUser000000000000000000000000000000000000" as `0x${string}`,
  } as unknown as ReturnType<typeof useAccount>)

  vi.mocked(usePublicClient).mockReturnValue({} as unknown as ReturnType<typeof usePublicClient>)

  vi.mocked(useWalletClient).mockReturnValue({
    data: { account: { address: "0xUser000000000000000000000000000000000000" } },
  } as unknown as ReturnType<typeof useWalletClient>)

  vi.mocked(getZamaSDK).mockResolvedValue(SDK as never)

  vi.mocked(usePendingUnwraps).mockReturnValue({
    mine: [],
    add: MOCK_ADD,
    update: vi.fn(),
    remove: vi.fn(),
  })
})

describe("useUnwrap — initial state", () => {
  it("starts in idle state", () => {
    const { result } = renderHook(() => useUnwrap(PAIR, ""))
    expect(result.current.state).toBe("idle")
    expect(result.current.error).toBeNull()
    expect(result.current.requestId).toBeUndefined()
  })

  it("is not loading initially", () => {
    const { result } = renderHook(() => useUnwrap(PAIR, ""))
    expect(result.current.isLoading).toBe(false)
  })
})

describe("useUnwrap — initiateUnwrap", () => {
  it("does nothing when no wallet is connected", async () => {
    vi.mocked(useAccount).mockReturnValue({ address: undefined } as unknown as ReturnType<typeof useAccount>)

    const { result } = renderHook(() => useUnwrap(PAIR, "100"))
    await act(async () => {
      await result.current.initiateUnwrap()
    })

    expect(requestUnwrap).not.toHaveBeenCalled()
    expect(result.current.state).toBe("idle")
  })

  it("does nothing when amount is 0", async () => {
    const { result } = renderHook(() => useUnwrap(PAIR, "0"))
    await act(async () => {
      await result.current.initiateUnwrap()
    })

    expect(requestUnwrap).not.toHaveBeenCalled()
    expect(result.current.state).toBe("idle")
  })

  it("does nothing when pair is null", async () => {
    const { result } = renderHook(() => useUnwrap(null, "100"))
    await act(async () => {
      await result.current.initiateUnwrap()
    })

    expect(requestUnwrap).not.toHaveBeenCalled()
  })

  it("requests the unwrap, persists a pending entry, and transitions to pending", async () => {
    vi.mocked(requestUnwrap).mockResolvedValue({
      unwrapTxHash: "0xUnwrapTx" as `0x${string}`,
      burnHandle: "0xBurnHandle" as `0x${string}`,
      requestId: "0xRequestId" as `0x${string}`,
    })

    const { result } = renderHook(() => useUnwrap(PAIR, "100"))
    await act(async () => {
      await result.current.initiateUnwrap()
    })

    expect(getZamaSDK).toHaveBeenCalled()
    expect(requestUnwrap).toHaveBeenCalledWith(SDK, PAIR.wrapper.address, 100_000_000n)
    expect(MOCK_ADD).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: "0xRequestId",
        burnHandle: "0xBurnHandle",
        unwrapTxHash: "0xUnwrapTx",
        wrapperAddress: PAIR.wrapper.address,
        wrapperSymbol: "cUSDCMock",
        status: "pending",
      })
    )
    expect(result.current.state).toBe("pending")
    expect(result.current.requestId).toBe("0xRequestId")
  })

  it("sets error state when the SDK throws", async () => {
    vi.mocked(requestUnwrap).mockRejectedValue(new Error("SDK error"))

    const { result } = renderHook(() => useUnwrap(PAIR, "100"))
    await act(async () => {
      await result.current.initiateUnwrap()
    })

    expect(result.current.state).toBe("error")
    expect(result.current.error).toContain("SDK error")
  })

  it("maps a user rejection to 'Transaction rejected'", async () => {
    vi.mocked(requestUnwrap).mockRejectedValue(new Error("User rejected the request"))

    const { result } = renderHook(() => useUnwrap(PAIR, "100"))
    await act(async () => {
      await result.current.initiateUnwrap()
    })

    expect(result.current.error).toBe("Transaction rejected")
  })
})

describe("useUnwrap — finalize", () => {
  it("calls finalizeUnwrap with the wrapper address and burn handle and returns the tx hash", async () => {
    vi.mocked(finalizeUnwrap).mockResolvedValue("0xFinalizeHash" as `0x${string}`)

    const { result } = renderHook(() => useUnwrap(PAIR, "1"))

    let hash: string | undefined
    await act(async () => {
      hash = await result.current.finalize(
        PAIR.wrapper.address,
        "0xBurnHandle" as `0x${string}`,
        11155111
      )
    })

    expect(finalizeUnwrap).toHaveBeenCalledWith(SDK, PAIR.wrapper.address, "0xBurnHandle")
    expect(hash).toBe("0xFinalizeHash")
    expect(result.current.finalizeTxHash).toBe("0xFinalizeHash")
  })

  it("propagates finalize errors to the caller", async () => {
    vi.mocked(finalizeUnwrap).mockRejectedValue(new Error("Not ready"))

    const { result } = renderHook(() => useUnwrap(PAIR, "1"))

    await expect(
      result.current.finalize(PAIR.wrapper.address, "0xBurnHandle" as `0x${string}`, 11155111)
    ).rejects.toThrow("Not ready")
  })
})

describe("useUnwrap — reset", () => {
  it("returns to idle and clears error", async () => {
    vi.mocked(requestUnwrap).mockRejectedValue(new Error("fail"))

    const { result } = renderHook(() => useUnwrap(PAIR, "100"))
    await act(async () => {
      await result.current.initiateUnwrap()
    })
    expect(result.current.state).toBe("error")

    act(() => {
      result.current.reset()
    })

    expect(result.current.state).toBe("idle")
    expect(result.current.error).toBeNull()
    expect(result.current.requestId).toBeUndefined()
  })
})
