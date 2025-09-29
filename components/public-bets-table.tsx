"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface PublicBetsTableProps {
  currentPrice?: number
  entryPrice?: number | null
  betPrice?: number | null
}

interface PublicBet {
  id: string
  player: string
  direction: "up" | "down"
  entry: number
  stake: number
  multiplier: number
  exit: number | null
  pnl: number | null
  roi: number | null
  status: "pending" | "won" | "lost"
  timestamp: number
  volatility: "low" | "medium" | "high"
}

const DEMO_PLAYERS = [
  "TRADER_X",
  "BULL_RUN",
  "BEAR_TRAP",
  "ALGO_BOT",
  "DIAMOND_HANDS",
  "PAPER_HANDS",
  "MOON_SHOT",
  "DIP_BUYER",
  "HODL_KING",
  "SCALP_MASTER",
  "WHALE_007",
  "RETAIL_HERO",
]

function generateDemoBets(currentPrice: number = 213, entryPrice: number | null = null, betPrice: number | null = null): PublicBet[] {
  const bets: PublicBet[] = []
  const now = Date.now()

  for (let i = 0; i < 15; i++) {
    const isSettled = Math.random() > 0.3
    const direction = Math.random() > 0.5 ? "up" : "down"
    // Use real prices when available, otherwise use current price with small variation
    const entry = entryPrice || (currentPrice + (Math.random() - 0.5) * 2)
    const stake = Math.floor(Math.random() * 900) + 100
    const volatility = ["low", "medium", "high"][Math.floor(Math.random() * 3)] as "low" | "medium" | "high"

    let exit: number | null = null
    let pnl: number | null = null
    let roi: number | null = null
    let status: "pending" | "won" | "lost" = "pending"
    const multiplier = 1.95 // Fixed multiplier

    if (isSettled) {
      // Use bet price when available, otherwise simulate small price movement
      exit = betPrice || (entry + (Math.random() - 0.5) * 2)
      const priceChange = exit - entry
      const isWin = (direction === "up" && priceChange > 0) || (direction === "down" && priceChange < 0)

      if (isWin) {
        pnl = stake * multiplier - stake
        roi = (pnl / stake) * 100
        status = "won"
      } else {
        pnl = -stake
        roi = -100
        status = "lost"
      }
    }

    bets.push({
      id: `bet_${now}_${i}`,
      player: DEMO_PLAYERS[Math.floor(Math.random() * DEMO_PLAYERS.length)],
      direction,
      entry,
      stake,
      multiplier,
      exit,
      pnl,
      roi,
      status,
      timestamp: now - Math.random() * 300000, // Last 5 minutes
      volatility,
    })
  }

  return bets.sort((a, b) => b.timestamp - a.timestamp)
}

