/**
 * HISAAB Cryptographic Vault Engine
 * 
 * Standards-compliant, zero-dependency authenticated encryption using Web Crypto API:
 * - Cipher: AES-256-GCM (Authenticated Encryption with Associated Data)
 * - Key Derivation: PBKDF2-HMAC-SHA256 with 100,000 iterations
 * - Salt: 16-byte cryptographically secure random bytes
 * - IV: 12-byte (96-bit) cryptographically secure random nonce
 * 
 * Complies with Stage 2 requirements for password-based encrypted backup vaults.
 */

export interface EncryptedVaultEnvelope {
  format: 'HISAAB_ENCRYPTED_VAULT_V1';
  version: 1;
  algorithm: 'AES-GCM-256';
  kdf: 'PBKDF2-SHA256';
  iterations: 100000;
  salt: string; // Base64
  iv: string; // Base64
  ciphertext: string; // Base64 (includes 16-byte authentication tag)
  createdAt: string;
  metadata?: {
    shopNameHint?: string;
    customerCountHint?: number;
    transactionCountHint?: number;
  };
}

export interface VaultPayloadData {
  shop: {
    id: string;
    name: string;
    upiId?: string;
    createdAt?: string;
  };
  customers: any[];
  transactions: any[];
  screenshots: Record<string, string>; // screenshotId -> DataURL
  exportedAt: string;
}

// Cross-environment crypto access (browser or Node.js)
function getSubtleCrypto(): SubtleCrypto {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error('Web Crypto API (subtle) not available in this environment');
}

function getRandomValues(array: Uint8Array): Uint8Array {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto.getRandomValues(array);
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto.getRandomValues(array);
  }
  throw new Error('Web Crypto API (getRandomValues) not available');
}

// Robust Base64 binary conversions
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return (typeof window !== 'undefined' ? window.btoa : globalThis.btoa)(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = (typeof window !== 'undefined' ? window.atob : globalThis.atob)(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives a 256-bit AES-GCM key from a user password using PBKDF2-HMAC-SHA256
 */
async function deriveEncryptionKey(
  password: string,
  salt: Uint8Array,
  iterations: number = 100000
): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);

  const baseKey = await subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a ledger payload into a portable .hisaab envelope
 */
export async function encryptVaultData(
  data: VaultPayloadData,
  password: string
): Promise<EncryptedVaultEnvelope> {
  if (!password || password.length < 4) {
    throw new Error('Password must be at least 4 characters long');
  }

  const subtle = getSubtleCrypto();
  const encoder = new TextEncoder();
  const jsonStr = JSON.stringify(data);
  const plaintextBytes = encoder.encode(jsonStr);

  // 16 bytes cryptographically secure salt
  const salt = getRandomValues(new Uint8Array(16));
  // 12 bytes NIST recommended IV for AES-GCM
  const iv = getRandomValues(new Uint8Array(12));

  const key = await deriveEncryptionKey(password, salt, 100000);

  const ciphertextBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as any,
    },
    key,
    plaintextBytes
  );

  const ciphertextBytes = new Uint8Array(ciphertextBuffer);

  return {
    format: 'HISAAB_ENCRYPTED_VAULT_V1',
    version: 1,
    algorithm: 'AES-GCM-256',
    kdf: 'PBKDF2-SHA256',
    iterations: 100000,
    salt: uint8ArrayToBase64(salt),
    iv: uint8ArrayToBase64(iv),
    ciphertext: uint8ArrayToBase64(ciphertextBytes),
    createdAt: new Date().toISOString(),
    metadata: {
      shopNameHint: data.shop?.name || undefined,
      customerCountHint: data.customers?.length || 0,
      transactionCountHint: data.transactions?.length || 0,
    },
  };
}

/**
 * Decrypts a .hisaab envelope using the provided password
 * Throws clean error if password is incorrect or file is corrupted/tampered
 */
export async function decryptVaultData(
  envelope: EncryptedVaultEnvelope,
  password: string
): Promise<VaultPayloadData> {
  if (!envelope || envelope.format !== 'HISAAB_ENCRYPTED_VAULT_V1') {
    throw new Error('Invalid or unsupported backup file format. Expected HISAAB_ENCRYPTED_VAULT_V1.');
  }

  if (!envelope.salt || !envelope.iv || !envelope.ciphertext) {
    throw new Error('Corrupted backup file: missing cryptographic parameters.');
  }

  const subtle = getSubtleCrypto();
  const salt = base64ToUint8Array(envelope.salt);
  const iv = base64ToUint8Array(envelope.iv);
  const ciphertext = base64ToUint8Array(envelope.ciphertext);
  const iterations = envelope.iterations || 100000;

  const key = await deriveEncryptionKey(password, salt, iterations);

  let decryptedBuffer: ArrayBuffer;
  try {
    decryptedBuffer = await subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as any,
      },
      key,
      ciphertext as any
    );
  } catch {
    // OperationError occurs on authentication tag mismatch or wrong key
    throw new Error('Incorrect password or corrupted backup file');
  }

  const decoder = new TextDecoder();
  const jsonStr = decoder.decode(decryptedBuffer);

  let payload: VaultPayloadData;
  try {
    payload = JSON.parse(jsonStr);
  } catch {
    throw new Error('Decryption succeeded but backup payload is not valid JSON');
  }

  if (!payload || !payload.shop || !Array.isArray(payload.customers) || !Array.isArray(payload.transactions)) {
    throw new Error('Invalid backup contents: missing required shop, customer, or transaction records');
  }

  return payload;
}
