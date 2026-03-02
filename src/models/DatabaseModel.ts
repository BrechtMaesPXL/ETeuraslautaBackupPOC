import {Platform} from 'react-native';
import {
  IDatabaseItem,
  IDatabaseItemInput,
  IBackupData,
} from '../interfaces/IDatabaseInterfaces';
import {DatabaseService} from '../controllers/services/DatabaseService';

export class DatabaseModel {
  private static instance: DatabaseModel;
  private databaseService = DatabaseService.getInstance();
  private items: IDatabaseItem[] = [];
  private isLoaded: boolean = false;

  public static getInstance(): DatabaseModel {
    if (!DatabaseModel.instance) {
      DatabaseModel.instance = new DatabaseModel();
    }
    return DatabaseModel.instance;
  }

  public async loadItems(): Promise<IDatabaseItem[]> {
    this.items = await this.databaseService.getAllItems();
    this.isLoaded = true;
    return [...this.items];
  }

  public getItems(): IDatabaseItem[] {
    return [...this.items];
  }

  public isDataLoaded(): boolean {
    return this.isLoaded;
  }

  public async addItem(input: IDatabaseItemInput): Promise<IDatabaseItem> {
    const newItem = await this.databaseService.createItem(input);
    this.items.unshift(newItem);
    return newItem;
  }

  public async updateItem(
    id: number,
    input: IDatabaseItemInput,
  ): Promise<IDatabaseItem> {
    const updated = await this.databaseService.updateItem(id, input);
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items[index] = updated;
    }
    return updated;
  }

  public async deleteItem(id: number): Promise<boolean> {
    const result = await this.databaseService.deleteItem(id);
    if (result) {
      this.items = this.items.filter(item => item.id !== id);
    }
    return result;
  }

  public async getBackupData(): Promise<IBackupData> {
    const items = await this.databaseService.getAllItems();
    const dbVersion = await this.databaseService.getDatabaseVersion();
    return {
      metadata: {
        formatVersion: '1.0.0',
        appVersion: '0.0.1',
        databaseVersion: dbVersion,
        timestamp: new Date().toISOString(),
        itemCount: items.length,
        deviceInfo: Platform.OS,
      },
      items,
    };
  }

  public async restoreFromBackup(data: IBackupData): Promise<void> {
    await this.databaseService.clearAllItems();
    await this.databaseService.bulkInsertItems(data.items);
    await this.loadItems();
  }

  public getItemCount(): number {
    return this.items.length;
  }

  public getItemById(id: number): IDatabaseItem | undefined {
    return this.items.find(item => item.id === id);
  }
}
