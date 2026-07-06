"use client"

import { useState, useCallback } from "react"
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useAccount,
  usePublicClient,
} from "wagmi"
import { parseUnits } from "viem"
import { ERC20ABI, ERC7984WrapperABI } from "@/lib/contracts/abis"
import { useActivity } from "@/hooks/useActivity"
import type { WrapperPair } from "@/types"

export type WrapState =
  | "idle"
  | "checking"
  | "approving"
  | "approved"
  | "wrapping"
  | "success"
  | "error"

export function useWrap(pair: WrapperPair | null, rawAmount: string) {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { add: logActivity } = useActivity()
  const [state, setState] = useState<WrapState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [approveTxHash, setApproveTxHash] = useState<`0x${string}` | undefined>()
  const [wrapTxHash, setWrapTxHash] = useState<`0x${string}` | undefined>()

  const decimals = pair?.erc20.decimals ?? 18
  const amount = (() => {
    try {
      return rawAmount ? parseUnits(rawAmount, decimals) : 0n
    } catch {
      return 0n
    }
  })()

  const { data: allowance } = useReadContract({
    address: pair?.erc20.address,
    abi: ERC20ABI,
    functionName: "allowance",
    args: address && pair ? [address, pair.wrapper.address] : undefined,
    query: { enabled: !!address && !!pair },
  })

  const { data: erc20Balance } = useReadContract({
    address: pair?.erc20.address,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!pair },
  })

  const { writeContractAsync } = useWriteContract()
  const { isLoading: approveConfirming } = useWaitForTransactionReceipt({ hash: approveTxHash })
  const { isLoading: wrapConfirming } = useWaitForTransactionReceipt({ hash: wrapTxHash })

  const execute = useCallback(async () => {
    if (!pair || !address || amount === 0n) return
    setError(null)

    try {
      if ((erc20Balance ?? 0n) < amount) {
        setError("Insufficient balance")
        setState("error")
        return
      }

      setState("checking")

      if ((allowance ?? 0n) < amount) {
        setState("approving")
        const approveHash = await writeContractAsync({
          address: pair.erc20.address,
          abi: ERC20ABI,
          functionName: "approve",
          args: [pair.wrapper.address, amount],
        })
        setApproveTxHash(approveHash)
        // Wait for the approval to be mined so the wrap can be gas-estimated
        // against a state where the allowance actually exists. Without this,
        // wrap estimation fails, the wallet falls back to the block gas limit,
        // and the RPC rejects it with "gas limit too high".
        await publicClient?.waitForTransactionReceipt({ hash: approveHash })
        setState("approved")
      }

      setState("wrapping")
      // Estimate gas explicitly through our RPC (FHE wraps estimate poorly
      // through some wallet RPCs) and buffer it, so we never submit with the
      // block-limit fallback that triggers "gas limit too high".
      let gas: bigint | undefined
      try {
        const estimate = await publicClient?.estimateContractGas({
          address: pair.wrapper.address,
          abi: ERC7984WrapperABI,
          functionName: "wrap",
          args: [address, amount],
          account: address,
        })
        if (estimate) gas = (estimate * 130n) / 100n
      } catch {
        gas = undefined
      }

      const hash = await writeContractAsync({
        address: pair.wrapper.address,
        abi: ERC7984WrapperABI,
        functionName: "wrap",
        args: [address, amount],
        ...(gas ? { gas } : {}),
      })
      setWrapTxHash(hash)
      setState("success")
      logActivity({
        type: "wrap",
        label: `Wrapped ${rawAmount} ${pair.erc20.symbol} → ${pair.wrapper.symbol}`,
        symbol: pair.wrapper.symbol,
        txHash: hash,
        chainId: pair.chainId,
        walletAddress: address,
      })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Transaction failed"
      setError(msg.includes("User rejected") ? "Transaction rejected" : msg.slice(0, 120))
      setState("error")
    }
  }, [pair, address, amount, allowance, erc20Balance, writeContractAsync, publicClient, rawAmount, logActivity])

  const reset = useCallback(() => {
    setState("idle")
    setError(null)
    setApproveTxHash(undefined)
    setWrapTxHash(undefined)
  }, [])

  const needsApproval = (allowance ?? 0n) < amount && amount > 0n
  const outputAmount = pair && pair.rate > 0n ? amount / pair.rate : 0n

  return {
    state,
    error,
    approveTxHash,
    wrapTxHash,
    erc20Balance,
    allowance,
    needsApproval,
    outputAmount,
    isLoading: approveConfirming || wrapConfirming || state === "approving" || state === "wrapping",
    execute,
    reset,
  }
}
