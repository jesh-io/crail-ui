# Two actors, one surface — designing for the model AND the human

An MCP app has two users looking through the same window: the human (sees the
widget) and the model (sees the text). Everything the human can tap, the model
can call; everything the model does, the human can see. One tool surface, one
audit trail, no second back door for "the AI did it."

## Every tool result is two documents

`structuredContent` is the human's half — the widget's input. `content.text`
is the model's half — and it is NOT a caption of the picture. Write it as the
model's next move:

```ts
// weak: describes the picture the model can't see
text: "Rendered the release widget."

// strong: state to reason over + what to do next
text: "2.14: staging ✅, canary 40%, 2 sign-offs pending (alice, on-call). " +
      "The card is above — if the user approves, call approve_release; " +
      "check show_deploys if canary stalls."
```

- Echo human-readable forms of machine-encoded values ("minute 960" →
  "4:00pm") — the text block is the model's only typo check, and a wrong
  encoded value is otherwise invisible until it's bisected three edits later.
- The two halves can deliberately differ: a walkthrough tool can hand the
  model "improv material — do NOT read verbatim" while the widget shows the
  user only the itinerary. Same call, two audiences, different documents.
- Behavioral rules that must hold every session travel WITH the result, not
  just in the description — append a named guidance constant to the result
  text. Descriptions get skimmed at tool-selection time; results get read in
  context.

## Descriptions govern when; results govern what next

Tool descriptions are behavior contracts. Write them imperatively:

- "PREFER this over pasting the log as text — the card is the native way to
  show a deploy."
- "ALWAYS propose the summary in chat and let the user amend it before
  calling this."
- "Silently record the gist as the conversation moves — one thought per
  note, never transcript, don't announce it."

For philosophy that doesn't fit a description, ship **guide tools** — read
tools returning a short essay ("how release trains work here") — and have the
server `instructions` say: descriptions tell you HOW, the guides tell you WHEN
and WHY. Record retirements in descriptions too ("Present mode retired — the
log IS the stakeholder surface"); the model reads them.

## Visibility tiers

Decide per tool, at design time:

| Tier | Registration | Example |
|---|---|---|
| model + UI | `registerAppTool` + `_meta.ui.resourceUri` | `show_release` |
| app-only | `_meta.ui.visibility: ["app"]` | `get_release_data` (widget navigation) |
| model-only | plain `registerTool`, no `_meta.ui` | `add_review_note` (invisible by design) |
| human-only gesture | registered, but the SERVER refuses agent calls | `close_signoff` |
| hidden | not registered for this connection at all | admin tools on non-admin keys |

Two philosophies both work in production (see data-flow.md): differentiate
via visibility tiers, or share every tool and let a `data:true` flag put the
render/data choice on the caller. Either way, enforce authorization per-call
on the server — never by hiding the button. A viewer who calls a write tool
gets an actionable `isError` ("requires collaborator role — you are viewer
here"), not a mystery.

## Actor attribution

When both users write to the same store, stamp who acted:

```ts
// widget buttons thread the actor through
await callTool("approve_release", { version, _via: "human" });
// server: actor.via = args._via ?? "agent"
```

The audit trail then reads as a two-actor story — "proposed by ✦ Claude,
approved by You" — and the UI can render actor badges and filters. Some
gestures are human-only by policy (final approval, verification-closure):
refuse the agent server-side with a clear error, and let the UI present that
action as the human's signature moment.

## Handoffs: buttons that talk to the model

Deterministic actions call tools. Judgment goes to the model via
`sendMessage` — and the prompt is a script, not a plea:

```ts
// weak
sendMessage("help with this release");

// strong: IDs interpolated, tool sequence named, loop closed
sendMessage(
  `Work through the 2 pending sign-offs on release 2.14: read show_release {version:"2.14"}, ` +
  `chase each owner with a summary of what's blocking, then show me the release.`
);
```

Rules that survived production:
- **One-tap canned handoffs, never a free-text prompt box.** The chat is the
  chat box; a text field inside the widget was built and removed.
- **End with "then show me X"** so the model re-renders the view and the loop
  closes visibly.
- Every `sendMessage` is try/catch with a tri-state chip: idle → "Sent ✓"
  (2.5s) → back to idle; on an unsupporting host, a quiet "n/a" — never a
  modal, never a crash. Key the transient state by action id, or two sibling
  buttons flip together.
- Include the selection and its context in the prompt. If the user selected a
  line in the deploy log, the prompt carries the line, the build, and what to
  consider — the prompt you'd have wanted them to type.
- A prompt can cross servers: "turn this failing check into a task in my
  todo list" hands work to a different MCP server via the model. The model is
  the integration bus.
- **Consequential actions can be handoffs instead of buttons.** "Reconsider
  this decision" sends a reasoned prompt (supersession with rationale) rather
  than flipping a bit — the model mediates actions that deserve deliberation.
- Buttons emit **references, never payloads**: send "release 2.14" and let
  the model fetch fresh state, rather than serializing the widget's possibly
  stale copy into the chat. If the model needs to know what the human was
  looking at, record the lens through a tool (fire-and-forget) and keep the
  chat message skinny.

## UI-authored feedback that outlives the chat

For review flows (comments on a draft, annotations on a component), route the
feedback through **durable store writes**, not chat text: the widget files
`add_comment {anchor_text, body}` rows; the handoff prompt then just names the
reading tools ("work through the 3 open comments: list_comments, revise,
resolve_comment each, then reopen for my review"). Anchor annotations to
quoted text, not DOM offsets — quotes survive re-rendering and the model can
find them in the prose.

## Confirmations state consequences

A destructive confirm computes its message from current state, in domain
terms — never "Are you sure?":

> "2 sign-offs are still pending on this release. Shipping now bypasses
> them and goes live immediately — there is no rebuild step."

## The model sees the app teach itself

Explanatory copy inside the widget is read by both users — write it to serve
both: "Zero sign-offs — this is the release at its riskiest" tells the human
what they're looking at and the model what to do about it.
