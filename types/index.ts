export interface TokenMetadata {
  address: `0x${string}`
  name: string
  symbol: string
  decimals: number
}

export interface WrapperPair {
  chainId: number
  erc20: TokenMetadata
  wrapper: TokenMetadata
  rate: bigint
  inferredTotalSupply: bigint
  isValid: boolean
  source: "onchain" | "custom"
}

export interface PendingUnwrap {
  requestId: `0x${string}`
  burnHandle: `0x${string}`
  unwrapTxHash: `0x${string}`
  wrapperAddress: `0x${string}`
  wrapperSymbol: string
  chainId: number
  walletAddress: `0x${string}`
  timestamp: number
  status: "pending" | "ready" | "finalizing" | "done"
}

export interface CustomPair {
  chainId: number
  erc20: {
    address: string
    name: string
    symbol: string
    decimals: number
  }
  wrapper: {
    address: string
    name: string
    symbol: string
    decimals: number
  }
}

/** A user-added pair persisted in localStorage. `rate` is stored as a string
 * because bigint is not JSON-serializable. */
export interface StoredCustomPair {
  chainId: number
  erc20: TokenMetadata
  wrapper: TokenMetadata
  rate: string
  addedAt: number
}

export type ActivityType =
  | "wrap"
  | "unwrap"
  | "finalize"
  | "faucet"
  | "decrypt"
  | "add-pair"
  | "transfer"

export interface ActivityItem {
  id: string
  type: ActivityType
  label: string
  symbol?: string
  txHash?: `0x${string}`
  chainId: number
  walletAddress: `0x${string}`
  timestamp: number
}
