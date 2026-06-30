import { describe, it, expect, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { usePendingUnwraps } from "@/hooks/usePendingUnwraps"
import type { PendingUnwrap } from "@/types"

const WALLET = "0xUserWalletAddress1234567890abcdef1234" as `0x${string}`
const CHAIN_ID = 11155111

function makePending(overrides?: Partial<PendingUnwrap>): PendingUnwrap {
  return {
    requestId: "0xrequest1" as `0x${string}`,
    burnHandle: "0xburnhandle1" as `0x${string}`,
    unwrapTxHash: "0xunwraptx1" as `0x${string}`,
    wrapperAddress: "0xwrapper1" as `0x${string}`,
    wrapperSymbol: "cUSDCMock",
    chainId: CHAIN_ID,
    walletAddress: WALLET,
    timestamp: Date.now(),
    status: "pending",
    ...overrides,
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe("usePendingUnwraps", () => {
  it("starts with an empty list", () => {
    const { result } = renderHook(() => usePendingUnwraps(WALLET, CHAIN_ID))
    expect(result.current.mine).toHaveLength(0)
  })

  it("adds a pending unwrap and it appears in mine", () => {
    const { result } = renderHook(() => usePendingUnwraps(WALLET, CHAIN_ID))
    const item = makePending()

    act(() => {
      result.current.add(item)
    })

    expect(result.current.mine).toHaveLength(1)
    expect(result.current.mine[0].requestId).toBe("0xrequest1")
  })

  it("persists the item in localStorage", () => {
    const { result } = renderHook(() => usePendingUnwraps(WALLET, CHAIN_ID))
    act(() => {
      result.current.add(makePending())
    })

    const stored = JSON.parse(localStorage.getItem("zama_pending_unwraps") ?? "[]")
    expect(stored).toHaveLength(1)
    expect(stored[0].requestId).toBe("0xrequest1")
  })

  it("updates an existing item's status", () => {
    const { result } = renderHook(() => usePendingUnwraps(WALLET, CHAIN_ID))
    act(() => {
      result.current.add(makePending())
    })

    act(() => {
      result.current.update("0xrequest1" as `0x${string}`, { status: "finalizing" })
    })

    expect(result.current.mine[0].status).toBe("finalizing")
  })

  it("removes an item by requestId", () => {
    const { result } = renderHook(() => usePendingUnwraps(WALLET, CHAIN_ID))
    act(() => {
      result.current.add(makePending())
    })

    act(() => {
      result.current.remove("0xrequest1" as `0x${string}`)
    })

    expect(result.current.mine).toHaveLength(0)
  })

  it("deduplicates: re-adding same requestId replaces the existing entry", () => {
    const { result } = renderHook(() => usePendingUnwraps(WALLET, CHAIN_ID))

    act(() => {
      result.current.add(makePending({ status: "pending" }))
      result.current.add(makePending({ status: "finalizing" }))
    })

    expect(result.current.mine).toHaveLength(1)
    expect(result.current.mine[0].status).toBe("finalizing")
  })

  it("filters out items from other wallets", () => {
    const { result } = renderHook(() => usePendingUnwraps(WALLET, CHAIN_ID))

    act(() => {
      result.current.add(makePending())
      result.current.add(
        makePending({
          requestId: "0xrequest2" as `0x${string}`,
          walletAddress: "0xOtherWallet0000000000000000000000000000" as `0x${string}`,
        })
      )
    })

    expect(result.current.mine).toHaveLength(1)
    expect(result.current.mine[0].requestId).toBe("0xrequest1")
  })

  it("filters out items from other chains", () => {
    const { result } = renderHook(() => usePendingUnwraps(WALLET, CHAIN_ID))

    act(() => {
      result.current.add(makePending())
      result.current.add(
        makePending({
          requestId: "0xrequest2" as `0x${string}`,
          chainId: 1,
        })
      )
    })

    expect(result.current.mine).toHaveLength(1)
    expect(result.current.mine[0].chainId).toBe(CHAIN_ID)
  })

  it("returns all items when wallet/chainId not provided", () => {
    const { result } = renderHook(() => usePendingUnwraps(WALLET, CHAIN_ID))

    act(() => {
      result.current.add(makePending())
      result.current.add(makePending({ requestId: "0xrequest2" as `0x${string}`, chainId: 1 }))
    })

    const { result: allResult } = renderHook(() => usePendingUnwraps())
    expect(allResult.current.mine).toHaveLength(2)
  })
})
