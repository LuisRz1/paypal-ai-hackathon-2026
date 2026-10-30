import test from "node:test";
import assert from "node:assert/strict";
import {
  capabilityHash,
  consumeCapability,
  issueCapability,
} from "./capability.ts";

const binding = {
  proposalId: "proposal-1",
  subscriptionId: "I-SUB-1",
  amount: "49.00",
  currency: "USD",
  policyHash: "policy-hash-1",
  requestId: "request-1",
};

const options = {
  secret: "deterministic-test-secret",
  now: 1_000_000,
  ttlMs: 60_000,
};

test("capability valid round trip binds the payload and hashes the token", () => {
  const { token, payload: issuedPayload } = issueCapability(binding, options);
  assert.equal(token.split(".").length, 2);

  const result = consumeCapability(token, binding, options);
  assert.equal(result.ok, true);
  assert.deepEqual(result.payload, issuedPayload);
  assert.equal(result.payload.proposalId, binding.proposalId);
  assert.equal(result.payload.subscriptionId, binding.subscriptionId);
  assert.equal(result.payload.amount, binding.amount);
  assert.equal(result.payload.currency, binding.currency);
  assert.equal(result.payload.policyHash, binding.policyHash);
  assert.equal(result.payload.requestId, binding.requestId);
  assert.equal(result.payload.expiresAt, options.now + options.ttlMs);
  assert.ok(result.payload.nonce.length > 0);
  assert.equal(result.capabilityHash, capabilityHash(token));
});

test("amount and subscription binding changes are rejected without consuming", () => {
  const { token } = issueCapability(binding, options);

  assert.deepEqual(
    consumeCapability(token, { ...binding, amount: "50.00" }, options),
    { ok: false, error: "CAPABILITY_BINDING_MISMATCH" },
  );
  assert.deepEqual(
    consumeCapability(
      token,
      { ...binding, subscriptionId: "I-SUB-2" },
      options,
    ),
    { ok: false, error: "CAPABILITY_BINDING_MISMATCH" },
  );
  assert.equal(consumeCapability(token, binding, options).ok, true);
});

test("tampering with encoded amount invalidates the capability signature", () => {
  const { token } = issueCapability(binding, options);
  const [payloadSegment, signatureSegment] = token.split(".");
  const payload = JSON.parse(
    Buffer.from(payloadSegment, "base64url").toString("utf8"),
  );
  payload.amount = "50.00";
  const tamperedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );

  assert.deepEqual(
    consumeCapability(`${tamperedPayload}.${signatureSegment}`, binding, options),
    { ok: false, error: "INVALID_CAPABILITY" },
  );
});

test("capability expires at its expiration boundary", () => {
  const { token } = issueCapability(binding, { ...options, ttlMs: 50 });
  assert.deepEqual(
    consumeCapability(token, binding, { ...options, now: options.now + 50 }),
    { ok: false, error: "EXPIRED_CAPABILITY" },
  );
});

test("consuming the same capability twice fails as a replay", () => {
  const { token } = issueCapability(binding, options);
  assert.equal(consumeCapability(token, binding, options).ok, true);
  assert.deepEqual(consumeCapability(token, binding, options), {
    ok: false,
    error: "CAPABILITY_REPLAYED",
  });
});

test("malformed capabilities and wrong secrets are invalid", () => {
  assert.deepEqual(consumeCapability("not-a-capability", binding, options), {
    ok: false,
    error: "INVALID_CAPABILITY",
  });

  const { token } = issueCapability(binding, options);
  assert.deepEqual(
    consumeCapability(token, binding, { ...options, secret: "wrong-secret" }),
    { ok: false, error: "INVALID_CAPABILITY" },
  );
});
