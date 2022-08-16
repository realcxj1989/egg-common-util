import _ from 'lodash';

export const requiredEnv = (key: string): string => {
  const val = process.env[key];
  if (!val) {
    throw new Error(`env ${key} is required`);
  }
  return val;
};

export const str2Bool = (
  val: string,
  trueVals: string[] = ['true', '1']
): boolean => {
  return val && trueVals.includes(val);
};

export const str2Array = (val: string, step: string = ','): string[] => {
  if (!val) {
    return [];
  }
  return val.split(step).map((s) => s.trim());
};

export const str2Int = (val: string): number => {
  const num = parseInt(val, 10);
  if (isNaN(num)) {
    throw new Error(`val ${val} is not a int number`);
  }
  return num;
};

export const str2Float = (val: string): number => {
  const num = parseFloat(val);
  if (isNaN(num)) {
    throw new Error(`val ${val} is not a float number`);
  }
  return num;
};

export const str2Date = (val: string) => {
  if (!val) {
    throw new Error(`val ${val} is empty`);
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    throw new Error(`val ${val} is an invalid date`);
  }
  return d;
};

export const loadConfigFromEnv = <T>(
  prefix: string,
  paths: string[],
  required?: string[]
): T => {
  if (!required) {
    required = paths;
  }

  const res: any = {};

  for (const path of paths) {
    const envKey = `${prefix}_${path.replace(/\./g, '_')}`.toUpperCase();
    const val = process.env[envKey];
    if (required.includes(path) && val === undefined) {
      throw new Error(`env ${envKey} is required`);
    }
    _.set(res, path, val);
  }

  return res as T;
};
