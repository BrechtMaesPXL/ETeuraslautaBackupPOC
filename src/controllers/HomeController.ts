import {useState, useEffect, useCallback} from 'react';
import {HomeTab} from '../types/StorageTypes';
import {DatabaseController} from './DatabaseController';
import {
  IDatabaseItem,
  ISyncState,
  ISyncLogEntry,
  IBackupFile,
} from '../interfaces/IDatabaseInterfaces';

export interface HomeData {
  title: string;
  subtitle: string;
}

export interface SDCardOverview {
  available: boolean;
  path: string;
  backups: IBackupFile[];
}

export class HomeController {
  private static instance: HomeController;
  private databaseController = DatabaseController.getInstance();

  public static getInstance(): HomeController {
    if (!HomeController.instance) {
      HomeController.instance = new HomeController();
    }
    return HomeController.instance;
  }

  public getHomeData(): HomeData {
    return {
      title: 'eTeuraslauta Storage Manager',
      subtitle: 'Digital storage management and backup solution',
    };
  }

  public async getSDCardOverview(): Promise<SDCardOverview> {
    const available = await this.databaseController.isSDCardAvailable();
    const path = this.databaseController.getBackupDirectory();
    const allBackups = await this.databaseController.getBackupList();
    const backups = allBackups.filter(b => b.location === 'sd');
    return {available, path, backups};
  }

  public async getSyncLog(limit?: number): Promise<ISyncLogEntry[]> {
    return await this.databaseController.getSyncLog(limit);
  }

  public async getRecentItems(limit?: number): Promise<IDatabaseItem[]> {
    return await this.databaseController.getRecentItems(limit);
  }

  public getSyncState(): ISyncState {
    return this.databaseController.getSyncService().getSyncState();
  }
}

export const useHomeController = () => {
  const controller = HomeController.getInstance();
  const [homeData] = useState<HomeData>(() => controller.getHomeData());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<HomeTab>('sdcard');
  const [syncState, setSyncState] = useState<ISyncState>({
    apiEnabled: false,
    lastSyncedAt: null,
    syncStatus: 'idle',
  });
  const [syncLog, setSyncLog] = useState<ISyncLogEntry[]>([]);
  const [recentItems, setRecentItems] = useState<IDatabaseItem[]>([]);
  const [sdCardOverview, setSdCardOverview] = useState<SDCardOverview>({
    available: false,
    path: '',
    backups: [],
  });

  const loadOverviewData = useCallback(async () => {
    try {
      const [log, items, sdCard] = await Promise.all([
        controller.getSyncLog(20),
        controller.getRecentItems(5),
        controller.getSDCardOverview(),
      ]);
      setSyncLog(log);
      setRecentItems(items);
      setSdCardOverview(sdCard);
      setSyncState(controller.getSyncState());
    } catch (error) {
      console.error('Error loading overview data:', error);
    }
  }, []);

  // Load overview data on mount and poll every 5 seconds
  useEffect(() => {
    loadOverviewData();
    const interval = setInterval(loadOverviewData, 5000);
    return () => clearInterval(interval);
  }, [loadOverviewData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadOverviewData();
    } finally {
      setIsRefreshing(false);
    }
  }, [loadOverviewData]);

  const handleTabChange = useCallback((tab: HomeTab) => {
    setActiveTab(tab);
  }, []);

  return {
    homeData,
    isRefreshing,
    activeTab,
    syncState,
    syncLog,
    recentItems,
    sdCardOverview,
    handleRefresh,
    handleTabChange,
  };
};
