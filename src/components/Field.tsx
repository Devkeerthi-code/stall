type Props = {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>;

/** Labelled input with its error tied to it for screen readers. Pass children to render a custom control. */
export function Field({ label, name, error, hint, children, id, ...input }: Props) {
  const fieldId = id ?? `f-${name}`;
  const described = [error ? `${fieldId}-err` : null, hint ? `${fieldId}-hint` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      {children ?? <input className="input" id={fieldId} name={name} aria-invalid={!!error} aria-describedby={described} {...input} />}
      {hint && <span className="hint" id={`${fieldId}-hint`}>{hint}</span>}
      {error && <span className="err" id={`${fieldId}-err`}>{error}</span>}
    </div>
  );
}
