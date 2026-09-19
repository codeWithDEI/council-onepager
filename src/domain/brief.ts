import { z } from 'zod';

const shortText = z.string().max(160);
const paragraph = z.string().max(700);
const dateOrEmpty = z.union([z.literal(''), z.iso.date()]);
const identifier = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/);
const euroAmount = z.string().regex(/^(0|[1-9]\d{0,11})([.,]\d{1,2})?$/);

export const moneySchema = z.discriminatedUnion('status', [
  z.strictObject({
    status: z.literal('unknown'),
    amountEuros: z.literal(''),
    note: shortText,
  }),
  z.strictObject({
    status: z.literal('estimated'),
    amountEuros: euroAmount,
    note: shortText,
  }),
  z.strictObject({
    status: z.literal('documented'),
    amountEuros: euroAmount,
    note: shortText,
  }),
]);

export const sourceSections = [
  'decision',
  'context',
  'options',
  'budget',
  'consultations',
  'nextStep',
] as const;
export const sourceSchema = z.strictObject({
  id: identifier,
  title: shortText,
  url: z.union([z.literal(''), z.url({ protocol: /^https?$/ }).max(2048)]),
  locator: shortText,
  accessedOn: dateOrEmpty,
  supports: z.array(z.enum(sourceSections)).max(6),
});

export const briefSchema = z.strictObject({
  schemaVersion: z.literal('1.0'),
  id: identifier,
  visibility: z.literal('public'),
  editorialState: z.literal('draft'),
  title: shortText,
  meeting: z.strictObject({
    municipality: shortText,
    body: shortText,
    date: dateOrEmpty,
    agendaItem: z.string().max(40),
    proposalReference: shortText,
  }),
  provenance: z.strictObject({
    preparedBy: shortText,
    version: z.string().max(40),
    updatedOn: dateOrEmpty,
  }),
  decision: z.strictObject({
    question: z.string().max(300),
    proposal: paragraph,
    wording: z.enum(['summary', 'verbatim']),
  }),
  context: z.strictObject({
    situation: paragraph,
    objective: z.string().max(300),
    affectedGroups: z.string().max(300),
  }),
  options: z
    .array(
      z.strictObject({
        id: identifier,
        label: shortText,
        benefits: z.string().max(400),
        drawbacks: z.string().max(400),
        uncertainties: z.string().max(300),
      }),
    )
    .max(4),
  budget: z.strictObject({
    oneOff: moneySchema,
    annual: moneySchema,
    funding: moneySchema,
    ownContribution: moneySchema,
    fundingState: z.enum([
      'unknown',
      'not-applicable',
      'planned',
      'requested',
      'approved',
    ]),
    coverage: z.enum([
      'unknown',
      'not-required',
      'secured',
      'partial',
      'unsecured',
    ]),
    year: z.union([z.literal(''), z.string().regex(/^\d{4}$/)]),
    product: shortText,
    costType: z.enum(['unknown', 'investment', 'operating', 'mixed', 'none']),
    personnelAndFollowUp: z.string().max(400),
  }),
  consultations: z
    .array(
      z.strictObject({
        id: identifier,
        body: shortText,
        date: dateOrEmpty,
        outcome: z.string().max(400),
        sourceId: z.union([z.literal(''), identifier]),
      }),
    )
    .max(6),
  nextStep: z.strictObject({
    action: z.string().max(400),
    responsible: shortText,
    targetDate: dateOrEmpty,
    reporting: shortText,
  }),
  sources: z.array(sourceSchema).max(12),
});

export type Brief = z.infer<typeof briefSchema>;
export type Money = z.infer<typeof moneySchema>;
export type Source = z.infer<typeof sourceSchema>;
export type SourceSection = (typeof sourceSections)[number];

