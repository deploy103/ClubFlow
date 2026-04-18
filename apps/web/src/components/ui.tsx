import type { ReactNode } from "react";

type BadgeTone = "green" | "amber" | "navy" | "slate" | "red";

export const formatDateTime = (value: string | undefined) => {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export const PageIntro = ({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) => (
  <div className="page-intro">
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
    {action ? <div className="page-intro__action">{action}</div> : null}
  </div>
);

export const StatCard = ({
  label,
  value,
  helper,
  tone = "green",
}: {
  label: string;
  value: number | string;
  helper?: string;
  tone?: "green" | "amber" | "navy" | "slate";
}) => (
  <article className={`stat-card stat-card--${tone}`}>
    <span className="eyebrow">{label}</span>
    <strong>{value}</strong>
    {helper ? <small>{helper}</small> : null}
  </article>
);

export const Panel = ({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <section className="panel">
    <header className="panel__header">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </header>
    {children}
  </section>
);

export const Badge = ({
  label,
  tone = "slate",
}: {
  label: string;
  tone?: BadgeTone;
}) => <span className={`badge badge--${tone}`}>{label}</span>;

export const EmptyState = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="empty-state">
    <strong>{title}</strong>
    <p>{description}</p>
  </div>
);

export const DataTable = <T,>({
  columns,
  rows,
  getRowKey,
  emptyMessage = "표시할 항목이 없습니다.",
}: {
  columns: Array<{
    header: string;
    render: (row: T) => ReactNode;
  }>;
  rows: T[];
  getRowKey: (row: T) => string;
  emptyMessage?: string;
}) => (
  <div className="table-wrap">
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.header}>{column.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td className="data-table__empty" colSpan={columns.length}>
              {emptyMessage}
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td key={column.header}>{column.render(row)}</td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export const InputField = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  type?: "text" | "email" | "password" | "tel";
  placeholder?: string;
}) => (
  <label className="field">
    <span>{label}</span>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
);

export const TextAreaField = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  rows?: number;
}) => (
  <label className="field">
    <span>{label}</span>
    <textarea
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
);

export const SelectField = ({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}) => (
  <label className="field">
    <span>{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);
