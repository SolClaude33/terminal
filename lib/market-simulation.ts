export interface MarketDataPoint {
  timestamp: number
  price: number
}

// Seeded random number generator
class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }

  gaussian(): number {
    // Box-Muller transform for normal distribution
    const u1 = this.next()
    const u2 = this.next()
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  }
}

export function generateMarketData(
  points: number,
  startPrice = 731.05,
  volatility: "low" | "medium" | "high" = "medium",
): MarketDataPoint[] {
  const now = Date.now()
  const seed = Math.floor(now / 60000) // New seed every minute
  const rng = new SeededRandom(seed)

  const volatilityMap = {
    low: 0.001,
    medium: 0.003,
    high: 0.007,
  }

  const vol = volatilityMap[volatility]
  const drift = 0.0001 // Slight upward bias
  const dt = 1 // 1 second intervals

  const data: MarketDataPoint[] = []
  let currentPrice = startPrice

  for (let i = 0; i < points; i++) {
    // Geometric Brownian Motion
    const randomShock = rng.gaussian()
    const priceChange = currentPrice * (drift * dt + vol * Math.sqrt(dt) * randomShock)
    currentPrice += priceChange

    // Prevent extreme price movements
    currentPrice = Math.max(currentPrice, startPrice * 0.8)
    currentPrice = Math.min(currentPrice, startPrice * 1.2)

    data.push({
      timestamp: now - (points - i - 1) * 1000,
      price: currentPrice,
    })
  }

  return data
}

export function calculatePayout(
  entryPrice: number,
  exitPrice: number,
  direction: "up" | "down",
  basePayout = 1.9,
): { payout: number; multiplier: number } {
  const priceChange = exitPrice - entryPrice
  const percentChange = Math.abs(priceChange / entryPrice)

  const isWin = (direction === "up" && priceChange > 0) || (direction === "down" && priceChange < 0)

  if (!isWin) {
    return { payout: 0, multiplier: 0 }
  }

  // Margin bonus: +0.1x per additional 0.05% in-favor move, cap at 5x
  const marginBonus = Math.min(Math.floor(percentChange / 0.0005) * 0.1, 3.1)
  const multiplier = Math.min(basePayout + marginBonus, 5.0)

  return { payout: multiplier, multiplier }
}

export function generateFairnessSeed(roundId: string): string {
  const date = new Date().toISOString().split("T")[0]
  return `${roundId}-${date}`
}
