"use client"

import { useState, useCallback } from "react"
import { isAddress, parseUnits } from "viem"
import { useAccount, usePublicClient, useWalletClient } from "wagmi"
import { getZamaSDK, confidentialTransfer } from "@/lib/sdk"
import { useActivity } from "@/hooks/useActivity"
import type { WrapperPair } from "@/types"

export type TransferState = "idle" | "encrypting" | "sending" | "success" | "error"

function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : "Transfer failed"
  if (msg.includes("User rejected") || msg.includes("rejected")) return "Transaction rejected"
  if (msg.toLowerCase().includes("insufficient")) return "Insufficient confidential balance"
  if (msg.includes("BalanceCheckUnavailable") || msg.includes("decryption is not possible"))
    return "Could not verify your balance — decrypt it once on My Balances, then retry"
  return msg.slice(0, 140)
}

export function useConfidentialTransfer(pair: WrapperPair | null, recipient: string, rawAmount: string) {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { add: logActivity } = useActivity()

  const [state, setState] = useState<TransferState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()

  const decimals = pair?.wrapper.decimals ?? 6
  const amount = (() => {
    try {
      return rawAmount ? parseUnits(rawAmount, decimals) : 0n
    } catch {
      return 0n
    }
  })()

  const recipientValid = isAddress(recipient)
  const isSelf = recipientValid && !!address && recipient.toLowerCase() === address.toLowerCase()

  const send = useCallback(async () => {
    if (!pair || !address || !publicClient || !walletClient) return
    if (!recipientValid) {
      setError("Enter a valid recipient address")
      setState("error")
      return
    }
    if (isSelf) {
      setError("Recipient can't be your own address")
      setState("error")
      return
    }
    if (amount === 0n) {
      setError("Enter an amount greater than zero")
      setState("error")
      return
    }

    setError(null)
    try {
      setState("encrypting")
      const sdk = await getZamaSDK(walletClient, publicClient, pair.chainId)

      setState("sending")
      const hash = await confidentialTransfer(
        sdk,
        pair.wrapper.address,
        recipient as `0x${string}`,
        amount
      )
      setTxHash(hash)
      setState("success")
      logActivity({
        type: "transfer",
        label: `Sent ${rawAmount} ${pair.wrapper.symbol} confidentially`,
        symbol: pair.wrapper.symbol,
        txHash: hash,
        chainId: pair.chainId,
        walletAddress: address,
      })
    } catch (e: unknown) {
      setError(friendlyError(e))
      setState("error")
    }
  }, [pair, address, publicClient, walletClient, recipientValid, isSelf, amount, recipient, rawAmount, logActivity])

  const reset = useCallback(() => {
    setState("idle")
    setError(null)
    setTxHash(undefined)
  }, [])

  return {
    state,
    error,
    txHash,
    recipientValid,
    isSelf,
    isLoading: state === "encrypting" || state === "sending",
    send,
    reset,
  }
}
