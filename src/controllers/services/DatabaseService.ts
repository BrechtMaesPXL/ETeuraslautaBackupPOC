import {open} from '@op-engineering/op-sqlite';
import type {Transaction} from '@op-engineering/op-sqlite';
import {IDatabaseItem, IDatabaseItemInput} from '../../interfaces/IDatabaseInterfaces';

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

  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}
