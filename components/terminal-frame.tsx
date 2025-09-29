"use client"

import { useState, useEffect, useRef } from "react"
import StatusBar from "./status-bar"
import PriceChart from "./price-chart"
import BettingPanel from "./betting-panel"
import RoundHistory from "./round-history"
import PublicBetsTable from "./public-bets-table"
import Ticker from "./ticker"
import AgeGateModal from "./age-gate-modal"
import { SolanaAPI } from "@/lib/solana-api"

export default function TerminalFrame() {
  const [showAgeGate, setShowAgeGate] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [roundTimeLeft, setRoundTimeLeft] = useState(60)
  const [roundPhase, setRoundPhase] = useState<'betting' | 'waiting'>('waiting')
  const [roundNumber, setRoundNumber] = useState(1)
  const [entryPrice, setEntryPrice] = useState<number | null>(null)
  const [betPrice, setBetPrice] = useState<number | null>(null)
  const [currentPrice, setCurrentPrice] = useState(100.0)
  const [chartPrice, setChartPrice] = useState(100.0)
  const [roundHistory, setRoundHistory] = useState<Array<{
    roundNumber: number
    entryPrice: number
    betPrice: number
    result: 'up' | 'down'
    timestamp: number
  }>>([])
  const [currentRoundEntryPrice, setCurrentRoundEntryPrice] = useState<number | null>(null)
  const [lastRoundEntryPrice, setLastRoundEntryPrice] = useState<number | null>(null)

  // Use refs to avoid dependency issues
  const chartPriceRef = useRef(100.0)
  const currentRoundEntryPriceRef = useRef<number | null>(null)
  const lastRoundEntryPriceRef = useRef<number | null>(null)
  const roundHistoryRef = useRef<Array<{
    roundNumber: number
    entryPrice: number
    betPrice: number
    result: 'up' | 'down'
    timestamp: number
  }>>([])
  const roundPhaseRef = useRef<'waiting' | 'betting'>('waiting')

  // Update refs when state changes
  useEffect(() => {
    chartPriceRef.current = chartPrice
  }, [chartPrice])

  useEffect(() => {
    roundPhaseRef.current = roundPhase
  }, [roundPhase])

  useEffect(() => {
    currentRoundEntryPriceRef.current = currentRoundEntryPrice
  }, [currentRoundEntryPrice])

  useEffect(() => {
    lastRoundEntryPriceRef.current = lastRoundEntryPrice
  }, [lastRoundEntryPrice])

  useEffect(() => {
    roundHistoryRef.current = roundHistory
  }, [roundHistory])

  // Load round history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('roundHistory')
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory)
        setRoundHistory(history)
        roundHistoryRef.current = history
        console.log(`[INIT] Loaded ${history.length} rounds from localStorage`)
        
        // Set last round entry price if available
        if (history.length > 0) {
          const lastRound = history[history.length - 1]
          setLastRoundEntryPrice(lastRound.entryPrice)
          lastRoundEntryPriceRef.current = lastRound.entryPrice
          console.log(`[INIT] Last round entry price: $${lastRound.entryPrice.toFixed(2)}`)
        }
      } catch (error) {
        console.error('[INIT] Error loading round history:', error)
      }
    }
  }, [])

  // Save round history to localStorage whenever it changes
  useEffect(() => {
    if (roundHistory.length > 0) {
      localStorage.setItem('roundHistory', JSON.stringify(roundHistory))
      console.log(`[SAVE] Saved ${roundHistory.length} rounds to localStorage`)
    }
  }, [roundHistory])

  // Calculate round phase and time based on global time
  const calculateRoundState = () => {
    const now = new Date()
    const epochSeconds = Math.floor(now.getTime() / 1000)
    
    // Each round cycle is 120 seconds (60 waiting + 60 betting)
    const cyclePosition = epochSeconds % 120
    
    let phase: 'betting' | 'waiting'
    let timeLeft: number
    let roundNum: number
    
    if (cyclePosition < 60) {
      // Waiting phase (betting open)
      phase = 'waiting'
      timeLeft = 60 - cyclePosition
      roundNum = Math.floor(epochSeconds / 120) + 1
    } else {
      // Betting phase (waiting for results)
      phase = 'betting'
      timeLeft = 120 - cyclePosition
      roundNum = Math.floor(epochSeconds / 120) + 1
    }
    
    return { phase, timeLeft, roundNum, cyclePosition }
  }

  // Capture prices from DexScreener API
  const capturePriceFromAPI = async () => {
    try {
      const solData = await SolanaAPI.getSolanaPriceData()
      console.log(`[PRICE CAPTURE] API returned: $${solData.price.toFixed(2)}`)
      return solData.price
    } catch (error) {
      console.error(`[API ERROR]`, error)
      console.log(`[FALLBACK] Using chart price: $${chartPriceRef.current.toFixed(2)}`)
      return chartPriceRef.current
    }
  }

  // Main timer effect - only runs once on mount
  useEffect(() => {
    console.log('[TERMINAL FRAME] Timer effect initialized')
    
    // Initialize state based on current time
    const initializeState = () => {
      const now = new Date()
      const { phase, timeLeft, roundNum } = calculateRoundState()
      
        console.log(`[INIT] Setting initial state - Phase: ${phase}, Time: ${timeLeft}s, Round: #${roundNum}`)

        setCurrentTime(now)
        setRoundPhase(phase)
        roundPhaseRef.current = phase // Initialize ref
        setRoundTimeLeft(timeLeft)
        setRoundNumber(roundNum)
    }
    
    // Initialize immediately
    initializeState()
    
    const timer = setInterval(async () => {
      const now = new Date()
      setCurrentTime(now)
      
      const { phase, timeLeft, roundNum, cyclePosition } = calculateRoundState()
      
      // Debug log every 30 seconds to reduce spam
      if (timeLeft % 30 === 0) {
        console.log(`[DEBUG] Phase: ${phase}, Time: ${timeLeft}s, Round: #${roundNum}`)
      }
      
      // Capture entry price at the last second of waiting phase
      if (phase === 'waiting' && timeLeft === 1) {
        console.log(`[ENTRY CAPTURE] Last second of waiting phase - Round #${roundNum}`)
        const entryPriceValue = await capturePriceFromAPI()
        setCurrentRoundEntryPrice(entryPriceValue)
        setEntryPrice(entryPriceValue)
        currentRoundEntryPriceRef.current = entryPriceValue
        console.log(`[ENTRY CAPTURE] Entry price captured: $${entryPriceValue.toFixed(2)} (Round #${roundNum})`)
      }
      
      // Capture bet price at the last second of betting phase
      if (phase === 'betting' && timeLeft === 1) {
        console.log(`[BET CAPTURE] Last second of betting phase - Round #${roundNum}`)
        const betPriceValue = await capturePriceFromAPI()
        setBetPrice(betPriceValue)
        console.log(`[BET CAPTURE] Bet price captured: $${betPriceValue.toFixed(2)} (Round #${roundNum})`)
        
        // Calculate result and add to history
        const roundEntryPrice = currentRoundEntryPriceRef.current || lastRoundEntryPriceRef.current || 0
        const roundResult = betPriceValue > roundEntryPrice ? 'up' : 'down'
        
        console.log(`[HISTORY] Adding round: Entry $${roundEntryPrice.toFixed(2)} → Bet $${betPriceValue.toFixed(2)} = ${roundResult.toUpperCase()}`)
        
        const newRoundHistory = [...roundHistoryRef.current, {
          roundNumber: roundNum,
          entryPrice: roundEntryPrice,
          betPrice: betPriceValue,
          result: roundResult,
          timestamp: now.getTime()
        }]
        
        // Keep only the last 5 rounds
        const limitedHistory = newRoundHistory.slice(-5)
        setRoundHistory(limitedHistory)
        roundHistoryRef.current = limitedHistory
        
        // Store the entry price as lastRoundEntryPrice for the next round
        setLastRoundEntryPrice(roundEntryPrice)
        lastRoundEntryPriceRef.current = roundEntryPrice
        
        console.log(`[ROUND COMPLETE] Round #${roundNum} finished. Entry: $${roundEntryPrice.toFixed(2)}, Bet: $${betPriceValue.toFixed(2)}, Result: ${roundResult.toUpperCase()}`)
      }
      
      // Update phase if changed
      if (phase !== roundPhaseRef.current) {
        console.log(`[PHASE CHANGE] ${roundPhaseRef.current} → ${phase} (Round #${roundNum}, Time: ${timeLeft}s)`)
        console.log(`[PHASE CHANGE] Setting roundPhase state to: ${phase}`)
        setRoundPhase(phase)
        roundPhaseRef.current = phase // Update ref immediately
      }
      
      // Debug phase consistency
      if (timeLeft % 30 === 0) {
        console.log(`[PHASE DEBUG] Terminal: ${phase}, Current roundPhase state: ${roundPhase}, Ref: ${roundPhaseRef.current}, BettingPanel should receive: ${roundPhase}, Round: #${roundNum}`)
      }
      
      setRoundTimeLeft(timeLeft)
      setRoundNumber(roundNum)
    }, 1000)

    return () => {
      console.log('[TERMINAL FRAME] Timer cleanup - clearing interval')
      clearInterval(timer)
    }
  }, []) // Empty dependency array - runs only once

  if (showAgeGate) {
    return <AgeGateModal onConfirm={() => setShowAgeGate(false)} />
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      <StatusBar 
        currentTime={currentTime} 
        roundTimeLeft={roundTimeLeft} 
        roundPhase={roundPhase}
        roundNumber={roundNumber}
        entryPrice={entryPrice}
        betPrice={betPrice}
        roundHistory={roundHistory}
      />

      <main className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 mb-4">
          {/* Price Chart - 70% width on desktop */}
          <div className="lg:col-span-7">
            <PriceChart 
              roundTimeLeft={roundTimeLeft} 
              roundPhase={roundPhase}
              onPriceUpdate={setCurrentPrice}
              onChartPriceUpdate={(price) => {
                setChartPrice(price)
                // Removed chart price log to reduce spam
              }}
            />
          </div>

          {/* Betting Panel - 30% width on desktop */}
          <div className="lg:col-span-3">
          <BettingPanel 
            roundTimeLeft={roundTimeLeft} 
            roundPhase={roundPhase}
            roundNumber={roundNumber}
            entryPrice={entryPrice}
            betPrice={betPrice}
            currentPrice={chartPrice}
            currentRoundEntryPrice={currentRoundEntryPrice}
            lastRoundEntryPrice={lastRoundEntryPrice}
            roundHistory={roundHistory}
          />
          </div>
        </div>

        {/* Round History */}
        <div className="mb-4">
          <RoundHistory roundHistory={roundHistory} />
        </div>

        {/* Public Bets Table */}
        <div className="mb-4">
          <PublicBetsTable 
            currentPrice={currentPrice} 
            entryPrice={entryPrice} 
            betPrice={betPrice} 
          />
        </div>
      </main>

      <Ticker />
    </div>
  )
}