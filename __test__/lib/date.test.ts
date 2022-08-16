import { isValidSchedule } from '../../lib/date';

it('should works', () => {
  expect(isValidSchedule([])).toBeTruthy();
  expect(isValidSchedule([['09:00', '10:00']])).toBeTruthy();
  expect(
    isValidSchedule([
      ['19:30', '20:00'],
      ['09:00', '10:01'],
      ['10:01', '10:30'],
    ])
  ).toBeTruthy();
  expect(
    isValidSchedule([
      ['19:30', '20:00'],
      ['09:00', '10:01'],
      ['10:00', '10:30'],
    ])
  ).toBeFalsy();
});
