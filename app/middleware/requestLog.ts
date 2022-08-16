import { Context } from 'egg';
import _ from 'lodash';

// 不需要 requestId, 因为我们已经有了跨服务的 requestId
export default function requestLog(prefix: string = '') {
  return async (ctx: Context, next: any) => {
    const requestLogger = ctx.logger;
    const query = _.isEmpty(ctx.request.query) ? undefined : ctx.request.query;
    const body = _.isEmpty(ctx.request.body) ? undefined : ctx.request.body;
    const start = Date.now();
    const req = {
      url: ctx.request.url,
      method: ctx.request.method,
      header: ctx.request.headers,
      query,
      body,
    };

    try {
      await next();
      const response: any = ctx.response;
      const resp = {
        responseTime: Date.now() - start,
        status: response.status,
        message: response.message,
        data: response.body,
      };
      requestLogger.info(
        `[requestLog] ${prefix} success, request: ${JSON.stringify(
          req
        )}, response: ${JSON.stringify(resp)}`
      );
    } catch (err: any) {
      requestLogger.warn(
        `[requestLog] ${prefix} error, request: ${JSON.stringify(
          req
        )}, error: ${err.message}`
      );
      throw err;
    }
  };
}