export function createBrief(id: string = crypto.randomUUID()): Brief {
  const unknown = (): Money => ({
    status: 'unknown',
    amountEuros: '',
    note: '',
  });
  return {
    schemaVersion: '1.0',
    id,
    visibility: 'public',
    editorialState: 'draft',
    title: '',
    meeting: {
      municipality: '',
      body: '',
      date: '',
      agendaItem: '',
      proposalReference: '',
    },
    provenance: { preparedBy: '', version: '1', updatedOn: '' },
    decision: { question: '', proposal: '', wording: 'summary' },
    context: { situation: '', objective: '', affectedGroups: '' },
    options: [
      {
        id: 'proposal',
        label: 'Vorgeschlagene Maßnahme',
        benefits: '',
        drawbacks: '',
        uncertainties: '',
      },
      {
        id: 'status-quo',
        label: 'Bisherigen Zustand fortführen',
        benefits: '',
        drawbacks: '',
        uncertainties: '',
      },
    ],
    budget: {
      oneOff: unknown(),
      annual: unknown(),
      funding: unknown(),
      ownContribution: unknown(),
      fundingState: 'unknown',
      coverage: 'unknown',
      year: '',
      product: '',
      costType: 'unknown',
      personnelAndFollowUp: '',
    },
    consultations: [],
    nextStep: { action: '', responsible: '', targetDate: '', reporting: '' },
    sources: [],
  };
}

export function validateBrief(input: unknown): Brief {
  const brief = briefSchema.parse(input);
  for (const group of [brief.sources, brief.options, brief.consultations]) {
    if (new Set(group.map((item) => item.id)).size !== group.length) {
      throw new Error('Kennungen müssen innerhalb einer Liste eindeutig sein.');
    }
  }
  for (const consultation of brief.consultations) {
    if (
      consultation.sourceId &&
      !brief.sources.some((source) => source.id === consultation.sourceId)
    ) {
      throw new Error(
        'Eine Beratung verweist auf eine nicht vorhandene Quelle.',
      );
    }
  }
  for (const source of brief.sources) {
    if (!source.url) continue;
    const url = new URL(source.url);
    if (url.username || url.password)
      throw new Error('Quellenlinks dürfen keine Zugangsdaten enthalten.');
  }
  return brief;
}

export function readinessNotes(brief: Brief): string[] {
  const notes: string[] = [];
  if (
    !brief.title.trim() ||
    !brief.decision.question.trim() ||
    !brief.decision.proposal.trim()
  )
    notes.push('Titel, Entscheidungsfrage und Beschlussvorschlag ergänzen.');
  if (
    !brief.meeting.body.trim() ||
    !brief.meeting.date ||
    !brief.meeting.proposalReference.trim()
  )
    notes.push('Gremium, Sitzungstermin und Vorlagenreferenz ergänzen.');
  if (!brief.provenance.preparedBy.trim() || !brief.provenance.updatedOn)
    notes.push('Verantwortliche Person und Bearbeitungsstand ergänzen.');
  const supported = new Set(
    brief.sources
      .filter(
        (source) =>
          source.title.trim() &&
          source.url &&
          source.locator.trim() &&
          source.accessedOn,
      )
      .flatMap((source) => source.supports),
  );
  const missing = sourceSections.filter((section) => !supported.has(section));
  if (missing.length)
    notes.push(
      'Vollständige Quellen mit Fundstelle und tatsächlichem Abrufdatum zuordnen.',
    );
  if (
    brief.budget.oneOff.status === 'unknown' ||
    brief.budget.annual.status === 'unknown' ||
    brief.budget.coverage === 'unknown'
  )
    notes.push('Kosten oder Haushaltsdeckung sind noch ungeklärt.');
  if (
    brief.options.some(
      (option) =>
        !option.benefits.trim() &&
        !option.drawbacks.trim() &&
        !option.uncertainties.trim(),
    )
  )
    notes.push(
      'Auswirkungen der Handlungsoptionen ergänzen oder die offene Prüfung benennen.',
    );
  return notes;
}

export function formatMoney(money: Money): string {
  if (money.status === 'unknown') return 'Noch nicht ermittelt';
  if (!euroAmount.safeParse(money.amountEuros).success) return 'Betrag prüfen';
  const value = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(money.amountEuros.replace(',', '.')));
  return `${value} (${money.status === 'estimated' ? 'geschätzt' : 'belegt'})`;
}

export function formatDate(date: string): string {
  if (!date || !z.iso.date().safeParse(date).success) return 'Offen';
  return date.split('-').reverse().join('.');
}

export function safeSourceUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) && !url.username && !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
