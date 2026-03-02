export type StorageType = 'sd' | 'tab' | 'internal';
export type StorageStatus = 'available' | 'unavailable' | 'full';
export type PermissionLevel = 'read' | 'read-write' | 'restricted';
export type FileType = 'file' | 'folder';
export type AppType = 'app' | 'data' | 'cache';
export type SystemType = 'system' | 'user' | 'temp';

export type NavigationScreen = 
  | 'Home' 
  | 'SDStorage' 
  | 'TabStorage' 
  | 'InternalStorage'
  | 'StorageDetails';

export type NavigationParams = {
  storageId?: string;
  storageType?: StorageType;
  [key: string]: any;
}

export type HomeTab = 'storage' | 'database';
export type ItemCategoryType = 'files' | 'apps' | 'system';