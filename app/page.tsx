"use client"

import { useChainId } from "wagmi"
import { Shield } from "lucide-react"
import { useRegistryPairs } from "@/hooks/useRegistryPairs"
import { RegistryTable } from "@/components/registry/RegistryTable"
import { TVSSummary } from "@/components/registry/TVSSummary"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RegistryPage() {
  const chainId = useChainId()
  const { pairs, isLoading, error, isSupported } = useRegistryPairs()

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
          <Shield className="h-3 w-3" />
          Zama Fully Homomorphic Encryption
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Wrapper Registry</h1>
          <p className="text-muted-foreground mt-1.5 max-w-xl">
            Every official ERC-20 ↔ ERC-7984 confidential token pair from the onchain registry.
            Wrap tokens into their encrypted equivalents, decrypt balances on-demand, or claim test tokens from the faucet.
          </p>
        </div>
      </div>

      {!isSupported && (
        <Alert variant="destructive">
          <AlertDescription>
            The Wrappers Registry is not deployed on this network. Switch to Sepolia or Ethereum mainnet.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load registry: {error.message}</AlertDescription>
        </Alert>
      )}

      {isSupported && (
        <>
          <TVSSummary pairs={pairs} isLoading={isLoading} />
          <RegistryTable pairs={pairs} chainId={chainId} isLoading={isLoading} />
        </>
      )}
    </div>
  )
}
