import { Context } from 'egg';
import { HttpCallClient, Options, RequestOptions } from './http';

const ErrInvalidMethod = new Error('Invalid_Method');

export interface Resp<T = any> {
  code: number;
  data: T;
  message?: any;
  status?: number;
}

const isResp = (r: any): r is Resp => {
  return r && r.code;
};

export interface RpcData<T = any> {
  method: string;
  data: T;
}

const respError = (ctx: Context, status: number, err: Error) => {
  ctx.status = status;
  ctx.body = {
    code: status,
    message: err.message,
  };
};

/**
 * 注册路由
 */
export const registryService = (validMethods: string[]) => async (ctx: any) => {
  const data: RpcData = ctx.request.body;
  const metadata = ctx.request.header;

  if (!validMethods.includes(data.method)) {
    // 500
    respError(ctx, 500, ErrInvalidMethod);
    return;
  }

  const tmpArr = data.method.split('.');
  if (tmpArr.length !== 2) {
    // 500
    respError(ctx, 500, ErrInvalidMethod);
    return;
  }

  const [serviceName, methodName] = tmpArr;

  if (
    !(
      ctx.service[serviceName] &&
      Reflect.has(ctx.service[serviceName], methodName) &&
      typeof ctx.service[serviceName][methodName] === 'function'
    )
  ) {
    // 500
    respError(ctx, 500, ErrInvalidMethod);
    return;
  }

  ctx.logger.debug(
    `rpc call [${serviceName}.${methodName}], data: ${JSON.stringify(
      data
    )}, metadata: ${JSON.stringify(metadata)}`
  );

  try {
    const resp: any = await ctx.service[serviceName][methodName](
      data.data,
      metadata
    );

    if (isResp(resp)) {
      ctx.status = resp.status || 200;
      ctx.body = {
        code: resp.code,
        data: resp.data,
        message: resp.message,
      };
    } else {
      ctx.status = 200;
      ctx.body = {
        code: 0,
        data: resp,
      };
    }
  } catch (err) {
    ctx.logger.warn(
      `rpc call error [${serviceName}.${methodName}], data: ${JSON.stringify(
        data
      )}, metadata: ${JSON.stringify(metadata)}, err: `,
      err
    );
    throw err;
  }
};

const defaultOptions: RequestOptions = {
  contentType: 'json',
  dataType: 'json',
  timeout: 10000,
  method: 'POST',
  ignoreErrorLog: false,
};

export class RpcCallClient extends HttpCallClient {
  private rpcOpts: Options;
  constructor(opts: Options) {
    const optsWithDefault = {
      ...defaultOptions,
      ...opts,
    };
    super(optsWithDefault);
    this.rpcOpts = optsWithDefault;
  }
  /**
   * make http request
   * @param ctx any
   * @param method method, eg: A.name
   * @param opts request options
   */
  async request<T = any, U = any>(
    c: any,
    method: string,
    data: U,
    opts?: RequestOptions
  ): Promise<T> {
    const requestOpts = {
      ...this.rpcOpts,
      ...opts,
    };

    requestOpts.data = {
      method,
      data,
    };

    return super.request(c, requestOpts.baseURL, requestOpts);
  }
}
