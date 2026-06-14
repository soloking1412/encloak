"use client"

import { useState } from "react"
import { isAddress } from "viem"
import { useReadContract } from "wagmi"
import { CheckCircle2, XCircle, CircleDot } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { WrappersRegistryABI, ERC7984WrapperABI, ERC20ABI } from "@/lib/contracts/abis"
import { REGISTRY_ADDRESSES } from "@/lib/contracts/addresses"

interface Props {
  chainId: number
}

export function AddPairValidator({ chainId }: Props) {
  const [erc20Input, setErc20Input] = useState("")
  const [wrapperInput, setWrapperInput] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const erc20Addr = isAddress(erc20Input) ? (erc20Input as `0x${string}`) : undefined
  const wrapperAddr = isAddress(wrapperInput) ? (wrapperInput as `0x${string}`) : undefined
  const registryAddress = REGISTRY_ADDRESSES[chainId]

  const { data: registryCheck } = useReadContract({
    address: registryAddress,
    abi: WrappersRegistryABI,
    functionName: "getConfidentialTokenAddress",
    args: erc20Addr ? [erc20Addr] : undefined,
    query: { enabled: submitted && !!erc20Addr && !!registryAddress },
  })

  const { data: wrapperRate } = useReadContract({
    address: wrapperAddr,
    abi: ERC7984WrapperABI,
    functionName: "rate",
    query: { enabled: submitted && !!wrapperAddr },
  })

  const { data: wrapperDecimals } = useReadContract({
    address: wrapperAddr,
    abi: ERC7984WrapperABI,
    functionName: "decimals",
    query: { enabled: submitted && !!wrapperAddr },
  })

  const { data: erc20Symbol } = useReadContract({
    address: erc20Addr,
    abi: ERC20ABI,
    functionName: "symbol",
    query: { enabled: submitted && !!erc20Addr },
  })

  const { data: wrapperSymbol } = useReadContract({
    address: wrapperAddr,
    abi: ERC20ABI,
    functionName: "symbol",
    query: { enabled: submitted && !!wrapperAddr },
  })

  const isRegistered = submitted && registryCheck?.[0] === true
  const isValidWrapper = submitted && wrapperRate !== undefined

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Validate a New Pair</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Check if an ERC-20 + wrapper pair is valid before adding to{" "}
          <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">config/customPairs.ts</code>.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">ERC-20 address</Label>
            <Input
              placeholder="0x…"
              value={erc20Input}
              className="h-8 text-sm font-mono"
              onChange={(e) => { setErc20Input(e.target.value); setSubmitted(false) }}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Wrapper address</Label>
            <Input
              placeholder="0x…"
              value={wrapperInput}
              className="h-8 text-sm font-mono"
              onChange={(e) => { setWrapperInput(e.target.value); setSubmitted(false) }}
            />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setSubmitted(true)}
          disabled={!erc20Addr || !wrapperAddr}
        >
          Validate
        </Button>

        {submitted && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              {isRegistered
                ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                : <CircleDot className="h-4 w-4 text-muted-foreground shrink-0" />}
              <span className={isRegistered ? "text-emerald-400" : "text-muted-foreground"}>
                {isRegistered ? "In onchain registry" : "Not in registry — can be added as custom pair"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {isValidWrapper
                ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
              <span className={isValidWrapper ? "text-emerald-400" : "text-destructive"}>
                {isValidWrapper
                  ? `Valid ERC-7984 wrapper — rate=${wrapperRate?.toString()}, decimals=${wrapperDecimals}`
                  : "Could not read wrapper — not an ERC-7984 contract"}
              </span>
            </div>

            {!isRegistered && isValidWrapper && (
              <div className="rounded-lg bg-muted/40 border border-border/60 p-3 mt-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Add to <code className="font-mono">config/customPairs.ts</code>:
                </p>
                <pre className="text-xs text-foreground overflow-x-auto leading-relaxed">{`{
  chainId: ${chainId},
  erc20: {
    address: "${erc20Input}",
    name: "…",
    symbol: "${erc20Symbol ?? "?"}",
    decimals: 18,
  },
  wrapper: {
    address: "${wrapperInput}",
    name: "…",
    symbol: "${wrapperSymbol ?? "?"}",
    decimals: ${wrapperDecimals ?? 6},
  },
}`}</pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
