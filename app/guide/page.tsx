import Link from "next/link"
import type { Metadata } from "next"
import {
  BookOpen,
  Shield,
  ArrowRightLeft,
  LockOpen,
  Clock,
  Plus,
  Droplets,
  ArrowRight,
  KeyRound,
  Wallet,
  CircleHelp,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "Guide — Confidential Wrapper Registry",
  description:
    "How confidential ERC-7984 tokens work: wrapping, decrypting balances with EIP-712, the two-step async unwrap, and adding custom pairs.",
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">
        {n}
      </div>
      <div className="space-y-1 pb-1">
        <p className="text-sm font-medium leading-tight">{title}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
      </div>
    </div>
  )
}

function SectionHeading({
  icon: Icon,
  title,
  id,
}: {
  icon: typeof Shield
  title: string
  id: string
}) {
  return (
    <div id={id} className="flex items-center gap-2 scroll-mt-24">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
    </div>
  )
}

const TOC = [
  { href: "#what", label: "What is a confidential token" },
  { href: "#wrap", label: "Wrapping" },
  { href: "#decrypt", label: "Decrypting balances" },
  { href: "#unwrap", label: "Unwrapping (async)" },
  { href: "#custom", label: "Adding a pair" },
  { href: "#faq", label: "FAQ" },
]

