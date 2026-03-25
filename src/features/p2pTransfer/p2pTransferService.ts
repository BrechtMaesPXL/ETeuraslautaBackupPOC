import {Platform} from 'react-native';
import RNFS from 'react-native-fs';
import {DatabaseModel} from '../../models/DatabaseModel';
import {DatabaseService} from '../../controllers/services/DatabaseService';
import {IDatabaseItem} from '../../interfaces/IDatabaseInterfaces';

export interface PeerDevice {
  id: string;
  name: string;
  platform: 'android' | 'ios';
  appVersion: string;
}

export interface TransferMetadata {
  sourceDeviceId: string;
  deviceName?: string;
  timestamp: string;
  dbVersion: number;
  recordCount: number;
  checksum: string;
  sizeBytes: number;
  payloadType: 'backup-json';
}

export interface TransferProgress {
  bytesTransferred: number;
  totalBytes: number;
  percent: number;
  etaMs?: number;
}

export interface TransferAdapter {
  discoverPeers(): Promise<PeerDevice[]>;
  sendFile(
    peer: PeerDevice,
    filePath: string,
    metadata: TransferMetadata,
    onProgress?: (progress: TransferProgress) => void,
  ): Promise<void>;
  receiveFile(
    onReceive: (
      payloadPath: string,
      metadata: TransferMetadata,
    ) => Promise<void>,
  ): Promise<() => void>;
}

export class P2PTransferService {
  private static instance: P2PTransferService;
  private readonly databaseModel = DatabaseModel.getInstance();
  private readonly databaseService = DatabaseService.getInstance();
  private discoveredPeers: PeerDevice[] = [];
  private adapter: TransferAdapter | null = null;

  public static getInstance(): P2PTransferService {
    if (!P2PTransferService.instance) {
      P2PTransferService.instance = new P2PTransferService();
    }
    return P2PTransferService.instance;
  }

  public setAdapter(adapter: TransferAdapter): void {
    this.adapter = adapter;
  }

  public async discoverPeers(): Promise<PeerDevice[]> {
    if (!this.adapter) {
      return this.discoveredPeers;
    }
    this.discoveredPeers = await this.adapter.discoverPeers();
    return this.discoveredPeers;
  }

  public async prepareExistingTransferPayload(existingPath: string): Promise<{filePath: string; metadata: TransferMetadata}> {
    const stat = await RNFS.stat(existingPath);
    let dbVersion = await this.databaseService.getDatabaseVersion();
    let recordCount = 0;
    
    try {
      const content = await RNFS.readFile(existingPath, 'utf8');
      const backupData = JSON.parse(content);
      dbVersion = backupData.metadata?.formatVersion || dbVersion;
      recordCount = backupData.items?.length || 0;
    } catch {
      // Ignored if file format is weird
    }
    
    const checksum = await generateChecksumForFile(existingPath);

    const metadata: TransferMetadata = {
      sourceDeviceId: await getDeviceId(),
      deviceName: getDeviceName(),
      timestamp: new Date().toISOString(),
      dbVersion,
      recordCount,
      checksum,
      sizeBytes: Number(stat.size),
      payloadType: 'backup-json',
    };

    return {filePath: existingPath, metadata};
  }

  public async prepareTransferPayload(): Promise<{filePath: string; metadata: TransferMetadata}> {
    const backupData = await this.databaseModel.getBackupData();
    const payloadPath = `${RNFS.CachesDirectoryPath}/p2p_export_${Date.now()}.json`;
    await RNFS.writeFile(payloadPath, JSON.stringify(backupData), 'utf8');

    const checksum = await generateChecksumForFile(payloadPath);
    const stat = await RNFS.stat(payloadPath);

    const metadata: TransferMetadata = {
      sourceDeviceId: await getDeviceId(),
      deviceName: getDeviceName(),
      timestamp: new Date().toISOString(),
      dbVersion: await this.databaseService.getDatabaseVersion(),
      recordCount: backupData.items.length,
      checksum,
      sizeBytes: Number(stat.size),
      payloadType: 'backup-json',
    };

    return {filePath: payloadPath, metadata};
  }

  public async sendToPeer(
    peerId: string,
    filePath: string,
    metadata: TransferMetadata,
    onProgress?: (progress: TransferProgress) => void,
  ): Promise<void> {
    const peer = this.discoveredPeers.find(p => p.id === peerId);
    if (!peer) {
      throw new Error('Peer not found. Call discoverPeers first.');
    }

    if (!this.adapter) {
      throw new Error('No transfer adapter configured for P2P transport.');
    }

    await this.adapter.sendFile(peer, filePath, metadata, onProgress);
  }

