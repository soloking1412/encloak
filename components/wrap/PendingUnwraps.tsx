"use client"

import { useEffect, useRef, useState } from "react"
import { useAccount, useChainId, usePublicClient, useWalletClient } from "wagmi"
import { toast } from "sonner"
import { Clock, ExternalLink, CheckCircle2 } from "lucide-react"
import { usePendingUnwraps } from "@/hooks/usePendingUnwraps"
import { useUnwrap } from "@/hooks/useUnwrap"
import { getZamaSDK, isUnwrapReady } from "@/lib/sdk"
import { timeAgo, truncateAddress } from "@/lib/format"
import { etherscanTx } from "@/lib/contracts/addresses"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PendingUnwrap } from "@/types"

const FINALIZE_TIMEOUT_MS = 180_000
const POLL_INTERVAL_MS = 30_000

export function PendingUnwraps() {
  const { address } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { mine, update, remove } = usePendingUnwraps(address, chainId)
  const { finalize } = useUnwrap(null, "")
  const [busyId, setBusyId] = useState<string | null>(null)

  const active = mine.filter((u) => u.status !== "done")

  // Recover any stale "finalizing" status left by an interrupted or reloaded
  // session — without this, the item's Finalize button stays locked forever.
  const statusKey = mine.map((u) => `${u.requestId}:${u.status}`).join(",")
  useEffect(() => {
    for (const u of mine) {
      if (u.status === "finalizing" && busyId !== u.requestId) {
        update(u.requestId, { status: "pending" })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusKey, busyId])

  // Poll the relayer so the item flips to "ready" the moment finalize will
  // succeed — the user no longer has to guess or retry into a hang.
  const activeRef = useRef(active)
  activeRef.current = active
  const pollKey = active
    .filter((u) => u.status === "pending")
    .map((u) => u.requestId)
    .join(",")

  useEffect(() => {
    if (!walletClient || !publicClient || !pollKey) return
    let cancelled = false

    const check = async () => {
      const sdk = await getZamaSDK(walletClient, publicClient, chainId).catch(() => null)
      if (!sdk || cancelled) return
      for (const item of activeRef.current) {
        if (item.status !== "pending" || cancelled) continue
        const ready = await isUnwrapReady(sdk, item.burnHandle)
        if (ready && !cancelled) update(item.requestId, { status: "ready" })
      }
    }

    check()
    const id = setInterval(check, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [pollKey, walletClient, publicClient, chainId, update])

  if (!active.length) return null

  const handleFinalize = async (item: PendingUnwrap) => {
    setBusyId(item.requestId)
    update(item.requestId, { status: "finalizing" })
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Finalize timed out — the relayer may still be processing")),
          FINALIZE_TIMEOUT_MS
        )
      )
      const hash = await Promise.race([
        finalize(item.wrapperAddress, item.burnHandle, item.chainId, item.wrapperSymbol),
        timeout,
      ])
      update(item.requestId, { status: "done" })
      toast.success(`Unwrapped ${item.wrapperSymbol}`, {
        action: { label: "View tx", onClick: () => window.open(etherscanTx(item.chainId, hash), "_blank") },
      })
      setTimeout(() => remove(item.requestId), 1500)
    } catch (e: unknown) {
      update(item.requestId, { status: "pending" })
      const msg = e instanceof Error ? e.message : ""
      toast.error(
        msg.includes("rejected")
          ? "Transaction rejected"
          : "Not ready yet — the relayer is still decrypting. It'll flip to Ready automatically."
      )
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card className="border-amber-500/20 bg-amber-500/5 animate-in fade-in slide-in-from-top-1 duration-400">
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-400" />
          Pending Unwraps
          <Badge variant="destructive" className="text-[10px] h-4 px-1.5 animate-in zoom-in-50 duration-300">
            {active.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pb-4">
        {active.map((u, i) => {
          const isBusy = busyId === u.requestId
          const isReady = u.status === "ready"
          const isFinalizing = u.status === "finalizing" || isBusy
          return (
            <div
              key={u.requestId}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 gap-3 animate-in fade-in slide-in-from-left-1 fill-mode-both duration-400"
              style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}
            >
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  {u.wrapperSymbol}
                  <a
                    href={etherscanTx(u.chainId, u.unwrapTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground/60 hover:text-muted-foreground"
                    title="View unwrap request tx"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {truncateAddress(u.requestId)} · requested {timeAgo(u.timestamp)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isFinalizing ? (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20">
                    Finalizing…
                  </span>
                ) : isReady ? (
                  <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    Ready
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20">
                    <span className="pulse-ring h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Awaiting decryption
                  </span>
                )}
                <Button
                  size="sm"
                  variant={isReady ? "default" : "outline"}
                  className="h-6 text-xs px-2.5"
                  onClick={() => handleFinalize(u)}
                  disabled={isBusy}
                >
                  {isBusy ? "…" : "Finalize"}
                </Button>
                <button
                  onClick={() => remove(u.requestId)}
                  className="text-muted-foreground/40 hover:text-muted-foreground text-xs transition-colors leading-none"
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}
        <p className="text-xs text-muted-foreground pt-1">
          The relayer publicly decrypts the burnt amount (typically 5–30 min). We check
          automatically and flip each row to <span className="text-emerald-400">Ready</span> the
          moment Finalize will go through — you can also try Finalize any time.
        </p>
      </CardContent>
    </Card>
  )
}
