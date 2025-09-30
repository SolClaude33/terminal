"use client"

import { useEffect, useRef, useState } from "react"
import { SolanaAPI, type SolanaPriceData } from "@/lib/solana-api"

interface PriceChartProps {
  roundTimeLeft: number
  roundPhase: 'betting' | 'waiting'
  onPriceUpdate: (price: number) => void
  onChartPriceUpdate: (price: number) => void
}

interface MarketDataPoint {
  price: number
  timestamp: number
}

export default function PriceChart({ roundTimeLeft, roundPhase, onPriceUpdate, onChartPriceUpdate }: PriceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [marketData, setMarketData] = useState<MarketDataPoint[]>([])
  const [currentPrice, setCurrentPrice] = useState(100.0)
  const [entryPrice, setEntryPrice] = useState<number | null>(null)
  const [priceChange, setPriceChange] = useState(0)
  const [priceChangePercent, setPriceChangePercent] = useState(0)
  const [solanaData, setSolanaData] = useState<SolanaPriceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initialize with SOL data - NO HISTORICAL DATA
    const initializeSolanaData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const solData = await SolanaAPI.getSolanaPriceData()
        setSolanaData(solData)
        setCurrentPrice(solData.price)
        
        // Use setTimeout to avoid setState during render
        setTimeout(() => {
          onPriceUpdate(solData.price) // Report price to parent
          onChartPriceUpdate(solData.price) // Report chart price to parent
        }, 0)
        
        // Initialize with real 24h change data
        setPriceChange(solData.priceChange24h)
        setPriceChangePercent(solData.priceChangePercent24h)
        
        // Start with empty data - chart will build from current moment
        setMarketData([])
        
        setIsLoading(false)
      } catch (err) {
        console.error("Failed to load SOL data:", err)
        setError("Failed to load SOL price data")
        setIsLoading(false)
        
        // Fallback to empty data
        setMarketData([])
        setCurrentPrice(100)
      }
    }

    initializeSolanaData()
  }, [])

  useEffect(() => {
    // Update market data every 1.5 seconds - building chart from scratch
    const interval = setInterval(async () => {
      try {
        const solData = await SolanaAPI.getSolanaPriceData()
        setSolanaData(solData)
        
        setMarketData((prev) => {
          const newPoint = {
            price: solData.price,
            timestamp: Date.now(), // Use current timestamp for real-time building
          }
          // Keep only last 60 points (1.5 minutes at 1.5s intervals)
          const newData = [...prev, newPoint].slice(-60)

          setCurrentPrice(solData.price)
          
          // Use setTimeout to avoid setState during render
          setTimeout(() => {
            onPriceUpdate(solData.price) // Report price to parent
            onChartPriceUpdate(solData.price)
          }, 0)
          
          // Use real 24h change from DexScreener API
          setPriceChange(solData.priceChange24h)
          setPriceChangePercent(solData.priceChangePercent24h)
          
          // Log for debugging
          // Reduced chart log spam

          return newData
        })
      } catch (err) {
        console.error("Error updating SOL data:", err)
        // Continue with simulated updates if API fails
        setMarketData((prev) => {
          const lastPrice = prev[prev.length - 1]?.price || currentPrice
          const volatility = 0.0008 // 0.08% volatility
          const randomChange = (Math.random() - 0.5) * volatility
          const newPrice = lastPrice * (1 + randomChange)
          
          const newPoint = {
            price: newPrice,
            timestamp: Date.now(),
          }
          const newData = [...prev, newPoint].slice(-60)

          setCurrentPrice(newPrice)
          
          // Keep existing 24h change when using fallback
          // (don't recalculate from chart data)

          return newData
        })
      }
    }, 800) // Update every 0.8 seconds for more frequent updates

    return () => clearInterval(interval)
  }, [currentPrice])

  const drawChart = () => {
    const canvas = canvasRef.current
    if (!canvas || marketData.length === 0) return
    
    // Ensure we have at least one data point to work with
    if (marketData.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Force canvas to fill container properly
    const container = canvas.parentElement
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const width = containerRect.width
    const height = containerRect.height

    // Set canvas size to match container exactly
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    canvas.width = width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const padding = 15 // Optimized padding for better chart visibility

    ctx.fillStyle = "#0E0F13"
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = "rgba(38, 48, 66, 0.3)"
    ctx.lineWidth = 1

    // Vertical grid lines
    for (let x = padding; x < width - padding; x += 20) {
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, height - padding)
      ctx.stroke()
    }

    // Horizontal grid lines
    for (let y = padding; y < height - padding; y += 20) {
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Calculate price range with dynamic buffer for better visualization
    const prices = marketData.map((d) => d.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const currentPriceRange = maxPrice - minPrice
    
    // Use smaller, fixed buffer to keep chart contained within panel
    let buffer
    if (currentPriceRange < 0.1) { // Very small range (less than 10 cents)
      buffer = 0.2 // 20 cent buffer
    } else {
      buffer = currentPriceRange * 0.1 // 10% buffer for larger ranges
    }
    
    const adjustedMinPrice = minPrice - buffer
    const adjustedMaxPrice = maxPrice + buffer
    const priceRange = adjustedMaxPrice - adjustedMinPrice || 1

    ctx.strokeStyle = "#8FF7A7"
    ctx.lineWidth = 2
    ctx.shadowColor = "rgba(143,247,167,0.25)"
    ctx.shadowBlur = 8

    ctx.beginPath()
    marketData.forEach((point, index) => {
      const x = padding + (index / (marketData.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((point.price - adjustedMinPrice) / priceRange) * (height - 2 * padding)

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    if (entryPrice !== null) {
      ctx.strokeStyle = "#3A4A5E"
      ctx.globalAlpha = 0.6
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.shadowBlur = 0

      const entryY = height - padding - ((entryPrice - adjustedMinPrice) / priceRange) * (height - 2 * padding)
      ctx.beginPath()
      ctx.moveTo(padding, entryY)
      ctx.lineTo(width - padding, entryY)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 1
    }

    if (marketData.length > 0) {
      const lastPoint = marketData[marketData.length - 1]
      const x = width - padding
      const y = height - padding - ((lastPoint.price - adjustedMinPrice) / priceRange) * (height - 2 * padding)

      ctx.fillStyle = "#8FF7A7"
      ctx.shadowColor = "rgba(143,247,167,0.25)"
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()
    }

    ctx.fillStyle = "#E8F0FF"
    ctx.font = "12px IBM Plex Mono"
    ctx.textAlign = "right"
    ctx.shadowBlur = 0

    // Max price
    ctx.fillText(adjustedMaxPrice.toFixed(2), width - padding - 10, padding + 15)

    // Min price
    ctx.fillText(adjustedMinPrice.toFixed(2), width - padding - 10, height - padding - 5)

    // Current price
    const currentY = height - padding - ((currentPrice - adjustedMinPrice) / priceRange) * (height - 2 * padding)
    ctx.fillText(currentPrice.toFixed(2), width - padding - 10, currentY + 5)
  }

  useEffect(() => {
    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      drawChart()
    }, 100)

    // Handle window resize
    const handleResize = () => {
      setTimeout(() => {
        drawChart()
      }, 100)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [marketData, currentPrice])

  return (
    <div className="terminal-panel-chart p-4" style={{ height: "600px", minHeight: "600px" }}>
      <div className="flex justify-between items-center mb-4">
        <div>
                 <h2 className="text-lg font-bold terminal-glow">
                   SOL/USDC LIVE CHART - {roundPhase === 'waiting' ? '🎯 BETTING OPEN' : '⏳ WAITING FOR RESULTS'}
                 </h2>
          <div className="text-xs" style={{ color: "var(--color-text-dim)" }}>
            {isLoading ? "Loading real-time data..." : error ? "Using fallback data" : "Real-time Solana price from DexScreener"}
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold terminal-glow">${currentPrice.toFixed(2)}</div>
          <div
            className={`text-sm ${priceChange >= 0 ? "text-[var(--color-accent-up)]" : "text-[var(--color-accent-down)]"}`}
          >
            {priceChange >= 0 ? "+" : ""}
            {priceChange.toFixed(2)} ({priceChangePercent >= 0 ? "+" : ""}
            {priceChangePercent.toFixed(2)}%)
          </div>
          {solanaData && (
            <div className="text-xs mt-1" style={{ color: "var(--color-text-dim)" }}>
              Vol 24h: {solanaData.volume24h > 1000000 
                ? `$${(solanaData.volume24h / 1000000).toFixed(1)}M`
                : solanaData.volume24h > 1000
                ? `$${(solanaData.volume24h / 1000).toFixed(0)}K`
                : solanaData.volume24h > 0
                ? `$${solanaData.volume24h.toFixed(0)}`
                : "N/A"
              }
            </div>
          )}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg flex-1" style={{ padding: "10px" }}>
        <canvas 
          ref={canvasRef} 
          className="w-full h-full block" 
          style={{ 
            imageRendering: "auto",
            display: "block",
            maxWidth: "100%",
            maxHeight: "100%",
            borderRadius: "6px"
          }} 
        />

        {entryPrice && (
          <div className="absolute top-2 left-2 text-xs">
            <div style={{ color: "var(--color-text-dim)" }}>ENTRY: ${entryPrice.toFixed(2)}</div>
          </div>
        )}
      </div>
    </div>
  )
}
