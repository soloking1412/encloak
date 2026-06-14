"use client"

import { useAccount, useChainId } from "wagmi"
import { Clock } from "lucide-react"
import { usePendingUnwraps } from "@/hooks/usePendingUnwraps"
import { timeAgo, truncateAddress } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  onFinalize: (requestId: `0x${string}`, wrapperAddress: `0x${string}`) => void
}

const STATUS_CONFIG = {
  pending: { label: "Awaiting decryption", class: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  ready: { label: "Ready to finalize", class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  finalizing: { label: "Finalizing…", class: "bg-primary/10 text-primary border-primary/20" },
  done: { label: "Done", class: "bg-muted text-muted-foreground border-border" },
}

export function PendingUnwraps({ onFinalize }: Props) {
  const { address } = useAccount()
  const chainId = useChainId()
  const { mine, remove } = usePendingUnwraps(address, chainId)

  const active = mine.filter((u) => u.status !== "done")
  if (!active.length) return null

  return (
    <Card className="border-amber-500/20 bg-amber-500/5">
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-400" />
          Pending Unwraps
          <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
            {active.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pb-4">
        {active.map((u) => {
          const cfg = STATUS_CONFIG[u.status] ?? STATUS_CONFIG.pending
          return (
            <div
              key={u.requestId}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 gap-3"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="font-mono text-xs text-muted-foreground truncate">
                  {truncateAddress(u.requestId)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {truncateAddress(u.wrapperAddress)} · {timeAgo(u.timestamp)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${cfg.class}`}>
                  {cfg.label}
                </span>
                {u.status === "ready" && (
                  <Button
                    size="sm"
                    className="h-6 text-xs px-2.5"
                    onClick={() => onFinalize(u.requestId, u.wrapperAddress)}
                  >
                    Finalize
                  </Button>
                )}
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
          Finalization requires a relayer decryption round-trip — typically 5–30 min.
        </p>
      </CardContent>
    </Card>
  )
}
