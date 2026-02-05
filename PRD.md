# Product Requirements Document: Prediction Market Platform

## 1. Executive Summary

### 1.1 Product Vision
Build a modern prediction market platform that enables users to trade on the outcomes of real-world events. Users buy and sell shares representing different outcomes, with prices reflecting the collective probability assessment of the crowd.

### 1.2 Target Users
- **Traders**: Individuals seeking to profit from their knowledge and predictions
- **Information Seekers**: Users wanting accurate probability estimates for events
- **Researchers**: Analysts studying prediction markets and collective intelligence
- **News Consumers**: People interested in tracking event probabilities alongside news

### 1.3 Key Value Propositions
- Real-time probability discovery through market mechanisms
- Liquid markets for trading event outcomes
- Transparent, verifiable market resolution
- Portfolio tracking and performance analytics

---

## 2. Core Features

### 2.1 Market Discovery & Browsing

#### 2.1.1 Homepage
- Featured/trending markets carousel
- Markets organized by category (Politics, Sports, Crypto, Science, Entertainment, etc.)
- Real-time price movement indicators
- Volume and liquidity metrics
- Search functionality with autocomplete
- Filter options (ending soon, most active, newest, highest volume)

#### 2.1.2 Market Cards
Each market card displays:
- Event title/question
- Current probability (e.g., "65% Yes")
- Price change (24h)
- Trading volume
- Time until resolution
- Category tags
- Thumbnail image

#### 2.1.3 Categories
- Politics (Elections, Policy, Geopolitics)
- Sports (Games, Championships, Player Stats)
- Crypto (Price targets, Protocol events)
- Science & Tech (Discoveries, Product launches)
- Entertainment (Awards, Box office)
- Economics (Fed rates, GDP, Inflation)
- Custom/Community

### 2.2 Market Detail Page

#### 2.2.1 Market Information
- Full event description and resolution criteria
- Resolution source (official data provider)
- Resolution date/deadline
- Market creator information
- Rules and edge cases

#### 2.2.2 Price Chart
- Interactive candlestick/line chart
- Timeframe options (1H, 6H, 24H, 7D, 30D, All)
- Volume overlay
- Key event annotations on chart

#### 2.2.3 Trading Interface
- Buy/Sell toggle
- Outcome selection (Yes/No or multiple outcomes)
- Order types:
  - Market order (instant execution)
  - Limit order (specify price)
- Amount input (shares or dollar amount)
- Estimated cost/proceeds calculator
- Potential profit/loss display
- Current position summary
- Order confirmation modal

#### 2.2.4 Order Book (Advanced)
- Bid/Ask spread visualization
- Depth chart
- Recent trades list
- Order book ladder view

#### 2.2.5 Social Features
- Comments/discussion thread
- Related news articles
- Share to social media
- Market activity feed

### 2.3 User Portfolio

#### 2.3.1 Dashboard
- Total portfolio value
- Profit/Loss (realized and unrealized)
- Performance chart over time
- Win rate statistics

#### 2.3.2 Positions
- Active positions table with:
  - Market name
  - Position (Yes/No)
  - Shares owned
  - Average entry price
  - Current price
  - P&L ($ and %)
  - Quick sell button
- Position history

#### 2.3.3 Orders
- Open orders with cancel option
- Order history with status
- Fill details

#### 2.3.4 Transaction History
- All deposits, withdrawals, trades
- Exportable (CSV)

### 2.4 User Account

#### 2.4.1 Authentication
- Email/password registration
- Wallet connection (MetaMask, WalletConnect, Coinbase Wallet)
- Social login (Google, Twitter/X)
- Two-factor authentication (2FA)
- Session management

#### 2.4.2 Wallet & Funds
- Deposit funds (crypto: USDC, ETH; fiat via on-ramp)
- Withdraw funds
- Balance display
- Transaction history
- Gas fee estimates

#### 2.4.3 Profile
- Username and avatar
- Bio/description
- Trading statistics (public)
- Badges and achievements
- Privacy settings

### 2.5 Leaderboard

#### 2.5.1 Rankings
- Top traders by profit (daily, weekly, monthly, all-time)
- Top by ROI percentage
- Top by volume traded
- Top by accuracy (% of winning trades)
- Category-specific leaderboards

#### 2.5.2 User Profiles (Public)
- Trading history (optional)
- Performance metrics
- Favorite categories
- Follow functionality

