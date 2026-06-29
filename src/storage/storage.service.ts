import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly storagePath: string;

  constructor(private readonly configService: ConfigService) {
    this.storagePath = this.configService.get<string>('storage.path') || './storage';
    this.ensureStorageDirectory();
  }

  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
      await fs.mkdir(path.join(this.storagePath, 'presentations'), { recursive: true });
      await fs.mkdir(path.join(this.storagePath, 'proofs'), { recursive: true });
      this.logger.log(`Storage directory ensured at: ${this.storagePath}`);
    } catch (error) {
      this.logger.error('Failed to create storage directory:', error);
    }
  }

  async saveFile(filename: string, buffer: Buffer): Promise<string> {
    const filepath = path.join(this.storagePath, 'presentations', filename);

    await fs.writeFile(filepath, buffer);

    this.logger.log(`File saved: ${filepath}`);

    return filepath;
  }

  async getFile(filename: string): Promise<Buffer | null> {
    const filepath = path.join(this.storagePath, 'presentations', filename);

    try {
      const buffer = await fs.readFile(filepath);
      return buffer;
    } catch {
      this.logger.warn(`File not found: ${filepath}`);
      return null;
    }
  }

  async deleteFile(filename: string): Promise<boolean> {
    const filepath = path.join(this.storagePath, 'presentations', filename);

    try {
      await fs.unlink(filepath);
      this.logger.log(`File deleted: ${filepath}`);
      return true;
    } catch {
      this.logger.warn(`Failed to delete file: ${filepath}`);
      return false;
    }
  }

  async saveProofImage(
    transactionId: number,
    buffer: Buffer,
    extension: string = 'jpg',
  ): Promise<string> {
    const filename = `proof_${transactionId}.${extension}`;
    const filepath = path.join(this.storagePath, 'proofs', filename);

    await fs.writeFile(filepath, buffer);

    this.logger.log(`Proof image saved: ${filepath}`);

    return filepath;
  }

  async getProofImage(transactionId: number): Promise<Buffer | null> {
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];

    for (const ext of extensions) {
      const filename = `proof_${transactionId}.${ext}`;
      const filepath = path.join(this.storagePath, 'proofs', filename);

      try {
        const buffer = await fs.readFile(filepath);
        return buffer;
      } catch {
        continue;
      }
    }

    return null;
  }

  getFilePath(filename: string): string {
    return path.join(this.storagePath, 'presentations', filename);
  }

  async fileExists(filename: string): Promise<boolean> {
    const filepath = path.join(this.storagePath, 'presentations', filename);

    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileSize(filename: string): Promise<number> {
    const filepath = path.join(this.storagePath, 'presentations', filename);

    try {
      const stats = await fs.stat(filepath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  async cleanOldFiles(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    const presentationsPath = path.join(this.storagePath, 'presentations');
    let deletedCount = 0;

    try {
      const files = await fs.readdir(presentationsPath);
      const now = Date.now();

      for (const file of files) {
        const filepath = path.join(presentationsPath, file);
        const stats = await fs.stat(filepath);

        if (now - stats.mtimeMs > maxAgeMs) {
          await fs.unlink(filepath);
          deletedCount++;
        }
      }

      this.logger.log(`Cleaned ${deletedCount} old files`);
    } catch (error) {
      this.logger.error('Error cleaning old files:', error);
    }

    return deletedCount;
  }
}
