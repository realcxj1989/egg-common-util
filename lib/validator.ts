import type Joi from 'joi';
import { validateSync, ValidatorOptions } from 'class-validator';
import { ClassTransformOptions, plainToInstance } from 'class-transformer';
import { Context } from 'egg';
import { eggCommon } from '../config/config.default';

export type ClassType<T> = {
  new (...args: any[]): T;
};

export const validateV2 =
  <T>(
    t: ClassType<T>,
    validatorOptions?: ValidatorOptions,
    transformOptions?: ClassTransformOptions
  ) =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    if (!descriptor.value) {
      throw new Error('decorator only support method');
    }

    const orginMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const ctx: Context = (this as any).ctx;

      if (['POST', 'PUT'].includes(ctx.request.method.toUpperCase())) {
        const entity = plainToInstance(t, ctx.request.body, transformOptions);
        const errors = validateSync(entity as any, validatorOptions);
        if (errors.length > 0) {
          ctx.body = {
            code: 499,
            data: ctx.app.config.eggCommon.validate.hiddenErrorDetail
              ? []
              : errors.map((e) => e.toString()),
            message: '参数异常,请核对您所填写的内容',
          };
          return;
        }
      } else {
        ctx.logger.warn(
          `validateV2 now only support post and put method, ${target.pathName}:${propertyKey}`
        );
      }

      const value = orginMethod.apply(this, args);
      return value;
    };
  };

// @ts-ignore
export const validate =
  (schema: Joi.Schema, verbose: boolean = false) =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    if (!descriptor.value) {
      throw new Error('decorator only support method');
    }

    const orginMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const ctx: Context = (this as any).ctx;

      if (ctx.request.method === 'POST') {
        const res = schema.validate(ctx.request.body);
        if (res.error) {
          ctx.body = {
            code: 499,
            data:
              verbose || (this as any).app.config.eggCommon.validate.debug
                ? res.error
                : undefined,
            message: '参数异常,请核对您所填写的内容',
          };
          return;
        }
      } else {
        ctx.logger.warn(
          `validate now only support post method, ${target.pathName}:${propertyKey}`
        );
      }

      const value = orginMethod.apply(this, args);
      return value;
    };
  };