### 2.6 Notifications

#### 2.6.1 Types
- Price alerts (market hits target price)
- Position alerts (significant P&L change)
- Market resolution notifications
- Order fill confirmations
- New markets in followed categories
- Followed user activity

#### 2.6.2 Channels
- In-app notifications
- Email notifications
- Push notifications (mobile/desktop)
- Telegram/Discord bot integration

---

## 3. Technical Architecture

### 3.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Web App    │  │  Mobile App  │  │   API Users  │          │
│  │   (Next.js)  │  │(React Native)│  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Load Balancer / Rate Limiting / Authentication          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend Services                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
│  │  Auth      │  │  Markets   │  │  Trading   │  │ Portfolio│ │
│  │  Service   │  │  Service   │  │  Engine    │  │ Service  │ │
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘ │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
│  │ Resolution │  │  Pricing   │  │Notification│  │ Analytics│ │
│  │  Service   │  │  Service   │  │  Service   │  │ Service  │ │
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
│  │ PostgreSQL │  │   Redis    │  │ TimescaleDB│  │  S3/CDN  │ │
│  │ (Primary)  │  │  (Cache)   │  │(Time Series)│ │ (Assets) │ │
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Blockchain Layer                             │
│  ┌────────────────────────────────────────────────────────────┐│
│  │  Smart Contracts (Polygon/Base) - Settlement & Escrow      ││
│  └────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Frontend

#### 3.2.1 Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand or Redux Toolkit
- **Data Fetching**: TanStack Query (React Query)
- **Real-time**: WebSocket (Socket.io or native)
- **Charts**: TradingView Lightweight Charts or Recharts
- **Wallet Integration**: wagmi + viem + RainbowKit
- **Forms**: React Hook Form + Zod validation

#### 3.2.2 Key Pages
```
/                       # Homepage with featured markets
/markets                # All markets with filters
/markets/[category]     # Category-specific listing
/market/[slug]          # Market detail and trading
/portfolio              # User portfolio dashboard
/portfolio/positions    # Active positions
/portfolio/history      # Trade history
/leaderboard            # Rankings
/profile/[username]     # Public user profile
/settings               # Account settings
/deposit                # Deposit funds
/withdraw               # Withdraw funds
```

### 3.3 Backend

#### 3.3.1 Technology Stack
- **Runtime**: Node.js (Bun or Node 20+)
- **Framework**: Fastify or Express
- **Language**: TypeScript
- **ORM**: Prisma or Drizzle
- **Database**: PostgreSQL 15+
- **Cache**: Redis
- **Time-series**: TimescaleDB (for price/volume data)
- **Message Queue**: BullMQ or RabbitMQ
- **WebSocket**: Socket.io or uWebSockets

#### 3.3.2 API Design
RESTful API with OpenAPI specification:

```
Authentication:
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
POST   /api/auth/wallet/nonce
POST   /api/auth/wallet/verify

Markets:
GET    /api/markets                 # List markets (paginated, filterable)
GET    /api/markets/:id             # Get market details
GET    /api/markets/:id/prices      # Get price history
GET    /api/markets/:id/orderbook   # Get order book
GET    /api/markets/:id/trades      # Get recent trades
GET    /api/markets/categories      # List categories
GET    /api/markets/trending        # Trending markets
GET    /api/markets/search          # Search markets

Trading:
POST   /api/orders                  # Place order
DELETE /api/orders/:id              # Cancel order
GET    /api/orders                  # List user orders
GET    /api/orders/:id              # Get order details

Portfolio:
GET    /api/portfolio               # Portfolio summary
GET    /api/portfolio/positions     # Active positions
GET    /api/portfolio/history       # Trade history
GET    /api/portfolio/performance   # Performance metrics

User:
GET    /api/users/:username         # Public profile
PUT    /api/users/me                # Update profile
GET    /api/users/me/notifications  # Get notifications
PUT    /api/users/me/settings       # Update settings

Wallet:
GET    /api/wallet/balance          # Get balance
POST   /api/wallet/deposit          # Initiate deposit
POST   /api/wallet/withdraw         # Initiate withdrawal
GET    /api/wallet/transactions     # Transaction history

Leaderboard:
GET    /api/leaderboard             # Get rankings
```

