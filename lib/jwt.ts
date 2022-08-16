import {
  Secret,
  GetPublicKeyOrSecret,
  VerifyOptions,
  verify as verifyCB,
  SignOptions,
  sign as signCB,
} from 'jsonwebtoken';

export function verify<T = any>(
  token: string,
  secretOrPublicKey: Secret | GetPublicKeyOrSecret
): Promise<T>;
export function verify<T = any>(
  token: string,
  secretOrPublicKey: Secret | GetPublicKeyOrSecret,
  options?: VerifyOptions & { complete: true }
): Promise<T>;
export function verify<T = any>(
  token: string,
  secretOrPublicKey: Secret | GetPublicKeyOrSecret,
  options?: VerifyOptions
): Promise<T>;
export function verify<T = any>(
  token: any,
  secretOrPublicKey: any,
  options?: any
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    verifyCB(token, secretOrPublicKey, options, (err, resp) => {
      if (err) {
        reject(err);
      } else {
        resolve(resp as unknown as T);
      }
    });
  });
}

export function sign<T extends object = any>(
  payload: string | Buffer | T,
  secretOrPrivateKey: Secret
): Promise<string>;
export function sign<T extends object = any>(
  payload: string | Buffer | T,
  secretOrPrivateKey: Secret,
  options?: SignOptions
): Promise<string>;
export function sign<T extends object = any>(
  payload: string | Buffer | T,
  secretOrPrivateKey: Secret,
  options?: SignOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    signCB(payload, secretOrPrivateKey, options, (err, resp) => {
      if (err) {
        reject(err);
      } else {
        resolve(resp);
      }
    });
  });
}

export interface SimpleJWTOption {
  secret: string;
  signOptions?: SignOptions;
}

export class SimpleJWT<T extends object> {
  constructor(private readonly options: SimpleJWTOption) {}

  async sign(payload: T) {
    return sign<T>(payload, this.options.secret, this.options.signOptions);
  }

  async verify(token: string) {
    return verify<T>(token, this.options.secret);
  }
}
