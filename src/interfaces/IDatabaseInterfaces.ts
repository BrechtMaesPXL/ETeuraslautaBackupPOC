export interface IDatabaseItem {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface IDatabaseItemInput {
  name: string;
  description: string;
}

export interface IBackupMetadata {
  formatVersion: string;
  appVersion: string;
  databaseVersion: number;
  timestamp: string;
  itemCount: number;
  deviceInfo: string;
}

export interface IBackupData {
  metadata: IBackupMetadata;
  items: IDatabaseItem[];
}

export type BackupDestination = 'sd' | 'internal';

export interface IBackupFile {
  filename: string;
  path: string;
  size: number;
  createdAt: string;
  metadata: IBackupMetadata | null;
  location?: BackupDestination;
}
