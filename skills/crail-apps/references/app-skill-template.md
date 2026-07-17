# Every house serves its own operator skill

The builder skill (this one) teaches agents to BUILD MCP apps. But the agent
that ultimately drives your app at runtime — inside the host, on the user's
behalf — needs different knowledge: when to open which window, which tools to
prefer with a user present, what the domain's rituals are. That knowledge is
app-specific, and it should ship WITH the app.

**The convention:** serve a `skill.md` from your server's domain (e.g.
`https://shipboard.example.com/skill.md`), and mention it in your server's
`instructions`. Users install it into their agent; agents that read it drive
your app the way you designed it to be driven.

Why a served file (not just tool descriptions):
- Descriptions are read at tool-selection time and get skimmed; a skill is
  loaded into context and shapes behavior across the whole session.
- Descriptions can't hold cross-tool workflows ("triage before drafting,
  always") or tone guidance ("guide conversationally, one question at a
  time").
- A URL is installable, versionable, and lives next to the app it describes.

## Template

```markdown
---
name: <app-name>
description: Drive <App> well from chat — when to open windows vs. answer in
  prose, which tools to prefer with the user present, and the workflows the
  app expects. Use whenever the <App> MCP server is connected.
---

# <App> — how to drive it

<One paragraph: what the app is, what the house's rooms are, what the user
comes here to do.>

## Show, don't paste

- PREFER `show_*` tools over describing data in prose — the card is the
  native way to look at <domain objects> together. "Here's what I'm looking
  at" beats three paragraphs.
- Windows answer the question that was asked. Open `show_<detail>` for one
  thing, `show_<index>` for the landscape. Don't open the whole house when
  a glance answers it.
- After acting on the user's behalf, re-show the affected view — the user
  should SEE the change, not read about it.

## The tools, by intent

| When the user wants… | Call | Notes |
|---|---|---|
| a glance at <X> | `show_<x>` | renders a card; returns status text to you |
| to work through <Y> | `show_<y>` then guide | expand is the user's choice, not yours |
| a change made | `<write_tool>` | then re-show; never silently apply <Z> |
| background/philosophy | `<guide_tool>` | read BEFORE authoring — descriptions tell you HOW, this tells you WHEN and WHY |

## Workflows the app expects

<Ordered rituals, e.g.:>
1. <Triage before drafting: run `triage_x`, present proposals, apply only
   what the user picks — never silently.>
2. <Propose summaries in chat and let the user amend BEFORE persisting.>

## Ground rules

- <Domain honesty: a null <field> renders "n/a" — never invent a value.>
- <What you must never do without the user: publish, approve, delete.>
- <What you should do silently as the conversation moves: note-taking tools,
  lens snapshots.>
- The widget updates itself after user actions — don't re-call a show tool
  just because the user clicked something; you'll hear about actions that
  need you.
```

## Serving it

- Route: `GET /skill.md` on the same origin as the MCP endpoint, plain
  markdown, no auth (it contains no data, only behavior).
- Mention it in the server's `instructions`: "Operator guide at
  <origin>/skill.md — read it once per session if you haven't."
- Version it with the app. When tools change, the skill changes in the same
  commit — the smoke test can assert the skill mentions every UI tool by
  name.

## Writing rules (inherited from this skill's own discipline)

- Short and absolute beats long and hedged — agents obey documents they can
  hold in one read.
- Rules as symptom → rule ("pasting verse text into chat → always render the
  card instead").
- Tables for the tool-intent map; prose for the rituals.
- Fictitious examples if the skill is public and your data isn't.
