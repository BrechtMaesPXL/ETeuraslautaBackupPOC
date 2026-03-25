import {PermissionsAndroid, Platform} from 'react-native';
import * as WifiP2p from 'react-native-wifi-p2p';
import StaticServer from 'react-native-static-server';
import RNFS from 'react-native-fs';

import {
  PeerDevice,
  TransferAdapter,
  TransferMetadata,
  TransferProgress,
} from './p2pTransferService';

export class WifiDirectAdapter implements TransferAdapter {
  private initialized = false;

  async discoverPeers(): Promise<PeerDevice[]> {
    if (!WifiP2p || typeof WifiP2p.initialize !== 'function') {
      console.warn('Wi-Fi Direct native module not available (is New Architecture enabled?');
      return [];
    }

    if (Platform.OS !== 'android') {
      return [];
    }

    const hasPermissions = await this.ensurePermissions();
    if (!hasPermissions) {
      console.warn('Wi-Fi Direct permission denied');
      return [];
    }
    await this.ensureInitialized();

    try {
      await WifiP2p.startDiscoveringPeers();
    } catch (error) {
      console.warn('Wi-Fi Direct discoverPeers failed', error);
    }

    try {
      await wait(1200);
      const peers = await WifiP2p.getAvailablePeers();
      const devices = extractDevices(peers);
      return devices.map(device => ({
        id: device.deviceAddress ?? 'unknown',
        name: device.deviceName ?? 'Unknown device',
        platform: 'android',
        appVersion: '0.0.1',
      }));
    } catch (error) {
      console.warn('Wi-Fi Direct getAvailablePeers failed', error);
      return [];
    }
  }

  async sendFile(
    peer: PeerDevice,
    filePath: string,
    metadata: TransferMetadata,
    onProgress?: (progress: TransferProgress) => void,
  ): Promise<void> {
    if (!WifiP2p || typeof WifiP2p.initialize !== 'function') {
      console.warn('Wi-Fi Direct native module not available; cannot send file.');
      if (onProgress) {
        onProgress({bytesTransferred: 0, totalBytes: 0, percent: 0});
      }
      return;
    }

    const hasPermissions = await this.ensurePermissions();
    if (!hasPermissions) {
      console.warn('Wi-Fi Direct permission denied');
      return;
    }
    await this.ensureInitialized();

    try {
      console.log('Checking current Wi-Fi Direct connection status...');
      // Stop discovery first as it can conflict with connection attempts (causes Internal Error code 0)
      await safeRun(WifiP2p.stopDiscoveringPeers());
      await wait(1000);

      let info = await safeRun(WifiP2p.getConnectionInfo());
      
      if (info && info.groupFormed) {
        if (info.isGroupOwner) {
          console.log('Currently connected as Group Owner. Must reset to act as sender (Client). Removing group...');
          await safeRun(WifiP2p.removeGroup());
          await wait(3000); // Give Android framework more time to tear down the interface
          info = null; // Force reconnect
        } else {
          console.log('Already part of a Wi-Fi Direct group as Client. Reusing existing connection.');
        }
      }
      
      if (!info || !info.groupFormed) {
        console.log('Connecting to Wi-Fi Direct peer with groupOwnerIntent 0:', peer.id);
        
        // Clean any lingering connection attempts
        await safeRun(WifiP2p.cancelConnect());
        await wait(1000);

        try {
          await safeRun(WifiP2p.connectWithConfig({ deviceAddress: peer.id, groupOwnerIntent: 0 }));
        } catch (err) {
          console.warn('connectWithConfig failed, falling back to regular connect', err);
          
          try {
            await safeRun(WifiP2p.connect(peer.id));
          } catch (fallbackErr) {
            console.warn('Regular connect also failed, clearing state and retrying...', fallbackErr);
            await safeRun(WifiP2p.cancelConnect());
            await safeRun(WifiP2p.stopDiscoveringPeers());
            await safeRun(WifiP2p.removeGroup());
            await wait(2500); // Wait enough for Android interface reset
            await safeRun(WifiP2p.connect(peer.id));
          }
        }
      }

      // Wait for underlying connection to establish (up to 15 seconds)
      let connected = false;
      for (let i = 0; i < 30; i++) {
        await wait(500);
        try {
          const newInfo = await safeRun(WifiP2p.getConnectionInfo(), 1000);
          if (newInfo && newInfo.groupFormed && newInfo.groupOwnerAddress?.hostAddress) {
            info = newInfo;
            connected = true;
            break;
          }
        } catch (e) {
          // ignore error while polling
        }
      }

      if (!connected) {
        throw new Error('Could not establish Wi-Fi Direct connection or group owner address is missing.');
      }

      console.log('Sending via HTTP instead of native sendFile...');
      
      // Step 1: Copy file to a dedicated serve directory
      const serveDir = `${RNFS.DocumentDirectoryPath}/www`;
      await RNFS.mkdir(serveDir);
      const serveFilePath = `${serveDir}/backup.json`;
      await RNFS.copyFile(filePath, serveFilePath);
      
      // Step 2: Start static server so the other device can download the file
      const server = new StaticServer(8080, serveDir, { localOnly: false });
      const serverUrl = await server.start();
      console.log(`Server running at ${serverUrl}`);

      // Step 3: Tell receiver to fetch the file
      try {
        const payloadStr = JSON.stringify({
          action: 'FETCH_BACKUP',
          url: `http://${info!.groupOwnerAddress!.hostAddress}:8080/backup.json`,
          metadata: metadata
        });
        console.log('Sending message to peer:', payloadStr);
        
        await safeRun(WifiP2p.sendMessage(payloadStr), 5000);

        // Keep server alive long enough for them to download it
        await wait(18000);

      } catch (err) {
        console.error('Failed to command receiver to download file', err);
      } finally {
        console.log('Stopping local static server and tearing down Wi-Fi Direct connection...');
        server.stop();
        await RNFS.unlink(serveFilePath).catch(() => {});
        
        // Teardown the group so subsequent transfers function correctly instead of hanging
        await safeRun(WifiP2p.removeGroup(), 2000);
      }

      if (onProgress) {
        onProgress({bytesTransferred: metadata.sizeBytes, totalBytes: metadata.sizeBytes, percent: 100});
      }
    } catch (err) {
      console.error('Wi-Fi Direct sendFile error', err);
      throw err;
    }
  }

