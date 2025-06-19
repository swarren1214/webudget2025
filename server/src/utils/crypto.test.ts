// server/src/utils/crypto.test.ts

import { encrypt, decrypt } from './crypto';

describe('Crypto Utility', () => {
    it('should correctly encrypt and then decrypt a string', () => {
        // --- ARRANGE ---
        const originalText = 'This is a secret Plaid access token!';

        // --- ACT ---
        // 1. Encrypt the text.
        const encryptedText = encrypt(originalText);

        // 2. Decrypt the result.
        const decryptedText = decrypt(encryptedText);

        // --- ASSERT ---
        // 1. Ensure the encrypted text is not the same as the original.
        expect(encryptedText).not.toEqual(originalText);

        // 2. Ensure the decrypted text matches the original perfectly.
        expect(decryptedText).toEqual(originalText);
    });

    it('should throw an error when decrypting a malformed hash', () => {
        // --- ARRANGE ---
        const malformedHash = 'this:is:not:a:valid:hash';

        // --- ACT & ASSERT ---
        // We expect the decrypt function to throw an error when the format is wrong.
        expect(() => {
            decrypt(malformedHash);
        }).toThrow('Invalid encrypted text format.');
    });
});
