import { Policy, IBackoff, IRetryBackoffContext } from 'cockatiel';
import { Context } from 'egg';

const createRetryConfig = (
  maxAttempts: number,
  backoff?: IBackoff<IRetryBackoffContext<unknown>>
) => {
  if (backoff) {
    return Policy.handleAll().retry().attempts(maxAttempts).backoff(backoff);
  }
  return Policy.handleAll()
    .retry()
    .attempts(maxAttempts)
    .exponential({ initialDelay: 1000 });
};

/**
 * @deprecated use runWithRetryV2
 * @param maxAttempts
 * @param fn
 * @param backoff
 */
export const runWithRetry = <T = any>(
  maxAttempts: number,
  fn: () => T | Promise<T>,
  backoff?: IBackoff<IRetryBackoffContext<unknown>>
) => {
  const c = createRetryConfig(maxAttempts, backoff);
  return c.execute(fn);
};

/**
 * @deprecated use runInBackgroundWithRetryV2
 * @param ctx
 * @param maxAttempts
 * @param fn
 * @param logError
 * @param backoff
 */
export const runInBackgroundWithRetry = <T = any>(
  ctx: Context,
  maxAttempts: number,
  fn: () => T | Promise<T>,
  logError?: boolean,
  backoff?: IBackoff<IRetryBackoffContext<unknown>>
) => {
  const c = createRetryConfig(maxAttempts, backoff);
  ctx.app.runInBackground((_) =>
    c.execute(fn).catch((err) => {
      const msg = `[runInBackgroundWithRetry] error, retry: ${maxAttempts} times, ${err}`;
      if (logError) {
        ctx.logger.error(msg);
      } else {
        ctx.logger.warn(msg);
      }
    })
  );
};

/**
 * @deprecated
 * @param maxAttempts
 * @param logError
 * @param backoff
 */
export const retry =
  (
    maxAttempts: number,
    logError?: boolean,
    backoff?: IBackoff<IRetryBackoffContext<unknown>>
  ) =>
  (_: any, __: string, descriptor: PropertyDescriptor) => {
    const inner = descriptor.value;
    if (typeof inner !== 'function') {
      throw new Error(
        `Can only decorate functions with @cockatiel, got ${typeof inner}`
      );
    }

    const c = createRetryConfig(maxAttempts, backoff);

    descriptor.value = async function (this: any, ...args: any[]) {
      return c
        .execute((_) => inner.apply(this, ...args))
        .catch((err) => {
          const msg = `[retry decorator] error, retry: ${maxAttempts} times, ${err}`;
          if (logError) {
            this.ctx.logger.error(msg);
          } else {
            this.ctx.logger.warn(msg);
          }
          throw err;
        });
    };
  };
