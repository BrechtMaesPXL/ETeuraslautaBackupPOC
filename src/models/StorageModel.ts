import { IStorageInfo, IStorageData, IFileItem, IAppItem, ISystemItem } from '../interfaces/IStorageInterfaces';
import { StorageType } from '../types/StorageTypes';

export class StorageModel {
  private static instance: StorageModel;
  private storageData: Map<string, IStorageData> = new Map();

  public static getInstance(): StorageModel {
    if (!StorageModel.instance) {
      StorageModel.instance = new StorageModel();
    }
    return StorageModel.instance;
  }

  public async loadStorageData(): Promise<IStorageInfo[]> {
    // Simulate API call or data loading
    if (this.storageData.size === 0) {
      this.initializeStorageData();
    }

    return Array.from(this.storageData.values()).map(data => data.storageInfo);
  }

  private initializeStorageData(): void {
    const storageItems: IStorageData[] = [
      {
        id: 'sd-storage-001',
        storageInfo: {
          id: 'sd-storage',
          name: 'SD Card Storage',
          type: 'sd',
          totalSpace: 32.0,
          usedSpace: 18.5,
          status: 'available',
          icon: '💾',
          lastAccessed: '2 hours ago',
          permissions: 'read-write',
          isEnabled: true,
          order: 1,
        },
        files: this.getSDFiles(),
        lastUpdated: new Date(),
      },
      {
        id: 'tab-storage-001',
        storageInfo: {
          id: 'tab-storage',
          name: 'Tab Storage',
          type: 'tab',
          totalSpace: 64.0,
          usedSpace: 42.3,
          status: 'available',
          icon: '📱',
          lastAccessed: '30 minutes ago',
          permissions: 'read-write',
          isEnabled: true,
          order: 2,
        },
        apps: this.getTabApps(),
        lastUpdated: new Date(),
      },
      {
        id: 'internal-storage-001',
        storageInfo: {
          id: 'internal-storage',
          name: 'Internal Storage',
          type: 'internal',
          totalSpace: 128.0,
          usedSpace: 89.7,
          status: 'available',
          icon: '💻',
          lastAccessed: '5 minutes ago',
          permissions: 'read-write',
          isEnabled: true,
          order: 3,
        },
        systemItems: this.buildSystemItems(),
        lastUpdated: new Date(),
      },
    ];

    storageItems.forEach(item => {
      this.storageData.set(item.storageInfo.id, item);
    });
  }

  private getSDFiles(): IFileItem[] {
    return [
      {
        id: '1',
        name: 'DCIM',
        type: 'folder',
        modified: '2 hours ago',
        icon: '📁',
      },
      {
        id: '2',
        name: 'Photos',
        type: 'folder',
        modified: '1 day ago',
        icon: '📸',
      },
      {
        id: '3',
        name: 'backup_data.zip',
        type: 'file',
        size: 1024 * 1024 * 150,
        modified: '1 week ago',
        icon: '📦',
      },
    ];
  }

  private getTabApps(): IAppItem[] {
    return [
      {
        id: '1',
        name: 'Camera App',
        type: 'app',
        size: 1024 * 1024 * 250,
        version: '2.1.4',
        lastUsed: '2 hours ago',
        icon: '📷',
      },
      {
        id: '2',
        name: 'Photo Gallery',
        type: 'data',
        size: 1024 * 1024 * 1200,
        lastUsed: '1 hour ago',
        icon: '🖼️',
      },
    ];
  }

  private buildSystemItems(): ISystemItem[] {
    return [
      {
        id: '1',
        name: 'Operating System',
        type: 'system',
        size: 1024 * 1024 * 1024 * 8,
        category: 'Core System',
        critical: true,
        icon: '⚙️',
      },
      {
        id: '2',
        name: 'Temporary Files',
        type: 'temp',
        size: 1024 * 1024 * 850,
        category: 'Cleanup',
        critical: false,
        icon: '🗂️',
      },
    ];
  }

  public async getStorageById(storageId: string): Promise<IStorageData | null> {
    return this.storageData.get(storageId) || null;
  }

  public async updateStorageInfo(storageId: string, updates: Partial<IStorageInfo>): Promise<boolean> {
    const storageData = this.storageData.get(storageId);
    if (!storageData) return false;

    storageData.storageInfo = { ...storageData.storageInfo, ...updates };
    storageData.lastUpdated = new Date();
    return true;
  }

  public getEnabledStorage(): IStorageInfo[] {
    return Array.from(this.storageData.values())
      .map(data => data.storageInfo)
      .filter(storage => storage.isEnabled)
      .sort((a, b) => a.order - b.order);
  }

  private ensureInitialized(): void {
    if (this.storageData.size === 0) {
      this.initializeStorageData();
    }
  }

  public async getStorageInfo(storageType: StorageType): Promise<IStorageInfo | null> {
    this.ensureInitialized();
    const entry = Array.from(this.storageData.values()).find(
      d => d.storageInfo.type === storageType,
    );
    return entry?.storageInfo ?? null;
  }

  public async getFiles(storageType: StorageType, _path?: string): Promise<IFileItem[]> {
    this.ensureInitialized();
    const entry = Array.from(this.storageData.values()).find(
      d => d.storageInfo.type === storageType,
    );
    return entry?.files ?? [];
  }

  public async getApps(storageType: StorageType): Promise<IAppItem[]> {
    this.ensureInitialized();
    const entry = Array.from(this.storageData.values()).find(
      d => d.storageInfo.type === storageType,
    );
    return entry?.apps ?? [];
  }

  public async getSystemItems(storageType: StorageType): Promise<ISystemItem[]> {
    this.ensureInitialized();
    const entry = Array.from(this.storageData.values()).find(
      d => d.storageInfo.type === storageType,
    );
    return entry?.systemItems ?? [];
  }
}