"use client"

import { useAccount, useChainId } from "wagmi"
import { ArrowDownUp, LockOpen, Droplets, Plus, CheckCircle2, ArrowUpRight, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useActivity } from "@/hooks/useActivity"
import { timeAgo } from "@/lib/format"
import { etherscanTx } from "@/lib/contracts/addresses"
import type { ActivityType } from "@/types"

const ICONS: Record<ActivityType, typeof ArrowDownUp> = {
  wrap: ArrowDownUp,
  unwrap: ArrowDownUp,
  finalize: CheckCircle2,
  faucet: Droplets,
  decrypt: LockOpen,
  "add-pair": Plus,
}

const TINT: Record<ActivityType, string> = {
  wrap: "bg-primary/10 text-primary",
  unwrap: "bg-blue-500/10 text-blue-400",
  finalize: "bg-emerald-500/10 text-emerald-400",
  faucet: "bg-cyan-500/10 text-cyan-400",
  decrypt: "bg-violet-500/10 text-violet-400",
  "add-pair": "bg-amber-500/10 text-amber-400",
}

export function ActivityFeed() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { mine, clear } = useActivity(address, chainId)

  if (!address) {
    return (
      <Card className="border-dashed border-border/60">
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">Connect your wallet to see your activity.</p>
        </CardContent>
      </Card>
    )
  }

  if (mine.length === 0) {
    return (
      <Card className="border-dashed border-border/60">
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No activity yet. Wrap, unwrap, decrypt, or claim from the faucet — it'll show up here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground" onClick={clear}>
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </Button>
      </div>
      <div className="rounded-xl border border-border/60 divide-y divide-border/60">
        {mine.map((a, i) => {
          const Icon = ICONS[a.type]
          return (
            <div
              key={a.id}
              className="flex items-center gap-3 px-4 py-3 animate-in fade-in slide-in-from-left-1 fill-mode-both duration-400"
              style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
            >
              <div className={`rounded-lg p-2 shrink-0 transition-transform duration-200 hover:scale-110 ${TINT[a.type]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{a.label}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(a.timestamp)}</p>
              </div>
              {a.txHash && (
                <a
                  href={etherscanTx(a.chainId, a.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
                >
                  tx
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
