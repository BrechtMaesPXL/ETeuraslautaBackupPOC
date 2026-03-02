import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '../../controllers/hooks/useNavigation';
import { StorageModel } from '../../models/StorageModel';
import { DatabaseModel } from '../../models/DatabaseModel';
import { IDatabaseItem } from '../../interfaces/IDatabaseInterfaces';
import {
  IStorageInfo, 
  IFileItem, 
  IAppItem, 
  ISystemItem 
} from '../../interfaces/IStorageInterfaces';
import { 
  StorageType, 
  NavigationParams, 
  ItemCategoryType 
} from '../../types/StorageTypes';

export interface IStorageViewProps {
  storageType: StorageType;
  title: string;
  params?: NavigationParams;
}

export const StorageView: React.FC<IStorageViewProps> = ({ 
  storageType, 
  title, 
  params 
}) => {
  const { goBack } = useNavigation();
  const [storageInfo, setStorageInfo] = useState<IStorageInfo | null>(null);
  const [files, setFiles] = useState<IFileItem[]>([]);
  const [apps, setApps] = useState<IAppItem[]>([]);
  const [systemItems, setSystemItems] = useState<ISystemItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dbItems, setDbItems] = useState<IDatabaseItem[]>([]);

  const storageModel = StorageModel.getInstance();

  useEffect(() => {
    loadStorageData();
  }, [storageType, params]);

  const loadStorageData = async () => {
    try {
      setLoading(true);

      // Load storage information
      const info = await storageModel.getStorageInfo(storageType);
      setStorageInfo(info);

      if (storageType === 'sd') {
        // For SD storage: show the actual SQLite database contents
        const dbModel = DatabaseModel.getInstance();
        const items = await dbModel.loadItems();
        setDbItems(items);
      } else {
        // Load different item types based on category filter
        const category = params?.category;

        if (!category || category === 'files') {
          const fileItems = await storageModel.getFiles(storageType, params?.path);
          setFiles(fileItems);
        }

        if (!category || category === 'apps') {
          const appItems = await storageModel.getApps(storageType);
          setApps(appItems);
        }

        if (!category || category === 'system') {
          const sysItems = await storageModel.getSystemItems(storageType);
          setSystemItems(sysItems);
        }
      }
    } catch (error) {
      console.error('Error loading storage data:', error);
      Alert.alert('Error', 'Failed to load storage data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStorageData();
    setRefreshing(false);
  };

  const handleFilePress = (file: IFileItem) => {
    Alert.alert(
      file.name,
      `Type: ${file.type}\nSize: ${file.size != null ? formatFileSize(file.size) : '-'}\nModified: ${file.modified}`,
    );
  };

  const handleAppPress = (app: IAppItem) => {
    Alert.alert(
      app.name,
      `Version: ${app.version ?? '-'}\nSize: ${formatFileSize(app.size)}`,
    );
  };

  const handleSystemPress = (item: ISystemItem) => {
    Alert.alert(
      item.name,
      `Type: ${item.type}\\nSize: ${formatFileSize(item.size)}\\nCategory: ${item.category}`
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const renderStorageInfo = () => {
    if (!storageInfo) return null;

    const usedPercentage = (storageInfo.usedSpace / storageInfo.totalSpace) * 100;
    const freeSpace = storageInfo.totalSpace - storageInfo.usedSpace;
    const freePercentage = (freeSpace / storageInfo.totalSpace) * 100;

    return (
      <View style={styles.storageInfoCard}>
        <Text style={styles.storageInfoTitle}>Storage Information</Text>
        <View style={styles.storageBar}>
          <View 
            style={[styles.storageUsed, { width: `${usedPercentage}%` }]} 
          />
          <View 
            style={[styles.storageFree, { width: `${freePercentage}%` }]} 
          />
        </View>
        <View style={styles.storageDetails}>
          <Text style={styles.storageText}>
            Used: {storageInfo.usedSpace.toFixed(1)} GB ({usedPercentage.toFixed(1)}%)
          </Text>
          <Text style={styles.storageText}>
            Free: {freeSpace.toFixed(1)} GB ({freePercentage.toFixed(1)}%)
          </Text>
          <Text style={styles.storageText}>
            Total: {storageInfo.totalSpace.toFixed(1)} GB
          </Text>
        </View>
      </View>
    );
  };

  const renderFileItem = (file: IFileItem, index: number) => (
    <TouchableOpacity
      key={`file-${index}`}
      style={styles.itemCard}
      onPress={() => handleFilePress(file)}
    >
      <Text style={styles.itemTitle}>{file.name}</Text>
      <Text style={styles.itemSubtitle}>{file.size != null ? formatFileSize(file.size) : '-'}</Text>
      <Text style={styles.itemType}>📄 {file.type}</Text>
    </TouchableOpacity>
  );

  const renderAppItem = (app: IAppItem, index: number) => (
    <TouchableOpacity
      key={`app-${index}`}
      style={styles.itemCard}
      onPress={() => handleAppPress(app)}
    >
      <Text style={styles.itemTitle}>{app.name}</Text>
      <Text style={styles.itemSubtitle}>{formatFileSize(app.size)}</Text>
      <Text style={styles.itemType}>📱 v{app.version}</Text>
    </TouchableOpacity>
  );

  const renderSystemItem = (item: ISystemItem, index: number) => (
    <TouchableOpacity
      key={`system-${index}`}
      style={styles.itemCard}
      onPress={() => handleSystemPress(item)}
    >
      <Text style={styles.itemTitle}>{item.name}</Text>
      <Text style={styles.itemSubtitle}>{formatFileSize(item.size)}</Text>
      <Text style={styles.itemType}>⚙️ {item.category}</Text>
    </TouchableOpacity>
  );

  const renderDbSection = () => {
    const formatDate = (dateStr: string) => {
      try {
        return new Date(dateStr).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return dateStr;
      }
    };

    return (
      <View style={styles.section}>
        {/* DB file header */}
        <Text style={styles.sectionTitle}>SQLite Database File</Text>
        <View style={styles.dbFileCard}>
          <View style={styles.dbFileIconContainer}>
            <Text style={styles.dbFileIcon}>🗄️</Text>
          </View>
          <View style={styles.dbFileInfo}>
            <Text style={styles.dbFileName}>eTeuraslauta.db</Text>
            <Text style={styles.dbFileMeta}>{dbItems.length} record{dbItems.length !== 1 ? 's' : ''}</Text>
          </View>
        </View>

        {/* Contents label */}
        <Text style={styles.dbContentsLabel}>
          Contents ({dbItems.length})
        </Text>

        {dbItems.length === 0 ? (
          <View style={styles.dbEmptyBox}>
            <Text style={styles.dbEmptyText}>Database is empty</Text>
            <Text style={styles.dbEmptySubText}>Add items using the Database tab</Text>
          </View>
        ) : (
          dbItems.map(item => (
            <View key={item.id} style={styles.dbItemCard}>
              <View style={styles.dbItemHeader}>
                <View style={styles.dbItemIdBadge}>
                  <Text style={styles.dbItemIdText}>#{item.id}</Text>
                </View>
                <Text style={styles.dbItemName} numberOfLines={1}>{item.name}</Text>
              </View>
              {item.description ? (
                <Text style={styles.dbItemDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : (
                <Text style={styles.dbItemNoDesc}>(no description)</Text>
              )}
              <View style={styles.dbItemTimestamps}>
                <Text style={styles.dbItemTimestamp}>Created: {formatDate(item.createdAt)}</Text>
                <Text style={styles.dbItemTimestamp}>Updated: {formatDate(item.updatedAt)}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderStorageInfo()}

        {storageType === 'sd' ? renderDbSection() : (
          <>
            {files.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Files ({files.length})</Text>
                {files.map(renderFileItem)}
              </View>
            )}

            {apps.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Apps ({apps.length})</Text>
                {apps.map(renderAppItem)}
              </View>
            )}

            {systemItems.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>System ({systemItems.length})</Text>
                {systemItems.map(renderSystemItem)}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  storageInfoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storageInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  storageBar: {
    flexDirection: 'row',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  storageUsed: {
    backgroundColor: '#FF6B6B',
  },
  storageFree: {
    backgroundColor: '#4ECDC4',
  },
  storageDetails: {
    gap: 4,
  },
  storageText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemType: {
    fontSize: 12,
    color: '#888',
  },

  // SQLite database section (SD storage)
  dbFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#9b59b6',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dbFileIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#9b59b6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dbFileIcon: {
    fontSize: 22,
  },
  dbFileInfo: {
    flex: 1,
  },
  dbFileName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2c3e50',
    fontFamily: 'monospace',
  },
  dbFileMeta: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  dbContentsLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dbEmptyBox: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
  },
  dbEmptyText: {
    fontSize: 15,
    color: '#95a5a6',
    marginBottom: 4,
  },
  dbEmptySubText: {
    fontSize: 12,
    color: '#bdc3c7',
    textAlign: 'center',
  },
  dbItemCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#9b59b6',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  dbItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dbItemIdBadge: {
    backgroundColor: '#9b59b6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  dbItemIdText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  dbItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  dbItemDescription: {
    fontSize: 13,
    color: '#5d6d7e',
    lineHeight: 18,
    marginBottom: 6,
  },
  dbItemNoDesc: {
    fontSize: 12,
    color: '#bdc3c7',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  dbItemTimestamps: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 6,
    gap: 2,
  },
  dbItemTimestamp: {
    fontSize: 10,
    color: '#95a5a6',
  },
});