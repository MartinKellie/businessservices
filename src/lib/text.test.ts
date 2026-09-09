import { describe, expect, it } from 'vitest';
import { normaliseSearchText, stripDiacritics, tokenise } from './text';

describe('stripDiacritics', () => {
  it('removes Spanish accents but keeps letters', () => {
    expect(stripDiacritics('Ferretería Peñón')).toBe('Ferreteria Penon');
    expect(stripDiacritics('agua fría')).toBe('agua fria');
  });
});

describe('normaliseSearchText', () => {
  it('lower-cases, unaccents and collapses whitespace', () => {
    expect(normaliseSearchText('  Bombona   de   AGUA  ')).toBe('bombona de agua');
    expect(normaliseSearchText('Dispensador de Água')).toBe('dispensador de agua');
  });
});

describe('tokenise', () => {
  it('splits into word tokens', () => {
    expect(tokenise('aire-acondicionado, split')).toEqual(['aire', 'acondicionado', 'split']);
  });
});
