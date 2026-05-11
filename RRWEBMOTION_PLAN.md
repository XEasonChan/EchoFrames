# rrwebmotion · Plan v0.1

**Date:** 2026-05-10
**Author:** XEasonChan
**Goal:** Replace pixel-screen-recording in product launch / demo videos with deterministic DOM-replay rendered inside Remotion (React video framework). Vector-quality at any resolution. Frame-accurate. Remixable.

## TL;DR — Don't fork rrweb. **Compose 4 existing OSS pieces + ship 1 missing primitive.**

The 2026 OSS landscape already has every part we need EXCEPT one — a synchronous, frame-deterministic `seekToFrame()` API. That's the only thing rrwebmotion has to invent. Everything else (capture, virtual DOM, React rendering, deterministic video output) is already built and Apache-2.0 / MIT.

---

## 1. Landscape (May 2026)

### rrweb itself

- **Stars / activity:** 19.5k stars · 289 open issues · 116 open PRs · last commit 2026-03-19
- **Release cadence:** `2.0.0-alpha.20` — alpha line has been open **3 years**. Stable still anchors at 1.1.3 (April 2022).
- **Bus factor:** low. 4 core maintainers; one (Juice10) explicitly "open for consulting."
- **Downstream:** PostHog · Sentry · Highlight · LaunchDarkly · OpenReplay · Datadog · Mixpanel · Amplitude — **all ship vendored forks**, signaling upstream is too slow for production needs.

### Determinism is broken in current rrweb

