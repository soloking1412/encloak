"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { toast } from "sonner"
import { LockKeyhole } from "lucide-react"
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
import { useUnwrap } from "@/hooks/useUnwrap"
import { etherscanTx as ethTx } from "@/lib/contracts/addresses"
import type { WrapperPair } from "@/types"

const STATE_LABELS: Record<string, string> = {
  idle: "Initiate Unwrap",
  encrypting: "Encrypting…",
  requesting: "Submitting…",
  pending: "Awaiting relayer",
  finalizing: "Finalizing…",
  success: "Done",
  error: "Try again",
}

interface Props {
  pairs: WrapperPair[]
  chainId: number
}

export function UnwrapForm({ pairs, chainId }: Props) {
  const { address } = useAccount()
  const [selectedPair, setSelectedPair] = useState<WrapperPair | null>(pairs[0] ?? null)
  const [amount, setAmount] = useState("")

  const { state, error, requestId, finalizeTxHash, isLoading, initiateUnwrap, reset } =
    useUnwrap(selectedPair, amount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) {
      toast.error("Connect your wallet first")
      return
    }
    await initiateUnwrap()
  }

  const steps = [
    {
      label: "Encrypt & Submit",
      active: state === "encrypting" || state === "requesting",
      done: state === "pending" || state === "success",
    },
    {
      label: "Relayer decrypts",
      active: state === "pending",
      done: state === "success",
    },
    {
      label: "Finalize on-chain",
      active: state === "finalizing",
      done: state === "success",
    },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label>Confidential Token</Label>
        <Select
          value={selectedPair?.wrapper.address ?? ""}
          onValueChange={(v) => {
            setSelectedPair(pairs.find((p) => p.wrapper.address === v) ?? null)
            setAmount("")
            reset()
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a token">
              {(value) => {
                const p = pairs.find((x) => x.wrapper.address === value)
                return p ? `${p.wrapper.symbol} → ${p.erc20.symbol}` : "Select a token"
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {pairs.map((p) => (
              <SelectItem key={p.wrapper.address} value={p.wrapper.address}>
                {p.wrapper.symbol} → {p.erc20.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Amount</Label>
        <div className="relative">
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
            className="pr-9"
          />
          <LockKeyhole className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
        </div>
        <p className="text-xs text-muted-foreground">
          Balance is encrypted.{" "}
          <a href="/decrypt" className="text-primary hover:underline">
            Decrypt it first
          </a>{" "}
          to see your balance.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {state !== "idle" && state !== "error" && (
        <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center gap-3">
              <span
                key={`${s.label}-${s.done}-${s.active}`}
                className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 animate-in zoom-in-50 duration-300 ${
                  s.done
                    ? "bg-emerald-500/20 text-emerald-400"
                    : s.active
                    ? "bg-primary/20 text-primary"
                    : "border border-border bg-muted text-muted-foreground"
                }`}
              >
                {s.done ? "✓" : s.active ? "•" : i + 1}
              </span>
              <span
                className={`text-sm transition-colors duration-300 ${
                  s.done
                    ? "text-emerald-400"
                    : s.active
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {s.label}
                {s.active && <span className="ml-1 animate-pulse">…</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {state === "pending" && requestId && (
        <Alert>
          <AlertDescription className="space-y-1">
            <p className="text-sm">
              Request ID:{" "}
              <span className="font-mono text-xs text-muted-foreground">{requestId.slice(0, 20)}…</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Your request appears in Pending Unwraps above. Return to finalize once the relayer completes (5–30 min).
            </p>
          </AlertDescription>
        </Alert>
      )}

      {finalizeTxHash && (
        <p className="text-xs text-muted-foreground">
          Finalize tx:{" "}
          <a
            href={ethTx(chainId, finalizeTxHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            {finalizeTxHash.slice(0, 10)}…
          </a>
        </p>
      )}

      <Button
        type="submit"
        variant="outline"
        disabled={
          !address ||
          isLoading ||
          !selectedPair ||
          !amount ||
          state === "pending" ||
          state === "success"
        }
        className="w-full"
      >
        {!address ? "Connect wallet" : STATE_LABELS[state] ?? "Unwrap"}
      </Button>
    </form>
  )
}
