"use client"

import type { WalletClient, PublicClient } from "viem"
import type { ZamaSDK } from "@zama-fhe/sdk"

let sdkInstance: ZamaSDK | null = null
let sdkKey: string | null = null

export async function getZamaSDK(
  walletClient: WalletClient,
  publicClient: PublicClient,
  chainId: number
): Promise<ZamaSDK> {
  const account = walletClient.account?.address ?? "anon"
  const key = `${chainId}:${account.toLowerCase()}`
  if (sdkInstance && sdkKey === key) return sdkInstance

  const { ZamaSDK, RelayerWeb, indexedDBStorage, SepoliaConfig, MainnetConfig } =
    await import("@zama-fhe/sdk")
  const { ViemSigner } = await import("@zama-fhe/sdk/viem")

  sdkInstance?.dispose()

  sdkInstance = new ZamaSDK({
    relayer: new RelayerWeb({
      getChainId: async () => chainId,
      transports: { 1: MainnetConfig, 11155111: SepoliaConfig },
    }),
    signer: new ViemSigner({ walletClient, publicClient }),
    storage: indexedDBStorage,
  })
  sdkKey = key
  return sdkInstance
}

export interface UnwrapRequest {
  unwrapTxHash: `0x${string}`
  burnHandle: `0x${string}`
  requestId: `0x${string}`
}

export async function requestUnwrap(
  sdk: ZamaSDK,
  wrapperAddress: `0x${string}`,
  amount: bigint
): Promise<UnwrapRequest> {
  const { findUnwrapRequested } = await import("@zama-fhe/sdk")
  const { txHash, receipt } = await sdk.createToken(wrapperAddress).unwrap(amount)
  const event = findUnwrapRequested(receipt.logs)
  if (!event?.encryptedAmount) {
    throw new Error("Unwrap request submitted but the UnwrapRequested event was not found")
  }
  return {
    unwrapTxHash: txHash,
    burnHandle: event.encryptedAmount,
    requestId: event.unwrapRequestId ?? txHash,
  }
}

export async function finalizeUnwrap(
  sdk: ZamaSDK,
  wrapperAddress: `0x${string}`,
  burnHandle: `0x${string}`
): Promise<`0x${string}`> {
  const { txHash } = await sdk.createToken(wrapperAddress).finalizeUnwrap(burnHandle)
  return txHash
}

export async function decryptBalance(
  sdk: ZamaSDK,
  wrapperAddress: `0x${string}`
): Promise<bigint> {
  return sdk.createReadonlyToken(wrapperAddress).balanceOf()
}

/** Confidentially transfer an encrypted amount to another address. The SDK
 * encrypts the amount via FHE and validates the sender's balance first. */
export async function confidentialTransfer(
  sdk: ZamaSDK,
  tokenAddress: `0x${string}`,
  to: `0x${string}`,
  amount: bigint
): Promise<`0x${string}`> {
  const { txHash } = await sdk.createToken(tokenAddress).confidentialTransfer(to, amount)
  return txHash
}

/** ERC-165 check that an address implements the ERC-7984 confidential token
 * interface — used to reject non-confidential tokens before a decrypt. */
export async function isConfidentialToken(
  sdk: ZamaSDK,
  address: `0x${string}`
): Promise<boolean> {
  return sdk.createReadonlyToken(address).isConfidential()
}

/** Decrypt many balances with a single wallet signature: pre-authorize all
 * addresses once, then read each (credentials are cached after the first). */
export async function decryptAllBalances(
  sdk: ZamaSDK,
  wrapperAddresses: `0x${string}`[]
): Promise<Record<string, bigint>> {
  if (wrapperAddresses.length === 0) return {}
  await sdk.allow(wrapperAddresses)
  const out: Record<string, bigint> = {}
  for (const addr of wrapperAddresses) {
    try {
      out[addr.toLowerCase()] = await sdk.createReadonlyToken(addr).balanceOf()
    } catch {
      // skip tokens that fail to decrypt; the caller surfaces partial results
    }
  }
  return out
}
