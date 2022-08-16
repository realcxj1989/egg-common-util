import { Application } from 'egg';
import { Logger, LoggerLevel } from 'egg-logger';

export class LessLogger {
  private readonly _logger: Logger;
  private readonly threshold: number;
  private lastTime: number;
  private discarded: number;

  private groups: Map<string, LessLogger>;

  constructor(threshold: number, logger: Logger) {
    this._logger = logger;
    this.threshold = threshold;
    this.lastTime = 0;
    this.discarded = 0;

    // app.loggers.set will use options
    (this as any).options = {};
  }

  // Then call app.getLogger('lessLogger') can get this instance
  static registerForApp(
    app: Application,
    threshold: number,
    name = 'lessLogger'
  ) {
    app.loggers.set(name, new LessLogger(threshold, app.logger) as any);
  }

  private shouldLog(): boolean {
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
      this._logger.info('[LessLogger] Discarded %d messages', discarded);
    }

    return true;
  }

  public log(level: LoggerLevel, args: any[], meta?: object) {
    if (!this.shouldLog()) return;
    this._logger.log(level, args, meta);
  }

  public error(msg: any, ...args: any[]): void {
    if (!this.shouldLog()) return;
    this._logger.error(msg, ...args);
  }
  public warn(msg: any, ...args: any[]): void {
    if (!this.shouldLog()) return;
    this._logger.warn(msg, ...args);
  }
  public info(msg: any, ...args: any[]): void {
    if (!this.shouldLog()) return;
    this._logger.info(msg, ...args);
  }
  public debug(msg: any, ...args: any[]): void {
    if (!this.shouldLog()) return;
    this._logger.debug(msg, ...args);
  }

  public write(msg: string) {
    this._logger.write(msg);
  }

  // logger.group('first').info('message')
  public group(key: string, threshold?: number): LessLogger {
    if (key === 'default') return this;
    if (!this.groups) this.groups = new Map();

    let child = this.groups.get(key);
    if (child) return child;

    if (threshold == null) threshold = this.threshold;
    child = new LessLogger(threshold, this._logger);
    this.groups.set(key, child);
    return child;
  }
}
