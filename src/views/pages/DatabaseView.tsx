import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {
  IDatabaseItem,
  IBackupFile,
  IBackupData,
  BackupDestination,
} from '../../interfaces/IDatabaseInterfaces';

export interface DatabaseViewProps {
  items: IDatabaseItem[];
  backups: IBackupFile[];
  isLoading: boolean;
  isRefreshing: boolean;
  isBackingUp: boolean;
  isRestoring: boolean;
  isLoadingPreview: boolean;
  editingItem: IDatabaseItem | null;
  showAddForm: boolean;
  showBackups: boolean;
  sdCardAvailable: boolean | null;
  sdCardPath: string;
  previewBackup: IBackupData | null;
  onSetShowAddForm: (show: boolean) => void;
  onSetEditingItem: (item: IDatabaseItem | null) => void;
  onRefresh: () => void;
  onAddItem: (name: string, description: string) => void;
  onUpdateItem: (id: number, name: string, description: string) => void;
  onItemPress: (item: IDatabaseItem) => void;
  onExportBackup: () => void;
  onShowBackups: () => void;
  onHideBackups: () => void;
  onPreviewBackup: (backup: IBackupFile) => void;
  onHidePreview: () => void;
  onRestoreBackup: (backup: IBackupFile) => void;
  onDeleteBackup: (backup: IBackupFile) => void;
}

// ─── Item Form Modal ─────────────────────────────────────────────────────────

