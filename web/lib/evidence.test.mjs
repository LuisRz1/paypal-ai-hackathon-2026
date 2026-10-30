import test from "node:test";
import assert from "node:assert/strict";
import {
  appendLedgerEvent,
  evidencePublicKey,
  signRecoveryPassport,
  verifyLedger,
  verifyRecoveryPassport,
} from "./evidence.ts";

function eventInput(id, detail = { amount: "49.00" }) {
  return {
    id,
    type: "capture",
    proposalId: "proposal-1",
    at: "2026-10-28T12:00:00.000Z",
    detail,
  };
}

function populatedLedger() {
  const ledger = [];
  appendLedgerEvent(ledger, eventInput("event-1"));
  appendLedgerEvent(ledger, eventInput("event-2", { status: "VERIFIED" }));
  return ledger;
}

test("ledger append snapshots detail and creates a valid hash chain", () => {
  const ledger = [];
  const detail = { amount: "49.00", nested: { status: "PROPOSED" } };
  const first = appendLedgerEvent(ledger, eventInput("event-1", detail));
  detail.nested.status = "MUTATED";

  assert.equal(first.detail.nested.status, "PROPOSED");
  assert.equal(first.sequence, 1);
  assert.equal(first.previousHash, "");
  assert.match(first.hash, /^[0-9a-f]{64}$/);

  const second = appendLedgerEvent(ledger, eventInput("event-2"));
  assert.equal(second.sequence, 2);
  assert.equal(second.previousHash, first.hash);
  assert.equal(verifyLedger(ledger), true);
  assert.equal(verifyLedger([]), true);
});

test("ledger detail and hash tampering are detected", () => {
  const ledger = populatedLedger();
  ledger[0].detail.amount = "50.00";
  assert.equal(verifyLedger(ledger), false);

  const changedHash = populatedLedger();
  changedHash[0].hash = "0".repeat(64);
  assert.equal(verifyLedger(changedHash), false);
});

test("ledger sequence and previous-link tampering are detected", () => {
  const changedSequence = populatedLedger();
  changedSequence[1].sequence = 3;
  assert.equal(verifyLedger(changedSequence), false);

  const changedLink = populatedLedger();
  changedLink[1].previousHash = "0".repeat(64);
  assert.equal(verifyLedger(changedLink), false);
});

test("recovery passport valid round trip verifies all checks", () => {
  const passport = signRecoveryPassport({
    proposalId: "proposal-1",
    verified: true,
    ledger: populatedLedger(),
  });
  const publicKey = evidencePublicKey();

  assert.equal(passport.format, "recover-passport/v1");
  assert.equal(passport.algorithm, "Ed25519");
  assert.equal(passport.keyId, publicKey.keyId);
  assert.equal(passport.publicKeyPem, publicKey.publicKeyPem);
  assert.match(passport.payloadHash, /^[0-9a-f]{64}$/);

  const result = verifyRecoveryPassport(passport, publicKey.keyId);
  assert.equal(result.valid, true);
  assert.deepEqual(result.checks, {
    structure: true,
    payloadHash: true,
    ledger: true,
    keyId: true,
    trustedKeyId: true,
    signature: true,
  });
  assert.equal(result.error, undefined);
});

test("passport payload and embedded ledger tampering are detected", () => {
  const passport = signRecoveryPassport({
    proposalId: "proposal-1",
    verified: true,
    ledger: populatedLedger(),
  });
  passport.payload.verified = false;
  passport.payload.ledger[0].detail.amount = "50.00";

  const result = verifyRecoveryPassport(passport);
  assert.equal(result.valid, false);
  assert.equal(result.checks.payloadHash, false);
  assert.equal(result.checks.ledger, false);
  assert.equal(result.checks.signature, true);
});

test("passport signature tampering is detected", () => {
  const passport = signRecoveryPassport({
    proposalId: "proposal-1",
    ledger: populatedLedger(),
  });
  passport.signature = "A".repeat(86);

  const result = verifyRecoveryPassport(passport);
  assert.equal(result.valid, false);
  assert.equal(result.checks.payloadHash, true);
  assert.equal(result.checks.ledger, true);
  assert.equal(result.checks.signature, false);
  assert.equal(result.error, "INVALID_SIGNATURE");
});

test("passport rejects an untrusted key ID", () => {
  const passport = signRecoveryPassport({
    proposalId: "proposal-1",
    ledger: populatedLedger(),
  });
  const result = verifyRecoveryPassport(passport, "different-key");

  assert.equal(result.valid, false);
  assert.equal(result.checks.trustedKeyId, false);
  assert.equal(result.error, "UNTRUSTED_KEY_ID");
});

test("malformed passports return failures without throwing", () => {
  for (const value of [null, undefined, "passport", [], {}, 42]) {
    assert.doesNotThrow(() => verifyRecoveryPassport(value));
    const result = verifyRecoveryPassport(value);
    assert.equal(result.valid, false);
    assert.equal(result.checks.structure, false);
  }
});
