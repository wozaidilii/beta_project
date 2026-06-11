import assert from "node:assert/strict";

import {
  calculatePartScoreDeltas,
  getCandidateSelection,
  scoreDeltaKeys,
} from "~/lib/score-deltas";
import { calculateBuild, catalog, defaultSelection } from "~/lib/catalog";

const candidateGpu = catalog.gpu.find((part) => part.id !== defaultSelection.gpu);
assert.ok(candidateGpu, "test fixture should include an alternative GPU");

const candidateSelection = getCandidateSelection(defaultSelection, candidateGpu);
assert.equal(candidateSelection.gpu, candidateGpu.id);
assert.equal(candidateSelection.cpu, defaultSelection.cpu);
assert.equal(candidateSelection.case, defaultSelection.case);

const deltas = calculatePartScoreDeltas(defaultSelection, candidateGpu);
const currentScores = calculateBuild(defaultSelection).scores;
const nextScores = calculateBuild(candidateSelection).scores;

for (const key of scoreDeltaKeys) {
  assert.equal(deltas[key].current, currentScores[key]);
  assert.equal(deltas[key].next, nextScores[key]);
  assert.equal(deltas[key].delta, nextScores[key] - currentScores[key]);
}

const candidateFan = catalog.fans.find((part) => part.id !== defaultSelection.fans);
assert.ok(candidateFan, "test fixture should include an alternative fan");

const fanSelection = getCandidateSelection(defaultSelection, candidateFan);
assert.equal(fanSelection.fans, candidateFan.id);
assert.equal(fanSelection.gpu, defaultSelection.gpu);
