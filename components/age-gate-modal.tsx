"use client"

import { Button } from "@/components/ui/button"

interface AgeGateModalProps {
  onConfirm: () => void
}

export default function AgeGateModal({ onConfirm }: AgeGateModalProps) {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center p-4 z-50">
      <div className="terminal-panel p-8 max-w-md w-full text-center">
        <div className="terminal-glow text-xl font-bold mb-6">AGE VERIFICATION REQUIRED</div>

        <div className="text-sm mb-6 space-y-2">
          <p>You must be 18 years or older to access this betting terminal.</p>
          <p className="text-muted-foreground">This is a product demo for educational/entertainment purposes only.</p>
        </div>

        <div className="space-y-4">
          <Button onClick={onConfirm} className="keycap-button w-full text-foreground font-bold">
            I AM 18+ YEARS OLD - ENTER TERMINAL
          </Button>

          <div className="text-xs text-muted-foreground">
            By entering, you acknowledge this is a demonstration platform. No real money is involved in this version.
          </div>
        </div>
      </div>
    </div>
  )
}
