import {
  generateKeyPairSync,
  sign as signEd25519,
  verify as verifyEd25519,
  type KeyObject,
} from "node:crypto";
import { sha256 } from "./integrity";

export interface EvidenceLedgerEvent {
  id: string;
  type: string;
  proposalId: string;
  at: string;
  detail: Record<string, unknown>;
  sequence: number;
  previousHash: string;
  hash: string;
}

export type EvidenceLedgerEventInput = Omit<
  EvidenceLedgerEvent,
  "sequence" | "previousHash" | "hash"
>;

export interface RecoveryPassportPayload {
  ledger: EvidenceLedgerEvent[];
}

export interface RecoveryPassport<
  T extends RecoveryPassportPayload = RecoveryPassportPayload,
> {
  format: "recover-passport/v1";
  payload: T;
  payloadHash: string;
  signature: string;
  publicKeyPem: string;
  keyId: string;
  algorithm: "Ed25519";
}

export interface PassportVerificationChecks {
  structure: boolean;
  payloadHash: boolean;
  ledger: boolean;
  keyId: boolean;
  trustedKeyId: boolean;
  signature: boolean;
}

export type PassportVerificationError =
  | "INVALID_PASSPORT"
  | "INVALID_PASSPORT_STRUCTURE"
  | "PAYLOAD_HASH_MISMATCH"
  | "INVALID_LEDGER"
  | "KEY_ID_MISMATCH"
  | "UNTRUSTED_KEY_ID"
  | "INVALID_SIGNATURE";

export interface PassportVerification {
  valid: boolean;
  checks: PassportVerificationChecks;
  error?: PassportVerificationError;
}

export interface EvidencePublicKey {
  keyId: string;
  publicKeyPem: string;
  algorithm: "Ed25519";
}

interface EvidenceKeyMaterial extends EvidencePublicKey {
  privateKey: KeyObject;
}

const evidenceGlobal = globalThis as typeof globalThis & {
  __recoverEvidenceKeyMaterial?: EvidenceKeyMaterial;
};

function evidenceKeyMaterial(): EvidenceKeyMaterial {
  const existing = evidenceGlobal.__recoverEvidenceKeyMaterial;
  if (existing) {
    return existing;
  }

  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey
    .export({ type: "spki", format: "pem" })
    .toString();
  const material: EvidenceKeyMaterial = {
    privateKey,
    publicKeyPem,
    keyId: sha256(publicKeyPem),
    algorithm: "Ed25519",
  };
  evidenceGlobal.__recoverEvidenceKeyMaterial = material;
  return material;
}

export function appendLedgerEvent(
  ledger: EvidenceLedgerEvent[],
  eventWithoutIntegrity: EvidenceLedgerEventInput,
): EvidenceLedgerEvent {
  const content = {
    id: eventWithoutIntegrity.id,
    type: eventWithoutIntegrity.type,
    proposalId: eventWithoutIntegrity.proposalId,
    at: eventWithoutIntegrity.at,
    detail: structuredClone(eventWithoutIntegrity.detail),
    sequence: ledger.length + 1,
    previousHash: ledger.length === 0 ? "" : ledger[ledger.length - 1].hash,
  };
  const event: EvidenceLedgerEvent = {
    ...content,
    hash: sha256(content),
  };
  ledger.push(event);
  return event;
}

export function verifyLedger(ledger: readonly EvidenceLedgerEvent[]): boolean {
  if (!Array.isArray(ledger)) {
    return false;
  }

  let previousHash = "";
  for (let index = 0; index < ledger.length; index += 1) {
    const value: unknown = ledger[index];
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return false;
    }
    const event = value as EvidenceLedgerEvent;
    if (
      typeof event.id !== "string" ||
      typeof event.type !== "string" ||
      typeof event.proposalId !== "string" ||
      typeof event.at !== "string" ||
      event.detail === null ||
      typeof event.detail !== "object" ||
      Array.isArray(event.detail) ||
      !Number.isInteger(event.sequence) ||
      typeof event.previousHash !== "string" ||
      typeof event.hash !== "string" ||
      event.sequence !== index + 1 ||
      event.previousHash !== previousHash
    ) {
      return false;
    }

    const content = {
      id: event.id,
      type: event.type,
      proposalId: event.proposalId,
      at: event.at,
      detail: event.detail,
      sequence: event.sequence,
      previousHash: event.previousHash,
    };
    if (event.hash !== sha256(content)) {
      return false;
    }
    previousHash = event.hash;
  }
  return true;
}

export function evidencePublicKey(): EvidencePublicKey {
  const { keyId, publicKeyPem, algorithm } = evidenceKeyMaterial();
  return { keyId, publicKeyPem, algorithm };
}

export function signRecoveryPassport<
  T extends RecoveryPassportPayload,
>(payload: T): RecoveryPassport<T> {
  const material = evidenceKeyMaterial();
  const payloadHash = sha256(payload);
  const signature = signEd25519(
    null,
    Buffer.from(payloadHash, "utf8"),
    material.privateKey,
  ).toString("base64url");
  return {
    format: "recover-passport/v1",
    payload,
    payloadHash,
    signature,
    publicKeyPem: material.publicKeyPem,
    keyId: material.keyId,
    algorithm: "Ed25519",
  };
}

export function verifyRecoveryPassport(
  value: unknown,
  trustedKeyId?: string,
): PassportVerification {
  const checks: PassportVerificationChecks = {
    structure: false,
    payloadHash: false,
    ledger: false,
    keyId: false,
    trustedKeyId: false,
    signature: false,
  };

  try {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return { valid: false, checks, error: "INVALID_PASSPORT_STRUCTURE" };
    }
    const passport = value as Partial<RecoveryPassport>;
    const payload = passport.payload;
    const payloadHash = passport.payloadHash;
    const signature = passport.signature;
    const publicKeyPem = passport.publicKeyPem;
    const keyId = passport.keyId;
    if (
      passport.format !== "recover-passport/v1" ||
      passport.algorithm !== "Ed25519" ||
      payload === null ||
      typeof payload !== "object" ||
      Array.isArray(payload) ||
      !Array.isArray(payload.ledger) ||
      typeof payloadHash !== "string" ||
      typeof signature !== "string" ||
      typeof publicKeyPem !== "string" ||
      typeof keyId !== "string"
    ) {
      return { valid: false, checks, error: "INVALID_PASSPORT_STRUCTURE" };
    }
    checks.structure = true;

    checks.payloadHash = payloadHash === sha256(payload);
    checks.ledger = verifyLedger(payload.ledger);
    checks.keyId = keyId === sha256(publicKeyPem);
    checks.trustedKeyId = trustedKeyId === undefined || trustedKeyId === keyId;
    try {
      checks.signature = verifyEd25519(
        null,
        Buffer.from(payloadHash, "utf8"),
        publicKeyPem,
        Buffer.from(signature, "base64url"),
      );
    } catch {
      checks.signature = false;
    }
  } catch {
    return { valid: false, checks, error: "INVALID_PASSPORT" };
  }

  const valid = Object.values(checks).every(Boolean);
  let error: PassportVerificationError | undefined;
  if (!checks.payloadHash) {
    error = "PAYLOAD_HASH_MISMATCH";
  } else if (!checks.ledger) {
    error = "INVALID_LEDGER";
  } else if (!checks.keyId) {
    error = "KEY_ID_MISMATCH";
  } else if (!checks.trustedKeyId) {
    error = "UNTRUSTED_KEY_ID";
  } else if (!checks.signature) {
    error = "INVALID_SIGNATURE";
  }
  return { valid, checks, ...(error ? { error } : {}) };
}
