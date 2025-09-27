"use client"

import { useState, useEffect } from "react"
import { TermsModal, PrivacyModal, ResponsibleBettingModal } from "./compliance-modals"

interface TickerItem {
  symbol: string
  price: number
  change: number
  changePercent: number
}

const TICKER_SYMBOLS = ["SOL", "BTC", "ETH", "AVAX", "MATIC", "DOT", "LINK", "UNI", "AAVE", "CRV", "SUSHI", "1INCH", "YFI"]

function generateTickerData(): TickerItem[] {
  return TICKER_SYMBOLS.map((symbol) => {
    const basePrice = Math.random() * 1000 + 100
    const change = (Math.random() - 0.5) * 20
    const changePercent = (change / basePrice) * 100

    return {
      symbol,
      price: basePrice,
      change,
      changePercent,
    }
  })
}

const MARKET_HEADLINES = [
  "SOLANA NETWORK PROCESSES 65,000+ TRANSACTIONS PER SECOND",
  "DEFI TOTAL VALUE LOCKED REACHES NEW ALL-TIME HIGH",
  "BITCOIN ETF APPROVALS DRIVE INSTITUTIONAL ADOPTION",
  "ETHEREUM LAYER 2 SOLUTIONS SEE RECORD USAGE",
  "AVALANCHE ECOSYSTEM EXPANDS WITH NEW DAPPS",
  "POLYGON ZKEVM MAINNET LAUNCH BRINGS SCALABILITY",
  "CHAINLINK ORACLES SECURE $100B+ IN VALUE",
  "UNISWAP V4 PROTOCOL UPGRADE IMPROVES EFFICIENCY",
  "AAVE GOVERNANCE TOKEN SEES STRONG DEMAND",
  "CURVE FINANCE DOMINATES STABLECOIN TRADING",
]

export default function Ticker() {
  const [tickerData, setTickerData] = useState<TickerItem[]>([])
  const [headlines] = useState(MARKET_HEADLINES)
  const [currentHeadline, setCurrentHeadline] = useState(0)

  useEffect(() => {
    // Initialize ticker data
    setTickerData(generateTickerData())

    // Update ticker data every 5 seconds
    const dataInterval = setInterval(() => {
      setTickerData(generateTickerData())
    }, 5000)

    // Cycle headlines every 10 seconds
    const headlineInterval = setInterval(() => {
      setCurrentHeadline((prev) => (prev + 1) % headlines.length)
    }, 10000)

    return () => {
      clearInterval(dataInterval)
      clearInterval(headlineInterval)
    }
  }, [headlines.length])

  return (
    <div className="terminal-panel border-t bg-background">
      {/* Market Headlines */}
      <div className="border-b border-border p-2">
        <div className="ticker-scroll text-sm font-bold terminal-glow">MARKET UPDATE: {headlines[currentHeadline]}</div>
      </div>

      {/* Market Data Ticker */}
      <div className="p-2 overflow-hidden">
        <div className="ticker-scroll flex gap-8 text-xs">
          {tickerData.map((item) => (
            <div key={item.symbol} className="flex items-center gap-2 whitespace-nowrap">
              <span className="font-bold">{item.symbol}</span>
              <span>${item.price.toFixed(2)}</span>
              <span className={`font-bold ${item.change >= 0 ? "text-primary" : "text-destructive"}`}>
                {item.change >= 0 ? "+" : ""}
                {item.change.toFixed(2)} ({item.changePercent >= 0 ? "+" : ""}
                {item.changePercent.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Legal */}
      <div className="border-t border-border p-2 space-y-2">
        <div className="text-xs text-muted-foreground">
          Demo betting platform for educational/entertainment purposes. No real money involved in this version. Please
          bet responsibly.
        </div>

        <div className="flex flex-wrap gap-4 text-xs">
          <TermsModal />
          <PrivacyModal />
          <ResponsibleBettingModal />
          <span className="text-muted-foreground">|</span>
          <span className="text-muted-foreground">This is a product demo. Not financial advice.</span>
        </div>
      </div>
    </div>
  )
}
