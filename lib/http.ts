import * as url from 'url';
import _ from 'lodash';
import { Context } from 'egg';
import { IPolicy } from 'cockatiel';
import {
  RequestOptions2 as BaseRequestOptions,
  HttpClientResponse,
} from 'urllib';
import { Code } from './types';

export interface RequestOptions extends BaseRequestOptions {
  ignoreErrorLog?: boolean;
  logSuccess?: boolean;
}

export interface Options extends RequestOptions {
  baseURL?: string;
  cockatielPolicy?: IPolicy<any>;
}

export interface GymboData<T> {
  code: number;
  data: T;
  message?: any;
}
export interface GymboHttpResult<T = any>
  extends HttpClientResponse<GymboData<T>> {}

export type HttpClient = <T = any>(
  url: string,
  opt?: RequestOptions
) => Promise<HttpClientResponse<T>>;

export class BizError extends Error {
  code: number;
  data: any;
  status?: number;
  constructor(code: number, data: any, message?: string, status: number = 500) {
    super(message);
    this.code = code;
    this.data = data;
    this.status = status;
  }
}

// 主动抛出的客户端接口请求错误，不应被日志记录，且返回 200 状态码
export class ApiError extends BizError {
  status: number;
  constructor(code: number, data: any, message?: string) {
    super(code, data, message);

    // 阻止 egg-onerror/app.js 将错误当成服务端错误而打错误日志
    this.status = 200;
  }

  public static of(message: string): ApiError {
    return new ApiError(1, null, message);
  }

  public static fromCode(code: Code): ApiError {
    return new ApiError(code.code ?? 1, null, code.message ?? code.description);
  }
}

const defaultOptions: RequestOptions = {
  contentType: 'json',
  dataType: 'json',
  timeout: 10000,
  method: 'GET',
  ignoreErrorLog: false,
};

export class HttpCallClient {
  private readonly opts: Options;
  constructor(opts: Options) {
    this.opts = {
      ...defaultOptions,
      ...opts,
    };
  }

  /**
   * @deprecated use request
   * @param ctx any
   * @param path
   * @param opts
   */
  async call<T = any>(
    ctx: any,
    path: string,
    opts?: RequestOptions
  ): Promise<T> {
    return this.request(ctx, path, opts);
  }

  async requestRaw<T = any>(
    c: any,
    path: string,
    opts?: RequestOptions
  ): Promise<HttpClientResponse<T>> {
    const ctx = c as Context;
    const requestUrl = this.opts.baseURL
      ? url.resolve(this.opts.baseURL, path)
      : path;
    const requestOpts = {
      ...this.opts,
      ...opts,
    };
    let resp: HttpClientResponse<T>;
    // only handle get method
    if (this.opts.cockatielPolicy && this.opts.method === 'GET') {
      resp = await this.opts.cockatielPolicy.execute(() =>
        this.getClient(ctx)(requestUrl, requestOpts)
      );
    } else {
      resp = await this.getClient(ctx)(requestUrl, requestOpts);
    }

    if (resp.status !== 200) {
      if (opts && opts.ignoreErrorLog) {
        ctx.logger.warn(
          `raw http call error, status: ${
            resp.status
          }, result: ${JSON.stringify(
            resp.data
          )}, url: ${requestUrl}, callOptions: ${JSON.stringify({
            ...this.opts,
            ...opts,
          })}`
        );
        throw new ApiError(
          resp.status,
          resp.data,
          `error status: ${resp.status}`
        );
      } else {
        ctx.logger.error(
          `raw http call error, status: ${
            resp.status
          }, result: ${JSON.stringify(
            resp.data
          )}, url: ${requestUrl}, callOptions: ${JSON.stringify({
            ...this.opts,
            ...opts,
          })}`
        );
        throw new BizError(
          resp.status,
          resp.data,
          `error status: ${resp.status}`,
          resp.status
        );
      }
    }

    if (opts?.logSuccess) {
      ctx.logger.info(
        `raw http call success, status: ${
          resp.status
        }, result: ${JSON.stringify(
          resp.data
        )}, url: ${requestUrl}, callOptions: ${JSON.stringify({
          ...this.opts,
          ...opts,
        })}`
      );
    }

    return resp;
  }

