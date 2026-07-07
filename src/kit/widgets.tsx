import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { Avatar, Badge, Button, IconButton, KeyValue, type Tone } from "./primitives";

const kit = (name: string) => ({ "data-kit": name });

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

/* Stat cards ------------------------------------------------------ */

export function StatCard({
  label,
  value,
  delta,
  direction = "flat",
  end,
}: {
  label: string;
  value: string;
  delta?: string;
  direction?: "up" | "down" | "flat";
  /** Optional trailing visual — a Sparkline, BulletGauge, or badge. */
  end?: ReactNode;
}) {
  const body = (
    <>
      <span className="mcp-stat__label">{label}</span>
      <span className="mcp-stat__value">{value}</span>
      {delta && (
        <span className={`mcp-stat__delta mcp-stat__delta--${direction}`}>
          {direction !== "flat" && (
            <Icon
              name="arrowUpRight"
              size={11}
              strokeWidth={2.2}
              style={direction === "down" ? { transform: "scaleY(-1)" } : undefined}
            />
          )}
          {delta}
        </span>
      )}
    </>
  );
  if (!end) {
    return (
      <div {...kit("StatCard")} className="mcp-stat">
        {body}
      </div>
    );
  }
  return (
    <div {...kit("StatCard")} className="mcp-stat mcp-stat--row">
      <span className="mcp-stat__main">{body}</span>
      <span className="mcp-stat__end">{end}</span>
    </div>
  );
}

/* Sparkline — a bare trend line for stat cards and table cells ------- */

