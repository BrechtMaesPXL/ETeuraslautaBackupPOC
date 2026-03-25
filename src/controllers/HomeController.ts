import {useState, useEffect, useCallback} from 'react';
import {HomeTab} from '../types/StorageTypes';
import {DatabaseController} from './DatabaseController';
import {
  IDatabaseItem,
  ISyncState,
  ISyncLogEntry,
  IBackupFile,
} from '../interfaces/IDatabaseInterfaces';
import {PeerDevice, p2pTransfer} from '../features/p2pTransfer/p2pTransferService';
import Share from 'react-native-share';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';

export interface HomeData {
  title: string;
  subtitle: string;
}

export interface SDCardOverview {
  available: boolean;
  path: string;
  backups: IBackupFile[];
}

export interface P2POverview {
  discoveredPeers: PeerDevice[];
  localBackups: IBackupFile[];
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

  public async getBackupList(): Promise<IBackupFile[]> {
    return await this.databaseController.getBackupList();
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
  const [p2pOverview, setP2pOverview] = useState<P2POverview>({
    discoveredPeers: [],
    localBackups: [],
  });
  const [isDiscoveringPeers, setIsDiscoveringPeers] = useState(false);
  const [isReceivingPeers, setIsReceivingPeers] = useState(false);
  const [p2pStatus, setP2pStatus] = useState<string>('Idle');

  const loadOverviewData = useCallback(async () => {
    try {
      const [log, items, sdCard, localBackups] = await Promise.all([
        controller.getSyncLog(20),
        controller.getRecentItems(5),
        controller.getSDCardOverview(),
        controller.getBackupList(),
      ]);
      setSyncLog(log);
      setRecentItems(items);
      setSdCardOverview(sdCard);
      setP2pOverview(prev => ({
        ...prev,
        localBackups,
      }));
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

  const handleDiscoverPeers = useCallback(async () => {
    setIsDiscoveringPeers(true);
    setP2pStatus('Requesting permissions and scanning...');
    try {
      const peers = await p2pTransfer.discoverPeers();
      setP2pOverview(prev => ({...prev, discoveredPeers: peers}));
      setP2pStatus(
        peers.length > 0
          ? `Found ${peers.length} device${peers.length === 1 ? '' : 's'}`
          : 'No devices found. Ensure Wi-Fi is on and permissions are granted.',
      );
    } catch (error) {
      console.error('Error discovering peers:', error);
      setP2pStatus('Discover failed. Check permissions and Wi-Fi.');
    } finally {
      setIsDiscoveringPeers(false);
    }
  }, []);

  // Auto-discover peers when switching to the P2P tab
  useEffect(() => {
    if (activeTab === 'p2p') {
      handleDiscoverPeers();
    }
  }, [activeTab, handleDiscoverPeers]);

  const handleConnectPeer = useCallback(
    async (peer: PeerDevice, selectedBackup?: IBackupFile) => {
      setP2pStatus(`Preparing backup for ${peer.name}...`);
      try {
        const {filePath, metadata} = selectedBackup 
          ? await p2pTransfer.prepareExistingTransferPayload(selectedBackup.path)
          : await p2pTransfer.prepareTransferPayload();
          
        setP2pStatus(`Sending to ${peer.name}...`);
        await p2pTransfer.sendToPeer(peer.id, filePath, metadata, progress => {
          setP2pStatus(
            `Sending ${Math.round(progress.percent)}% (${Math.round(progress.bytesTransferred)} / ${Math.round(progress.totalBytes)} bytes)`,
          );
        });
        setP2pStatus(`Sent backup to ${peer.name}`);
      } catch (error) {
        console.error('Error sending to peer', error);
        setP2pStatus('Send failed. Check connection.');
      }
    },
    [],
  );

  const handleStartReceiving = useCallback(async () => {
    setIsReceivingPeers(true);
    setP2pStatus('Initializing receiver...');
    try {
      await p2pTransfer.startReceiving((msg) => setP2pStatus(msg));
    } catch (error) {
      console.error('Error starting receiver:', error);
      setP2pStatus('Failed to start receiving.');
      setIsReceivingPeers(false);
    }
  }, []);

  const handleShareBluetooth = useCallback(async (selectedBackup?: IBackupFile) => {
    setP2pStatus('Preparing backup for sharing...');
    try {
      const {filePath, metadata} = selectedBackup
        ? await p2pTransfer.prepareExistingTransferPayload(selectedBackup.path)
        : await p2pTransfer.prepareTransferPayload();

      setP2pStatus('Opening share menu...');
      
      await Share.open({
        url: `file://${filePath}`,
        type: 'application/json',
        title: 'Share Backup',
        // By skipping the generic dialog on some devices and forcing Bluetooth target where possible
        // package: 'com.android.bluetooth' // Uncomment if you want to strictly force bluetooth vs general share
      });
      
      setP2pStatus('Backup shared successfully.');
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        console.error('Error sharing backup:', error);
        setP2pStatus('Failed to share backup.');
      } else {
        setP2pStatus('Share cancelled.');
      }
    }
  }, []);

  const handleImportExternal = useCallback(async () => {
    try {
      const results = await pick({
        type: [types.allFiles],
        copyTo: 'cachesDirectory',
        mode: 'import',
        allowMultiSelection: false,
      });
      
      const result = results[0];
      if (!result) return;
      
      if (!result.uri) {
        throw new Error('Could not get file uri from picker');
      }

      setP2pStatus('Verifying imported backup...');

      // Basic validation
      const content = await RNFS.readFile(result.uri, 'utf8');
      const parsed = JSON.parse(content);
      if (!parsed.items || !parsed.metadata) {
        throw new Error('File does not appear to be a valid backup JSON');
      }

      // We just drop it into the internal storage directory so the app auto-discovers it
      const backupService = (await import('./services/BackupService')).BackupService.getInstance();
      const internalDir = backupService.getInternalBackupDirectory();
      
      const fileName = result.name || `imported_backup_${Date.now()}.json`;
      const targetPath = `${internalDir}/${fileName}`;

      const exists = await RNFS.exists(internalDir);
      if (!exists) {
        await RNFS.mkdir(internalDir);
      }

      await RNFS.copyFile(result.uri, targetPath);
      setP2pStatus(`Successfully imported ${fileName}`);
      
      // Refresh the list immediately
      loadOverviewData();

    } catch (err: any) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
        setP2pStatus('Import cancelled.');
      } else {
        console.error('Failed to import backup', err);
        setP2pStatus(`Import failed: ${err.message}`);
      }
    }
  }, [loadOverviewData]);

  return {
    homeData,
    isRefreshing,
    activeTab,
    syncState,
    syncLog,
    recentItems,
    sdCardOverview,
    p2pOverview,
    isDiscoveringPeers,
    isReceivingPeers,
    p2pStatus,
    handleRefresh,
    handleTabChange,
    handleDiscoverPeers,
    handleStartReceiving,
    handleConnectPeer,
    handleShareBluetooth,
    handleImportExternal,
  };
};
