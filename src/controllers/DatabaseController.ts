import {useState, useEffect, useCallback} from 'react';
import {Alert} from 'react-native';
import {DatabaseModel} from '../models/DatabaseModel';
import {BackupService} from './services/BackupService';
import {
  IDatabaseItem,
  IDatabaseItemInput,
  IBackupFile,
  IBackupData,
  BackupDestination,
  ISyncState,
  ISyncLogEntry,
} from '../interfaces/IDatabaseInterfaces';
import {SyncService} from './services/SyncService';

export class DatabaseController {
  private static instance: DatabaseController;
  private databaseModel = DatabaseModel.getInstance();
  private backupService = BackupService.getInstance();
  private syncService = SyncService.getInstance();

  public static getInstance(): DatabaseController {
    if (!DatabaseController.instance) {
      DatabaseController.instance = new DatabaseController();
    }
    return DatabaseController.instance;
  }

  public async loadItems(): Promise<IDatabaseItem[]> {
    return await this.databaseModel.loadItems();
  }

  public async createItem(input: IDatabaseItemInput): Promise<IDatabaseItem> {
    return await this.databaseModel.addItem(input);
  }

  public async updateItem(
    id: number,
    input: IDatabaseItemInput,
  ): Promise<IDatabaseItem> {
    return await this.databaseModel.updateItem(id, input);
  }

  public async deleteItem(id: number): Promise<boolean> {
    return await this.databaseModel.deleteItem(id);
  }

  public async exportBackupToDestinations(
    destinations: BackupDestination[],
  ): Promise<string[]> {
    const data = await this.databaseModel.getBackupData();
    return await this.backupService.exportBackupToDestinations(data, destinations);
  }

  public async getBackupList(): Promise<IBackupFile[]> {
    return await this.backupService.listBackups();
  }

  public async readBackup(filePath: string): Promise<IBackupData> {
    return await this.backupService.readBackupFromPath(filePath);
  }

  public async restoreBackup(filePath: string): Promise<void> {
    const data = await this.backupService.readBackupFromPath(filePath);
    await this.databaseModel.restoreFromBackup(data);
  }

  public async deleteBackup(filePath: string): Promise<boolean> {
    return await this.backupService.deleteBackupFromPath(filePath);
  }

  public async isSDCardAvailable(): Promise<boolean> {
    return await this.backupService.isSDCardAvailable();
  }

  public getBackupDirectory(): string {
    return this.backupService.getBackupDirectory();
  }

  public getInternalBackupDirectory(): string {
    return this.backupService.getInternalBackupDirectory();
  }

  public async loadSyncState(): Promise<ISyncState> {
    return await this.syncService.loadPersistedState();
  }

  public async toggleApiEnabled(enabled: boolean): Promise<void> {
    await this.syncService.setApiEnabled(enabled);
  }

  public async syncNow(): Promise<void> {
    await this.syncService.syncNow();
  }

  public getSyncService(): SyncService {
    return this.syncService;
  }

  public async getSyncLog(limit?: number): Promise<ISyncLogEntry[]> {
    return await this.syncService.getSyncLog(limit);
  }

  public async getRecentItems(limit: number = 5): Promise<IDatabaseItem[]> {
    const items = await this.databaseModel.loadItems();
    return items.slice(0, limit);
  }
}

