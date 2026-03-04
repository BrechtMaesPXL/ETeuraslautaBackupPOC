import RNFS from 'react-native-fs';
import {IBackupData} from '../../interfaces/IDatabaseInterfaces';

const MOCK_CLOUD_FILE = 'mock_api_cloud.json';

export class MockApiService {
  private static instance: MockApiService;
  private enabled: boolean = false;

  public static getInstance(): MockApiService {
    if (!MockApiService.instance) {
      MockApiService.instance = new MockApiService();
    }
    return MockApiService.instance;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private getCloudFilePath(): string {
    return `${RNFS.DocumentDirectoryPath}/${MOCK_CLOUD_FILE}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async uploadData(data: IBackupData): Promise<void> {
    if (!this.enabled) {
      throw new Error('API is not available');
    }

    // Simulate network latency (500-1500ms)
    const latency = 500 + Math.random() * 1000;
    await this.delay(latency);

    // Simulate occasional server failures (~10% chance)
    if (Math.random() < 0.1) {
      throw new Error('Mock API: Server error 500');
    }

    const jsonContent = JSON.stringify(data, null, 2);
    await RNFS.writeFile(this.getCloudFilePath(), jsonContent, 'utf8');
  }

  public async getLastUpload(): Promise<IBackupData | null> {
    try {
      const exists = await RNFS.exists(this.getCloudFilePath());
      if (!exists) {
        return null;
      }
      const content = await RNFS.readFile(this.getCloudFilePath(), 'utf8');
      return JSON.parse(content) as IBackupData;
    } catch {
      return null;
    }
  }
}
