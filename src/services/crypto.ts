/**
 * Real WebCrypto implementation adhering to Android Keystore AES-256-GCM specifications.
 * - Hardware key simulation / PBKDF2 with 100,000 iterations
 * - AES-256-GCM with 96-bit unique IV per file
 * - SHA-256 hash calculation for content-level deduplication
 * - Secure zero-out memory scrubbing
 */

const SALT = new TextEncoder().encode('SECURE_CALL_VAULT_KEYSTORE_MASTER_SALT_V1');
const KEY_NAME = 'scv_keystore_aes_master';

let cachedMasterKey: CryptoKey | null = null;

// Initialize or derive Master AES-256 key
export async function getMasterKey(pin: string = '1234'): Promise<CryptoKey> {
  if (cachedMasterKey) return cachedMasterKey;

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  cachedMasterKey = derivedKey;
  return derivedKey;
}

export function resetMasterKeyCache(): void {
  cachedMasterKey = null;
}

// Generate random 12-byte IV (96-bit NIST standard for GCM)
export function generateRandomIV(): Uint8Array {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  return iv;
}

// Hex helpers
export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

// Compute SHA-256 hash for deduplication
export async function calculateSHA256(data: ArrayBuffer | Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as any);
  return bufferToHex(hashBuffer);
}

// Encrypt audio buffer with AES-256-GCM
export async function encryptAudioData(
  plainBuffer: ArrayBuffer,
  pin: string = '1234'
): Promise<{ encryptedBytes: ArrayBuffer; ivHex: string; contentHash: string }> {
  const key = await getMasterKey(pin);
  const iv = generateRandomIV();
  const contentHash = await calculateSHA256(plainBuffer);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as any,
    },
    key,
    plainBuffer
  );

  return {
    encryptedBytes: encryptedBuffer,
    ivHex: bufferToHex(iv),
    contentHash,
  };
}

// Decrypt audio buffer with AES-256-GCM
export async function decryptAudioData(
  encryptedBuffer: ArrayBuffer,
  ivHex: string,
  pin: string = '1234'
): Promise<ArrayBuffer> {
  const key = await getMasterKey(pin);
  const iv = hexToBuffer(ivHex);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as any,
    },
    key,
    encryptedBuffer
  );

  return decryptedBuffer;
}

// Secure memory wiper
export function secureZeroOut(buffer: Uint8Array): void {
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = 0;
  }
}

// Generate Recovery Key (formatted like RFC-1751 / BIP-39 style 16 alphanumeric characters)
export function generateRecoveryKey(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  for (let i = 0; i < 16; i++) {
    result += chars[randomBytes[i] % chars.length];
    if (i % 4 === 3 && i !== 15) {
      result += '-';
    }
  }
  return result;
}
