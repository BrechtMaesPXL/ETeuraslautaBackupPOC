import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { NavigationController } from './NavigationController';

export interface AppItem {
  id: string;
  name: string;
  type: 'app' | 'data' | 'cache';
  size: number;
  version?: string;
  lastUsed: string;
  icon: string;
}

export interface TabStorageData {
  title: string;
  subtitle: string;
  totalSpace: number;
  usedSpace: number;
  apps: AppItem[];
}

export class TabStorageController {
  private static instance: TabStorageController;
  private navigationController = NavigationController.getInstance();

  public static getInstance(): TabStorageController {
    if (!TabStorageController.instance) {
      TabStorageController.instance = new TabStorageController();
    }
    return TabStorageController.instance;
  }

  public getTabStorageData(): TabStorageData {
    return {
      title: 'Tab Storage',
      subtitle: 'Tablet internal storage',
      totalSpace: 64.0,
      usedSpace: 42.3,
      apps: [
        {
          id: '1',
          name: 'Camera App',
          type: 'app',
          size: 1024 * 1024 * 250, // 250 MB
          version: '2.1.4',
          lastUsed: '2 hours ago',
          icon: '📷',
        },
        {
          id: '2',
          name: 'Photo Gallery',
          type: 'data',
          size: 1024 * 1024 * 1200, // 1.2 GB
          lastUsed: '1 hour ago',
          icon: '🖼️',
        },
        {
          id: '3',
          name: 'System Cache',
          type: 'cache',
          size: 1024 * 1024 * 350, // 350 MB
          lastUsed: '30 minutes ago',
          icon: '🗂️',
        },
        {
          id: '4',
          name: 'Video Player',
          type: 'app',
          size: 1024 * 1024 * 180, // 180 MB
          version: '3.2.1',
          lastUsed: '3 hours ago',
          icon: '🎬',
        },
        {
          id: '5',
          name: 'App Data',
          type: 'data',
          size: 1024 * 1024 * 800, // 800 MB
          lastUsed: '6 hours ago',
          icon: '💾',
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

  public handleAppPress(app: AppItem): void {
    console.log(`App pressed: ${app.name}`);
    
    const actions = {
      app: [
        { text: 'Open App', onPress: () => this.openApp(app) },
        { text: 'App Info', onPress: () => this.showAppInfo(app) },
        { text: 'Uninstall', style: 'destructive' as const, onPress: () => this.uninstallApp(app) },
      ],
      data: [
        { text: 'View Data', onPress: () => this.viewAppData(app) },
        { text: 'Clear Data', style: 'destructive' as const, onPress: () => this.clearAppData(app) },
      ],
      cache: [
        { text: 'View Cache Details', onPress: () => this.viewCacheDetails(app) },
        { text: 'Clear Cache', onPress: () => this.clearCache(app) },
      ],
    };

    Alert.alert(
      app.name,
      `Type: ${app.type.toUpperCase()}\nSize: ${this.formatBytes(app.size)}\nLast Used: ${app.lastUsed}${app.version ? `\nVersion: ${app.version}` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...actions[app.type],
      ]
    );
  }

  private openApp(app: AppItem): void {
    Alert.alert('Opening App', `Launching ${app.name}...`);
  }

  private showAppInfo(app: AppItem): void {
    Alert.alert(
      `${app.name} - App Info`,
      `Package: com.example.${app.name.toLowerCase().replace(/\s+/g, '')}\nVersion: ${app.version}\nSize: ${this.formatBytes(app.size)}\nInstalled: 2 weeks ago\nPermissions: Camera, Storage, Network\nUpdates: Auto-update enabled`
    );
  }

  private uninstallApp(app: AppItem): void {
    Alert.alert(
      'Uninstall App',
      `Are you sure you want to uninstall ${app.name}? All app data will be lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Uninstall', 
          style: 'destructive',
          onPress: () => Alert.alert('App Uninstalled', `${app.name} has been uninstalled.`)
        },
      ]
    );
  }

  private viewAppData(app: AppItem): void {
    Alert.alert('App Data', `Viewing data for ${app.name}...`);
  }

  private clearAppData(app: AppItem): void {
    Alert.alert(
      'Clear App Data',
      `This will delete all data for ${app.name}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => Alert.alert('Data Cleared', `All data for ${app.name} has been cleared.`)
        },
      ]
    );
  }

  private viewCacheDetails(app: AppItem): void {
    Alert.alert(
      'Cache Details',
      `Cache Type: System Cache\nSize: ${this.formatBytes(app.size)}\nLast Updated: ${app.lastUsed}\nStatus: Active\n\nCache helps improve app performance by storing frequently used data.`
    );
  }

  private clearCache(app: AppItem): void {
    Alert.alert(
      'Clear Cache',
      'This will clear temporary files and may improve performance.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          onPress: () => Alert.alert('Cache Cleared', 'System cache has been cleared.')
        },
      ]
    );
  }

  public handleRefresh(): void {
    console.log('Refreshing tab storage data...');
    // TODO: Implement actual refresh logic
  }

  public handleOptimizeStorage(): void {
    Alert.alert(
      'Optimize Storage',
      'This will clear temporary files, app caches, and optimize storage allocation.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Optimize', 
          onPress: () => {
            Alert.alert('Optimization Started', 'Storage optimization is running...');
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

// Custom hook to use the TabStorageController
export const useTabStorageController = () => {
  const [storageData, setStorageData] = useState<TabStorageData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const controller = TabStorageController.getInstance();

  useEffect(() => {
    const data = controller.getTabStorageData();
    setStorageData(data);
  }, []);

  const handleBack = () => {
    controller.handleBack();
  };

  const handleAppPress = (app: AppItem) => {
    controller.handleAppPress(app);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    controller.handleRefresh();
    setTimeout(() => {
      const data = controller.getTabStorageData();
      setStorageData(data);
      setIsRefreshing(false);
    }, 1000);
  };

  const handleOptimizeStorage = () => {
    controller.handleOptimizeStorage();
  };

  return {
    storageData,
    isRefreshing,
    handleBack,
    handleAppPress,
    handleRefresh,
    handleOptimizeStorage,
  };
};