export function Sparkline({
  points,
  width = 120,
  height = 36,
  tone = "crail",
}: {
  points: number[];
  width?: number;
  height?: number;
  tone?: "crail" | "denim" | "moss" | "ink";
}) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const pad = 3;
  const step = (width - pad * 2) / (points.length - 1);
  const y = (v: number) => pad + (height - pad * 2) * (1 - (v - min) / span);
  const d = points
    .map((v, i) => `${i === 0 ? "M" : "L"}${(pad + i * step).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" ");
  const stroke =
    tone === "ink"
      ? "var(--ink-2)"
      : tone === "denim"
        ? "var(--denim)"
        : tone === "moss"
          ? "var(--moss)"
          : "var(--crail)";
  return (
    <svg
      {...kit("Sparkline")}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={`trend of ${points.length} points, latest ${points[points.length - 1]}`}
    >
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={pad + (points.length - 1) * step}
        cy={y(points[points.length - 1])}
        r="3"
        fill={stroke}
        stroke="var(--paper-0)"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/* BulletGauge — a measure against its target ------------------------- */

export function BulletGauge({
  value,
  target,
  max,
  unit = "",
  higherIsBetter = true,
}: {
  value: number;
  target: number;
  max: number;
  unit?: string;
  higherIsBetter?: boolean;
}) {
  const failing = higherIsBetter ? value < target : value > target;
  const pctValue = Math.min(100, (value / max) * 100);
  const pctTarget = Math.min(100, (target / max) * 100);
  return (
    <div {...kit("BulletGauge")} className="mcp-bullet" role="meter" aria-valuenow={value}>
      <div className="mcp-bullet__rail">
        <div
          className={cx("mcp-bullet__fill", failing && "mcp-bullet__fill--failing")}
          style={{ width: `${pctValue}%` }}
        />
        <div className="mcp-bullet__tick" style={{ left: `${pctTarget}%` }} />
      </div>
      <div className="mcp-bullet__caption">
        <span className={cx("mcp-bullet__value", failing && "mcp-bullet__value--failing")}>
          {value}
          {unit} · {failing ? "below target" : "on target"}
        </span>
        <span className="mcp-bullet__target">
          target {target}
          {unit}
        </span>
      </div>
    </div>
  );
}

/* StackedBarChart — segmented bars with a legend ---------------------- */

export type SegmentTone = "crail" | "moss" | "amber" | "red" | "denim" | "ink";

export function StackedBarChart({
  title,
  subtitle,
  data,
  legend,
}: {
  title: string;
  subtitle?: string;
  data: Array<{ label: string; segments: Array<{ value: number; tone: SegmentTone }> }>;
  legend?: Array<{ label: string; tone: SegmentTone }>;
}) {
  const max = Math.max(...data.map((d) => d.segments.reduce((s, x) => s + x.value, 0)));
  return (
    <div {...kit("StackedBarChart")} className="mcp-card mcp-chartcard">
      <div className="mcp-chartcard__head">
        <span className="mcp-chartcard__title">{title}</span>
        {subtitle && <span className="mcp-chartcard__sub">{subtitle}</span>}
      </div>
      <div className="mcp-sbar">
        {data.map((d) => {
          const total = d.segments.reduce((s, x) => s + x.value, 0);
          return (
            <div key={d.label} className="mcp-sbar__col" title={`${d.label}: ${total}`}>
              <span className="mcp-sbar__total">{total}</span>
              <div className="mcp-sbar__stack" style={{ height: `${(total / max) * 100}%` }}>
                {[...d.segments].reverse().map(
                  (s, i) =>
                    s.value > 0 && (
                      <div
                        key={i}
                        className={`mcp-sbar__seg mcp-sbar__seg--${s.tone}`}
                        style={{ flexGrow: s.value }}
                      />
                    ),
                )}
              </div>
              <span className="mcp-sbar__x">{d.label}</span>
            </div>
          );
        })}
      </div>
      {legend && (
        <div className="mcp-chart-legend">
          {legend.map((l) => (
            <span key={l.label} className="mcp-chart-legend__item">
              <i className={`mcp-chart-legend__swatch mcp-sbar__seg--${l.tone}`} />
              {l.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return (
    <div {...kit("StatRow")} className="mcp-stat-row">
      {children}
    </div>
  );
}

/* Charts (pure CSS/SVG, no deps) ---------------------------------- */

export function BarChart({
  title,
  subtitle,
  data,
  highlight,
}: {
  title: string;
  subtitle?: string;
  data: Array<{ label: string; value: number }>;
  highlight?: number;
}) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div {...kit("BarChart")} className="mcp-card mcp-chartcard">
      <div className="mcp-chartcard__head">
        <span className="mcp-chartcard__title">{title}</span>
        {subtitle && <span className="mcp-chartcard__sub">{subtitle}</span>}
      </div>
      <div className="mcp-barchart">
        {data.map((d, i) => (
          <div key={d.label} className="mcp-barchart__col" title={`${d.label}: ${d.value}`}>
            <div
              className={cx(
                "mcp-barchart__bar",
                highlight != null && i !== highlight && "mcp-barchart__bar--muted"
              )}
              style={{ height: `${(d.value / max) * 100}%` }}
            />
            <span className="mcp-barchart__x">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LineChart({
  title,
  subtitle,
  points,
  compare,
}: {
  title: string;
  subtitle?: string;
  points: number[];
  compare?: number[];
}) {
  const w = 320;
  const h = 96;
  const all = compare ? [...points, ...compare] : points;
  const max = Math.max(...all);
  const min = Math.min(...all);
  const toPath = (vals: number[]) =>
    vals
      .map((v, i) => {
        const x = (i / (vals.length - 1)) * w;
        const y = h - ((v - min) / (max - min || 1)) * (h - 8) - 4;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  return (
    <div {...kit("LineChart")} className="mcp-card mcp-chartcard">
      <div className="mcp-chartcard__head">
        <span className="mcp-chartcard__title">{title}</span>
        {subtitle && <span className="mcp-chartcard__sub">{subtitle}</span>}
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        aria-hidden="true"
      >
        {compare && (
          <path
            d={toPath(compare)}
            fill="none"
            stroke="var(--line-strong)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        )}
        <path
          d={`${toPath(points)} L${w},${h} L0,${h} Z`}
          fill="var(--crail-soft)"
          stroke="none"
        />
        <path
          d={toPath(points)}
          fill="none"
          stroke="var(--crail)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function DonutChart({
  title,
  subtitle,
  segments,
  centerLabel,
  centerValue,
}: {
  title: string;
  subtitle?: string;
  segments: Array<{ label: string; value: number; color: string }>;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const R = 40;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div {...kit("DonutChart")} className="mcp-card mcp-chartcard">
      <div className="mcp-chartcard__head">
        <span className="mcp-chartcard__title">{title}</span>
        {subtitle && <span className="mcp-chartcard__sub">{subtitle}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <svg viewBox="0 0 100 100" style={{ width: 108, flex: "none" }} aria-hidden="true">
          {segments.map((s) => {
            const frac = s.value / total;
            const el = (
              <circle
                key={s.label}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="12"
                strokeDasharray={`${frac * C - 2} ${C - frac * C + 2}`}
                strokeDashoffset={-offset * C + C / 4}
                strokeLinecap="butt"
              />
            );
            offset += frac;
            return el;
          })}
          {centerValue && (
            <text
              x="50"
              y="48"
              textAnchor="middle"
              style={{
                font: "600 15px var(--font-serif)",
                fill: "var(--ink-1)",
              }}
            >
              {centerValue}
            </text>
          )}
          {centerLabel && (
            <text
              x="50"
              y="61"
              textAnchor="middle"
              style={{ font: "500 7.5px var(--font-sans)", fill: "var(--ink-3)" }}
            >
              {centerLabel}
            </text>
          )}
        </svg>
        <div className="mcp-chart-legend" style={{ flexDirection: "column", gap: 8, marginTop: 0 }}>
          {segments.map((s) => (
            <span key={s.label} className="mcp-chart-legend__item">
              <i className="mcp-chart-legend__swatch" style={{ background: s.color }} />
              {s.label}
              <strong style={{ color: "var(--ink-1)", fontWeight: 600 }}>
                {Math.round((s.value / total) * 100)}%
              </strong>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Data table -------------------------------------------------------- */

export type Column = {
  header: string;
  numeric?: boolean;
  sorted?: "asc" | "desc";
};

export function DataTable({
  columns,
  rows,
  footer,
  onRowClick,
  activeRow,
}: {
  columns: Column[];
  rows: ReactNode[][];
  footer?: { summary: string; action?: ReactNode };
  /** Row-level selection: rows become clickable; activeRow highlights one. */
  onRowClick?: (rowIndex: number) => void;
  activeRow?: number;
}) {
  return (
    <div {...kit("DataTable")} className="mcp-table-wrap">
      <div className="mcp-table-wrap__scroll">
        <table className="mcp-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.header}
                  className={cx(c.numeric && "is-num", c.sorted && "is-sorted")}
                >
                  {c.header}
                  {c.sorted && (
                    <span className="mcp-table__sort">
                      <Icon
                        name={c.sorted === "asc" ? "chevronUp" : "chevronDown"}
                        size={11}
                        strokeWidth={2.4}
                      />
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr
                key={ri}
                className={cx(onRowClick && "is-clickable", activeRow === ri && "is-active")}
                onClick={onRowClick ? () => onRowClick(ri) : undefined}
              >
                {r.map((cell, ci) => (
                  <td key={ci} className={cx(columns[ci]?.numeric && "is-num")}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer && (
        <div className="mcp-table__foot">
          <span>{footer.summary}</span>
          {footer.action}
        </div>
      )}
    </div>
  );
}

/* List manager -------------------------------------------------------- */

export function ListManager({
  children,
  flat,
}: {
  children: ReactNode;
  flat?: boolean;
}) {
  return (
    <div
      {...kit("ListManager")}
      className={cx("mcp-card", flat && "mcp-card--flat")}
      style={{ overflow: "hidden" }}
    >
      {children}
    </div>
  );
}

export function ListRow({
  icon = "doc",
  glyph,
  title,
  subtitle,
  end,
}: {
  icon?: IconName;
  glyph?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  end?: ReactNode;
}) {
  return (
    <div {...kit("ListRow")} className="mcp-listrow">
      <span className="mcp-listrow__glyph">{glyph ?? <Icon name={icon} size={15} />}</span>
      <span className="mcp-listrow__main">
        <div className="mcp-listrow__title">{title}</div>
        {subtitle && <div className="mcp-listrow__sub">{subtitle}</div>}
      </span>
      <span className="mcp-listrow__end">{end}</span>
    </div>
  );
}

/* File & media cards --------------------------------------------------- */

export function FileCard({
  name,
  meta,
  icon = "doc",
  tone,
  actions = true,
}: {
  name: string;
  meta: string;
  icon?: IconName;
  tone?: "denim" | "moss";
  actions?: boolean;
}) {
  return (
    <div {...kit("FileCard")} className="mcp-filecard">
      <span className={cx("mcp-filecard__icon", tone && `mcp-filecard__icon--${tone}`)}>
        <Icon name={icon} size={17} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <div className="mcp-filecard__name">{name}</div>
        <div className="mcp-filecard__meta">{meta}</div>
      </span>
      {actions && <IconButton icon="download" label="Download" size="sm" />}
    </div>
  );
}

export function FileGrid({ children }: { children: ReactNode }) {
  return (
    <div {...kit("FileGrid")} className="mcp-file-grid">
      {children}
    </div>
  );
}

export function MediaCard({
  title,
  meta,
  gradient = "linear-gradient(135deg, #d97757, #b05730)",
  icon = "image",
  badge,
}: {
  title: string;
  meta: string;
  gradient?: string;
  icon?: IconName;
  badge?: string;
}) {
  return (
    <div {...kit("MediaCard")} className="mcp-mediacard">
      <div className="mcp-mediacard__art" style={{ background: gradient }}>
        <Icon name={icon} size={28} strokeWidth={1.4} />
        {badge && (
          <span style={{ position: "absolute", top: 9, right: 9 }}>
            <Badge>{badge}</Badge>
          </span>
        )}
      </div>
      <div className="mcp-mediacard__body">
        <div className="mcp-filecard__name">{title}</div>
        <div className="mcp-filecard__meta">{meta}</div>
      </div>
    </div>
  );
}

/* Status banner --------------------------------------------------------- */

export function StatusBanner({
  tone,
  title,
  children,
}: {
  tone: "info" | "success" | "warning" | "error";
  title: string;
  children?: ReactNode;
}) {
  const icon: IconName =
    tone === "success"
      ? "check"
      : tone === "warning"
        ? "alert"
        : tone === "error"
          ? "alert"
          : "info";
  return (
    <div {...kit("StatusBanner")} className={`mcp-banner mcp-banner--${tone}`}>
      <Icon name={icon} size={15} strokeWidth={2} />
      <span>
        <span className="mcp-banner__title">{title}</span>
        {children && <div className="mcp-banner__body">{children}</div>}
      </span>
    </div>
  );
}

/* Confirmation card (approve/deny an MCP action) ------------------------- */

export function ConfirmationCard({
  title,
  subtitle,
  details,
  note = "Claude won't act until you approve",
  resolved,
  resolvedLabel = "Approved",
  approveLabel = "Approve",
  denyLabel = "Deny",
}: {
  title: string;
  subtitle?: string;
  details?: Array<[string, ReactNode]>;
  note?: string;
  resolved?: boolean;
  resolvedLabel?: string;
  approveLabel?: string;
  denyLabel?: string;
}) {
  return (
    <div
      {...kit("ConfirmationCard")}
      className={cx("mcp-confirm", resolved && "mcp-confirm--resolved")}
    >
      <div className="mcp-confirm__head">
        <Icon name={resolved ? "check" : "shield"} size={17} strokeWidth={2} />
        <span>
          <div className="mcp-confirm__title">{title}</div>
          {subtitle && <div className="mcp-confirm__sub">{subtitle}</div>}
        </span>
      </div>
      {details && (
        <div className="mcp-confirm__body">
          <KeyValue rows={details} />
        </div>
      )}
      <div className="mcp-confirm__foot">
        {resolved ? (
          <>
            <Badge tone="moss" dot>
              {resolvedLabel}
            </Badge>
            <span className="mcp-confirm__note" style={{ marginLeft: "auto", marginRight: 0 }}>
              You can revert this from the activity log
            </span>
          </>
        ) : (
          <>
            <span className="mcp-confirm__note">{note}</span>
            <Button variant="ghost" size="sm">
              {denyLabel}
            </Button>
            <Button variant="primary" size="sm">
              {approveLabel}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/* Elicitation (option cards) --------------------------------------------- */

export function ElicitationCard({
  question,
  options,
  selected,
  multi,
}: {
  question: string;
  options: Array<{ title: string; description?: string }>;
  selected?: number;
  multi?: boolean;
}) {
  return (
    <div {...kit("ElicitationCard")} className="mcp-elicit">
      <span className="mcp-elicit__q">{question}</span>
      <div className="mcp-elicit__opts">
        {options.map((o, i) => (
          <button
            key={o.title}
            className={cx("mcp-elicit__opt", i === selected && "mcp-elicit__opt--selected")}
          >
            <span className="mcp-elicit__opt-title">
              {o.title}
              {i === selected && <Icon name="check" size={14} strokeWidth={2.5} />}
            </span>
            {o.description && <span className="mcp-elicit__opt-desc">{o.description}</span>}
          </button>
        ))}
      </div>
      {multi && (
        <span className="mcp-hint" style={{ color: "var(--ink-3)" }}>
          Select all that apply, or write your own below.
        </span>
      )}
    </div>
  );
}

/* Progress tracker & checklist -------------------------------------------- */

export type StepState = "done" | "active" | "pending" | "error";

export function ProgressTracker({
  steps,
}: {
  steps: Array<{ title: string; sub?: string; state: StepState; glyph?: ReactNode }>;
}) {
  return (
    <div {...kit("ProgressTracker")} className="mcp-steps">
      {steps.map((s) => (
        <div key={s.title} className={`mcp-step mcp-step--${s.state}`}>
          <span className="mcp-step__rail" />
          <span className="mcp-step__dot">
            {s.glyph ??
              (s.state === "done" ? (
                <Icon name="check" size={11} strokeWidth={3} />
              ) : s.state === "error" ? (
                <Icon name="x" size={11} strokeWidth={3} />
              ) : null)}
          </span>
          <span>
            <div className="mcp-step__title">{s.title}</div>
            {s.sub && <div className="mcp-step__sub">{s.sub}</div>}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TaskChecklist({
  items,
}: {
  items: Array<{ label: string; done?: boolean }>;
}) {
  return (
    <div {...kit("TaskChecklist")} className="mcp-checklist">
      {items.map((it) => (
        <span key={it.label} className={cx("mcp-checkitem", it.done && "mcp-checkitem--done")}>
          <Icon
            name={it.done ? "check" : "minus"}
            size={14}
            strokeWidth={2.4}
            style={{ color: it.done ? "var(--moss)" : "var(--ink-3)" }}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}

/* Log viewer ------------------------------------------------------------- */

export type LogLine = {
  time: string;
  text: string;
  level?: "ok" | "warn" | "err";
};

export function LogViewer({ title = "Output", lines }: { title?: string; lines: LogLine[] }) {
  return (
    <div {...kit("LogViewer")} className="mcp-log">
      <div className="mcp-log__bar">
        <span className="mcp-log__title">
          <Icon name="terminal" size={12} />
          {title}
        </span>
        <span className="mcp-log__title">{lines.length} lines</span>
      </div>
      <pre className="mcp-log__pre">
        {lines.map((l, i) => (
          <span key={i} className="mcp-log__line">
            <span className="mcp-log__t">{l.time}  </span>
            <span className={l.level ? `mcp-log__${l.level}` : undefined}>{l.text}</span>
          </span>
        ))}
      </pre>
    </div>
  );
}

/* Diff view --------------------------------------------------------------- */

export type DiffLine = {
  kind: "add" | "del" | "ctx" | "hunk";
  text: string;
};

export function DiffView({
  file,
  additions,
  deletions,
  lines,
}: {
  file: string;
  additions: number;
  deletions: number;
  lines: DiffLine[];
}) {
  return (
    <div {...kit("DiffView")} className="mcp-diff">
      <div className="mcp-diff__bar">
        <Icon name="git" size={13} />
        <span className="mcp-diff__file">{file}</span>
        <span className="mcp-diff__counts">
          <span className="add">+{additions}</span>
          <span className="del">−{deletions}</span>
        </span>
      </div>
      <pre className="mcp-diff__pre">
        {lines.map((l, i) => (
          <span key={i} className={`mcp-diff__line mcp-diff__line--${l.kind}`}>
            {l.kind === "add" ? "+ " : l.kind === "del" ? "− " : "  "}
            {l.text}
          </span>
        ))}
      </pre>
    </div>
  );
}

/* Timeline ------------------------------------------------------------------ */

export function Timeline({
  items,
}: {
  items: Array<{ title: string; time: string; body?: string; accent?: boolean }>;
}) {
  return (
    <div {...kit("Timeline")} className="mcp-timeline">
      {items.map((it) => (
        <div key={it.title + it.time} className="mcp-tl-item">
          <span className="mcp-tl-item__rail" />
          <span className={cx("mcp-tl-item__dot", it.accent && "mcp-tl-item__dot--crail")} />
          <span style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "baseline",
              }}
            >
              <span className="mcp-tl-item__title">{it.title}</span>
              <span className="mcp-tl-item__time">{it.time}</span>
            </div>
            {it.body && <div className="mcp-tl-item__body">{it.body}</div>}
          </span>
        </div>
      ))}
    </div>
  );
}

/* Entity card ------------------------------------------------------------------ */

export function EntityCard({
  name,
  subtitle,
  initials,
  badge,
  badgeTone = "neutral",
  fields,
  actions,
}: {
  name: string;
  subtitle?: string;
  initials: string;
  badge?: string;
  badgeTone?: Tone;
  fields: Array<[string, ReactNode]>;
  actions?: ReactNode;
}) {
  return (
    <div {...kit("EntityCard")} className="mcp-card mcp-entity">
      <div className="mcp-entity__head">
        <Avatar initials={initials} size={40} tone="crail" />
        <span style={{ flex: 1 }}>
          <div className="mcp-entity__name">{name}</div>
          {subtitle && <div className="mcp-entity__sub">{subtitle}</div>}
        </span>
        {badge && <Badge tone={badgeTone}>{badge}</Badge>}
      </div>
      <KeyValue rows={fields} />
      {actions && (
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>{actions}</div>
      )}
    </div>
  );
}
