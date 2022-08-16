import { splitToken } from '../../lib/auth';

it('splitToken', () => {
  expect(splitToken('aa test', null)).toEqual('test');
  expect(splitToken('token test', null)).toEqual('test');
  expect(splitToken('aa test', 'aa')).toEqual('test');
  expect(splitToken('aa test', 'bb')).toBeNull();
  expect(splitToken('aa', null)).toBeNull();
});
