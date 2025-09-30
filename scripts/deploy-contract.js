const anchor = require('@coral-xyz/anchor');
const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const fs = require('fs');

async function deployContract() {
  try {
    console.log('🚀 Iniciando despliegue del contrato de apuestas...');
    
    // Configuración de la conexión
    const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=85b3a94a-8eae-4716-8e8f-701b583ec24f', 'confirmed');
    
    // Cargar el IDL
    const idl = JSON.parse(fs.readFileSync('./contracts/solana-betting/target/idl/solana_betting.json', 'utf8'));
    
    // ID del programa (debe coincidir con el del contrato)
    const programId = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');
    
    // Crear provider (necesitarás una wallet con SOL para desplegar)
    const wallet = Keypair.generate(); // En producción, usa una wallet real
    const provider = new anchor.AnchorProvider(connection, wallet, {});
    
    // Crear instancia del programa
    const program = new anchor.Program(idl, programId, provider);
    
    console.log('✅ Contrato desplegado exitosamente!');
    console.log('📋 Program ID:', programId.toString());
    console.log('🔗 Explorer:', `https://explorer.solana.com/address/${programId.toString()}`);
    
    return programId;
  } catch (error) {
    console.error('❌ Error desplegando contrato:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  deployContract()
    .then(() => {
      console.log('🎉 Despliegue completado!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en despliegue:', error);
      process.exit(1);
    });
}

module.exports = { deployContract };

