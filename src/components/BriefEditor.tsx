import { sourceSections, type Brief, type Source } from '../domain/brief';
import {
  costTypeLabels,
  coverageLabels,
  fundingLabels,
  sectionLabels,
} from '../domain/labels';
import { Field, MoneyField, SelectField } from './Fields';

export function BriefEditor({
  brief,
  onChange,
}: {
  brief: Brief;
  onChange: (brief: Brief) => void;
}) {
  const update = <K extends keyof Brief>(key: K, value: Brief[K]) =>
    onChange({ ...brief, [key]: value });
  const sourceOptions = Object.fromEntries([
    ['', 'Noch nicht zugeordnet'],
    ...brief.sources.map((source, index) => [
      source.id,
      `${index + 1}: ${source.title || 'Quelle ohne Titel'}`,
    ]),
  ]);
  return (
    <form
      className="editor"
      aria-label="Entscheidungsübersicht bearbeiten"
      onSubmit={(event) => event.preventDefault()}
    >
      <details open>
        <summary>01 · Zuordnung &amp; Stand</summary>
        <div className="section-fields">
          <Field
            label="Titel"
            value={brief.title}
            onChange={(value) => update('title', value)}
            hint="Den konkreten Beschlussgegenstand verständlich benennen."
          />
          <Field
            label="Gemeinde / Körperschaft"
            value={brief.meeting.municipality}
            onChange={(municipality) =>
              update('meeting', { ...brief.meeting, municipality })
            }
          />
          <Field
            label="Entscheidendes Gremium"
            value={brief.meeting.body}
            onChange={(body) => update('meeting', { ...brief.meeting, body })}
          />
          <div className="field-pair">
            <Field
              label="Sitzung am"
              type="date"
              value={brief.meeting.date}
              onChange={(date) => update('meeting', { ...brief.meeting, date })}
            />
            <Field
              label="Tagesordnungspunkt"
              maxLength={40}
              value={brief.meeting.agendaItem}
              onChange={(agendaItem) =>
                update('meeting', { ...brief.meeting, agendaItem })
              }
            />
          </div>
          <Field
            label="Vorlagennummer / Referenz"
            value={brief.meeting.proposalReference}
            onChange={(proposalReference) =>
              update('meeting', { ...brief.meeting, proposalReference })
            }
          />
          <Field
            label="Erstellt durch"
            value={brief.provenance.preparedBy}
            onChange={(preparedBy) =>
              update('provenance', { ...brief.provenance, preparedBy })
            }
          />
          <div className="field-pair">
            <Field
              label="Version"
              maxLength={40}
              value={brief.provenance.version}
              onChange={(version) =>
                update('provenance', { ...brief.provenance, version })
              }
            />
            <Field
              label="Bearbeitungsstand"
              type="date"
              value={brief.provenance.updatedOn}
              onChange={(updatedOn) =>
                update('provenance', { ...brief.provenance, updatedOn })
              }
            />
          </div>
        </div>
      </details>
      <details open>
        <summary>02 · Entscheidung</summary>
        <div className="section-fields">
          <Field
            label="Was soll heute entschieden werden?"
            value={brief.decision.question}
            maxLength={300}
            multiline
            onChange={(question) =>
              update('decision', { ...brief.decision, question })
            }
          />
          <Field
            label="Beschlussvorschlag"
            value={brief.decision.proposal}
            maxLength={700}
            multiline
            onChange={(proposal) =>
              update('decision', { ...brief.decision, proposal })
            }
            hint="Auftrag, Umfang und gegebenenfalls Kostenobergrenze. Kein bereits gefasster Beschluss."
          />
          <SelectField
            label="Wiedergabe des Vorschlags"
            value={brief.decision.wording}
            options={{
              summary: 'Gekennzeichnete Kurzfassung',
              verbatim: 'Wortlaut aus der zugeordneten Quelle',
            }}
            onChange={(wording) =>
              update('decision', { ...brief.decision, wording })
            }
          />
        </div>
      </details>
      <details>
        <summary>03 · Ausgangslage &amp; Ziel</summary>
        <div className="section-fields">
          <Field
            label="Sachlage und Anlass"
            multiline
            maxLength={700}
            value={brief.context.situation}
            onChange={(situation) =>
              update('context', { ...brief.context, situation })
            }
          />
          <Field
            label="Gewünschtes Ergebnis"
            multiline
            maxLength={300}
            value={brief.context.objective}
            onChange={(objective) =>
              update('context', { ...brief.context, objective })
            }
          />
          <Field
            label="Betroffene Menschen / Orte"
            multiline
            maxLength={300}
            value={brief.context.affectedGroups}
            onChange={(affectedGroups) =>
              update('context', { ...brief.context, affectedGroups })
            }
          />
        </div>
      </details>
      <details>
        <summary>04 · Optionen &amp; Folgen</summary>
        <div className="section-fields">
          <p className="help">
            Sachliche Folgen vergleichen. Positionen zuordnen und Unsicherheiten
            benennen. Keine künstliche Ausgewogenheit herstellen.
          </p>
          {brief.options.map((option, index) => (
            <fieldset key={option.id}>
              <legend>Option {index + 1}</legend>
              <Field
                label={`Bezeichnung der Option ${index + 1}`}
                value={option.label}
                onChange={(label) =>
                  update(
                    'options',
                    brief.options.map((item) =>
                      item.id === option.id ? { ...item, label } : item,
                    ),
                  )
                }
              />
              {(['benefits', 'drawbacks', 'uncertainties'] as const).map(
                (key) => (
                  <Field
                    key={key}
                    label={`${{ benefits: 'Nutzen', drawbacks: 'Nachteile / Risiken', uncertainties: 'Offene Fragen' }[key]} · Option ${index + 1}`}
                    multiline
                    maxLength={key === 'uncertainties' ? 300 : 400}
                    value={option[key]}
                    onChange={(value) =>
                      update(
                        'options',
                        brief.options.map((item) =>
                          item.id === option.id
                            ? { ...item, [key]: value }
                            : item,
                        ),
                      )
                    }
                  />
                ),
              )}
              <button
                type="button"
                className="quiet"
                onClick={() =>
                  update(
                    'options',
                    brief.options.filter((item) => item.id !== option.id),
                  )
                }
              >
                Option {index + 1} entfernen
              </button>
            </fieldset>
          ))}
          <button
            type="button"
            disabled={brief.options.length >= 4}
            onClick={() =>
              update('options', [
                ...brief.options,
                {
                  id: crypto.randomUUID(),
                  label: '',
                  benefits: '',
                  drawbacks: '',
                  uncertainties: '',
                },
              ])
            }
          >
            Option ergänzen
          </button>
        </div>
      </details>
      <details>
        <summary>05 · Kosten &amp; Haushalt</summary>
        <div className="section-fields">
          <p className="help">
            Beträge werden nicht automatisch verrechnet: Förderungen und Kosten
            können unterschiedliche Zeiträume betreffen.
          </p>
          {(['oneOff', 'annual', 'funding', 'ownContribution'] as const).map(
            (key) => (
              <MoneyField
                key={key}
                label={
                  {
                    oneOff: 'Einmalige Kosten',
                    annual: 'Jährliche Kosten',
                    funding: 'Förderung',
                    ownContribution: 'Eigenanteil laut Quelle',
                  }[key]
                }
                value={brief.budget[key]}
                onChange={(value) =>
                  update('budget', { ...brief.budget, [key]: value })
                }
              />
            ),
          )}
          <SelectField
            label="Stand der Förderung"
            value={brief.budget.fundingState}
            options={fundingLabels}
            onChange={(fundingState) =>
              update('budget', { ...brief.budget, fundingState })
            }
          />
          <SelectField
            label="Haushaltsdeckung"
            value={brief.budget.coverage}
            options={coverageLabels}
            onChange={(coverage) =>
              update('budget', { ...brief.budget, coverage })
            }
          />
          <SelectField
            label="Art der Haushaltswirkung"
            value={brief.budget.costType}
            options={costTypeLabels}
            onChange={(costType) =>
              update('budget', { ...brief.budget, costType })
            }
          />
          <Field
            label="Haushaltsjahr"
            maxLength={4}
            value={brief.budget.year}
            onChange={(year) => update('budget', { ...brief.budget, year })}
          />
          <Field
            label="Produkt / Maßnahme"
            value={brief.budget.product}
            onChange={(product) =>
              update('budget', { ...brief.budget, product })
            }
          />
          <Field
            label="Personalbedarf und weitere Folgekosten"
            multiline
            maxLength={400}
            value={brief.budget.personnelAndFollowUp}
            onChange={(personnelAndFollowUp) =>
              update('budget', { ...brief.budget, personnelAndFollowUp })
            }
          />
        </div>
      </details>
      <details>
        <summary>06 · Beratungsweg &amp; Umsetzung</summary>
        <div className="section-fields">
          {brief.consultations.map((item, index) => (
            <fieldset key={item.id}>
              <legend>Beratung {index + 1}</legend>
              <Field
                label={`Gremium · Beratung ${index + 1}`}
                value={item.body}
                onChange={(body) =>
                  update(
                    'consultations',
                    brief.consultations.map((entry) =>
                      entry.id === item.id ? { ...entry, body } : entry,
                    ),
                  )
                }
              />
              <Field
                label={`Datum · Beratung ${index + 1}`}
                type="date"
                value={item.date}
                onChange={(date) =>
                  update(
                    'consultations',
                    brief.consultations.map((entry) =>
                      entry.id === item.id ? { ...entry, date } : entry,
                    ),
                  )
                }
              />
              <Field
                label={`Empfehlung / Ergebnis · Beratung ${index + 1}`}
                multiline
                maxLength={400}
                value={item.outcome}
                onChange={(outcome) =>
                  update(
                    'consultations',
                    brief.consultations.map((entry) =>
                      entry.id === item.id ? { ...entry, outcome } : entry,
                    ),
                  )
                }
                hint="Empfehlung, Vertagung und Beschluss unterscheiden; Änderungen nachvollziehbar benennen."
              />
              <SelectField
                label={`Quelle · Beratung ${index + 1}`}
                value={item.sourceId}
                options={sourceOptions}
                onChange={(sourceId) =>
                  update(
                    'consultations',
                    brief.consultations.map((entry) =>
                      entry.id === item.id ? { ...entry, sourceId } : entry,
                    ),
                  )
                }
              />
              <button
                type="button"
                className="quiet"
                onClick={() =>
                  update(
                    'consultations',
                    brief.consultations.filter((entry) => entry.id !== item.id),
                  )
                }
              >
                Beratung {index + 1} entfernen
              </button>
            </fieldset>
          ))}
          <button
            type="button"
            disabled={brief.consultations.length >= 6}
            onClick={() =>
              update('consultations', [
                ...brief.consultations,
                {
                  id: crypto.randomUUID(),
                  body: '',
                  date: '',
                  outcome: '',
                  sourceId: '',
                },
              ])
            }
          >
            Beratung ergänzen
          </button>
          <Field
            label="Nächster Schritt bei Annahme des Vorschlags"
            multiline
            maxLength={400}
            value={brief.nextStep.action}
            onChange={(action) =>
              update('nextStep', { ...brief.nextStep, action })
            }
          />
          <Field
            label="Verantwortlich für die Umsetzung"
            value={brief.nextStep.responsible}
            onChange={(responsible) =>
              update('nextStep', { ...brief.nextStep, responsible })
            }
          />
          <Field
            label="Angestrebter Termin"
            type="date"
            value={brief.nextStep.targetDate}
            onChange={(targetDate) =>
              update('nextStep', { ...brief.nextStep, targetDate })
            }
          />
          <Field
            label="Vorgesehener Umsetzungsbericht"
            value={brief.nextStep.reporting}
            onChange={(reporting) =>
              update('nextStep', { ...brief.nextStep, reporting })
            }
          />
        </div>
      </details>
      <details>
        <summary>07 · Quellen &amp; Nachweise</summary>
        <div className="section-fields">
          <p className="help">
            Öffentliche Originalvorlagen, Anlagen und Protokolle verwenden.
            Abrufdaten nur nach tatsächlicher Prüfung setzen. Quellen werden von
            dieser Anwendung nicht geöffnet oder geprüft.
          </p>
          {brief.sources.map((source, index) => {
            const changeSource = (value: Source) =>
              update(
                'sources',
                brief.sources.map((entry) =>
                  entry.id === source.id ? value : entry,
                ),
              );
            return (
              <fieldset key={source.id}>
                <legend>Quelle {index + 1}</legend>
                <Field
                  label={`Titel · Quelle ${index + 1}`}
                  value={source.title}
                  onChange={(title) => changeSource({ ...source, title })}
                />
                <Field
                  label={`URL · Quelle ${index + 1}`}
                  type="url"
                  maxLength={2048}
                  value={source.url}
                  onChange={(url) => changeSource({ ...source, url })}
                />
                <Field
                  label={`Fundstelle · Quelle ${index + 1}`}
                  value={source.locator}
                  onChange={(locator) => changeSource({ ...source, locator })}
                  hint="Zum Beispiel Dokumentfassung, TOP und Seite oder Abschnitt."
                />
                <Field
                  label={`Tatsächlich abgerufen am · Quelle ${index + 1}`}
                  type="date"
                  value={source.accessedOn}
                  onChange={(accessedOn) =>
                    changeSource({ ...source, accessedOn })
                  }
                />
                <fieldset className="source-sections">
                  <legend>Belegt folgende Bereiche</legend>
                  {sourceSections.map((section) => (
                    <label key={section}>
                      <input
                        type="checkbox"
                        checked={source.supports.includes(section)}
                        onChange={(event) =>
                          changeSource({
                            ...source,
                            supports: event.target.checked
                              ? [...source.supports, section]
                              : source.supports.filter(
                                  (value) => value !== section,
                                ),
                          })
                        }
                      />
                      {sectionLabels[section]}
                    </label>
                  ))}
                </fieldset>
                <button
                  type="button"
                  className="quiet"
                  onClick={() =>
                    onChange({
                      ...brief,
                      sources: brief.sources.filter(
                        (entry) => entry.id !== source.id,
                      ),
                      consultations: brief.consultations.map((entry) =>
                        entry.sourceId === source.id
                          ? { ...entry, sourceId: '' }
                          : entry,
                      ),
                    })
                  }
                >
                  Quelle {index + 1} entfernen
                </button>
              </fieldset>
            );
          })}
          <button
            type="button"
            disabled={brief.sources.length >= 12}
            onClick={() =>
              update('sources', [
                ...brief.sources,
                {
                  id: crypto.randomUUID(),
                  title: '',
                  url: '',
                  locator: '',
                  accessedOn: '',
                  supports: [],
                },
              ])
            }
          >
            Quelle ergänzen
          </button>
        </div>
      </details>
    </form>
  );
}
