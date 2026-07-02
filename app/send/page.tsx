"use client"

import { useChainId } from "wagmi"
import { Send } from "lucide-react"
import { useRegistryPairs } from "@/hooks/useRegistryPairs"
import { SendForm } from "@/components/send/SendForm"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SendPage() {
  const chainId = useChainId()
  const { pairs, isLoading, isSupported } = useRegistryPairs()

  return (
    <div className="space-y-8 max-w-2xl animate-in fade-in slide-in-from-bottom-1 duration-500">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Send className="h-3.5 w-3.5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Send</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Transfer confidential tokens privately — the amount stays encrypted end-to-end.
        </p>
      </div>

      {!isSupported ? (
        <Alert variant="destructive">
          <AlertDescription>
            Switch to Sepolia or Ethereum mainnet to send confidential tokens.
          </AlertDescription>
        </Alert>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-10 rounded-lg" />
          ))}
        </div>
      ) : pairs.length === 0 ? (
        <Alert>
          <AlertDescription>No confidential tokens found on this network yet.</AlertDescription>
        </Alert>
      ) : (
        <SendForm pairs={pairs} chainId={chainId} />
      )}
    </div>
  )
}
