import test from "node:test";
import assert from "node:assert/strict";
import { createSubmissionKey } from "../src/api/submissionKey.js";

test("submission keys work when LAN HTTP lacks randomUUID", () => {
  const cryptoAPI = {
    getRandomValues(bytes) {
      bytes.fill(255);
      return bytes;
    },
  };
  assert.equal(
    createSubmissionKey(cryptoAPI),
    "ffffffff-ffff-4fff-bfff-ffffffffffff",
  );
  assert.match(
    createSubmissionKey(null),
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
  assert.equal(
    createSubmissionKey({ randomUUID: () => "native-key" }),
    "native-key",
  );
});
