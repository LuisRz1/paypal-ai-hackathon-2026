import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { canonicalJson, sha256 } from "./integrity";

export interface CapabilityBinding {
  proposalId: string;
  subscriptionId: string;
  amount: string;
  currency: string;
  policyHash: string;
  requestId: string;
}

export interface CapabilityPayload extends CapabilityBinding {
  nonce: string;
  expiresAt: number;
}

export interface CapabilityIssue {
  token: string;
  payload: CapabilityPayload;
}

export interface CapabilityOptions {
  secret?: string | Uint8Array;
  now?: number;
  ttlMs?: number;
}

export type CapabilityFailure =
  | "INVALID_CAPABILITY"
  | "EXPIRED_CAPABILITY"
  | "CAPABILITY_BINDING_MISMATCH"
  | "CAPABILITY_REPLAYED";

export type CapabilityConsumption =
  | {
      ok: true;
      payload: CapabilityPayload;
      capabilityHash: string;
    }
  | {
      ok: false;
      error: CapabilityFailure;
    };

const bindingKeys = [
  "proposalId",
  "subscriptionId",
  "amount",
  "currency",
  "policyHash",
  "requestId",
] as const;

const DEFAULT_TTL_MS = 5 * 60 * 1000;
const capabilityGlobal = globalThis as typeof globalThis & {
  __recoverCapabilitySecret?: Uint8Array;
  __recoverConsumedCapabilityNonces?: Set<string>;
};

const consumedNonces = (capabilityGlobal.__recoverConsumedCapabilityNonces ??=
  new Set<string>());

function defaultSecret(): Uint8Array {
  return (capabilityGlobal.__recoverCapabilitySecret ??= randomBytes(32));
}

function signature(payloadSegment: string, secret: string | Uint8Array): Buffer {
  return createHmac("sha256", secret).update(payloadSegment, "utf8").digest();
}

function isBase64UrlSegment(value: string): boolean {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    return false;
  }
  return Buffer.from(value, "base64url").toString("base64url") === value;
}

function isCapabilityPayload(value: unknown): value is CapabilityPayload {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const payload = value as Partial<CapabilityPayload>;
  return (
    bindingKeys.every((key) => typeof payload[key] === "string") &&
    typeof payload.nonce === "string" &&
    payload.nonce.length > 0 &&
    typeof payload.expiresAt === "number" &&
    Number.isFinite(payload.expiresAt)
  );
}

export function capabilityHash(token: string): string {
  return sha256(token);
}

export function issueCapability(
  binding: CapabilityBinding,
  options: CapabilityOptions = {},
): CapabilityIssue {
  for (const key of bindingKeys) {
    if (typeof binding[key] !== "string" || binding[key].length === 0) {
      throw new TypeError(`Capability ${key} must be a non-empty string`);
    }
  }

  const now = options.now ?? Date.now();
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  if (!Number.isFinite(now) || !Number.isFinite(ttlMs) || ttlMs <= 0) {
    throw new TypeError("Capability time options must be finite and ttlMs positive");
  }

  const expiresAt = now + ttlMs;
  if (!Number.isFinite(expiresAt)) {
    throw new TypeError("Capability expiration must be finite");
  }

  const payload: CapabilityPayload = {
    ...binding,
    nonce: randomBytes(24).toString("base64url"),
    expiresAt,
  };
  const payloadSegment = Buffer.from(canonicalJson(payload), "utf8").toString(
    "base64url",
  );
  const signatureSegment = signature(
    payloadSegment,
    options.secret ?? defaultSecret(),
  ).toString("base64url");
  return {
    token: `${payloadSegment}.${signatureSegment}`,
    payload,
  };
}

export function consumeCapability(
  token: string,
  binding: CapabilityBinding,
  options: CapabilityOptions = {},
): CapabilityConsumption {
  if (typeof token !== "string") {
    return { ok: false, error: "INVALID_CAPABILITY" };
  }

  const segments = token.split(".");
  if (
    segments.length !== 2 ||
    !isBase64UrlSegment(segments[0]) ||
    !isBase64UrlSegment(segments[1])
  ) {
    return { ok: false, error: "INVALID_CAPABILITY" };
  }

  const [payloadSegment, signatureSegment] = segments;
  const actualSignature = Buffer.from(signatureSegment, "base64url");
  const expectedSignature = signature(
    payloadSegment,
    options.secret ?? defaultSecret(),
  );
  if (
    actualSignature.length !== expectedSignature.length ||
    !timingSafeEqual(actualSignature, expectedSignature)
  ) {
    return { ok: false, error: "INVALID_CAPABILITY" };
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf8"));
  } catch {
    return { ok: false, error: "INVALID_CAPABILITY" };
  }
  if (!isCapabilityPayload(decoded)) {
    return { ok: false, error: "INVALID_CAPABILITY" };
  }

  const now = options.now ?? Date.now();
  if (!Number.isFinite(now)) {
    return { ok: false, error: "INVALID_CAPABILITY" };
  }
  if (now >= decoded.expiresAt) {
    return { ok: false, error: "EXPIRED_CAPABILITY" };
  }

  for (const key of bindingKeys) {
    if (decoded[key] !== binding[key]) {
      return { ok: false, error: "CAPABILITY_BINDING_MISMATCH" };
    }
  }

  // This synchronous check-and-add is atomic with respect to other consumers
  // on the JavaScript event loop; no await can interleave the two operations.
  if (consumedNonces.has(decoded.nonce)) {
    return { ok: false, error: "CAPABILITY_REPLAYED" };
  }
  consumedNonces.add(decoded.nonce);

  return {
    ok: true,
    payload: decoded,
    capabilityHash: capabilityHash(token),
  };
}
