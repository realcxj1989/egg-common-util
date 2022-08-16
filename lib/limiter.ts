import { Logger } from 'egg-logger';

export class Limiter {
  private readonly logger: Logger;
  private readonly threshold: number;
  private readonly logPrefix: string;
  private lastTime: number = 0;
  private discarded: number = 0;

  constructor(logger: Logger, logPrefix: string, threshold: number) {
    this.logger = logger;
    this.threshold = threshold;
    this.logPrefix = logPrefix;
  }

  runSync(fn: () => void) {
    if (!this.shouldRun()) return;
    fn();
  }

  async run(fn: () => Promise<void>) {
    if (!this.shouldRun()) return;
    await fn();
  }

  private shouldRun(): boolean {
    if (this.threshold <= 0) {
      return true;
    }

    const now = Date.now();
    if (now - this.lastTime <= this.threshold) {
      this.discarded++;
      return false;
    }

    this.lastTime = now;
    const discarded = this.discarded;
    this.discarded = 0;
    if (discarded > 0) {
      this.logger.info(
        `[Limiter:${this.logPrefix}] Discarded ${discarded} times`
      );
    }

    return true;
  }
}
