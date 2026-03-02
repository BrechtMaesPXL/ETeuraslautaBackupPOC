import { useState } from 'react';
import { Alert } from 'react-native';
import { NavigationService } from './services/NavigationService';
import { StorageType, HomeTab } from '../types/StorageTypes';

export interface StorageInfo {
  id: string;
  name: string;
  type: StorageType;
  totalSpace: number; // in GB
  usedSpace: number; // in GB
  status: 'available' | 'unavailable' | 'full';
  icon: string;
  lastAccessed?: string;
  permissions: 'read' | 'read-write' | 'restricted';
}

export interface HomeData {
  title: string;
  subtitle: string;
  storageData: StorageInfo[];
}

export interface StorageAction {
  title: string;
  action: () => void;
}

export class HomeController {
  private static instance: HomeController;
  private navigationService = NavigationService.getInstance();
  
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
      storageData: [
        {
          id: 'sd-storage',
          name: 'SD Card Storage',
          type: 'sd',
          totalSpace: 32.0,
          usedSpace: 18.5,
          status: 'available',
          icon: '💾',
          lastAccessed: '2 hours ago',
          permissions: 'read-write',
        },
        {
          id: 'tab-storage',
          name: 'Tab Storage',
          type: 'tab',
          totalSpace: 64.0,
          usedSpace: 42.3,
          status: 'available',
          icon: '📱',
          lastAccessed: '30 minutes ago',
          permissions: 'read-write',
        },
        {
          id: 'internal-storage',
          name: 'Internal Storage',
          type: 'internal',
          totalSpace: 128.0,
          usedSpace: 89.7,
          status: 'available',
          icon: '💻',
          lastAccessed: '5 minutes ago',
          permissions: 'read-write',
        },
      ],
    };
  }

  public handleStoragePress(storageId: string): void {
    console.log(`Storage pressed: ${storageId}`);
    const storage = this.getStorageById(storageId);
    
    if (!storage) {
      Alert.alert('Error', 'Storage not found');
      return;
    }

    if (storage.status === 'unavailable') {
      Alert.alert(
        'Storage Unavailable',
        `${storage.name} is currently unavailable. Please check the connection and try again.`
      );
      return;
    }

    // Navigate to the appropriate storage screen
    switch (storage.type) {
      case 'sd':
        this.navigationService.navigate('SDStorage', { storageType: 'sd', storageId });
        break;
      case 'tab':
        this.navigationService.navigate('TabStorage', { storageType: 'tab', storageId });
        break;
      case 'internal':
        this.navigationService.navigate('InternalStorage', { storageType: 'internal', storageId });
        break;
      default:
        Alert.alert('Error', `Unknown storage type: ${storage.type}`);
    }
  }

  private showStorageDetails(storage: StorageInfo): void {
    const freeSpace = storage.totalSpace - storage.usedSpace;
    const usagePercentage = ((storage.usedSpace / storage.totalSpace) * 100).toFixed(1);
    
    const message = `
Total Space: ${storage.totalSpace.toFixed(1)} GB
Used Space: ${storage.usedSpace.toFixed(1)} GB (${usagePercentage}%)
Free Space: ${freeSpace.toFixed(1)} GB
Last Accessed: ${storage.lastAccessed}
Permissions: ${storage.permissions.toUpperCase()}

What would you like to do?`;

    Alert.alert(
      storage.name,
      message,
      [
        {
          text: 'Open Files',
          onPress: () => this.navigateToStorageFiles(storage.id),
        },
        {
          text: 'Manage Storage',
          onPress: () => this.navigateToStorageManagement(storage.id),
        },
        {
          text: 'View Details',
          onPress: () => this.showAdvancedStorageInfo(storage),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  }

  private getStorageById(storageId: string): StorageInfo | undefined {
    const homeData = this.getHomeData();
    return homeData.storageData.find(storage => storage.id === storageId);
  }

  private showAdvancedStorageInfo(storage: StorageInfo): void {
    const typeDescriptions = {
      'sd': 'Removable SD Card - External storage for photos, videos, and backups',
      'tab': 'Tablet Internal Storage - Primary storage for apps and user data',
      'internal': 'Device Internal Storage - Core system and application storage'
    };

    const description = typeDescriptions[storage.type];
    const healthStatus = storage.usedSpace / storage.totalSpace > 0.9 ? '⚠️ Nearly Full' : '✅ Healthy';
    
    Alert.alert(
      `${storage.name} - Advanced Info`,
      `${description}\n\nHealth Status: ${healthStatus}\nStorage Type: ${storage.type.toUpperCase()}\nAccess Level: ${storage.permissions}\n\nRecommendations:\n${this.getStorageRecommendations(storage)}`,
      [{ text: 'OK' }]
    );
  }

  private getStorageRecommendations(storage: StorageInfo): string {
    const usageRatio = storage.usedSpace / storage.totalSpace;
    
    if (usageRatio > 0.9) {
      return '• Consider cleaning up old files\n• Move large files to other storage\n• Check for duplicate files';
    } else if (usageRatio > 0.7) {
      return '• Monitor storage usage regularly\n• Consider backing up important files\n• Review large files and folders';
    } else {
      return '• Storage is in good condition\n• Consider regular backups\n• Organize files for better management';
    }
  }

  public refreshStorageData(): void {
    console.log('Refreshing storage data...');
    // TODO: Implement actual storage refresh logic
    // This could involve checking device storage APIs
  }

  private navigateToStorageFiles(storageId: string): void {
    console.log(`Navigating to files for: ${storageId}`);
    // TODO: Implement file browser navigation
    Alert.alert('Navigation', `Opening file browser for ${storageId}`, [
      { text: 'OK' }
    ]);
  }

  private navigateToStorageManagement(storageId: string): void {
    console.log(`Navigating to management for: ${storageId}`);
    // TODO: Implement storage management navigation
    Alert.alert('Navigation', `Opening storage management for ${storageId}`, [
      { text: 'OK' }
    ]);
  }

  public cleanStorage(storageId: string): void {
    console.log(`Starting cleanup for: ${storageId}`);
    Alert.alert(
      'Storage Cleanup',
      'This will scan for temporary files, cache, and duplicates. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Start Cleanup',
          onPress: () => {
            // TODO: Implement actual cleanup logic
            Alert.alert('Cleanup Started', 'Storage cleanup is running in the background.');
          },
        },
      ]
    );
  }

  public backupStorage(storageId: string): void {
    console.log(`Starting backup for: ${storageId}`);
    const storage = this.getStorageById(storageId);
    if (storage) {
      Alert.alert(
        'Backup Storage',
        `Create backup of ${storage.name}? This may take several minutes.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start Backup',
            onPress: () => {
              // TODO: Implement actual backup logic
              Alert.alert('Backup Started', `Backing up ${storage.name} in the background.`);
            },
          },
        ]
      );
    }
  }
}

// Custom hook to use the HomeController
export const useHomeController = () => {
  const controller = HomeController.getInstance();
  const [homeData, setHomeData] = useState<HomeData | null>(
    () => controller.getHomeData(),
  );
  const [selectedStorageId, setSelectedStorageId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<HomeTab>('storage');

  const handleStoragePress = (storageId: string) => {
    setSelectedStorageId(storageId);
    controller.handleStoragePress(storageId);
    // Reset selection after a short delay for visual feedback
    setTimeout(() => setSelectedStorageId(null), 200);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    controller.refreshStorageData();
    // Simulate refresh delay
    setTimeout(() => {
      const data = controller.getHomeData();
      setHomeData(data);
      setIsRefreshing(false);
    }, 1500);
  };

  const handleCleanStorage = (storageId: string) => {
    controller.cleanStorage(storageId);
  };

  const handleBackupStorage = (storageId: string) => {
    controller.backupStorage(storageId);
  };

  const handleTabChange = (tab: HomeTab) => {
    setActiveTab(tab);
  };

  return {
    homeData,
    selectedStorageId,
    isRefreshing,
    activeTab,
    handleStoragePress,
    handleRefresh,
    handleCleanStorage,
    handleBackupStorage,
    handleTabChange,
  };
};