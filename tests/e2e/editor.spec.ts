import { expect, test } from '@playwright/test';
import { createBrief } from '../../src/domain/brief';
import { readFile } from 'node:fs/promises';

test('edits a draft, downloads JSON and restores it', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await page.getByLabel('Titel', { exact: true }).fill('Fiktives Testvorhaben');
  await page
    .getByLabel('Was soll heute entschieden werden?')
    .fill('Soll die fiktive Variante geprüft werden?');
  await expect(
    page.getByRole('article', { name: 'Beamer-Entwurf' }),
  ).toContainText('Fiktives Testvorhaben');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'JSON speichern' }).click();
  const download = await downloadPromise;
  const file = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(file.title).toBe('Fiktives Testvorhaben');
  expect(file.budget.oneOff.status).toBe('unknown');
  await page.getByRole('button', { name: 'Neue Übersicht' }).click();
  await expect(page.getByLabel('Titel', { exact: true })).toHaveValue('');
  await page.getByLabel('JSON-Datei auswählen').setInputFiles({
    name: 'test.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(file)),
  });
  await expect(page.getByLabel('Titel', { exact: true })).toHaveValue(
    'Fiktives Testvorhaben',
  );
  await page.getByRole('button', { name: 'A4', exact: true }).click();
  await expect(page.getByRole('article', { name: 'A4-Entwurf' })).toContainText(
    'ARBEITSENTWURF',
  );
  await page.screenshot({
    path: testInfo.outputPath('editor.png'),
    fullPage: true,
  });
});

test('rejects incompatible imports without losing work and confirms replacement', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('Titel', { exact: true }).fill('Behalten');
  await page.getByLabel('JSON-Datei auswählen').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"schemaVersion":"99"}'),
  });
  await expect(page.getByRole('alert')).toContainText('Datei nicht geöffnet');
  await expect(page.getByLabel('Titel', { exact: true })).toHaveValue(
    'Behalten',
  );
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Neue Übersicht' }).click();
  await expect(page.getByLabel('Titel', { exact: true })).toHaveValue(
    'Behalten',
  );
});

test('adds evidence, preserves it through download, and uses safe links', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByText('07 · Quellen & Nachweise', { exact: true }).click();
  await page.getByRole('button', { name: 'Quelle ergänzen' }).click();
  await page
    .getByLabel('Titel · Quelle 1', { exact: true })
    .fill('Fiktive Testquelle');
  await page.getByLabel('URL · Quelle 1').fill('https://example.org/test');
  await page.getByLabel('Fundstelle · Quelle 1').fill('Nur ein Softwaretest');
  await page
    .getByRole('checkbox', { name: 'Entscheidung', exact: true })
    .check();
  await expect(
    page.getByRole('article', { name: 'Beamer-Entwurf' }),
  ).toContainText('[1]');
  await expect(
    page.getByRole('link', { name: 'Fiktive Testquelle' }),
  ).toHaveAttribute('rel', 'noopener noreferrer');
  await page.getByLabel('URL · Quelle 1').fill('javascript:alert(1)');
  await expect(
    page.getByRole('button', { name: 'JSON speichern' }),
  ).toBeDisabled();
  await expect(
    page.getByRole('link', { name: 'Fiktive Testquelle' }),
  ).toHaveCount(0);
});

test('does not overflow the viewport or send editorial input to the network', async ({
  page,
}) => {
  const requests: string[] = [];
  await page.goto('/');
  page.on('request', (request) => requests.push(request.url()));
  await page.getByLabel('Titel', { exact: true }).fill('Lokaler Eingabetest');
  await page.getByRole('button', { name: 'Große Ansicht' }).click();
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
  expect(requests).toEqual([]);
  await expect(
    page.getByRole('button', { name: 'Zurück zur Bearbeitung' }),
  ).toBeVisible();
});

