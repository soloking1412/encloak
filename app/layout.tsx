import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import "@rainbow-me/rainbowkit/styles.css"
import { Providers } from "./providers"
import { Header } from "@/components/layout/Header"
import { Toaster } from "@/components/ui/sonner"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Confidential Wrapper Registry",
  description:
    "Browse, wrap, unwrap, and decrypt every ERC-20 ↔ ERC-7984 confidential token pair on Sepolia and Ethereum mainnet.",
  openGraph: {
    title: "Confidential Wrapper Registry",
    description: "The canonical ERC-7984 wrapper registry — powered by Zama FHE",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}>
      <body className="min-h-screen bg-background text-foreground">
        <Providers>
          <Header />
          <main className="mx-auto max-w-7xl px-4 py-10">{children}</main>
        </Providers>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
