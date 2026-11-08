/**
 * Cryptography utility providing AES-256-GCM and Classic Radio Ciphers (Vigenère & Caesar)
 * Designed for securing messages before Morse transmission or decrypting received Morse.
 */

export type CipherType = 'none' | 'aes-256' | 'vigenere' | 'caesar';

/**
 * Derives a 256-bit AES-GCM key from a passphrase and salt using PBKDF2
 */
async function deriveAesKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts plain text using standard AES-256-GCM.
 * Output is formatted as a compact Base64 payload: [salt:16][iv:12][ciphertext].
 */
export async function encryptAes256(plainText: string, passphrase: string): Promise<string> {
  if (!passphrase) throw new Error('Clé ou mot de passe requis');
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveAesKey(passphrase, salt);
  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plainText)
  );

  const cipherArray = new Uint8Array(cipherBuffer);
  // Combine: salt (16) + iv (12) + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + cipherArray.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(cipherArray, salt.length + iv.length);

  // Convert to Base64 safe for transmission
  let binary = '';
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

/**
 * Decrypts a Base64 AES-256-GCM payload using the passphrase.
 */
export async function decryptAes256(cipherBase64: string, passphrase: string): Promise<string> {
  if (!passphrase) throw new Error('Clé ou mot de passe requis');
  try {
    const binary = atob(cipherBase64.trim());
    const combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      combined[i] = binary.charCodeAt(i);
    }

    if (combined.length < 28) {
      throw new Error('Format de message chiffré invalide');
    }

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const ciphertext = combined.slice(28);

    const key = await deriveAesKey(passphrase, salt);
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch {
    throw new Error('Échec du déchiffrement AES-256 (clé incorrecte ou données altérées)');
  }
}

/**
 * Caesar Cipher encryption/decryption (shift 1-25)
 * Retains letters and spaces cleanly.
 */
export function caesarCipher(text: string, shift: number, decrypt = false): string {
  const effectiveShift = (decrypt ? -shift : shift) % 26;
  return text
    .toUpperCase()
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        let shifted = (code - 65 + effectiveShift) % 26;
        if (shifted < 0) shifted += 26;
        return String.fromCharCode(65 + shifted);
      }
      return char;
    })
    .join('');
}

/**
 * Vigenère Cipher (traditional field cipher for radio operators)
 */
export function vigenereCipher(text: string, keyword: string, decrypt = false): string {
  const cleanKey = keyword.toUpperCase().replace(/[^A-Z]/g, '');
  if (!cleanKey) throw new Error('Clé alphabétique requise (ex: ECHO)');

  let keyIndex = 0;
  return text
    .toUpperCase()
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        const keyShift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65;
        const shift = decrypt ? -keyShift : keyShift;
        let shifted = (code - 65 + shift) % 26;
        if (shifted < 0) shifted += 26;
        keyIndex++;
        return String.fromCharCode(65 + shifted);
      }
      return char;
    })
    .join('');
}

/**
 * Unified encryption wrapper
 */
export async function encryptPayload(
  text: string,
  type: CipherType,
  key: string
): Promise<string> {
  if (type === 'none' || !text.trim()) return text;
  if (type === 'aes-256') {
    return await encryptAes256(text, key);
  }
  if (type === 'vigenere') {
    return vigenereCipher(text, key, false);
  }
  if (type === 'caesar') {
    const shift = parseInt(key, 10) || 3;
    return caesarCipher(text, shift, false);
  }
  return text;
}

/**
 * Unified decryption wrapper
 */
export async function decryptPayload(
  cipherText: string,
  type: CipherType,
  key: string
): Promise<string> {
  if (type === 'none' || !cipherText.trim()) return cipherText;
  if (type === 'aes-256') {
    return await decryptAes256(cipherText, key);
  }
  if (type === 'vigenere') {
    return vigenereCipher(cipherText, key, true);
  }
  if (type === 'caesar') {
    const shift = parseInt(key, 10) || 3;
    return caesarCipher(cipherText, shift, true);
  }
  return cipherText;
}
