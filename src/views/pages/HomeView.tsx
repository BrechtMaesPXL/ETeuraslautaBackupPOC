import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  IDatabaseItem,
  ISyncState,
  ISyncLogEntry,
  IBackupFile,
} from '../../interfaces/IDatabaseInterfaces';

export interface HomeViewProps {
  title: string;
  subtitle: string;
  activeTab: 'sdcard' | 'sync' | 'database' | 'p2p';
  sdCardAvailable: boolean;
  sdCardPath: string;
  sdCardBackups: IBackupFile[];
  syncState: ISyncState;
  syncLog: ISyncLogEntry[];
  recentItems: IDatabaseItem[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onTabChange: (tab: 'sdcard' | 'sync' | 'database' | 'p2p') => void;
  databaseContent: React.ReactNode;
  p2pContent: React.ReactNode;
}

export const HomeView: React.FC<HomeViewProps> = ({
  title,
  subtitle,
  activeTab,
  sdCardAvailable,
  sdCardPath,
  sdCardBackups,
  syncState,
  syncLog,
  recentItems,
  isRefreshing,
  onRefresh,
  onTabChange,
  databaseContent,
  p2pContent,
}) => {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) {return `${bytes} B`;}
    if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)} KB`;}
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const syncStatusColor =
    syncState.syncStatus === 'synced' ? '#27ae60' :
    syncState.syncStatus === 'syncing' ? '#f39c12' :
    syncState.syncStatus === 'error' ? '#e74c3c' :
    '#95a5a6';

  const syncStatusLabel =
    syncState.syncStatus === 'synced' ? 'Synced' :
    syncState.syncStatus === 'syncing' ? 'Syncing...' :
    syncState.syncStatus === 'error' ? 'Error' :
    'Idle';

  const successCount = syncLog.filter(e => e.success).length;
  const failCount = syncLog.filter(e => !e.success).length;

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
            style={[styles.tab, activeTab === 'sdcard' && styles.activeTab]}
            onPress={() => onTabChange('sdcard')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'sdcard' && styles.activeTabText]}>
              SD Card
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sync' && styles.activeTab]}
            onPress={() => onTabChange('sync')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'sync' && styles.activeTabText]}>
              Sync
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
          <TouchableOpacity
            style={[styles.tab, activeTab === 'p2p' && styles.activeTab]}
            onPress={() => onTabChange('p2p')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'p2p' && styles.activeTabText]}>
              P2P
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'sdcard' ? (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* SD Card Status Card */}
          <View style={[
            styles.statusCard,
            {borderLeftColor: sdCardAvailable ? '#27ae60' : '#e74c3c'},
          ]}>
            <View style={styles.statusCardHeader}>
              <Text style={styles.statusCardTitle}>SD Card</Text>
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

            <View style={styles.statusRow}>
              <View style={[
                styles.statusDot,
                {backgroundColor: sdCardAvailable ? '#27ae60' : '#e74c3c'},
              ]} />
              <Text style={[
                styles.statusText,
                {color: sdCardAvailable ? '#27ae60' : '#e74c3c'},
              ]}>
                {sdCardAvailable ? 'Available' : 'Unavailable'}
              </Text>
            </View>

            {sdCardPath ? (
              <Text style={styles.pathText} numberOfLines={2}>{sdCardPath}</Text>
            ) : null}
          </View>

          {/* Backup Files Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Backup Files on SD Card
              {sdCardBackups.length > 0 ? ` (${sdCardBackups.length})` : ''}
            </Text>
            {!sdCardAvailable ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>SD card not available</Text>
                <Text style={styles.emptySubtext}>
                  Insert an SD card to view backups stored on it
                </Text>
              </View>
            ) : sdCardBackups.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No backups on SD card</Text>
                <Text style={styles.emptySubtext}>
                  Use the Database tab to export a backup to the SD card
                </Text>
              </View>
            ) : (
              sdCardBackups.map(backup => (
                <View key={backup.path} style={styles.backupCard}>
                  <View style={styles.backupHeader}>
                    <Text style={styles.backupFilename} numberOfLines={1}>
                      {backup.filename}
                    </Text>
                    <Text style={styles.backupSize}>{formatBytes(backup.size)}</Text>
                  </View>
                  <Text style={styles.backupMeta}>
                    {formatDate(backup.createdAt)}
                    {backup.metadata ? `  •  ${backup.metadata.itemCount} items` : ''}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>&copy; 2026 eTeuraslauta Storage Manager</Text>
          </View>
        </ScrollView>
      ) : activeTab === 'sync' ? (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Sync Status Card */}
          <View style={styles.syncCard}>
            <View style={styles.syncCardHeader}>
              <Text style={styles.syncCardTitle}>API Sync Status</Text>
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

            <View style={styles.syncStatusRow}>
              <View style={[styles.syncDot, {backgroundColor: syncStatusColor}]} />
              <View style={styles.syncStatusInfo}>
                <Text style={[styles.syncStatusLabel, {color: syncStatusColor}]}>
                  {syncStatusLabel}
                </Text>
                <Text style={styles.syncApiState}>
                  API: {syncState.apiEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
              <View style={styles.syncStatsBox}>
                <Text style={styles.syncStatValue}>
                  {syncState.lastSyncedAt ? formatDate(syncState.lastSyncedAt) : 'Never'}
                </Text>
                <Text style={styles.syncStatLabel}>Last Sync</Text>
              </View>
            </View>

            <View style={styles.syncCounters}>
              <View style={styles.syncCounter}>
                <Text style={[styles.counterValue, {color: '#27ae60'}]}>{successCount}</Text>
                <Text style={styles.counterLabel}>Successful</Text>
              </View>
              <View style={styles.counterDivider} />
              <View style={styles.syncCounter}>
                <Text style={[styles.counterValue, {color: '#e74c3c'}]}>{failCount}</Text>
                <Text style={styles.counterLabel}>Failed</Text>
              </View>
              <View style={styles.counterDivider} />
              <View style={styles.syncCounter}>
                <Text style={[styles.counterValue, {color: '#2c3e50'}]}>{syncLog.length}</Text>
                <Text style={styles.counterLabel}>Total</Text>
              </View>
            </View>
          </View>

          {/* Sync History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sync History</Text>
            {syncLog.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No sync attempts yet</Text>
                <Text style={styles.emptySubtext}>
                  Enable the API in the Database tab and sync will start automatically
                </Text>
              </View>
            ) : (
              syncLog.map(entry => (
                <View
                  key={entry.id}
                  style={[
                    styles.logEntry,
                    {borderLeftColor: entry.success ? '#27ae60' : '#e74c3c'},
                  ]}
                >
                  <View style={styles.logHeader}>
                    <View style={[
                      styles.logBadge,
                      {backgroundColor: entry.success ? '#27ae60' : '#e74c3c'},
                    ]}>
                      <Text style={styles.logBadgeText}>
                        {entry.success ? 'OK' : 'FAIL'}
                      </Text>
                    </View>
                    <Text style={styles.logTime}>{formatDate(entry.timestamp)}</Text>
                  </View>
                  <Text style={styles.logDetail}>
                    {entry.success
                      ? `Synced ${entry.itemCount} item${entry.itemCount !== 1 ? 's' : ''}`
                      : entry.errorMessage ?? 'Unknown error'}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Recent DB Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Latest Database Items</Text>
            {recentItems.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No items in database</Text>
                <Text style={styles.emptySubtext}>
                  Switch to the Database tab to add items
                </Text>
              </View>
            ) : (
              recentItems.map(item => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemIdBadge}>
                      <Text style={styles.itemIdText}>#{item.id}</Text>
                    </View>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  </View>
                  {item.description ? (
                    <Text style={styles.itemDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                  <Text style={styles.itemTimestamp}>
                    Updated: {formatDate(item.updatedAt)}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>&copy; 2026 eTeuraslauta Storage Manager</Text>
          </View>
        </ScrollView>
      ) : activeTab === 'p2p' ? (
        p2pContent
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
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
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  activeTabText: {
    color: '#ffffff',
  },

  // SD Card Status Card
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderLeftWidth: 4,
  },
  statusCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
  },
  pathText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
    fontFamily: 'monospace',
  },

  // Backup card
  backupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  backupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  backupFilename: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    marginRight: 8,
  },
  backupSize: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  backupMeta: {
    fontSize: 12,
    color: '#95a5a6',
  },

  // Sync Status Card
  syncCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  syncCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  syncCardTitle: {
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
  refreshing: {
    opacity: 0.6,
  },
  syncStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  syncDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  syncStatusInfo: {
    flex: 1,
  },
  syncStatusLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  syncApiState: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  syncStatsBox: {
    alignItems: 'flex-end',
  },
  syncStatValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
  },
  syncStatLabel: {
    fontSize: 11,
    color: '#95a5a6',
    marginTop: 2,
  },
  syncCounters: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 16,
  },
  syncCounter: {
    flex: 1,
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  counterLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    marginTop: 4,
  },
  counterDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#ecf0f1',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },

  // Empty state
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#95a5a6',
    fontWeight: '500',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#bdc3c7',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Sync log entries
  logEntry: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  logBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 10,
  },
  logBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  logTime: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  logDetail: {
    fontSize: 13,
    color: '#5d6d7e',
  },

  // Recent items
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#9b59b6',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemIdBadge: {
    backgroundColor: '#9b59b6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  itemIdText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  itemDescription: {
    fontSize: 13,
    color: '#5d6d7e',
    lineHeight: 18,
    marginBottom: 6,
  },
  itemTimestamp: {
    fontSize: 11,
    color: '#95a5a6',
  },

  // Footer
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#95a5a6',
  },
});
