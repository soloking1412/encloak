"use client"

import { useState, useCallback } from "react"
import { useAccount, usePublicClient, useWalletClient } from "wagmi"
import { getZamaSDK, decryptBalance, decryptAllBalances, isConfidentialToken } from "@/lib/sdk"
import { useActivity } from "@/hooks/useActivity"

export function useDecryptBalance() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { add: logActivity } = useActivity()
  const [balances, setBalances] = useState<Record<string, bigint>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [batchLoading, setBatchLoading] = useState(false)

  const decrypt = useCallback(
    async (
      wrapperAddress: `0x${string}`,
      chainId: number,
      symbol?: string,
      opts?: { validateFirst?: boolean }
    ) => {
      if (!address || !publicClient || !walletClient) return

      const key = wrapperAddress.toLowerCase()
      setLoading((p) => ({ ...p, [key]: true }))
      setErrors((p) => ({ ...p, [key]: "" }))

      try {
        const sdk = await getZamaSDK(walletClient, publicClient, chainId)

        if (opts?.validateFirst) {
          const ok = await isConfidentialToken(sdk, wrapperAddress).catch(() => false)
          if (!ok) {
            setErrors((p) => ({
              ...p,
              [key]: "This address is not an ERC-7984 confidential token.",
            }))
            return
          }
        }

        const balance = await decryptBalance(sdk, wrapperAddress)
        setBalances((p) => ({ ...p, [key]: balance }))
        logActivity({
          type: "decrypt",
          label: `Decrypted ${symbol ?? "balance"}`,
          symbol,
          chainId,
          walletAddress: address,
        })
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Decryption failed"
        setErrors((p) => ({
          ...p,
          [key]: msg.includes("User rejected") || msg.includes("rejected")
            ? "Signature rejected"
            : "Decryption failed — not an ERC-7984 token or no balance",
        }))
      } finally {
        setLoading((p) => ({ ...p, [key]: false }))
      }
    },
    [address, publicClient, walletClient, logActivity]
  )

  const decryptAll = useCallback(
    async (wrapperAddresses: `0x${string}`[], chainId: number) => {
      if (!address || !publicClient || !walletClient || wrapperAddresses.length === 0) return

      setBatchLoading(true)
      setLoading((p) => {
        const next = { ...p }
        for (const a of wrapperAddresses) next[a.toLowerCase()] = true
        return next
      })

      try {
        const sdk = await getZamaSDK(walletClient, publicClient, chainId)
        const results = await decryptAllBalances(sdk, wrapperAddresses)
        setBalances((p) => ({ ...p, ...results }))
        logActivity({
          type: "decrypt",
          label: `Decrypted ${Object.keys(results).length} balances`,
          chainId,
          walletAddress: address,
        })
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Decryption failed"
        const text = msg.includes("rejected") ? "Signature rejected" : "Batch decryption failed"
        setErrors((p) => {
          const next = { ...p }
          for (const a of wrapperAddresses) next[a.toLowerCase()] = text
          return next
        })
      } finally {
        setLoading((p) => {
          const next = { ...p }
          for (const a of wrapperAddresses) next[a.toLowerCase()] = false
          return next
        })
        setBatchLoading(false)
      }
    },
    [address, publicClient, walletClient, logActivity]
  )

  return { balances, loading, errors, batchLoading, decrypt, decryptAll }
}
