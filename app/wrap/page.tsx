"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useChainId } from "wagmi"
import { ArrowRightLeft } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRegistryPairs } from "@/hooks/useRegistryPairs"
import { WrapForm } from "@/components/wrap/WrapForm"
import { UnwrapForm } from "@/components/wrap/UnwrapForm"
import { PendingUnwraps } from "@/components/wrap/PendingUnwraps"

function WrapPageInner() {
  const chainId = useChainId()
  const searchParams = useSearchParams()
  const defaultToken = searchParams.get("token") ?? undefined
  const { pairs, isLoading } = useRegistryPairs()

  return (
    <div className="space-y-8 max-w-2xl animate-in fade-in slide-in-from-bottom-1 duration-500">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <ArrowRightLeft className="h-3.5 w-3.5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Wrap / Unwrap</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Convert ERC-20 tokens into confidential equivalents and back.
        </p>
      </div>

      <PendingUnwraps />

      <Tabs defaultValue="wrap">
        <TabsList className="w-full">
          <TabsTrigger value="wrap" className="flex-1">
            ERC-20 → cToken
          </TabsTrigger>
          <TabsTrigger value="unwrap" className="flex-1">
            cToken → ERC-20
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wrap" className="pt-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-10 rounded-lg" />
              ))}
            </div>
          ) : (
            <WrapForm pairs={pairs} chainId={chainId} defaultToken={defaultToken} />
          )}
        </TabsContent>

        <TabsContent value="unwrap" className="pt-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-10 rounded-lg" />
              ))}
            </div>
          ) : (
            <UnwrapForm pairs={pairs} chainId={chainId} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function WrapPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-xl" />}>
      <WrapPageInner />
    </Suspense>
  )
}
