"use client"

import { useChainId } from "wagmi"
import { Plus } from "lucide-react"
import { AddPairForm } from "@/components/pairs/AddPairForm"
import { CustomPairsManager } from "@/components/pairs/CustomPairsManager"

export default function AddPairPage() {
  const chainId = useChainId()

  return (
    <div className="space-y-8 max-w-2xl animate-in fade-in slide-in-from-bottom-1 duration-500">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Plus className="h-3.5 w-3.5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Add a Pair</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Extend the registry with any ERC-20 ↔ ERC-7984 pair — no redeploy, no config edit.
        </p>
      </div>

      <AddPairForm chainId={chainId} />
      <CustomPairsManager chainId={chainId} />
    </div>
  )
}
