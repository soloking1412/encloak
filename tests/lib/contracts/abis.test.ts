import { describe, it, expect } from "vitest"
import { WrappersRegistryABI, ERC7984WrapperABI, ERC20ABI } from "@/lib/contracts/abis"

function findFn(abi: readonly object[], name: string) {
  return abi.find((e: unknown) => {
    const entry = e as { type: string; name: string }
    return entry.type === "function" && entry.name === name
  }) as { inputs: unknown[]; outputs: unknown[]; stateMutability: string } | undefined
}

function findEvent(abi: readonly object[], name: string) {
  return abi.find((e: unknown) => {
    const entry = e as { type: string; name: string }
    return entry.type === "event" && entry.name === name
  }) as { inputs: unknown[] } | undefined
}

describe("WrappersRegistryABI", () => {
  it("has getTokenConfidentialTokenPairs as a view function", () => {
    const fn = findFn(WrappersRegistryABI, "getTokenConfidentialTokenPairs")
    expect(fn).toBeDefined()
    expect(fn?.stateMutability).toBe("view")
    expect(fn?.inputs).toHaveLength(0)
  })

  it("getTokenConfidentialTokenPairs returns a tuple array with tokenAddress, confidentialTokenAddress, isValid", () => {
    const fn = findFn(WrappersRegistryABI, "getTokenConfidentialTokenPairs")
    const output = (fn?.outputs?.[0] as { components?: Array<{ name: string }> })
    expect(output?.components?.map((c) => c.name)).toEqual([
      "tokenAddress",
      "confidentialTokenAddress",
      "isValid",
    ])
  })

  it("has getConfidentialTokenAddress with one address input", () => {
    const fn = findFn(WrappersRegistryABI, "getConfidentialTokenAddress")
    expect(fn).toBeDefined()
    expect((fn?.inputs?.[0] as { type: string })?.type).toBe("address")
  })

  it("has getConfidentialTokenAddress returning (bool, address)", () => {
    const fn = findFn(WrappersRegistryABI, "getConfidentialTokenAddress")
    const outputs = fn?.outputs as Array<{ type: string }>
    expect(outputs?.[0]?.type).toBe("bool")
    expect(outputs?.[1]?.type).toBe("address")
  })

  it("has isConfidentialTokenValid as a view function", () => {
    const fn = findFn(WrappersRegistryABI, "isConfidentialTokenValid")
    expect(fn?.stateMutability).toBe("view")
  })

  it("emits ConfidentialTokenRegistered event with two indexed address inputs", () => {
    const ev = findEvent(WrappersRegistryABI, "ConfidentialTokenRegistered")
    expect(ev).toBeDefined()
    const inputs = ev?.inputs as Array<{ type: string; indexed: boolean }>
    expect(inputs).toHaveLength(2)
    inputs.forEach((inp) => {
      expect(inp.type).toBe("address")
      expect(inp.indexed).toBe(true)
    })
  })
})

