import { ApiError } from './http';

export const parseIntPipe = (
  value: string,
  errMessage?: string,
  errData?: any
) => {
  const isNumeric =
    ['string', 'number'].includes(typeof value) &&
    !isNaN(parseFloat(value)) &&
    isFinite(value as any);
  if (!isNumeric) {
    throw new ApiError(
      499,
      errData,
      errMessage ?? 'Validation failed (numeric string is expected)'
    );
  }
  return parseInt(value, 10);
};

export const parseFloatPipe = (
  value: string,
  errMessage?: string,
  errData?: any
) => {
  const isNumeric =
    ['string', 'number'].includes(typeof value) &&
    !isNaN(parseFloat(value)) &&
    isFinite(value as any);
  if (!isNumeric) {
    throw new ApiError(
      499,
      errData,
      errMessage ?? 'Validation failed (numeric string is expected)'
    );
  }
  return parseFloat(value);
};

export const parseBoolPipe = (
  value: string | boolean,
  errMessage?: string,
  errData?: any
) => {
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  throw new ApiError(
    499,
    errData,
    errMessage ?? 'Validation failed (boolean string is expected)'
  );
};

export const parseEnumPipe = <T = any>(
  enumType: T,
  value: any,
  errMessage?: string,
  errData?: any
) => {
  const enumValues = Object.keys(enumType).map(
    (item) => (enumType as any)[item]
  );
  const isEnum = enumValues.indexOf(value) >= 0;

  if (!isEnum) {
    throw new ApiError(
      499,
      errData,
      errMessage ?? 'Validation failed (enum string is expected)'
    );
  }

  return value;
};
