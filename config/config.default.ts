import { CodeEnum } from '../lib';
import { Redis } from 'ioredis';
import { TracingConfig, TracingOptions } from 'jaeger-client';

export interface EggCommonOptions {
  envType: string;
  extCodeEnum: CodeEnum;
  tracingKeys: string[];
  redisCache: {
    redisSelectFn: (app: any) => Redis;
    nonExistsExpire: number;
    withPrometheus: boolean;
  };
  validate: {
    debug: boolean;
    hiddenErrorDetail: boolean;
  };
  tracing: {
    enable: boolean;
    config?: TracingConfig;
    options?: TracingOptions;
  };
}

export const eggCommon: EggCommonOptions = {
  envType: 'test',
  extCodeEnum: {},
  tracingKeys: [
    'x-request-id',
    // 'x-b3-traceid',
    // 'x-b3-spanid',
    // 'x-b3-parentspanid',
    // 'x-b3-sampled',
    // 'x-b3-flags',
    // 'x-ot-span-context',
    'x-user',
  ],
  redisCache: {
    redisSelectFn: (app: any) => {
      return (app as any).redis;
    },
    nonExistsExpire: 10,
    withPrometheus: false,
  },
  validate: {
    debug: false,
    hiddenErrorDetail: false,
  },
  tracing: {
    enable: false,
  },
};
