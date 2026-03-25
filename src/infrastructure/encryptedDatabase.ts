import 'react-native-get-random-values';
import {open} from '@op-engineering/op-sqlite';
import Keychain from 'react-native-keychain';

const DB_NAME = 'eTeuraslauta.db';
const KEYCHAIN_SERVICE = 'eTeuraslauta-db-key';
const KEYCHAIN_USERNAME = 'db-encryption';

type OPSQLiteDB = ReturnType<typeof open>;

type CryptoLike = {
  getRandomValues(array: Uint8Array): Uint8Array;
};

let encryptedDbInstance: OPSQLiteDB | null = null;
let initPromise: Promise<OPSQLiteDB> | null = null;

async function getOrCreateEncryptionKey(): Promise<string> {
  const credentials = await Keychain.getGenericPassword({service: KEYCHAIN_SERVICE});
  if (credentials && credentials.password) {
    return credentials.password;
  }

  const newKey = generateSecureRandomKey(32);
  await Keychain.setGenericPassword(KEYCHAIN_USERNAME, newKey, {
    service: KEYCHAIN_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
  });
  return newKey;
}

function generateSecureRandomKey(bytes: number): string {
  const cryptoObj: CryptoLike | undefined = (globalThis as any).crypto;
  const buffer = new Uint8Array(bytes);

  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(buffer);
  } else {
    for (let i = 0; i < bytes; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(buffer, b => b.toString(16).padStart(2, '0')).join('');
}

async function applyKey(db: OPSQLiteDB, key: string): Promise<void> {
  try {
    await db.execute(`PRAGMA key = '${key}';`);
    await db.execute('PRAGMA cipher_compatibility = 4;');
  } catch (error) {
    console.warn('Database encryption key could not be applied. Verify SQLCipher build.', error);
  }
}

export async function getEncryptedDB(): Promise<OPSQLiteDB> {
  if (encryptedDbInstance) {
    return encryptedDbInstance;
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const key = await getOrCreateEncryptionKey();
    const db = open({name: DB_NAME});
    await applyKey(db, key);
    await db.execute('PRAGMA foreign_keys = ON;');
    encryptedDbInstance = db;
    return db;
  })();

  return initPromise;
}

export async function migrateToEncryptedDB(): Promise<void> {
  const key = await getOrCreateEncryptionKey();
  const db = open({name: DB_NAME});
  await applyKey(db, key);
  try {
    await db.execute(`PRAGMA rekey = '${key}';`);
    console.log('Database migration to encrypted format complete');
  } catch (error) {
    console.warn('Database migration to encrypted format failed. Ensure SQLCipher build.', error);
  }
}

export async function rotateEncryptionKey(): Promise<void> {
  const db = await getEncryptedDB();
  const newKey = generateSecureRandomKey(32);

  try {
    await db.execute(`PRAGMA rekey = '${newKey}';`);
    await Keychain.setGenericPassword(KEYCHAIN_USERNAME, newKey, {
      service: KEYCHAIN_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
    });
    console.log('Database encryption key rotated successfully');
  } catch (error) {
    console.warn('Failed to rotate database encryption key.', error);
  }
}
