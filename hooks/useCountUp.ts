"use client"

import { useEffect, useRef, useState } from "react"

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

/** Animates a number from its last settled value up to `target` whenever `target` changes. */
export function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0)
  const fromRef = useRef(0)
  const frameRef = useRef(0)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const from = fromRef.current

    if (from === target || prefersReducedMotion) {
      setValue(target)
      fromRef.current = target
      return
    }

    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      setValue(from + (target - from) * easeOutExpo(t))
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }
    frameRef.current = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration])

  return value
}
