"use client"

import { Activity } from "lucide-react"
import { ActivityFeed } from "@/components/activity/ActivityFeed"

export default function ActivityPage() {
  return (
    <div className="space-y-8 max-w-2xl animate-in fade-in slide-in-from-bottom-1 duration-500">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Activity className="h-3.5 w-3.5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Your wraps, unwraps, finalizations, decryptions, and faucet claims on this network.
        </p>
      </div>

      <ActivityFeed />
    </div>
  )
}
