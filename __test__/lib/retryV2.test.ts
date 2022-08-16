import mock, { MockApplication } from 'egg-mock';
import { runWithRetryV2 } from '../../lib';

let app: MockApplication;

beforeAll(async () => {
  app = mock.app();
  await app.ready();
});

it('runWithRetryV2', async () => {
  const mockErrFn = (n: number) => {
    let i = 0;
    return async () => {
      if (i < n) {
        i++;
        return Promise.reject('mock error');
      }
      return Promise.resolve('ok');
    };
  };

  const ctx = app.mockContext();

  const res = await runWithRetryV2(ctx, mockErrFn(2), 'test');
  expect(res).toEqual('ok');

  await expect(runWithRetryV2(ctx, mockErrFn(4), 'test')).rejects.toEqual(
    'mock error'
  );
}, 20000);
