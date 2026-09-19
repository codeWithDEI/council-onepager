import { useId } from 'react';
import { moneySchema, type Money } from '../domain/brief';

export function Field({
  label,
  value,
  onChange,
  multiline = false,
  maxLength = 160,
  type = 'text',
  hint,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  maxLength?: number;
  type?: 'text' | 'date' | 'url';
  hint?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const common = {
    id,
    value,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => onChange(event.target.value),
    maxLength,
    disabled,
    'aria-describedby': hint ? `${id}-hint` : undefined,
  };
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea {...common} rows={3} />
      ) : (
        <input {...common} type={type} />
      )}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Record<T, string>;
  onChange: (value: T) => void;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {Object.entries<string>(options).map(([key, title]) => (
          <option key={key} value={key}>
            {title}
          </option>
        ))}
      </select>
    </div>
  );
}

export function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Money;
  onChange: (money: Money) => void;
}) {
  const valid = moneySchema.safeParse(value).success;
  return (
    <fieldset className="money-field">
      <legend>{label}</legend>
      <SelectField
        label={`${label}: Kenntnisstand`}
        value={value.status}
        options={{
          unknown: 'Noch nicht ermittelt',
          estimated: 'Geschätzt',
          documented: 'Durch Quelle belegt',
        }}
        onChange={(status) =>
          onChange(
            status === 'unknown'
              ? { status, amountEuros: '', note: value.note }
              : { status, amountEuros: value.amountEuros, note: value.note },
          )
        }
      />
      <Field
        label={`${label}: Betrag in Euro`}
        disabled={value.status === 'unknown'}
        value={value.amountEuros}
        onChange={(amountEuros) => {
          if (value.status !== 'unknown') onChange({ ...value, amountEuros });
        }}
        maxLength={16}
        hint="Ohne Tausendertrennzeichen, z. B. 1200,50. Null nur bei belegtem Betrag von 0 €."
      />
      {!valid && (
        <p className="field-error" role="alert">
          Bitte einen gültigen Betrag mit höchstens zwei Nachkommastellen
          eingeben.
        </p>
      )}
      <Field
        label={`${label}: Bezugsrahmen / Schätzstand`}
        value={value.note}
        onChange={(note) => onChange({ ...value, note })}
      />
    </fieldset>
  );
}
