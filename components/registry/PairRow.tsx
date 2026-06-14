"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Copy, ArrowRight } from "lucide-react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useDecryptBalance } from "@/hooks/useDecryptBalance"
import { truncateAddress, formatRate, formatTVS, formatTokenAmount } from "@/lib/format"
import { etherscanAddr } from "@/lib/contracts/addresses"
import type { WrapperPair } from "@/types"

const AVATAR_PALETTE = [
  "bg-violet-500/15 text-violet-400",
  "bg-blue-500/15 text-blue-400",
  "bg-emerald-500/15 text-emerald-400",
  "bg-amber-500/15 text-amber-400",
  "bg-rose-500/15 text-rose-400",
  "bg-cyan-500/15 text-cyan-400",
  "bg-orange-500/15 text-orange-400",
  "bg-pink-500/15 text-pink-400",
]

function symbolColor(symbol: string) {
  let h = 0
  for (let i = 0; i < symbol.length; i++) h = (h * 31 + symbol.charCodeAt(i)) | 0
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

function TokenAvatar({ symbol }: { symbol: string }) {
  const initials = symbol.replace(/^c/, "").slice(0, 3).toUpperCase()
  return (
    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${symbolColor(symbol)}`}>
      {initials}
    </div>
  )
}

function AddrLink({ address, chainId }: { address: string; chainId: number }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <span className="flex items-center gap-0.5">
      <a
        href={etherscanAddr(chainId, address)}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-xs text-primary/70 hover:text-primary transition-colors"
      >
        {truncateAddress(address)}
      </a>
      <button
        onClick={copy}
        className="rounded p-0.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        title="Copy address"
      >
        {copied
          ? <span className="text-emerald-500 text-[10px]">✓</span>
          : <Copy className="h-2.5 w-2.5" />}
      </button>
    </span>
  )
}

export function PairRow({ pair, chainId }: { pair: WrapperPair; chainId: number }) {
  const router = useRouter()
  const { balances, loading, errors, decrypt } = useDecryptBalance()
  const [rateOpen, setRateOpen] = useState(false)

  const key = pair.wrapper.address.toLowerCase()

  return (
    <>
      <TableRow className="group hover:bg-muted/30 transition-colors">
        <TableCell>
          <div className="flex items-center gap-2.5">
            <TokenAvatar symbol={pair.wrapper.symbol} />
            <div className="min-w-0">
              <p className="font-medium text-sm leading-tight">{pair.wrapper.symbol}</p>
              <p className="text-xs text-muted-foreground leading-tight truncate max-w-28">
                {pair.erc20.symbol}
              </p>
            </div>
          </div>
        </TableCell>

        <TableCell>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground/60 w-9 shrink-0">ERC-20</span>
              <AddrLink address={pair.erc20.address} chainId={chainId} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground/60 w-9 shrink-0">cToken</span>
              <AddrLink address={pair.wrapper.address} chainId={chainId} />
            </div>
          </div>
        </TableCell>

        <TableCell>
          <button
            onClick={() => setRateOpen(true)}
            className="font-mono text-sm hover:text-primary transition-colors"
            title="View rate details"
          >
            {formatRate(pair.rate)}
          </button>
        </TableCell>

        <TableCell>
          <span className="font-mono text-sm">
            {formatTVS(pair.inferredTotalSupply, pair.wrapper.decimals)}
          </span>
          <span className="text-muted-foreground text-xs ml-1">{pair.wrapper.symbol}</span>
        </TableCell>

        <TableCell>
          {balances[key] !== undefined ? (
            <span className="font-mono text-sm text-emerald-400">
              {formatTokenAmount(balances[key], pair.wrapper.decimals)}{" "}
              <span className="text-xs text-muted-foreground">{pair.wrapper.symbol}</span>
            </span>
          ) : errors[key] ? (
            <span className="text-xs text-destructive max-w-32 block">{errors[key]}</span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => decrypt(pair.wrapper.address, chainId)}
              disabled={loading[key]}
            >
              {loading[key] ? "Decrypting…" : "Decrypt"}
            </Button>
          )}
        </TableCell>

        <TableCell>
          <Badge
            variant={pair.source === "onchain" ? "default" : "secondary"}
            className="text-[10px] h-5"
          >
            {pair.source}
          </Badge>
        </TableCell>

        <TableCell>
          <Button
            size="sm"
            className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => router.push(`/wrap?token=${pair.erc20.address}`)}
          >
            Wrap
          </Button>
        </TableCell>
      </TableRow>

      <Dialog open={rateOpen} onOpenChange={setRateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TokenAvatar symbol={pair.wrapper.symbol} />
              {pair.wrapper.symbol} — Rate & Decimals
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="rounded-lg border border-border/60 divide-y divide-border/60">
              {[
                ["Conversion rate", pair.rate.toString()],
                ["ERC-20 decimals", pair.erc20.decimals],
                ["Wrapper decimals", pair.wrapper.decimals],
              ].map(([label, val]) => (
                <div key={String(label)} className="flex justify-between px-4 py-2.5">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-mono">{String(val)}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-muted/40 p-4 space-y-2">
              <p className="font-medium text-sm flex items-center gap-1.5">
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                Example conversion
              </p>
              <p className="text-muted-foreground text-sm">
                Wrap{" "}
                <code className="bg-background px-1.5 py-0.5 rounded text-foreground font-mono text-xs">
                  {pair.rate.toString()} {pair.erc20.symbol}
                </code>{" "}
                to receive{" "}
                <code className="bg-background px-1.5 py-0.5 rounded text-primary font-mono text-xs">
                  1 {pair.wrapper.symbol}
                </code>
              </p>
              <p className="text-xs text-muted-foreground">
                Amounts truncate to the nearest rate multiple — any remainder is not wrapped.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
