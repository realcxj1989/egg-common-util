import { createHash } from 'crypto';
import _ from 'lodash';
import { redirectRequest } from '../..';

const NUMBER: string = '1234567890';

export interface TokenResult {
  userId: string;
  tokenValid: boolean;
}

export default {
  redirectRequest,
  md5: (str: string) => createHash('md5').update(str).digest('hex'),
  getSmsCode: (num: number): string => {
    let smsCode: string = '';
    for (let i = 0; i < num; i++) {
      smsCode += NUMBER.charAt(Math.floor(Math.random() * NUMBER.length));
    }
    return smsCode;
  },
  getRedisStringKey: (...keys: string[]): string => {
    keys.map((i) => {
      if (!_.isString(i)) {
        throw new Error('redis key params must be string.');
      }
    });
    return keys.join('_');
  },
  buildRedisKey: (keys: string[], step: string = ':') =>
    keys.map((s) => s.trim()).join(step),
  randI(min: number, max: number): number {
    return Math.floor(min + Math.random() * (max - min));
  },
  isObjectId: (id: string): boolean => {
    return /^[a-fA-F0-9]{24}$/.test(id);
  },
};
