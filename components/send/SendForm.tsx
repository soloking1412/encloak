"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { formatUnits } from "viem"
import { toast } from "sonner"
import { Send, ShieldCheck, LockKeyhole, LockOpen } from "lucide-react"
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
import { useConfidentialTransfer } from "@/hooks/useConfidentialTransfer"
import { useDecryptBalance } from "@/hooks/useDecryptBalance"
import { truncateAddress, formatTokenAmount } from "@/lib/format"
import { etherscanTx as ethTx } from "@/lib/contracts/addresses"
import type { WrapperPair } from "@/types"

const STATE_LABELS: Record<string, string> = {
  idle: "Send confidentially",
  encrypting: "Encrypting amount…",
  sending: "Sending…",
  success: "Sent",
  error: "Try again",
}

interface Props {
  pairs: WrapperPair[]
  chainId: number
}

export function SendForm({ pairs, chainId }: Props) {
  const { address } = useAccount()
  const [selectedPair, setSelectedPair] = useState<WrapperPair | null>(pairs[0] ?? null)
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")

  const { state, error, txHash, recipientValid, isSelf, isLoading, send, reset } =
    useConfidentialTransfer(selectedPair, recipient, amount)

  const { balances, loading: decLoading, decrypt } = useDecryptBalance()
  const balKey = selectedPair?.wrapper.address.toLowerCase()
  const knownBalance = balKey ? balances[balKey] : undefined
  const decrypting = balKey ? decLoading[balKey] : false

  const setMax = () => {
    if (knownBalance !== undefined && selectedPair)
      setAmount(formatUnits(knownBalance, selectedPair.wrapper.decimals))
  }
  const handleDecrypt = () => {
    if (selectedPair) decrypt(selectedPair.wrapper.address, chainId, selectedPair.wrapper.symbol)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) {
      toast.error("Connect your wallet first")
      return
    }
    await send()
    if (txHash) {
      toast.success(`Sent ${selectedPair?.wrapper.symbol} confidentially`, {
        action: txHash
          ? { label: "View tx", onClick: () => window.open(ethTx(chainId, txHash), "_blank") }
          : undefined,
      })
      setAmount("")
      setRecipient("")
      reset()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3">
        <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          The amount is encrypted with FHE before it ever touches the chain. Observers see a transfer
          happened, but not how much — only you and the recipient can decrypt the balances.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Confidential token</Label>
        <Select
          value={selectedPair?.wrapper.address ?? ""}
          onValueChange={(v) => {
            setSelectedPair(pairs.find((p) => p.wrapper.address === v) ?? null)
            reset()
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a token">
              {(value) => pairs.find((p) => p.wrapper.address === value)?.wrapper.symbol ?? "Select a token"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {pairs.map((p) => (
              <SelectItem key={p.wrapper.address} value={p.wrapper.address}>
                {p.wrapper.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Recipient address</Label>
        <Input
          placeholder="0x…"
          value={recipient}
          className="font-mono text-sm"
          onChange={(e) => {
            setRecipient(e.target.value)
            if (state !== "idle") reset()
          }}
        />
        {recipient && !recipientValid && (
          <p className="text-xs text-destructive">Not a valid address.</p>
        )}
        {isSelf && (
          <p className="text-xs text-destructive">That&apos;s your own address.</p>
        )}
        {recipientValid && !isSelf && (
          <p className="text-xs text-muted-foreground">Sending to {truncateAddress(recipient)}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Amount</Label>
          {selectedPair &&
            (knownBalance !== undefined ? (
              <button
                type="button"
                onClick={setMax}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <LockOpen className="h-3 w-3" />
                Balance: {formatTokenAmount(knownBalance, selectedPair.wrapper.decimals)}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDecrypt}
                disabled={decrypting}
                className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
              >
                <LockKeyhole className="h-3 w-3" />
                {decrypting ? "Decrypting…" : "Decrypt balance"}
              </button>
            ))}
        </div>
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
        {knownBalance === undefined ? (
          <p className="text-xs text-muted-foreground">
            Your balance is encrypted — click <span className="text-foreground">Decrypt balance</span> to
            reveal how much you can send.
          </p>
        ) : knownBalance === 0n ? (
          <p className="text-xs text-muted-foreground">
            You hold 0 {selectedPair?.wrapper.symbol} — wrap some on the Wrap page first.
          </p>
        ) : null}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {txHash && (
        <p className="text-xs text-muted-foreground">
          Transfer tx:{" "}
          <a
            href={ethTx(chainId, txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            {txHash.slice(0, 10)}…
          </a>
        </p>
      )}

      <Button
        type="submit"
        disabled={
          !address ||
          isLoading ||
          !selectedPair ||
          !amount ||
          !recipientValid ||
          isSelf ||
          state === "success"
        }
        className="w-full gap-1.5"
      >
        {!address ? (
          "Connect wallet"
        ) : (
          <>
            {!isLoading && state !== "success" && <Send className="h-3.5 w-3.5" />}
            {STATE_LABELS[state] ?? "Send confidentially"}
          </>
        )}
      </Button>
    </form>
  )
}
