import type { ReactNode } from "react";
import {
  Badge,
  Button,
  IconButton,
  Expandable,
  ChatFrame,
  UserMessage,
  AssistantMessage,
  ThinkingBlock,
  ToolCallBlock,
  ChatInput,
  StatCard,
  StatRow,
  BarChart,
  DataTable,
  ListManager,
  ListRow,
  FileCard,
  FileGrid,
  StatusBanner,
  ConfirmationCard,
  ElicitationCard,
  ProgressTracker,
  DiffView,
  LogViewer,
  Timeline,
} from "../kit";

export type Scenario = {
  id: string;
  nav: string;
  title: string;
  lede: ReactNode;
  chatTitle: string;
  render: () => ReactNode;
};

/* ── 1 · Personal finance ─────────────────────────────────────── */

const finance: Scenario = {
  id: "finance",
  nav: "Finance review",
  title: "A month-end money review",
  lede: (
    <>
      A personal-finance server. Read tools render as stats, charts, and tables
      inside their tool blocks; the one write action goes through a confirmation
      card before anything changes.
    </>
  ),
  chatTitle: "June money review",
  render: () => (
    <>
      <UserMessage>How did my spending look in June?</UserMessage>

      <ThinkingBlock summary="Thought for 4 seconds" />

      <ToolCallBlock
        tool="get_spending_totals"
        server="copilot-money"
        status="success"
        duration="0.4s"
        icon="dollar"
        params={{ period: "2026-06", compare: "2026-05" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <StatRow>
            <StatCard label="Total spent" value="$4,286" delta="8% vs May" direction="down" />
            <StatCard label="Income" value="$9,700" delta="unchanged" direction="flat" />
            <StatCard label="Saved" value="$5,414" delta="+$610" direction="up" />
          </StatRow>
          <Expandable
            title="Six-month trend"
            sub="copilot-money · get_spending_totals"
            icon="chart"
          >
            <BarChart
              title="Six-month trend"
              subtitle="total spend"
              data={[
                { label: "Jan", value: 4980 },
                { label: "Feb", value: 4420 },
                { label: "Mar", value: 5210 },
                { label: "Apr", value: 4660 },
                { label: "May", value: 4655 },
                { label: "Jun", value: 4286 },
              ]}
              highlight={5}
            />
          </Expandable>
        </div>
      </ToolCallBlock>

      <AssistantMessage>
        <p>
          A good month — <strong>$4,286</strong> total, your lowest since
          February, and you saved $610 more than in May. Groceries went up a bit,
          but dining out dropped by more, which usually means you cooked more.
        </p>
        <p>
          One thing stands out: <em>two identical Spotify charges</em>. Let me
          check your subscriptions.
        </p>
      </AssistantMessage>

      <ToolCallBlock
        tool="list_recurrings"
        server="copilot-money"
        status="success"
        duration="0.3s"
        icon="refresh"
        params={{ category: "subscriptions" }}
        bareResult
      >
        <ListManager flat>
          <ListRow
            icon="music"
            title="Spotify Premium"
            subtitle="$11.99 · monthly · since 2019"
            end={<Badge tone="moss" dot>Original</Badge>}
          />
          <ListRow
            icon="music"
            title="Spotify Premium"
            subtitle="$11.99 · monthly · since Jun 21"
            end={<Badge tone="amber" dot>Duplicate?</Badge>}
          />
          <ListRow
            icon="globe"
            title="Fastmail"
            subtitle="$5.00 · monthly · since 2022"
          />
        </ListManager>
      </ToolCallBlock>

      <AssistantMessage>
        <p>
          Confirmed — the second Spotify subscription started on June 21 and
          bills the same card. Canceling it saves <strong>$143.88 a year</strong>.
          Shall I?
        </p>
      </AssistantMessage>

      <UserMessage>Yes, cancel the new one.</UserMessage>

      <ConfirmationCard
        title="Cancel Spotify Premium (duplicate)"
        subtitle="copilot-money wants to edit a recurring charge"
        details={[
          ["Action", "Mark recurring as canceled"],
          ["Charge", "Spotify Premium — $11.99/mo, started Jun 21"],
          ["Keeps", "Your original subscription from 2019"],
          ["Effective", "Before the Jul 3 renewal"],
        ]}
      />

      <ToolCallBlock
        tool="edit_recurring"
        server="copilot-money"
        status="success"
        duration="0.6s"
        icon="check"
        defaultOpen={false}
      />

      <AssistantMessage meta="Claude · 9:44 AM">
        <p>
          Done — the duplicate is canceled and won't renew on July 3. Want me to
          set a subscriptions budget so this gets caught automatically next time?
        </p>
      </AssistantMessage>
    </>
  ),
};

/* ── 2 · Release triage ───────────────────────────────────────── */

const triage: Scenario = {
  id: "triage",
  nav: "Release triage",
  title: "Triaging a release",
  lede: (
    <>
      An issue-tracker server during release week. Tables for the bug queue, an
      elicitation card when the assistant needs a decision, a progress tracker
      while it works, and a log of exactly what it filed.
    </>
  ),
  chatTitle: "v2.4 release triage",
  render: () => (
    <>
      <UserMessage>
        What's blocking the v2.4 release? We're supposed to cut it Thursday.
      </UserMessage>

      <ToolCallBlock
        tool="list_issues"
        server="linear"
        status="success"
        duration="0.5s"
        icon="list"
        params={{ milestone: "v2.4", state: "open", priority: ["urgent", "high"] }}
        bareResult
      >
        <DataTable
          columns={[
            { header: "Issue" },
            { header: "Title" },
            { header: "Assignee" },
            { header: "Priority", sorted: "desc" },
          ]}
          rows={[
            ["ENG-412", "Payment webhook drops retries under load", "Maya K.", <Badge key="1" tone="red" dot>Urgent</Badge>],
            ["ENG-431", "Safari: composer caret jumps on paste", "unassigned", <Badge key="2" tone="red" dot>Urgent</Badge>],
            ["ENG-405", "Slow cold start on the EU region", "Tom R.", <Badge key="3" tone="amber" dot>High</Badge>],
            ["ENG-428", "Docs: OAuth scopes table outdated", "unassigned", <Badge key="4" tone="amber" dot>High</Badge>],
          ]}
          footer={{ summary: "4 open blockers · milestone v2.4" }}
        />
      </ToolCallBlock>

      <AssistantMessage>
        <p>
          Four blockers. Two are urgent, and <strong>ENG-431</strong> is
          unassigned with three days left. The docs issue doesn't need to block
          the cut — it can ship in a point release.
        </p>
        <p>How do you want to handle the unassigned urgent one?</p>
      </AssistantMessage>

      <ElicitationCard
        question="ENG-431 — Safari caret bug. Who takes it?"
        selected={1}
        options={[
          { title: "Assign to Maya K.", description: "Owns the composer, but already has ENG-412." },
          { title: "Assign to Priya S.", description: "Fixed the last two Safari issues; light load this week." },
          { title: "Defer to v2.4.1", description: "Ship Thursday with a known issue note." },
        ]}
      />

      <UserMessage>Priya. And move the docs one out of the milestone.</UserMessage>

      <ToolCallBlock
        tool="save_issue"
        server="linear"
        status="running"
        icon="pencil"
        params={{ issue: "ENG-431", assignee: "priya.s", milestone: "v2.4" }}
      >
        <ProgressTracker
          steps={[
            { title: "Assigned ENG-431 to Priya S.", sub: "notified in #eng-frontend", state: "done" },
            { title: "Moved ENG-428 to v2.4.1", sub: "milestone updated", state: "done" },
            { title: "Updating the release checklist", state: "active" },
            { title: "Post summary to #release", state: "pending" },
          ]}
        />
      </ToolCallBlock>

      <AssistantMessage>
        <p>
          Both changes are in. Here's where the release stands now — I'll post
          the same summary to <strong>#release</strong>:
        </p>
      </AssistantMessage>

      <Timeline
        items={[
          { title: "ENG-412 · fix in review", time: "Mon", body: "Maya's retry-queue patch, +214 −38." },
          { title: "ENG-431 · assigned to Priya", time: "Today", body: "Repro confirmed on Safari 19.2.", accent: true },
          { title: "ENG-405 · mitigation shipped", time: "Today", body: "Cold starts down from 4.1s to 1.3s." },
          { title: "Code freeze", time: "Wed 5 PM" },
          { title: "Cut v2.4", time: "Thu 10 AM" },
        ]}
      />

      <StatusBanner tone="success" title="On track for Thursday">
        2 blockers remain, both assigned and in progress. Next check-in tomorrow at 9 AM.
      </StatusBanner>
    </>
  ),
};

/* ── 3 · Docs editing ─────────────────────────────────────────── */

const docs: Scenario = {
  id: "docs",
  nav: "Docs editing",
  title: "Editing docs with a review gate",
  lede: (
    <>
      A content server with file browsing, a diff preview before any write, and
      a terminal log for the deploy. The diff <em>is</em> the approval UI — the
      person sees the exact change, not a description of it.
    </>
  ),
  chatTitle: "Fix the OAuth docs",
  render: () => (
    <>
      <UserMessage>
        Our OAuth docs still say tokens expire after 30 days — it's 90 now.
        Find and fix that.
      </UserMessage>

      <ToolCallBlock
        tool="search_documents"
        server="docs-cms"
        status="success"
        duration="0.7s"
        icon="search"
        params={{ query: "token expiry 30 days", scope: "docs/auth" }}
        bareResult
      >
        <div style={{ padding: 13 }}>
          <FileGrid>
            <FileCard name="oauth-scopes.md" meta="2 matches · updated Mar 2026" icon="doc" />
            <FileCard name="token-lifecycle.md" meta="4 matches · updated Jan 2026" icon="doc" />
            <FileCard name="faq.md" meta="1 match · updated May 2026" icon="doc" tone="denim" />
          </FileGrid>
        </div>
      </ToolCallBlock>

      <AssistantMessage>
        <p>
          Seven mentions across three files. <code>token-lifecycle.md</code> has
          the canonical table; the other two reference it. Here's the change for
          the main file — the rest follow the same pattern.
        </p>
      </AssistantMessage>

      <DiffView
        file="docs/auth/token-lifecycle.md"
        additions={3}
        deletions={3}
        lines={[
          { kind: "hunk", text: "@@ Access token lifetime @@" },
          { kind: "ctx", text: "| Token type | Lifetime | Refreshable |" },
          { kind: "del", text: "| Access | 30 days | yes |" },
          { kind: "add", text: "| Access | 90 days | yes |" },
          { kind: "ctx", text: "| Refresh | 1 year | — |" },
          { kind: "del", text: "Tokens expire after 30 days of issue." },
          { kind: "add", text: "Tokens expire 90 days after issue." },
          { kind: "del", text: "rotate keys monthly to stay ahead of expiry." },
          { kind: "add", text: "rotate keys quarterly to stay ahead of expiry." },
        ]}
      />

      <ConfirmationCard
        title="Apply this change to 3 files"
        subtitle="docs-cms wants to write to your docs branch"
        details={[
          ["Files", "token-lifecycle.md, oauth-scopes.md, faq.md"],
          ["Changes", "7 replacements · +9 −9 lines"],
          ["Branch", "docs/token-expiry-90d"],
          ["Then", "Opens a PR for review — nothing merges automatically"],
        ]}
        resolved
        resolvedLabel="Approved · just now"
      />

      <ToolCallBlock
        tool="publish_branch"
        server="docs-cms"
        status="success"
        duration="3.2s"
        icon="upload"
        bareResult
      >
        <LogViewer
          title="docs-cms · publish"
          lines={[
            { time: "10:02:11", text: "writing 3 files to docs/token-expiry-90d" },
            { time: "10:02:12", text: "✓ token-lifecycle.md (+3 −3)", level: "ok" },
            { time: "10:02:12", text: "✓ oauth-scopes.md (+4 −4)", level: "ok" },
            { time: "10:02:12", text: "✓ faq.md (+2 −2)", level: "ok" },
            { time: "10:02:13", text: "building preview…" },
            { time: "10:02:14", text: "✓ preview ready · 0 broken links", level: "ok" },
            { time: "10:02:14", text: "PR #482 opened → docs-site", level: "ok" },
          ]}
        />
      </ToolCallBlock>

      <AssistantMessage meta="Claude · 10:02 AM">
        <p>
          All three files updated and <strong>PR #482</strong> is open with a
          clean preview build — no broken links. The FAQ also claimed tokens
          can't be revoked early, which is no longer true; want me to fix that
          while we're in there?
        </p>
      </AssistantMessage>
      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="primary" size="sm">
          Yes, fix it
        </Button>
        <Button variant="ghost" size="sm" iconAfter="external">
          Review PR #482
        </Button>
        <span style={{ flex: 1 }} />
        <IconButton icon="copy" label="Copy PR link" size="sm" />
      </div>
    </>
  ),
};

export const SCENARIOS: Scenario[] = [finance, triage, docs];

export function ScenarioStage({
  scenario,
  inspect,
}: {
  scenario: Scenario;
  inspect: boolean;
}) {
  return (
    <div data-inspect={inspect ? "on" : "off"}>
      <ChatFrame
        title={scenario.chatTitle}
        model="Claude Sonnet"
        footer={<ChatInput toolCount={38} />}
      >
        {scenario.render()}
      </ChatFrame>
    </div>
  );
}
