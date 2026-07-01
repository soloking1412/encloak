"use client"

import { useState } from "react"
import { useAccount, useChainId } from "wagmi"
import { toast } from "sonner"
import { Clock, ExternalLink } from "lucide-react"
import { usePendingUnwraps } from "@/hooks/usePendingUnwraps"
import { useUnwrap } from "@/hooks/useUnwrap"
import { timeAgo, truncateAddress } from "@/lib/format"
import { etherscanTx } from "@/lib/contracts/addresses"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PendingUnwrap } from "@/types"

export function PendingUnwraps() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { mine, update, remove } = usePendingUnwraps(address, chainId)
  const { finalize } = useUnwrap(null, "")
  const [busyId, setBusyId] = useState<string | null>(null)

  const active = mine.filter((u) => u.status !== "done")
  if (!active.length) return null

  const handleFinalize = async (item: PendingUnwrap) => {
    setBusyId(item.requestId)
    update(item.requestId, { status: "finalizing" })
    try {
      const hash = await finalize(item.wrapperAddress, item.burnHandle, item.chainId, item.wrapperSymbol)
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
          : "Not ready yet — the relayer is still decrypting. Try again shortly."
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
          const isBusy = busyId === u.requestId || u.status === "finalizing"
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
                  {truncateAddress(u.requestId)} · {timeAgo(u.timestamp)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20">
                  {u.status !== "finalizing" && (
                    <span className="pulse-ring h-1.5 w-1.5 rounded-full bg-amber-400" />
                  )}
                  {u.status === "finalizing" ? "Finalizing…" : "Awaiting decryption"}
                </span>
                <Button
                  size="sm"
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
          Finalization needs a relayer public-decryption round-trip. Click Finalize once it's
          ready — if the relayer is still processing, retry in a moment.
        </p>
      </CardContent>
    </Card>
  )
}
