<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/wordmark-dark.svg" />
    <img src="./assets/wordmark.svg" alt="EchoFrames" width="380" />
  </picture>
</p>

<p align="center">
  <em>Record any web product flow. Get a frame-perfect Remotion video.<br />
  Agent-first — drive it with Claude Code, not a timeline UI.</em>
</p>

<p align="center">
  <video src="./assets/launch-demo.mp4" controls autoplay loop muted playsinline width="720">
    Your browser does not support embedded video. <a href="./assets/launch-demo.mp4">Download (3.4 MB MP4)</a>.
  </video>
</p>

<p align="center">
  <sub>↑ The 44-second <a href="https://memdex.ai">Memdex</a> launch video — built end-to-end with this pipeline. 6 beats, ChatGPT / Claude / Gemini cross-platform demo. Every frame is the real DOM, not a pixel screen recording.</sub>
</p>

<p align="center">
  <a href="./ECHOFRAMES_V0_PLAN.md">v0 plan</a> ·
  <a href="https://memdex.ai">case study</a> ·
  <a href="#quickstart">quickstart</a> ·
  <a href="./README.zh_CN.md">中文</a>
</p>

---

## The problem

Everyone's making launch videos in Remotion now. Fidelity still sucks.

- **Screen recording** (Loom · Tella · ScreenStudio · QuickTime) is easy but the output is a flat pixel video. You can't re-render at 4K, can't edit a button color, can't re-cut without re-recording. When the product UI changes, every video starts over.
- **Authoring in Remotion** gives you full control, but you're rebuilding your real product UI in React from scratch for every shot. Hours per beat — even with an LLM driving.
- **rrweb session players** (PostHog · Highlight) replay captured DOM inside an iframe for human review. They aren't deterministic frame renderers — forward play and seek give different DOM ([rrweb#1816](https://github.com/rrweb-io/rrweb/issues/1816)).

The missing primitive: **record the real DOM, then deterministically render it as Remotion video.** That's EchoFrames.

## What EchoFrames is

Three pieces:

1. **`echoframes-capture`** — Browser extension (Chrome / Firefox). Click record, use your product, click stop. Captures DOM mutations + CSS + fonts + images to `~/echoframes/captures/{host}__{YYYY-MM-DD-HHmm}.json`. No upload, no SaaS — the file lands on your disk.
2. **`echoframes`** — npm SDK. A pure `seekToFrame(events, frameIndex, fps)` function on top of rrdom + a React component `<EchoFrame events={…} />` for Remotion. Forward play and frame seek produce **identical** DOM at every frame, at any output resolution.
3. **`/echoframes`** — Claude Code skill. Tells your agent: *"scan my captures, wire that Notion flow into Beat 4 of the launch video with a 'see how it works' caption, render it."* The agent does it conversationally. No timeline UI to click.

## Why agent-first matters

Existing launch-video tools assume a human is clicking through a timeline. EchoFrames assumes an AI agent is reading and writing the source — which unlocks workflows that no GUI can match:

### 1. Marketing variant generation at scale

> *"Render the same flow with 10 captions × 3 VO voices × 2 aspect ratios."*

Marketing doesn't need one perfect video. They need 60 cheap variants to find which use case lands hardest. With EchoFrames, that's a loop in a YAML manifest, not 60 sessions in After Effects.

### 2. Agent self-review on every PR

> *Your code agent ships a new landing page → records itself walking the page → narrates the design decisions in voiceover → posts the MP4 to the pull request.*

Your code reviewer used to read a diff. Now they watch a 30-second narrated demo. Same effort cost from the agent.

### 3. Re-renderable forever

Product UI evolves. With EchoFrames captures, every launch video re-renders deterministically against the new UI. Update once, every demo refreshes.

## Status

**Pre-v0.** Targeting public release in ~7 weeks. Scope + GTM tracked at [`ECHOFRAMES_V0_PLAN.md`](./ECHOFRAMES_V0_PLAN.md).

