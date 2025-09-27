export interface SolanaPriceData {
  price: number
  priceChange24h: number
  priceChangePercent24h: number
  volume24h: number
  marketCap: number
  timestamp: number
}

export interface SolanaPair {
  chainId: string
  dexId: string
  url: string
  pairAddress: string
  baseToken: {
    address: string
    name: string
    symbol: string
  }
  quoteToken: {
    address: string
    name: string
    symbol: string
  }
  priceUsd: string
  priceChange24h?: number
  priceChangePercent24h?: number
  volume24h?: number
  volume?: {
    h24: number
    h6: number
    h1: number
    m5: number
  }
  priceChange?: {
    m5: number
    h1: number
    h6: number
    h24: number
  }
  liquidity: {
    usd: number
    base: number
    quote: number
  }
  marketCap?: number
  timestamp?: number
}

export interface DexScreenerResponse {
  schemaVersion: string
  pairs: SolanaPair[]
}

// Solana token addresses for different pairs
const SOLANA_PAIRS = {
  SOL_USDC: "So11111111111111111111111111111111111111112", // Wrapped SOL
  SOL_USDT: "So11111111111111111111111111111111111111112", // Wrapped SOL
  SOL_BTC: "So11111111111111111111111111111111111111112", // Wrapped SOL
}

export class SolanaAPI {
  private static readonly DEXSCREENER_BASE_URL = "https://api.dexscreener.com/latest/dex/tokens"
  private static readonly CACHE_DURATION = 500 // 0.5 seconds cache for more frequent updates
  private static cache: Map<string, { data: SolanaPriceData; timestamp: number }> = new Map()
  private static lastRealPrice: number = 0
  private static lastMicroPrice: number = 0
  private static lastRealPriceTime: number = 0

  /**
   * Generate micro-movements around the real price for visual dynamism
   */
  private static generateMicroMovement(realPrice: number, forceReal: boolean = false): number {
    // If this is the first price or real price changed significantly, reset
    if (this.lastRealPrice === 0 || Math.abs(realPrice - this.lastRealPrice) > 1) {
      this.lastRealPrice = realPrice
      this.lastMicroPrice = realPrice
      return realPrice
    }

    // Force real price every 6 seconds (when forceReal is true)
    if (forceReal) {
      this.lastRealPrice = realPrice
      this.lastMicroPrice = realPrice
      return realPrice
    }

    // Generate very small random movement (0.05% to 0.1% volatility)
    const volatility = 0.0008 // 0.08% volatility (much smaller)
    const randomChange = (Math.random() - 0.5) * 2 * volatility
    
    // Apply stronger mean reversion to keep it very close to real price
    const meanReversion = (realPrice - this.lastMicroPrice) * 0.3
    
    // Calculate new micro price
    const newMicroPrice = this.lastMicroPrice * (1 + randomChange) + meanReversion
    
    // Ensure it doesn't deviate too far from real price (±0.5%)
    const maxDeviation = realPrice * 0.005
    const boundedPrice = Math.max(
      realPrice - maxDeviation,
      Math.min(realPrice + maxDeviation, newMicroPrice)
    )

    this.lastMicroPrice = boundedPrice
    return boundedPrice
  }

  /**
   * Get SOL price data from DexScreener API with micro-movements
   * Uses caching to avoid rate limiting
   */
  static async getSolanaPriceData(pairType: keyof typeof SOLANA_PAIRS = "SOL_USDC"): Promise<SolanaPriceData> {
    const cacheKey = `sol_${pairType}`
    const now = Date.now()
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data
    }

    try {
      const tokenAddress = SOLANA_PAIRS[pairType]
      // Reduced fetch log spam
      const response = await fetch(`${this.DEXSCREENER_BASE_URL}/${tokenAddress}`)
      
      if (!response.ok) {
        console.error(`[SOL API] Error ${response.status}: ${response.statusText}`)
        throw new Error(`DexScreener API error: ${response.status}`)
      }

      const data: DexScreenerResponse = await response.json()
      
      if (!data.pairs || data.pairs.length === 0) {
        throw new Error("No SOL pairs found")
      }

      // Find the best pair (highest liquidity for SOL/USDC)
      let bestPair = data.pairs
        .filter(pair => 
          pair.baseToken.symbol === "SOL" && 
          pair.quoteToken.symbol === "USDC" &&
          pair.chainId === "solana"
        )
        .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0]

