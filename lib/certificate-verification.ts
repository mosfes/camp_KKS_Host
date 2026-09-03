import { createHmac } from "crypto";

const SIGNATURE_VERSION = "v1";

function getSigningSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is required for certificate verification");
  }

  return secret;
}

function signaturePayload(enrollmentId: number): string {
  return `certificate:${SIGNATURE_VERSION}:${enrollmentId}`;
}

export function signCertificateEnrollment(enrollmentId: number): string {
  return createHmac("sha256", getSigningSecret())
    .update(signaturePayload(enrollmentId))
    .digest("base64url");
}

export function verifyCertificateSignature(
  enrollmentId: number,
  signature: string,
): boolean {
  if (!Number.isInteger(enrollmentId) || enrollmentId <= 0 || !signature) {
    return false;
  }

  const expected = signCertificateEnrollment(enrollmentId);

  if (signature.length !== expected.length) return false;

  let difference = 0;

  for (let index = 0; index < expected.length; index += 1) {
    difference |= signature.charCodeAt(index) ^ expected.charCodeAt(index);
  }

  return difference === 0;
}

export function buildCertificateVerificationUrl(
  origin: string,
  enrollmentId: number,
): string {
  const url = new URL(`/certificate/verify/${enrollmentId}`, origin);

  url.searchParams.set("signature", signCertificateEnrollment(enrollmentId));

  return url.toString();
}
