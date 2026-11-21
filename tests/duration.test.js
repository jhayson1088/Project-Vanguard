import test from "node:test";
import assert from "node:assert/strict";
import { issueDuration } from "../src/components/duration.js";

test("open duration advances and completed duration stays frozen", () => {
  const issue = { status: "Pending", createdAt: "2026-11-01T00:00:00Z" };
  assert.equal(
    issueDuration(issue, Date.parse("2026-11-03T05:30:00Z")),
    "Open for 2d 5h",
  );
  assert.equal(
    issueDuration(issue, Date.parse("2026-11-04T06:00:00Z")),
    "Open for 3d 6h",
  );
  issue.status = "Completed";
  issue.completedAt = "2026-11-03T05:30:00Z";
  assert.equal(
    issueDuration(issue, Date.parse("2026-12-01T00:00:00Z")),
    "Completed in 2d 5h",
  );
  assert.equal(
    issueDuration({ ...issue, completedAt: null }),
    "Closure time unavailable",
  );
  assert.equal(
    issueDuration({
      ...issue,
      completedAt: null,
      history: [{ status: "Completed", date: "2026-11-02T00:00:00Z" }],
    }),
    "Completed in 1d 0h",
  );
});

test("cancelled duration freezes at cancellation", () => {
  const issue = {
    status: "Cancelled",
    createdAt: "2026-11-01T00:00:00Z",
    cancelledAt: "2026-11-03T04:00:00Z",
  };
  assert.equal(
    issueDuration(issue, Date.parse("2026-12-01T00:00:00Z")),
    "Cancelled in 2d 4h",
  );
});
