import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { NavigationController } from './NavigationController';

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modified: string;
  icon: string;
}

export interface SDStorageData {
  title: string;
  subtitle: string;
  totalSpace: number;
  usedSpace: number;
  files: FileItem[];
}

export class SDStorageController {
  private static instance: SDStorageController;
  private navigationController = NavigationController.getInstance();

  public static getInstance(): SDStorageController {
    if (!SDStorageController.instance) {
      SDStorageController.instance = new SDStorageController();
    }
    return SDStorageController.instance;
  }

  public getSDStorageData(): SDStorageData {
    return {
      title: 'SD Card Storage',
      subtitle: 'External removable storage',
      totalSpace: 32.0,
      usedSpace: 18.5,
      files: [
        {
          id: '1',
          name: 'DCIM',
          type: 'folder',
          modified: '2 hours ago',
          icon: '📁',
        },
        {
          id: '2',
          name: 'Photos',
          type: 'folder',
          modified: '1 day ago',
          icon: '📸',
        },
        {
          id: '3',
          name: 'Videos',
          type: 'folder',
          modified: '3 days ago',
          icon: '🎬',
        },
        {
          id: '4',
          name: 'backup_data.zip',
          type: 'file',
          size: 1024 * 1024 * 150, // 150 MB
          modified: '1 week ago',
          icon: '📦',
        },
        {
          id: '5',
          name: 'Documents',
          type: 'folder',
          modified: '2 weeks ago',
          icon: '📄',
        },
        {
          id: '6',
          name: 'music_collection.mp3',
          type: 'file',
          size: 1024 * 1024 * 85, // 85 MB
          modified: '3 weeks ago',
          icon: '🎵',
        },
      ],
    };
  }

  public handleBack(): void {
    const canGoBack = this.navigationController.goBack();
    if (!canGoBack) {
      // Fallback to home if can't go back
      this.navigationController.navigateToHome();
    }
  }

  public handleFilePress(file: FileItem): void {
    console.log(`File pressed: ${file.name}`);
    
    if (file.type === 'folder') {
      Alert.alert(
        `Open ${file.name}`,
        `Browse contents of ${file.name} folder?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open', 
            onPress: () => {
              // TODO: Implement folder navigation
              console.log(`Opening folder: ${file.name}`);
              Alert.alert('Folder Opened', `Browsing ${file.name} folder contents...`);
            }
          },
        ]
      );
    } else {
      Alert.alert(
        `Open ${file.name}`,
        `File size: ${this.formatBytes(file.size || 0)}\\nModified: ${file.modified}\\n\\nWhat would you like to do?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open', 
            onPress: () => {
              console.log(`Opening file: ${file.name}`);
              Alert.alert('File Opened', `Opening ${file.name}...`);
            }
          },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => this.handleDeleteFile(file)
          },
        ]
      );
    }
  }

  private handleDeleteFile(file: FileItem): void {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete ${file.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement actual file deletion
            console.log(`Deleting file: ${file.name}`);
            Alert.alert('File Deleted', `${file.name} has been deleted.`);
          }
        },
      ]
    );
  }

  public handleRefresh(): void {
    console.log('Refreshing SD storage data...');
    // TODO: Implement actual refresh logic
  }

  public handleManageStorage(): void {
    Alert.alert(
      'SD Card Management',
      'Choose a management option:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Format SD Card', 
          style: 'destructive',
          onPress: () => this.handleFormatSD()
        },
        { 
          text: 'Safely Remove', 
          onPress: () => this.handleSafelyRemove()
        },
        { 
          text: 'Properties', 
          onPress: () => this.showSDProperties()
        },
      ]
    );
  }

  private handleFormatSD(): void {
    Alert.alert(
      'Format SD Card',
      'WARNING: This will erase all data on the SD card. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Format', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement actual format logic
            console.log('Formatting SD card...');
            Alert.alert('Formatting Started', 'SD card is being formatted...');
          }
        },
      ]
    );
  }

  private handleSafelyRemove(): void {
    Alert.alert(
      'Safely Remove SD Card',
      'The SD card is now safe to remove from your device.',
      [{ text: 'OK' }]
    );
  }

  private showSDProperties(): void {
    const data = this.getSDStorageData();
    const freeSpace = data.totalSpace - data.usedSpace;
    
    Alert.alert(
      'SD Card Properties',
      `Name: SD Card\\nFile System: FAT32\\nTotal Space: ${data.totalSpace} GB\\nUsed Space: ${data.usedSpace} GB\\nFree Space: ${freeSpace.toFixed(1)} GB\\nStatus: Mounted\\nWrite Protection: Disabled`,
      [{ text: 'OK' }]
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

// Custom hook to use the SDStorageController
export const useSDStorageController = () => {
  const [storageData, setStorageData] = useState<SDStorageData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const controller = SDStorageController.getInstance();

  useEffect(() => {
    const data = controller.getSDStorageData();
    setStorageData(data);
  }, []);

  const handleBack = () => {
    controller.handleBack();
  };

  const handleFilePress = (file: FileItem) => {
    controller.handleFilePress(file);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    controller.handleRefresh();
    // Simulate refresh delay
    setTimeout(() => {
      const data = controller.getSDStorageData();
      setStorageData(data);
      setIsRefreshing(false);
    }, 1000);
  };

  const handleManageStorage = () => {
    controller.handleManageStorage();
  };

  return {
    storageData,
    isRefreshing,
    handleBack,
    handleFilePress,
    handleRefresh,
    handleManageStorage,
  };
};