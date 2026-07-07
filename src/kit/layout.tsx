import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "./icons";
import { IconButton } from "./primitives";

const kit = (name: string) => ({ "data-kit": name });

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

/* Shared overlay behavior: lock page scroll, close on Escape. */
function useOverlay(open: boolean, onClose?: () => void) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
}

/* ═══ Disclosure — inline collapsible row ════════════════════════ */

export function Disclosure({
  label,
  meta,
  defaultOpen = false,
  children,
}: {
  label: ReactNode;
  meta?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div {...kit("Disclosure")} className="mcp-disclosure">
      <button
        className="mcp-disclosure__head"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <Icon
          name="chevronRight"
          size={13}
          className={cx("mcp-disclosure__chev", open && "is-open")}
        />
        <span className="mcp-disclosure__label">{label}</span>
        {meta && <span className="mcp-disclosure__meta">{meta}</span>}
      </button>
      {open && <div className="mcp-disclosure__body">{children}</div>}
    </div>
  );
}

/* ═══ Accordion — bordered stack of collapsible sections ═════════ */

export function Accordion({
  items,
  single = false,
  defaultOpen = [0],
}: {
  items: Array<{ label: ReactNode; meta?: ReactNode; icon?: IconName; content: ReactNode }>;
  single?: boolean;
  defaultOpen?: number[];
}) {
  const [open, setOpen] = useState<Set<number>>(() => new Set(defaultOpen));
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(single ? [] : prev);
      if (prev.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  return (
    <div {...kit("Accordion")} className="mcp-accordion">
      {items.map((it, i) => {
        const isOpen = open.has(i);
        return (
          <div key={i} className={cx("mcp-accordion__item", isOpen && "is-open")}>
            <button
              className="mcp-accordion__head"
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
            >
              {it.icon && (
                <span className="mcp-accordion__glyph">
                  <Icon name={it.icon} size={14} />
                </span>
              )}
              <span className="mcp-accordion__label">{it.label}</span>
              {it.meta && <span className="mcp-accordion__meta">{it.meta}</span>}
              <Icon
                name="chevronDown"
                size={14}
                className={cx("mcp-accordion__chev", isOpen && "is-open")}
              />
            </button>
            {isOpen && <div className="mcp-accordion__body">{it.content}</div>}
          </div>
        );
      })}
    </div>
  );
}

/* ═══ CollapsibleCard — a card whose body folds away ═════════════ */

export function CollapsibleCard({
  title,
  sub,
  icon = "box",
  actions,
  defaultOpen = true,
  children,
}: {
  title: ReactNode;
  sub?: ReactNode;
  icon?: IconName;
  actions?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div {...kit("CollapsibleCard")} className="mcp-collapse-card">
      <div className="mcp-collapse-card__bar">
        <button
          className="mcp-collapse-card__toggle"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          <span className="mcp-accordion__glyph">
            <Icon name={icon} size={14} />
          </span>
          <span>
            <div className="mcp-collapse-card__title">{title}</div>
            {sub && <div className="mcp-collapse-card__sub">{sub}</div>}
          </span>
        </button>
        <span className="mcp-collapse-card__end">
          {actions}
          <IconButton
            icon={open ? "chevronUp" : "chevronDown"}
            label={open ? "Collapse" : "Expand"}
            size="sm"
            onClick={() => setOpen(!open)}
          />
        </span>
      </div>
      {open && <div className="mcp-collapse-card__body">{children}</div>}
    </div>
  );
}

/* ═══ SplitView — two panes with a draggable divider ═════════════ */

export function SplitView({
  left,
  right,
  initial = 46,
  min = 24,
  max = 76,
  height = 340,
}: {
  left: ReactNode;
  right: ReactNode;
  initial?: number;
  min?: number;
  max?: number;
  height?: number | string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(initial);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (e: ReactPointerEvent) => {
    e.preventDefault();
    const el = ref.current;
    if (!el) return;
    setDragging(true);
    const rect = el.getBoundingClientRect();
    const move = (ev: PointerEvent) => {
      const next = ((ev.clientX - rect.left) / rect.width) * 100;
      setPct(Math.min(max, Math.max(min, next)));
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      {...kit("SplitView")}
      ref={ref}
      className={cx("mcp-split", dragging && "is-dragging")}
      style={{ height, gridTemplateColumns: `${pct}% 11px minmax(0, 1fr)` }}
    >
      <div className="mcp-split__pane">{left}</div>
      <div
        className="mcp-split__handle"
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(pct)}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setPct((p) => Math.max(min, p - 2));
          if (e.key === "ArrowRight") setPct((p) => Math.min(max, p + 2));
        }}
      >
        <i />
      </div>
      <div className="mcp-split__pane">{right}</div>
    </div>
  );
}

/* ═══ Sheet — side or bottom panel over the page ═════════════════ */

export function Sheet({
  open,
  onClose,
  side = "right",
  title,
  sub,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  side?: "right" | "bottom";
  title: ReactNode;
  sub?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useOverlay(open, onClose);
  return createPortal(
    <div
      className={cx("mcp-sheet-layer", `mcp-sheet-layer--${side}`, open && "is-open")}
      aria-hidden={!open}
    >
      <div className="mcp-sheet__scrim" onClick={onClose} />
      <div {...kit("Sheet")} className="mcp-sheet" role="dialog" aria-modal="true">
        <div className="mcp-sheet__head">
          <span>
            <div className="mcp-sheet__title">{title}</div>
            {sub && <div className="mcp-sheet__sub">{sub}</div>}
          </span>
          <IconButton icon="x" label="Close" onClick={onClose} />
        </div>
        <div className="mcp-sheet__body">{children}</div>
        {footer && <div className="mcp-sheet__foot">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ═══ Fullscreen — a takeover surface for deep interaction ═══════ */

export function Fullscreen({
  open,
  onClose,
  icon = "wrench",
  title,
  sub,
  actions,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  icon?: IconName;
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  useOverlay(open, onClose);
  if (!open) return null;
  return createPortal(
    <div {...kit("Fullscreen")} className="mcp-fullscreen" role="dialog" aria-modal="true">
      <header className="mcp-fullscreen__bar">
        <span className="mcp-tool__glyph">
          <Icon name={icon} size={14} />
        </span>
        <span className="mcp-fullscreen__id">
          <div className="mcp-fullscreen__title">{title}</div>
          {sub && <div className="mcp-fullscreen__sub">{sub}</div>}
        </span>
        <span className="mcp-fullscreen__actions">{actions}</span>
        <span className="mcp-fullscreen__sep" />
        <IconButton icon="shrink" label="Exit full screen" onClick={onClose} />
      </header>
      <div className="mcp-fullscreen__body">
        <div className={cx("mcp-fullscreen__content", wide && "mcp-fullscreen__content--wide")}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ═══ Expandable — give any widget a full-screen affordance ══════ */

export function Expandable({
  title,
  sub,
  icon = "expand",
  actions,
  children,
}: {
  title: ReactNode;
  sub?: ReactNode;
  icon?: IconName;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div {...kit("Expandable")} className="mcp-expandable">
      {children}
      <button
        className="mcp-expandable__btn"
        onClick={() => setOpen(true)}
        aria-label="Open full screen"
        title="Open full screen"
      >
        <Icon name="expand" size={12} strokeWidth={2} />
      </button>
      <Fullscreen
        open={open}
        onClose={() => setOpen(false)}
        icon={icon}
        title={title}
        sub={sub}
        actions={actions}
      >
        {children}
      </Fullscreen>
    </div>
  );
}
