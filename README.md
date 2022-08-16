# egg-common-util

> 一些通用化的代码整理出来的插件

## 功能

- 扩展 `ctx`
- 扩展 `helper`
- 暴露一系列 `util` 方法
- 封装 `curl` 为 `HttpCallClient`

## 文档

### 通用配置

```ts
// plugin.ts
eggCommonUtil: {
  enable: true,
  package: 'egg-common-util'
}
```

```ts
// 插件配置
import BIZ_CODE_ENUM from '../app/enum/BIZ_CODE_ENUM';

config.eggCommon = {
  extCodeEnum: BIZ_CODE_ENUM, // 自定义扩展业务 biz code enum, 不指定则用默认值
};
```

### HttpCallClient 使用

```ts
// 插件配置
import { errorHandler } from 'egg-common-util';

config.onerror = {
  all: errorHandler, // 配置全局错误处理器
  accepts() {
    return 'json';
  },
};
```

建议根据调用的服务分组, 挂在 `ctx` 对象上

```ts
// extend/context.ts
import Once from '@zcong/once';
import { HttpCallClient } from 'egg-common-util';

export default {
  get ctx(): Context {
    return this as any as Context;
  },
  get appServiceClient() {
    return Once.syncOnce(
      'GLOBAL_HTTP_CLIENT_APP_SERVICE',
      () =>
        new HttpCallClient({
          baseURL: this.ctx.app.config.SERVICE_HOST_URL,
          timeout: 8000, // 默认配置
        })
    );
  },
};
```

使用

```ts
// service.ts
// ...call some api
async someApi() {
  const res = await this.ctx.appServiceClient.request(this.ctx, '/api/path')
  return res
}

async withOptions() {
  const res = await this.ctx.appServiceClient.request(this.ctx, '/api/path', {
    method: 'POST',
    timeout: 10000, // 覆盖配置
  })
  return res
}
```

出现错误时, 全局错误处理器会处理, 也可以 `try catch` 自行处理

```ts
// 错误类型
export class BizError extends Error {
  code: number;
  data: any;
  constructor(code: number, data: any, message?: string) {
    super(message);
    this.code = code;
    this.data = data;
  }
}
```

### aggregator 使用

并发调用多个 API, 并且支持 fallback

```ts
import { aggregator, withDefaultValue } from 'egg-common-util';

// 并发调用 API
aggregator(ctx, [
  {
    fn: () => callImportantAPI(), // 如果 callImportantAPI 失败会直接抛错, 因为没有 fallbackFn
    logError: true, // 打印错误日志(error 级别), 默认 warn 级别
  },
  {
    fn: () => callOptionalAPI(), // 如果 callImportantAPI 失败, 会返回 { defaultData: 'defaultData' }
    fallbackFn: withDefaultValue({ defaultData: 'defaultData' }),
  },
  {
    fn: () => callOptionalAPI2(),
    fallbackFn: () => callFallbackAPI(), // 也可以指定调用别的函数处理
  },
]).then(([importantResp, optionalResp, optionalResp2]) => {});
```

### 单例装饰器

单例装饰器能够防止实例多次初始化, 主要解决实例初始化依赖 `egg class` 内部动态属性导致不能写在 class 外部

```ts
import { Service } from 'egg';
import { syncOnce } from 'egg-common-util';

// 只会被实例化一次
class Third {
  constructor() {
    console.log('init third part lib');
  }

  resp() {
    return 'resp';
  }
}

export default class Test extends Service {
  @syncOnce('THIRD_PART_SINGLETONE')
  getThird() {
    return new Third();
  }

  public async test() {
    return this.getThird().resp();
  }
}
```

注意: `once` 和 `syncOnce` 的区别是: `once` 修饰异步方法, `syncOnce` 修饰同步

### 缓存装饰器

缓存装饰器基于 redis, 用来缓存函数计算结果

```ts
// 插件配置
config.eggCommon = {
  redisCache: {
    nonExistsExpire: 0, // 空值缓存存在时间, 0 则不缓存空值, 主要为了防止缓存 miss 攻击, 数据库压力不大时不要开启, null, {}, [] 均被认为是空值
    redisSelectFn: (app: Application) => {
      return (app as any).redis;
    }, // redis 实例选择函数, 当存在多个 redis 客户端时, 需要自行制定使用的实例
  },
};
```

注意: 由于依赖 egg ctx 上下文, 所以目前只能在 service 和 controller 中使用, 建议在 service 中使用

```ts
// 使用
import { Service } from 'egg';
import { cache } from 'egg-common-util';

export default class Test extends Service {
  @cache({
    cacheKey: 'CACHE_TEST_KEY', // 该方法缓存标识符, 用来计算缓存 key, 如果目标函数有参数, 则缓存 key 会加上 `md5(JSON.stringifg(args))`
    expire: 10,
    nonExistsExpire: 0, // 可以覆盖默认配置
  })
  public async sayHi(name: string) {
    return name ? `hi, ${name}` : null;
  }

  @cache({ cacheKey: 'CACHE_SIMPLE' }) // 简单用法, 使用全局配置
  public async simple() {
    return 'simple';
  }
}
```

