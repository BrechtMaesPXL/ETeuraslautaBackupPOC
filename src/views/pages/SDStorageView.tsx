import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modified: string;
  icon: string;
}

export interface SDStorageViewProps {
  title: string;
  subtitle: string;
  totalSpace: number;
  usedSpace: number;
  files: FileItem[];
  onBack: () => void;
  onFilePress: (file: FileItem) => void;
  onRefresh: () => void;
  onManageStorage: () => void;
}

export const SDStorageView: React.FC<SDStorageViewProps> = ({
  title,
  subtitle,
  totalSpace,
  usedSpace,
  files,
  onBack,
  onFilePress,
  onRefresh,
  onManageStorage,
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

  const renderFileItem = ({ item }: { item: FileItem }) => (
    <TouchableOpacity
      style={styles.fileItem}
      onPress={() => onFilePress(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.fileIcon}>{item.icon}</Text>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName}>{item.name}</Text>
        <View style={styles.fileDetails}>
          <Text style={styles.fileType}>{item.type.toUpperCase()}</Text>
          {item.size && (
            <Text style={styles.fileSize}> • {formatSize(item.size)}</Text>
          )}
          <Text style={styles.fileModified}> • {item.modified}</Text>
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
          <Text style={styles.statsTitle}>💾 Storage Statistics</Text>
          <TouchableOpacity style={styles.manageButton} onPress={onManageStorage}>
            <Text style={styles.manageText}>Manage</Text>
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

      {/* Files List */}
      <View style={styles.filesSection}>
        <Text style={styles.sectionTitle}>Files & Folders</Text>
        <FlatList
          data={files}
          renderItem={renderFileItem}
          keyExtractor={(item) => item.id}
          style={styles.filesList}
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
  manageButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  manageText: {
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
    backgroundColor: '#e74c3c',
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
  filesSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  filesList: {
    flex: 1,
  },
  fileItem: {
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
  fileIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
    textAlign: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  fileDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileType: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: '600',
  },
  fileSize: {
    fontSize: 12,
    color: '#6c757d',
  },
  fileModified: {
    fontSize: 12,
    color: '#6c757d',
  },
  chevron: {
    fontSize: 20,
    color: '#adb5bd',
  },
});