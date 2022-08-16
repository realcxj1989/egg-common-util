import { Span, Tracer } from 'opentracing';
import AppExtendObject from './app/extend/application';
import ExtendObject from './app/extend/context';
import IhelperExtendObject from './app/extend/helper';
import { EggCommonOptions } from './config/config.default';
export * from './lib';

declare module 'egg' {
  export interface Application {
    tracer?: Tracer
    cache: typeof AppExtendObject.cache;
    defaultHttpClient: typeof AppExtendObject.defaultHttpClient;
  }

  export interface Context {
    ctx: typeof ExtendObject.ctx;
    curlWithTracing: typeof ExtendObject.curlWithTracing;
    ValidateError: typeof ExtendObject.ValidateError;
    DataError: typeof ExtendObject.DataError;
    redisKey: typeof ExtendObject.redisKey;
    result: typeof ExtendObject.result;
    indirect: typeof ExtendObject.indirect;
    eggAssert: typeof ExtendObject.eggAssert;
    span?: Span;
  }

  export interface IHelper {
    md5: typeof IhelperExtendObject.md5;
    getSmsCode: typeof IhelperExtendObject.getSmsCode;
    getRedisStringKey: typeof IhelperExtendObject.getRedisStringKey;
    randI: typeof IhelperExtendObject.randI;
    isObjectId: typeof IhelperExtendObject.isObjectId;
    buildRedisKey: typeof IhelperExtendObject.buildRedisKey;
    parseUserAgent: typeof IhelperExtendObject.parseUserAgent;
    redirectRequest: typeof IhelperExtendObject.redirectRequest;
  }

  export interface EggAppConfig {
    eggCommon: EggCommonOptions;
  }
}