### 数据检验装饰器

数据校验装饰器是对 [class-validator](https://github.com/typestack/class-validator) 的封装, 对 post, put 请求 body 校验

```ts
// 插件配置
config.eggCommon = {
  validate: {
    hiddenErrorDetail: true, // 全局配置, 为 true 时默认会返回校验错误详情, 默认值为 true, 生产环境设置酌情考虑设置为 false
  },
};
```

```ts
import { Controller } from 'egg';
import { IsNotEmpty } from 'class-validator';
import { validateV2 } from 'egg-common-util';

class User {
  @IsNotEmpty()
  name: string;
}

export default class HomeController extends Controller {
  @validateV2(User)
  public async post() {
    const { ctx } = this;
    // 这里 User 只用作类型
    const data: User = ctx.request.body;
    ctx.body = data;
  }
}
```

### 数据校验装饰器 (废弃)

数据校验装饰器是对 [Joi](https://github.com/hapijs/joi) 的封装, 对 post 请求进行表单校验, (目前只支持 post body 校验)

```ts
// 插件配置
config.eggCommon = {
  validate: {
    debug: true, // 全局 verbose 配置, 为 true 时默认会返回校验错误详情, 默认值为 false, 建议在非生产环境设置为 true
  },
};
```

```ts
import { Controller } from 'egg';
import { validate } from 'egg-common-util';
import Joi from 'joi';

const schema: Joi.Schema = Joi.object().keys({
  name: Joi.string().required(),
  age: Joi.number().required(),
});

export default class HomeController extends Controller {
  // 第二个参数控制是否返回错误详情, 建议在测试环境设为 true, 默认为 false, 可省略
  @validate(schema, true)
  public async p() {
    const { ctx } = this;
    ctx.result(0, ctx.request.body);
  }
}
```

### 并发控制装饰器

**注意** 应在 controller 层使用

```ts
import { lock } from 'egg-common-util';

export default class Test extends Controller {
  @lock({
    key: 'lockKey', // lock key, 分组标识, 在 redis 中的 key 为: lock:${key}
    expirePx: 30000, // 锁失效时间, ms
  })
  async simple() {
    // 业务逻辑
    const { ctx } = this;
    ctx.result(0, ctx.request.body);
  }
}
```

### 重试控制器

```ts
import { runWithRetry, runInBackgroundWithRetry, retry } from 'egg-common-util';

export default class Test extends Controller {
  async simple() {
    // 将会重试 3 次, 并且重试时长逐渐增长, 重试达到最大次数仍未成功则 throw error
    const res = await runWithRetry(3, async () => {
      // do some logic
    });
    return res;
  }

  async background() {
    // 封装 app.runInBackground 方法, 重试 3 次
    runInBackgroundWithRetry(
      this.ctx,
      3, // 重试次数
      async () => {
        // do some logic
      }, // 包裹方法
      true // 是否打印错误日志
    );
  }

  @retry(3, true)
  async retryWrap() {
    // 此方法被调用时会自动重试
    // do some logic
  }
}
```

### 创建排他定时任务 [./lib/task.ts](./lib/task.ts)

```ts
import { createMutexTask } from 'egg-common-util';

export default {
  schedule: {
    cron: '30 20 * * 3', // 每周三 20:30
    // cron: '0 0 20 31 12 *',
    // 0点或12点
    // immediate: true,
    type: 'worker',
  },
  // task 是真正定时任务执行时被运行的函数，第一个参数是一个匿名的 Context 实例
  task: createMutexTask('mrcHot', '__task__:mrcHot', async (ctx) =>
    ctx.service.mrc.updateHot()
  ),
};
```

### 分批处理器 [lib/sliceRunner.ts](lib/sliceRunner.ts)

```ts
import { sliceRunner } from 'egg-common-util';

const handler = (arr: number[]) => arr.map((it) => it + 1);
const cancelKey = 'xxxx';
/**
 * 分片执行
 * @param ctx egg Context
 * @param taskName 任务名, 仅做日志输出区分
 * @param dataSource 数据源, 数组
 * @param fn 处理函数, 类型要和数据源相同
 * @param partitionCount 每批数据长度
 * @param opts.sleep 批操作间 sleep 时间
 * @param opts.cancelKey 如果设置, 每次任务执行会检查 redis 中该 key 是否存在, 若不存在则 cancal 掉任务
 * @param opts.logError 是否打印错误日志
 */
sliceRunner(
  this.ctx,
  'test',
  Array(100)
    .fill(null)
    .map((_, i) => i),
  handler,
  10, // 每次执行 10 条
  { sleep: 1000, cancelKey } // 每次执行完 sleep 1000ms, 并且该任务可取消
).then((res) => this.ctx.logger.info(res));

// 2000ms 后取消任务
setTimeout(() => this.app.redis.del(cancelKey), 2000);
```
