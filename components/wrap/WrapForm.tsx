"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { formatUnits } from "viem"
import { toast } from "sonner"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useWrap } from "@/hooks/useWrap"
import { formatTokenAmount } from "@/lib/format"
import { etherscanTx as ethTx } from "@/lib/contracts/addresses"
import type { WrapperPair } from "@/types"

interface Props {
  pairs: WrapperPair[]
  chainId: number
  defaultToken?: string
}

export function WrapForm({ pairs, chainId, defaultToken }: Props) {
  const { address } = useAccount()

  const defaultPair =
    pairs.find((p) => p.erc20.address.toLowerCase() === defaultToken?.toLowerCase()) ??
    pairs[0] ??
    null

  const [selectedPair, setSelectedPair] = useState<WrapperPair | null>(defaultPair)
  const [amount, setAmount] = useState("")

  const {
    state,
    error,
    approveTxHash,
    wrapTxHash,
    erc20Balance,
    needsApproval,
    outputAmount,
    isLoading,
    execute,
    reset,
  } = useWrap(selectedPair, amount)

  const setMax = () => {
    if (erc20Balance && selectedPair)
      setAmount(formatUnits(erc20Balance, selectedPair.erc20.decimals))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) {
      toast.error("Connect your wallet first")
      return
    }
    await execute()
    if (state === "success" || wrapTxHash) {
      toast.success("Wrapped successfully", {
        action: wrapTxHash
          ? { label: "View tx", onClick: () => window.open(ethTx(chainId, wrapTxHash), "_blank") }
          : undefined,
      })
      setAmount("")
      reset()
    }
  }

  const steps = [
    { label: "Approve", done: ["approved", "wrapping", "success"].includes(state) },
    { label: "Wrap", done: state === "success" },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label>Token pair</Label>
        <Select
          value={selectedPair?.erc20.address ?? ""}
          onValueChange={(v) => {
            setSelectedPair(pairs.find((p) => p.erc20.address === v) ?? null)
            setAmount("")
            reset()
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a token" />
          </SelectTrigger>
          <SelectContent>
            {pairs.map((p) => (
              <SelectItem key={p.erc20.address} value={p.erc20.address}>
                {p.erc20.symbol} → {p.wrapper.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedPair && (
        <div
          key={selectedPair.wrapper.address}
          className="rounded-lg border border-border/60 bg-muted/20 p-4 animate-in fade-in slide-in-from-bottom-1 duration-300"
        >
          <div className="flex items-center gap-3 text-sm">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">You send</p>
              <p className="font-semibold truncate">{selectedPair.erc20.symbol}</p>
              <p className="text-xs text-muted-foreground truncate">{selectedPair.erc20.name}</p>
            </div>
            <div className="shrink-0 h-7 w-7 rounded-full bg-border/80 flex items-center justify-center">
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">You receive</p>
              <p className="font-semibold text-primary truncate">{selectedPair.wrapper.symbol}</p>
              <p className="text-xs text-muted-foreground truncate">{selectedPair.wrapper.name}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Amount</Label>
          {erc20Balance !== undefined && selectedPair && (
            <button
              type="button"
              onClick={setMax}
              className="text-xs text-primary hover:underline"
            >
              Balance: {formatTokenAmount(erc20Balance, selectedPair.erc20.decimals)}
            </button>
          )}
        </div>
        <Input
          type="number"
          min="0"
          step="any"
          placeholder="0.0"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value)
            if (state !== "idle") reset()
          }}
        />
        {selectedPair && amount && outputAmount !== undefined && (
          <p className="text-sm text-muted-foreground">
            You receive ≈{" "}
            <span className="font-medium text-foreground">
              {formatTokenAmount(outputAmount, selectedPair.wrapper.decimals)} {selectedPair.wrapper.symbol}
            </span>
            {outputAmount === 0n && (
              <span className="text-destructive ml-2 text-xs">
                Too small — min {selectedPair.rate.toString()} {selectedPair.erc20.symbol}
              </span>
            )}
          </p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {(state === "approving" || state === "approved" || state === "wrapping" || state === "success") && (
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 animate-in fade-in slide-in-from-top-1 duration-300">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              {i > 0 && <div className="h-px w-6 bg-border flex-shrink-0" />}
              <div className="flex items-center gap-1.5">
                <span
                  key={`${s.label}-${s.done}`}
                  className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 animate-in zoom-in-50 duration-300 ${
                    s.done
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "border border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {s.done ? "✓" : i + 1}
                </span>
                <span className={`text-sm transition-colors duration-300 ${s.done ? "text-emerald-400" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {approveTxHash && (
        <p className="text-xs text-muted-foreground">
          Approve tx:{" "}
          <a
            href={ethTx(chainId, approveTxHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            {approveTxHash.slice(0, 10)}…
          </a>
        </p>
      )}

      <Button
        type="submit"
        disabled={!address || isLoading || !selectedPair || !amount || state === "success"}
        className="w-full"
      >
        {!address
          ? "Connect wallet"
          : isLoading
          ? state === "approving"
            ? "Approving…"
            : "Wrapping…"
          : needsApproval
          ? "Approve & Wrap"
          : "Wrap"}
      </Button>
    </form>
  )
}
