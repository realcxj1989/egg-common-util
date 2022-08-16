import { Application } from 'egg';

export interface CacheOptions {
  cacheKey: string;
  expire: number | (() => number);
  nonExistsExpire?: number;
  codec?: string;
}

export const cache =
  (opt: CacheOptions) =>
  (_: any, __: string, descriptor: PropertyDescriptor) => {
    if (!descriptor.value) {
      throw new Error('decorator only support method');
    }

    const orginMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const app = (this as any).app as Application;
      if (!app.cache) {
        return orginMethod.apply(this, args);
      }

      const expire =
        typeof opt.expire === 'function' ? opt.expire() : opt.expire;

      const fn = (...args: any[]) => orginMethod.apply(this, args);

      return app.cache.cacheWrapper(
        opt.cacheKey,
        fn,
        expire,
        opt.codec
      )(...args);
    };
  };