export const useDatabaseController = () => {
  const [items, setItems] = useState<IDatabaseItem[]>([]);
  const [backups, setBackups] = useState<IBackupFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [editingItem, setEditingItem] = useState<IDatabaseItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBackups, setShowBackups] = useState(false);
  const [sdCardAvailable, setSdCardAvailable] = useState<boolean | null>(null);
  const [sdCardPath, setSdCardPath] = useState<string>('');
  const [previewBackup, setPreviewBackup] = useState<IBackupData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [syncState, setSyncState] = useState<ISyncState>({
    apiEnabled: false,
    lastSyncedAt: null,
    syncStatus: 'idle',
  });
  const controller = DatabaseController.getInstance();

  useEffect(() => {
    loadData();
    checkSDCard();
    loadSyncState();
  }, []);

  const loadSyncState = useCallback(async () => {
    try {
      const state = await controller.loadSyncState();
      setSyncState(state);
      const syncService = controller.getSyncService();
      syncService.startPolling((newState) => {
        setSyncState(newState);
      });
    } catch (error) {
      console.error('Error loading sync state:', error);
    }
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      controller.getSyncService().stopPolling();
    };
  }, []);

  const checkSDCard = useCallback(async () => {
    try {
      const available = await controller.isSDCardAvailable();
      setSdCardAvailable(available);
      setSdCardPath(controller.getBackupDirectory());
    } catch {
      setSdCardAvailable(false);
    }
  }, []);

  // Re-check SD card every 5 seconds so the UI stays current after eject/insert
  useEffect(() => {
    const interval = setInterval(checkSDCard, 5000);
    return () => clearInterval(interval);
  }, [checkSDCard]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedItems = await controller.loadItems();
      setItems(loadedItems);
    } catch (error) {
      console.error('Error loading items:', error);
      Alert.alert('Error', 'Failed to load database items');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [loadedItems] = await Promise.all([
        controller.loadItems(),
        checkSDCard(),
      ]);
      setItems(loadedItems);
    } catch (error) {
      console.error('Error refreshing items:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleAddItem = useCallback(
    async (name: string, description: string) => {
      if (!name.trim()) {
        Alert.alert('Validation Error', 'Item name is required.');
        return;
      }

      try {
        const newItem = await controller.createItem({
          name: name.trim(),
          description: description.trim(),
        });
        setItems(prev => [newItem, ...prev]);
        setShowAddForm(false);
      } catch (error) {
        console.error('Error adding item:', error);
        Alert.alert('Error', 'Failed to add item');
      }
    },
    [],
  );

  const handleUpdateItem = useCallback(
    async (id: number, name: string, description: string) => {
      if (!name.trim()) {
        Alert.alert('Validation Error', 'Item name is required.');
        return;
      }

      try {
        const updated = await controller.updateItem(id, {
          name: name.trim(),
          description: description.trim(),
        });
        setItems(prev => prev.map(item => (item.id === id ? updated : item)));
        setEditingItem(null);
      } catch (error) {
        console.error('Error updating item:', error);
        Alert.alert('Error', 'Failed to update item');
      }
    },
    [],
  );

  const handleDeleteItem = useCallback((item: IDatabaseItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await controller.deleteItem(item.id);
              setItems(prev => prev.filter(i => i.id !== item.id));
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ],
    );
  }, []);

  const handleItemPress = useCallback((item: IDatabaseItem) => {
    Alert.alert(
      item.name,
      `${item.description}\n\nCreated: ${item.createdAt}\nUpdated: ${item.updatedAt}`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Edit', onPress: () => setEditingItem(item)},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteItem(item),
        },
      ],
    );
  }, []);

  const handleExportBackup = useCallback(async () => {
    // Always do a live check — never trust cached state
    let liveAvailable = false;
    try {
      liveAvailable = await controller.isSDCardAvailable();
      setSdCardAvailable(liveAvailable);
      setSdCardPath(controller.getBackupDirectory());
    } catch {
      setSdCardAvailable(false);
    }

    const doExport = async (destinations: BackupDestination[]) => {
      setIsBackingUp(true);
      try {
        const paths = await controller.exportBackupToDestinations(destinations);
        await checkSDCard();
        Alert.alert(
          'Backup Complete',
          `Saved to:\n${paths.join('\n')}`,
        );
        if (showBackups) {
          const backupList = await controller.getBackupList();
          setBackups(backupList);
        }
      } catch (error) {
        console.error('Error exporting backup:', error);
        Alert.alert('Backup Failed', 'Could not write backup.');
      } finally {
        setIsBackingUp(false);
      }
    };

    if (!liveAvailable) {
      Alert.alert(
        'SD Card Not Available',
        'Back up to internal storage instead?',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Internal Storage', onPress: () => doExport(['internal'])},
        ],
      );
      return;
    }

    Alert.alert(
      'Choose Backup Destination',
      'Where would you like to save the backup?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'SD Card', onPress: () => doExport(['sd'])},
        {text: 'Internal', onPress: () => doExport(['internal'])},
        {text: 'Both', onPress: () => doExport(['sd', 'internal'])},
      ],
    );
  }, [showBackups]);

  const handleShowBackups = useCallback(async () => {
    try {
      const [backupList] = await Promise.all([
        controller.getBackupList(),
        checkSDCard(),
      ]);
      setBackups(backupList);
      setShowBackups(true);
    } catch (error) {
      console.error('Error loading backups:', error);
      Alert.alert('Error', 'Failed to load backup list');
    }
  }, []);

  const handleHideBackups = useCallback(() => {
    setShowBackups(false);
  }, []);

  const handlePreviewBackup = useCallback(async (backup: IBackupFile) => {
    setIsLoadingPreview(true);
    try {
      const data = await controller.readBackup(backup.path);
      setPreviewBackup(data);
    } catch (error) {
      console.error('Error reading backup:', error);
      Alert.alert('Error', 'Could not read backup file contents.');
    } finally {
      setIsLoadingPreview(false);
    }
  }, []);

  const handleHidePreview = useCallback(() => {
    setPreviewBackup(null);
  }, []);

  const handleRestoreBackup = useCallback((backup: IBackupFile) => {
    const itemCount = backup.metadata?.itemCount ?? 'unknown';
    Alert.alert(
      'Restore Backup',
      `Restore from "${backup.filename}"?\n\nThis will replace all current items with ${itemCount} items from the backup.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setIsRestoring(true);
            try {
              await controller.restoreBackup(backup.path);
              const loadedItems = await controller.loadItems();
              setItems(loadedItems);
              Alert.alert(
                'Restore Complete',
                'Database has been restored from backup.',
              );
            } catch (error) {
              console.error('Error restoring backup:', error);
              Alert.alert('Restore Failed', 'Could not restore from backup file.');
            } finally {
              setIsRestoring(false);
            }
          },
        },
      ],
    );
  }, []);

  const handleDeleteBackup = useCallback((backup: IBackupFile) => {
    Alert.alert(
      'Delete Backup',
      `Delete "${backup.filename}"? This cannot be undone.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await controller.deleteBackup(backup.path);
              setBackups(prev => prev.filter(b => b.path !== backup.path));
            } catch (error) {
              console.error('Error deleting backup:', error);
              Alert.alert('Error', 'Failed to delete backup file');
            }
          },
        },
      ],
    );
  }, []);

  const handleToggleApi = useCallback(async (enabled: boolean) => {
    try {
      await controller.toggleApiEnabled(enabled);
      setSyncState(controller.getSyncService().getSyncState());
    } catch (error) {
      console.error('Error toggling API:', error);
      Alert.alert('Error', 'Failed to toggle API sync');
    }
  }, []);

  const handleSyncNow = useCallback(async () => {
    try {
      await controller.syncNow();
    } catch (error) {
      console.error('Error syncing:', error);
    }
  }, []);

  return {
    items,
    backups,
    isLoading,
    isRefreshing,
    isBackingUp,
    isRestoring,
    isLoadingPreview,
    editingItem,
    showAddForm,
    showBackups,
    sdCardAvailable,
    sdCardPath,
    previewBackup,
    setShowAddForm,
    setEditingItem,
    handleRefresh,
    handleAddItem,
    handleUpdateItem,
    handleDeleteItem,
    handleItemPress,
    handleExportBackup,
    handleShowBackups,
    handleHideBackups,
    handlePreviewBackup,
    handleHidePreview,
    handleRestoreBackup,
    handleDeleteBackup,
    syncState,
    handleToggleApi,
    handleSyncNow,
  };
};
