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
