"use client"

import { useReducer, useEffect, useCallback } from "react"
import { useAccount, usePublicClient, useWalletClient, useChainId } from "wagmi"
import { getZamaSDK, decryptBalance, decryptAllBalances, isConfidentialToken } from "@/lib/sdk"
import { useActivity } from "@/hooks/useActivity"

// Decrypted balances are shared across the whole app (Decrypt, Wrap, Send) so a
// balance revealed on one page is immediately usable on another. Kept in memory
// only — cleared on reload and whenever the wallet or network changes.
interface Store {
  balances: Record<string, bigint>
  loading: Record<string, boolean>
  errors: Record<string, string>
  batchLoading: boolean
}

let store: Store = { balances: {}, loading: {}, errors: {}, batchLoading: false }
let scope = ""
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function set(patch: Partial<Store>) {
  store = { ...store, ...patch }
  emit()
}

function merge<K extends "balances" | "loading" | "errors">(key: K, entries: Store[K]) {
  store = { ...store, [key]: { ...store[key], ...entries } }
  emit()
}

export function useDecryptBalance() {
  const { address } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { add: logActivity } = useActivity()
  const [, forceRender] = useReducer((c) => c + 1, 0)

  useEffect(() => {
    listeners.add(forceRender)
    return () => {
      listeners.delete(forceRender)
    }
  }, [])

  // Clear cached plaintext when the wallet or network changes.
  useEffect(() => {
    const next = `${chainId}:${(address ?? "").toLowerCase()}`
    if (scope !== next) {
      scope = next
      store = { balances: {}, loading: {}, errors: {}, batchLoading: false }
      emit()
    }
  }, [address, chainId])

  const decrypt = useCallback(
    async (
      wrapperAddress: `0x${string}`,
      cid: number,
      symbol?: string,
      opts?: { validateFirst?: boolean }
    ) => {
      if (!address || !publicClient || !walletClient) return

      const key = wrapperAddress.toLowerCase()
      merge("loading", { [key]: true })
      merge("errors", { [key]: "" })

      try {
        const sdk = await getZamaSDK(walletClient, publicClient, cid)

        if (opts?.validateFirst) {
          const ok = await isConfidentialToken(sdk, wrapperAddress).catch(() => false)
          if (!ok) {
            merge("errors", { [key]: "This address is not an ERC-7984 confidential token." })
            return
          }
        }

        const balance = await decryptBalance(sdk, wrapperAddress)
        merge("balances", { [key]: balance })
        logActivity({
          type: "decrypt",
          label: `Decrypted ${symbol ?? "balance"}`,
          symbol,
          chainId: cid,
          walletAddress: address,
        })
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Decryption failed"
        merge("errors", {
          [key]:
            msg.includes("User rejected") || msg.includes("rejected")
              ? "Signature rejected"
              : "Decryption failed — not an ERC-7984 token or no balance",
        })
      } finally {
        merge("loading", { [key]: false })
      }
    },
    [address, publicClient, walletClient, logActivity]
  )

  const decryptAll = useCallback(
    async (wrapperAddresses: `0x${string}`[], cid: number) => {
      if (!address || !publicClient || !walletClient || wrapperAddresses.length === 0) return

      set({ batchLoading: true })
      merge("loading", Object.fromEntries(wrapperAddresses.map((a) => [a.toLowerCase(), true])))

      try {
        const sdk = await getZamaSDK(walletClient, publicClient, cid)
        const results = await decryptAllBalances(sdk, wrapperAddresses)
        merge("balances", results)
        logActivity({
          type: "decrypt",
          label: `Decrypted ${Object.keys(results).length} balances`,
          chainId: cid,
          walletAddress: address,
        })
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Decryption failed"
        const text = msg.includes("rejected") ? "Signature rejected" : "Batch decryption failed"
        merge("errors", Object.fromEntries(wrapperAddresses.map((a) => [a.toLowerCase(), text])))
      } finally {
        merge("loading", Object.fromEntries(wrapperAddresses.map((a) => [a.toLowerCase(), false])))
        set({ batchLoading: false })
      }
    },
    [address, publicClient, walletClient, logActivity]
  )

  return {
    balances: store.balances,
    loading: store.loading,
    errors: store.errors,
    batchLoading: store.batchLoading,
    decrypt,
    decryptAll,
  }
}
