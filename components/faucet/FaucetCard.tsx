"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseUnits } from "viem"
import { toast } from "sonner"
import { ArrowRight, Droplets } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ERC20ABI } from "@/lib/contracts/abis"
import { etherscanTx as ethTx } from "@/lib/contracts/addresses"
import { timeAgo, truncateAddress } from "@/lib/format"

const FAUCET_KEY = "zama_faucet_claims"
const CLAIM_AMOUNT = "1000"
const CHAIN_ID = 11155111

const AVATAR_PALETTE = [
  "bg-violet-500/15 text-violet-400",
  "bg-blue-500/15 text-blue-400",
  "bg-emerald-500/15 text-emerald-400",
  "bg-amber-500/15 text-amber-400",
  "bg-rose-500/15 text-rose-400",
  "bg-cyan-500/15 text-cyan-400",
]

function symbolColor(symbol: string) {
  let h = 0
  for (let i = 0; i < symbol.length; i++) h = (h * 31 + symbol.charCodeAt(i)) | 0
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

interface FaucetEntry {
  walletAddress: string
  erc20Address: string
  timestamp: number
}

function loadClaims(): FaucetEntry[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(FAUCET_KEY) ?? "[]")
  } catch {
    return []
  }
}

function saveClaim(wallet: string, erc20: string) {
  if (typeof window === "undefined") return
  const existing = loadClaims().filter(
    (c) =>
      !(
        c.walletAddress.toLowerCase() === wallet.toLowerCase() &&
        c.erc20Address.toLowerCase() === erc20.toLowerCase()
      )
  )
  localStorage.setItem(
    FAUCET_KEY,
    JSON.stringify([
      ...existing,
      { walletAddress: wallet, erc20Address: erc20, timestamp: Date.now() },
    ])
  )
}

interface Props {
  symbol: string
  name: string
  erc20Address: `0x${string}`
  wrapperAddress: `0x${string}`
  decimals: number
}

export function FaucetCard({ symbol, name, erc20Address, wrapperAddress, decimals }: Props) {
  const { address } = useAccount()
  const router = useRouter()
  const [lastClaim, setLastClaim] = useState<number | null>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  const [claimed, setClaimed] = useState(false)

  useEffect(() => {
    if (!address) return
    const claim = loadClaims().find(
      (c) =>
        c.walletAddress.toLowerCase() === address.toLowerCase() &&
        c.erc20Address.toLowerCase() === erc20Address.toLowerCase()
    )
    setLastClaim(claim?.timestamp ?? null)
  }, [address, erc20Address])

  const { writeContractAsync } = useWriteContract()
  const { isLoading: confirming } = useWaitForTransactionReceipt({ hash: txHash })

  const handleClaim = async () => {
    if (!address) {
      toast.error("Connect your wallet first")
      return
    }
    try {
      const hash = await writeContractAsync({
        address: erc20Address,
        abi: ERC20ABI,
        functionName: "mint",
        args: [address, parseUnits(CLAIM_AMOUNT, decimals)],
      })
      setTxHash(hash)
      saveClaim(address, erc20Address)
      setLastClaim(Date.now())
      setClaimed(true)
      toast.success(`Claimed ${CLAIM_AMOUNT} ${symbol}`, {
        action: {
          label: "View tx",
          onClick: () => window.open(ethTx(CHAIN_ID, hash), "_blank"),
        },
      })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Claim failed"
      toast.error(msg.includes("User rejected") ? "Transaction rejected" : "Claim failed")
    }
  }

  const initials = symbol.replace(/Mock$/, "").replace(/^c/, "").slice(0, 3).toUpperCase()

  return (
    <Card className="border-border/60 hover:border-border transition-colors">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${symbolColor(symbol)}`}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight">{symbol}</p>
            <p className="text-xs text-muted-foreground truncate">{name}</p>
          </div>
          <Droplets className="h-4 w-4 text-muted-foreground/40 ml-auto shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4">
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>ERC-20</span>
            <a
              href={`https://sepolia.etherscan.io/address/${erc20Address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono hover:text-primary transition-colors"
            >
              {truncateAddress(erc20Address)}
            </a>
          </div>
          <div className="flex items-center justify-between">
            <span>Wrapper</span>
            <a
              href={`https://sepolia.etherscan.io/address/${wrapperAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono hover:text-primary transition-colors"
            >
              {truncateAddress(wrapperAddress)}
            </a>
          </div>
        </div>

        {lastClaim && (
          <p className="text-xs text-muted-foreground">
            Last claimed {timeAgo(lastClaim)}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            className="flex-1 h-8 text-xs"
            onClick={handleClaim}
            disabled={confirming || !address}
          >
            {confirming ? "Claiming…" : `Claim ${CLAIM_AMOUNT}`}
          </Button>
          {claimed && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={() => router.push(`/wrap?token=${erc20Address}`)}
            >
              Wrap
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