export default function GuidePage() {
  return (
    <div className="space-y-10 max-w-3xl">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
          <BookOpen className="h-3 w-3" />
          Guide
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">How it works</h1>
          <p className="text-muted-foreground mt-1.5 max-w-xl">
            Everything you need to move between public ERC-20s and their encrypted ERC-7984
            equivalents — wrapping, decrypting, the two-step unwrap, and adding your own pairs.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 pt-1">
          {TOC.map((t) => (
            <a
              key={t.href}
              href={t.href}
              className="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
            >
              {t.label}
            </a>
          ))}
        </nav>
      </div>

      {/* What is a confidential token */}
      <section className="space-y-4">
        <SectionHeading icon={Shield} title="What is a confidential token?" id="what" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          An <strong className="text-foreground">ERC-7984</strong> token is an ERC-20-style token
          whose balances and transfer amounts are{" "}
          <strong className="text-foreground">encrypted on-chain</strong>{" "}
          using Zama&apos;s Fully Homomorphic Encryption (FHE). Anyone can verify
          the chain, but only you can read your own balance. Each confidential token (a{" "}
          <em>wrapper</em>, prefixed <code className="text-xs bg-muted px-1 rounded">c</code>) is
          backed 1:1-by-rate by a public ERC-20 held in the wrapper contract.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Shield, title: "Encrypted balances", body: "Amounts live on-chain as FHE ciphertext handles, not plaintext." },
            { icon: KeyRound, title: "You hold the key", body: "Only your wallet signature can decrypt your balance." },
            { icon: ArrowRightLeft, title: "Fully reversible", body: "Wrap in and unwrap out to the underlying ERC-20 at any time." },
          ].map((c) => (
            <Card key={c.title} className="border-border/60">
              <CardContent className="pt-5 pb-5 space-y-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <c.icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium">{c.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm">
          <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">
            You need a wallet (MetaMask, Rabby, …) on <strong className="text-foreground">Sepolia</strong> or{" "}
            <strong className="text-foreground">Ethereum mainnet</strong>. On Sepolia, grab test tokens from the{" "}
            <Link href="/faucet" className="text-primary hover:underline inline-flex items-center gap-0.5">
              faucet <Droplets className="h-3 w-3" />
            </Link>{" "}
            first.
          </span>
        </div>
      </section>

      <Separator />

      {/* Wrapping */}
      <section className="space-y-4">
        <SectionHeading icon={ArrowRightLeft} title="Wrapping — ERC-20 → confidential" id="wrap" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Wrapping deposits a public ERC-20 into the wrapper contract and mints you the encrypted
          equivalent. It&apos;s a normal, public transaction — nothing is encrypted yet, so no
          signature-based decryption is involved.
        </p>
        <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-3">
          <Step n={1} title="Approve">
            Grant the wrapper permission to pull your ERC-20. Skipped automatically if you already
            approved enough.
          </Step>
          <Step n={2} title="Wrap">
            Call <code className="text-xs bg-muted px-1 rounded">wrap(you, amount)</code>. Your ERC-20
            balance drops and your confidential balance increases.
          </Step>
          <Step n={3} title="Mind the rate">
            Each pair has a <strong className="text-foreground">rate</strong>: the amount is truncated
            to the nearest multiple of it, and the remainder isn&apos;t wrapped. The Wrap form shows a
            live preview and warns if your amount rounds to zero. Click a pair&apos;s rate in the
            registry for a worked example.
          </Step>
        </div>
        <Link
          href="/wrap"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          Go to Wrap <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>

      <Separator />

      {/* Decrypting */}
      <section className="space-y-4">
        <SectionHeading icon={LockOpen} title="Decrypting your balance" id="decrypt" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Confidential balances are ciphertext by default. To read one, your wallet signs an{" "}
          <strong className="text-foreground">EIP-712</strong> message that authorizes a one-time
          decryption through the Zama relayer — no transaction, no gas. The plaintext is shown only
          to you.
        </p>
        <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-3">
          <Step n={1} title="Reveal one, or reveal all">
            Decrypt a single token, or hit <strong className="text-foreground">Decrypt all</strong> to
            reveal every balance with a <strong className="text-foreground">single signature</strong>{" "}
            (the app pre-authorizes all tokens at once).
          </Step>
          <Step n={2} title="Any ERC-7984 address">
            Paste any confidential token address — even one not in the registry — to decrypt your
            balance for it.
          </Step>
        </div>
        <Link
          href="/decrypt"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          Go to My Balances <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>

      <Separator />

      {/* Unwrapping */}
      <section className="space-y-4">
        <SectionHeading icon={Clock} title="Unwrapping — the two-step async flow" id="unwrap" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Unwrapping burns your confidential balance and returns the public ERC-20. Because the
          burnt amount must be <strong className="text-foreground">publicly decrypted</strong> by the
          relayer network before the contract can release funds, it happens in two steps — and the
          app remembers your request across page reloads.
        </p>
        <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-3">
          <Step n={1} title="Request the unwrap">
            The SDK encrypts your amount and submits it. The resulting{" "}
            <code className="text-xs bg-muted px-1 rounded">UnwrapRequested</code> event&apos;s handle
            is saved to a <strong className="text-foreground">Pending Unwraps</strong> list (with a nav
            badge).
          </Step>
          <Step n={2} title="Relayer decrypts">
            The relayer runs the public decryption. This typically takes{" "}
            <strong className="text-foreground">5–30 minutes</strong> — you can close the tab and come
            back.
          </Step>
          <Step n={3} title="Finalize">
            Click <strong className="text-foreground">Finalize</strong>{" "}
            on the pending request. If the relayer is still working, you&apos;ll be told to retry
            shortly; once ready, your ERC-20 is returned.
          </Step>
        </div>
        <Link
          href="/wrap"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          Go to Unwrap <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>

      <Separator />

      {/* Adding a pair */}
      <section className="space-y-4">
        <SectionHeading icon={Plus} title="Adding a custom pair" id="custom" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          The registry is read live from chain, but you can extend it with any ERC-20 ↔ ERC-7984
          pair — no redeploy, no config edit.
        </p>
        <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-3">
          <Step n={1} title="Paste both addresses">
            Enter the ERC-20 and its wrapper on the <strong className="text-foreground">Add a Pair</strong> page.
          </Step>
          <Step n={2} title="Validate on-chain">
            The app checks the registry, confirms the wrapper is a real ERC-7984, and{" "}
            <strong className="text-foreground">auto-fetches</strong> names, symbols, decimals, and rate.
          </Step>
          <Step n={3} title="Add — it shows up everywhere">
            The pair is stored in your browser and appears instantly in Registry, Wrap, and Decrypt,
            tagged <Badge variant="secondary" className="text-[10px] h-4 px-1.5 align-middle">custom</Badge>.
            Use <strong className="text-foreground">Export config</strong> to make it permanent for
            everyone via <code className="text-xs bg-muted px-1 rounded">config/customPairs.ts</code>.
          </Step>
        </div>
        <Link
          href="/add-pair"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          Go to Add a Pair <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>

      <Separator />

      {/* FAQ */}
      <section className="space-y-4">
        <SectionHeading icon={CircleHelp} title="FAQ" id="faq" />
        <div className="space-y-4">
          {[
            {
              q: "Do I need a relayer URL or API key?",
              a: "No. The Zama SDK ships with the public relayer endpoints and uses them directly from your browser.",
            },
            {
              q: "Does decrypting cost gas?",
              a: "No. Decryption is a wallet signature (EIP-712) plus a relayer round-trip — no transaction. Wrapping, unwrapping, and finalizing are on-chain transactions and do cost gas.",
            },
            {
              q: "Why did my unwrap not finalize immediately?",
              a: "The relayer must publicly decrypt the burnt amount first (usually 5–30 min). Your request is saved in Pending Unwraps — just click Finalize again once it's ready.",
            },
            {
              q: "Where are my custom pairs and activity stored?",
              a: "In your browser's localStorage, scoped per wallet and network. They never leave your device unless you export the config snippet.",
            },
            {
              q: "Which networks are supported?",
              a: "Ethereum mainnet and Sepolia testnet. The faucet is Sepolia-only.",
            },
          ].map((item) => (
            <div key={item.q} className="space-y-1">
              <p className="text-sm font-medium">{item.q}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
