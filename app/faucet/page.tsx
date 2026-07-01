"use client"

import { useMemo } from "react"
import { useChainId } from "wagmi"
import { sepolia } from "wagmi/chains"
import { useSwitchChain } from "wagmi"
import { Droplets } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { FaucetCard } from "@/components/faucet/FaucetCard"
import { SEPOLIA_PAIRS } from "@/lib/contracts/addresses"
import { useReadContracts } from "wagmi"
import { ERC20ABI } from "@/lib/contracts/abis"

export default function FaucetPage() {
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const mockPairs = SEPOLIA_PAIRS.filter((p) => p.isMock)

  const metadataCalls = useMemo(
    () =>
      mockPairs.flatMap((p) => [
        { address: p.erc20, abi: ERC20ABI, functionName: "name" as const },
        { address: p.erc20, abi: ERC20ABI, functionName: "decimals" as const },
      ]),
    []
  )

  const { data: metadata } = useReadContracts({
    contracts: metadataCalls,
    query: { enabled: chainId === sepolia.id },
  })

  if (chainId !== sepolia.id) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-500">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Droplets className="h-3.5 w-3.5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Faucet</h1>
          </div>
          <p className="text-muted-foreground text-sm">Claim Sepolia test tokens to try the wrap/unwrap flow.</p>
        </div>
        <Alert>
          <AlertDescription className="flex items-center justify-between flex-wrap gap-3">
            <span>The faucet is only available on Sepolia testnet.</span>
            <Button size="sm" onClick={() => switchChain({ chainId: sepolia.id })}>
              Switch to Sepolia
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-1 duration-500">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Droplets className="h-3.5 w-3.5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Faucet</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Claim 1,000 of each cTokenMock to try wrapping on Sepolia. No daily limit — mint on demand.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mockPairs.map((pair, i) => {
          const nameResult = metadata?.[i * 2]?.result
          const decimalsResult = metadata?.[i * 2 + 1]?.result
          return (
            <div
              key={pair.erc20}
              className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <FaucetCard
                symbol={pair.symbol}
                name={(nameResult as string) ?? pair.symbol}
                erc20Address={pair.erc20}
                wrapperAddress={pair.wrapper}
                decimals={(decimalsResult as number) ?? 18}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
