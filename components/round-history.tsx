"use client"

interface RoundHistoryProps {
  roundHistory: Array<{
    roundNumber: number
    entryPrice: number
    betPrice: number
    result: 'up' | 'down'
    timestamp: number
  }>
}

export default function RoundHistory({ roundHistory }: RoundHistoryProps) {
  if (roundHistory.length === 0) {
    return null
  }

  return (
    <div className="terminal-panel p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold terminal-glow">ROUND HISTORY</h2>
        <div className="text-xs" style={{ color: "var(--color-text-dim)" }}>
          Last {Math.min(roundHistory.length, 10)} rounds
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {roundHistory.slice(-10).reverse().map((round, index) => (
          <div key={round.timestamp} className="terminal-border p-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold terminal-glow">
                  #{round.roundNumber}
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <span style={{ color: "var(--color-text-dim)" }}>Entry:</span>
                  <span className="font-bold">${round.entryPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span style={{ color: "var(--color-text-dim)" }}>Final:</span>
                  <span className="font-bold">${round.betPrice.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>
                    {round.betPrice > round.entryPrice ? '▲' : '▼'}
                  </span>
                  <span className={`font-bold text-sm ${
                    round.betPrice > round.entryPrice ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {round.betPrice > round.entryPrice ? '+$' : '-$'}
                    {Math.abs(round.betPrice - round.entryPrice).toFixed(2)}
                  </span>
                </div>
                <span className={`font-bold text-sm ${
                  round.result === 'up' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {round.result.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="mt-2 text-xs" style={{ color: "var(--color-text-dim)" }}>
              {new Date(round.timestamp).toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

