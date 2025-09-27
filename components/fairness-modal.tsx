"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function FairnessModal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <Button 
        variant="outline" 
        size="sm" 
        className="keycap-button text-xs bg-transparent"
        onClick={() => setIsOpen(!isOpen)}
      >
        VIEW FAIRNESS SEED
      </Button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="terminal-panel max-w-md w-full p-6 space-y-4">
            <div className="terminal-glow text-lg font-bold">PROVABLY FAIR VERIFICATION</div>
            
            <div className="terminal-border p-3 text-xs space-y-2">
              <div>
                <span className="text-muted-foreground">Round ID:</span>
                <div className="font-mono break-all">SOL_2024_001</div>
              </div>
              <div>
                <span className="text-muted-foreground">Fairness Seed:</span>
                <div className="font-mono break-all">0x8f3a2b1c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b</div>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <div className="font-bold text-primary">ACTIVE</div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <div className="font-bold">How Fairness Works:</div>
              <div>• Each round uses a cryptographic seed</div>
              <div>• Seeds are generated before price movements</div>
              <div>• All outcomes are deterministic and verifiable</div>
              <div>• No manipulation possible after round starts</div>
            </div>

            <Button 
              onClick={() => setIsOpen(false)} 
              className="keycap-button w-full"
              size="sm"
            >
              CLOSE
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
