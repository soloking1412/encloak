"use client"

import { useState, useMemo } from "react"
import { isAddress, getAddress } from "viem"
import { useReadContracts, useAccount } from "wagmi"
import { CheckCircle2, XCircle, Plus, Search, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { WrappersRegistryABI, ERC7984WrapperABI, ERC20ABI } from "@/lib/contracts/abis"
import { REGISTRY_ADDRESSES } from "@/lib/contracts/addresses"
import { useCustomPairs } from "@/hooks/useCustomPairs"
import { useActivity } from "@/hooks/useActivity"
import type { StoredCustomPair } from "@/types"

interface Props {
  chainId: number
}

export function AddPairForm({ chainId }: Props) {
  const { address } = useAccount()
  const { add } = useCustomPairs(chainId)
  const { add: logActivity } = useActivity()

  const [erc20Input, setErc20Input] = useState("")
  const [wrapperInput, setWrapperInput] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const erc20Addr = isAddress(erc20Input) ? (erc20Input as `0x${string}`) : undefined
  const wrapperAddr = isAddress(wrapperInput) ? (wrapperInput as `0x${string}`) : undefined
  const registryAddress = REGISTRY_ADDRESSES[chainId]

  const contracts = useMemo(() => {
    if (!erc20Addr || !wrapperAddr) return []
    return [
      { address: registryAddress, abi: WrappersRegistryABI, functionName: "getConfidentialTokenAddress" as const, args: [erc20Addr] as const },
      { address: erc20Addr, abi: ERC20ABI, functionName: "name" as const },
      { address: erc20Addr, abi: ERC20ABI, functionName: "symbol" as const },
      { address: erc20Addr, abi: ERC20ABI, functionName: "decimals" as const },
      { address: wrapperAddr, abi: ERC7984WrapperABI, functionName: "name" as const },
      { address: wrapperAddr, abi: ERC7984WrapperABI, functionName: "symbol" as const },
      { address: wrapperAddr, abi: ERC7984WrapperABI, functionName: "decimals" as const },
      { address: wrapperAddr, abi: ERC7984WrapperABI, functionName: "rate" as const },
    ]
  }, [erc20Addr, wrapperAddr, registryAddress])

  const { data, isLoading } = useReadContracts({
    contracts,
    query: { enabled: submitted && contracts.length > 0 && !!registryAddress },
  })

  const registryCheck = data?.[0]?.result as readonly [boolean, `0x${string}`] | undefined
  const erc20Name = data?.[1]?.result as string | undefined
  const erc20Symbol = data?.[2]?.result as string | undefined
  const erc20Decimals = data?.[3]?.result as number | undefined
  const wrapperName = data?.[4]?.result as string | undefined
  const wrapperSymbol = data?.[5]?.result as string | undefined
  const wrapperDecimals = data?.[6]?.result as number | undefined
  const wrapperRate = data?.[7]?.result as bigint | undefined

  const ready = submitted && !isLoading && !!data
  const isRegistered = ready && registryCheck?.[0] === true
  const registryMatch =
    isRegistered && registryCheck?.[1]?.toLowerCase() === wrapperAddr?.toLowerCase()
  const isValidWrapper = ready && wrapperRate !== undefined && wrapperDecimals !== undefined
  const metadataOk =
    isValidWrapper && !!erc20Symbol && !!wrapperSymbol && erc20Decimals !== undefined

  const handleValidate = () => setSubmitted(true)

  const reset = () => {
    setErc20Input("")
    setWrapperInput("")
    setSubmitted(false)
  }

  const handleAdd = () => {
    if (!erc20Addr || !wrapperAddr || !metadataOk) return
    const pair: StoredCustomPair = {
      chainId,
      erc20: {
        address: getAddress(erc20Addr),
        name: erc20Name ?? erc20Symbol ?? "Token",
        symbol: erc20Symbol ?? "TKN",
        decimals: erc20Decimals ?? 18,
      },
      wrapper: {
        address: getAddress(wrapperAddr),
        name: wrapperName ?? wrapperSymbol ?? "Confidential Token",
        symbol: wrapperSymbol ?? "cTKN",
        decimals: wrapperDecimals ?? 6,
      },
      rate: (wrapperRate ?? 0n).toString(),
      addedAt: Date.now(),
    }
    add(pair)
    if (address) {
      logActivity({
        type: "add-pair",
        label: `Added custom pair ${pair.wrapper.symbol}`,
        symbol: pair.wrapper.symbol,
        chainId,
        walletAddress: address,
      })
    }
    toast.success(`Added ${pair.wrapper.symbol} to your registry`)
    reset()
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Add a Pair</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Paste an ERC-20 and its ERC-7984 wrapper. We validate them on-chain, auto-fetch
          token metadata, and add the pair to your registry — it appears instantly across
          Registry, Wrap, and Decrypt. Stored locally in your browser.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">ERC-20 address</Label>
            <Input
              placeholder="0x…"
              value={erc20Input}
              className="font-mono text-sm"
              onChange={(e) => { setErc20Input(e.target.value); setSubmitted(false) }}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Wrapper (ERC-7984) address</Label>
            <Input
              placeholder="0x…"
              value={wrapperInput}
              className="font-mono text-sm"
              onChange={(e) => { setWrapperInput(e.target.value); setSubmitted(false) }}
            />
          </div>
        </div>

        {erc20Input && !erc20Addr && (
          <p className="text-xs text-destructive">ERC-20 address is not a valid address.</p>
        )}
        {wrapperInput && !wrapperAddr && (
          <p className="text-xs text-destructive">Wrapper address is not a valid address.</p>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleValidate}
          disabled={!erc20Addr || !wrapperAddr || isLoading}
          className="gap-1.5"
        >
          <Search className="h-3.5 w-3.5" />
          {isLoading ? "Validating…" : "Validate on-chain"}
        </Button>

        {ready && (
          <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4 animate-in fade-in slide-in-from-top-1 duration-400">
            <div className="flex items-center gap-2 text-sm">
              {isRegistered
                ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                : <Badge variant="secondary" className="text-[10px] h-5">not in registry</Badge>}
              <span className={isRegistered ? "text-emerald-400" : "text-muted-foreground"}>
                {isRegistered
                  ? registryMatch
                    ? "In the onchain registry (addresses match)"
                    : "ERC-20 is registered — but to a different wrapper"
                  : "Not in the onchain registry — can still be added as a custom pair"}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              {isValidWrapper
                ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
              <span className={isValidWrapper ? "text-emerald-400" : "text-destructive"}>
                {isValidWrapper
                  ? "Valid ERC-7984 wrapper"
                  : "Could not read wrapper — not an ERC-7984 contract on this network"}
              </span>
            </div>

            {isRegistered && !registryMatch && (
              <Alert variant="destructive" className="py-2">
                <AlertDescription className="text-xs flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  The registry maps this ERC-20 to{" "}
                  <code className="font-mono">{registryCheck?.[1]?.slice(0, 10)}…</code>, not the
                  wrapper you entered.
                </AlertDescription>
              </Alert>
            )}

            {metadataOk && (
              <div className="rounded-md bg-background/60 p-3 text-sm space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">ERC-20</p>
                    <p className="font-medium truncate">{erc20Symbol}</p>
                    <p className="text-xs text-muted-foreground truncate">{erc20Name} · {erc20Decimals} dec</p>
                  </div>
                  <div className="text-muted-foreground">→</div>
                  <div className="min-w-0 text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Wrapper</p>
                    <p className="font-medium text-primary truncate">{wrapperSymbol}</p>
                    <p className="text-xs text-muted-foreground truncate">{wrapperName} · {wrapperDecimals} dec · rate {wrapperRate?.toString()}</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!metadataOk}
              className="gap-1.5 w-full"
            >
              <Plus className="h-3.5 w-3.5" />
              Add to my registry
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
