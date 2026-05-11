---
status: ACTIVE
created: 2026-05-10
revised: 2026-05-10 (outside voice absorbed)
project: EchoFrames v0 engineering plan
owner: Andrew (XEasonChan)
review_type: plan-eng-review
supersedes: none (sibling to ECHOFRAMES_V0_PLAN.md which holds CEO-level scope + GTM)
---

# EchoFrames · v0 Engineering Plan

> Architecture, sequencing, failure modes, and test coverage for the v0 build.
> Pairs with [`ECHOFRAMES_V0_PLAN.md`](./ECHOFRAMES_V0_PLAN.md) (scope + GTM).
> Revised after outside-voice review absorbed 6 of 8 tension points (see §11).

## 0. Scope (locked from CEO plan — D1)

Full v0 per `ECHOFRAMES_V0_PLAN.md`, **plus multi-tab concurrent capture** (T1 absorbed — required to make agent-first PR self-review use case non-decorative). Re-evaluate at Week 4 mid-checkpoint if slipping >3 days.

**Effective timeline:** 7 weeks → ~8 weeks after absorbing T1 (+1 wk) + T2 (+1 d) + T5 (+2 d). Rejected T4 (formal extension to 10 weeks) — will trigger only if Week 4 velocity check shows slip.

## 1. Architecture decisions (D2-D12)

| # | Decision area | Choice | Rationale |
|---|---|---|---|
| D2 | seekToFrame cache strategy | **Checkpoint cache, 30-frame intervals** | ~220 MB peak, ~5-10 min render for 44s clip. **Validated against mmap risk in Week 2 spike (T3).** |
| D3 | Capture file path | **Native Messaging Host** → `~/echoframes/captures/` | Clean path > zero-install. NMH installer is +1-2d work. |
| D4 | Asset bundler fallback | **Fetch + system fallback + warning log** | Covers 95% without inventing a font proxy. `--font-override` deferred to v0.1. |
| D5 | PII redaction layer | **Record-time via rrweb maskInputOptions/maskTextSelector** | Default-safe: PII never on disk. Pattern-based regex sweep deferred to v0.1. |
| D6 | Extension distribution | **Dual: Web Store + .zip side-load** | **T5 absorbed: submission moved Week 5 → Week 3** (NMH triggers heightened scrutiny, real review 2-6 weeks). |
| D7 | Capture JSON versioning | **Metadata header** | **T6 honesty: this is a tombstone without a migration tool. Migration tool budgeted for v0.1 BEFORE first rrweb breaking upgrade.** |
| D8 | npm package layout | **Single `echoframes` package** with `bin` entries | Vite/Vitest/Remotion convention. |
| D9 | NMH binary form | **Bun `--compile` standalone exe** | **T2 absorbed: Week 1 spike validates Bun + stdio NMH + Windows registry combo BEFORE committing.** |
| D10 | Frame render failure | **Dual mode**: dev=error overlay+last-good, prod=throw | `ECHOFRAMES_RENDER_MODE` env var. |
| D11 | E2E test infra | **Playwright + persistent context** | Most mature for chrome-ext. |
| D12 | Concurrency × cache | **Pre-build cache + mmap shared** | **T3 absorbed: Week 2 spike validates Node fs mmap actually deduplicates across Remotion worker processes — if not, fall back to D12-A (per-worker independent cache, accept 16GB Mac OOM risk for v0).** |

## 2. System architecture

```
+============================================================================+
|                          EchoFrames v0 architecture                        |
+============================================================================+

BROWSER (user records)                BACKEND (user's local machine)
+--------------------+  events    +---------------------+
| echoframes-capture | <--------- | Tab being recorded  |
| (Chrome / Firefox  |   rrweb    | (rrweb-record       |
|  extension)        |            |  injected)          |
|                    |            |                     |
| Multi-tab mode     |            +---------------------+
| (T1 absorbed)      |  events    +---------------------+
|                    | <--------- | Tab 2 (concurrent)  |
+---------+----------+            +---------------------+
          |
          | chrome.runtime.connectNative (D3 D9)
          v
+---------+----------+         saves         +---------------------------+
| Native Messaging   | ----- writes -------> | ~/echoframes/captures/    |
| Host (Bun-compiled |                       |  {host}__{ts}.json        |
|  standalone exe)   |                       |  + metadata header (D7)   |
+--------------------+                       +-----------+---------------+
                                                         |
                                                         | npx echoframes bundle
                                                         v
                                            +---------------------------+
                                            | echoframes CLI (D8)       |
                                            +-----------+---------------+
                                                        |
                                                        v
                                            +---------------------------+
                                            | Remotion project (user's) |
                                            |  - seekToFrame() (D2)     |
                                            |  - <EchoFrame> (D10)      |
                                            |  uses .echoframes-cache/  |
                                            |   (mmap shared, D12)      |
                                            +-----------+---------------+
                                                        |
                                                        v
                                                  out/clip.mp4

DETERMINISM ANCHOR: forward play vs random seek MUST produce identical DOM at every frame
TEST FIXTURE (T7 absorbed): public capture in repo at test/fixtures/example-com-30s.json
```

