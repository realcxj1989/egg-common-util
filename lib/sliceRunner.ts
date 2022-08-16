import { Context } from 'egg';

const sleep = (n: number) => new Promise((r) => setTimeout(r, n));

export type SliceHandler<T, U> = (d: T[]) => U | Promise<U>;
export interface SliceMapperOptions {
  sleep?: number;
  cancelKey?: string;
  logError?: boolean;
}

const defaultOpts = {
  sleep: 0,
};

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
export const sliceRunner = async <T = any, U = any>(
  ctx: Context,
  taskName: string,
  dataSource: T[],
  fn: SliceHandler<T, U>,
  partitionCount: number,
  opts?: SliceMapperOptions
) => {
  const loggerPrefix = `[sliceMapper ${taskName}]`;
  const options: SliceMapperOptions = {
    ...defaultOpts,
    ...opts,
  };

  if (options.cancelKey && !(ctx.app as any).redis) {
    throw new Error(
      `${loggerPrefix} app.redis is required when opts.cancelKey is set`
    );
  }

  const redis = (ctx.app as any).redis;

  if (options.cancelKey) {
    await redis.set(options.cancelKey, `${new Date()}`);
  }

  const total = dataSource.length;
  let i = 0;
  const res: U[] = [];
  ctx.logger.info(`${loggerPrefix} start, total: ${total}`);
  while (i < total) {
    if (options.cancelKey && !(await redis.exists(options.cancelKey))) {
      ctx.logger.info(`${loggerPrefix} canceled, done: ${i}, total: ${total}`);
      return res;
    }
    let pd = dataSource.slice(i, i + partitionCount);
    try {
      const r = await fn(pd);
      res.push(r);
    } catch (err) {
      const logMsg = `${loggerPrefix} error, done: ${i}, total: ${total}, error: ${err}`;
      if (options.logError) {
        ctx.logger.error(logMsg);
      } else {
        ctx.logger.warn(logMsg);
      }
    }
    i += pd.length;
    ctx.logger.info(`${loggerPrefix} processing, done: ${i}, total: ${total}`);
    if (options.sleep && options.sleep > 0) {
      await sleep(options.sleep);
    }
    pd = [];
  }

  ctx.logger.info(`${loggerPrefix} done, done: ${i}, total: ${total}`);
  if (options.cancelKey) {
    await redis.del(options.cancelKey);
  }
  return res;
};
