import test from "node:test";
import assert from "node:assert/strict";
import { mock, validateTransition } from "../src/api/mock.js";
const memory = new Map();
globalThis.localStorage = {
  getItem: (key) => memory.get(key) || null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key),
};
test("isolated mock service preserves role permissions and ticket workflows", async (t) => {
  await t.test("anonymous users cannot access tickets", async () => {
    await assert.rejects(mock.issues(), /sign in/);
  });
  await mock.login({ role: "user" });
  const originalPoints = (await mock.profile()).points;
  const issue = await mock.createIssue({
    submissionKey: "retry-key",
    title: "Broken fixture in room 201",
    description: "The fixture has come loose from the wall.",
    category: "Building",
    building: "Science Building",
    location: "Room 201",
    severity: "High",
    budget: 1200,
  });
  await t.test(
    "submission starts pending without fabricated AI assessment",
    async () => {
      assert.equal(issue.status, "Pending");
      assert.equal(issue.credibility, null);
      assert.equal(issue.reporterId, 1);
    },
  );
  await t.test("submission retry preserves the original ticket", async () => {
    const retry = await mock.createIssue({
      submissionKey: "retry-key",
      title: issue.title,
    });
    assert.equal(retry.id, issue.id);
  });
  await t.test(
    "ordinary users cannot change administrative status or settings",
    async () => {
      await assert.rejects(
        mock.status(issue.id, "Verified", []),
        /Administrator/,
      );
      await assert.rejects(mock.updateSettings([]), /Administrator/);
    },
  );
  await t.test("read receipts are idempotent and can be removed", async () => {
    await mock.read(issue.id, true);
    await mock.read(issue.id, true);
    assert.deepEqual((await mock.issue(issue.id)).readBy, [1]);
    await mock.read(issue.id, false);
    assert.deepEqual((await mock.issue(issue.id)).readBy, []);
  });
  await t.test(
    "comments reject blank input and preserve user identity",
    async () => {
      await assert.rejects(mock.comment(issue.id, "  "), /comment/);
      await mock.comment(issue.id, "  I’ve moved the chairs aside.  ");
      const comments = (await mock.issue(issue.id)).comments;
      assert.equal(comments[0].name, "Alex Morgan");
      assert.equal(comments[0].text, "I’ve moved the chairs aside.");
    },
  );
  await t.test("interactions do not fabricate local point awards", async () => {
    assert.equal((await mock.profile()).points, originalPoints);
  });
  await mock.login({ role: "admin" });
  await t.test(
    "administrators must follow the ordered status workflow",
    async () => {
      await assert.rejects(mock.status(issue.id, "Ongoing", []), /workflow/);
      await mock.status(issue.id, "Verified", []);
      await mock.status(issue.id, "Ongoing", []);
      await assert.rejects(
        mock.status(issue.id, "Completed", []),
        /supporting/,
      );
      assert.equal((await mock.issue(issue.id)).status, "Ongoing");
    },
  );
  await t.test(
    "completion records supporting evidence and actor history",
    async () => {
      await mock.status(issue.id, "Completed", [
        {
          name: "Completion.pdf",
          type: "application/pdf",
          url: "data:application/pdf;base64,JVBERg==",
        },
      ]);
      const updated = await mock.issue(issue.id);
      assert.equal(updated.attachments.length, 1);
      assert.equal(updated.status, "Completed");
      assert.equal(updated.history.at(-1).name, "Jamie Rivera");
      assert.equal(updated.history.length, 4);
    },
  );
  await t.test("reward settings persist for administrators", async () => {
    const updated = await mock.updateSettings([
      { action: "Verified report", points: 30 },
    ]);
    assert.equal(updated.rewards[0].points, 30);
  });
  await mock.logout();
  assert.equal(await mock.session(), null);
});
test("completion guard validates known statuses and evidence", () => {
  assert.throws(
    () => validateTransition("Invented", [], ["Pending"]),
    /valid status/,
  );
  assert.throws(
    () => validateTransition("Completed", [], ["Completed"]),
    /supporting/,
  );
});