The smoking gun: **issue [#1816](https://github.com/rrweb-io/rrweb/issues/1816)** — `<select>` element forward-play vs seek-to-time produce different DOM states. `Replayer.pause(t)` is not equivalent to playing forward to `t`. **This kills any naive Remotion integration.**

Other determinism / asset gaps that block our use case:

| Issue | What it costs us |
|---|---|
| [#1816](https://github.com/rrweb-io/rrweb/issues/1816) | seek != forward-play (the killer) |
| [#1824](https://github.com/rrweb-io/rrweb/issues/1824) | Long-session ghosting (timestamp drift) |
| [#1304](https://github.com/rrweb-io/rrweb/issues/1304) | `collectFonts` broken — webfonts can't be inlined |
| [#144](https://github.com/rrweb-io/rrweb/issues/144) | Webfonts hit CORS in player iframe — blank glyphs at render |
| [#1820](https://github.com/rrweb-io/rrweb/issues/1820) | Main-thread blocking on third-party widgets |
| [#1785](https://github.com/rrweb-io/rrweb/issues/1785) | +150 KB bundle bloat alpha.12 → alpha.18 |

### What everyone else ships

| Project | License | Engine | Replay arch | Reach |
|---|---|---|---|---|
| OpenReplay | AGPL-3 | own (not rrweb) | iframe + React player | Inspiration only — AGPL is risky |
| Highlight.io | Apache-2.0 | rrweb fork ([highlight/rrweb](https://github.com/highlight/rrweb)) | iframe via rrweb-player | **Fork target** |
| Sentry @sentry/replay | BSD-3 | rrweb fork (-35% bundle) | iframe | Inspiration — best slimming patches |
| **PostHog** | MIT | rrweb fork + new ingestion | **React component player** ([posthog-react-rrweb-player](https://github.com/PostHog/posthog-react-rrweb-player)) | **Best React entry** |
| LaunchDarkly | MIT | rrweb fork (acquired Highlight stack) | iframe | Same as Highlight |
| Microsoft Clarity | MIT recorder, closed replay | own (not rrweb) | closed | Unfit |
| Datadog Browser SDK | Apache-2.0 recorder, closed replay | rrweb-derived | closed | Unfit |

### HTML-to-video tools

| Tool | License | Determinism | Verdict |
|---|---|---|---|
| **WebVideoCreator** ([Vinlic/WebVideoCreator](https://github.com/Vinlic/WebVideoCreator)) | GPL-3 | ✅ `HeadlessExperimental.beginFrame` + virtual time | Drop-in (license risky for our use) |
| **HeyGen Hyperframes** ([heygen-com/hyperframes](https://github.com/heygen-com/hyperframes)) | Apache-2.0 | ✅ same beginFrame pattern | **Drop-in candidate** |
| Replit "lying to the browser" | TBD | ✅ time-virtualization shim | Inspiration only (not OSS yet) |
| puppeteer-screen-recorder | MIT | ❌ wall-clock, drops frames | Unfit |
| rrvideo (in-tree rrweb pkg) | MIT | ❌ Puppeteer + screencast | Unfit (current rrwebmotion baseline) |
| Cloudflare Browser Rendering | proprietary | screenshots/PDF only, no MP4 | Unfit |

### Pure DOM-diff libraries

- **morphdom** — MIT, real-DOM diff/patch, npm Jan 2026 ✅
- **diffDOM** — MIT, JSON-serializable diffs ✅
- **rrweb-snapshot** (rrweb sub-package) — MIT, **standalone-usable** ✅

---

## 2. Strategy — composition over fork

We have 4 critical primitives already shipping in OSS:

```
[ Capture ]    rrweb 2.0 (or Highlight's Apache-2.0 fork)
    ↓ event log
[ Virtual DOM ] rrdom (already in rrweb, just gated behind rrweb-player iframe)
    ↓ tree at time T
[ React render ] posthog-react-rrweb-player (the only React-native rrweb player in public OSS)
    ↓ React tree
[ Video render ] HeyGen Hyperframes — Apache-2.0, deterministic via beginFrame
    ↓ MP4
```

**Missing piece:** a synchronous, pure-function `seekToFrame(events, frameIndex, fps) → rrdom tree`. Today `Replayer.pause(t)` is async, rAF-driven, and demonstrably non-deterministic (#1816). This is the single load-bearing API for everything else.

**rrwebmotion = the glue + the missing primitive.**

### Why not just fork rrweb?

- Forking rrweb means inheriting 289 open issues + a 3-year alpha
- The actual blocker (sync seek) is a thin wrapper around `rrdom`, not a deep rewrite
- Composition keeps us on upstreams that get bug fixes for free
- We can drop rrweb entirely later if a better recorder appears (e.g. WASM-based)

---

## 3. The 3-stage roadmap

### Stage 0 · Spike (this week, 1 day)

Validate the assumption end-to-end with throwaway code:

```bash
# 1. Record a real product session via rrweb on memdex.ai dev
# 2. Save events.json
# 3. Mount in Remotion Composition
```

```tsx
// src/RrwebReplay.tsx (spike — 30 lines)
import { Composition, useCurrentFrame, useVideoConfig } from 'remotion'
import RrwebPlayer from 'posthog-react-rrweb-player'
import events from './events.json'

export const RrwebReplay = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const timeMs = (frame / fps) * 1000
  return (
    <RrwebPlayer
      events={events}
      autoPlay={false}
      // KEY: drive the player from Remotion's clock
      // (posthog player exposes goto via ref)
      onLoad={(player) => player.goto(timeMs)}
    />
  )
}
```

**Acceptance test:** render frame 100 twice in two separate render runs. `ffmpeg` extract + `cmp` the PNG bytes. Identical = determinism baseline good. Different = we've hit #1816 even via the React wrapper, and Stage 1 is mandatory.

### Stage 1 · `rrwebmotion` package, MVP (~2 weeks)

Drop the iframe + rAF entirely. Walk `rrdom` directly with a pure function.

**Public API:**

```ts
// rrwebmotion (new npm package)
import { seekToFrame, RrdomReact } from 'rrwebmotion'

const tree = seekToFrame(events, /* frameIndex */ 100, /* fps */ 30)
// → rrdom NodeRef tree, settled, no rAF, no setTimeout

<RrdomReact tree={tree} />
// → React component that renders rrdom as actual JSX with stable keys
```

**Internals:**

1. `seekToFrame.ts` — replays the event log up to the target time using `rrdom`'s mutation applier (already exists in `packages/rrdom/src/diff.ts` upstream). No timers. No rAF. Deterministic. ~150 lines.
2. `RrdomReact.tsx` — walks rrdom NodeRef tree, emits React elements with `data-rr-id` keyed by serialized node ID (rrweb already assigns these).
3. Test harness: snapshot test asserting `seekToFrame(events, 100, 30)` deeply equals the `Replayer` paused at the same time AFTER playing forward (this asserts determinism by parity with one of the two playback paths).

**Closes upstream issues:** #1816 (sync seek = forward play by construction) and indirectly #1824 (no timestamp drift if no timers).

### Stage 2 · `bundleAssets` pre-pass (~1 week)

Before video render, walk the event log and inline every external asset:

```ts
import { bundleAssets } from 'rrwebmotion/bundler'

const events = await bundleAssets(rawEvents, {
  fonts: 'inline',     // fetch @font-face src and convert to data:application/font-woff2
  images: 'inline',    // <img src> + url() backgrounds → data:image/png;base64
  stylesheets: 'inline', // already supported in rrweb-snapshot — make sure it's on
  webComponents: 'snapshot', // record open shadow root state
})
```

**Closes:** #1304 (collectFonts broken) + #144 (webfont CORS). Makes Remotion offline-renderable since no network calls happen at render time.

### Stage 3 · `<RemotionRrweb>` integration component (~3 days)

The launch-video-friendly entrypoint:

```tsx
// In a Remotion composition:
import { RemotionRrweb } from 'rrwebmotion/remotion'
import events from './bundled-events.json'

<Composition id="ProductDemo" durationInFrames={300} fps={30}>
  <RemotionRrweb
    events={events}
    timeOffsetMs={0}            // optional offset to skip recorded loading
    speedMultiplier={1.5}       // play recorded session 1.5x faster
    onMissingAsset="placeholder" // strict / placeholder / network
  />
</Composition>
```

Internally calls `seekToFrame(events, useCurrentFrame(), useVideoConfig().fps)` and renders the rrdom tree directly inside the Remotion canvas — no nested iframe, no separate process.

---

## 4. Memdex launch video integration

Once Stage 3 ships, replace these hand-built mocks in our launch video with real recorded product sessions:

| Beat | Today | After rrwebmotion |
|---|---|---|
| Beat 2 Promise (3 platform memory pages) | Hi-fi React mocks of ChatGPT/Claude/Gemini settings | **Real recorded sessions** of each platform's actual memory page (desensitize via DOM patches in bundleAssets pre-pass) |
| Beat 4 Capture | Hand-drawn dot-grid + line travel + extension popup mock | **Real recorded session** of Memdex extension capturing a chat |
| Beat 5 Better | Hand-built Grammarly-style underline + memory panel + Claude composer | **Real recorded session** of Memdex inject flow + Claude reply on real claude.ai |

Each switch buys us:
- **Pixel parity with shipping product** (no more "mock vs real" drift on every release)
- **Vector quality at any resolution** (4K renders without re-shooting)
- **A/B testable copy** (re-record with different prompts in 30 seconds)
- **Diff-able demos** (PR adds new flow → re-record → MP4 diff shows what changed)

Beats 1, 3, 6 stay hand-built — they're emotional / brand moments without product UI.

---

## 5. Repo layout for rrwebmotion fork

Right now `XEasonChan/rrwebmotion` is a verbatim mirror of `rrweb-io/rrweb` master. Proposed evolution:

```
rrwebmotion/
├── packages/
│   ├── (existing rrweb packages — keep as upstream tracking layer)
│   │   ├── record/      # unchanged from rrweb upstream
│   │   ├── replay/      # unchanged
│   │   ├── rrdom/       # unchanged (we use it as a library)
│   │   ├── rrweb-snapshot/  # unchanged
│   │   └── rrvideo/     # mark deprecated; superseded by rrwebmotion
│   │
│   └── rrwebmotion/                  # NEW — the only place we innovate
│       ├── src/
│       │   ├── seekToFrame.ts        # Stage 1
│       │   ├── RrdomReact.tsx        # Stage 1
│       │   ├── bundler/              # Stage 2
│       │   │   ├── inlineFonts.ts
│       │   │   ├── inlineImages.ts
│       │   │   └── snapshotShadowRoots.ts
│       │   └── remotion/
│       │       └── RemotionRrweb.tsx # Stage 3
│       ├── test/
│       │   ├── determinism.test.ts   # frame N forward vs reverse
│       │   └── snapshot.test.ts      # rrdom tree golden files
│       └── package.json              # name: "rrwebmotion"
└── examples/
    └── memdex-product-demo/          # Remotion comp using rrwebmotion
        ├── src/Composition.tsx
        ├── public/events.json
        └── package.json
```

Upstream tracking: keep `packages/record`, `replay`, `rrdom`, `rrweb-snapshot` synced via periodic merge from `rrweb-io/rrweb`. Innovation lives in the new `packages/rrwebmotion` directory only — clean separation, easier to upstream pieces later.

---

## 6. Decisions to make before stage 0

These should go through `AskUserQuestion` before writing any code:

1. **Recorder choice for the Memdex use case:**
   - `rrweb 2.0-alpha` upstream
   - Highlight's Apache-2.0 fork
   - PostHog's MIT fork (comes with React player attached)
   - Recommendation: **PostHog's** — gives us free React player, MIT license, active maintenance

2. **License for `rrwebmotion`:**
   - MIT (matches PostHog/upstream rrweb majority)
   - Apache-2.0 (matches Highlight, slightly more permissive for enterprise)
   - Recommendation: **MIT** unless we have a specific patent-grant need

3. **Remotion video renderer:**
   - HeyGen Hyperframes (Apache-2.0, agent-friendly)
   - WebVideoCreator (GPL-3, copy-left risk)
   - Roll our own with `@remotion/cli`
   - Recommendation: **Remotion's own renderer** — we already use it for Memdex launch video; rrwebmotion produces a React component that drops into any Remotion composition

4. **First Memdex beat to convert:**
   - Beat 4 Capture (smallest, lowest risk)
   - Beat 5 Better (highest payoff — most complex hand-built mock)
   - Beat 2 Promise (3 platform pages — most "mockup vs real" drift today)
   - Recommendation: **Beat 4** as the proof-of-concept; if successful, do Beat 2 next

---

## 7. Sources

### Agent ① · rrweb deep research
- [rrweb releases](https://github.com/rrweb-io/rrweb/releases)
- [rrweb CHANGELOG](https://github.com/rrweb-io/rrweb/blob/master/CHANGELOG.md)
- [Issue #1820](https://github.com/rrweb-io/rrweb/issues/1820) · [#1785](https://github.com/rrweb-io/rrweb/issues/1785) · [#1824](https://github.com/rrweb-io/rrweb/issues/1824) · [#1816](https://github.com/rrweb-io/rrweb/issues/1816) · [#1304](https://github.com/rrweb-io/rrweb/issues/1304) · [#144](https://github.com/rrweb-io/rrweb/issues/144) · [#40](https://github.com/rrweb-io/rrweb/issues/40)
- [getsentry/rrweb #114](https://github.com/getsentry/rrweb/pull/114)
- [Rob Pruzan — session replay to mp4 fast](https://www.rob.directory/blog/session-replay-to-mp4-and-fast)
- [PostHog react-rrweb-player](https://github.com/PostHog/posthog-react-rrweb-player)
- [highlight rrweb fork](https://github.com/highlight/rrweb)

### Agent ② · alternatives landscape
- [openreplay/openreplay](https://github.com/openreplay/openreplay)
- [highlight/highlight](https://github.com/highlight/highlight)
- [getsentry/rrweb](https://github.com/getsentry/rrweb)
- [PostHog session replay architecture](https://posthog.com/handbook/engineering/session-replay/session-replay-architecture)
- [Microsoft Clarity](https://github.com/microsoft/clarity)
- [Vinlic/WebVideoCreator](https://github.com/Vinlic/WebVideoCreator)
- [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes)
- [Replit "lying to the browser"](https://blog.replit.com/browsers-dont-want-to-be-cameras)
- [morphdom](https://github.com/patrick-steele-idem/morphdom) · [diffDOM](https://github.com/fiduswriter/diffDOM)
- [Replay.io protocol](https://static.replay.io/protocol/)
- [puppeteer/replay](https://github.com/puppeteer/replay)
- [redotvideo/revideo](https://github.com/redotvideo/revideo)
- [Sentry SDK bundle reduction](https://blog.sentry.io/sentry-bundle-size-how-we-reduced-replay-sdk-by-35/)

---

## 8. Next action

Before any coding: spend 30 minutes answering the 4 decisions in §6. Once decided, Stage 0 is a 1-day spike that proves or kills the architecture.

---

## 9. Product surface · v0.2 (2026-05-10)

After landscape research: rrweb has a `packages/web-extension` already (`"private": true`, marked as reference implementation, never published to Chrome Web Store). Studio web editors only exist in commercial downstreams (PostHog/Highlight/Sentry/OpenReplay) which are general session-replay analytics — **none target deterministic video export**.

**Decision (XEasonChan, 2026-05-10):** ship a 3-piece dev-tool-grade product. Skip Studio web editor entirely — replace with a Claude Code skill.

### The 3 pieces

```
┌────────────────────────────────────────────────────────────────────┐
│ 1. rrwebmotion-capture     Chrome / Firefox extension              │
│    fork starting point: packages/web-extension (already has React  │
│    + Chakra + IndexedDB + popup + sessions list, just unpublished) │
│    delta vs upstream:                                              │
│      ├ Add bundleAssets pre-pass (Stage 2 — inline fonts/imgs/CSS) │
│      ├ Save to a known local path (~/rrwebmotion/captures/)        │
│      ├ Filename convention: {site-host}__{YYYY-MM-DD-HHmm}.json    │
│      └ Publish to Chrome Web Store + Firefox Add-ons               │
├────────────────────────────────────────────────────────────────────┤
│ 2. rrwebmotion (npm)       SDK + Remotion components                │
│    Stage 1: seekToFrame(events, frame, fps) → rrdom tree           │
│    Stage 2: bundleAssets(events) → events with data: URIs          │
│    Stage 3: <RemotionRrweb events={...} /> for compositions        │
├────────────────────────────────────────────────────────────────────┤
│ 3. /rrwebmotion             Claude Code skill                       │
│    REPLACES the Studio web editor. Lets the user say:              │
│      "make a Remotion comp from yesterday's chatgpt capture"       │
│    Skill scans ~/rrwebmotion/captures/, asks which to use, asks    │
│    fps/duration/redactions, generates Remotion files, optionally   │
│    runs bundleAssets + renders to MP4.                             │
│    Lives at ~/.claude/skills/rrwebmotion/SKILL.md                  │
└────────────────────────────────────────────────────────────────────┘
```

### Why skill > web editor

- Zero hosting / auth / payments / privacy review — the skill runs on the user's machine
- Claude Code is already in the launch-video workflow (we used it to build Memdex v13)
- "Trim / redact / set keyframes" is more naturally a conversation than a timeline UI when you have AI in the loop
- Studio can come later if there's market pull — but the dev-tool-grade workflow validates the architecture first

### Updated user journeys

**Engineer demoing a 3rd-party SaaS (e.g. Notion) in their launch video**
```
1. Install rrwebmotion-capture extension (Chrome Web Store)
2. Open Notion, click record, do the flow, stop
3. Events auto-save to ~/rrwebmotion/captures/notion__2026-05-10-1530.json
4. In their Remotion project: invoke /rrwebmotion in Claude Code
5. Skill: "I see 3 captures. Use notion__2026-05-10-1530.json (12s)?"
6. User: "yes, render at 30fps, mute the email field, add as Beat 4 of MemdexLaunch"
7. Skill writes src/Beat4Notion.tsx + public/captures/notion-2026.json + Composition.tsx update
8. User runs: npx remotion render
```

**Updating the capture after a product release**
```
1. Re-record on the new build (same flow)
2. /rrwebmotion update Beat4Notion with notion__2026-06-01-1100.json
3. Skill replaces the events file, re-runs bundleAssets, re-renders
```

### Capture-file convention (extension contract)

```
~/rrwebmotion/
├── captures/
│   ├── {site-host}__{YYYY-MM-DD-HHmm}.json     (gzip optional)
│   └── {site-host}__{YYYY-MM-DD-HHmm}.assets/  (optional sidecar bundle)
└── config.json                                  (extension settings)
```

Site host: `chatgpt.com`, `notion.so`, `claude.ai`, `localhost-3000`, etc.
Date: ISO local time so list ordering matches mental model.

The skill scans this dir, no API call, no auth.

### Stage ordering (revised)

```
Stage 0  Spike (1d)   — Remotion + posthog-react-rrweb-player + frame seek + cmp test
Stage 1  SDK MVP (2w) — seekToFrame() + <RrdomReact>
Stage 2  Bundler (1w) — bundleAssets pre-pass
Stage 3  Capture (1w) — fork web-extension + add bundleAssets + Chrome Web Store publish
Stage 4  Skill   (3d) — Claude Code skill (find captures, generate comps, render)
```

Total: ~5 weeks to a usable end-to-end loop. No web app, no SaaS, no auth.
