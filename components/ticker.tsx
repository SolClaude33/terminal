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


      {/* Social Media Links */}
      <div className="border-t border-border p-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Follow us:</span>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="https://x.com/PredictionSol" 
              className="terminal-glow hover:text-primary transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              Twitter
            </a>
            
            <a 
              href="https://pump.fun/board" 
              className="terminal-glow hover:text-primary transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              PumpFun
            </a>
            
            <span className="text-muted-foreground">CA: Soon</span>
          </div>
        </div>
      </div>
    </div>
  )
}
