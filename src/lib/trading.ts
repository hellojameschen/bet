import prisma from './db'

// Automated Market Maker using Constant Product formula
// For a binary market: price_yes * price_no = k (where k = 0.25 for 50/50)
// Simplified: we use the share pool to determine prices

export async function executeMarketOrder(
  userId: string,
  marketId: string,
  outcomeId: string,
  side: 'buy' | 'sell',
  quantity: number
) {
  return await prisma.$transaction(async (tx) => {
    // Get user
    const user = await tx.user.findUnique({
      where: { id: userId },
    })
    if (!user) throw new Error('User not found')

    // Get market and outcome
    const market = await tx.market.findUnique({
      where: { id: marketId },
      include: { outcomes: true },
    })
    if (!market) throw new Error('Market not found')
    if (market.status !== 'active') throw new Error('Market is not active')

    const outcome = market.outcomes.find((o) => o.id === outcomeId)
    if (!outcome) throw new Error('Outcome not found')

    // Get the other outcome for binary market
    const otherOutcome = market.outcomes.find((o) => o.id !== outcomeId)
    if (!otherOutcome) throw new Error('Invalid market structure')

    // Calculate trade price and cost
    const price = outcome.currentPrice
    
    if (side === 'buy') {
      const cost = price * quantity
      
      // Check user balance
      if (user.balance < cost) {
        throw new Error('Insufficient balance')
      }

      // Deduct balance
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: cost } },
      })

      // Update or create position
      const existingPosition = await tx.position.findUnique({
        where: { userId_outcomeId: { userId, outcomeId } },
      })

      if (existingPosition) {
        const totalShares = existingPosition.shares + quantity
        const totalCost = existingPosition.avgEntryPrice * existingPosition.shares + cost
        const newAvgPrice = totalCost / totalShares

        await tx.position.update({
          where: { id: existingPosition.id },
          data: {
            shares: totalShares,
            avgEntryPrice: newAvgPrice,
          },
        })
      } else {
        await tx.position.create({
          data: {
            userId,
            marketId,
            outcomeId,
            shares: quantity,
            avgEntryPrice: price,
          },
        })
      }

      // Update outcome price based on demand (simple price impact model)
      const priceImpact = Math.min(quantity / (market.liquidity * 10), 0.05)
      const newPrice = Math.min(outcome.currentPrice + priceImpact, 0.99)
      const otherNewPrice = Math.max(1 - newPrice, 0.01)

      await tx.outcome.update({
        where: { id: outcomeId },
        data: {
          currentPrice: newPrice,
          totalShares: { increment: quantity },
        },
      })

      await tx.outcome.update({
        where: { id: otherOutcome.id },
        data: { currentPrice: otherNewPrice },
      })

      // Update market volume
      await tx.market.update({
        where: { id: marketId },
        data: { volume: { increment: cost } },
      })

      // Create trade record
      const trade = await tx.trade.create({
        data: {
          marketId,
          outcomeId,
          userId,
          price,
          quantity,
          side: 'buy',
        },
      })

      // Create order record
      await tx.order.create({
        data: {
          userId,
          marketId,
          outcomeId,
          side: 'buy',
          type: 'market',
          quantity,
          filledQuantity: quantity,
          status: 'filled',
          filledAt: new Date(),
        },
      })

      // Record price history
      await tx.priceHistory.create({
        data: {
          marketId,
          outcomeId,
          price: newPrice,
          volume: cost,
        },
      })

      return {
        trade,
        executedPrice: price,
        totalCost: cost,
        newPrice,
      }
    } else {
      // Sell side
      const position = await tx.position.findUnique({
        where: { userId_outcomeId: { userId, outcomeId } },
      })

      if (!position || position.shares < quantity) {
        throw new Error('Insufficient shares')
      }

      const proceeds = price * quantity
      const costBasis = position.avgEntryPrice * quantity
      const realizedPnl = proceeds - costBasis

      // Add proceeds to balance
      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: proceeds } },
      })

      // Update position
      const newShares = position.shares - quantity
      if (newShares === 0) {
        await tx.position.delete({
          where: { id: position.id },
        })
      } else {
        await tx.position.update({
          where: { id: position.id },
          data: {
            shares: newShares,
            realizedPnl: { increment: realizedPnl },
          },
        })
      }

      // Update outcome price based on supply (simple price impact model)
      const priceImpact = Math.min(quantity / (market.liquidity * 10), 0.05)
      const newPrice = Math.max(outcome.currentPrice - priceImpact, 0.01)
      const otherNewPrice = Math.min(1 - newPrice, 0.99)

      await tx.outcome.update({
        where: { id: outcomeId },
        data: {
          currentPrice: newPrice,
          totalShares: { decrement: quantity },
        },
      })

      await tx.outcome.update({
        where: { id: otherOutcome.id },
        data: { currentPrice: otherNewPrice },
      })

      // Update market volume
      await tx.market.update({
        where: { id: marketId },
        data: { volume: { increment: proceeds } },
      })

      // Create trade record
      const trade = await tx.trade.create({
        data: {
          marketId,
          outcomeId,
          userId,
          price,
          quantity,
          side: 'sell',
        },
      })

      // Create order record
      await tx.order.create({
        data: {
          userId,
          marketId,
          outcomeId,
          side: 'sell',
          type: 'market',
          quantity,
          filledQuantity: quantity,
          status: 'filled',
          filledAt: new Date(),
        },
      })

      // Record price history
      await tx.priceHistory.create({
        data: {
          marketId,
          outcomeId,
          price: newPrice,
          volume: proceeds,
        },
      })

      return {
        trade,
        executedPrice: price,
        totalProceeds: proceeds,
        realizedPnl,
        newPrice,
      }
    }
  })
}
