export interface Round {
  id: string
  startTime: number
  endTime: number
  startPrice: number
  endPrice: number | null
  status: "pending" | "active" | "settling" | "completed"
  fairnessSeed: string
}

export class RoundManager {
  private currentRound: Round | null = null
  private roundDuration = 60000 // 60 seconds
  private callbacks: Array<(round: Round) => void> = []

  constructor() {
    this.startNewRound()
  }

  private generateRoundId(): string {
    return `round_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateFairnessSeed(roundId: string): string {
    const date = new Date().toISOString().split("T")[0]
    return `${roundId}-${date}`
  }

  private startNewRound(): void {
    const now = Date.now()
    const roundId = this.generateRoundId()

    this.currentRound = {
      id: roundId,
      startTime: now,
      endTime: now + this.roundDuration,
      startPrice: 731.05 + (Math.random() - 0.5) * 20, // Random start price
      endPrice: null,
      status: "active",
      fairnessSeed: this.generateFairnessSeed(roundId),
    }

    this.notifyCallbacks()

    // Schedule round end
    setTimeout(() => {
      this.endRound()
    }, this.roundDuration)
  }

  private endRound(): void {
    if (!this.currentRound) return

    this.currentRound.status = "settling"
    this.currentRound.endPrice = this.currentRound.startPrice + (Math.random() - 0.5) * 10

    this.notifyCallbacks()

    // Start new round after 3 seconds
    setTimeout(() => {
      if (this.currentRound) {
        this.currentRound.status = "completed"
        this.notifyCallbacks()
      }
      this.startNewRound()
    }, 3000)
  }

  public getCurrentRound(): Round | null {
    return this.currentRound
  }

  public getTimeLeft(): number {
    if (!this.currentRound) return 0
    return Math.max(0, this.currentRound.endTime - Date.now())
  }

  public subscribe(callback: (round: Round) => void): () => void {
    this.callbacks.push(callback)
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback)
    }
  }

  private notifyCallbacks(): void {
    if (this.currentRound) {
      this.callbacks.forEach((callback) => callback(this.currentRound!))
    }
  }

  public verifyFairness(roundId: string, seed: string): boolean {
    // In a real implementation, this would verify the seed against the round outcome
    return seed.includes(roundId)
  }
}

// Singleton instance
export const roundManager = new RoundManager()
