<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/wordmark-dark.svg" />
    <img src="./assets/wordmark.svg" alt="EchoFrames" width="380" />
  </picture>
</p>

<p align="center">
  <em>把任意 Web 产品流程录下来，渲染成帧级精准的 Remotion 视频。<br />
  Agent-first —— 用 Claude Code 驱动，不靠 timeline UI。</em>
</p>

<p align="center">
  <video src="./assets/launch-demo.mp4" controls autoplay loop muted playsinline width="720">
    你的浏览器不支持嵌入视频。<a href="./assets/launch-demo.mp4">下载（3.4 MB MP4）</a>.
  </video>
</p>

<p align="center">
  <sub>↑ 44 秒的 <a href="https://memdex.ai">Memdex</a> launch 视频，整条 pipeline 跑出来的产物。6 个 beat，ChatGPT / Claude / Gemini 跨平台演示。每一帧都是真实 DOM，不是录屏。</sub>
</p>

<p align="center">
  <a href="./ECHOFRAMES_V0_PLAN.md">v0 plan</a> ·
  <a href="https://memdex.ai">case study</a> ·
  <a href="#快速开始">快速开始</a> ·
  <a href="./README.md">English</a>
</p>

---

## 这是要解决什么问题

大家都开始用 Remotion 做 launch 视频了。保真度还是差。

