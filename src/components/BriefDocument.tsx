import {
  formatDate,
  formatMoney,
  safeSourceUrl,
  type Brief,
  type SourceSection,
} from '../domain/brief';
import {
  coverageLabels,
  costTypeLabels,
  fundingLabels,
} from '../domain/labels';

const text = (value: string) => value.trim() || 'Noch offen';

export function BriefDocument({
  brief,
  mode,
}: {
  brief: Brief;
  mode: 'screen' | 'paper';
}) {
  const cite = (section: SourceSection) =>
    brief.sources
      .flatMap((source, index) =>
        source.supports.includes(section) ? [`[${index + 1}]`] : [],
      )
      .join(' ');
  return (
    <article
      className={`brief-sheet brief-sheet--${mode}`}
      aria-label={mode === 'paper' ? 'A4-Entwurf' : 'Beamer-Entwurf'}
    >
      <header className="document-header">
        <div className="document-eyebrow">
          <span>ENTSCHEIDUNGSÜBERSICHT</span>
          <span>ÖFFENTLICH · ARBEITSENTWURF</span>
        </div>
        <h1>{brief.title.trim() || 'Titel der Entscheidung'}</h1>
        <p>
          {text(brief.meeting.municipality)} · {text(brief.meeting.body)} ·{' '}
          {formatDate(brief.meeting.date)} · TOP{' '}
          {text(brief.meeting.agendaItem)}
        </p>
        <p>
          Vorlage: {text(brief.meeting.proposalReference)} · Version{' '}
          {text(brief.provenance.version)} · Stand{' '}
          {formatDate(brief.provenance.updatedOn)}
        </p>
      </header>
      <section className="decision-block">
        <h2>
          Heute zu entscheiden{' '}
          <span className="citations">{cite('decision')}</span>
        </h2>
        <p className="decision-question">{text(brief.decision.question)}</p>
        <p>
          <strong>
            {brief.decision.wording === 'summary'
              ? 'Beschlussvorschlag · Kurzfassung'
              : 'Beschlussvorschlag · Wortlaut laut Quelle'}
            :
          </strong>{' '}
          {text(brief.decision.proposal)}
        </p>
      </section>
      <div className="document-grid">
        <section>
          <h2>
            Ausgangslage &amp; Ziel{' '}
            <span className="citations">{cite('context')}</span>
          </h2>
          <p>{text(brief.context.situation)}</p>
          <p>
            <strong>Ziel:</strong> {text(brief.context.objective)}
          </p>
          {(mode === 'paper' || brief.context.affectedGroups.trim()) && (
            <p>
              <strong>Betroffen:</strong> {text(brief.context.affectedGroups)}
            </p>
          )}
        </section>
        <section>
          <h2>
            Kosten &amp; Haushalt{' '}
            <span className="citations">{cite('budget')}</span>
          </h2>
          <dl className="budget-list">
            <div>
              <dt>Einmalig</dt>
              <dd>{formatMoney(brief.budget.oneOff)}</dd>
            </div>
            <div>
              <dt>Jährlich</dt>
              <dd>{formatMoney(brief.budget.annual)}</dd>
            </div>
            <div>
              <dt>Förderung</dt>
              <dd>{formatMoney(brief.budget.funding)}</dd>
            </div>
            <div>
              <dt>Eigenanteil</dt>
              <dd>{formatMoney(brief.budget.ownContribution)}</dd>
            </div>
          </dl>
          <p>
            <strong>Förderstatus:</strong>{' '}
            {fundingLabels[brief.budget.fundingState]} ·{' '}
            <strong>Deckung:</strong> {coverageLabels[brief.budget.coverage]}
          </p>
          <>
            {mode === 'paper' && (
              <p>
                {costTypeLabels[brief.budget.costType]} · Haushaltsjahr{' '}
                {text(brief.budget.year)} · Produkt / Maßnahme:{' '}
                {text(brief.budget.product)}
              </p>
            )}
            {(['oneOff', 'annual', 'funding', 'ownContribution'] as const).map(
              (key) =>
                brief.budget[key].note && (
                  <p key={key}>
                    <strong>
                      {
                        {
                          oneOff: 'Einmalig',
                          annual: 'Jährlich',
                          funding: 'Förderung',
                          ownContribution: 'Eigenanteil',
                        }[key]
                      }
                      :
                    </strong>{' '}
                    {brief.budget[key].note}
                  </p>
                ),
            )}
            <p>
              <strong>Personal / Folgekosten:</strong>{' '}
              {text(brief.budget.personnelAndFollowUp)}
            </p>
          </>
        </section>
        <section>
          <h2>
            Optionen &amp; Folgen{' '}
            <span className="citations">{cite('options')}</span>
          </h2>
          {brief.options.length ? (
            brief.options.map((option) => (
              <div className="option" key={option.id}>
                <h3>{text(option.label)}</h3>
                <p>
                  <strong>Nutzen:</strong> {text(option.benefits)}
                </p>
                <p>
                  <strong>Nachteile:</strong> {text(option.drawbacks)}
                </p>
                <p>
                  <strong>Offen:</strong> {text(option.uncertainties)}
                </p>
              </div>
            ))
          ) : (
            <p>Keine Optionen erfasst.</p>
          )}
        </section>
        <section className="consultation-section">
          <div>
            <h2>
              Beratungsweg{' '}
              <span className="citations">{cite('consultations')}</span>
            </h2>
            {brief.consultations.length ? (
              brief.consultations.map((item) => (
                <p key={item.id}>
                  <strong>
                    {text(item.body)} · {formatDate(item.date)}:
                  </strong>{' '}
                  {text(item.outcome)}{' '}
                  {item.sourceId &&
                    `[${brief.sources.findIndex((source) => source.id === item.sourceId) + 1}]`}
                </p>
              ))
            ) : (
              <p>Noch keine Beratung dokumentiert.</p>
            )}
          </div>
          <div>
            <h2 className="next-step-heading">
              Nächster Schritt bei Annahme{' '}
              <span className="citations">{cite('nextStep')}</span>
            </h2>
            <p>{text(brief.nextStep.action)}</p>
            <p>
              {text(brief.nextStep.responsible)} · Zieltermin:{' '}
              {formatDate(brief.nextStep.targetDate)}
            </p>
            {(mode === 'paper' || brief.nextStep.reporting.trim()) && (
              <p>
                <strong>Umsetzungsbericht:</strong>{' '}
                {text(brief.nextStep.reporting)}
              </p>
            )}
          </div>
        </section>
      </div>
      <footer className="document-footer">
        <strong>Quellen</strong>
        {brief.sources.length ? (
          <ol>
            {brief.sources.map((source) => (
              <li key={source.id}>
                {safeSourceUrl(source.url) ? (
                  <a
                    href={safeSourceUrl(source.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {text(source.title)}
                  </a>
                ) : (
                  text(source.title)
                )}
                {mode === 'paper' && (
                  <>
                    <span>
                      {' '}
                      · {text(source.locator)} · Abruf{' '}
                      {formatDate(source.accessedOn)}
                    </span>
                    {safeSourceUrl(source.url) && (
                      <span className="source-url">{source.url}</span>
                    )}
                  </>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p>Noch keine Quellen erfasst.</p>
        )}
        <p>
          Erstellt durch: {text(brief.provenance.preparedBy)} · Fachliche
          Prüfung und Freigabe stehen aus.
        </p>
        <p>
          Zusammenfassung zur Beratung. Maßgeblich sind die verknüpften
          Originalunterlagen.
        </p>
      </footer>
    </article>
  );
}
