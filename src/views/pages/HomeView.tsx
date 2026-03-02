import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

export interface StorageInfo {
  id: string;
  name: string;
  type: 'sd' | 'tab' | 'internal';
  totalSpace: number; // in GB
  usedSpace: number; // in GB
  status: 'available' | 'unavailable' | 'full';
  icon: string;
  lastAccessed?: string;
  permissions?: 'read' | 'read-write' | 'restricted';
}

export interface HomeViewProps {
  title: string;
  subtitle: string;
  storageData: StorageInfo[];
  selectedStorageId: string | null;
  isRefreshing: boolean;
  activeTab: 'storage' | 'database';
  onStoragePress: (storageId: string) => void;
  onRefresh: () => void;
  onCleanStorage: (storageId: string) => void;
  onBackupStorage: (storageId: string) => void;
  onTabChange: (tab: 'storage' | 'database') => void;
  databaseContent: React.ReactNode;
}

export const HomeView: React.FC<HomeViewProps> = ({
  title,
  subtitle,
  storageData,
  selectedStorageId,
  isRefreshing,
  activeTab,
  onStoragePress,
  onRefresh,
  onCleanStorage,
  onBackupStorage,
  onTabChange,
  databaseContent,
}) => {
  const getStorageColor = (type: string) => {
    switch (type) {
      case 'sd':
        return '#e74c3c'; // Red for SD
      case 'tab':
        return '#f39c12'; // Orange for Tab
      case 'internal':
        return '#27ae60'; // Green for Internal
      default:
        return '#95a5a6';
    }
  };

  const getProgressPercentage = (used: number, total: number) => {
    return total > 0 ? (used / total) * 100 : 0;
  };

  const formatStorage = (size: number) => {
    return `${size.toFixed(1)} GB`;
  };

  const renderStorageCard = (storage: StorageInfo) => {
    const progressPercentage = getProgressPercentage(storage.usedSpace, storage.totalSpace);
    const freeSpace = storage.totalSpace - storage.usedSpace;
    const storageColor = getStorageColor(storage.type);
    const isSelected = selectedStorageId === storage.id;
    const isNearlyFull = progressPercentage > 90;

    return (
      <TouchableOpacity
        key={storage.id}
        style={[
          styles.storageCard,
          isSelected && styles.storageCardSelected,
          isNearlyFull && styles.storageCardWarning,
          { borderLeftColor: storageColor }
        ]}
        onPress={() => onStoragePress(storage.id)}
        activeOpacity={0.6}
        disabled={storage.status === 'unavailable'}
      >
        <View style={styles.storageHeader}>
          <View style={[styles.storageIconContainer, { backgroundColor: storageColor }]}>
            <Text style={styles.storageIcon}>{storage.icon}</Text>
          </View>
          <View style={styles.storageInfo}>
            <Text style={styles.storageName}>{storage.name}</Text>
            <View style={styles.statusContainer}>
              <Text style={[styles.storageStatus, { 
                color: storage.status === 'available' ? '#27ae60' : 
                      storage.status === 'full' ? '#e74c3c' : '#95a5a6' 
              }]}>
                {storage.status.charAt(0).toUpperCase() + storage.status.slice(1)}
              </Text>
              {storage.lastAccessed && (
                <Text style={styles.lastAccessed}>• {storage.lastAccessed}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.storageDetails}>
          <View style={styles.storageSpaceInfo}>
            <Text style={styles.usedSpace}>
              Used: {formatStorage(storage.usedSpace)}
            </Text>
            <Text style={styles.freeSpace}>
              Free: {formatStorage(freeSpace)}
            </Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${progressPercentage}%`,
                    backgroundColor: isNearlyFull ? '#e74c3c' : storageColor
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, isNearlyFull && styles.warningText]}>
              {progressPercentage.toFixed(0)}%
            </Text>
          </View>

          <View style={styles.storageFooter}>
            <Text style={styles.totalSpace}>
              Total: {formatStorage(storage.totalSpace)}
            </Text>
            {storage.permissions && (
              <Text style={styles.permissions}>
                {storage.permissions.toUpperCase()}
              </Text>
            )}
          </View>
          
          {isNearlyFull && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>⚠️ Storage Nearly Full</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.rootContainer}>
        {/* Header Section */}
        <View style={styles.headerWrapper}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {/* Tab Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'storage' && styles.activeTab]}
              onPress={() => onTabChange('storage')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'storage' && styles.activeTabText]}>
                Storage
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'database' && styles.activeTab]}
              onPress={() => onTabChange('database')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'database' && styles.activeTabText]}>
                Database
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {activeTab === 'storage' ? (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Storage Overview Card */}
            <View style={styles.overviewCard}>
              <View style={styles.overviewHeader}>
                <Text style={styles.overviewTitle}>Storage Overview</Text>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={onRefresh}
                  activeOpacity={0.7}
                  disabled={isRefreshing}
                >
                  <Text style={[styles.refreshIcon, isRefreshing && styles.refreshing]}>
                    {isRefreshing ? '\u23F3' : '\uD83D\uDD04'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.overviewText}>
                Manage your device storage across different locations
              </Text>
            </View>

            {/* Storage Components Section */}
            <View style={styles.storageSection}>
              <Text style={styles.sectionTitle}>Storage Locations</Text>
              <View style={styles.storageGrid}>
                {storageData.map(renderStorageCard)}
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={() => {
                    const availableStorage = storageData.find(s => s.status === 'available');
                    if (availableStorage) {
                      onCleanStorage(availableStorage.id);
                    }
                  }}
                >
                  <Text style={styles.primaryButtonText}>Clean Storage</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={() => {
                    const availableStorage = storageData.find(s => s.status === 'available');
                    if (availableStorage) {
                      onBackupStorage(availableStorage.id);
                    }
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Backup Data</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>&copy; 2026 eTeuraslauta Storage Manager</Text>
            </View>
          </ScrollView>
        ) : (
          databaseContent
        )}
      </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerWrapper: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
  },
  overviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    fontSize: 18,
  },
  overviewText: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  storageSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 20,
  },
  storageGrid: {
    gap: 16,
  },
  storageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
    transform: [{ scale: 1 }],
  },
  storageCardSelected: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.2,
    elevation: 8,
    backgroundColor: '#f8f9fa',
  },
  storageCardWarning: {
    borderLeftColor: '#e74c3c',
    backgroundColor: '#fdf2f2',
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  storageIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  storageIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  storageInfo: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  storageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  storageStatus: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  lastAccessed: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  storageDetails: {
    gap: 12,
  },
  storageSpaceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usedSpace: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '500',
  },
  freeSpace: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '500',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5d6d7e',
    minWidth: 35,
  },
  storageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalSpace: {
    fontSize: 14,
    color: '#5d6d7e',
    fontWeight: '500',
  },
  permissions: {
    fontSize: 11,
    color: '#95a5a6',
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  warningBanner: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#e74c3c',
  },
  warningText: {
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  refreshing: {
    opacity: 0.6,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#3498db',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  activeTabText: {
    color: '#ffffff',
  },
  quickActions: {
    marginBottom: 30,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3498db',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3498db',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#95a5a6',
  },
});