describe("ERC7984WrapperABI", () => {
  it("has wrap as a nonpayable function with (address to, uint256 amount)", () => {
    const fn = findFn(ERC7984WrapperABI, "wrap")
    expect(fn?.stateMutability).toBe("nonpayable")
    const inputs = fn?.inputs as Array<{ name: string; type: string }>
    expect(inputs?.[0]?.name).toBe("to")
    expect(inputs?.[0]?.type).toBe("address")
    expect(inputs?.[1]?.name).toBe("amount")
    expect(inputs?.[1]?.type).toBe("uint256")
  })

  it("has unwrap with (address from, address to, bytes32 encryptedAmount, bytes inputProof)", () => {
    const fn = findFn(ERC7984WrapperABI, "unwrap")
    const inputs = fn?.inputs as Array<{ name: string; type: string }>
    expect(inputs?.[0]?.type).toBe("address")
    expect(inputs?.[1]?.type).toBe("address")
    expect(inputs?.[2]?.type).toBe("bytes32")
    expect(inputs?.[3]?.type).toBe("bytes")
  })

  it("has finalizeUnwrap with (bytes32 unwrapRequestId, uint64 clearAmount, bytes proof)", () => {
    const fn = findFn(ERC7984WrapperABI, "finalizeUnwrap")
    expect(fn?.stateMutability).toBe("nonpayable")
    const inputs = fn?.inputs as Array<{ name: string; type: string }>
    expect(inputs?.[0]?.type).toBe("bytes32")
    expect(inputs?.[1]?.type).toBe("uint64")
    expect(inputs?.[2]?.type).toBe("bytes")
  })

  it("has rate() as a view function returning uint256", () => {
    const fn = findFn(ERC7984WrapperABI, "rate")
    expect(fn?.stateMutability).toBe("view")
    expect((fn?.outputs?.[0] as { type: string })?.type).toBe("uint256")
  })

  it("has decimals() as a view function returning uint8", () => {
    const fn = findFn(ERC7984WrapperABI, "decimals")
    expect(fn?.stateMutability).toBe("view")
    expect((fn?.outputs?.[0] as { type: string })?.type).toBe("uint8")
  })

  it("has inferredTotalSupply() returning uint256", () => {
    const fn = findFn(ERC7984WrapperABI, "inferredTotalSupply")
    expect(fn?.stateMutability).toBe("view")
    expect((fn?.outputs?.[0] as { type: string })?.type).toBe("uint256")
  })

  it("emits Wrapped event with (address indexed to, uint256 amountIn)", () => {
    const ev = findEvent(ERC7984WrapperABI, "Wrapped")
    expect(ev).toBeDefined()
    const inputs = ev?.inputs as Array<{ name: string; type: string; indexed: boolean }>
    expect(inputs?.[0]?.name).toBe("to")
    expect(inputs?.[0]?.indexed).toBe(true)
    expect(inputs?.[1]?.name).toBe("amountIn")
    expect(inputs?.[1]?.type).toBe("uint256")
    expect(inputs?.[1]?.indexed).toBe(false)
  })

  it("emits UnwrapRequested event with indexed receiver and unwrapRequestId", () => {
    const ev = findEvent(ERC7984WrapperABI, "UnwrapRequested")
    const inputs = ev?.inputs as Array<{ name: string; indexed: boolean }>
    const receiver = inputs?.find((i) => i.name === "receiver")
    const reqId = inputs?.find((i) => i.name === "unwrapRequestId")
    expect(receiver?.indexed).toBe(true)
    expect(reqId?.indexed).toBe(true)
  })

  it("emits UnwrapFinalized event with cleartextAmount as uint64", () => {
    const ev = findEvent(ERC7984WrapperABI, "UnwrapFinalized")
    const inputs = ev?.inputs as Array<{ name: string; type: string }>
    const clearAmt = inputs?.find((i) => i.name === "cleartextAmount")
    expect(clearAmt?.type).toBe("uint64")
  })
})

describe("ERC20ABI", () => {
  it("has standard ERC-20 view functions", () => {
    expect(findFn(ERC20ABI, "name")?.stateMutability).toBe("view")
    expect(findFn(ERC20ABI, "symbol")?.stateMutability).toBe("view")
    expect(findFn(ERC20ABI, "decimals")?.stateMutability).toBe("view")
    expect(findFn(ERC20ABI, "totalSupply")?.stateMutability).toBe("view")
    expect(findFn(ERC20ABI, "balanceOf")?.stateMutability).toBe("view")
    expect(findFn(ERC20ABI, "allowance")?.stateMutability).toBe("view")
  })

  it("has approve as a nonpayable function returning bool", () => {
    const fn = findFn(ERC20ABI, "approve")
    expect(fn?.stateMutability).toBe("nonpayable")
    expect((fn?.outputs?.[0] as { type: string })?.type).toBe("bool")
  })

  it("has mint(address to, uint256 amount) for Sepolia mocks", () => {
    const fn = findFn(ERC20ABI, "mint")
    expect(fn?.stateMutability).toBe("nonpayable")
    const inputs = fn?.inputs as Array<{ name: string; type: string }>
    expect(inputs?.[0]?.name).toBe("to")
    expect(inputs?.[0]?.type).toBe("address")
    expect(inputs?.[1]?.name).toBe("amount")
    expect(inputs?.[1]?.type).toBe("uint256")
  })

  it("emits Transfer(from, to, value) event", () => {
    const ev = findEvent(ERC20ABI, "Transfer")
    const inputs = ev?.inputs as Array<{ name: string; indexed: boolean }>
    expect(inputs?.find((i) => i.name === "from")?.indexed).toBe(true)
    expect(inputs?.find((i) => i.name === "to")?.indexed).toBe(true)
    expect(inputs?.find((i) => i.name === "value")?.indexed).toBe(false)
  })

  it("emits Approval(owner, spender, value) event", () => {
    const ev = findEvent(ERC20ABI, "Approval")
    expect(ev).toBeDefined()
    const inputs = ev?.inputs as Array<{ name: string; indexed: boolean }>
    expect(inputs?.find((i) => i.name === "owner")?.indexed).toBe(true)
    expect(inputs?.find((i) => i.name === "spender")?.indexed).toBe(true)
  })
})
