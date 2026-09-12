import { describe, expect, it } from 'vitest';
import { parseCsv, toCsv } from './csv';

describe('parseCsv', () => {
  it('parses a simple grid', () => {
    expect(parseCsv('a,b\n1,2\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('handles quoted fields with commas, newlines and escaped quotes', () => {
    const csv = 'name,note\n"Ferretería, S.A.","Dice ""hola""\nsegunda línea"\n';
    expect(parseCsv(csv)).toEqual([
      ['name', 'note'],
      ['Ferretería, S.A.', 'Dice "hola"\nsegunda línea'],
    ]);
  });

  it('handles a file with no trailing newline', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
});

describe('toCsv', () => {
  it('quotes fields that need it and round-trips', () => {
    const rows = [
      ['name', 'note'],
      ['Ferretería, S.A.', 'Dice "hola"'],
    ];
    const csv = toCsv(rows);
    expect(csv).toContain('"Ferretería, S.A."');
    expect(parseCsv(csv)).toEqual(rows);
  });
});
