import mock, { MockApplication } from 'egg-mock';
import { aggregator, withDefaultValue } from '../../lib';

export const delayFn =
  <T>(timeout: number, res: T) =>
  async () => {
    await new Promise((r) => setTimeout(r, timeout));
    return res;
  };

let app: MockApplication;

beforeAll(async () => {
  app = mock.app();
  await app.ready();
});

describe('aggregator', () => {
  it('should works', async () => {
    const [res1, res2] = await aggregator(app.createAnonymousContext(), [
      {
        fn: delayFn(100, 1),
      },
      {
        fn: () => 'x',
      },
    ]);

    expect(res1).toBe(1);
    expect(res2).toBe('x');
  });

  it('fallback', async () => {
    const [res1, res2] = await aggregator(app.createAnonymousContext(), [
      {
        fn: async () => {
          throw new Error('x2');
        },
        fallbackFn: withDefaultValue(1),
      },
      {
        fn: () => {
          throw new Error('x2');
        },
        fallbackFn: withDefaultValue('x'),
      },
    ]);

    expect(res1).toBe(1);
    expect(res2).toBe('x');
  });

  it('without fallback should throw', async () => {
    await expect(
      aggregator(app.createAnonymousContext(), [
        {
          fn: async () => {
            throw new Error('x2');
          },
        },
        {
          fn: delayFn(10, 1),
        },
      ])
    ).rejects.toThrow('x2');
  });

  it('fallback throw should throw', async () => {
    await expect(
      aggregator(app.createAnonymousContext(), [
        {
          fn: async () => {
            throw new Error('x2');
          },
          fallbackFn: () => {
            throw new Error('x3');
          },
        },
        {
          fn: delayFn(10, 1),
        },
      ])
    ).rejects.toThrow('x3');
  });
});