## 3. Week-by-week sequencing (revised after outside voice)

```
Week 1 │ THREE SPIKES IN PARALLEL — gate the entire project:
       │ ├─ Spike 1 (3d): rrdom deep-clone for checkpoint cache (D2 viability)
       │ │   FALLBACK if fails: forward-only render. HONEST: this is shipping
       │ │   a strictly worse product than promised — no determinism win vs
       │ │   PostHog's existing fork. (T8 absorbed)
       │ ├─ Spike 2 (1d, T2): Bun --compile + stdio NMH on Windows.
       │ │   FALLBACK if fails: Node SEA or pkg for Windows only (mac/linux
       │ │   stay on Bun). Add ~3d to Week 4. Document in plan if triggered.
       │ └─ Spike 3 (1d, T7): Extract public determinism test fixture from
       │     a captured example.com walkthrough. CI runs this, not the
       │     private Memdex capture.
       │
Week 2 │ ├─ SDK MVP: seekToFrame + <EchoFrame> + checkpoint cache file format
       │ │   on top of Week 1 spike output
       │ ├─ NEW SPIKE (1d, T3): Node fs mmap behavior across Remotion worker
       │ │   processes. Validate D12 assumption that 220MB peak actually holds.
       │ │   FALLBACK if mmap doesn't dedupe: drop to D12-A (per-worker cache).
       │ │   Document 16GB Mac OOM as known limitation in README.
       │ └─ Dev-mode error overlay (D10) + 10 unit tests for seekToFrame
       │
Week 3 │ ├─ Multi-clip stitching (F3) + asset bundler (D4, C3)
       │ ├─ bundleAssets() with font/image CORS fallback
       │ └─ T5 ABSORBED: Web Store submission this week.
       │     - Prepare assets (icons, screenshots, 30s demo MP4, privacy policy)
       │     - Submit with NMH justification doc
       │     - Real expected review: 4-6 weeks (NMH = heightened scrutiny)
       │     - .zip path stays as launch-day fallback
       │
Week 4 │ Capture extension fork: NMH bridge + branding + metadata + PII
       │ - Bun --compile NMH for darwin/linux (+ Win path from Spike 2 result)
       │ - PII redaction via rrweb config in options page (D5)
       │ - Metadata injection UI in popup on stop (F2)
       │ - VELOCITY GATE: if behind schedule, scope reduction triggers
       │   (cut to 3 templates per CEO plan §3a). Decide before Week 5 starts.
       │
Week 5 │ ├─ MULTI-TAB CAPTURE (T1 absorbed) — agent self-review enabling
       │ │   - Background script maintains tab → recording session map
       │ │   - IndexedDB schema gains `session_id` + `tab_id` indexes
       │ │   - Popup UI: list of active recordings across tabs
       │ │   - NMH writes one file per session_id
       │ └─ 2 templates (launch-hero + before-after) in parallel worktrees
       │
Week 6 │ Templates (F1) remaining 3 + Recipes repo (C1) + Playwright E2E (D11)
       │ - 3 more templates (feature-walkthrough, 3-up, testimonial)
       │ - `echoframes-recipes` repo
       │ - 6 Playwright E2E tests (install path × OS matrix)
       │ - Multi-tab E2E scenario (records 3 tabs, verifies 3 distinct files)
       │
Week 7 │ Asset bundling hardening (C3) + Claude skill polish + docs site (G1)
       │ - existing rrwebmotion skill → /echoframes (renamed)
       │ - Concurrent cache mmap stress test under --concurrency=4
       │ - docs site at echoframes.dev: concept + 5 galleries + install + skill
       │
Week 8 │ Dry-run + launch
       │ - 3 dry-run users (Tanka team + 2 founder friends)
       │ - Fix top 3 friction issues
       │ - HN Show HN: Tuesday 8:30 AM PT
       │ - (If Web Store still in review on launch day → .zip is hero install path)
```

