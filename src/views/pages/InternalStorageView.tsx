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

export interface SystemItem {
  id: string;
  name: string;
  type: 'system' | 'user' | 'temp';
  size: number;
  category: string;
  critical: boolean;
  icon: string;
}

export interface InternalStorageViewProps {
  title: string;
  subtitle: string;
  totalSpace: number;
  usedSpace: number;
  systemItems: SystemItem[];
  onBack: () => void;
  onSystemItemPress: (item: SystemItem) => void;
  onRefresh: () => void;
  onSystemCleanup: () => void;
}

export const InternalStorageView: React.FC<InternalStorageViewProps> = ({
  title,
  subtitle,
  totalSpace,
  usedSpace,
  systemItems,
  onBack,
  onSystemItemPress,
  onRefresh,
  onSystemCleanup,
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

  const renderSystemItem = ({ item }: { item: SystemItem }) => (
    <TouchableOpacity
      style={[
        styles.systemItem,
        item.critical && styles.criticalItem,
      ]}
      onPress={() => onSystemItemPress(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.systemIcon}>{item.icon}</Text>
      <View style={styles.systemInfo}>
        <View style={styles.systemHeader}>
          <Text style={styles.systemName}>{item.name}</Text>
          {item.critical && (
            <Text style={styles.criticalBadge}>CRITICAL</Text>
          )}
        </View>
        <View style={styles.systemDetails}>
          <Text style={styles.systemCategory}>{item.category}</Text>
          <Text style={styles.systemType}> • {item.type.toUpperCase()}</Text>
          <Text style={styles.systemSize}> • {formatSize(item.size)}</Text>
        </View>
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
          <Text style={styles.statsTitle}>💻 System Storage</Text>
          <TouchableOpacity style={styles.cleanupButton} onPress={onSystemCleanup}>
            <Text style={styles.cleanupText}>Cleanup</Text>
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

        {usagePercentage > 85 && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>⚠️ Low storage space - consider cleanup</Text>
          </View>
        )}
      </View>

      {/* System Items List */}
      <View style={styles.systemSection}>
        <Text style={styles.sectionTitle}>System Components</Text>
        <FlatList
          data={systemItems}
          renderItem={renderSystemItem}
          keyExtractor={(item) => item.id}
          style={styles.systemList}
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
  cleanupButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cleanupText: {
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
    backgroundColor: '#27ae60',
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
  warningBanner: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: '600',
  },
  systemSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  systemList: {
    flex: 1,
  },
  systemItem: {
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
  criticalItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  systemIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
    textAlign: 'center',
  },
  systemInfo: {
    flex: 1,
  },
  systemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  systemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  criticalBadge: {
    fontSize: 10,
    color: '#dc3545',
    backgroundColor: '#f8d7da',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '700',
  },
  systemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  systemCategory: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '600',
  },
  systemType: {
    fontSize: 12,
    color: '#6c757d',
  },
  systemSize: {
    fontSize: 12,
    color: '#6c757d',
  },
  chevron: {
    fontSize: 20,
    color: '#adb5bd',
  },
});