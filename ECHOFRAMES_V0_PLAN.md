---
status: ACTIVE
created: 2026-05-09
project: EchoFrames (OSS toolkit + 5 templates, replaces working name "rrwebmotion")
name_decided: 2026-05-10
owner: Andrew (XEasonChan)
review_type: plan-ceo-review
---

# EchoFrames · v0 CEO Plan

> Web → record → deterministic Remotion video. OSS toolkit + 5 starter templates. HN Show HN launch.
>
> **Name etymology**: *Echo* (faithful replay of the source) + *Frames* (deterministic per-frame Remotion render). Pronounced like the noun, plural — implies a series of true reflections.

## 1. North-star one-liner

**"Record any web product flow in your browser. Get a frame-perfect launch video in Remotion."**

Audience that understands this in 5 seconds:
- Indie devs / founders shipping launches who already know Remotion exists but bounce off authoring complexity
- Marketing/operations teammates who can record but not write Remotion code
- DevRel teams making per-release product demos

## 2. Decisions made (this review)

| # | Decision | Choice | Rationale |
|---|---|---|---|
| D1 | Architecture | **Approach C — OSS toolkit + template ecosystem** | Beats Approach A (no GTM hook beyond docs) and B (Studio adds 10w + ops cost before product-market fit) |
| D2 | F1 templates at v0 | **5 starter templates** | Gives copy-paste path for the 80% case; small enough to ship in 1 person-week of design+code |
| D3 | C2 GitHub Action (CI capture→video) | **Defer to v0.2** | Not in critical path for HN launch; users on day 0 will run locally anyway |
| D4 | Launch channel | **Hacker News "Show HN"** | Aligns with primary audience (devs/founders); single high-signal moment beats 5 lukewarm posts |

## 3. v0 scope (ship in ~7 weeks)

### 3a. Accepted into v0

| ID | Item | Why in v0 | Effort |
|---|---|---|---|
| **F1** | 5 starter templates (`launch-hero` / `feature-walkthrough` / `before-after` / `3-up-comparison` / `testimonial-card`) | The "what do I do with this" answer; each is a runnable Remotion project consuming an `events.json` slot | 5d (design + Remotion wiring + capture per template) |
| **F2** | Capture metadata injection (`title`, `subtitle`, `cta`, `vo_script` fields prompted at record-stop) | Lets templates read user-supplied copy without code edits; closes the marketer gap | 2d (extension UI + JSON schema) |
| **F3** | Multi-clip stitching primitive (`<RemotionRrweb events={[a, b, c]} transitions="fade" />`) | Most launch videos = 3-5 short clips, not one long capture; without this, every user hand-rolls Sequences | 3d (SDK + tests on Memdex 6-beat case) |
| **F4** | PII auto-redaction (configurable selectors + default `password` / `email` masking) | Captures of real product flows leak; without this, no marketer will trust it for prod | 2d (extension config + SDK passthrough) |
| **C1** | `echoframes-recipes` repo (showcase + community PR target) | Concrete proof the pattern is reusable; HN comments will ask "show me real examples" | 2d (initial 5 = same as F1 templates, just published as standalone repo) |
| **C3** | Asset bundling robustness (fonts, images, canvas opt-in, CORS workaround, broken-asset placeholder) | Memdex case already exposed font/image edge cases; without this, 30% of captures render broken | 4d (existing bundler + 4 known fixes from troubleshooting.md) |
| **G1** | Docs site `echoframes.dev` (concept page + 5 template galleries + capture extension install + skill quickstart) | HN traffic dies if landing = github README; needs a 30-second skim experience | 3d (Next.js + MDX + screenshots from real captures) |

### 3b. Deferred to v0.2

| ID | Item | Defer reason | Earliest revisit |
|---|---|---|---|
| **C2** | GitHub Action: PR opens → CI captures preview deploy → renders video → posts to PR | Not on critical path for HN. Most v0 users are local-only. Adds CI infra ops surface that distracts from core SDK polish. | After v0 has ≥100 GitHub stars and ≥3 community templates |
| Studio web editor | Per D1 strategy, never v0 | Replaced by Claude Code skill; revisit only if HN feedback is "I want a UI" from non-technical users | Month 4 review |
| SaaS / hosted render | Same as above | OSS first; hosted only if community asks loudly | Month 6 review |

