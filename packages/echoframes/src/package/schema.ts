import { z } from 'zod';

export const AssetRefSchema = z.object({
  originalUrl: z.string().url(),
  localPath: z.string(),
  mime: z.string(),
  bytes: z.number().int().nonnegative(),
  status: z.enum(['ok', 'cors-blocked', 'http-error', 'timeout', 'skipped']),
});

// D7.3: single source of truth for keyframe trigger values; capture-side imports from here
export const KeyframeTriggerSchema = z.enum([
  'interval',
  'interaction',
  'mutation-burst',
  'navigation',
]);
export type KeyframeTrigger = z.infer<typeof KeyframeTriggerSchema>;

export const KeyframeSchema = z.object({
  tMs: z.number().nonnegative(),
  file: z.string(),
  label: z.string(),
  trigger: KeyframeTriggerSchema,
});

export const SceneSchema = z.object({
  startMs: z.number().nonnegative(),
  endMs: z.number().nonnegative(),
  intent: z.string(),
  visibleText: z.array(z.string()),
  primaryElement: z
    .object({
      selector: z.string(),
      bbox: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }),
    })
    .optional(),
});

export const SemanticBriefSchema = z.object({
  title: z.string(),
  scenes: z.array(SceneSchema),
});

export const LayerRefSchema = z.object({
  kind: z.enum([
    'computed-style',
    'cssom',
    'canvas-bitmap',
    'iframe-bitmap',
    'animations',
    'navigation',
    'fonts',
    'metadata',
    'a11y',
    'diagnostics',
  ]),
  path: z.string(),
  attachedTo: z.enum(['keyframe', 'snapshot', 'event', 'package']),
  index: z.number().int().nonnegative().optional(),
});

export const LayersSchema = z.record(z.string(), z.array(LayerRefSchema));

export const EchoFramePackageSchema = z.object({
  version: z.literal(1),
  capturedAt: z.string().datetime(),
  sourceUrl: z.string().url(),
  viewport: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    dpr: z.number().positive(),
  }),
  durationMs: z.number().nonnegative(),
  events: z.array(z.unknown()),
  assets: z.array(AssetRefSchema),
  keyframes: z.array(KeyframeSchema),
  semantic: SemanticBriefSchema,
  layers: LayersSchema,
});

export type EchoFramePackage = z.infer<typeof EchoFramePackageSchema>;
export type AssetRef = z.infer<typeof AssetRefSchema>;
export type Keyframe = z.infer<typeof KeyframeSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type SemanticBrief = z.infer<typeof SemanticBriefSchema>;
export type LayerRef = z.infer<typeof LayerRefSchema>;
