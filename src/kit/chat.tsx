import { useState, type ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { Chip, IconButton, Spinner } from "./primitives";

const kit = (name: string) => ({ "data-kit": name });

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

/* Chat frame — a claude.ai-style window to stage conversations in. */

export function ChatFrame({
  title = "New chat",
  model = "Claude Sonnet",
  children,
  footer,
  height,
}: {
  title?: string;
  model?: string;
  children: ReactNode;
  footer?: ReactNode;
  height?: number | string;
}) {
  return (
    <div {...kit("ChatFrame")} className="mcp-chatframe" style={{ height }}>
      <div className="mcp-chatframe__bar">
        <span className="mcp-chatframe__dots">
          <i />
          <i />
          <i />
        </span>
        <span className="mcp-chatframe__title">
          <Icon name="spark" size={13} style={{ color: "var(--crail)" }} />
          {title}
        </span>
        <span className="mcp-chatframe__model">
          <Icon name="spark" size={11} />
          {model}
        </span>
      </div>
      <div className="mcp-chatframe__body">{children}</div>
      {footer && <div className="mcp-chatframe__foot">{footer}</div>}
    </div>
  );
}

/* Messages ------------------------------------------------------- */

export function UserMessage({ children }: { children: ReactNode }) {
  return (
    <div className="mcp-msg mcp-msg--user">
      <div {...kit("UserMessage")} className="mcp-msg-user">
        {children}
      </div>
    </div>
  );
}

export function AssistantMessage({
  children,
  meta,
}: {
  children: ReactNode;
  meta?: string;
}) {
  return (
    <div className="mcp-msg">
      <div {...kit("AssistantMessage")} className="mcp-msg-assistant">
        {children}
      </div>
      {meta && (
        <div className="mcp-msg__meta">
          <Icon name="spark" size={11} style={{ color: "var(--crail)" }} />
          {meta}
        </div>
      )}
    </div>
  );
}

export function ThinkingBlock({
  summary = "Thought for 6 seconds",
  children,
  defaultOpen = false,
}: {
  summary?: string;
  children?: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div {...kit("ThinkingBlock")} className="mcp-thinking">
      <button className="mcp-thinking__head" onClick={() => setOpen(!open)}>
        <Icon name={open ? "chevronDown" : "chevronRight"} size={12} />
        {summary}
      </button>
      {open && children && <div className="mcp-thinking__body">{children}</div>}
    </div>
  );
}

export function ContextDivider({ children }: { children: ReactNode }) {
  return (
    <div {...kit("ContextDivider")} className="mcp-ctx-divider">
      {children}
    </div>
  );
}

/* Tool call block -------------------------------------------------- */

export type ToolStatus = "running" | "success" | "error";

export function ToolCallBlock({
  tool,
  server,
  status = "success",
  duration,
  params,
  icon = "wrench",
  children,
  defaultOpen = true,
  bareResult = false,
}: {
  tool: string;
  server?: string;
  status?: ToolStatus;
  duration?: string;
  params?: object;
  icon?: IconName;
  children?: ReactNode;
  defaultOpen?: boolean;
  bareResult?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div {...kit("ToolCallBlock")} className="mcp-tool">
      <button className="mcp-tool__head" onClick={() => setOpen(!open)}>
        <span
          className={cx(
            "mcp-tool__glyph",
            status === "running" && "mcp-tool__glyph--running",
            status === "error" && "mcp-tool__glyph--error"
          )}
        >
          {status === "running" ? <Spinner size={13} /> : <Icon name={icon} size={14} />}
        </span>
        <span>
          <div className="mcp-tool__name">
            <code>{tool}</code>
          </div>
          {server && <div className="mcp-tool__server">{server}</div>}
        </span>
        <span className="mcp-tool__spacer" />
        <span
          className={cx(
            "mcp-tool__status",
            status === "success" && "mcp-tool__status--success",
            status === "error" && "mcp-tool__status--error"
          )}
        >
          {status === "running" && "Running…"}
          {status === "success" && (
            <>
              <Icon name="check" size={12} strokeWidth={2.5} />
              {duration ?? "Done"}
            </>
          )}
          {status === "error" && (
            <>
              <Icon name="alert" size={12} />
              Failed
            </>
          )}
        </span>
        <Icon
          name="chevronDown"
          size={14}
          className={cx("mcp-tool__chev", open && "mcp-tool__chev--open")}
        />
      </button>

      {open && params && (
        <div className="mcp-tool__io">
          <div className="mcp-tool__io-label">Request</div>
          <pre className="mcp-tool__params">{JSON.stringify(params, null, 2)}</pre>
        </div>
      )}
      {open && children && (
        <div className={cx("mcp-tool__result", bareResult && "mcp-tool__result--bare")}>
          {children}
        </div>
      )}
    </div>
  );
}

/* Code block -------------------------------------------------------- */

export function CodeBlock({
  language,
  children,
}: {
  language: string;
  children: ReactNode;
}) {
  return (
    <div {...kit("CodeBlock")} className="mcp-code">
      <div className="mcp-code__bar">
        <span className="mcp-code__lang">{language}</span>
        <IconButton icon="copy" label="Copy code" size="sm" />
      </div>
      <pre className="mcp-code__pre">{children}</pre>
    </div>
  );
}

/* Tokens for fake syntax highlighting in showcase code samples */
export const Kw = ({ children }: { children: ReactNode }) => (
  <span className="tok-kw">{children}</span>
);
export const Str = ({ children }: { children: ReactNode }) => (
  <span className="tok-str">{children}</span>
);
export const Com = ({ children }: { children: ReactNode }) => (
  <span className="tok-com">{children}</span>
);
export const Num = ({ children }: { children: ReactNode }) => (
  <span className="tok-num">{children}</span>
);
export const Fn = ({ children }: { children: ReactNode }) => (
  <span className="tok-fn">{children}</span>
);

/* Composer ----------------------------------------------------------- */

export function ChatInput({
  placeholder = "Reply to Claude…",
  value,
  toolCount,
  disabled,
}: {
  placeholder?: string;
  value?: string;
  toolCount?: number;
  disabled?: boolean;
}) {
  return (
    <div {...kit("ChatInput")} className="mcp-composer">
      <textarea
        className="mcp-composer__input"
        placeholder={placeholder}
        defaultValue={value}
        rows={1}
      />
      <div className="mcp-composer__row">
        <IconButton icon="plus" label="Attach" />
        <IconButton icon="sliders" label="Tools" />
        {toolCount != null && (
          <span className="mcp-composer__tools">
            <Icon name="wrench" size={11} />
            {toolCount} tools
          </span>
        )}
        <button
          className="mcp-composer__send"
          aria-label="Send message"
          disabled={disabled}
        >
          <Icon name="send" size={15} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export function SuggestionChips({ items }: { items: string[] }) {
  return (
    <div {...kit("SuggestionChips")} className="mcp-suggestions">
      {items.map((s) => (
        <Chip key={s}>{s}</Chip>
      ))}
    </div>
  );
}
