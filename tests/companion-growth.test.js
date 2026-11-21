import test from "node:test";
import assert from "node:assert/strict";
import { companionGrowth } from "../src/components/companionGrowth.js";
const levels = [
  { number: 1, points: 0 },
  { number: 2, points: 100 },
  { number: 3, points: 250 },
  { number: 4, points: 500 },
];
test("companion grows with backend account level and remains adult above level three", () => {
  assert.equal(
    companionGrowth({ level: "Level 1", points: 0 }, levels).name,
    "Puppy",
  );
  assert.equal(
    companionGrowth({ levelNumber: 2, level: "Level 2", points: 100 }, levels)
      .name,
    "Adolescent",
  );
  assert.equal(
    companionGrowth({ levelNumber: 3, points: 250 }, levels).name,
    "Adult",
  );
  assert.equal(
    companionGrowth({ levelNumber: 4, points: 600 }, levels).stage,
    3,
  );
  assert.equal(
    companionGrowth({ levelNumber: 1, points: 1000 }, levels).stage,
    1,
  );
  assert.equal(
    companionGrowth({ level: "Campus contributor", points: 185 }, levels).stage,
    2,
  );
});