### 3c. Sequencing (7 weeks)

```
Week 1     | Spike: rrdom + seekToFrame() pure function. Validate on Memdex events.json.
Week 2-3   | SDK MVP: <RemotionRrweb> + bundleAssets + multi-clip stitching (F3).
Week 4     | Capture extension fork (echoframes-capture): metadata injection (F2) + PII (F4).
Week 5     | 5 templates (F1) + recipes repo (echoframes-recipes / C1).
Week 6     | Asset bundling hardening (C3) + Claude skill polish (rename `/rrwebmotion` → `/echoframes`).
Week 7     | Docs site (G1) + HN dry-run (post in private to 5 friends, fix top complaints) + launch.
```

Gate before HN: 5 templates each render to MP4 in <5 minutes from a fresh install. If not, slip launch by 1 week.

## 4. GTM playbook (90 days post-launch)

### 4a. Pre-launch (Week 7, before HN)

- [ ] 5 templates each have an MP4 demo on docs site (autoplay-muted-loop, ≤30s each)
- [ ] One "kitchen sink" demo = the Memdex 44s launch video (real production case study, link to PR #87)
- [ ] README has install + 60-second quickstart (≤4 commands)
- [ ] 3 close devs (Tanka team / 2 founder friends) record their own launch video using the toolkit; collect friction notes; fix top 3 issues
- [ ] HN account warmed up (existing comments / submissions in past 3 months — Andrew's `xeasonchan` already qualifies)
- [ ] Tweet draft + Show HN draft + LinkedIn draft pre-written

### 4b. Launch week (Week 7-8)

**Day 0 — Tuesday 8:30 AM PT (HN's highest-signal slot)**
- Show HN: "EchoFrames – Record web product flows, get frame-perfect Remotion videos"
- Body: 3 sentences problem → 1 sentence solution → 5-template gallery link → 1 GIF of capture-to-render

**Day 0 — same day, staggered**
- Tweet thread (12 tweets: problem / 5 template demos with MP4s / install command / link to repo)
- LinkedIn post (focus on the marketer angle, not dev angle)
- /r/Remotion subreddit (genuine post, not promo — link to the multi-clip stitching pattern as the technical interesting bit)
- Indie Hackers post (focus on Memdex case study, the "real product launched on this" angle)

**Day 1-3 — react to traffic**
- Engage every HN comment within 1 hour during US morning
- Open issues for top 3 complaints; ship fixes within 48h
- DM tweet repliers asking what they'd record; offer to pair on their first capture

**Day 4-7 — second wave**
- Dev.to longform: "How I built the Memdex launch video with a browser extension"
- Submit to Hacker Newsletter / TLDR Newsletter
- Reach out to 5 micro-influencers in the indie-launch space (Levelsio / Tony Dinh / Marc Lou / Pieter etc.) — not for shoutout, for honest feedback

### 4c. Compounding (Month 2-3)

Goal: convert HN traffic spike into recurring contributor flywheel.

- [ ] **Month 2 W1**: Open `good-first-issue` template-design issues — 5 specific template requests (e.g. "SaaS pricing flow walkthrough", "Mobile-web app onboarding 3-up", "Open-source project README hero")
- [ ] **Month 2 W2-4**: Office-hours stream weekly (1h Friday) showing live capture-to-render of suggested products. Post recordings as additional template seeds.
- [ ] **Month 3**: Ship v0.1 with 3-5 community-contributed templates. Co-author with contributors. Use this as second-wave HN moment ("Show HN: EchoFrames v0.1 — community templates")

Stretch metric: 10 community-contributed templates by Day 90.

### 4d. Community velocity (continuous)

- Discord or GitHub Discussions (start with Discussions; only spin Discord if >100 users active)
- Weekly "what did you record this week" thread
- Tag system on recipes repo: `industry:saas`, `pattern:walkthrough`, `length:30s` — makes templates discoverable

### 4e. Decide-next at Month 4

Re-evaluate based on signals:

| Signal | If true → next bet |
|---|---|
| ≥500 stars + ≥10 community templates + recurring weekly captures | Build C2 (GitHub Action) — community is sticky enough to justify CI infra |
| ≥500 stars but no community templates | Pivot focus: templates ARE the product, build a template marketplace |
| <200 stars but enthusiastic feedback from non-devs | Reconsider Studio web editor for marketers (the deferred decision) |
| Stalled across all metrics | Sunset to maintenance, fold templates into Memdex's own marketing flywheel |

## 5. Memdex co-benefit (why Andrew specifically should ship this)

The Memdex 44s launch video already validates the pipeline end-to-end — it's the strongest demo for HN. Shipping EchoFrames as OSS:

1. **Distribution**: every template page links to memdex.ai as the production case study. Free top-of-funnel for Memdex.
2. **Recruiting signal**: shipping a real OSS project at this technical depth attracts Remotion / rrweb / browser-extension talent — exactly the skill set Memdex's extension team needs.
3. **Moat**: as Memdex iterates UI, the launch video re-renders deterministically. Web2LaunchVid pays back every product change.
4. **Compounding asset**: templates become Memdex's library too — every new feature ships with a template-derived video.

This is not separate from Memdex; it's marketing infrastructure dressed as OSS.

## 6. Open questions / risks

- **Risk: rrweb upstream determinism issues compound.** If the spike (Week 1) finds `seekToFrame()` more invasive than estimated, slip everything by 2 weeks. This is the single biggest schedule risk.
  - Mitigation: timebox spike to 5 days; if not converging, fall back to PostHog's existing fork as base instead of clean rrweb.
- **Risk: HN doesn't bite.** The "video" angle competes with screen-recording tools that look easier. Mitigation: lean on "deterministic / programmable / re-renders on product change" — that framing has no competitor.
- **Risk: community templates don't materialize.** Without external contributors, this becomes Andrew's solo OSS chore. Mitigation: Month 2 office-hours converts watchers into contributors; if no traction by Month 4, re-scope per §4e.
- **Open: licensing**. rrweb is MIT; PostHog's fork is MIT; Highlight.io's is Apache-2.0. Web2LaunchVid should be MIT — confirm no GPL-tainted dep gets pulled in (notably WebVideoCreator is GPL — must avoid).
- ~~Open: project name finalization.~~ **RESOLVED 2026-05-10 → EchoFrames.** Migration list (do before Week 7):
  - GitHub repo: `XEasonChan/rrwebmotion` → `XEasonChan/echoframes` (one click on GitHub; auto-redirects old URLs)
  - npm package: `rrwebmotion` → `echoframes` (publish fresh; mark old name deprecated if ever published)
  - Browser extension: `rrwebmotion-capture` → `echoframes-capture` (rename `packages/web-extension` directory + manifest name)
  - Claude skill: `~/.claude/skills/rrwebmotion/` → `~/.claude/skills/echoframes/` (rename dir, update internal SKILL.md references)
  - Domain: register `echoframes.dev` (and `.com` defensively)
  - Logo / wordmark: design after rename, before Week 7 docs site build

## 7. Acceptance criteria (definition of "v0 ready to launch")

- [ ] All 5 templates render to MP4 in <5 min from `npx create-echoframes` on a fresh machine
- [ ] Capture extension installable via .zip on Chrome and Firefox (Web Store submission can land later)
- [ ] Memdex 44s launch video re-renders end-to-end via the public toolkit (proof of pipeline)
- [ ] Docs site has install / quickstart / 5 template galleries / 1 case study
- [ ] No P0 / P1 issues open in the GitHub repo
- [ ] 3 dry-run users (non-Andrew) successfully ship a video using only public docs

## 8. What this plan does NOT decide

Intentionally left for later:
- Pricing model (OSS first; if hosted ever happens, decide then)
- Trademark / brand identity beyond a name
- Full visual design system for the docs site (use a clean Tailwind starter; iterate post-launch)
- Detailed v0.2 scope (rough idea: GitHub Action + 5 more templates + community-suggested features)
- Partnership / integration list (only pursue inbound interest in Month 2-3, don't push)

---

_Status: ACTIVE through v0 launch. Re-review at Month 4 per §4e._
