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
  status: "pending" | "finalizing" | "done"
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
