import {
  PeerDevice,
  TransferAdapter,
  TransferMetadata,
  TransferProgress,
} from './p2pTransferService';

export class MockP2PAdapter implements TransferAdapter {
  private mockDevices: PeerDevice[] = [
    {
      id: 'mock-device-1',
      name: 'Test Device 1',
      platform: 'android',
      appVersion: '1.0.0',
    },
    {
      id: 'mock-device-2',
      name: 'Test Device 2',
      platform: 'android',
      appVersion: '1.0.0',
    },
  ];

  async discoverPeers(): Promise<PeerDevice[]> {
    console.log('[MockP2P] Discovering peers...');
    // Simulate discovery delay
    await new Promise<void>(resolve => setTimeout(resolve, 1000));
    return this.mockDevices;
  }

  async sendFile(
    peer: PeerDevice,
    filePath: string,
    metadata: TransferMetadata,
    onProgress?: (progress: TransferProgress) => void,
  ): Promise<void> {
    console.log(`[MockP2P] Sending file to ${peer.name}`);
    console.log(`[MockP2P] File: ${filePath}`);
    console.log(`[MockP2P] Size: ${metadata.sizeBytes} bytes`);

    // Simulate transfer progress
    const totalBytes = metadata.sizeBytes;
    const steps = 10;
    const stepSize = totalBytes / steps;

    for (let i = 0; i <= steps; i++) {
      const bytesTransferred = stepSize * i;
      const percent = (i / steps) * 100;

      if (onProgress) {
        onProgress({
          bytesTransferred,
          totalBytes,
          percent,
          etaMs: (steps - i) * 100,
        });
      }

      // Simulate transfer delay
      await new Promise<void>(resolve => setTimeout(resolve, 200));
    }

    console.log(`[MockP2P] Transfer complete to ${peer.name}`);
  }

  async receiveFile(
    onReceive: (payloadPath: string, metadata: TransferMetadata) => Promise<void>,
  ): Promise<() => void> {
    console.log('[MockP2P] Listening for incoming transfers...');

    // Create a cancel function
    const cancel = () => {
      console.log('[MockP2P] Stopped listening for transfers');
    };

    // Simulate receiving a file after 2 seconds (for testing)
    setTimeout(async () => {
      console.log('[MockP2P] Simulating incoming file...');
      const mockMetadata: TransferMetadata = {
        sourceDeviceId: 'mock-source-device',
        timestamp: new Date().toISOString(),
        dbVersion: 1,
        recordCount: 10,
        checksum: 'mock-checksum-123',
        sizeBytes: 1024,
        payloadType: 'backup-json',
      };

      try {
        await onReceive('/mock/path/to/backup.json', mockMetadata);
        console.log('[MockP2P] Received file processed successfully');
      } catch (error) {
        console.error('[MockP2P] Error processing received file:', error);
      }
    }, 2000);

    return cancel;
  }
}
