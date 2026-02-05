# Polybet - Prediction Market Platform

A full-stack prediction market platform similar to Polymarket, built with Next.js, Prisma, and TypeScript.

![Polybet Screenshot](https://via.placeholder.com/800x400?text=Polybet+Prediction+Markets)

## Features

- **Market Discovery**: Browse and search prediction markets by category
- **Real-time Trading**: Buy and sell shares in market outcomes
- **Portfolio Tracking**: Track your positions, P&L, and trade history
- **User Authentication**: Email-based authentication with JWT tokens
- **Price Charts**: Interactive price history visualization
- **Responsive Design**: Modern UI that works on all devices

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT with HTTP-only cookies
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd bet
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Account

Use the demo account to explore the platform:
- **Email**: demo@example.com
- **Password**: password123

## Project Structure

```
bet/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seed data
├── src/
│   ├── app/
│   │   ├── api/         # API routes
│   │   │   ├── auth/
│   │   │   ├── markets/
│   │   │   ├── orders/
│   │   │   ├── portfolio/
│   │   │   └── categories/
│   │   ├── markets/     # Market pages
│   │   ├── portfolio/   # Portfolio page
│   │   └── page.tsx     # Homepage
│   ├── components/
│   │   ├── ui/          # Reusable UI components
│   │   └── markets/     # Market-specific components
│   └── lib/
│       ├── db.ts        # Prisma client
│       ├── auth.ts      # Authentication utilities
│       ├── trading.ts   # Trading engine
│       ├── store.ts     # Zustand stores
│       ├── types.ts     # TypeScript types
│       └── utils.ts     # Utility functions
├── PRD.md               # Product Requirements Document
└── README.md
```

## API Endpoints

### Markets
- `GET /api/markets` - List all markets with pagination and filters
- `GET /api/markets/:id` - Get market details

### Trading
- `POST /api/orders` - Place an order (buy/sell)

### Portfolio
- `GET /api/portfolio` - Get user's portfolio, positions, and trades

### Authentication
- `POST /api/auth` - Register, login, or logout
- `GET /api/auth` - Get current user

### Categories
- `GET /api/categories` - List all categories

## Trading Mechanics

- **Binary Markets**: Each market has Yes/No outcomes
- **Price Range**: Prices range from $0.01 to $0.99 (representing 1%-99% probability)
- **Market Orders**: Instant execution at current market price
- **Price Impact**: Trades affect the market price based on liquidity
- **Settlement**: Winning shares pay out $1.00 at resolution

## Development

### Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Seed the database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

### Environment Variables

Create a `.env` file with:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
```

## Future Enhancements

- [ ] Limit orders with order book
- [ ] WebSocket for real-time updates
- [ ] Multi-outcome markets
- [ ] Wallet integration (MetaMask, etc.)
- [ ] Mobile app (React Native)
- [ ] Leaderboards
- [ ] Comments and social features
- [ ] Market creation by users

## License

MIT
