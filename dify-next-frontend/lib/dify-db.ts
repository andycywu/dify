import { Client } from 'pg';

const globalForDifyDB = globalThis as unknown as {
  difyDB: Client | undefined;
  difyDBConnected: boolean | undefined;
};

export const difyDB = globalForDifyDB.difyDB ?? new Client({
  connectionString: process.env.DIFY_DATABASE_URL || 'postgresql://postgres:difyai123456@db:5432/dify',
});

// 初始化全局狀態
if (!globalForDifyDB.difyDB) {
  globalForDifyDB.difyDB = difyDB;
  globalForDifyDB.difyDBConnected = false;
}

// 確保連接
export async function ensureDifyDBConnection() {
  try {
    if (!globalForDifyDB.difyDBConnected) {
      await difyDB.connect();
      globalForDifyDB.difyDBConnected = true;
      console.log('✅ Connected to Dify database');
    }
  } catch (error) {
    console.error('Failed to connect to Dify database:', error);
    globalForDifyDB.difyDBConnected = false;
    throw error;
  }
}