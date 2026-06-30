"use client"

import { useState, useCallback } from "react"
import { useAccount, usePublicClient, useWalletClient } from "wagmi"
import { parseUnits } from "viem"
import { getZamaSDK, requestUnwrap, finalizeUnwrap as finalizeUnwrapTx } from "@/lib/sdk"
import { usePendingUnwraps } from "./usePendingUnwraps"
import type { WrapperPair } from "@/types"

export type UnwrapState =
  | "idle"
  | "encrypting"
  | "requesting"
  | "pending"
  | "finalizing"
  | "success"
  | "error"

function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : "Transaction failed"
  if (msg.includes("User rejected") || msg.includes("rejected")) return "Transaction rejected"
  return msg.slice(0, 140)
}

export function useUnwrap(pair: WrapperPair | null, rawAmount: string) {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [state, setState] = useState<UnwrapState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [requestId, setRequestId] = useState<`0x${string}` | undefined>()
  const [finalizeTxHash, setFinalizeTxHash] = useState<`0x${string}` | undefined>()

  const { add } = usePendingUnwraps(address, pair?.chainId)

  const decimals = pair?.wrapper.decimals ?? 6
  const amount = (() => {
    try {
      return rawAmount ? parseUnits(rawAmount, decimals) : 0n
    } catch {
      return 0n
    }
  })()

  const initiateUnwrap = useCallback(async () => {
    if (!pair || !address || amount === 0n || !publicClient || !walletClient) return
    setError(null)

    try {
      setState("encrypting")
      const sdk = await getZamaSDK(walletClient, publicClient, pair.chainId)

      setState("requesting")
      const { unwrapTxHash, burnHandle, requestId: id } = await requestUnwrap(
        sdk,
        pair.wrapper.address,
        amount
      )

      setRequestId(id)
      add({
        requestId: id,
        burnHandle,
        unwrapTxHash,
        wrapperAddress: pair.wrapper.address,
        wrapperSymbol: pair.wrapper.symbol,
        chainId: pair.chainId,
        walletAddress: address,
        timestamp: Date.now(),
        status: "pending",
      })
      setState("pending")
    } catch (e: unknown) {
      setError(friendlyError(e))
      setState("error")
    }
  }, [pair, address, amount, publicClient, walletClient, add])

  const finalize = useCallback(
    async (wrapperAddress: `0x${string}`, burnHandle: `0x${string}`, chainId: number) => {
      if (!publicClient || !walletClient) throw new Error("Wallet not connected")
      const sdk = await getZamaSDK(walletClient, publicClient, chainId)
      const hash = await finalizeUnwrapTx(sdk, wrapperAddress, burnHandle)
      setFinalizeTxHash(hash)
      return hash
    },
    [publicClient, walletClient]
  )

  const reset = useCallback(() => {
    setState("idle")
    setError(null)
    setRequestId(undefined)
    setFinalizeTxHash(undefined)
  }, [])

  return {
    state,
    error,
    requestId,
    finalizeTxHash,
    isLoading: state === "encrypting" || state === "requesting",
    initiateUnwrap,
    finalize,
    reset,
  }
}
