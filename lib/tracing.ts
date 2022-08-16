import { Context } from 'egg';
import { RequestOptions2 as RequestOptions, HttpClientResponse } from 'urllib';
import { Tags, FORMAT_HTTP_HEADERS } from 'opentracing';

export const getTracingHeaders = (
  headers: Headers | {},
  tracingKeys: string[] = []
) => {
  const res: any = {};
  tracingKeys.forEach((key) => {
    const val = (headers as any)[key];
    if (val) {
      res[key] = val;
    }
  });
  return res;
};

export const curlWithTracing = <T = any>(
  ctx: Context,
  url: string,
  opt: RequestOptions = {}
): Promise<HttpClientResponse<T>> => {
  const { tracingKeys } = ctx.app.config.eggCommon;
  const tracingHeaders = getTracingHeaders(
    ctx.request.headers || {},
    tracingKeys
  );

  opt.headers = {
    ...tracingHeaders,
    ...opt?.headers,
  };

  if (!ctx.app.config.eggCommon?.tracing?.enable) {
    return ctx.curl(url, opt);
  }

  const span = ctx.span;
  const tracer = ctx.app.tracer;
  const newSpan = tracer.startSpan('curl', { childOf: span.context() });
  newSpan.setTag(Tags.HTTP_URL, url);
  newSpan.setTag(Tags.HTTP_METHOD, (opt.method || 'GET').toUpperCase());
  newSpan.setTag(Tags.SPAN_KIND, Tags.SPAN_KIND_RPC_CLIENT);
  // Send span context via request headers (parent id etc.)
  tracer.inject(newSpan, FORMAT_HTTP_HEADERS, opt.headers);

  return ctx
    .curl(url, opt)
    .catch((err) => {
      newSpan.setTag(Tags.ERROR, true);
      span.log({ 'error.message': err.message || err.constructor?.name });
      throw err;
    })
    .finally(() => {
      newSpan.finish();
    });
};
