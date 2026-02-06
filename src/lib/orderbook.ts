import prisma from './db'

/**
 * Order Book Trading Engine
 * 
 * How it works:
 * - Users place limit orders (buy/sell at a specific price)
 * - Orders sit in the book until matched
 * - When a buy price >= sell price, orders match and trade executes
 * - Market orders execute against best available prices
 * 
 * Price mechanics for prediction markets:
 * - Prices range from $0.01 to $0.99 (1% to 99% probability)
 * - Buying "Yes" at 60¢ means you pay 60¢ to win $1 if Yes happens
 * - Selling "Yes" at 60¢ means you receive 60¢ and owe $1 if Yes happens
 */

export interface OrderBookEntry {
  price: number
  quantity: number
  orders: number
}

export interface OrderBook {
  bids: OrderBookEntry[]  // Buy orders (sorted high to low)
  asks: OrderBookEntry[]  // Sell orders (sorted low to high)
  spread: number | null
  lastPrice: number | null
}

// Get the order book for a specific outcome
export async function getOrderBook(outcomeId: string): Promise<OrderBook> {
  const [bidOrders, askOrders, lastTrade] = await Promise.all([
    // Get buy orders (bids)
    prisma.order.findMany({
      where: {
        outcomeId,
        side: 'buy',
        status: { in: ['open', 'partial'] },
        price: { not: null },
      },
      orderBy: { price: 'desc' },
      select: { price: true, quantity: true, filledQuantity: true },
    }),
    // Get sell orders (asks)
    prisma.order.findMany({
      where: {
        outcomeId,
        side: 'sell',
        status: { in: ['open', 'partial'] },
        price: { not: null },
      },
      orderBy: { price: 'asc' },
      select: { price: true, quantity: true, filledQuantity: true },
    }),
    // Get last trade price
    prisma.trade.findFirst({
      where: { outcomeId },
      orderBy: { executedAt: 'desc' },
      select: { price: true },
    }),
  ])

  // Aggregate bids by price level
  const bidMap = new Map<number, { quantity: number; orders: number }>()
  for (const order of bidOrders) {
    const remaining = order.quantity - order.filledQuantity
    if (remaining > 0) {
      const existing = bidMap.get(order.price!) || { quantity: 0, orders: 0 }
      bidMap.set(order.price!, {
        quantity: existing.quantity + remaining,
        orders: existing.orders + 1,
      })
    }
  }

  // Aggregate asks by price level
  const askMap = new Map<number, { quantity: number; orders: number }>()
  for (const order of askOrders) {
    const remaining = order.quantity - order.filledQuantity
    if (remaining > 0) {
      const existing = askMap.get(order.price!) || { quantity: 0, orders: 0 }
      askMap.set(order.price!, {
        quantity: existing.quantity + remaining,
        orders: existing.orders + 1,
      })
    }
  }

  const formattedBids = Array.from(bidMap.entries())
    .map(([price, data]) => ({ price, ...data }))
    .sort((a, b) => b.price - a.price)
    .slice(0, 10)

  const formattedAsks = Array.from(askMap.entries())
    .map(([price, data]) => ({ price, ...data }))
    .sort((a, b) => a.price - b.price)
    .slice(0, 10)

  const bestBid = formattedBids[0]?.price
  const bestAsk = formattedAsks[0]?.price
  const spread = bestBid && bestAsk ? bestAsk - bestBid : null

  return {
    bids: formattedBids,
    asks: formattedAsks,
    spread,
    lastPrice: lastTrade?.price || null,
  }
}

// Place a limit order
export async function placeLimitOrder(
  userId: string,
  marketId: string,
  outcomeId: string,
  side: 'buy' | 'sell',
  price: number,
  quantity: number
) {
  // Validate price
  if (price < 0.01 || price > 0.99) {
    throw new Error('Price must be between $0.01 and $0.99')
  }

  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')

    const market = await tx.market.findUnique({ where: { id: marketId } })
    if (!market) throw new Error('Market not found')
    if (market.status !== 'active') throw new Error('Market is not active')

    if (side === 'buy') {
      // For buys, check user has enough balance
      const cost = price * quantity
      if (user.balance < cost) {
        throw new Error('Insufficient balance')
      }

      // Reserve the funds
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: cost } },
      })
    } else {
      // For sells, check user has enough shares
      const position = await tx.position.findUnique({
        where: { userId_outcomeId: { userId, outcomeId } },
      })
      if (!position || position.shares < quantity) {
        throw new Error('Insufficient shares to sell')
      }

      // Reserve the shares
      await tx.position.update({
        where: { id: position.id },
        data: { shares: { decrement: quantity } },
      })
    }

    // Create the order
    const order = await tx.order.create({
      data: {
        userId,
        marketId,
        outcomeId,
        side,
        type: 'limit',
        price,
        quantity,
        filledQuantity: 0,
        status: 'open',
      },
    })

    return order
  })
}

