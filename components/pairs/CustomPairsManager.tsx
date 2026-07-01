"use client"

import { useState } from "react"
import { Trash2, Copy, Code2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useCustomPairs } from "@/hooks/useCustomPairs"
import { truncateAddress } from "@/lib/format"
import { etherscanAddr } from "@/lib/contracts/addresses"

interface Props {
  chainId: number
}

export function CustomPairsManager({ chainId }: Props) {
  const { stored, remove } = useCustomPairs(chainId)
  const [showSnippet, setShowSnippet] = useState(false)

  if (stored.length === 0) {
    return (
      <Card className="border-dashed border-border/60">
        <CardContent className="py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No custom pairs yet. Add one above to see it across the whole app.
          </p>
        </CardContent>
      </Card>
    )
  }

  const snippet = `import type { CustomPair } from "@/types"

export const CUSTOM_PAIRS: CustomPair[] = [
${stored
  .map(
    (p) => `  {
    chainId: ${p.chainId},
    erc20: { address: "${p.erc20.address}", name: "${p.erc20.name}", symbol: "${p.erc20.symbol}", decimals: ${p.erc20.decimals} },
    wrapper: { address: "${p.wrapper.address}", name: "${p.wrapper.name}", symbol: "${p.wrapper.symbol}", decimals: ${p.wrapper.decimals} },
  },`
  )
  .join("\n")}
]`

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          My Custom Pairs
          <Badge variant="secondary" className="text-[10px] h-5">{stored.length}</Badge>
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() => setShowSnippet((s) => !s)}
        >
          <Code2 className="h-3.5 w-3.5" />
          {showSnippet ? "Hide" : "Export"} config
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {stored.map((p, i) => (
          <div
            key={p.wrapper.address}
            className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 gap-3 animate-in fade-in slide-in-from-left-1 fill-mode-both duration-400"
            style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {p.erc20.symbol} <span className="text-muted-foreground">→</span>{" "}
                <span className="text-primary">{p.wrapper.symbol}</span>
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                <a
                  href={etherscanAddr(chainId, p.wrapper.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  {truncateAddress(p.wrapper.address)}
                </a>
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1.5"
              onClick={() => {
                remove(p.wrapper.address, p.chainId)
                toast.success(`Removed ${p.wrapper.symbol}`)
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </Button>
          </div>
        ))}

        {showSnippet && (
          <div className="rounded-lg bg-muted/40 border border-border/60 p-3 mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Paste into <code className="font-mono">config/customPairs.ts</code> to make these permanent for everyone.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs gap-1"
                onClick={() => {
                  navigator.clipboard.writeText(snippet)
                  toast.success("Config copied")
                }}
              >
                <Copy className="h-3 w-3" />
                Copy
              </Button>
            </div>
            <pre className="text-xs text-foreground overflow-x-auto leading-relaxed">{snippet}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
