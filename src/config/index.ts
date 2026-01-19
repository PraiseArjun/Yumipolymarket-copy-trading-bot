/**
 * Configuration Management
 * Centralized configuration loading and validation
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Application configuration interface
 */
export interface AppConfig {
  // Target configuration
  targetAddress: string;
  
  // Trading configuration
  copyTrading: {
    enabled: boolean;
    privateKey: string;
    dryRun: boolean;
    positionSizeMultiplier: number;
    maxPositionSize: number;
    maxTradeSize: number;
    minTradeSize: number;
    slippageTolerance: number;
  };
  
  // Monitoring configuration
  monitoring: {
    pollInterval: number;
    enableWebSocket: boolean;
  };
  
  // API configuration
  api: {
    apiKey?: string;
    baseUrl: string;
    dataApiUrl: string;
    gammaApiUrl: string;
    clobApiUrl: string;
  };
  
  // Chain configuration
  chain: {
    chainId: number;
    clobHost: string;
  };
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  monitoring: {
    pollInterval: 30000, // 30 seconds
    enableWebSocket: false,
  },
  api: {
    baseUrl: 'https://clob.polymarket.com',
    dataApiUrl: 'https://data-api.polymarket.com',
    gammaApiUrl: 'https://gamma-api.polymarket.com',
    clobApiUrl: 'https://clob.polymarket.com',
  },
  chain: {
    chainId: 137, // Polygon mainnet
    clobHost: 'https://clob.polymarket.com',
  },
  copyTrading: {
    positionSizeMultiplier: 1.0,
    maxPositionSize: 10000,
    maxTradeSize: 5000,
    minTradeSize: 1,
    slippageTolerance: 1.0,
  },
} as const;

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): AppConfig {
  const targetAddress = process.env.TARGET_ADDRESS || '';
  
  if (!targetAddress) {
    throw new Error(
      'TARGET_ADDRESS environment variable is required.\n' +
      'Usage: TARGET_ADDRESS=0x... npm run dev'
    );
  }

  const copyTradingEnabled = process.env.COPY_TRADING_ENABLED === 'true';
  const privateKey = process.env.PRIVATE_KEY || '';

  if (copyTradingEnabled && !privateKey) {
    throw new Error(
      'PRIVATE_KEY environment variable is required when copy trading is enabled.\n' +
      '⚠️  WARNING: Never share your private key!'
    );
  }

  return {
    targetAddress,
    copyTrading: {
      enabled: copyTradingEnabled,
      privateKey,
      dryRun: process.env.DRY_RUN === 'true',
      positionSizeMultiplier: parseFloat(
        process.env.POSITION_SIZE_MULTIPLIER || 
        String(DEFAULT_CONFIG.copyTrading.positionSizeMultiplier)
      ),
      maxPositionSize: parseFloat(
        process.env.MAX_POSITION_SIZE || 
        String(DEFAULT_CONFIG.copyTrading.maxPositionSize)
      ),
      maxTradeSize: parseFloat(
        process.env.MAX_TRADE_SIZE || 
        String(DEFAULT_CONFIG.copyTrading.maxTradeSize)
      ),
      minTradeSize: parseFloat(
        process.env.MIN_TRADE_SIZE || 
        String(DEFAULT_CONFIG.copyTrading.minTradeSize)
      ),
      slippageTolerance: parseFloat(
        process.env.SLIPPAGE_TOLERANCE || 
        String(DEFAULT_CONFIG.copyTrading.slippageTolerance)
      ),
    },
    monitoring: {
      pollInterval: parseInt(
        process.env.POLL_INTERVAL || 
        String(DEFAULT_CONFIG.monitoring.pollInterval),
        10
      ),
      enableWebSocket: process.env.ENABLE_WEBSOCKET === 'true' || 
                       DEFAULT_CONFIG.monitoring.enableWebSocket,
    },
    api: {
      apiKey: process.env.POLYMARKET_API_KEY,
      baseUrl: process.env.POLYMARKET_BASE_URL || DEFAULT_CONFIG.api.baseUrl,
      dataApiUrl: process.env.POLYMARKET_DATA_API_URL || DEFAULT_CONFIG.api.dataApiUrl,
      gammaApiUrl: process.env.POLYMARKET_GAMMA_API_URL || DEFAULT_CONFIG.api.gammaApiUrl,
      clobApiUrl: process.env.POLYMARKET_CLOB_API_URL || DEFAULT_CONFIG.api.clobApiUrl,
    },
    chain: {
      chainId: parseInt(
        process.env.CHAIN_ID || 
        String(DEFAULT_CONFIG.chain.chainId),
        10
      ),
      clobHost: process.env.CLOB_HOST || DEFAULT_CONFIG.chain.clobHost,
    },
  };
}

/**
 * Validate private key format
 */
function isValidPrivateKey(privateKey: string): boolean {
  if (!privateKey || privateKey.trim().length === 0) {
    return false;
  }

  // Remove 0x prefix if present
  const key = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  
  // Private key should be 64 hex characters (32 bytes)
  if (key.length !== 64) {
    return false;
  }

  // Check if it's a valid hex string
  return /^[0-9a-fA-F]{64}$/.test(key);
}

/**
 * Validate configuration values
 */
export function validateConfig(config: AppConfig): void {
  if (!config.targetAddress || !config.targetAddress.startsWith('0x')) {
    throw new Error(
      'Invalid target address format. ' +
      'Target address must start with "0x" and be a valid Ethereum address.\n' +
      `Current value: ${config.targetAddress || '(empty)'}`
    );
  }

  if (config.copyTrading.enabled) {
    if (!config.copyTrading.privateKey || config.copyTrading.privateKey.trim().length === 0) {
      throw new Error(
        'Private key is required when copy trading is enabled.\n' +
        'Please set PRIVATE_KEY in your .env file.\n' +
        '⚠️  WARNING: Never share your private key!'
      );
    }

    if (!isValidPrivateKey(config.copyTrading.privateKey)) {
      throw new Error(
        'Invalid private key format.\n' +
        'Private key must be:\n' +
        '  - 64 hexadecimal characters (with or without "0x" prefix)\n' +
        '  - Example: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef\n' +
        `Current value: ${config.copyTrading.privateKey.substring(0, 20)}... (hidden for security)`
      );
    }

    if (config.copyTrading.positionSizeMultiplier <= 0) {
      throw new Error('Position size multiplier must be greater than 0');
    }

    if (config.copyTrading.minTradeSize <= 0) {
      throw new Error('Minimum trade size must be greater than 0');
    }

    if (config.copyTrading.maxTradeSize < config.copyTrading.minTradeSize) {
      throw new Error('Maximum trade size must be greater than or equal to minimum trade size');
    }
  }

  if (config.monitoring.pollInterval < 1000) {
    throw new Error('Poll interval must be at least 1000ms (1 second)');
  }
}

