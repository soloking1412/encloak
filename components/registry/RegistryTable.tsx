"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { PairRow } from "./PairRow"
import type { WrapperPair } from "@/types"

interface Props {
  pairs: WrapperPair[]
  chainId: number
  isLoading: boolean
}

export function RegistryTable({ pairs, chainId, isLoading }: Props) {
  const [filter, setFilter] = useState("")

  const filtered = useMemo(() => {
    if (!filter) return pairs
    const q = filter.toLowerCase()
    return pairs.filter(
      (p) =>
        p.wrapper.symbol.toLowerCase().includes(q) ||
        p.erc20.symbol.toLowerCase().includes(q) ||
        p.wrapper.address.toLowerCase().includes(q) ||
        p.erc20.address.toLowerCase().includes(q)
    )
  }, [pairs, filter])

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-14 rounded-lg" style={{ opacity: 1 - i * 0.15 }} />
        ))}
      </div>
    )
  }

  if (!pairs.length) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 p-16 text-center">
        <p className="text-muted-foreground text-sm">No wrapper pairs found on this network.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Filter by symbol or address…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border border-border/60 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/60 hover:bg-transparent">
              <TableHead className="text-xs font-medium">Token</TableHead>
              <TableHead className="text-xs font-medium">Addresses</TableHead>
              <TableHead className="text-xs font-medium">Rate</TableHead>
              <TableHead className="text-xs font-medium">TVS</TableHead>
              <TableHead className="text-xs font-medium">Your Balance</TableHead>
              <TableHead className="text-xs font-medium">Source</TableHead>
              <TableHead className="text-xs font-medium"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((pair, i) => (
              <PairRow key={pair.wrapper.address} pair={pair} chainId={chainId} index={i} />
            ))}
          </TableBody>
        </Table>
      </div>

      {filter && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {pairs.length} pairs
        </p>
      )}
    </div>
  )
}