The pipeline is already validated end-to-end: the [**Memdex launch video**](https://memdex.ai) — 44 seconds, 6 beats, cross-platform AI memory demo (ChatGPT / Claude / Gemini) — was built with an earlier internal version of this stack. See `apps/launch-video/` in the [Memdex repo](https://github.com/XEasonChan/memdex) for the production reference.

## Quickstart

> ⚠️ Pre-v0 preview. Commands below are the target shape — not all are wired yet. Track readiness in `ECHOFRAMES_V0_PLAN.md` §7.

```bash
# 1. Install the capture extension
git clone https://github.com/XEasonChan/echoframes
cd echoframes/packages/echoframes-capture
yarn install && yarn pack:chrome
# Load dist/chrome/ as an unpacked extension at chrome://extensions

# 2. Record a flow
# Click the extension popup → record → use the site → stop
# → file saves to ~/echoframes/captures/{host}__{date}.json

# 3. Wire it into a Remotion project, conversationally
cd ~/my-launch-video
claude

> /echoframes wire my latest notion capture into a 12-second beat
> with a "Notion AI in 30 seconds" caption, then render to MP4
```

The agent will:
1. Scan `~/echoframes/captures/` and confirm the file
2. Inspect duration / event count / asset sizes
3. Ask render parameters (fps, scale, redactions) via a single batched checkpoint
4. Run `npx echoframes bundle` to inline fonts and images
5. Write the React component into your Remotion project's `src/beats/`
6. Update `Composition.tsx` and `Root.tsx` with the new sequence
7. Render to MP4

Manual usage (no Claude Code) is in [`docs/manual.md`](./docs/manual.md) (TODO v0).

## v0 starter templates

Each ships as a standalone Remotion project, slot-fillable with one or more captures.

| Template | Use case | Length |
|---|---|---|
| `launch-hero` | 30-second product launch with VO + captions (Memdex pattern) | ~30s |
| `feature-walkthrough` | Single product feature, focused beats with cursor highlights | 15-45s |
| `before-after` | Side-by-side, before-state vs after-state of a UI change | ~20s |
| `3-up-comparison` | Three competitors / three states / three personas, at once | ~25s |
| `testimonial-card` | Captured product UI under a quote overlay | ~10s |

Community templates ship in [`echoframes-recipes`](https://github.com/XEasonChan/echoframes-recipes) (separate repo, accepts PRs).

## How EchoFrames is different

|   | Screen recording | rrweb session replay | Remotion (alone) | **EchoFrames** |
|---|:---:|:---:|:---:|:---:|
| Records real product UI | ✅ | ✅ | ❌ | ✅ |
| Vector-quality output (any resolution) | ❌ | ❌ | ✅ | ✅ |
| Deterministic frame seek = forward play | ❌ | ❌ | ✅ | ✅ |
| Re-renders when product UI changes | ❌ | ❌ | ❌ | ✅ |
| Source is editable code, not a binary | ❌ | ❌ | ✅ | ✅ |
| Agent-driven authoring | ❌ | ❌ | partial | ✅ |
| Bulk-generate variants | ❌ | ❌ | partial | ✅ |

## Built on

Standing on giants — none of these primitives are ours:

- [**rrweb**](https://github.com/rrweb-io/rrweb) (MIT) — DOM event recording + snapshot primitives. The browser extension is a fork of `rrweb-io/rrweb` `packages/web-extension`.
- [**rrdom**](https://github.com/rrweb-io/rrweb/tree/master/packages/rrdom) (MIT) — Virtual DOM tree, the substrate that makes deterministic seeking possible.
- [**Remotion**](https://remotion.dev/) — React → MP4 rendering pipeline.
- [**posthog-react-rrweb-player**](https://github.com/PostHog/posthog-react-rrweb-player) (MIT) — reference for embedding rrweb in React.

What EchoFrames adds:

- A pure synchronous `seekToFrame(events, frameIndex, fps)` (rrweb's `Replayer.pause(t)` is non-deterministic per [rrweb#1816](https://github.com/rrweb-io/rrweb/issues/1816)).
- The `<EchoFrame>` Remotion bridge component.
- An offline asset bundler (fonts + images + CORS workaround).
- The 5 v0 starter templates.
- The Claude Code skill.

## Roadmap

| Milestone | Scope |
|---|---|
| **v0** (Q3 2026) | 3-piece release: extension + SDK + skill. 5 templates. Asset bundling. PII auto-redaction. Docs site at `echoframes.dev`. |
| **v0.1** | Community templates (`echoframes-recipes` ≥ 10). GitHub Action for CI capture-to-video on PR preview deploys. |
| **v0.2+** | TBD by community signal. Studio web editor is intentionally **not** on the roadmap — `/echoframes` is the editor. |

## License

MIT. Same as upstream rrweb.

## Acknowledgements

- The rrweb team for the recording primitives that make this possible.
- The Remotion team for proving React-to-video can work at production quality.
- The PostHog and Highlight teams for hardening the rrweb fork landscape.

---

<p align="center">
  <sub>
    Made by <a href="https://twitter.com/xeasonchan">Andrew</a> at <a href="https://tanka.ai">Tanka.ai</a> ·
    Initial case study: <a href="https://memdex.ai">Memdex</a> ·
    Issues + PRs welcome ·
    Discussions tab is the best place to ask anything.
  </sub>
</p>
