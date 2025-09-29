"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { calculatePayout } from "@/lib/market-simulation"
import { SolanaAPI, type SolanaPriceData } from "@/lib/solana-api"

interface BettingPanelProps {
  roundTimeLeft: number
  roundPhase: 'betting' | 'waiting'
  roundNumber: number
  entryPrice: number | null
  betPrice: number | null
  currentPrice: number
  currentRoundEntryPrice: number | null
  lastRoundEntryPrice: number | null
  roundHistory: Array<{
    roundNumber: number
    entryPrice: number
    betPrice: number
    result: 'up' | 'down'
    timestamp: number
  }>
}

interface BetState {
  direction: "up" | "down" | null
  stake: number
  entryPrice: number | null
  exitPrice: number | null
  payout: number
  multiplier: number
  isActive: boolean
}

export default function BettingPanel({ roundTimeLeft, roundPhase, roundNumber, entryPrice, betPrice, currentPrice: propCurrentPrice, currentRoundEntryPrice, lastRoundEntryPrice, roundHistory }: BettingPanelProps) {
  const [stake, setStake] = useState(100000)
  const [currentBet, setCurrentBet] = useState<BetState>({
    direction: null,
    stake: 0,
    entryPrice: null,
    exitPrice: null,
    payout: 0,
    multiplier: 0,
    isActive: false,
  })
  const [balance, setBalance] = useState(10000000) // Demo balance in $Prediction (10M)
  const [currentPrice, setCurrentPrice] = useState(propCurrentPrice) // Real SOL price from parent
  const [solanaData, setSolanaData] = useState<SolanaPriceData | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [lastBetResult, setLastBetResult] = useState<{
    won: boolean
    direction: 'up' | 'down'
    stake: number
    roundResult: 'up' | 'down'
    winAmount?: number
  } | null>(null)

  const [lastResetRound, setLastResetRound] = useState(roundNumber)

  useEffect(() => {
    // Lock betting during betting phase (waiting for results) or in final 5 seconds of waiting phase (betting phase)
    const shouldLock = roundPhase === 'betting' || (roundPhase === 'waiting' && roundTimeLeft <= 5)
    setIsLocked(shouldLock)
    
    // Reset current bet when round number changes (new round started)
    if (roundNumber !== lastResetRound) {
      console.log(`[BETTING PANEL] New round detected: ${lastResetRound} → ${roundNumber} - processing previous bet result`)
      
      // Process the previous bet result if there was an active bet
      if (currentBet.isActive && roundHistory.length > 0) {
        const lastRound = roundHistory[roundHistory.length - 1]
        const didWin = currentBet.direction === lastRound.result
        
        console.log(`[BET RESULT] Bet: ${currentBet.direction?.toUpperCase()}, Round Result: ${lastRound.result.toUpperCase()}, Won: ${didWin}`)
        
        // Store the result to show to user
        setLastBetResult({
          won: didWin,
          direction: currentBet.direction!,
          stake: currentBet.stake,
          roundResult: lastRound.result,
          winAmount: didWin ? currentBet.stake * 1.95 : undefined
        })
        
        if (didWin) {
          const winAmount = currentBet.stake * 1.95 // 1.95x multiplier
          setBalance(prev => prev + winAmount)
          console.log(`[BET RESULT] WIN! +${winAmount.toLocaleString()} $Prediction (1.95x multiplier)`)
        } else {
          console.log(`[BET RESULT] LOSS! -${currentBet.stake.toLocaleString()} $Prediction`)
        }
        
        // Clear the result after 5 seconds
        setTimeout(() => {
          setLastBetResult(null)
        }, 5000)
      }
      
      // Reset current bet for new round
      setCurrentBet({
        direction: null,
        stake: 0,
        entryPrice: null,
        exitPrice: null,
        payout: 0,
        multiplier: 0,
        isActive: false,
      })
      setLastResetRound(roundNumber)
    }
    
    // Debug logs only when important changes happen
    if (shouldLock !== isLocked || currentBet.isActive || roundNumber !== lastResetRound) {
      console.log(`[BETTING PANEL] Phase: ${roundPhase}, Time: ${roundTimeLeft}s, Locked: ${shouldLock}, Active: ${currentBet.isActive}, Round: #${roundNumber}`)
      console.log(`[BETTING PANEL] Current Bet State:`, currentBet)
      console.log(`[BETTING PANEL] Status: ${roundPhase === 'waiting' ? 'BETTING OPEN' : 'WAITING FOR RESULTS'}`)
      console.log(`[BETTING PANEL] Received props - roundPhase: ${roundPhase}, roundTimeLeft: ${roundTimeLeft}, roundNumber: ${roundNumber}`)
    }
  }, [roundPhase, roundTimeLeft, roundNumber, lastResetRound, currentBet.isActive, isLocked])

  // This useEffect was causing premature bet processing - removed
  // The correct logic is now in the round change useEffect above

  useEffect(() => {
    // Fetch initial SOL price
    const fetchSolPrice = async () => {
      try {
        const solData = await SolanaAPI.getSolanaPriceData()
        setSolanaData(solData)
        setCurrentPrice(solData.price)
      } catch (error) {
        console.error("Failed to fetch SOL price:", error)
        // Keep fallback price
      }
    }

    fetchSolPrice()

    // Update SOL price every 2 seconds to sync with real price cycle
    const interval = setInterval(async () => {
      try {
        const solData = await SolanaAPI.getSolanaPriceData()
        setSolanaData(solData)
        setCurrentPrice(solData.price)
      } catch (error) {
        console.error("Failed to update SOL price:", error)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  // Debug log for entry price
  useEffect(() => {
    console.log(`[BETTING PANEL] Entry Price Debug:`, {
      currentRoundEntryPrice,
      lastRoundEntryPrice,
      roundPhase,
      hasCurrentEntryPrice: !!currentRoundEntryPrice,
      hasLastEntryPrice: !!lastRoundEntryPrice,
      timestamp: new Date().toISOString()
    })
  }, [currentRoundEntryPrice, lastRoundEntryPrice, roundPhase])

  // Additional debug for entry price changes
  useEffect(() => {
    if (currentRoundEntryPrice) {
      console.log(`[BETTING PANEL] Entry Price Updated: $${currentRoundEntryPrice.toFixed(2)}`)
    }
  }, [currentRoundEntryPrice])

  useEffect(() => {
    // Handle keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isLocked || currentBet.isActive) return

      switch (e.key.toLowerCase()) {
        case "u":
          handlePlaceBet("up")
          break
        case "d":
          handlePlaceBet("down")
          break
        case "enter":
          if (currentBet.direction) {
            // Confirm bet logic here
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [isLocked, currentBet])

  const handlePlaceBet = (direction: "up" | "down") => {
    if (isLocked || currentBet.isActive || stake > balance) return

    console.log(`[BET PLACED] Direction: ${direction}, Stake: ${stake}, isLocked: ${isLocked}, currentBet.isActive: ${currentBet.isActive}, balance: ${balance}`)

    setCurrentBet({
      direction,
      stake,
      entryPrice: null, // Will be set when entry price is captured
      exitPrice: null,
      payout: 0,
      multiplier: 0,
      isActive: true,
    })

    setBalance((prev) => prev - stake)

    // Play UI beep sound (would be implemented with audio)
    console.log(`[BET] BET PLACED: ${direction.toUpperCase()} - Waiting for entry price`)
  }

  const handleCancelBet = () => {
    if (!currentBet.isActive || isLocked) return

    setBalance((prev) => prev + currentBet.stake)
    setCurrentBet({
      direction: null,
      stake: 0,
      entryPrice: null,
      exitPrice: null,
      payout: 0,
      multiplier: 0,
      isActive: false,
    })
  }

  const estimatedPayout = 1.95 * stake

  return (
    <div className="terminal-panel p-3 space-y-3" style={{ height: "600px", minHeight: "600px" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-bold terminal-glow">SOL BETTING</Label>
          <div className="text-xs" style={{ color: "var(--color-text-dim)" }}>
            Phase: {roundPhase === 'waiting' ? '🎯 BETTING OPEN' : '⏳ WAITING FOR RESULTS'}
          </div>
          {entryPrice && roundPhase === 'betting' && (
            <div className="text-xs" style={{ color: "var(--color-text-dim)" }}>
              Entry Price: ${entryPrice.toFixed(2)}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm font-bold terminal-glow">
            Balance: ${balance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Primary Betting Buttons */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => handlePlaceBet("up")}
            disabled={isLocked || currentBet.isActive || stake > balance}
            className={`keycap-button h-10 font-bold text-base flex items-center justify-center gap-2 ${
              currentBet.direction === "up"
                ? "bg-[var(--color-accent-up)] text-[var(--color-bg)] border-[var(--color-accent-up)]"
                : isLocked || currentBet.isActive || stake > balance
                  ? "bg-[#2A2F3A] text-[#6B7280] border-[var(--color-border)]"
                  : "bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-muted)]"
            }`}
            style={{
              ...(currentBet.direction === "up" &&
                !isLocked &&
                !currentBet.isActive &&
                stake <= balance && {
                  boxShadow: "0 0 8px rgba(43, 213, 118, 0.3)",
                }),
            }}
          >
            {isLocked ? "LOCKED" : "▲ UP"}
          </Button>
          <Button
            onClick={() => handlePlaceBet("down")}
            disabled={isLocked || currentBet.isActive || stake > balance}
            className={`keycap-button h-10 font-bold text-base flex items-center justify-center gap-2 ${
              currentBet.direction === "down"
                ? "bg-[var(--color-accent-down)] text-[var(--color-bg)] border-[var(--color-accent-down)]"
                : isLocked || currentBet.isActive || stake > balance
                  ? "bg-[#2A2F3A] text-[#6B7280] border-[var(--color-border)]"
                  : "bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-muted)]"
            }`}
            style={{
              ...(currentBet.direction === "down" &&
                !isLocked &&
                !currentBet.isActive &&
                stake <= balance && {
                  boxShadow: "0 0 8px rgba(255, 92, 92, 0.3)",
                }),
            }}
          >
            {isLocked ? "LOCKED" : "▼ DOWN"}
          </Button>
        </div>

        {currentBet.isActive && (
          <Button
            onClick={handleCancelBet} 
            variant="outline" 
            className={`w-full keycap-button h-8 text-sm ${
              isLocked 
                ? "bg-[#2A2F3A] text-[#6B7280] border-[var(--color-border)] cursor-not-allowed" 
                : "bg-transparent"
            }`}
            disabled={isLocked}
          >
            {isLocked ? "LOCKED" : "CANCEL BET"}
          </Button>
        )}
      </div>

      {/* Stake Controls */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-bold">STAKE ($Prediction)</Label>
          <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>
            Balance: {balance.toLocaleString()} $Prediction
          </span>
        </div>

        <div className="space-y-2">
          <Input
            type="number"
            value={stake}
            onChange={(e) => setStake(Math.max(1000, Number.parseInt(e.target.value) || 1000))}
            className="terminal-border font-mono"
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text)",
              borderColor: "var(--color-border)",
            }}
            min="1000"
            max={balance}
          />

          <Slider
            value={[stake]}
            onValueChange={([value]) => setStake(value)}
            max={Math.min(balance, 1000000)}
            min={1000}
            step={10000}
            className="w-full"
          />

          <div className="flex gap-1">
            {[25000, 50000, 100000, 250000, 500000].map((amount) => (
              <Button
                key={amount}
                onClick={() => setStake(Math.min(amount, balance))}
                variant="outline"
                size="sm"
                className="flex-1 text-xs keycap-button h-7"
                disabled={amount > balance}
              >
                {amount.toLocaleString()}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Payout Preview */}
      <div className="terminal-border p-3 space-y-2">
        <div className="text-sm font-bold terminal-glow">PAYOUT PREVIEW</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span style={{ color: "var(--color-text-dim)" }}>Base Multiplier:</span>
            <div className="font-bold">1.95×</div>
          </div>
          <div>
            <span style={{ color: "var(--color-text-dim)" }}>Est. Payout:</span>
            <div className="font-bold" style={{ color: "var(--color-accent-up)" }}>
              {estimatedPayout.toLocaleString()} $Prediction
            </div>
          </div>
        </div>
      </div>

      {/* Last Bet Result */}
      {lastBetResult && (
        <div className="terminal-border p-3 space-y-2">
          <div className={`text-sm font-bold ${lastBetResult.won ? 'text-green-400' : 'text-red-400'}`}>
            {lastBetResult.won ? '🎉 BET WON!' : '❌ BET LOST'}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span style={{ color: "var(--color-text-dim)" }}>Your Bet:</span>
              <div
                className={`font-bold ${lastBetResult.direction === "up" ? "text-[var(--color-accent-up)]" : "text-[var(--color-accent-down)]"}`}
              >
                {lastBetResult.direction === "up" ? "▲ UP" : "▼ DOWN"}
              </div>
            </div>
            <div>
              <span style={{ color: "var(--color-text-dim)" }}>Round Result:</span>
              <div
                className={`font-bold ${lastBetResult.roundResult === "up" ? "text-[var(--color-accent-up)]" : "text-[var(--color-accent-down)]"}`}
              >
                {lastBetResult.roundResult === "up" ? "▲ UP" : "▼ DOWN"}
              </div>
            </div>
            <div>
              <span style={{ color: "var(--color-text-dim)" }}>Stake:</span>
              <div className="font-bold">{lastBetResult.stake.toLocaleString()} $Prediction</div>
            </div>
            <div>
              <span style={{ color: "var(--color-text-dim)" }}>Result:</span>
              <div className={`font-bold ${lastBetResult.won ? 'text-green-400' : 'text-red-400'}`}>
                {lastBetResult.won 
                  ? `+${lastBetResult.winAmount!.toLocaleString()} $Prediction (1.95x)`
                  : `-${lastBetResult.stake.toLocaleString()} $Prediction`
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Bet KPIs */}
      {currentBet.isActive && (
        <div className="terminal-border p-3 space-y-2">
          <div className="text-sm font-bold terminal-glow">ACTIVE BET</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span style={{ color: "var(--color-text-dim)" }}>Direction:</span>
              <div
                className={`font-bold ${currentBet.direction === "up" ? "text-[var(--color-accent-up)]" : "text-[var(--color-accent-down)]"}`}
              >
                {currentBet.direction === "up" ? "▲ UP" : "▼ DOWN"}
              </div>
            </div>
            <div>
              <span style={{ color: "var(--color-text-dim)" }}>Entry Price:</span>
              <div className="font-bold">
                {entryPrice && roundPhase === 'betting'
                  ? `$${entryPrice.toFixed(2)}` 
                  : "Waiting for entry price..."
                }
              </div>
            </div>
            <div>
              <span style={{ color: "var(--color-text-dim)" }}>Stake:</span>
              <div className="font-bold">{currentBet.stake.toLocaleString()} $Prediction</div>
            </div>
            <div>
              <span style={{ color: "var(--color-text-dim)" }}>Status:</span>
              <div className="font-bold" style={{ color: "var(--color-accent-warn)" }}>
                PENDING
              </div>
            </div>
          </div>
        </div>
      )}




      {/* Keyboard Shortcuts */}
      <div className="text-xs space-y-1" style={{ color: "var(--color-text-dim)" }}>
        <div className="font-bold">SHORTCUTS:</div>
        <div>U = UP • D = DOWN • ENTER = CONFIRM</div>
      </div>
    </div>
  )
}

