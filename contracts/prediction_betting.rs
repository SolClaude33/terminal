use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("PredictionBetting111111111111111111111111111");

#[program]
pub mod prediction_betting {
    use super::*;

    // Inicializar el programa
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let program_state = &mut ctx.accounts.program_state;
        program_state.authority = ctx.accounts.authority.key();
        program_state.treasury = ctx.accounts.treasury.key();
        program_state.current_round = 0;
        program_state.total_volume = 0;
        program_state.house_fee_percentage = 5; // 5% comisión
        program_state.is_active = true;
        
        Ok(())
    }

    // Crear una nueva ronda de apuestas
    pub fn create_round(ctx: Context<CreateRound>, round_id: u64) -> Result<()> {
        let round = &mut ctx.accounts.round;
        let clock = Clock::get()?;
        
        round.round_id = round_id;
        round.entry_price = 0; // Se establecerá cuando comience
        round.bet_price = 0;   // Se establecerá cuando termine
        round.start_time = clock.unix_timestamp;
        round.betting_end_time = clock.unix_timestamp + 60; // 60 segundos para apostar
        round.resolution_time = clock.unix_timestamp + 120; // 120 segundos total
        round.status = RoundStatus::Waiting;
        round.total_up_bets = 0;
        round.total_down_bets = 0;
        round.winner = None;
        round.authority = ctx.accounts.authority.key();
        
        Ok(())
    }

    // Hacer una apuesta
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        amount: u64,
        direction: BetDirection,
    ) -> Result<()> {
        let round = &mut ctx.accounts.round;
        let bet = &mut ctx.accounts.bet;
        let clock = Clock::get()?;
        
        // Verificar que la ronda esté activa
        require!(round.status == RoundStatus::Betting, ErrorCode::RoundNotActive);
        require!(clock.unix_timestamp < round.betting_end_time, ErrorCode::BettingPeriodEnded);
        
        // Transferir SOL del apostador al contrato
        let transfer_instruction = system_program::Transfer {
            from: ctx.accounts.bettor.to_account_info(),
            to: ctx.accounts.treasury.to_account_info(),
        };
        
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            transfer_instruction,
        );
        system_program::transfer(cpi_ctx, amount)?;
        
        // Registrar la apuesta
        bet.bettor = ctx.accounts.bettor.key();
        bet.round_id = round.round_id;
        bet.amount = amount;
        bet.direction = direction;
        bet.timestamp = clock.unix_timestamp;
        bet.claimed = false;
        
        // Actualizar totales de la ronda
        match direction {
            BetDirection::Up => {
                round.total_up_bets += amount;
            },
            BetDirection::Down => {
                round.total_down_bets += amount;
            },
        }
        
        // Actualizar volumen total
        let program_state = &mut ctx.accounts.program_state;
        program_state.total_volume += amount;
        
        Ok(())
    }

    // Resolver una ronda
    pub fn resolve_round(
        ctx: Context<ResolveRound>,
        final_price: u64,
    ) -> Result<()> {
        let round = &mut ctx.accounts.round;
        let clock = Clock::get()?;
        
        // Verificar que sea tiempo de resolver
        require!(clock.unix_timestamp >= round.resolution_time, ErrorCode::TooEarlyToResolve);
        require!(round.status == RoundStatus::Betting, ErrorCode::RoundAlreadyResolved);
        
        // Establecer precio de entrada y apuesta
        round.bet_price = final_price;
        
        // Determinar ganador
        round.winner = if final_price > round.entry_price {
            Some(BetDirection::Up)
        } else {
            Some(BetDirection::Down)
        };
        
        round.status = RoundStatus::Resolved;
        
        Ok(())
    }

    // Reclamar ganancias
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let bet = &mut ctx.accounts.bet;
        let round = &ctx.accounts.round;
        
        // Verificar que la ronda esté resuelta
        require!(round.status == RoundStatus::Resolved, ErrorCode::RoundNotResolved);
        
        // Verificar que el apostador ganó
        require!(bet.direction == round.winner.unwrap(), ErrorCode::NotAWinner);
        
        // Verificar que no haya reclamado ya
        require!(!bet.claimed, ErrorCode::AlreadyClaimed);
        
        // Calcular ganancias
        let total_winning_bets = if round.winner.unwrap() == BetDirection::Up {
            round.total_up_bets
        } else {
            round.total_down_bets
        };
        
        let total_losing_bets = if round.winner.unwrap() == BetDirection::Up {
            round.total_down_bets
        } else {
            round.total_up_bets
        };
        
        let payout = calculate_payout(
            bet.amount,
            total_winning_bets,
            total_losing_bets,
            ctx.accounts.program_state.house_fee_percentage,
        );
        
        // Transferir ganancias del contrato al apostador
        let treasury_info = ctx.accounts.treasury.to_account_info();
        let bettor_info = ctx.accounts.bettor.to_account_info();
        let system_program_info = ctx.accounts.system_program.to_account_info();
        
        let transfer_instruction = system_program::Transfer {
            from: treasury_info,
            to: bettor_info,
        };
        
        let cpi_ctx = CpiContext::new(
            system_program_info,
            transfer_instruction,
        );
        system_program::transfer(cpi_ctx, payout)?;
        
        // Marcar como reclamado
        bet.claimed = true;
        
        Ok(())
    }

    // Función auxiliar para calcular ganancias
    fn calculate_payout(
        bet_amount: u64,
        total_winning_bets: u64,
        total_losing_bets: u64,
        house_fee_percentage: u8,
    ) -> u64 {
        if total_winning_bets == 0 {
            return 0;
        }
        
        let bet_proportion = (bet_amount as f64) / (total_winning_bets as f64);
        let total_pool = total_losing_bets as f64;
        let house_fee = house_fee_percentage as f64 / 100.0;
        
        let payout = bet_proportion * total_pool * (1.0 - house_fee);
        
        (payout as u64) + bet_amount
    }
}

