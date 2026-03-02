export interface IStorageInfo {
  id: string;
  name: string;
  type: 'sd' | 'tab' | 'internal';
  totalSpace: number; // in GB
  usedSpace: number; // in GB
  status: 'available' | 'unavailable' | 'full';
  icon: string;
  lastAccessed?: string;
  permissions?: 'read' | 'read-write' | 'restricted';
  isEnabled: boolean;
  order: number;
}

export interface IFileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modified: string;
  icon: string;
  parentId?: string;
}

export interface IAppItem {
  id: string;
  name: string;
  type: 'app' | 'data' | 'cache';
  size: number;
  version?: string;
  lastUsed: string;
  icon: string;
}

export interface ISystemItem {
  id: string;
  name: string;
  type: 'system' | 'user' | 'temp';
  size: number;
  category: string;
  critical: boolean;
  icon: string;
}

export interface IStorageData {
  id: string;
  storageInfo: IStorageInfo;
  files?: IFileItem[];
  apps?: IAppItem[];
  systemItems?: ISystemItem[];
  lastUpdated: Date;
}