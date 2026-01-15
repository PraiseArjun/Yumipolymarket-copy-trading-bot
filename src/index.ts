/**
 * Polymarket Copy Trading Bot
 * Public API exports
 */

// Export public API
export { PositionTracker } from './tracking/position-tracker';
export { MarketApiClient } from './clients/market-api-client';
export { OrderExecutor } from './execution/order-executor';
export { StrategyExecutor } from './execution/strategy-executor';
export { Application } from './core/application';

// Backward compatibility exports (old names)
export { PositionTracker as AccountMonitor } from './tracking/position-tracker';
export { MarketApiClient as PolymarketClient } from './clients/market-api-client';
export { OrderExecutor as TradeExecutor } from './execution/order-executor';
export { StrategyExecutor as CopyTradingMonitor } from './execution/strategy-executor';
export * from './types';
export * from './config';
export * from './utils/logger';
export * from './utils/errors';
