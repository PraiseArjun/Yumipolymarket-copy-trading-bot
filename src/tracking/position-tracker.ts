import { MarketApiClient } from '../clients/market-api-client';
import {
  TradingStatus,
  MonitorOptions,
  Position,
} from '../types';

/**
 * Position Tracker
 * Monitors a target account's trading status and provides real-time updates
 */
export class PositionTracker {
  private client: MarketApiClient;
  private options: Required<MonitorOptions>;
  private pollIntervalId?: NodeJS.Timeout;
  private isMonitoring = false;
  private lastStatus?: TradingStatus;
  private lastPollTime?: number;
  private isPolling = false; // prevents overlapping polls

  constructor(client: MarketApiClient, options: MonitorOptions) {
    if (!options.targetAddress) {
      throw new Error('Target address is required');
    }

    this.client = client;
    this.options = {
      pollInterval: options.pollInterval ?? 30000,
      enableWebSocket: options.enableWebSocket ?? false,
      onUpdate: options.onUpdate ?? (() => {}),
      onError:
        options.onError ??
        ((error: Error) => console.error('Monitor error:', error)),
      targetAddress: options.targetAddress,
    };
  }

  /**
   * Start monitoring the target account
   */
  async start(): Promise<void> {
    if (this.isMonitoring) {
      console.warn('Monitor is already running');
      return;
    }

    this.isMonitoring = true;
    console.log(`Starting monitor for address: ${this.options.targetAddress}`);
    console.log(`Polling interval: ${this.options.pollInterval / 1000}s`);

    await this.updateStatus();

    this.pollIntervalId = setInterval(() => {
      if (!this.isPolling) {
        void this.updateStatus();
      }
    }, this.options.pollInterval);

    console.log(`✅ Monitor started`);

    if (this.options.enableWebSocket) {
      console.log('WebSocket monitoring not implemented yet, using polling');
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = undefined;
    }

    console.log('Monitor stopped');
  }

  /**
   * Get current trading status
   */
  async getStatus(): Promise<TradingStatus> {
    try {
      const result = await this.client.getUserPositions(
        this.options.targetAddress
      );

      return {
        user: this.options.targetAddress,
        totalPositions: result.positions.length,
        totalValue: result.totalValue,
        recentTrades: [],
        openPositions: result.positions,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.options.onError(err);
      throw err;
    }
  }

  /**
   * Update status and notify if there are changes
   */
  private async updateStatus(): Promise<void> {
    this.isPolling = true;

    try {
      const status = await this.getStatus();
      const hasChanges = this.detectChanges(status);

      const now = Date.now();
      if (!this.lastPollTime || now - this.lastPollTime > 10000) {
        console.log(
          `[${new Date().toLocaleTimeString()}] Polling... Found ${
            status.openPositions.length
          } positions`
        );
        this.lastPollTime = now;
      }

      if (hasChanges || !this.lastStatus) {
        this.lastStatus = status;
        this.options.onUpdate(status);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(
        `[${new Date().toLocaleTimeString()}] Update error:`,
        err.message
      );
      this.options.onError(err);
    } finally {
      this.isPolling = false;
    }
  }

  /**
   * Detect if there are significant changes in the status
   */
  private detectChanges(status: TradingStatus): boolean {
    if (!this.lastStatus) return true;

    if (status.openPositions.length !== this.lastStatus.openPositions.length) {
      return true;
    }

    const prevMap = new Map(
      this.lastStatus.openPositions.map(p => [p.id, p])
    );

    for (const current of status.openPositions) {
      const previous = prevMap.get(current.id);
      if (!previous) return true;

      const currQty = parseFloat(current.quantity);
      const prevQty = parseFloat(previous.quantity);

      if (Math.abs(currQty - prevQty) > Math.max(1, prevQty * 0.01)) {
        return true;
      }
    }

    const prevValue = parseFloat(this.lastStatus.totalValue);
    const currValue = parseFloat(status.totalValue);

    if (
      Math.abs(currValue - prevValue) /
        Math.max(prevValue, 0.01) >
      0.01
    ) {
      return true;
    }

    return false;
  }

  /**
   * Get formatted status string
   */
  getFormattedStatus(status: TradingStatus): string {
    const lines: string[] = [
      '',
      '╔══════════════════════════════════════════════════════════╗',
      '║     Polymarket Account Monitor - Open Positions          ║',
      '╚══════════════════════════════════════════════════════════╝',
      `👤 Account: ${status.user.slice(0, 10)}...${status.user.slice(-8)}`,
      `🕐 Last Updated: ${new Date(status.lastUpdated).toLocaleString()}`,
    ];

    if (!status.openPositions.length) {
      lines.push('\n💼 No active positions');
    } else {
      lines.push(
        `\n💼 Open Positions (${status.openPositions.length}):`
      );

      status.openPositions.slice(0, 10).forEach((p, i) => {
        lines.push(
          `   ${i + 1}. ${p.outcome}: ${parseFloat(
            p.quantity
          ).toLocaleString()} @ $${parseFloat(p.price).toFixed(4)}`
        );
      });
    }

    lines.push(
      '\n╚══════════════════════════════════════════════════════════╝\n'
    );

    return lines.join('\n');
  }

  /**
   * Check if monitor is running
   */
  isRunning(): boolean {
    return this.isMonitoring;
  }
}
