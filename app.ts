import { Application } from 'egg';
import { initTracer } from 'jaeger-client';
import { initGlobalTracer } from 'opentracing';

export default function (app: Application) {
  if (!app.config.coreMiddleware.includes('tracing')) {
    app.config.coreMiddleware.unshift('tracing');
  }

  const tracingConfig = app.config.eggCommon?.tracing;
  if (tracingConfig?.enable) {
    if (!tracingConfig.config) {
      throw new Error('config.eggCommon.tracing.config is required');
    }
    if (!tracingConfig.options) {
      throw new Error('config.eggCommon.tracing.options is required');
    }
    const tracer = initTracer(tracingConfig.config, tracingConfig.options);
    initGlobalTracer(tracer);
  }
}
