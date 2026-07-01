import { describe, it, expect } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useCountUp } from "@/hooks/useCountUp"

describe("useCountUp", () => {
  it("starts at 0 when the target is 0", () => {
    const { result } = renderHook(() => useCountUp(0))
    expect(result.current).toBe(0)
  })

  it("animates up to the target and settles exactly on it", async () => {
    const { result } = renderHook(() => useCountUp(50, 20))
    await waitFor(() => expect(result.current).toBe(50))
  })

  it("animates from the previous settled value when the target changes", async () => {
    const { result, rerender } = renderHook(({ target }) => useCountUp(target, 20), {
      initialProps: { target: 10 },
    })
    await waitFor(() => expect(result.current).toBe(10))

    rerender({ target: 25 })
    await waitFor(() => expect(result.current).toBe(25))
  })

  it("does not restart the animation when the target is unchanged", async () => {
    const { result, rerender } = renderHook(({ target }) => useCountUp(target, 20), {
      initialProps: { target: 8 },
    })
    await waitFor(() => expect(result.current).toBe(8))

    rerender({ target: 8 })
    expect(result.current).toBe(8)
  })
})
