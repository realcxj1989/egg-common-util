import { Context } from 'egg';
import { RequestOptions2 as RequestOptions } from 'urllib';
import { curlWithTracing } from '../../lib/tracing';
import BIZ_CODE_ENUM from '../../lib/enum/BIZ_CODE_ENUM';
import { ApiError } from '../../lib/http';
import { Code } from '../../lib/types';
import { eggCommon } from '../../config/config.default';

export interface Resp {
  code: number;
  data?: any;
  message?: string;
}

export interface ExtOpts {
  loggerPrefix?: string;
  successCallback?: (respData: any) => Resp;
  errorCallback?: (respData: any) => Resp;
}

export class ValidateError extends Error {
  errors: any;
  isValidateError: boolean;
  status: number;
  constructor(errors: any, ...params: any[]) {
    super(...params);
    this.errors = errors;
    this.status = 200;
    this.isValidateError = true;
  }
}

export class DataError extends Error {
  data: any;
  constructor(data: any, ...params: any[]) {
    super(...params);
    this.data = data;
  }
}

export default {
  get ctx(): Context {
    return this as any as Context;
  },
  ValidateError,
  DataError,
  curlWithTracing,
  eggAssert(value: any, message?: string, data?: any) {
    if (value) {
      return;
    }

    throw new ApiError(499, data, message);
  },
  redisKey: (...keys: string[]): string => {
    return keys.join('_');
  },
  result(bizCode?: number | Code, data?: any, message?: string) {
    const codeEnum = {
      ...BIZ_CODE_ENUM,
      ...(this as any).app.config.eggCommon.extCodeEnum,
    };

    bizCode = bizCode || 0;

    if (typeof bizCode !== 'number') {
      this.ctx.body = {
        code: bizCode.code ?? 1, // missing code treat as error
        message: message ?? bizCode.message ?? bizCode.description,
        data,
      };
      return;
    }

    if (data instanceof DataError) {
      const err = data;
      data = data.data;
      if (typeof data === 'object') {
        data._err_type = 'DataError';
      } else {
        data = {
          _err_type: 'StringError',
          message: err.message,
          data,
        };
      }
    } else if (data instanceof Error) {
      data = {
        _err_type: 'Error',
        name: data.name,
        message: data.message,
      };
    }
    this.ctx.body = {
      code: bizCode,
      message:
        message || codeEnum[bizCode].message || codeEnum[bizCode].description,
      data,
    };
  },

  async indirect(
    url: string,
    requestOpts: RequestOptions = {},
    opts: ExtOpts = {}
  ): Promise<Resp> {
    const defaultOpts: RequestOptions = {
      method: 'GET',
      contentType: 'json',
      dataType: 'json',
    };
    try {
      const result = await this.ctx.curl(url, {
        ...defaultOpts,
        ...requestOpts,
      });

      if (result.status === 200 && result.data.code === 0) {
        if (opts.successCallback) {
          return opts.successCallback(result.data);
        }
        return {
          code: 0,
          data: result.data.data,
        };
      } else {
        this.ctx.logger.error(`${opts.loggerPrefix} error: `, url, requestOpts);
        if (opts.errorCallback) {
          return opts.errorCallback(result.data);
        }
        return {
          code: 1,
          data: result.data.data,
        };
      }
    } catch (err) {
      this.ctx.logger.error(
        `${opts.loggerPrefix} unexpected error: `,
        url,
        requestOpts,
        err
      );
      return {
        code: 1,
      };
    }
  },
};
