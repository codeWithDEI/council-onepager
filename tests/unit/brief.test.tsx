import { describe, expect, it } from 'vitest';
import blankExample from '../../examples/blank.json';
import { renderToStaticMarkup } from 'react-dom/server';
import { BriefDocument } from '../../src/components/BriefDocument';
import {
  createBrief,
  formatDate,
  formatMoney,
  readinessNotes,
  safeSourceUrl,
  validateBrief,
} from '../../src/domain/brief';
import {
  MAX_FILE_BYTES,
  parseBrief,
  serializeBrief,
} from '../../src/domain/files';

describe('versioned document boundary', () => {
  it('keeps the checked-in blank example compatible with the application', () => {
    expect(validateBrief(blankExample).id).toBe('blank-template');
  });
  it('round-trips an incomplete draft without inventing dates, costs, or sources', () => {
    const brief = createBrief('test-brief');
    expect(parseBrief(serializeBrief(brief))).toEqual(brief);
    expect(brief.budget.oneOff).toEqual({
      status: 'unknown',
      amountEuros: '',
      note: '',
    });
    expect(brief.sources).toEqual([]);
    expect(brief.provenance.updatedOn).toBe('');
  });
  it.each([
    { schemaVersion: '2.0' },
    { visibility: 'confidential' },
    { editorialState: 'approved' },
    { unexpected: true },
  ])('rejects unsupported contracts: %o', (patch) => {
    expect(() => validateBrief({ ...createBrief(), ...patch })).toThrow();
  });
  it('rejects impossible calendar dates', () => {
    const brief = createBrief();
    brief.meeting.date = '2026-02-30';
    expect(() => validateBrief(brief)).toThrow();
  });
  it('rejects missing source references and duplicate identifiers', () => {
    const brief = createBrief();
    brief.consultations = [
      { id: 'a', body: '', date: '', outcome: '', sourceId: 'missing' },
    ];
    expect(() => validateBrief(brief)).toThrow(/Quelle/);
    brief.consultations = [];
    brief.options.push({ ...brief.options[0]! });
    expect(() => validateBrief(brief)).toThrow(/eindeutig/);
  });
  it('rejects oversized and malformed imports', () => {
    expect(() => parseBrief('a'.repeat(MAX_FILE_BYTES + 1))).toThrow(/256 KB/);
    expect(() => parseBrief('{')).toThrow();
    expect(() => parseBrief('null')).toThrow();
  });
  it('enforces byte size rather than JavaScript character count', () => {
    expect(() => parseBrief('ä'.repeat(MAX_FILE_BYTES / 2 + 1))).toThrow(
      /256 KB/,
    );
  });
  it.each([
    'javascript:alert(1)',
    'data:text/html,test',
    'https://user:secret@example.org/document',
  ])('rejects unsafe source URLs: %s', (url) => {
    const brief = createBrief();
    brief.sources.push({
      id: 'source',
      title: '',
      url,
      locator: '',
      accessedOn: '',
      supports: [],
    });
    expect(() => validateBrief(brief)).toThrow();
    expect(safeSourceUrl(url)).toBeUndefined();
  });
});

describe('financial and editorial meaning', () => {
  it('distinguishes unknown from a documented zero', () => {
    expect(formatMoney({ status: 'unknown', amountEuros: '', note: '' })).toBe(
      'Noch nicht ermittelt',
    );
    expect(
      formatMoney({ status: 'documented', amountEuros: '0', note: '' }),
    ).toContain('0,00');
    expect(
      formatMoney({ status: 'estimated', amountEuros: '1234,56', note: '' }),
    ).toContain('1.234,56');
  });
  it.each(['-1', '1e4', '1.234,50', 'NaN', '0.001', '9999999999999'])(
    'rejects ambiguous or unsupported money: %s',
    (amountEuros) => {
      const brief = createBrief();
      brief.budget.oneOff = { status: 'estimated', amountEuros, note: '' };
      expect(() => validateBrief(brief)).toThrow();
    },
  );
  it('does not allow an unknown cost to carry a numeric value', () => {
    const brief = createBrief();
    expect(() =>
      validateBrief({
        ...brief,
        budget: {
          ...brief.budget,
          oneOff: { status: 'unknown', amountEuros: '0', note: '' },
        },
      }),
    ).toThrow();
  });
  it('reports missing evidence without converting a draft into approval', () => {
    const brief = createBrief();
    expect(readinessNotes(brief).length).toBeGreaterThan(0);
    expect(brief.editorialState).toBe('draft');
  });
  it('formats dates without a time-zone conversion', () => {
    expect(formatDate('2026-09-19')).toBe('19.09.2026');
    expect(formatDate('')).toBe('Offen');
  });
  it('preserves requested funding and the independent coverage assessment', () => {
    const brief = createBrief();
    brief.budget.fundingState = 'requested';
    brief.budget.coverage = 'unsecured';
    const html = renderToStaticMarkup(
      <BriefDocument brief={brief} mode="paper" />,
    );
    expect(html).toContain('Beantragt');
    expect(html).toContain('Nicht gedeckt');
    expect(html).toContain('ARBEITSENTWURF');
  });
  it('renders source text as text, never executable markup', () => {
    const brief = createBrief();
    brief.title = '<img src=x onerror=alert(1)>';
    const html = renderToStaticMarkup(
      <BriefDocument brief={brief} mode="screen" />,
    );
    expect(html).toContain('&lt;img');
    expect(html).not.toContain('<img');
  });
});
