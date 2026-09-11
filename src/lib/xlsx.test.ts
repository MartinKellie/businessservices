import { describe, expect, it } from 'vitest';
import { parseXlsx, toXlsxBuffer } from './xlsx';

describe('xlsx round-trip', () => {
  it('writes and reads back a grid of strings', async () => {
    const grid = [
      ['name', 'note'],
      ['Ferretería Peñón', 'Dice "hola"'],
      ['AguaFría', ''],
    ];
    const buffer = await toXlsxBuffer(grid);
    const parsed = await parseXlsx(buffer);
    expect(parsed).toEqual(grid);
  });
});
