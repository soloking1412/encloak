"use client"

import { useChainId, useSwitchChain } from "wagmi"
import { mainnet, sepolia } from "wagmi/chains"
import { Button } from "@/components/ui/button"

export function NetworkSwitcher() {
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()

  const isSepolia = chainId === sepolia.id
  const isMainnet = chainId === mainnet.id

  if (!isSepolia && !isMainnet) {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs text-destructive font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
          Unsupported network
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => switchChain({ chainId: sepolia.id })}
          disabled={isPending}
        >
          Switch to Sepolia
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center rounded-full border border-border/60 bg-muted/40 p-0.5 gap-0.5">
      <button
        onClick={() => chainId !== sepolia.id && switchChain({ chainId: sepolia.id })}
        disabled={isPending}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
          isSepolia
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full transition-colors ${isSepolia ? "bg-amber-400" : "bg-muted-foreground/30"}`} />
        Sepolia
      </button>
      <button
        onClick={() => chainId !== mainnet.id && switchChain({ chainId: mainnet.id })}
        disabled={isPending}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
          isMainnet
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full transition-colors ${isMainnet ? "bg-emerald-400" : "bg-muted-foreground/30"}`} />
        Mainnet
      </button>
    </div>
  )
}
