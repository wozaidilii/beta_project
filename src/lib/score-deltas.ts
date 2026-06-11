import {
  calculateBuild,
  type Part,
  type PartSelection,
} from "~/lib/catalog";

export const scoreDeltaKeys = ["gaming", "ai", "creator", "quiet"] as const;

export type ScoreDeltaKey = (typeof scoreDeltaKeys)[number];

export type ScoreDelta = {
  current: number;
  next: number;
  delta: number;
};

export type ScoreDeltaMap = Record<ScoreDeltaKey, ScoreDelta>;

export function getCandidateSelection(
  selection: PartSelection,
  candidate: Part,
): PartSelection {
  return {
    ...selection,
    [candidate.category]: candidate.id,
  };
}

export function calculatePartScoreDeltas(
  selection: PartSelection,
  candidate: Part,
): ScoreDeltaMap {
  const currentScores = calculateBuild(selection).scores;
  const nextScores = calculateBuild(getCandidateSelection(selection, candidate)).scores;

  return scoreDeltaKeys.reduce((acc, key) => {
    acc[key] = {
      current: currentScores[key],
      delta: nextScores[key] - currentScores[key],
      next: nextScores[key],
    };
    return acc;
  }, {} as ScoreDeltaMap);
}