#### 3.3.3 WebSocket Events
```
Client -> Server:
- subscribe:market (marketId)
- unsubscribe:market (marketId)
- subscribe:portfolio

Server -> Client:
- price:update (marketId, price, volume)
- orderbook:update (marketId, bids, asks)
- trade:executed (tradeDetails)
- position:update (positionDetails)
- market:resolved (marketId, outcome)
- notification (notification)
```

### 3.4 Trading Engine

#### 3.4.1 Order Matching
- **Order Book Model**: Central Limit Order Book (CLOB)
- **Matching Algorithm**: Price-time priority
- **Order Types**:
  - Market orders: Immediate execution at best available price
  - Limit orders: Execute only at specified price or better
  - (Future) Stop orders, IOC, FOK

#### 3.4.2 Market Mechanics
- Binary markets: Yes/No shares, prices always sum to $1.00
- Multi-outcome markets: Multiple shares, prices sum to $1.00
- Share pricing: $0.01 - $0.99 (representing 1% - 99% probability)
- Minimum trade size: $1.00
- Maximum position size: Configurable per market

#### 3.4.3 Liquidity
- Initial liquidity provided by AMM (Automated Market Maker)
- AMM uses LMSR (Logarithmic Market Scoring Rule) or CPMM
- Liquidity subsidies for new markets
- (Future) Liquidity provider rewards

### 3.5 Smart Contracts

#### 3.5.1 Contract Architecture
```
├── MarketFactory.sol       # Creates new markets
├── Market.sol              # Individual market logic
├── OrderBook.sol           # On-chain order matching (optional)
├── Settlement.sol          # Handles payouts on resolution
├── Treasury.sol            # Holds funds, manages fees
├── Oracle.sol              # Resolution data feed
└── Governance.sol          # Protocol governance (future)
```

#### 3.5.2 Key Functions
```solidity
// MarketFactory
function createMarket(
    string memory question,
    string[] memory outcomes,
    uint256 resolutionTime,
    address oracle
) external returns (address);

// Market
function buy(uint256 outcomeIndex, uint256 amount) external;
function sell(uint256 outcomeIndex, uint256 shares) external;
function claimWinnings() external;

// Settlement
function resolve(uint256 marketId, uint256 winningOutcome) external;
function disputeResolution(uint256 marketId) external;
```

### 3.6 Database Schema

#### 3.6.1 Core Tables
```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255),
    wallet_address VARCHAR(42) UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Markets
CREATE TABLE markets (
    id UUID PRIMARY KEY,
    slug VARCHAR(255) UNIQUE,
    question TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id),
    resolution_source TEXT,
    resolution_criteria TEXT,
    resolution_time TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active', -- active, paused, resolved, cancelled
    winning_outcome_id UUID,
    image_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Outcomes
CREATE TABLE outcomes (
    id UUID PRIMARY KEY,
    market_id UUID REFERENCES markets(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    current_price DECIMAL(10, 4),
    total_shares DECIMAL(20, 8),
    sort_order INT
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    market_id UUID REFERENCES markets(id),
    outcome_id UUID REFERENCES outcomes(id),
    side VARCHAR(4) NOT NULL, -- 'buy' or 'sell'
    type VARCHAR(10) NOT NULL, -- 'market' or 'limit'
    price DECIMAL(10, 4),
    quantity DECIMAL(20, 8),
    filled_quantity DECIMAL(20, 8) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'open', -- open, filled, partial, cancelled
    created_at TIMESTAMPTZ DEFAULT NOW(),
    filled_at TIMESTAMPTZ
);

-- Trades
CREATE TABLE trades (
    id UUID PRIMARY KEY,
    market_id UUID REFERENCES markets(id),
    outcome_id UUID REFERENCES outcomes(id),
    buyer_order_id UUID REFERENCES orders(id),
    seller_order_id UUID REFERENCES orders(id),
    price DECIMAL(10, 4),
    quantity DECIMAL(20, 8),
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Positions
CREATE TABLE positions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    market_id UUID REFERENCES markets(id),
    outcome_id UUID REFERENCES outcomes(id),
    shares DECIMAL(20, 8),
    avg_entry_price DECIMAL(10, 4),
    realized_pnl DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, outcome_id)
);

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    slug VARCHAR(100) UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    sort_order INT
);

-- Price History (TimescaleDB hypertable)
CREATE TABLE price_history (
    time TIMESTAMPTZ NOT NULL,
    market_id UUID NOT NULL,
    outcome_id UUID NOT NULL,
    price DECIMAL(10, 4),
    volume DECIMAL(20, 8)
);
SELECT create_hypertable('price_history', 'time');
```

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Page load time: < 2 seconds (LCP)
- API response time: < 100ms (p95)
- Order execution: < 50ms
- WebSocket latency: < 20ms
- Support 10,000+ concurrent users
- Support 1,000+ orders per second

