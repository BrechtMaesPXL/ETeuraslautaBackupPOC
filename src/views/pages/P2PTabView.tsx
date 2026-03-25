
import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {PeerDevice} from '../../features/p2pTransfer/p2pTransferService';
import {IBackupFile} from '../../interfaces/IDatabaseInterfaces';

export interface P2PTabViewProps {
  isDiscovering: boolean;
  isReceiving: boolean;
  peers: PeerDevice[];
  localBackups: IBackupFile[];
  status: string;
  onDiscover: () => void;
  onReceive: () => void;
  onConnect: (peer: PeerDevice, selectedBackup?: IBackupFile) => void;
  onShareBluetooth?: (selectedBackup?: IBackupFile) => void;
  onImportExternal?: () => void;
}

export const P2PTabView: React.FC<P2PTabViewProps> = ({
  isDiscovering,
  isReceiving,
  peers,
  localBackups,
  status,
  onDiscover,
  onReceive,
  onConnect,
  onShareBluetooth,
  onImportExternal,
}) => {
  const [selectedBackup, setSelectedBackup] = React.useState<IBackupFile | undefined>(undefined);

  const formatDate = (value: string | undefined) => {
    if (!value) return 'Unknown';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Nearby Devices</Text>
          <View style={{flexDirection: 'row', gap: 8}}>
            {onShareBluetooth && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#34495e' }]}
                onPress={() => onShareBluetooth(selectedBackup)}
              >
                <Text style={styles.buttonText}>Share...</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, isReceiving && styles.buttonDisabled, { backgroundColor: '#9b59b6' }]}
              onPress={onReceive}
              disabled={isReceiving}
            >
              <Text style={styles.buttonText}>
                {isReceiving ? 'Waiting...' : 'Receive'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, isDiscovering && styles.buttonDisabled]}
              onPress={onDiscover}
              disabled={isDiscovering}
            >
              <Text style={styles.buttonText}>
                {isDiscovering ? 'Scanning...' : 'Discover'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.statusText}>{status}</Text>
        {peers.length === 0 ? (
          <Text style={styles.emptyText}>
            No peers found. Ensure Bluetooth / Wi-Fi Direct is enabled and both devices run the app.
          </Text>
        ) : (
          peers.map(peer => (
            <View key={peer.id} style={styles.peerRow}>
              <View style={styles.peerInfo}>
                <Text style={styles.peerName}>{peer.name || 'Unnamed device'}</Text>
                <Text style={styles.peerMeta}>
                  {peer.platform.toUpperCase()} • v{peer.appVersion}
                </Text>
                <Text style={styles.peerMeta}>ID: {peer.id}</Text>
              </View>
              <TouchableOpacity style={styles.connectButton} onPress={() => onConnect(peer, selectedBackup)}>
                <Text style={styles.connectText}>Connect</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Local Backups to Send</Text>
          {onImportExternal && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#f39c12' }]}
              onPress={onImportExternal}
            >
              <Text style={styles.buttonText}>Import...</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.statusText}>Select a backup below, or leave unselected to backup current state</Text>
        {localBackups.length === 0 ? (
          <Text style={styles.emptyText}>No backups available on this device yet.</Text>
        ) : (
          localBackups.map(backup => (
            <TouchableOpacity 
              key={backup.path} 
              style={[styles.backupRow, selectedBackup?.path === backup.path && styles.backupRowSelected]}
              onPress={() => setSelectedBackup(selectedBackup?.path === backup.path ? undefined : backup)}
            >
              <View style={styles.backupInfo}>
                <Text style={styles.backupName} numberOfLines={1}>{backup.filename}</Text>
                <Text style={styles.backupMeta}>
                  {formatDate(backup.createdAt)}
                  {backup.metadata ? ` • ${backup.metadata.itemCount} items` : ''}
                </Text>
              </View>
              <Text style={styles.backupSize}>{formatSize(backup.size)}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#3498db',
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyText: {
    color: '#7f8c8d',
    fontSize: 14,
    lineHeight: 20,
  },
  statusText: {
    color: '#95a5a6',
    fontSize: 12,
    marginBottom: 8,
  },
  peerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  peerInfo: {
    flex: 1,
    marginRight: 12,
  },
  peerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  peerMeta: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  connectButton: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  backupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  backupRowSelected: {
    backgroundColor: '#d1f4cd',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  backupInfo: {
    flex: 1,
    marginRight: 12,
  },
  backupName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
  backupMeta: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  backupSize: {
    fontSize: 12,
    color: '#7f8c8d',
  },
});
