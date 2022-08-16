import { tryLock } from './redisLock';

export interface LockOptions {
  key: string;
  expirePx: number;
}

export const lock =
  (options: LockOptions) =>
  (_: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    if (!descriptor.value) {
      throw new Error('decorator only support method');
    }

    const orginMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const redisKey = `lock:${options.key}`;
      const app = (this as any).app;
      const [lock, unlockFn] = await tryLock(
        app.redis,
        redisKey,
        options.expirePx
      );
      if (!lock) {
        app.logger.info(
          `[cache decorator] not got lock, propertyKey: ${propertyKey}, lockKey: ${options.key}, redisKey: ${redisKey}`
        );
        // 最小化依赖
        (this as any).ctx.body = {
          code: 429,
          message: 'too many requests',
        };
        return;
      }

      try {
        return await orginMethod.apply(this, args);
      } finally {
        await unlockFn();
      }
    };
  };
