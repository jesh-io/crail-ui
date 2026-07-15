import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "./icons";
import { EmptyState, IconButton } from "./primitives";

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

/* ═══ Spacing primitives — the layout vocabulary ═════════════════ */

export function Stack({
  gap = 12,
  align,
  children,
  style,
}: {
  /** Gap between children, px. */
  gap?: number;
  align?: "start" | "center" | "end" | "stretch";
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      {...kit("Stack")}
      style={{ display: "flex", flexDirection: "column", gap, alignItems: align, ...style }}
    >
      {children}
    </div>
  );
}

export function Cluster({
  gap = 8,
  align = "center",
  justify,
  children,
  style,
}: {
  /** Gap between children, px. */
  gap?: number;
  align?: "start" | "center" | "end" | "baseline";
  justify?: "start" | "center" | "end" | "between";
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      {...kit("Cluster")}
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap,
        alignItems: align,
        justifyContent: justify === "between" ? "space-between" : justify,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Grid({
  cols,
  min = 180,
  gap = 12,
  children,
  style,
}: {
  /** Fixed column count; omit for responsive auto-fit. */
  cols?: number;
  /** Auto-fit mode: minimum column width, px — columns wrap as the container narrows. */
  min?: number;
  gap?: number;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      {...kit("Grid")}
      style={{
        display: "grid",
        gap,
        gridTemplateColumns: cols
          ? `repeat(${cols}, minmax(0, 1fr))`
          : `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ═══ PageHeader — a fullscreen app's top bar ════════════════════ */

export function PageHeader({
  title,
  sub,
  icon,
  onBack,
  actions,
  sticky = false,
}: {
  title: ReactNode;
  sub?: ReactNode;
  icon?: IconName;
  /** Renders a back chevron before the title. */
  onBack?: () => void;
  actions?: ReactNode;
  /** Pin to the top of the scroll container. */
  sticky?: boolean;
}) {
  return (
    <header {...kit("PageHeader")} className={cx("mcp-pagehead", sticky && "is-sticky")}>
      {onBack && <IconButton icon="chevronLeft" label="Back" onClick={onBack} />}
      {icon && (
        <span className="mcp-pagehead__glyph">
          <Icon name={icon} size={15} />
        </span>
      )}
      <span className="mcp-pagehead__id">
        <div className="mcp-pagehead__title">{title}</div>
        {sub && <div className="mcp-pagehead__sub">{sub}</div>}
      </span>
      {actions && <span className="mcp-pagehead__actions">{actions}</span>}
    </header>
  );
}

/* ═══ MasterDetail — selection-aware list + detail layout ════════ */

function useContainerWidth(ref: RefObject<HTMLDivElement>) {
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

export function MasterDetail({
  master,
  detail,
  onClose,
  variant = "split",
  side = "left",
  detailTitle,
  detailSub,
  placeholder = "Select an item to see its details",
  initial = 38,
  min = 24,
  max = 62,
  panelInitial = 46,
  height = 420,
  breakpoint = 560,
}: {
  /** The list pane — always mounted, drives selection from outside. */
  master: ReactNode;
  /** Detail for the current selection; null/undefined means nothing selected. */
  detail?: ReactNode;
  /** Called when the user dismisses the detail (Back, ✕, scrim, Escape). */
  onClose?: () => void;
  /** "split": two panes, resizable divider. "overlay": detail panel slides over the list. */
  variant?: "split" | "overlay";
  /** Which side the master (list) pane sits on in split mode. */
  side?: "left" | "right";
  detailTitle?: ReactNode;
  detailSub?: ReactNode;
  /** Split-mode empty state when nothing is selected. */
  placeholder?: ReactNode;
  /** Master pane width, % of the container (split mode). */
  initial?: number;
  min?: number;
  max?: number;
  /** Overlay panel starting width, % of the container. */
  panelInitial?: number;
  /** Use "100%" or "100dvh" inside fullscreen shells. */
  height?: number | string;
  /** Container width (px) below which the narrow presentation kicks in:
      split → stacked pages with a back header; overlay → bottom card. */
  breakpoint?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useContainerWidth(ref);
  const narrow = width !== null && width < breakpoint;
  const open = detail !== null && detail !== undefined;

  const [pct, setPct] = useState(initial);
  const [panelPct, setPanelPct] = useState(panelInitial);
  const [dragging, setDragging] = useState(false);

  // Escape dismisses any over-the-list presentation (never the split pane).
  const overlaid = open && (narrow || variant === "overlay");
  useEffect(() => {
    if (!overlaid || !onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlaid, onClose]);

  const drag = (e: ReactPointerEvent, apply: (pctFromLeft: number) => void) => {
    e.preventDefault();
    const el = ref.current;
    if (!el) return;
    setDragging(true);
    const rect = el.getBoundingClientRect();
    const move = (ev: PointerEvent) => apply(((ev.clientX - rect.left) / rect.width) * 100);
    const up = () => {
      setDragging(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const head = (backIcon: IconName) => (
    <div className="mcp-md__head">
      <IconButton icon={backIcon} label="Close detail" size="sm" onClick={() => onClose?.()} />
      <span className="mcp-md__id">
        {detailTitle && <div className="mcp-md__title">{detailTitle}</div>}
        {detailSub && <div className="mcp-md__sub">{detailSub}</div>}
      </span>
    </div>
  );

  /* Narrow: master is the page; detail pushes in as a second page (split)
     or rises as a bottom card (overlay). */
  if (narrow) {
    return (
      <div {...kit("MasterDetail")} ref={ref} className="mcp-md" style={{ height }}>
        <div className="mcp-md__pane">{master}</div>
        {open && variant === "split" && (
          <div className="mcp-md__page">
            {head("chevronLeft")}
            <div className="mcp-md__body">{detail}</div>
          </div>
        )}
        {open && variant === "overlay" && (
          <>
            <div className="mcp-md__scrim" onClick={() => onClose?.()} />
            <div className="mcp-md__card" role="dialog">
              {head("x")}
              <div className="mcp-md__body">{detail}</div>
            </div>
          </>
        )}
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div {...kit("MasterDetail")} ref={ref} className="mcp-md" style={{ height }}>
        <div className="mcp-md__pane">{master}</div>
        {open && (
          <>
            <div className="mcp-md__scrim" onClick={() => onClose?.()} />
            <div
              className={cx("mcp-md__panel", dragging && "is-dragging")}
              role="dialog"
              style={{ width: `${panelPct}%` }}
            >
              <div
                className="mcp-md__panel-grip"
                role="separator"
                aria-orientation="vertical"
                tabIndex={0}
                onPointerDown={(e) =>
                  drag(e, (fromLeft) => setPanelPct(Math.min(72, Math.max(30, 100 - fromLeft))))
                }
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft") setPanelPct((p) => Math.min(72, p + 2));
                  if (e.key === "ArrowRight") setPanelPct((p) => Math.max(30, p - 2));
                }}
              >
                <i />
              </div>
              {head("x")}
              <div className="mcp-md__body">{detail}</div>
            </div>
          </>
        )}
      </div>
    );
  }

  /* Wide split: resizable panes; the divider always sizes the master. */
  const masterFirst = side === "left";
  const columns = masterFirst
    ? `${pct}% 11px minmax(0, 1fr)`
    : `minmax(0, 1fr) 11px ${pct}%`;
  const setFromLeft = (fromLeft: number) => {
    const next = masterFirst ? fromLeft : 100 - fromLeft;
    setPct(Math.min(max, Math.max(min, next)));
  };
  const nudge = (delta: number) => setPct((p) => Math.min(max, Math.max(min, p + delta)));
  const masterPane = <div className="mcp-md__pane">{master}</div>;
  const detailPane = (
    <div className="mcp-md__pane">
      {open ? (
        detail
      ) : typeof placeholder === "string" ? (
        <div className="mcp-md__center">
          <EmptyState title={placeholder} />
        </div>
      ) : (
        placeholder
      )}
    </div>
  );
  return (
    <div
      {...kit("MasterDetail")}
      ref={ref}
      className={cx("mcp-md", "mcp-md--split", dragging && "is-dragging")}
      style={{ height, gridTemplateColumns: columns }}
    >
      {masterFirst ? masterPane : detailPane}
      <div
        className="mcp-md__handle"
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(pct)}
        tabIndex={0}
        onPointerDown={(e) => drag(e, setFromLeft)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") nudge(masterFirst ? -2 : 2);
          if (e.key === "ArrowRight") nudge(masterFirst ? 2 : -2);
        }}
      >
        <i />
      </div>
      {masterFirst ? detailPane : masterPane}
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