**Hard truth:** Even with these absorptions, 8 weeks is optimistic if Memdex demands attention. Week 4 velocity gate is the bail-out point.

## 4. Failure modes table

| Codepath | Realistic failure | Test covered? | Error handling? | User sees clear error? |
|---|---|---|---|---|
| `seekToFrame()` non-determinism between forward play / seek | DOM drift at frame N | ✅ regression test on public fixture (T7) | ❌ (must not exist) | N/A — must not regress |
| Bun --compile NMH on Windows | Binary won't start | ✅ Week 1 spike (T2) | ✅ Node SEA fallback documented if spike fails | ✅ Installer surfaces missing NMH |
| mmap doesn't actually dedupe across Remotion workers | 4x memory blowup | ✅ Week 2 spike (T3) | ✅ Fall back to D12-A per-worker cache | ⚠️ README documents 16GB Mac risk if triggered |
| NMH binary crashes mid-record | Capture lost from t=crash | ⚠️ TODO Week 6 E2E | ⚠️ Heartbeat + IndexedDB flush to Downloads fallback | ⚠️ Extension popup shows "NMH disconnected" |
| CORS-blocked font fetch in bundler | System fallback font | ✅ unit (D4) | ✅ D4 graceful fallback + warning log | ✅ Warning visible in CLI output |
| Cross-origin iframe in capture | Blank rendering | ❌ no test | ✅ Documented in `troubleshooting.md` | ✅ Skill docs flag this case |
| Old capture, new SDK schema mismatch | Crash on event apply | ⚠️ TODO unit (D7 version check) | ✅ D7 metadata header guards. **HONEST: v0 says "re-record"; v0.1 ships migration tool** | ✅ Clear "Capture from v0.1.0, please re-record" |
| Chrome Web Store reviewer rejects NMH justification | Launch delays | N/A | ✅ D6 .zip fallback path | ✅ README documents both install paths |
| `<EchoFrame>` error in production render | Render fails | ✅ unit (D10) | ✅ D10 throws in production | ✅ Remotion stack trace + log location |
| Multi-tab IndexedDB session collision | Wrong events in wrong session | ⚠️ TODO Week 5 unit | ✅ session_id index enforces uniqueness | ✅ Distinct files per session |

**Critical gaps remaining:** NMH disconnect mid-record (Week 6 E2E budget). Multi-tab session collision (Week 5 unit test budget).

## 5. Worktree parallelization

```
LANE A (SDK / Core):
  Week 1: 3 spikes  →  Week 2: SDK MVP + mmap spike  →  Week 3: bundleAssets
  Shared module: packages/echoframes/

LANE B (Extension):
  Week 4: NMH fork + branding  →  Week 5: Multi-tab (T1)
  Shared module: packages/echoframes-capture/

LANE C (depends on A + B complete):
  Week 5-6: Templates (5 × Remotion projects, parallel worktrees)
  Week 3: Web Store submission (depends on Week 2 extension build green)
  Week 6: E2E tests (depends on extension + SDK both stable)

LANE D (Docs):
  Week 7: Docs site (depends on Week 6 stability for accurate quickstart copy)

Conflict flags:
- Lanes A and B never touch the same module directory ✅
- Lane C templates can run in 5 parallel worktrees
- Lane D depends on stability of A+B, run last
```

## 6. NOT in scope (deferred to v0.1+)

- **Manual font override flag** (`--font-override Inter=./inter.woff2`) — v0.1.
- **Pattern-based PII sweep** (regex on static text) — v0.1.
- **`@echoframes/cli` split package** — split when Remotion Lambda use case surfaces.
- **Schema migration tool** (T6) — v0.1 BEFORE first rrweb breaking upgrade. Not "if needed"; this is committed.
- **Studio web editor** — explicitly never.
- **GitHub Action for CI capture-to-video (C2)** — v0.2.
- **Hosted render / SaaS** — never v0.

