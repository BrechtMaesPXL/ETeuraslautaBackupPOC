import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { NavigationController } from './NavigationController';

export interface SystemItem {
  id: string;
  name: string;
  type: 'system' | 'user' | 'temp';
  size: number;
  category: string;
  critical: boolean;
  icon: string;
}

export interface InternalStorageData {
  title: string;
  subtitle: string;
  totalSpace: number;
  usedSpace: number;
  systemItems: SystemItem[];
}

export class InternalStorageController {
  private static instance: InternalStorageController;
  private navigationController = NavigationController.getInstance();

  public static getInstance(): InternalStorageController {
    if (!InternalStorageController.instance) {
      InternalStorageController.instance = new InternalStorageController();
    }
    return InternalStorageController.instance;
  }

  public getInternalStorageData(): InternalStorageData {
    return {
      title: 'Internal Storage',
      subtitle: 'Device system storage',
      totalSpace: 128.0,
      usedSpace: 89.7,
      systemItems: [
        {
          id: '1',
          name: 'Operating System',
          type: 'system',
          size: 1024 * 1024 * 1024 * 8, // 8 GB
          category: 'Core System',
          critical: true,
          icon: '⚙️',
        },
        {
          id: '2',
          name: 'System Applications',
          type: 'system',
          size: 1024 * 1024 * 1024 * 4, // 4 GB
          category: 'System Apps',
          critical: true,
          icon: '📦',
        },
        {
          id: '3',
          name: 'User Data',
          type: 'user',
          size: 1024 * 1024 * 1024 * 12, // 12 GB
          category: 'User Files',
          critical: false,
          icon: '📁',
        },
        {
          id: '4',
          name: 'Temporary Files',
          type: 'temp',
          size: 1024 * 1024 * 850, // 850 MB
          category: 'Cleanup',
          critical: false,
          icon: '🗜️',
        },
        {
          id: '5',
          name: 'System Cache',
          type: 'temp',
          size: 1024 * 1024 * 1200, // 1.2 GB
          category: 'Performance',
          critical: false,
          icon: '🗂️',
        },
        {
          id: '6',
          name: 'Boot Partition',
          type: 'system',
          size: 1024 * 1024 * 512, // 512 MB
          category: 'Core System',
          critical: true,
          icon: '🚀',
        },
      ],
    };
  }

  public handleBack(): void {
    const canGoBack = this.navigationController.goBack();
    if (!canGoBack) {
      this.navigationController.navigateToHome();
    }
  }

  public handleSystemItemPress(item: SystemItem): void {
    console.log(`System item pressed: ${item.name}`);
    
    if (item.critical) {
      Alert.alert(
        `${item.name} - System Component`,
        `Type: ${item.type.toUpperCase()}\nCategory: ${item.category}\nSize: ${this.formatBytes(item.size)}\n\n⚠️ CRITICAL SYSTEM COMPONENT\n\nThis is a critical system component. Modifying or deleting it may cause system instability.`,
        [
          { text: 'OK' },
          { 
            text: 'View Details', 
            onPress: () => this.showSystemItemDetails(item)
          },
        ]
      );
    } else {
      const actions = {
        user: [
          { text: 'Browse Files', onPress: () => this.browseUserFiles(item) },
          { text: 'Backup Data', onPress: () => this.backupUserData(item) },
          { text: 'Clear Data', style: 'destructive' as const, onPress: () => this.clearUserData(item) },
        ],
        temp: [
          { text: 'View Details', onPress: () => this.showSystemItemDetails(item) },
          { text: 'Clear Files', onPress: () => this.clearTempFiles(item) },
        ],
        system: [
          { text: 'View Details', onPress: () => this.showSystemItemDetails(item) },
        ],
      };

      Alert.alert(
        item.name,
        `Type: ${item.type.toUpperCase()}\nCategory: ${item.category}\nSize: ${this.formatBytes(item.size)}`,
        [
          { text: 'Cancel', style: 'cancel' },
          ...actions[item.type],
        ]
      );
    }
  }

  private showSystemItemDetails(item: SystemItem): void {
    const details = {
      'Operating System': 'Android 14\nKernel Version: 5.15.123\nBuild: AP2A.240905.003\nSecurity Patch: 2024-02-01',
      'System Applications': 'Core system apps including Phone, Contacts, Settings, and system services.',
      'User Data': 'Personal files, photos, documents, and app data stored by user applications.',
      'Temporary Files': 'Cached data, log files, and temporary downloads that can be safely removed.',
      'System Cache': 'System-level cache files used to improve performance and reduce loading times.',
      'Boot Partition': 'Critical boot loader and recovery partition required for system startup.',
    };

    Alert.alert(
      `${item.name} - Details`,
      details[item.name as keyof typeof details] || 'System component details not available.',
      [{ text: 'OK' }]
    );
  }

  private browseUserFiles(item: SystemItem): void {
    Alert.alert('Browse Files', `Opening file browser for ${item.name}...`);
  }

  private backupUserData(item: SystemItem): void {
    Alert.alert(
      'Backup User Data',
      `Create backup of ${item.name}? This may take several minutes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Backup', 
          onPress: () => Alert.alert('Backup Started', `Creating backup of ${item.name}...`)
        },
      ]
    );
  }

  private clearUserData(item: SystemItem): void {
    Alert.alert(
      'Clear User Data',
      `WARNING: This will permanently delete all user data. Are you sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => Alert.alert('Data Cleared', `User data for ${item.name} has been cleared.`)
        },
      ]
    );
  }

  private clearTempFiles(item: SystemItem): void {
    Alert.alert(
      'Clear Temporary Files',
      `This will free up ${this.formatBytes(item.size)} of storage space.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          onPress: () => Alert.alert('Files Cleared', `${item.name} has been cleared.`)
        },
      ]
    );
  }

  public handleRefresh(): void {
    console.log('Refreshing internal storage data...');
    // TODO: Implement actual refresh logic
  }

  public handleSystemCleanup(): void {
    Alert.alert(
      'System Cleanup',
      'This will safely remove temporary files, clear caches, and optimize system performance.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Cleanup', 
          onPress: () => {
            Alert.alert('Cleanup Started', 'System cleanup is running in the background...');
          }
        },
      ]
    );
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 bytes';
    const k = 1024;
    const sizes = ['bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Custom hook to use the InternalStorageController
export const useInternalStorageController = () => {
  const [storageData, setStorageData] = useState<InternalStorageData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const controller = InternalStorageController.getInstance();

  useEffect(() => {
    const data = controller.getInternalStorageData();
    setStorageData(data);
  }, []);

  const handleBack = () => {
    controller.handleBack();
  };

  const handleSystemItemPress = (item: SystemItem) => {
    controller.handleSystemItemPress(item);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    controller.handleRefresh();
    setTimeout(() => {
      const data = controller.getInternalStorageData();
      setStorageData(data);
      setIsRefreshing(false);
    }, 1000);
  };

  const handleSystemCleanup = () => {
    controller.handleSystemCleanup();
  };

  return {
    storageData,
    isRefreshing,
    handleBack,
    handleSystemItemPress,
    handleRefresh,
    handleSystemCleanup,
  };
};