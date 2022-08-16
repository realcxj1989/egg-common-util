import { Policy, RetryPolicy } from 'cockatiel';
import { Context } from 'egg';

const defaultPolicy = Policy.handleAll()
  .retry()
  .attempts(3)
  .exponential({ initialDelay: 1000 });

export const notifyPolicy = Policy.handleAll()
  .retry()
  .attempts(5)
  .exponential({ initialDelay: 1000, maxDelay: 5000 });

export const runWithRetryV2 = <T = any>(
  ctx: Context,
  fn: () => T | Promise<T>,
  logPrefix: string,
  retryPolicy?: RetryPolicy
) => {
  const policy = retryPolicy || defaultPolicy;
  return policy.execute(async (retryCtx) => {
    try {
      return await fn();
    } catch (err) {
      ctx.logger.warn(
        `${logPrefix} [runWithRetryV2] attempt number: ${retryCtx?.attempt}, error: ${err}`
      );
      throw err;
    }
  });
};

export const runInBackgroundWithRetryV2 = <T = any>(
  ctx: Context,
  fn: () => T | Promise<T>,
  logPrefix: string,
  retryPolicy?: RetryPolicy,
  logError?: boolean
) => {
  ctx.app.runInBackground((_) =>
    runWithRetryV2(ctx, fn, logPrefix, retryPolicy).catch((err) => {
      const msg = `${logPrefix} [runInBackgroundWithRetryV2] error ${err}`;
      if (logError) {
        ctx.logger.error(msg);
      } else {
        ctx.logger.warn(msg);
      }
    })
  );
};
