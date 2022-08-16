import {
  loadConfigFromEnv,
  requiredEnv,
  str2Array,
  str2Bool,
  str2Date,
  str2Float,
  str2Int,
} from '../../lib/env';

it('test requiredEnv', () => {
  expect(() => requiredEnv('notExists')).toThrowError(
    new Error('env notExists is required')
  );
  process.env.notExists = '1';
  expect(() => requiredEnv('notExists')).not.toThrow();
  delete process.env.notExists;
});

it('test str2Bool', () => {
  expect(str2Bool('1')).toBeTruthy();
  expect(str2Bool('true')).toBeTruthy();
  expect(str2Bool('0')).toBeFalsy();

  expect(str2Bool('t', ['t'])).toBeTruthy();
});

it('test str2Array', () => {
  expect(str2Array(null)).toStrictEqual([]);
  expect(str2Array('1,2')).toStrictEqual(['1', '2']);
  expect(str2Array('1, 2')).toStrictEqual(['1', '2']);

  expect(str2Array('1|2', '|')).toStrictEqual(['1', '2']);
});

it('test str2Int', () => {
  expect(str2Int('10.1')).toBe(10);
  expect(() => str2Int('a')).toThrowError(/is not a int number/);
});

it('test str2Float', () => {
  expect(str2Float('10.1')).toBe(10.1);
  expect(() => str2Float('a')).toThrowError(/is not a float number/);
});

it('test str2Date', () => {
  expect(() => str2Date(null)).toThrowError(/is empty/);
  expect(str2Date('2020-09-20')).toStrictEqual(new Date(1600560000000));
  expect(() => str2Date('2020-13-20')).toThrowError(/is an invalid date/);
});

it('test loadConfigFromEnv', () => {
  const prefix = 'test';
  interface Config {
    addr: string;
    password?: string;
    sub: {
      test: string;
    };
  }

  expect(() =>
    loadConfigFromEnv<Config>(prefix, ['addr', 'password', 'sub.test'])
  ).toThrow();
  expect(
    loadConfigFromEnv<Config>(prefix, ['addr', 'password', 'sub.test'], [])
  ).toEqual({
    addr: undefined,
    password: undefined,
    sub: {
      test: undefined,
    },
  });

  process.env[`TEST_ADDR`] = 'test_addr';
  process.env[`TEST_PASSWORD`] = 'test_password';
  process.env[`TEST_SUB_TEST`] = 'test_sub_test';

  expect(
    loadConfigFromEnv<Config>(prefix, ['addr', 'password', 'sub.test'])
  ).toEqual({
    addr: 'test_addr',
    password: 'test_password',
    sub: {
      test: 'test_sub_test',
    },
  });
});
