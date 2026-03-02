import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface AppItem {
  id: string;
  name: string;
  type: 'app' | 'data' | 'cache';
  size: number;
  version?: string;
  lastUsed: string;
  icon: string;
}

export interface TabStorageViewProps {
  title: string;
  subtitle: string;
  totalSpace: number;
  usedSpace: number;
  apps: AppItem[];
  onBack: () => void;
  onAppPress: (app: AppItem) => void;
  onRefresh: () => void;
  onOptimizeStorage: () => void;
}

export const TabStorageView: React.FC<TabStorageViewProps> = ({
  title,
  subtitle,
  totalSpace,
  usedSpace,
  apps,
  onBack,
  onAppPress,
  onRefresh,
  onOptimizeStorage,
}) => {
  const freeSpace = totalSpace - usedSpace;
  const usagePercentage = (usedSpace / totalSpace) * 100;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 bytes';
    const k = 1024;
    const sizes = ['bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderAppItem = ({ item }: { item: AppItem }) => (
    <TouchableOpacity
      style={styles.appItem}
      onPress={() => onAppPress(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.appIcon}>{item.icon}</Text>
      <View style={styles.appInfo}>
        <Text style={styles.appName}>{item.name}</Text>
        <View style={styles.appDetails}>
          <Text style={styles.appType}>{item.type.toUpperCase()}</Text>
          <Text style={styles.appSize}> • {formatSize(item.size)}</Text>
          <Text style={styles.appLastUsed}> • {item.lastUsed}</Text>
        </View>
        {item.version && (
          <Text style={styles.appVersion}>v{item.version}</Text>
        )}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Storage Stats */}
      <View style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>📱 Tablet Storage</Text>
          <TouchableOpacity style={styles.optimizeButton} onPress={onOptimizeStorage}>
            <Text style={styles.optimizeText}>Optimize</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${usagePercentage}%` }]} 
            />
          </View>
          <Text style={styles.progressText}>{usagePercentage.toFixed(1)}%</Text>
        </View>

        <View style={styles.spaceInfo}>
          <View style={styles.spaceItem}>
            <Text style={styles.spaceLabel}>Used</Text>
            <Text style={styles.spaceValue}>{usedSpace.toFixed(1)} GB</Text>
          </View>
          <View style={styles.spaceItem}>
            <Text style={styles.spaceLabel}>Free</Text>
            <Text style={styles.spaceValue}>{freeSpace.toFixed(1)} GB</Text>
          </View>
          <View style={styles.spaceItem}>
            <Text style={styles.spaceLabel}>Total</Text>
            <Text style={styles.spaceValue}>{totalSpace.toFixed(1)} GB</Text>
          </View>
        </View>
      </View>

      {/* Apps List */}
      <View style={styles.appsSection}>
        <Text style={styles.sectionTitle}>Apps & Data</Text>
        <FlatList
          data={apps}
          renderItem={renderAppItem}
          keyExtractor={(item) => item.id}
          style={styles.appsList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  backIcon: {
    fontSize: 24,
    color: '#495057',
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    fontSize: 18,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  optimizeButton: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  optimizeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f39c12',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    minWidth: 40,
  },
  spaceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spaceItem: {
    alignItems: 'center',
  },
  spaceLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  spaceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  appsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  appsList: {
    flex: 1,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  appIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
    textAlign: 'center',
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  appDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  appType: {
    fontSize: 12,
    color: '#f39c12',
    fontWeight: '600',
  },
  appSize: {
    fontSize: 12,
    color: '#6c757d',
  },
  appLastUsed: {
    fontSize: 12,
    color: '#6c757d',
  },
  appVersion: {
    fontSize: 11,
    color: '#adb5bd',
  },
  chevron: {
    fontSize: 20,
    color: '#adb5bd',
  },
});