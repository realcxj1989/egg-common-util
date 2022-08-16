import { Context } from 'egg';
import allsettled from 'promise.allsettled';

export interface Handler<T> {
  fn: () => Promise<T> | T;
  fallbackFn?: () => Promise<T> | T;
  logError?: boolean;
}

export type HandlerTuple<T extends [unknown, ...unknown[]]> = {
  [P in keyof T]: Handler<T[P]>;
};
export type ResultTuple<T extends [unknown, ...unknown[]]> = {
  [P in keyof T]: T[P];
};

export function withDefaultValue<T>(value: T) {
  return (): T => value;
}

export async function aggregator<T extends [unknown, ...unknown[]]>(
  ctx: Context,
  iterable: HandlerTuple<T>
): Promise<ResultTuple<T>> {
  const resArr = await allsettled.call(
    Promise,
    iterable.map(async (it, i) => {
      if (!it.fallbackFn) {
        return it.fn();
      }

      try {
        return await it.fn();
      } catch (err) {
        const logContent = `index ${i} call origin fn error: ${err}, will call fallbackFn`;
        if (it.logError) {
          ctx.logger.error(logContent);
        } else {
          ctx.logger.warn(logContent);
        }
        return it.fallbackFn();
      }
    })
  );
  const res = [];
  for (let i = 0; i < resArr.length; i++) {
    const r = resArr[i];
    if (r.status === 'fulfilled') {
      res.push(r.value);
    } else {
      const logContent = `index ${i} cause error, will throw: ${r.reason}`;
      if (iterable[i].logError) {
        ctx.logger.error(logContent);
      } else {
        ctx.logger.warn(logContent);
      }
      throw new Error(r.reason as any);
    }
  }
  return res as any as Promise<ResultTuple<T>>;
}