**Moved INTO scope by T1:** Multi-tab concurrent capture. No longer deferred.

## 7. What already exists (no need to rebuild)

| Sub-problem | Existing primitive | Used as |
|---|---|---|
| DOM event recording | `rrweb-io/rrweb` `rrweb-record` | Direct dep |
| Browser extension shell | `rrweb` `packages/web-extension` | Forking into `packages/echoframes-capture/` |
| Virtual DOM | `rrweb-io/rrweb` `rrdom` | Direct dep |
| React + rrweb player | `posthog/posthog-react-rrweb-player` | Reference only |
| React → MP4 render | `remotion-dev/remotion` | Peer dep |
| 44s production case study | Memdex `apps/launch-video/` | Validation fixture |
| Public determinism fixture | Records `example.com` walkthrough during Week 1 (T7) | CI test fixture |

**Reuse ratio:** ~70%. New code estimated ~5000-7000 LOC (multi-tab added ~600).

## 8. TODOs (proposed)

1. **NMH disconnect fallback** — Heartbeat + IndexedDB flush on disconnect (~1d, Week 4)
2. **Multi-tab session collision unit test** — Week 5
3. **Pattern-based PII sweep** (`--scan-pii` bundler flag) — v0.1, ~2-3d
4. **Schema migration tool** — v0.1 commitment, ~3d when rrweb 3.0 ships
5. **`@echoframes/cli` split** — Only if Remotion Lambda use case surfaces

## 9. Open eng questions (resolved or scheduled)

- ✅ ~~rrdom deep-clone strategy~~ → Week 1 spike
- ✅ ~~Web Store privacy policy hosting~~ → host on echoframes.dev
- ✅ ~~NMH installer UX~~ → shell script for v0
- ✅ ~~Determinism regression test fixture~~ → T7 Week 1 extracts public fixture

## 10. Definition of ready (v0 = ship-ready)

- [ ] All 12 architecture decisions implemented & tested
- [ ] All 3 Week-1 spikes converged (rrdom clone / Bun-Win-NMH / public fixture)
- [ ] Week-2 mmap spike resolved (D12 or D12-A)
- [ ] Forward-play vs frame-seek regression test passes deterministically on public fixture
- [ ] Memdex 44s launch video re-renders end-to-end with new pipeline
- [ ] Multi-tab capture verified: 3 concurrent recordings → 3 distinct files
- [ ] 5 templates render to MP4 in <5min each from fresh `npx echoframes init`
- [ ] Chrome Web Store submission accepted OR .zip path documented in README
- [ ] Playwright E2E suite green on macOS + Linux
- [ ] 3 dry-run external users ship a video using only public docs
- [ ] Docs site live at `echoframes.dev`
- [ ] No P0/P1 issues open

## 11. Outside voice absorptions (audit trail)

Adversarial review run 2026-05-10 via Claude subagent (Codex unavailable on this machine). 8 tension points surfaced. Resolution:

| # | Tension | Decision | Plan delta |
|---|---|---|---|
| T1 | "Agent-first" needs multi-tab | **Absorbed** | Promoted from §6 deferred to Week 5 in-scope. +1 week. |
| T2 | Bun --compile + NMH on Windows unvalidated | **Absorbed** | Week 1 spike added. Fallback path (Node SEA) documented. |
| T3 | Node `fs.mmap` ≠ POSIX MAP_SHARED across Remotion workers | **Absorbed** | Week 2 spike added. Fallback (D12-A per-worker) documented. |
| T4 | 7-week timeline ignores Memdex parallel load | **Rejected** | Keep 7-week nominal; Week 4 velocity gate triggers extension if needed. |
| T5 | Web Store NMH gets heightened scrutiny | **Absorbed** | Submission moved Week 5 → Week 3. |
| T6 | Schema versioning without migration is theater | **Absorbed** | Migration tool committed to v0.1 (not "if needed"). |
| T7 | Determinism fixture is private | **Absorbed** | Week 1 extracts public fixture from example.com walkthrough. |
| T8 | "Fall back to PostHog fork" is dishonest | **Absorbed** | Plan now states explicitly: Week 1 spike failure = ship strictly-worse product. |

Net delta: +1 week (T1) + 3 days (T2 + T5 + T7) + 1 day (T3 spike) = ~+1.5 weeks. Total effective: 7 → 8.5 weeks.