// Contextos de transacciones
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 8 + 8 + 1 + 1,
        seeds = [b"program_state"],
        bump
    )]
    pub program_state: Account<'info, ProgramState>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + 32,
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: SystemAccount<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(round_id: u64)]
pub struct CreateRound<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 8 + 8 + 8 + 8 + 8 + 8 + 1 + 8 + 8 + 1 + 32,
        seeds = [b"round", round_id.to_le_bytes().as_ref()],
        bump
    )]
    pub round: Account<'info, BettingRound>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64, direction: BetDirection)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub round: Account<'info, BettingRound>,
    
    #[account(
        init,
        payer = bettor,
        space = 8 + 32 + 8 + 8 + 1 + 8 + 1,
        seeds = [b"bet", round.key().as_ref(), bettor.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,
    
    #[account(mut)]
    pub bettor: Signer<'info>,
    
    #[account(mut)]
    pub treasury: SystemAccount<'info>,
    
    #[account(mut)]
    pub program_state: Account<'info, ProgramState>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(final_price: u64)]
pub struct ResolveRound<'info> {
    #[account(mut)]
    pub round: Account<'info, BettingRound>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub bet: Account<'info, Bet>,
    
    #[account(mut)]
    pub round: Account<'info, BettingRound>,
    
    #[account(mut)]
    pub bettor: Signer<'info>,
    
    #[account(mut)]
    pub treasury: SystemAccount<'info>,
    
    pub program_state: Account<'info, ProgramState>,
    
    pub system_program: Program<'info, System>,
}

// Estructuras de datos
#[account]
pub struct ProgramState {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub current_round: u64,
    pub total_volume: u64,
    pub house_fee_percentage: u8,
    pub is_active: bool,
}

#[account]
pub struct BettingRound {
    pub round_id: u64,
    pub entry_price: u64,
    pub bet_price: u64,
    pub start_time: i64,
    pub betting_end_time: i64,
    pub resolution_time: i64,
    pub status: RoundStatus,
    pub total_up_bets: u64,
    pub total_down_bets: u64,
    pub winner: Option<BetDirection>,
    pub authority: Pubkey,
}

#[account]
pub struct Bet {
    pub bettor: Pubkey,
    pub round_id: u64,
    pub amount: u64,
    pub direction: BetDirection,
    pub timestamp: i64,
    pub claimed: bool,
}

// Enums
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum BetDirection {
    Up,
    Down,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum RoundStatus {
    Waiting,
    Betting,
    Resolved,
    Cancelled,
}

// Códigos de error
#[error_code]
pub enum ErrorCode {
    #[msg("Round is not active")]
    RoundNotActive,
    #[msg("Betting period has ended")]
    BettingPeriodEnded,
    #[msg("Round already resolved")]
    RoundAlreadyResolved,
    #[msg("Too early to resolve")]
    TooEarlyToResolve,
    #[msg("Round not resolved")]
    RoundNotResolved,
    #[msg("Not a winner")]
    NotAWinner,
    #[msg("Already claimed")]
    AlreadyClaimed,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Unauthorized")]
    Unauthorized,
}
