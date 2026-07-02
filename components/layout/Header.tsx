"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useChainId, useAccount } from "wagmi"
import { sepolia } from "wagmi/chains"
import { Shield } from "lucide-react"
import { NetworkSwitcher } from "./NetworkSwitcher"
import { ThemeToggle } from "./ThemeToggle"
import { usePendingUnwraps } from "@/hooks/usePendingUnwraps"
import { Badge } from "@/components/ui/badge"

const NAV = [
  { href: "/", label: "Registry" },
  { href: "/wrap", label: "Wrap" },
  { href: "/send", label: "Send" },
  { href: "/decrypt", label: "Decrypt" },
  { href: "/add-pair", label: "Add Pair" },
  { href: "/activity", label: "Activity" },
  { href: "/guide", label: "Guide" },
]

export function Header() {
  const pathname = usePathname()
  const chainId = useChainId()
  const { address } = useAccount()
  const { mine } = usePendingUnwraps(address, chainId)
  const pendingCount = mine.filter((u) => u.status !== "done").length

  const links = chainId === sepolia.id ? [...NAV, { href: "/faucet", label: "Faucet" }] : NAV

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Shield className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">CWR</span>
            <span className="hidden text-xs text-muted-foreground sm:block">
              Confidential Wrapper Registry
            </span>
          </Link>

          <nav className="flex items-center gap-0.5 text-sm overflow-x-auto">
            {links.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative rounded-md px-3 py-1.5 font-medium transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap ${
                    isActive
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  {link.label}
                  {link.label === "Wrap" && pendingCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="h-4 min-w-4 px-1 text-[9px] leading-none animate-in zoom-in-50 duration-300"
                    >
                      {pendingCount}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <NetworkSwitcher />
          <ConnectButton accountStatus="avatar" chainStatus="none" showBalance={false} />
        </div>
      </div>
    </header>
  )
}
