import crypto from 'crypto';

export const generateCodeVerifier = (): string => {
  const randomBytes = crypto.randomBytes(32);
  return randomBytes.toString('base64url');
};

export const generateCodeChallenge = (verifier: string): string => {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return hash.toString('base64url');
};
