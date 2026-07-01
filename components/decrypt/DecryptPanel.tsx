"use client"

import { useState } from "react"
import { isAddress } from "viem"
import { useAccount } from "wagmi"
import { LockKeyhole, LockOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useDecryptBalance } from "@/hooks/useDecryptBalance"
import { formatTokenAmount, truncateAddress } from "@/lib/format"
import type { WrapperPair } from "@/types"

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

interface Props {
  pairs: WrapperPair[]
  chainId: number
}

export function DecryptPanel({ pairs, chainId }: Props) {
  const { address } = useAccount()
  const { balances, loading, errors, batchLoading, decrypt, decryptAll } = useDecryptBalance()
  const [customAddr, setCustomAddr] = useState("")
  const [customDecimals, setCustomDecimals] = useState("6")

  const customAddress = isAddress(customAddr) ? (customAddr as `0x${string}`) : undefined
  const customKey = customAddr.toLowerCase()

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">My Balances</h2>
          {pairs.length > 0 && address && (
            <Button
              size="sm"
              className="h-7 text-xs gap-1.5"
              disabled={batchLoading}
              onClick={() => decryptAll(pairs.map((p) => p.wrapper.address), chainId)}
            >
              <LockOpen className="h-3.5 w-3.5" />
              {batchLoading ? "Decrypting…" : "Decrypt all"}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Decrypt all balances with a single EIP-712 signature, or reveal them one at a time.
        </p>

        {!address && (
          <Alert>
            <AlertDescription>Connect your wallet to decrypt balances.</AlertDescription>
          </Alert>
        )}

        {pairs.length > 0 ? (
          <div className="rounded-xl border border-border/60 divide-y divide-border/60">
            {pairs.map((pair, i) => {
              const key = pair.wrapper.address.toLowerCase()
              const balance = balances[key]
              const isLoading = loading[key]
              const err = errors[key]
              const initials = pair.wrapper.symbol.replace(/^c/, "").slice(0, 3).toUpperCase()

              return (
                <div
                  key={pair.wrapper.address}
                  className="flex items-center justify-between px-4 py-3 gap-4 animate-in fade-in slide-in-from-left-1 fill-mode-both duration-400"
                  style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${symbolColor(pair.wrapper.symbol)}`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-sm">{pair.wrapper.symbol}</p>
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 hidden sm:inline-flex">
                          {pair.source}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {truncateAddress(pair.wrapper.address)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {balance !== undefined ? (
                      <span className="font-mono text-sm text-emerald-400 flex items-center gap-1.5 animate-in fade-in blur-in zoom-in-95 duration-500">
                        <LockOpen className="h-3.5 w-3.5" />
                        {formatTokenAmount(balance, pair.wrapper.decimals)}{" "}
                        <span className="text-xs text-muted-foreground">{pair.wrapper.symbol}</span>
                      </span>
                    ) : err ? (
                      <span className="text-xs text-destructive max-w-36">{err}</span>
                    ) : null}
                    <Button
                      size="sm"
                      variant={balance !== undefined ? "outline" : "default"}
                      className="h-7 text-xs"
                      onClick={() => decrypt(pair.wrapper.address, chainId, pair.wrapper.symbol)}
                      disabled={isLoading || !address}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-1.5">
                          <LockKeyhole className="h-3 w-3 animate-pulse" />
                          Decrypting
                        </span>
                      ) : balance !== undefined ? (
                        "Refresh"
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <LockKeyhole className="h-3 w-3" />
                          Decrypt
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4">No pairs loaded yet.</p>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Arbitrary ERC-7984 Token</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Decrypt your balance for any ERC-7984 wrapper — even if it's not in the registry.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Wrapper address</Label>
            <Input
              placeholder="0x…"
              value={customAddr}
              onChange={(e) => setCustomAddr(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Decimals</Label>
            <Input
              type="number"
              min="0"
              max="18"
              value={customDecimals}
              onChange={(e) => setCustomDecimals(e.target.value)}
            />
          </div>
        </div>

        {errors[customKey] && (
          <Alert variant="destructive">
            <AlertDescription>{errors[customKey]}</AlertDescription>
          </Alert>
        )}

        {balances[customKey] !== undefined && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 animate-in fade-in slide-in-from-bottom-1 zoom-in-95 duration-500">
            <LockOpen className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-sm">
              Balance:{" "}
              <span className="font-mono font-semibold text-emerald-400">
                {formatTokenAmount(balances[customKey], parseInt(customDecimals) || 6)}
              </span>
            </span>
          </div>
        )}

        <Button
          onClick={() => customAddress && decrypt(customAddress, chainId)}
          disabled={!customAddress || loading[customKey] || !address}
          variant="outline"
          className="flex items-center gap-2"
        >
          <LockKeyhole className="h-3.5 w-3.5" />
          {loading[customKey] ? "Decrypting…" : "Decrypt Balance"}
        </Button>
      </div>
    </div>
  )
}
