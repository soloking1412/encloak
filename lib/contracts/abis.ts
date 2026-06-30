export const WrappersRegistryABI = [
  {
    name: "getTokenConfidentialTokenPairs",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "tokenAddress", type: "address" },
          { name: "confidentialTokenAddress", type: "address" },
          { name: "isValid", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "getTokenConfidentialTokenPairsLength",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getConfidentialTokenAddress",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "erc20TokenAddress", type: "address" }],
    outputs: [
      { name: "isValid", type: "bool" },
      { name: "confidentialToken", type: "address" },
    ],
  },
  {
    name: "getTokenAddress",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "confidentialWrapperAddress", type: "address" }],
    outputs: [
      { name: "isValid", type: "bool" },
      { name: "token", type: "address" },
    ],
  },
  {
    name: "isConfidentialTokenValid",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "confidentialWrapperAddress", type: "address" }],
    outputs: [{ name: "isValid", type: "bool" }],
  },
  {
    name: "ConfidentialTokenRegistered",
    type: "event",
    inputs: [
      { name: "tokenAddress", type: "address", indexed: true },
      { name: "confidentialTokenAddress", type: "address", indexed: true },
    ],
  },
  {
    name: "ConfidentialTokenRevoked",
    type: "event",
    inputs: [
      { name: "tokenAddress", type: "address", indexed: true },
      { name: "confidentialTokenAddress", type: "address", indexed: true },
    ],
  },
] as const

export const ERC7984WrapperABI = [
  {
    name: "wrap",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "unwrap",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "encryptedAmount", type: "bytes32" },
      { name: "inputProof", type: "bytes" },
    ],
    outputs: [],
  },
  {
    name: "finalizeUnwrap",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "burntAmount", type: "bytes32" },
      { name: "burntAmountCleartext", type: "uint64" },
      { name: "decryptionProof", type: "bytes" },
    ],
    outputs: [],
  },
  {
    name: "rate",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "inferredTotalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "Wrapped",
    type: "event",
    inputs: [
      { name: "to", type: "address", indexed: true },
      { name: "amountIn", type: "uint256", indexed: false },
    ],
  },
  {
    name: "UnwrapRequested",
    type: "event",
    inputs: [
      { name: "receiver", type: "address", indexed: true },
      { name: "unwrapRequestId", type: "bytes32", indexed: true },
      { name: "amount", type: "bytes32", indexed: false },
    ],
  },
  {
    name: "UnwrapFinalized",
    type: "event",
    inputs: [
      { name: "receiver", type: "address", indexed: true },
      { name: "unwrapRequestId", type: "bytes32", indexed: true },
      { name: "encryptedAmount", type: "bytes32", indexed: false },
      { name: "cleartextAmount", type: "uint64", indexed: false },
    ],
  },
] as const

export const ERC20ABI = [
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "Transfer",
    type: "event",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
  {
    name: "Approval",
    type: "event",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "spender", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const
