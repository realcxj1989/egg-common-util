import { SimpleJWT } from '../../lib/jwt';

interface Payload {
  uid: string;
}

it('should works well', async () => {
  const sj1 = new SimpleJWT<Payload>({
    secret: 'test1',
    signOptions: {
      expiresIn: '1d',
    },
  });

  const sj2 = new SimpleJWT<Payload>({
    secret: 'test2',
    signOptions: {
      expiresIn: '1d',
    },
  });

  const payload1: Payload = { uid: 'xxx1' };

  const token1 = await sj1.sign(payload1);
  expect(await sj1.verify(token1)).toMatchObject(payload1);

  await expect(() => sj2.verify(token1)).rejects.toThrow();
});
