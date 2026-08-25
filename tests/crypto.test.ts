import { encrypt, decrypt } from '../src/utils/crypto';

describe('Crypto Utility (AES-256-GCM)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, ENCRYPTION_KEY: 'test-key-32-chars-long-123456789' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should encrypt and decrypt correctly (round trip)', () => {
    const plaintext = 'sensitive_access_token_data';
    const encrypted = encrypt(plaintext);
    
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted.split(':').length).toBe(3); // iv, authTag, encrypted
    
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should produce different ciphertext for the same plaintext due to random IV', () => {
    const plaintext = 'same_data';
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);
    
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('should fail decryption if ciphertext is tampered (invalid auth tag)', () => {
    const plaintext = 'secret_data';
    const encrypted = encrypt(plaintext);
    
    const parts = encrypted.split(':');
    // Tamper with the encrypted text part
    const tamperedEncryptedText = '00' + parts[2].substring(2);
    const tamperedCiphertext = `${parts[0]}:${parts[1]}:${tamperedEncryptedText}`;
    
    expect(() => decrypt(tamperedCiphertext)).toThrow();
  });

  it('should fail decryption with incorrect key', () => {
    const plaintext = 'secret_data';
    const encrypted = encrypt(plaintext);
    
    // Change key in environment
    process.env.ENCRYPTION_KEY = 'wrong-key-32-chars-long-12345678';
    
    expect(() => decrypt(encrypted)).toThrow();
  });
});