      // If the best pair has no volume, try to find one with volume
      if (!bestPair || (bestPair.volume24h === 0 && (!bestPair.volume || bestPair.volume.h24 === 0))) {
        const pairWithVolume = data.pairs
          .filter(pair => 
            pair.baseToken.symbol === "SOL" && 
            pair.quoteToken.symbol === "USDC" &&
            pair.chainId === "solana" &&
            ((pair.volume24h && pair.volume24h > 0) || (pair.volume && pair.volume.h24 > 0))
          )
          .sort((a, b) => {
            const aVol = a.volume24h || (a.volume?.h24 || 0)
            const bVol = b.volume24h || (b.volume?.h24 || 0)
            return bVol - aVol
          })[0]
        
        if (pairWithVolume) {
          bestPair = pairWithVolume
          const volume = pairWithVolume.volume24h || pairWithVolume.volume?.h24 || 0
          console.log(`[SOL API] Using pair with volume: ${volume}`)
        }
      }

      if (!bestPair) {
        throw new Error("No suitable SOL/USDC pair found")
      }

      const realPrice = parseFloat(bestPair.priceUsd)
      
      // Force real price every 6 seconds
      const shouldForceReal = (now - this.lastRealPriceTime) >= 6000
      const microPrice = this.generateMicroMovement(realPrice, shouldForceReal)
      
      // Update timing for real price enforcement
      if (shouldForceReal) {
        this.lastRealPriceTime = now
      }
      
      // Extract volume from either volume24h or volume.h24
      const volume24h = bestPair.volume24h || bestPair.volume?.h24 || 0
      
      // Extract price change from either priceChange24h or priceChange.h24
      const priceChange24h = bestPair.priceChange24h || bestPair.priceChange?.h24 || 0
      const priceChangePercent24h = bestPair.priceChangePercent24h || 
        (priceChange24h && parseFloat(bestPair.priceUsd) ? (priceChange24h / parseFloat(bestPair.priceUsd)) * 100 : 0)

      const priceData: SolanaPriceData = {
        price: microPrice, // Use micro-movement price for display
        priceChange24h: priceChange24h,
        priceChangePercent24h: priceChangePercent24h,
        volume24h: volume24h,
        marketCap: bestPair.marketCap || 0,
        timestamp: bestPair.timestamp || now,
      }
      
      // Cache the result
      this.cache.set(cacheKey, { data: priceData, timestamp: now })
      
      // Reduced API logs to prevent spam - only log every 10th call
      if (Math.random() < 0.1) {
        const diffPercent = ((priceData.price - realPrice) / realPrice * 100).toFixed(3)
        const status = shouldForceReal ? "REAL" : "MICRO"
        console.log(`[SOL API] ${status}: $${realPrice.toFixed(2)} → $${priceData.price.toFixed(2)} | Diff: ${diffPercent}%`)
      }

      return priceData
    } catch (error) {
      console.error("Error fetching SOL price data:", error)
      
      // Return fallback data if API fails (with micro-movements)
      const fallbackPrice = this.generateMicroMovement(100.0)
      return {
        price: fallbackPrice,
        priceChange24h: 0,
        priceChangePercent24h: 0,
        volume24h: 0,
        marketCap: 0,
        timestamp: now,
      }
    }
  }

  /**
   * Get multiple SOL pairs for comparison
   */
  static async getAllSolanaPairs(): Promise<SolanaPair[]> {
    try {
      const tokenAddress = SOLANA_PAIRS.SOL_USDC
      const response = await fetch(`${this.DEXSCREENER_BASE_URL}/${tokenAddress}`)
      
      if (!response.ok) {
        throw new Error(`DexScreener API error: ${response.status}`)
      }

      const data: DexScreenerResponse = await response.json()
      return data.pairs || []
    } catch (error) {
      console.error("Error fetching all SOL pairs:", error)
      return []
    }
  }

  /**
   * Get historical price data (simulated for now)
   * In a real implementation, you'd use a different API for historical data
   */
  static async getHistoricalData(hours: number = 24): Promise<{ price: number; timestamp: number }[]> {
    try {
      const currentData = await this.getSolanaPriceData()
      const data = []
      const now = Date.now()
      
      // Generate simulated historical data based on current price
      for (let i = hours; i >= 0; i--) {
        const timestamp = now - (i * 60 * 60 * 1000)
        const volatility = 0.02 // 2% volatility
        const randomChange = (Math.random() - 0.5) * volatility
        const price = currentData.price * (1 + randomChange)
        
        data.push({
          price: Math.max(price, currentData.price * 0.8), // Prevent unrealistic drops
          timestamp,
        })
      }
      
      return data
    } catch (error) {
      console.error("Error generating historical data:", error)
      return []
    }
  }
}
