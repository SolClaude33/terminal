"use client"

interface StatusBarProps {
  currentTime: Date
  roundTimeLeft: number
  roundPhase: 'betting' | 'waiting'
  roundNumber: number
  entryPrice: number | null
  betPrice: number | null
  roundHistory: Array<{
    roundNumber: number
    entryPrice: number
    betPrice: number
    result: 'up' | 'down'
    timestamp: number
  }>
}

export default function StatusBar({ currentTime, roundTimeLeft, roundPhase, roundNumber, entryPrice, betPrice, roundHistory }: StatusBarProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatRoundTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="terminal-panel px-4 py-2 border-b">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="terminal-glow text-sm font-bold">WALL•ST BET TERMINAL v1.9 (1987)</div>

        <div className="flex flex-col sm:flex-row gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">SYS TIME:</span>
            <span className="terminal-glow">{formatTime(currentTime)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">CONNECTION:</span>
            <span className="text-primary">●</span>
            <span className="terminal-glow">ONLINE</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">ROUND #{roundNumber}:</span>
            <span className={`terminal-glow font-bold ${roundPhase === 'waiting' ? 'text-green-400' : 'text-yellow-400'}`}>
              {roundPhase === 'waiting' ? 'BETTING OPEN' : 'WAITING FOR RESULTS'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">TIME LEFT:</span>
            <span className={`terminal-glow font-bold ${roundTimeLeft <= 10 ? "text-destructive" : "text-secondary"}`}>
              {formatRoundTime(roundTimeLeft)}
            </span>
          </div>

          {entryPrice && roundPhase === 'betting' && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">ENTRY PRICE:</span>
              <span className="terminal-glow font-bold text-blue-400">
                ${entryPrice.toFixed(2)}
              </span>
            </div>
          )}
          
          {roundHistory.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">LAST ROUND:</span>
              <span className="terminal-glow font-bold">
                #{roundHistory[roundHistory.length - 1].roundNumber}
              </span>
              <span className={`font-bold ${roundHistory[roundHistory.length - 1].result === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {roundHistory[roundHistory.length - 1].result.toUpperCase()}
              </span>
              <span className="text-muted-foreground">
                ${roundHistory[roundHistory.length - 1].entryPrice.toFixed(2)} → ${roundHistory[roundHistory.length - 1].betPrice.toFixed(2)}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">SYNC:</span>
            <span className="terminal-glow font-bold text-green-400">
              GLOBAL
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
