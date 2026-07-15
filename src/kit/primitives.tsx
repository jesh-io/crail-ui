import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { Icon, type IconName } from "./icons";

/* Helpers ------------------------------------------------------ */

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

type Kit = { "data-kit"?: string };
const kit = (name: string): Kit => ({ "data-kit": name });

/* Button ------------------------------------------------------- */

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "danger-soft";

export function Button({
  children,
  variant = "secondary",
  size,
  icon,
  iconAfter,
  disabled,
  onClick,
  style,
}: {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "lg";
  icon?: IconName;
  iconAfter?: IconName;
  disabled?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  return (
    <button
      {...kit("Button")}
      className={cx("mcp-btn", `mcp-btn--${variant}`, size && `mcp-btn--${size}`)}
      disabled={disabled}
      onClick={onClick}
      style={style}
    >
      {icon && <Icon name={icon} size={size === "sm" ? 13 : 15} />}
      {children}
      {iconAfter && <Icon name={iconAfter} size={size === "sm" ? 13 : 15} />}
    </button>
  );
}

export function IconButton({
  icon,
  label,
  size,
  onClick,
}: {
  icon: IconName;
  label: string;
  size?: "sm";
  onClick?: () => void;
}) {
  return (
    <button
      {...kit("IconButton")}
      className={cx("mcp-btn", "mcp-btn--icon", size && `mcp-btn--${size}`)}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Icon name={icon} size={size === "sm" ? 13 : 15} />
    </button>
  );
}

/* Badge / Chip / Avatar ---------------------------------------- */

export type Tone = "neutral" | "crail" | "moss" | "amber" | "red" | "denim";

export function Badge({
  children,
  tone = "neutral",
  dot,
  outline,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  outline?: boolean;
}) {
  return (
    <span
      {...kit("Badge")}
      className={cx(
        "mcp-badge",
        tone !== "neutral" && `mcp-badge--${tone}`,
        outline && "mcp-badge--outline"
      )}
    >
      {dot && <i className="mcp-dot" />}
      {children}
    </span>
  );
}

export function Chip({
  children,
  active,
  removable,
  icon,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  removable?: boolean;
  icon?: IconName;
  onClick?: () => void;
}) {
  return (
    <button
      {...kit("Chip")}
      className={cx("mcp-chip", active && "mcp-chip--active")}
      onClick={onClick}
    >
      {icon && <Icon name={icon} size={13} />}
      {children}
      {removable && (
        <span className="mcp-chip__x">
          <Icon name="x" size={12} />
        </span>
      )}
    </button>
  );
}

export function Avatar({
  initials,
  tone = "neutral",
  size = 28,
}: {
  initials: string;
  tone?: "neutral" | "crail" | "ink";
  size?: number;
}) {
  return (
    <span
      {...kit("Avatar")}
      className={cx("mcp-avatar", tone !== "neutral" && `mcp-avatar--${tone}`)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
}

/* Card / Divider ------------------------------------------------ */

export function Card({
  children,
  flat,
  well,
  pad = true,
  style,
  className,
}: {
  children: ReactNode;
  flat?: boolean;
  well?: boolean;
  pad?: boolean;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      {...kit("Card")}
      className={cx(
        "mcp-card",
        flat && "mcp-card--flat",
        well && "mcp-card--well",
        pad && "mcp-card__pad",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

export const Divider = () => <hr className="mcp-divider" />;

/* Fields -------------------------------------------------------- */

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div {...kit("Field")} className="mcp-field">
      {label && <label className="mcp-label">{label}</label>}
      {children}
      {error ? (
        <span className="mcp-hint mcp-hint--error">{error}</span>
      ) : (
        hint && <span className="mcp-hint">{hint}</span>
      )}
    </div>
  );
}

export function Input({
  placeholder,
  value,
  defaultValue,
  icon,
  error,
  onChange,
}: {
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  icon?: IconName;
  error?: boolean;
  onChange?: (v: string) => void;
}) {
  const input = (
    <input
      className={cx("mcp-input", error && "mcp-input--error")}
      placeholder={placeholder}
      value={value}
      defaultValue={defaultValue}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
  if (!icon) return input;
  return (
    <div className="mcp-input-wrap">
      <Icon name={icon} size={14} />
      {input}
    </div>
  );
}

export function Textarea({
  placeholder,
  value,
  defaultValue,
  rows = 3,
  autoGrow,
  onChange,
}: {
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  /** Initial/minimum visible rows. With autoGrow this is the floor, not a cap. */
  rows?: number;
  /** Track content height: the field grows and shrinks with what's in it (and
      refits on container resizes) instead of clipping at a fixed row count. */
  autoGrow?: boolean;
  onChange?: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
  }, []);
  useLayoutEffect(() => {
    if (autoGrow) fit();
  }, [autoGrow, value, fit]);
  useEffect(() => {
    if (!autoGrow || !ref.current) return;
    // Wrapping changes with width — refit whenever the field's box resizes.
    const ro = new ResizeObserver(fit);
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [autoGrow, fit]);
  return (
    <textarea
      ref={ref}
      className="mcp-textarea"
      placeholder={placeholder}
      value={value}
      defaultValue={defaultValue}
      rows={rows}
      style={autoGrow ? { overflow: "hidden", resize: "none" } : undefined}
      onChange={(e) => {
        onChange?.(e.target.value);
        if (autoGrow) fit();
      }}
    />
  );
}

export function Select({
  options,
  defaultValue,
  value,
  onChange,
}: {
  options: Array<string | { value: string; label: string }>;
  defaultValue?: string;
  /** Controlled usage: pass value + onChange. Uncontrolled stays supported. */
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <select
      className="mcp-select"
      defaultValue={value === undefined ? defaultValue : undefined}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
    >
      {options.map((o) => {
        const opt = typeof o === "string" ? { value: o, label: o } : o;
        return (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        );
      })}
    </select>
  );
}

export function Checkbox({
  label,
  defaultChecked,
}: {
  label: ReactNode;
  defaultChecked?: boolean;
}) {
  return (
    <label {...kit("Checkbox")} className="mcp-check">
      <input type="checkbox" defaultChecked={defaultChecked} />
      <span className="mcp-check__box">
        <Icon name="check" size={11} strokeWidth={3} />
      </span>
      <span>{label}</span>
    </label>
  );
}

export function Radio({
  label,
  name,
  defaultChecked,
}: {
  label: ReactNode;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label {...kit("Radio")} className="mcp-check">
      <input type="radio" name={name} defaultChecked={defaultChecked} />
      <span className="mcp-check__box mcp-check__box--round" />
      <span>{label}</span>
    </label>
  );
}

export function Switch({
  defaultChecked,
  label,
}: {
  defaultChecked?: boolean;
  label?: string;
}) {
  const control = (
    <span className="mcp-switch">
      <input type="checkbox" defaultChecked={defaultChecked} aria-label={label} />
      <span className="mcp-switch__track" />
    </span>
  );
  if (!label) return <span {...kit("Switch")}>{control}</span>;
  return (
    <label
      {...kit("Switch")}
      style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer" }}
    >
      {control}
      <span style={{ font: "400 var(--text-md)/1.3 var(--font-sans)" }}>{label}</span>
    </label>
  );
}

export function Slider({ value = 50 }: { value?: number }) {
  return (
    <div {...kit("Slider")} className="mcp-slider" role="slider" aria-valuenow={value}>
      <div className="mcp-slider__rail" />
      <div className="mcp-slider__fill" style={{ width: `${value}%` }} />
      <div className="mcp-slider__knob" style={{ left: `${value}%` }} />
    </div>
  );
}

/* Tabs / Segmented ---------------------------------------------- */

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ label: string; count?: number }>;
  active?: number;
  onChange?: (i: number) => void;
}) {
  const [internal, setInternal] = useState(0);
  const current = active ?? internal;
  return (
    <div {...kit("Tabs")} className="mcp-tabs" role="tablist">
      {tabs.map((t, i) => (
        <button
          key={t.label}
          role="tab"
          aria-selected={i === current}
          className={cx("mcp-tab", i === current && "mcp-tab--active")}
          onClick={() => (onChange ? onChange(i) : setInternal(i))}
        >
          {t.label}
          {t.count != null && <span className="mcp-tab__count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Segmented({
  options,
  active,
  onChange,
}: {
  options: Array<{ label: string; icon?: IconName }>;
  active?: number;
  onChange?: (i: number) => void;
}) {
  const [internal, setInternal] = useState(0);
  const current = active ?? internal;
  return (
    <div {...kit("Segmented")} className="mcp-seg" role="tablist">
      {options.map((o, i) => (
        <button
          key={o.label}
          role="tab"
          aria-selected={i === current}
          className={cx("mcp-seg__opt", i === current && "mcp-seg__opt--active")}
          onClick={() => (onChange ? onChange(i) : setInternal(i))}
        >
          {o.icon && <Icon name={o.icon} size={13} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* Tooltip / Kbd -------------------------------------------------- */

export function Tooltip({
  content,
  children,
  open,
}: {
  content: string;
  children: ReactNode;
  open?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const show = open ?? hover;
  return (
    <span
      {...kit("Tooltip")}
      className="mcp-tip-wrap"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
      {show && <span className="mcp-tip">{content}</span>}
    </span>
  );
}

export const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="mcp-kbd">{children}</kbd>
);

/* Spinner / Progress / Skeleton ---------------------------------- */

export const Spinner = ({ size = 16 }: { size?: number }) => (
  <span
    {...kit("Spinner")}
    className="mcp-spinner"
    style={{ width: size, height: size }}
    role="status"
    aria-label="Loading"
  />
);

export function ProgressBar({
  value,
  tone,
}: {
  value: number;
  tone?: "moss";
}) {
  return (
    <div
      {...kit("ProgressBar")}
      className="mcp-progress"
      role="progressbar"
      aria-valuenow={value}
    >
      <div
        className={cx("mcp-progress__fill", tone && `mcp-progress__fill--${tone}`)}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function Skeleton({
  width = "100%",
  height = 14,
  radius,
}: {
  width?: number | string;
  height?: number;
  radius?: number;
}) {
  return (
    <div
      {...kit("Skeleton")}
      className="mcp-skeleton"
      style={{ width, height, borderRadius: radius }}
    />
  );
}

/* KeyValue ------------------------------------------------------- */

export function KeyValue({
  rows,
  mono,
}: {
  rows: Array<[string, ReactNode]>;
  mono?: boolean;
}) {
  return (
    <div {...kit("KeyValue")} className="mcp-kv">
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: "contents" }}>
          <span className="mcp-kv__k">{k}</span>
          <span className={cx("mcp-kv__v", mono && "mcp-kv__v--mono")}>{v}</span>
        </div>
      ))}
    </div>
  );
}

/* Menu ------------------------------------------------------------ */

export function Menu({
  sections,
}: {
  sections: Array<{
    label?: string;
    items: Array<{ label: string; icon?: IconName; danger?: boolean; kbd?: string }>;
  }>;
}) {
  return (
    <div {...kit("Menu")} className="mcp-menu" role="menu">
      {sections.map((s, si) => (
        <div key={si}>
          {si > 0 && <hr className="mcp-menu__sep" />}
          {s.label && <div className="mcp-menu__label">{s.label}</div>}
          {s.items.map((it) => (
            <button
              key={it.label}
              role="menuitem"
              className={cx("mcp-menu__item", it.danger && "mcp-menu__item--danger")}
            >
              {it.icon && <Icon name={it.icon} size={15} />}
              <span style={{ flex: 1 }}>{it.label}</span>
              {it.kbd && <Kbd>{it.kbd}</Kbd>}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

/* Modal — composable dialog (rendered in place; wrap in your own overlay) */

export function Modal({
  title,
  sub,
  children,
  footer,
  onClose,
}: {
  title: string;
  sub?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
}) {
  return (
    <div {...kit("Modal")} className="mcp-modal" role="dialog" aria-label={title}>
      <div className="mcp-modal__head">
        <span>
          <span className="mcp-modal__title">{title}</span>
          {sub && <span className="mcp-modal__sub">{sub}</span>}
        </span>
        {onClose && <IconButton icon="x" label="Close" size="sm" onClick={onClose} />}
      </div>
      <div className="mcp-modal__body">{children}</div>
      {footer && <div className="mcp-modal__foot">{footer}</div>}
    </div>
  );
}

/* Modal (rendered in place, for showcase) -------------------------- */

export function ModalExample({
  title,
  children,
  confirmLabel = "Confirm",
  danger,
}: {
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <div {...kit("Modal")} className="mcp-modal" role="dialog" aria-label={title}>
      <div className="mcp-modal__head">
        <span className="mcp-modal__title">{title}</span>
        <IconButton icon="x" label="Close" size="sm" />
      </div>
      <div className="mcp-modal__body">{children}</div>
      <div className="mcp-modal__foot">
        <Button variant="ghost">Cancel</Button>
        <Button variant={danger ? "danger" : "primary"}>{confirmLabel}</Button>
      </div>
    </div>
  );
}

/* Toast ------------------------------------------------------------ */

export function Toast({
  children,
  tone = "neutral",
  action,
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "error";
  action?: string;
}) {
  const icon: IconName =
    tone === "success" ? "check" : tone === "error" ? "alert" : "info";
  return (
    <div
      {...kit("Toast")}
      className={cx("mcp-toast", tone !== "neutral" && `mcp-toast--${tone}`)}
      role="status"
    >
      <Icon name={icon} size={15} />
      <span>{children}</span>
      {action && <button className="mcp-toast__action">{action}</button>}
    </div>
  );
}

/* EmptyState -------------------------------------------------------- */

export function EmptyState({
  icon = "inbox",
  title,
  hint,
  action,
}: {
  icon?: IconName;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div {...kit("EmptyState")} className="mcp-empty">
      <Icon name={icon} size={26} strokeWidth={1.4} />
      <span className="mcp-empty__title">{title}</span>
      {hint && <span className="mcp-empty__hint">{hint}</span>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}