- **录屏类工具**（Loom · Tella · ScreenStudio · QuickTime）上手简单，但输出是扁平的像素视频。不能重渲到 4K，不能改一个按钮颜色，不能重剪。产品 UI 一变，所有视频都要重录一遍。
- **手写 Remotion** 控制力满分，但你得在 React 里把真实产品 UI 重新搭一遍，每一个镜头几个小时——哪怕全程让 LLM 写代码。
- **现有 rrweb 播放器**（PostHog · Highlight）在 iframe 里回放给人看的，不是确定性的视频渲染器：正放和拖动到同一帧给出的 DOM 不一样（[rrweb#1816](https://github.com/rrweb-io/rrweb/issues/1816)）。

中间缺的 primitive：**录下真实的 DOM，再用 Remotion 确定性地渲成视频。** 这就是 EchoFrames。

## EchoFrames 是什么

三件套：

1. **`echoframes-capture`** —— 浏览器扩展（Chrome / Firefox）。点录制，用你的产品，点停止。DOM mutation + CSS + 字体 + 图片全部抓下来，存到 `~/echoframes/captures/{host}__{YYYY-MM-DD-HHmm}.json`。不上传，不 SaaS——文件只在你本机。
2. **`echoframes`** —— npm SDK。一个纯函数 `seekToFrame(events, frameIndex, fps)` 跑在 rrdom 之上，加一个 React 组件 `<EchoFrame events={…} />` 给 Remotion 用。正放和拖到任意帧产出**完全一致**的 DOM，任意分辨率输出。
3. **`/echoframes`** —— Claude Code 技能。直接告诉你的 agent：*"扫一下我的 captures，把那个 Notion 流程接到 launch 视频的 Beat 4，加一句 'see how it works' 字幕，然后渲出来。"* Agent 对话式完成，不需要点 timeline。

## 为什么 agent-first 是 killer angle

现有的 launch 视频工具假设有一个人在点 timeline。EchoFrames 假设有一个 AI agent 在读写源码——这解锁了 GUI 工具做不到的工作流：

### 1. 营销批量出 variant

> *"同一个流程，10 套字幕 × 3 个 VO 声音 × 2 个画幅，全部渲出来。"*

营销不需要一支完美的视频，他们需要 60 支廉价 variant 来找出哪个 use case 命中最重。在 EchoFrames 里这是一个 YAML manifest 上的 for 循环，不是 60 次 After Effects session。

### 2. PR 上的 Agent 自审

> *你的 code agent ship 了一个 landing page → 自己录一遍页面 → 配上一段讲解为什么这么设计的 VO → 把 MP4 贴回 PR。*

以前你的 reviewer 看 diff，现在他看一段 30 秒的旁白演示。Agent 多花的成本：可以忽略。

### 3. 永远可重渲

产品 UI 演进。在 EchoFrames 里，每一支 launch 视频都基于 capture 重新渲染。改一次 UI，所有 demo 视频自动刷新。

## 当前状态

**Pre-v0**。目标 7 周后公开发布。Scope 和 GTM 在 [`ECHOFRAMES_V0_PLAN.md`](./ECHOFRAMES_V0_PLAN.md)。

整条 pipeline 已经端到端跑通了：[**Memdex 的 launch 视频**](https://memdex.ai)（44 秒、6 个 beat、ChatGPT / Claude / Gemini 跨模型 AI 记忆 demo）就是用这套 stack 早期版本做的。生产参考代码在 [Memdex repo](https://github.com/XEasonChan/memdex) 的 `apps/launch-video/`。

<a name="快速开始"></a>
## 快速开始

> ⚠️ Pre-v0 预览。下面的命令是目标形态——还没全部接通。完成度跟踪在 `ECHOFRAMES_V0_PLAN.md` §7。

```bash
# 1. 装 capture 扩展
git clone https://github.com/XEasonChan/echoframes
cd echoframes/packages/echoframes-capture
yarn install && yarn pack:chrome
# 在 chrome://extensions 把 dist/chrome/ 作为 unpacked 加载

# 2. 录一段流程
# 点扩展 popup → 录制 → 用站点 → 停止
# → 文件落到 ~/echoframes/captures/{host}__{date}.json

# 3. 用 Claude Code 对话式接到 Remotion 项目里
cd ~/my-launch-video
claude

> /echoframes 把我最新的 notion capture 接成一个 12 秒的 beat，
> 字幕写 "Notion AI in 30 seconds"，然后渲成 MP4
```

Agent 接下来会：
1. 扫描 `~/echoframes/captures/` 并和你确认是哪个文件
2. 检查时长 / 事件数 / 资源大小
3. 一次性问 fps / 分辨率 / 是否打码 等参数
4. 跑 `npx echoframes bundle` 把字体和图片 inline 进去
5. 在 Remotion 项目的 `src/beats/` 写出 React 组件
6. 更新 `Composition.tsx` 和 `Root.tsx` 的 sequence
7. 渲出 MP4

不用 Claude Code 的手动用法见 [`docs/manual.md`](./docs/manual.md)（v0 时补）。

## v0 起手 5 套模板

每套都是独立的 Remotion 项目，可塞 1 个或多个 capture。

| 模板 | 用途 | 时长 |
|---|---|---|
| `launch-hero` | 30 秒产品 launch，VO + 字幕（Memdex 范式）| ~30s |
| `feature-walkthrough` | 单一功能聚焦讲解，含光标高亮 | 15-45s |
| `before-after` | 一个 UI 改动的 before / after 对照 | ~20s |
| `3-up-comparison` | 三个竞品 / 三个状态 / 三个 persona 同框 | ~25s |
| `testimonial-card` | 抓下来的产品 UI 配一段引用浮层 | ~10s |

社区贡献的模板会进 [`echoframes-recipes`](https://github.com/XEasonChan/echoframes-recipes)（独立 repo，欢迎 PR）。

## EchoFrames 和别的工具有什么不同

|   | 录屏类 | rrweb 回放 | Remotion 单用 | **EchoFrames** |
|---|:---:|:---:|:---:|:---:|
| 录真实产品 UI | ✅ | ✅ | ❌ | ✅ |
| 矢量级输出（任意分辨率）| ❌ | ❌ | ✅ | ✅ |
| 拖到任意帧 = 正放到该帧 | ❌ | ❌ | ✅ | ✅ |
| 产品 UI 变 → 视频自动更新 | ❌ | ❌ | ❌ | ✅ |
| 源码可编辑（不是二进制成品） | ❌ | ❌ | ✅ | ✅ |
| Agent 驱动写作 | ❌ | ❌ | 部分 | ✅ |
| 批量出 variant | ❌ | ❌ | 部分 | ✅ |

## 站在巨人肩上

下面这些 primitive 没有一项是我们造的：

- [**rrweb**](https://github.com/rrweb-io/rrweb)（MIT）—— DOM 事件录制 + snapshot。capture 扩展 fork 自 `rrweb-io/rrweb` `packages/web-extension`。
- [**rrdom**](https://github.com/rrweb-io/rrweb/tree/master/packages/rrdom)（MIT）—— 虚拟 DOM 树，是确定性 seek 的底座。
- [**Remotion**](https://remotion.dev/) —— React → MP4 渲染管线。
- [**posthog-react-rrweb-player**](https://github.com/PostHog/posthog-react-rrweb-player)（MIT）—— 在 React 里嵌 rrweb 的参考实现。

EchoFrames 自己加的部分：

- 一个纯同步的 `seekToFrame(events, frameIndex, fps)`（rrweb 的 `Replayer.pause(t)` 是非确定性的，参见 [rrweb#1816](https://github.com/rrweb-io/rrweb/issues/1816)）。
- `<EchoFrame>` Remotion 桥接组件。
- 离线资源 bundler（字体 + 图片 + CORS workaround）。
- v0 起手 5 套模板。
- Claude Code 技能。

## Roadmap

| 节点 | 范围 |
|---|---|
| **v0**（2026 Q3 目标）| 三件套首发：扩展 + SDK + 技能。5 套模板。资源 bundle。PII 自动打码。文档站 `echoframes.dev`。 |
| **v0.1** | 社区模板（`echoframes-recipes` ≥ 10 个）。GitHub Action：PR 预览部署 → 自动录 + 渲 → 贴回 PR。 |
| **v0.2+** | 看社区信号决定。Studio web 编辑器**故意**不在 roadmap——`/echoframes` 就是编辑器。 |

## 协议

MIT。和上游 rrweb 一致。

## 致谢

- 感谢 rrweb 团队提供让这一切成为可能的录制 primitive。
- 感谢 Remotion 团队证明 React-to-video 能做到生产级。
- 感谢 PostHog 和 Highlight 团队把 rrweb fork 生态打磨得更稳。

---

<p align="center">
  <sub>
    Made by <a href="https://twitter.com/xeasonchan">Andrew</a> at <a href="https://tanka.ai">Tanka.ai</a> ·
    Initial case study: <a href="https://memdex.ai">Memdex</a> ·
    Issues / PR 直接来 ·
    Discussions tab 是聊天的最佳去处。
  </sub>
</p>
