import { ApiError } from '../../lib/http';
import {
  parseIntPipe,
  parseFloatPipe,
  parseBoolPipe,
  parseEnumPipe,
} from '../../lib/pipes';

describe('parseIntPipe', () => {
  it('should return number', () => {
    expect(parseIntPipe('13')).toBe(13);
  });

  it('should throw', () => {
    expect(() => parseIntPipe('13abc')).toThrowError(ApiError);
  });
});

describe('parseFloatPipe', () => {
  it('should return number', () => {
    expect(parseFloatPipe('13.33')).toBe(13.33);
  });

  it('should throw', () => {
    expect(() => parseFloatPipe('13.322abc')).toThrowError(ApiError);
  });
});

describe('parseBoolPipe', () => {
  it('should return boolean', () => {
    expect(parseBoolPipe('true')).toBe(true);
    expect(parseBoolPipe(true)).toBe(true);
    expect(parseBoolPipe('false')).toBe(false);
    expect(parseBoolPipe(false)).toBe(false);
  });

  it('should throw', () => {
    expect(() => parseBoolPipe('13.322abc')).toThrowError(ApiError);
  });
});

describe('parseEnumPipe', () => {
  enum Direction {
    Up = 'UP',
  }

  enum Test {
    A = 1,
  }

  it('should return boolean', () => {
    expect(parseEnumPipe(Direction, 'UP')).toBe(Direction.Up);
    expect(parseEnumPipe(Test, 1)).toBe(Test.A);
  });

  it('should throw', () => {
    expect(() => parseEnumPipe(Direction, '13.322abc')).toThrowError(ApiError);
  });
});
