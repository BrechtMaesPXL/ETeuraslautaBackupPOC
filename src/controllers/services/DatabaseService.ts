import {open} from '@op-engineering/op-sqlite';
import type {Transaction} from '@op-engineering/op-sqlite';
import {IDatabaseItem, IDatabaseItemInput, ISyncLogEntry} from '../../interfaces/IDatabaseInterfaces';

type OPSQLiteDB = ReturnType<typeof open>;

const DATABASE_NAME = 'eTeuraslauta.db';

export class DatabaseService {
  private static instance: DatabaseService;
  private db: OPSQLiteDB | null = null;
  private isInitialized: boolean = false;

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized && this.db) {
      return;
    }

    this.db = open({name: DATABASE_NAME});
    await this.createTables();
    this.isInitialized = true;
  }

  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not opened');
    }

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS items (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    NOT NULL,
        description TEXT    DEFAULT '',
        created_at  TEXT    NOT NULL,
        updated_at  TEXT    NOT NULL
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS schema_version (
        id      INTEGER PRIMARY KEY CHECK (id = 1),
        version INTEGER NOT NULL DEFAULT 1
      );
    `);

    await this.db.execute(
      'INSERT OR IGNORE INTO schema_version (id, version) VALUES (1, 1);',
    );

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS sync_state (
        id              INTEGER PRIMARY KEY CHECK (id = 1),
        api_enabled     INTEGER NOT NULL DEFAULT 0,
        last_synced_at  TEXT
      );
    `);

    await this.db.execute(
      'INSERT OR IGNORE INTO sync_state (id, api_enabled, last_synced_at) VALUES (1, 0, NULL);',
    );

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS sync_log (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp     TEXT    NOT NULL,
        success       INTEGER NOT NULL,
        item_count    INTEGER NOT NULL DEFAULT 0,
        error_message TEXT
      );
    `);
  }

  private async ensureInitialized(): Promise<OPSQLiteDB> {
    if (!this.isInitialized || !this.db) {
      await this.initialize();
    }
    return this.db!;
  }

  public async getAllItems(): Promise<IDatabaseItem[]> {
    const db = await this.ensureInitialized();
    const result = await db.execute(
      'SELECT id, name, description, created_at, updated_at FROM items ORDER BY updated_at DESC;',
    );

    return (result.rows ?? []).map(row => ({
      id: row.id as number,
      name: row.name as string,
      description: row.description as string,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }));
  }

  public async getItemById(id: number): Promise<IDatabaseItem | null> {
    const db = await this.ensureInitialized();
    const result = await db.execute(
      'SELECT id, name, description, created_at, updated_at FROM items WHERE id = ?;',
      [id],
    );

    const rows = result.rows ?? [];
    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id as number,
      name: row.name as string,
      description: row.description as string,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  public async createItem(input: IDatabaseItemInput): Promise<IDatabaseItem> {
    const db = await this.ensureInitialized();
    const now = new Date().toISOString();

    const result = await db.execute(
      'INSERT INTO items (name, description, created_at, updated_at) VALUES (?, ?, ?, ?);',
      [input.name, input.description, now, now],
    );

    const insertId = result.insertId;
    if (!insertId) {
      throw new Error('Failed to get insert ID');
    }

    const newItem = await this.getItemById(insertId);
    if (!newItem) {
      throw new Error('Failed to retrieve created item');
    }
    return newItem;
  }

  public async updateItem(
    id: number,
    input: IDatabaseItemInput,
  ): Promise<IDatabaseItem> {
    const db = await this.ensureInitialized();
    const now = new Date().toISOString();

    await db.execute(
      'UPDATE items SET name = ?, description = ?, updated_at = ? WHERE id = ?;',
      [input.name, input.description, now, id],
    );

    const updatedItem = await this.getItemById(id);
    if (!updatedItem) {
      throw new Error('Failed to retrieve updated item');
    }
    return updatedItem;
  }

  public async deleteItem(id: number): Promise<boolean> {
    const db = await this.ensureInitialized();
    const result = await db.execute('DELETE FROM items WHERE id = ?;', [id]);
    return (result.rowsAffected ?? 0) > 0;
  }

  public async getItemCount(): Promise<number> {
    const db = await this.ensureInitialized();
    const result = await db.execute('SELECT COUNT(*) as count FROM items;');
    const rows = result.rows ?? [];
    return rows.length > 0 ? (rows[0].count as number) : 0;
  }

  public async getDatabaseVersion(): Promise<number> {
    const db = await this.ensureInitialized();
    const result = await db.execute(
      'SELECT version FROM schema_version WHERE id = 1;',
    );
    const rows = result.rows ?? [];
    if (rows.length === 0) {
      return 1;
    }
    return rows[0].version as number;
  }

  public async clearAllItems(): Promise<void> {
    const db = await this.ensureInitialized();
    await db.execute('DELETE FROM items;');
  }

  public async bulkInsertItems(items: IDatabaseItem[]): Promise<void> {
    const db = await this.ensureInitialized();

    await db.transaction(async (tx: Transaction) => {
      for (const item of items) {
        await tx.execute(
          'INSERT INTO items (name, description, created_at, updated_at) VALUES (?, ?, ?, ?);',
          [item.name, item.description, item.createdAt, item.updatedAt],
        );
      }
    });
  }

  public async getSyncState(): Promise<{apiEnabled: boolean; lastSyncedAt: string | null}> {
    const db = await this.ensureInitialized();
    const result = await db.execute(
      'SELECT api_enabled, last_synced_at FROM sync_state WHERE id = 1;',
    );
    const rows = result.rows ?? [];
    if (rows.length === 0) {
      return {apiEnabled: false, lastSyncedAt: null};
    }
    return {
      apiEnabled: (rows[0].api_enabled as number) === 1,
      lastSyncedAt: (rows[0].last_synced_at as string) ?? null,
    };
  }

  public async setSyncState(apiEnabled: boolean, lastSyncedAt: string | null): Promise<void> {
    const db = await this.ensureInitialized();
    await db.execute(
      'UPDATE sync_state SET api_enabled = ?, last_synced_at = ? WHERE id = 1;',
      [apiEnabled ? 1 : 0, lastSyncedAt],
    );
  }

  public async addSyncLog(
    success: boolean,
    itemCount: number,
    errorMessage: string | null,
  ): Promise<void> {
    const db = await this.ensureInitialized();
    const now = new Date().toISOString();
    await db.execute(
      'INSERT INTO sync_log (timestamp, success, item_count, error_message) VALUES (?, ?, ?, ?);',
      [now, success ? 1 : 0, itemCount, errorMessage],
    );
  }

  public async getSyncLog(limit: number = 20): Promise<ISyncLogEntry[]> {
    const db = await this.ensureInitialized();
    const result = await db.execute(
      'SELECT id, timestamp, success, item_count, error_message FROM sync_log ORDER BY id DESC LIMIT ?;',
      [limit],
    );
    return (result.rows ?? []).map(row => ({
      id: row.id as number,
      timestamp: row.timestamp as string,
      success: (row.success as number) === 1,
      itemCount: row.item_count as number,
      errorMessage: (row.error_message as string) ?? null,
    }));
  }

  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}
