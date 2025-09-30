"use client"

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui'
import { useEffect, useState } from 'react'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'

export function WalletButton() {
  const { publicKey, connected } = useWallet()
  const [balance, setBalance] = useState<number>(0)
  const [memecoinBalance, setMemecoinBalance] = useState<number>(0)
  const [balanceError, setBalanceError] = useState<boolean>(false)
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false)
  const [isSimulatedBalance, setIsSimulatedBalance] = useState<boolean>(false)

  useEffect(() => {
    if (publicKey) {
      // Lista de endpoints para probar (usando endpoints de mainnet que funcionan)
      const endpoints = [
        'https://mainnet.helius-rpc.com/?api-key=85b3a94a-8eae-4716-8e8f-701b583ec24f',
        'https://api.mainnet-beta.solana.com',
        'https://rpc.ankr.com/solana'
      ]
      
      const tryGetBalance = async (endpointIndex = 0) => {
        if (endpointIndex >= endpoints.length) {
          console.error('All RPC endpoints failed - cannot connect to Solana mainnet')
          setBalance(0)
          setBalanceError(true)
          setIsSimulatedBalance(false)
          setIsLoadingBalance(false)
          return
        }
        
        setIsLoadingBalance(true)
        
        try {
          const connection = new Connection(endpoints[endpointIndex], {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 30000,
          })
          
          // Timeout de 3 segundos por endpoint
          const balancePromise = connection.getBalance(publicKey)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 3000)
          )
          
          const balance = await Promise.race([balancePromise, timeoutPromise]) as number
          setBalance(balance / LAMPORTS_PER_SOL)
          setBalanceError(false)
          setIsSimulatedBalance(false) // Balance real
          setIsLoadingBalance(false)
          console.log(`✅ Balance loaded successfully from ${endpoints[endpointIndex]}: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`)
        } catch (error) {
          console.warn(`❌ Error with endpoint ${endpoints[endpointIndex]}:`, error.message)
          // Probar el siguiente endpoint
          tryGetBalance(endpointIndex + 1)
        }
      }
      
      tryGetBalance()

      // Por ahora, simular balance de $PREDICTION
      // Más adelante integraremos el token real
      setMemecoinBalance(1000) // Simulado
    }
  }, [publicKey])

  if (!connected) {
    return (
      <div className="flex items-center gap-2">
        <WalletMultiButton className="terminal-glow bg-primary hover:bg-primary/90 text-primary-foreground" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm">
        <div className="text-muted-foreground">
          SOL: {isLoadingBalance ? 'Loading...' : balanceError ? 'Error loading' : `${balance.toFixed(4)}`}
          {isSimulatedBalance && (
            <span className="text-xs text-orange-500 ml-1">(simulated)</span>
          )}
        </div>
        <div className="text-muted-foreground">$PREDICTION: {memecoinBalance.toFixed(2)}</div>
        {balanceError && (
          <div className="text-xs text-yellow-500">RPC connection issue</div>
        )}
        {isLoadingBalance && (
          <div className="text-xs text-blue-500">Trying RPC endpoints...</div>
        )}
        {isSimulatedBalance && (
          <div className="text-xs text-orange-500">Using simulated balance for development</div>
        )}
      </div>
      <WalletDisconnectButton className="terminal-glow bg-destructive hover:bg-destructive/90 text-destructive-foreground" />
    </div>
  )
}
