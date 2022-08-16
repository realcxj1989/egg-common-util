import { v4 } from 'uuid';
import { Context } from 'egg';
import { FORMAT_HTTP_HEADERS, Tags } from 'opentracing';

export default function () {
  return async (ctx: Context, next: any) => {
    if (!ctx.request.headers['x-request-id']) {
      ctx.request.headers['x-request-id'] = v4();
    }
    ctx.tracer = {
      traceId: ctx.request.headers['x-request-id'],
    };

    if (!ctx.app.config.eggCommon?.tracing?.enable) {
      await next();
      return;
    }

    // jaeger tracing
    const parentSpanContext = ctx.app.tracer!.extract(
      FORMAT_HTTP_HEADERS,
      ctx.request.headers
    );

    const span = ctx.app.tracer!.startSpan('web-handler', {
      childOf: parentSpanContext as any,
      tags: { [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_SERVER },
    });

    ctx.span = span;

    try {
      await next();
      span.setTag(Tags.HTTP_STATUS_CODE, ctx.status || 200);
    } catch (err) {
      span.setTag(Tags.ERROR, true);
      span.setTag(Tags.HTTP_STATUS_CODE, err.status || err.statusCode || 500);
      span.log({ 'error.message': err.message || err.constructor?.name });
      throw err;
    } finally {
      const matchedRoute = ctx._matchedRoute || '__no_matched';
      const routerName = ctx.routerName || matchedRoute;
      span.setTag('route', routerName);
      span.finish();
      ctx.set('X-Trace-ID', span.context().toTraceId());
    }
  };
}