  /**
   * make http request
   * @param ctx any
   * @param path request path
   * @param opts request options
   */
  async request<T = any>(
    c: any,
    path: string,
    opts?: RequestOptions
  ): Promise<T> {
    const ctx = c as Context;
    let resp: GymboHttpResult<T> = await this.requestRaw(ctx, path, opts);

    return extractData(resp.data, opts?.ignoreErrorLog, resp.status);
  }

  /**
   * 返回对象, data 是 extractData 出来的
   * 会包含 resp heders
   * @param c
   * @param path
   * @param opts
   * @returns
   */
  async withRespHeader<T = any>(
    c: any,
    path: string,
    opts?: RequestOptions
  ): Promise<HttpClientResponse<T>> {
    const ctx = c as Context;
    let resp: GymboHttpResult<T> = await this.requestRaw(ctx, path, opts);

    return {
      status: resp.status,
      res: resp.res,
      headers: resp.headers,
      data: extractData(resp.data, opts?.ignoreErrorLog, resp.status),
    };
  }

  private getClient(c: any): HttpClient {
    const ctx = c as Context;
    if (ctx.curlWithTracing) {
      return (url, opts) => ctx.curlWithTracing(ctx, url, opts);
    } else {
      return ctx.curl.bind(ctx);
    }
  }
}

export const extractData = <T = any>(
  body: GymboData<T>,
  ignoreError: boolean,
  status: number = 200
) => {
  if (body.code === 0) {
    return body.data;
  }

  if (ignoreError) {
    throw new ApiError(body.code, body.data, body.message);
  } else {
    throw new BizError(body.code, body.data, body.message, status);
  }
};

export const errorHandler = (err: Error, ctx: Context) => {
  if (err instanceof BizError) {
    return ctx.result(err.code, err.data, err.message);
  }

  if (err instanceof ctx.ValidateError) {
    ctx.status = 200;
    ctx.result(499, err.errors);
  } else {
    ctx.body = { code: 500, message: err.message };
    ctx.status = 500;
  }
};

/**
 * 相当于直接使用请求参数请求内部服务某个接口, 使用于直接将请求转发给内部单个接口的场景
 * 如果要用这个, 需要实现 ctx.getAccountId 扩展方法, 返回 account id 字符串
 *
 * 1. 数据传递, query + body + accountId(auth) 会合并作为请求 data 发送给内部接口,
 *    如果内部接口请求方式为 GET 则会自动设置 dataAsQueryString 为 true
 * 2. 如果路由经过了 auth 中间件, accountId 也会被添加进请求参数
 * 3. 此方法会将正常响应直接使用 result(0, data) 发送出去, 后续不应该再调用请求响应方法
 * 4. 错误处理没有做额外处理, 处理方式可以和 httpCallClient.request 相同, try catch 来做定制化错误响应
 */
export const redirectRequest = async (
  ctx: Context,
  httpCallClient: HttpCallClient,
  path: string,
  options?: RequestOptions
) => {
  const currentMethod = ctx.request.method?.toUpperCase();
  const accountId = ctx.getAccountId();
  let data = ctx.request.query;

  if (currentMethod !== 'GET') {
    data = {
      ...data,
      ...ctx.request.body,
    };
  }

  const opts: RequestOptions = {
    method: currentMethod as any,
    ...options,
  };

  // 防止 web 层传入 accountId
  data = _.omit(data, 'accountId');
  _.set(data, 'accountId', accountId);

  const dataAsQueryString = opts.method === 'GET';

  const resp = await httpCallClient.request(ctx, path, {
    data,
    dataAsQueryString,
    ...opts,
  });

  ctx.result(0, resp);
};
