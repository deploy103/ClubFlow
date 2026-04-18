import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const createId = (prefix: string): string =>
  `${prefix}_${randomBytes(6).toString("hex")}`;

export const createSessionToken = (): string => randomBytes(32).toString("hex");

export const hashPassword = (plainTextPassword: string): string => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plainTextPassword, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

export const verifyPassword = (
  plainTextPassword: string,
  storedHash: string,
): boolean => {
  const [salt, expectedHash] = storedHash.split(":");
  if (!salt || !expectedHash) {
    return false;
  }

  const derivedHash = scryptSync(plainTextPassword, salt, 64);
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (derivedHash.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedHash, expectedBuffer);
};

