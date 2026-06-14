"use client"

import { useChainId } from "wagmi"
import { mainnet, sepolia } from "wagmi/chains"
import { Shield, Database, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatTVS } from "@/lib/format"
import type { WrapperPair } from "@/types"

interface Props {
  pairs: WrapperPair[]
  isLoading: boolean
}

export function TVSSummary({ pairs, isLoading }: Props) {
  const chainId = useChainId()

  const totalTVS = pairs.reduce((acc, p) => acc + p.inferredTotalSupply, 0n)
  const avgDecimals =
    pairs.length > 0
      ? Math.round(pairs.reduce((acc, p) => acc + p.wrapper.decimals, 0) / pairs.length)
      : 6
  const networkLabel =
    chainId === mainnet.id ? "Mainnet" : chainId === sepolia.id ? "Sepolia" : "Unknown"
  const customCount = pairs.filter((p) => p.source === "custom").length

  const stats = [
    {
      label: "Registered Pairs",
      value: isLoading ? "—" : pairs.length,
      sub: networkLabel,
      icon: Database,
      iconClass: "bg-primary/10 text-primary",
    },
    {
      label: "Total Value Shielded",
      value: isLoading ? "—" : formatTVS(totalTVS, avgDecimals),
      sub: "Aggregate inferred supply",
      icon: Shield,
      iconClass: "bg-violet-500/10 text-violet-400",
    },
    {
      label: "Custom Pairs",
      value: isLoading ? "—" : customCount,
      sub: "via config/customPairs.ts",
      icon: Plus,
      iconClass: "bg-emerald-500/10 text-emerald-400",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <Card key={s.label} className="border-border/60">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-semibold tracking-tight truncate">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </div>
              <div className={`rounded-lg p-2 shrink-0 ${s.iconClass}`}>
                <s.icon className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
