import { scale, semantic } from "./tokens";

type SemanticGroup<G extends keyof typeof semantic & keyof typeof scale> = {
  [K in keyof (typeof semantic)[G]]: (typeof scale)[G][keyof (typeof scale)[G]];
};

const resolveGroup = <G extends keyof typeof semantic & keyof typeof scale>(
  group: G,
): SemanticGroup<G> => {
  const resolved = {} as Record<string, unknown>;
  for (const [name, scaleKey] of Object.entries(semantic[group])) {
    resolved[name] = (scale[group] as Record<string, unknown>)[scaleKey as string];
  }
  return resolved as SemanticGroup<G>;
};

export const tokens = {
  scale,
  semantic: {
    color: resolveGroup("color"),
  },
};

export type Tokens = typeof tokens;
export type ScaleColorToken = keyof typeof scale.color;
export type SemanticColorToken = keyof typeof semantic.color;
export type RadiusToken = keyof typeof scale.radius;
export type SpacingToken = keyof typeof scale.spacing;
export type FontSizeToken = keyof typeof scale.fontSize;
export type FontWeightToken = keyof typeof scale.fontWeight;
