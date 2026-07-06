import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { parseUnits } from "viem"
import type { WrapperPair } from "@/types"

vi.mock("wagmi", () => ({
  useWriteContract: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
  useReadContract: vi.fn(),
  useAccount: vi.fn(),
  usePublicClient: vi.fn(),
}))

import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useAccount,
  usePublicClient,
} from "wagmi"
import { useWrap } from "@/hooks/useWrap"

const PAIR: WrapperPair = {
  chainId: 11155111,
  erc20: { address: "0xERC20000000000000000000000000000000000000", name: "Mock USDC", symbol: "USDCMock", decimals: 6 },
  wrapper: { address: "0xWRAPPER00000000000000000000000000000000000", name: "cUSDCMock", symbol: "cUSDCMock", decimals: 6 },
  rate: 1n,
  inferredTotalSupply: 0n,
  isValid: true,
  source: "onchain",
}

const WRITE_ASYNC = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAccount).mockReturnValue({
    address: "0xUser000000000000000000000000000000000000" as `0x${string}`,
  } as ReturnType<typeof useAccount>)
  vi.mocked(useWriteContract).mockReturnValue({
    writeContractAsync: WRITE_ASYNC,
  } as unknown as ReturnType<typeof useWriteContract>)
  vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
    isLoading: false,
  } as ReturnType<typeof useWaitForTransactionReceipt>)
  vi.mocked(useReadContract).mockReturnValue({
    data: undefined,
  } as ReturnType<typeof useReadContract>)
  vi.mocked(usePublicClient).mockReturnValue({
    waitForTransactionReceipt: vi.fn().mockResolvedValue({ status: "success" }),
    estimateContractGas: vi.fn().mockResolvedValue(1_000_000n),
  } as unknown as ReturnType<typeof usePublicClient>)
})

describe("useWrap", () => {
  it("starts in idle state", () => {
    const { result } = renderHook(() => useWrap(PAIR, ""))
    expect(result.current.state).toBe("idle")
    expect(result.current.error).toBeNull()
  })

  it("returns needsApproval true when allowance is 0 and amount > 0", () => {
    vi.mocked(useReadContract).mockReturnValue({
      data: 0n,
    } as ReturnType<typeof useReadContract>)

    const { result } = renderHook(() => useWrap(PAIR, "100"))
    expect(result.current.needsApproval).toBe(true)
  })

  it("returns needsApproval false when allowance covers the amount", () => {
    vi.mocked(useReadContract).mockReturnValue({
      data: parseUnits("200", 6),
    } as ReturnType<typeof useReadContract>)

    const { result } = renderHook(() => useWrap(PAIR, "100"))
    expect(result.current.needsApproval).toBe(false)
  })

  it("calculates outputAmount using rate", () => {
    const pairWith10xRate: WrapperPair = { ...PAIR, rate: 10n }
    const { result } = renderHook(() => useWrap(pairWith10xRate, "100"))
    expect(result.current.outputAmount).toBe(parseUnits("100", 6) / 10n)
  })

  it("sets error when user has insufficient balance", async () => {
    vi.mocked(useReadContract).mockImplementation((params: unknown) => {
      const functionName = (params as { functionName?: string })?.functionName
      if (functionName === "balanceOf") return { data: parseUnits("50", 6) } as ReturnType<typeof useReadContract>
      else if (functionName === "allowance") return { data: parseUnits("1000", 6) } as ReturnType<typeof useReadContract>
      return { data: undefined } as ReturnType<typeof useReadContract>
    })

    const { result } = renderHook(() => useWrap(PAIR, "100"))

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.error).toBe("Insufficient balance")
    expect(result.current.state).toBe("error")
  })

  it("transitions through approving → approved → wrapping → success", async () => {
    const TX_HASH_APPROVE = "0xApprove" as `0x${string}`
    const TX_HASH_WRAP = "0xWrap" as `0x${string}`

    vi.mocked(useReadContract).mockImplementation((params: unknown) => {
      const functionName = (params as { functionName?: string })?.functionName
      if (functionName === "balanceOf") return { data: parseUnits("1000", 6) } as ReturnType<typeof useReadContract>
      else if (functionName === "allowance") return { data: 0n } as ReturnType<typeof useReadContract>
      return { data: undefined } as ReturnType<typeof useReadContract>
    })

    WRITE_ASYNC.mockResolvedValueOnce(TX_HASH_APPROVE).mockResolvedValueOnce(TX_HASH_WRAP)

    const { result } = renderHook(() => useWrap(PAIR, "100"))

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.state).toBe("success")
    expect(result.current.approveTxHash).toBe(TX_HASH_APPROVE)
    expect(result.current.wrapTxHash).toBe(TX_HASH_WRAP)
  })

  it("skips approve when allowance is sufficient and wraps directly", async () => {
    const TX_HASH_WRAP = "0xDirectWrap" as `0x${string}`

    vi.mocked(useReadContract).mockImplementation((params: unknown) => {
      const functionName = (params as { functionName?: string })?.functionName
      if (functionName === "balanceOf") return { data: parseUnits("1000", 6) } as ReturnType<typeof useReadContract>
      else if (functionName === "allowance") return { data: parseUnits("500", 6) } as ReturnType<typeof useReadContract>
      return { data: undefined } as ReturnType<typeof useReadContract>
    })

    WRITE_ASYNC.mockResolvedValueOnce(TX_HASH_WRAP)

    const { result } = renderHook(() => useWrap(PAIR, "100"))

    await act(async () => {
      await result.current.execute()
    })

    expect(WRITE_ASYNC).toHaveBeenCalledTimes(1)
    expect(result.current.state).toBe("success")
  })

  it("sets error state when the wallet rejects the transaction", async () => {
    vi.mocked(useReadContract).mockImplementation((params: unknown) => {
      const functionName = (params as { functionName?: string })?.functionName
      if (functionName === "balanceOf") return { data: parseUnits("1000", 6) } as ReturnType<typeof useReadContract>
      else if (functionName === "allowance") return { data: 0n } as ReturnType<typeof useReadContract>
      return { data: undefined } as ReturnType<typeof useReadContract>
    })

    WRITE_ASYNC.mockRejectedValueOnce(new Error("User rejected the request"))

    const { result } = renderHook(() => useWrap(PAIR, "100"))

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.state).toBe("error")
    expect(result.current.error).toBe("Transaction rejected")
  })

  it("does nothing when no wallet is connected", async () => {
    vi.mocked(useAccount).mockReturnValue({ address: undefined } as ReturnType<typeof useAccount>)

    const { result } = renderHook(() => useWrap(PAIR, "100"))

    await act(async () => {
      await result.current.execute()
    })

    expect(WRITE_ASYNC).not.toHaveBeenCalled()
    expect(result.current.state).toBe("idle")
  })

  it("reset() returns to idle state", async () => {
    vi.mocked(useReadContract).mockImplementation((params: unknown) => {
      const functionName = (params as { functionName?: string })?.functionName
      if (functionName === "balanceOf") return { data: parseUnits("50", 6) } as ReturnType<typeof useReadContract>
      return { data: undefined } as ReturnType<typeof useReadContract>
    })

    const { result } = renderHook(() => useWrap(PAIR, "100"))

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.state).toBe("error")

    act(() => {
      result.current.reset()
    })

    expect(result.current.state).toBe("idle")
    expect(result.current.error).toBeNull()
  })
})
