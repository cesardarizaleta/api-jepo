import { validate } from 'class-validator';
import { IsCedula } from './cedula.validator';
import { normalizeCedula } from '../utils/cedula.util';

class TestDto {
  @IsCedula()
  cedula: any;
}

describe('IsCedula validator', () => {
  it('accepts valid cedulas', async () => {
    const valids = ['V-12345678', '12345678', 'v1234567', 'E 00123456', '0012345'];
    for (const v of valids) {
      const dto = new TestDto();
      dto.cedula = v;
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('rejects invalid cedulas', async () => {
    const invalids = ['', null, undefined, 'ABC123', '12-34', '123'];
    for (const v of invalids) {
      const dto = new TestDto();
      dto.cedula = v;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    }
  });

  it('normalizes cedula properly', () => {
    expect(normalizeCedula('V-12.345.678')).toBe('12345678');
    expect(normalizeCedula(' e 0012345')).toBe('0012345');
  });
});
