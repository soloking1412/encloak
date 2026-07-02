"use client"

import { useEffect, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider } from "wagmi"
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit"
import { ThemeProvider, useTheme } from "next-themes"
import { wagmiConfig } from "@/config/wagmi"

function RainbowKit({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Until mounted, server and first client render must match, so default to dark.
  const theme =
    mounted && resolvedTheme === "light"
      ? lightTheme({ accentColor: "#5f3add", borderRadius: "medium", fontStack: "system" })
      : darkTheme({ accentColor: "#9586ff", borderRadius: "medium", fontStack: "system" })

  return <RainbowKitProvider theme={theme}>{children}</RainbowKitProvider>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 2 },
        },
      })
  )

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKit>{children}</RainbowKit>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  )
}
