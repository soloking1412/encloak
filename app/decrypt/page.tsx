"use client"

import { useChainId } from "wagmi"
import { LockKeyhole } from "lucide-react"
import { useRegistryPairs } from "@/hooks/useRegistryPairs"
import { DecryptPanel } from "@/components/decrypt/DecryptPanel"

export default function DecryptPage() {
  const chainId = useChainId()
  const { pairs, isLoading } = useRegistryPairs()

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <LockKeyhole className="h-3.5 w-3.5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Decrypt Balances</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          View your decrypted ERC-7984 balance via EIP-712 user decryption — powered by Zama FHE.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted/40 animate-pulse" style={{ opacity: 1 - i * 0.18 }} />
          ))}
        </div>
      ) : (
        <DecryptPanel pairs={pairs} chainId={chainId} />
      )}
    </div>
  )
}