  async receiveFile(
    onReceive: (payloadPath: string, metadata: TransferMetadata) => Promise<void>
  ): Promise<() => void> {
    if (!WifiP2p || typeof WifiP2p.initialize !== 'function') {
      console.warn('Wi-Fi Direct native module not available; cannot receive file.');
      return () => {};
    }

    let isReceiving = true;
    const downloadFolder = 'Downloads'; // Use standard download folder for android
    const fileName = `p2p_backup_${Date.now()}.json`;

    // Start receiving loop
    const startReceiving = async () => {
      while (isReceiving) {
        try {
          const hasPermissions = await this.ensurePermissions();
          if (!hasPermissions) {
            console.warn('Wi-Fi Direct permission denied');
            await wait(5000);
            continue;
          }
          await this.ensureInitialized();
          if (!isReceiving) break;

          // Ensure this device acts as the Group Owner, so it can listen for messages on port 8988
          try {
            const info = await safeRun(WifiP2p.getConnectionInfo());
            if (info && info.groupFormed) {
               if (!info.isGroupOwner) {
                  console.log('Currently connected as Client. Must reset to act as receiver (Group Owner). Removing group...');
                  await safeRun(WifiP2p.removeGroup(), 2000);
                  await wait(1500);
                  await safeRun(WifiP2p.createGroup());
                  console.log('Created Wi-Fi Direct Group. Now waiting as Group Owner...');
               }
            } else {
              await safeRun(WifiP2p.createGroup());
              console.log('Created Wi-Fi Direct Group. Now waiting to be connected to...');
            }
          } catch (e) {
            console.warn('Failed to ensure clean wi-fi direct state', e);
          }

          console.log('Waiting to receive HTTP payload URL via Wi-Fi Direct message...');
          
          // This blocks until a message is received (meta: true so we get the sender's client IP)
          // 30s timeout so we can restart loop and verify connection if stuck
          const received = await safeRun(WifiP2p.receiveMessage({ meta: true }), 30000);
          
          if (received && isReceiving) {
            console.log('Received P2P Message object:', received);
            
            try {
               // extract message and fromAddress depending on library response format
               const messageStr = typeof received === 'object' && (received as any).message ? (received as any).message : String(received);
               const senderIp = typeof received === 'object' && (received as any).fromAddress ? (received as any).fromAddress : null;

               const payload = JSON.parse(messageStr);
               if (payload.action === 'FETCH_BACKUP') {
                  // If Sender is a Client, `info.groupOwnerAddress` in the Sender's payload was actually the Group Owner's IP (us)
                  // We must rewrite the URL using the real Client IP we derived from the message socket connection.
                  let fetchUrl = payload.url as string;
                  if (senderIp) {
                    const cleanSenderIp = senderIp.replace('/', ''); // Android sometimes prepends slash
                    fetchUrl = fetchUrl.replace(/http:\/\/([^\:]+):/, `http://${cleanSenderIp}:`);
                    console.log(`Rewrote fetch URL natively using derived sender IP: ${fetchUrl}`);
                  }

                  console.log('Downloading backup from', fetchUrl);
                  const receivedFilePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
                  
                  const downloadResult = await RNFS.downloadFile({
                    fromUrl: fetchUrl,
                    toFile: receivedFilePath,
                  }).promise;

                  if (downloadResult.statusCode === 200) {
                     console.log('Successfully downloaded backup via HTTP over P2P');
                     await onReceive(receivedFilePath, payload.metadata);
                     
                     // Transfer complete, tear down connection natively so next attempt starts clean
                     await wait(2000);
                     console.log('Clearing receiver P2P group after successful download...');
                     await safeRun(WifiP2p.removeGroup(), 2000);
                  } else {
                     console.error('Download failed with status code:', downloadResult.statusCode);
                  }
               }
            } catch (e) {
               console.error('Failed to parse received P2P message or download file', e);
            }
          }
        } catch (err) {
          console.error('Wi-Fi Direct receiveMessage error', err);
          await wait(3000);
        }
      }
    };

    // Kick off
    startReceiving();

    return () => {
      isReceiving = false;
      WifiP2p.stopReceivingMessage();
      safeRun(WifiP2p.removeGroup(), 2000).catch();
    };
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    if (!WifiP2p || typeof WifiP2p.initialize !== 'function') {
      throw new Error('Wi-Fi Direct native module missing (possibly due to New Architecture).');
    }
    try {
      await WifiP2p.initialize();
      this.initialized = true;
    } catch (error) {
      console.warn('Wi-Fi Direct initialize failed', error);
    }
  }

  private async ensurePermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;

    const fineGranted = await ensurePermission(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    let nearbyGranted = true;
    if (Platform.Version >= 33) {
      const nearby = PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES as any;
      if (nearby) {
        nearbyGranted = await ensurePermission(nearby);
      }
    }

    return fineGranted && nearbyGranted;
  }
}

async function ensurePermission(permission: string): Promise<boolean> {
  const has = await PermissionsAndroid.check(permission as any);
  if (has) return true;
  const result = await PermissionsAndroid.request(permission as any);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

function extractDevices(peers: any): Array<{deviceAddress?: string; deviceName?: string}> {
  if (!peers) return [];
  if (Array.isArray(peers)) return peers;
  if (Array.isArray(peers.devices)) return peers.devices;
  return [];
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function safeRun<T>(promise: Promise<T>, ms = 3000): Promise<T | null> {
  return new Promise(resolve => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        console.warn(`safeRun: Wi-Fi P2P command timed out after ${ms}ms`);
        resolve(null);
      }
    }, ms);

    promise.then(val => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        resolve(val);
      }
    }).catch(err => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        console.warn(`safeRun: Wi-Fi P2P command rejected:`, err);
        resolve(null);
      }
    });
  });
}
