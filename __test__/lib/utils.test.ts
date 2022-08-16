import { parsePagnation, parsePagnationOffsetLimit } from '../../lib/util';

test.each([
  [
    {
      current: '1',
      pageSize: '9',
    },
    { skip: 0, limit: 9 },
  ],
  [
    {
      current: '-1',
      pageSize: '-9',
    },
    { skip: 0, limit: 1 },
  ],
  [
    {
      current: 'sss',
      pageSize: 'a',
    },
    { skip: 0, limit: 100 },
  ],
  [{}, { skip: 0, limit: 100 }],
])('parsePagnation %p', (a, b) => {
  expect(parsePagnation(a)).toStrictEqual(b);
});

test.each([
  [
    {
      offset: '1',
      limit: '9',
    },
    { skip: 1, limit: 9 },
  ],
  [
    {
      offset: '-1',
      limit: '-9',
    },
    { skip: 0, limit: 1 },
  ],
  [
    {
      offset: 'xx',
      limit: 'xx',
    },
    { skip: 0, limit: 100 },
  ],
  [{}, { skip: 0, limit: 100 }],
])('parsePagnationOffsetLimit %p', (a, b) => {
  expect(parsePagnationOffsetLimit(a)).toStrictEqual(b);
});
