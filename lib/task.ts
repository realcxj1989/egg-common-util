import { Context } from 'egg';
import { tryLock } from './redisLock';

/**
 * 创建排他定时任务
 * @param taskName 定时任务名称, 日志中显示
 * @param cacheKey redis 排它锁 key
 * @param fn 真正执行业务逻辑
 * @param expireInSeconds rediskey 失效时间
 */
export const createMutexTask =
  (
    taskName: string,
    cacheKey: string,
    fn: (ctx: Context) => Promise<void>,
    expireInSeconds: number = 30
  ) =>
  async (ctx: Context) => {
    const app: any = ctx.app;
    const logger = ctx.logger;

    if (!app.redis) {
      throw new Error('app.redis is required.');
    }

    try {
      const [lock, unLockFn] = await tryLock(
        app.redis,
        cacheKey,
        expireInSeconds * 1000
      );
      if (!lock) {
        logger.info(`task ${taskName} not got lock, ${new Date()}`);
        return;
      }

      try {
        await fn(ctx);
      } finally {
        setTimeout(() => {
          unLockFn();
          logger.info(`task ${taskName} run end, ${new Date()}`);
        }, 1000);
      }
    } catch (e) {
      logger.error(`task ${taskName} get error: `, e);
    }
  };
