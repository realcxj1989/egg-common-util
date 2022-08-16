import { Application } from 'egg';
import { RedisCache as RedisCacheV2 } from '@zcong/node-redis-cache';
import Once from '@zcong/once';
import { globalTracer } from 'opentracing';
import { HttpCallClient } from '../../lib';
import { eggCommon } from '../../config/config.default';

export default {
  get app(): Application {
    return this as any as Application;
  },
  get tracer() {
    return globalTracer();
  },
  get cache() {
    return Once.syncOnce('__cache__', () => {
      const config = this.app.config.eggCommon.redisCache;
      const c = new RedisCacheV2({
        redis: config.redisSelectFn(this.app),
        prefix:
          '__redis_cache2__:' + (this.app.config.eggCommon.envType || 'prod'),
        withPrometheus: config.withPrometheus,
        notFoundExpire: config.nonExistsExpire,
      });
      c.onError = (evt) => {
        this.app.logger.error(`app.cache redis error: ${JSON.stringify(evt)}`);
      };
      return c;
    });
  },
  get defaultHttpClient() {
    return Once.syncOnce('__defaultHttpClient__', () => new HttpCallClient({}));
  },
};