// Match orders and execute trades
export async function matchOrders(outcomeId: string) {
  return await prisma.$transaction(async (tx) => {
    const trades = []

    // Get the outcome and market info
    const outcome = await tx.outcome.findUnique({
      where: { id: outcomeId },
      include: { market: true },
    })
    if (!outcome) return trades

    // Keep matching until no more matches possible
    while (true) {
      // Get best bid (highest buy price)
      const bestBid = await tx.order.findFirst({
        where: {
          outcomeId,
          side: 'buy',
          status: 'open',
          price: { not: null },
        },
        orderBy: [{ price: 'desc' }, { createdAt: 'asc' }],
      })

      // Get best ask (lowest sell price)
      const bestAsk = await tx.order.findFirst({
        where: {
          outcomeId,
          side: 'sell',
          status: 'open',
          price: { not: null },
        },
        orderBy: [{ price: 'asc' }, { createdAt: 'asc' }],
      })

      // No match possible if no orders or prices don't cross
      if (!bestBid || !bestAsk || bestBid.price! < bestAsk.price!) {
        break
      }

      // Calculate match quantity and price
      const bidRemaining = bestBid.quantity - bestBid.filledQuantity
      const askRemaining = bestAsk.quantity - bestAsk.filledQuantity
      const matchQuantity = Math.min(bidRemaining, askRemaining)
      const matchPrice = bestAsk.price! // Price at the resting order (ask)

      // Execute the trade
      const trade = await tx.trade.create({
        data: {
          marketId: outcome.marketId,
          outcomeId,
          buyerOrderId: bestBid.id,
          sellerOrderId: bestAsk.id,
          userId: bestBid.userId, // Record buyer as primary
          price: matchPrice,
          quantity: matchQuantity,
          side: 'buy',
        },
      })
      trades.push(trade)

      // Update buyer's order
      const newBidFilled = bestBid.filledQuantity + matchQuantity
      await tx.order.update({
        where: { id: bestBid.id },
        data: {
          filledQuantity: newBidFilled,
          status: newBidFilled >= bestBid.quantity ? 'filled' : 'partial',
          filledAt: newBidFilled >= bestBid.quantity ? new Date() : null,
        },
      })

      // Update seller's order
      const newAskFilled = bestAsk.filledQuantity + matchQuantity
      await tx.order.update({
        where: { id: bestAsk.id },
        data: {
          filledQuantity: newAskFilled,
          status: newAskFilled >= bestAsk.quantity ? 'filled' : 'partial',
          filledAt: newAskFilled >= bestAsk.quantity ? new Date() : null,
        },
      })

      // Transfer shares to buyer
      const buyerPosition = await tx.position.findUnique({
        where: { userId_outcomeId: { userId: bestBid.userId, outcomeId } },
      })

      if (buyerPosition) {
        const totalShares = buyerPosition.shares + matchQuantity
        const totalCost = buyerPosition.avgEntryPrice * buyerPosition.shares + matchPrice * matchQuantity
        await tx.position.update({
          where: { id: buyerPosition.id },
          data: {
            shares: totalShares,
            avgEntryPrice: totalCost / totalShares,
          },
        })
      } else {
        await tx.position.create({
          data: {
            userId: bestBid.userId,
            marketId: outcome.marketId,
            outcomeId,
            shares: matchQuantity,
            avgEntryPrice: matchPrice,
          },
        })
      }

      // Give proceeds to seller
      const proceeds = matchPrice * matchQuantity
      await tx.user.update({
        where: { id: bestAsk.userId },
        data: { balance: { increment: proceeds } },
      })

      // Update market volume
      await tx.market.update({
        where: { id: outcome.marketId },
        data: { volume: { increment: proceeds } },
      })

      // Update outcome price to last trade price
      await tx.outcome.update({
        where: { id: outcomeId },
        data: { currentPrice: matchPrice },
      })

      // Update the other outcome price
      const otherOutcome = await tx.outcome.findFirst({
        where: { marketId: outcome.marketId, id: { not: outcomeId } },
      })
      if (otherOutcome) {
        await tx.outcome.update({
          where: { id: otherOutcome.id },
          data: { currentPrice: 1 - matchPrice },
        })
      }

      // Record price history
      await tx.priceHistory.create({
        data: {
          marketId: outcome.marketId,
          outcomeId,
          price: matchPrice,
          volume: proceeds,
        },
      })
    }

    return trades
  })
}

