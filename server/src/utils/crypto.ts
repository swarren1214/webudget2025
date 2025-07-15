// server/src/utils/crypto.ts

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import config from '../config/env';

const { ENCRYPTION_KEY } = process.env;

// Validate the encryption key on startup. This is a critical security check.
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error('FATAL_ERROR: ENCRYPTION_KEY must be a 64-character hex string.');
}

const ALGORITHM = 'aes-256-gcm';
// The key must be a buffer for the crypto functions.
const key = Buffer.from(config.ENCRYPTION_KEY, 'hex');

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @param text The plaintext to encrypt.
 * @returns A single string containing the IV, auth tag, and ciphertext, separated by colons.
 */
export const encrypt = (text: string): string => {
    // The IV should be random for each encryption. 16 bytes is standard for GCM.
    const iv = randomBytes(16);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // We combine the IV, auth tag, and ciphertext into a single string for storage.
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
};

/**
 * Decrypts a string that was encrypted with the encrypt function.
 * @param hash The encrypted hash string (iv:authTag:ciphertext).
 * @returns The original plaintext string.
 */
export const decrypt = (hash: string): string => {
    const [ivHex, authTagHex, encryptedHex] = hash.split(':');

    if (!ivHex || !authTagHex || !encryptedHex) {
        throw new Error('Invalid encrypted text format.');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return decrypted.toString('utf8');
};
