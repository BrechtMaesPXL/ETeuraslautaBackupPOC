import RNFS from 'react-native-fs';
import {
  IBackupData,
  IBackupFile,
  IBackupMetadata,
  BackupDestination,
} from '../../interfaces/IDatabaseInterfaces';
import {getRemovableStorageInfo} from '../../infrastructure/removableStorage';

const BACKUP_DIR_NAME = 'backups';

export class BackupService {
  private static instance: BackupService;
  private cachedSDCardDirectory = '';

  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  public getBackupDirectory(): string {
    return this.cachedSDCardDirectory;
  }

  public getInternalBackupDirectory(): string {
    return `${RNFS.DocumentDirectoryPath}/${BACKUP_DIR_NAME}`;
  }

  private async resolveSDCardDirectory(): Promise<string> {
    const info = await getRemovableStorageInfo();
    this.cachedSDCardDirectory = info.path
      ? `${info.path}/${BACKUP_DIR_NAME}`
      : '';
    return this.cachedSDCardDirectory;
  }

  private async dirForDestination(dest: BackupDestination): Promise<string> {
    if (dest === 'sd') {
      return await this.resolveSDCardDirectory();
    }

    return this.getInternalBackupDirectory();
  }

  private async ensureDirExists(dir: string): Promise<void> {
    const exists = await RNFS.exists(dir);
    if (!exists) {
      await RNFS.mkdir(dir);
    }
  }

  public async ensureBackupDirectoryExists(): Promise<void> {
    const dir = await this.resolveSDCardDirectory();
    if (!dir) {
      throw new Error('SD card not available');
    }

    await this.ensureDirExists(dir);
  }

  public async isSDCardAvailable(): Promise<boolean> {
    try {
      return Boolean(await this.resolveSDCardDirectory());
    } catch {
      this.cachedSDCardDirectory = '';
      return false;
    }
  }

  public async exportBackupToDestinations(
    data: IBackupData,
    destinations: BackupDestination[],
  ): Promise<string[]> {
    const filename = this.generateBackupFilename();
    const jsonContent = JSON.stringify(data, null, 2);
    const paths: string[] = [];

    for (const dest of destinations) {
      const dir = await this.dirForDestination(dest);
      if (!dir) {
        throw new Error('SD card not available');
      }

      await this.ensureDirExists(dir);
      const filePath = `${dir}/${filename}`;
      await RNFS.writeFile(filePath, jsonContent, 'utf8');
      paths.push(filePath);
    }

    return paths;
  }

  // Kept for backward compatibility
  public async exportBackup(data: IBackupData): Promise<string> {
    const paths = await this.exportBackupToDestinations(data, ['sd']);
    return paths[0];
  }

  public async listBackups(): Promise<IBackupFile[]> {
    const sdCardDirectory = await this.resolveSDCardDirectory();
    const sources: Array<{dir: string; location: BackupDestination}> = [
      {dir: sdCardDirectory, location: 'sd'},
      {dir: this.getInternalBackupDirectory(), location: 'internal'},
    ];

    const allFiles: IBackupFile[] = [];

    for (const {dir, location} of sources) {
      const dirExists = await RNFS.exists(dir);
      if (!dirExists) {
        continue;
      }

      const files = await RNFS.readDir(dir);
      
      const filePaths: {path: string; name: string; size: number; mtime: Date | undefined}[] = [];
      
      for (const f of files) {
        if (f.isDirectory()) {
          const subFiles = await RNFS.readDir(f.path);
          for (const sub of subFiles) {
            if (!sub.isDirectory() && sub.name.endsWith('.json')) {
              filePaths.push({path: sub.path, name: `${f.name}/${sub.name}`, size: sub.size, mtime: sub.mtime});
            }
          }
        } else if (f.name.endsWith('.json')) {
          filePaths.push({path: f.path, name: f.name, size: f.size, mtime: f.mtime});
        }
      }

      for (const file of filePaths) {
        let metadata: IBackupMetadata | null = null;
        try {
          const content = await RNFS.readFile(file.path, 'utf8');
          const parsed = JSON.parse(content) as IBackupData;
          if (parsed.metadata && parsed.metadata.formatVersion) {
            metadata = parsed.metadata;
          }
        } catch {
          // unparseable file — skip metadata
        }

        allFiles.push({
          filename: file.name,
          path: file.path,
          size: file.size,
          createdAt: file.mtime
            ? file.mtime.toISOString()
            : new Date().toISOString(),
          metadata,
          location,
        });
      }
    }

    allFiles.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return allFiles;
  }

  public async readBackupFromPath(filePath: string): Promise<IBackupData> {
    const content = await RNFS.readFile(filePath, 'utf8');
    const data = JSON.parse(content) as IBackupData;

    if (
      !data.metadata ||
      !data.metadata.formatVersion ||
      !Array.isArray(data.items)
    ) {
      throw new Error('Invalid backup file format');
    }

    return data;
  }

  // Kept for backward compatibility
  public async readBackup(filename: string): Promise<IBackupData> {
    const dir = await this.resolveSDCardDirectory();
    if (!dir) {
      throw new Error('SD card not available');
    }

    return this.readBackupFromPath(
      `${dir}/${filename}`,
    );
  }

  public async deleteBackupFromPath(filePath: string): Promise<boolean> {
    try {
      await RNFS.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Kept for backward compatibility
  public async deleteBackup(filename: string): Promise<boolean> {
    const dir = await this.resolveSDCardDirectory();
    if (!dir) {
      return false;
    }

    return this.deleteBackupFromPath(
      `${dir}/${filename}`,
    );
  }

  private generateBackupFilename(): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    return `backup_${timestamp}.json`;
  }
}
