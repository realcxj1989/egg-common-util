import * as crypto from 'crypto';
import * as _ from 'lodash';

export interface RcCommonResp {
  code: number;
  message?: string;
  data?: any;
}

export interface Pagnation {
  skip: number;
  limit: number;
}

export interface PagnationPage {
  current?: string;
  pageSize?: string;
}

export interface PagnationOffset {
  limit?: string;
  offset?: string;
}

export const parseIntWithDefault = (
  str: string | undefined,
  defaultVal: number
) => {
  if (!str) {
    return defaultVal;
  }

  const i = parseInt(str, 10);
  return isNaN(i) ? defaultVal : i;
};

/**
 * 解析分页 qs.current qs.pageSize
 * @param qs
 * @param defaultCurrent 默认 1
 * @param defaultPageSize 默认 100
 * @returns
 */
export const parsePagnation = <T extends PagnationPage>(
  qs: T,
  defaultCurrent: number = 1,
  defaultPageSize: number = 100
) => {
  const current = Math.max(parseIntWithDefault(qs.current, defaultCurrent), 1);
  const pageSize = Math.max(
    parseIntWithDefault(qs.pageSize, defaultPageSize),
    1
  );

  return {
    skip: Math.max((current - 1) * pageSize, 0),
    limit: pageSize,
  };
};

/**
 * 解析分页 qs.limit qs.offset
 * @param qs
 * @param defaultLimit 100
 * @param defaultOffset 0
 * @returns
 */
export const parsePagnationOffsetLimit = <T extends PagnationOffset>(
  qs: T,
  defaultLimit: number = 100,
  defaultOffset: number = 0
) => {
  const limit = Math.max(parseIntWithDefault(qs.limit, defaultLimit), 1);
  const skip = Math.max(parseIntWithDefault(qs.offset, defaultOffset), 0);

  return {
    skip,
    limit,
  };
};

export const normalizeInput = <T extends object = any>(
  input: T,
  keys: string[] = ['__v', 'gmt_modified', 'gmt_create', 'is_deleted']
): Partial<T> => {
  return _.omit(input, keys);
};

export const buildMap = <T = any>(
  arr: T[],
  key: string,
  keyTransformFn?: (key: any) => string | undefined
): Map<string, T> => {
  const res = new Map<string, T>();
  for (const obj of arr) {
    let kk = (obj as any)[key];
    if (keyTransformFn) {
      kk = keyTransformFn(kk);
    }
    res.set(kk, obj);
  }
  return res;
};

export const singleSlash = (left: string, right: string): string => {
  return left.replace(/\/+$/, '') + '/' + right.replace(/^\/+/, '');
};

export const getOsByDeviceInfo = (info: string): string => {
  if (/iOS/.test(info)) {
    return 'ios';
  }
  if (/Android/.test(info)) {
    return 'android';
  }
  return 'others';
};

export const randString = (n: number): string => {
  return crypto
    .randomBytes(Math.ceil(n / 2))
    .toString('hex')
    .slice(n % 2);
};

// 5c80b6b33d2dc300d23adf08-w-c0912
// [mongo object id]-[type]-[rand string]
// 分别为 24 1 1 1 5, 总长度为 32
export const randDomain = (accountId: string | undefined, type: string) => {
  if (!accountId) {
    return `${randString(24)}-${type}-${randString(5)}`;
  }
  return `${accountId}-${type}-${randString(5)}`;
};

export const md5 = (str: string): string => {
  const md5Hash = crypto.createHash('md5');
  return md5Hash.update(str).digest('hex');
};

export const toBool = (str: string | undefined) => {
  if (!str) {
    return false;
  }
  return !['0', 'false'].includes(str);
};

export const randomString = (n: number = 10) => {
  return crypto.randomBytes(n).toString('hex');
};

/**
 * 为一个数值加减一个随机值使其变为 (base*(1-deviation), base*(1+deviation)]
 * 常用作防止大量缓存同时过期
 * @param base - 基础值
 * @param deviation - 偏差量, 应在 [0, 1] 之间
 * @returns
 */
export const unstableDeviation = (base: number, deviation: number) => {
  if (deviation < 0) {
    deviation = 0;
  }

  if (deviation > 1) {
    deviation = 1;
  }

  return (1 + deviation - 2 * deviation * Math.random()) * base;
};

/**
 * 和 unstableDeviation 相同, 但是返回值为 int
 * @param base - 基础值
 * @param deviation - 偏差量, 应在 [0, 1] 之间
 * @returns
 */
export const unstableDeviationInt = (base: number, deviation: number) =>
  Math.floor(unstableDeviation(base, deviation));
