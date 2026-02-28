const PREFIX = "md2docx_";
const VERSION = 0x01;
const FLAG_KEY_IN_URL = 0x00;
const FLAG_PASSWORD = 0x01;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100_000;
const KEY_BASE64_LENGTH = 43;
const CHUNK_SIZE = 0x8000;

function toBase64Url(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str) {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function generateRandomKey() {
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", key));
  return { cryptoKey: key, raw };
}

async function importRawKey(raw) {
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["decrypt"]);
}

async function deriveKey(password, salt, usages) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    usages
  );
}

function buildPayloadJson(files, options = {}) {
  return JSON.stringify({
    v: 1,
    created: Date.now(),
    ttl: options.ttl || 0,
    files: files.map((f) => ({ name: f.name, content: f.content, isMain: !!f.isMain })),
    activeFile: files.find((f) => f.isMain)?.name || files[0]?.name,
  });
}

export async function encodeSharePayload(files, options = {}) {
  const json = buildPayloadJson(files, options);
  const compressed = pako.deflate(json);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  let blob, keyB64;

  if (options.password) {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const aesKey = await deriveKey(options.password, salt, ["encrypt"]);
    const ciphertext = new Uint8Array(
      await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, compressed)
    );

    blob = new Uint8Array(2 + IV_LENGTH + SALT_LENGTH + ciphertext.byteLength);
    blob[0] = FLAG_PASSWORD;
    blob[1] = VERSION;
    blob.set(iv, 2);
    blob.set(salt, 2 + IV_LENGTH);
    blob.set(ciphertext, 2 + IV_LENGTH + SALT_LENGTH);
    keyB64 = null;
  } else {
    const { cryptoKey, raw } = await generateRandomKey();
    const ciphertext = new Uint8Array(
      await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, compressed)
    );

    blob = new Uint8Array(2 + IV_LENGTH + ciphertext.byteLength);
    blob[0] = FLAG_KEY_IN_URL;
    blob[1] = VERSION;
    blob.set(iv, 2);
    blob.set(ciphertext, 2 + IV_LENGTH);
    keyB64 = toBase64Url(raw);
  }

  const blobB64 = toBase64Url(blob);
  const fragment = keyB64 ? `${PREFIX}${blobB64}.${keyB64}` : `${PREFIX}${blobB64}`;

  return { fragment, urlLength: fragment.length + 1 };
}

export async function decodeShareFragment(fragment, passwordCallback) {
  let payload = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  if (!payload.startsWith(PREFIX)) {
    throw new Error("Invalid share link format");
  }
  payload = payload.slice(PREFIX.length);

  const dotIndex = payload.lastIndexOf(".");
  const hasKeyInUrl = dotIndex > 0 && payload.length - dotIndex - 1 === KEY_BASE64_LENGTH;

  let blobBytes, rawKey;

  if (hasKeyInUrl) {
    blobBytes = fromBase64Url(payload.slice(0, dotIndex));
    rawKey = fromBase64Url(payload.slice(dotIndex + 1));
  } else {
    blobBytes = fromBase64Url(payload);
    rawKey = null;
  }

  const flags = blobBytes[0];
  const iv = blobBytes.slice(2, 2 + IV_LENGTH);
  let aesKey, ciphertext;

  if (flags === FLAG_KEY_IN_URL && rawKey) {
    ciphertext = blobBytes.slice(2 + IV_LENGTH);
    aesKey = await importRawKey(rawKey);
  } else if (flags === FLAG_PASSWORD) {
    if (!passwordCallback) throw new Error("Password required");
    const salt = blobBytes.slice(2 + IV_LENGTH, 2 + IV_LENGTH + SALT_LENGTH);
    ciphertext = blobBytes.slice(2 + IV_LENGTH + SALT_LENGTH);
    const password = await passwordCallback();
    aesKey = await deriveKey(password, salt, ["decrypt"]);
  } else {
    throw new Error("Invalid share link: unknown encryption mode");
  }

  let decrypted;
  try {
    decrypted = new Uint8Array(
      await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ciphertext)
    );
  } catch {
    throw new Error("Decryption failed — wrong password or corrupted link");
  }

  const json = pako.inflate(decrypted, { to: "string" });
  const data = JSON.parse(json);

  if (data.ttl > 0 && Date.now() > data.created + data.ttl) {
    const expiredAt = new Date(data.created + data.ttl).toLocaleDateString();
    throw new Error(`This link expired on ${expiredAt}`);
  }

  return {
    files: data.files,
    created: data.created,
    ttl: data.ttl,
    activeFile: data.activeFile,
  };
}

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function estimateShareSize(files) {
  const json = buildPayloadJson(files);

  const compressed = pako.deflate(json);
  const headerOverhead = 2 + IV_LENGTH + SALT_LENGTH;
  const base64Expansion = Math.ceil(((compressed.length + headerOverhead) * 4) / 3);
  const prefixAndKey = PREFIX.length + 1 + KEY_BASE64_LENGTH;

  return {
    originalSize: new TextEncoder().encode(json).length,
    compressedSize: compressed.length,
    estimatedUrlLength: base64Expansion + prefixAndKey + 1,
  };
}

export function isShareFragment(hash) {
  if (!hash) return false;
  const h = hash.startsWith("#") ? hash.slice(1) : hash;
  return h.startsWith(PREFIX);
}
