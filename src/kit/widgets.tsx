import { useState, type ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { Avatar, Badge, Button, CopyButton, IconButton, KeyValue, type Tone } from "./primitives";

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
  onClick,
  selected,
  muted,
  wrap,
}: {
  icon?: IconName;
  glyph?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  end?: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  muted?: boolean;
  /** Prose rows: let the title wrap to two clamped lines instead of one-line
      ellipsis — sentence-length titles keep ~4× the text on a phone. */
  wrap?: boolean;
}) {
  return (
    <div {...kit("ListRow")} onClick={onClick} role={onClick ? "button" : undefined}
      className={cx("mcp-listrow", onClick && "mcp-listrow--tappable",
        selected && "mcp-listrow--selected", muted && "mcp-listrow--muted", wrap && "mcp-listrow--wrap")}>
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

/* CodeView — syntax-highlighted code from a raw string --------------- */

type TokLang = {
  comments: RegExp[];
  keywords: Set<string>;
};

const KW_JS =
  "const let var function return if else for while do switch case break continue new class extends import export from default async await try catch finally throw typeof instanceof in of yield static get set this super null undefined true false void delete interface type enum implements readonly as satisfies";
const KW_PY =
  "def return if elif else for while break continue import from as class try except finally raise with lambda pass yield global nonlocal assert del not and or in is None True False async await match case";
const KW_BASH =
  "if then else elif fi for while do done case esac function in echo exit return local export set unset readonly shift source true false";
const KW_SQL =
  "select from where insert into values update set delete join left right inner outer on group by order having limit offset create table alter drop index primary key foreign references not null unique default as distinct union all and or in like between is exists count sum avg min max";
const KW_CSS = "";

function langSpec(language: string): TokLang {
  const l = language.toLowerCase();
  if (["py", "python"].includes(l))
    return { comments: [/#[^\n]*/y], keywords: new Set(KW_PY.split(" ")) };
  if (["sh", "bash", "shell", "zsh"].includes(l))
    return { comments: [/#[^\n]*/y], keywords: new Set(KW_BASH.split(" ")) };
  if (l === "sql")
    return { comments: [/--[^\n]*/y], keywords: new Set(KW_SQL.split(" ")) };
  if (l === "css")
    return { comments: [/\/\*[\s\S]*?\*\//y], keywords: new Set(KW_CSS.split(" ").filter(Boolean)) };
  if (["html", "xml", "svg"].includes(l))
    return { comments: [/<!--[\s\S]*?-->/y], keywords: new Set() };
  // js / ts / jsx / tsx / json / java / c-like default
  return {
    comments: [/\/\/[^\n]*/y, /\/\*[\s\S]*?\*\//y],
    keywords: new Set(KW_JS.split(" ")),
  };
}

const STRING_RE = /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/y;
const NUMBER_RE = /\b(?:0[xX][\da-fA-F_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/y;
const IDENT_RE = /[A-Za-z_$][\w$]*/y;
const TAG_RE = /<\/?[A-Za-z][\w-]*/y;

export function highlightCode(code: string, language: string): ReactNode[] {
  const spec = langSpec(language);
  const html = ["html", "xml", "svg"].includes(language.toLowerCase());
  const out: ReactNode[] = [];
  let plain = "";
  let i = 0;
  let k = 0;
  const flush = () => {
    if (plain) out.push(plain);
    plain = "";
  };
  const tryMatch = (re: RegExp): string | null => {
    re.lastIndex = i;
    const m = re.exec(code);
    return m && m.index === i ? m[0] : null;
  };
  while (i < code.length) {
    let matched: { text: string; cls: string } | null = null;
    for (const c of spec.comments) {
      const t = tryMatch(c);
      if (t) {
        matched = { text: t, cls: "tok-com" };
        break;
      }
    }
    if (!matched) {
      const s = tryMatch(STRING_RE);
      if (s) matched = { text: s, cls: "tok-str" };
    }
    if (!matched && html) {
      const t = tryMatch(TAG_RE);
      if (t) matched = { text: t, cls: "tok-kw" };
    }
    if (!matched) {
      const n = tryMatch(NUMBER_RE);
      if (n) matched = { text: n, cls: "tok-num" };
    }
    if (!matched) {
      const id = tryMatch(IDENT_RE);
      if (id) {
        if (spec.keywords.has(id)) matched = { text: id, cls: "tok-kw" };
        else if (code[i + id.length] === "(") matched = { text: id, cls: "tok-fn" };
        else {
          plain += id;
          i += id.length;
          continue;
        }
      }
    }
    if (matched) {
      flush();
      out.push(
        <span key={k++} className={matched.cls}>
          {matched.text}
        </span>,
      );
      i += matched.text.length;
    } else {
      plain += code[i];
      i++;
    }
  }
  flush();
  return out;
}

export function CodeView({
  code,
  language = "text",
  title,
  lineNumbers = false,
  maxHeight,
}: {
  /** Raw source — highlighting is automatic (js/ts, python, bash, sql, css, html, json). */
  code: string;
  language?: string;
  /** Bar label; defaults to the language. */
  title?: string;
  lineNumbers?: boolean;
  /** Scroll inside beyond this height (px). */
  maxHeight?: number;
}) {
  const trimmed = code.replace(/\n$/, "");
  const body = lineNumbers ? (
    <table className="mcp-codeview__table">
      <tbody>
        {trimmed.split("\n").map((line, n) => (
          <tr key={n}>
            <td className="mcp-codeview__num">{n + 1}</td>
            <td className="mcp-codeview__line">{highlightCode(line, language)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    highlightCode(trimmed, language)
  );
  return (
    <div {...kit("CodeView")} className="mcp-code mcp-codeview">
      <div className="mcp-code__bar">
        <span className="mcp-code__lang">{title ?? language}</span>
        <CopyButton text={trimmed} />
      </div>
      <pre className="mcp-code__pre" style={maxHeight ? { maxHeight, overflow: "auto" } : undefined}>
        {body}
      </pre>
    </div>
  );
}

/* Tree — expandable nested items (files, JSON, hierarchies) ---------- */

export type TreeItem = {
  label: string;
  icon?: IconName;
  meta?: ReactNode;
  children?: TreeItem[];
};

function TreeRow({
  item,
  path,
  depth,
  open,
  toggle,
  onSelect,
  selected,
}: {
  item: TreeItem;
  path: string;
  depth: number;
  open: Set<string>;
  toggle: (p: string) => void;
  onSelect?: (path: string, item: TreeItem) => void;
  selected?: string;
}) {
  const branch = !!item.children?.length;
  const isOpen = open.has(path);
  return (
    <>
      <div
        className={cx("mcp-tree__row", selected === path && "is-selected")}
        style={{ paddingLeft: 8 + depth * 16 }}
        role="treeitem"
        aria-expanded={branch ? isOpen : undefined}
        tabIndex={0}
        onClick={() => {
          if (branch) toggle(path);
          onSelect?.(path, item);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (branch) toggle(path);
            onSelect?.(path, item);
          }
        }}
      >
        {branch ? (
          <Icon name="chevronRight" size={11} className={cx("mcp-tree__chev", isOpen && "is-open")} />
        ) : (
          <span className="mcp-tree__spacer" />
        )}
        <Icon name={item.icon ?? (branch ? "folder" : "doc")} size={13} className="mcp-tree__glyph" />
        <span className="mcp-tree__label">{item.label}</span>
        {item.meta && <span className="mcp-tree__meta">{item.meta}</span>}
      </div>
      {branch &&
        isOpen &&
        item.children!.map((c) => (
          <TreeRow
            key={c.label}
            item={c}
            path={`${path}/${c.label}`}
            depth={depth + 1}
            open={open}
            toggle={toggle}
            onSelect={onSelect}
            selected={selected}
          />
        ))}
    </>
  );
}

export function Tree({
  items,
  defaultOpen = 1,
  onSelect,
  selected,
}: {
  items: TreeItem[];
  /** How many levels start expanded. */
  defaultOpen?: number;
  /** path is the slash-joined labels, e.g. "src/kit/layout.tsx". */
  onSelect?: (path: string, item: TreeItem) => void;
  selected?: string;
}) {
  const [open, setOpen] = useState<Set<string>>(() => {
    const s = new Set<string>();
    const walk = (list: TreeItem[], prefix: string, depth: number) => {
      for (const it of list) {
        const p = prefix ? `${prefix}/${it.label}` : it.label;
        if (it.children?.length && depth < defaultOpen) {
          s.add(p);
          walk(it.children, p, depth + 1);
        }
      }
    };
    walk(items, "", 0);
    return s;
  });
  const toggle = (p: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  return (
    <div {...kit("Tree")} className="mcp-tree" role="tree">
      {items.map((it) => (
        <TreeRow
          key={it.label}
          item={it}
          path={it.label}
          depth={0}
          open={open}
          toggle={toggle}
          onSelect={onSelect}
          selected={selected}
        />
      ))}
    </div>
  );
}

/* Markdown — subset renderer for AI-authored rich text --------------- */

function mdInline(text: string, k = { n: 0 }): ReactNode[] {
  const out: ReactNode[] = [];
  const re =
    /(\*\*|__)(.+?)\1|(\*|_)([^*_]+?)\3|~~(.+?)~~|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[2] != null) out.push(<strong key={k.n++}>{mdInline(m[2], k)}</strong>);
    else if (m[4] != null) out.push(<em key={k.n++}>{mdInline(m[4], k)}</em>);
    else if (m[5] != null) out.push(<s key={k.n++}>{mdInline(m[5], k)}</s>);
    else if (m[6] != null) out.push(<code key={k.n++}>{m[6]}</code>);
    else if (m[7] != null)
      out.push(
        <a key={k.n++} href={m[8]} target="_blank" rel="noreferrer noopener">
          {mdInline(m[7], k)}
        </a>,
      );
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ children }: { /** Markdown source. */ children: string }) {
  const lines = children.split("\n");
  const blocks: ReactNode[] = [];
  let k = 0;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const fence = line.match(/^```(\w*)/);
    if (fence) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) buf.push(lines[i++]);
      i++;
      blocks.push(<CodeView key={k++} code={buf.join("\n")} language={fence[1] || "text"} />);
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) {
      const Tag = (["h1", "h2", "h3", "h4"] as const)[h[1].length - 1];
      blocks.push(<Tag key={k++}>{mdInline(h[2])}</Tag>);
      i++;
      continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      blocks.push(<hr key={k++} />);
      i++;
      continue;
    }
    if (line.startsWith(">")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) buf.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push(<blockquote key={k++}>{mdInline(buf.join(" "))}</blockquote>);
      continue;
    }
    const li = line.match(/^(\s*)([-*+]|\d+\.)\s+/);
    if (li) {
      const ordered = /\d/.test(li[2]);
      const items: ReactNode[] = [];
      while (i < lines.length) {
        const it = lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.*)/);
        if (!it) break;
        items.push(<li key={k++}>{mdInline(it[3])}</li>);
        i++;
      }
      blocks.push(ordered ? <ol key={k++}>{items}</ol> : <ul key={k++}>{items}</ul>);
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|>|(\s*([-*+]|\d+\.)\s))/.test(lines[i]))
      buf.push(lines[i++]);
    blocks.push(<p key={k++}>{mdInline(buf.join(" "))}</p>);
  }
  return (
    <div {...kit("Markdown")} className="mcp-prose">
      {blocks}
    </div>
  );
}