const ItemFormModal: React.FC<{
  visible: boolean;
  title: string;
  initialName?: string;
  initialDescription?: string;
  onSubmit: (name: string, description: string) => void;
  onCancel: () => void;
}> = ({visible, title, initialName = '', initialDescription = '', onSubmit, onCancel}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  React.useEffect(() => {
    if (visible) {
      setName(initialName);
      setDescription(initialDescription);
    }
  }, [visible, initialName, initialDescription]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>

          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="Enter item name"
            placeholderTextColor="#95a5a6"
            autoFocus
          />

          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter item description"
            placeholderTextColor="#95a5a6"
            multiline
            numberOfLines={3}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton]}
              onPress={() => onSubmit(name, description)}>
              <Text style={styles.submitButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Backup Preview Modal ─────────────────────────────────────────────────────

const BackupPreviewModal: React.FC<{
  data: IBackupData | null;
  isLoading: boolean;
  onClose: () => void;
}> = ({data, isLoading, onClose}) => {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric',
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

  const visible = isLoading || data !== null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.previewOverlay}>
        <View style={styles.previewPanel}>
          {/* Header */}
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Backup Preview</Text>
            <TouchableOpacity
              style={styles.previewCloseButton}
              onPress={onClose}>
              <Text style={styles.previewCloseText}>Close</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.previewLoadingBox}>
              <ActivityIndicator size="large" color="#3498db" />
              <Text style={styles.previewLoadingText}>Reading backup file...</Text>
            </View>
          ) : data ? (
            <ScrollView
              style={styles.previewScroll}
              showsVerticalScrollIndicator={false}>

              {/* Metadata Section */}
              <View style={styles.previewSection}>
                <Text style={styles.previewSectionTitle}>Metadata</Text>
                <View style={styles.metaTable}>
                  <MetaRow label="Timestamp" value={formatDate(data.metadata.timestamp)} />
                  <MetaRow label="Item Count" value={String(data.metadata.itemCount)} highlight />
                  <MetaRow label="App Version" value={`v${data.metadata.appVersion}`} />
                  <MetaRow label="Format Version" value={data.metadata.formatVersion} />
                  <MetaRow label="DB Version" value={String(data.metadata.databaseVersion)} />
                  <MetaRow label="Device" value={data.metadata.deviceInfo} last />
                </View>
              </View>

              {/* Items Section */}
              <View style={styles.previewSection}>
                <Text style={styles.previewSectionTitle}>
                  Items ({data.items.length})
                </Text>
                {data.items.length === 0 ? (
                  <View style={styles.previewEmptyItems}>
                    <Text style={styles.previewEmptyText}>No items in this backup</Text>
                  </View>
                ) : (
                  data.items.map((item, index) => (
                    <View
                      key={item.id}
                      style={[
                        styles.previewItemCard,
                        index === data.items.length - 1 && styles.previewItemCardLast,
                      ]}>
                      <View style={styles.previewItemHeader}>
                        <View style={styles.previewItemIdBadge}>
                          <Text style={styles.previewItemIdText}>#{item.id}</Text>
                        </View>
                        <Text style={styles.previewItemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </View>
                      {item.description ? (
                        <Text style={styles.previewItemDescription}>
                          {item.description}
                        </Text>
                      ) : (
                        <Text style={styles.previewItemNoDesc}>(no description)</Text>
                      )}
                      <View style={styles.previewItemMeta}>
                        <Text style={styles.previewItemMetaText}>
                          Created: {formatDate(item.createdAt)}
                        </Text>
                        <Text style={styles.previewItemMetaText}>
                          Updated: {formatDate(item.updatedAt)}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const MetaRow: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
  last?: boolean;
}> = ({label, value, highlight, last}) => (
  <View style={[styles.metaRow, !last && styles.metaRowBorder]}>
    <Text style={styles.metaLabel}>{label}</Text>
    <Text style={[styles.metaValue, highlight && styles.metaValueHighlight]}>
      {value}
    </Text>
  </View>
);

// ─── Main View ────────────────────────────────────────────────────────────────

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  items,
  backups,
  isLoading,
  isRefreshing,
  isBackingUp,
  isRestoring,
  isLoadingPreview,
  editingItem,
  showAddForm,
  showBackups,
  sdCardAvailable,
  sdCardPath,
  previewBackup,
  onSetShowAddForm,
  onSetEditingItem,
  onRefresh,
  onAddItem,
  onUpdateItem,
  onItemPress,
  onExportBackup,
  onShowBackups,
  onHideBackups,
  onPreviewBackup,
  onHidePreview,
  onRestoreBackup,
  onDeleteBackup,
}) => {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const sdStatusColor =
    sdCardAvailable === null ? '#95a5a6' : sdCardAvailable ? '#27ae60' : '#e74c3c';
  const sdStatusLabel =
    sdCardAvailable === null ? 'Checking...' : sdCardAvailable ? 'Available' : 'Unavailable';
  const sdStatusIcon =
    sdCardAvailable === null ? '...' : sdCardAvailable ? 'OK' : 'OFF';

  const renderItem = ({item}: {item: IDatabaseItem}) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => onItemPress(item)}
      activeOpacity={0.6}>
      <View style={styles.itemHeader}>
        <View style={styles.itemIconContainer}>
          <Text style={styles.itemIcon}>{'{'}</Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.itemId}>ID: {item.id}</Text>
        </View>
      </View>
      {item.description ? (
        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
      <View style={styles.itemTimestamps}>
        <Text style={styles.timestamp}>Created: {formatDate(item.createdAt)}</Text>
        <Text style={styles.timestamp}>Updated: {formatDate(item.updatedAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderBackupItem = ({item}: {item: IBackupFile}) => {
    const locationLabel: Record<BackupDestination, string> = {
      sd: 'SD Card',
      internal: 'Internal',
    };
    const locationColor: Record<BackupDestination, string> = {
      sd: '#27ae60',
      internal: '#2980b9',
    };
    const loc = item.location;
    return (
    <View style={styles.backupCard}>
      <View style={styles.backupInfo}>
        <View style={styles.backupFilenameRow}>
          <Text style={styles.backupFilename} numberOfLines={1}>
            {item.filename}
          </Text>
          {loc && (
            <View style={[styles.locationBadge, {backgroundColor: locationColor[loc]}]}>
              <Text style={styles.locationBadgeText}>{locationLabel[loc]}</Text>
            </View>
          )}
        </View>
        <Text style={styles.backupMeta}>
          {formatFileSize(item.size)} &bull; {formatDate(item.createdAt)}
        </Text>
        {item.metadata && (
          <View style={styles.backupMetaBadgeRow}>
            <View style={styles.backupMetaBadge}>
              <Text style={styles.backupMetaBadgeText}>
                {item.metadata.itemCount} items
              </Text>
            </View>
            <View style={styles.backupMetaBadge}>
              <Text style={styles.backupMetaBadgeText}>
                v{item.metadata.appVersion}
              </Text>
            </View>
            <View style={styles.backupMetaBadge}>
              <Text style={styles.backupMetaBadgeText}>
                fmt {item.metadata.formatVersion}
              </Text>
            </View>
          </View>
        )}
      </View>
      <View style={styles.backupActions}>
        <TouchableOpacity
          style={styles.previewButton}
          onPress={() => onPreviewBackup(item)}>
          <Text style={styles.previewButtonText}>Preview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={() => onRestoreBackup(item)}>
          <Text style={styles.restoreButtonText}>Restore</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBackupButton}
          onPress={() => onDeleteBackup(item)}>
          <Text style={styles.deleteBackupButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9b59b6" />
        <Text style={styles.loadingText}>Loading database...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Stats & SD Card Status Card */}
      <View style={styles.statsCard}>
        {/* Row 1: DB stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{items.length}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>SQLite</Text>
            <Text style={styles.statLabel}>Engine</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{backups.length > 0 ? backups.length : '-'}</Text>
            <Text style={styles.statLabel}>Backups</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.cardDivider} />

        {/* Row 2: SD card status */}
        <View style={styles.sdStatusRow}>
          <View style={styles.sdStatusLeft}>
            <View style={[styles.sdStatusBadge, {backgroundColor: sdStatusColor}]}>
              <Text style={styles.sdStatusBadgeText}>{sdStatusIcon}</Text>
            </View>
            <View style={styles.sdStatusInfo}>
              <Text style={[styles.sdStatusLabel, {color: sdStatusColor}]}>
                SD Card: {sdStatusLabel}
              </Text>
              {sdCardPath ? (
                <Text style={styles.sdCardPath} numberOfLines={2}>
                  {sdCardPath}
                </Text>
              ) : null}
            </View>
          </View>
          <TouchableOpacity
            style={styles.sdCheckButton}
            onPress={onRefresh}
            disabled={isRefreshing}>
            <Text style={styles.sdCheckButtonText}>
              {isRefreshing ? '...' : 'Check'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => onSetShowAddForm(true)}>
          <Text style={styles.addButtonText}>+ Add Item</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.refreshActionButton}
          onPress={onRefresh}
          disabled={isRefreshing}>
          <Text style={styles.refreshActionText}>
            {isRefreshing ? 'Loading...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>{'{ }'}</Text>
          <Text style={styles.emptyTitle}>No Items Yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap "Add Item" to create your first database entry
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Backup & Restore Section */}
      <View style={styles.backupSection}>
        <Text style={styles.backupSectionTitle}>Backup & Restore</Text>

        <View style={styles.backupButtons}>
          <TouchableOpacity
            style={[
              styles.backupButton,
              styles.exportButton,
              (sdCardAvailable !== true) && styles.disabledButton,
            ]}
            onPress={onExportBackup}
            disabled={isBackingUp || sdCardAvailable !== true}>
            <Text style={styles.exportButtonText}>
              {isBackingUp ? 'Exporting...' : 'Export to SD'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.backupButton, styles.viewBackupsButton]}
            onPress={showBackups ? onHideBackups : onShowBackups}>
            <Text style={styles.viewBackupsButtonText}>
              {showBackups ? 'Hide Backups' : 'View Backups'}
            </Text>
          </TouchableOpacity>
        </View>

        {sdCardAvailable !== true && (
          <View style={styles.sdWarningBanner}>
            <Text style={styles.sdWarningText}>
              {sdCardAvailable === null
                ? 'Checking SD card availability...'
                : 'SD card is not available. Backup export is disabled.'}
            </Text>
          </View>
        )}

        {isRestoring && (
          <View style={styles.restoringBanner}>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={styles.restoringText}>Restoring backup...</Text>
          </View>
        )}

        {showBackups && (
          <View style={styles.backupList}>
            {backups.length === 0 ? (
              <View style={styles.noBackupsBox}>
                <Text style={styles.noBackupsText}>
                  No backups found on SD card
                </Text>
                <Text style={styles.noBackupsSubText}>
                  {sdCardPath || 'SD card path unavailable'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={backups}
                renderItem={renderBackupItem}
                keyExtractor={item => item.filename}
                scrollEnabled={false}
              />
            )}
          </View>
        )}
      </View>

      {/* Add Item Modal */}
      <ItemFormModal
        visible={showAddForm}
        title="Add New Item"
        onSubmit={onAddItem}
        onCancel={() => onSetShowAddForm(false)}
      />

      {/* Edit Item Modal */}
      <ItemFormModal
        visible={editingItem !== null}
        title="Edit Item"
        initialName={editingItem?.name ?? ''}
        initialDescription={editingItem?.description ?? ''}
        onSubmit={(name, description) => {
          if (editingItem) {
            onUpdateItem(editingItem.id, name, description);
          }
        }}
        onCancel={() => onSetEditingItem(null)}
      />

      {/* Backup Preview Modal */}
      <BackupPreviewModal
        data={previewBackup}
        isLoading={isLoadingPreview}
        onClose={onHidePreview}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7f8c8d',
  },

  // Stats card
  statsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#9b59b6',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#ecf0f1',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#ecf0f1',
    marginVertical: 16,
  },

  // SD card status row
  sdStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sdStatusLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  sdStatusBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sdStatusBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  sdStatusInfo: {
    flex: 1,
  },
  sdStatusLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  sdCardPath: {
    fontSize: 11,
    color: '#7f8c8d',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  sdCheckButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bdc3c7',
    marginLeft: 12,
  },
  sdCheckButtonText: {
    fontSize: 13,
    color: '#5d6d7e',
    fontWeight: '600',
  },

  // Action bar
  actionBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#9b59b6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshActionButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9b59b6',
    alignItems: 'center',
  },
  refreshActionText: {
    color: '#9b59b6',
    fontSize: 16,
    fontWeight: '600',
  },

  // Items list
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: '#9b59b6',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9b59b6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemIcon: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '700',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  itemId: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 2,
  },
  itemDescription: {
    fontSize: 14,
    color: '#5d6d7e',
    lineHeight: 20,
    marginBottom: 8,
  },
  itemTimestamps: {
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 8,
    gap: 2,
  },
  timestamp: {
    fontSize: 11,
    color: '#95a5a6',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    color: '#bdc3c7',
    marginBottom: 16,
    fontWeight: '300',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Backup section
  backupSection: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  backupSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  backupButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backupButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  exportButton: {
    backgroundColor: '#27ae60',
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  viewBackupsButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3498db',
  },
  viewBackupsButtonText: {
    color: '#3498db',
    fontSize: 15,
    fontWeight: '600',
  },
  sdWarningBanner: {
    backgroundColor: '#fef9e7',
    borderLeftWidth: 3,
    borderLeftColor: '#f39c12',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  sdWarningText: {
    color: '#d68910',
    fontSize: 13,
    fontWeight: '500',
  },
  restoringBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f39c12',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  restoringText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  backupList: {
    marginTop: 16,
  },
  noBackupsBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  noBackupsText: {
    textAlign: 'center',
    color: '#95a5a6',
    fontSize: 14,
    marginBottom: 4,
  },
  noBackupsSubText: {
    textAlign: 'center',
    color: '#bdc3c7',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  backupCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  backupInfo: {
    marginBottom: 12,
  },
  backupFilenameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  locationBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  locationBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  backupFilename: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
    fontFamily: 'monospace',
    flexShrink: 1,
  },
  backupMeta: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  backupMetaBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  backupMetaBadge: {
    backgroundColor: '#eaf4fd',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  backupMetaBadgeText: {
    fontSize: 11,
    color: '#2980b9',
    fontWeight: '600',
  },
  backupActions: {
    flexDirection: 'row',
    gap: 8,
  },
  previewButton: {
    flex: 1,
    backgroundColor: '#8e44ad',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  restoreButton: {
    flex: 1,
    backgroundColor: '#3498db',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteBackupButton: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e74c3c',
    alignItems: 'center',
  },
  deleteBackupButtonText: {
    color: '#e74c3c',
    fontSize: 13,
    fontWeight: '600',
  },

  // Item form modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5d6d7e',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ecf0f1',
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#9b59b6',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Backup preview modal
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  previewPanel: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  previewCloseButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#ecf0f1',
  },
  previewCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5d6d7e',
  },
  previewLoadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  previewLoadingText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  previewScroll: {
    flex: 1,
    paddingHorizontal: 24,
  },
  previewSection: {
    marginTop: 20,
    marginBottom: 8,
  },
  previewSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metaTable: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  metaRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  metaLabel: {
    fontSize: 13,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 13,
    color: '#2c3e50',
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  metaValueHighlight: {
    color: '#9b59b6',
    fontSize: 15,
  },

  // Preview item cards
  previewEmptyItems: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  previewEmptyText: {
    fontSize: 14,
    color: '#95a5a6',
  },
  previewItemCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#9b59b6',
  },
  previewItemCardLast: {
    marginBottom: 24,
  },
  previewItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewItemIdBadge: {
    backgroundColor: '#9b59b6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 10,
  },
  previewItemIdText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  previewItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  previewItemDescription: {
    fontSize: 14,
    color: '#5d6d7e',
    lineHeight: 20,
    marginBottom: 10,
  },
  previewItemNoDesc: {
    fontSize: 13,
    color: '#bdc3c7',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  previewItemMeta: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 8,
    gap: 3,
  },
  previewItemMetaText: {
    fontSize: 11,
    color: '#95a5a6',
  },
});
