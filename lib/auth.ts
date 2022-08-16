import { Context } from 'egg';

export const splitToken = (
  tokenWithPrefix: string,
  type: string | null = null
) => {
  if (type) {
    return tokenWithPrefix.startsWith(type + ' ')
      ? tokenWithPrefix.replace(type + ' ', '')
      : null;
  }
  return tokenWithPrefix.split(' ')[1] ?? null;
};

/**
 *
 * @param ctx - egg ctx
 * @param type - 指定 token 前缀, 若不匹配则不会返回解析后 token, 为 null 时则表示任何前缀都可以
 * @returns - [rawToken, token]
 */
export const extractToken = (
  ctx: Context,
  type: string | null = null
): [string | null, string | null] => {
  let tokenWithPrefix: string | null = null;

  // get token from header
  if (ctx.headers.authorization) {
    tokenWithPrefix = ctx.headers.authorization;
  }

  // get token from query
  if (ctx.query.token) {
    tokenWithPrefix = ctx.query.token;
  }

  if (ctx.cookies.get('authorization')) {
    tokenWithPrefix = ctx.cookies.get('authorization');
  }

  if (!tokenWithPrefix) {
    return [tokenWithPrefix, null];
  }

  return [tokenWithPrefix, splitToken(tokenWithPrefix, type)];
};
