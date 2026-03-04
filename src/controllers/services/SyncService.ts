import {ISyncState, ISyncLogEntry, SyncStatus} from '../../interfaces/IDatabaseInterfaces';
import {DatabaseModel} from '../../models/DatabaseModel';
import {DatabaseService} from './DatabaseService';
import {MockApiService} from './MockApiService';

const POLL_INTERVAL_MS = 30_000;

export type SyncStateCallback = (state: ISyncState) => void;

export class SyncService {
  private static instance: SyncService;
  private mockApi = MockApiService.getInstance();
  private databaseModel = DatabaseModel.getInstance();
  private databaseService = DatabaseService.getInstance();

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private onStatusChange: SyncStateCallback | null = null;

  private apiEnabled: boolean = false;
  private lastSyncedAt: string | null = null;
  private syncStatus: SyncStatus = 'idle';
  private isSyncing: boolean = false;

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  public getSyncState(): ISyncState {
    return {
      apiEnabled: this.apiEnabled,
      lastSyncedAt: this.lastSyncedAt,
      syncStatus: this.syncStatus,
    };
  }

  private notifyChange(): void {
    if (this.onStatusChange) {
      this.onStatusChange(this.getSyncState());
    }
  }

  public async loadPersistedState(): Promise<ISyncState> {
    const persisted = await this.databaseService.getSyncState();
    this.apiEnabled = persisted.apiEnabled;
    this.lastSyncedAt = persisted.lastSyncedAt;
    this.mockApi.setEnabled(this.apiEnabled);
    this.syncStatus = this.apiEnabled ? 'idle' : 'idle';
    return this.getSyncState();
  }

  public startPolling(onStatusChange: SyncStateCallback): void {
    this.onStatusChange = onStatusChange;
    this.stopPolling();
    if (this.apiEnabled) {
      this.pollTimer = setInterval(() => {
        this.syncNow();
      }, POLL_INTERVAL_MS);
    }
  }

  public stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  public async setApiEnabled(enabled: boolean): Promise<void> {
    this.apiEnabled = enabled;
    this.mockApi.setEnabled(enabled);

    if (!enabled) {
      this.stopPolling();
      this.syncStatus = 'idle';
      await this.databaseService.setSyncState(false, this.lastSyncedAt);
      this.notifyChange();
      return;
    }

    await this.databaseService.setSyncState(true, this.lastSyncedAt);
    this.notifyChange();

    // Restart polling
    if (this.onStatusChange) {
      this.stopPolling();
      this.pollTimer = setInterval(() => {
        this.syncNow();
      }, POLL_INTERVAL_MS);
    }

    // Immediate sync on enable
    await this.syncNow();
  }

  public async getSyncLog(limit: number = 20): Promise<ISyncLogEntry[]> {
    return await this.databaseService.getSyncLog(limit);
  }

  public async syncNow(): Promise<void> {
    if (this.isSyncing) {
      return;
    }
    if (!this.apiEnabled) {
      return;
    }

    this.isSyncing = true;
    this.syncStatus = 'syncing';
    this.notifyChange();

    try {
      const data = await this.databaseModel.getBackupData();
      await this.mockApi.uploadData(data);

      this.lastSyncedAt = new Date().toISOString();
      this.syncStatus = 'synced';
      await this.databaseService.setSyncState(this.apiEnabled, this.lastSyncedAt);
      await this.databaseService.addSyncLog(true, data.items.length, null);
    } catch (error: unknown) {
      this.syncStatus = 'error';
      const msg = error instanceof Error ? error.message : 'Unknown error';
      await this.databaseService.addSyncLog(false, 0, msg).catch(() => {});
    } finally {
      this.isSyncing = false;
      this.notifyChange();
    }
  }
}