test('blocks PDF output when the full A4 document overflows', async ({
  page,
}) => {
  const brief = createBrief('long-draft');
  brief.context.situation = 'Langer Inhalt. '.repeat(45);
  brief.decision.proposal = 'Langer Vorschlag. '.repeat(38);
  brief.options = Array.from({ length: 4 }, (_, index) => ({
    id: `option-${index}`,
    label: `Option ${index}`,
    benefits: 'Nutzen. '.repeat(45),
    drawbacks: 'Risiko. '.repeat(45),
    uncertainties: 'Offen. '.repeat(40),
  }));
  await page.goto('/');
  await page.getByLabel('JSON-Datei auswählen').setInputFiles({
    name: 'long.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(brief)),
  });
  await expect(page.getByRole('alert')).toContainText(
    'passt nicht auf eine A4-Seite',
  );
  await expect(
    page.getByRole('button', { name: 'Drucken / PDF' }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'JSON speichern' }),
  ).toBeEnabled();
});

test('prints only the A4 document and produces a PDF', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'PDF generation is checked on desktop Chromium.',
  );
  await page.goto('/');
  const brief = createBrief('print-test');
  brief.title = 'FIKTIVES TESTBEISPIEL: Varianten für einen Treffpunkt';
  brief.meeting = {
    municipality: 'Beispielgemeinde (fiktiv)',
    body: 'Rat (Test)',
    date: '2026-09-19',
    agendaItem: '1',
    proposalReference: 'TEST-01',
  };
  brief.provenance = {
    preparedBy: 'Softwaretest',
    version: '1',
    updatedOn: '2026-09-19',
  };
  brief.decision.question =
    'Soll ein unverbindlicher Variantenvergleich erstellt werden?';
  brief.decision.proposal =
    'Die Verwaltung soll zwei Varianten mit Kosten und Nutzungsmöglichkeiten gegenüberstellen. Dies ist ein fiktiver Testtext, kein tatsächlicher Beschluss.';
  brief.context = {
    situation:
      'Dieses vollständig erfundene Beispiel prüft die Lesbarkeit eines ausgefüllten Dokuments.',
    objective:
      'Eine nachvollziehbare Grundlage für eine spätere Beratung schaffen.',
    affectedGroups: 'Fiktive Nutzergruppen und ein fiktiver Standort.',
  };
  brief.options[0] = {
    id: 'study',
    label: 'Variantenvergleich',
    benefits: 'Vergleichbare Informationen.',
    drawbacks: 'Zusätzlicher Bearbeitungsaufwand.',
    uncertainties: 'Umfang und Kosten müssen geprüft werden.',
  };
  brief.options[1] = {
    id: 'wait',
    label: 'Bisherigen Zustand fortführen',
    benefits: 'Zunächst kein neuer Prüfauftrag.',
    drawbacks: 'Informationsbedarf bleibt offen.',
    uncertainties: 'Spätere Auswirkungen sind ungeklärt.',
  };
  brief.budget.oneOff = {
    status: 'estimated',
    amountEuros: '1500',
    note: 'Erfundener Testbetrag, keine reale Kostenschätzung.',
  };
  brief.nextStep = {
    action: 'Bei Annahme: Prüfauftrag konkretisieren.',
    responsible: 'Fiktive Verwaltung',
    targetDate: '',
    reporting: 'Erneute Beratung nach Vorlage der Ergebnisse.',
  };
  brief.sources = [
    {
      id: 'demo-source',
      title: 'Fiktive Testreferenz',
      url: 'https://example.org/',
      locator: 'Keine reale Sachquelle; nur Layouttest.',
      accessedOn: '',
      supports: ['decision', 'context', 'options', 'budget', 'nextStep'],
    },
  ];
  await page.getByLabel('JSON-Datei auswählen').setInputFiles({
    name: 'print-test.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(brief)),
  });
  await page.screenshot({
    path: testInfo.outputPath('editor-desktop.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1600, height: 1200 });
  await page.getByRole('button', { name: 'Große Ansicht' }).click();
  await page.screenshot({
    path: testInfo.outputPath('presentation.png'),
    fullPage: true,
  });
  await expect(
    page.getByRole('button', { name: 'Drucken / PDF' }),
  ).toBeEnabled();
  await page.emulateMedia({ media: 'print' });
  await expect(
    page.getByRole('navigation', { name: 'Dateiaktionen' }),
  ).toBeHidden();
  const pdf = await page.pdf({
    path: testInfo.outputPath('brief.pdf'),
    preferCSSPageSize: true,
    printBackground: true,
  });
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  await testInfo.attach('brief.pdf', {
    body: pdf,
    contentType: 'application/pdf',
  });
});
