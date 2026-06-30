"use client"

import { useState, useCallback } from "react"
import { useAccount, usePublicClient, useWalletClient } from "wagmi"
import { getZamaSDK, decryptBalance } from "@/lib/sdk"

export function useDecryptBalance() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [balances, setBalances] = useState<Record<string, bigint>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const decrypt = useCallback(
    async (wrapperAddress: `0x${string}`, chainId: number) => {
      if (!address || !publicClient || !walletClient) return

      const key = wrapperAddress.toLowerCase()
      setLoading((p) => ({ ...p, [key]: true }))
      setErrors((p) => ({ ...p, [key]: "" }))

      try {
        const sdk = await getZamaSDK(walletClient, publicClient, chainId)
        const balance = await decryptBalance(sdk, wrapperAddress)
        setBalances((p) => ({ ...p, [key]: balance }))
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
    [address, publicClient, walletClient]
  )

  return { balances, loading, errors, decrypt }
}