### 4.2 Scalability
- Horizontal scaling for API servers
- Database read replicas
- Redis cluster for caching
- CDN for static assets
- Microservices architecture for independent scaling

### 4.3 Security
- HTTPS everywhere
- JWT with refresh token rotation
- Rate limiting (per IP and per user)
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- XSS protection (CSP headers)
- CORS configuration
- Wallet signature verification
- Audit logging for all transactions
- Regular security audits

### 4.4 Reliability
- 99.9% uptime SLA
- Automated backups (hourly database snapshots)
- Disaster recovery plan
- Health checks and monitoring
- Graceful degradation
- Circuit breakers for external services

### 4.5 Compliance
- Terms of Service
- Privacy Policy (GDPR compliant)
- Age verification (18+)
- Geo-restrictions (blocked jurisdictions)
- KYC/AML for large withdrawals
- Responsible gambling features (limits, self-exclusion)

---

## 5. Development Phases

### Phase 1: MVP (Foundation)
- [ ] User authentication (email + wallet)
- [ ] Basic market listing and detail pages
- [ ] Simple market order trading
- [ ] Portfolio view with positions
- [ ] Basic deposit/withdraw (crypto only)
- [ ] Core database and API

### Phase 2: Trading Enhancement
- [ ] Limit orders
- [ ] Order book visualization
- [ ] Real-time WebSocket updates
- [ ] Advanced charting
- [ ] Price alerts
- [ ] Trade history export

### Phase 3: Social & Discovery
- [ ] Leaderboards
- [ ] User profiles
- [ ] Comments and discussions
- [ ] Market search improvements
- [ ] Category management
- [ ] Notifications system

### Phase 4: Advanced Features
- [ ] Mobile app (React Native)
- [ ] Multi-outcome markets
- [ ] Market creation (user-generated)
- [ ] API for developers
- [ ] Fiat on-ramp integration
- [ ] Advanced analytics

### Phase 5: Scale & Polish
- [ ] Performance optimization
- [ ] A/B testing infrastructure
- [ ] Internationalization (i18n)
- [ ] Advanced security features
- [ ] Admin dashboard
- [ ] Compliance tools

---

## 6. Success Metrics

### 6.1 User Metrics
- Daily/Monthly Active Users (DAU/MAU)
- User registration rate
- User retention (D1, D7, D30)
- Session duration
- Pages per session

### 6.2 Trading Metrics
- Daily trading volume
- Number of trades per day
- Average trade size
- Order fill rate
- Time to order execution

### 6.3 Market Metrics
- Number of active markets
- Market liquidity (depth)
- Bid-ask spread
- Price accuracy (vs actual outcomes)

### 6.4 Business Metrics
- Total Value Locked (TVL)
- Revenue (trading fees)
- Customer acquisition cost (CAC)
- Lifetime value (LTV)

---

## 7. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Regulatory action | High | Medium | Legal review, geo-blocking, compliance features |
| Smart contract bug | Critical | Low | Audits, bug bounty, gradual rollout |
| Low liquidity | High | Medium | AMM, liquidity incentives, market maker partnerships |
| Security breach | Critical | Low | Security audits, penetration testing, insurance |
| Scalability issues | Medium | Medium | Load testing, auto-scaling, performance monitoring |
| Oracle manipulation | High | Low | Multiple data sources, dispute mechanism |

---

## 8. Appendix

### 8.1 Glossary
- **Share**: A tradeable unit representing an outcome
- **CLOB**: Central Limit Order Book
- **AMM**: Automated Market Maker
- **LMSR**: Logarithmic Market Scoring Rule
- **Resolution**: The process of determining the winning outcome
- **Oracle**: A trusted data source for resolution

### 8.2 References
- [Polymarket](https://polymarket.com)
- [Augur](https://augur.net)
- [Kalshi](https://kalshi.com)
- [Manifold Markets](https://manifold.markets)

### 8.3 Document History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-05 | - | Initial PRD |