  public async startReceiving(onProgress?: (msg: string) => void): Promise<() => void> {
    if (!this.adapter) {
      throw new Error('No transfer adapter configured for P2P transport.');
    }
    
    if (onProgress) onProgress('Waiting for incoming connection and file...');
    
    const cancelFn = await this.adapter.receiveFile(async (payloadPath, metadata) => {
      if (onProgress) onProgress('Receiving file and processing data...');
      try {
        await this.receiveFromPeer(metadata, payloadPath);
        if (onProgress) onProgress('Backup received and saved successfully.');
      } catch (err) {
        if (onProgress) onProgress('Error processing received file.');
        console.error(err);
      }
    });
    
    return cancelFn;
  }

  public async receiveFromPeer(
    metadata: TransferMetadata,
    incomingFilePath: string,
    onProgress?: (progress: TransferProgress) => void,
  ): Promise<string> {
    const backupService = (await import('../../controllers/services/BackupService')).BackupService.getInstance();
    const internalDir = backupService.getInternalBackupDirectory();
    
    // Ensure the main internal backup directory exists
    const exists = await RNFS.exists(internalDir);
    if (!exists) {
      await RNFS.mkdir(internalDir);
    }

    const deviceName = (metadata.deviceName || metadata.sourceDeviceId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const receivedDir = `${internalDir}/received_from_${deviceName}`;
    
    const dirExists = await RNFS.exists(receivedDir);
    if (!dirExists) {
      await RNFS.mkdir(receivedDir);
    }

    const receivedPath = `${receivedDir}/backup_${Date.now()}.json`;

    await copyWithProgress(incomingFilePath, receivedPath, onProgress);
    const checksumMatches = await verifyChecksum(receivedPath, metadata.checksum);
    if (!checksumMatches) {
      await RNFS.unlink(receivedPath).catch(() => {});
      throw new Error('Checksum mismatch on received file');
    }

    return receivedPath;
  }

  public async mergeReceivedData(
    receivedPayloadPath: string,
    strategy: 'local-wins' | 'remote-wins' | 'newest-wins',
  ): Promise<void> {
    if (strategy === 'local-wins') {
      return;
    }

    const content = await RNFS.readFile(receivedPayloadPath, 'utf8');
    const payload = JSON.parse(content) as {items: IDatabaseItem[]};
    const incomingItems = payload.items ?? [];

    if (strategy === 'remote-wins') {
      await this.databaseService.clearAllItems();
      await this.databaseService.upsertItemsWithTimestamps(incomingItems);
      await this.databaseModel.loadItems();
      return;
    }

    const localItems = await this.databaseService.getAllItems();
    const localMap = new Map<number, IDatabaseItem>(
      localItems.map(item => [item.id, item]),
    );

    const updates: IDatabaseItem[] = [];
    for (const item of incomingItems) {
      const local = localMap.get(item.id);
      if (!local) {
        updates.push(item);
        continue;
      }

      const remoteUpdatedAt = new Date(item.updatedAt).getTime();
      const localUpdatedAt = new Date(local.updatedAt).getTime();
      if (remoteUpdatedAt > localUpdatedAt) {
        updates.push(item);
      }
    }

    if (updates.length > 0) {
      await this.databaseService.upsertItemsWithTimestamps(updates);
      await this.databaseModel.loadItems();
    }
  }

  public async cleanup(): Promise<void> {
    const tempDir = RNFS.CachesDirectoryPath;
    const files = await RNFS.readDir(tempDir);
    for (const file of files) {
      if (file.name.startsWith('p2p_')) {
        await RNFS.unlink(file.path).catch(() => {});
      }
    }
  }
}

async function getDeviceId(): Promise<string> {
  const deviceIdPath = `${RNFS.DocumentDirectoryPath}/p2p_device_id.txt`;
  const exists = await RNFS.exists(deviceIdPath);
  if (exists) {
    return RNFS.readFile(deviceIdPath, 'utf8');
  }

  const id = generateRandomId();
  await RNFS.writeFile(deviceIdPath, id, 'utf8');
  return id;
}

function generateRandomId(): string {
  const random = Math.random().toString(36).slice(2, 12);
  return `${Platform.OS}-${random}`;
}

async function generateChecksumForFile(filePath: string): Promise<string> {
  const content = await RNFS.readFile(filePath, 'base64');
  return generateChecksum(content);
}

function generateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

async function verifyChecksum(filePath: string, expectedChecksum: string): Promise<boolean> {
  const checksum = await generateChecksumForFile(filePath);
  return checksum === expectedChecksum;
}

async function copyWithProgress(
  sourcePath: string,
  destinationPath: string,
  onProgress?: (progress: TransferProgress) => void,
): Promise<void> {
  const stat = await RNFS.stat(sourcePath);
  await RNFS.copyFile(sourcePath, destinationPath);
  if (onProgress) {
    onProgress({
      bytesTransferred: Number(stat.size),
      totalBytes: Number(stat.size),
      percent: 100,
    });
  }
}

export const p2pTransfer = P2PTransferService.getInstance();
function getDeviceName(): string { return 'Device ' + Platform.OS; }