use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod solana_betting {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let program_state = &mut ctx.accounts.program_state;
        program_state.authority = ctx.accounts.authority.key();
        program_state.total_rounds = 0;
        program_state.is_active = true;
        Ok(())
    }

    pub fn create_round(ctx: Context<CreateRound>, round_id: u64) -> Result<()> {
        let round = &mut ctx.accounts.round;
        round.id = round_id;
        round.status = RoundStatus::Active;
        round.total_pool_up = 0;
        round.total_pool_down = 0;
        round.entry_price = 0; // Se establecerá externamente
        round.result_price = 0;
        round.created_at = Clock::get()?.unix_timestamp;
        
        let program_state = &mut ctx.accounts.program_state;
        program_state.total_rounds += 1;
        
        Ok(())
    }

    pub fn place_bet(ctx: Context<PlaceBet>, amount: u64, direction: BetDirection) -> Result<()> {
        let bet = &mut ctx.accounts.bet;
        bet.bettor = ctx.accounts.bettor.key();
        bet.round = ctx.accounts.round.key();
        bet.amount = amount;
        bet.direction = direction;
        bet.claimed = false;
        bet.created_at = Clock::get()?.unix_timestamp;

        let round = &mut ctx.accounts.round;
        match direction {
            BetDirection::Up => round.total_pool_up += amount,
            BetDirection::Down => round.total_pool_down += amount,
        }

        // Transferir SOL del bettor al programa
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.bettor.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, amount)?;

        Ok(())
    }

    pub fn resolve_round(ctx: Context<ResolveRound>, result_price: u64, winning_direction: BetDirection) -> Result<()> {
        let round = &mut ctx.accounts.round;
        round.status = RoundStatus::Resolved;
        round.result_price = result_price;
        round.winning_direction = Some(winning_direction);
        round.resolved_at = Clock::get()?.unix_timestamp;
        
        Ok(())
    }

    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let bet = &mut ctx.accounts.bet;
        let round = &ctx.accounts.round;
        
        require!(!bet.claimed, ErrorCode::AlreadyClaimed);
        require!(round.status == RoundStatus::Resolved, ErrorCode::RoundNotResolved);
        
        let winning_direction = round.winning_direction.ok_or(ErrorCode::NoWinningDirection)?;
        require!(bet.direction == winning_direction, ErrorCode::NotWinningBet);

        // Calcular ganancias
        let total_winning_pool = match winning_direction {
            BetDirection::Up => round.total_pool_up,
            BetDirection::Down => round.total_pool_down,
        };
        
        let total_losing_pool = match winning_direction {
            BetDirection::Up => round.total_pool_down,
            BetDirection::Down => round.total_pool_up,
        };

        let total_pool = total_winning_pool + total_losing_pool;
        let multiplier = (total_pool * 95) / 100; // 95% del pool total (5% fee)
        let winnings = (bet.amount * multiplier) / total_winning_pool;

        bet.claimed = true;

        // Transferir ganancias al bettor
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.treasury.to_account_info(),
                to: ctx.accounts.bettor.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, winnings)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 1,
        seeds = [b"program_state"],
        bump
    )]
    pub program_state: Account<'info, ProgramState>,
    
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
        space = 8 + 8 + 1 + 8 + 8 + 8 + 8 + 1 + 8 + 8,
        seeds = [b"round", round_id.to_le_bytes().as_ref()],
        bump
    )]
    pub round: Account<'info, Round>,
    
    #[account(
        mut,
        seeds = [b"program_state"],
        bump
    )]
    pub program_state: Account<'info, ProgramState>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(
        init,
        payer = bettor,
        space = 8 + 32 + 32 + 8 + 1 + 1 + 8,
        seeds = [b"bet", round.key().as_ref(), bettor.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,
    
    #[account(mut)]
    pub round: Account<'info, Round>,
    
    #[account(
        mut,
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: SystemAccount<'info>,
    
    #[account(mut)]
    pub bettor: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveRound<'info> {
    #[account(mut)]
    pub round: Account<'info, Round>,
    
    #[account(
        mut,
        seeds = [b"program_state"],
        bump
    )]
    pub program_state: Account<'info, ProgramState>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub bet: Account<'info, Bet>,
    
    #[account(mut)]
    pub round: Account<'info, Round>,
    
    #[account(
        mut,
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: SystemAccount<'info>,
    
    #[account(mut)]
    pub bettor: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct ProgramState {
    pub authority: Pubkey,
    pub total_rounds: u64,
    pub is_active: bool,
}

#[account]
pub struct Round {
    pub id: u64,
    pub status: RoundStatus,
    pub total_pool_up: u64,
    pub total_pool_down: u64,
    pub entry_price: u64,
    pub result_price: u64,
    pub winning_direction: Option<BetDirection>,
    pub created_at: i64,
    pub resolved_at: i64,
}

#[account]
pub struct Bet {
    pub bettor: Pubkey,
    pub round: Pubkey,
    pub amount: u64,
    pub direction: BetDirection,
    pub claimed: bool,
    pub created_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum RoundStatus {
    Active,
    Resolved,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum BetDirection {
    Up,
    Down,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Already claimed")]
    AlreadyClaimed,
    #[msg("Round not resolved")]
    RoundNotResolved,
    #[msg("No winning direction")]
    NoWinningDirection,
    #[msg("Not winning bet")]
    NotWinningBet,
}