// Place a market order (executes against best available prices)
export async function placeMarketOrder(
  userId: string,
  marketId: string,
  outcomeId: string,
  side: 'buy' | 'sell',
  quantity: number
) {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')

    const market = await tx.market.findUnique({ 
      where: { id: marketId },
      include: { outcomes: true },
    })
    if (!market) throw new Error('Market not found')
    if (market.status !== 'active') throw new Error('Market is not active')

    const outcome = market.outcomes.find(o => o.id === outcomeId)
    if (!outcome) throw new Error('Outcome not found')

    let remainingQuantity = quantity
    let totalCost = 0
    let totalProceeds = 0
    const trades = []

    if (side === 'buy') {
      // Get available sell orders (asks) sorted by price (lowest first)
      const asks = await tx.order.findMany({
        where: {
          outcomeId,
          side: 'sell',
          status: { in: ['open', 'partial'] },
          price: { not: null },
        },
        orderBy: [{ price: 'asc' }, { createdAt: 'asc' }],
      })

      if (asks.length === 0) {
        throw new Error('No sellers available. Place a limit order instead.')
      }

      for (const ask of asks) {
        if (remainingQuantity <= 0) break

        const askRemaining = ask.quantity - ask.filledQuantity
        const fillQuantity = Math.min(remainingQuantity, askRemaining)
        const fillCost = fillQuantity * ask.price!

        // Check buyer has enough balance
        if (user.balance - totalCost < fillCost) {
          throw new Error('Insufficient balance')
        }

        totalCost += fillCost
        remainingQuantity -= fillQuantity

        // Create trade
        const trade = await tx.trade.create({
          data: {
            marketId,
            outcomeId,
            buyerOrderId: null,
            sellerOrderId: ask.id,
            userId,
            price: ask.price!,
            quantity: fillQuantity,
            side: 'buy',
          },
        })
        trades.push(trade)

        // Update seller's order
        const newAskFilled = ask.filledQuantity + fillQuantity
        await tx.order.update({
          where: { id: ask.id },
          data: {
            filledQuantity: newAskFilled,
            status: newAskFilled >= ask.quantity ? 'filled' : 'partial',
            filledAt: newAskFilled >= ask.quantity ? new Date() : null,
          },
        })

        // Give proceeds to seller
        await tx.user.update({
          where: { id: ask.userId },
          data: { balance: { increment: fillCost } },
        })
      }

      if (trades.length === 0) {
        throw new Error('No matching orders found')
      }

      // Deduct cost from buyer
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: totalCost } },
      })

      // Update or create buyer's position
      const filledQuantity = quantity - remainingQuantity
      const avgPrice = totalCost / filledQuantity

      const position = await tx.position.findUnique({
        where: { userId_outcomeId: { userId, outcomeId } },
      })

      if (position) {
        const totalShares = position.shares + filledQuantity
        const totalPositionCost = position.avgEntryPrice * position.shares + totalCost
        await tx.position.update({
          where: { id: position.id },
          data: {
            shares: totalShares,
            avgEntryPrice: totalPositionCost / totalShares,
          },
        })
      } else {
        await tx.position.create({
          data: {
            userId,
            marketId,
            outcomeId,
            shares: filledQuantity,
            avgEntryPrice: avgPrice,
          },
        })
      }

      // Update market volume and price
      await tx.market.update({
        where: { id: marketId },
        data: { volume: { increment: totalCost } },
      })

      const lastTradePrice = trades[trades.length - 1].price
      await tx.outcome.update({
        where: { id: outcomeId },
        data: { currentPrice: lastTradePrice },
      })

      // Update other outcome price
      const otherOutcome = market.outcomes.find(o => o.id !== outcomeId)
      if (otherOutcome) {
        await tx.outcome.update({
          where: { id: otherOutcome.id },
          data: { currentPrice: 1 - lastTradePrice },
        })
      }

      // Record price history
      await tx.priceHistory.create({
        data: {
          marketId,
          outcomeId,
          price: lastTradePrice,
          volume: totalCost,
        },
      })

      return {
        trades,
        filledQuantity: quantity - remainingQuantity,
        totalCost,
        avgPrice,
        remainingQuantity,
      }
    } else {
      // SELL market order
      // Check user has shares
      const position = await tx.position.findUnique({
        where: { userId_outcomeId: { userId, outcomeId } },
      })
      if (!position || position.shares < quantity) {
        throw new Error('Insufficient shares to sell')
      }

      // Get available buy orders (bids) sorted by price (highest first)
      const bids = await tx.order.findMany({
        where: {
          outcomeId,
          side: 'buy',
          status: { in: ['open', 'partial'] },
          price: { not: null },
        },
        orderBy: [{ price: 'desc' }, { createdAt: 'asc' }],
      })

      if (bids.length === 0) {
        throw new Error('No buyers available. Place a limit order instead.')
      }

      for (const bid of bids) {
        if (remainingQuantity <= 0) break

        const bidRemaining = bid.quantity - bid.filledQuantity
        const fillQuantity = Math.min(remainingQuantity, bidRemaining)
        const fillProceeds = fillQuantity * bid.price!

        totalProceeds += fillProceeds
        remainingQuantity -= fillQuantity

        // Create trade
        const trade = await tx.trade.create({
          data: {
            marketId,
            outcomeId,
            buyerOrderId: bid.id,
            sellerOrderId: null,
            userId,
            price: bid.price!,
            quantity: fillQuantity,
            side: 'sell',
          },
        })
        trades.push(trade)

        // Update buyer's order
        const newBidFilled = bid.filledQuantity + fillQuantity
        await tx.order.update({
          where: { id: bid.id },
          data: {
            filledQuantity: newBidFilled,
            status: newBidFilled >= bid.quantity ? 'filled' : 'partial',
            filledAt: newBidFilled >= bid.quantity ? new Date() : null,
          },
        })

        // Transfer shares to buyer
        const buyerPosition = await tx.position.findUnique({
          where: { userId_outcomeId: { userId: bid.userId, outcomeId } },
        })

        if (buyerPosition) {
          const totalShares = buyerPosition.shares + fillQuantity
          const totalPositionCost = buyerPosition.avgEntryPrice * buyerPosition.shares + fillProceeds
          await tx.position.update({
            where: { id: buyerPosition.id },
            data: {
              shares: totalShares,
              avgEntryPrice: totalPositionCost / totalShares,
            },
          })
        } else {
          await tx.position.create({
            data: {
              userId: bid.userId,
              marketId,
              outcomeId,
              shares: fillQuantity,
              avgEntryPrice: bid.price!,
            },
          })
        }

        // Deduct reserved funds from buyer
        // (funds were reserved when they placed the limit order, already deducted)
      }

      if (trades.length === 0) {
        throw new Error('No matching orders found')
      }

      // Give proceeds to seller
      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: totalProceeds } },
      })

      // Update seller's position
      const filledQuantity = quantity - remainingQuantity
      const newShares = position.shares - filledQuantity
      
      if (newShares <= 0) {
        await tx.position.delete({ where: { id: position.id } })
      } else {
        await tx.position.update({
          where: { id: position.id },
          data: { shares: newShares },
        })
      }

      // Update market volume and price
      await tx.market.update({
        where: { id: marketId },
        data: { volume: { increment: totalProceeds } },
      })

      const lastTradePrice = trades[trades.length - 1].price
      await tx.outcome.update({
        where: { id: outcomeId },
        data: { currentPrice: lastTradePrice },
      })

      // Update other outcome price
      const otherOutcome = market.outcomes.find(o => o.id !== outcomeId)
      if (otherOutcome) {
        await tx.outcome.update({
          where: { id: otherOutcome.id },
          data: { currentPrice: 1 - lastTradePrice },
        })
      }

      // Record price history
      await tx.priceHistory.create({
        data: {
          marketId,
          outcomeId,
          price: lastTradePrice,
          volume: totalProceeds,
        },
      })

      return {
        trades,
        filledQuantity,
        totalProceeds,
        avgPrice: totalProceeds / filledQuantity,
        remainingQuantity,
      }
    }
  })
}

// Cancel an order
export async function cancelOrder(userId: string, orderId: string) {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } })
    
    if (!order) throw new Error('Order not found')
    if (order.userId !== userId) throw new Error('Not your order')
    if (order.status !== 'open' && order.status !== 'partial') {
      throw new Error('Order cannot be cancelled')
    }

    const remainingQuantity = order.quantity - order.filledQuantity

    if (order.side === 'buy') {
      // Refund reserved funds
      const refund = remainingQuantity * order.price!
      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: refund } },
      })
    } else {
      // Return reserved shares
      const position = await tx.position.findUnique({
        where: { userId_outcomeId: { userId, outcomeId: order.outcomeId } },
      })
      
      if (position) {
        await tx.position.update({
          where: { id: position.id },
          data: { shares: { increment: remainingQuantity } },
        })
      } else {
        await tx.position.create({
          data: {
            userId,
            marketId: order.marketId,
            outcomeId: order.outcomeId,
            shares: remainingQuantity,
            avgEntryPrice: order.price!,
          },
        })
      }
    }

    // Mark order as cancelled
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'cancelled' },
    })

    return { success: true }
  })
}