export default function PublicBetsTable({ currentPrice = 213, entryPrice = null, betPrice = null }: PublicBetsTableProps) {
  const [bets, setBets] = useState<PublicBet[]>([])
  const [showDetails, setShowDetails] = useState<string | null>(null)

  useEffect(() => {
    // Initialize with demo data using real prices
    setBets(generateDemoBets(currentPrice, entryPrice, betPrice))

    // Add new demo bets periodically
    const interval = setInterval(() => {
      setBets((prev) => {
        const newBet = generateDemoBets(currentPrice, entryPrice, betPrice)[0]
        newBet.id = `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        newBet.timestamp = Date.now()
        return [newBet, ...prev.slice(0, 14)] // Keep only 15 most recent
      })
    }, 10000) // New bet every 10 seconds

    return () => clearInterval(interval)
  }, [currentPrice, entryPrice, betPrice])

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatCurrency = (amount: number) => {
    return amount.toFixed(2)
  }

  const getDirectionBadge = (direction: "up" | "down") => {
    return (
      <Badge
        variant={direction === "up" ? "default" : "destructive"}
        className={`font-mono text-xs ${direction === "up" ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"}`}
      >
        {direction === "up" ? "▲UP" : "▼DOWN"}
      </Badge>
    )
  }

  const getVolatilityBadge = (volatility: "low" | "medium" | "high") => {
    const colors = {
      low: "bg-primary text-primary-foreground",
      medium: "bg-amber text-black",
      high: "bg-destructive text-destructive-foreground",
    }

    return (
      <Badge className={`font-mono text-xs ${colors[volatility]}`}>
        {volatility === "high" ? "⚠" : ""} {volatility.toUpperCase()}
      </Badge>
    )
  }

  const getStatusBadge = (status: "pending" | "won" | "lost") => {
    const colors = {
      pending: "bg-amber text-black",
      won: "bg-primary text-primary-foreground",
      lost: "bg-destructive text-destructive-foreground",
    }

    return <Badge className={`font-mono text-xs ${colors[status]}`}>{status.toUpperCase()}</Badge>
  }

  return (
    <div className="terminal-panel p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold terminal-glow">PUBLIC BETS FEED</h2>
        <div className="text-xs text-muted-foreground">Live trading activity</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2">PLAYER</th>
              <th className="text-left p-2">DIR</th>
              <th className="text-right p-2">ENTRY</th>
              <th className="text-right p-2">STAKE</th>
              <th className="text-right p-2">MULT</th>
              <th className="text-right p-2">EXIT</th>
              <th className="text-right p-2">P&L</th>
              <th className="text-right p-2">ROI%</th>
              <th className="text-left p-2">STATUS</th>
              <th className="text-left p-2">TIME</th>
              <th className="text-left p-2">VOL</th>
              <th className="text-center p-2">DETAILS</th>
            </tr>
          </thead>
          <tbody>
            {bets.map((bet) => (
              <tr key={bet.id} className="border-b border-border/50 hover:bg-muted/20">
                <td className="p-2 font-bold">{bet.player}</td>
                <td className="p-2">{getDirectionBadge(bet.direction)}</td>
                <td className="p-2 text-right">${formatCurrency(bet.entry)}</td>
                <td className="p-2 text-right">{bet.stake} $Prediction</td>
                <td className="p-2 text-right">{bet.multiplier.toFixed(1)}×</td>
                <td className="p-2 text-right">{bet.exit ? `$${formatCurrency(bet.exit)}` : "-"}</td>
                <td
                  className={`p-2 text-right font-bold ${bet.pnl === null ? "" : bet.pnl >= 0 ? "text-primary" : "text-destructive"}`}
                >
                  {bet.pnl === null ? "-" : `${bet.pnl >= 0 ? "+" : ""}${formatCurrency(bet.pnl)} $Prediction`}
                </td>
                <td
                  className={`p-2 text-right font-bold ${bet.roi === null ? "" : bet.roi >= 0 ? "text-primary" : "text-destructive"}`}
                >
                  {bet.roi === null ? "-" : `${bet.roi >= 0 ? "+" : ""}${bet.roi.toFixed(1)}%`}
                </td>
                <td className="p-2">{getStatusBadge(bet.status)}</td>
                <td className="p-2 text-muted-foreground">{formatTime(bet.timestamp)}</td>
                <td className="p-2">{getVolatilityBadge(bet.volatility)}</td>
                <td className="p-2 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetails(showDetails === bet.id ? null : bet.id)}
                    className="text-xs keycap-button h-6 px-2"
                  >
                    {showDetails === bet.id ? "HIDE" : "VIEW"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details Panel */}
      {showDetails && (
        <div className="mt-4 terminal-border p-3">
          {(() => {
            const bet = bets.find((b) => b.id === showDetails)
            if (!bet) return null

            return (
              <div className="space-y-2">
                <div className="text-sm font-bold terminal-glow">BET DETAILS - {bet.player}</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Direction:</span>
                    <div className="font-bold">{bet.direction.toUpperCase()}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Entry Price:</span>
                    <div className="font-bold">${formatCurrency(bet.entry)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stake Amount:</span>
                    <div className="font-bold">{bet.stake} $Prediction</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Multiplier:</span>
                    <div className="font-bold">{bet.multiplier.toFixed(2)}×</div>
                  </div>
                  {bet.exit && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Exit Price:</span>
                        <div className="font-bold">${formatCurrency(bet.exit)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Price Change:</span>
                        <div className={`font-bold ${bet.exit - bet.entry >= 0 ? "text-primary" : "text-destructive"}`}>
                          {bet.exit - bet.entry >= 0 ? "+" : ""}${formatCurrency(bet.exit - bet.entry)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Final P&L:</span>
                        <div className={`font-bold ${bet.pnl! >= 0 ? "text-primary" : "text-destructive"}`}>
                          {bet.pnl! >= 0 ? "+" : ""}
                          {formatCurrency(bet.pnl!)} $Prediction
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ROI:</span>
                        <div className={`font-bold ${bet.roi! >= 0 ? "text-primary" : "text-destructive"}`}>
                          {bet.roi! >= 0 ? "+" : ""}
                          {bet.roi!.toFixed(1)}%
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
